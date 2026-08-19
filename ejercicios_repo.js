/**
 * FitPro Suite Pro - Repositorio Oficial y Conector de GitHub Exercises-Dataset
 * Conecta dinámicamente y consume los datos oficiales y recursos del repositorio:
 * https://github.com/hasaneyldrm/exercises-dataset
 * Integra la totalidad de los ejercicios en la base de datos central de la app.
 */

(function(window) {
  // Lista en memoria de ejercicios descargados del repositorio de GitHub
  let githubExercisesList = [];
  let isDatasetLoaded = false;

  // URL del archivo JSON oficial en GitHub a través de CDN de jsDelivr
  const GITHUB_DATASET_URL = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/data/exercises.json';
  
  // CDN público obligatorio de jsDelivr para recursos
  const GITHUB_CDN_BASE_URL = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/';

  // Placeholder SVG por si todo falla (Red, CORS o archivos rotos en el CDN)
  const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="background:%230f172a;"><circle cx="12" cy="12" r="10"/><path d="M6.5 12h11"/><path d="M12 6.5v11"/></svg>`;

  // Mapeo manual estático para los ejercicios principales más comunes para asegurar precisión del 100%
  const MAPEO_MANUAL_ESTATICO = {
    "Sentadilla Trasera con Barra (Back Squat)": "barbell full squat (back pov)",
    "Sentadilla Frontal con Barra (Front Squat)": "barbell front squat",
    "Press de Banca Plano con Barra (Barbell Bench Press)": "barbell bench press",
    "Press Inclinado con Mancuernas (30° - 45°)": "dumbbell incline bench press",
    "Peso Muerto Rumano con Barra (RDL)": "barbell romanian deadlift",
    "Hip Thrust con Barra en Banco (Barbell Hip Thrust)": "barbell hip thrust",
    "Curl de Bíceps con Barra Z de Pie (EZ-Bar Curl)": "ez-barbell standing wide grip biceps curl",
    "Extensión de Tríceps en Polea Alta con Cuerda (Cable Pushdown)": "cable pushdown",
    "Plancha Abdominal Isométrica (Front Plank)": "weighted front plank"
  };

  // GIFs por categoría como fallback de diseño
  const FALLBACK_GIFS_POR_CATEGORIA = {
    cuadriceps: "https://media.giphy.com/media/3o7TKoWXm3okO1kgdW/giphy.gif",
    isquiotibiales: "https://media.giphy.com/media/3o7TKUM3ElNWyCg9m8/giphy.gif",
    gluteos: "https://media.giphy.com/media/3o7TKL39HjDJpjbdXa/giphy.gif",
    pecho: "https://media.giphy.com/media/3o6gb2QV3iSySZswV2/giphy.gif",
    espalda: "https://media.giphy.com/media/3o7TKp5WJ6V3cFFbQ4/giphy.gif",
    hombros: "https://media.giphy.com/media/3o7TKrE3JH1gE1l69y/giphy.gif",
    biceps: "https://media.giphy.com/media/3o7TKp5WJ6V3cFFbQ4/giphy.gif",
    triceps: "https://media.giphy.com/media/3o7TKr31zN1vEIPtJK/giphy.gif",
    core: "https://media.giphy.com/media/3o7TKS3jTUX0MQQOcg/giphy.gif",
    pantorrillas: "https://media.giphy.com/media/3o7TKoWXm3okO1kgdW/giphy.gif"
  };

  // Auxiliares de capitalización
  function capitalizeWords(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Descarga e inicialización asíncrona del catálogo de GitHub
  async function cargarDatasetDeEjercicios() {
    try {
      console.log("⚡ Conectando al repositorio GitHub Exercises-Dataset...");
      const res = await fetch(GITHUB_DATASET_URL);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      githubExercisesList = await res.json();
      isDatasetLoaded = true;
      console.log(`✅ Conexión exitosa: ${githubExercisesList.length} ejercicios cargados desde GitHub.`);

      // Integración en la base de datos global de ejercicios de FitPro Suite Pro
      integrarEjerciciosEnBaseDeDatosGlobal();
    } catch (err) {
      console.error("❌ Error al conectar con el dataset de GitHub, usando fallbacks locales:", err);
    }
  }

  // Integra los 1,414 ejercicios en la variable global ejerciciosDB de app.js
  function integrarEjerciciosEnBaseDeDatosGlobal() {
    if (!window.ejerciciosDB || !Array.isArray(window.ejerciciosDB)) {
      console.warn("⚠️ window.ejerciciosDB no encontrada aún. Reintentando en 100ms...");
      setTimeout(integrarEjerciciosEnBaseDeDatosGlobal, 100);
      return;
    }

    const mapaExistentes = new Set(window.ejerciciosDB.map(e => e.nombre.toLowerCase().trim()));
    let agregados = 0;

    githubExercisesList.forEach(e => {
      const nombreFormateado = capitalizeWords(e.name);
      
      // Evitar duplicar ejercicios con el mismo nombre
      if (!mapaExistentes.has(nombreFormateado.toLowerCase().trim())) {
        // 1. Mapeo de categoría al esquema local
        let cat = 'core';
        const rawCat = (e.category || '').toLowerCase();
        const rawTarget = (e.target || '').toLowerCase();
        if (rawCat.includes('chest')) cat = 'pecho';
        else if (rawCat.includes('back')) cat = 'espalda';
        else if (rawCat.includes('shoulder')) cat = 'hombros';
        else if (rawCat.includes('cardio') || rawCat.includes('waist') || rawCat.includes('abs')) cat = 'core';
        else if (rawCat.includes('leg') || rawCat.includes('calf')) {
          if (rawTarget.includes('calf')) cat = 'pantorrillas';
          else if (rawTarget.includes('glute')) cat = 'gluteos';
          else if (rawTarget.includes('hamstring')) cat = 'isquiotibiales';
          else cat = 'cuadriceps';
        }
        else if (rawCat.includes('arm')) {
          if (rawTarget.includes('tricep')) cat = 'triceps';
          else cat = 'biceps';
        }

        // 2. Mapeo de equipamiento al esquema local
        let equip = 'Peso Corporal';
        const rawEquip = (e.equipment || '').toLowerCase();
        if (rawEquip.includes('barbell')) equip = 'Barra';
        else if (rawEquip.includes('dumbbell')) equip = 'Mancuerna';
        else if (rawEquip.includes('cable')) equip = 'Polea';
        else if (rawEquip.includes('band')) equip = 'Banda';
        else if (rawEquip.includes('machine') || rawEquip.includes('lever') || rawEquip.includes('sled')) equip = 'Máquina';

        // 3. Resolución de instrucciones/ejecución
        const ejecucion = e.instructions?.es || e.instructions?.en || 
                         (e.instruction_steps?.es || e.instruction_steps?.en || []).join(' ') || 
                         "Realiza el ejercicio controlando el tempo de ejecución. Asegura mantener la postura correcta.";

        // Inyectar en el catálogo principal de app.js
        window.ejerciciosDB.push({
          nombre: nombreFormateado,
          categoria: cat,
          musculoPrimario: capitalizeFirst(e.target || cat),
          equipamiento: equip,
          riesgo: 'Bajo',
          musculos: (e.secondary_muscles || []).concat(e.target || []).join(', '),
          ejecucion: ejecucion,
          // Propiedades extendidas para carga asíncrona en modal
          github_id: e.id,
          github_name: e.name,
          url_gif: GITHUB_CDN_BASE_URL + e.gif_url
        });

        agregados++;
      }
    });

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

  // Función de emparejamiento inteligente
  function buscarCoincidenciaEnDataset(nombreOriginal, fallbackObj) {
    if (!isDatasetLoaded || githubExercisesList.length === 0) return null;

    const nombreNorm = nombreOriginal.toLowerCase().trim();

    // 1. Verificar si hay un mapeo estático predefinido
    if (MAPEO_MANUAL_ESTATICO[nombreOriginal]) {
      const exactMatch = githubExercisesList.find(e => e.name.toLowerCase() === MAPEO_MANUAL_ESTATICO[nombreOriginal]);
      if (exactMatch) return exactMatch;
    }

    // 2. Extraer inglés de los paréntesis si existe (ej: "Back Squat" de "Sentadilla Trasera (Back Squat)")
    const parenMatch = nombreOriginal.match(/\(([^)]+)\)/);
    let terminoBusqueda = parenMatch ? parenMatch[1] : nombreOriginal;
    terminoBusqueda = terminoBusqueda.toLowerCase()
      .replace(/30°\s*-\s*45°/g, '')
      .replace(/rdl/g, 'romanian deadlift')
      .trim();

    // 3. Buscar coincidencia exacta por nombre
    let match = githubExercisesList.find(e => e.name.toLowerCase() === terminoBusqueda);
    if (match) return match;

    // 4. Buscar si el nombre en el dataset incluye el término de búsqueda
    match = githubExercisesList.find(e => e.name.toLowerCase().includes(terminoBusqueda));
    if (match) return match;

    // 5. Búsqueda por palabras cruzadas (intersección)
    const palabrasClave = terminoBusqueda.split(/\s+/).filter(w => w.length > 2);
    if (palabrasClave.length > 0) {
      match = githubExercisesList.find(e => palabrasClave.every(w => e.name.toLowerCase().includes(w)));
      if (match) return match;
    }

    // 6. Si no hay coincidencia directa en inglés, buscar en las instrucciones en español (es) del dataset
    match = githubExercisesList.find(e => {
      const instrEs = e.instructions?.es || "";
      return instrEs.toLowerCase().includes(nombreNorm);
    });
    if (match) return match;

    return null;
  }

  // Interfaz de integración oficial expuesta globalmente
  window.obtenerEjercicioDeRepositorio = function(nombre, fallbackObj) {
    if (!nombre) return { nombre: "Ejercicio No Especificado", explicacion_tecnica: "Sin guía.", url_gif: "" };

    // Si ya tiene cargado el mapeo de github en ejerciciosDB
    if (fallbackObj && fallbackObj.github_id) {
      return {
        nombre: nombre,
        explicacion_tecnica: fallbackObj.ejecucion,
        url_gif: fallbackObj.url_gif,
        github_id: fallbackObj.github_id,
        github_name: fallbackObj.github_name
      };
    }

    const matchingGithubEx = buscarCoincidenciaEnDataset(nombre, fallbackObj);

    if (matchingGithubEx) {
      let explicacion = "";
      if (matchingGithubEx.instruction_steps?.es && matchingGithubEx.instruction_steps.es.length > 0) {
        explicacion = matchingGithubEx.instruction_steps.es.join("<br><br>");
      } else if (matchingGithubEx.instructions?.es) {
        explicacion = matchingGithubEx.instructions.es;
      } else if (matchingGithubEx.instruction_steps?.en && matchingGithubEx.instruction_steps.en.length > 0) {
        explicacion = matchingGithubEx.instruction_steps.en.join("<br><br>");
      } else {
        explicacion = matchingGithubEx.instructions?.en || "No instructions available.";
      }

      const gifUrl = GITHUB_CDN_BASE_URL + matchingGithubEx.gif_url;

      return {
        nombre: nombre,
        explicacion_tecnica: explicacion,
        url_gif: gifUrl,
        github_id: matchingGithubEx.id,
        github_name: matchingGithubEx.name
      };
    }

    // Fallback si no está cargado el dataset o no se encontró coincidencia
    const categoriaClean = (fallbackObj?.categoria || "").toLowerCase().trim();
    const fallbackGif = FALLBACK_GIFS_POR_CATEGORIA[categoriaClean] || "https://media.giphy.com/media/3o7TKoWXm3okO1kgdW/giphy.gif";

    return {
      nombre: nombre,
      explicacion_tecnica: fallbackObj?.ejecucion || fallbackObj?.explicacion_tecnica || "Realiza el ejercicio controlando el tempo de ejecución. Asegura mantener el rango de movimiento completo y la columna neutra durante toda la serie.",
      url_gif: fallbackGif
    };
  };

  // Controlador de Modal para la Interfaz de Usuario
  window.mostrarDemostracionEjercicio = function(nombre) {
    let fallbackObj = null;
    if (window.ejerciciosDB && Array.isArray(window.ejerciciosDB)) {
      fallbackObj = window.ejerciciosDB.find(e => e.nombre === nombre);
    }
    
    const ej = window.obtenerEjercicioDeRepositorio(nombre, fallbackObj);

    // Obtener GIF de fallback dinámico para la categoría del ejercicio
    const categoriaClean = (fallbackObj?.categoria || ej.categoria || "").toLowerCase().trim();
    const fallbackGif = FALLBACK_GIFS_POR_CATEGORIA[categoriaClean] || "https://media.giphy.com/media/3o7TKoWXm3okO1kgdW/giphy.gif";

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
          <h3 style="font-family:var(--font-heading); font-size:18px; font-weight:800; color:#fff; margin:0; display:flex; align-items:center; gap:8px;">
            <span>📺 Demostración del Ejercicio</span>
          </h3>
          <button type="button" onclick="cerrarModalDemoEjercicio()" style="padding:4px 10px; font-size:18px; cursor:pointer; background:transparent; border:none; color:var(--text-muted); font-weight:bold;">✕</button>
        </div>
        
        <div style="text-align:center; margin-bottom:16px;">
          <h4 style="color:#fff; font-size:16px; margin:0 0 4px 0; font-weight:700; font-family:var(--font-heading);">${ej.nombre}</h4>
          ${ej.github_name ? `<div style="font-size:11.5px; color:#38bdf8; margin-bottom:12px; font-family:monospace;">ID Repo: ${ej.github_id} (${ej.github_name})</div>` : ''}
          <div style="border-radius:var(--radius-lg); overflow:hidden; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); min-height: 200px; display: flex; align-items: center; justify-content: center;">
            <img id="modal-demo-img" src="${ej.url_gif || fallbackGif}" alt="${ej.nombre}" style="max-width:100%; max-height:280px; object-fit:contain;">
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

    // JavaScript puro para el manejo del evento error de forma limpia y robusta
    const imgEl = modal.querySelector('#modal-demo-img');
    if (imgEl) {
      imgEl.addEventListener('error', function handleImgError() {
        if (imgEl.src !== fallbackGif) {
          console.log(`⚠️ Error al cargar el GIF desde CDN, cargando fallback de categoría: ${fallbackGif}`);
          imgEl.src = fallbackGif;
        } else {
          console.log(`⚠️ Error al cargar el fallback de categoría, asignando SVG placeholder.`);
          imgEl.src = SVG_PLACEHOLDER;
          imgEl.removeEventListener('error', handleImgError);
        }
      });
    }

    modal.style.display = 'flex';
  };

  window.cerrarModalDemoEjercicio = function() {
    const modal = document.getElementById('modal-demo-ejercicio');
    if (modal) {
      modal.style.display = 'none';
    }
  };

})(window);
