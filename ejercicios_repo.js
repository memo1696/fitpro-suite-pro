/**
 * FitPro Suite Pro - Repositorio Oficial y Conector de Free Exercise DB
 * Conecta dinámicamente y consume los datos oficiales y recursos del repositorio:
 * https://github.com/yuhonas/free-exercise-db
 * Integra la totalidad de los ejercicios en la base de datos central de la app.
 *
 * ── MIGRACIÓN DE DATASET (hasaneyldrm/exercises-dataset → yuhonas/free-exercise-db) ──
 * El dataset anterior fue reemplazado por free-exercise-db. Cambios de forma
 * relevantes entre ambos JSON, todos absorbidos en ExercisesAdapter:
 *  1. `id`: antes numérico ("1461"), ahora un slug de texto ("Barbell_Squat").
 *     El mapeo manual estático por ID quedó obsoleto (ver nota en esa sección).
 *  2. Músculo principal: antes `target` (string), ahora `primaryMuscles`
 *     (array). La categoría local (pecho/espalda/piernas/...) ya no puede
 *     derivarse de `category` (que ahora es el TIPO de ejercicio: "strength",
 *     "cardio", "stretching"...) sino de `primaryMuscles[0]`.
 *  3. Instrucciones: antes bilingües (`instructions.es` / `instructions.en`,
 *     más `instruction_steps` en pasos). free-exercise-db solo trae
 *     `instructions` como array de strings EN INGLÉS, sin español. Para no
 *     perder el español se agregó `traducciones_ejercicios_es.json` (mapa
 *     id -> texto en español), pre-traducido una sola vez y servido como
 *     archivo estático del mismo origen (sin depender de ningún servicio de
 *     traducción en producción). Se carga en `cargarTraducciones()` y
 *     `toEjercicioLocal` la usa como primera opción, con el inglés del
 *     dataset como respaldo si un ID no tiene traducción.
 *  4. Medios: antes había GIF animado (`gif_url`) + imagen estática (`image`)
 *     por separado. free-exercise-db solo trae `images` (array de 0-2 fotos
 *     estáticas, ej. "Barbell_Squat/0.jpg"), sin animación. Se conservan los
 *     nombres de campo `url_gif` / `real_gif_url` por compatibilidad con el
 *     resto del archivo y con app.js, pero ahora apuntan a fotos, no a GIFs.
 *  5. Equipamiento: vocabulario distinto (p. ej. "bands" en vez de "band",
 *     "body only" en vez de "body weight", "e-z curl bar" en vez de
 *     "ez-barbell"). Ver `mapEquipoLocal` y `EQUIPO_HINTS`.
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
    datasetUrl: 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json',
    // Traducción al español de las instrucciones (free-exercise-db solo trae
    // inglés). Archivo propio, pre-traducido y servido desde el mismo origen
    // que la app (no depende de ningún servicio de traducción en producción).
    // Mapa { [id del ejercicio]: "texto en español" }.
    translationsUrl: 'traducciones_ejercicios_es.json',
    // Orden de CDNs a probar para imágenes. jsDelivr primero (cachea y sirve
    // más rápido); GitHub raw como respaldo si jsDelivr falla. Las rutas del
    // dataset son relativas a la carpeta `exercises/` del repo (ej.
    // "Barbell_Squat/0.jpg" -> ".../exercises/Barbell_Squat/0.jpg").
    cdnBases: [
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
    ],
    dbName: 'fitpro_exercises_cache',
    dbStore: 'dataset',
    dbVersion: 3,          // subido: la forma del objeto normalizado cambió con la migración de dataset
    // Clave de caché ligada al dataset de origen: evita servir datos con la
    // forma vieja (del dataset anterior) desde IndexedDB tras la migración.
    cacheKey: 'exercises_normalized_free_exercise_db',
    cacheTtlMs: 1000 * 60 * 60 * 24 * 7, // 7 días
    maxEsperaEjerciciosDB: 50 // reintentos de 100ms (~5s) antes de rendirse
  };

  let githubExercisesList = []; // ya normalizado (ver ExercisesAdapter.normalize)
  let isDatasetLoaded = false;
  let TRADUCCIONES_ES = {}; // { [id]: "instrucciones en español" }, ver cargarTraducciones()

  const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="background:%230f172a;"><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><rect x="5" y="8" width="2" height="8" rx="1"/><rect x="17" y="8" width="2" height="8" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`;
  window.SVG_PLACEHOLDER = SVG_PLACEHOLDER;

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
        id: raw.id,
        name: raw.name,
        // Tipo de ejercicio ("strength", "cardio", "stretching"...), NO es
        // grupo muscular en este dataset. Se conserva por si se agrega un
        // filtro por tipo más adelante; la categoría local sale de
        // `primaryMuscles` (ver mapCategoriaLocal).
        category: raw.category || '',
        level: raw.level || '',
        primaryMuscles: raw.primaryMuscles || [],
        secondaryMuscles: raw.secondaryMuscles || [],
        equipment: raw.equipment || '',
        // Array de strings en inglés (sin traducción al español en este dataset).
        instructions: raw.instructions || [],
        // Rutas RELATIVAS tal cual las entrega el dataset, p. ej.
        // ["Barbell_Squat/0.jpg", "Barbell_Squat/1.jpg"]. Son fotos estáticas,
        // no hay GIF animado en este dataset.
        images: raw.images || []
      };
    },

    // Reduce el array crudo al subconjunto que la app realmente consume,
    // antes de guardarlo en caché local.
    normalizeAll(rawArray) {
      return (rawArray || []).map(r => this.normalize(r));
    },

    // Construye la lista de URLs absolutas (una por CDN configurado) para una
    // ruta relativa del dataset.
    resolveUrls(relativePath) {
      if (!relativePath) return [];
      return CONFIG.cdnBases.map(base => base + relativePath);
    },
    // Se mantiene el nombre `gifUrls` por compatibilidad con el resto del
    // archivo y con app.js, aunque ahora resuelve fotos estáticas: primero
    // las URLs (jsDelivr + raw) de la imagen 0, luego las de la imagen 1 si
    // existe, como respaldo adicional del mismo ejercicio.
    gifUrls(record) {
      const imgs = record.images || [];
      return [...this.resolveUrls(imgs[0]), ...this.resolveUrls(imgs[1])];
    },
    imageUrls(record) { return this.gifUrls(record); },

    // Músculo principal del dataset externo -> categoría fija del catálogo
    // local (cuadriceps, isquiotibiales, gluteos, pecho, espalda, hombros,
    // biceps, triceps, core, pantorrillas) usada por los filtros de la
    // biblioteca. free-exercise-db no agrupa por "parte del cuerpo" como el
    // dataset anterior, así que esto se deriva de `primaryMuscles[0]`.
    // Músculos sin categoría local dedicada (antebrazos, trapecios, cuello,
    // abductores/aductores) se agrupan en la categoría más cercana.
    mapCategoriaLocal(record) {
      const primary = ((record.primaryMuscles && record.primaryMuscles[0]) || '').toLowerCase();
      if (primary.includes('chest')) return 'pecho';
      if (primary.includes('lats') || primary.includes('middle back') || primary.includes('lower back') || primary.includes('traps')) return 'espalda';
      if (primary.includes('shoulder')) return 'hombros';
      if (primary.includes('abdominal') || primary.includes('neck')) return 'core';
      if (primary.includes('quadriceps') || primary.includes('adductor') || primary.includes('abductor')) return 'cuadriceps';
      if (primary.includes('hamstring')) return 'isquiotibiales';
      if (primary.includes('glute')) return 'gluteos';
      if (primary.includes('calves')) return 'pantorrillas';
      if (primary.includes('bicep') || primary.includes('forearm')) return 'biceps';
      if (primary.includes('tricep')) return 'triceps';
      return 'core';
    },

    mapEquipoLocal(record) {
      const rawEquip = (record.equipment || '').toLowerCase();
      if (rawEquip.includes('e-z curl bar') || rawEquip.includes('ez curl')) return 'Barra';
      if (rawEquip.includes('barbell')) return 'Barra';
      if (rawEquip.includes('dumbbell')) return 'Mancuerna';
      if (rawEquip.includes('kettlebell')) return 'Mancuerna';
      if (rawEquip.includes('cable')) return 'Polea';
      if (rawEquip.includes('bands')) return 'Banda';
      if (rawEquip.includes('machine')) return 'Máquina';
      // "body only", "other", "foam roll", "medicine ball", "exercise ball",
      // equipamiento vacío/null -> sin equivalente local claro.
      return 'Peso Corporal';
    },

    // Registro normalizado -> objeto con la MISMA forma que ya usa
    // `ejerciciosDB` en app.js. Este es el único punto de contacto entre el
    // dataset externo y el esquema interno de la app.
    toEjercicioLocal(record) {
      const ejecucion =
        TRADUCCIONES_ES[record.id] ||
        (record.instructions && record.instructions.length && record.instructions.join(' ')) ||
        'Realiza el ejercicio controlando el tempo de ejecución. Asegura mantener la postura correcta.';

      const gifUrls = this.gifUrls(record);
      const imageUrls = this.imageUrls(record);
      // Segunda foto (posición final del movimiento) para el efecto
      // "flip-book": alternarla con la foto 0 en el <img> simula animación
      // sin necesitar un GIF real. Con su propio respaldo de CDN (raw
      // GitHub si jsDelivr falla), igual que url_gif/real_gif_url.
      const frame2Urls = this.resolveUrls((record.images || [])[1]);

      return {
        nombre: capitalizeWords(record.name),
        categoria: this.mapCategoriaLocal(record),
        musculoPrimario: capitalizeFirst((record.primaryMuscles && record.primaryMuscles[0]) || this.mapCategoriaLocal(record)),
        equipamiento: this.mapEquipoLocal(record),
        riesgo: 'Bajo',
        musculos: (record.primaryMuscles || []).concat(record.secondaryMuscles || []).join(', '),
        ejecucion,
        // Propiedades extendidas para carga en modal / biblioteca visual
        github_id: record.id,
        github_name: record.name,
        url_gif: gifUrls[0] || '',
        real_gif_url: gifUrls[1] || gifUrls[0] || '', // se mantiene el nombre por compatibilidad con app.js
        url_gif_frame2: frame2Urls[0] || '',
        url_gif_frame2_fallback: frame2Urls[1] || frame2Urls[0] || '',
        url_thumbnail: imageUrls[0] || '',
        url_thumbnail_fallback: imageUrls[1] || imageUrls[0] || ''
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
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return this._dbPromise;
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

  // Traducciones: archivo propio (mismo origen), no un servicio externo, así
  // que si falla o no existe no es fatal para el resto de la integración.
  async function cargarTraducciones() {
    try {
      const res = await fetch(CONFIG.translationsUrl);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      TRADUCCIONES_ES = await res.json();
    } catch (err) {
      console.warn('⚠️ No se pudieron cargar las traducciones al español; se usarán las instrucciones en inglés como respaldo.', err);
    }
  }

  async function cargarDatasetDeEjercicios() {
    try {
      // 0. Traducciones al español (en paralelo no aporta mucho: es un
      // archivo local pequeño; se resuelve antes de normalizar para que
      // tanto la ruta de caché como la de red usen la traducción).
      await cargarTraducciones();

      // 1. Intentar caché local primero (rápido, sin red)
      const cached = await Cache.get(CONFIG.cacheKey);
      if (cached && cached.data && (Date.now() - cached.timestamp) < CONFIG.cacheTtlMs) {
        githubExercisesList = cached.data;
        isDatasetLoaded = true;
        console.log(`✅ ${githubExercisesList.length} ejercicios cargados desde caché local (sin red).`);
        integrarEjerciciosEnBaseDeDatosGlobal();
        return;
      }

      // 2. Descargar del CDN
      console.log('⚡ Conectando al repositorio GitHub Exercises-Dataset...');
      const res = await fetch(CONFIG.datasetUrl);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const rawList = await res.json();

      // 3. Normalizar y RECORTAR antes de guardar (menos campos = menos peso
      //    en IndexedDB; el fetch de red ya pagó el costo de los 17MB, pero
      //    al menos las próximas visitas no lo vuelven a pagar).
      githubExercisesList = ExercisesAdapter.normalizeAll(rawList);
      isDatasetLoaded = true;
      console.log(`✅ Conexión exitosa: ${githubExercisesList.length} ejercicios cargados desde GitHub.`);

      Cache.set(CONFIG.cacheKey, { data: githubExercisesList, timestamp: Date.now() });

      integrarEjerciciosEnBaseDeDatosGlobal();
    } catch (err) {
      console.error('❌ Error al conectar con el dataset de GitHub, usando fallbacks locales:', err);
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
    console.log(`💪 Catálogo ampliado exitosamente: ${agregados} ejercicios de GitHub inyectados en la base de datos (Total: ${window.ejerciciosDB.length}).`);

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
  // RECONSTRUIDO tras la migración a free-exercise-db: los IDs numéricos del
  // dataset anterior ("1461", "0042"...) no existen en este dataset (usa
  // slugs de texto, ej. "Barbell_Squat") y por lo tanto ya no emparejaban con
  // nada. Cada entrada de abajo fue vuelta a verificar a mano contra el
  // catálogo real de free-exercise-db (nombre + equipo). Los ejercicios del
  // mapeo anterior sin equivalente real aquí (abductor de cadera en máquina,
  // remo Pendlay, remo con apoyo en pecho, elevación lateral en máquina,
  // peso muerto rumano unilateral con mancuerna, press declinado agarre
  // estrecho puro, sentadilla búlgara con barra, pull-over en polea) se
  // dejaron FUERA a propósito, igual que antes: caen al emparejamiento
  // automático / GIF genérico de categoría en vez de mostrar un ejercicio
  // con el equipo o movimiento equivocado.
  const MAPEO_MANUAL_ESTATICO_POR_ID = {
    'Sentadilla Trasera con Barra (Back Squat)': 'Barbell_Squat',
    'Sentadilla Frontal con Barra (Front Squat)': 'Front_Barbell_Squat',
    'Press de Banca Plano con Barra (Barbell Bench Press)': 'Barbell_Bench_Press_-_Medium_Grip',
    'Press Inclinado con Mancuernas (30° - 45°)': 'Incline_Dumbbell_Press',
    'Peso Muerto Rumano con Barra (RDL)': 'Romanian_Deadlift',
    'Curl de Bíceps con Barra Z de Pie (EZ-Bar Curl)': 'EZ-Bar_Curl',
    'Extensión de Tríceps en Polea Alta con Cuerda (Cable Pushdown)': 'Triceps_Pushdown',
    'Plancha Abdominal Isométrica (Front Plank)': 'Plank',
    'Aperturas en Máquina Contractora': 'Butterfly', // pec deck / chest fly machine
    'Pec Deck en Máquina': 'Butterfly',
    'Prensa de Piernas 45° Inclinada': 'Leg_Press',
    'Peso Muerto con Mancuernas a Piernas Semirrígidas': 'Stiff-Legged_Dumbbell_Deadlift',
    'Buenos Días con Barra (Good Mornings)': 'Good_Morning',
    'Sissy Squat Libre / Asistido': 'Weighted_Sissy_Squat', // única variante disponible en el dataset
    'Peck Deck Inverso en Máquina (Reverse Flyes)': 'Reverse_Flyes', // versión con mancuerna, no hay variante de máquina
    'Curl Inclinado con Mancuernas (Incline Dumbbell Curl 45°)': 'Incline_Dumbbell_Curl',
    'Extensión Katana Unilateral por Encima de la Cabeza en Polea': 'Cable_Rope_Overhead_Triceps_Extension',
    'Sentadilla Goblet con Kettlebell': 'Goblet_Squat',
    'Peso Muerto Convencional con Barra (Conventional Deadlift)': 'Barbell_Deadlift',
    'Peso Muerto Sumo con Barra': 'Sumo_Deadlift',
    'Curl de Bíceps con Barra Recta (Straight Bar Curl)': 'Barbell_Curl',
    'Dead-Bug con Control Lumbar': 'Dead_Bug',
    'Mountain Climbers con Control (Escaladores)': 'Mountain_Climbers',
    'Elevación de Talones Sentado con Mancuerna sobre Rodillas': 'Dumbbell_Seated_One-Leg_Calf_Raise',
    'Fondos en Paralelas para Pecho (Chest Dips)': 'Dips_-_Chest_Version',
    'Press Francés con Barra Z en Banco Plano (Skull Crushers)': 'EZ-Bar_Skullcrusher',
    'Press Militar de Pie con Barra (Overhead Press OHP)': 'Standing_Military_Press',
    'Sentadilla Búlgara con Mancuernas (Rear Foot Elevated)': 'Split_Squat_with_Dumbbells',
    'Jalón al Pecho en Polea con Agarre Neutro Estrecho': 'Close-Grip_Front_Lat_Pulldown',
    'Curl Alternado de Pie con Mancuernas': 'Dumbbell_Alternate_Bicep_Curl',
    'Aperturas en Máquina Contractora (Peck Deck Flyes)': 'Butterfly',
    'Cruce de Poleas Altas (High-to-Low Cable Flyes)': 'Cable_Crossover',
    'Cruce de Poleas Bajas (Low-to-High Cable Flyes)': 'Low_Cable_Crossover',
    'Aperturas con Poleas al Nivel del Pecho (Mid-Cable Flyes)': 'Flat_Bench_Cable_Flyes',
    'Dominadas Pronas / Neutras (Pull-ups / Chin-ups)': 'Chin-Up',
    'Press de Banca Inclinado con Barra (30°)': 'Barbell_Incline_Bench_Press_-_Medium_Grip'
  };

  // Imágenes por categoría como último recurso visual (si no hay match en el
  // dataset ni éste está cargado aún). free-exercise-db no tiene GIFs
  // animados, así que estas son fotos estáticas de un ejercicio
  // representativo de cada categoría (rutas verificadas contra el dataset).
  const FALLBACK_GIFS_POR_CATEGORIA = {
    cuadriceps: CONFIG.cdnBases[0] + 'Barbell_Squat/0.jpg',
    isquiotibiales: CONFIG.cdnBases[0] + 'Romanian_Deadlift/0.jpg',
    gluteos: CONFIG.cdnBases[0] + 'Barbell_Hip_Thrust/0.jpg',
    pecho: CONFIG.cdnBases[0] + 'Barbell_Bench_Press_-_Medium_Grip/0.jpg',
    espalda: CONFIG.cdnBases[0] + 'Bent_Over_Barbell_Row/0.jpg',
    hombros: CONFIG.cdnBases[0] + 'Dumbbell_Shoulder_Press/0.jpg',
    biceps: CONFIG.cdnBases[0] + 'Barbell_Curl/0.jpg',
    triceps: CONFIG.cdnBases[0] + 'Triceps_Pushdown/0.jpg',
    core: CONFIG.cdnBases[0] + '3_4_Sit-Up/0.jpg',
    pantorrillas: CONFIG.cdnBases[0] + 'Standing_Calf_Raises/0.jpg'
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
  // Vocabulario de `equipment` actualizado al de free-exercise-db (ya no
  // existen "lever"/"sled"/"smith"/"t-bar"; "band" ahora es "bands", "body
  // weight" ahora es "body only", "ez-barbell" ahora es "e-z curl bar").
  const EQUIPO_HINTS = [
    { es: ['mancuernas', 'mancuerna'], en: ['dumbbell'] },
    { es: ['barra z', 'barra ez', 'ez-bar', 'ez bar'], en: ['e-z curl bar'] },
    { es: ['barra'], en: ['barbell'] },
    { es: ['polea', 'cable'], en: ['cable'] },
    { es: ['máquina', 'maquina'], en: ['machine'] },
    { es: ['banda'], en: ['bands'] },
    { es: ['kettlebell', 'pesa rusa'], en: ['kettlebell'] },
    { es: ['peso corporal'], en: ['body only'] }
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
    const eq = (candidato.equipment || '').toLowerCase();
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
        github_id: fallbackObj.github_id,
        github_name: fallbackObj.github_name
      };
    }

    // Caso 2: ejercicio "heredado" (escrito a mano en app.js) — buscamos su
    // equivalente en el dataset para poder mostrar un GIF real.
    const matchingGithubEx = buscarCoincidenciaEnDataset(nombre);

    if (matchingGithubEx) {
      const explicacion =
        TRADUCCIONES_ES[matchingGithubEx.id] ||
        (matchingGithubEx.instructions && matchingGithubEx.instructions.length && matchingGithubEx.instructions.join(' ')) ||
        'Sin instrucciones disponibles.';

      const gifUrls = ExercisesAdapter.gifUrls(matchingGithubEx);
      const frame2Urls = ExercisesAdapter.resolveUrls((matchingGithubEx.images || [])[1]);

      return {
        nombre: nombre,
        explicacion_tecnica: explicacion,
        url_gif: gifUrls[0] || '',
        real_gif_url: gifUrls[1] || gifUrls[0] || '',
        url_gif_frame2: frame2Urls[0] || '',
        url_gif_frame2_fallback: frame2Urls[1] || frame2Urls[0] || '',
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
            ${ej.github_name ? `ID Repo: ${ej.github_id} (${ej.github_name})` : ``}
          </div>
          <div style="border-radius:var(--radius-lg); overflow:hidden; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); min-height: 200px; display: flex; align-items: center; justify-content: center;">
            <img id="modal-demo-img" alt="${ej.nombre}" style="max-width:100%; max-height:280px; object-fit:contain;">
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; max-height: 180px; overflow-y: auto;">
          <h5 style="color:#38bdf8; font-size:12px; font-weight:700; margin:0 0 6px 0; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:4px;">
            <span>💡 Guía de Ejecución Técnica (GitHub Repo)</span>
          </h5>
          <p style="color:var(--text-muted); font-size:13px; line-height:1.5; margin:0; text-align:left;">${ej.explicacion_tecnica}</p>
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
      // Dispara el primer intento
      if (urls.length > 0) {
        imgEl.src = urls[0];
      } else {
        imgEl.src = fallbackGifCategoria;
      }

      // Efecto "flip-book": free-exercise-db no trae GIF animado, pero sí
      // hasta 2 fotos por ejercicio (posición inicial y final). Si la foto
      // principal carga bien (sin caer a un respaldo) y existe la segunda,
      // se alternan cada 700ms para simular el movimiento — sin depender de
      // ningún GIF/API externo. Si la principal tuvo que caer a un
      // respaldo (CDN2 / categoría / SVG), se deja estática: es preferible
      // una imagen correcta y quieta a "animar" frames que no correspondan
      // al mismo ejercicio.
      const frame0Url = urls[0];
      const frame2Url = ej.url_gif_frame2;
      if (frame0Url && frame2Url) {
        imgEl.addEventListener('load', function onFrame0Loaded() {
          imgEl.removeEventListener('load', onFrame0Loaded);
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
            }, 700);
          };
          preload.src = frame2Url;
        }, { once: true });
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
                  <div style="width:40px; height:40px; border-radius:6px; overflow:hidden; background:rgba(0,0,0,0.25); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <img src="${r.url_gif}" alt="${r.ej}" style="width:100%; height:100%; object-fit:cover;" onerror="if(this.src!=='${r.real_gif_url}'){this.src='${r.real_gif_url}';}else{this.onerror=null;this.src=window.SVG_PLACEHOLDER;}">
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
