/**
 * FitPro Suite Pro - Repositorio Oficial y Conector de wger.de
 * Consume un catálogo curado de wger.de (proyecto FLOSS, licencia
 * CC-BY-SA) servido como archivo propio `wger_ejercicios.json`.
 *
 * ── MIGRACIÓN DE DATASET (yuhonas/free-exercise-db → wger.de) ──
 * Se reemplazó free-exercise-db por decisión explícita: fotos reales pero
 * inconsistentes entre sí (persona/gimnasio distinto en cada una) y con
 * huecos de cobertura en los ejercicios escritos a mano (74 de 149 caían a
 * un ícono genérico). wger.de trae ilustraciones de línea con el MISMO
 * estilo en todos los ejercicios — consistente — pero de un catálogo total
 * mucho más chico (873 ejercicios, solo 268 con al menos una imagen). Por
 * eso `wger_ejercicios.json` NO es el catálogo completo de wger: es un
 * PRE-FILTRADO que ya descarta los 605 ejercicios sin imagen, para que
 * "cantidad de ejercicios visibles" siempre sea igual a "cantidad con
 * imagen real" — nunca se muestra un ícono genérico en la Biblioteca.
 *
 * Cómo se construyó `wger_ejercicios.json` (proceso único, no en runtime):
 *  1. Se descargó el catálogo completo vía la API pública de wger
 *     (`/api/v2/exerciseinfo/`) y se filtró a los 268 con >=1 imagen.
 *  2. Nombre y descripción en español: wger ya trae traducciones nativas
 *     de su comunidad para 229 de esos 268 (`translations[].language===4`).
 *     Los 39 restantes se tradujeron una sola vez (mismo método que las
 *     instrucciones de free-exercise-db en su momento) y quedaron
 *     embebidos en el JSON — no hay traducción en runtime.
 *  3. Las URLs de imagen (`images[]`) ya vienen absolutas
 *     (`https://wger.de/media/exercise-images/...`), no relativas como en
 *     el dataset anterior — no hace falta CDN base ni `resolveUrls`.
 *
 * Diferencias de forma relevantes respecto a la versión anterior del
 * archivo (free-exercise-db), todas absorbidas en ExercisesAdapter:
 *  - `id` vuelve a ser numérico (el id real de wger), no un slug de texto.
 *  - Sin campo `instructions`/traducción en runtime: `descripcionEs` ya
 *    viene resuelta en español desde el JSON.
 *  - `equipment` es un array de strings (puede haber más de uno); antes
 *    era un string único. Vocabulario también distinto: "Barbell",
 *    "Dumbbell", "Cable machine", "SZ-Bar", etc. Ver `mapEquipoLocal` y
 *    `EQUIPO_HINTS`.
 *  - `primaryMuscles` usa nombres en inglés de wger (Glutes, Quads,
 *    Hamstrings, Lats, Chest, Shoulders, Biceps, Triceps, Abs, Calves) con
 *    fallback a `category` (Legs/Arms/Chest/Back/Shoulders/Abs/Calves/
 *    Cardio) cuando el ejercicio no tiene músculo principal listado.
 *
 * La interfaz pública (funciones colgadas de `window`) se mantiene 100%
 * igual que antes para no romper nada de lo que ya la consume en app.js /
 * index.html.
 */

(function (window) {
  'use strict';

  // Evita que el script se re-ejecute dos veces (p. ej. si index.html lo
  // incluye más de una vez, o en hot-reload durante desarrollo).
  if (window.__fitproGithubExercisesInit) return;
  window.__fitproGithubExercisesInit = true;

  // ==========================================================================
  // 1. CONFIGURACIÓN
  // ==========================================================================
  const CONFIG = {
    // Archivo propio (mismo origen), no una API externa en runtime: ya viene
    // pre-filtrado (solo ejercicios con imagen) y pre-traducido al español.
    // Query de versión: Cache-Control de este archivo es max-age=3600
    // (vercel.json), que dentro de esa hora se sirve directo desde caché
    // del navegador sin revalidar. Subir esta versión fuerza a tratarlo
    // como una URL nueva cada vez que cambia el contenido del archivo.
    datasetUrl: 'wger_ejercicios.json?v=2',
    dbName: 'fitpro_exercises_cache',
    dbStore: 'dataset',
    dbVersion: 4,          // subido: la forma del objeto normalizado cambió con la migración a wger
    // Clave de caché ligada al dataset de origen: evita servir datos con la
    // forma vieja (del dataset anterior) desde IndexedDB tras la migración.
    cacheKey: 'exercises_normalized_wger',
    cacheTtlMs: 1000 * 60 * 60 * 24 * 7, // 7 días
    maxEsperaEjerciciosDB: 50 // reintentos de 100ms (~5s) antes de rendirse
  };

  let githubExercisesList = []; // ya normalizado (ver ExercisesAdapter.normalize). Nombre historico de la variable, ahora contiene ejercicios de wger.
  let isDatasetLoaded = false;

  const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="background:%230f172a;"><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><rect x="5" y="8" width="2" height="8" rx="1"/><rect x="17" y="8" width="2" height="8" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`;
  window.SVG_PLACEHOLDER = SVG_PLACEHOLDER;

  // ==========================================================================
  // ENCUADRE DE IMÁGENES — ver el bloque "ESTÁNDAR VISUAL DE IMÁGENES DE
  // EJERCICIO" en styles.css para el porqué.
  //
  // El default de TODO el catálogo es `contain` sobre fondo claro. Esta lista
  // son las únicas imágenes que son fotografías reales de alta confianza
  // (persona real en gimnasio/exterior, sin fondo blanco, no panorámicas):
  // en una foto el recorte cuadrado se ve mejor que las barras laterales.
  //
  // Se generó con `scripts/clasificador-imagenes.html`, que compone cada
  // imagen sobre blanco en un <canvas> y mide fondo de esquinas, fracción de
  // blanco, saturación, canal alfa y relación de aspecto. El criterio está
  // sesgado a `contain` a propósito: recortar una ilustración de 2 fases
  // parte las dos figuras al medio (el bug que esto arregla), mientras que
  // una barra lateral en una foto es sólo cosmético.
  //
  // Si se re-sincroniza el catálogo desde wger, volver a correr esa página
  // y reemplazar esta lista.
  const IMAGENES_FOTO = new Set([
    '1022_0.jpg', '1022_1.jpg', '1185_0.jpg', '1186_0.jpg', '1227_0.jpg',
    '1239_0.jpg', '1387_0.jpg', '1521_0.jpg', '1551_0.jpg', '1554_0.jpg',
    '1556_0.jpg', '1604_0.jpg', '1733_0.jpg', '1734_0.jpg', '1735_0.jpg',
    '1835_0.jpg', '1861_0.png', '1862_0.png', '1873_0.png', '1875_0.png',
    '1876_0.png', '1971_0.jpg', '691_0.jpg', '691_1.jpg', '959_0.png'
  ]);

  // Clases del contenedor de una imagen de ejercicio. Se usa en los 5 puntos
  // de render (biblioteca, miniaturas de plan, tabla de rutina y modal).
  window.claseImagenEjercicio = function (url) {
    const archivo = String(url || '').split('/').pop().split('?')[0];
    return IMAGENES_FOTO.has(archivo) ? 'ej-img-box ej-img-box--foto' : 'ej-img-box';
  };

  // `escapeHtml` es usado en varios puntos de app.js (catálogo de ejercicios,
  // sección de Planes) pero nunca estaba definido en ningún archivo del
  // proyecto -> causaba "ReferenceError: escapeHtml is not defined" al
  // entrar a Planes. No es parte de la integración del dataset, pero se
  // define aquí (que carga antes que app.js) para no dejar la app rota.
  if (typeof window.escapeHtml !== 'function') {
    window.escapeHtml = function (str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };
  }

  // Auxiliares de capitalización
  function capitalizeWords(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ==========================================================================
  // 2. ADAPTADOR — única capa que conoce la forma real del dataset externo.
  //    Si mañana el repo cambia nombres de campos, carpetas de medios, etc.,
  //    SOLO este bloque debería necesitar cambios; el resto de la app sigue
  //    consumiendo la forma normalizada de siempre.
  // ==========================================================================
  const ExercisesAdapter = {
    // Registro crudo del JSON -> objeto interno "delgado" (solo lo que se usa)
    normalize(raw) {
      return {
        id: String(raw.id),
        name: raw.name_en || '',
        nombreEs: raw.name_es_native || capitalizeWords(raw.name_en || ''),
        descripcionEs: raw.description_es_native || '',
        category: raw.category || '', // Legs/Arms/Chest/Back/Shoulders/Abs/Calves/Cardio (agrupación amplia de wger)
        primaryMuscles: raw.muscles || [],
        secondaryMuscles: raw.muscles_secondary || [],
        equipment: raw.equipment || [], // array, puede tener 0-N items
        // Nombres de archivo relativos (ej. "12_0.png"); se resuelven a
        // ./wger_images/<archivo> en gifUrls(). Las imágenes se
        // autohospedan en vez de enlazar en vivo a wger.de: su servidor
        // (proyecto comunitario, no un CDN) resultó no ser confiable para
        // hotlinking en tiempo real desde el navegador de los usuarios.
        images: raw.images || [],
        // Atribución requerida por la licencia CC-BY-SA de wger.
        licenseAuthor: raw.license_author || '',
        licenseShort: raw.license_short || 'CC-BY-SA'
      };
    },

    normalizeAll(rawArray) {
      return (rawArray || []).map(r => this.normalize(r));
    },

    // Se mantiene el nombre `gifUrls` por compatibilidad con el resto del
    // archivo y con app.js.
    gifUrls(record) {
      return (record.images || []).map(nombreArchivo => 'wger_images/' + nombreArchivo);
    },
    imageUrls(record) { return this.gifUrls(record); },

    // Músculo principal (nombres en inglés de wger) -> categoría fija del
    // catálogo local. Si el ejercicio no tiene músculo principal listado
    // (pasa en varios de wger), se cae a la categoría amplia de wger.
    mapCategoriaLocal(record) {
      const primary = ((record.primaryMuscles && record.primaryMuscles[0]) || '').toLowerCase();
      if (primary.includes('chest')) return 'pecho';
      if (primary.includes('lat')) return 'espalda';
      if (primary.includes('shoulder')) return 'hombros';
      if (primary.includes('abs')) return 'core';
      if (primary.includes('quad')) return 'cuadriceps';
      if (primary.includes('hamstring')) return 'isquiotibiales';
      if (primary.includes('glute')) return 'gluteos';
      if (primary.includes('calf') || primary.includes('calve')) return 'pantorrillas';
      if (primary.includes('bicep')) return 'biceps';
      if (primary.includes('tricep')) return 'triceps';
      const cat = (record.category || '').toLowerCase();
      if (cat === 'legs') return 'cuadriceps';
      if (cat === 'arms') return 'biceps';
      if (cat === 'chest') return 'pecho';
      if (cat === 'back') return 'espalda';
      if (cat === 'shoulders') return 'hombros';
      if (cat === 'abs') return 'core';
      if (cat === 'calves') return 'pantorrillas';
      return 'core'; // cardio y cualquier otro caso
    },

    mapEquipoLocal(record) {
      const lista = (record.equipment || []).map(e => e.toLowerCase());
      const eq = lista.join(' | ');
      if (eq.includes('sz-bar') || eq.includes('barbell')) return 'Barra';
      if (eq.includes('dumbbell')) return 'Mancuerna';
      if (eq.includes('kettlebell')) return 'Mancuerna';
      if (eq.includes('cable')) return 'Polea';
      if (eq.includes('resistance band')) return 'Banda';
      if (eq.includes('machine')) return 'Máquina';
      // "none (bodyweight exercise)", "bench", "incline bench", "gym mat",
      // "pull-up bar", "swiss ball", sin equipamiento -> sin equivalente
      // local claro, se agrupan como peso corporal.
      return 'Peso Corporal';
    },

    // Registro normalizado -> objeto con la MISMA forma que ya usa
    // `ejerciciosDB` en app.js. Este es el único punto de contacto entre el
    // dataset externo y el esquema interno de la app.
    toEjercicioLocal(record) {
      const ejecucion = record.descripcionEs || 'Realiza el ejercicio controlando el tempo de ejecución. Asegura mantener la postura correcta.';
      const imageUrls = this.imageUrls(record);

      return {
        nombre: record.nombreEs,
        categoria: this.mapCategoriaLocal(record),
        musculoPrimario: capitalizeFirst((record.primaryMuscles && record.primaryMuscles[0]) || this.mapCategoriaLocal(record)),
        equipamiento: this.mapEquipoLocal(record),
        riesgo: 'Bajo',
        musculos: (record.primaryMuscles || []).concat(record.secondaryMuscles || []).join(', '),
        ejecucion,
        // Propiedades extendidas para carga en modal / biblioteca visual
        github_id: record.id, // nombre historico del campo (era el id de GitHub); ahora es el id de wger
        github_name: record.name,
        url_gif: imageUrls[0] || '',
        real_gif_url: imageUrls[0] || '', // un solo origen real, sin CDN de respaldo distinto
        url_gif_frame2: imageUrls[1] || '',
        url_gif_frame2_fallback: imageUrls[1] || '',
        url_thumbnail: imageUrls[0] || '',
        url_thumbnail_fallback: imageUrls[0] || '',
        // Atribución CC-BY-SA (obligatoria por la licencia de wger.de)
        atribucion: record.licenseAuthor
          ? `Imagen: ${record.licenseAuthor} · wger.de (${record.licenseShort})`
          : `Imagen: wger.de (${record.licenseShort})`
      };
    }
  };
  // Se expone por si en el futuro otra parte de la app necesita normalizar
  // un registro (p. ej. un endpoint propio en Supabase con el mismo dataset).
  window.ExercisesAdapter = ExercisesAdapter;

  // ==========================================================================
  // 3. CACHÉ LOCAL (IndexedDB) — evita re-descargar 17MB en cada visita.
  //    Si IndexedDB no está disponible (modo privado, navegador viejo, etc.)
  //    todo sigue funcionando, simplemente sin caché.
  // ==========================================================================
  const Cache = {
    _dbPromise: null,

    _openDb() {
      if (!window.indexedDB) return Promise.reject(new Error('IndexedDB no disponible'));
      if (this._dbPromise) return this._dbPromise;
      this._dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(CONFIG.dbName, CONFIG.dbVersion);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(CONFIG.dbStore)) {
            db.createObjectStore(CONFIG.dbStore);
          }
        };
        // Si el usuario tiene otra pestaña vieja abierta con una versión
        // anterior de la app, esa pestaña puede tener la base de datos
        // abierta y bloquear indefinidamente esta apertura hasta que suba
        // de versión. Sin esto, cargarDatasetDeEjercicios() se quedaba
        // colgado para siempre esperando el caché, sin llegar nunca a
        // intentar la descarga por red.
        req.onblocked = () => {
          console.warn('⚠️ IndexedDB bloqueado por otra pestaña con una versión anterior abierta; se continúa sin caché.');
          reject(new Error('IndexedDB bloqueado por otra pestaña'));
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      // Salvavidas adicional: si por cualquier motivo ninguno de los
      // eventos de arriba dispara en 3s, no dejar la carga del dataset
      // colgada esperando el caché para siempre.
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout abriendo IndexedDB')), 3000));
      return Promise.race([this._dbPromise, timeout]);
    },

    async get(key) {
      try {
        const db = await this._openDb();
        return await new Promise((resolve, reject) => {
          const tx = db.transaction(CONFIG.dbStore, 'readonly');
          const req = tx.objectStore(CONFIG.dbStore).get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        return null; // sin caché disponible, no es un error fatal
      }
    },

    async set(key, value) {
      try {
        const db = await this._openDb();
        await new Promise((resolve, reject) => {
          const tx = db.transaction(CONFIG.dbStore, 'readwrite');
          tx.objectStore(CONFIG.dbStore).put(value, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (e) {
        // Guardar en caché es "best effort": si falla, seguimos sin caché.
      }
    }
  };

  // ==========================================================================
  // 4. DESCARGA + NORMALIZACIÓN DEL DATASET
  // ==========================================================================
  async function cargarDatasetDeEjercicios() {
    try {
      // 1. Intentar caché local primero (rápido, sin red)
      const cached = await Cache.get(CONFIG.cacheKey);
      if (cached && cached.data && (Date.now() - cached.timestamp) < CONFIG.cacheTtlMs) {
        githubExercisesList = cached.data;
        isDatasetLoaded = true;
        console.log(`✅ ${githubExercisesList.length} ejercicios cargados desde caché local (sin red).`);
        integrarEjerciciosEnBaseDeDatosGlobal();
        return;
      }

      // 2. Descargar el catálogo curado de wger (archivo propio, mismo origen)
      console.log('⚡ Cargando catálogo de ejercicios (wger.de)...');
      const res = await fetch(CONFIG.datasetUrl);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const rawList = await res.json();

      // 3. Normalizar antes de guardar en caché.
      githubExercisesList = ExercisesAdapter.normalizeAll(rawList);
      isDatasetLoaded = true;
      console.log(`✅ Conexión exitosa: ${githubExercisesList.length} ejercicios cargados desde wger.de.`);

      Cache.set(CONFIG.cacheKey, { data: githubExercisesList, timestamp: Date.now() });

      integrarEjerciciosEnBaseDeDatosGlobal();
    } catch (err) {
      console.error('❌ Error al conectar con el catálogo de ejercicios, usando fallbacks locales:', err);
    }
  }

  // Integra los ejercicios del dataset en la variable global ejerciciosDB de app.js
  let intentosEspera = 0;
  let yaIntegrado = false;
  function integrarEjerciciosEnBaseDeDatosGlobal() {
    if (yaIntegrado) return; // evita duplicar si se llama más de una vez
    if (!window.ejerciciosDB || !Array.isArray(window.ejerciciosDB)) {
      intentosEspera++;
      if (intentosEspera > CONFIG.maxEsperaEjerciciosDB) {
        console.error('❌ window.ejerciciosDB nunca apareció; se aborta la integración del dataset de GitHub.');
        return;
      }
      console.warn('⚠️ window.ejerciciosDB no encontrada aún. Reintentando en 100ms...');
      setTimeout(integrarEjerciciosEnBaseDeDatosGlobal, 100);
      return;
    }

    const mapaExistentes = new Set(
      window.ejerciciosDB.map(e => (e && e.nombre ? e.nombre.toLowerCase().trim() : ''))
    );
    let agregados = 0;

    githubExercisesList.forEach(record => {
      const ejemplo = ExercisesAdapter.toEjercicioLocal(record);
      const key = ejemplo.nombre.toLowerCase().trim();
      if (key && !mapaExistentes.has(key)) {
        window.ejerciciosDB.push(ejemplo);
        mapaExistentes.add(key);
        agregados++;
      }
    });

    yaIntegrado = true;
    console.log(`💪 Catálogo ampliado exitosamente: ${agregados} ejercicios de wger.de inyectados en la base de datos (Total: ${window.ejerciciosDB.length}).`);

    // Refrescar vistas del sistema si están cargadas
    if (typeof window.renderBiblioteca === 'function') {
      window.renderBiblioteca();
    }
    if (typeof window.poblarDatalistEjerciciosGlobal === 'function') {
      window.poblarDatalistEjerciciosGlobal();
    }
  }

  // Iniciar descarga
  cargarDatasetDeEjercicios();

  // ==========================================================================
  // 5. BÚSQUEDA / EMPAREJAMIENTO (rutinas manuales y ejercicios "heredados"
  //    que aún no tienen github_id porque fueron escritos a mano en app.js)
  // ==========================================================================

  // Mapeo manual estático para los ejercicios que ya tenías escritos a mano,
  // para asegurar precisión del 100% en los casos donde el emparejamiento
  // automático por nombre podría fallar o ser ambiguo. Se mapea por ID del
  // dataset (no por texto) para no depender de acentos/mayúsculas exactas.
  //
  // VACÍO tras la migración a wger: los IDs de free-exercise-db no existen
  // en este catálogo, y wger solo cubre 268 ejercicios (vs. 873 antes), así
  // que muchas de las coincidencias curadas anteriormente no tienen
  // equivalente aquí. En vez de adivinar 149 mapeos nuevos sin poder ver
  // cada imagen, se deja que el emparejamiento automático (por nombre +
  // pista de equipo, ver buscarCoincidenciaEnDataset más abajo) haga el
  // trabajo — que es exactamente el mecanismo que este mapa manual estaba
  // pensado para reforzar en casos ambiguos, no para reemplazar. Si algún
  // ejercicio puntual queda con el emparejamiento incorrecto, se puede
  // agregar aquí una entrada `'Nombre en español tal cual en app.js': idWger`.
  const MAPEO_MANUAL_ESTATICO_POR_ID = {};

  // Imágenes por categoría como último recurso visual (si no hay match en el
  // dataset ni éste está cargado aún). Autohospedadas (ver wger_images/),
  // igual que el resto de las imágenes — enlazar en vivo a wger.de no era
  // confiable.
  const FALLBACK_GIFS_POR_CATEGORIA = {
    cuadriceps: 'wger_images/203_0.jpg',
    isquiotibiales: 'wger_images/285_0.png',
    gluteos: 'wger_images/12_0.png',
    pecho: 'wger_images/73_0.png',
    espalda: 'wger_images/81_0.jpg',
    hombros: 'wger_images/79_0.png',
    biceps: 'wger_images/31_0.png',
    triceps: 'wger_images/50_0.jpg',
    core: 'wger_images/41_0.png',
    pantorrillas: 'wger_images/146_0.jpg'
  };
  // Fallback absoluto (sin categoría conocida / dataset no cargado aún). Se
  // reutiliza la imagen de "core" para no duplicar otra URL más.
  const GENERIC_FALLBACK_IMG = FALLBACK_GIFS_POR_CATEGORIA.core;

  // Pistas de equipamiento (texto en español -> tokens esperados en el
  // campo `equipment` en inglés del dataset). Se usan para EXIGIR que una
  // coincidencia por palabras clave sea del mismo equipo, no solo del mismo
  // movimiento genérico. Sin esto, "Curl Martillo con Mancuernas" podía
  // terminar emparejado con "cable hammer curl" solo porque aparecía primero
  // en el array, mostrando un ejercicio de polea para uno que es de mancuerna.
  // Vocabulario de `equipment` actualizado al de wger ("SZ-Bar" en vez de
  // "e-z curl bar", "Cable machine" en vez de "cable", "Resistance band" en
  // vez de "bands", "none (bodyweight exercise)" en vez de "body only").
  const EQUIPO_HINTS = [
    { es: ['mancuernas', 'mancuerna'], en: ['dumbbell'] },
    { es: ['barra z', 'barra ez', 'ez-bar', 'ez bar'], en: ['sz-bar'] },
    { es: ['barra'], en: ['barbell'] },
    { es: ['polea', 'cable'], en: ['cable'] },
    { es: ['máquina', 'maquina'], en: ['machine'] },
    { es: ['banda'], en: ['resistance band'] },
    { es: ['kettlebell', 'pesa rusa'], en: ['kettlebell'] },
    { es: ['peso corporal'], en: ['none (bodyweight exercise)'] }
  ];

  function detectarEquipoEsperado(textoEspanolSinParentesis) {
    const t = textoEspanolSinParentesis.toLowerCase();
    for (const h of EQUIPO_HINTS) {
      if (h.es.some(w => t.includes(w))) return h.en;
    }
    return null; // sin pista clara -> no se filtra por equipo
  }

  function candidatoCumpleEquipo(candidato, equipoEsperado) {
    if (!equipoEsperado) return true;
    // `equipment` es un array en wger (puede tener 0-N items), a diferencia
    // del string único del dataset anterior.
    const eq = (candidato.equipment || []).join(' | ').toLowerCase();
    const nm = candidato.name.toLowerCase();
    return equipoEsperado.some(tok => eq.includes(tok) || nm.includes(tok));
  }

  function buscarCoincidenciaEnDataset(nombreOriginal) {
    if (!isDatasetLoaded || githubExercisesList.length === 0) return null;

    // 1. Mapeo estático predefinido (por ID, verificado a mano contra el dataset real)
    if (MAPEO_MANUAL_ESTATICO_POR_ID[nombreOriginal]) {
      const idObjetivo = MAPEO_MANUAL_ESTATICO_POR_ID[nombreOriginal];
      const exactMatch = githubExercisesList.find(e => e.id === idObjetivo);
      if (exactMatch) return exactMatch;
    }

    // Pista de equipamiento a partir del texto en español (fuera de paréntesis)
    const textoEspanol = nombreOriginal.replace(/\([^)]*\)/g, '');
    const equipoEsperado = detectarEquipoEsperado(textoEspanol);

    // 2. Extraer inglés de los paréntesis si existe (ej: "Back Squat" de "Sentadilla Trasera (Back Squat)")
    const parenMatch = nombreOriginal.match(/\(([^)]+)\)/);
    let terminoBusqueda = parenMatch ? parenMatch[1] : nombreOriginal;
    terminoBusqueda = terminoBusqueda
      .toLowerCase()
      .replace(/30°\s*-\s*45°/g, '')
      .replace(/rdl/g, 'romanian deadlift')
      .trim();

    // 3. Coincidencia exacta por nombre (ya es precisa, no se filtra por equipo)
    let match = githubExercisesList.find(e => e.name.toLowerCase() === terminoBusqueda);
    if (match) return match;

    // 4. El nombre del dataset incluye el término de búsqueda. Entre TODOS los
    // candidatos que cumplan el equipo esperado, se prefiere el de nombre más
    // corto (suele ser la variante "base", no una variación específica).
    let candidatos = githubExercisesList.filter(e => e.name.toLowerCase().includes(terminoBusqueda));
    let candidatosConEquipo = candidatos.filter(c => candidatoCumpleEquipo(c, equipoEsperado));
    if (candidatosConEquipo.length > 0) {
      candidatosConEquipo.sort((a, b) => a.name.length - b.name.length);
      return candidatosConEquipo[0];
    }

    // 5. Intersección de palabras clave, con el mismo filtro de equipo.
    const palabrasClave = terminoBusqueda.split(/\s+/).filter(w => w.length > 2);
    if (palabrasClave.length > 0) {
      let candidatos2 = githubExercisesList.filter(e => palabrasClave.every(w => e.name.toLowerCase().includes(w)));
      let candidatos2ConEquipo = candidatos2.filter(c => candidatoCumpleEquipo(c, equipoEsperado));
      if (candidatos2ConEquipo.length > 0) {
        candidatos2ConEquipo.sort((a, b) => a.name.length - b.name.length);
        return candidatos2ConEquipo[0];
      }
    }

    // 6. Si había una pista de equipo clara pero ningún candidato la cumple,
    // preferimos NO mostrar un ejercicio del equipo equivocado: se retorna
    // null para que el llamador caiga al GIF genérico de categoría (honesto)
    // en vez de una imagen específica pero incorrecta.
    return null;
  }

  // Interfaz de integración oficial expuesta globalmente
  window.obtenerEjercicioDeRepositorio = function (nombre, fallbackObj) {
    if (!nombre) return { nombre: 'Ejercicio No Especificado', explicacion_tecnica: 'Sin guía.', url_gif: '' };

    // Caso 1: el objeto ya viene con datos de GitHub (fue inyectado por
    // integrarEjerciciosEnBaseDeDatosGlobal, así que ya trae url_gif /
    // real_gif_url correctos calculados por el adaptador).
    if (fallbackObj && fallbackObj.github_id) {
      return {
        nombre: nombre,
        explicacion_tecnica: fallbackObj.ejecucion,
        url_gif: fallbackObj.url_gif,
        real_gif_url: fallbackObj.real_gif_url,
        url_gif_frame2: fallbackObj.url_gif_frame2,
        url_gif_frame2_fallback: fallbackObj.url_gif_frame2_fallback,
        atribucion: fallbackObj.atribucion || '',
        github_id: fallbackObj.github_id,
        github_name: fallbackObj.github_name
      };
    }

    // Caso 2: ejercicio "heredado" (escrito a mano en app.js) — buscamos su
    // equivalente en el dataset para poder mostrar un GIF real.
    const matchingGithubEx = buscarCoincidenciaEnDataset(nombre);

    if (matchingGithubEx) {
      const explicacion = matchingGithubEx.descripcionEs || 'Sin instrucciones disponibles.';
      const gifUrls = ExercisesAdapter.gifUrls(matchingGithubEx);

      return {
        nombre: nombre,
        explicacion_tecnica: explicacion,
        url_gif: gifUrls[0] || '',
        real_gif_url: gifUrls[0] || '',
        url_gif_frame2: gifUrls[1] || '',
        url_gif_frame2_fallback: gifUrls[1] || '',
        atribucion: matchingGithubEx.licenseAuthor
          ? `Imagen: ${matchingGithubEx.licenseAuthor} · wger.de (${matchingGithubEx.licenseShort})`
          : `Imagen: wger.de (${matchingGithubEx.licenseShort})`,
        github_id: matchingGithubEx.id,
        github_name: matchingGithubEx.name
      };
    }

    // Caso 3: sin dataset cargado o sin coincidencia -> fallback por categoría
    const categoriaClean = (fallbackObj?.categoria || '').toLowerCase().trim();
    const fallbackGif = FALLBACK_GIFS_POR_CATEGORIA[categoriaClean] || GENERIC_FALLBACK_IMG;

    return {
      nombre: nombre,
      explicacion_tecnica:
        fallbackObj?.ejecucion ||
        fallbackObj?.explicacion_tecnica ||
        'Realiza el ejercicio controlando el tempo de ejecución. Asegura mantener el rango de movimiento completo y la columna neutra durante toda la serie.',
      url_gif: fallbackGif,
      real_gif_url: fallbackGif
    };
  };

  // Compatibilidad con app.js: existían 3 llamadas directas a
  // `window.resolverImagenEjercicio(nombre, githubName)` (catálogo de
  // ejercicios de un día, tarjetas del plan de IA) que se habían quedado
  // sin función tras la reescritura. Se restaura con la lógica correcta:
  // busca el registro real en el dataset (por github_name o por nombre) y
  // devuelve su GIF real, en vez de adivinar un nombre de archivo.
  window.resolverImagenEjercicio = function (ejercicioNombre, githubName) {
    if (isDatasetLoaded && githubExercisesList.length > 0) {
      let record = null;
      if (githubName) {
        const target = githubName.toLowerCase().trim();
        record = githubExercisesList.find(e => e.name.toLowerCase() === target);
      }
      if (!record) {
        record = buscarCoincidenciaEnDataset(ejercicioNombre);
      }
      if (record) {
        const urls = ExercisesAdapter.gifUrls(record);
        if (urls[0]) return urls[0];
      }
    }
    // Sin coincidencia o dataset aún no cargado -> placeholder genérico
    // (los 3 usos en app.js ya tienen su propio onerror -> SVG_PLACEHOLDER).
    return GENERIC_FALLBACK_IMG;
  };

  // Miniatura estática (más liviana que el GIF) para usar en catálogos tipo
  // grilla, p. ej. la biblioteca visual. Devuelve '' si el ejercicio no
  // proviene del dataset de GitHub (los ejercicios escritos a mano no tienen
  // imagen propia todavía).
  window.obtenerThumbnailEjercicio = function (ejercicioLocal) {
    if (!ejercicioLocal || !ejercicioLocal.github_id) return '';
    return ejercicioLocal.url_thumbnail || '';
  };

  // Intenta cargar, en orden, cada URL de una lista en un <img>; si todas
  // fallan cae al placeholder final indicado.
  function encadenarFallbackImagen(imgEl, urls, fallbackFinal, onFallbackFinal) {
    const cola = (urls || []).filter(Boolean).slice();
    function intentarSiguiente() {
      if (cola.length === 0) {
        imgEl.src = fallbackFinal;
        if (onFallbackFinal) onFallbackFinal();
        return;
      }
      imgEl.src = cola.shift();
    }
    imgEl.addEventListener('error', function onError() {
      if (cola.length > 0) {
        intentarSiguiente();
      } else {
        imgEl.removeEventListener('error', onError);
        imgEl.src = fallbackFinal;
        if (onFallbackFinal) onFallbackFinal();
      }
    });
  }

  // Controlador de Modal para la Interfaz de Usuario
  window.mostrarDemostracionEjercicio = function (nombre) {
    // Corta cualquier animación flip-book previa si el modal se reutiliza
    // para otro ejercicio (si no, se acumulan intervalos alternando la
    // imagen de un ejercicio distinto sobre el nuevo modal).
    if (window._demoFlipbookInterval) {
      clearInterval(window._demoFlipbookInterval);
      window._demoFlipbookInterval = null;
    }

    let fallbackObj = null;
    if (window.ejerciciosDB && Array.isArray(window.ejerciciosDB)) {
      fallbackObj = window.ejerciciosDB.find(e => e.nombre === nombre);
    }

    const ej = window.obtenerEjercicioDeRepositorio(nombre, fallbackObj);

    const categoriaClean = (fallbackObj?.categoria || ej.categoria || '').toLowerCase().trim();
    const fallbackGifCategoria = FALLBACK_GIFS_POR_CATEGORIA[categoriaClean] || GENERIC_FALLBACK_IMG;

    let modal = document.getElementById('modal-demo-ejercicio');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-demo-ejercicio';
      modal.className = 'modal-overlay';
      modal.style.zIndex = '110000';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.background = 'rgba(5, 8, 15, 0.85)';
      modal.style.backdropFilter = 'blur(12px)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '16px';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; width: 100%; background: linear-gradient(145deg, #111827 0%, #0b1120 100%); border: 1px solid var(--border-color); box-shadow: 0 25px 60px rgba(0,0,0,0.8); border-radius: var(--radius-xl); padding: 24px; position: relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
          <h3 id="modal-demo-title-text" style="font-family:var(--font-heading); font-size:16px; font-weight:800; color:#fff; margin:0; display:flex; align-items:center; gap:8px; line-height:1.4;">
            <span>📺 Demostración: ${ej.nombre}</span>
          </h3>
          <button type="button" onclick="cerrarModalDemoEjercicio()" style="padding:4px 10px; font-size:18px; cursor:pointer; background:transparent; border:none; color:var(--text-muted); font-weight:bold;">✕</button>
        </div>

        <div style="text-align:center; margin-bottom:16px;">
          <div id="modal-demo-id-text" style="font-size:11.5px; color:#38bdf8; margin-bottom:12px; font-family:monospace;">
            ${ej.github_name ? `ID: ${ej.github_id} (${ej.github_name})` : ``}
          </div>
          <div class="ej-img-box ej-img-box--modal" style="border-radius:var(--radius-lg);">
            <img id="modal-demo-img" alt="${ej.nombre}">
          </div>
          ${ej.atribucion ? `<div style="font-size:10px; color:var(--text-dim,#64748b); margin-top:6px;">${ej.atribucion} · CC-BY-SA</div>` : ''}
        </div>

        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; max-height: 180px; overflow-y: auto;">
          <h5 style="color:#38bdf8; font-size:12px; font-weight:700; margin:0 0 6px 0; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:4px;">
            <span>💡 Guía de Ejecución Técnica</span>
          </h5>
          <p style="color:var(--text-muted); font-size:13px; line-height:1.5; margin:0; text-align:left; white-space:pre-line;">${ej.explicacion_tecnica}</p>
        </div>

        <div style="display:flex; justify-content:flex-end; margin-top:20px; border-top:1px solid var(--border-color); padding-top:12px;">
          <button type="button" class="btn-primary" onclick="cerrarModalDemoEjercicio()" style="padding:8px 16px; font-size:13px; font-weight:700; border-radius:var(--radius-md); cursor:pointer;">Entendido</button>
        </div>
      </div>
    `;

    // Cadena de respaldo: GIF específico (CDN 1) -> GIF específico (CDN 2) ->
    // GIF genérico de categoría -> placeholder SVG. Antes, el primer intento
    // (URL adivinada a partir del nombre) siempre fallaba y saltaba directo
    // al genérico de categoría, así que el ejercicio real casi nunca se veía.
    const imgEl = modal.querySelector('#modal-demo-img');
    if (imgEl) {
      const urls = [ej.url_gif, ej.real_gif_url].filter(Boolean);
      encadenarFallbackImagen(imgEl, urls, fallbackGifCategoria, function () {
        const title = document.getElementById('modal-demo-title-text');
        if (title) title.innerHTML = `<span>📺 Demostración (Respaldo): ${ej.nombre}</span>`;
        const sub = document.getElementById('modal-demo-id-text');
        if (sub) sub.innerText = `Respaldo por Categoría (${categoriaClean})`;
        // Si incluso el genérico de categoría falla, caer al SVG.
        imgEl.addEventListener('error', function () {
          imgEl.src = SVG_PLACEHOLDER;
          if (sub) sub.innerText = 'Sin animación disponible (Muestra Vectorial)';
        }, { once: true });
      });
      // Efecto "flip-book": free-exercise-db no trae GIF animado, pero sí
      // hasta 2 fotos por ejercicio (posición inicial y final). Si la foto
      // principal carga bien (sin caer a un respaldo) y existe la segunda,
      // se alternan para simular el movimiento — sin depender de ningún
      // GIF/API externo. Ritmo pausado (1.8s por foto) a propósito: es una
      // guía técnica para entender la postura, no una animación fluida; muy
      // rápido no da tiempo a fijarse en la posición de cada frame. Si la
      // principal tuvo que caer a un respaldo (CDN2 / categoría / SVG), se
      // deja estática: es preferible una imagen correcta y quieta a
      // "animar" frames que no correspondan al mismo ejercicio.
      //
      // IMPORTANTE: el listener de 'load' se registra ANTES de asignar
      // `imgEl.src` (más abajo). Si se registrara después, una imagen ya
      // cacheada por el navegador (visitas repetidas al mismo ejercicio)
      // podía disparar 'load' antes de que el listener existiera, y la
      // animación nunca arrancaba — exactamente el bug reportado de
      // "solo un ejercicio anima, el resto no".
      const frame0Url = urls[0];
      const frame2Url = ej.url_gif_frame2;
      function iniciarFlipbookSiCorresponde() {
        if (imgEl.src !== frame0Url) return; // ya cayó a un respaldo, no animar
        const preload = new Image();
        preload.onload = function () {
          if (imgEl.src !== frame0Url) return; // pudo cambiar mientras precargaba
          let mostrandoFrame0 = true;
          window._demoFlipbookInterval = setInterval(() => {
            if (!document.body.contains(imgEl)) {
              clearInterval(window._demoFlipbookInterval);
              window._demoFlipbookInterval = null;
              return;
            }
            mostrandoFrame0 = !mostrandoFrame0;
            imgEl.src = mostrandoFrame0 ? frame0Url : frame2Url;
          }, 1800);
        };
        preload.src = frame2Url;
      }
      if (frame0Url && frame2Url) {
        imgEl.addEventListener('load', function onFrame0Loaded() {
          imgEl.removeEventListener('load', onFrame0Loaded);
          iniciarFlipbookSiCorresponde();
        }, { once: true });
      }

      // Dispara el primer intento (después de registrar el listener de arriba)
      if (urls.length > 0) {
        imgEl.src = urls[0];
      } else {
        imgEl.src = fallbackGifCategoria;
      }
      // Respaldo extra: si la imagen ya estaba en caché, el navegador puede
      // marcarla 'complete' de inmediato al asignar `src`, sin disparar
      // 'load' async. Se cubre ese caso también.
      if (frame0Url && frame2Url && imgEl.complete && imgEl.src === frame0Url) {
        iniciarFlipbookSiCorresponde();
      }
    }

    modal.style.display = 'flex';
  };

  window.cerrarModalDemoEjercicio = function () {
    const modal = document.getElementById('modal-demo-ejercicio');
    if (modal) modal.style.display = 'none';
    if (window._demoFlipbookInterval) {
      clearInterval(window._demoFlipbookInterval);
      window._demoFlipbookInterval = null;
    }
  };

  // ── FLUJO CENTRALIZADO DE ENTRENAMIENTO DESDE LA FICHA DEL ATLETA ──
  // (sin cambios de lógica respecto a la versión anterior)
  window.abrirSelectorProgramacionEntrenamiento = function (nombreCliente) {
    let modal = document.getElementById('modal-selector-programacion');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-selector-programacion';
      modal.className = 'modal-overlay';
      modal.style.zIndex = '111000';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.background = 'rgba(5, 8, 15, 0.85)';
      modal.style.backdropFilter = 'blur(12px)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '16px';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 440px; width: 100%; background: linear-gradient(145deg, #111827 0%, #0b1120 100%); border: 1px solid var(--border-color); box-shadow: 0 25px 60px rgba(0,0,0,0.8); border-radius: var(--radius-xl); padding: 24px; text-align: center;">
        <h3 style="font-family:var(--font-heading); font-size:18px; font-weight:800; color:#fff; margin-top:0; margin-bottom:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
          <span>🏋️ Programar Entrenamiento</span>
        </h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">Elige el método de diseño de rutina para: <strong style="color:#fff;">${nombreCliente}</strong></p>

        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
          <button type="button" class="btn-primary" onclick="ejecutarProgramacionIA('${nombreCliente.replace(/'/g, "\\'")}')" style="padding:14px; font-weight:800; display:flex; justify-content:center; align-items:center; gap:8px; border-radius:var(--radius-md); cursor:pointer;">
            ✨ Generar con IA Biomecánica
          </button>
          <button type="button" class="btn-secondary" onclick="ejecutarProgramacionManual('${nombreCliente.replace(/'/g, "\\'")}')" style="padding:14px; font-weight:800; display:flex; justify-content:center; align-items:center; gap:8px; border-radius:var(--radius-md); border-color:var(--accent-green); color:var(--accent-green); cursor:pointer;">
            ✏️ Diseñar Plan Manual
          </button>
        </div>

        <div style="display:flex; justify-content:flex-end;">
          <button type="button" class="btn-secondary" onclick="cerrarSelectorProgramacion()" style="font-size:12px; padding:6px 12px; cursor:pointer;">Cancelar</button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  };

  window.cerrarSelectorProgramacion = function () {
    const modal = document.getElementById('modal-selector-programacion');
    if (modal) modal.style.display = 'none';
  };

  window.ejecutarProgramacionIA = function (nombreCliente) {
    window.cerrarSelectorProgramacion();

    const modalDetalle = document.getElementById('modal-detalle-cliente');
    if (modalDetalle) modalDetalle.classList.add('hidden');

    if (typeof window.navegarA === 'function') {
      window.navegarA('generate');
    }

    const selectCliente = document.getElementById('gen-cliente-select');
    if (selectCliente) {
      selectCliente.value = nombreCliente;
      selectCliente.dispatchEvent(new Event('change'));
    }
  };

  window.ejecutarProgramacionManual = function (nombreCliente) {
    window.cerrarSelectorProgramacion();

    const modalDetalle = document.getElementById('modal-detalle-cliente');
    if (modalDetalle) modalDetalle.classList.add('hidden');

    if (typeof window.abrirModalPlanManual === 'function') {
      window.abrirModalPlanManual(nombreCliente);
    }
  };

  // Cambiar pestaña del día seleccionado en el modal
  window.cambiarSesionDiaModal = function (diaNum) {
    const btns = document.querySelectorAll('.day-tab-btn');
    btns.forEach((btn, idx) => {
      if (idx === (diaNum - 1)) {
        btn.classList.add('active');
        btn.style.background = 'rgba(56,189,248,0.15)';
        btn.style.borderColor = '#38bdf8';
        btn.style.color = '#38bdf8';
      } else {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.color = 'var(--text-muted)';
      }
    });

    window.renderizarDiaEspecificoModal(diaNum);
  };

  // Renderiza los bloques del día seleccionado
  window.renderizarDiaEspecificoModal = function (diaNum) {
    const container = document.getElementById('modal-dias-bloques-container');
    if (!container) return;

    if (!window.bloquesPorDia) return;
    const session = window.bloquesPorDia.find(b => b.dia === diaNum);
    if (!session) {
      container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Día no programado aún.</p>`;
      return;
    }

    const renderBlockCards = (bloque, label, titleColor) => {
      if (!bloque || bloque.length === 0) return '';
      return `
        <div style="margin-bottom:14px;">
          <h4 style="color:${titleColor}; font-size:14px; margin-bottom:8px; font-family:var(--font-heading);">${label}</h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${bloque.map(r => `
              <div style="background:var(--bg-card); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; gap:12px; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:12px; flex:1;">
                  <div class="${window.claseImagenEjercicio(r.url_gif)}" style="width:40px; height:40px; border-radius:6px;">
                    <img src="${r.url_gif}" alt="${r.ej}" onerror="if(this.src!=='${r.real_gif_url}'){this.src='${r.real_gif_url}';}else{this.onerror=null;this.classList.add('is-placeholder');this.src=window.SVG_PLACEHOLDER;}">
                  </div>
                  <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                      <strong style="color:#fff; font-size:13px;">${r.ej}</strong>
                      <button class="btn-demo-ejercicio" onclick="window.mostrarDemostracionEjercicio('${r.ej.replace(/'/g, "\\'")}')" style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.25); padding:1px 6px; border-radius:4px; font-size:9px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:2px;">
                        📺 Demo
                      </button>
                    </div>
                    <div style="color:var(--text-muted); font-size:11px; margin-top:2px;">💡 ${r.nota}</div>
                  </div>
                </div>
                <span style="color:var(--accent-green); font-weight:700; font-size:13px; text-align:right; flex-shrink:0; min-width:50px;">${r.series}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    };

    container.innerHTML = `
      ${renderBlockCards(session.bloqueActivacion, '🔹 Bloque 1: Activación & Movilidad Miofascial', '#60a5fa')}
      ${renderBlockCards(session.bloqueFuerza, '🔹 Bloque 2: Fuerza Base Adaptada', 'var(--accent-green)')}
      ${renderBlockCards(session.bloqueAsistencia, '🔹 Bloque 3: Asistencia Vectorial & Aislamiento', '#fbbf24')}
      ${renderBlockCards(session.bloqueIsometria, '🔹 Bloque 4: Isometría & Estabilización de Core', '#c084fc')}
    `;
  };

  // Llenar el selector de atletas en la pestaña de planes y sincronizar su biometría
  window.inicializarSelectorAtletasPlanes = function () {
    const select = document.getElementById('plans-atleta-select');
    if (!select) return;

    const atletas = window.clientes || [];
    select.innerHTML = atletas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');

    if (atletas.length > 0) {
      const activeAtleta = window.clienteObjSeleccionado?.nombre || atletas[0].nombre;
      select.value = activeAtleta;
      window.sincronizarAtletaEnModuloPlanes(activeAtleta);
    }
  };

  // Escuchar cambio del atleta en modulo de planes
  window.sincronizarAtletaEnModuloPlanes = function (nombreCliente) {
    const cliente = (window.clientes || []).find(c => c.nombre === nombreCliente);
    if (!cliente) return;

    const aiObjetivoSelect = document.getElementById('ai-objetivo');
    if (aiObjetivoSelect) {
      const obj = (cliente.objetivo || '').toLowerCase();
      if (obj.includes('hipertrofia')) aiObjetivoSelect.value = 'hipertrofia';
      else if (obj.includes('fuerza')) aiObjetivoSelect.value = 'fuerza';
      else if (obj.includes('definicion') || obj.includes('grasa')) aiObjetivoSelect.value = 'definicion';
      else if (obj.includes('rehabilitacion') || obj.includes('lesion')) aiObjetivoSelect.value = 'readaptacion';
      else aiObjetivoSelect.value = 'hipertrofia';
    }

    const aiNivelSelect = document.getElementById('ai-nivel');
    if (aiNivelSelect) {
      const lvl = (cliente.nivel || 'intermedio').toLowerCase();
      if (lvl.includes('principiante')) aiNivelSelect.value = 'principiante';
      else if (lvl.includes('avanzado')) aiNivelSelect.value = 'avanzado';
      else aiNivelSelect.value = 'intermedio';
    }

    const aiRestriccionInput = document.getElementById('ai-restriccion-texto');
    if (aiRestriccionInput) {
      aiRestriccionInput.value = (cliente.lesiones || []).map(l => l.condicion).join(', ');
    }

    // Tope de riesgo sugerido según el IMC del atleta (medidas corporales
    // reales del expediente, no solo objetivo/nivel declarados). Un IMC alto
    // suele acompañar menor tolerancia articular/cardiovascular a ejercicios
    // de riesgo alto en las primeras semanas; se autocompleta como punto de
    // partida razonable, pero el coach lo puede cambiar libremente después
    // — igual que ya pasa con objetivo y nivel.
    const aiRiesgoSelect = document.getElementById('ai-riesgo-max');
    if (aiRiesgoSelect && cliente.imc) {
      if (cliente.imc >= 30) aiRiesgoSelect.value = 'bajo';
      else if (cliente.imc >= 25) aiRiesgoSelect.value = 'moderado';
      else if (cliente.nivel && cliente.nivel.toLowerCase().includes('avanzado')) aiRiesgoSelect.value = 'alto';
      else aiRiesgoSelect.value = 'moderado';
    }

    const checkIds = ['ai-chk-lumbar', 'ai-chk-rodilla', 'ai-chk-hombro', 'ai-chk-cadera', 'ai-chk-tobillo', 'ai-chk-codo'];
    checkIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });

    (cliente.lesiones || []).forEach(l => {
      const cond = l.condicion.toLowerCase();
      if (cond.includes('lumbar') || cond.includes('espalda')) {
        const chk = document.getElementById('ai-chk-lumbar');
        if (chk) chk.checked = true;
      }
      if (cond.includes('rodilla')) {
        const chk = document.getElementById('ai-chk-rodilla');
        if (chk) chk.checked = true;
      }
      if (cond.includes('hombro')) {
        const chk = document.getElementById('ai-chk-hombro');
        if (chk) chk.checked = true;
      }
      if (cond.includes('cadera')) {
        const chk = document.getElementById('ai-chk-cadera');
        if (chk) chk.checked = true;
      }
      if (cond.includes('tobillo') || cond.includes('pie')) {
        const chk = document.getElementById('ai-chk-tobillo');
        if (chk) chk.checked = true;
      }
      if (cond.includes('codo') || cond.includes('muñeca')) {
        const chk = document.getElementById('ai-chk-codo');
        if (chk) chk.checked = true;
      }
    });

    if (typeof sincronizarChips === 'function') sincronizarChips();
    if (typeof actualizarVistaAsistente === 'function') actualizarVistaAsistente();
  };

  // Funciones del coach para editar las tarjetas de IA directamente
  window.actualizarNombreEjercicioIA = function (diaIdx, ejIdx, nuevoNombre) {
    if (window._aiPlanActual && window._aiPlanActual.dias[diaIdx]) {
      const ej = window._aiPlanActual.dias[diaIdx].ejercicios[ejIdx];
      if (ej) {
        ej.nombre = nuevoNombre;
        const repoEj = window.obtenerEjercicioDeRepositorio(nuevoNombre);
        ej.explicacion_tecnica = repoEj.explicacion_tecnica;
        ej.url_gif = repoEj.url_gif;
        ej.real_gif_url = repoEj.real_gif_url;
      }
    }
  };

  window.actualizarPrescripcionDiaIA = function (diaIdx, ejIdx, nuevaPrescripcion) {
    if (window._aiPlanActual && window._aiPlanActual.dias[diaIdx]) {
      const ej = window._aiPlanActual.dias[diaIdx].ejercicios[ejIdx];
      if (ej) {
        ej.customPrescripcion = nuevaPrescripcion;
      }
    }
  };

})(window);
