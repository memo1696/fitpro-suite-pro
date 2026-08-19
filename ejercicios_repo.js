/**
 * FitPro Suite Pro - Repositorio Oficial y Conector de GitHub Exercises-Dataset
 * Conecta dinámicamente y consume los datos oficiales y recursos del repositorio:
 * https://github.com/hasaneyldrm/exercises-dataset
 * Integra la totalidad de los ejercicios en la base de datos central de la app.
 *
 * ── VERSIÓN CORREGIDA ──────────────────────────────────────────────────────
 * Cambios respecto a la versión anterior (ver informe de revisión aparte):
 *  1. Las URLs de GIF/imagen ahora se construyen a partir del campo real
 *     `gif_url` / `image` de cada registro (carpeta `videos/`, `images/`),
 *     en vez de adivinar un nombre de archivo a partir del nombre del
 *     ejercicio apuntando a una carpeta `gifs/` que no existe en el repo.
 *     Antes esto provocaba un 404 en el 100% de los casos.
 *  2. Se agregó una capa "adaptadora" (ExercisesAdapter) que es la ÚNICA
 *     parte del archivo que conoce la forma exacta del JSON externo. Si el
 *     dataset cambia de estructura, solo hay que tocar ese bloque.
 *  3. El dataset (17MB) ahora se cachea en IndexedDB en formato recortado
 *     (solo los campos que la app realmente usa) para que las visitas
 *     recurrentes no vuelvan a descargar el archivo completo.
 *  4. Se blindó la integración con `window.ejerciciosDB` contra entradas sin
 *     `nombre`, se limitó el reintento de espera (antes era infinito) y se
 *     evita reinyectar el catálogo si el script corre más de una vez.
 *  5. `mostrarDemostracionEjercicio` ahora sí intenta el GIF real específico
 *     del ejercicio (con 2 CDNs de respaldo) antes de caer al GIF genérico
 *     de categoría.
 *  6. Se expone `obtenerThumbnailEjercicio` para poblar miniaturas estáticas
 *     (mucho más livianas que un GIF) en la biblioteca visual.
 *  7. Se corrigió una entrada del mapeo manual estático que apuntaba a un
 *     ejercicio ("barbell hip thrust") inexistente en el dataset.
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
    datasetUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/data/exercises.json',
    // Orden de CDNs a probar para imágenes/GIFs. jsDelivr primero (cachea y
    // sirve más rápido); GitHub raw como respaldo si jsDelivr falla.
    cdnBases: [
      'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/',
      'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/'
    ],
    dbName: 'fitpro_exercises_cache',
    dbStore: 'dataset',
    dbVersion: 2,          // súbelo si cambias la forma del objeto normalizado
    cacheTtlMs: 1000 * 60 * 60 * 24 * 7, // 7 días
    maxEsperaEjerciciosDB: 50 // reintentos de 100ms (~5s) antes de rendirse
  };

  let githubExercisesList = []; // ya normalizado (ver ExercisesAdapter.normalize)
  let isDatasetLoaded = false;

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
        category: raw.category || raw.body_part || '',
        target: raw.target || '',
        secondaryMuscles: raw.secondary_muscles || [],
        equipment: raw.equipment || '',
        instructionsEs: (raw.instructions && raw.instructions.es) || '',
        instructionsEn: (raw.instructions && raw.instructions.en) || '',
        stepsEs: (raw.instruction_steps && raw.instruction_steps.es) || [],
        stepsEn: (raw.instruction_steps && raw.instruction_steps.en) || [],
        // Rutas RELATIVAS tal cual las entrega el dataset, p. ej.
        // "images/0001-2gPfomN.jpg" y "videos/0001-2gPfomN.gif".
        imagePath: raw.image || '',
        gifPath: raw.gif_url || ''
      };
    },

    // Reduce el array crudo (17MB, 10 idiomas por ejercicio) al subconjunto
    // que la app realmente consume, antes de guardarlo en caché local.
    normalizeAll(rawArray) {
      return (rawArray || []).map(r => this.normalize(r));
    },

    // Construye la lista de URLs absolutas (una por CDN configurado) para una
    // ruta relativa del dataset.
    resolveUrls(relativePath) {
      if (!relativePath) return [];
      return CONFIG.cdnBases.map(base => base + relativePath);
    },
    gifUrls(record) { return this.resolveUrls(record.gifPath); },
    imageUrls(record) { return this.resolveUrls(record.imagePath); },

    // Categoría del dataset externo -> categoría fija del catálogo local
    // (cuadriceps, isquiotibiales, gluteos, pecho, espalda, hombros, biceps,
    // triceps, core, pantorrillas) usada por los filtros de la biblioteca.
    mapCategoriaLocal(record) {
      const rawCat = (record.category || '').toLowerCase();
      const rawTarget = (record.target || '').toLowerCase();
      if (rawCat.includes('chest')) return 'pecho';
      if (rawCat.includes('back')) return 'espalda';
      if (rawCat.includes('shoulder')) return 'hombros';
      if (rawCat.includes('cardio') || rawCat.includes('waist')) return 'core';
      if (rawCat.includes('leg')) {
        if (rawTarget.includes('calv')) return 'pantorrillas';
        if (rawTarget.includes('glute')) return 'gluteos';
        if (rawTarget.includes('hamstring')) return 'isquiotibiales';
        return 'cuadriceps';
      }
      if (rawCat.includes('arm')) {
        return rawTarget.includes('tricep') ? 'triceps' : 'biceps';
      }
      return 'core';
    },

    mapEquipoLocal(record) {
      const rawEquip = (record.equipment || '').toLowerCase();
      if (rawEquip.includes('barbell')) return 'Barra';
      if (rawEquip.includes('dumbbell')) return 'Mancuerna';
      if (rawEquip.includes('cable')) return 'Polea';
      if (rawEquip.includes('band')) return 'Banda';
      if (rawEquip.includes('machine') || rawEquip.includes('lever') || rawEquip.includes('sled')) return 'Máquina';
      return 'Peso Corporal';
    },

    // Registro normalizado -> objeto con la MISMA forma que ya usa
    // `ejerciciosDB` en app.js. Este es el único punto de contacto entre el
    // dataset externo y el esquema interno de la app.
    toEjercicioLocal(record) {
      const ejecucion =
        (record.stepsEs && record.stepsEs.length && record.stepsEs.join(' ')) ||
        record.instructionsEs ||
        (record.stepsEn && record.stepsEn.length && record.stepsEn.join(' ')) ||
        record.instructionsEn ||
        'Realiza el ejercicio controlando el tempo de ejecución. Asegura mantener la postura correcta.';

      const gifUrls = this.gifUrls(record);
      const imageUrls = this.imageUrls(record);

      return {
        nombre: capitalizeWords(record.name),
        categoria: this.mapCategoriaLocal(record),
        musculoPrimario: capitalizeFirst(record.target || this.mapCategoriaLocal(record)),
        equipamiento: this.mapEquipoLocal(record),
        riesgo: 'Bajo',
        musculos: (record.secondaryMuscles || []).concat(record.target || []).join(', '),
        ejecucion,
        // Propiedades extendidas para carga en modal / biblioteca visual
        github_id: record.id,
        github_name: record.name,
        url_gif: gifUrls[0] || '',
        real_gif_url: gifUrls[1] || gifUrls[0] || '', // se mantiene el nombre por compatibilidad con app.js
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
  async function cargarDatasetDeEjercicios() {
    try {
      // 1. Intentar caché local primero (rápido, sin red)
      const cached = await Cache.get('exercises_normalized');
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

      Cache.set('exercises_normalized', { data: githubExercisesList, timestamp: Date.now() });

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
  // Cada ID fue verificado a mano contra el dataset real (nombre + equipo)
  // antes de agregarlo aquí.
  //
  // NOTA: "Hip Thrust con Barra en Banco (Barbell Hip Thrust)" y varios
  // otros (bulgarian split squat "puro", band bicep curl, band tricep
  // extension, clamshells, etc.) se dejaron FUERA a propósito porque no
  // existe un equivalente real en el dataset con el equipo correcto; caen
  // al GIF genérico de categoría en vez de mostrar un ejercicio equivocado.
  const MAPEO_MANUAL_ESTATICO_POR_ID = {
    'Sentadilla Trasera con Barra (Back Squat)': '1461', // barbell full squat (back pov)
    'Sentadilla Frontal con Barra (Front Squat)': '0042', // barbell front squat
    'Press de Banca Plano con Barra (Barbell Bench Press)': '0025', // barbell bench press
    'Press Inclinado con Mancuernas (30° - 45°)': '0314', // dumbbell incline bench press
    'Peso Muerto Rumano con Barra (RDL)': '0085', // barbell romanian deadlift
    'Curl de Bíceps con Barra Z de Pie (EZ-Bar Curl)': '2741', // ez-barbell standing wide grip biceps curl
    'Extensión de Tríceps en Polea Alta con Cuerda (Cable Pushdown)': '0201', // cable pushdown
    'Plancha Abdominal Isométrica (Front Plank)': '2135', // weighted front plank
    'Aperturas en Máquina Contractora': '0596', // lever seated fly
    'Pec Deck en Máquina': '0596', // lever seated fly
    'Prensa de Piernas 45° Inclinada': '1463', // sled 45° leg press (side pov)
    'Peso Muerto con Mancuernas a Piernas Semirrígidas': '0432', // dumbbell stiff leg deadlift
    'Buenos Días con Barra (Good Mornings)': '0044', // barbell good morning
    'Abducción de Cadera en Máquina (Seated Hip Abductor)': '0597', // lever seated hip abduction
    'Sissy Squat Libre / Asistido': '1489', // sissy squat
    'Remo con Barra Pendlay (90° Pendlay Row)': '3017', // barbell pendlay row
    'Remo en Máquina de Placas con Apoyo en Pecho (Chest-Supported Row)': '1350', // lever seated row
    'Elevaciones Laterales en Máquina Específica': '0584', // lever lateral raise
    'Peck Deck Inverso en Máquina (Reverse Flyes)': '0602', // lever seated reverse fly
    'Curl Inclinado con Mancuernas (Incline Dumbbell Curl 45°)': '0318', // dumbbell incline curl
    'Extensión Katana Unilateral por Encima de la Cabeza en Polea': '0194', // cable overhead triceps extension (rope)
    'Sentadilla Goblet con Kettlebell': '0534', // kettlebell goblet squat
    'Peso Muerto Convencional con Barra (Conventional Deadlift)': '0032', // barbell deadlift
    'Peso Muerto Sumo con Barra': '0117', // barbell sumo deadlift
    'Peso Muerto a Una Pierna con Mancuerna (Single-Leg RDL)': '1757', // dumbbell single leg deadlift
    'Press de Banca en Banco Declinado Agarre Estrecho': '0035', // barbell decline close grip to skull press
    'Curl de Bíceps con Barra Recta (Straight Bar Curl)': '0031', // barbell curl
    'Dead-Bug con Control Lumbar': '0276', // dead bug
    'Mountain Climbers con Control (Escaladores)': '0630', // mountain climber
    'Elevación de Gemelos Unilateral con Mancuerna en Escalón': '0409', // dumbbell single leg calf raise
    'Elevación de Talones Sentado con Mancuerna sobre Rodillas': '1379', // dumbbell seated calf raise
    'Fondos en Paralelas para Pecho (Chest Dips)': '0251', // chest dip
    'Press Francés con Barra Z en Banco Plano (Skull Crushers)': '0060', // barbell lying triceps extension skull crusher
    'Press Militar de Pie con Barra (Overhead Press OHP)': '1457', // barbell standing wide military press
    'Sentadilla Búlgara con Mancuernas (Rear Foot Elevated)': '0410', // dumbbell single leg split squat
    'Sentadilla Búlgara con Barra (Barbell RFESS)': '0099', // barbell single leg split squat
    'Pull-Over en Polea Alta con Cuerda / Barra Recta': '1316', // barbell bent arm pullover
    'Jalón al Pecho en Polea con Agarre Neutro Estrecho': '0818', // twin handle parallel grip lat pulldown
    'Curl Alternado de Pie con Mancuernas': '0285', // dumbbell alternate biceps curl
    'Aperturas en Máquina Contractora (Peck Deck Flyes)': '0596', // lever seated fly
    'Cruce de Poleas Altas (High-to-Low Cable Flyes)': '1270', // cable upper chest crossovers
    'Cruce de Poleas Bajas (Low-to-High Cable Flyes)': '0179', // cable low fly
    'Aperturas con Poleas al Nivel del Pecho (Mid-Cable Flyes)': '0188', // cable middle fly
    'Dominadas Pronas / Neutras (Pull-ups / Chin-ups)': '0651', // pull up (neutral grip)
    'Press de Banca Inclinado con Barra (30°)': '0047' // barbell incline bench press
  };

  // GIFs por categoría como último recurso visual (si no hay match en el
  // dataset ni éste está cargado aún).
  const FALLBACK_GIFS_POR_CATEGORIA = {
    cuadriceps: CONFIG.cdnBases[0] + 'videos/1512-qBcKorM.gif',
    isquiotibiales: CONFIG.cdnBases[0] + 'videos/3214-RtyAsy1.gif',
    gluteos: CONFIG.cdnBases[0] + 'videos/3214-RtyAsy1.gif',
    pecho: CONFIG.cdnBases[0] + 'videos/3294-A9qxk2F.gif',
    espalda: CONFIG.cdnBases[0] + 'videos/0007-4IKbhHV.gif',
    hombros: CONFIG.cdnBases[0] + 'videos/0997-peAeMR3.gif',
    biceps: CONFIG.cdnBases[0] + 'videos/0968-3omWx6P.gif',
    triceps: CONFIG.cdnBases[0] + 'videos/0019-J60bN17.gif',
    core: CONFIG.cdnBases[0] + 'videos/0001-2gPfomN.gif',
    pantorrillas: CONFIG.cdnBases[0] + 'videos/1368-uL9CsKm.gif'
  };

  // Pistas de equipamiento (texto en español -> tokens esperados en el nombre
  // o campo `equipment` en inglés del dataset). Se usan para EXIGIR que una
  // coincidencia por palabras clave sea del mismo equipo, no solo del mismo
  // movimiento genérico. Sin esto, "Curl Martillo con Mancuernas" podía
  // terminar emparejado con "cable hammer curl" solo porque aparecía primero
  // en el array, mostrando un ejercicio de polea para uno que es de mancuerna.
  const EQUIPO_HINTS = [
    { es: ['mancuernas', 'mancuerna'], en: ['dumbbell'] },
    { es: ['barra z', 'barra ez', 'ez-bar', 'ez bar'], en: ['ez-barbell', 'ez barbell'] },
    { es: ['barra t'], en: ['t-bar', 'lever'] },
    { es: ['barra'], en: ['barbell'] },
    { es: ['polea', 'cable'], en: ['cable'] },
    { es: ['multipower', 'smith'], en: ['smith'] },
    { es: ['máquina', 'maquina'], en: ['lever', 'sled', 'machine'] },
    { es: ['banda'], en: ['band'] },
    { es: ['kettlebell', 'pesa rusa'], en: ['kettlebell'] },
    { es: ['peso corporal'], en: ['body weight'] }
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
        github_id: fallbackObj.github_id,
        github_name: fallbackObj.github_name
      };
    }

    // Caso 2: ejercicio "heredado" (escrito a mano en app.js) — buscamos su
    // equivalente en el dataset para poder mostrar un GIF real.
    const matchingGithubEx = buscarCoincidenciaEnDataset(nombre);

    if (matchingGithubEx) {
      let explicacion = '';
      if (matchingGithubEx.stepsEs && matchingGithubEx.stepsEs.length > 0) {
        explicacion = matchingGithubEx.stepsEs.join('<br><br>');
      } else if (matchingGithubEx.instructionsEs) {
        explicacion = matchingGithubEx.instructionsEs;
      } else if (matchingGithubEx.stepsEn && matchingGithubEx.stepsEn.length > 0) {
        explicacion = matchingGithubEx.stepsEn.join('<br><br>');
      } else {
        explicacion = matchingGithubEx.instructionsEn || 'No instructions available.';
      }

      const gifUrls = ExercisesAdapter.gifUrls(matchingGithubEx);

      return {
        nombre: nombre,
        explicacion_tecnica: explicacion,
        url_gif: gifUrls[0] || '',
        real_gif_url: gifUrls[1] || gifUrls[0] || '',
        github_id: matchingGithubEx.id,
        github_name: matchingGithubEx.name
      };
    }

    // Caso 3: sin dataset cargado o sin coincidencia -> fallback por categoría
    const categoriaClean = (fallbackObj?.categoria || '').toLowerCase().trim();
    const fallbackGif = FALLBACK_GIFS_POR_CATEGORIA[categoriaClean] || (CONFIG.cdnBases[0] + 'videos/0001-2gPfomN.gif');

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
    return CONFIG.cdnBases[0] + 'videos/0001-2gPfomN.gif';
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
    let fallbackObj = null;
    if (window.ejerciciosDB && Array.isArray(window.ejerciciosDB)) {
      fallbackObj = window.ejerciciosDB.find(e => e.nombre === nombre);
    }

    const ej = window.obtenerEjercicioDeRepositorio(nombre, fallbackObj);

    const categoriaClean = (fallbackObj?.categoria || ej.categoria || '').toLowerCase().trim();
    const fallbackGifCategoria = FALLBACK_GIFS_POR_CATEGORIA[categoriaClean] || (CONFIG.cdnBases[0] + 'videos/0001-2gPfomN.gif');

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
    }

    modal.style.display = 'flex';
  };

  window.cerrarModalDemoEjercicio = function () {
    const modal = document.getElementById('modal-demo-ejercicio');
    if (modal) modal.style.display = 'none';
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
