#!/usr/bin/env node
/**
 * Auditoría de la capa de medios de la biblioteca de ejercicios.
 *
 * No modifica nada: sólo mide. Cruza el dataset contra el directorio de
 * imágenes y responde a cuatro preguntas que el formato v1 no permitía hacer:
 *
 *   1. ¿Cuántos archivos son en realidad el MISMO contenido con otro nombre?
 *   2. ¿Cuántos archivos en disco no los usa ningún ejercicio? (huérfanos)
 *   3. ¿Cuántas referencias apuntan a un archivo que no existe? (rotas)
 *   4. ¿Cuántos VISUALES DISTINTOS ve realmente el usuario? — la métrica que
 *      importa, y la que destapó que 250 ejercicios compartían 8 imágenes.
 *
 * Uso:
 *   node audit.mjs                        # audita el dataset del working copy
 *   node audit.mjs --dataset ../../wger_ejercicios.json --media ../../wger_images
 *   node audit.mjs --json                 # salida legible por máquina
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

function parseArgs(argv) {
  const o = { dataset: path.join(RAIZ, 'wger_ejercicios.json'), media: path.join(RAIZ, 'wger_images'), json: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dataset') o.dataset = path.resolve(argv[++i]);
    else if (argv[i] === '--media') o.media = path.resolve(argv[++i]);
    else if (argv[i] === '--json') o.json = true;
    else if (argv[i] === '--help' || argv[i] === '-h') { o.help = true; }
  }
  return o;
}

const hashArchivo = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const mb = (b) => (b / 1024 / 1024).toFixed(1);

function auditar({ dataset: rutaDataset, media: dirMedia }) {
  const ejercicios = JSON.parse(fs.readFileSync(rutaDataset, 'utf8'));
  const enDisco = fs.readdirSync(dirMedia).filter(f => !f.startsWith('.'));

  // Hash de cada archivo del disco (una sola lectura por archivo).
  const hashPorArchivo = new Map();
  const bytesPorArchivo = new Map();
  for (const f of enDisco) {
    const p = path.join(dirMedia, f);
    if (!fs.statSync(p).isFile()) continue;
    hashPorArchivo.set(f, hashArchivo(p));
    bytesPorArchivo.set(f, fs.statSync(p).size);
  }

  // Referencias del dataset -> archivo
  const refs = new Map();          // archivo -> [ids de ejercicio]
  let sinImagen = 0;
  for (const e of ejercicios) {
    const imgs = e.images || [];
    if (imgs.length === 0) sinImagen++;
    for (const f of imgs) {
      if (!refs.has(f)) refs.set(f, []);
      refs.get(f).push(e.id);
    }
  }

  const referenciados = new Set(refs.keys());
  const rotas = [...referenciados].filter(f => !hashPorArchivo.has(f));
  const huerfanos = [...hashPorArchivo.keys()].filter(f => !referenciados.has(f));

  // Duplicación en disco
  const porHash = new Map();       // hash -> [archivos]
  for (const [f, h] of hashPorArchivo) {
    if (!porHash.has(h)) porHash.set(h, []);
    porHash.get(h).push(f);
  }
  const gruposDuplicados = [...porHash.values()].filter(g => g.length > 1).sort((a, b) => b.length - a.length);

  const bytesTotales = [...bytesPorArchivo.values()].reduce((s, b) => s + b, 0);
  const bytesUnicos = [...porHash.values()].reduce((s, g) => s + (bytesPorArchivo.get(g[0]) || 0), 0);

  // La métrica clave: visuales distintos que llegan al usuario.
  const hashPorEjercicio = new Map();   // hash -> [ejercicios]
  for (const e of ejercicios) {
    const primera = (e.images || [])[0];
    if (!primera) continue;
    const h = hashPorArchivo.get(primera);
    if (!h) continue;                    // referencia rota, ya contabilizada
    if (!hashPorEjercicio.has(h)) hashPorEjercicio.set(h, []);
    hashPorEjercicio.get(h).push(e);
  }
  const compartidos = [...hashPorEjercicio.entries()]
    .map(([h, ejs]) => ({
      hash: h,
      archivoEjemplo: porHash.get(h)[0],
      nEjercicios: ejs.length,
      gruposMusculares: [...new Set(ejs.map(e => e.grupo_muscular || e.category).filter(Boolean))]
    }))
    .sort((a, b) => b.nEjercicios - a.nEjercicios);

  return {
    dataset: path.relative(RAIZ, rutaDataset),
    mediaDir: path.relative(RAIZ, dirMedia),
    ejercicios: ejercicios.length,
    sinImagen,
    archivos: { enDisco: hashPorArchivo.size, referenciados: referenciados.size, huerfanos: huerfanos.length, rotas: rotas.length },
    contenidoUnico: porHash.size,
    visualesDistintos: hashPorEjercicio.size,
    ejerciciosConVisualExclusivo: compartidos.filter(c => c.nEjercicios === 1).length,
    peso: { totalMB: +mb(bytesTotales), unicoMB: +mb(bytesUnicos), desperdicioMB: +mb(bytesTotales - bytesUnicos),
            desperdicioPct: bytesTotales ? Math.round((bytesTotales - bytesUnicos) * 100 / bytesTotales) : 0 },
    topCompartidos: compartidos.filter(c => c.nEjercicios > 1).slice(0, 10),
    topDuplicadosEnDisco: gruposDuplicados.slice(0, 10).map(g => ({ copias: g.length, ejemplo: g[0], bytes: bytesPorArchivo.get(g[0]) })),
    listaHuerfanos: huerfanos,
    listaRotas: rotas
  };
}

function imprimir(r) {
  const L = (s = '') => console.log(s);
  L('══ AUDITORÍA DE MEDIOS ═══════════════════════════════════════════');
  L(`dataset: ${r.dataset}`);
  L(`medios:  ${r.mediaDir}`);
  L();
  L(`Ejercicios ................. ${r.ejercicios}${r.sinImagen ? `  (${r.sinImagen} sin imagen)` : ''}`);
  L(`Archivos en disco .......... ${r.archivos.enDisco}`);
  L(`  referenciados ............ ${r.archivos.referenciados}`);
  L(`  HUÉRFANOS ................ ${r.archivos.huerfanos}`);
  L(`  referencias ROTAS ........ ${r.archivos.rotas}`);
  L(`Contenidos únicos .......... ${r.contenidoUnico}`);
  L();
  L(`▸ VISUALES DISTINTOS ....... ${r.visualesDistintos}   (lo que el usuario percibe como imágenes diferentes)`);
  L(`▸ con visual exclusivo ..... ${r.ejerciciosConVisualExclusivo} de ${r.ejercicios} ejercicios`);
  L();
  L(`Peso total ................. ${r.peso.totalMB} MB`);
  L(`  contenido único .......... ${r.peso.unicoMB} MB`);
  L(`  DESPERDICIO .............. ${r.peso.desperdicioMB} MB (${r.peso.desperdicioPct} %)`);

  if (r.topCompartidos.length) {
    L();
    L('── Un mismo visual usado por varios ejercicios ───────────────────');
    for (const c of r.topCompartidos) {
      L(`  ${String(c.nEjercicios).padStart(3)} ejercicios → ${c.archivoEjemplo}`);
      if (c.gruposMusculares.length > 1) {
        L(`      ⚠ mezcla grupos musculares distintos: ${c.gruposMusculares.join(', ')}`);
      }
    }
  }

  if (r.topDuplicadosEnDisco.length) {
    L();
    L('── Archivos byte a byte idénticos con distinto nombre ────────────');
    for (const d of r.topDuplicadosEnDisco) {
      L(`  ${String(d.copias).padStart(3)} copias de ${Math.round(d.bytes / 1024)} KB → ${d.ejemplo}`);
    }
  }

  L();
  const problemas = r.archivos.rotas + (r.ejercicios - r.ejerciciosConVisualExclusivo);
  if (r.archivos.rotas) L(`✗ Hay ${r.archivos.rotas} referencias rotas.`);
  if (r.archivos.huerfanos) L(`• ${r.archivos.huerfanos} archivos huérfanos ocupan espacio sin usarse.`);
  if (r.ejerciciosConVisualExclusivo < r.ejercicios) {
    L(`✗ ${r.ejercicios - r.ejerciciosConVisualExclusivo} ejercicios NO tienen un visual propio.`);
  }
  if (!problemas && !r.archivos.huerfanos) L('✓ Sin duplicación, huérfanos ni referencias rotas.');
  L('══════════════════════════════════════════════════════════════════');
}

const args = parseArgs(process.argv);
if (args.help) {
  console.log('Uso: node audit.mjs [--dataset <ruta.json>] [--media <dir>] [--json]');
  process.exit(0);
}
for (const [k, v] of [['dataset', args.dataset], ['media', args.media]]) {
  if (!fs.existsSync(v)) { console.error(`No existe el ${k}: ${v}`); process.exit(1); }
}
const resultado = auditar(args);
if (args.json) console.log(JSON.stringify(resultado, null, 2));
else imprimir(resultado);
