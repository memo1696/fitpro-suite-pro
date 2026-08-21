/**
 * Esquema normalizado de la biblioteca de ejercicios (v2).
 *
 * ── POR QUÉ ESTE ESQUEMA ──────────────────────────────────────────────────
 * El formato v1 (`wger_ejercicios.json`) guardaba las imágenes como una lista
 * de nombres de archivo dentro de cada ejercicio:
 *
 *     { "id": 2000, "images": ["cuadr_seps_var_110_anim.gif"], ... }
 *
 * Eso permite —y en la práctica produjo— tres problemas que este esquema hace
 * imposibles por construcción:
 *
 *  1. DUPLICACIÓN. Nada impedía que 301 nombres distintos apuntaran al mismo
 *     contenido. Ocurrió: 301 GIFs en disco resultaron ser 8 archivos copiados,
 *     223 MB de los que 200 MB (89 %) eran duplicación pura.
 *     → Aquí los medios viven en un diccionario aparte, direccionados por el
 *       hash de su contenido. Dos archivos idénticos colapsan en una entrada.
 *
 *  2. HUÉRFANOS. Nada relacionaba el disco con el dataset, así que quedaron
 *     419 archivos que ningún ejercicio referenciaba.
 *     → `audit.mjs` puede cruzar ambos lados justamente porque el catálogo de
 *       medios es explícito.
 *
 *  3. FALSA PRECISIÓN. Un clip genérico de grupo muscular se mostraba como si
 *     fuese la demostración del ejercicio concreto. Un ejercicio de gemelos
 *     enseñaba una apertura de pecho.
 *     → El campo `scope` obliga a declarar qué representa cada medio. La UI lo
 *       usa para etiquetar honestamente ("referencia del grupo muscular") en
 *       lugar de dar a entender que es la demostración exacta.
 *
 * ── FORMA ─────────────────────────────────────────────────────────────────
 *   { schemaVersion, generatedAt, media: { [assetId]: MediaAsset }, exercises: [Exercise] }
 *
 * `media` es un diccionario, no un array, porque el acceso siempre es por id
 * desde el ejercicio.
 */

export const SCHEMA_VERSION = 2;

/** Qué representa un medio respecto al ejercicio que lo referencia. */
export const MEDIA_SCOPE = {
  /** Es este ejercicio, ejecutado por alguien. Se puede presentar como demostración. */
  EXERCISE: 'exercise',
  /** Ilustra el grupo muscular o un patrón similar, no este ejercicio. La UI debe advertirlo. */
  MUSCLE_GROUP: 'muscleGroup'
};

/** Naturaleza del medio; determina el contenedor que usa la UI. */
export const MEDIA_KIND = {
  /** Imagen fija. */
  STILL: 'still',
  /** Bucle corto sin audio (webp animado / mp4 / webm). */
  ANIMATION: 'animation'
};

/**
 * Formatos de salida, en orden de preferencia: la UI ofrece las fuentes en este
 * orden y el navegador se queda con la primera que sepa decodificar. AVIF y
 * WebP van antes que JPEG porque pesan bastante menos a igual calidad.
 */
export const VARIANT_FORMATS_OPTIMIZADOS = ['webm', 'mp4', 'webp', 'avif', 'jpg'];

/**
 * Formatos de ORIGEN que el pipeline acepta como entrada pero no como salida.
 * GIF y PNG entran (es lo que hay en `wger_images/`) y `optimize.mjs` los
 * convierte; que sigan siendo válidos en el dataset permite normalizar antes de
 * haber optimizado nada.
 */
export const VARIANT_FORMATS_ORIGEN = ['gif', 'png', 'jpeg'];

export const VARIANT_FORMATS = [...VARIANT_FORMATS_OPTIMIZADOS, ...VARIANT_FORMATS_ORIGEN];

/** Licencias conocidas. `attributionRequired` es lo que decide si la UI debe pintar el crédito. */
export const LICENSES = {
  'CC-BY-SA-3': { name: 'Creative Commons BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/', attributionRequired: true },
  'CC-BY-SA-4': { name: 'Creative Commons BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', attributionRequired: true },
  'CC0':        { name: 'CC0 / Dominio público',      url: 'https://creativecommons.org/publicdomain/zero/1.0/', attributionRequired: false },
  'proprietary':{ name: 'Propiedad del titular',      url: null, attributionRequired: false }
};

/**
 * Normaliza la etiqueta de licencia que traía el dataset v1 ("CC-BY-SA 3",
 * "CC-BY-SA 4", "CC0", "Royalty-Free Commercial") a una clave de LICENSES.
 * Devuelve null si no la reconoce, para que el llamador decida (y no se
 * etiquete como propio por accidente algo que no lo es).
 */
export function normalizarLicencia(etiqueta) {
  const t = String(etiqueta || '').trim().toLowerCase();
  if (!t) return null;
  if (t.startsWith('cc-by-sa 3') || t.startsWith('cc-by-sa-3')) return 'CC-BY-SA-3';
  if (t.startsWith('cc-by-sa 4') || t.startsWith('cc-by-sa-4')) return 'CC-BY-SA-4';
  if (t === 'cc0' || t.startsWith('cc0 ')) return 'CC0';
  if (t.includes('royalty-free') || t === 'proprietary') return 'proprietary';
  return null;
}

/** Slug estable y legible a partir del nombre, para URLs y nombres de archivo. */
export function slugify(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // quita los diacríticos que NFD separó
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Valida un dataset normalizado. Devuelve una lista de problemas (vacía = OK).
 * Se ejecuta en `normalize.mjs` antes de escribir, para que un dataset
 * inconsistente nunca llegue a disco.
 */
export function validarDataset(dataset) {
  const problemas = [];
  const err = (msg) => problemas.push(msg);

  if (!dataset || typeof dataset !== 'object') {
    err('El dataset no es un objeto.');
    return problemas;
  }
  if (dataset.schemaVersion !== SCHEMA_VERSION) {
    err(`schemaVersion es ${dataset.schemaVersion}, se esperaba ${SCHEMA_VERSION}.`);
  }
  if (!dataset.media || typeof dataset.media !== 'object' || Array.isArray(dataset.media)) {
    err('`media` debe ser un diccionario { assetId: MediaAsset }.');
    return problemas;
  }
  if (!Array.isArray(dataset.exercises)) {
    err('`exercises` debe ser un array.');
    return problemas;
  }

  // ── Medios ──
  const contenidosVistos = new Map();   // contentHash -> assetId
  for (const [assetId, asset] of Object.entries(dataset.media)) {
    if (asset.id !== assetId) err(`media["${assetId}"].id no coincide con su clave.`);
    if (!Object.values(MEDIA_KIND).includes(asset.kind)) {
      err(`media["${assetId}"].kind inválido: ${asset.kind}`);
    }
    if (!Array.isArray(asset.variants) || asset.variants.length === 0) {
      err(`media["${assetId}"] no tiene variantes.`);
    } else {
      asset.variants.forEach((v, i) => {
        if (!VARIANT_FORMATS.includes(v.format)) {
          err(`media["${assetId}"].variants[${i}].format desconocido: ${v.format}`);
        }
        if (!v.path) err(`media["${assetId}"].variants[${i}] sin path.`);
        if (!(v.bytes > 0)) err(`media["${assetId}"].variants[${i}] con bytes inválido.`);
      });
    }
    // La deduplicación es la razón de ser del esquema: dos assets con el mismo
    // contenido significan que el normalizador falló.
    if (asset.contentHash) {
      if (contenidosVistos.has(asset.contentHash)) {
        err(`media["${assetId}"] duplica el contenido de "${contenidosVistos.get(asset.contentHash)}".`);
      } else {
        contenidosVistos.set(asset.contentHash, assetId);
      }
    }
    if (asset.license && !LICENSES[asset.license.id]) {
      err(`media["${assetId}"].license.id desconocido: ${asset.license.id}`);
    }
    if (asset.license && LICENSES[asset.license.id]?.attributionRequired && !asset.license.holder) {
      err(`media["${assetId}"] usa ${asset.license.id}, que exige atribución, pero no tiene holder.`);
    }
  }

  // ── Ejercicios ──
  const idsVistos = new Set();
  const slugsVistos = new Set();
  for (const ej of dataset.exercises) {
    if (idsVistos.has(ej.id)) err(`Ejercicio con id duplicado: ${ej.id}`);
    idsVistos.add(ej.id);

    if (slugsVistos.has(ej.slug)) err(`Ejercicio con slug duplicado: ${ej.slug}`);
    slugsVistos.add(ej.slug);

    if (!ej.name?.es) err(`Ejercicio ${ej.id} sin nombre en español.`);

    if (ej.mediaId != null) {
      if (!dataset.media[ej.mediaId]) {
        err(`Ejercicio ${ej.id} referencia el medio inexistente "${ej.mediaId}".`);
      }
      if (!Object.values(MEDIA_SCOPE).includes(ej.mediaScope)) {
        err(`Ejercicio ${ej.id} tiene mediaId pero mediaScope inválido: ${ej.mediaScope}`);
      }
    }
  }

  // ── Medios no usados por nadie ──
  const usados = new Set(dataset.exercises.map(e => e.mediaId).filter(Boolean));
  for (const assetId of Object.keys(dataset.media)) {
    if (!usados.has(assetId)) err(`media["${assetId}"] no lo referencia ningún ejercicio (huérfano).`);
  }

  return problemas;
}
