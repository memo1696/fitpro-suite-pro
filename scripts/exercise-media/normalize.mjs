#!/usr/bin/env node
/**
 * Convierte el dataset v1 (`wger_ejercicios.json`) al esquema normalizado v2.
 *
 * Qué hace, en orden:
 *
 *  1. DEDUPLICA POR CONTENIDO. Cada imagen referenciada se identifica por el
 *     hash SHA-256 de sus bytes, no por su nombre. Dos archivos idénticos con
 *     nombres distintos colapsan en una sola entrada de `media`. Esto es lo que
 *     convierte 301 archivos en las 8 entradas que realmente son.
 *
 *  2. DETECTA EL ALCANCE REAL. Si un mismo contenido lo comparten varios
 *     ejercicios, no puede ser la demostración de todos: se marca
 *     `scope: "muscleGroup"` para que la UI lo etiquete como referencia y no
 *     como demostración exacta. Sólo un contenido usado por un único ejercicio
 *     se marca `scope: "exercise"`.
 *
 *  3. CONSERVA LA LICENCIA POR ACTIVO. La atribución viaja con el medio, no con
 *     el ejercicio, que es donde tiene sentido: CC-BY-SA obliga a citar autor y
 *     licencia allí donde se muestra la imagen.
 *
 *  4. VALIDA ANTES DE ESCRIBIR. Si el resultado no pasa `validarDataset`, no se
 *     escribe nada y el script sale con código 1.
 *
 * NO borra ni mueve nada. Los archivos originales se quedan donde están; con
 * `--emit-media <dir>` se COPIAN (nunca se mueven) los contenidos únicos a un
 * directorio nuevo con nombres derivados del hash.
 *
 * Uso:
 *   node normalize.mjs --source ../../wger_ejercicios.json --out ../../exercises.v2.json
 *   node normalize.mjs --source-git HEAD          # usa la versión commiteada
 *   node normalize.mjs ... --emit-media ../../media --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SCHEMA_VERSION, MEDIA_KIND, MEDIA_SCOPE, LICENSES,
  normalizarLicencia, slugify, validarDataset
} from './lib/schema.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

const EXT_ANIMADA = new Set(['.gif', '.webm', '.mp4', '.webp']);
const MIME = { '.gif': 'gif', '.jpg': 'jpg', '.jpeg': 'jpg', '.png': 'png', '.webp': 'webp', '.avif': 'avif', '.mp4': 'mp4', '.webm': 'webm' };

function parseArgs(argv) {
  const o = {
    source: path.join(RAIZ, 'wger_ejercicios.json'),
    sourceGit: null,
    media: path.join(RAIZ, 'wger_images'),
    out: path.join(RAIZ, 'exercises.v2.json'),
    emitMedia: null,
    dryRun: false,
    noMedia: false
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--source') o.source = path.resolve(argv[++i]);
    else if (a === '--source-git') o.sourceGit = argv[++i];
    else if (a === '--media') o.media = path.resolve(argv[++i]);
    else if (a === '--out') o.out = path.resolve(argv[++i]);
    else if (a === '--emit-media') o.emitMedia = path.resolve(argv[++i]);
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--no-media') o.noMedia = true;
    else if (a === '--help' || a === '-h') o.help = true;
  }
  return o;
}

/**
 * Parte la descripción en párrafos y detecta si trae la forma estructurada que
 * usan algunos ejercicios de wger ("Preparación:", "Ejecución:", "Regreso:").
 * La biblioteca es de texto, así que esto es lo que decide cómo se maqueta:
 * los estructurados se pintan como pasos numerados y el resto como prosa.
 */
export function estructurarDescripcion(texto) {
  const limpio = String(texto || '').replace(/\r\n/g, '\n').trim();
  if (!limpio) return { parrafos: [], pasos: [], excerpt: '' };

  const parrafos = limpio.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  // Un "paso" es una línea que empieza por una etiqueta seguida de dos puntos.
  //
  // OJO con la avidez: varios ejercicios cierran con un glosario del mismo
  // aspecto ("Agarre ancho: musculatura externa del pecho."). Tomar eso por
  // pasos hacía que "Press de Banca" se renderizara como dos pasos numerados
  // y PERDIERA los cuatro párrafos de técnica. Por eso no basta con encontrar
  // dos líneas etiquetadas: tienen que ser la mayor parte del contenido.
  const pasos = [];
  for (const linea of limpio.split('\n')) {
    const m = linea.match(/^\s*([A-ZÁÉÍÓÚÑ][^:\n]{2,24}):\s*(.+)$/);
    if (m) pasos.push({ etiqueta: m[1].trim(), texto: m[2].trim() });
  }
  const charsEnPasos = pasos.reduce((s, p) => s + p.etiqueta.length + p.texto.length + 2, 0);
  const pasosDominan = pasos.length >= 2 && charsEnPasos >= limpio.length * 0.6;

  // Resumen para la tarjeta: la primera frase útil, sin cortar a media palabra.
  const plano = parrafos[0] || limpio;
  let excerpt = plano.length <= 160 ? plano : plano.slice(0, 160);
  if (excerpt.length < plano.length) {
    excerpt = excerpt.slice(0, excerpt.lastIndexOf(' ')) + '…';
  }

  return { parrafos, pasos: pasosDominan ? pasos : [], excerpt };
}

/** Lee el dataset desde el árbol de trabajo o desde una revisión de git. */
function leerFuente(args) {
  if (args.sourceGit) {
    const rel = path.relative(RAIZ, args.source).replace(/\\/g, '/');
    const txt = execFileSync('git', ['show', `${args.sourceGit}:${rel}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return { datos: JSON.parse(txt), etiqueta: `${args.sourceGit}:${rel}` };
  }
  return { datos: JSON.parse(fs.readFileSync(args.source, 'utf8')), etiqueta: path.relative(RAIZ, args.source) };
}

function normalizar(args) {
  const { datos: v1, etiqueta } = leerFuente(args);
  const avisos = [];

  // ── Paso 1: hashear cada archivo referenciado, una sola vez ──
  const cacheHash = new Map();   // nombreArchivo -> { hash, bytes, ext }
  const leerMeta = (nombre) => {
    if (cacheHash.has(nombre)) return cacheHash.get(nombre);
    const p = path.join(args.media, nombre);
    let meta = null;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      const buf = fs.readFileSync(p);
      meta = { hash: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length, ext: path.extname(nombre).toLowerCase() };
    }
    cacheHash.set(nombre, meta);
    return meta;
  };

  // ── Paso 2: agrupar ejercicios por contenido para deducir el alcance ──
  // Se hace ANTES de construir `media` porque el scope depende de cuántos
  // ejercicios distintos acaban compartiendo el mismo contenido.
  // Con --no-media el mapa queda vacío y el dataset sale sin capa multimedia:
  // la biblioteca es de texto y ningún ejercicio referencia imagen alguna.
  const ejerciciosPorHash = new Map();
  if (!args.noMedia) {
    for (const e of v1) {
      const primera = (e.images || [])[0];
      if (!primera) continue;
      const meta = leerMeta(primera);
      if (!meta) { avisos.push(`Ejercicio ${e.id} (${e.name_es_native}): el archivo "${primera}" no existe en disco; queda sin medio.`); continue; }
      if (!ejerciciosPorHash.has(meta.hash)) ejerciciosPorHash.set(meta.hash, []);
      ejerciciosPorHash.get(meta.hash).push(e);
    }
  }

  // ── Paso 3: construir el diccionario de medios ──
  const media = {};
  const assetIdPorHash = new Map();
  for (const [hash, ejs] of ejerciciosPorHash) {
    const assetId = hash.slice(0, 16);            // 16 hex = colisión despreciable a esta escala
    assetIdPorHash.set(hash, assetId);

    const nombre = (ejs[0].images || [])[0];
    const meta = leerMeta(nombre);
    const kind = EXT_ANIMADA.has(meta.ext) && meta.ext === '.gif' ? MEDIA_KIND.ANIMATION : MEDIA_KIND.STILL;

    // La licencia viaja con el activo. Se toma del primer ejercicio que lo usa,
    // pero se avisa si los ejercicios que lo comparten declaran licencias
    // distintas: significaría que la procedencia está mal registrada.
    const licencias = new Set(ejs.map(e => normalizarLicencia(e.license_short)).filter(Boolean));
    if (licencias.size > 1) {
      avisos.push(`El medio ${assetId} lo comparten ejercicios con licencias distintas (${[...licencias].join(', ')}); se usa la del primero.`);
    }
    const licId = normalizarLicencia(ejs[0].license_short) || 'proprietary';
    if (!normalizarLicencia(ejs[0].license_short)) {
      avisos.push(`Licencia no reconocida "${ejs[0].license_short}" en el medio ${assetId}; se marca como 'proprietary'. Verifica la procedencia.`);
    }

    media[assetId] = {
      id: assetId,
      contentHash: hash,
      kind,
      // Un contenido usado por más de un ejercicio no puede ser la demostración
      // de todos ellos: se degrada a referencia de grupo muscular.
      scope: ejs.length === 1 ? MEDIA_SCOPE.EXERCISE : MEDIA_SCOPE.MUSCLE_GROUP,
      sharedBy: ejs.length,
      variants: [{
        format: MIME[meta.ext] || meta.ext.replace('.', ''),
        path: `wger_images/${nombre}`,
        bytes: meta.bytes
      }],
      source: { origin: 'wger.de', originalFilename: nombre },
      license: {
        id: licId,
        holder: ejs[0].license_author || null,
        attributionRequired: LICENSES[licId]?.attributionRequired ?? false
      }
    };
  }

  // ── Paso 4: ejercicios ──
  const slugsUsados = new Map();
  const exercises = v1.map(e => {
    let slug = slugify(e.name_es_native || e.name_en);
    if (slugsUsados.has(slug)) {                  // desempate estable por id
      const n = slugsUsados.get(slug) + 1;
      slugsUsados.set(slug, n);
      slug = `${slug}-${e.id}`;
    } else {
      slugsUsados.set(slug, 1);
    }

    const primera = args.noMedia ? null : (e.images || [])[0];
    const meta = primera ? leerMeta(primera) : null;
    const assetId = meta ? assetIdPorHash.get(meta.hash) : null;

    const desc = estructurarDescripcion(e.description_es_native);
    if (!desc.parrafos.length) {
      avisos.push(`Ejercicio ${e.id} (${e.name_es_native}) no tiene descripción; en una biblioteca de texto queda vacío.`);
    }

    return {
      id: e.id,
      slug,
      name: { es: e.name_es_native || e.name_en, en: e.name_en || null },
      // La descripción es el contenido principal de la biblioteca, así que se
      // guarda ya troceada: la tarjeta usa `excerpt` y el detalle `parrafos`
      // o `pasos`. Trocear aquí evita repetir el parseo en cada render.
      description: {
        es: e.description_es_native || null,
        parrafos: desc.parrafos,
        pasos: desc.pasos,
        excerpt: desc.excerpt,
        caracteres: (e.description_es_native || '').length
      },
      taxonomy: {
        category: e.category || null,
        muscleGroup: e.grupo_muscular || null,
        musclesPrimary: e.muscles || [],
        musclesSecondary: e.muscles_secondary || [],
        equipment: e.equipment || []
      },
      risk: e.riesgo || 'Bajo',
      mediaId: assetId,
      mediaScope: assetId ? media[assetId].scope : null
    };
  });

  const dataset = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: etiqueta,
    media,
    exercises
  };

  return { dataset, avisos };
}

// ══ Ejecución ══
const args = parseArgs(process.argv);
if (args.help) {
  console.log(`Uso: node normalize.mjs [opciones]

  --source <ruta>       dataset v1 de entrada        (por defecto wger_ejercicios.json)
  --source-git <rev>    léelo de una revisión de git (p. ej. HEAD) en vez del disco
  --media <dir>         directorio de imágenes       (por defecto wger_images)
  --out <ruta>          dataset v2 de salida         (por defecto exercises.v2.json)
  --emit-media <dir>    COPIA los contenidos únicos a <dir> con nombre por hash
  --dry-run             no escribe nada, sólo informa`);
  process.exit(0);
}

const { dataset, avisos } = normalizar(args);

const problemas = validarDataset(dataset);
// Los huérfanos aquí son informativos: el dataset v1 puede referenciar menos
// archivos de los que hay en disco, y eso no invalida el resultado.
const bloqueantes = problemas.filter(p => !p.includes('(huérfano)'));

const nMedios = Object.keys(dataset.media).length;
const propios = dataset.exercises.filter(e => e.mediaScope === MEDIA_SCOPE.EXERCISE).length;
const referencia = dataset.exercises.filter(e => e.mediaScope === MEDIA_SCOPE.MUSCLE_GROUP).length;
const sinMedio = dataset.exercises.filter(e => !e.mediaId).length;

console.log('══ NORMALIZACIÓN v1 → v2 ═════════════════════════════════════════');
console.log(`fuente: ${dataset.source}`);
console.log();
console.log(`Ejercicios ...................... ${dataset.exercises.length}`);
console.log(`Medios únicos (deduplicados) .... ${nMedios}`);
console.log();
console.log(`  con demostración propia ....... ${propios}`);
console.log(`  con referencia de grupo ....... ${referencia}`);
console.log(`  sin medio ..................... ${sinMedio}`);

if (avisos.length) {
  console.log();
  console.log(`── Avisos (${avisos.length}) ─────────────────────────────────────`);
  avisos.slice(0, 12).forEach(a => console.log('  • ' + a));
  if (avisos.length > 12) console.log(`  … y ${avisos.length - 12} más`);
}

if (bloqueantes.length) {
  console.log();
  console.error(`✗ El dataset no pasa la validación (${bloqueantes.length} problemas):`);
  bloqueantes.slice(0, 10).forEach(p => console.error('  ' + p));
  process.exit(1);
}

if (args.dryRun) {
  console.log();
  console.log('--dry-run: no se escribió nada.');
  process.exit(0);
}

fs.writeFileSync(args.out, JSON.stringify(dataset, null, 2), 'utf8');
console.log();
console.log(`✓ Escrito ${path.relative(RAIZ, args.out)} (${(fs.statSync(args.out).size / 1024).toFixed(0)} KB)`);

if (args.emitMedia) {
  fs.mkdirSync(args.emitMedia, { recursive: true });
  let copiados = 0, bytes = 0;
  for (const asset of Object.values(dataset.media)) {
    const v = asset.variants[0];
    const origen = path.join(RAIZ, v.path);
    const destino = path.join(args.emitMedia, `${asset.id}.${v.format}`);
    if (!fs.existsSync(destino)) {
      fs.copyFileSync(origen, destino);     // copia, nunca mueve: el original queda intacto
      copiados++; bytes += v.bytes;
    }
  }
  console.log(`✓ Copiados ${copiados} archivos únicos a ${path.relative(RAIZ, args.emitMedia)} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
  console.log('  Los originales NO se han tocado. Bórralos tú cuando hayas verificado el resultado.');
}
console.log('══════════════════════════════════════════════════════════════════');
