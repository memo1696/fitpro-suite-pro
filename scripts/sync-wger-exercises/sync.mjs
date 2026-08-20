#!/usr/bin/env node
/**
 * sync-wger-exercises
 * ─────────────────────────────────────────────────────────────────────────
 * Descarga el catálogo de ejercicios de wger.de (API pública, datos e
 * imágenes bajo licencia CC-BY-SA) y sube las imágenes a un bucket de
 * Supabase Storage, generando un manifest.json que "Nuevo APP" puede
 * consumir desde ejercicios_repo.js.
 *
 * IMPORTANTE — por qué corre así:
 *  - wger.de bloquea /api/v2 en su robots.txt para crawlers/bots
 *    automatizados de indexación, pero su API es pública y está pensada
 *    para integraciones de terceros (así lo dice su propia documentación).
 *    Este script hace peticiones normales de un cliente HTTP, no un
 *    crawler que indexa contenido — el mismo uso que haría cualquier app
 *    que consuma su REST API.
 *  - Este script se ejecuta con Node normal (fetch nativo, Node >= 18),
 *    no necesita nada especial más que las dependencias de package.json.
 *
 * MODO INSPECCIÓN (recomendado correr primero):
 *   npm run inspect
 *   → Trae 1 ejercicio de muestra y lo imprime tal cual, sin subir nada.
 *     Sirve para confirmar que la forma del JSON coincide con lo que
 *     este script espera, ya que no fue posible probarlo contra la API
 *     en vivo desde el entorno donde se escribió.
 *
 * MODO SINCRONIZACIÓN COMPLETA:
 *   npm run sync
 *   → Recorre todo el catálogo (o hasta WGER_LIMIT), sube imágenes a
 *     Supabase Storage y escribe manifest.json en este mismo directorio
 *     Y en la raíz del bucket.
 *
 * Es re-ejecutable de forma segura: usa upsert, así que correrlo de nuevo
 * no duplica nada, solo actualiza lo que cambió.
 */

import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// NOTA: este script NO usa @supabase/supabase-js para Storage — esa
// librería (concretamente @supabase/storage-js) tiene un bug conocido
// verificando ciertas claves de servicio y truena con "Failed to
// base64url decode the signature" sin importar cuál clave se use. En vez
// de pelear con eso, hablamos directo con la API REST de Storage de
// Supabase (documentada y estable) usando fetch nativo.

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuración ───────────────────────────────────────────────────────
const WGER_BASE = 'https://wger.de/api/v2';
const PAGE_SIZE = 50;
const REQUEST_DELAY_MS = 200; // ser buenos ciudadanos con la API pública
const MAX_RETRIES = 3;

// .trim() por si al copiar/pegar en el .env quedó un espacio, salto de
// línea o comilla de más — es una causa muy común de errores de "firma
// inválida" que no tienen nada que ver con la clave en sí.
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const BUCKET = process.env.SUPABASE_BUCKET || 'exercise-media';
const LANG_PREFERRED = (process.env.WGER_LANGUAGE_CODE || 'es').toLowerCase();
const LANG_FALLBACK = (process.env.WGER_LANGUAGE_FALLBACK_CODE || 'en').toLowerCase();
const LIMIT = process.env.WGER_LIMIT ? parseInt(process.env.WGER_LIMIT, 10) : null;

const INSPECT_MODE = process.argv.includes('--inspect');

// ── Diagnóstico de la clave ANTES de tocar la red ───────────────────────
// El error "Failed to base64url decode the signature" / 403 AccessDenied
// que da Supabase Storage casi siempre significa que la clave que se envió
// no es la que el servidor de Storage sabe verificar todavía. Lo
// detectamos aquí, de forma local, para dar un mensaje claro en vez de
// ese error críptico.
function diagnoseKey(key) {
  if (!key) return { ok: false, reason: 'vacía' };
  if (key.startsWith('sb_secret_')) {
    // Con la librería @supabase/storage-js este formato fallaba, pero
    // este script ya no la usa (habla directo con la API REST), así que
    // la clave "secret" nueva debería funcionar bien.
    return { ok: true, reason: 'Clave "secret" (formato nuevo) ✓' };
  }
  if (key.startsWith('sb_publishable_')) {
    return {
      ok: false,
      reason:
        'Esta es la clave PÚBLICA/anon (sb_publishable_...), no sirve para este ' +
        'script porque no tiene permiso para crear buckets ni subir archivos. ' +
        'Necesitas la "service_role" (o su equivalente "secret"), nunca la publishable.',
    };
  }
  if (key.startsWith('eyJ')) {
    // JWT legacy: 3 segmentos separados por punto, cada uno base64url.
    const parts = key.split('.');
    if (parts.length !== 3) {
      return {
        ok: false,
        reason:
          `Parece una clave JWT antigua pero tiene ${parts.length} segmentos en vez ` +
          'de 3 (separados por ".") — probablemente se cortó o se pegó incompleta ' +
          'al copiarla al .env. Vuelve a copiarla completa desde el dashboard.',
      };
    }
    // Buscamos el primer carácter inválido en cualquiera de los 3
    // segmentos y decimos EXACTAMENTE dónde está, para que sea fácil
    // encontrarlo a simple vista en el .env.
    const segmentNames = ['primero (encabezado)', 'segundo (contenido)', 'tercero (firma)'];
    for (let i = 0; i < 3; i++) {
      const segment = parts[i];
      const badCharIndex = [...segment].findIndex((c) => !/[A-Za-z0-9_-]/.test(c));
      if (badCharIndex !== -1) {
        const badChar = segment[badCharIndex];
        const code = badChar.codePointAt(0);
        const context = segment.slice(
          Math.max(0, badCharIndex - 6),
          badCharIndex + 7
        );
        return {
          ok: false,
          reason:
            `El segmento ${segmentNames[i]} de la clave tiene un carácter inválido ` +
            `en la posición ${badCharIndex + 1}: "${badChar}" (código Unicode U+${code
              .toString(16)
              .toUpperCase()
              .padStart(4, '0')}). Contexto en tu .env: "...${context}...". ` +
            'Muy probablemente al copiar/pegar algún editor cambió un guión o comilla ' +
            'por su versión "elegante" (– en vez de -, " en vez de \'). Vuelve a copiar ' +
            'la clave con el botón de copiar del dashboard de Supabase y pégala en un ' +
            'Bloc de notas simple (no Word), sin corrector ortográfico ni autoformato.',
        };
      }
    }
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (payload.role !== 'service_role') {
        return {
          ok: false,
          reason:
            `Esta clave JWT es válida, pero su rol es "${payload.role}", no ` +
            '"service_role". Copia específicamente la clave service_role, no la anon.',
        };
      }
      // Cruce clave <-> proyecto: el "ref" del JWT debe coincidir con el
      // subdominio de SUPABASE_URL. Si no coincide, la clave es de OTRO
      // proyecto de Supabase y por eso el servidor la rechaza.
      const urlRef = SUPABASE_URL.replace('https://', '').split('.')[0];
      if (payload.ref && payload.ref !== urlRef) {
        return {
          ok: false,
          reason:
            `La clave es del proyecto "${payload.ref}", pero SUPABASE_URL apunta a ` +
            `"${urlRef}". Son proyectos distintos de Supabase — la clave de uno no ` +
            'sirve para el otro. Corrige SUPABASE_URL o usa la clave del proyecto correcto.',
        };
      }
      return {
        ok: true,
        reason: `JWT válido, rol "${payload.role}", proyecto "${payload.ref || urlRef}" ✓`,
      };
    } catch (e) {
      return {
        ok: false,
        reason:
          'Parece una clave JWT pero no se pudo decodificar su contenido ' +
          `(${e.message}). Es probable que se haya pegado con algún carácter de más.`,
      };
    }
  }
  return {
    ok: false,
    reason:
      'Este valor no tiene la forma de ninguna clave de Supabase conocida ' +
      '(ni "eyJ..." ni "sb_secret_..."). Revisa que copiaste el valor completo, ' +
      'sin comillas ni espacios extra, en SUPABASE_SERVICE_ROLE_KEY dentro del .env.',
  };
}

if (!INSPECT_MODE) {
  console.log(`→ SUPABASE_URL: ${SUPABASE_URL || '(vacío)'}`);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      '❌ Falta SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.\n' +
        '   Copia .env.example a .env en esta carpeta y complétalo.\n' +
        '   (En modo --inspect no hacen falta, si solo quieres ver la forma de los datos.)'
    );
    process.exit(1);
  }
  const diagnosis = diagnoseKey(SUPABASE_SERVICE_ROLE_KEY);
  if (!diagnosis.ok) {
    console.error(`❌ Problema con SUPABASE_SERVICE_ROLE_KEY: ${diagnosis.reason}`);
    process.exit(1);
  }
  console.log(`✓ Clave de Supabase: ${diagnosis.reason}`);
}

// ── Cliente REST propio para Supabase Storage (sin @supabase/supabase-js) ─
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1`;

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

async function supabaseRequest(pathname, options = {}) {
  const res = await fetch(`${STORAGE_BASE}${pathname}`, {
    ...options,
    headers: supabaseHeaders(options.headers),
  });
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      (body && (body.message || body.error || body.msg)) ||
      (typeof body === 'string' ? body : JSON.stringify(body));
    throw new Error(`Supabase Storage ${res.status} en ${pathname}: ${msg}`);
  }
  return body;
}

// ── Utilidades HTTP ─────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function wgerFetch(urlOrPath, { retries = MAX_RETRIES } = {}) {
  const url = urlOrPath.startsWith('http') ? urlOrPath : `${WGER_BASE}${urlOrPath}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          // Identificarnos honestamente; wger pide esto de buena práctica
          // para integraciones de terceros.
          'User-Agent': 'NuevoAPP-Gym-Sync/1.0 (+https://github.com/) contacto vía app',
        },
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status} en ${url}`);
      }
      if (!res.ok) {
        console.warn(`  ⚠️  ${res.status} al pedir ${url}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) {
        console.warn(`  ⚠️  Falló ${url} tras ${retries} intentos: ${err.message}`);
        return null;
      }
      const backoff = 500 * attempt;
      console.warn(`  ↻ reintentando (${attempt}/${retries}) ${url} en ${backoff}ms...`);
      await sleep(backoff);
    }
  }
  return null;
}

async function fetchBinary(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url}: HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

function extFromContentType(ct) {
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('gif')) return 'gif';
  return 'bin';
}

// ── Paso 1: resolver IDs de idioma a partir del código (es/en/...) ──────
async function resolveLanguageIds() {
  const data = await wgerFetch('/language/?format=json&limit=100');
  const results = data?.results || [];
  if (!results.length) {
    console.warn('  ⚠️  No se pudo leer /language/, se usará "sin filtro de idioma".');
    return { preferredId: null, fallbackId: null, all: [] };
  }
  const findByCode = (code) =>
    results.find(
      (l) =>
        (l.short_name || l.code || l.iso_639_1 || '').toLowerCase() === code ||
        (l.name || '').toLowerCase().startsWith(code)
    );
  const preferred = findByCode(LANG_PREFERRED);
  const fallback = findByCode(LANG_FALLBACK);
  return {
    preferredId: preferred?.id ?? null,
    fallbackId: fallback?.id ?? null,
    all: results,
  };
}

// ── Paso 2: resolver licencias (id -> nombre/short_name/url) ────────────
async function resolveLicenses() {
  const data = await wgerFetch('/license/?format=json&limit=100');
  const map = new Map();
  for (const lic of data?.results || []) {
    map.set(lic.id, {
      name: lic.full_name || lic.short_name || `Licencia #${lic.id}`,
      shortName: lic.short_name || '',
      url: lic.url || '',
    });
  }
  return map;
}

// ── Paso 3: traer todos los ejercicios (paginado) ───────────────────────
async function fetchAllExercises() {
  const all = [];
  let offset = 0;
  while (true) {
    const data = await wgerFetch(
      `/exerciseinfo/?format=json&limit=${PAGE_SIZE}&offset=${offset}`
    );
    if (!data) break;
    const batch = data.results || [];
    all.push(...batch);
    process.stdout.write(`  ...${all.length} ejercicios traídos\r`);
    if (LIMIT && all.length >= LIMIT) return all.slice(0, LIMIT);
    if (!data.next || batch.length === 0) break;
    offset += PAGE_SIZE;
    await sleep(REQUEST_DELAY_MS);
  }
  console.log(`  ✓ ${all.length} ejercicios en total`);
  return all;
}

// ── Elegir la mejor traducción disponible (es -> en -> primera que haya) ─
function pickTranslation(exercise, langIds) {
  const translations = exercise.translations || [];
  const byLang = (id) => translations.find((t) => t.language === id && t.name);
  return (
    (langIds.preferredId && byLang(langIds.preferredId)) ||
    (langIds.fallbackId && byLang(langIds.fallbackId)) ||
    translations.find((t) => t.name) ||
    null
  );
}

// ── Elegir la imagen principal ───────────────────────────────────────────
function pickMainImage(exercise) {
  const images = exercise.images || [];
  return images.find((img) => img.is_main) || images[0] || null;
}

// ── Intentar obtener miniatura pre-generada; si falla, usar la imagen ───
//    completa como miniatura (mejor eso que romper la corrida).
async function resolveThumbnailUrl(image) {
  if (!image) return null;
  const data = await wgerFetch(`/exerciseimage/${image.id}/thumbnails/`);
  if (data && typeof data === 'object') {
    // La forma exacta no se pudo confirmar sin acceso en vivo a la API;
    // buscamos cualquier valor que parezca URL y prioricemos claves que
    // suenen a "pequeño".
    const preferredKeys = ['thumbnail', 'small', 'medium', '180', '128'];
    for (const key of preferredKeys) {
      const hit = Object.entries(data).find(([k]) => k.toLowerCase().includes(key));
      if (hit && typeof hit[1] === 'string' && hit[1].startsWith('http')) {
        return hit[1];
      }
    }
    const anyUrl = Object.values(data).find(
      (v) => typeof v === 'string' && v.startsWith('http')
    );
    if (anyUrl) return anyUrl;
  }
  return image.image || null; // fallback: la imagen completa
}

function buildAttribution(exercise, image, translation, licenseMap) {
  // Formato TASL (Título - Autor - Fuente - Licencia) que exige wger.
  // OJO: /exerciseinfo/ devuelve exercise.license como OBJETO completo
  // {id, full_name, short_name, url} (por el "depth=1" del serializer),
  // mientras que image.license suele venir como número (ID) porque las
  // imágenes no heredan ese "depth". Aceptamos ambas formas.
  const rawLicense = image?.license ?? exercise.license;
  const license =
    rawLicense && typeof rawLicense === 'object'
      ? {
          name: rawLicense.full_name || rawLicense.short_name || `Licencia #${rawLicense.id}`,
          shortName: rawLicense.short_name || '',
          url: rawLicense.url || '',
        }
      : licenseMap.get(rawLicense);
  const title = image?.license_title || translation?.name || 'Ejercicio wger';
  const author = image?.license_author || exercise.license_author || 'wger.de';
  const sourceUrl =
    image?.license_object_url || `https://wger.de/es/exercise/${exercise.id}/view/`;
  return {
    title,
    author,
    sourceUrl,
    licenseName: license?.name || 'Creative Commons (ver wger.de)',
    licenseUrl: license?.url || 'https://wger.de/en/software/license',
    text: `"${title}" por ${author}, vía wger.de — ${license?.name || 'CC-BY-SA'} (${sourceUrl})`,
  };
}

// ── Subir un archivo a Supabase Storage (upsert), vía REST directo ──────
async function uploadToStorage(storagePath, buffer, contentType) {
  await supabaseRequest(`/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

async function ensureBucket() {
  const buckets = await supabaseRequest('/bucket', { method: 'GET' });
  const exists = Array.isArray(buckets) && buckets.some((b) => b.name === BUCKET || b.id === BUCKET);
  if (!exists) {
    console.log(`  Creando bucket público "${BUCKET}"...`);
    await supabaseRequest('/bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: BUCKET,
        name: BUCKET,
        public: true,
        file_size_limit: 10 * 1024 * 1024, // 10 MB
      }),
    });
  } else {
    console.log(`  Bucket "${BUCKET}" ya existe.`);
  }
}

// ── Modo inspección: solo mirar la forma real de los datos ─────────────
async function runInspect() {
  console.log('🔍 Modo inspección — no se sube nada a Supabase.\n');
  console.log('→ /language/');
  console.log(JSON.stringify(await wgerFetch('/language/?format=json&limit=5'), null, 2));

  console.log('\n→ /license/');
  console.log(JSON.stringify(await wgerFetch('/license/?format=json&limit=5'), null, 2));

  console.log('\n→ /exerciseinfo/ (1 resultado)');
  const sample = await wgerFetch('/exerciseinfo/?format=json&limit=1');
  console.log(JSON.stringify(sample, null, 2));

  const firstImage = sample?.results?.[0]?.images?.[0];
  if (firstImage) {
    console.log(`\n→ /exerciseimage/${firstImage.id}/thumbnails/`);
    console.log(
      JSON.stringify(await wgerFetch(`/exerciseimage/${firstImage.id}/thumbnails/`), null, 2)
    );
  }

  console.log(
    '\n📋 Copia esta salida y compártela para ajustar el script si algo no coincide ' +
      'con lo que se esperaba (nombres de campos, formas de "thumbnails", etc).'
  );
}

// ── Sincronización completa ─────────────────────────────────────────────
async function runSync() {
  console.log('🚀 Sincronizando catálogo de ejercicios de wger.de → Supabase Storage\n');

  await ensureBucket();

  console.log('Resolviendo idiomas y licencias...');
  const langIds = await resolveLanguageIds();
  const licenseMap = await resolveLicenses();

  console.log('Descargando catálogo de ejercicios (puede tardar varios minutos)...');
  const exercises = await fetchAllExercises();

  const manifest = {
    generated_at: new Date().toISOString(),
    source: 'https://wger.de',
    license_note:
      'Datos e imágenes bajo licencias Creative Commons individuales de wger.de. ' +
      'Ver el campo "attribution" de cada ejercicio. No redistribuir sin mantener esta atribución.',
    exercises: [],
  };

  const failures = [];
  let uploadedBytes = 0;
  let processed = 0;
  let withImage = 0;
  let withoutImage = 0;

  for (const exercise of exercises) {
    processed++;
    process.stdout.write(
      `  [${processed}/${exercises.length}] ejercicio #${exercise.id}...\r`
    );
    try {
      const translation = pickTranslation(exercise, langIds);
      if (!translation) continue; // sin nombre utilizable, lo saltamos

      const mainImage = pickMainImage(exercise);
      let imageUrl = null;
      let thumbUrl = null;

      if (mainImage?.image) {
        const { buffer, contentType } = await fetchBinary(mainImage.image);
        const ext = extFromContentType(contentType);
        const storagePath = `wger/${exercise.id}/main.${ext}`;
        imageUrl = await uploadToStorage(storagePath, buffer, contentType);
        uploadedBytes += buffer.length;

        const resolvedThumb = await resolveThumbnailUrl(mainImage);
        if (resolvedThumb && resolvedThumb !== mainImage.image) {
          try {
            const thumbBin = await fetchBinary(resolvedThumb);
            const thumbExt = extFromContentType(thumbBin.contentType);
            const thumbPath = `wger/${exercise.id}/thumb.${thumbExt}`;
            thumbUrl = await uploadToStorage(thumbPath, thumbBin.buffer, thumbBin.contentType);
            uploadedBytes += thumbBin.buffer.length;
          } catch {
            thumbUrl = imageUrl; // si falla la miniatura, usamos la imagen completa
          }
        } else {
          thumbUrl = imageUrl;
        }
        withImage++;
      } else {
        withoutImage++;
      }

      const video = (exercise.videos || [])[0] || null;
      // El nombre exacto del campo con la URL del video no se pudo
      // confirmar contra un ejemplo real (el de prueba no traía video),
      // así que probamos varias claves típicas antes de rendirnos.
      const videoUrl = video
        ? video.video || video.video_url || video.file || video.url || null
        : null;

      // wger usa nombres científicos en latín para "name" (ej. "Biceps
      // femoris") y el nombre común en inglés en "name_en" (ej.
      // "Hamstrings"). No hay nombre en español todavía — eso lo
      // resolvemos en el siguiente paso, al conectar esto con
      // ejercicios_repo.js, con una tabla de traducción propia.
      const mapMuscle = (m) => ({ latin: m.name, en: m.name_en || null });

      manifest.exercises.push({
        wger_id: exercise.id,
        uuid: exercise.uuid,
        nombre: translation.name,
        nombre_alterno_en:
          pickTranslation(exercise, { preferredId: langIds.fallbackId, fallbackId: null })
            ?.name || null,
        categoria: exercise.category?.name || null,
        musculos: (exercise.muscles || []).map(mapMuscle),
        musculos_secundarios: (exercise.muscles_secondary || []).map(mapMuscle),
        equipo: (exercise.equipment || []).map((e) => e.name),
        imagen_url: imageUrl,
        miniatura_url: thumbUrl,
        video_url: videoUrl, // enlazado directo a wger, no se re-hospeda
        attribution: mainImage
          ? buildAttribution(exercise, mainImage, translation, licenseMap)
          : null,
      });
    } catch (err) {
      failures.push({ id: exercise.id, error: err.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\n\n✓ Procesados ${manifest.exercises.length} ejercicios en total.`);
  console.log(`  → ${withImage} con imagen, ${withoutImage} sin imagen todavía en wger.`);
  console.log(
    `✓ Subidos ~${(uploadedBytes / 1024 / 1024).toFixed(2)} MB a Supabase Storage (bucket "${BUCKET}").`
  );
  if (failures.length) {
    console.log(`⚠️  ${failures.length} ejercicios fallaron (ver failures.json).`);
    await writeFile(
      path.join(__dirname, 'failures.json'),
      JSON.stringify(failures, null, 2)
    );
  }

  // Manifest local (para revisar / versionar en git si quieren)
  const manifestPath = path.join(__dirname, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ manifest.json escrito en ${manifestPath}`);

  // Manifest también en Supabase Storage, para que la app lo lea directo
  const manifestUrl = await uploadToStorage(
    'wger/manifest.json',
    Buffer.from(JSON.stringify(manifest)),
    'application/json'
  );
  console.log(`✓ manifest.json subido a Supabase: ${manifestUrl}`);

  console.log(
    '\n📌 Siguiente paso: pásame ese manifest.json (o solo dime que ya está subido) ' +
      'para adaptar ejercicios_repo.js y que la app lo consuma desde Supabase Storage ' +
      'en vez del dataset anterior.'
  );
}

// ── Entrada ───────────────────────────────────────────────────────────
try {
  if (INSPECT_MODE) {
    await runInspect();
  } else {
    await runSync();
  }
} catch (err) {
  console.error('\n❌ Error fatal:', err);
  process.exit(1);
}
