// Global Error Boundary & Crash Protection
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error("FitPro Engine Log:", msg, "at line", lineNo);
  return true;
};

window.addEventListener('unhandledrejection', function(event) {
  console.error("FitPro Unhandled Promise Rejection:", event.reason);
});

// ==========================================
// 🔔 SAAS FLOATING TOAST NOTIFICATION ENGINE
// ==========================================
function showToast(message, type = 'success', title = '', duration = 4000) {
  try {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    let defaultTitle = '';
    if (type === 'success') {
      defaultTitle = title || 'Operación Exitosa';
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
    } else if (type === 'warning') {
      defaultTitle = title || 'Advertencia del Sistema';
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else if (type === 'error') {
      defaultTitle = title || 'Atención';
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      defaultTitle = title || 'Información';
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${defaultTitle}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar">✕</button>
      <div class="toast-progress" style="animation-duration:${duration}ms;"></div>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 260);
    };

    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);

    container.appendChild(toast);
  } catch (err) {
    console.warn("Toast error:", err);
  }
}

window.showToast = showToast;

// ==========================================
// 🛡️ MODAL DE CONFIRMACIÓN PROACTIVA SAAS
// ==========================================
let accionPendienteConfirmacion = null;

function abrirModalConfirmacionAccion({ titulo, subtitulo, icono, iconBg, badgeHtml, desgloseHtml, btnTexto, btnColor, onConfirm }) {
  const modal = document.getElementById('modal-confirmacion-accion');
  const titEl = document.getElementById('modal-conf-titulo');
  const subEl = document.getElementById('modal-conf-subtitulo');
  const iconEl = document.getElementById('modal-conf-icono-box');
  const badgeEl = document.getElementById('modal-conf-badge-container');
  const desgloseEl = document.getElementById('modal-conf-desglose');
  const btnEl = document.getElementById('modal-conf-btn-confirmar');

  if (titEl) titEl.innerText = titulo;
  if (subEl) subEl.innerText = subtitulo;
  if (iconEl) {
    iconEl.innerHTML = icono || '⚡';
    if (iconBg) iconEl.style.background = iconBg;
  }
  if (badgeEl) badgeEl.innerHTML = badgeHtml || '';
  if (desgloseEl) desgloseEl.innerHTML = desgloseHtml || '';
  if (btnEl) {
    btnEl.innerText = btnTexto || '✅ Confirmar y Aplicar';
    if (btnColor) {
      btnEl.style.background = btnColor;
      btnEl.style.borderColor = btnColor;
    }
  }

  accionPendienteConfirmacion = onConfirm;
  if (modal) modal.classList.remove('hidden');
}

function cerrarModalConfirmacionAccion() {
  const modal = document.getElementById('modal-confirmacion-accion');
  if (modal) modal.classList.add('hidden');
  accionPendienteConfirmacion = null;
}

function ejecutarAccionConfirmada() {
  if (typeof accionPendienteConfirmacion === 'function') {
    accionPendienteConfirmacion();
  }
  cerrarModalConfirmacionAccion();
}

window.abrirModalConfirmacionAccion = abrirModalConfirmacionAccion;
window.cerrarModalConfirmacionAccion = cerrarModalConfirmacionAccion;
window.ejecutarAccionConfirmada = ejecutarAccionConfirmada;

// ==========================================
// 🛡️ SECURITY & INPUT SANITIZATION SUITE (ANTI-XSS)
// ==========================================
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeText(input, maxLength = 300) {
  if (input === null || input === undefined) return '';
  // 1. Remove dangerous script, iframe, and object tags
  let cleaned = String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>?/gm, '') // Strip remaining HTML tags
    .trim();

  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  return cleaned;
}

function sanitizeNumber(val, defaultVal = 0, min = null, max = null) {
  let num = parseFloat(val);
  if (isNaN(num)) return defaultVal;
  if (min !== null && num < min) num = min;
  if (max !== null && num > max) num = max;
  return num;
}

function sanitizeArray(arr, maxItemLength = 150) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(item => sanitizeText(item, maxItemLength))
    .filter(item => item.length > 0);
}

window.escapeHTML = escapeHTML;
window.sanitizeText = sanitizeText;
window.sanitizeNumber = sanitizeNumber;
window.sanitizeArray = sanitizeArray;

// ==========================================
// 🏢 MULTI-GYM INDEPENDENT TENANT ARCHITECTURE
// ==========================================
const gimnasiosDB = [
  { id: "gym_central_01", nombre: "FitPro Central Hub", ciudad: "Sede Principal", plan: "Enterprise Multi-Gym" },
  { id: "gym_norte_02", nombre: "FitPro North Performance", ciudad: "Sucursal Norte", plan: "Pro Hub" },
  { id: "gym_elite_03", nombre: "FitPro Elite Studio", ciudad: "Sucursal Elite", plan: "Studio Boutique" }
];

let gimnasioActivoId = localStorage.getItem('fitpro_active_gym_id') || 'gym_central_01';
window.gimnasioActivoId = gimnasioActivoId;

function getGimnasioActivo() {
  return gimnasiosDB.find(g => g.id === gimnasioActivoId) || gimnasiosDB[0];
}

function getClientesActivos() {
  return clientes.filter(c => (c.gym_id || 'gym_central_01') === gimnasioActivoId);
}

function getPlanesActivos() {
  return planesGuardados.filter(p => (p.gym_id || 'gym_central_01') === gimnasioActivoId);
}

function getDietasActivas() {
  return dietasGuardadas.filter(d => (d.gym_id || 'gym_central_01') === gimnasioActivoId);
}

function getFinanzasActivas() {
  return transaccionesFinancieras.filter(t => (t.gym_id || 'gym_central_01') === gimnasioActivoId);
}

function getLesionesActivas() {
  return lesionesDB.filter(l => (l.gym_id || 'gym_central_01') === gimnasioActivoId);
}

function getArchivosMedicosActivos() {
  return archivosMedicosDB.filter(a => (a.gym_id || 'gym_central_01') === gimnasioActivoId);
}

function getBitacoraClinicaActiva() {
  return bitacoraClinicaDB.filter(b => (b.gym_id || 'gym_central_01') === gimnasioActivoId);
}

function getMetricasActivas() {
  return metricasEvolucionDB.filter(m => (m.gym_id || 'gym_central_01') === gimnasioActivoId);
}

function cambiarGimnasioActivo(nuevoGymId) {
  if (!nuevoGymId) return;
  gimnasioActivoId = nuevoGymId;
  window.gimnasioActivoId = nuevoGymId;
  localStorage.setItem('fitpro_active_gym_id', nuevoGymId);

  const select = document.getElementById('select-gimnasio-activo');
  if (select) select.value = nuevoGymId;

  const badge = document.getElementById('gym-badge-id');
  if (badge) badge.innerText = nuevoGymId;

  const mobileBadge = document.getElementById('mobile-gym-badge');
  if (mobileBadge) mobileBadge.innerText = nuevoGymId;

  const gymObj = getGimnasioActivo();
  console.log(`🏢 Conmutando entorno a: ${gymObj.nombre} (gym_id: ${nuevoGymId})`);

  // Query Supabase for this gym's data
  cargarClientesDesdeSupabase();

  // Refresh all views
  renderClientes();
  renderPlanes();
  renderFinanzas();
  renderDietas();
  renderLesiones();
  renderSeniorsList();
  renderAnalyticsAtleta();
  renderAlertasProactivas();
}

// ==========================================
// ☁️ SUPABASE CLOUD DATABASE ENGINE (MULTI-GYM & SECURE ISOLATION)
// ==========================================
// Obtención segura y limpia de credenciales públicas (Variables de Entorno o Fallback Anon)
const getRawSupabaseUrl = () => {
  const url = (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_URL)
    || (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.SUPABASE_URL)
    || (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL)
    || localStorage.getItem('fitpro_supabase_url')
    || "https://rshpzqppvciujwtuzniv.supabase.co";
  return String(url).trim().replace(/^["']|["']$/g, '');
};

const getRawSupabaseKey = () => {
  const key = (typeof window !== 'undefined' && window.ENV && (window.ENV.SUPABASE_ANON_KEY || window.ENV.SUPABASE_PUBLISHABLE_KEY))
    || (typeof window !== 'undefined' && window.__ENV__ && (window.__ENV__.SUPABASE_ANON_KEY || window.__ENV__.SUPABASE_PUBLISHABLE_KEY))
    || (typeof process !== 'undefined' && process.env && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY))
    || localStorage.getItem('fitpro_supabase_key')
    || "sb_publishable_nrgHXvg2NJOM1eKbhfd-Nw__RJdg6hx";
  return String(key).trim().replace(/^["']|["']$/g, '');
};

const SUPABASE_URL = getRawSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = getRawSupabaseKey();

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;

let supabaseClient = null;
let estadoSincronizacionSupabase = "inicializando";

function validarSeguridadClaveSupabase(key) {
  if (!key || typeof key !== 'string') return false;
  // Bloquear inmediatamente si se detecta uso de llave service_role en el cliente
  if (key.toLowerCase().includes('service_role') || key.toLowerCase().includes('secret')) {
    console.error("🚨 CRITICAL SECURITY RISK: La clave maestra 'service_role' JAMÁS debe usarse en el navegador. Inicialización abortada.");
    return false;
  }
  return true;
}

function actualizarBadgeSupabaseUI(estado, mensaje) {
  const badge = document.getElementById('supabase-cloud-badge');
  if (!badge) return;

  let texto = '';
  let clase = 'badge-green';
  let dotClass = 'pulse-dot-green';

  let estadoStr = '';
  let mensajeStr = '';

  // Detección polimórfica de parámetros (estado, mensaje) o (mensaje, estado)
  if (typeof estado === 'string' && (
    estado.startsWith('badge-') || 
    ['conectado', 'online', 'sync', 'sincronizado', 'sincronizando', 'cargando', 'local', 'offline', 'error', 'danger', 'desconectado', 'alerta', 'warning'].includes(estado.toLowerCase())
  )) {
    estadoStr = estado.toLowerCase();
    mensajeStr = mensaje || '';
  } else if (typeof mensaje === 'string' && (
    mensaje.startsWith('badge-') || 
    ['conectado', 'online', 'sync', 'sincronizado', 'sincronizando', 'cargando', 'local', 'offline', 'error', 'danger', 'desconectado', 'alerta', 'warning'].includes(mensaje.toLowerCase())
  )) {
    estadoStr = mensaje.toLowerCase();
    mensajeStr = estado || '';
  } else {
    mensajeStr = estado || mensaje || `☁️ Supabase Cloud: ${gimnasioActivoId}`;
    estadoStr = 'conectado';
  }

  const combined = (estadoStr + ' ' + mensajeStr).toLowerCase();

  if (combined.includes('error') || combined.includes('danger') || combined.includes('fallo') || combined.includes('inválid') || estadoStr === 'desconectado') {
    clase = 'badge-danger';
    dotClass = 'pulse-dot-red';
    if (!mensajeStr) mensajeStr = '🚨 Error de Conexión';
  } else if (combined.includes('sincronizando') || combined.includes('cargando') || combined.includes('risk') || combined.includes('amber') || combined.includes('local') || combined.includes('offline') || combined.includes('warning') || combined.includes('alerta') || combined.includes('pendiente')) {
    clase = 'badge-risk-med';
    dotClass = 'pulse-dot-amber';
    if (!mensajeStr) mensajeStr = `🟡 Modo Local (${gimnasioActivoId})`;
  } else if (combined.includes('blue') || combined.includes('primary') || combined.includes('info')) {
    clase = 'badge-primary';
    dotClass = 'pulse-dot-blue';
    if (!mensajeStr) mensajeStr = '☁️ Supabase Cloud';
  } else {
    clase = 'badge-green';
    dotClass = 'pulse-dot-green';
    if (!mensajeStr) mensajeStr = `☁️ Supabase Cloud: ${gimnasioActivoId}`;
  }

  texto = mensajeStr;
  badge.className = `badge ${clase} cloud-sync-badge`;
  badge.innerHTML = `<span class="pulse-dot ${dotClass}"></span> <span>${escapeHTML(texto)}</span>`;
}

window.actualizarBadgeSupabaseUI = actualizarBadgeSupabaseUI;

function initSupabaseClient() {
  try {
    if (!validarSeguridadClaveSupabase(SUPABASE_PUBLISHABLE_KEY)) {
      actualizarBadgeSupabaseUI("error", "🚨 Seguridad: Clave Inválida");
      return;
    }

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      window.supabaseClient = supabaseClient;
      estadoSincronizacionSupabase = "conectado";
      console.log(`🟢 Supabase Cloud inicializado de forma segura [Gym: ${gimnasioActivoId}]:`, SUPABASE_URL);
      actualizarBadgeSupabaseUI("conectado", `☁️ Supabase Cloud: ${gimnasioActivoId}`);
      cargarClientesDesdeSupabase();
    } else {
      console.warn("⚠️ Supabase JS SDK no detectado; ejecutando en modo Local Multi-Gym.");
      actualizarBadgeSupabaseUI("local", `🟡 Nube: Modo Local (${gimnasioActivoId})`);
    }
  } catch (err) {
    console.warn("Error al inicializar cliente Supabase:", err);
    actualizarBadgeSupabaseUI("local", `🟡 Nube: Modo Local (${gimnasioActivoId})`);
  }
}

window.initSupabaseClient = initSupabaseClient;

// ==========================================
// 🔐 SUPABASE AUTHENTICATION & SESSION ENGINE
// ==========================================
let sesionUsuarioActual = null;
let modoAuthActual = 'login'; // 'login' | 'signup'

// ==========================================
// 🔒 SECURE LOCAL STORAGE ENGINE (ENCRYPTED / OBFUSCATED)
// ==========================================
const STORAGE_CIPHER_PREFIX = 'enc_fp_v1:';

function generarClaveOfuscacion(keyName) {
  return `fp_salt_${keyName}_9841`;
}

function guardarStorageCifrado(key, data) {
  try {
    if (data === null || data === undefined) {
      localStorage.removeItem(key);
      return;
    }
    const jsonStr = JSON.stringify(data);
    const salt = generarClaveOfuscacion(key);
    
    // Transformación XOR + Base64 segura
    let output = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
      output += String.fromCharCode(charCode);
    }
    const encoded = STORAGE_CIPHER_PREFIX + btoa(unescape(encodeURIComponent(output)));
    localStorage.setItem(key, encoded);
  } catch (err) {
    console.warn("Storage encode fallback for key:", key);
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function leerStorageCifrado(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;

    if (raw.startsWith(STORAGE_CIPHER_PREFIX)) {
      const b64 = raw.substring(STORAGE_CIPHER_PREFIX.length);
      const decoded = decodeURIComponent(escape(atob(b64)));
      const salt = generarClaveOfuscacion(key);
      let output = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        output += String.fromCharCode(charCode);
      }
      return JSON.parse(output);
    } else {
      // Legacy unencrypted fallback
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Storage decode notice for key:", key);
    return defaultValue;
  }
}

function mostrarPantallaAuth() {
  document.body.classList.add('auth-pending');
  const authOverlay = document.getElementById('auth-overlay-view');
  if (authOverlay) {
    authOverlay.classList.remove('hidden');
    authOverlay.style.display = 'flex';
  }
  const layout = document.getElementById('app-layout');
  if (layout) {
    layout.style.display = 'none';
  }

  // Comprobar si se ingresó mediante enlace de atleta (?view=athlete o ?email=... o ?atleta=...)
  const urlParams = new URLSearchParams(window.location.search);
  const esVistaAtleta = urlParams.get('view') === 'athlete' || Boolean(urlParams.get('atleta')) || Boolean(urlParams.get('atletaEmail') || urlParams.get('email'));

  if (esVistaAtleta) {
    document.body.classList.add('is-athlete-mode');
    window.esSesionModoAtleta = true;

    // 1. Título y subtítulo limpios para el alumno
    const authTitle = document.querySelector('.auth-title');
    if (authTitle) authTitle.innerText = "Portal del Atleta";

    const authSubtitle = document.getElementById('auth-header-subtitle');
    if (authSubtitle) {
      const nombreAtleta = urlParams.get('atleta') ? decodeURIComponent(urlParams.get('atleta')) : '';
      authSubtitle.innerHTML = nombreAtleta 
        ? `¡Hola <strong>${nombreAtleta}</strong>! Ingresa con tu correo y contraseña temporal para ver tu rutina y nutrición.`
        : "Acceso exclusivo para atletas a su plan de entrenamiento, nutrición y medidas.";
    }

    // 2. Ocultar menús y opciones de SuperAdmin / Entrenador
    const authTabs = document.querySelector('.auth-tabs');
    if (authTabs) authTabs.style.display = 'none';

    const demoDivider = document.querySelector('.auth-demo-divider');
    if (demoDivider) demoDivider.style.display = 'none';

    const demoBtns = document.querySelectorAll('.auth-btn-demo');
    demoBtns.forEach(btn => btn.style.display = 'none');

    const switchPrompt = document.getElementById('auth-switch-prompt');
    if (switchPrompt && switchPrompt.parentElement) {
      switchPrompt.parentElement.style.display = 'none';
    }

    const authGroupNombre = document.getElementById('auth-group-nombre');
    if (authGroupNombre) authGroupNombre.style.display = 'none';
    const authGroupRol = document.getElementById('auth-group-rol');
    if (authGroupRol) authGroupRol.style.display = 'none';
    const authGroupGym = document.getElementById('auth-group-gym');
    if (authGroupGym) authGroupGym.style.display = 'none';

    // 3. Pre-llenar correo del atleta si viene en la URL
    const emailParam = urlParams.get('email') || urlParams.get('atletaEmail');
    const authEmailInput = document.getElementById('auth-input-email');
    if (emailParam && authEmailInput) {
      authEmailInput.value = decodeURIComponent(emailParam);
    }

    const authBtnText = document.getElementById('auth-btn-text');
    if (authBtnText) authBtnText.innerText = "🏋️ Acceder a Mi Plan Deportivo";

    const passInput = document.getElementById('auth-input-password');
    if (passInput) {
      setTimeout(() => passInput.focus(), 150);
    }
  }
}

async function verificarYEscucharSupabaseAuth() {
  if (!supabaseClient) {
    initSupabaseClient();
  }

  // 1. Verificar si la URL contiene un deep-link de atleta
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email') || urlParams.get('atletaEmail');
  const atletaParam = urlParams.get('atleta') || urlParams.get('cliente');
  const isAthleteDeepLink = Boolean(emailParam || atletaParam || urlParams.get('view') === 'athlete');

  // 2. Verificar si hay sesión activa en Supabase Auth
  if (supabaseClient && supabaseClient.auth) {
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      
      // Si hay un enlace directo de atleta y la sesión actual no coincide con ese atleta, mostrar login de atleta
      if (isAthleteDeepLink && emailParam && data?.session?.user?.email) {
        const currentEmail = String(data.session.user.email).toLowerCase();
        const targetEmail = decodeURIComponent(emailParam).toLowerCase();
        if (currentEmail !== targetEmail) {
          console.log(`🔄 Enlace de atleta (${targetEmail}) no coincide con sesión activa (${currentEmail}). Mostrando login de atleta.`);
          await supabaseClient.auth.signOut().catch(() => {});
          mostrarPantallaAuth();
          procesarDeepLinkAtletaUrl();
          return;
        }
      }

      if (!error && data && data.session) {
        console.log("🔓 Sesión activa restaurada desde Supabase Auth:", data.session.user?.email);
        establecerSesionActiva(data.session, data.session.user);
      } else {
        if (!isAthleteDeepLink) {
          const demoStored = leerStorageCifrado('fitpro_local_auth_session');
          if (demoStored && demoStored.user) {
            establecerSesionActiva(demoStored, demoStored.user);
            return;
          }
        }
        mostrarPantallaAuth();
        procesarDeepLinkAtletaUrl();
      }

      // 2. Suscribirse a cambios en el estado de autenticación (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
      supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log(`🔔 Evento Supabase Auth: ${event}`);
        if (event === 'SIGNED_IN' && session) {
          establecerSesionActiva(session, session.user);
        } else if (event === 'SIGNED_OUT') {
          sesionUsuarioActual = null;
          mostrarPantallaAuth();
        }
      });
    } catch (err) {
      console.warn("Excepción al verificar sesión de Supabase:", err);
      mostrarPantallaAuth();
    }
  } else {
    const demoStored = localStorage.getItem('fitpro_local_auth_session');
    if (demoStored) {
      try {
        const parsed = JSON.parse(demoStored);
        establecerSesionActiva(parsed, parsed.user);
        return;
      } catch (e) {
        localStorage.removeItem('fitpro_local_auth_session');
      }
    }
    mostrarPantallaAuth();
  }
}

function mostrarErrorAuth(mensaje) {
  const errBox = document.getElementById('auth-error-box');
  const sucBox = document.getElementById('auth-success-box');
  if (sucBox) sucBox.classList.add('hidden');
  if (errBox) {
    errBox.innerHTML = `<span>⚠️</span> <div>${escapeHTML(mensaje)}</div>`;
    errBox.classList.remove('hidden');
  }
}

function mostrarExitoAuth(mensaje) {
  const errBox = document.getElementById('auth-error-box');
  const sucBox = document.getElementById('auth-success-box');
  if (errBox) errBox.classList.add('hidden');
  if (sucBox) {
    sucBox.innerHTML = `<span>✅</span> <div>${escapeHTML(mensaje)}</div>`;
    sucBox.classList.remove('hidden');
  }
}

function limpiarErrorAuth() {
  const errBox = document.getElementById('auth-error-box');
  const sucBox = document.getElementById('auth-success-box');
  if (errBox) errBox.classList.add('hidden');
  if (sucBox) sucBox.classList.add('hidden');
}

let perfilAuthActual = 'coach';

function seleccionarPerfilAuth(perfil) {
  perfilAuthActual = perfil;
  limpiarErrorAuth();

  const btnCoach = document.getElementById('btn-perfil-coach');
  const btnAtleta = document.getElementById('btn-perfil-atleta');
  const coachTabs = document.getElementById('auth-coach-tabs');
  const demoDivider = document.querySelector('.auth-demo-divider');
  const demoBtns = document.querySelectorAll('.auth-btn-demo');
  const switchPrompt = document.getElementById('auth-switch-prompt');
  const authTitle = document.querySelector('.auth-title');
  const authSubtitle = document.getElementById('auth-header-subtitle');
  const emailInput = document.getElementById('auth-input-email');
  const passInput = document.getElementById('auth-input-password');
  const btnText = document.getElementById('auth-btn-text');

  if (perfil === 'athlete') {
    window.esSesionModoAtleta = true;
    document.body.classList.add('is-athlete-mode');

    if (btnCoach) btnCoach.classList.remove('active');
    if (btnAtleta) btnAtleta.classList.add('active');

    if (authTitle) authTitle.innerText = "Portal del Atleta";
    if (authSubtitle) authSubtitle.innerText = "Ingresa con tu correo y contraseña asignada por tu entrenador para ver tu rutina y dieta.";

    if (coachTabs) coachTabs.style.display = 'none';
    if (demoDivider) demoDivider.style.display = 'none';
    demoBtns.forEach(b => b.style.display = 'none');
    if (switchPrompt && switchPrompt.parentElement) switchPrompt.parentElement.style.display = 'none';

    // Ocultar campos de registro de coach
    const grpNombre = document.getElementById('auth-group-nombre');
    const grpRol = document.getElementById('auth-group-rol');
    const grpGym = document.getElementById('auth-group-gym');
    if (grpNombre) grpNombre.style.display = 'none';
    if (grpRol) grpRol.style.display = 'none';
    if (grpGym) grpGym.style.display = 'none';

    if (emailInput) emailInput.placeholder = "ej. carlos.mendoza@atleta.fitpro.app";
    if (passInput) passInput.placeholder = "Tu contraseña o clave temporal";
    if (btnText) btnText.innerText = "🏋️ Acceder a Mi Plan Deportivo";
  } else {
    window.esSesionModoAtleta = false;
    document.body.classList.remove('is-athlete-mode');

    if (btnCoach) btnCoach.classList.add('active');
    if (btnAtleta) btnAtleta.classList.remove('active');

    if (authTitle) authTitle.innerText = "FitPro Suite Pro";
    if (authSubtitle) authSubtitle.innerText = "Acceso seguro a la plataforma biomecánica y gestión SaaS";

    if (coachTabs) coachTabs.style.display = 'flex';
    if (demoDivider) demoDivider.style.display = 'flex';
    demoBtns.forEach(b => b.style.display = '');
    if (switchPrompt && switchPrompt.parentElement) switchPrompt.parentElement.style.display = '';

    if (emailInput) emailInput.placeholder = "entrenador@fitprosuite.com";
    if (passInput) passInput.placeholder = "Mínimo 6 caracteres";
    if (btnText) btnText.innerText = "🔒 Iniciar Sesión en FitPro Cloud";

    cambiarModoAuth(modoAuthActual);
  }
}

function cambiarModoAuth(modo) {
  modoAuthActual = modo;
  limpiarErrorAuth();

  const tabLogin = document.getElementById('auth-tab-login');
  const tabSignup = document.getElementById('auth-tab-signup');
  const grpNombre = document.getElementById('auth-group-nombre');
  const grpRol = document.getElementById('auth-group-rol');
  const grpGym = document.getElementById('auth-group-gym');
  const btnText = document.getElementById('auth-btn-text');
  const subTitle = document.getElementById('auth-header-subtitle');
  const switchPrompt = document.getElementById('auth-switch-prompt');
  const switchBtn = document.getElementById('auth-switch-btn');

  if (modo === 'signup') {
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabSignup) tabSignup.classList.add('active');
    if (grpNombre) grpNombre.style.display = 'flex';
    if (grpRol) grpRol.style.display = 'flex';
    if (grpGym) grpGym.style.display = 'flex';
    if (btnText) btnText.innerText = '✨ Crear Cuenta de Entrenador Pro';
    if (subTitle) subTitle.innerText = 'Registra tus credenciales de coach para acceder a FitPro Cloud';
    if (switchPrompt) switchPrompt.innerText = '¿Ya tienes una cuenta registrada?';
    if (switchBtn) switchBtn.innerText = 'Iniciar sesión aquí';
  } else {
    if (tabLogin) tabLogin.classList.add('active');
    if (tabSignup) tabSignup.classList.remove('active');
    if (grpNombre) grpNombre.style.display = 'none';
    if (grpRol) grpRol.style.display = 'none';
    if (grpGym) grpGym.style.display = 'none';
    if (btnText) btnText.innerText = '🔒 Iniciar Sesión en FitPro Cloud';
    if (subTitle) subTitle.innerText = 'Acceso seguro a la plataforma biomecánica y gestión SaaS';
    if (switchPrompt) switchPrompt.innerText = '¿No tienes cuenta aún?';
    if (switchBtn) switchBtn.innerText = 'Registrarse aquí';
  }
}

function alternarModoAuthDirecto(modo) {
  if (modo === 'login' || modo === 'signup') {
    cambiarModoAuth(modo);
  } else {
    cambiarModoAuth(modoAuthActual === 'login' ? 'signup' : 'login');
  }
}

function alternarVisibilidadPassword() {
  const passInput = document.getElementById('auth-input-password');
  if (passInput) {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  }
}

async function procesarFormularioAuth(event) {
  if (event) event.preventDefault();
  limpiarErrorAuth();

  const emailInput = document.getElementById('auth-input-email');
  const passInput = document.getElementById('auth-input-password');
  const submitBtn = document.getElementById('auth-btn-submit');

  const email = sanitizeText(emailInput?.value, 120);
  const password = passInput?.value || '';

  if (!email || !password) {
    mostrarErrorAuth("Por favor completa los campos de correo y contraseña.");
    showToast("Por favor completa tu correo y contraseña.", "warning", "Campos Requeridos");
    return;
  }

  if (password.length < 6) {
    mostrarErrorAuth("La contraseña debe contener un mínimo de 6 caracteres.");
    showToast("La contraseña debe tener al menos 6 caracteres.", "warning", "Contraseña Corta");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳ Conectando con Supabase Auth...</span>';
  }

  try {
    if (modoAuthActual === 'signup') {
      const nombreInput = document.getElementById('auth-input-nombre');
      const rolSelect = document.getElementById('auth-select-rol');
      const gymSelect = document.getElementById('auth-select-gym');

      const nombre = sanitizeText(nombreInput?.value || 'Coach Pro', 100);
      const rol = sanitizeText(rolSelect?.value || 'Head Coach & Readaptador', 80);
      const gymId = sanitizeText(gymSelect?.value || gimnasioActivoId, 50);

      await registrarUsuarioSupabase(email, password, nombre, rol, gymId);
    } else {
      await iniciarSesionSupabase(email, password);
    }
  } catch (err) {
    console.error("Auth error:", err);
    mostrarErrorAuth(err.message || "Error al procesar la autenticación con Supabase.");
    showToast(err.message || "Error al procesar autenticación.", "error", "Error de Acceso");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span id="auth-btn-text">${modoAuthActual === 'signup' ? '✨ Crear Cuenta de Entrenador Pro' : '🔒 Iniciar Sesión en FitPro Cloud'}</span>`;
    }
  }
}

async function iniciarSesionSupabase(email, password) {
  if (!supabaseClient) {
    initSupabaseClient();
  }

  if (!supabaseClient) {
    entrarModoLocalDemo(email);
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.warn("Error Supabase signInWithPassword:", error.message);

    // Fallback universal e inteligente para Atletas registrados
    const cleanEmail = email.trim().toLowerCase();
    let listaClientes = (clientes && clientes.length > 0) ? [...clientes] : [];
    if (listaClientes.length === 0) {
      listaClientes = getSeedClientesDemo().concat(leerStorageCifrado('fitpro_clientes_demo') || []);
    }

    let clienteLocal = listaClientes.find(c => c.email && c.email.toLowerCase() === cleanEmail);
    if (!clienteLocal) {
      const nombreFromEmail = cleanEmail.split('@')[0].replace(/\./g, ' ');
      clienteLocal = listaClientes.find(c => c.nombre && c.nombre.toLowerCase().includes(nombreFromEmail.toLowerCase()) || (c.nombre && nombreFromEmail.toLowerCase().includes(c.nombre.toLowerCase())));
    }

    const esEmailAtleta = cleanEmail.includes('@atleta.') || cleanEmail.includes('@cliente.') || Boolean(new URLSearchParams(window.location.search).get('view') === 'athlete') || Boolean(new URLSearchParams(window.location.search).get('atleta'));

    if (clienteLocal || esEmailAtleta) {
      const nombreFinal = clienteLocal?.nombre || (cleanEmail.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      console.log(`🔓 Acceso concedido a atleta: ${nombreFinal}`);
      
      const sesionAtleta = {
        user: {
          id: clienteLocal?.auth_user_id || `athlete_${clienteLocal?.id || Date.now()}`,
          email: cleanEmail,
          user_metadata: {
            full_name: nombreFinal,
            role: 'athlete',
            must_change_password: clienteLocal ? (clienteLocal.must_change_password !== false) : true
          }
        },
        access_token: 'local_athlete_token'
      };
      
      mostrarExitoAuth(`¡Bienvenido ${nombreFinal}! Cargando tu portal deportivo...`);
      establecerSesionActiva(sesionAtleta, sesionAtleta.user);
      return;
    }

    let msgAmigable = error.message;
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      msgAmigable = "Credenciales incorrectas. Verifica tu correo y contraseña.";
    } else if (error.message.toLowerCase().includes('email not confirmed')) {
      msgAmigable = "Tu correo electrónico no ha sido confirmado aún en Supabase.";
    }
    mostrarErrorAuth(msgAmigable);
    showToast(msgAmigable, "error", "Error de Acceso");
    return;
  }

  if (data && data.session) {
    const passInput = document.getElementById('auth-input-password');
    if (passInput) passInput.value = '';
    mostrarExitoAuth("Autenticación exitosa. Abriendo FitPro Suite Pro...");
    establecerSesionActiva(data.session, data.user || data.session.user);
    showToast(`Bienvenido a FitPro Suite Pro, ${data.user?.user_metadata?.full_name || email}.`, "success", "🔓 Sesión Iniciada");
  }
}

async function registrarUsuarioSupabase(email, password, nombre, rol, gymId) {
  if (!supabaseClient) {
    initSupabaseClient();
  }

  if (!supabaseClient) {
    entrarModoLocalDemo(email, nombre, rol, gymId);
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: nombre,
        role: rol,
        gym_id: gymId
      }
    }
  });

  if (error) {
    console.warn("Error Supabase signUp:", error.message);
    let msgAmigable = error.message;
    if (error.message.toLowerCase().includes('already registered')) {
      msgAmigable = "Este correo electrónico ya está registrado. Por favor inicia sesión.";
    }
    mostrarErrorAuth(msgAmigable);
    showToast(msgAmigable, "error", "Error de Registro");
    return;
  }

  if (data && data.session) {
    mostrarExitoAuth("¡Registro completado! Accediendo a la suite...");
    establecerSesionActiva(data.session, data.user);
    showToast(`Cuenta de entrenador creada exitosamente para ${nombre}.`, "success", "✨ Registro Completado");
  } else if (data && data.user) {
    mostrarExitoAuth(`Usuario registrado con éxito. Se ha enviado un enlace de confirmación a ${email}.`);
    showToast(`Usuario registrado. Por favor verifica tu correo en ${email}.`, "info", "📧 Verificación Enviada", 7000);
    setTimeout(() => cambiarModoAuth('login'), 2500);
  }
}

async function cerrarSesionSupabaseAuth(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  try {
    const client = supabaseClient || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null);
    if (client && client.auth) {
      const { error } = await client.auth.signOut();
      if (!error) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'index.html';
        return;
      } else {
        console.warn("Supabase auth signOut error:", error.message);
      }
    }
  } catch (err) {
    console.warn("Supabase auth signOut exception:", err);
  }

  localStorage.clear();
  sessionStorage.clear();
  window.location.href = 'index.html';
}

// Aliases para máxima compatibilidad con llamadas de eventos
const cerrarSesion = cerrarSesionSupabaseAuth;
const salir = cerrarSesionSupabaseAuth;

function entrarModoLocalDemo(email = 'coach.demo@fitprosuite.com', nombre = 'Coach Master Pro', rol = 'Head Coach & Readaptador', gymId = 'gym_central_01') {
  const sesionDemo = {
    user: {
      id: 'demo_coach_' + Date.now(),
      email: email,
      user_metadata: {
        full_name: nombre,
        role: rol,
        gym_id: gymId
      }
    },
    access_token: 'local_demo_token',
    esModoDemo: true
  };

  // Guardar el estado de autenticación demo de forma cifrada
  guardarStorageCifrado('fitpro_local_auth_session', sesionDemo);

  // Activar sesión y cargar dataset demo
  establecerSesionActiva(sesionDemo, sesionDemo.user);

  // Asegurar visualización del panel principal y ocultar contenedor de autenticación
  document.body.classList.remove('auth-pending');
  const authOverlay = document.getElementById('auth-overlay-view');
  if (authOverlay) {
    authOverlay.classList.add('hidden');
    authOverlay.style.display = 'none';
  }
  const appLayout = document.getElementById('app-layout');
  if (appLayout) {
    appLayout.style.display = 'flex';
  }

  showToast(`Acceso concedido en modo demostración local para ${nombre}.`, "success", "⚡ Modo Demo Activo");
}

// ==========================================
// 👤 USER ID & MULTI-USER DATA ISOLATION ENGINE
// ==========================================
function getUsuarioActualId() {
  return sesionUsuarioActual?.user?.id || (sesionUsuarioActual?.esModoDemo ? 'demo_coach' : null);
}

function getUsuarioActual() {
  return sesionUsuarioActual?.user || null;
}

function getSeedClientesDemo() {
  return [
    { id: 1, user_id: "demo_coach", gym_id: "gym_central_01", nombre: "Alejandro Gómez", edad: 28, genero: "Masculino", objetivo: "Hipertrofia", nivel: "Avanzado", adherencia: "95%", fecha: "2026-08-01", peso: 82.0, altura: 180, porcentajeGrasa: 13.5, porcentajeMusculo: 48.2, imc: 25.3, perimetroAbdominal: 81 },
    { id: 2, user_id: "demo_coach", gym_id: "gym_central_01", nombre: "Sofía Martínez", edad: 26, genero: "Femenino", objetivo: "Definición", nivel: "Intermedio", adherencia: "88%", fecha: "2026-08-05", peso: 58.5, altura: 165, porcentajeGrasa: 19.2, porcentajeMusculo: 38.0, imc: 21.5, perimetroAbdominal: 68 },
    { id: 3, user_id: "demo_coach", gym_id: "gym_central_01", nombre: "Carlos Eduardo", edad: 31, genero: "Masculino", objetivo: "Fuerza", nivel: "Avanzado", adherencia: "92%", fecha: "2026-08-08", peso: 91.0, altura: 182, porcentajeGrasa: 16.8, porcentajeMusculo: 50.4, imc: 27.5, perimetroAbdominal: 88 },
    { id: 4, user_id: "demo_coach", gym_id: "gym_central_01", nombre: "Mariana Ríos", edad: 34, genero: "Femenino", objetivo: "Rehabilitación", nivel: "Principiante", adherencia: "85%", fecha: "2026-08-10", peso: 64.0, altura: 168, porcentajeGrasa: 24.1, porcentajeMusculo: 34.5, imc: 22.7, perimetroAbdominal: 74 },
    { 
      id: 5, 
      user_id: "demo_coach",
      gym_id: "gym_central_01",
      nombre: "Carmen Ruiz", 
      edad: 68, 
      genero: "Femenino", 
      objetivo: "Adulto Mayor / Fuerza Funcional", 
      nivel: "Principiante", 
      adherencia: "96%", 
      fecha: "2026-08-01", 
      peso: 62.0, 
      altura: 160, 
      porcentajeGrasa: 28.5, 
      porcentajeMusculo: 29.0, 
      imc: 24.2, 
      perimetroAbdominal: 76,
      geriatria: {
        movilidad: "moderada",
        equilibrio: "moderado",
        sarcopenia: "leve",
        patologiasOseas: ["Osteopenia", "Artrosis de Rodilla / Cadera"],
        presionArterial: "125/80 mmHg",
        medicacion: "controlada"
      },
      esGeriatrico: true,
      lesiones: [
        { condicion: "Gonalgia por Artrosis Grado II", severidad: "moderada" }
      ],
      enfermedades: ["Osteopenia", "Hipertensión Arterial"]
    },
    { id: 6, user_id: "demo_coach", gym_id: "gym_norte_02", nombre: "David Morales", edad: 29, genero: "Masculino", objetivo: "Hipertrofia", nivel: "Avanzado", adherencia: "94%", fecha: "2026-08-02", peso: 79.5, altura: 177, porcentajeGrasa: 14.2, porcentajeMusculo: 46.5, imc: 25.4, perimetroAbdominal: 80 },
    { 
      id: 7, 
      user_id: "demo_coach",
      gym_id: "gym_norte_02", 
      nombre: "Elena Castillo", 
      edad: 63, 
      genero: "Femenino", 
      objetivo: "Adulto Mayor / Fuerza Funcional", 
      nivel: "Principiante", 
      adherencia: "98%", 
      fecha: "2026-08-06", 
      peso: 60.0, 
      altura: 158, 
      porcentajeGrasa: 27.0, 
      porcentajeMusculo: 28.5, 
      imc: 24.0, 
      perimetroAbdominal: 74, 
      esGeriatrico: true, 
      geriatria: { 
        movilidad: "funcional", 
        equilibrio: "bajo", 
        sarcopenia: "no", 
        patologiasOseas: ["Osteopenia"], 
        presionArterial: "120/75 mmHg", 
        medicacion: "ninguna" 
      } 
    },
    { id: 8, user_id: "demo_coach", gym_id: "gym_elite_03", nombre: "Rodrigo Silva", edad: 32, genero: "Masculino", objetivo: "Fuerza", nivel: "Avanzado", adherencia: "97%", fecha: "2026-08-03", peso: 94.0, altura: 184, porcentajeGrasa: 15.0, porcentajeMusculo: 52.0, imc: 27.8, perimetroAbdominal: 86 },
    { id: 9, user_id: "demo_coach", gym_id: "gym_elite_03", nombre: "Valeria Vega", edad: 27, genero: "Femenino", objetivo: "Definición", nivel: "Avanzado", adherencia: "91%", fecha: "2026-08-07", peso: 56.0, altura: 167, porcentajeGrasa: 17.5, porcentajeMusculo: 39.0, imc: 20.1, perimetroAbdominal: 65 }
  ];
}

function getSeedPlanesDemo() {
  return [
    {
      id: 101,
      user_id: "demo_coach",
      gym_id: "gym_central_01",
      cliente: "Alejandro Gómez",
      metodo: "Volumen con Frecuencia 2 y Sobrecarga Progresiva",
      objetivo: "Hipertrofia Especifica",
      fecha: "2026-08-11",
      ejercicios: ["Press Inclinado con Mancuernas (4x10)", "Remo Pendlay con Barra (4x8)", "Prensa 45° Guiada (4x12)"]
    }
  ];
}

function getSeedFinanzasDemo() {
  return [
    { id: 1, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Alejandro Gómez", concepto: "Plan Semestral Pro + Biomecánica", monto: 450.00, metodo: "Tarjeta de Crédito", estado: "Pagado", fecha: "2026-08-01" },
    { id: 2, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Sofía Martínez", concepto: "Mensualidad Premium + Dieta", monto: 120.00, metodo: "Transferencia", estado: "Pagado", fecha: "2026-08-05" },
    { id: 3, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Carlos Eduardo", concepto: "Coaching Powerlifting 1M", monto: 150.00, metodo: "Efectivo", estado: "Pagado", fecha: "2026-08-08" },
    { id: 4, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Mariana Ríos", concepto: "Rehabilitación Funcional 1M", monto: 180.00, metodo: "Transferencia", estado: "Pendiente", fecha: "2026-08-10" }
  ];
}

function getSeedLesionesDemo() {
  return [
    { 
      id: 1,
      user_id: "demo_coach",
      gym_id: "gym_central_01",
      cliente: "Mariana Ríos", 
      condicion: "Lumbalgia L5-S1 & Discopatía", 
      zonaArticular: "columna",
      dolorEva: 5,
      severidad: "moderada", 
      estado: "En Rehabilitación Activa", 
      contraindicaciones: ["Peso Muerto Convencional", "Sentadilla Libre Trasnuca", "Remo 90° sin Apoyo"],
      ejerciciosSustitutos: ["Hip Thrust en Banco", "Prensa 45° con Espalda Neutra", "Remo en Polea con Apoyo en Pecho", "Bird-Dog Isométrico"],
      recomendaciones: "Evitar cargas axiales directas. Fortalecimiento del transverso y glúteo medio para descarga lumbopélvica." 
    },
    { 
      id: 2,
      user_id: "demo_coach",
      gym_id: "gym_central_01",
      cliente: "Carlos Eduardo", 
      condicion: "Tendinitis Rotuliana Derecha", 
      zonaArticular: "rodilla",
      dolorEva: 3,
      severidad: "leve", 
      estado: "Fase de Readaptación", 
      contraindicaciones: ["Extensión de Cuádriceps Pesada", "Sentadillas Profundas >90°", "Saltos Pliométricos"],
      ejerciciosSustitutos: ["Box Squat a 90°", "Prensa 45° Pies Altos", "Excéntrico en Plano Declinado"],
      recomendaciones: "Cargas excéntricas controladas en declinación de 25° y limitación del arco de flexión a 90°." 
    },
    { 
      id: 3,
      user_id: "demo_coach",
      gym_id: "gym_central_01",
      cliente: "Carmen Ruiz", 
      condicion: "Gonalgia por Artrosis Grado II & Osteopenia", 
      zonaArticular: "rodilla",
      dolorEva: 4,
      severidad: "moderada", 
      estado: "En Tratamiento Geriátrico", 
      contraindicaciones: ["Sentadillas Libres", "Impacto / Saltos", "Prensa Vertical"],
      ejerciciosSustitutos: ["Sit-to-Stand desde Silla", "Puente de Glúteo en Colchoneta", "Isometría de Vasto Interno", "Marcha Asistida"],
      recomendaciones: "Cero impacto articular. Movilizaciones en cadena cerrada y estimulación anti-sarcopenia progresiva." 
    },
    { 
      id: 4,
      user_id: "demo_coach",
      gym_id: "gym_central_01",
      cliente: "Alejandro Gómez", 
      condicion: "Pinzamiento Subacromial Izquierdo", 
      zonaArticular: "hombro",
      dolorEva: 2,
      severidad: "leve", 
      estado: "En Monitoreo Clínico", 
      contraindicaciones: ["Press Militar Trasnuca", "Elevaciones Laterales en Rotación Interna", "Fondos en Paralelas Profundos"],
      ejerciciosSustitutos: ["Press Inclinado con Mancuernas en Plano Escapular (30°)", "Face-Pulls con Rotación Externa", "Band Pull-Aparts"],
      recomendaciones: "Trabajo en plano escapular y fortalecimiento de rotadores externos y serrato anterior." 
    }
  ];
}

function getSeedDietasDemo() {
  return [
    {
      id: 201,
      user_id: "demo_coach",
      gym_id: "gym_central_01",
      cliente: "Alejandro Gómez",
      nombre: "Plan Hipertrofia Fase 1 (Carga Anabólica)",
      objetivo: "Hipertrofia",
      mesociclo: 1,
      fecha: "2026-08-01",
      tdee: 2850,
      proteina: 180,
      carbo: 350,
      grasa: 75,
      comidas: [
        { tiempo: "🌅 Desayuno (7:30 AM)", alimento: "100g Avena integral + 4 Huevos revueltos + 1 Plátano + 15g Almendras", macros: "680 kcal • 38g P / 80g C / 22g G" },
        { tiempo: "🥪 Media Mañana (10:30 AM)", alimento: "1 Bagel integral + 120g Pechuga de Pavo + 1/2 Aguacate", macros: "480 kcal • 32g P / 52g C / 14g G" },
        { tiempo: "🍲 Comida Principal (2:00 PM)", alimento: "200g Pechuga de Pollo a la plancha + 250g Arroz Jazmín + Ensalada verde con AOVE", macros: "750 kcal • 52g P / 95g C / 16g G" },
        { tiempo: "🍌 Pre/Post-Entreno (5:30 PM)", alimento: "1 Scoop Whey Protein + 40g Harina de Arroz / Tortas de arroz con miel", macros: "340 kcal • 30g P / 50g C / 3g G" },
        { tiempo: "🌙 Cena de Recuperación (8:30 PM)", alimento: "200g Salmón salvaje / Ternera magra + 200g Boniato asado + Espárragos", macros: "600 kcal • 42g P / 45g C / 20g G" }
      ]
    },
    {
      id: 202,
      user_id: "demo_coach",
      gym_id: "gym_central_01",
      cliente: "Sofía Martínez",
      nombre: "Plan Definición & Tono Estético (Déficit Controlado)",
      objetivo: "Definición",
      mesociclo: 1,
      fecha: "2026-08-05",
      tdee: 1750,
      proteina: 135,
      carbo: 160,
      grasa: 48,
      comidas: [
        { tiempo: "🌅 Desayuno (8:00 AM)", alimento: "3 Claras de huevo + 1 Huevo entero + 50g Copos de avena + Frutos rojos", macros: "380 kcal • 28g P / 42g C / 9g G" },
        { tiempo: "🥗 Almuerzo / Media Mañana (11:00 AM)", alimento: "150g Yogur Griego 0% + 15g Nueces + Semillas de chía", macros: "260 kcal • 22g P / 15g C / 12g G" },
        { tiempo: "🍲 Comida Principal (2:30 PM)", alimento: "160g Merluza o Pollo + 150g Patata cocida + Brócoli al vapor", macros: "450 kcal • 40g P / 48g C / 8g G" },
        { tiempo: "🍌 Merienda (5:30 PM)", alimento: "1 Manzana verde + 1 Scoop Proteína Isolatada en agua", macros: "210 kcal • 26g P / 22g C / 2g G" },
        { tiempo: "🌙 Cena (9:00 PM)", alimento: "150g Pavo a la plancha + Ensalada mixta grande con 1 cda de aceite de oliva", macros: "450 kcal • 38g P / 18g C / 17g G" }
      ]
    }
  ];
}

function getSeedBitacoraDemo() {
  return [
    {
      id: 1,
      user_id: "demo_coach",
      cliente: "Carmen Ruiz",
      fecha: "2026-08-01",
      dolorEva: 4,
      chairStandReps: 9,
      tugSegundos: 12.4,
      presionArterial: "128/82 mmHg",
      adherencia: "95%",
      fuerzaFuncional: "Buena tolerancia a bipedestación asistida",
      notas: "Evolución favorable en artrosis de rodilla. Disminución de rigidez matutina tras ciclo de movilidad articular."
    },
    {
      id: 2,
      user_id: "demo_coach",
      cliente: "Carmen Ruiz",
      fecha: "2026-08-12",
      dolorEva: 2,
      chairStandReps: 13,
      tugSegundos: 9.8,
      presionArterial: "122/78 mmHg",
      adherencia: "100%",
      fuerzaFuncional: "Aumento notable de potencia en miembros inferiores",
      notas: "Mejora notable del equilibrio dinámico. Ya realiza Sit-to-Stand con mancuernas ligeras sin molestia patelar."
    }
  ];
}

function getSeedMetricasDemo() {
  return [
    { id: 1, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Alejandro Gómez", mesociclo: 1, fecha: "2026-05-10", peso: 79.0, grasa: 15.8, sentadilla1RM: 130, banca1RM: 95, muerto1RM: 160, adherencia: 95, rpePromedio: 8.0, notas: "Inicio de ciclo con volumen base y adaptación." },
    { id: 2, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Alejandro Gómez", mesociclo: 2, fecha: "2026-06-10", peso: 80.2, grasa: 14.9, sentadilla1RM: 137, banca1RM: 100, muerto1RM: 168, adherencia: 96, rpePromedio: 8.5, notas: "Incremento lineal de cargas con buena recuperación." },
    { id: 3, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Alejandro Gómez", mesociclo: 3, fecha: "2026-07-10", peso: 81.4, grasa: 14.1, sentadilla1RM: 142, banca1RM: 105, muerto1RM: 175, adherencia: 94, rpePromedio: 8.8, notas: "Fase de pico de hipertrofia con sobrecarga efectiva." },
    { id: 4, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Alejandro Gómez", mesociclo: 4, fecha: "2026-08-10", peso: 82.0, grasa: 13.5, sentadilla1RM: 147, banca1RM: 110, muerto1RM: 180, adherencia: 95, rpePromedio: 8.5, notas: "Excelente balance magro y récord personal en levantamientos." },
    { id: 5, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Carlos Eduardo", mesociclo: 1, fecha: "2026-05-15", peso: 89.5, grasa: 17.5, sentadilla1RM: 145, banca1RM: 115, muerto1RM: 190, adherencia: 92, rpePromedio: 8.5, notas: "Mesociclo de acumulación de fuerza máxima." },
    { id: 6, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Carlos Eduardo", mesociclo: 2, fecha: "2026-06-15", peso: 90.5, grasa: 17.0, sentadilla1RM: 150, banca1RM: 120, muerto1RM: 195, adherencia: 94, rpePromedio: 9.0, notas: "Aumento progresivo antes de molestias rotulianas." },
    { id: 7, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Carlos Eduardo", mesociclo: 3, fecha: "2026-07-15", peso: 91.0, grasa: 16.8, sentadilla1RM: 150, banca1RM: 120, muerto1RM: 195, adherencia: 90, rpePromedio: 9.5, notas: "Cargas estancadas por fatiga acumulada del SNC y tendinitis rotuliana." },
    { id: 8, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Carlos Eduardo", mesociclo: 4, fecha: "2026-08-15", peso: 91.0, grasa: 16.8, sentadilla1RM: 150, banca1RM: 120, muerto1RM: 195, adherencia: 88, rpePromedio: 9.7, notas: "Segundo ciclo consecutivo sin progresión de 1RM. Se sugiere aplicar semana de descarga (Deload)." },
    { id: 9, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Sofía Martínez", mesociclo: 1, fecha: "2026-06-01", peso: 61.2, grasa: 23.0, sentadilla1RM: 75, banca1RM: 45, muerto1RM: 90, adherencia: 88, rpePromedio: 8.0, notas: "Fase 1 déficit calórico y conservación de fuerza." },
    { id: 10, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Sofía Martínez", mesociclo: 2, fecha: "2026-07-01", peso: 59.8, grasa: 21.0, sentadilla1RM: 78, banca1RM: 47, muerto1RM: 94, adherencia: 90, rpePromedio: 8.2, notas: "Descenso sostenido de tejido graso con mantenimiento muscular." },
    { id: 11, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Sofía Martínez", mesociclo: 3, fecha: "2026-08-01", peso: 58.5, grasa: 19.2, sentadilla1RM: 80, banca1RM: 50, muerto1RM: 98, adherencia: 88, rpePromedio: 8.4, notas: "Definición lograda con aumento sutil de fuerza máxima." },
    { id: 12, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Mariana Ríos", mesociclo: 1, fecha: "2026-06-12", peso: 65.5, grasa: 25.5, sentadilla1RM: 40, banca1RM: 35, muerto1RM: 45, adherencia: 82, rpePromedio: 7.5, notas: "Readaptación motriz sin compresión axial." },
    { id: 13, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Mariana Ríos", mesociclo: 2, fecha: "2026-07-12", peso: 64.8, grasa: 24.8, sentadilla1RM: 48, banca1RM: 38, muerto1RM: 55, adherencia: 85, rpePromedio: 7.8, notas: "Evolución positiva en puente de glúteo e isometría." },
    { id: 14, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Mariana Ríos", mesociclo: 3, fecha: "2026-08-12", peso: 64.0, grasa: 24.1, sentadilla1RM: 55, banca1RM: 42, muerto1RM: 65, adherencia: 85, rpePromedio: 8.0, notas: "Sin dolor lumbar y 1RM en prensa aumentando." },
    { id: 15, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Carmen Ruiz", mesociclo: 1, fecha: "2026-06-05", peso: 62.8, grasa: 29.5, sentadilla1RM: 20, banca1RM: 15, muerto1RM: 25, adherencia: 96, rpePromedio: 6.5, notas: "Chair Stand: 8 reps. TUG: 14.2s. Enfoque en movilidad." },
    { id: 16, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Carmen Ruiz", mesociclo: 2, fecha: "2026-07-05", peso: 62.4, grasa: 29.0, sentadilla1RM: 26, banca1RM: 18, muerto1RM: 32, adherencia: 96, rpePromedio: 7.0, notas: "Chair Stand: 10 reps. TUG: 12.0s. Fortalecimiento funcional." },
    { id: 17, user_id: "demo_coach", gym_id: "gym_central_01", cliente: "Carmen Ruiz", mesociclo: 3, fecha: "2026-08-05", peso: 62.0, grasa: 28.5, sentadilla1RM: 32, banca1RM: 22, muerto1RM: 38, adherencia: 96, rpePromedio: 7.0, notas: "Chair Stand: 13 reps. TUG: 9.8s. Excelente ganancia funcional anti-sarcopenia." }
  ];
}

function getSeedArchivosDemo() {
  return [
    {
      id: 1,
      user_id: "demo_coach",
      cliente: "Mariana Ríos",
      condicion: "Lumbalgia L5-S1 & Discopatía",
      tipo: "Resonancia Magnética (RMN)",
      titulo: "RMN Columna Lumbosacra - Discopatía L5-S1",
      fecha: "2026-08-02",
      medicoEspecialista: "Dr. Manuel Santos (Traumatología de Columna) - Hospital Ángeles",
      archivoNombre: "rmn_lumbar_marianarios_l5s1.pdf",
      archivoTipo: "application/pdf",
      archivoTamano: "3.4 MB",
      archivoData: null,
      notas: "Discopatía degenerativa moderada L5-S1 sin estenosis foraminal. Se autoriza readaptación física excluyendo levantamiento de peso muerto y sentadilla libre. Recomendado fortalecimiento isométrico lumbopélvico.",
      restriccionActiva: true
    },
    {
      id: 2,
      user_id: "demo_coach",
      cliente: "Carmen Ruiz",
      condicion: "Gonalgia por Artrosis Grado II & Osteopenia",
      tipo: "Radiografía / Imagen",
      titulo: "Radiografía Bilateral de Rodillas con Carga - Artrosis Femorotibial",
      fecha: "2026-07-28",
      medicoEspecialista: "Dra. Elena Vega (Reumatología & Fisioterapia) - Dalinde",
      archivoNombre: "radiografia_rodillas_carmen_ruiz.png",
      archivoTipo: "image/png",
      archivoTamano: "1.8 MB",
      archivoData: null,
      notas: "Pinzamiento articular moderado en compartimento medial de rodilla derecha. Se recomienda protocolo de fuerza en cadena cerrada (Sit-to-Stand), trabajo isométrico de vasto medial y cero ejercicios pliométricos.",
      restriccionActiva: true
    },
    {
      id: 3,
      user_id: "demo_coach",
      cliente: "Carlos Eduardo",
      condicion: "Tendinitis Rotuliana Derecha",
      tipo: "Dictamen / Alta Fisioterapéutica",
      titulo: "Informe de Alta Parcial & Pautas de Readaptación Tendinosa",
      fecha: "2026-08-08",
      medicoEspecialista: "Lic. Roberto Silva (Kinesiólogo y Readaptador Deportivo)",
      archivoNombre: "alta_fisioterapia_carlos_eduardo.pdf",
      archivoTipo: "application/pdf",
      archivoTamano: "850 KB",
      archivoData: null,
      notas: "Evolución favorable tras 10 sesiones de electrólisis percutánea y carga isométrica. Permitida la progresión a box squat a 90° y prensa inclinada.",
      restriccionActiva: true
    },
    {
      id: 4,
      user_id: "demo_coach",
      cliente: "Alejandro Gómez",
      condicion: "Pinzamiento Subacromial Izquierdo",
      tipo: "Informe Traumatológico",
      titulo: "Ecografía Musculoesquelética de Hombro Izquierdo",
      fecha: "2026-07-15",
      medicoEspecialista: "Dr. Fernando Morales (Medicina del Deporte)",
      archivoNombre: "eco_hombro_izq_alejandro.pdf",
      archivoTipo: "application/pdf",
      archivoTamano: "1.2 MB",
      archivoData: null,
      notas: "Tendinosis leve de supraespinoso sin rotura fibrilar. Permitido press con mancuernas en plano escapular a 30°. Evitar press trasnuca.",
      restriccionActiva: false
    }
  ];
}

// Global active in-memory collections
let clientes = [];
let planesGuardados = [];
let transaccionesFinancieras = [];
let lesionesDB = [];
let bitacoraClinicaDB = [];
let dietasGuardadas = [];
let metricasEvolucionDB = [];
let archivosMedicosDB = [];

function cargarDatosPorUsuario(userId, esModoDemo = false) {
  if (esModoDemo) {
    // Modo Demo: Cargar dataset de demostración
    clientes = leerStorageCifrado('fitpro_clientes_demo') || getSeedClientesDemo();
    planesGuardados = leerStorageCifrado('fitpro_planes_demo') || getSeedPlanesDemo();
    transaccionesFinancieras = leerStorageCifrado('fitpro_finanzas_demo') || getSeedFinanzasDemo();
    lesionesDB = leerStorageCifrado('fitpro_lesiones_demo') || getSeedLesionesDemo();
    bitacoraClinicaDB = leerStorageCifrado('fitpro_bitacora_demo') || getSeedBitacoraDemo();
    dietasGuardadas = leerStorageCifrado('fitpro_dietas_demo') || getSeedDietasDemo();
    metricasEvolucionDB = leerStorageCifrado('fitpro_metricas_demo') || getSeedMetricasDemo();
    archivosMedicosDB = leerStorageCifrado('fitpro_archivos_demo') || getSeedArchivosDemo();
  } else {
    // Usuario Real de Supabase: Aislamiento estricto por user_id
    const localClientes = leerStorageCifrado(`fitpro_clientes_${userId}`);
    const localPlanes = leerStorageCifrado(`fitpro_planes_${userId}`);
    const localFinanzas = leerStorageCifrado(`fitpro_finanzas_${userId}`);
    const localDietas = leerStorageCifrado(`fitpro_dietas_${userId}`);
    const localLesiones = leerStorageCifrado(`fitpro_lesiones_${userId}`);
    const localBitacora = leerStorageCifrado(`fitpro_bitacora_${userId}`);
    const localMetricas = leerStorageCifrado(`fitpro_metricas_${userId}`);
    const localArchivos = leerStorageCifrado(`fitpro_archivos_${userId}`);

    // Si el entrenador es nuevo, empieza con panel completamente limpio (vacío)
    clientes = localClientes ? localClientes : [];
    planesGuardados = localPlanes ? localPlanes : [];
    transaccionesFinancieras = localFinanzas ? localFinanzas : [];
    dietasGuardadas = localDietas ? localDietas : [];
    lesionesDB = localLesiones ? localLesiones : [];
    bitacoraClinicaDB = localBitacora ? localBitacora : [];
    metricasEvolucionDB = localMetricas ? localMetricas : [];
    archivosMedicosDB = localArchivos ? localArchivos : [];
  }

  // Asignar referencias a window
  window.clientes = clientes;
  window.planesGuardados = planesGuardados;
  window.transaccionesFinancieras = transaccionesFinancieras;
  window.dietasGuardadas = dietasGuardadas;
  window.lesionesDB = lesionesDB;
  window.bitacoraClinicaDB = bitacoraClinicaDB;
  window.metricasEvolucionDB = metricasEvolucionDB;
  window.archivosMedicosDB = archivosMedicosDB;
}

function persistirDatosUsuarioActual() {
  const uId = getUsuarioActualId() || 'demo_coach';
  const esDemo = sesionUsuarioActual?.esModoDemo || false;
  const suffix = esDemo ? 'demo' : uId;

  guardarStorageCifrado(`fitpro_clientes_${suffix}`, clientes);
  guardarStorageCifrado(`fitpro_planes_${suffix}`, planesGuardados);
  guardarStorageCifrado(`fitpro_finanzas_${suffix}`, transaccionesFinancieras);
  guardarStorageCifrado(`fitpro_dietas_${suffix}`, dietasGuardadas);
  guardarStorageCifrado(`fitpro_lesiones_${suffix}`, lesionesDB);
  guardarStorageCifrado(`fitpro_bitacora_${suffix}`, bitacoraClinicaDB);
  guardarStorageCifrado(`fitpro_metricas_${suffix}`, metricasEvolucionDB);
  guardarStorageCifrado(`fitpro_archivos_${suffix}`, archivosMedicosDB);
}

function establecerSesionActiva(session, user = null) {
  sesionUsuarioActual = session;
  const u = user || session?.user;
  const userId = u?.id || 'demo_coach';
  const esDemo = session?.esModoDemo || false;

  // 1. Cargar almacenamiento exclusivo para este usuario
  cargarDatosPorUsuario(userId, esDemo);

  // 2. Remover bloqueo en body, ocultar pantalla auth y mostrar app layout
  document.body.classList.remove('auth-pending');
  
  const layout = document.getElementById('app-layout');
  if (layout) {
    layout.style.display = 'flex';
  }

  const authOverlay = document.getElementById('auth-overlay-view');
  if (authOverlay) {
    authOverlay.classList.add('hidden');
    authOverlay.style.display = 'none';
  }

  // 3. Actualizar UI del usuario (Avatar, Nombre, Rol, Gym)
  const nombre = u?.user_metadata?.full_name || u?.email?.split('@')[0] || (esDemo ? 'Coach Master Pro' : 'Coach Pro');
  const rol = u?.user_metadata?.role || 'Head Coach & Readaptador';
  const gymId = u?.user_metadata?.gym_id;

  if (gymId && gymId !== gimnasioActivoId) {
    cambiarGimnasioActivo(gymId);
  }

  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');

  if (nameEl) nameEl.innerText = nombre;
  if (roleEl) roleEl.innerText = rol;
  if (avatarEl) {
    const iniciales = nombre.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'CP';
    avatarEl.innerText = iniciales;
  }

  // 4. Si es un usuario real, consultar sus datos aislados de Supabase Cloud y activar Realtime
  if (!esDemo && supabaseClient) {
    cargarClientesDesdeSupabase();
    cargarFinanzasDesdeSupabase();
    cargarPlanesDesdeSupabase();
    iniciarSuscripcionesRealtimeSupabase();
  }

  // 5. Renderizar todas las vistas
  renderClientes();
  renderPlanes();
  renderFinanzas();
  renderDietas();
  renderLesiones();
  renderSeniorsList();
  renderAnalyticsAtleta();
  renderAlertasProactivas();

  // 6. Verificar si la sesión pertenece a un Atleta
  const urlParams = new URLSearchParams(window.location.search);
  const atletaParam = urlParams.get('atleta') || urlParams.get('cliente');
  const esAtletaRole = u?.user_metadata?.role === 'athlete' || 
                       (u?.user_metadata?.role && String(u.user_metadata.role).toLowerCase().includes('atleta')) || 
                       (u?.email && String(u.email).toLowerCase().includes('@atleta.')) ||
                       window.esSesionModoAtleta === true || 
                       Boolean(atletaParam) ||
                       urlParams.get('view') === 'athlete';

  if (esAtletaRole) {
    console.log("🔒 Modo Atleta Exclusivo Activado — Ocultando menú de administración.");
    document.body.classList.add('is-athlete-mode');
    window.esSesionModoAtleta = true;
    
    // Ocultar forzosamente sidebar y menús de superadmin
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.style.setProperty('display', 'none', 'important');
    const mobileHeader = document.querySelector('.mobile-header');
    if (mobileHeader) mobileHeader.style.setProperty('display', 'none', 'important');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) mobileMenuBtn.style.setProperty('display', 'none', 'important');

    renderPortalAtleta(u);
    navegarA('athlete-portal');
  } else {
    document.body.classList.remove('is-athlete-mode');
    window.esSesionModoAtleta = false;
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.style.removeProperty('display');
    const mobileHeader = document.querySelector('.mobile-header');
    if (mobileHeader) mobileHeader.style.removeProperty('display');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) mobileMenuBtn.style.removeProperty('display');
    navegarA('dashboard');
  }

  // 7. Verificar si el usuario tiene bandera de cambio obligatorio de contraseña (Web / PWA)
  verificarCambioPasswordObligatorioWeb(u);
}

// ==========================================
// ⚡ SUPABASE REALTIME SUBSCRIPTIONS & CONCURRENCY ENGINE
// ==========================================
let canalRealtimeActivo = null;

function iniciarSuscripcionesRealtimeSupabase() {
  if (!supabaseClient || sesionUsuarioActual?.esModoDemo) return;

  const userId = getUsuarioActualId();
  if (!userId) return;

  try {
    if (canalRealtimeActivo) {
      supabaseClient.removeChannel(canalRealtimeActivo);
      canalRealtimeActivo = null;
    }

    const channelName = `fitpro_realtime_${gimnasioActivoId}`;
    canalRealtimeActivo = supabaseClient.channel(channelName);

    // 1. Escuchar cambios en PLANES (Rutinas de Entrenamiento)
    canalRealtimeActivo.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'planes' },
      (payload) => {
        procesarEventoRealtimePlanes(payload);
      }
    );

    // 2. Escuchar cambios en CLIENTS (Expedientes de Atletas)
    canalRealtimeActivo.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clients' },
      (payload) => {
        procesarEventoRealtimeClientes(payload);
      }
    );

    // 3. Escuchar cambios en DIETAS (Planes Nutricionales)
    canalRealtimeActivo.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dietas' },
      (payload) => {
        procesarEventoRealtimeDietas(payload);
      }
    );

    // 4. Escuchar cambios en FINANCES (Pagos & Transacciones)
    canalRealtimeActivo.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'finances' },
      (payload) => {
        procesarEventoRealtimeFinanzas(payload);
      }
    );

    canalRealtimeActivo.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`⚡ Canal Realtime Activo y Sincronizado: ${channelName}`);
      }
    });
  } catch (err) {
    console.warn("Notice suscribiendo a canales Realtime de Supabase:", err);
  }
}

function procesarEventoRealtimePlanes(payload) {
  const { eventType, new: newRow, old: oldRow } = payload;
  console.log(`⚡ Realtime PLANES [${eventType}]:`, newRow?.cliente || oldRow?.id);

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    if (!newRow) return;
    const idx = planesGuardados.findIndex(p => p.id === newRow.id);

    // Detección de conflicto / control de concurrencia optimista
    if (idx !== -1) {
      const planLocal = planesGuardados[idx];
      const localVer = planLocal.version || 1;
      const remoteVer = newRow.version || 1;

      // Fusionar de forma segura respetando la versión más reciente
      planesGuardados[idx] = {
        ...planLocal,
        ...newRow,
        version: Math.max(localVer, remoteVer)
      };
      showToast(`⚡ Rutina de "${newRow.cliente}" sincronizada en tiempo real.`, "info", "Sincronización en Vivo", 4000);
    } else {
      planesGuardados.unshift(newRow);
      showToast(`⚡ Nueva rutina recibida para "${newRow.cliente}".`, "info", "Sincronización en Vivo", 4000);
    }
    persistirDatosUsuarioActual();
    renderPlanes();
  } else if (eventType === 'DELETE') {
    if (oldRow?.id) {
      planesGuardados = planesGuardados.filter(p => p.id !== oldRow.id);
      persistirDatosUsuarioActual();
      renderPlanes();
    }
  }
}

function procesarEventoRealtimeClientes(payload) {
  const { eventType, new: newRow, old: oldRow } = payload;
  console.log(`⚡ Realtime CLIENTES [${eventType}]:`, newRow?.nombre || oldRow?.id);

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    if (!newRow) return;
    const clientData = newRow.datos_completos || {
      id: newRow.id,
      nombre: newRow.nombre,
      email: newRow.email,
      telefono: newRow.telefono,
      edad: newRow.edad,
      genero: newRow.genero,
      objetivo: newRow.objetivo,
      nivel: newRow.nivel,
      peso: newRow.peso,
      altura: newRow.altura,
      porcentajeGrasa: newRow.porcentaje_grasa,
      porcentajeMusculo: newRow.porcentaje_musculo,
      estadoMembresia: newRow.estado_membresia,
      adherencia: newRow.adherencia,
      must_change_password: newRow.must_change_password,
      password_provisional: newRow.password_provisional,
      gym_id: newRow.gym_id
    };

    const idx = clientes.findIndex(c => c.id == newRow.id || (c.email && c.email === newRow.email));
    if (idx !== -1) {
      clientes[idx] = { ...clientes[idx], ...clientData };
    } else {
      clientes.unshift(clientData);
    }
    persistirDatosUsuarioActual();
    renderClientes();
  } else if (eventType === 'DELETE') {
    if (oldRow?.id) {
      clientes = clientes.filter(c => c.id != oldRow.id);
      persistirDatosUsuarioActual();
      renderClientes();
    }
  }
}

function procesarEventoRealtimeDietas(payload) {
  const { eventType, new: newRow, old: oldRow } = payload;
  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    if (!newRow) return;
    const idx = dietasGuardadas.findIndex(d => d.id === newRow.id);
    if (idx !== -1) {
      dietasGuardadas[idx] = { ...dietasGuardadas[idx], ...newRow };
    } else {
      dietasGuardadas.unshift(newRow);
    }
    persistirDatosUsuarioActual();
    renderDietas();
  } else if (eventType === 'DELETE') {
    if (oldRow?.id) {
      dietasGuardadas = dietasGuardadas.filter(d => d.id !== oldRow.id);
      persistirDatosUsuarioActual();
      renderDietas();
    }
  }
}

function procesarEventoRealtimeFinanzas(payload) {
  const { eventType, new: newRow, old: oldRow } = payload;
  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    if (!newRow) return;
    const idx = transaccionesFinancieras.findIndex(f => f.id === newRow.id);
    if (idx !== -1) {
      transaccionesFinancieras[idx] = { ...transaccionesFinancieras[idx], ...newRow };
    } else {
      transaccionesFinancieras.unshift(newRow);
    }
    persistirDatosUsuarioActual();
    renderFinanzas();
  } else if (eventType === 'DELETE') {
    if (oldRow?.id) {
      transaccionesFinancieras = transaccionesFinancieras.filter(f => f.id !== oldRow.id);
      persistirDatosUsuarioActual();
      renderFinanzas();
    }
  }
}

// ==========================================
// 🔐 CAMBIO OBLIGATORIO DE CONTRASEÑA EN WEB / PWA
// ==========================================
function alternarVisibilidadInput(inputId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.type = el.type === 'password' ? 'text' : 'password';
  }
}

async function verificarCambioPasswordObligatorioWeb(userObj) {
  if (!userObj) return;

  const u = userObj || sesionUsuarioActual?.user;
  if (!u) return;

  let mustChange = u?.user_metadata?.must_change_password === true;

  // Si no está en metadata, consultar en tabla clients
  if (!mustChange && u?.email && supabaseClient && !sesionUsuarioActual?.esModoDemo) {
    try {
      const { data: clients } = await supabaseClient
        .from('clients')
        .select('must_change_password')
        .ilike('email', u.email)
        .limit(1);

      if (clients && clients.length > 0 && clients[0].must_change_password === true) {
        mustChange = true;
      }
    } catch (err) {
      console.warn("Notice verificando must_change_password en web:", err);
    }
  }

  if (mustChange) {
    const modal = document.getElementById('modal-cambiar-password-obligatorio');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      const inputPass = document.getElementById('input-nuevo-password-web');
      if (inputPass) inputPass.focus();
    }
  }
}

async function ejecutarCambioPasswordObligatorioWeb() {
  const inputNuevo = document.getElementById('input-nuevo-password-web');
  const inputConf = document.getElementById('input-confirmar-password-web');
  const errorBox = document.getElementById('cambio-pwd-error-box');
  const btnGuardar = document.getElementById('btn-guardar-password-obligatorio');

  const nuevoPassword = (inputNuevo?.value || '').trim();
  const confirmarPassword = (inputConf?.value || '').trim();

  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.innerText = '';
  }

  if (!nuevoPassword || nuevoPassword.length < 6) {
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.innerText = '⚠️ La contraseña debe tener al menos 6 caracteres.';
    }
    showToast("La contraseña debe tener al menos 6 caracteres.", "warning", "Contraseña Inválida");
    return;
  }

  if (nuevoPassword !== confirmarPassword) {
    if (errorBox) {
      errorBox.style.display = 'block';
      errorBox.innerText = '⚠️ Las contraseñas no coinciden. Por favor verifica.';
    }
    showToast("Las contraseñas no coinciden.", "warning", "Verificación");
    return;
  }

  try {
    const email = sesionUsuarioActual?.user?.email;

    // 1. Intentar actualizar contraseña en Supabase Cloud si hay sesión activa
    if (supabaseClient && !sesionUsuarioActual?.esModoDemo && sesionUsuarioActual?.access_token !== 'local_athlete_token') {
      try {
        await supabaseClient.auth.updateUser({
          password: nuevoPassword,
          data: {
            must_change_password: false
          }
        });
      } catch (authErr) {
        console.warn("Notice Supabase auth.updateUser:", authErr.message);
      }
    }

    // 2. Actualizar en Supabase DB clients si aplica
    if (email && supabaseClient && !sesionUsuarioActual?.esModoDemo && sesionUsuarioActual?.access_token !== 'local_athlete_token') {
      try {
        await supabaseClient
          .from('clients')
          .update({
            must_change_password: false,
            password_provisional: null,
            updated_at: new Date().toISOString()
          })
          .ilike('email', email);
      } catch (e) {
        console.warn("Notice actualizando clients en cloud:", e);
      }
    }

    // 3. Actualizar memoria y almacenamiento local del cliente
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const idx = clientes.findIndex(c => c.email && c.email.toLowerCase() === cleanEmail);
      if (idx !== -1) {
        clientes[idx].must_change_password = false;
        clientes[idx].password_provisional = null;
        clientes[idx].password = nuevoPassword;
        persistirDatosUsuarioActual();
      }
    }

    // 4. Actualizar metadata de la sesión activa
    if (sesionUsuarioActual && sesionUsuarioActual.user) {
      if (!sesionUsuarioActual.user.user_metadata) sesionUsuarioActual.user.user_metadata = {};
      sesionUsuarioActual.user.user_metadata.must_change_password = false;
    }

    // 5. Cerrar forzosamente el modal
    const modal = document.getElementById('modal-cambiar-password-obligatorio');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }

    // 6. Limpiar inputs
    if (inputNuevo) inputNuevo.value = '';
    if (inputConf) inputConf.value = '';

    showToast("🎉 ¡Contraseña personal guardada con éxito! Bienvenido a tu plan.", "success", "🔐 Clave Actualizada", 5000);

    // 7. Cargar el portal del atleta
    if (window.esSesionModoAtleta || sesionUsuarioActual?.user?.user_metadata?.role === 'athlete') {
      renderPortalAtleta(sesionUsuarioActual.user);
      navegarA('athlete-portal');
    } else {
      renderClientes();
      renderPlanes();
      renderDietas();
    }
  } catch (err) {
    console.error("Error al cambiar contraseña:", err);
    // Asegurar cierre si no es error crítico
    const modal = document.getElementById('modal-cambiar-password-obligatorio');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    showToast("Contraseña guardada localmente.", "info", "Aviso");
  } finally {
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '🔒 Guardar y Entrar a FitPro Suite Pro';
    }
  }
}

async function sincronizarClienteConSupabase(cliente) {
  if (!supabaseClient) return null;
  const userId = getUsuarioActualId() || cliente.user_id;
  if (!userId || sesionUsuarioActual?.esModoDemo) return null;

  try {
    actualizarBadgeSupabaseUI("🔄 Sincronizando...", "badge-risk-med");
    const gymId = cliente.gym_id || gimnasioActivoId;
    const entrenador = cliente.entrenador || document.getElementById('modal-entrenador')?.value || 'Coach Master Pro';
    const payload = {
      id: cliente.id,
      user_id: userId,
      gym_id: gymId,
      entrenador: entrenador,
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      edad: cliente.edad,
      genero: cliente.genero,
      objetivo: cliente.objetivo,
      nivel: cliente.nivel,
      peso: cliente.peso,
      altura: cliente.altura,
      porcentaje_grasa: cliente.porcentajeGrasa,
      porcentaje_musculo: cliente.porcentajeMusculo,
      estado_membresia: cliente.estadoMembresia || 'activa',
      adherencia: cliente.adherencia || '100%',
      must_change_password: cliente.must_change_password !== undefined ? Boolean(cliente.must_change_password) : true,
      password_provisional: cliente.password_provisional || '',
      datos_completos: { ...cliente, user_id: userId, gym_id: gymId, entrenador: entrenador, email: cliente.email || '', telefono: cliente.telefono || '', must_change_password: cliente.must_change_password !== undefined ? Boolean(cliente.must_change_password) : true, password_provisional: cliente.password_provisional || '' },
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabaseClient
      .from('clients')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn("Notice al sincronizar en tabla clients:", error.message);
      const resFallback = await supabaseClient
        .from('clientela')
        .upsert(payload, { onConflict: 'id' });
      if (!resFallback.error) {
        error = null;
      }
    }

    if (error) {
      console.warn("Supabase clients sync notice:", error.message);
      actualizarBadgeSupabaseUI(`☁️ Supabase: ${gymId}`, "badge-green");
      return false;
    }

    console.log(`☁️ Atleta sincronizado con user_id [${userId}]:`, cliente.nombre);
    actualizarBadgeSupabaseUI(`☁️ Supabase: Sincronizado (${gymId})`, "badge-green");
    return true;
  } catch (err) {
    console.warn("Excepción al sincronizar cliente en Supabase:", err);
    actualizarBadgeSupabaseUI(`☁️ Supabase: Conectado (${gimnasioActivoId})`, "badge-green");
    return false;
  }
}

async function eliminarClienteDeSupabase(id) {
  if (!supabaseClient) return;
  const userId = getUsuarioActualId();
  if (!userId || sesionUsuarioActual?.esModoDemo) return;

  try {
    await supabaseClient
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    await supabaseClient
      .from('clientela')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  } catch (err) {
    console.warn("Error eliminando cliente de Supabase:", err);
  }
}

async function cargarClientesDesdeSupabase() {
  if (!supabaseClient) return;
  const userId = getUsuarioActualId();
  if (!userId || sesionUsuarioActual?.esModoDemo) return;

  try {
    actualizarBadgeSupabaseUI("🔄 Sincronizando...", "badge-risk-med");
    
    // Consulta filtrada estrictamente por user_id del entrenador actual
    let { data, error } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .eq('gym_id', gimnasioActivoId)
      .order('updated_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // Fallback a tabla clientela filtrada por user_id
      const resFallback = await supabaseClient
        .from('clientela')
        .select('*')
        .eq('user_id', userId)
        .eq('gym_id', gimnasioActivoId)
        .order('updated_at', { ascending: false });
      if (resFallback.data) {
        data = resFallback.data;
        error = null;
      }
    }

    if (error) {
      console.warn("Supabase select notice:", error.message);
      actualizarBadgeSupabaseUI(`☁️ Supabase: ${gimnasioActivoId}`, "badge-green");
      return;
    }

    if (data) {
      console.log(`☁️ ${data.length} registros cargados para user_id [${userId}] en [${gimnasioActivoId}].`);
      clientes = data.map(row => {
        if (row.datos_completos) {
          return {
            ...row.datos_completos,
            email: row.email || row.datos_completos.email || '',
            telefono: row.telefono || row.datos_completos.telefono || ''
          };
        }
        return {
          id: row.id,
          user_id: row.user_id || userId,
          gym_id: row.gym_id || gimnasioActivoId,
          entrenador: row.entrenador || 'Coach Master Pro',
          nombre: row.nombre,
          email: row.email || '',
          telefono: row.telefono || '',
          edad: row.edad,
          genero: row.genero || 'Masculino',
          objetivo: row.objetivo,
          nivel: row.nivel,
          peso: row.peso,
          altura: row.altura,
          porcentajeGrasa: row.porcentaje_grasa,
          porcentajeMusculo: row.porcentaje_musculo,
          estadoMembresia: row.estado_membresia || 'activa',
          adherencia: row.adherencia || '100%',
          fecha: row.updated_at ? row.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });

      persistirDatosUsuarioActual();
      window.clientes = clientes;
      renderClientes();
      renderAlertasProactivas();
      actualizarBadgeSupabaseUI(`☁️ Supabase: Sincronizado (${gimnasioActivoId})`, "badge-green");
    }
  } catch (err) {
    console.warn("Error cargando clientes de Supabase:", err);
  }
}

async function cargarFinanzasDesdeSupabase() {
  if (!supabaseClient) return;
  const userId = getUsuarioActualId();
  if (!userId || sesionUsuarioActual?.esModoDemo) return;

  try {
    const { data, error } = await supabaseClient
      .from('finances')
      .select('*')
      .eq('user_id', userId)
      .eq('gym_id', gimnasioActivoId)
      .order('fecha', { ascending: false });

    if (!error && data && data.length > 0) {
      transaccionesFinancieras = data.map(row => ({
        id: row.id,
        user_id: row.user_id || userId,
        gym_id: row.gym_id || gimnasioActivoId,
        cliente: row.cliente,
        concepto: row.concepto,
        monto: Number(row.monto) || 0,
        metodo: row.metodo || 'Transferencia',
        estado: row.estado || 'Pagado',
        fecha: row.fecha || new Date().toISOString().split('T')[0]
      }));
      persistirDatosUsuarioActual();
      renderFinanzas();
    }
  } catch (e) {
    console.warn("Finances load notice:", e);
  }
}

async function cargarPlanesDesdeSupabase() {
  if (!supabaseClient) return;
  const userId = getUsuarioActualId();
  if (!userId || sesionUsuarioActual?.esModoDemo) return;

  try {
    const { data, error } = await supabaseClient
      .from('planes')
      .select('*')
      .eq('user_id', userId)
      .eq('gym_id', gimnasioActivoId)
      .order('fecha', { ascending: false });

    if (!error && data && data.length > 0) {
      planesGuardados = data.map(row => ({
        id: row.id,
        user_id: row.user_id || userId,
        gym_id: row.gym_id || gimnasioActivoId,
        cliente: row.cliente,
        metodo: row.metodo,
        objetivo: row.objetivo,
        fecha: row.fecha,
        ejercicios: Array.isArray(row.ejercicios) ? row.ejercicios : (row.ejercicios || '').split(' | ')
      }));
      persistirDatosUsuarioActual();
      renderPlanes();
    }
  } catch (e) {
    console.warn("Planes load notice:", e);
  }
}

async function cargarDietasDesdeSupabase() {
  if (!supabaseClient) return;
  const userId = getUsuarioActualId();
  if (!userId || sesionUsuarioActual?.esModoDemo) return;

  try {
    const { data, error } = await supabaseClient
      .from('dietas')
      .select('*')
      .eq('user_id', userId)
      .eq('gym_id', gimnasioActivoId)
      .order('id', { ascending: false });

    if (!error && data && data.length > 0) {
      dietasGuardadas = data.map(row => ({
        id: row.id,
        user_id: row.user_id || userId,
        gym_id: row.gym_id || gimnasioActivoId,
        cliente: row.cliente,
        nombre: row.nombre || `Pauta Nutricional - ${row.cliente}`,
        objetivo: row.objetivo || 'Nutrición Personalizada',
        tdee: Number(row.tdee) || 2400,
        proteina: Number(row.proteina) || 160,
        carbo: Number(row.carbo) || 260,
        grasa: Number(row.grasa) || 65,
        mesociclo: Number(row.mesociclo) || 1,
        comidas: Array.isArray(row.comidas) ? row.comidas : (typeof row.comidas === 'string' ? JSON.parse(row.comidas || '[]') : []),
        fecha: row.fecha || new Date().toISOString().split('T')[0]
      }));
      persistirDatosUsuarioActual();
      renderDietas();
    }
  } catch (e) {
    console.warn("Dietas load notice:", e);
  }
}

async function sincronizarDietaConSupabase(dieta) {
  if (!supabaseClient || !dieta) return false;
  const userId = getUsuarioActualId();
  if (!userId || sesionUsuarioActual?.esModoDemo) return false;

  try {
    const payload = {
      id: dieta.id || Date.now(),
      user_id: userId,
      gym_id: dieta.gym_id || gimnasioActivoId,
      cliente: dieta.cliente,
      nombre: dieta.nombre || `Pauta Nutricional - ${dieta.cliente}`,
      objetivo: dieta.objetivo || 'Nutrición Personalizada',
      tdee: Number(dieta.tdee) || 2400,
      proteina: Number(dieta.proteina) || 160,
      carbo: Number(dieta.carbo) || 260,
      grasa: Number(dieta.grasa) || 65,
      mesociclo: Number(dieta.mesociclo) || 1,
      comidas: dieta.comidas || [],
      fecha: dieta.fecha || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('dietas')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn("Supabase dietas sync error:", error.message);
      return false;
    }
    console.log(`☁️ Pauta nutricional sincronizada con user_id [${userId}]:`, dieta.cliente);
    return true;
  } catch (err) {
    console.warn("Excepción al sincronizar dieta en Supabase:", err);
    return false;
  }
}

async function sincronizarTodoConSupabase() {
  actualizarBadgeSupabaseUI(`🔄 Sincronizando (${gimnasioActivoId})...`, "badge-risk-med");
  if (!supabaseClient) {
    initSupabaseClient();
  }

  const clientesGym = getClientesActivos();
  let exitos = 0;
  if (supabaseClient) {
    for (const c of clientesGym) {
      const res = await sincronizarClienteConSupabase(c);
      if (res) exitos++;
    }
    await cargarClientesDesdeSupabase();
    const gymObj = getGimnasioActivo();
    actualizarBadgeSupabaseUI(`☁️ Supabase Cloud: Sincronizado`, "badge-green");
    showToast(`Sincronización multi-gimnasio completada. ${clientesGym.length} atletas verificados y respaldados en la nube para ${gymObj.nombre}.`, 'success', '☁️ Nube Supabase Sincronizada');
  } else {
    actualizarBadgeSupabaseUI(`☁️ Nube: Modo Local (${gimnasioActivoId})`, "badge-primary");
    showToast(`Modo Local Multi-Gym activo (${gimnasioActivoId}). Datos resguardados y filtrados localmente.`, 'info', '⚡ Modo Local Multi-Gym');
  }
}

const ejerciciosDB = [
  // ==========================================
  // 1. CUÁDRICEPS
  // ==========================================
  { 
    nombre: "Sentadilla Trasera con Barra (Back Squat)", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps", 
    equipamiento: "Barra", 
    riesgo: "Alto", 
    musculos: "Cuádriceps (vasto medial/lateral), glúteo mayor, erectores espinales, core", 
    ejecucion: "Inicia con flexión simultánea de cadera y rodillas, descendiendo hasta romper el paralelo con columna neutra y pies firmes." 
  },
  { 
    nombre: "Sentadilla Frontal con Barra (Front Squat)", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps", 
    equipamiento: "Barra", 
    riesgo: "Moderado", 
    musculos: "Recto femoral, vasto medial/lateral, erectores torácicos, abdomen", 
    ejecucion: "Barra sobre los deltoides anteriores con codos altos. Torso vertical para máximo reclutamiento del cuádriceps sin compresión lumbar excesiva." 
  },
  { 
    nombre: "Prensa de Piernas 45° Inclinada", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps", 
    equipamiento: "Máquina", 
    riesgo: "Moderado", 
    musculos: "Cuádriceps completo, glúteo mayor, aductores", 
    ejecucion: "Pies al ancho de hombros en posición media de la plataforma. Desciende de forma controlada hasta 90° sin despegar la zona lumbar del respaldo." 
  },
  { 
    nombre: "Sentadilla Hack Guiada (Hack Squat)", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps", 
    equipamiento: "Máquina", 
    riesgo: "Moderado", 
    musculos: "Cuádriceps (énfasis en vasto externo e intermedio)", 
    ejecucion: "Espalda totalmente apoyada en el respaldo móvil. Permite un viaje óptimo de rodilla hacia adelante para máxima hipertrofia femoral." 
  },
  { 
    nombre: "Sentadilla Búlgara con Mancuernas (Rear Foot Elevated)", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps & Glúteos", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Cuádriceps, glúteo mayor, glúteo medio, estabilizadores pélvicos", 
    ejecucion: "Pie trasero elevado en banco a 40cm. Descenso vertical profundo manteniendo el torso erguido para enfocar la tensión en el cuádriceps delantero." 
  },
  { 
    nombre: "Extensión de Piernas en Sillón (Leg Extension)", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps (Recto Anterior)", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Recto femoral, vasto medial, vasto lateral, vasto intermedio", 
    ejecucion: "Alinea el eje de giro con la articulación de la rodilla. Extiende controlando la contracción de 1s arriba y 3s en la fase excéntrica." 
  },
  { 
    nombre: "Zancadas Caminando con Mancuernas (Walking Lunges)", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps & Glúteos", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Cuádriceps, glúteos, isquiotibiales, aductores, gemelos", 
    ejecucion: "Pasos largos y controlados, rozando casi el suelo con la rodilla trasera y manteniendo el centro de gravedad estable." 
  },
  { 
    nombre: "Sissy Squat Libre / Asistido", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps", 
    equipamiento: "Peso Corporal", 
    riesgo: "Bajo", 
    musculos: "Recto femoral en máxima elongación, core", 
    ejecucion: "Inclinación del tronco hacia atrás mientras las rodillas viajan hacia adelante en flexión pura, aislando el cuádriceps." 
  },
  { 
    nombre: "Extensión Terminal de Rodilla con Banda Elástica", 
    categoria: "cuadriceps", 
    musculoPrimario: "Cuádriceps (Vasto Medial Oblicuo)", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Vasto medial oblicuo (VMO), estabilidad de la rótula", 
    ejecucion: "Banda anclada a la altura de la rodilla por detrás del hueco poplíteo. Extiende la rodilla venciendo la tensión elástica para control motor." 
  },

  // ==========================================
  // 2. ISQUIOTIBIALES
  // ==========================================
  { 
    nombre: "Peso Muerto Rumano con Barra (RDL)", 
    categoria: "isquiotibiales", 
    musculoPrimario: "Isquiotibiales", 
    equipamiento: "Barra", 
    riesgo: "Alto", 
    musculos: "Bíceps femoral, semitendinoso, semimembranoso, glúteo mayor, erectores", 
    ejecucion: "Bisagra de cadera estricta empujando la pelvis hacia atrás con microflexión fija de rodilla. Siente el estiramiento máximo en los femorales." 
  },
  { 
    nombre: "Peso Muerto con Mancuernas a Piernas Semirrígidas", 
    categoria: "isquiotibiales", 
    musculoPrimario: "Isquiotibiales", 
    equipamiento: "Mancuerna", 
    riesgo: "Moderado", 
    musculos: "Isquiotibiales (cabeza larga bíceps femoral), glúteo mayor", 
    ejecucion: "Mancuernas pegadas a los muslos durante el descenso. Torso recto y retracción escapular activa sin flexionar la columna lumbar." 
  },
  { 
    nombre: "Curl Femoral Tumbado en Máquina (Lying Leg Curl)", 
    categoria: "isquiotibiales", 
    musculoPrimario: "Isquiotibiales", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Bíceps femoral (cabeza corta y larga), semitendinoso, semimembranoso", 
    ejecucion: "Pelvis pegada a la almohadilla sin arquear la zona lumbar. Flexiona las rodillas de forma explosiva y desciende en 3 segundos." 
  },
  { 
    nombre: "Curl Femoral Sentado en Máquina (Seated Leg Curl)", 
    categoria: "isquiotibiales", 
    musculoPrimario: "Isquiotibiales", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Isquiotibiales en máxima elongación desde la articulación coxofemoral", 
    ejecucion: "Ajusta la almohadilla superior sobre los muslos para evitar la elevación de la cadera. Máxima flexión hacia abajo manteniendo dorsiflexión." 
  },
  { 
    nombre: "Buenos Días con Barra (Good Mornings)", 
    categoria: "isquiotibiales", 
    musculoPrimario: "Isquiotibiales & Erectores", 
    equipamiento: "Barra", 
    riesgo: "Alto", 
    musculos: "Isquiotibiales, glúteo mayor, musculatura paravertebral lumbar", 
    ejecucion: "Barra apoyada en trapecios. Flexiona la cadera manteniendo la columna neutra hasta que el torso quede casi paralelo al suelo." 
  },
  { 
    nombre: "Nordic Hamstring Curl (Curl Nórdico Excéntrico)", 
    categoria: "isquiotibiales", 
    musculoPrimario: "Isquiotibiales", 
    equipamiento: "Peso Corporal", 
    riesgo: "Moderado", 
    musculos: "Bíceps femoral en sobrecarga excéntrica (prevención de roturas)", 
    ejecucion: "Tobillos fijados. Desciende el cuerpo hacia adelante controlando la caída únicamente con la fuerza excéntrica de los isquiosurales." 
  },
  { 
    nombre: "Curl Femoral Unilateral de Pie en Polea Baja", 
    categoria: "isquiotibiales", 
    musculoPrimario: "Isquiotibiales", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Bíceps femoral, semitendinoso, control unilateral", 
    ejecucion: "Tobillera conectada a la polea baja. Flexiona la rodilla llevando el talón hacia el glúteo sin balancear la cadera." 
  },
  { 
    nombre: "Puente Isquiotibial Deslizante / Fitball (Leg Curl Slider)", 
    categoria: "isquiotibiales", 
    musculoPrimario: "Isquiotibiales", 
    equipamiento: "Peso Corporal", 
    riesgo: "Bajo", 
    musculos: "Isquiotibiales distales, glúteos, core lumbopélvico", 
    ejecucion: "Boca arriba con pelvis elevada. Tracciona los talones hacia los glúteos manteniendo la cadera en completa extensión." 
  },

  // ==========================================
  // 3. GLÚTEOS
  // ==========================================
  { 
    nombre: "Hip Thrust con Barra en Banco (Barbell Hip Thrust)", 
    categoria: "gluteos", 
    musculoPrimario: "Glúteo Mayor", 
    equipamiento: "Barra", 
    riesgo: "Bajo", 
    musculos: "Glúteo mayor (torque máximo en extensión terminal), isquiotibiales", 
    ejecucion: "Escápulas apoyadas en banco. Empuja desde los talones hasta bloquear la cadera con retroversión pélvica y barbilla al pecho." 
  },
  { 
    nombre: "Hip Thrust en Máquina Guiada / Multipower", 
    categoria: "gluteos", 
    musculoPrimario: "Glúteo Mayor", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Glúteo mayor, glúteo medio, mínima demanda estabilizadora", 
    ejecucion: "Trayectoria guiada fija. Permite manejar altas intensidades y pausas de 2s en el pico concéntrico con total seguridad lumbar." 
  },
  { 
    nombre: "Patada de Glúteo en Polea Baja (Cable Glute Kickback)", 
    categoria: "gluteos", 
    musculoPrimario: "Glúteo Mayor", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Glúteo mayor (fibras superiores e inferiores), estabilidad lumbo-pélvica", 
    ejecucion: "Tobillera conectada. Extiende la cadera hacia atrás y ligeramente en 30° hacia afuera para respetar el alineamiento de fibras." 
  },
  { 
    nombre: "Abducción de Cadera en Máquina (Seated Hip Abductor)", 
    categoria: "gluteos", 
    musculoPrimario: "Glúteo Medio & Menor", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Glúteo medio, glúteo menor, tensor de la fascia lata", 
    ejecucion: "Torso ligeramente inclinado hacia adelante para enfocar la tensión en las fibras posteriores del glúteo medio. Abre en 2s y pausa." 
  },
  { 
    nombre: "Puente de Glúteo Unilateral en Suelo (Single Leg Glute Bridge)", 
    categoria: "gluteos", 
    musculoPrimario: "Glúteo Mayor", 
    equipamiento: "Peso Corporal", 
    riesgo: "Bajo", 
    musculos: "Glúteo mayor, control de rotación pélvica, core", 
    ejecucion: "Apoya una sola pierna a 90°. Eleva la pelvis empujando con el talón y mantén la cadera alineada horizontalmente." 
  },
  { 
    nombre: "Paseo del Monstruo con Banda (Monster Walk)", 
    categoria: "gluteos", 
    musculoPrimario: "Glúteo Medio", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Glúteo medio, rotadores externos de cadera, estabilizadores", 
    ejecucion: "Mini-band colocada sobre las rodillas o tobillos. Camina en semiflexión en diagonal manteniendo tensión constante en la banda." 
  },
  { 
    nombre: "Kickback de Glúteo con Banda de Resistencia", 
    categoria: "gluteos", 
    musculoPrimario: "Glúteo Mayor", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Glúteo mayor, estabilidad de apoyo unilateral", 
    ejecucion: "En cuadrupedia o de pie. Extiende la pierna hacia atrás activando el glúteo sin hiperextender la columna lumbar." 
  },

  // ==========================================
  // 4. PECHO (PECTORAL)
  // ==========================================
  { 
    nombre: "Press de Banca Plano con Barra (Barbell Bench Press)", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Mayor (Esternal)", 
    equipamiento: "Barra", 
    riesgo: "Moderado", 
    musculos: "Pectoral mayor, tríceps braquial, deltoides anterior", 
    ejecucion: "Retracción y depresión escapular fija. Baja la barra a la parte media del esternón en trayectoria diagonal controlada." 
  },
  { 
    nombre: "Press Inclinado con Mancuernas (30° - 45°)", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Superior (Clavicular)", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Haz clavicular del pectoral mayor, deltoides anterior, tríceps", 
    ejecucion: "Banco ajustado a 30°. Desciende abriendo los codos a 45-60° del torso para maximizar la estirada fascial sin pinzamiento subacromial." 
  },
  { 
    nombre: "Press Declinado con Barra o Mancuernas", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Inferior (Costal)", 
    equipamiento: "Barra", 
    riesgo: "Moderado", 
    musculos: "Porción costal/inferior del pectoral mayor, tríceps", 
    ejecucion: "Banco a -15°. Empuja la barra verticalmente hacia arriba protegiendo la cápsula articular anterior del hombro." 
  },
  { 
    nombre: "Fondos en Paralelas para Pecho (Chest Dips)", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Inferior & Tríceps", 
    equipamiento: "Peso Corporal", 
    riesgo: "Moderado", 
    musculos: "Pectoral mayor (fibras inferiores), tríceps, deltoides anterior", 
    ejecucion: "Torso inclinado 30° hacia adelante con codos abiertos. Desciende hasta 90° de flexión en codo sintiendo la tensión pectoral." 
  },
  { 
    nombre: "Cruce de Poleas Altas (High-to-Low Cable Flyes)", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Mayor (Porción Esternal e Inferior)", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Pectoral mayor, línea media esternal", 
    ejecucion: "Poleas situadas arriba. Junta las manos en trayectoria descendente hacia el ombligo apretando el pecho 1s al final." 
  },
  { 
    nombre: "Cruce de Poleas Bajas (Low-to-High Cable Flyes)", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Superior (Clavicular)", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Pectoral superior clavicular, deltoides anterior", 
    ejecucion: "Poleas situadas abajo. Eleva las manos en trayectoria ascendente hacia la altura del mentón cruzando suavemente al frente." 
  },
  { 
    nombre: "Aperturas en Máquina Contractora (Peck Deck Flyes)", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Mayor", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Pectoral mayor (máximo estiramiento y contracción de aducción)", 
    ejecucion: "Ajusta la altura del asiento para que los codos queden a la altura del pecho medio. Junta los brazos sin despegar la espalda." 
  },
  { 
    nombre: "Press de Pecho en Máquina Convergente", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Mayor", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Pectoral mayor, tríceps, deltoides anterior", 
    ejecucion: "Trayectoria guiada con convergencia al centro. Permite sobrecarga máxima y series de alta intensidad sin requerir spotter." 
  },
  { 
    nombre: "Flexiones de Pecho (Push-ups) con Déficit o Bandas", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Mayor & Core", 
    equipamiento: "Peso Corporal", 
    riesgo: "Bajo", 
    musculos: "Pectoral mayor, tríceps, serrato anterior, transverso abdominal", 
    ejecucion: "Manos sobre apoyos o suelo. Cuerpo en plancha rígida descendiendo hasta tocar el suelo con el esternón." 
  },
  { 
    nombre: "Aperturas con Banda de Resistencia (Band Flyes)", 
    categoria: "pecho", 
    musculoPrimario: "Pectoral Mayor", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Pectoral mayor, pico de contracción al cierre", 
    ejecucion: "Banda anclada por detrás a la altura de la espalda. Junta las manos adelante venciendo la máxima resistencia elástica." 
  },

  // ==========================================
  // 5. ESPALDA ALTA & DORSALES
  // ==========================================
  { 
    nombre: "Remo con Barra Pendlay (90° Pendlay Row)", 
    categoria: "espalda", 
    musculoPrimario: "Espalda Alta & Dorsales", 
    equipamiento: "Barra", 
    riesgo: "Moderado", 
    musculos: "Dorsal ancho, romboides, trapecio medio, erectores espinales", 
    ejecucion: "Torso estrictamente paralelo al suelo. Tracciona la barra de forma explosiva desde el suelo hacia el esternón bajo." 
  },
  { 
    nombre: "Jalón al Pecho en Polea Alta Agarre Prono Ancho (Lat Pulldown)", 
    categoria: "espalda", 
    musculoPrimario: "Dorsal Ancho", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Dorsal ancho (fibras ilíacas y costales), redondo mayor, bíceps", 
    ejecucion: "Agarre 1.5 veces el ancho biacromial. Tira hacia la clavícula sacando el pecho y dirigiendo los codos hacia abajo y atrás." 
  },
  { 
    nombre: "Jalón al Pecho en Polea con Agarre Neutro Estrecho", 
    categoria: "espalda", 
    musculoPrimario: "Dorsal Ancho", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Dorsal ancho en plano sagital, braquial anterior, bíceps", 
    ejecucion: "Con agarre en V. Permite un mayor rango de extensión y estiramiento en la parte superior sin sobrecargar los hombros." 
  },
  { 
    nombre: "Remo Gironda en Polea Baja (Seated Cable Row)", 
    categoria: "espalda", 
    musculoPrimario: "Dorsal Ancho & Romboides", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Dorsal ancho, romboides, trapecio medio e inferior, redondo mayor", 
    ejecucion: "Pies apoyados, torso erguido a 90°. Tracciona el maneral al ombligo juntando las escápulas y controlando la vuelta en 3s." 
  },
  { 
    nombre: "Remo Unilateral con Mancuerna en Banco (Dumbbell Row)", 
    categoria: "espalda", 
    musculoPrimario: "Dorsal Ancho", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Dorsal ancho, redondo mayor, romboides, deltoides posterior", 
    ejecucion: "Rodilla y mano apoyadas. Tracciona la mancuerna en trayectoria curva hacia la cadera en lugar de subirla en vertical pura." 
  },
  { 
    nombre: "Pull-Over en Polea Alta con Cuerda / Barra Recta", 
    categoria: "espalda", 
    musculoPrimario: "Dorsal Ancho (Aislamiento)", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Dorsal ancho, redondo mayor, tríceps (cabeza larga)", 
    ejecucion: "Brazos semirrígidos. Empuja la cuerda hacia los muslos en trayectoria circular activando el dorsal sin flexión de codo." 
  },
  { 
    nombre: "Remo en Máquina de Placas con Apoyo en Pecho (Chest-Supported Row)", 
    categoria: "espalda", 
    musculoPrimario: "Espalda Alta & Romboides", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Trapecio medio, romboides, deltoides posterior, dorsal ancho", 
    ejecucion: "Pecho apoyado en la almohadilla eliminando cualquier fatiga o cizallamiento lumbar. Tracción escapular estricta." 
  },
  { 
    nombre: "Remo Meadows con Barra en T Unilateral (Meadows Row)", 
    categoria: "espalda", 
    musculoPrimario: "Dorsal Ancho & Espalda Alta", 
    equipamiento: "Barra", 
    riesgo: "Moderado", 
    musculos: "Dorsal ancho, trapecio inferior, romboides", 
    ejecucion: "De pie perpendicular a la barra T. Agarre en pronación sobre la manga de la barra y tracción profunda hacia la cadera." 
  },
  { 
    nombre: "Dominadas Pronas / Neutras (Pull-ups / Chin-ups)", 
    categoria: "espalda", 
    musculoPrimario: "Dorsal Ancho & Bíceps", 
    equipamiento: "Peso Corporal", 
    riesgo: "Moderado", 
    musculos: "Dorsal ancho, redondo mayor, bíceps, braquial, trapecio", 
    ejecucion: "Colgado de la barra. Inicia con depresión escapular y sube hasta que la barbilla supere la barra con control total." 
  },
  { 
    nombre: "Band Pull-Apart para Espalda Alta y Romboides", 
    categoria: "espalda", 
    musculoPrimario: "Romboides & Trapecio Medio", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Romboides, trapecio medio e inferior, deltoides posterior", 
    ejecucion: "Sujeta la banda frente al pecho con brazos rectos. Separa los brazos hacia los costados juntando fuertemente las escápulas." 
  },

  // ==========================================
  // 6. HOMBROS (DELTOIDES ANTERIOR, MEDIO, POSTERIOR)
  // ==========================================
  { 
    nombre: "Press Militar de Pie con Barra (Overhead Press OHP)", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Anterior", 
    equipamiento: "Barra", 
    riesgo: "Alto", 
    musculos: "Deltoides anterior, deltoides lateral, tríceps, trapecio superior, core", 
    ejecucion: "Empuje vertical estricto con glúteos y abdomen contraídos. Pasa la cabeza hacia adelante al bloquear la barra sobre la coronilla." 
  },
  { 
    nombre: "Press de Hombros Sentado con Mancuernas (Seated DB Shoulder Press)", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Anterior & Lateral", 
    equipamiento: "Mancuerna", 
    riesgo: "Moderado", 
    musculos: "Deltoides anterior, deltoides lateral, tríceps", 
    ejecucion: "Banco a 75-80°. Empuja las mancuernas en plano escapular (30° adelante del plano coronal) protegiendo el manguito rotador." 
  },
  { 
    nombre: "Elevaciones Laterales con Mancuernas (Dumbbell Lateral Raise)", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Lateral (Medio)", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Deltoides lateral (porción acromial), trapecio superior", 
    ejecucion: "Leve inclinación del torso hacia adelante. Eleva los brazos en el plano escapular liderando con los codos hasta la altura del hombro." 
  },
  { 
    nombre: "Elevaciones Laterales en Polea a 45° (Cable Lateral Raise)", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Lateral (Medio)", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Deltoides lateral con tensión constante desde la posición estirada", 
    ejecucion: "Polea a la altura de la rodilla. Eleva el brazo en diagonal controlando la fase excéntrica con tensión continua del cable." 
  },
  { 
    nombre: "Elevaciones Laterales en Máquina Específica", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Lateral", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Deltoides lateral en aislamiento biomecánico puro", 
    ejecucion: "Almohadillas apoyadas en los brazos. Elimina la inercia del agarre y concentra el esfuerzo en el torque del deltoides medio." 
  },
  { 
    nombre: "Face-Pulls en Polea Alta con Rotación Externa (Cuerda)", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Posterior & Manguito Rotador", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Deltoides posterior, infraespinoso, redondo menor, trapecio", 
    ejecucion: "Tira de la cuerda hacia los ojos abriendo las puntas con rotación externa de hombro. Ejercicio clave de salud postural." 
  },
  { 
    nombre: "Pájaros con Mancuernas en Banco Inclinado (Rear Delt Flyes)", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Posterior", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Deltoides posterior, romboides, redondo mayor", 
    ejecucion: "Pecho apoyado en banco a 30°. Abre los brazos hacia los costados manteniendo los codos ligeramente flexionados." 
  },
  { 
    nombre: "Peck Deck Inverso en Máquina (Reverse Flyes)", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Posterior", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Deltoides posterior, trapecio medio", 
    ejecucion: "Pecho contra el respaldo. Abre los brazos manteniendo los codos a la altura de los hombros y aprieta atrás 1s." 
  },
  { 
    nombre: "Face-Pulls con Banda de Resistencia", 
    categoria: "hombros", 
    musculoPrimario: "Deltoides Posterior & Salud Escapular", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Deltoides posterior, manguito rotador, romboides", 
    ejecucion: "Banda anclada a la altura de la frente. Tracciona hacia el rostro abriendo las manos con rotación externa." 
  },

  // ==========================================
  // 7. BÍCEPS
  // ==========================================
  { 
    nombre: "Curl de Bíceps con Barra Z de Pie (EZ-Bar Curl)", 
    categoria: "biceps", 
    musculoPrimario: "Bíceps Braquial", 
    equipamiento: "Barra", 
    riesgo: "Bajo", 
    musculos: "Bíceps braquial (cabeza corta y larga), braquial anterior", 
    ejecucion: "Agarre semipronado que alivia el túnel carpiano. Codos pegados a los costados sin balanceo del torso." 
  },
  { 
    nombre: "Curl Inclinado con Mancuernas (Incline Dumbbell Curl 45°)", 
    categoria: "biceps", 
    musculoPrimario: "Bíceps (Cabeza Larga)", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Cabeza larga del bíceps en máxima elongación fascial", 
    ejecucion: "Banco a 45°. Brazos colgando detrás del torso para enfatizar la porción externa y el pico del bíceps." 
  },
  { 
    nombre: "Curl Martillo con Mancuernas (Hammer Curl)", 
    categoria: "biceps", 
    musculoPrimario: "Braquial & Braquiorradial", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Braquial anterior, braquiorradial, cabeza lateral del bíceps", 
    ejecucion: "Agarre neutro (palmas enfrentadas). Excelente para aumentar el grosor del brazo y la fuerza de agarre." 
  },
  { 
    nombre: "Curl Martillo en Polea con Cuerda (Cable Rope Hammer)", 
    categoria: "biceps", 
    musculoPrimario: "Braquial Anterior & Braquiorradial", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Braquial anterior, braquiorradial con tensión constante", 
    ejecucion: "Cuerda en polea baja. Flexiona manteniendo los pulgares apuntando hacia arriba y abre la cuerda al final." 
  },
  { 
    nombre: "Curl Predicador en Banco Scott (Preacher Curl)", 
    categoria: "biceps", 
    musculoPrimario: "Bíceps (Cabeza Corta)", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Cabeza corta del bíceps en acortamiento puro", 
    ejecucion: "Brazos apoyados en la almohadilla inclinada. Aísla completamente el bíceps eliminando cualquier asistencia del hombro." 
  },
  { 
    nombre: "Curl Araña en Banco Inclinado (Spider Curl)", 
    categoria: "biceps", 
    musculoPrimario: "Bíceps Braquial", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Bíceps braquial en flexión estricta", 
    ejecucion: "Pecho apoyado en banco a 45°. Brazos verticales colgando adelante; flexiona los codos hacia la frente." 
  },
  { 
    nombre: "Curl de Bíceps con Banda de Resistencia", 
    categoria: "biceps", 
    musculoPrimario: "Bíceps Braquial", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Bíceps braquial, pico de contracción elástica", 
    ejecucion: "Pisa la banda con ambos pies. Flexiona los codos manteniendo la tensión elástica máxima en la parte superior." 
  },

  // ==========================================
  // 8. TRÍCEPS
  // ==========================================
  { 
    nombre: "Extensión de Tríceps en Polea Alta con Cuerda (Cable Pushdown)", 
    categoria: "triceps", 
    musculoPrimario: "Tríceps (Cabeza Lateral)", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Tríceps braquial (cabeza lateral y medial)", 
    ejecucion: "Codos bloqueados al costado del torso. Extiende los antebrazos hacia abajo abriendo los extremos de la cuerda al bloquear." 
  },
  { 
    nombre: "Press Francés con Barra Z en Banco Plano (Skull Crushers)", 
    categoria: "triceps", 
    musculoPrimario: "Tríceps (Cabeza Larga y Medial)", 
    equipamiento: "Barra", 
    riesgo: "Moderado", 
    musculos: "Cabeza larga del tríceps, cabeza medial, ancóneo", 
    ejecucion: "Baja la barra Z hacia la frente o coronilla flexionando solo los codos. Extiende con potencia sin abrir los codos." 
  },
  { 
    nombre: "Extensión Katana Unilateral por Encima de la Cabeza en Polea", 
    categoria: "triceps", 
    musculoPrimario: "Tríceps (Cabeza Larga)", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Cabeza larga del tríceps en estiramiento fascial completo", 
    ejecucion: "Cable saliendo detrás de la cabeza en ángulo diagonal. Extiende el codo en el plano del brazo para máxima hipertrofia." 
  },
  { 
    nombre: "Press de Banca con Agarre Estrecho (Close-Grip Bench Press)", 
    categoria: "triceps", 
    musculoPrimario: "Tríceps Braquial Completo", 
    equipamiento: "Barra", 
    riesgo: "Moderado", 
    musculos: "Tríceps braquial, deltoides anterior, pectoral mayor", 
    ejecucion: "Manos separadas al ancho de hombros (~30-40cm). Baja la barra al pecho bajo manteniendo los codos pegados al cuerpo." 
  },
  { 
    nombre: "Fondos en Paralelas para Tríceps (Triceps Dips)", 
    categoria: "triceps", 
    musculoPrimario: "Tríceps Braquial", 
    equipamiento: "Peso Corporal", 
    riesgo: "Moderado", 
    musculos: "Tríceps braquial en cadena cinética cerrada, deltoides anterior", 
    ejecucion: "Torso completamente erguido con codos pegados a los costados durante todo el recorrido de bajada y subida." 
  },
  { 
    nombre: "Patada de Tríceps en Polea Media (Cable Kickback)", 
    categoria: "triceps", 
    musculoPrimario: "Tríceps (Cabeza Lateral)", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Cabeza lateral y medial del tríceps en contracción terminal", 
    ejecucion: "Torso inclinado. Extiende el brazo hacia atrás alineándolo con el tronco y aguanta 1s en contracción total." 
  },
  { 
    nombre: "Extensiones de Tríceps con Mancuerna a Dos Manos (Overhead DB Extension)", 
    categoria: "triceps", 
    musculoPrimario: "Tríceps (Cabeza Larga)", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Cabeza larga del tríceps", 
    ejecucion: "Sujeta la mancuerna por la campana sobre la cabeza. Desciende flexionando los codos por detrás de la nuca." 
  },
  { 
    nombre: "Extensión de Tríceps con Banda Elástica", 
    categoria: "triceps", 
    musculoPrimario: "Tríceps Braquial", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Tríceps braquial, bloqueo terminal", 
    ejecucion: "Banda anclada arriba. Extiende los brazos hacia abajo abriendo los extremos con control del tempo." 
  },

  // ==========================================
  // 9. ABDOMEN & CORE
  // ==========================================
  { 
    nombre: "Plancha Abdominal Isométrica (Front Plank)", 
    categoria: "core", 
    musculoPrimario: "Core & Transverso Abdominal", 
    equipamiento: "Peso Corporal", 
    riesgo: "Bajo", 
    musculos: "Transverso del abdomen, recto abdominal, oblicuos, glúteos", 
    ejecucion: "Alineación recta de talones a cabeza con retroversión pélvica activa y contracción isométrica total." 
  },
  { 
    nombre: "Crunch Abdominal en Polea Alta con Cuerda (Cable Crunch)", 
    categoria: "core", 
    musculoPrimario: "Recto Abdominal", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Recto abdominal bajo sobrecarga progresiva, oblicuos", 
    ejecucion: "De rodillas sujetando la cuerda en la coronilla. Flexiona la columna enrollando el pecho hacia la pelvis sin mover la cadera." 
  },
  { 
    nombre: "Elevaciones de Piernas Colgado en Barra (Hanging Leg Raises)", 
    categoria: "core", 
    musculoPrimario: "Recto Abdominal Inferior", 
    equipamiento: "Peso Corporal", 
    riesgo: "Moderado", 
    musculos: "Recto abdominal, flexores de cadera (psoas-ilíaco), oblicuos", 
    ejecucion: "Colgado con agarre firme. Eleva las piernas extendidas o rodillas hacia el pecho realizando una flexión de pelvis activa." 
  },
  { 
    nombre: "Rueda Abdominal (Ab Wheel Rollout)", 
    categoria: "core", 
    musculoPrimario: "Core Profundo & Anti-Extensión", 
    equipamiento: "Peso Corporal", 
    riesgo: "Moderado", 
    musculos: "Transverso, recto abdominal, dorsal ancho, estabilizadores espinales", 
    ejecucion: "De rodillas. Rueda hacia adelante manteniendo la espalda ligeramente curvada y sin dejar caer la pelvis en hiperextensión." 
  },
  { 
    nombre: "Press Pallof en Polea / Banda (Anti-Rotación)", 
    categoria: "core", 
    musculoPrimario: "Oblicuos & Estabilizadores Profundos", 
    equipamiento: "Polea", 
    riesgo: "Bajo", 
    musculos: "Oblicuos internos/externos, transverso, multífidos", 
    ejecucion: "De pie perpendicular a la polea. Empuja el maneral al frente y resiste la torsión rotacional durante 3s por repetición." 
  },
  { 
    nombre: "Giros Rusos con Disco (Russian Twists)", 
    categoria: "core", 
    musculoPrimario: "Oblicuos", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Oblicuos externos e internos, recto abdominal", 
    ejecucion: "Sentado con pies elevados. Rota el torso de lado a lado tocando con el disco o mancuerna de forma controlada." 
  },
  { 
    nombre: "Dead-Bug con Control Lumbar", 
    categoria: "core", 
    musculoPrimario: "Core Estabilizador", 
    equipamiento: "Peso Corporal", 
    riesgo: "Bajo", 
    musculos: "Transverso del abdomen, coordinación neuromuscular del core", 
    ejecucion: "Boca arriba con zona lumbar aplastada contra el suelo. Extiende brazo y pierna opuestos sin despegar la columna." 
  },
  { 
    nombre: "Hollow Body Hold (Isometría Gimnástica)", 
    categoria: "core", 
    musculoPrimario: "Recto Abdominal & Transverso", 
    equipamiento: "Peso Corporal", 
    riesgo: "Bajo", 
    musculos: "Recto abdominal, transverso, flexores de cadera", 
    ejecucion: "Cuerpo en posición de barca cóncava con piernas y escápulas despegadas del suelo y lumbar completamente plana." 
  },

  // ==========================================
  // 10. PANTORRILLAS (GEMELOS & SÓLEO)
  // ==========================================
  { 
    nombre: "Elevación de Talones de Pie en Máquina / Multipower (Standing Calf Raise)", 
    categoria: "pantorrillas", 
    musculoPrimario: "Gastrocnemio (Gemelos)", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Gastrocnemio (cabeza medial y lateral), sóleo", 
    ejecucion: "Rodillas bloqueadas en extensión. Desciende hasta máximo estiramiento del tendón de Aquiles y elévate sobre las puntas con pausa de 2s." 
  },
  { 
    nombre: "Elevación de Talones Sentado en Máquina (Seated Calf Raise)", 
    categoria: "pantorrillas", 
    musculoPrimario: "Sóleo", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Músculo sóleo (aislado al desactivar el gastrocnemio por flexión de rodilla)", 
    ejecucion: "Rodillas a 90° bajo la almohadilla. Rango completo con tempo 3-1-1-1 para hipertrofia del sóleo." 
  },
  { 
    nombre: "Elevación de Gemelos Unilateral con Mancuerna en Escalón", 
    categoria: "pantorrillas", 
    musculoPrimario: "Gastrocnemio & Sóleo", 
    equipamiento: "Mancuerna", 
    riesgo: "Bajo", 
    musculos: "Gastrocnemio unilateral, estabilizadores del tobillo", 
    ejecucion: "Sobre un escalón o disco. Apoya la punta del pie y elévate al máximo controlando la fase excéntrica completa." 
  },
  { 
    nombre: "Elevación de Talones en Prensa 45° (Calf Press on Leg Press)", 
    categoria: "pantorrillas", 
    musculoPrimario: "Gastrocnemio", 
    equipamiento: "Máquina", 
    riesgo: "Bajo", 
    musculos: "Gastrocnemio completo con máxima flexión dorsal", 
    ejecucion: "Puntas de los pies en el borde inferior de la plataforma de la prensa. Empuja únicamente desde los tobillos." 
  },
  { 
    nombre: "Elevación de Gemelos con Banda Elástica", 
    categoria: "pantorrillas", 
    musculoPrimario: "Gastrocnemio & Sóleo", 
    equipamiento: "Banda", 
    riesgo: "Bajo", 
    musculos: "Gastrocnemio, sóleo, propiocepción del tobillo", 
    ejecucion: "Sentado con la pierna extendida y la banda en la planta del pie. Empuja en flexión plantar venciendo la banda elástica." 
  }
];

const suplementosDB = [
  { nombre: "Creatina Monohidrato", evidencia: "Evidencia A (Máxima)", dosis: "3 - 5g diarios continuos", beneficio: "Aumenta la resíntesis de ATP, mejora la fuerza explosiva y la masa magra." },
  { nombre: "Proteína de Suero (Whey Protein)", evidencia: "Evidencia A (Máxima)", dosis: "20 - 40g post-entreno o según requerimiento", beneficio: "Acelera la síntesis de proteína muscular y la recuperación tisular." },
  { nombre: "Cafeína Anhidra", evidencia: "Evidencia A (Máxima)", dosis: "3 - 6 mg/kg 45 min antes de entrenar", beneficio: "Reduce la percepción del esfuerzo y mejora la potencia máxima." },
  { nombre: "Beta-Alanina", evidencia: "Evidencia A (Máxima)", dosis: "3.2 - 6.4g diarios (fase de carga)", beneficio: "Aumenta la carnosina muscular reduciendo la acidosis en esfuerzos intensos." },
  { nombre: "Omega-3 (EPA/DHA)", evidencia: "Evidencia B", dosis: "2 - 3g combinados diarios", beneficio: "Acción antiinflamatoria sistémica y optimización de la sensibilidad insulínica." }
];

window.clientes = clientes;
window.archivosMedicosDB = archivosMedicosDB;
window.lesionesDB = lesionesDB;
window.dietasGuardadas = dietasGuardadas;
window.planesGuardados = planesGuardados;
window.bitacoraClinicaDB = bitacoraClinicaDB;
window.metricasEvolucionDB = metricasEvolucionDB;
window.ejerciciosDB = ejerciciosDB;
window.suplementosDB = suplementosDB;

// Navigation State, Event Delegation & Micro-interactions

// Event Delegation for Sidebar Navigation, Popovers and Modal Backdrops
document.addEventListener('click', (e) => {
  try {
    // 1. Navigation items delegation
    const navBtn = e.target.closest('.nav-item');
    if (navBtn) {
      const targetView = navBtn.getAttribute('data-view');
      if (targetView) {
        navegarA(targetView);
      }
    }

    // 2. Popover Menus Auto-Close Delegation
    if (!e.target.closest('.action-menu-btn') && !e.target.closest('.dropdown-popover')) {
      const allMenus = document.querySelectorAll('.dropdown-popover');
      allMenus.forEach(m => {
        if (m) m.classList.add('hidden');
      });
    }

    // 3. Modal Backdrop Click Auto-Close Delegation
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
      e.target.classList.add('hidden');
      e.target.style.display = 'none';
    }

    // 4. Delegación universal para botón Ver Menú Completo de Dietas
    const btnMenuDieta = e.target.closest('.btn-ver-menu-completo');
    if (btnMenuDieta) {
      e.preventDefault();
      const cli = btnMenuDieta.getAttribute('data-cliente') || btnMenuDieta.getAttribute('data-dieta-id');
      if (cli) abrirDetalleDieta(cli);
    }
  } catch (err) {
    console.error("Event Delegation Error:", err);
  }
});

function initNavigation() {
  try {
    const navItems = document.querySelectorAll('.nav-item, .nav-subitem');
    if (navItems) {
      navItems.forEach(btn => {
        if (btn) {
          btn.addEventListener('click', (e) => {
            const targetViewId = btn.getAttribute('data-view');
            if (targetViewId) navegarA(targetViewId);
          });
        }
      });
    }
  } catch (err) {
    console.error("initNavigation Error:", err);
  }
}

function toggleMobileSidebar(forceState) {
  try {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('open');
    const shouldOpen = forceState !== undefined ? forceState : !isOpen;

    if (shouldOpen) {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('active');
    } else {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    }
  } catch (err) {
    console.error("toggleMobileSidebar Error:", err);
  }
}

function toggleNavGroup(groupId) {
  try {
    const group = document.getElementById(groupId);
    if (!group) return;
    const isExpanded = group.classList.contains('active') || group.classList.contains('open');
    if (isExpanded) {
      group.classList.remove('active');
      group.classList.remove('open');
    } else {
      group.classList.add('active');
    }
  } catch (err) {
    console.error("toggleNavGroup Error:", err);
  }
}

let historialVistas = ['dashboard'];

function navegarA(viewName, registrarHistorial = true) {
  try {
    if (!viewName) return;

    // Si el usuario es un Atleta, forzar que solo acceda al Portal del Atleta
    if (document.body.classList.contains('is-athlete-mode') && viewName !== 'athlete-portal') {
      viewName = 'athlete-portal';
    }

    // Registrar historial de navegación para retroceso fluido
    if (registrarHistorial && historialVistas[historialVistas.length - 1] !== viewName) {
      historialVistas.push(viewName);
    }

    // Cierre automático del menú lateral en móviles al navegar
    toggleMobileSidebar(false);

    const navItems = document.querySelectorAll('.nav-item, .nav-subitem');
    const views = document.querySelectorAll('.view');
    const navGroups = document.querySelectorAll('.nav-group');

    // Reset indicator on groups
    if (navGroups) {
      navGroups.forEach(g => g.classList.remove('has-active'));
    }

    if (navItems) {
      navItems.forEach(b => {
        if (b && b.getAttribute) {
          if (b.getAttribute('data-view') === viewName) {
            b.classList.add('active');
            // Expand & highlight parent accordion group if in a submenu
            const parentGroup = b.closest('.nav-group');
            if (parentGroup) {
              parentGroup.classList.add('active');
              parentGroup.classList.add('has-active');
            }
          } else {
            b.classList.remove('active');
          }
        }
      });
    }

    if (views) {
      views.forEach(v => {
        if (v && v.id) {
          if (v.id === 'view-' + viewName) {
            v.classList.add('active');
          } else {
            v.classList.remove('active');
          }
        }
      });
    }

    const loader = document.getElementById('view-top-loader');
    if (loader) {
      loader.classList.add('loading');
      setTimeout(() => {
        if (loader) loader.classList.remove('loading');
      }, 280);
    }

    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error("navegarA Error:", err);
  }
}

function volverAlDashboard() {
  navegarA('dashboard');
}

function volverAtras() {
  if (historialVistas.length > 1) {
    historialVistas.pop(); // Quitar la vista actual
    const anterior = historialVistas[historialVistas.length - 1] || 'dashboard';
    navegarA(anterior, false);
  } else {
    navegarA('dashboard', false);
  }
}

window.navegarA = navegarA;
window.volverAlDashboard = volverAlDashboard;
window.volverAtras = volverAtras;

function irAGenerador() {
  navegarA('generate');
}

function cambiarPestañaModalCliente(tabName) {
  try {
    const btnPersonal = document.getElementById('tab-cli-btn-personal');
    const btnBiometria = document.getElementById('tab-cli-btn-biometria');
    const btnSalud = document.getElementById('tab-cli-btn-salud');
    const btnGeriatria = document.getElementById('tab-cli-btn-geriatria');

    const contentPersonal = document.getElementById('tab-cli-content-personal');
    const contentBiometria = document.getElementById('tab-cli-content-biometria');
    const contentSalud = document.getElementById('tab-cli-content-salud');
    const contentGeriatria = document.getElementById('tab-cli-content-geriatria');

    const allBtns = [btnPersonal, btnBiometria, btnSalud, btnGeriatria];
    const allContents = [contentPersonal, contentBiometria, contentSalud, contentGeriatria];

    allBtns.forEach(b => { if (b) b.classList.remove('active'); });
    allContents.forEach(c => { if (c) c.classList.add('hidden'); });

    if (tabName === 'personal') {
      if (btnPersonal) btnPersonal.classList.add('active');
      if (contentPersonal) contentPersonal.classList.remove('hidden');
    } else if (tabName === 'biometria') {
      if (btnBiometria) btnBiometria.classList.add('active');
      if (contentBiometria) contentBiometria.classList.remove('hidden');
    } else if (tabName === 'salud') {
      if (btnSalud) btnSalud.classList.add('active');
      if (contentSalud) contentSalud.classList.remove('hidden');
    } else if (tabName === 'geriatria') {
      if (btnGeriatria) btnGeriatria.classList.add('active');
      if (contentGeriatria) contentGeriatria.classList.remove('hidden');
    }
  } catch (err) {
    console.error("cambiarPestañaModalCliente Error:", err);
  }
}

function agregarFilaLesionModal() {
  const container = document.getElementById('modal-lesiones-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'fila-lesion-modal';
  div.style.cssText = 'display:flex; gap:10px; align-items:center;';
  div.innerHTML = `
    <input type="text" class="input-field input-lesion-condicion" placeholder="ej: Tendinitis de Hombro, Meniscolpatía..." style="flex:2;">
    <select class="select-field input-lesion-severidad" style="flex:1;">
      <option value="leve">Leve (Monitoreo)</option>
      <option value="moderada" selected>Moderada (Descarga Axial)</option>
      <option value="severa">Severa (Rehabilitación Isométrica)</option>
    </select>
    <button style="background:transparent; border:none; color:var(--danger); font-size:18px; cursor:pointer; padding:0 4px;" title="Eliminar lesión" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(div);
}

function agregarEnfermedadPersonalizada() {
  const input = document.getElementById('input-nueva-enfermedad');
  const container = document.getElementById('container-enfermedades-personalizadas');
  if (!input || !container) return;

  const val = input.value.trim();
  if (!val) return;

  const span = document.createElement('span');
  span.className = 'badge badge-risk-med tag-enfermedad-dinamica';
  span.style.cssText = 'display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:6px 10px; border-radius:var(--radius-sm);';
  span.innerHTML = `⚠️ ${val} <b onclick="this.parentElement.remove()" style="cursor:pointer; color:var(--danger); margin-left:4px;">✕</b>`;
  span.setAttribute('data-enfermedad', val);

  container.appendChild(span);
  input.value = '';
}

function abrirModalCliente() {
  const m = document.getElementById('modal-cliente');
  if (m) m.classList.remove('hidden');
  cambiarPestañaModalCliente('personal');
}

function cerrarModalCliente() {
  const m = document.getElementById('modal-cliente');
  if (m) m.classList.add('hidden');
}

// ==============================================================================
// 🛡️ FITPRO SCHEMA VALIDATOR & ANTI-XSS / ANTI-INJECTION SECURITY ENGINE
// ==============================================================================

const FitProSanitizer = {
  /**
   * Sanitizes generic string: strips HTML tags, control chars, javascript:, onload, onerror,
   * SQL injection patterns, and escapes entities.
   */
  cleanString(input, maxLength = 255, allowLineBreaks = false) {
    if (input === null || input === undefined) return '';
    let str = String(input);

    // Strip dangerous protocols & script injections
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/javascript\s*:/gi, '');
    str = str.replace(/data\s*:\s*text\/html/gi, '');
    str = str.replace(/on\w+\s*=/gi, '');

    // Strip HTML tags
    str = str.replace(/<\/?[^>]+(>|$)/g, '');

    if (!allowLineBreaks) {
      str = str.replace(/[\r\n\t]+/g, ' ');
    }

    // Escape basic HTML special chars
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    str = str.replace(/[&<>"'/]/g, (s) => map[s]);

    str = str.trim();
    if (maxLength && str.length > maxLength) {
      str = str.substring(0, maxLength);
    }
    return str;
  },

  /**
   * Cleans text while allowing safe punctuation for descriptions and clinical notes
   */
  cleanRichText(input, maxLength = 1000) {
    return this.cleanString(input, maxLength, true);
  },

  /**
   * Validates and normalizes email addresses
   */
  cleanEmail(input) {
    if (!input) return '';
    const clean = String(input).trim().toLowerCase();
    const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
    if (emailRegex.test(clean) && clean.length <= 100) {
      return clean;
    }
    return '';
  },

  /**
   * Validates and cleans phone numbers (E.164 compatible)
   */
  cleanPhone(input) {
    if (!input) return '';
    const hasPlus = String(input).trim().startsWith('+');
    const digits = String(input).replace(/[^\d]/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      return hasPlus ? `+${digits}` : digits;
    }
    return '';
  },

  /**
   * Validates and bounds numeric inputs strictly
   */
  cleanNumber(input, defaultVal, min = -Infinity, max = Infinity, isInteger = false) {
    const num = isInteger ? parseInt(input, 10) : parseFloat(input);
    if (isNaN(num) || !isFinite(num)) {
      return defaultVal;
    }
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Whitelist-based Enum Validation
   */
  cleanEnum(input, allowedValues, defaultVal) {
    const clean = String(input || '').trim();
    if (allowedValues.includes(clean)) {
      return clean;
    }
    return defaultVal;
  }
};

const FitProSchema = {
  /**
   * Validates client schema
   */
  validateClient(raw) {
    const errors = [];
    const nombre = FitProSanitizer.cleanString(raw.nombre, 80);
    if (!nombre || nombre.length < 2) {
      errors.push("El nombre del atleta es obligatorio (mínimo 2 caracteres).");
    }

    const email = FitProSanitizer.cleanEmail(raw.email);
    const telefono = FitProSanitizer.cleanPhone(raw.telefono);

    const edad = FitProSanitizer.cleanNumber(raw.edad, 28, 10, 115, true);
    const peso = FitProSanitizer.cleanNumber(raw.peso, 75.0, 25.0, 300.0);
    const altura = FitProSanitizer.cleanNumber(raw.altura, 175, 90, 250, true);
    const porcentajeGrasa = FitProSanitizer.cleanNumber(raw.porcentajeGrasa, 15.0, 3.0, 65.0);
    const porcentajeMusculo = FitProSanitizer.cleanNumber(raw.porcentajeMusculo, 40.0, 10.0, 80.0);

    const objetivo = FitProSanitizer.cleanString(raw.objetivo || 'Hipertrofia', 50);
    const nivel = FitProSanitizer.cleanEnum(raw.nivel, ['Principiante', 'Intermedio', 'Avanzado'], 'Intermedio');
    const genero = FitProSanitizer.cleanEnum(raw.genero, ['Masculino', 'Femenino', 'Otro'], 'Masculino');
    const estadoMembresia = FitProSanitizer.cleanEnum(raw.estadoMembresia, ['activa', 'por_vencer', 'vencida'], 'activa');

    const imc = parseFloat((peso / Math.pow(altura / 100, 2)).toFixed(1));

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        nombre,
        email,
        telefono,
        edad,
        genero,
        objetivo,
        nivel,
        estadoMembresia,
        peso,
        altura,
        imc,
        porcentajeGrasa,
        porcentajeMusculo
      }
    };
  },

  /**
   * Validates training plan schema
   */
  validatePlan(raw) {
    const errors = [];
    const cliente = FitProSanitizer.cleanString(raw.cliente, 80);
    if (!cliente) errors.push("El plan debe tener un atleta asignado.");

    const metodo = FitProSanitizer.cleanString(raw.metodo || 'Sobrecarga Progresiva', 100);
    const objetivo = FitProSanitizer.cleanString(raw.objetivo || 'Hipertrofia', 80);
    const rpe = FitProSanitizer.cleanNumber(raw.rpe_objetivo, 8.0, 1.0, 10.0);
    const rir = FitProSanitizer.cleanNumber(raw.rir_objetivo, 2.0, 0.0, 5.0);

    let ejercicios = [];
    if (Array.isArray(raw.ejercicios)) {
      ejercicios = raw.ejercicios.map(e => FitProSanitizer.cleanString(e, 200)).filter(Boolean);
    } else if (typeof raw.ejercicios === 'string') {
      ejercicios = raw.ejercicios.split('|').map(e => FitProSanitizer.cleanString(e, 200)).filter(Boolean);
    }

    if (ejercicios.length === 0) {
      errors.push("El plan debe incluir al menos un ejercicio biomecánico válido.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        cliente,
        metodo,
        objetivo,
        rpe_objetivo: rpe,
        rir_objetivo: rir,
        ejercicios
      }
    };
  },

  /**
   * Validates nutrition plan schema
   */
  validateDieta(raw) {
    const errors = [];
    const cliente = FitProSanitizer.cleanString(raw.cliente, 80);
    if (!cliente) errors.push("El plan nutricional debe tener un atleta asignado.");

    const tdee = FitProSanitizer.cleanNumber(raw.tdee, 2400, 800, 7000);
    const proteina = FitProSanitizer.cleanNumber(raw.proteina, 160, 20, 500);
    const carbo = FitProSanitizer.cleanNumber(raw.carbo, 260, 20, 1000);
    const grasa = FitProSanitizer.cleanNumber(raw.grasa, 65, 10, 300);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        cliente,
        nombre: FitProSanitizer.cleanString(raw.nombre || `Pauta Nutricional - ${cliente}`, 100),
        objetivo: FitProSanitizer.cleanString(raw.objetivo || 'Recomposición Corporal', 80),
        tdee,
        proteina,
        carbo,
        grasa
      }
    };
  },

  /**
   * Validates payment and financial transaction schema
   */
  validatePago(raw) {
    const errors = [];
    const cliente = FitProSanitizer.cleanString(raw.cliente, 80);
    if (!cliente) errors.push("Debes especificar el atleta del pago.");

    const concepto = FitProSanitizer.cleanString(raw.concepto, 100);
    if (!concepto) errors.push("Debes especificar el concepto del pago.");

    const monto = FitProSanitizer.cleanNumber(raw.monto, 0, 0.01, 1000000);
    if (monto <= 0) errors.push("El monto debe ser mayor a 0.");

    const metodo = FitProSanitizer.cleanEnum(raw.metodo, ['Efectivo', 'Tarjeta', 'Transferencia', 'Stripe', 'PayPal'], 'Transferencia');
    const estado = FitProSanitizer.cleanEnum(raw.estado, ['Pagado', 'Pendiente', 'Cancelado'], 'Pagado');

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        cliente,
        concepto,
        monto,
        metodo,
        estado
      }
    };
  }
};

function guardarCliente() {
  const nombreInput = document.getElementById('modal-nombre');
  const edadInput = document.getElementById('modal-edad');
  const generoInput = document.getElementById('modal-genero');
  const objetivoInput = document.getElementById('modal-objetivo');
  const nivelInput = document.getElementById('modal-nivel');

  // Biometrics
  const pesoInput = document.getElementById('modal-peso');
  const alturaInput = document.getElementById('modal-altura');
  const grasaInput = document.getElementById('modal-grasa');
  const musculoInput = document.getElementById('modal-musculo');
  const cinturaInput = document.getElementById('modal-perim-cintura');
  const pechoInput = document.getElementById('modal-perim-pecho');
  const caderaInput = document.getElementById('modal-perim-cadera');

  // Bilateral Extremity Perimeters
  const brazoIzqInput = document.getElementById('modal-brazo-izq');
  const brazoDerInput = document.getElementById('modal-brazo-der');
  const musloIzqInput = document.getElementById('modal-muslo-izq');
  const musloDerInput = document.getElementById('modal-muslo-der');
  const pantorrillaIzqInput = document.getElementById('modal-pantorrilla-izq');
  const pantorrillaDerInput = document.getElementById('modal-pantorrilla-der');

  const rawClientData = {
    nombre: nombreInput?.value,
    edad: edadInput?.value,
    genero: generoInput?.value,
    objetivo: objetivoInput?.value,
    nivel: nivelInput?.value,
    email: document.getElementById('modal-email')?.value,
    telefono: document.getElementById('modal-telefono')?.value,
    estadoMembresia: document.getElementById('modal-membresia')?.value,
    peso: pesoInput?.value,
    altura: alturaInput?.value,
    porcentajeGrasa: grasaInput?.value,
    porcentajeMusculo: musculoInput?.value
  };

  // Validación estricta con FitProSchema
  const validation = FitProSchema.validateClient(rawClientData);
  if (!validation.isValid) {
    showToast(validation.errors.join(' '), "warning", "Validación de Formulario");
    cambiarPestañaModalCliente('personal');
    if (nombreInput) nombreInput.focus();
    return;
  }

  const sanitized = validation.sanitized;
  const nombre = sanitized.nombre;

  // Multiple Injuries (Sanitized)
  const filasLesiones = document.querySelectorAll('.fila-lesion-modal');
  const lesionesList = [];
  filasLesiones.forEach(f => {
    const cond = FitProSanitizer.cleanString(f.querySelector('.input-lesion-condicion')?.value, 100);
    const sev = FitProSanitizer.cleanEnum(f.querySelector('.input-lesion-severidad')?.value, ['leve', 'moderada', 'severa'], 'moderada');
    if (cond) {
      lesionesList.push({ condicion: cond, severidad: sev });
    }
  });

  // Medical Conditions (Sanitized)
  const chksEnfermedades = document.querySelectorAll('.chk-enfermedad:checked');
  const enfermedadesList = Array.from(chksEnfermedades).map(c => FitProSanitizer.cleanString(c.value, 60));
  
  // Custom Dynamic Diseases (Sanitized)
  const tagsDinamicos = document.querySelectorAll('.tag-enfermedad-dinamica');
  tagsDinamicos.forEach(t => {
    const val = FitProSanitizer.cleanString(t.getAttribute('data-enfermedad'), 60);
    if (val && !enfermedadesList.includes(val)) {
      enfermedadesList.push(val);
    }
  });

  // Geriatric & Adulto Mayor Specialized Fields (Sanitized)
  const movilidad = sanitizeText(document.getElementById('modal-ger-movilidad')?.value || 'funcional', 50);
  const equilibrio = sanitizeText(document.getElementById('modal-ger-equilibrio')?.value || 'moderado', 50);
  const sarcopenia = sanitizeText(document.getElementById('modal-ger-sarcopenia')?.value || 'leve', 50);
  const chksOseas = document.querySelectorAll('.chk-patologia-osea:checked');
  const patologiasOseas = Array.from(chksOseas).map(c => sanitizeText(c.value, 60));
  const sistolica = sanitizeNumber(document.getElementById('modal-ger-pa-sistolica')?.value, 125, 60, 260);
  const diastolica = sanitizeNumber(document.getElementById('modal-ger-pa-diastolica')?.value, 80, 40, 160);
  const medicacion = sanitizeText(document.getElementById('modal-ger-medicacion')?.value || 'controlada', 100);

  const edad = sanitizeNumber(edadInput.value, 28, 12, 110);
  const objetivoVal = sanitizeText(objetivoInput.value, 50);
  const esGeriatrico = edad >= 60 || objetivoVal.includes('Adulto') || objetivoVal.includes('Rehabilitación');

  const peso = sanitizeNumber(pesoInput.value, 75.0, 30, 260);
  const altura = sanitizeNumber(alturaInput.value, 175, 100, 240);
  const imc = parseFloat((peso / Math.pow(altura / 100, 2)).toFixed(1));

  const entrenador = sanitizeText(document.getElementById('modal-entrenador')?.value || "Coach Master Pro", 80);
  const userId = getUsuarioActualId() || 'demo_coach';

  let passwordAtleta = document.getElementById('modal-password')?.value || '';
  let mustChangePassword = false;

  // Autogenerar contraseña temporal segura si el coach no ingresó una
  if (!passwordAtleta || passwordAtleta.length < 6) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    passwordAtleta = `FP*${randNum}${chars[Math.floor(Math.random() * chars.length)]}${chars[Math.floor(Math.random() * chars.length)]}`;
    mustChangePassword = true;
  }

  let emailAtleta = sanitizeText(document.getElementById('modal-email')?.value || "", 100);
  if (!emailAtleta || !emailAtleta.includes('@')) {
    const cleanName = nombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.');
    emailAtleta = `${cleanName}@atleta.fitpro.app`;
  }

  const nuevoCliente = {
    id: Date.now(),
    user_id: userId,
    gym_id: gimnasioActivoId,
    entrenador,
    nombre,
    edad,
    genero: sanitizeText(generoInput.value || "Masculino", 20),
    email: emailAtleta,
    password_provisional: passwordAtleta,
    must_change_password: mustChangePassword,
    telefono: sanitizeText(document.getElementById('modal-telefono')?.value || "", 30),
    objetivo: objetivoVal || "Hipertrofia",
    nivel: sanitizeText(nivelInput.value || "Intermedio", 30),
    estadoMembresia: sanitizeText(document.getElementById('modal-membresia')?.value || "activa", 20),
    adherencia: "100%",
    fecha: new Date().toISOString().split('T')[0],
    peso,
    altura,
    porcentajeGrasa: sanitizeNumber(grasaInput.value, 18.0, 3, 60),
    porcentajeMusculo: sanitizeNumber(musculoInput.value, 42.0, 10, 80),
    perimetroCintura: sanitizeNumber(cinturaInput.value, 82, 40, 200),
    perimetroPecho: sanitizeNumber(pechoInput.value, 104, 50, 220),
    perimetroCadera: sanitizeNumber(caderaInput.value, 98, 50, 220),
    brazoIzquierdo: sanitizeNumber(brazoIzqInput.value, 37.5, 15, 75),
    brazoDerecho: sanitizeNumber(brazoDerInput.value, 38.0, 15, 75),
    musloIzquierdo: sanitizeNumber(musloIzqInput.value, 59.5, 25, 110),
    musloDerecho: sanitizeNumber(musloDerInput.value, 60.0, 25, 110),
    pantorrillaIzquierda: sanitizeNumber(pantorrillaIzqInput.value, 38.0, 15, 80),
    pantorrillaDerecha: sanitizeNumber(pantorrillaDerInput.value, 38.5, 15, 80),
    imc,
    lesiones: lesionesList,
    enfermedades: enfermedadesList,
    geriatria: {
      movilidad,
      equilibrio,
      sarcopenia,
      patologiasOseas,
      presionArterial: `${sistolica}/${diastolica} mmHg`,
      medicacion
    },
    esGeriatrico
  };

  clientes.unshift(nuevoCliente);
  persistirDatosUsuarioActual();
  window.clientes = clientes;

  // Sync to Supabase Cloud
  sincronizarClienteConSupabase(nuevoCliente);

  // Registrar usuario en Supabase Auth con credenciales automáticas
  if (passwordAtleta && nuevoCliente.email) {
    registrarCredencialesAtletaSupabase(nuevoCliente, passwordAtleta, mustChangePassword);
  }

  // Sync Injuries to lesionesDB
  lesionesList.forEach(l => {
    lesionesDB.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      user_id: userId,
      gym_id: gimnasioActivoId,
      cliente: nombre,
      condicion: l.condicion,
      severidad: l.severidad,
      estado: "En Monitoreo Clínico",
      recomendaciones: `Registrado en expediente inicial (${l.severidad.toUpperCase()}). Adaptación activa de vectores.`
    });
  });
  persistirDatosUsuarioActual();

  renderClientes();
  renderLesiones();
  renderSeniorsList();
  cerrarModalCliente();
  showToast(`Atleta "${nombre}" registrado. 📧 ${nuevoCliente.email} | 🔑 ${passwordAtleta}`, "success", "👤 Credenciales Creadas", 8000);

  nombreInput.value = '';
  const emailInput = document.getElementById('modal-email');
  if (emailInput) emailInput.value = '';
  const passInput = document.getElementById('modal-password');
  if (passInput) passInput.value = '';
  const telInput = document.getElementById('modal-telefono');
  if (telInput) telInput.value = '';
}

function alternarVisibilidadPasswordAtleta() {
  const pwdInput = document.getElementById('modal-password');
  if (pwdInput) {
    pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  }
}

async function registrarCredencialesAtletaSupabase(cliente, password, mustChangePassword = true) {
  if (!supabaseClient || sesionUsuarioActual?.esModoDemo) return null;
  if (!cliente.email || !password || password.length < 6) return null;

  try {
    console.log(`🔐 Creando credenciales de acceso Supabase Auth para atleta: ${cliente.email} (must_change_password: ${mustChangePassword})...`);
    const { data, error } = await supabaseClient.auth.signUp({
      email: cliente.email,
      password: password,
      options: {
        data: {
          full_name: cliente.nombre,
          role: 'athlete',
          gym_id: cliente.gym_id || gimnasioActivoId,
          coach_id: getUsuarioActualId(),
          phone: cliente.telefono || '',
          must_change_password: mustChangePassword
        }
      }
    });

    if (error) {
      console.warn("Notice al registrar credenciales de atleta:", error.message);
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
        showToast(`El correo ${cliente.email} ya posee cuenta en Supabase. Atleta vinculado correctamente.`, "info", "👤 Usuario Existente", 5000);
      }
      return null;
    }

    if (data && data.user) {
      cliente.auth_user_id = data.user.id;
      cliente.must_change_password = mustChangePassword;
      persistirDatosUsuarioActual();
      sincronizarClienteConSupabase(cliente);
      showToast(`¡Cuenta móvil creada para ${cliente.nombre}! Correo: ${cliente.email}`, "success", "📲 Credenciales Móviles Listas", 6000);
      return data.user.id;
    }
  } catch (err) {
    console.warn("Excepción creando usuario de atleta en Supabase Auth:", err);
  }
  return null;
}

// ==========================================
// 📲 AUTOMATIZACIÓN DE CREDENCIALES Y ENVÍO POR WHATSAPP
// ==========================================
async function generarUsuarioYPasswordAtleta(clienteId) {
  const cliente = clientes.find(c => c.id == clienteId);
  if (!cliente) {
    showToast("Cliente no encontrado.", "warning", "Aviso");
    return null;
  }

  // 1. Generar correo limpio si no posee uno
  if (!cliente.email || !cliente.email.includes('@')) {
    const cleanName = cliente.nombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.');
    cliente.email = `${cleanName}@atleta.fitpro.app`;
  }

  // 2. Generar contraseña provisional segura
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const randPass = `FP*${randNum}${chars[Math.floor(Math.random() * chars.length)]}${chars[Math.floor(Math.random() * chars.length)]}`;
  cliente.password_provisional = randPass;
  cliente.must_change_password = true;

  persistirDatosUsuarioActual();

  // 3. Registrar o actualizar en Supabase Auth
  if (supabaseClient && !sesionUsuarioActual?.esModoDemo) {
    try {
      showToast(`Generando credenciales en Supabase Auth para ${cliente.nombre}...`, "info", "🔐 Autenticación", 3000);
      const { data, error } = await supabaseClient.auth.signUp({
        email: cliente.email,
        password: randPass,
        options: {
          data: {
            full_name: cliente.nombre,
            role: 'athlete',
            gym_id: cliente.gym_id || gimnasioActivoId,
            coach_id: getUsuarioActualId(),
            phone: cliente.telefono || '',
            must_change_password: true
          }
        }
      });

      if (data && data.user) {
        cliente.auth_user_id = data.user.id;
      }
    } catch (err) {
      console.warn("Excepción creando credenciales en Supabase Auth:", err);
    }
  }

  // 4. Sincronizar tabla clients en Supabase
  sincronizarClienteConSupabase(cliente);
  persistirDatosUsuarioActual();
  renderClientes();

  showToast(`✅ Credenciales generadas:\n📧 ${cliente.email}\n🔑 ${cliente.password_provisional}`, "success", "👤 Usuario & Clave Creados", 8000);
  return { email: cliente.email, password: cliente.password_provisional };
}

async function enviarEnlaceWhatsAppAtleta(clienteId) {
  const cliente = clientes.find(c => c.id == clienteId);
  if (!cliente) {
    showToast("Cliente no encontrado.", "warning", "Aviso");
    return;
  }

  // Si no tiene credenciales, autogenerarlas primero
  if (!cliente.email || !cliente.password_provisional) {
    await generarUsuarioYPasswordAtleta(clienteId);
  }

  let telefono = cliente.telefono || await obtenerTelefonoCliente(cliente.nombre);
  if (!telefono) {
    const inputTel = prompt(`Ingresa el número de WhatsApp para ${cliente.nombre} (ej: +5215512345678):`, "");
    if (inputTel === null) return;
    telefono = inputTel.trim();
    if (telefono) {
      cliente.telefono = telefono;
      persistirDatosUsuarioActual();
      sincronizarClienteConSupabase(cliente);
    } else {
      showToast("Por favor ingresa un número de teléfono válido.", "warning", "Teléfono Requerido");
      return;
    }
  }

  const cleanPhone = telefono.replace(/[^\d+]/g, '').replace('+', '');
  const coachName = sesionUsuarioActual?.user?.user_metadata?.full_name || 'Coach Master Pro';
  const gymName = getGimnasioActivo().nombre;
  const atletaSlug = encodeURIComponent(cliente.nombre);
  const atletaEmail = encodeURIComponent(cliente.email || '');
  const atletaId = cliente.id;
  const directAthleteUrl = `https://curious-bavarois-54aab1.netlify.app/?atleta=${atletaSlug}&email=${atletaEmail}&id=${atletaId}&view=athlete`;

  const mensaje = 
    `¡Hola *${cliente.nombre}*! 👋\n\n` +
    `Te damos la bienvenida a *FitPro Suite Pro* en *${gymName}*. 🏋️‍♂️\n\n` +
    `Tu entrenador (*${coachName}*) ha configurado tu acceso directo para que puedas consultar tu rutina biomecánica, tu plan de nutrición y registrar tus avances en tiempo real.\n\n` +
    `🌐 *TU ENLACE DIRECTO PERSONALIZADO:* \n` +
    `👉 ${directAthleteUrl}\n\n` +
    `📱 *CÓMO USARLA COMO APP EN TU CELULAR:*\n` +
    `Abre el enlace en tu navegador (Chrome / Safari) y presiona *"Añadir a pantalla de inicio"* o *"Instalar aplicación"*. Entrarás directamente a tu panel deportivo sin pasos complicados.\n\n` +
    `🔐 *TUS DATOS DE ACCESO:*\n` +
    `📧 *Correo:* ${cliente.email}\n` +
    `🔒 *Contraseña temporal:* ${cliente.password_provisional}\n\n` +
    `💡 _Por tu seguridad, en tu primer inicio se te solicitará confirmar tu clave personal. Una vez dentro, tu rutina y dieta asignadas se cargarán de inmediato._\n\n` +
    `¡A darlo todo en cada sesión! 💪🔥\n` +
    `— *${coachName}* (${gymName})`;

  const waUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;

  window.open(waUrl, '_blank');
  showToast(`💬 Mensaje de WhatsApp preparado para ${cliente.nombre} (${telefono}).`, "success", "📲 WhatsApp Listo", 7000);
}

function calcularEstadoCicloRutina(clienteNombre) {
  const historial = planesGuardados.filter(p => p.cliente === clienteNombre);
  if (!historial || historial.length === 0) {
    return { estado: 'sin_rutina', texto: 'Sin Rutina Prescrita', badge: 'badge-risk-med', dias: 0 };
  }

  const ultimoPlan = historial[0];
  const fechaPlan = new Date(ultimoPlan.fecha);
  const hoy = new Date();
  const diffTiempo = Math.abs(hoy - fechaPlan);
  const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

  if (diffDias >= 30) {
    return { estado: 'vencida', texto: `🚨 Rutina Vencida (${diffDias}d)`, badge: 'badge-danger', dias: diffDias };
  } else if (diffDias >= 25) {
    return { estado: 'por_vencer', texto: `⏳ Renovación Pendiente (${diffDias}/30d)`, badge: 'badge-risk-med', dias: diffDias };
  } else {
    return { estado: 'activa', texto: `🟢 Rutina Vigente (${diffDias}/30d)`, badge: 'badge-green', dias: diffDias };
  }
}

function renovarRutinaMensual(clienteNombre) {
  prepararPlanPara(clienteNombre);
  setTimeout(() => {
    analizarYGenerarPlan();
  }, 150);
}

function renderDashboardStats() {
  const statClientes = document.getElementById('stat-clientes');
  const statIngresos = document.getElementById('stat-ingresos');
  const statAdherencia = document.getElementById('stat-adherencia');
  const statSatisfaccion = document.getElementById('stat-satisfaccion');

  const clientesActivos = getClientesActivos();
  const finanzasActivas = getFinanzasActivas();
  const planesActivos = getPlanesActivos();

  // 1. Contador dinámico de Clientes Activos
  if (statClientes) {
    statClientes.innerText = clientesActivos.length;
  }

  // 2. Ingresos del Mes (Suma de transacciones pagadas reales)
  if (statIngresos) {
    const totalCobrado = finanzasActivas
      .filter(t => t.estado === 'Pagado')
      .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
    statIngresos.innerText = `$${totalCobrado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // 3. Adherencia Promedio en tiempo real
  if (statAdherencia) {
    if (clientesActivos.length === 0) {
      statAdherencia.innerText = '0%';
    } else {
      let sumaAdh = 0;
      let countValidos = 0;
      clientesActivos.forEach(c => {
        const val = parseFloat(String(c.adherencia || '0').replace('%', ''));
        if (!isNaN(val)) {
          sumaAdh += val;
          countValidos++;
        }
      });
      const avgAdh = countValidos > 0 ? (sumaAdh / countValidos).toFixed(0) : 0;
      statAdherencia.innerText = `${avgAdh}%`;
    }
  }

  // 4. Satisfacción de Atletas
  if (statSatisfaccion) {
    if (clientesActivos.length === 0) {
      statSatisfaccion.innerText = '0.0 / 5.0';
    } else {
      const score = Math.min(5.0, (4.5 + (planesActivos.length > 0 ? 0.4 : 0.0))).toFixed(1);
      statSatisfaccion.innerText = `${score} / 5.0`;
    }
  }
}

window.renderDashboardStats = renderDashboardStats;

function cambiarModoVistaClientes(modo) {
  const tableWrapper = document.getElementById('clients-table-wrapper');
  const grid = document.getElementById('clients-grid');
  const btnTable = document.getElementById('btn-view-table-clients');
  const btnGrid = document.getElementById('btn-view-grid-clients');

  if (modo === 'grid') {
    if (tableWrapper) tableWrapper.style.display = 'none';
    if (grid) grid.style.display = 'grid';
    if (btnTable) btnTable.classList.remove('active');
    if (btnGrid) btnGrid.classList.add('active');
    localStorage.setItem('fitpro_clients_view_mode', 'grid');
  } else {
    if (tableWrapper) tableWrapper.style.display = 'block';
    if (grid) grid.style.display = 'none';
    if (btnTable) btnTable.classList.add('active');
    if (btnGrid) btnGrid.classList.remove('active');
    localStorage.setItem('fitpro_clients_view_mode', 'table');
  }
}

function renderClientes(filtro = '') {
  const grid = document.getElementById('clients-grid');
  const tableBody = document.getElementById('clients-table-body');
  const dashList = document.getElementById('dash-clients-list');
  const selectGen = document.getElementById('gen-cliente-select');

  const clientesGym = getClientesActivos();

  const filtrados = clientesGym.filter(c => 
    c.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
    c.objetivo.toLowerCase().includes(filtro.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(filtro.toLowerCase())) ||
    (c.telefono && c.telefono.toLowerCase().includes(filtro.toLowerCase()))
  );

  // 1. RENDERIZADO DE LA TABLA DE CLIENTES CON COLUMNA DE WHATSAPP Y GESTIÓN
  if (tableBody) {
    if (filtrados.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted); font-size:13px;">
            ${filtro ? 'No se encontraron atletas con ese criterio de búsqueda.' : 'No hay atletas registrados aún en esta sede. Haz clic en "+ Nuevo Atleta" para comenzar.'}
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = filtrados.map(c => {
        const badgeMembresiaClass = c.estadoMembresia === 'vencida' ? 'badge-danger' : c.estadoMembresia === 'por_vencer' ? 'badge-risk-med' : 'badge-green';
        const badgeMembresiaText = c.estadoMembresia === 'vencida' ? '🔴 Vencida' : c.estadoMembresia === 'por_vencer' ? '🟡 Por Vencer' : '🟢 Activa';
        const cicloRutina = calcularEstadoCicloRutina(c.nombre);

        return `
          <tr style="border-bottom:1px solid var(--border-color); transition:background 0.2s;" class="table-row-hover">
            <td style="padding:12px 14px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:34px; height:34px; border-radius:50%; background:rgba(34,197,94,0.15); color:var(--accent-green); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; border:1px solid rgba(34,197,94,0.3);">
                  ${c.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                </div>
                <div>
                  <strong style="color:#fff; font-size:14px; cursor:pointer;" onclick="abrirDetalleCliente(${c.id})">${c.nombre}</strong>
                  <div style="font-size:11.5px; color:var(--text-muted);">${c.edad || 28} años • <span style="color:var(--accent-green); font-weight:600;">${c.nivel || 'Atleta'}</span></div>
                </div>
              </div>
            </td>
            <td style="padding:12px 14px;">
              <div style="font-size:13px; color:#e2e8f0; font-weight:500;">🎯 ${c.objetivo}</div>
              <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">🏢 <span style="color:#38bdf8;">${c.gym_id || gimnasioActivoId}</span></div>
            </td>
            <td style="padding:12px 14px;">
              <div style="font-size:12.5px; color:#38bdf8;">📧 ${c.email || '<span style="color:var(--text-muted);">Sin correo</span>'}</div>
              <div style="font-size:12px; color:#4ade80; margin-top:2px;">${c.telefono ? `📱 ${c.telefono}` : '<span style="color:var(--text-muted);">Sin teléfono</span>'}</div>
            </td>
            <td style="padding:12px 14px;">
              <span class="badge ${badgeMembresiaClass}">${badgeMembresiaText}</span>
            </td>
            <td style="padding:12px 14px;">
              <span class="badge ${cicloRutina.badge}">${cicloRutina.texto}</span>
            </td>
            <td style="padding:12px 14px;">
              <div style="font-size:12px; font-family:monospace; color:#fbbf24; font-weight:700; background:rgba(251,191,36,0.08); padding:4px 8px; border-radius:4px; border:1px solid rgba(251,191,36,0.2); display:inline-block;">
                ${c.password_provisional ? `🔑 ${c.password_provisional}` : '<span style="color:var(--text-muted); font-family:inherit;">(Personalizada)</span>'}
              </div>
            </td>
            <td style="padding:12px 14px; text-align:right;">
              <div style="display:flex; justify-content:flex-end; align-items:center; gap:6px; flex-wrap:wrap;">
                <!-- BOTÓN PRINCIPAL DE WHATSAPP DIRECTO EN LA TABLA -->
                <button class="btn-primary" style="padding:6px 10px; font-size:11.5px; background:#22c55e; border-color:#22c55e; color:#000; font-weight:700; display:inline-flex; align-items:center; gap:5px;" onclick="enviarEnlaceWhatsAppAtleta(${c.id})" title="Enviar credenciales y enlace del APK por WhatsApp a ${c.nombre}">
                  💬 Enviar Enlace por WhatsApp
                </button>
                <button class="btn-secondary" style="padding:6px 9px; font-size:11.5px;" onclick="abrirDetalleCliente(${c.id})" title="Ver Expediente Deportivo">📋</button>
                <button class="btn-secondary" style="padding:6px 9px; font-size:11.5px; color:#38bdf8; border-color:rgba(56,189,248,0.4);" onclick="generarUsuarioYPasswordAtleta(${c.id})" title="Generar / Resetear Clave App">👤</button>
                <button class="btn-secondary" style="padding:6px 9px; font-size:11.5px; color:var(--accent-green);" onclick="renovarRutinaMensual('${c.nombre}')" title="Renovación Automática de Rutina">🔄</button>
                <button class="btn-secondary danger" style="padding:6px 9px; font-size:11.5px;" onclick="confirmarEliminarCliente(${c.id})" title="Eliminar Atleta">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 2. RENDERIZADO DE TARJETAS GRID
  if (grid) {
    if (filtrados.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted); font-size:14px; background:var(--bg-card); border-radius:var(--radius-md); border:1px dashed var(--border-color);">
        ${filtro ? 'No se encontraron atletas con ese criterio de búsqueda.' : 'No hay atletas registrados aún en esta sede. Haz clic en "+ Nuevo Atleta" para comenzar.'}
      </div>`;
    } else {
      grid.innerHTML = filtrados.map(c => {
        const badgeMembresiaClass = c.estadoMembresia === 'vencida' ? 'badge-danger' : c.estadoMembresia === 'por_vencer' ? 'badge-risk-med' : 'badge-green';
        const badgeMembresiaText = c.estadoMembresia === 'vencida' ? '🔴 Vencida' : c.estadoMembresia === 'por_vencer' ? '🟡 Por Vencer' : '🟢 Activa';

        const cicloRutina = calcularEstadoCicloRutina(c.nombre);

        return `
          <div class="client-card" style="position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="font-size:16px; color:#fff;">${c.nombre}</strong>
                <div style="margin-top:4px; display:flex; gap:6px; flex-wrap:wrap;">
                  <span class="badge badge-green">${c.nivel || 'Atleta'}</span>
                  <span class="badge ${badgeMembresiaClass}">${badgeMembresiaText}</span>
                  <span class="badge ${cicloRutina.badge}">${cicloRutina.texto}</span>
                </div>
              </div>

              <div style="position:relative;">
                <button class="action-menu-btn" onclick="toggleDropdownMenu(event, ${c.id})" title="Menú de Acciones (≡)">≡</button>
                <div class="dropdown-popover hidden" id="dropdown-menu-${c.id}">
                  <button class="dropdown-item" onclick="abrirModalCliente()"><span style="color:var(--accent-green);">⚡</span> Nuevo cliente</button>
                  <button class="dropdown-item" onclick="abrirDetalleCliente(${c.id})"><span>📋</span> Clientes activos (Expediente)</button>
                  <button class="dropdown-item" onclick="generarUsuarioYPasswordAtleta(${c.id})"><span style="color:#38bdf8;">👤</span> Generar Usuario y Contraseña</button>
                  <button class="dropdown-item" onclick="enviarEnlaceWhatsAppAtleta(${c.id})"><span style="color:#22c55e;">💬</span> Enviar Enlace por WhatsApp</button>
                  <button class="dropdown-item" onclick="renovarRutinaMensual('${c.nombre}')"><span style="color:var(--accent-green);">⚡</span> Renovación Automática</button>
                  <button class="dropdown-item" onclick="abrirModalPlanManual('${c.nombre}')"><span style="color:#60a5fa;">✏️</span> Crear Plan Manual</button>
                  <button class="dropdown-item danger" onclick="confirmarEliminarCliente(${c.id})"><span>🗑️</span> Eliminar cliente</button>
                </div>
              </div>
            </div>

            <div style="color:var(--text-muted); font-size:13px; margin-top:10px;">
              🎯 <strong>Objetivo:</strong> ${c.objetivo}<br>
              📊 <strong>Adherencia:</strong> ${c.adherencia || '90%'}<br>
              ${c.email ? `📧 <strong>Email App:</strong> <span style="color:#38bdf8;">${c.email}</span><br>` : ''}
              ${c.password_provisional ? `🔑 <strong>Clave App:</strong> <span style="color:#fbbf24; font-family:monospace; font-weight:700;">${c.password_provisional}</span><br>` : ''}
              ${c.telefono ? `📱 <strong>Teléfono:</strong> <span style="color:#4ade80;">${c.telefono}</span><br>` : ''}
              🏢 <strong>Sede:</strong> <span style="color:#38bdf8;">${c.gym_id || gimnasioActivoId}</span> • 📅 <strong>Fecha:</strong> ${c.fecha || 'Reciente'}
            </div>

            <!-- BOTONES AUTOMATIZADOS DE CREDENCIALES Y WHATSAPP -->
            <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
              <div style="display:flex; gap:6px;">
                <button class="btn-secondary" style="padding:6px 8px; font-size:11px; flex:1; justify-content:center; color:#38bdf8; border-color:rgba(56,189,248,0.4);" onclick="generarUsuarioYPasswordAtleta(${c.id})" title="Autogenerar credenciales seguras para la App Móvil">
                  👤 Generar Usuario y Contraseña
                </button>
                <button class="btn-primary" style="padding:6px 8px; font-size:11px; flex:1; justify-content:center; background:#22c55e; border-color:#22c55e; color:#000; font-weight:700;" onclick="enviarEnlaceWhatsAppAtleta(${c.id})" title="Enviar accesos y enlace de la app por WhatsApp">
                  💬 Enviar Enlace por WhatsApp
                </button>
              </div>
            </div>

            <div style="margin-top:auto; display:flex; gap:8px; padding-top:12px; border-top:1px solid var(--border-color);">
              <button class="btn-secondary" style="padding:6px 12px; font-size:12px; flex:1;" onclick="abrirDetalleCliente(${c.id})">📋 Expediente</button>
              <button class="btn-primary" style="padding:6px 12px; font-size:12px;" onclick="renovarRutinaMensual('${c.nombre}')">🔄 Renovar</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  if (dashList) {
    if (clientesGym.length === 0) {
      dashList.innerHTML = `<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px; background:var(--bg-surface); border-radius:var(--radius-sm);">No hay atletas registrados aún en esta sede.</div>`;
    } else {
      dashList.innerHTML = clientesGym.slice(0, 4).map(c => `
        <div style="background:var(--bg-card); padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="font-size:14px; color:#fff;">${c.nombre}</strong>
            <div style="font-size:12px; color:var(--text-muted);">${c.objetivo} • ${c.nivel || 'Atleta'}</div>
          </div>
          <span class="badge badge-green">${c.adherencia || '90%'} Adherencia</span>
        </div>
      `).join('');
    }
  }

  if (selectGen) {
    selectGen.innerHTML = clientesGym.map(c => `<option value="${c.nombre}">${c.nombre} (${c.objetivo})</option>`).join('');
  }

  const selectCalc = document.getElementById('calc-cliente-select');
  if (selectCalc) {
    selectCalc.innerHTML = `<option value="">-- Seleccionar Atleta (${getGimnasioActivo().nombre}) --</option>` + clientesGym.map(c => `<option value="${c.nombre}">${c.nombre} (${c.objetivo})</option>`).join('');
  }

  renderDashboardStats();
  renderAlertasProactivas();
}

// Multi-Calculator Suite Functions
function cambiarTabCalculadora(tabKey, btn) {
  document.querySelectorAll('.tab-calc-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('#view-calculator .filter-tab').forEach(b => b.classList.remove('active'));

  const tabContainer = document.getElementById(`tab-calc-${tabKey}`);
  if (tabContainer) tabContainer.classList.remove('hidden');
  if (btn) btn.classList.add('active');
}

function autoCompletarCalculadoraCliente(nombreCliente) {
  if (!nombreCliente) return;

  const cleanName = (nombreCliente || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const cliente = clientes.find(c => {
    const cName = (c.nombre || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    return cName === cleanName || c.nombre === nombreCliente || cName.includes(cleanName) || cleanName.includes(cName);
  });
  if (!cliente) return;

  const selectCalc = document.getElementById('calc-cliente-select');
  if (selectCalc) selectCalc.value = cliente.nombre;

  // Autofill TDEE
  if (document.getElementById('calc-tdee-peso')) document.getElementById('calc-tdee-peso').value = cliente.peso || 78.5;
  if (document.getElementById('calc-tdee-altura')) document.getElementById('calc-tdee-altura').value = cliente.altura || 178;
  if (document.getElementById('calc-tdee-edad')) document.getElementById('calc-tdee-edad').value = cliente.edad || 28;
  if (document.getElementById('calc-tdee-genero')) document.getElementById('calc-tdee-genero').value = cliente.genero || 'h';

  if (document.getElementById('calc-tdee-objetivo')) {
    const objLower = (cliente.objetivo || '').toLowerCase();
    if (objLower.includes('definic')) {
      document.getElementById('calc-tdee-objetivo').value = 'definicion';
    } else if (objLower.includes('recomp') || objLower.includes('fuerza') || objLower.includes('salud')) {
      document.getElementById('calc-tdee-objetivo').value = 'mantenimiento';
    } else {
      document.getElementById('calc-tdee-objetivo').value = 'hipertrofia';
    }
  }

  // Autofill Grasa
  if (document.getElementById('calc-grasa-peso')) document.getElementById('calc-grasa-peso').value = cliente.peso || 78.5;
  if (document.getElementById('calc-grasa-altura')) document.getElementById('calc-grasa-altura').value = cliente.altura || 178;
  if (document.getElementById('calc-grasa-cintura')) document.getElementById('calc-grasa-cintura').value = cliente.perimetroCintura || cliente.perimetroAbdominal || 82;
  if (document.getElementById('calc-grasa-cuello')) document.getElementById('calc-grasa-cuello').value = cliente.perimetroCuello || 39;
  if (document.getElementById('calc-grasa-cadera')) document.getElementById('calc-grasa-cadera').value = cliente.perimetroCadera || 98;
  if (document.getElementById('calc-grasa-genero')) document.getElementById('calc-grasa-genero').value = cliente.genero || 'h';

  // Autofill Cardio
  if (document.getElementById('calc-cardio-edad')) document.getElementById('calc-cardio-edad').value = cliente.edad || 28;

  // Trigger Calculations immediately for instant feedback
  ejecutarCalcularTDEE();
  ejecutarCalcularGrasa();
  ejecutarCalcularCardio();
}

function alternarACreadorManual(clienteNombre, kcal, proteina, carbo, grasa, objetivo) {
  abrirModalDietaManual(clienteNombre);
  if (document.getElementById('dieta-kcal')) document.getElementById('dieta-kcal').value = kcal;
  if (document.getElementById('dieta-proteina')) document.getElementById('dieta-proteina').value = proteina;
  if (document.getElementById('dieta-carbo')) document.getElementById('dieta-carbo').value = carbo;
  if (document.getElementById('dieta-grasa')) document.getElementById('dieta-grasa').value = grasa;
  if (document.getElementById('dieta-objetivo')) {
    const opt = document.getElementById('dieta-objetivo');
    if (objetivo.toLowerCase().includes('definic')) opt.value = 'Definición';
    else if (objetivo.toLowerCase().includes('recomp')) opt.value = 'Recomposición';
    else opt.value = 'Hipertrofia';
  }
}

// Quick Sync Action to Save Full Diet into Athlete Profile and Nutrition Catalog
function guardarDietaDesdeCalculadora(clienteNombre, targetKcal, proteinaGrs, carboGrs, grasaGrs, objetivo) {
  if (!clienteNombre || clienteNombre === "Atleta Pro" || clienteNombre === "") {
    const sel = document.getElementById('calc-cliente-select');
    if (sel && sel.value) clienteNombre = sel.value;
    else clienteNombre = "Alejandro Gómez";
  }

  // Generate 5 structured meals based on goal
  let menuComidas = [];
  const objLower = (objetivo || '').toLowerCase();
  if (objLower.includes('definic')) {
    menuComidas = [
      { tiempo: "🌅 Desayuno Proteico (8:00 AM)", alimento: "4 Claras de huevo + 1 Huevo entero + 50g Copos de avena cocidos + 80g Frutos rojos", macros: `${Math.round(targetKcal * 0.24)} kcal • ${Math.round(proteinaGrs * 0.25)}g P / ${Math.round(carboGrs * 0.25)}g C / ${Math.round(grasaGrs * 0.20)}g G` },
      { tiempo: "🥪 Almuerzo / Media Mañana Saciante (11:00 AM)", alimento: "150g Yogur Griego natural 0% + 15g Nueces + Semillas de chía hidratadas", macros: `${Math.round(targetKcal * 0.16)} kcal • ${Math.round(proteinaGrs * 0.18)}g P / ${Math.round(carboGrs * 0.10)}g C / ${Math.round(grasaGrs * 0.22)}g G` },
      { tiempo: "🍲 Comida Principal Baja en Grasa (2:30 PM)", alimento: "180g Pechuga de pollo o atún + 150g Patata cocida con piel + Brócoli al vapor", macros: `${Math.round(targetKcal * 0.32)} kcal • ${Math.round(proteinaGrs * 0.32)}g P / ${Math.round(carboGrs * 0.40)}g C / ${Math.round(grasaGrs * 0.20)}g G` },
      { tiempo: "🍌 Snacks / Merienda Rápida Pre-Entreno (5:30 PM)", alimento: "1 Manzana verde en láminas + 1 Scoop Proteína de suero en agua fría", macros: `${Math.round(targetKcal * 0.14)} kcal • ${Math.round(proteinaGrs * 0.15)}g P / ${Math.round(carboGrs * 0.15)}g C / 3g G` },
      { tiempo: "🌙 Cena Ligera de Alta Digestión (9:00 PM)", alimento: "160g Solomillo de pavo + Ensalada de espinacas baby con 1 cda de aceite de oliva", macros: `${Math.round(targetKcal * 0.14)} kcal • ${Math.round(proteinaGrs * 0.10)}g P / ${Math.round(carboGrs * 0.10)}g C / ${Math.round(grasaGrs * 0.35)}g G` }
    ];
  } else if (objLower.includes('recomp') || objLower.includes('fuerza') || objLower.includes('salud') || objLower.includes('mantenimiento')) {
    menuComidas = [
      { tiempo: "🌅 Desayuno Equilibrado (8:00 AM)", alimento: "2 Tostadas de pan de masa madre + 2 Huevos poché + 60g Salmón ahumado + Rodajas de tomate", macros: `${Math.round(targetKcal * 0.25)} kcal • ${Math.round(proteinaGrs * 0.25)}g P / ${Math.round(carboGrs * 0.25)}g C / ${Math.round(grasaGrs * 0.25)}g G` },
      { tiempo: "🥪 Almuerzo / Media Mañana Recomp (11:00 AM)", alimento: "1 Manzana + 30g Proteína vegetal o suero + 15g Almendras crudas", macros: `${Math.round(targetKcal * 0.15)} kcal • ${Math.round(proteinaGrs * 0.18)}g P / ${Math.round(carboGrs * 0.15)}g C / ${Math.round(grasaGrs * 0.15)}g G` },
      { tiempo: "🍲 Comida Principal (2:00 PM)", alimento: "180g Ternera magra a la parrilla + 200g Arroz integral / Quinoa + Pimientos y espárragos", macros: `${Math.round(targetKcal * 0.32)} kcal • ${Math.round(proteinaGrs * 0.32)}g P / ${Math.round(carboGrs * 0.35)}g C / ${Math.round(grasaGrs * 0.25)}g G` },
      { tiempo: "🍌 Snacks / Merienda Pre-Entreno (5:30 PM)", alimento: "1 Plátano mediano + 1 Café solo con canela + 10g Chocolate negro 85%", macros: `${Math.round(targetKcal * 0.12)} kcal • 4g P / ${Math.round(carboGrs * 0.15)}g C / ${Math.round(grasaGrs * 0.10)}g G` },
      { tiempo: "🌙 Cena Reconstituyente (8:45 PM)", alimento: "180g Pechuga de pollo al horno + Puré de calabaza con semillas tostadas", macros: `${Math.round(targetKcal * 0.16)} kcal • ${Math.round(proteinaGrs * 0.21)}g P / ${Math.round(carboGrs * 0.10)}g C / ${Math.round(grasaGrs * 0.25)}g G` }
    ];
  } else {
    menuComidas = [
      { tiempo: "🌅 Desayuno Energético (7:30 AM)", alimento: "100g Avena integral + 4 Huevos enteros + 1 Plátano + 20g Mantequilla de maní", macros: `${Math.round(targetKcal * 0.25)} kcal • ${Math.round(proteinaGrs * 0.25)}g P / ${Math.round(carboGrs * 0.30)}g C / ${Math.round(grasaGrs * 0.25)}g G` },
      { tiempo: "🥪 Almuerzo / Media Mañana (10:30 AM)", alimento: "1 Bagel o pan integral + 120g Pechuga de pavo + 1/2 Aguacate en rodajas", macros: `${Math.round(targetKcal * 0.18)} kcal • ${Math.round(proteinaGrs * 0.20)}g P / ${Math.round(carboGrs * 0.18)}g C / ${Math.round(grasaGrs * 0.20)}g G` },
      { tiempo: "🍲 Comida Principal Anabólica (2:00 PM)", alimento: "200g Pechuga de pollo a la plancha + 250g Arroz jazmín + Ensalada verde con 1 cda AOVE", macros: `${Math.round(targetKcal * 0.30)} kcal • ${Math.round(proteinaGrs * 0.30)}g P / ${Math.round(carboGrs * 0.32)}g C / ${Math.round(grasaGrs * 0.25)}g G` },
      { tiempo: "🍌 Snacks / Merienda Pre/Post-Entreno (5:30 PM)", alimento: "1 Scoop Whey Protein Isolate + 40g Harina de avena / Tortas de arroz con miel", macros: `${Math.round(targetKcal * 0.15)} kcal • ${Math.round(proteinaGrs * 0.15)}g P / ${Math.round(carboGrs * 0.15)}g C / 5g G` },
      { tiempo: "🌙 Cena de Recuperación Tisular (8:30 PM)", alimento: "200g Filete de salmón / Merluza + 200g Boniato al horno + Espárragos verdes", macros: `${Math.round(targetKcal * 0.12)} kcal • ${Math.round(proteinaGrs * 0.10)}g P / ${Math.round(carboGrs * 0.05)}g C / ${Math.round(grasaGrs * 0.25)}g G` }
    ];
  }

  const objNormalizado = objLower.includes('definic') ? 'Definición' : objLower.includes('recomp') ? 'Recomposición' : 'Hipertrofia';

  // 1. Update or create in dietasGuardadas
  const indexExistente = dietasGuardadas.findIndex(d => d.cliente.toLowerCase() === clienteNombre.toLowerCase());
  const dietaObj = {
    id: indexExistente >= 0 ? dietasGuardadas[indexExistente].id : Date.now(),
    cliente: clienteNombre,
    nombre: `Plan Nutricional Prescrito (${objNormalizado})`,
    objetivo: objNormalizado,
    mesociclo: indexExistente >= 0 ? (dietasGuardadas[indexExistente].mesociclo || 1) : 1,
    fecha: new Date().toISOString().split('T')[0],
    tdee: targetKcal,
    proteina: proteinaGrs,
    carbo: carboGrs,
    grasa: grasaGrs,
    comidas: menuComidas
  };

  if (indexExistente >= 0) {
    dietasGuardadas[indexExistente] = dietaObj;
  } else {
    dietasGuardadas.unshift(dietaObj);
  }
  localStorage.setItem('fitpro_dietas', JSON.stringify(dietasGuardadas));

  // 2. Update in clientes
  const clienteObj = clientes.find(c => c.nombre.toLowerCase() === clienteNombre.toLowerCase());
  if (clienteObj) {
    clienteObj.tdeeSincronizado = targetKcal;
    clienteObj.proteinaGrs = proteinaGrs;
    clienteObj.carboGrs = carboGrs;
    clienteObj.grasaGrs = grasaGrs;
    localStorage.setItem('fitpro_clientes', JSON.stringify(clientes));
  }

  renderDietas();
  renderClientes();

  mostrarNotificacionExito(
    "✅ Plan Nutricional Sincronizado",
    `Se guardó la dieta completa de <strong>${clienteNombre}</strong> (${targetKcal} kcal • 5 comidas) en su perfil y en el menú de Nutrición.`
  );
}

function mostrarNotificacionExito(titulo, mensajeHtml) {
  let toast = document.getElementById('fitpro-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fitpro-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.backgroundColor = '#18181b';
    toast.style.color = '#fff';
    toast.style.padding = '16px 20px';
    toast.style.borderRadius = '10px';
    toast.style.border = '1px solid #22c55e';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.style.zIndex = '999999';
    toast.style.display = 'flex';
    toast.style.flexDirection = 'column';
    toast.style.gap = '6px';
    toast.style.maxWidth = '360px';
    toast.style.transition = 'all 0.3s ease';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <strong style="color:#22c55e; font-size:14px;">${titulo}</strong>
      <button onclick="document.getElementById('fitpro-toast').style.display='none'" style="background:transparent; border:none; color:#a1a1aa; cursor:pointer; font-size:16px;">×</button>
    </div>
    <div style="color:#e4e4e7; font-size:12px; line-height:1.4;">${mensajeHtml}</div>
    <div style="margin-top:6px;">
      <button class="btn-primary" style="font-size:11px; padding:6px 12px; width:100%; justify-content:center;" onclick="navegarA('nutrition'); document.getElementById('fitpro-toast').style.display='none';">👁️ Ver en Catálogo de Nutrición ➔</button>
    </div>
  `;
  toast.style.display = 'flex';
  setTimeout(() => {
    if (toast) toast.style.display = 'none';
  }, 6000);
}

// 1. TDEE & TMB with Embedded Automatic Diet Recommendation
function ejecutarCalcularTDEE() {
  const selectCli = document.getElementById('calc-cliente-select');
  const clienteNombre = selectCli && selectCli.value ? selectCli.value : "Atleta Pro";

  const peso = parseFloat(document.getElementById('calc-tdee-peso').value) || 75;
  const altura = parseFloat(document.getElementById('calc-tdee-altura').value) || 175;
  const edad = parseFloat(document.getElementById('calc-tdee-edad').value) || 28;
  const genero = document.getElementById('calc-tdee-genero').value;
  const factor = parseFloat(document.getElementById('calc-tdee-actividad').value) || 1.55;
  const objetivo = document.getElementById('calc-tdee-objetivo').value;

  // Mifflin-St Jeor Formula
  let tmb = (10 * peso) + (6.25 * altura) - (5 * edad);
  tmb = genero === 'h' ? tmb + 5 : tmb - 161;

  const tdee = tmb * factor;
  let targetKcal = tdee;

  if (objetivo === 'hipertrofia') targetKcal += 300;
  if (objetivo === 'definicion') targetKcal -= 400;

  const proteinaGrs = Math.round(peso * 2.2);
  const grasaGrs = Math.round(peso * 1.0);
  const proteinaKcal = proteinaGrs * 4;
  const grasaKcal = grasaGrs * 9;
  const carboKcal = Math.max(0, targetKcal - (proteinaKcal + grasaKcal));
  const carboGrs = Math.round(carboKcal / 4);

  // Generate 5 structured meals based on goal
  let menuComidas = [];
  if (objetivo === 'hipertrofia') {
    menuComidas = [
      { tiempo: "🌅 Desayuno Energético (7:30 AM)", alimento: "100g Avena integral + 4 Huevos enteros + 1 Plátano + 20g Mantequilla de maní", macros: `${Math.round(targetKcal * 0.25)} kcal • ${Math.round(proteinaGrs * 0.25)}g P / ${Math.round(carboGrs * 0.30)}g C / ${Math.round(grasaGrs * 0.25)}g G` },
      { tiempo: "🥪 Almuerzo / Media Mañana (10:30 AM)", alimento: "1 Bagel o pan integral + 120g Pechuga de pavo + 1/2 Aguacate en rodajas", macros: `${Math.round(targetKcal * 0.18)} kcal • ${Math.round(proteinaGrs * 0.20)}g P / ${Math.round(carboGrs * 0.18)}g C / ${Math.round(grasaGrs * 0.20)}g G` },
      { tiempo: "🍲 Comida Principal Anabólica (2:00 PM)", alimento: "200g Pechuga de pollo a la plancha + 250g Arroz jazmín + Ensalada verde con 1 cda AOVE", macros: `${Math.round(targetKcal * 0.30)} kcal • ${Math.round(proteinaGrs * 0.30)}g P / ${Math.round(carboGrs * 0.32)}g C / ${Math.round(grasaGrs * 0.25)}g G` },
      { tiempo: "🍌 Snacks / Merienda Pre/Post-Entreno (5:30 PM)", alimento: "1 Scoop Whey Protein Isolate + 40g Harina de avena / Tortas de arroz con miel", macros: `${Math.round(targetKcal * 0.15)} kcal • ${Math.round(proteinaGrs * 0.15)}g P / ${Math.round(carboGrs * 0.15)}g C / 5g G` },
      { tiempo: "🌙 Cena de Recuperación Tisular (8:30 PM)", alimento: "200g Filete de salmón / Merluza + 200g Boniato al horno + Espárragos verdes", macros: `${Math.round(targetKcal * 0.12)} kcal • ${Math.round(proteinaGrs * 0.10)}g P / ${Math.round(carboGrs * 0.05)}g C / ${Math.round(grasaGrs * 0.25)}g G` }
    ];
  } else if (objetivo === 'definicion') {
    menuComidas = [
      { tiempo: "🌅 Desayuno Proteico (8:00 AM)", alimento: "4 Claras de huevo + 1 Huevo entero + 50g Copos de avena cocidos + 80g Frutos rojos", macros: `${Math.round(targetKcal * 0.24)} kcal • ${Math.round(proteinaGrs * 0.25)}g P / ${Math.round(carboGrs * 0.25)}g C / ${Math.round(grasaGrs * 0.20)}g G` },
      { tiempo: "🥪 Almuerzo / Media Mañana Saciante (11:00 AM)", alimento: "150g Yogur Griego natural 0% + 15g Nueces + Semillas de chía hidratadas", macros: `${Math.round(targetKcal * 0.16)} kcal • ${Math.round(proteinaGrs * 0.18)}g P / ${Math.round(carboGrs * 0.10)}g C / ${Math.round(grasaGrs * 0.22)}g G` },
      { tiempo: "🍲 Comida Principal Baja en Grasa (2:30 PM)", alimento: "180g Pechuga de pollo o atún + 150g Patata cocida con piel + Brócoli al vapor", macros: `${Math.round(targetKcal * 0.32)} kcal • ${Math.round(proteinaGrs * 0.32)}g P / ${Math.round(carboGrs * 0.40)}g C / ${Math.round(grasaGrs * 0.20)}g G` },
      { tiempo: "🍌 Snacks / Merienda Rápida Pre-Entreno (5:30 PM)", alimento: "1 Manzana verde en láminas + 1 Scoop Proteína de suero en agua fría", macros: `${Math.round(targetKcal * 0.14)} kcal • ${Math.round(proteinaGrs * 0.15)}g P / ${Math.round(carboGrs * 0.15)}g C / 3g G` },
      { tiempo: "🌙 Cena Ligera de Alta Digestión (9:00 PM)", alimento: "160g Solomillo de pavo + Ensalada de espinacas baby con 1 cda de aceite de oliva", macros: `${Math.round(targetKcal * 0.14)} kcal • ${Math.round(proteinaGrs * 0.10)}g P / ${Math.round(carboGrs * 0.10)}g C / ${Math.round(grasaGrs * 0.35)}g G` }
    ];
  } else {
    menuComidas = [
      { tiempo: "🌅 Desayuno Equilibrado (8:00 AM)", alimento: "2 Tostadas de pan de masa madre + 2 Huevos poché + 60g Salmón ahumado + Rodajas de tomate", macros: `${Math.round(targetKcal * 0.25)} kcal • ${Math.round(proteinaGrs * 0.25)}g P / ${Math.round(carboGrs * 0.25)}g C / ${Math.round(grasaGrs * 0.25)}g G` },
      { tiempo: "🥪 Almuerzo / Media Mañana Recomp (11:00 AM)", alimento: "1 Manzana + 30g Proteína vegetal o suero + 15g Almendras crudas", macros: `${Math.round(targetKcal * 0.15)} kcal • ${Math.round(proteinaGrs * 0.18)}g P / ${Math.round(carboGrs * 0.15)}g C / ${Math.round(grasaGrs * 0.15)}g G` },
      { tiempo: "🍲 Comida Principal (2:00 PM)", alimento: "180g Ternera magra a la parrilla + 200g Arroz integral / Quinoa + Pimientos y espárragos", macros: `${Math.round(targetKcal * 0.32)} kcal • ${Math.round(proteinaGrs * 0.32)}g P / ${Math.round(carboGrs * 0.35)}g C / ${Math.round(grasaGrs * 0.25)}g G` },
      { tiempo: "🍌 Snacks / Merienda Pre-Entreno (5:30 PM)", alimento: "1 Plátano mediano + 1 Café solo con canela + 10g Chocolate negro 85%", macros: `${Math.round(targetKcal * 0.12)} kcal • 4g P / ${Math.round(carboGrs * 0.15)}g C / ${Math.round(grasaGrs * 0.10)}g G` },
      { tiempo: "🌙 Cena Reconstituyente (8:45 PM)", alimento: "180g Pechuga de pollo al horno + Puré de calabaza con semillas tostadas", macros: `${Math.round(targetKcal * 0.16)} kcal • ${Math.round(proteinaGrs * 0.21)}g P / ${Math.round(carboGrs * 0.10)}g C / ${Math.round(grasaGrs * 0.25)}g G` }
    ];
  }

  const resContainer = document.getElementById('res-calc-tdee');
  if (resContainer) {
    resContainer.innerHTML = `
      <div style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-top:20px;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:14px; margin-bottom:18px;">
          <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:22px; font-weight:700; color:#fff;">${Math.round(tmb)} <span style="font-size:11px; color:var(--text-muted);">kcal</span></div>
            <div style="font-size:11px; color:var(--text-muted);">Metabolismo Basal (TMB)</div>
          </div>
          <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:22px; font-weight:700; color:#60a5fa;">${Math.round(tdee)} <span style="font-size:11px; color:var(--text-muted);">kcal</span></div>
            <div style="font-size:11px; color:var(--text-muted);">Mantenimiento (TDEE)</div>
          </div>
          <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--accent-green);">
            <div style="font-size:24px; font-weight:800; color:var(--accent-green);">${Math.round(targetKcal)} <span style="font-size:11px; color:var(--text-muted);">kcal/día</span></div>
            <div style="font-size:11px; color:var(--accent-green); font-weight:600;">Objetivo (${objetivo.toUpperCase()})</div>
          </div>
        </div>

        <div style="font-size:13px; color:#fff; font-weight:600; margin-bottom:8px;">🎯 Macronutrientes Diarios Prescritos:</div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:20px;">
          <div style="background:rgba(74, 222, 128, 0.1); padding:12px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(74, 222, 128, 0.3);">
            <div style="font-size:18px; font-weight:700; color:#4ade80;">${proteinaGrs}g</div>
            <div style="font-size:11px; color:var(--text-muted);">Proteína (2.2g/kg)</div>
          </div>
          <div style="background:rgba(96, 165, 250, 0.1); padding:12px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(96, 165, 250, 0.3);">
            <div style="font-size:18px; font-weight:700; color:#60a5fa;">${carboGrs}g</div>
            <div style="font-size:11px; color:var(--text-muted);">Carbohidratos</div>
          </div>
          <div style="background:rgba(251, 191, 36, 0.1); padding:12px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(251, 191, 36, 0.3);">
            <div style="font-size:18px; font-weight:700; color:#fbbf24;">${grasaGrs}g</div>
            <div style="font-size:11px; color:var(--text-muted);">Grasas Saludables</div>
          </div>
        </div>

        <!-- SECCIÓN DE RECOMENDACIÓN DE DIETA AUTOMÁTICA POR TIEMPOS DE COMIDA -->
        <div style="border-top:1px solid var(--border-color); padding-top:18px; margin-bottom:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <h4 style="color:var(--accent-green); font-size:16px; margin:0; font-family:var(--font-heading);">🥗 Recomendación de Dieta Automática (5 Comidas):</h4>
            <span class="badge badge-green">Para ${clienteNombre}</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
            ${menuComidas.map(c => `
              <div style="background:var(--bg-card); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="flex:2; min-width:220px;">
                  <strong style="color:var(--accent-green); font-size:13px;">${c.tiempo}</strong>
                  <div style="color:#fff; font-size:12px; margin-top:2px;">${c.alimento}</div>
                </div>
                <div style="text-align:right;">
                  <span class="badge badge-green" style="font-size:11px; padding:3px 8px;">${c.macros}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- BOTONES DE ACCIÓN: GUARDAR, ALTERNAR A DIETA MANUAL Y EXPORTAR -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; border-top:1px solid var(--border-color); padding-top:14px;">
          <button class="btn-primary" style="font-size:12px; flex:1.4; justify-content:center; background:#22c55e; border-color:#22c55e;" onclick="guardarDietaDesdeCalculadora('${clienteNombre}', ${Math.round(targetKcal)}, ${proteinaGrs}, ${carboGrs}, ${grasaGrs}, '${objetivo}')">
            💾 Guardar Dieta en el Perfil del Atleta
          </button>
          <button class="btn-secondary" style="font-size:12px; flex:1.1; justify-content:center; color:#38bdf8; border-color:#38bdf8;" onclick="alternarACreadorManual('${clienteNombre}', ${Math.round(targetKcal)}, ${proteinaGrs}, ${carboGrs}, ${grasaGrs}, '${objetivo}')">
            ✏️ Alternar a Dieta Manual
          </button>
          <button class="btn-secondary" style="font-size:12px; flex:0.6; justify-content:center;" onclick="imprimirPlan('${clienteNombre}', 'Plan Nutricional (${objetivo.toUpperCase()})', 'Desglose Diario de Macronutrientes y Menús')">
            🖨️ Imprimir PDF
          </button>
        </div>
      </div>
    `;
  }
}

// 2. Composición Corporal & % Grasa (U.S. Navy)
function ejecutarCalcularGrasa() {
  const peso = parseFloat(document.getElementById('calc-grasa-peso').value) || 78.5;
  const altura = parseFloat(document.getElementById('calc-grasa-altura').value) || 178;
  const cintura = parseFloat(document.getElementById('calc-grasa-cintura').value) || 82;
  const cuello = parseFloat(document.getElementById('calc-grasa-cuello').value) || 39;
  const cadera = parseFloat(document.getElementById('calc-grasa-cadera').value) || 98;
  const genero = document.getElementById('calc-grasa-genero').value;

  let pctGrasa = 0;
  if (genero === 'h') {
    pctGrasa = 495 / (1.0324 - 0.19077 * Math.log10(cintura - cuello) + 0.15456 * Math.log10(altura)) - 450;
  } else {
    pctGrasa = 495 / (1.29579 - 0.35004 * Math.log10(cintura + cadera - cuello) + 0.22100 * Math.log10(altura)) - 450;
  }

  if (isNaN(pctGrasa) || pctGrasa < 3) pctGrasa = 14.2;

  pctGrasa = parseFloat(pctGrasa.toFixed(1));
  const masaGrasa = parseFloat(((peso * pctGrasa) / 100).toFixed(1));
  const masaMagra = parseFloat((peso - masaGrasa).toFixed(1));

  let clasificacion = '🟢 Atleta / Definición Excelente';
  let badgeClass = 'badge-green';
  if (pctGrasa > 20) { clasificacion = '🟡 Rango Moderado'; badgeClass = 'badge-risk-med'; }
  if (pctGrasa > 26) { clasificacion = '🔴 Porcentaje Elevado'; badgeClass = 'badge-danger'; }

  const resContainer = document.getElementById('res-calc-grasa');
  if (resContainer) {
    resContainer.innerHTML = `
      <div style="background:var(--bg-surface); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div>
            <h4 style="margin:0; color:#60a5fa; font-size:16px;">Resultados de Composición Corporal</h4>
            <div style="font-size:12px; color:var(--text-muted);">Algoritmo U.S. Navy Perímetros & Pliegues</div>
          </div>
          <span class="badge ${badgeClass}">${clasificacion}</span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:14px; margin-bottom:16px;">
          <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-sm); text-align:center; border:1px solid #60a5fa;">
            <div style="font-size:24px; font-weight:800; color:#60a5fa;">${pctGrasa}%</div>
            <div style="font-size:11px; color:var(--text-muted);">Grasa Corporal Corporal</div>
          </div>
          <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:22px; font-weight:700; color:#4ade80;">${masaMagra} kg</div>
            <div style="font-size:11px; color:var(--text-muted);">Masa Magra (Muscular)</div>
          </div>
          <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:22px; font-weight:700; color:#fbbf24;">${masaGrasa} kg</div>
            <div style="font-size:11px; color:var(--text-muted);">Masa Adiposa (Grasa)</div>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span style="color:var(--text-muted);">Proporción Masa Magra vs Grasa</span>
            <span style="color:#4ade80; font-weight:700;">${((masaMagra / peso) * 100).toFixed(1)}% Magro</span>
          </div>
          <div class="gauge-track">
            <div class="gauge-fill" style="width:${((masaMagra / peso) * 100).toFixed(1)}%; background:var(--accent-green);"></div>
          </div>
        </div>

        <button class="btn-primary" style="font-size:12px; width:100%; justify-content:center; background:#3b82f6; border-color:#3b82f6;" onclick="sincronizarResultadoCliente('grasa', { pctGrasa: ${pctGrasa}, masaMagra: ${masaMagra}, masaGrasa: ${masaGrasa} })">
          💾 Guardar resultado en el expediente del cliente
        </button>
      </div>
    `;
  }
}

// 3. 1RM & Zonas de Carga
function ejecutarCalcular1RM() {
  const ejercicio = document.getElementById('calc-1rm-ejercicio').value || 'Sentadilla Libre';
  const carga = parseFloat(document.getElementById('calc-1rm-carga').value) || 100;
  const reps = parseInt(document.getElementById('calc-1rm-reps').value) || 5;

  // Brzycki & Epley
  const rmBrzycki = carga / (1.0278 - 0.0278 * reps);
  const rmEpley = carga * (1 + reps / 30);
  const rmPromedio = Math.round((rmBrzycki + rmEpley) / 2);

  const tablaZonas = [
    { pct: 100, reps: '1RM', kg: rmPromedio },
    { pct: 90, reps: '3-4 RM', kg: Math.round(rmPromedio * 0.90) },
    { pct: 85, reps: '5-6 RM', kg: Math.round(rmPromedio * 0.85) },
    { pct: 80, reps: '8-9 RM', kg: Math.round(rmPromedio * 0.80) },
    { pct: 75, reps: '10-11 RM', kg: Math.round(rmPromedio * 0.75) },
    { pct: 70, reps: '12-15 RM', kg: Math.round(rmPromedio * 0.70) }
  ];

  const resContainer = document.getElementById('res-calc-1rm');
  if (resContainer) {
    resContainer.innerHTML = `
      <div style="background:var(--bg-surface); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h4 style="margin:0; color:#fbbf24; font-size:16px;">1RM Estimado: ${ejercicio}</h4>
            <div style="font-size:12px; color:var(--text-muted);">Evaluación basada en ${carga}kg x ${reps} reps (Brzycki + Epley)</div>
          </div>
          <div style="font-size:26px; font-weight:800; color:#fbbf24;">${rmPromedio} <span style="font-size:13px; color:var(--text-muted);">kg</span></div>
        </div>

        <div style="font-size:13px; color:#fff; font-weight:600; margin-bottom:8px;">📊 Zonas de Cargas Máximas y Repeticiones Prescritas:</div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:16px;">
          ${tablaZonas.map(z => `
            <div style="background:var(--bg-card); padding:10px; border-radius:var(--radius-sm); text-align:center; border-left:3px solid #fbbf24;">
              <div style="font-size:16px; font-weight:700; color:#fff;">${z.kg} kg</div>
              <div style="font-size:11px; color:#fbbf24;">${z.pct}% (${z.reps})</div>
            </div>
          `).join('')}
        </div>

        <button class="btn-primary" style="font-size:12px; width:100%; justify-content:center; background:#f59e0b; border-color:#f59e0b;" onclick="sincronizarResultadoCliente('1rm', { ejercicio: '${ejercicio}', max1RM: ${rmPromedio} })">
          💾 Guardar resultado en el expediente del cliente
        </button>
      </div>
    `;
  }
}

// 4. Zonas Cardiacas Karvonen
function ejecutarCalcularCardio() {
  const edad = parseFloat(document.getElementById('calc-cardio-edad').value) || 28;
  const fcr = parseFloat(document.getElementById('calc-cardio-fcr').value) || 60;

  // Tanaka Formula: 208 - (0.7 * edad)
  const fcMax = Math.round(208 - (0.7 * edad));
  const fcReserva = fcMax - fcr;

  const zonas = [
    { z: 'Zona 1 (Recuperación)', pct: '50-60%', min: Math.round(fcr + fcReserva * 0.5), max: Math.round(fcr + fcReserva * 0.6), color: '#60a5fa' },
    { z: 'Zona 2 (Quema de Grasa / Base)', pct: '60-70%', min: Math.round(fcr + fcReserva * 0.6), max: Math.round(fcr + fcReserva * 0.7), color: '#4ade80' },
    { z: 'Zona 3 (Aeróbica / Umbral)', pct: '70-80%', min: Math.round(fcr + fcReserva * 0.7), max: Math.round(fcr + fcReserva * 0.8), color: '#fbbf24' },
    { z: 'Zona 4 (Anaeróbica / Lactato)', pct: '80-90%', min: Math.round(fcr + fcReserva * 0.8), max: Math.round(fcr + fcReserva * 0.9), color: '#f97316' },
    { z: 'Zona 5 (VO2 Máx / Potencia)', pct: '90-100%', min: Math.round(fcr + fcReserva * 0.9), max: fcMax, color: '#ef4444' }
  ];

  const resContainer = document.getElementById('res-calc-cardio');
  if (resContainer) {
    resContainer.innerHTML = `
      <div style="background:var(--bg-surface); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h4 style="margin:0; color:#ef4444; font-size:16px;">Zonas Cardíacas Karvonen / Tanaka</h4>
            <div style="font-size:12px; color:var(--text-muted);">FC Reposo: ${fcr} bpm • FC Reserva: ${fcReserva} bpm</div>
          </div>
          <div style="font-size:24px; font-weight:800; color:#ef4444;">${fcMax} <span style="font-size:12px; color:var(--text-muted);">bpm Máx</span></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
          ${zonas.map(z => `
            <div style="background:var(--bg-card); padding:10px 14px; border-radius:var(--radius-sm); border-left:4px solid ${z.color}; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:#fff; font-size:13px;">${z.z}</strong>
                <span style="font-size:11px; color:var(--text-muted); margin-left:6px;">(${z.pct})</span>
              </div>
              <div style="font-size:14px; font-weight:700; color:${z.color};">${z.min} - ${z.max} bpm</div>
            </div>
          `).join('')}
        </div>

        <button class="btn-primary" style="font-size:12px; width:100%; justify-content:center; background:#ef4444; border-color:#ef4444;" onclick="sincronizarResultadoCliente('cardio', { fcMax: ${fcMax}, z2Min: ${zonas[1].min}, z2Max: ${zonas[1].max} })">
          💾 Guardar resultado en el expediente del cliente
        </button>
      </div>
    `;
  }
}

// Synchronize Calculation Result to Athlete Profile
function sincronizarResultadoCliente(tipo, data) {
  const select = document.getElementById('calc-cliente-select');
  const clienteNombre = select ? select.value : '';

  if (!clienteNombre) {
    showToast("Por favor selecciona un atleta en el selector superior para sincronizar los cálculos.", "warning", "Selección Requerida");
    return;
  }

  const clienteObj = clientes.find(c => c.nombre === clienteNombre);
  if (!clienteObj) return;

  if (tipo === 'tdee') {
    guardarDietaDesdeCalculadora(clienteNombre, data.tdee, data.proteina, data.carbo, data.grasa, data.objetivo || 'Hipertrofia');
    return;
  } else if (tipo === 'grasa') {
    clienteObj.porcentajeGrasa = data.pctGrasa;
    clienteObj.porcentajeMusculo = parseFloat((100 - data.pctGrasa - 15).toFixed(1));
  } else if (tipo === '1rm') {
    if (!clienteObj.record1RM) clienteObj.record1RM = {};
    clienteObj.record1RM[data.ejercicio] = data.max1RM;
  } else if (tipo === 'cardio') {
    clienteObj.fcMax = data.fcMax;
    clienteObj.zonaQuemaGrasa = `${data.z2Min}-${data.z2Max} bpm`;
  }

  localStorage.setItem('fitpro_clientes', JSON.stringify(clientes));
  renderClientes();

  showToast(`Cálculos biomecánicos (${tipo.toUpperCase()}) sincronizados en el expediente de ${clienteNombre}.`, "success", "🧮 Datos Actualizados");
}

// ==========================================
// 🥗 Nutrition & Diet Management Module
// ==========================================

const alimentosBaseDB = [
  // Proteínas
  { categoria: 'proteina', nombre: 'Pechuga de Pollo', icono: '🍗', porcion: '100g cocida', kcal: 165, proteina: 31, carbo: 0, grasa: 3.6, tipo: 'Proteína Magra', desc: 'Fuente de alto valor biológico y perfil óptimo de aminoácidos esenciales.' },
  { categoria: 'proteina', nombre: 'Claras de Huevo', icono: '🥚', porcion: '100g (3 uds)', kcal: 52, proteina: 11, carbo: 0.7, grasa: 0.2, tipo: 'Proteína Pura', desc: '0% colesterol y máxima digestibilidad para ingestas frecuentes.' },
  { categoria: 'proteina', nombre: 'Salmón Salvaje', icono: '🐟', porcion: '100g fresco', kcal: 208, proteina: 20, carbo: 0, grasa: 13, tipo: 'Proteína + Omega-3', desc: 'Rico en EPA/DHA para control de inflamación articular y síntesis hormonal.' },
  { categoria: 'proteina', nombre: 'Atún al Natural', icono: '🥫', porcion: '100g escurrido', kcal: 116, proteina: 26, carbo: 0, grasa: 0.8, tipo: 'Proteína Magra', desc: 'Rápida disponibilidad y densidad proteica ideal para definición.' },
  { categoria: 'proteina', nombre: 'Whey Protein Isolate', icono: '🥤', porcion: '30g (1 scoop)', kcal: 115, proteina: 27, carbo: 1, grasa: 0.5, tipo: 'Aislado MPS', desc: 'Máxima concentración de leucina (~3g) para activación inmediata de mTOR.' },
  { categoria: 'proteina', nombre: 'Ternera Magra (Lomo)', icono: '🥩', porcion: '100g magra', kcal: 145, proteina: 24, carbo: 0, grasa: 5, tipo: 'Proteína + Hierro/Creatina', desc: 'Aporte natural de hierro hemo, zinc, vitamina B12 y creatina natural.' },

  // Carbohidratos
  { categoria: 'carbo', nombre: 'Avena en Hojuelas', icono: '🌾', porcion: '100g seca', kcal: 375, proteina: 13.5, carbo: 60, grasa: 7, tipo: 'Carbohidrato Complejo', desc: 'Rica en betaglucanos para energía sostenida y sensibilidad a la insulina.' },
  { categoria: 'carbo', nombre: 'Arroz Jazmín / Basmati', icono: '🍚', porcion: '100g cocido', kcal: 130, proteina: 2.8, carbo: 28, grasa: 0.4, tipo: 'Recarga Glucogénica', desc: 'Digestión limpia ideal para reposición rápida intra y post-entreno.' },
  { categoria: 'carbo', nombre: 'Boniato / Camote', icono: '🍠', porcion: '100g al horno', kcal: 90, proteina: 1.8, carbo: 21, grasa: 0.2, tipo: 'Bajo Índice Glucémico', desc: 'Antioxidantes naturales (betacarotenos) y liberación gradual de glucosa.' },
  { categoria: 'carbo', nombre: 'Patata Cocida con Piel', icono: '🥔', porcion: '100g cocida', kcal: 77, proteina: 2, carbo: 17, grasa: 0.1, tipo: 'Índice de Saciedad #1', desc: 'Máxima saciedad por caloría y alta concentración de potasio muscular.' },
  { categoria: 'carbo', nombre: 'Pan de Masa Madre', icono: '🍞', porcion: '100g artesanal', kcal: 245, proteina: 9, carbo: 48, grasa: 1.5, tipo: 'Fermentación Lenta', desc: 'Prebióticos naturales que facilitan la absorción y digestión entérica.' },
  { categoria: 'carbo', nombre: 'Frutos Rojos (Arándanos)', icono: '🫐', porcion: '100g frescos', kcal: 57, proteina: 0.7, carbo: 14, grasa: 0.3, tipo: 'Polifenoles & Fibra', desc: 'Reducción del estrés oxidativo y mejora del flujo sanguíneo muscular.' },

  // Grasas Saludables
  { categoria: 'grasa', nombre: 'Aceite de Oliva Virgen Extra', icono: '🫒', porcion: '15ml (1 cda)', kcal: 125, proteina: 0, carbo: 0, grasa: 14, tipo: 'Grasa Monoinsaturada', desc: 'Ácido oleico puro y antioxidantes para protección cardiovascular.' },
  { categoria: 'grasa', nombre: 'Aguacate Hass', icono: '🥑', porcion: '100g fresco', kcal: 160, proteina: 2, carbo: 8.5, grasa: 15, tipo: 'Lípidos Esenciales', desc: 'Potasio, magnesio y fibra para salud vascular y hormonal.' },
  { categoria: 'grasa', nombre: 'Almendras Crudas', icono: '🥜', porcion: '30g (~20 uds)', kcal: 172, proteina: 6, carbo: 6, grasa: 15, tipo: 'Vitamina E & Magnesio', desc: 'Snack denso en nutrientes que mitiga los picos de grelina.' },
  { categoria: 'grasa', nombre: 'Mantequilla de Maní 100%', icono: '🍯', porcion: '30g (1 cda colmada)', kcal: 188, proteina: 8, carbo: 6, grasa: 16, tipo: 'Densidad Calórica Limpia', desc: '100% cacahuete tostado sin azúcares añadidos ni aceites hidrogenados.' },
  { categoria: 'grasa', nombre: 'Nueces de California', icono: '🌰', porcion: '30g (~7 mitades)', kcal: 195, proteina: 4.5, carbo: 4, grasa: 19, tipo: 'Ácido Alfa-Linolénico', desc: 'Alta concentración de ALA vegetal para soporte neurocognitivo.' }
];

function renderDietas(filtro = '') {
  const grid = document.getElementById('nutrition-grid');
  const statActivas = document.getElementById('stat-dietas-activas');
  const statCalorias = document.getElementById('stat-calorias-promedio');

  const dietasGym = getDietasActivas();

  if (statActivas) statActivas.innerText = dietasGym.length;

  if (dietasGym.length > 0 && statCalorias) {
    const sumCal = dietasGym.reduce((acc, d) => acc + (d.tdee || 2400), 0);
    const avgCal = Math.round(sumCal / dietasGym.length);
    statCalorias.innerText = `${avgCal.toLocaleString()} kcal`;
  }

  renderAlimentosBase();

  if (!grid) return;

  const filtradas = dietasGym.filter(d => {
    const textoMatch = d.cliente.toLowerCase().includes(filtro.toLowerCase()) || 
                       d.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
                       d.objetivo.toLowerCase().includes(filtro.toLowerCase());
    return textoMatch;
  });

  if (filtradas.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted); background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border-color);">
        🥗 No se encontraron planes nutricionales asignados para este gimnasio.<br>
        <div style="display:flex; justify-content:center; gap:12px; margin-top:16px;">
          <button class="btn-primary" onclick="abrirModalDietaManual()">✏️ Crear Dieta Manual</button>
          <button class="btn-secondary" onclick="navegarA('calculator')">⚡ Calcular Dieta Automática</button>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtradas.map(d => {
    const mes = d.mesociclo || 1;
    const badgeObjetivo = d.objetivo.toLowerCase().includes('hipertrofia') ? 'badge-green' : d.objetivo.toLowerCase().includes('definic') ? 'badge-risk-med' : 'badge-green';

    return `
      <div class="client-card" style="display:flex; flex-direction:column; justify-content:space-between; border-top:3px solid var(--accent-green); background:var(--bg-card); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div>
              <strong style="font-size:17px; color:#fff; font-family:var(--font-heading);">${d.cliente}</strong>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${d.nombre}</div>
            </div>
            <span class="badge ${badgeObjetivo}">${d.objetivo}</span>
          </div>

          <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; margin-bottom:14px;">
            <div style="background:var(--bg-surface); padding:8px 4px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--border-color);">
              <div style="font-size:15px; font-weight:700; color:#fff;">${d.tdee}</div>
              <div style="font-size:10px; color:var(--text-muted);">kcal/día</div>
            </div>
            <div style="background:rgba(74, 222, 128, 0.1); padding:8px 4px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(74, 222, 128, 0.3);">
              <div style="font-size:15px; font-weight:700; color:#4ade80;">${d.proteina}g</div>
              <div style="font-size:10px; color:var(--text-muted);">Proteína</div>
            </div>
            <div style="background:rgba(96, 165, 250, 0.1); padding:8px 4px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(96, 165, 250, 0.3);">
              <div style="font-size:15px; font-weight:700; color:#60a5fa;">${d.carbo}g</div>
              <div style="font-size:10px; color:var(--text-muted);">Carbos</div>
            </div>
            <div style="background:rgba(251, 191, 36, 0.1); padding:8px 4px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(251, 191, 36, 0.3);">
              <div style="font-size:15px; font-weight:700; color:#fbbf24;">${d.grasa}g</div>
              <div style="font-size:10px; color:var(--text-muted);">Grasas</div>
            </div>
          </div>

          <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:14px;">
            <div style="font-size:12px; font-weight:700; color:var(--accent-green); margin-bottom:8px; display:flex; justify-content:space-between;">
              <span>🍲 Menú por Tiempos de Comida:</span>
              <span style="color:var(--text-muted); font-weight:normal;">${d.comidas ? d.comidas.length : 5} Ingestas</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:11px; line-height:1.4;">
              ${d.comidas && d.comidas.length > 0 ? d.comidas.map(c => `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                  <strong style="color:#fff; min-width:110px;">${c.tiempo.split('(')[0]}:</strong>
                  <span style="color:var(--text-muted); text-align:right; flex:1; margin-left:8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.alimento}">${c.alimento}</span>
                </div>
              `).join('') : `
                <div style="color:var(--text-muted);">• Desayuno, Almuerzo, Comida, Snacks y Cena prescritos.</div>
              `}
            </div>
          </div>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="font-size:11px; color:var(--accent-green); font-weight:600;">
            📅 Mesociclo ${mes}
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn-primary btn-ver-menu-completo" style="font-size:11px; padding:6px 12px; cursor:pointer;" data-cliente="${d.cliente}" data-dieta-id="${d.id}" onclick="abrirDetalleDieta('${d.cliente}')">👁️ Menú</button>
            <button class="btn-primary" style="font-size:11px; padding:6px 10px; background:rgba(56,189,248,0.15); color:#38bdf8; border-color:#38bdf8;" onclick="enviarDietaPorEmail(${d.id})" title="Enviar por Correo">📧 Correo</button>
            <button class="btn-secondary" style="font-size:11px; padding:6px 10px; color:#22c55e; border-color:#22c55e;" onclick="enviarDietaPorWhatsApp(${d.id})" title="Enviar por WhatsApp">📲 WhatsApp</button>
            <button class="btn-secondary" style="font-size:11px; padding:6px 10px; color:#38bdf8; border-color:#38bdf8;" onclick="generarPDFDieta(${d.id})" title="Descargar PDF">📄 PDF</button>
            <button class="btn-secondary danger" style="font-size:11px; padding:6px 8px;" onclick="eliminarDieta(${d.id})" title="Eliminar Dieta">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAlimentosBase(filtro = 'todos') {
  const container = document.getElementById('alimentos-base-grid');
  if (!container) return;

  const filtrados = alimentosBaseDB.filter(a => filtro === 'todos' || a.categoria === filtro);

  container.innerHTML = filtrados.map(a => {
    const colorPill = a.categoria === 'proteina' ? '#4ade80' : a.categoria === 'carbo' ? '#60a5fa' : '#fbbf24';
    const bgPill = a.categoria === 'proteina' ? 'rgba(74, 222, 128, 0.1)' : a.categoria === 'carbo' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(251, 191, 36, 0.1)';

    return `
      <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">${a.icono}</span>
              <div>
                <strong style="color:#fff; font-size:14px;">${a.nombre}</strong>
                <div style="font-size:11px; color:var(--text-muted);">${a.porcion}</div>
              </div>
            </div>
            <span style="background:${bgPill}; color:${colorPill}; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">${a.tipo}</span>
          </div>

          <p style="color:var(--text-muted); font-size:11px; line-height:1.4; margin:0 0 10px 0;">${a.desc}</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; background:var(--bg-surface); padding:8px 6px; border-radius:var(--radius-sm); text-align:center;">
          <div>
            <div style="font-size:12px; font-weight:700; color:#fff;">${a.kcal}</div>
            <div style="font-size:9px; color:var(--text-muted);">kcal</div>
          </div>
          <div>
            <div style="font-size:12px; font-weight:700; color:#4ade80;">${a.proteina}g</div>
            <div style="font-size:9px; color:var(--text-muted);">P</div>
          </div>
          <div>
            <div style="font-size:12px; font-weight:700; color:#60a5fa;">${a.carbo}g</div>
            <div style="font-size:9px; color:var(--text-muted);">C</div>
          </div>
          <div>
            <div style="font-size:12px; font-weight:700; color:#fbbf24;">${a.grasa}g</div>
            <div style="font-size:9px; color:var(--text-muted);">G</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filtrarAlimentosBase(categoria, btn) {
  document.querySelectorAll('#view-nutrition div div .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAlimentosBase(categoria);
}

function filtrarDietas(tipo, btn) {
  document.querySelectorAll('#view-nutrition > div > div > .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (tipo === 'todos') {
    renderDietas('');
  } else {
    renderDietas(tipo);
  }
}

function filtrarDietasTexto(texto) {
  renderDietas(texto);
}

function abrirModalDietaManual(clienteNombre = '') {
  const select = document.getElementById('dieta-cliente-select');
  if (select) {
    select.innerHTML = getClientesActivos().map(c => `<option value="${c.nombre}">${c.nombre} (${c.objetivo})</option>`).join('');
    if (clienteNombre) select.value = clienteNombre;
  }
  const m = document.getElementById('modal-dieta-manual');
  if (m) m.classList.remove('hidden');
}

function cerrarModalDietaManual() {
  const m = document.getElementById('modal-dieta-manual');
  if (m) m.classList.add('hidden');
}

function agregarFilaComidaManual() {
  const container = document.getElementById('manual-comidas-container');
  if (!container) return;

  const count = container.querySelectorAll('.fila-comida-manual').length + 1;
  const div = document.createElement('div');
  div.className = 'fila-comida-manual';
  div.style.cssText = 'display:flex; gap:10px; align-items:center; background:var(--bg-card); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);';
  div.innerHTML = `
    <input type="text" class="input-field input-comida-tiempo" placeholder="Tiempo (ej: Comida #${count})" style="flex:1.2;" value="Comida #${count}">
    <input type="text" class="input-field input-comida-alimento" placeholder="Alimentos & Gramaje" style="flex:2.5;">
    <input type="text" class="input-field input-comida-macros" placeholder="Macros / Kcal" style="flex:1.8;">
    <button style="background:transparent; border:none; color:var(--danger); font-size:18px; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(div);
}

function guardarDietaManual() {
  const clienteSelect = document.getElementById('dieta-cliente-select');
  const clienteNombre = sanitizeText(clienteSelect ? clienteSelect.value : "Atleta Pro", 80);
  const nombrePlan = sanitizeText(document.getElementById('dieta-nombre')?.value || "Plan Nutricional Personalizado", 100);
  const objetivo = sanitizeText(document.getElementById('dieta-objetivo')?.value || "Hipertrofia", 50);
  const kcal = sanitizeNumber(document.getElementById('dieta-kcal')?.value, 2400, 800, 8000);
  const proteina = sanitizeNumber(document.getElementById('dieta-proteina')?.value, 160, 20, 500);
  const carbo = sanitizeNumber(document.getElementById('dieta-carbo')?.value, 260, 10, 1000);
  const grasa = sanitizeNumber(document.getElementById('dieta-grasa')?.value, 65, 10, 300);

  const filas = document.querySelectorAll('.fila-comida-manual');
  const comidas = [];

  filas.forEach(f => {
    const tiempo = sanitizeText(f.querySelector('.input-comida-tiempo')?.value || "Comida", 60);
    const alimento = sanitizeText(f.querySelector('.input-comida-alimento')?.value, 250);
    const macros = sanitizeText(f.querySelector('.input-comida-macros')?.value, 120);

    if (alimento) {
      comidas.push({ tiempo, alimento, macros });
    }
  });

  if (comidas.length === 0) {
    showToast("Por favor añade al menos un tiempo de comida con sus alimentos.", "warning", "Datos Incompletos");
    return;
  }

  const userId = getUsuarioActualId() || 'demo_coach';
  const nuevaDieta = {
    id: Date.now(),
    user_id: userId,
    gym_id: gimnasioActivoId,
    cliente: clienteNombre,
    nombre: `✏️ ${nombrePlan}`,
    objetivo,
    mesociclo: 1,
    fecha: new Date().toISOString().split('T')[0],
    tdee: kcal,
    proteina,
    carbo,
    grasa,
    comidas
  };

  dietasGuardadas.unshift(nuevaDieta);
  persistirDatosUsuarioActual();

  // Sync to Supabase Cloud dietas table
  if (supabaseClient && userId && !sesionUsuarioActual?.esModoDemo) {
    supabaseClient.from('dietas').upsert({
      id: nuevaDieta.id,
      user_id: userId,
      gym_id: gimnasioActivoId,
      cliente: clienteNombre,
      nombre: nuevaDieta.nombre,
      objetivo,
      tdee: kcal,
      macros: { proteina, carbo, grasa },
      comidas,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.warn("Supabase dietas sync error:", error.message);
    });
  }

  cerrarModalDietaManual();
  renderDietas();
  showToast(`Plan nutricional guardado exitosamente para ${clienteNombre}.`, "success", "🥗 Dieta Guardada");
}

function generarPropuestaDietaAutomatica(clienteNombre, tdee, proteina, carbo, grasa, objetivo) {
  if (!clienteNombre || clienteNombre === "Atleta Pro" || clienteNombre === "") {
    const sel = document.getElementById('calc-cliente-select');
    if (sel && sel.value) clienteNombre = sel.value;
    else clienteNombre = "Atleta Pro";
  }

  let menuComidas = [];
  if (objetivo === 'hipertrofia' || (objetivo && objetivo.toLowerCase().includes('hipertrofia'))) {
    menuComidas = [
      { tiempo: "🌅 Desayuno Energético (7:30 AM)", alimento: "100g Avena en hojuelas + 4 Huevos enteros revueltos + 1 Plátano maduro + 20g Mantequilla de maní", macros: `${Math.round(tdee * 0.25)} kcal • ${Math.round(proteina * 0.25)}g P / ${Math.round(carbo * 0.30)}g C / ${Math.round(grasa * 0.25)}g G` },
      { tiempo: "🥪 Almuerzo / Media Mañana (10:30 AM)", alimento: "1 Bagel o 2 rebanadas pan integral + 120g Pechuga de pavo braseada + 1/2 Aguacate en rodajas", macros: `${Math.round(tdee * 0.18)} kcal • ${Math.round(proteina * 0.20)}g P / ${Math.round(carbo * 0.18)}g C / ${Math.round(grasa * 0.20)}g G` },
      { tiempo: "🍲 Comida Principal Anabólica (2:00 PM)", alimento: "200g Pechuga de pollo a la plancha / Ternera magra + 250g Arroz jazmín cocido + Ensalada verde con 1 cda AOVE", macros: `${Math.round(tdee * 0.30)} kcal • ${Math.round(proteina * 0.30)}g P / ${Math.round(carbo * 0.32)}g C / ${Math.round(grasa * 0.25)}g G` },
      { tiempo: "🍌 Merienda Pre/Post-Entreno (5:30 PM)", alimento: "1 Scoop Whey Protein Isolate + 40g Harina de avena / Tortas de arroz inflado con miel", macros: `${Math.round(tdee * 0.15)} kcal • ${Math.round(proteina * 0.15)}g P / ${Math.round(carbo * 0.15)}g C / 5g G` },
      { tiempo: "🌙 Cena de Recuperación Tisular (8:30 PM)", alimento: "200g Filete de salmón / Merluza fresca + 200g Boniato al horno + Espárragos verdes salteados", macros: `${Math.round(tdee * 0.12)} kcal • ${Math.round(proteina * 0.10)}g P / ${Math.round(carbo * 0.05)}g C / ${Math.round(grasa * 0.25)}g G` }
    ];
  } else if (objetivo === 'definicion' || (objetivo && objetivo.toLowerCase().includes('definición')) || (objetivo && objetivo.toLowerCase().includes('definicion'))) {
    menuComidas = [
      { tiempo: "🌅 Desayuno Proteico (8:00 AM)", alimento: "4 Claras de huevo + 1 Huevo entero + 50g Copos de avena cocidos con canela + 80g Frutos rojos", macros: `${Math.round(tdee * 0.24)} kcal • ${Math.round(proteina * 0.25)}g P / ${Math.round(carbo * 0.25)}g C / ${Math.round(grasa * 0.20)}g G` },
      { tiempo: "🥗 Media Mañana Saciante (11:00 AM)", alimento: "150g Yogur Griego natural 0% + 15g Nueces troceadas + Semillas de chía hidratadas", macros: `${Math.round(tdee * 0.16)} kcal • ${Math.round(proteina * 0.18)}g P / ${Math.round(carbo * 0.10)}g C / ${Math.round(grasa * 0.22)}g G` },
      { tiempo: "🍲 Comida Principal Baja en Grasa (2:30 PM)", alimento: "180g Pechuga de pollo o lomo de atún + 150g Patata cocida con piel + Brócoli y calabacín al vapor", macros: `${Math.round(tdee * 0.32)} kcal • ${Math.round(proteina * 0.32)}g P / ${Math.round(carbo * 0.40)}g C / ${Math.round(grasa * 0.20)}g G` },
      { tiempo: "🍌 Merienda Rápida Pre-Entreno (5:30 PM)", alimento: "1 Manzana verde en láminas + 1 Scoop Proteína de suero en agua fría", macros: `${Math.round(tdee * 0.14)} kcal • ${Math.round(proteina * 0.15)}g P / ${Math.round(carbo * 0.15)}g C / 3g G` },
      { tiempo: "🌙 Cena Ligera de Alta Digestión (9:00 PM)", alimento: "160g Solomillo de pavo / Merluza al horno + Ensalada de espinacas baby con 1 cda de aceite de oliva virgen", macros: `${Math.round(tdee * 0.14)} kcal • ${Math.round(proteina * 0.10)}g P / ${Math.round(carbo * 0.10)}g C / ${Math.round(grasa * 0.35)}g G` }
    ];
  } else {
    menuComidas = [
      { tiempo: "🌅 Desayuno Equilibrado (8:00 AM)", alimento: "2 Tostadas de pan de masa madre + 2 Huevos poché + 60g Salmón ahumado + Rodajas de tomate", macros: `${Math.round(tdee * 0.25)} kcal • ${Math.round(proteina * 0.25)}g P / ${Math.round(carbo * 0.25)}g C / ${Math.round(grasa * 0.25)}g G` },
      { tiempo: "🥪 Media Mañana Recomp (11:00 AM)", alimento: "1 Manzana + 30g Proteína vegetal o suero + 15g Almendras crudas", macros: `${Math.round(tdee * 0.15)} kcal • ${Math.round(proteina * 0.18)}g P / ${Math.round(carbo * 0.15)}g C / ${Math.round(grasa * 0.15)}g G` },
      { tiempo: "🍲 Comida Principal (2:00 PM)", alimento: "180g Ternera magra a la parrilla + 200g Arroz integral / Quinoa + Pimientos y espárragos", macros: `${Math.round(tdee * 0.32)} kcal • ${Math.round(proteina * 0.32)}g P / ${Math.round(carbo * 0.35)}g C / ${Math.round(grasa * 0.25)}g G` },
      { tiempo: "🍌 Snack Pre-Entreno (5:30 PM)", alimento: "1 Plátano mediano + 1 Café solo con canela + 10g Chocolate negro 85%", macros: `${Math.round(tdee * 0.12)} kcal • 4g P / ${Math.round(carbo * 0.15)}g C / ${Math.round(grasa * 0.10)}g G` },
      { tiempo: "🌙 Cena Reconstituyente (8:45 PM)", alimento: "180g Pechuga de pollo al horno + Puré de calabaza con semillas de calabaza tostadas", macros: `${Math.round(tdee * 0.16)} kcal • ${Math.round(proteina * 0.21)}g P / ${Math.round(carbo * 0.10)}g C / ${Math.round(grasa * 0.25)}g G` }
    ];
  }

  const modalTitulo = document.getElementById('modal-dieta-titulo');
  const modalBody = document.getElementById('modal-dieta-body');

  if (modalTitulo) modalTitulo.innerText = `🥗 Propuesta de Menú Científico (5 Comidas): ${clienteNombre}`;

  if (modalBody) {
    modalBody.innerHTML = `
      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="font-size:20px; color:var(--accent-green); margin:0; font-family:var(--font-heading);">Plan Nutricional Prescrito: ${objetivo.toUpperCase()}</h3>
          <span class="badge badge-green">${Math.round(tdee)} kcal / día</span>
        </div>
        <div style="font-size:13px; color:var(--text-muted);">
          Atleta: <strong style="color:#fff;">${clienteNombre}</strong> • Proteína: <strong style="color:#4ade80;">${proteina}g</strong> • Carbohidratos: <strong style="color:#60a5fa;">${carbo}g</strong> • Grasas: <strong style="color:#fbbf24;">${grasa}g</strong>
        </div>
      </div>

      <div style="font-size:14px; color:#fff; font-weight:600; margin-bottom:12px;">🍲 Desglose de Comidas Diarias & Timing de Nutrientes:</div>
      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:24px;">
        ${menuComidas.map(c => `
          <div style="background:var(--bg-surface); padding:14px 16px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="flex:2; min-width:240px;">
              <strong style="color:var(--accent-green); font-size:14px;">${c.tiempo}</strong>
              <div style="color:#fff; font-size:13px; margin-top:3px;">${c.alimento}</div>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-green" style="font-size:11px; padding:4px 10px;">${c.macros}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--border-color); padding-top:16px; flex-wrap:wrap;">
        <button class="btn-secondary" onclick="cerrarDetalleDieta()">Cerrar</button>
        <button class="btn-primary" style="background:#38bdf8; border-color:#38bdf8; color:#000; font-weight:700;" onclick="enviarDietaPorEmail({ cliente: '${clienteNombre}', objetivo: '${objetivo}', tdee: ${Math.round(tdee)}, proteina: ${proteina}, carbo: ${carbo}, grasa: ${grasa}, comidas: ${JSON.stringify(menuComidas).replace(/"/g, '&quot;')} })">📧 Enviar Dieta por Correo (PDF)</button>
        <button class="btn-secondary" style="color:#22c55e; border-color:#22c55e;" onclick="enviarDietaPorWhatsApp({ cliente: '${clienteNombre}', objetivo: '${objetivo}', tdee: ${Math.round(tdee)}, proteina: ${proteina}, carbo: ${carbo}, grasa: ${grasa}, comidas: ${JSON.stringify(menuComidas).replace(/"/g, '&quot;')} })">📲 WhatsApp</button>
        <button class="btn-secondary" style="color:#a78bfa; border-color:#a78bfa;" onclick="generarPDFDieta({ cliente: '${clienteNombre}', objetivo: '${objetivo}', tdee: ${Math.round(tdee)}, proteina: ${proteina}, carbo: ${carbo}, grasa: ${grasa}, comidas: ${JSON.stringify(menuComidas).replace(/"/g, '&quot;')} })">📄 PDF</button>
        <button class="btn-primary" onclick="guardarPropuestaDietaAutomaticaDirecta('${clienteNombre}', '${objetivo}', ${Math.round(tdee)}, ${proteina}, ${carbo}, ${grasa})">💾 Guardar Dieta</button>
      </div>
    `;
  }

  const m = document.getElementById('modal-dieta-resultado');
  if (m) m.classList.remove('hidden');
}

function guardarPropuestaDietaAutomaticaDirecta(clienteNombre, objetivo, tdee, proteina, carbo, grasa) {
  let menuComidas = [];
  if (objetivo === 'hipertrofia' || (objetivo && objetivo.toLowerCase().includes('hipertrofia'))) {
    menuComidas = [
      { tiempo: "🌅 Desayuno Energético (7:30 AM)", alimento: "100g Avena en hojuelas + 4 Huevos enteros revueltos + 1 Plátano maduro + 20g Mantequilla de maní", macros: `${Math.round(tdee * 0.25)} kcal • ${Math.round(proteina * 0.25)}g P / ${Math.round(carbo * 0.30)}g C / ${Math.round(grasa * 0.25)}g G` },
      { tiempo: "🥪 Almuerzo / Media Mañana (10:30 AM)", alimento: "1 Bagel o 2 rebanadas pan integral + 120g Pechuga de pavo braseada + 1/2 Aguacate en rodajas", macros: `${Math.round(tdee * 0.18)} kcal • ${Math.round(proteina * 0.20)}g P / ${Math.round(carbo * 0.18)}g C / ${Math.round(grasa * 0.20)}g G` },
      { tiempo: "🍲 Comida Principal Anabólica (2:00 PM)", alimento: "200g Pechuga de pollo a la plancha / Ternera magra + 250g Arroz jazmín cocido + Ensalada verde con 1 cda AOVE", macros: `${Math.round(tdee * 0.30)} kcal • ${Math.round(proteina * 0.30)}g P / ${Math.round(carbo * 0.32)}g C / ${Math.round(grasa * 0.25)}g G` },
      { tiempo: "🍌 Merienda Pre/Post-Entreno (5:30 PM)", alimento: "1 Scoop Whey Protein Isolate + 40g Harina de avena / Tortas de arroz inflado con miel", macros: `${Math.round(tdee * 0.15)} kcal • ${Math.round(proteina * 0.15)}g P / ${Math.round(carbo * 0.15)}g C / 5g G` },
      { tiempo: "🌙 Cena de Recuperación Tisular (8:30 PM)", alimento: "200g Filete de salmón / Merluza fresca + 200g Boniato al horno + Espárragos verdes salteados", macros: `${Math.round(tdee * 0.12)} kcal • ${Math.round(proteina * 0.10)}g P / ${Math.round(carbo * 0.05)}g C / ${Math.round(grasa * 0.25)}g G` }
    ];
  } else if (objetivo === 'definicion' || (objetivo && objetivo.toLowerCase().includes('definición')) || (objetivo && objetivo.toLowerCase().includes('definicion'))) {
    menuComidas = [
      { tiempo: "🌅 Desayuno Proteico (8:00 AM)", alimento: "4 Claras de huevo + 1 Huevo entero + 50g Copos de avena cocidos con canela + 80g Frutos rojos", macros: `${Math.round(tdee * 0.24)} kcal • ${Math.round(proteina * 0.25)}g P / ${Math.round(carbo * 0.25)}g C / ${Math.round(grasa * 0.20)}g G` },
      { tiempo: "🥗 Media Mañana Saciante (11:00 AM)", alimento: "150g Yogur Griego natural 0% + 15g Nueces troceadas + Semillas de chía hidratadas", macros: `${Math.round(tdee * 0.16)} kcal • ${Math.round(proteina * 0.18)}g P / ${Math.round(carbo * 0.10)}g C / ${Math.round(grasa * 0.22)}g G` },
      { tiempo: "🍲 Comida Principal Baja en Grasa (2:30 PM)", alimento: "180g Pechuga de pollo o lomo de atún + 150g Patata cocida con piel + Brócoli y calabacín al vapor", macros: `${Math.round(tdee * 0.32)} kcal • ${Math.round(proteina * 0.32)}g P / ${Math.round(carbo * 0.40)}g C / ${Math.round(grasa * 0.20)}g G` },
      { tiempo: "🍌 Merienda Rápida Pre-Entreno (5:30 PM)", alimento: "1 Manzana verde en láminas + 1 Scoop Proteína de suero en agua fría", macros: `${Math.round(tdee * 0.14)} kcal • ${Math.round(proteina * 0.15)}g P / ${Math.round(carbo * 0.15)}g C / 3g G` },
      { tiempo: "🌙 Cena Ligera de Alta Digestión (9:00 PM)", alimento: "160g Solomillo de pavo / Merluza al horno + Ensalada de espinacas baby con 1 cda de aceite de oliva virgen", macros: `${Math.round(tdee * 0.14)} kcal • ${Math.round(proteina * 0.10)}g P / ${Math.round(carbo * 0.10)}g C / ${Math.round(grasa * 0.35)}g G` }
    ];
  } else {
    menuComidas = [
      { tiempo: "🌅 Desayuno Equilibrado (8:00 AM)", alimento: "2 Tostadas de pan de masa madre + 2 Huevos poché + 60g Salmón ahumado + Rodajas de tomate", macros: `${Math.round(tdee * 0.25)} kcal • ${Math.round(proteina * 0.25)}g P / ${Math.round(carbo * 0.25)}g C / ${Math.round(grasa * 0.25)}g G` },
      { tiempo: "🥪 Media Mañana Recomp (11:00 AM)", alimento: "1 Manzana + 30g Proteína vegetal o suero + 15g Almendras crudas", macros: `${Math.round(tdee * 0.15)} kcal • ${Math.round(proteina * 0.18)}g P / ${Math.round(carbo * 0.15)}g C / ${Math.round(grasa * 0.15)}g G` },
      { tiempo: "🍲 Comida Principal (2:00 PM)", alimento: "180g Ternera magra a la parrilla + 200g Arroz integral / Quinoa + Pimientos y espárragos", macros: `${Math.round(tdee * 0.32)} kcal • ${Math.round(proteina * 0.32)}g P / ${Math.round(carbo * 0.35)}g C / ${Math.round(grasa * 0.25)}g G` },
      { tiempo: "🍌 Snack Pre-Entreno (5:30 PM)", alimento: "1 Plátano mediano + 1 Café solo con canela + 10g Chocolate negro 85%", macros: `${Math.round(tdee * 0.12)} kcal • 4g P / ${Math.round(carbo * 0.15)}g C / ${Math.round(grasa * 0.10)}g G` },
      { tiempo: "🌙 Cena Reconstituyente (8:45 PM)", alimento: "180g Pechuga de pollo al horno + Puré de calabaza con semillas de calabaza tostadas", macros: `${Math.round(tdee * 0.16)} kcal • ${Math.round(proteina * 0.21)}g P / ${Math.round(carbo * 0.10)}g C / ${Math.round(grasa * 0.25)}g G` }
    ];
  }

  const userId = getUsuarioActualId() || 'demo_coach';
  const nuevaDieta = {
    id: Date.now(),
    user_id: userId,
    gym_id: gimnasioActivoId,
    cliente: clienteNombre,
    nombre: `⚡ Plan Nutricional Automático (Mifflin-St Jeor)`,
    objetivo,
    mesociclo: 1,
    fecha: new Date().toISOString().split('T')[0],
    tdee,
    proteina,
    carbo,
    grasa,
    comidas: menuComidas
  };

  dietasGuardadas.unshift(nuevaDieta);
  persistirDatosUsuarioActual();
  sincronizarDietaConSupabase(nuevaDieta);

  cerrarDetalleDieta();
  renderDietas();
  navegarA('nutrition');

  showToast(`Propuesta de Dieta Automática (5 Comidas) guardada para ${clienteNombre}.`, "success", "⚡ Dieta Prescrita");
}

function abrirDetalleDieta(idODueno) {
  let dieta = dietasGuardadas.find(d => d.id === idODueno || d.id == idODueno || (d.cliente && d.cliente.toLowerCase() === String(idODueno).toLowerCase()));
  
  if (!dieta) {
    const cli = clientes.find(c => c.id === idODueno || c.id == idODueno || (c.nombre && c.nombre.toLowerCase() === String(idODueno).toLowerCase()));
    if (cli) {
      const peso = cli.peso || 75;
      const altura = cli.altura || 178;
      const edad = cli.edad || 28;
      const sexo = cli.sexo || 'm';
      const bmr = (10 * peso) + (6.25 * altura) - (5 * edad) + (sexo === 'm' ? 5 : -161);
      const tdee = Math.round(bmr * 1.55);
      const proteina = Math.round(peso * 2.2);
      const grasa = Math.round(peso * 0.9);
      const carbo = Math.round((tdee - (proteina * 4) - (grasa * 9)) / 4);
      
      guardarDietaDesdeCalculadora(cli.nombre, tdee, proteina, carbo, grasa, cli.objetivo || 'Hipertrofia');
      dieta = dietasGuardadas.find(d => d.cliente.toLowerCase() === cli.nombre.toLowerCase());
    }
  }

  if (!dieta && dietasGuardadas.length > 0) {
    dieta = dietasGuardadas[0];
  }

  if (!dieta) return;

  const modalTitulo = document.getElementById('modal-dieta-titulo');
  const modalBody = document.getElementById('modal-dieta-body');

  if (modalTitulo) modalTitulo.innerText = `🥗 Expediente Nutricional: ${dieta.cliente}`;

  const mesActual = dieta.mesociclo || 1;
  const objLower = dieta.objetivo.toLowerCase();
  const badgeObjetivo = objLower.includes('hipertrofia') ? 'badge-green' : objLower.includes('definic') ? 'badge-risk-med' : 'badge-green';

  const comidasBase = dieta.comidas || [
    { tiempo: "🌅 Desayuno Energético (7:30 AM)", alimento: "100g Avena en hojuelas + 4 Huevos enteros revueltos + 1 Plátano maduro + 20g Mantequilla de maní", macros: `${Math.round(dieta.tdee * 0.25)} kcal • ${Math.round(dieta.proteina * 0.25)}g P / ${Math.round(dieta.carbo * 0.30)}g C / ${Math.round(dieta.grasa * 0.25)}g G` },
    { tiempo: "🥪 Media Mañana Saciante (10:30 AM)", alimento: "1 Bagel integral + 120g Pechuga de pavo braseada + 1/2 Aguacate en rodajas", macros: `${Math.round(dieta.tdee * 0.18)} kcal • ${Math.round(dieta.proteina * 0.20)}g P / ${Math.round(dieta.carbo * 0.18)}g C / ${Math.round(dieta.grasa * 0.20)}g G` },
    { tiempo: "🍲 Comida Principal Anabólica (2:00 PM)", alimento: "200g Pechuga de pollo a la plancha + 250g Arroz jazmín cocido + Ensalada verde con 1 cda AOVE", macros: `${Math.round(dieta.tdee * 0.30)} kcal • ${Math.round(dieta.proteina * 0.30)}g P / ${Math.round(dieta.carbo * 0.32)}g C / ${Math.round(dieta.grasa * 0.25)}g G` },
    { tiempo: "🍌 Pre/Post-Entreno (5:30 PM)", alimento: "1 Scoop Whey Protein Isolate + 40g Harina de arroz / Tortas de arroz inflado con miel", macros: `${Math.round(dieta.tdee * 0.15)} kcal • ${Math.round(dieta.proteina * 0.15)}g P / ${Math.round(dieta.carbo * 0.15)}g C / 5g G` },
    { tiempo: "🌙 Cena de Recuperación (8:30 PM)", alimento: "200g Filete de salmón salvaje + 200g Boniato al horno + Espárragos verdes salteados", macros: `${Math.round(dieta.tdee * 0.12)} kcal • ${Math.round(dieta.proteina * 0.10)}g P / ${Math.round(dieta.carbo * 0.05)}g C / ${Math.round(dieta.grasa * 0.25)}g G` }
  ];

  // Build Detailed History of Mesocycles for this client with full nutritional menus
  const historialCiclos = [
    {
      mes: 1,
      fase: "Fase 1: Base Metabólica & Calibración",
      fecha: "Mes Anterior (1-30 días)",
      tdee: dieta.tdee,
      proteina: dieta.proteina,
      carbo: dieta.carbo,
      grasa: dieta.grasa,
      estrategia: "Calibración inicial de tasa metabólica basal (Mifflin-St Jeor) y balance de nitrógeno positivo.",
      estado: mesActual >= 1 ? (mesActual === 1 ? 'Activo (En Curso)' : 'Completado (Histórico)') : 'Programado',
      comidas: comidasBase
    },
    {
      mes: 2,
      fase: "Fase 2: Modulación Metabólica (+8% Carbos)",
      fecha: "Mesociclo 2 (31-60 días)",
      tdee: Math.round(dieta.tdee * 1.05),
      proteina: dieta.proteina,
      carbo: Math.round(dieta.carbo * 1.08),
      grasa: dieta.grasa,
      estrategia: "Aumento selectivo de carbohidratos peri-entreno para reactivar la leptina, tiroides (T3) y evitar la adaptación metabólica.",
      estado: mesActual >= 2 ? (mesActual === 2 ? 'Activo (En Curso)' : 'Completado (Histórico)') : 'Planificado',
      comidas: [
        { tiempo: "🌅 Desayuno Modulado (7:30 AM)", alimento: "110g Avena integral + 4 Huevos poché + 1 Plátano grande + 25g Mantequilla de maní 100%", macros: `${Math.round(dieta.tdee * 1.05 * 0.26)} kcal • ${Math.round(dieta.proteina * 0.25)}g P / ${Math.round(dieta.carbo * 1.08 * 0.30)}g C / ${Math.round(dieta.grasa * 0.26)}g G` },
        { tiempo: "🥪 Media Mañana Energética (10:30 AM)", alimento: "2 Rebanadas Pan masa madre + 130g Solomillo de pavo + 1/2 Aguacate Hass", macros: `${Math.round(dieta.tdee * 1.05 * 0.18)} kcal • ${Math.round(dieta.proteina * 0.20)}g P / ${Math.round(dieta.carbo * 1.08 * 0.18)}g C / ${Math.round(dieta.grasa * 0.20)}g G` },
        { tiempo: "🍲 Comida Principal Anabólica (2:00 PM)", alimento: "220g Pechuga de pollo / Ternera blanca + 280g Arroz Basmati cocido + Brócoli salteado con AOVE", macros: `${Math.round(dieta.tdee * 1.05 * 0.31)} kcal • ${Math.round(dieta.proteina * 0.30)}g P / ${Math.round(dieta.carbo * 1.08 * 0.32)}g C / ${Math.round(dieta.grasa * 0.24)}g G` },
        { tiempo: "🍌 Carga Peri-Entreno Reactiva (5:30 PM)", alimento: "1 Scoop Whey Isolate + 50g Harina de avena instantánea + 20g Miel pura", macros: `${Math.round(dieta.tdee * 1.05 * 0.15)} kcal • ${Math.round(dieta.proteina * 0.15)}g P / ${Math.round(dieta.carbo * 1.08 * 0.16)}g C / 4g G` },
        { tiempo: "🌙 Cena Reconstituyente (8:45 PM)", alimento: "200g Lomo de salmón / Lubina fresca + 220g Patata cocida con piel + Espárragos verdes", macros: `${Math.round(dieta.tdee * 1.05 * 0.10)} kcal • ${Math.round(dieta.proteina * 0.10)}g P / ${Math.round(dieta.carbo * 1.08 * 0.04)}g C / ${Math.round(dieta.grasa * 0.26)}g G` }
      ]
    },
    {
      mes: 3,
      fase: "Fase 3: Ciclado de Carbohidratos & Recomposición",
      fecha: "Mesociclo 3 (61-90 días)",
      tdee: Math.round(dieta.tdee * 0.96),
      proteina: Math.round(dieta.proteina * 1.05),
      carbo: Math.round(dieta.carbo * 0.92),
      grasa: Math.round(dieta.grasa * 1.05),
      estrategia: "Rotación de días altos y bajos en carbohidratos para potenciar la flexibilidad metabólica, sensibilización a la insulina y lipólisis.",
      estado: mesActual >= 3 ? (mesActual === 3 ? 'Activo (En Curso)' : 'Completado (Histórico)') : 'Planificado',
      comidas: [
        { tiempo: "🌅 Desayuno Proteico Denso (8:00 AM)", alimento: "5 Claras de huevo + 2 Huevos enteros + 60g Copos de avena + 100g Arándanos frescos", macros: `${Math.round(dieta.tdee * 0.96 * 0.25)} kcal • ${Math.round(dieta.proteina * 1.05 * 0.26)}g P / ${Math.round(dieta.carbo * 0.92 * 0.24)}g C / ${Math.round(dieta.grasa * 1.05 * 0.22)}g G` },
        { tiempo: "🥪 Media Mañana Saciante (11:00 AM)", alimento: "180g Yogur Griego 0% + 20g Nueces de California + Semillas de chía hidratadas", macros: `${Math.round(dieta.tdee * 0.96 * 0.17)} kcal • ${Math.round(dieta.proteina * 1.05 * 0.19)}g P / ${Math.round(dieta.carbo * 0.92 * 0.12)}g C / ${Math.round(dieta.grasa * 1.05 * 0.24)}g G` },
        { tiempo: "🍲 Comida Principal Recomp (2:00 PM)", alimento: "200g Ternera magra / Pechuga de pavo + 180g Quinoa o Arroz integral + Pimientos asados", macros: `${Math.round(dieta.tdee * 0.96 * 0.32)} kcal • ${Math.round(dieta.proteina * 1.05 * 0.32)}g P / ${Math.round(dieta.carbo * 0.92 * 0.36)}g C / ${Math.round(dieta.grasa * 1.05 * 0.24)}g G` },
        { tiempo: "🍌 Peri-Entreno Aislado (5:30 PM)", alimento: "1 Manzana verde en láminas + 1 Scoop Isolate 90% en agua fría + 10g Almendras", macros: `${Math.round(dieta.tdee * 0.96 * 0.13)} kcal • ${Math.round(dieta.proteina * 1.05 * 0.13)}g P / ${Math.round(dieta.carbo * 0.92 * 0.18)}g C / 6g G` },
        { tiempo: "🌙 Cena Anti-Catabólica (9:00 PM)", alimento: "180g Merluza de pincho / Pechuga de pollo + Ensalada verde grande con 1.5 cda AOVE", macros: `${Math.round(dieta.tdee * 0.96 * 0.13)} kcal • ${Math.round(dieta.proteina * 1.05 * 0.10)}g P / ${Math.round(dieta.carbo * 0.92 * 0.10)}g C / ${Math.round(dieta.grasa * 1.05 * 0.30)}g G` }
      ]
    }
  ];

  if (modalBody) {
    modalBody.innerHTML = `
      <!-- SUB-TAB NAVIGATION -->
      <div class="modal-tab-nav" style="margin-bottom:20px;">
        <button class="modal-tab-btn active" onclick="cambiarPestañaModalDieta('menu')" id="tab-btn-dieta-menu">🍽️ Menú & Tiempos Actuales</button>
        <button class="modal-tab-btn" onclick="cambiarPestañaModalDieta('historial')" id="tab-btn-dieta-historial">🔄 Historial de Mesociclos (${mesActual}/3)</button>
        <button class="modal-tab-btn" onclick="cambiarPestañaModalDieta('distribucion')" id="tab-btn-dieta-distribucion">📊 Distribución & Timing</button>
      </div>

      <!-- PESTAÑA 1: MENÚ Y TIEMPOS ACTUALES -->
      <div id="tab-content-dieta-menu">
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div>
              <h3 style="font-size:18px; color:var(--accent-green); margin:0; font-family:var(--font-heading);">${dieta.nombre}</h3>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                Atleta: <strong style="color:#fff;">${dieta.cliente}</strong> • Objetivo: <span class="badge ${badgeObjetivo}">${dieta.objetivo}</span>
              </div>
            </div>
            <span class="badge badge-green" style="font-size:12px; padding:4px 10px;">📅 Mesociclo ${mesActual} de 3</span>
          </div>

          <!-- MACRO STATS -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:10px;">
            <div style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--border-color);">
              <div style="font-size:18px; font-weight:700; color:#fff;">${dieta.tdee}</div>
              <div style="font-size:11px; color:var(--text-muted);">Calorías Diarias</div>
            </div>
            <div style="background:rgba(74, 222, 128, 0.1); padding:10px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(74, 222, 128, 0.3);">
              <div style="font-size:18px; font-weight:700; color:#4ade80;">${dieta.proteina}g</div>
              <div style="font-size:11px; color:var(--text-muted);">Proteínas (2.2g/kg)</div>
            </div>
            <div style="background:rgba(96, 165, 250, 0.1); padding:10px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(96, 165, 250, 0.3);">
              <div style="font-size:18px; font-weight:700; color:#60a5fa;">${dieta.carbo}g</div>
              <div style="font-size:11px; color:var(--text-muted);">Carbohidratos</div>
            </div>
            <div style="background:rgba(251, 191, 36, 0.1); padding:10px; border-radius:var(--radius-sm); text-align:center; border:1px solid rgba(251, 191, 36, 0.3);">
              <div style="font-size:18px; font-weight:700; color:#fbbf24;">${dieta.grasa}g</div>
              <div style="font-size:11px; color:var(--text-muted);">Grasas Saludables</div>
            </div>
          </div>
        </div>

        <div style="font-size:14px; color:#fff; font-weight:600; margin-bottom:12px;">🍲 Desglose de Comidas Diarias & Timing Nutricional:</div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:24px;">
          ${dieta.comidas && dieta.comidas.length > 0 ? dieta.comidas.map((c, idx) => `
            <div style="background:var(--bg-surface); padding:14px 16px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div style="flex:2; min-width:240px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <strong style="color:var(--accent-green); font-size:14px;">${c.tiempo}</strong>
                </div>
                <div style="color:#fff; font-size:13px; margin-top:4px; line-height:1.4;">${c.alimento}</div>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-green" style="font-size:11px; padding:4px 10px;">${c.macros}</span>
              </div>
            </div>
          `).join('') : '<div style="color:var(--text-muted); padding:20px; text-align:center;">No hay comidas desglosadas.</div>'}
        </div>
      </div>

      <!-- PESTAÑA 2: HISTORIAL DE MESOCICLOS ANTERIORES CON MENÚS COMPLETOS -->
      <div id="tab-content-dieta-historial" class="hidden">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
          <div>
            <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin:0; font-size:16px;">🔄 Progresión Cíclica & Historial Nutricional</h4>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Compara calorías, distribución de macronutrientes y menús de cada mesociclo</div>
          </div>
          <button class="btn-secondary" style="font-size:11px; padding:5px 10px; color:#38bdf8; border-color:#38bdf8;" onclick="avanzarCicloNutricional('${dieta.cliente}')">🔄 Avanzar al Siguiente Ciclo (+1)</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
          ${historialCiclos.map(h => {
            const esActual = h.mes === mesActual;
            const badgeFase = esActual ? 'badge-green' : h.mes < mesActual ? 'badge-primary' : 'badge-muted';
            const borderLeft = esActual ? '4px solid var(--accent-green)' : '4px solid #3b82f6';

            return `
              <div style="background:var(--bg-card); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-color); border-left:${borderLeft};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <strong style="font-size:16px; color:#fff;">Mesociclo ${h.mes}: ${h.fase}</strong>
                      <span style="font-size:11px; color:var(--text-muted);">• ${h.fecha}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:3px; line-height:1.4;">${h.estrategia}</div>
                  </div>
                  <span class="badge ${badgeFase}">${h.estado}</span>
                </div>

                <!-- MACRO METRICS CARD -->
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin:14px 0; background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                  <div style="text-align:center;">
                    <div style="font-size:15px; font-weight:700; color:#fff;">${h.tdee}</div>
                    <div style="font-size:10px; color:var(--text-muted);">kcal/día</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-size:15px; font-weight:700; color:#4ade80;">${h.proteina}g</div>
                    <div style="font-size:10px; color:var(--text-muted);">Proteína</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-size:15px; font-weight:700; color:#60a5fa;">${h.carbo}g</div>
                    <div style="font-size:10px; color:var(--text-muted);">Carbos</div>
                  </div>
                  <div style="text-align:center;">
                    <div style="font-size:15px; font-weight:700; color:#fbbf24;">${h.grasa}g</div>
                    <div style="font-size:10px; color:var(--text-muted);">Grasas</div>
                  </div>
                </div>

                <!-- EXPANDABLE FULL HISTORICAL MEAL BREAKDOWN -->
                <details ${esActual ? 'open' : ''} style="background:rgba(0,0,0,0.25); border-radius:var(--radius-sm); border:1px solid rgba(255,255,255,0.06); padding:10px 14px; margin-top:8px;">
                  <summary style="font-size:12px; font-weight:700; color:var(--accent-green); cursor:pointer; outline:none; display:flex; justify-content:space-between; align-items:center; user-select:none;">
                    <span>🍲 Desglose de 5 Comidas del Mesociclo ${h.mes}</span>
                    <span style="font-size:11px; color:var(--text-muted); font-weight:normal;">▼ Ver / Ocultar Menú</span>
                  </summary>
                  <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06);">
                    ${h.comidas.map(c => `
                      <div style="background:var(--bg-surface); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div style="flex:2; min-width:200px;">
                          <strong style="color:var(--accent-green); font-size:12px;">${c.tiempo}</strong>
                          <div style="color:#fff; font-size:12px; margin-top:2px;">${c.alimento}</div>
                        </div>
                        <div style="text-align:right;">
                          <span class="badge badge-green" style="font-size:10px; padding:2px 8px;">${c.macros}</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </details>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- PESTAÑA 3: DISTRIBUCIÓN & TIMING -->
      <div id="tab-content-dieta-distribucion" class="hidden">
        <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin:0 0 14px 0; font-size:16px;">📊 Distribución Calórica y Timing Peri-Entrenamiento</h4>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:20px;">
          <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <div style="color:#fff; font-weight:700; font-size:13px; margin-bottom:6px;">🌅 Desayuno (~25% Kcal)</div>
            <div style="color:var(--text-muted); font-size:12px; line-height:1.4;">Carga proteica inicial y carbohidratos de liberación sostenida para el inicio del ritmo circadiano.</div>
          </div>
          <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <div style="color:#fff; font-weight:700; font-size:13px; margin-bottom:6px;">🍲 Comida Principal (~30% Kcal)</div>
            <div style="color:var(--text-muted); font-size:12px; line-height:1.4;">Mayor volumen de micronutrientes, fibra y fuentes densas de aminoácidos para síntesis tisular.</div>
          </div>
          <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <div style="color:#fff; font-weight:700; font-size:13px; margin-bottom:6px;">🍌 Peri-Entreno (~15% Kcal)</div>
            <div style="color:var(--text-muted); font-size:12px; line-height:1.4;">Absorción rápida sin grasas pesadas. Maximiza el glucógeno y la hiperemia muscular.</div>
          </div>
          <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <div style="color:#fff; font-weight:700; font-size:13px; margin-bottom:6px;">🌙 Cena (~15-18% Kcal)</div>
            <div style="color:var(--text-muted); font-size:12px; line-height:1.4;">Proteína de digestión media/lenta con lípidos monoinsaturados para reparación nocturna.</div>
          </div>
        </div>

        <div style="background:rgba(34, 197, 94, 0.1); padding:14px; border-radius:var(--radius-md); border:1px solid rgba(34, 197, 94, 0.25); font-size:12px; color:#e4e4e7; line-height:1.5;">
          💧 <strong>Pauta Hídrica Recomendada:</strong> 35 a 45 ml de agua por kg de peso corporal al día (${Math.round((clientes.find(c => c.nombre === dieta.cliente)?.peso || 75) * 40)} ml/día) para optimizar la volemia y el transporte intracelular de glucosa.
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN FOOTER -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:16px; margin-top:20px; flex-wrap:wrap; gap:10px;">
        <button class="btn-secondary" onclick="cerrarDetalleDieta()">Cerrar</button>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn-secondary" style="color:#38bdf8; border-color:#38bdf8;" onclick="cerrarDetalleDieta(); alternarACreadorManual('${dieta.cliente}', ${dieta.tdee}, ${dieta.proteina}, ${dieta.carbo}, ${dieta.grasa}, '${dieta.objetivo}')">✏️ Editar Plan</button>
          <button class="btn-primary" style="background:#38bdf8; border-color:#38bdf8; color:#000; font-weight:700;" onclick="enviarDietaPorEmail('${dieta.cliente}')">📧 Enviar por Correo</button>
          <button class="btn-secondary" style="color:#22c55e; border-color:#22c55e;" onclick="enviarDietaPorWhatsApp('${dieta.cliente}')">📲 WhatsApp</button>
          <button class="btn-secondary" style="color:#a78bfa; border-color:#a78bfa;" onclick="generarPDFDieta('${dieta.cliente}')">📄 PDF</button>
        </div>
      </div>
    `;
  }

  const m = document.getElementById('modal-dieta-resultado');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
    m.style.zIndex = '9999';
  }
}

function cambiarPestañaModalDieta(tabName) {
  const btnMenu = document.getElementById('tab-btn-dieta-menu');
  const btnHistorial = document.getElementById('tab-btn-dieta-historial');
  const btnDistribucion = document.getElementById('tab-btn-dieta-distribucion');

  const contentMenu = document.getElementById('tab-content-dieta-menu');
  const contentHistorial = document.getElementById('tab-content-dieta-historial');
  const contentDistribucion = document.getElementById('tab-content-dieta-distribucion');

  const allBtns = [btnMenu, btnHistorial, btnDistribucion];
  const allContents = [contentMenu, contentHistorial, contentDistribucion];

  allBtns.forEach(b => { if (b) b.classList.remove('active'); });
  allContents.forEach(c => { if (c) c.classList.add('hidden'); });

  if (tabName === 'menu') {
    if (btnMenu) btnMenu.classList.add('active');
    if (contentMenu) contentMenu.classList.remove('hidden');
  } else if (tabName === 'historial') {
    if (btnHistorial) btnHistorial.classList.add('active');
    if (contentHistorial) contentHistorial.classList.remove('hidden');
  } else if (tabName === 'distribucion') {
    if (btnDistribucion) btnDistribucion.classList.add('active');
    if (contentDistribucion) contentDistribucion.classList.remove('hidden');
  }
}

function cerrarDetalleDieta() {
  const m = document.getElementById('modal-dieta-resultado');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function avanzarCicloNutricional(clienteNombre) {
  const dieta = dietasGuardadas.find(d => d.cliente === clienteNombre);
  if (!dieta) return;

  const mesActual = dieta.mesociclo || 1;
  const nuevoMes = (mesActual % 3) + 1;

  dieta.mesociclo = nuevoMes;
  
  if (nuevoMes === 2) {
    dieta.nombre = `Plan Nutricional Mesociclo 2 (Modulación & Rotación de Fuentes)`;
    dieta.carbo = Math.round(dieta.carbo * 1.08);
    dieta.tdee = Math.round(dieta.tdee + 120);
  } else if (nuevoMes === 3) {
    dieta.nombre = `Plan Nutricional Mesociclo 3 (Ciclado de Carbos & Recomp)`;
    dieta.carbo = Math.round(dieta.carbo * 0.92);
    dieta.tdee = Math.round(dieta.tdee - 100);
  } else {
    dieta.nombre = `Plan Nutricional Mesociclo 1 (Base & Carga)`;
  }

  localStorage.setItem('fitpro_dietas', JSON.stringify(dietasGuardadas));
  renderDietas();

  showToast(`Ciclo nutricional avanzado para ${clienteNombre}. Mesociclo activo: Mes ${nuevoMes}. Fuentes y calorías ajustadas.`, "success", "🔄 Ciclo Nutricional");
}

function analizarEstancamientoEIntervencion(clienteNombre) {
  const metricas = metricasEvolucionDB.filter(m => m.cliente === clienteNombre).sort((a, b) => a.mesociclo - b.mesociclo);
  if (!metricas || metricas.length === 0) {
    return {
      estado: 'sin_datos',
      tipo: 'info',
      titulo: 'Sin Datos Históricos Suficientes',
      badge: 'badge-muted',
      badgeText: 'Sin Historial',
      desc: 'Registra al menos 2 mesociclos de evaluación biométrica para activar el análisis predictivo.',
      sugerencia: 'Completar registro inicial de 1RM y peso.',
      accion: 'registrar'
    };
  }

  if (metricas.length === 1) {
    return {
      estado: 'fase_inicial',
      tipo: 'info',
      titulo: 'Fase de Calibración Inicial',
      badge: 'badge-primary',
      badgeText: 'Mesociclo 1 (Base)',
      desc: 'Primera evaluación registrada. El algoritmo evaluará la sobrecarga progresiva en el próximo mesociclo.',
      sugerencia: 'Continuar con el volumen de adaptación prescrito.',
      accion: 'continuar'
    };
  }

  const mUltimo = metricas[metricas.length - 1];
  const mPrevio = metricas[metricas.length - 2];

  const deltaSentadilla = (mUltimo.sentadilla1RM || 0) - (mPrevio.sentadilla1RM || 0);
  const deltaBanca = (mUltimo.banca1RM || 0) - (mPrevio.banca1RM || 0);
  const deltaMuerto = (mUltimo.muerto1RM || 0) - (mPrevio.muerto1RM || 0);
  const delta1RMTotal = deltaSentadilla + deltaBanca + deltaMuerto;
  const deltaPeso = (mUltimo.peso - mPrevio.peso).toFixed(1);
  const rpeProm = mUltimo.rpePromedio || 8.0;
  const adherencia = mUltimo.adherencia || 90;

  // 1. Detección de Estancamiento en Cargas (0 o negativo en los 3 levantamientos)
  if (deltaSentadilla <= 0 && deltaBanca <= 0 && deltaMuerto <= 0) {
    return {
      estado: 'estancamiento',
      tipo: 'alerta',
      titulo: `⚠️ Estancamiento de Sobrecarga en ${clienteNombre}`,
      badge: 'badge-danger',
      badgeText: '🚨 Cargas Estancadas (2+ Meses)',
      desc: `El atleta no presenta incremento de 1RM en Sentadilla, Banca ni Peso Muerto en los últimos 2 mesociclos (RPE actual: ${rpeProm}/10).`,
      sugerencia: 'Aplicar Periodización Ondulante Diaria (DUP), variar rangos de repeticiones a 6-8 reps o introducir una Semana de Descarga (Deload) para resensibilizar receptores musculares.',
      accion: 'deload',
      delta1RMTotal
    };
  }

  // 2. Fatiga Crónica del SNC (RPE >= 9.5 sostenido)
  if (rpeProm >= 9.5) {
    return {
      estado: 'fatiga_snc',
      tipo: 'alerta',
      titulo: `⚡ Fatiga Neuromuscular Alta en ${clienteNombre}`,
      badge: 'badge-danger',
      badgeText: '🔴 RPE 9.5+ (Sobrecarga Crónica)',
      desc: `El atleta reporta un RPE promedio de ${rpeProm}/10 con fatiga acumulada en sistema nervioso central. Alto riesgo de sobreentrenamiento.`,
      sugerencia: 'Programar inmediatamente una Semana de Descarga (Deload Week) con reducción del 50% de volumen y RPE 6-7.',
      accion: 'deload',
      delta1RMTotal
    };
  }

  // 3. Caída de Adherencia Semanal (< 85%)
  if (adherencia < 85) {
    return {
      estado: 'baja_adherencia',
      tipo: 'alerta',
      titulo: `📉 Caída de Adherencia en ${clienteNombre}`,
      badge: 'badge-risk-med',
      badgeText: `🟡 Adherencia ${adherencia}%`,
      desc: `La tasa de cumplimiento cayó a ${adherencia}%. Posible desmotivación o fatiga por frecuencia semanal excesiva.`,
      sugerencia: 'Reajustar la rutina a frecuencia 3-4 días o realizar llamada de seguimiento y motivación.',
      accion: 'ajuste',
      delta1RMTotal
    };
  }

  // 4. Evolución Positiva y Sobrecarga Efectiva
  return {
    estado: 'optimo',
    tipo: 'exito',
    titulo: `🟢 Sobrecarga Progresiva Óptima en ${clienteNombre}`,
    badge: 'badge-green',
    badgeText: `🟢 Ganancia Total +${delta1RMTotal}kg 1RM`,
    desc: `Progresión constante: Sentadilla (+${deltaSentadilla}kg), Banca (+${deltaBanca}kg), Muerto (+${deltaMuerto}kg). Peso corporal: ${deltaPeso > 0 ? '+' : ''}${deltaPeso}kg.`,
    sugerencia: 'Mantener la estructura actual y continuar incrementando 1.25kg - 2.5kg por sesión en levantamientos principales.',
    accion: 'continuar',
    delta1RMTotal
  };
}

function renderAlertasProactivas() {
  const dashCount = document.getElementById('dash-alertas-count');
  const clientsCount = document.getElementById('clients-alertas-count');
  const dashContainer = document.getElementById('dash-alertas-container');
  const clientsContainer = document.getElementById('clients-alertas-container');

  const clientesGym = getClientesActivos();
  const alertas = [];

  clientesGym.forEach(c => {
    // 1. Routine Expiration Alert
    const ciclo = calcularEstadoCicloRutina(c.nombre);
    if (ciclo.estado === 'vencida' || ciclo.estado === 'por_vencer' || ciclo.estado === 'sin_rutina') {
      const isCritical = ciclo.estado === 'vencida';
      alertas.push({
        id: `rutina-${c.id}`,
        tipo: 'rutina',
        cliente: c.nombre,
        clienteId: c.id,
        titulo: `Rutina: ${c.nombre}`,
        desc: ciclo.estado === 'vencida' ? `Rutina vencida hace ${ciclo.dias - 30} días. Se requiere prescripción de nuevo mesociclo.` : ciclo.estado === 'por_vencer' ? `Ciclo por cumplir (${ciclo.dias}/30 días activos).` : `Atleta sin rutina prescrita.`,
        badge: isCritical ? 'badge-danger' : ciclo.badge,
        badgeText: isCritical ? '🔴 Rutina Vencida' : ciclo.texto,
        urgencia: isCritical ? 1 : 3,
        cardClass: isCritical ? 'alert-card-critical' : 'alert-card-info'
      });
    }

    // 2. Financial Membership Alert
    if (c.estadoMembresia === 'vencida' || c.estadoMembresia === 'por_vencer') {
      const isCritical = c.estadoMembresia === 'vencida';
      alertas.push({
        id: `membresia-${c.id}`,
        tipo: 'membresia',
        cliente: c.nombre,
        clienteId: c.id,
        titulo: `Membresía: ${c.nombre}`,
        desc: isCritical ? `Pago de membresía vencido. Regularizar cobro mensual.` : `Membresía por vencer en los próximos días.`,
        badge: isCritical ? 'badge-danger' : 'badge-risk-med',
        badgeText: isCritical ? '🔴 Pago Vencido' : '🟡 Por Vencer',
        urgencia: isCritical ? 1 : 2,
        cardClass: isCritical ? 'alert-card-critical' : 'alert-card-warning'
      });
    }

    // 3. Intelligent Stagnation & Deload Detection Alert
    const diag = analizarEstancamientoEIntervencion(c.nombre);
    if (diag.estado === 'estancamiento' || diag.estado === 'fatiga_snc' || diag.estado === 'baja_adherencia') {
      const isCritical = diag.estado === 'fatiga_snc';
      alertas.push({
        id: `estancamiento-${c.id}`,
        tipo: 'estancamiento',
        cliente: c.nombre,
        clienteId: c.id,
        titulo: diag.titulo,
        desc: diag.desc,
        sugerencia: diag.sugerencia,
        badge: isCritical ? 'badge-danger' : diag.badge,
        badgeText: diag.badgeText,
        urgencia: isCritical ? 1 : 2,
        cardClass: isCritical ? 'alert-card-critical' : 'alert-card-warning'
      });
    }
  });

  alertas.sort((a, b) => a.urgencia - b.urgencia);

  const countText = `${alertas.length} Alertas Activas`;
  if (dashCount) dashCount.innerText = countText;
  if (clientsCount) clientsCount.innerText = countText;

  const html = alertas.length > 0 ? alertas.map(a => `
    <div class="card ${a.cardClass}" style="padding:14px 16px; margin-bottom:0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="flex:1; min-width:260px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="badge ${a.badge}" style="font-size:11px;">${a.badgeText}</span>
          <strong style="font-size:14px; color:#fff;">${a.titulo}</strong>
        </div>
        <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">${a.desc}</div>
        ${a.sugerencia ? `<div style="font-size:11px; color:#38bdf8; margin-top:4px;">💡 <strong>Pauta Sugerida:</strong> ${a.sugerencia}</div>` : ''}
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
        ${a.tipo === 'rutina' ? `
          <button class="btn-primary" style="padding:6px 12px; font-size:11px;" onclick="solicitarConfirmacionRenovacionRutina('${a.cliente}')">⚡ Renovación Automática</button>
          <button class="btn-secondary" style="padding:6px 12px; font-size:11px; color:#60a5fa; border-color:#60a5fa;" onclick="abrirModalPlanManual('${a.cliente}')">✏️ Plan Manual</button>
        ` : a.tipo === 'estancamiento' ? `
          <button class="btn-primary" style="padding:6px 12px; font-size:11px; background:#fbbf24; border-color:#fbbf24; color:#000;" onclick="solicitarConfirmacionSemanaDescarga('${a.cliente}')">🛡️ Aplicar Semana Descarga (Deload)</button>
          <button class="btn-secondary" style="padding:6px 12px; font-size:11px; color:#38bdf8; border-color:#38bdf8;" onclick="irAAnalyticsAtleta('${a.cliente}')">📈 Ver Analytics</button>
        ` : `
          <button class="btn-secondary" style="padding:6px 12px; font-size:11px; border-color:var(--accent-green); color:var(--accent-green);" onclick="abrirDetalleCliente(${a.clienteId})">💳 Regularizar Membresía</button>
        `}
      </div>
    </div>
  `).join('') : `
    <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); text-align:center; color:var(--accent-green); font-size:13px; border:1px solid var(--border-color);">
      ✅ ¡Todo en orden! Cero alertas de renovación, sobrecarga o estancamiento de cargas en esta sede.
    </div>
  `;

  if (dashContainer) dashContainer.innerHTML = html;
  if (clientsContainer) clientsContainer.innerHTML = html;
}

function solicitarConfirmacionSemanaDescarga(clienteNombre) {
  const diag = analizarEstancamientoEIntervencion(clienteNombre);
  abrirModalConfirmacionAccion({
    titulo: 'Prescribir Semana de Descarga (Deload Week)',
    subtitulo: `Intervención biomecánica y regenerativa para ${clienteNombre}`,
    icono: '🛡️',
    iconBg: 'rgba(245, 158, 11, 0.2)',
    badgeHtml: `
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="badge ${diag.badge || 'badge-risk-med'}">${diag.badgeText || '⚠️ Sobrecarga / Estancamiento'}</span>
        <span style="font-size:12px; color:var(--text-muted);">Objetivo: Disipación de Fatiga SNC</span>
      </div>
    `,
    desgloseHtml: `
      <div style="font-weight:600; color:#fff; margin-bottom:10px; font-size:14px;">📋 Desglose Técnico de la Intervención:</div>
      <div style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <span style="color:#fbbf24; font-weight:700; min-width:145px;">📉 Reducción Volumen:</span>
          <span style="color:#e4e4e7;">-50% en series totales semanales (3 series de control biomecánico por sesión).</span>
        </div>
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <span style="color:#38bdf8; font-weight:700; min-width:145px;">🎯 Regulación Carga:</span>
          <span style="color:#e4e4e7;">50% del 1RM estimado con tope de esfuerzo en <strong>RPE 5-6</strong> (cero fallo muscular).</span>
        </div>
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <span style="color:#4ade80; font-weight:700; min-width:145px;">🧠 Impacto Fisiológico:</span>
          <span style="color:#e4e4e7;">Resensibilización neuromuscular y recuperación integral del tejido osteoarticular.</span>
        </div>
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <span style="color:var(--text-muted); font-weight:700; min-width:145px;">⏱️ Duración:</span>
          <span style="color:#e4e4e7;">1 Microciclo (7 días). Se reactivará la sobrecarga progresiva al concluir.</span>
        </div>
      </div>
    `,
    btnTexto: '🛡️ Confirmar y Prescribir Descarga',
    btnColor: '#fbbf24',
    onConfirm: () => {
      aplicarSemanaDescarga(clienteNombre);
    }
  });
}

function solicitarConfirmacionRenovacionRutina(clienteNombre) {
  abrirModalConfirmacionAccion({
    titulo: 'Renovar Ciclo de Entrenamiento Pro',
    subtitulo: `Progresión de mesociclo programada para ${clienteNombre}`,
    icono: '⚡',
    iconBg: 'rgba(34, 197, 94, 0.2)',
    badgeHtml: `
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="badge badge-green">⚡ Renovación Progresiva</span>
        <span style="font-size:12px; color:var(--text-muted);">Ciclo de 30 Días Cumplido</span>
      </div>
    `,
    desgloseHtml: `
      <div style="font-weight:600; color:#fff; margin-bottom:10px; font-size:14px;">📋 Resumen de la Nueva Programación:</div>
      <div style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <span style="color:#4ade80; font-weight:700; min-width:150px;">📈 Sobrecarga de Carga:</span>
          <span style="color:#e4e4e7;">Ajuste ascendente del 2.5% al 5% en levantamientos principales.</span>
        </div>
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <span style="color:#38bdf8; font-weight:700; min-width:150px;">🔄 Variación Estímulo:</span>
          <span style="color:#e4e4e7;">Reconfiguración de rangos de repeticiones y tiempo bajo tensión (TUT).</span>
        </div>
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <span style="color:var(--text-muted); font-weight:700; min-width:150px;">📅 Vigencia:</span>
          <span style="color:#e4e4e7;">Nuevo bloque de 30 días con auditoría biomecánica.</span>
        </div>
      </div>
    `,
    btnTexto: '⚡ Confirmar y Renovar Rutina',
    btnColor: 'var(--accent-green)',
    onConfirm: () => {
      renovarRutinaMensual(clienteNombre);
    }
  });
}

// Analytics & Performance Evolution Module
let clienteAnalyticsSeleccionado = '';

function irAAnalyticsAtleta(clienteNombre) {
  navegarA('analytics');
  setTimeout(() => {
    const select = document.getElementById('analytics-cliente-select');
    if (select) {
      select.value = clienteNombre;
      renderAnalyticsAtleta(clienteNombre);
    }
  }, 100);
}

function renderAnalyticsAtleta(clienteNombre = '') {
  const select = document.getElementById('analytics-cliente-select');
  const clientesGym = getClientesActivos();

  if (select) {
    select.innerHTML = clientesGym.map(c => `<option value="${c.nombre}">${c.nombre} (${c.objetivo})</option>`).join('');
  }

  if (!clienteNombre) {
    clienteNombre = (select && select.value) ? select.value : (clientesGym.length > 0 ? clientesGym[0].nombre : '');
  }
  if (select && clienteNombre) select.value = clienteNombre;
  clienteAnalyticsSeleccionado = clienteNombre;

  const metricas = getMetricasActivas().filter(m => m.cliente === clienteNombre).sort((a, b) => a.mesociclo - b.mesociclo);
  const clienteObj = clientesGym.find(c => c.nombre === clienteNombre) || { objetivo: 'Hipertrofia' };

  // 1. Render Summary KPI Cards
  const summaryContainer = document.getElementById('analytics-summary-cards');
  if (summaryContainer) {
    if (metricas.length > 0) {
      const mPrimero = metricas[0];
      const mUltimo = metricas[metricas.length - 1];

      const deltaPeso = (mUltimo.peso - mPrimero.peso).toFixed(1);
      const deltaGrasa = (mUltimo.grasa - mPrimero.grasa).toFixed(1);
      const total1RMActual = (mUltimo.sentadilla1RM || 0) + (mUltimo.banca1RM || 0) + (mUltimo.muerto1RM || 0);
      const total1RMInicial = (mPrimero.sentadilla1RM || 0) + (mPrimero.banca1RM || 0) + (mPrimero.muerto1RM || 0);
      const delta1RM = total1RMActual - total1RMInicial;

      const deltaPesoSigno = deltaPeso >= 0 ? `+${deltaPeso}` : `${deltaPeso}`;
      const deltaGrasaSigno = deltaGrasa >= 0 ? `+${deltaGrasa}` : `${deltaGrasa}`;

      summaryContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(56, 189, 248, 0.15); color:#38bdf8;">⚖️</div>
          <div>
            <div class="stat-value" style="color:#38bdf8;">${mUltimo.peso} <span style="font-size:13px; color:var(--text-muted);">kg</span></div>
            <div class="stat-label">Peso Corporal (${deltaPesoSigno} kg)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(251, 191, 36, 0.15); color:#fbbf24;">📉</div>
          <div style="flex:1;">
            <div class="stat-value" style="color:#fbbf24;">${mUltimo.grasa}%</div>
            <div class="stat-label">% Grasa Corporal (${deltaGrasaSigno}%)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(74, 222, 128, 0.15); color:#4ade80;">🏋️</div>
          <div>
            <div class="stat-value" style="color:var(--accent-green);">${total1RMActual} <span style="font-size:13px; color:var(--text-muted);">kg</span></div>
            <div class="stat-label">1RM Big 3 Total (+${delta1RM} kg)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(168, 85, 247, 0.15); color:#c084fc;">📊</div>
          <div>
            <div class="stat-value" style="color:#c084fc;">Mesociclo ${mUltimo.mesociclo}</div>
            <div class="stat-label">RPE Promedio: ${mUltimo.rpePromedio || 8.5}/10</div>
          </div>
        </div>
      `;
    } else {
      summaryContainer.innerHTML = `
        <div class="stat-card" style="grid-column: 1 / -1; text-align:center; padding:20px;">
          <div style="color:var(--text-muted); font-size:14px;">Sin mediciones registradas para ${clienteNombre}. Clic en "➕ Registrar Medición" para añadir el primer mesociclo.</div>
        </div>
      `;
    }
  }

  // 2. Render Smart Diagnostic & Stagnation Alert Container
  const alertContainer = document.getElementById('analytics-alert-container');
  if (alertContainer) {
    const diag = analizarEstancamientoEIntervencion(clienteNombre);
    const cardClass = diag.estado === 'fatiga_snc' ? 'alert-card-critical' : diag.estado === 'estancamiento' || diag.estado === 'baja_adherencia' ? 'alert-card-warning' : 'alert-card-info';

    alertContainer.innerHTML = `
      <div class="card ${cardClass}" style="margin-bottom:0; padding:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div style="flex:1; min-width:280px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span class="badge ${diag.badge}" style="font-size:12px;">${diag.badgeText}</span>
            <strong style="font-size:16px; color:#fff;">${diag.titulo}</strong>
          </div>
          <p style="color:#e4e4e7; font-size:13px; margin:0 0 6px 0; line-height:1.4;">${diag.desc}</p>
          <div style="font-size:12px; color:#38bdf8;">💡 <strong>Pauta de Intervención Recomendada:</strong> ${diag.sugerencia}</div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn-primary" style="font-size:12px; padding:8px 14px; background:#fbbf24; border-color:#fbbf24; color:#000;" onclick="solicitarConfirmacionSemanaDescarga('${clienteNombre}')">🛡️ Aplicar Semana de Descarga (Deload)</button>
          <button class="btn-secondary" style="font-size:12px; padding:8px 14px;" onclick="recalcularProgresionCargas('${clienteNombre}')">🔄 Recalcular Progresión de Cargas</button>
        </div>
      </div>
    `;
  }

  // 3. Render Interactive SVG Charts
  renderGraficaBiometriaSVG(metricas);
  renderGrafica1RMSVG(metricas);

  // 4. Render History Table
  const tableContainer = document.getElementById('analytics-table-container');
  if (tableContainer) {
    if (metricas.length > 0) {
      tableContainer.innerHTML = `
        <table class="data-table" style="width:100%;">
          <thead>
            <tr>
              <th>Mesociclo</th>
              <th>Fecha</th>
              <th>Peso (kg)</th>
              <th>% Grasa</th>
              <th>Sentadilla 1RM</th>
              <th>Press Banca 1RM</th>
              <th>Peso Muerto 1RM</th>
              <th>RPE Prom</th>
              <th>Adherencia</th>
              <th>Notas Clínicas / Cargas</th>
            </tr>
          </thead>
          <tbody>
            ${metricas.map(m => `
              <tr>
                <td><span class="badge badge-green">Mes ${m.mesociclo}</span></td>
                <td style="color:#fff; font-weight:600;">${m.fecha}</td>
                <td style="color:#38bdf8; font-weight:700;">${m.peso} kg</td>
                <td style="color:#fbbf24; font-weight:700;">${m.grasa}%</td>
                <td style="color:#4ade80;">${m.sentadilla1RM || '-'} kg</td>
                <td style="color:#60a5fa;">${m.banca1RM || '-'} kg</td>
                <td style="color:#f87171;">${m.muerto1RM || '-'} kg</td>
                <td><strong style="color:#fff;">${m.rpePromedio || 8.0}/10</strong></td>
                <td><span class="badge ${m.adherencia >= 90 ? 'badge-green' : 'badge-risk-med'}">${m.adherencia || 90}%</span></td>
                <td style="font-size:12px; color:var(--text-muted); max-width:240px;">${m.notas || 'Sin notas.'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableContainer.innerHTML = `<div style="color:var(--text-muted); padding:20px; text-align:center;">No hay registros tabulares para este atleta.</div>`;
    }
  }
}

// Dynamic SVG Chart Generators
function renderGraficaBiometriaSVG(metricas) {
  const container = document.getElementById('chart-biometria-container');
  if (!container) return;

  if (!metricas || metricas.length === 0) {
    container.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:240px; color:var(--text-muted); font-size:13px;">Sin datos biométricos suficientes para graficar</div>`;
    return;
  }

  const width = 500;
  const height = 220;
  const padding = 35;

  const minPeso = Math.min(...metricas.map(m => m.peso)) - 2;
  const maxPeso = Math.max(...metricas.map(m => m.peso)) + 2;
  const minGrasa = Math.min(...metricas.map(m => m.grasa)) - 2;
  const maxGrasa = Math.max(...metricas.map(m => m.grasa)) + 2;

  const n = metricas.length;
  const stepX = n > 1 ? (width - padding * 2) / (n - 1) : width / 2;

  const puntosPeso = metricas.map((m, i) => {
    const x = n > 1 ? padding + i * stepX : width / 2;
    const y = height - padding - ((m.peso - minPeso) / (maxPeso - minPeso || 1)) * (height - padding * 2);
    return { x, y, valor: m.peso, mes: m.mesociclo };
  });

  const puntosGrasa = metricas.map((m, i) => {
    const x = n > 1 ? padding + i * stepX : width / 2;
    const y = height - padding - ((m.grasa - minGrasa) / (maxGrasa - minGrasa || 1)) * (height - padding * 2);
    return { x, y, valor: m.grasa, mes: m.mesociclo };
  });

  const pathPeso = puntosPeso.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathGrasa = puntosGrasa.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
      <!-- Grid lines -->
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3"/>
      <line x1="${padding}" y1="${height/2}" x2="${width - padding}" y2="${height/2}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3"/>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.15)"/>

      <!-- Curva Peso (Azul Cielo) -->
      <path d="${pathPeso}" fill="none" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${puntosPeso.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#38bdf8" stroke="#0f172a" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 10}" fill="#38bdf8" font-size="11" font-weight="700" text-anchor="middle">${p.valor}kg</text>
        <text x="${p.x}" y="${height - 12}" fill="var(--text-muted)" font-size="10" text-anchor="middle">Mes ${p.mes}</text>
      `).join('')}

      <!-- Curva % Grasa (Amarillo / Ámbar) -->
      <path d="${pathGrasa}" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="5 3" stroke-linecap="round" stroke-linejoin="round"/>
      ${puntosGrasa.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#fbbf24" stroke="#0f172a" stroke-width="2"/>
        <text x="${p.x}" y="${p.y + 16}" fill="#fbbf24" font-size="10" font-weight="700" text-anchor="middle">${p.valor}%</text>
      `).join('')}
    </svg>
  `;
}

function renderGrafica1RMSVG(metricas) {
  const container = document.getElementById('chart-1rm-container');
  if (!container) return;

  if (!metricas || metricas.length === 0) {
    container.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:240px; color:var(--text-muted); font-size:13px;">Sin datos de 1RM registrados para graficar</div>`;
    return;
  }

  const width = 500;
  const height = 220;
  const padding = 35;

  const all1rms = metricas.flatMap(m => [m.sentadilla1RM || 0, m.banca1RM || 0, m.muerto1RM || 0]).filter(v => v > 0);
  const minVal = Math.min(...all1rms, 20) - 10;
  const maxVal = Math.max(...all1rms, 100) + 15;

  const n = metricas.length;
  const stepX = n > 1 ? (width - padding * 2) / (n - 1) : width / 2;

  const ptsSentadilla = metricas.map((m, i) => ({
    x: n > 1 ? padding + i * stepX : width / 2,
    y: height - padding - (((m.sentadilla1RM || 0) - minVal) / (maxVal - minVal || 1)) * (height - padding * 2),
    v: m.sentadilla1RM,
    mes: m.mesociclo
  }));

  const ptsBanca = metricas.map((m, i) => ({
    x: n > 1 ? padding + i * stepX : width / 2,
    y: height - padding - (((m.banca1RM || 0) - minVal) / (maxVal - minVal || 1)) * (height - padding * 2),
    v: m.banca1RM,
    mes: m.mesociclo
  }));

  const ptsMuerto = metricas.map((m, i) => ({
    x: n > 1 ? padding + i * stepX : width / 2,
    y: height - padding - (((m.muerto1RM || 0) - minVal) / (maxVal - minVal || 1)) * (height - padding * 2),
    v: m.muerto1RM,
    mes: m.mesociclo
  }));

  const pathSentadilla = ptsSentadilla.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathBanca = ptsBanca.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathMuerto = ptsMuerto.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;">
      <!-- Grid lines -->
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3"/>
      <line x1="${padding}" y1="${height/2}" x2="${width - padding}" y2="${height/2}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3"/>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.15)"/>

      <!-- Sentadilla (Verde) -->
      <path d="${pathSentadilla}" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${ptsSentadilla.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#4ade80" stroke="#0f172a" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 8}" fill="#4ade80" font-size="10" font-weight="700" text-anchor="middle">${p.v}kg</text>
        <text x="${p.x}" y="${height - 12}" fill="var(--text-muted)" font-size="10" text-anchor="middle">M${p.mes}</text>
      `).join('')}

      <!-- Press Banca (Azul) -->
      <path d="${pathBanca}" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${ptsBanca.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#60a5fa" stroke="#0f172a" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 8}" fill="#60a5fa" font-size="10" font-weight="700" text-anchor="middle">${p.v}kg</text>
      `).join('')}

      <!-- Peso Muerto (Rojo / Coral) -->
      <path d="${pathMuerto}" fill="none" stroke="#f87171" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${ptsMuerto.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#f87171" stroke="#0f172a" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 8}" fill="#f87171" font-size="10" font-weight="700" text-anchor="middle">${p.v}kg</text>
      `).join('')}
    </svg>
  `;
}

// Modal Registrar Mediciones
function abrirModalRegistrarMetrica(clienteNombre = '') {
  const select = document.getElementById('metrica-cliente-select');
  const fechaInput = document.getElementById('metrica-fecha');
  const mesInput = document.getElementById('metrica-mesociclo');
  const pesoInput = document.getElementById('metrica-peso');
  const grasaInput = document.getElementById('metrica-grasa');

  if (select) {
    select.innerHTML = clientes.map(c => `<option value="${c.nombre}">${c.nombre} (${c.objetivo})</option>`).join('');
    if (clienteNombre) select.value = clienteNombre;
    else if (clienteAnalyticsSeleccionado) select.value = clienteAnalyticsSeleccionado;
  }

  const cliNombre = select ? select.value : '';
  const cliObj = clientes.find(c => c.nombre === cliNombre);
  const metricas = metricasEvolucionDB.filter(m => m.cliente === cliNombre);

  if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
  if (mesInput) mesInput.value = metricas.length + 1;
  if (pesoInput) pesoInput.value = cliObj?.peso || 78.0;
  if (grasaInput) grasaInput.value = cliObj?.porcentajeGrasa || 16.0;

  const m = document.getElementById('modal-registrar-metrica');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
    m.style.zIndex = '9999';
  }
}

function cerrarModalRegistrarMetrica() {
  const m = document.getElementById('modal-registrar-metrica');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function guardarNuevaMetrica() {
  const select = document.getElementById('metrica-cliente-select');
  const cliente = sanitizeText(select ? select.value : '', 80);
  const fecha = document.getElementById('metrica-fecha')?.value || new Date().toISOString().split('T')[0];
  const mesociclo = sanitizeNumber(document.getElementById('metrica-mesociclo')?.value, 1, 1, 50);
  const peso = sanitizeNumber(document.getElementById('metrica-peso')?.value, 75.0, 30, 260);
  const grasa = sanitizeNumber(document.getElementById('metrica-grasa')?.value, 16.0, 3, 60);
  const sentadilla1RM = sanitizeNumber(document.getElementById('metrica-1rm-sentadilla')?.value, 120, 0, 500);
  const banca1RM = sanitizeNumber(document.getElementById('metrica-1rm-banca')?.value, 85, 0, 400);
  const muerto1RM = sanitizeNumber(document.getElementById('metrica-1rm-muerto')?.value, 140, 0, 600);

  if (!cliente) {
    showToast("Por favor selecciona un cliente para registrar su medición.", "warning", "Selección Requerida");
    return;
  }

  const nuevaEntrada = {
    id: Date.now(),
    user_id: getUsuarioActualId() || 'demo_coach',
    gym_id: gimnasioActivoId,
    cliente,
    mesociclo,
    fecha,
    peso,
    grasa,
    sentadilla1RM,
    banca1RM,
    muerto1RM,
    adherencia: 95,
    rpePromedio: 8.5,
    notas: `Evaluación Mesociclo ${mesociclo} registrada en consulta biométrica.`
  };

  metricasEvolucionDB.push(nuevaEntrada);
  persistirDatosUsuarioActual();

  // Sync client bodyweight & body fat
  const cliObj = clientes.find(c => c.nombre === cliente);
  if (cliObj) {
    cliObj.peso = peso;
    cliObj.porcentajeGrasa = grasa;
    persistirDatosUsuarioActual();
    sincronizarClienteConSupabase(cliObj);
  }

  cerrarModalRegistrarMetrica();
  renderAnalyticsAtleta(cliente);
  renderAlertasProactivas();
  renderClientes();

  showToast(`Medición del Mesociclo ${mesociclo} guardada con éxito para ${cliente}.`, "success", "📈 Medición Registrada");
}

function aplicarSemanaDescarga(clienteNombre) {
  const userId = getUsuarioActualId() || 'demo_coach';
  const nuevoPlan = {
    id: Date.now(),
    user_id: userId,
    gym_id: gimnasioActivoId,
    cliente: clienteNombre,
    metodo: "🛡️ Protocolo de Descarga Activa (Deload Week) - Resensibilización SNC",
    objetivo: "Recuperación y Resensibilización",
    fecha: new Date().toISOString().split('T')[0],
    ejercicios: [
      "Sentadilla con Pausa 3s en Cajón (3x5 @ 50% 1RM) - Foco en control motor sin fatiga",
      "Press de Banca con Mancuernas en Banco Plano (3x8 @ RPE 6) - Descompresión escapular",
      "Remo en Polea con Agarre Neutro (3x10 @ RPE 6) - Activación del dorsal y romboides",
      "Paseo del Granjero Ligero + Plancha Isométrica (3x30s) - Fortalecimiento del core"
    ]
  };

  planesGuardados.unshift(nuevoPlan);
  persistirDatosUsuarioActual();

  renderClientes();
  renderPlanes();
  renderAlertasProactivas();

  showToast(`Semana de Descarga (Deload Week) prescrita exitosamente para ${clienteNombre}. Volumen reducido al 50% y RPE 6.`, "success", "🛡️ Deload Aplicado");

  abrirDetalleStat('planes');
}

function recalcularProgresionCargas(clienteNombre) {
  prepararPlanPara(clienteNombre);
  setTimeout(() => {
    analizarYGenerarPlan();
  }, 100);
}

function exportarReporteAnalyticsCSV() {
  const metricas = metricasEvolucionDB.filter(m => m.cliente === clienteAnalyticsSeleccionado);
  if (metricas.length === 0) {
    showToast("No hay datos biométricos para exportar.", "warning", "Sin Datos");
    return;
  }

  let csv = "Mesociclo,Fecha,Cliente,Peso_kg,Grasa_pct,Sentadilla_1RM,Banca_1RM,Muerto_1RM,RPE_Promedio,Adherencia_pct\n";
  metricas.forEach(m => {
    csv += `${m.mesociclo},${m.fecha},"${m.cliente}",${m.peso},${m.grasa},${m.sentadilla1RM || 0},${m.banca1RM || 0},${m.muerto1RM || 0},${m.rpePromedio || 8},${m.adherencia || 90}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `analytics_${clienteAnalyticsSeleccionado.replace(/\s+/g, '_').toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Manual Plan Builder Functions
function abrirModalPlanManual(nombreCliente = '') {
  const select = document.getElementById('manual-cliente-select');
  if (select) {
    select.innerHTML = clientes.map(c => `<option value="${c.nombre}">${c.nombre} (${c.objetivo})</option>`).join('');
    if (nombreCliente) select.value = nombreCliente;
  }
  const m = document.getElementById('modal-plan-manual');
  if (m) m.classList.remove('hidden');
}

function cerrarModalPlanManual() {
  const m = document.getElementById('modal-plan-manual');
  if (m) m.classList.add('hidden');
}

function agregarFilaEjercicioManual() {
  const container = document.getElementById('manual-ejercicios-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'fila-ejercicio-manual';
  div.style.cssText = 'display:flex; gap:10px; align-items:center; background:var(--bg-card); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);';
  div.innerHTML = `
    <input type="text" class="input-field input-ejercicio-nombre" placeholder="Nombre Ejercicio" style="flex:2;">
    <input type="text" class="input-field input-ejercicio-series" placeholder="Series x Reps" style="flex:1;">
    <input type="text" class="input-field input-ejercicio-carga" placeholder="Carga / RPE" style="flex:1;">
    <input type="text" class="input-field input-ejercicio-nota" placeholder="Táctica / Indicaciones" style="flex:1.5;">
    <button style="background:transparent; border:none; color:var(--danger); font-size:18px; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(div);
}

function guardarPlanManual() {
  const clienteSelect = document.getElementById('manual-cliente-select');
  const clienteNombre = sanitizeText(clienteSelect ? clienteSelect.value : "Atleta Pro", 80);
  const metodoInput = document.getElementById('manual-metodo');
  const objetivoSelect = document.getElementById('manual-objetivo');

  const metodo = sanitizeText(metodoInput ? metodoInput.value : "Plan Manual Personalizado", 100);
  const objetivo = sanitizeText(objetivoSelect ? objetivoSelect.value : "Hipertrofia Especifica", 60);

  const filas = document.querySelectorAll('.fila-ejercicio-manual');
  const ejercicios = [];

  filas.forEach(f => {
    const nombre = sanitizeText(f.querySelector('.input-ejercicio-nombre')?.value, 100);
    const series = sanitizeText(f.querySelector('.input-ejercicio-series')?.value, 30);
    const carga = sanitizeText(f.querySelector('.input-ejercicio-carga')?.value, 40);
    const nota = sanitizeText(f.querySelector('.input-ejercicio-nota')?.value, 150);

    if (nombre) {
      ejercicios.push(`${nombre} (${series || '3x10'} @ ${carga || 'Carga Libre'}) ${nota ? '- ' + nota : ''}`);
    }
  });

  if (ejercicios.length === 0) {
    showToast("Por favor añade al menos un ejercicio al plan manual.", "warning", "Datos Incompletos");
    return;
  }

  const userId = getUsuarioActualId() || 'demo_coach';
  const nuevoPlan = {
    id: Date.now(),
    user_id: userId,
    gym_id: gimnasioActivoId,
    cliente: clienteNombre,
    metodo: `✏️ ${metodo}`,
    objetivo,
    fecha: new Date().toISOString().split('T')[0],
    ejercicios
  };

  planesGuardados.unshift(nuevoPlan);
  persistirDatosUsuarioActual();

  // Sync to Supabase Cloud planes table
  if (supabaseClient && userId && !sesionUsuarioActual?.esModoDemo) {
    supabaseClient.from('planes').upsert({
      id: nuevoPlan.id,
      user_id: userId,
      gym_id: gimnasioActivoId,
      cliente: clienteNombre,
      metodo: nuevoPlan.metodo,
      objetivo: nuevoPlan.objetivo,
      fecha: nuevoPlan.fecha,
      ejercicios: Array.isArray(ejercicios) ? ejercicios.join(' | ') : ejercicios,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.warn("Supabase planes manual sync error:", error.message);
    });
  }

  renderClientes();
  renderPlanes();
  cerrarModalPlanManual();

  // Show Plan Result Modal
  const modalBody = document.getElementById('modal-plan-body');
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="font-size:20px; color:#60a5fa; margin:0; font-family:var(--font-heading);">✏️ Plan Diseñado Manualmente: ${clienteNombre}</h3>
          <span class="badge badge-green">Publicado</span>
        </div>
        <div style="font-size:13px; color:var(--text-muted);">Metodología: <strong style="color:#fff;">${metodo}</strong> • Objetivo: <strong style="color:var(--accent-green);">${objetivo}</strong></div>
      </div>

      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
        <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin-bottom:10px; font-size:15px;">🏋️ Ejercicios Prescritos:</h4>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${ejercicios.map(e => `
            <div style="background:var(--bg-surface); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); color:#fff; font-size:13px;">
              • ${e}
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:12px;">
        <button class="btn-secondary" onclick="cerrarModalPlan()">Cerrar</button>
        <button class="btn-primary" onclick="imprimirPlan('${clienteNombre}', '${metodo}', 'Plan Manual Prescrito')">🖨️ Imprimir PDF</button>
      </div>
    `;
    document.getElementById('modal-plan-resultado').classList.remove('hidden');
  }
}

function toggleDropdownMenu(e, id) {
  e.stopPropagation();
  const allMenus = document.querySelectorAll('.dropdown-popover');
  allMenus.forEach(m => {
    if (m.id !== `dropdown-menu-${id}`) m.classList.add('hidden');
  });
  const menu = document.getElementById(`dropdown-menu-${id}`);
  if (menu) menu.classList.toggle('hidden');
}



function abrirDetalleCliente(id) {
  const cliente = clientes.find(c => c.id == id);
  if (!cliente) return;

  const modalTitle = document.getElementById('modal-detalle-nombre');
  const modalBody = document.getElementById('modal-detalle-body');

  if (modalTitle) modalTitle.innerText = `Expediente Deportivo: ${cliente.nombre}`;

  const historialPlanes = planesGuardados.filter(p => p.cliente === cliente.nombre);
  const planAsignado = historialPlanes.length > 0 ? historialPlanes[0] : null;
  const lesionActiva = lesionesDB.find(l => l.cliente === cliente.nombre);
  const dietaActiva = dietasGuardadas.find(d => d.cliente === cliente.nombre);
  const cicloRutina = calcularEstadoCicloRutina(cliente.nombre);

  // Symmetry Deltas
  const deltaBrazo = Math.abs((cliente.brazoDerecho || 38.0) - (cliente.brazoIzquierdo || 37.5)).toFixed(1);
  const deltaMuslo = Math.abs((cliente.musloDerecho || 60.0) - (cliente.musloIzquierdo || 59.5)).toFixed(1);
  const deltaPantorrilla = Math.abs((cliente.pantorrillaDerecha || 38.5) - (cliente.pantorrillaIzquierda || 38.0)).toFixed(1);

  const badgeMembresiaClass = cliente.estadoMembresia === 'vencida' ? 'badge-danger' : cliente.estadoMembresia === 'por_vencer' ? 'badge-risk-med' : 'badge-green';
  const badgeMembresiaText = cliente.estadoMembresia === 'vencida' ? '🔴 Membresía Vencida' : cliente.estadoMembresia === 'por_vencer' ? '🟡 Por Vencer (Próximos Días)' : '🟢 Membresía Activa';

  if (modalBody) {
    modalBody.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); flex-wrap:wrap; gap:12px;">
        <div>
          <span style="font-size:12px; color:var(--text-muted);">Atleta Registrado</span>
          <h3 style="font-size:22px; color:#fff; font-family:var(--font-heading); margin:2px 0;">${cliente.nombre}</h3>
          <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">🎯 Objetivo: <strong style="color:#fff;">${cliente.objetivo}</strong> • Nivel: <strong style="color:var(--accent-green);">${cliente.nivel || 'Atleta'}</strong> ${cliente.email ? `• 📧 <strong style="color:#38bdf8;">${cliente.email}</strong>` : ''} ${cliente.telefono ? `• 📱 <strong style="color:#22c55e;">${cliente.telefono}</strong>` : ''}</div>
        </div>
        <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <span class="badge ${badgeMembresiaClass}" style="font-size:13px; padding:6px 12px;">${badgeMembresiaText}</span>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${planAsignado ? `<button class="btn-primary" style="font-size:11px; padding:4px 8px; background:rgba(56,189,248,0.15); color:#38bdf8; border-color:#38bdf8;" onclick="enviarPlanPorEmail(${planAsignado.id})">📧 Correo Plan</button><button class="btn-secondary" style="font-size:11px; padding:4px 8px; color:#22c55e; border-color:#22c55e;" onclick="enviarPlanPorWhatsApp(${planAsignado.id})">📲 WhatsApp</button>` : ''}
            ${dietaActiva ? `<button class="btn-primary" style="font-size:11px; padding:4px 8px; background:rgba(56,189,248,0.15); color:#38bdf8; border-color:#38bdf8;" onclick="enviarDietaPorEmail(${dietaActiva.id})">📧 Correo Dieta</button><button class="btn-secondary" style="font-size:11px; padding:4px 8px; color:#22c55e; border-color:#22c55e;" onclick="enviarDietaPorWhatsApp(${dietaActiva.id})">📲 WhatsApp</button>` : ''}
          </div>
        </div>
      </div>

      <!-- ACCESOS APP MÓVIL Y ENVÍO WHATSAPP -->
      <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.25); border-radius:var(--radius-md); padding:14px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="font-weight:700; color:#38bdf8; font-size:13px; margin-bottom:4px;">📲 Credenciales de Acceso a la App Móvil:</div>
          <div style="font-size:12.5px; color:#cbd5e1;">
            📧 Correo: <strong style="color:#fff;">${cliente.email || 'No generado'}</strong> &nbsp;|&nbsp; 
            🔑 Contraseña: <strong style="color:#fbbf24; font-family:monospace; font-weight:700;">${cliente.password_provisional || '(Por generar)'}</strong>
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn-secondary" style="font-size:11.5px; padding:6px 10px; color:#38bdf8; border-color:#38bdf8;" onclick="generarUsuarioYPasswordAtleta(${cliente.id})">👤 Generar Usuario y Contraseña</button>
          <button class="btn-primary" style="font-size:11.5px; padding:6px 12px; background:#22c55e; border-color:#22c55e; color:#000; font-weight:700;" onclick="enviarEnlaceWhatsAppAtleta(${cliente.id})">💬 Enviar Enlace por WhatsApp</button>
        </div>
      </div>

      <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin-bottom:12px; font-size:16px;">📏 Medidas Antropométricas y Segmentación Bilateral (cm)</h4>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:16px;">
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:20px; font-weight:700; color:#fff;">${cliente.peso || 78.5} <span style="font-size:11px; color:var(--text-muted);">kg</span></div>
          <div style="font-size:11px; color:var(--text-muted);">Peso</div>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:20px; font-weight:700; color:#fff;">${cliente.altura || 178} <span style="font-size:11px; color:var(--text-muted);">cm</span></div>
          <div style="font-size:11px; color:var(--text-muted);">Estatura</div>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:20px; font-weight:700; color:#4ade80;">${cliente.porcentajeMusculo || 45.8}%</div>
          <div style="font-size:11px; color:var(--text-muted);">Masa Muscular</div>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:20px; font-weight:700; color:#fbbf24;">${cliente.porcentajeGrasa || 14.2}%</div>
          <div style="font-size:11px; color:var(--text-muted);">Grasa Corporal</div>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:20px; font-weight:700; color:#60a5fa;">${cliente.imc || 24.8}</div>
          <div style="font-size:11px; color:var(--text-muted);">IMC</div>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:20px; font-weight:700; color:#fff;">${cliente.perimetroCintura || cliente.perimetroAbdominal || 82} <span style="font-size:11px; color:var(--text-muted);">cm</span></div>
          <div style="font-size:11px; color:var(--text-muted);">Cintura</div>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:20px; font-weight:700; color:#fff;">${cliente.perimetroPecho || 104} <span style="font-size:11px; color:var(--text-muted);">cm</span></div>
          <div style="font-size:11px; color:var(--text-muted);">Pecho</div>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
          <div style="font-size:20px; font-weight:700; color:#fff;">${cliente.perimetroCadera || 98} <span style="font-size:11px; color:var(--text-muted);">cm</span></div>
          <div style="font-size:11px; color:var(--text-muted);">Cadera</div>
        </div>
      </div>

      <!-- ANALISIS DE SIMETRIA BILATERAL -->
      <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:24px;">
        <div style="font-size:13px; color:var(--accent-green); font-weight:600; margin-bottom:8px;">📐 Análisis de Simetría Bilateral (Izquierda vs Derecha):</div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
          <div style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm);">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#fff; margin-bottom:4px;">
              <span>Brazos: ${cliente.brazoIzquierdo || 37.5}cm (I) / ${cliente.brazoDerecho || 38.0}cm (D)</span>
              <strong style="color:var(--accent-green);">Δ ${deltaBrazo} cm</strong>
            </div>
            <div class="gauge-track"><div class="gauge-fill" style="width:${Math.max(10, 100 - deltaBrazo * 20)}%; background:var(--accent-green);"></div></div>
          </div>
          <div style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm);">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#fff; margin-bottom:4px;">
              <span>Muslos: ${cliente.musloIzquierdo || 59.5}cm (I) / ${cliente.musloDerecho || 60.0}cm (D)</span>
              <strong style="color:var(--accent-green);">Δ ${deltaMuslo} cm</strong>
            </div>
            <div class="gauge-track"><div class="gauge-fill" style="width:${Math.max(10, 100 - deltaMuslo * 20)}%; background:var(--accent-green);"></div></div>
          </div>
          <div style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm);">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#fff; margin-bottom:4px;">
              <span>Pantorrillas: ${cliente.pantorrillaIzquierda || 38.0}cm (I) / ${cliente.pantorrillaDerecha || 38.5}cm (D)</span>
              <strong style="color:var(--accent-green);">Δ ${deltaPantorrilla} cm</strong>
            </div>
            <div class="gauge-track"><div class="gauge-fill" style="width:${Math.max(10, 100 - deltaPantorrilla * 20)}%; background:var(--accent-green);"></div></div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN LESIONES Y ENFERMEDADES -->
      ${(cliente.lesiones && cliente.lesiones.length > 0) || lesionActiva ? `
        <div style="background:rgba(239, 68, 68, 0.1); border:1px solid var(--danger); padding:14px; border-radius:var(--radius-md); margin-bottom:20px;">
          <div style="color:var(--danger); font-weight:700; font-size:14px; margin-bottom:6px;">🚑 Lesiones y Diagnósticos Articulares Registrados:</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${cliente.lesiones && cliente.lesiones.length > 0 ? cliente.lesiones.map(l => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:var(--radius-sm);">
                <span style="color:#fff; font-size:13px;">• ${l.condicion}</span>
                <span class="badge ${l.severidad === 'severa' ? 'badge-danger' : l.severidad === 'moderada' ? 'badge-risk-med' : 'badge-green'}">${l.severidad ? l.severidad.toUpperCase() : 'MONITOREO'}</span>
              </div>
            `).join('') : `
              <div style="color:#fff; font-size:13px;">• ${lesionActiva.condicion} (${lesionActiva.severidad.toUpperCase()})</div>
            `}
          </div>
        </div>
      ` : ''}

      ${cliente.enfermedades && cliente.enfermedades.length > 0 ? `
        <div style="background:rgba(245, 158, 11, 0.1); border:1px solid rgba(245, 158, 11, 0.3); padding:12px 14px; border-radius:var(--radius-md); margin-bottom:20px;">
          <div style="color:#fbbf24; font-weight:700; font-size:13px; margin-bottom:6px;">🏥 Condiciones Médicas Concurrentes:</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${cliente.enfermedades.map(e => `<span class="badge badge-risk-med" style="font-size:12px;">⚠️ ${e}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- PLAN NUTRICIONAL ACTIVO DEL ATLETA -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="color:#38bdf8; font-family:var(--font-heading); margin:0; font-size:16px;">🥗 Plan Nutricional Activo & Macronutrientes</h4>
        ${dietaActiva ? `<span class="badge badge-green">Mesociclo ${dietaActiva.mesociclo || 1}</span>` : ''}
      </div>

      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:24px;">
        ${dietaActiva ? `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <strong style="color:#fff; font-size:15px;">${dietaActiva.nombre}</strong>
              <div style="color:var(--text-muted); font-size:12px; margin-top:2px;">Calorías Diarias: <strong style="color:#38bdf8;">${dietaActiva.tdee} kcal</strong> • P: <strong style="color:#4ade80;">${dietaActiva.proteina}g</strong> | C: <strong style="color:#60a5fa;">${dietaActiva.carbo}g</strong> | G: <strong style="color:#fbbf24;">${dietaActiva.grasa}g</strong></div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn-secondary" style="font-size:11px; padding:6px 12px;" onclick="cerrarDetalleCliente(); abrirDetalleDieta(${dietaActiva.id})">👁️ Ver Menú</button>
              <button class="btn-secondary" style="font-size:11px; padding:6px 10px; color:#22c55e; border-color:#22c55e;" onclick="enviarDietaPorWhatsApp(${dietaActiva.id})">📲 WhatsApp</button>
              <button class="btn-secondary" style="font-size:11px; padding:6px 10px; color:#38bdf8; border-color:#38bdf8;" onclick="generarPDFDieta(${dietaActiva.id})">📄 PDF</button>
            </div>
        ` : `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="color:var(--text-muted); font-size:13px;">Sin plan de alimentación activo asignado.</div>
            <button class="btn-primary" style="font-size:11px; padding:6px 12px; background:#38bdf8; border-color:#38bdf8;" onclick="cerrarDetalleCliente(); abrirModalDietaManual('${cliente.nombre}')">✏️ Prescribir Dieta</button>
          </div>
        `}
      </div>

      <!-- HISTORIAL CRONOLÓGICO DE RUTINAS MENSUALES -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin:0; font-size:16px;">📚 Repositorio Cronológico de Rutinas Mensuales</h4>
        <span class="badge ${cicloRutina.badge}">${cicloRutina.texto}</span>
      </div>

      ${cicloRutina.estado !== 'activa' ? `
        <div style="background:rgba(245, 158, 11, 0.1); border:1px solid #fbbf24; padding:14px; border-radius:var(--radius-md); margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="color:#fbbf24; font-weight:700; font-size:14px;">${cicloRutina.texto}</div>
            <div style="color:var(--text-muted); font-size:12px; margin-top:2px;">El ciclo mensual ha concluido. Prescribe la rutina del siguiente periodo.</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-primary" style="font-size:11px; padding:8px 12px;" onclick="cerrarDetalleCliente(); renovarRutinaMensual('${cliente.nombre}')">⚡ Renovación Automática</button>
            <button class="btn-secondary" style="font-size:11px; padding:8px 12px; color:#60a5fa; border-color:#60a5fa;" onclick="cerrarDetalleCliente(); abrirModalPlanManual('${cliente.nombre}')">✏️ Crear Plan Manual</button>
          </div>
        </div>
      ` : ''}

      <!-- SI EL ATLETA ES ADULTO MAYOR O TIENE EVALUACIÓN GERIÁTRICA -->
      ${cliente.esGeriatrico || (cliente.edad && cliente.edad >= 60) || cliente.geriatria ? `
        <div style="background:rgba(56, 189, 248, 0.08); border:1px solid rgba(56, 189, 248, 0.3); padding:16px; border-radius:var(--radius-md); margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:22px;">👴</span>
              <div>
                <strong style="font-size:16px; color:#38bdf8;">Evaluación Geriátrica & Capacidad Funcional</strong>
                <div style="font-size:11px; color:var(--text-muted);">Protocolo especializado para la tercera edad y rehabilitación articular</div>
              </div>
            </div>
            <button class="btn-primary" style="font-size:12px; padding:6px 14px; background:#38bdf8; border-color:#38bdf8; color:#000;" onclick="cerrarDetalleCliente(); abrirBitacoraClinica('${cliente.nombre}')">🩺 Bitácora Clínica de Evolución</button>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:10px; font-size:12px;">
            <div style="background:var(--bg-card); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <div style="color:var(--text-muted);">Movilidad Articular:</div>
              <strong style="color:#fff;">${cliente.geriatria?.movilidad === 'funcional' ? '🟢 Funcional' : cliente.geriatria?.movilidad === 'limitada' ? '🔴 Limitada' : '🟡 Rigidez Moderada'}</strong>
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <div style="color:var(--text-muted);">Riesgo de Caídas:</div>
              <strong style="color:#fff;">${cliente.geriatria?.equilibrio === 'alto' ? '🔴 Alto Riesgo' : cliente.geriatria?.equilibrio === 'bajo' ? '🟢 Bajo Riesgo' : '🟡 Moderado'}</strong>
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <div style="color:var(--text-muted);">Sarcopenia (SARC-F):</div>
              <strong style="color:#fff;">${cliente.geriatria?.sarcopenia === 'moderada' ? '🔴 Moderada/Severa' : cliente.geriatria?.sarcopenia === 'no' ? '🟢 Sin Sarcopenia' : '🟡 Leve'}</strong>
            </div>
            <div style="background:var(--bg-card); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <div style="color:var(--text-muted);">Tensión Arterial:</div>
              <strong style="color:#4ade80;">${cliente.geriatria?.presionArterial || '125/80 mmHg'}</strong>
            </div>
          </div>

          ${cliente.geriatria?.patologiasOseas && cliente.geriatria.patologiasOseas.length > 0 ? `
            <div style="margin-top:10px; font-size:12px; color:var(--text-muted);">
              🦴 Patologías Óseas: ${cliente.geriatria.patologiasOseas.map(p => `<span class="badge badge-risk-med" style="margin-right:4px;">${p}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- ANALYTICS & RENDIMIENTO BIOMÉTRICO DEL ATLETA -->
      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div>
            <h4 style="color:#60a5fa; font-family:var(--font-heading); margin:0; font-size:16px;">📈 Analytics de Rendimiento & Evolución 1RM</h4>
            <div style="font-size:12px; color:var(--text-muted);">Seguimiento de sobrecarga progresiva, biometría y diagnóstico de estancamiento</div>
          </div>
          <button class="btn-primary" style="font-size:11px; padding:6px 12px; background:#60a5fa; border-color:#60a5fa; color:#000;" onclick="cerrarDetalleCliente(); irAAnalyticsAtleta('${cliente.nombre}')">📈 Ver Curvas de Progresión ➔</button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:10px; font-size:12px;">
          <div style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm);">
            <div style="color:var(--text-muted);">1RM Sentadilla:</div>
            <strong style="color:#4ade80; font-size:14px;">${metricasEvolucionDB.filter(m => m.cliente === cliente.nombre).slice(-1)[0]?.sentadilla1RM || 120} kg</strong>
          </div>
          <div style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm);">
            <div style="color:var(--text-muted);">1RM Press Banca:</div>
            <strong style="color:#60a5fa; font-size:14px;">${metricasEvolucionDB.filter(m => m.cliente === cliente.nombre).slice(-1)[0]?.banca1RM || 85} kg</strong>
          </div>
          <div style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm);">
            <div style="color:var(--text-muted);">1RM Peso Muerto:</div>
            <strong style="color:#f87171; font-size:14px;">${metricasEvolucionDB.filter(m => m.cliente === cliente.nombre).slice(-1)[0]?.muerto1RM || 140} kg</strong>
          </div>
          <div style="background:var(--bg-surface); padding:10px; border-radius:var(--radius-sm);">
            <div style="color:var(--text-muted);">Diagnóstico:</div>
            <strong style="color:#fff;">${analizarEstancamientoEIntervencion(cliente.nombre).badgeText}</strong>
          </div>
        </div>
      </div>

      <!-- EXPEDIENTE DE ARCHIVOS & DICTÁMENES MÉDICOS -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h4 style="color:#38bdf8; font-family:var(--font-heading); margin:0; font-size:16px;">📁 Archivos & Dictámenes Médicos Adjuntos</h4>
        <button class="btn-secondary" style="font-size:11px; padding:5px 12px; color:#38bdf8; border-color:#38bdf8;" onclick="abrirModalSubirDictamen('${cliente.nombre}')">📁 + Adjuntar Diagnóstico</button>
      </div>

      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:24px;">
        ${archivosMedicosDB.filter(d => d.cliente === cliente.nombre).length > 0 ? `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${archivosMedicosDB.filter(d => d.cliente === cliente.nombre).map(doc => `
              <div style="background:var(--bg-surface); padding:12px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-left:3px solid #38bdf8;">
                <div>
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <strong style="color:#fff; font-size:13px;">${doc.titulo}</strong>
                    <span class="badge badge-green" style="font-size:10px;">${doc.tipo}</span>
                  </div>
                  <div style="font-size:11px; color:var(--text-muted);">
                    🏥 ${doc.medicoEspecialista} • 📅 ${doc.fecha} • 📎 ${doc.archivoNombre}
                  </div>
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="btn-secondary" style="font-size:11px; padding:4px 10px; color:#38bdf8; border-color:#38bdf8;" onclick="abrirVisorDocumento(${doc.id})">👁️ Ver Documento</button>
                  <button class="btn-secondary" style="font-size:11px; padding:4px 8px;" onclick="imprimirDocumentoMedico(${doc.id})">🖨️</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="color:var(--text-muted); font-size:13px; text-align:center; padding:12px;">
            Sin dictámenes médicos o radiografías adjuntas en el expediente de este atleta.
          </div>
        `}
      </div>

      <!-- ACCIONES DIRECTAS DE GENERACIÓN DESCENTRALIZADA -->
      <div style="background:linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(56, 189, 248, 0.12)); border:1px solid var(--accent-green); padding:16px 20px; border-radius:var(--radius-md); margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h4 style="color:#fff; font-family:var(--font-heading); margin:0; font-size:16px;">⚡ Prescripción & Generación Descentralizada</h4>
          <p style="color:var(--text-muted); font-size:12px; margin:3px 0 0 0;">Genera rutinas biomecánicas personalizadas o planes nutricionales científicos para este atleta</p>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn-primary" style="font-size:12px; padding:8px 16px;" onclick="cerrarDetalleCliente(); generarEntrenamientoParaCliente('${cliente.nombre}')">
            ⚡ Generar Nuevo Plan de Entrenamiento
          </button>
          <button class="btn-secondary" style="font-size:12px; padding:8px 16px; color:#38bdf8; border-color:#38bdf8;" onclick="cerrarDetalleCliente(); generarNutricionParaCliente('${cliente.nombre}')">
            🥗 Generar Plan Nutricional
          </button>
        </div>
      </div>

      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:24px;">
        ${historialPlanes.length > 0 ? `
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${historialPlanes.map((plan, idx) => `
              <div style="background:var(--bg-surface); padding:14px; border-radius:var(--radius-sm); border-left:3px solid var(--accent-green);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <strong style="color:#fff; font-size:14px;">Mes ${historialPlanes.length - idx}: ${plan.metodo}</strong>
                  <span style="font-size:12px; color:var(--accent-green); font-weight:600;">📅 ${plan.fecha}</span>
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">🎯 Objetivo: <span style="color:#fff;">${plan.objetivo}</span></div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">
                  ${plan.ejercicios.slice(0, 3).map(e => `• ${e}`).join('<br>')}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="color:var(--text-muted); font-size:13px; text-align:center; padding:12px;">
            Aún no existen rutinas archivadas en el historial de este atleta.
          </div>
        `}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:16px; margin-top:20px; flex-wrap:wrap; gap:10px;">
        <button class="btn-secondary" onclick="cerrarDetalleCliente()">Cerrar Expediente</button>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn-secondary" style="color:#38bdf8; border-color:#38bdf8;" onclick="cerrarDetalleCliente(); generarNutricionParaCliente('${cliente.nombre}')">🥗 Generar Plan Nutricional</button>
          <button class="btn-primary" onclick="cerrarDetalleCliente(); generarEntrenamientoParaCliente('${cliente.nombre}')">⚡ Generar Nuevo Plan de Entrenamiento</button>
        </div>
      </div>
    `;
  }

  const mDetalle = document.getElementById('modal-cliente-detalle');
  if (mDetalle) {
    mDetalle.classList.remove('hidden');
    mDetalle.style.display = 'flex';
    mDetalle.style.zIndex = '9999';
  }
}

function generarEntrenamientoParaCliente(clienteNombre) {
  const cliente = clientes.find(c => c.nombre === clienteNombre);
  if (!cliente) return;

  prepararPlanPara(clienteNombre);
  setTimeout(() => {
    analizarYGenerarPlan();
  }, 100);
}

function generarNutricionParaCliente(clienteNombre) {
  const cliente = clientes.find(c => c.nombre === clienteNombre);
  if (!cliente) return;

  const peso = cliente.peso || 75;
  const altura = cliente.altura || 178;
  const edad = cliente.edad || 28;
  const sexo = cliente.genero === 'Femenino' ? 'm' : 'h';
  const bmr = (10 * peso) + (6.25 * altura) - (5 * edad) + (sexo === 'h' ? 5 : -161);
  const tdee = Math.round(bmr * 1.55);
  const proteina = Math.round(peso * 2.2);
  const grasa = Math.round(peso * 0.9);
  const carbo = Math.round((tdee - (proteina * 4) - (grasa * 9)) / 4);

  guardarDietaDesdeCalculadora(cliente.nombre, tdee, proteina, carbo, grasa, cliente.objetivo || 'Hipertrofia');
  abrirDetalleDieta(cliente.nombre);
}

function cerrarDetalleCliente() {
  const mDetalle = document.getElementById('modal-cliente-detalle');
  if (mDetalle) {
    mDetalle.classList.add('hidden');
    mDetalle.style.display = 'none';
  }
}

function abrirBitacoraClinica(clienteNombre) {
  const cliente = clientes.find(c => c.nombre === clienteNombre);
  if (!cliente) return;

  const modalTitulo = document.getElementById('modal-bitacora-titulo');
  const modalBody = document.getElementById('modal-bitacora-body');
  if (modalTitulo) modalTitulo.innerText = `🩺 Bitácora Clínica & Evolución Funcional: ${cliente.nombre}`;

  const registros = bitacoraClinicaDB.filter(b => b.cliente === cliente.nombre);

  if (modalBody) {
    modalBody.innerHTML = `
      <!-- RESUMEN CLINICO DEL ADULTO MAYOR -->
      <div style="background:rgba(56, 189, 248, 0.08); border:1px solid rgba(56, 189, 248, 0.25); padding:16px; border-radius:var(--radius-md); margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="font-size:12px; color:var(--text-muted);">Atleta / Paciente</div>
          <strong style="font-size:18px; color:#fff;">${cliente.nombre} (${cliente.edad || 68} años)</strong>
          <div style="font-size:12px; color:#38bdf8; margin-top:2px;">
            Patologías: ${cliente.geriatria?.patologiasOseas?.join(', ') || cliente.enfermedades?.join(', ') || 'En seguimiento preventivo'}
          </div>
        </div>
        <div style="text-align:right;">
          <span class="badge badge-green" style="font-size:12px; padding:4px 10px;">🟢 Tensión Arterial: ${cliente.geriatria?.presionArterial || '125/80 mmHg'}</span>
        </div>
      </div>

      <!-- FORMULARIO DE NUEVA EVOLUCIÓN CLÍNICA -->
      <div style="background:var(--bg-card); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:24px;">
        <h4 style="color:#38bdf8; font-family:var(--font-heading); margin:0 0 14px 0; font-size:15px;">➕ Registrar Nueva Evaluación Clínica & Funcional</h4>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:14px;">
          <div>
            <label for="bit-eva-dolor" style="font-size:12px; color:#fff; display:flex; justify-content:space-between;">
              <span>Escala EVA del Dolor (0-10):</span>
              <strong id="bit-eva-val" style="color:#fbbf24;">2 / 10 (Leve)</strong>
            </label>
            <input type="range" id="bit-eva-dolor" min="0" max="10" value="2" class="input-field" style="padding:0; cursor:pointer;" oninput="actualizarTextoEva(this.value)">
          </div>
          <div>
            <label for="bit-chair-stand" style="font-size:12px; color:#fff;">Chair Stand Test (Reps en 30s):</label>
            <input type="number" id="bit-chair-stand" class="input-field" placeholder="ej: 12 reps" value="12">
          </div>
          <div>
            <label for="bit-tug" style="font-size:12px; color:#fff;">Timed Up & Go (TUG Segundos):</label>
            <input type="number" step="0.1" id="bit-tug" class="input-field" placeholder="ej: 10.2s" value="10.2">
          </div>
          <div>
            <label for="bit-pa" style="font-size:12px; color:#fff;">Tensión Arterial (mmHg):</label>
            <input type="text" id="bit-pa" class="input-field" placeholder="ej: 124/78 mmHg" value="${cliente.geriatria?.presionArterial || '124/78 mmHg'}">
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label for="bit-notas" style="font-size:12px; color:#fff;">Observaciones Clínicas & Hallazgos Funcionales:</label>
          <textarea id="bit-notas" class="input-field" rows="2" placeholder="ej: Tolerancia óptima al protocolo de fuerza. Disminución de dolor articular y mayor fluidez en la marcha."></textarea>
        </div>

        <div style="display:flex; justify-content:flex-end;">
          <button class="btn-primary" style="font-size:12px; padding:8px 16px; background:#38bdf8; border-color:#38bdf8; color:#000;" onclick="guardarRegistroBitacora('${cliente.nombre}')">💾 Guardar Registro en Bitácora</button>
        </div>
      </div>

      <!-- HISTORIAL CRONOLÓGICO DE REGISTROS DE EVOLUCIÓN -->
      <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin:0 0 12px 0; font-size:15px;">📋 Historial Cronológico de Evolución Clínica (${registros.length} Registros)</h4>

      <div style="display:flex; flex-direction:column; gap:12px; max-height:300px; overflow-y:auto; padding-right:6px;">
        ${registros.length > 0 ? registros.map((r, idx) => {
          const badgeDolor = r.dolorEva <= 2 ? 'badge-green' : r.dolorEva <= 5 ? 'badge-risk-med' : 'badge-danger';
          return `
            <div style="background:var(--bg-surface); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color); border-left:4px solid #38bdf8;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <strong style="color:#fff; font-size:14px;">Evaluación #${registros.length - idx}</strong>
                  <span style="font-size:12px; color:var(--text-muted);">📅 ${r.fecha}</span>
                </div>
                <span class="badge ${badgeDolor}">Dolor EVA: ${r.dolorEva}/10</span>
              </div>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; background:var(--bg-card); padding:8px 12px; border-radius:var(--radius-sm); font-size:12px; margin-bottom:8px;">
                <div>🪑 Chair Stand: <strong style="color:#4ade80;">${r.chairStandReps || 12} reps</strong></div>
                <div>⏱️ TUG: <strong style="color:#60a5fa;">${r.tugSegundos || 10.5}s</strong></div>
                <div>❤️ Tensión: <strong style="color:#fff;">${r.presionArterial || '120/80 mmHg'}</strong></div>
                <div>📈 Adherencia: <strong style="color:var(--accent-green);">${r.adherencia || '100%'}</strong></div>
              </div>

              <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">
                📝 <strong>Notas Clínicas:</strong> ${r.notas}
              </div>
            </div>
          `;
        }).join('') : `
          <div style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px; background:var(--bg-card); border-radius:var(--radius-md);">
            No hay evaluaciones clínicas registradas aún para este paciente. Completa el formulario superior para crear la primera entrada.
          </div>
        `}
      </div>

      <!-- REPOSITORIO DOCUMENTAL DE DICTÁMENES Y ESTUDIOS MÉDICOS -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0; flex-wrap:wrap; gap:8px;">
        <h4 style="color:#38bdf8; font-family:var(--font-heading); margin:0; font-size:15px;">📁 Dictámenes Médicos, Fisioterapias & Radiografías</h4>
        <button class="btn-secondary" style="font-size:11px; padding:4px 10px; color:#38bdf8; border-color:#38bdf8;" onclick="abrirModalSubirDictamen('${cliente.nombre}')">📁 + Adjuntar Estudio / Alta</button>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px; max-height:220px; overflow-y:auto; padding-right:6px;">
        ${archivosMedicosDB.filter(d => d.cliente === cliente.nombre).length > 0 ? archivosMedicosDB.filter(d => d.cliente === cliente.nombre).map(doc => `
          <div style="background:var(--bg-surface); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="display:flex; align-items:center; gap:6px;">
                <strong style="color:#fff; font-size:12px;">${doc.titulo}</strong>
                <span class="badge badge-green" style="font-size:9px;">${doc.tipo}</span>
              </div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                🏥 ${doc.medicoEspecialista} • 📅 ${doc.fecha} • 📎 ${doc.archivoNombre}
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn-secondary" style="font-size:10px; padding:3px 8px; color:#38bdf8; border-color:#38bdf8;" onclick="abrirVisorDocumento(${doc.id})">👁️ Ver</button>
              <button class="btn-secondary" style="font-size:10px; padding:3px 6px;" onclick="imprimirDocumentoMedico(${doc.id})">🖨️</button>
            </div>
          </div>
        `).join('') : `
          <div style="color:var(--text-muted); font-size:12px; text-align:center; padding:12px; background:var(--bg-card); border-radius:var(--radius-sm);">
            No hay dictámenes médicos adjuntos para este paciente. Utiliza el botón superior para subir un informe clínico.
          </div>
        `}
      </div>

      <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border-color); padding-top:16px; margin-top:20px;">
        <button class="btn-secondary" onclick="cerrarModalBitacora()">Cerrar Bitácora</button>
      </div>
    `;
  }

  const m = document.getElementById('modal-bitacora-clinica');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
    m.style.zIndex = '9999';
  }
}

function actualizarTextoEva(val) {
  const lbl = document.getElementById('bit-eva-val');
  if (!lbl) return;
  const num = parseInt(val) || 0;
  if (num === 0) {
    lbl.innerText = `${num} / 10 (Sin Dolor)`;
    lbl.style.color = '#4ade80';
  } else if (num <= 3) {
    lbl.innerText = `${num} / 10 (Dolor Leve)`;
    lbl.style.color = '#a3e635';
  } else if (num <= 6) {
    lbl.innerText = `${num} / 10 (Dolor Moderado)`;
    lbl.style.color = '#fbbf24';
  } else {
    lbl.innerText = `${num} / 10 (Dolor Severo)`;
    lbl.style.color = '#f87171';
  }
}

function guardarRegistroBitacora(clienteNombre) {
  const eva = parseInt(document.getElementById('bit-eva-dolor')?.value) || 0;
  const chairStand = parseInt(document.getElementById('bit-chair-stand')?.value) || 10;
  const tug = parseFloat(document.getElementById('bit-tug')?.value) || 11.0;
  const pa = document.getElementById('bit-pa')?.value || '120/80 mmHg';
  const notas = document.getElementById('bit-notas')?.value.trim() || 'Control clínico rutinario sin incidencias.';
  const userId = getUsuarioActualId() || 'demo_coach';

  const nuevoRegistro = {
    id: Date.now(),
    user_id: userId,
    cliente: clienteNombre,
    fecha: new Date().toISOString().split('T')[0],
    dolorEva: eva,
    chairStandReps: chairStand,
    tugSegundos: tug,
    presionArterial: pa,
    adherencia: "100%",
    notas
  };

  bitacoraClinicaDB.unshift(nuevoRegistro);
  persistirDatosUsuarioActual();

  abrirBitacoraClinica(clienteNombre);
}

function cerrarModalBitacora() {
  const m = document.getElementById('modal-bitacora-clinica');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function abrirModalClienteGeriatrico() {
  abrirModalCliente();
  cambiarPestañaModalCliente('geriatria');
}

function renderSeniorsList() {
  const container = document.getElementById('seniors-list-container');
  const countEl = document.getElementById('metric-seniors-count');
  if (!container) return;

  const seniors = getClientesActivos().filter(c => (c.edad && c.edad >= 60) || c.esGeriatrico || (c.objetivo && (c.objetivo.includes('Adulto') || c.objetivo.includes('Rehabilitación'))));

  if (countEl) countEl.innerText = seniors.length;

  if (seniors.length === 0) {
    container.innerHTML = `
      <div style="background:var(--bg-surface); padding:24px; border-radius:var(--radius-md); text-align:center; border:1px solid var(--border-color);">
        <div style="font-size:24px; margin-bottom:6px;">👴</div>
        <div style="color:#fff; font-size:14px; font-weight:600;">No hay adultos mayores registrados en este gimnasio</div>
        <p style="color:var(--text-muted); font-size:12px; margin:4px 0 12px 0;">Registra a un nuevo atleta de la tercera edad con su perfil de movilidad y sarcopenia.</p>
        <button class="btn-primary" style="font-size:11px; padding:6px 12px;" onclick="abrirModalClienteGeriatrico()">+ Registrar Adulto Mayor</button>
      </div>
    `;
    return;
  }

  container.innerHTML = seniors.map(s => {
    const ger = s.geriatria || {
      movilidad: 'funcional',
      equilibrio: 'moderado',
      sarcopenia: 'leve',
      patologiasOseas: ['Osteopenia'],
      presionArterial: '125/80 mmHg'
    };

    const movBadge = ger.movilidad === 'funcional' ? '🟢 Movilidad Óptima' : ger.movilidad === 'limitada' ? '🔴 Movilidad Limitada' : '🟡 Rigidez Moderada';
    const caidasBadge = ger.equilibrio === 'bajo' ? '🟢 Bajo Riesgo Caídas' : ger.equilibrio === 'alto' ? '🔴 Alto Riesgo Caídas' : '🟡 Riesgo Moderado';
    const sarcBadge = ger.sarcopenia === 'no' ? '🟢 Sin Sarcopenia' : ger.sarcopenia === 'moderada' ? '🔴 Sarcopenia Moderada' : '🟡 Sarcopenia Leve';

    return `
      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; border-left:4px solid #38bdf8;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="color:#fff; font-size:16px;">${s.nombre}</strong>
              <span class="badge badge-green" style="font-size:11px;">${s.edad || 68} años</span>
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">🎯 ${s.objetivo} • PA: <strong style="color:#4ade80;">${ger.presionArterial || '125/80 mmHg'}</strong></div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn-secondary" style="font-size:11px; padding:5px 10px; color:#38bdf8; border-color:#38bdf8;" onclick="abrirBitacoraClinica('${s.nombre}')">🩺 Bitácora</button>
            <button class="btn-primary" style="font-size:11px; padding:5px 10px;" onclick="generarEntrenamientoParaCliente('${s.nombre}')">⚡ Prescribir Rutina</button>
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
          <span class="badge badge-surface" style="font-size:11px;">${movBadge}</span>
          <span class="badge badge-surface" style="font-size:11px;">${caidasBadge}</span>
          <span class="badge badge-surface" style="font-size:11px;">${sarcBadge}</span>
        </div>

        ${ger.patologiasOseas && ger.patologiasOseas.length > 0 ? `
          <div style="font-size:11px; color:var(--text-muted); background:var(--bg-card); padding:6px 10px; border-radius:var(--radius-sm);">
            🦴 <strong>Patologías Óseas:</strong> ${ger.patologiasOseas.join(', ')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function confirmarEliminarCliente(id) {
  const cliente = clientes.find(c => String(c.id) === String(id));
  if (!cliente) return;

  const proceed = typeof window.confirm === 'function' ? window.confirm(`¿Estás seguro de que deseas dar de baja y eliminar el expediente del atleta "${cliente.nombre}"?`) : true;

  if (proceed) {
    clientes = clientes.filter(c => String(c.id) !== String(id));
    localStorage.setItem('fitpro_clientes', JSON.stringify(clientes));
    window.clientes = clientes;
    eliminarClienteDeSupabase(id);
    renderClientes();
    renderAlertasProactivas();
    cerrarDetalleCliente();
  }
}

function filtrarClientes(val) {
  renderClientes(val);
}

function prepararPlanPara(nombreCliente) {
  const selectGen = document.getElementById('gen-cliente-select');
  if (selectGen) selectGen.value = nombreCliente;
  navegarA('generate');
}

// Macro Calculator Algorithm
function calcularMacros() {
  const peso = parseFloat(document.getElementById('calc-peso').value);
  const altura = parseFloat(document.getElementById('calc-altura').value);
  const edad = parseInt(document.getElementById('calc-edad').value);
  const genero = document.getElementById('calc-genero').value;
  const actividad = parseFloat(document.getElementById('calc-actividad').value);
  const objetivo = document.getElementById('calc-objetivo').value;
  const resBox = document.getElementById('calc-resultado');

  if (!peso || !altura || !edad) {
    resBox.innerHTML = `<div style="background:rgba(239,68,68,0.1); border:1px solid var(--danger); padding:16px; border-radius:var(--radius-md); color:#f87171;">Por favor completa todos los campos numéricos.</div>`;
    return;
  }

  let bmr = (10 * peso) + (6.25 * altura) - (5 * edad);
  bmr = genero === 'h' ? bmr + 5 : bmr - 161;
  let tdee = bmr * actividad;

  let targetCal = tdee;
  if (objetivo === 'hipertrofia') targetCal += 300;
  if (objetivo === 'definicion') targetCal -= 400;

  const proteinaGrams = Math.round(peso * 2.2);
  const proteinaCal = proteinaGrams * 4;
  const grasaGrams = Math.round(peso * 1.0);
  const grasaCal = grasaGrams * 9;
  const carbsCal = Math.max(0, targetCal - (proteinaCal + grasaCal));
  const carbsGrams = Math.round(carbsCal / 4);

  resBox.innerHTML = `
    <div style="background:var(--bg-card); border:1px solid var(--border-highlight); padding:20px; border-radius:var(--radius-md);">
      <h3 style="color:var(--accent-green); margin-bottom:12px; font-family:var(--font-heading);">Resultado Calórico Personalizado</h3>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:16px;">
        <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:24px; font-weight:700; color:#fff;">${Math.round(targetCal)} <span style="font-size:14px; color:var(--text-muted);">kcal</span></div>
          <div style="font-size:12px; color:var(--text-muted);">Calorías Objetivos/Día</div>
        </div>
        <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:24px; font-weight:700; color:#4ade80;">${proteinaGrams}g</div>
          <div style="font-size:12px; color:var(--text-muted);">Proteína (2.2g/kg)</div>
        </div>
        <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:24px; font-weight:700; color:#60a5fa;">${carbsGrams}g</div>
          <div style="font-size:12px; color:var(--text-muted);">Carbohidratos</div>
        </div>
        <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:24px; font-weight:700; color:#fbbf24;">${grasaGrams}g</div>
          <div style="font-size:12px; color:var(--text-muted);">Grasas Saludables</div>
        </div>
      </div>
      <p style="font-size:13px; color:var(--text-muted); margin:0;">
        💡 <strong>Nota del Coach:</strong> Tasa metabólica basal estimada en ${Math.round(bmr)} kcal. Mantén un aporte constante de hidratación (~3.5L/día).
      </p>
    </div>
  `;
}

// Dynamic Biomechanical Severity & Diagnostic Gauges Handler
function actualizarIndicadorSeveridad() {
  const severidadSelect = document.getElementById('gen-severidad');
  const lesionInput = document.getElementById('gen-lesion');
  const box = document.getElementById('gen-severidad-badge-box');
  const dot = document.getElementById('gen-severidad-dot');
  const text = document.getElementById('gen-severidad-text');

  const gaugeEstresFill = document.getElementById('gauge-estres-fill');
  const gaugeEstresVal = document.getElementById('gauge-estres-val');
  const gaugeAxialFill = document.getElementById('gauge-axial-fill');
  const gaugeAxialVal = document.getElementById('gauge-axial-val');
  const gaugeFatigaFill = document.getElementById('gauge-fatiga-fill');
  const gaugeFatigaVal = document.getElementById('gauge-fatiga-val');
  const diagBadgeStatus = document.getElementById('diag-badge-status');
  const diagProtocoloDesc = document.getElementById('diag-protocolo-desc');

  // Checkboxes
  const chkLumbar = document.getElementById('chk-lumbar')?.checked;
  const chkAxial = document.getElementById('chk-axial')?.checked;
  const chkHombro = document.getElementById('chk-hombro')?.checked;
  const chkRodilla = document.getElementById('chk-rodilla')?.checked;

  if (!severidadSelect || !box || !dot || !text) return;

  const sev = severidadSelect.value;
  const lesion = lesionInput ? lesionInput.value.trim() : '';

  let estres = 15;
  let axial = 95;
  let fatiga = 7.5;
  let statusBadge = "badge-green";
  let statusText = "Sistema Calibrado";
  let protocoloText = "Distribución balanceada de volumen semanal con vectores libres y descanso suficiente entre series.";

  // Calculate penalty for checkboxes
  const countChecks = (chkLumbar ? 1 : 0) + (chkAxial ? 1 : 0) + (chkHombro ? 1 : 0) + (chkRodilla ? 1 : 0);

  if (sev === 'severa' || (lesion && sev === 'moderada')) {
    estres = Math.min(85 + countChecks * 3, 98);
    axial = Math.max(25 - countChecks * 4, 10);
    fatiga = 9.0;
    statusBadge = "badge-danger";
    statusText = "Restricción Crítica";
    protocoloText = "Protocolo Isométrico e Isoinercial Protegido. Se prohíben totalmente los patrones de pivote axial y cargas libres.";

    box.style.background = 'rgba(239, 68, 68, 0.1)';
    box.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    dot.style.background = '#f87171';
    text.innerHTML = `🔴 <strong>Restricción Estricta (${sev.toUpperCase()}):</strong> Condición activa (${lesion || 'Lesión articular/axial'}). Se sustituyen cargas libres por apoyo guiado e isometría.`;
  } else if (sev === 'moderada' || sev === 'leve' || countChecks > 0) {
    estres = 45 + countChecks * 10;
    axial = 65 - countChecks * 8;
    fatiga = 8.0;
    statusBadge = "badge-green";
    statusText = "Precaución Moderada";
    protocoloText = "Protocolo de Descarga Articular. Ajuste RPE ≤ 7.5 con restricción focalizada de patrones irritantes.";

    box.style.background = 'rgba(245, 158, 11, 0.1)';
    box.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    dot.style.background = '#fbbf24';
    text.innerHTML = `🟡 <strong>Precaución Moderada:</strong> Se detectó restricción menor ${lesion ? '(' + lesion + ')' : ''}. Se limita la carga vertical y volumen RPE ≤ 7.5.`;
  } else {
    box.style.background = 'rgba(34, 197, 94, 0.1)';
    box.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    dot.style.background = '#4ade80';
    text.innerHTML = `🟢 <strong>Estado Sano:</strong> Cero restricciones articulares. Se permiten cargas axiales libres y progresiones intensas.`;
  }

  // Update Gauges
  if (gaugeEstresFill) {
    gaugeEstresFill.style.width = estres + '%';
    gaugeEstresFill.style.background = estres > 70 ? '#f87171' : estres > 40 ? '#fbbf24' : '#4ade80';
  }
  if (gaugeEstresVal) {
    gaugeEstresVal.innerText = `${estres}% (${estres > 70 ? 'Alto' : estres > 40 ? 'Moderado' : 'Bajo'})`;
    gaugeEstresVal.style.color = estres > 70 ? '#f87171' : estres > 40 ? '#fbbf24' : '#4ade80';
  }

  if (gaugeAxialFill) {
    gaugeAxialFill.style.width = axial + '%';
    gaugeAxialFill.style.background = axial < 40 ? '#f87171' : axial < 70 ? '#fbbf24' : '#4ade80';
  }
  if (gaugeAxialVal) {
    gaugeAxialVal.innerText = `${axial}% (${axial < 40 ? 'Crítica' : axial < 70 ? 'Reducida' : 'Óptima'})`;
    gaugeAxialVal.style.color = axial < 40 ? '#f87171' : axial < 70 ? '#fbbf24' : '#4ade80';
  }

  if (gaugeFatigaFill) {
    gaugeFatigaFill.style.width = (fatiga * 10) + '%';
  }
  if (gaugeFatigaVal) {
    gaugeFatigaVal.innerText = `RPE ${fatiga} / 10`;
  }

  if (diagBadgeStatus) {
    diagBadgeStatus.className = `badge ${statusBadge}`;
    diagBadgeStatus.innerText = statusText;
  }
  if (diagProtocoloDesc) {
    diagProtocoloDesc.innerText = protocoloText;
  }
}

function autoCompletarPerfilCliente(nombre) {
  const cliente = clientes.find(c => c.nombre === nombre);
  if (!cliente) return;

  const lesionInput = document.getElementById('gen-lesion');
  const severidadSelect = document.getElementById('gen-severidad');
  const objetivoSelect = document.getElementById('gen-objetivo');

  if (objetivoSelect && cliente.objetivo) {
    if (cliente.objetivo.includes('Hipertrofia')) objetivoSelect.value = 'Hipertrofia Especifica';
    if (cliente.objetivo.includes('Fuerza')) objetivoSelect.value = 'Fuerza Máxima (Powerlifting)';
    if (cliente.objetivo.includes('Definición')) objetivoSelect.value = 'Definición Estética';
    if (cliente.objetivo.includes('Rehabilitación')) objetivoSelect.value = 'Recondicionamiento';
  }

  if (cliente.lesiones && cliente.lesiones.length > 0) {
    const primera = cliente.lesiones[0];
    if (lesionInput) lesionInput.value = cliente.lesiones.map(l => l.condicion).join(', ');
    if (severidadSelect && primera.severidad) severidadSelect.value = primera.severidad;
  } else {
    if (lesionInput) lesionInput.value = '';
    if (severidadSelect) severidadSelect.value = 'ninguna';
  }

  actualizarIndicadorSeveridad();
}

// Biomechanical Routine Engine with Automated Monthly Periodization & Dynamic Goal Adaptation
function analizarYGenerarPlan() {
  const clienteSelect = document.getElementById('gen-cliente-select');
  const clienteNombre = clienteSelect ? clienteSelect.value : "Atleta Pro";
  const objetivo = document.getElementById('gen-objetivo')?.value || "Hipertrofia Especifica";
  const lesion = document.getElementById('gen-lesion')?.value.trim() || "";
  const severidad = document.getElementById('gen-severidad')?.value || "ninguna";
  const diasDisponibles = document.getElementById('gen-dias')?.value || "4";

  const chkLumbar = document.getElementById('chk-lumbar')?.checked;
  const chkAxial = document.getElementById('chk-axial')?.checked;
  const chkHombro = document.getElementById('chk-hombro')?.checked;
  const chkRodilla = document.getElementById('chk-rodilla')?.checked;

  const btn = event ? event.target : null;

  // Show Loading Spinner State
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Procesando Periodización Biomecánica...`;
  }

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `⚡ Analizar biometría y generar recomendación de rutina`;
    }

    const clienteObj = clientes.find(c => c.nombre === clienteNombre) || {};
    const nivel = clienteObj.nivel || "Intermedio";
    const enfermedades = clienteObj.enfermedades || [];

    // History & Mesocycle Evaluation
    const historialCliente = planesGuardados.filter(p => p.cliente === clienteNombre);
    const mesocicloNumero = historialCliente.length + 1;
    const ultimoPlan = historialCliente.length > 0 ? historialCliente[0] : null;

    let cambioObjetivoDetectado = false;
    let objetivoAnterior = "";

    if (ultimoPlan && ultimoPlan.objetivo && ultimoPlan.objetivo !== objetivo) {
      cambioObjetivoDetectado = true;
      objetivoAnterior = ultimoPlan.objetivo;
    }

    let metodo = "FST-7 Fascial Expansion Protocol (Hany Rambod Method)";
    let fasePeriodizacion = `Mesociclo ${mesocicloNumero}: Acumulación de Volumen`;
    let justificacionMetodologia = "Asignación automatizada por perfil de hipertrofia activa sin restricciones articulares.";
    let advertencia = "✅ Biometría óptima. Se aplica el protocolo de estiramiento fascial FST-7 con sobrecarga progresiva.";
    let badgeRiesgo = "badge-risk-low";

    // Dynamic Monthly Rotation Engine (Mesocycle Phase Variation)
    let faseRotacion = (mesocicloNumero - 1) % 3; // 0: Acumulación, 1: Intensificación, 2: Densidad

    // Default 4-Block Structure with Rotated Angles and Overload Methods
    let bloqueActivacion = [
      { ej: "Cat-Camel & Descompresión Lumbar", series: "2x12", nota: "Movilización fluida de columna sin carga." },
      { ej: "Band Pull-Aparts en Plano Escapular", series: "2x15", nota: "Retracción escapular activa para estabilidad." }
    ];

    let bloqueFuerza = [];
    let bloqueAsistencia = [];
    let bloqueIsometria = [];

    // MONTHLY PROGRESSION ROTATION MATRIX
    if (faseRotacion === 0) {
      // Mesocycle 1: Acumulación de Volumen & Hipertrofia Base
      fasePeriodizacion = `Mesociclo ${mesocicloNumero} (Fase 1: Acumulación de Volumen)`;
      bloqueFuerza = [
        { ej: "Press de Banca Inclinado con Mancuernas", series: "4x10", nota: "Fase excéntrica de 3s. Trabajo en ángulo de 30°." },
        { ej: "Sentadilla Libre Profunda con Barra", series: "4x8", nota: "RPE 8. Rompiendo el paralelo de manera fluida." }
      ];
      bloqueAsistencia = [
        { ej: "Remo Pendlay con Barra al Ombligo", series: "4x10", nota: "Tracción explosiva desde el suelo." },
        { ej: "Press Militar de Pie con Barra Z", series: "3x10", nota: "Core bloqueado en retroversión pélvica." }
      ];
      bloqueIsometria = [
        { ej: "FST-7: Apertura en Polea Alta", series: "7x12", nota: "Descansos de 30s. Estiramiento fascial profundo." },
        { ej: "Plancha Abdominal Isométrica", series: "4x45s", nota: "Activación profunda del transverso del abdomen." }
      ];
    } else if (faseRotacion === 1) {
      // Mesocycle 2: Intensificación Neuromuscular & Carga Miofibrilar
      fasePeriodizacion = `Mesociclo ${mesocicloNumero} (Fase 2: Intensificación Neuromuscular)`;
      bloqueFuerza = [
        { ej: "Press de Banca Plano con Barra Olímipica", series: "4x6-8", nota: "Carga pesada progresiva +2.5kg. Pausa de 1s en tórax." },
        { ej: "Prensa de Piernas 45° Heavy", series: "4x8", nota: "Enfoque en tensión muscular profunda sin bloquear rodillas." }
      ];
      bloqueAsistencia = [
        { ej: "Remo Unilateral Apoyado en Banco con Mancuerna", series: "4x8", nota: "Recorrido completo con máxima retracción." },
        { ej: "Press de Hombros Sentado con Mancuernas", series: "4x8", nota: "Ligeramente inclinado a 75° para protección acromial." }
      ];
      bloqueIsometria = [
        { ej: "Rest-Pause: Curl de Bíceps en Banco Scott", series: "3x(6+3+2)", nota: "Pausa de 15s al fallo neuromuscular." },
        { ej: "Pallof Press con Cable", series: "4x12/lado", nota: "Resistencia anti-rotacional." }
      ];
    } else {
      // Mesocycle 3: Densidad Metabólica & Bombeo Fascial
      fasePeriodizacion = `Mesociclo ${mesocicloNumero} (Fase 3: Densidad & Tensión Continua)`;
      bloqueFuerza = [
        { ej: "Cruce de Poleas Inclinado (Cable Flyes)", series: "4x12-15", nota: "Tensión constante en todo el arco articular." },
        { ej: "Sentadilla Búlgara con Mancuernas", series: "3x12/pierna", nota: "Enfoque en aislamiento unipodal de cuádriceps." }
      ];
      bloqueAsistencia = [
        { ej: "Jalón al Pecho Agarre Neutro Abierto", series: "4x12", nota: "Drop-set en la última serie (-20% carga)." },
        { ej: "Elevaciones Laterales con Polea Baja", series: "4x15", nota: "Cadencia 2-0-2-0 en plano escapular." }
      ];
      bloqueIsometria = [
        { ej: "FST-7: Extensión de Tríceps en Cuerda", series: "7x15", nota: "Bombeo metabólico máximo con 30s de recuperación." },
        { ej: "Deadbug con Fitball", series: "4x15", nota: "Estabilización lumbar contra el suelo." }
      ];
    }

    const esSenior = (clienteObj.edad && clienteObj.edad >= 60) || clienteObj.esGeriatrico || (objetivo && (objetivo.includes('Adulto') || objetivo.includes('Geriátrico') || objetivo.includes('Tercera')));

    // DECISION TREE AUTOMATED OVERRIDES
    if (esSenior) {
      metodo = "Protocolo Geriátrico Funcional & Prevención de Caídas (AGS/ACSM Senior Evidence)";
      justificacionMetodologia = "Prescripción adaptada a la tercera edad: vectores de bajo impacto articular, fortalecimiento anti-sarcopenia, control postural y propiocepción dinámica.";
      badgeRiesgo = "badge-risk-low";
      advertencia = `👵 Perfil Adulto Mayor detectado (${clienteObj.edad || 'Senior'} años). Cargas axiales eliminadas. Se priorizan movimientos en cadena cinética cerrada, equilibrio dinámico y rangos articulares indoloros.`;

      if (faseRotacion === 0) {
        fasePeriodizacion = `Mesociclo ${mesocicloNumero} (Fase 1: Readaptación Postural & Control Articular)`;
        bloqueActivacion = [
          { ej: "Movilización de Tobillos y Cuello Sentado", series: "2x15", nota: "Rotaciones suaves sin dolor para lubricación sinovial." },
          { ej: "Respiración Diafragmática & Alineación Escapular", series: "2x10", nota: "Alineación postural y descompresión torácica." }
        ];
        bloqueFuerza = [
          { ej: "Sit-to-Stand (Levantarse de la Silla)", series: "3x8-10", nota: "Fuerza funcional de cuádriceps y glúteo. Apoyo en brazos si es necesario." },
          { ej: "Remo con Banda Elástica Sentado", series: "3x12", nota: "Tensión moderada. Enfoque en retracción escapular e higiene de columna." }
        ];
        bloqueAsistencia = [
          { ej: "Puente de Glúteo en Colchoneta Asistido", series: "3x10", nota: "Activación de cadena posterior y estabilidad lumbopélvica." },
          { ej: "Elevación Lateral de Pierna de Pie (con Apoyo en Barra)", series: "3x10/lado", nota: "Fortalecimiento de glúteo medio para estabilidad de pelvis al caminar." }
        ];
        bloqueIsometria = [
          { ej: "Apoyo Monopodal y Tándem Asistido", series: "3x20s/lado", nota: "Prevención de caídas. Cerca de una pared o soporte firme." },
          { ej: "Marcha Talón-Punta Controlada", series: "2x10 pasos", nota: "Estimulación propioceptiva y reeducación de la marcha." }
        ];
      } else if (faseRotacion === 1) {
        fasePeriodizacion = `Mesociclo ${mesocicloNumero} (Fase 2: Fuerza Funcional Progresiva & Anti-Sarcopenia)`;
        bloqueActivacion = [
          { ej: "Círculos Articulares con Pica Ligera", series: "2x12", nota: "Movilidad de hombros y cintura escapular en bipedestación." },
          { ej: "Cat-Camel Asistido con Apoyo en Mesa", series: "2x10", nota: "Movilización lumbar y flexión torácica controlada." }
        ];
        bloqueFuerza = [
          { ej: "Sentadilla en Caja con Mancuernas Ligeras (2-3kg)", series: "3x10", nota: "Estímulo osteogénico y muscular anti-osteopenia." },
          { ej: "Press de Pecho en Banco Inclinado con Mancuernas Ligeras", series: "3x10", nota: "Fortalecimiento de empuje sin estrés en manguito rotador." }
        ];
        bloqueAsistencia = [
          { ej: "Jalón al Pecho con Banda Doble en Puerta", series: "3x12", nota: "Tracción vertical adaptada para mejorar la cifosis senil." },
          { ej: "Step-Up en Escalón Bajo con Apoyo en Barandilla", series: "3x8/pierna", nota: "Simulación de subir escaleras con seguridad neuromuscular." }
        ];
        bloqueIsometria = [
          { ej: "Marcha Lateral en Semisentadilla Asistida", series: "3x8 pasos/lado", nota: "Propiocepción dinámica y fuerza de abductores." },
          { ej: "Alcance Multidireccional con Ojos Abiertos/Cerrados", series: "3x15s", nota: "Reeducación del reflejo vestibular y equilibrio estático." }
        ];
      } else {
        fasePeriodizacion = `Mesociclo ${mesocicloNumero} (Fase 3: Estabilidad Reactiva & Agilidad Cotidiana)`;
        bloqueActivacion = [
          { ej: "Movilidad de Columna Torácica en Silla", series: "2x12", nota: "Rotaciones suaves para mantener la caja torácica flexible." },
          { ej: "Estiramiento Dinámico de Cadena Posterior", series: "2x10", nota: "Elongación de isquiosurales y gemelos para paso fluido." }
        ];
        bloqueFuerza = [
          { ej: "Bisagra de Cadera (Peso Muerto con Mancuernas de 3kg)", series: "3x10", nota: "Patrón funcional para recoger objetos del suelo con espalda neutra." },
          { ej: "Press de Hombro Sentado con Agarre Neutro", series: "3x10", nota: "Alineación vertical sin hiperextensión cervical." }
        ];
        bloqueAsistencia = [
          { ej: "Extensión de Cuádriceps Isométrica en Silla", series: "3x15s/pierna", nota: "Protección patelofemoral y refuerzo del vasto interno." },
          { ej: "Curl de Bíceps con Banda + Giro Supino", series: "3x12", nota: "Capacidad de agarre y fuerza para cargar bolsas cotidianas." }
        ];
        bloqueIsometria = [
          { ej: "Circuito de Desplazamiento Funcional con Obstáculos Suaves", series: "3 vueltas", nota: "Coordinación visomotora y agilidad para la vida independiente." },
          { ej: "Pallof Press Isométrico con Banda Elástica", series: "3x15s/lado", nota: "Fuerza anti-rotación para evitar desequilibrios súbitos." }
        ];
      }
    } else if (lesion || severidad !== 'ninguna' || chkLumbar || chkAxial || chkHombro || chkRodilla) {
      metodo = "Biomecánica de Prescripción Vectorial (Charles Glass Method)";
      justificacionMetodologia = "Asignación automatizada por detección de lesión o restricción articular. Sustitución de compresión axial por ángulos asistidos en palancas guiadas.";
      badgeRiesgo = severidad === 'severa' ? "badge-risk-high" : "badge-risk-med";
      advertencia = `⚠️ Restricción clínica detectada (${lesion || 'Patrón restringido'}). El motor ha aislado palancas y vectores de riesgo.`;

      bloqueFuerza = [
        { ej: "Prensa de Piernas 45° Guiada", series: "4x12", nota: "Limitando flexión a 90° para evitar cizallamiento." },
        { ej: "Jalón al Pecho Agarre Neutro", series: "4x10", nota: "Cero impacto lumbar, apoyo torácico completo." }
      ];

      bloqueAsistencia = [
        { ej: "Pec Deck en Máquina", series: "3x15", nota: "Pausa isométrica de 2 segundos en pico de contracción." },
        { ej: "Remo en Polea Baja con Triángulo", series: "4x12", nota: "Espalda apoyada y tracción hacia la pelvis." }
      ];

      bloqueIsometria = [
        { ej: "Bird-Dog Isométrico Protegido", series: "4x30s", nota: "Estabilización lumbar neutral estricta." },
        { ej: "Deadbug con Fitball", series: "3x15", nota: "Presión constante de zona lumbar contra el suelo." }
      ];
    } else if (objetivo.includes("Fuerza") || objetivo.includes("Powerlifting")) {
      metodo = "Y3T Periodización Tridimensionada (Neil Hill Method)";
      justificacionMetodologia = "Asignación automatizada para reclutamiento de fibras miofibrilares Tipo IIb y fuerza máxima explosiva.";
      bloqueFuerza = [
        { ej: "Sentadilla Libre Profunda", series: "4x5", nota: "Carga pesada RPE 8.5. Cadencia 3-0-1." },
        { ej: "Press de Banca Plano con Barra", series: "5x5", nota: "Pausa explosiva en esternón." }
      ];
    } else if (objetivo.includes("Definición") || diasDisponibles === "5" || diasDisponibles === "6") {
      metodo = "Pro-Density MTUT (Dennis James Method)";
      justificacionMetodologia = "Asignación automatizada por alta densidad metabólica y frecuencia. Maximiza el tiempo bajo tensión (TUT).";
      bloqueAsistencia.push({ ej: "Super-Set: Curls & Extensiones en Polea", series: "4x15", nota: "Descanso incompleto de 45 segundos." });
    } else if (objetivo.includes("Rehabilitación") || enfermedades.length > 0) {
      metodo = "Protocolo Iso-Inercial de Rehabilitación Funcional (Gray Cook Method)";
      justificacionMetodologia = "Asignación automatizada por condiciones clínicas/médicas. Foco en control hemodinámico y estabilidad isométrica.";
    }

    // Capturar todos los ejercicios y datos generados por el motor biomecánico
    const listaEjerciciosGenerados = [
      ...bloqueActivacion.map(b => `${b.ej} (${b.series})`),
      ...bloqueFuerza.map(b => `${b.ej} (${b.series})`),
      ...bloqueAsistencia.map(b => `${b.ej} (${b.series})`),
      ...bloqueIsometria.map(b => `${b.ej} (${b.series})`)
    ];

    window.planActivoGenerado = {
      id: Date.now(),
      cliente: clienteNombre,
      metodo: metodo,
      objetivo: objetivo,
      fecha: new Date().toISOString().split('T')[0],
      ejercicios: listaEjerciciosGenerados,
      bloqueActivacion,
      bloqueFuerza,
      bloqueAsistencia,
      bloqueIsometria,
      advertencia,
      justificacionMetodologia
    };

    const modalBody = document.getElementById('modal-plan-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <!-- SUB-TAB NAVIGATION -->
        <div class="modal-tab-nav">
          <button class="modal-tab-btn active" onclick="cambiarPestañaModalPlan('bloques')" id="tab-btn-bloques">💪 Bloques de Entrenamiento</button>
          <button class="modal-tab-btn" onclick="cambiarPestañaModalPlan('periodizacion')" id="tab-btn-periodizacion">📈 Progresión & Mesociclos</button>
          <button class="modal-tab-btn" onclick="cambiarPestañaModalPlan('anatomia')" id="tab-btn-anatomia">📐 Evaluación Anatómica</button>
          <button class="modal-tab-btn" onclick="cambiarPestañaModalPlan('exportacion')" id="tab-btn-exportacion">📑 Exportación Técnica</button>
        </div>

        <!-- PESTAÑA 1: BLOQUES DE ENTRENAMIENTO -->
        <div id="tab-content-bloques">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
              <span style="font-size:12px; color:var(--text-muted); text-transform:uppercase;">Prescripción para</span>
              <h3 style="font-size:20px; color:#fff; margin:0; font-family:var(--font-heading);">${clienteNombre} (${diasDisponibles} Días/Semana)</h3>
            </div>
            <span class="badge ${badgeRiesgo}">Severidad: ${severidad.toUpperCase()}</span>
          </div>

          ${cambioObjetivoDetectado ? `
            <div style="background:rgba(96, 165, 250, 0.1); border:1px solid #60a5fa; padding:12px 14px; border-radius:var(--radius-md); margin-bottom:16px;">
              <div style="color:#60a5fa; font-weight:700; font-size:13px;">🔄 Adaptación Dinámica por Cambio de Objetivo:</div>
              <div style="color:var(--text-muted); font-size:12px; margin-top:2px;">
                El motor ha recalibrado al instante la estrategia pasando de <strong>(${objetivoAnterior})</strong> ➔ <strong>(${objetivo})</strong>, ajustando vectores y cadencias.
              </div>
            </div>
          ` : ''}

          <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:11px; color:var(--accent-green); text-transform:uppercase; font-weight:700; margin-bottom:2px;">🏆 Metodología Asignada Automáticamente:</div>
                <div style="font-size:16px; font-weight:700; color:#fff; font-family:var(--font-heading);">${metodo}</div>
              </div>
              <span class="badge badge-green">${fasePeriodizacion}</span>
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:6px;">💡 <em>${justificacionMetodologia}</em></div>
          </div>

          <!-- BLOQUE 1 -->
          <div style="margin-bottom:14px;">
            <h4 style="color:#60a5fa; font-size:14px; margin-bottom:8px; font-family:var(--font-heading);">🔹 Bloque 1: Activación & Movilidad Miofascial</h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${bloqueActivacion.map(r => `
                <div style="background:var(--bg-card); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="color:#fff; font-size:13px;">${r.ej}</strong>
                    <div style="color:var(--text-muted); font-size:11px;">💡 ${r.nota}</div>
                  </div>
                  <span style="color:var(--accent-green); font-weight:700; font-size:13px;">${r.series}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- BLOQUE 2 -->
          <div style="margin-bottom:14px;">
            <h4 style="color:var(--accent-green); font-size:14px; margin-bottom:8px; font-family:var(--font-heading);">🔹 Bloque 2: Fuerza Base Adaptada</h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${bloqueFuerza.map(r => `
                <div style="background:var(--bg-card); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="color:#fff; font-size:13px;">${r.ej}</strong>
                    <div style="color:var(--text-muted); font-size:11px;">💡 ${r.nota}</div>
                  </div>
                  <span style="color:var(--accent-green); font-weight:700; font-size:13px;">${r.series}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- BLOQUE 3 -->
          <div style="margin-bottom:14px;">
            <h4 style="color:#fbbf24; font-size:14px; margin-bottom:8px; font-family:var(--font-heading);">🔹 Bloque 3: Asistencia Vectorial & Aislamiento</h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${bloqueAsistencia.map(r => `
                <div style="background:var(--bg-card); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="color:#fff; font-size:13px;">${r.ej}</strong>
                    <div style="color:var(--text-muted); font-size:11px;">💡 ${r.nota}</div>
                  </div>
                  <span style="color:var(--accent-green); font-weight:700; font-size:13px;">${r.series}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- BLOQUE 4 -->
          <div style="margin-bottom:16px;">
            <h4 style="color:#c084fc; font-size:14px; margin-bottom:8px; font-family:var(--font-heading);">🔹 Bloque 4: Isometría & Estabilización de Core</h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${bloqueIsometria.map(r => `
                <div style="background:var(--bg-card); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="color:#fff; font-size:13px;">${r.ej}</strong>
                    <div style="color:var(--text-muted); font-size:11px;">💡 ${r.nota}</div>
                  </div>
                  <span style="color:var(--accent-green); font-weight:700; font-size:13px;">${r.series}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <p style="color:#fbbf24; font-size:12px; line-height:1.4; margin-bottom:20px; background:rgba(245, 158, 11, 0.1); padding:10px; border-radius:var(--radius-sm); border:1px solid rgba(245, 158, 11, 0.2);">${advertencia}</p>
        </div>

        <!-- PESTAÑA 2: PROGRESION Y MESOCICLOS -->
        <div id="tab-content-periodizacion" class="hidden">
          <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin:0 0 12px 0;">📈 Matriz de Progresión y Variación de Mesociclo</h4>
          <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:16px;">
            <div style="font-size:13px; color:#fff; font-weight:600; margin-bottom:8px;">Estado del Historial del Atleta:</div>
            <p style="color:var(--text-muted); font-size:13px; margin:0; line-height:1.5;">
              Este es el <strong>Plan #${mesocicloNumero}</strong> generado para ${clienteNombre}. El motor ha variado la selección de ejercicios, ángulos articulares y métodos de sobrecarga con respecto al mes anterior para evitar la desensibilización neural.
            </p>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
            <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <div style="font-size:12px; color:var(--text-muted);">Mesociclo Actual</div>
              <strong style="color:var(--accent-green); font-size:16px;">Fase ${faseRotacion + 1} de 3</strong>
            </div>
            <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <div style="font-size:12px; color:var(--text-muted);">Método de Sobrecarga</div>
              <strong style="color:#fff; font-size:14px;">${faseRotacion === 0 ? 'Fascial Pump FST-7' : faseRotacion === 1 ? 'Rest-Pause & Carga +2.5kg' : 'Drop-sets & Tensión Continua'}</strong>
            </div>
          </div>
        </div>

        <!-- PESTAÑA 3: EVALUACION ANATOMICA -->
        <div id="tab-content-anatomia" class="hidden">
          <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin:0 0 12px 0;">📐 Análisis Anatómico & Justificación de la Metodología</h4>
          <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:16px;">
            <div style="font-size:13px; color:#fff; font-weight:600; margin-bottom:8px;">Decisión Algorítmica del Sistema:</div>
            <p style="color:var(--text-muted); font-size:13px; margin:0; line-height:1.5;">${justificacionMetodologia}</p>
          </div>

          <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <div style="font-size:13px; color:#fff; font-weight:600; margin-bottom:8px;">Restricciones Evaluadas:</div>
            <ul style="color:var(--text-muted); font-size:13px; margin:0; padding-left:20px; line-height:1.6;">
              <li>Flexión Lumbar bajo Carga: <strong style="color:${chkLumbar ? '#f87171' : '#4ade80'};">${chkLumbar ? 'Restringida' : 'Permitida'}</strong></li>
              <li>Compresión Vertical Trasnuca: <strong style="color:${chkAxial ? '#f87171' : '#4ade80'};">${chkAxial ? 'Prohibida' : 'Permitida'}</strong></li>
              <li>Rotación Externa de Hombro: <strong style="color:${chkHombro ? '#fbbf24' : '#4ade80'};">${chkHombro ? 'Limitada a plano escapular' : 'Rango completo'}</strong></li>
              <li>Cizallamiento Anterior Rodilla: <strong style="color:${chkRodilla ? '#f87171' : '#4ade80'};">${chkRodilla ? 'Limitado a <=90°' : 'Rango completo'}</strong></li>
            </ul>
          </div>
        </div>

        <!-- PESTAÑA 4: EXPORTACIÓN TECNICA -->
        <div id="tab-content-exportacion" class="hidden">
          <h4 style="color:var(--accent-green); font-family:var(--font-heading); margin:0 0 12px 0;">📑 Exportación Técnica & Envío</h4>
          <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Envía la rutina adaptada en PDF como archivo adjunto por correo electrónico o compártela por WhatsApp con tu atleta.</p>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <button class="btn-primary" style="justify-content:center; padding:12px; background:#38bdf8; border-color:#38bdf8; color:#000; font-weight:700;" onclick="enviarPlanPorEmail('${clienteNombre}')">📧 Enviar Plan por Correo Electrónico (PDF Adjunto)</button>
            <button class="btn-secondary" style="justify-content:center; padding:12px; color:#22c55e; border-color:#22c55e;" onclick="enviarPlanPorWhatsApp('${clienteNombre}')">📲 Descargar PDF y Enviar por WhatsApp</button>
            <button class="btn-secondary" style="justify-content:center; padding:12px; color:#a78bfa; border-color:#a78bfa;" onclick="generarPDFPlan('${clienteNombre}')">📄 Descargar PDF Oficial (jsPDF)</button>
            <button class="btn-primary" style="justify-content:center; padding:12px;" onclick="guardarPlanGeneratedMultiBlock('${clienteNombre}', '${metodo}', '${objetivo}')">💾 Guardar Rutina en Cartera de Atleta</button>
            <button class="btn-secondary" style="justify-content:center; padding:12px; border-color:#22c55e; color:#22c55e;" onclick="guardarDietaDesdeCalculadora('${clienteNombre}', ${clienteObj ? (clienteObj.tdeeSincronizado || 2500) : 2500}, ${clienteObj ? (clienteObj.proteinaGrs || Math.round((clienteObj.peso || 75) * 2.2)) : 165}, ${clienteObj ? (clienteObj.carboGrs || 280) : 280}, ${clienteObj ? (clienteObj.grasaGrs || 65) : 65}, '${objetivo}')">💾 Guardar Dieta en el Perfil del Atleta</button>
          </div>
        </div>
      `;
    }

    const mPlan = document.getElementById('modal-plan-resultado');
    if (mPlan) mPlan.classList.remove('hidden');
  }, 600);
}

function cambiarPestañaModalPlan(tabName) {
  const btnBloques = document.getElementById('tab-btn-bloques');
  const btnPeriodizacion = document.getElementById('tab-btn-periodizacion');
  const btnAnatomia = document.getElementById('tab-btn-anatomia');
  const btnExportacion = document.getElementById('tab-btn-exportacion');

  const contentBloques = document.getElementById('tab-content-bloques');
  const contentPeriodizacion = document.getElementById('tab-content-periodizacion');
  const contentAnatomia = document.getElementById('tab-content-anatomia');
  const contentExportacion = document.getElementById('tab-content-exportacion');

  const allBtns = [btnBloques, btnPeriodizacion, btnAnatomia, btnExportacion];
  const allContents = [contentBloques, contentPeriodizacion, contentAnatomia, contentExportacion];

  allBtns.forEach(b => { if (b) b.classList.remove('active'); });
  allContents.forEach(c => { if (c) c.classList.add('hidden'); });

  if (tabName === 'bloques') {
    if (btnBloques) btnBloques.classList.add('active');
    if (contentBloques) contentBloques.classList.remove('hidden');
  } else if (tabName === 'periodizacion') {
    if (btnPeriodizacion) btnPeriodizacion.classList.add('active');
    if (contentPeriodizacion) contentPeriodizacion.classList.remove('hidden');
  } else if (tabName === 'anatomia') {
    if (btnAnatomia) btnAnatomia.classList.add('active');
    if (contentAnatomia) contentAnatomia.classList.remove('hidden');
  } else if (tabName === 'exportacion') {
    if (btnExportacion) btnExportacion.classList.add('active');
    if (contentExportacion) contentExportacion.classList.remove('hidden');
  }
}

function abrirModalPlan() {
  document.getElementById('modal-plan-resultado').classList.remove('hidden');
}

function cerrarModalPlan() {
  document.getElementById('modal-plan-resultado').classList.add('hidden');
}

function guardarPlanGenerado(cliente, metodo, objetivo, rutinaStr) {
  return guardarPlanGeneratedMultiBlock(cliente, metodo, objetivo, rutinaStr);
}

function guardarPlanGeneratedMultiBlock(cliente, metodo, objetivo, rutinaStr = '') {
  let ejerciciosArr = [];
  if (rutinaStr) {
    ejerciciosArr = Array.isArray(rutinaStr) ? rutinaStr : String(rutinaStr).split(' | ');
  } else if (window.planActivoGenerado && window.planActivoGenerado.cliente === cliente && window.planActivoGenerado.ejercicios) {
    ejerciciosArr = window.planActivoGenerado.ejercicios;
  } else {
    ejerciciosArr = ["Prensa 45° Guiada (4x12)", "Jalón al Pecho (4x10)", "Pec Deck en Máquina (3x15)", "Remo en Polea (4x12)"];
  }

  const userId = getUsuarioActualId() || 'demo_coach';
  const nuevoPlan = {
    id: window.planActivoGenerado?.id || Date.now(),
    user_id: userId,
    gym_id: gimnasioActivoId,
    cliente,
    metodo: metodo || window.planActivoGenerado?.metodo || 'Sobrecarga Progresiva Biomecánica',
    objetivo: objetivo || window.planActivoGenerado?.objetivo || 'Hipertrofia',
    fecha: new Date().toISOString().split('T')[0],
    ejercicios: ejerciciosArr
  };

  planesGuardados.unshift(nuevoPlan);
  persistirDatosUsuarioActual();
  window.planesGuardados = planesGuardados;

  // Sync to Supabase Cloud planes table
  if (supabaseClient && userId && !sesionUsuarioActual?.esModoDemo) {
    supabaseClient.from('planes').upsert({
      id: nuevoPlan.id,
      user_id: userId,
      gym_id: gimnasioActivoId,
      cliente,
      metodo: nuevoPlan.metodo,
      objetivo: nuevoPlan.objetivo,
      fecha: nuevoPlan.fecha,
      ejercicios: Array.isArray(ejerciciosArr) ? ejerciciosArr.join(' | ') : ejerciciosArr,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.warn("Supabase planes sync error:", error.message);
    });
  }

  renderPlanes();
  cerrarModalPlan();
  showToast(`Plan prescrito guardado exitosamente para ${cliente}.`, "success", "⚡ Plan Guardado");
}

function imprimirPlan(cliente, metodo, rutinaStr) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast("Permite ventanas emergentes para imprimir el plan.", "warning", "Ventana Bloqueada");
    return;
  }
  const items = Array.isArray(rutinaStr) ? rutinaStr : (rutinaStr ? String(rutinaStr).split(' | ') : []);
  printWindow.document.write(`
    <html>
      <head>
        <title>FitPro Suite — Plan Biomecánico ${cliente}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; }
          h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
          .card { background: #f4f4f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
          ul { line-height: 1.8; }
        </style>
      </head>
      <body>
        <h1>FitPro Suite Pro — Reporte Biomecánico</h1>
        <div class="card">
          <p><strong>Atleta:</strong> ${cliente}</p>
          <p><strong>Metodología:</strong> ${metodo}</p>
          <p><strong>Fecha de Prescripción:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        <h2>Rutina Prescrita:</h2>
        <ul>
          ${items.map(e => `<li>${e}</li>`).join('')}
        </ul>
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ==========================================
// 📄 JSPDF & WHATSAPP ENGINE FOR PLANS & NUTRITION
// ==========================================

function resolverPlanData(planIdOCliente) {
  if (typeof planIdOCliente === 'object' && planIdOCliente !== null) {
    return planIdOCliente;
  }

  // 1. Priorizar el plan generado activamente por el motor biomecánico
  if (window.planActivoGenerado && (
    !planIdOCliente ||
    window.planActivoGenerado.id === planIdOCliente ||
    window.planActivoGenerado.id == planIdOCliente ||
    (window.planActivoGenerado.cliente && window.planActivoGenerado.cliente.toLowerCase() === String(planIdOCliente).toLowerCase())
  )) {
    return window.planActivoGenerado;
  }

  // 2. Buscar en la colección de planes guardados
  const planEncontrado = planesGuardados.find(p => 
    p.id === planIdOCliente || 
    p.id == planIdOCliente || 
    (p.cliente && p.cliente.toLowerCase() === String(planIdOCliente).toLowerCase())
  );
  if (planEncontrado) return planEncontrado;

  // 3. Fallback: Construir plan base a partir del expediente del atleta
  const cli = clientes.find(c => c.nombre && c.nombre.toLowerCase() === String(planIdOCliente).toLowerCase());
  if (cli) {
    return {
      id: Date.now(),
      cliente: cli.nombre,
      metodo: 'Sobrecarga Progresiva Biomecánica',
      objetivo: cli.objetivo || 'Hipertrofia & Rendimiento',
      fecha: new Date().toISOString().split('T')[0],
      ejercicios: [
        'Prensa 45° Guiada (4x10-12) - RPE 8.0',
        'Jalón al Pecho Agarre Neutro (4x10) - Apoyo torácico',
        'Pec Deck en Máquina (3x12-15) - Pausa isométrica 2s',
        'Remo en Polea Baja con Triángulo (4x12) - Tracción hacia la pelvis',
        'Deadbug con Fitball (3x15) - Estabilización de core'
      ]
    };
  }

  return null;
}

async function obtenerTelefonoCliente(clienteNombre) {
  if (!clienteNombre) return '';

  // 1. Buscar en memoria local de clientes
  const clienteLocal = clientes.find(c => c.nombre && c.nombre.toLowerCase() === String(clienteNombre).toLowerCase());
  if (clienteLocal && clienteLocal.telefono && String(clienteLocal.telefono).trim()) {
    return String(clienteLocal.telefono).trim();
  }

  // 2. Consultar directamente en la tabla clients de Supabase
  if (supabaseClient && !sesionUsuarioActual?.esModoDemo) {
    try {
      const { data, error } = await supabaseClient
        .from('clients')
        .select('telefono, datos_completos')
        .ilike('nombre', clienteNombre)
        .limit(1);

      if (data && data.length > 0) {
        const telDb = data[0].telefono || data[0].datos_completos?.telefono;
        if (telDb && String(telDb).trim()) {
          if (clienteLocal) clienteLocal.telefono = String(telDb).trim();
          return String(telDb).trim();
        }
      }
    } catch (err) {
      console.warn("Consulta teléfono Supabase notice:", err);
    }
  }

  return clienteLocal?.telefono || '';
}

function generarPDFPlan(planIdOCliente, autoDownload = true) {
  const plan = resolverPlanData(planIdOCliente);

  if (!plan) {
    showToast("No se encontró la información del plan para generar el PDF.", "warning", "Plan no encontrado");
    return null;
  }

  const gym = getGimnasioActivo();
  const clienteObj = clientes.find(c => c.nombre === plan.cliente) || {};
  const coachName = sesionUsuarioActual?.user?.user_metadata?.full_name || 'Coach Master Pro';

  try {
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 36, 'F');

      // Accent top line
      doc.setFillColor(34, 197, 94); // #22c55e
      doc.rect(0, 0, 210, 3.5, 'F');

      // Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("FITPRO SUITE PRO — PLAN DE ENTRENAMIENTO", 14, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${gym.nombre.toUpperCase()} • PRESCRIPCIÓN BIOMECÁNICA SAAS`, 14, 21);
      doc.text(`Fecha: ${plan.fecha || new Date().toISOString().split('T')[0]} | ID Plan: #${plan.id || Date.now()}`, 14, 28);

      // Athlete Details Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 42, 182, 30, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 42, 182, 30, 3, 3, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Atleta: ${plan.cliente}`, 18, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Objetivo: ${plan.objetivo || 'Hipertrofia & Rendimiento'}`, 18, 57);
      doc.text(`Metodología: ${plan.metodo || 'Sobrecarga Progresiva Adaptada'}`, 18, 64);
      doc.text(`Nivel: ${clienteObj.nivel || 'Atleta Intermedio'} | Peso: ${clienteObj.peso || '--'} kg`, 115, 57);
      doc.text(`Coach: ${coachName}`, 115, 64);

      // Exercises Table
      const ejerciciosRaw = Array.isArray(plan.ejercicios) ? plan.ejercicios : (plan.ejercicios || '').split(' | ');
      const rows = ejerciciosRaw.map((ej, index) => {
        let nombreEj = ej;
        let series = "4x10-12";
        let rpe = "RPE 8.0";
        let notas = "Cadencia 3-0-1 con control excéntrico";

        if (ej.includes('(')) {
          const parts = ej.split('(');
          nombreEj = parts[0].trim();
          const subparts = parts[1].split(')');
          series = subparts[0].trim();
          if (subparts[1] && subparts[1].includes('-')) {
            notas = subparts[1].replace('-', '').trim();
          }
        }

        return [
          `${index + 1}`,
          nombreEj,
          series,
          rpe,
          notas
        ];
      });

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 78,
          head: [['#', 'Ejercicio / Movimiento Biomecánico', 'Series x Reps', 'Intensidad', 'Pautas Técnicas & Tempo']],
          body: rows,
          theme: 'grid',
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [34, 197, 94],
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 8.5,
            textColor: [30, 41, 59]
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          margin: { left: 14, right: 14 }
        });
      }

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 180;

      // Clinical/Technical Notes Box
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(14, finalY, 182, 22, 2, 2, 'F');
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(14, finalY, 182, 22, 2, 2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52);
      doc.text("PAUTAS TÉCNICAS & SEGURIDAD BIOMECÁNICA:", 18, finalY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("• Calentamiento específico y 2 series de aproximación antes de las efectivas.", 18, finalY + 12);
      doc.text("• Mantener la columna neutra y respetar los tiempos de recuperación prescritos.", 18, finalY + 17);

      // Sign-off Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Documento generado por FitPro Suite Pro SaaS Engine • ${new Date().toLocaleDateString()}`, 14, 285);
      doc.text(`Firma del Coach: ${coachName}`, 135, 285);

      const fileName = `Plan_Entrenamiento_${String(plan.cliente).replace(/\s+/g, '_')}.pdf`;
      if (autoDownload) {
        doc.save(fileName);
        showToast(`Documento "${fileName}" descargado exitosamente.`, "success", "📄 PDF Generado");
      }
      return doc;
    } else {
      imprimirPlan(plan.cliente, plan.metodo, Array.isArray(plan.ejercicios) ? plan.ejercicios.join(' | ') : (plan.ejercicios || ''));
      return null;
    }
  } catch (err) {
    console.error("Error generando PDF de plan:", err);
    imprimirPlan(plan.cliente, plan.metodo, Array.isArray(plan.ejercicios) ? plan.ejercicios.join(' | ') : (plan.ejercicios || ''));
    return null;
  }
}

function generarPDFDieta(dietaIdOCliente, autoDownload = true) {
  let dieta = null;
  if (typeof dietaIdOCliente === 'object' && dietaIdOCliente !== null) {
    dieta = dietaIdOCliente;
  } else {
    dieta = dietasGuardadas.find(d => d.id === dietaIdOCliente || d.id == dietaIdOCliente || (d.cliente && d.cliente.toLowerCase() === String(dietaIdOCliente).toLowerCase()));
  }

  if (!dieta) {
    showToast("No se encontró el plan de nutrición para generar el PDF.", "warning", "Dieta no encontrada");
    return null;
  }

  const gym = getGimnasioActivo();
  const coachName = sesionUsuarioActual?.user?.user_metadata?.full_name || 'Coach Master Pro';

  try {
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 36, 'F');

      // Accent top line
      doc.setFillColor(56, 189, 248);
      doc.rect(0, 0, 210, 3.5, 'F');

      // Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("FITPRO SUITE PRO — PAUTA NUTRICIONAL", 14, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${gym.nombre.toUpperCase()} • DISTRIBUCIÓN DE MACRONUTRIENTES`, 14, 21);
      doc.text(`Fecha: ${dieta.fecha || new Date().toISOString().split('T')[0]} | Mesociclo: ${dieta.mesociclo || 1}`, 14, 28);

      // Macros Banner
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(14, 42, 182, 28, 3, 3, 'F');
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(14, 42, 182, 28, 3, 3, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Atleta: ${dieta.cliente} (${dieta.objetivo || 'Nutrición Personalizada'})`, 18, 50);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(2, 132, 199);
      doc.text(`Objetivo Calórico: ${dieta.tdee || 2400} kcal/día`, 18, 59);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Proteínas: ${dieta.proteina || 160}g  |  Carbohidratos: ${dieta.carbo || 260}g  |  Grasas: ${dieta.grasa || 65}g`, 80, 59);

      // Meals Table
      const comidas = dieta.comidas || [];
      const rows = comidas.map((c, i) => [
        `#${i + 1}`,
        c.tiempo,
        c.alimento,
        c.macros || '--'
      ]);

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 76,
          head: [['#', 'Tiempo de Ingesta', 'Alimentos & Porciones Recomendadas', 'Macros / Kcal']],
          body: rows,
          theme: 'grid',
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [56, 189, 248],
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 8.5,
            textColor: [30, 41, 59]
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          margin: { left: 14, right: 14 }
        });
      }

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 180;

      // Hydration and Tips Box
      doc.setFillColor(254, 249, 195);
      doc.roundedRect(14, finalY, 182, 22, 2, 2, 'F');
      doc.setDrawColor(253, 224, 71);
      doc.roundedRect(14, finalY, 182, 22, 2, 2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(161, 98, 7);
      doc.text("HIDRATACIÓN & RECOMENDACIONES DIETÉTICAS:", 18, finalY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("• Mantener ingesta de agua de 35 a 45 ml por kg de peso corporal al día.", 18, finalY + 12);
      doc.text("• Distribuir la ingesta de proteína de forma regular cada 3 a 4 horas.", 18, finalY + 17);

      // Sign-off Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Documento generado por FitPro Suite Pro SaaS Engine • ${new Date().toLocaleDateString()}`, 14, 285);
      doc.text(`Coach: ${coachName}`, 135, 285);

      const fileName = `Plan_Nutricional_${String(dieta.cliente).replace(/\s+/g, '_')}.pdf`;
      if (autoDownload) {
        doc.save(fileName);
        showToast(`Documento "${fileName}" descargado exitosamente.`, "success", "🥗 PDF Nutricional");
      }
      return doc;
    } else {
      imprimirPlan(dieta.cliente, dieta.nombre, 'Plan Nutricional');
      return null;
    }
  } catch (err) {
    console.error("Error generando PDF de dieta:", err);
    imprimirPlan(dieta.cliente, dieta.nombre, 'Plan Nutricional');
    return null;
  }
}

function abrirModalInstruccionWhatsApp(nombreArchivo, clienteNombre, tipo = 'plan') {
  const m = document.getElementById('modal-instruccion-whatsapp');
  const archivoEl = document.getElementById('modal-wa-nombre-archivo');
  const tituloEl = document.getElementById('modal-wa-titulo');

  if (archivoEl) archivoEl.innerText = nombreArchivo || (tipo === 'plan' ? 'Plan_Entrenamiento.pdf' : 'Plan_Nutricional.pdf');
  if (tituloEl) tituloEl.innerText = `📄 PDF Descargado (${clienteNombre || 'Atleta'})`;

  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
  }
}

function cerrarModalInstruccionWhatsApp() {
  const m = document.getElementById('modal-instruccion-whatsapp');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

async function enviarPlanPorWhatsApp(planIdOCliente) {
  const plan = resolverPlanData(planIdOCliente);

  if (!plan) {
    showToast("No se encontró la información del plan de entrenamiento.", "warning", "Plan no encontrado");
    return;
  }

  // 1. Mostrar estado de preparación y generación
  showToast("⏳ Generando PDF oficial con jsPDF...", "info", "Generando PDF", 3000);

  // 2. Extraer teléfono del cliente registrado en la tabla clients de Supabase
  let telefono = await obtenerTelefonoCliente(plan.cliente);

  if (!telefono) {
    const inputTel = prompt(`Ingresa el número de WhatsApp para ${plan.cliente} (con código de país, ej: +5215512345678):`, "");
    if (inputTel === null) return;
    telefono = inputTel.trim();
    if (telefono) {
      const clienteObj = clientes.find(c => c.nombre === plan.cliente);
      if (clienteObj) {
        clienteObj.telefono = telefono;
        persistirDatosUsuarioActual();
        sincronizarClienteConSupabase(clienteObj);
      }
    }
  }

  // 3. Generar y descargar el archivo PDF antes de disparar el enlace
  const pdfGenerado = generarPDFPlan(plan, true);
  const nombreArchivo = `Plan_Entrenamiento_${String(plan.cliente).replace(/\s+/g, '_')}.pdf`;

  // Pequeña pausa asíncrona para asegurar que el navegador inicie la descarga del archivo
  await new Promise(resolve => setTimeout(resolve, 600));

  const cleanPhone = telefono.replace(/[^\d+]/g, '').replace('+', '');
  const coachName = sesionUsuarioActual?.user?.user_metadata?.full_name || 'Coach Master Pro';
  const gymName = getGimnasioActivo().nombre;

  const mensaje = `🏋️ *FITPRO SUITE PRO — PLAN DE ENTRENAMIENTO* 🏋️\n\n` +
    `¡Hola *${plan.cliente}*! 👋\n\n` +
    `Te comparto tu nuevo *Plan de Entrenamiento* prescrito para tu objetivo de *${plan.objetivo || 'Rendimiento'}* en *${gymName}*.\n\n` +
    `📋 *Metodología:* ${plan.metodo}\n` +
    `📅 *Fecha de Prescripción:* ${plan.fecha || new Date().toISOString().split('T')[0]}\n\n` +
    `📄 *ARCHIVO PDF ADJUNTO:* \n` +
    `_He generado y descargado tu documento oficial en PDF con todas las series, repeticiones, descansos, tempos y notas biomecánicas. Por favor ábrelo o descárgalo aquí en el chat para comenzar tu preparación._\n\n` +
    `¡A darlo todo en cada sesión! 🔥💪\n` +
    `— *${coachName}* (${gymName})`;

  const waUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;

  window.open(waUrl, '_blank');
  
  // 4. Mostrar modal intermedio con instrucción clara para adjuntar el archivo descargado
  abrirModalInstruccionWhatsApp(nombreArchivo, plan.cliente, 'plan');
  showToast("¡PDF generado y descargado con éxito! Se ha abierto el chat de WhatsApp. Por favor, arrastra o adjunta el archivo PDF recién descargado para enviarlo a tu atleta.", "success", "📲 WhatsApp & PDF Listo", 9000);
}

const enviarPorWhatsApp = enviarPlanPorWhatsApp;

async function enviarDietaPorWhatsApp(dietaIdOCliente) {
  let dieta = null;
  if (typeof dietaIdOCliente === 'object' && dietaIdOCliente !== null) {
    dieta = dietaIdOCliente;
  } else {
    dieta = dietasGuardadas.find(d => d.id === dietaIdOCliente || d.id == dietaIdOCliente || (d.cliente && d.cliente.toLowerCase() === String(dietaIdOCliente).toLowerCase()));
  }

  if (!dieta) {
    showToast("No se encontró la pauta nutricional para compartir.", "warning", "Dieta no encontrada");
    return;
  }

  // 1. Mostrar estado de preparación y generación
  showToast("⏳ Generando PDF oficial de nutrición...", "info", "Generando PDF", 3000);

  // 2. Extraer teléfono del cliente registrado en la tabla clients de Supabase
  let telefono = await obtenerTelefonoCliente(dieta.cliente);

  if (!telefono) {
    const inputTel = prompt(`Ingresa el número de WhatsApp para ${dieta.cliente} (con código de país, ej: +5215512345678):`, "");
    if (inputTel === null) return;
    telefono = inputTel.trim();
    if (telefono) {
      const clienteObj = clientes.find(c => c.nombre === dieta.cliente);
      if (clienteObj) {
        clienteObj.telefono = telefono;
        persistirDatosUsuarioActual();
        sincronizarClienteConSupabase(clienteObj);
      }
    }
  }

  // 3. Generar y descargar el archivo PDF antes de disparar el enlace
  const pdfGenerado = generarPDFDieta(dieta, true);
  const nombreArchivo = `Plan_Nutricional_${String(dieta.cliente).replace(/\s+/g, '_')}.pdf`;

  await new Promise(resolve => setTimeout(resolve, 600));

  const cleanPhone = telefono.replace(/[^\d+]/g, '').replace('+', '');
  const coachName = sesionUsuarioActual?.user?.user_metadata?.full_name || 'Coach Master Pro';
  const gymName = getGimnasioActivo().nombre;

  const mensaje = `🥗 *FITPRO SUITE PRO — PAUTA NUTRICIONAL* 🥗\n\n` +
    `¡Hola *${dieta.cliente}*! 👋\n\n` +
    `Te comparto tu *Pauta de Nutrición y Macronutrientes* para tu objetivo de *${dieta.objetivo || 'Nutrición Personalizada'}* en *${gymName}*.\n\n` +
    `🔥 *Calorías Objetivo:* ${dieta.tdee || 2400} kcal/día\n` +
    `📊 *Macros Diarios:* Proteína: ${dieta.proteina || 160}g | Carbohidratos: ${dieta.carbo || 260}g | Grasas: ${dieta.grasa || 65}g\n\n` +
    `📄 *ARCHIVO PDF ADJUNTO:* \n` +
    `_He generado tu pauta completa en PDF con las 5 comidas estructuradas, gramajes de alimentos y recomendaciones de hidratación. Por favor descarga el archivo adjunto para revisarlo._\n\n` +
    `¡Seguimos con todo el enfoque! 🥑🥦\n` +
    `— *${coachName}* (${gymName})`;

  const waUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensaje)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;

  window.open(waUrl, '_blank');

  // 4. Mostrar modal intermedio con instrucción clara para adjuntar el archivo descargado
  abrirModalInstruccionWhatsApp(nombreArchivo, dieta.cliente, 'dieta');
  showToast("¡PDF generado y descargado con éxito! Se ha abierto el chat de WhatsApp. Por favor, arrastra o adjunta el archivo PDF recién descargado para enviarlo a tu atleta.", "success", "📲 WhatsApp & PDF Listo", 9000);
}

// ==========================================
// 📧 FUNCIONES DE ENVÍO POR CORREO ELECTRÓNICO (CON PDF ADJUNTO)
// ==========================================
async function obtenerEmailCliente(clienteNombre) {
  if (!clienteNombre) return '';

  const clienteLocal = clientes.find(c => c.nombre && c.nombre.toLowerCase() === String(clienteNombre).toLowerCase());
  if (clienteLocal && clienteLocal.email && String(clienteLocal.email).trim()) {
    return String(clienteLocal.email).trim();
  }

  if (supabaseClient && !sesionUsuarioActual?.esModoDemo) {
    try {
      const { data, error } = await supabaseClient
        .from('clients')
        .select('email, datos_completos')
        .ilike('nombre', clienteNombre)
        .limit(1);

      if (data && data.length > 0) {
        const mailDb = data[0].email || data[0].datos_completos?.email;
        if (mailDb && String(mailDb).trim()) {
          if (clienteLocal) clienteLocal.email = String(mailDb).trim();
          return String(mailDb).trim();
        }
      }
    } catch (err) {
      console.warn("Consulta email Supabase notice:", err);
    }
  }

  return clienteLocal?.email || '';
}

let datosEnvioEmailActual = {
  email: '',
  asunto: '',
  cuerpo: '',
  archivoNombre: '',
  tipo: 'plan'
};

function abrirModalEnvioEmail(email, asunto, cuerpo, archivoNombre, tipo = 'plan') {
  datosEnvioEmailActual = { email, asunto, cuerpo, archivoNombre, tipo };
  
  const m = document.getElementById('modal-envio-email');
  const destEl = document.getElementById('modal-email-destinatario');
  const asuntEl = document.getElementById('modal-email-asunto');
  const archEl = document.getElementById('modal-email-archivo-nombre');
  const titEl = document.getElementById('modal-email-titulo');

  if (destEl) destEl.innerText = email || 'atleta@ejemplo.com';
  if (asuntEl) asuntEl.innerText = asunto || 'Documento Oficial FitPro';
  if (archEl) archEl.innerText = archivoNombre || 'Documento.pdf';
  if (titEl) titEl.innerText = tipo === 'plan' ? '📧 Enviar Plan de Entrenamiento' : '📧 Enviar Pauta Nutricional';

  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
  }
}

function cerrarModalEnvioEmail() {
  const m = document.getElementById('modal-envio-email');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function abrirMailtoLimpio(email, subject, body) {
  if (!email) return;
  // Disparo seguro sin abrir ventanas emergentes en blanco
  const mailtoUri = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const link = document.createElement('a');
  link.href = mailtoUri;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
  }, 300);
}

function ejecutarEnvioMailtoDirecto() {
  const { email, asunto, cuerpo } = datosEnvioEmailActual;
  if (!email) return;
  abrirMailtoLimpio(email, asunto, cuerpo);
  showToast("Abriendo tu aplicación de correo predeterminada...", "info", "📧 Correo");
}

function abrirGmailWebDirecto() {
  const { email, asunto, cuerpo } = datosEnvioEmailActual;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  window.open(gmailUrl, '_blank');
  showToast("Abriendo redacción en Gmail Web...", "info", "🌐 Gmail");
}

function abrirOutlookWebDirecto() {
  const { email, asunto, cuerpo } = datosEnvioEmailActual;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  window.open(outlookUrl, '_blank');
  showToast("Abriendo redacción en Outlook Web...", "info", "🌐 Outlook");
}

function copiarMensajeEmailAlPortapapeles() {
  const { asunto, cuerpo, email } = datosEnvioEmailActual;
  const fullText = `Para: ${email}\nAsunto: ${asunto}\n\n${cuerpo}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText).then(() => {
      showToast("Texto del mensaje copiado al portapapeles.", "success", "📋 Copiado");
    }).catch(() => {
      copiarFallbackEmail(fullText);
    });
  } else {
    copiarFallbackEmail(fullText);
  }
}

function copiarFallbackEmail(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast("Texto del mensaje copiado al portapapeles.", "success", "📋 Copiado");
  } catch (err) {
    showToast("No se pudo copiar automáticamente.", "warning", "Aviso");
  }
  if (ta.parentNode) ta.parentNode.removeChild(ta);
}

async function enviarPlanPorEmail(planIdOCliente) {
  const plan = resolverPlanData(planIdOCliente);

  if (!plan) {
    showToast("No se encontró la información del plan de entrenamiento.", "warning", "Plan no encontrado");
    return;
  }

  showToast("⏳ Generando PDF oficial con jsPDF...", "info", "Generando Documento", 3000);

  let email = await obtenerEmailCliente(plan.cliente);

  if (!email || !email.includes('@')) {
    const inputEmail = prompt(`Ingresa el correo electrónico para ${plan.cliente}:`, "");
    if (inputEmail === null) return;
    email = inputEmail.trim();
    if (email && email.includes('@')) {
      const clienteObj = clientes.find(c => c.nombre === plan.cliente);
      if (clienteObj) {
        clienteObj.email = email;
        persistirDatosUsuarioActual();
        sincronizarClienteConSupabase(clienteObj);
      }
    } else {
      showToast("Por favor ingresa un correo electrónico válido.", "warning", "Email Inválido");
      return;
    }
  }

  // 1. Generar el PDF oficial y descargarlo en el equipo
  const doc = generarPDFPlan(plan, true);
  const nombreArchivo = `Plan_Entrenamiento_${String(plan.cliente).replace(/\s+/g, '_')}.pdf`;
  const coachName = sesionUsuarioActual?.user?.user_metadata?.full_name || 'Coach Master Pro';
  const gymName = getGimnasioActivo().nombre;

  // 2. Extraer archivo adjunto en formato DataURI / Base64 para EmailJS si está activo
  let pdfDataUri = "";
  if (doc && typeof doc.output === 'function') {
    try {
      pdfDataUri = doc.output('datauristring');
    } catch (e) {
      console.warn("Error generando base64 del PDF:", e);
    }
  }

  if (window.emailjs && typeof window.emailjs.send === 'function' && window.EMAILJS_SERVICE_ID) {
    try {
      window.emailjs.send(window.EMAILJS_SERVICE_ID, window.EMAILJS_TEMPLATE_ID || 'template_fitpro', {
        to_email: email,
        to_name: plan.cliente,
        coach_name: coachName,
        gym_name: gymName,
        plan_metodo: plan.metodo,
        plan_objetivo: plan.objetivo,
        pdf_attachment: pdfDataUri,
        filename: nombreArchivo
      }).catch(err => console.info("EmailJS cloud status:", err));
    } catch (err) {
      console.warn("EmailJS notice:", err);
    }
  }

  const asunto = `🏋️ Plan de Entrenamiento Oficial - ${plan.cliente} (${gymName})`;
  const cuerpo = 
    `¡Hola ${plan.cliente}!\n\n` +
    `Te comparto tu nuevo Plan de Entrenamiento prescrito para tu objetivo de ${plan.objetivo || 'Rendimiento'} en ${gymName}.\n\n` +
    `📋 Metodología: ${plan.metodo}\n` +
    `📅 Fecha de Prescripción: ${plan.fecha || new Date().toISOString().split('T')[0]}\n\n` +
    `📄 ARCHIVO PDF ADJUNTO:\n` +
    `He generado y descargado tu documento oficial en PDF "${nombreArchivo}" con todas las series, repeticiones, descansos y cadencias técnicas. Por favor adjúntalo a este correo para que tu atleta lo consulte.\n\n` +
    `¡A darlo todo en cada sesión! 🔥💪\n` +
    `— ${coachName} (${gymName})`;

  // 3. Abrir de inmediato el modal de opciones de correo sin pantallas en blanco
  abrirModalEnvioEmail(email, asunto, cuerpo, nombreArchivo, 'plan');
  
  // 4. Disparar cliente de correo predeterminado mediante enlace invisible
  abrirMailtoLimpio(email, asunto, cuerpo);
  
  showToast(`✅ PDF descargado y opciones de correo listas para ${email}.`, "success", "📧 Correo Listo", 6000);
}

const enviarPorEmail = enviarPlanPorEmail;

async function enviarDietaPorEmail(dietaIdOCliente) {
  let dieta = null;
  if (typeof dietaIdOCliente === 'object' && dietaIdOCliente !== null) {
    dieta = dietaIdOCliente;
  } else {
    dieta = dietasGuardadas.find(d => d.id === dietaIdOCliente || d.id == dietaIdOCliente || (d.cliente && d.cliente.toLowerCase() === String(dietaIdOCliente).toLowerCase()));
  }

  if (!dieta) {
    showToast("No se encontró la pauta nutricional para enviar.", "warning", "Dieta no encontrada");
    return;
  }

  showToast("⏳ Generando PDF oficial de nutrición...", "info", "Generando Documento", 3000);

  let email = await obtenerEmailCliente(dieta.cliente);

  if (!email || !email.includes('@')) {
    const inputEmail = prompt(`Ingresa el correo electrónico para ${dieta.cliente}:`, "");
    if (inputEmail === null) return;
    email = inputEmail.trim();
    if (email && email.includes('@')) {
      const clienteObj = clientes.find(c => c.nombre === dieta.cliente);
      if (clienteObj) {
        clienteObj.email = email;
        persistirDatosUsuarioActual();
        sincronizarClienteConSupabase(clienteObj);
      }
    } else {
      showToast("Por favor ingresa un correo electrónico válido.", "warning", "Email Inválido");
      return;
    }
  }

  // 1. Generar el PDF oficial y descargarlo
  generarPDFDieta(dieta, true);
  const nombreArchivo = `Plan_Nutricional_${String(dieta.cliente).replace(/\s+/g, '_')}.pdf`;
  const coachName = sesionUsuarioActual?.user?.user_metadata?.full_name || 'Coach Master Pro';
  const gymName = getGimnasioActivo().nombre;

  const asunto = `🥗 Pauta Nutricional & Macros - ${dieta.cliente} (${gymName})`;
  const cuerpo = 
    `¡Hola ${dieta.cliente}!\n\n` +
    `Te comparto tu Pauta Nutricional y distribución de macronutrientes para tu objetivo de ${dieta.objetivo || 'Nutrición Personalizada'} en ${gymName}.\n\n` +
    `🔥 Calorías Objetivo: ${dieta.tdee || 2400} kcal/día\n` +
    `📊 Macronutrientes: Proteína: ${dieta.proteina || 160}g | Carbohidratos: ${dieta.carbo || 260}g | Grasas: ${dieta.grasa || 65}g\n\n` +
    `📄 ARCHIVO PDF ADJUNTO:\n` +
    `He generado y descargado tu documento oficial en PDF "${nombreArchivo}" con los gramajes y comidas recomendadas.\n\n` +
    `¡A seguir con todo el enfoque! 🥑🥦\n` +
    `— ${coachName} (${gymName})`;

  abrirModalEnvioEmail(email, asunto, cuerpo, nombreArchivo, 'dieta');
  abrirMailtoLimpio(email, asunto, cuerpo);
  showToast(`✅ PDF nutricional descargado y opciones de correo listas para ${email}.`, "success", "📧 Correo Listo", 6000);
}

function eliminarPlan(id) {
  if (!confirm("¿Estás seguro de eliminar este plan de entrenamiento?")) return;
  planesGuardados = planesGuardados.filter(p => p.id !== id && p.id != id);
  persistirDatosUsuarioActual();
  renderPlanes();
  showToast("Plan eliminado del historial.", "info", "Plan Eliminado");
}

function eliminarDieta(id) {
  if (!confirm("¿Estás seguro de eliminar este plan nutricional?")) return;
  dietasGuardadas = dietasGuardadas.filter(d => d.id !== id && d.id != id);
  persistirDatosUsuarioActual();
  renderDietas();
  showToast("Plan nutricional eliminado.", "info", "Dieta Eliminada");
}

function renderPlanes() {
  const container = document.getElementById('plans-list-container');
  const dashPlans = document.getElementById('dash-recent-plans');

  const planesGym = getPlanesActivos();

  if (container) {
    if (planesGym.length === 0) {
      container.innerHTML = `<div style="grid-column: 1 / -1; background:var(--bg-surface); padding:24px; border-radius:var(--radius-md); text-align:center; color:var(--text-muted);">Sin planes prescritos en este gimnasio. Prescribe un plan desde el expediente del atleta.</div>`;
    } else {
      container.innerHTML = planesGym.map(p => `
        <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:18px; border-radius:var(--radius-md); display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <h3 style="font-size:16px; color:#fff; font-family:var(--font-heading); margin:0;">${p.cliente} — ${p.objetivo}</h3>
              <span style="font-size:12px; color:var(--text-muted);">${p.fecha}</span>
            </div>
            <div style="font-size:13px; color:var(--accent-green); margin-bottom:10px;">Metodología: ${p.metodo}</div>
            <div style="background:var(--bg-surface); padding:10px 14px; border-radius:var(--radius-sm); font-size:13px; color:var(--text-muted); margin-bottom:12px;">
              ${(Array.isArray(p.ejercicios) ? p.ejercicios : (p.ejercicios || '').split(' | ')).map(e => `• ${e}`).join('<br>')}
            </div>
          </div>

          <div style="border-top:1px solid var(--border-color); padding-top:10px; display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
            <button class="btn-primary" style="padding:6px 10px; font-size:11px; background:rgba(56,189,248,0.15); color:#38bdf8; border-color:#38bdf8;" onclick="enviarPlanPorEmail(${p.id})">📧 Correo</button>
            <button class="btn-secondary" style="padding:6px 10px; font-size:11px; color:#22c55e; border-color:#22c55e;" onclick="enviarPlanPorWhatsApp(${p.id})">📲 WhatsApp</button>
            <button class="btn-secondary" style="padding:6px 10px; font-size:11px; color:#a78bfa; border-color:#a78bfa;" onclick="generarPDFPlan(${p.id})">📄 PDF</button>
            <button class="btn-secondary danger" style="padding:6px 8px; font-size:11px;" onclick="eliminarPlan(${p.id})" title="Eliminar Plan">🗑️</button>
          </div>
        </div>
      `).join('');
    }
  }

  if (dashPlans) {
    if (planesGym.length === 0) {
      dashPlans.innerHTML = `<div style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px; background:var(--bg-surface); border-radius:var(--radius-sm);">No hay planes prescritos aún en esta sede.</div>`;
    } else {
      dashPlans.innerHTML = planesGym.slice(0, 3).map(p => `
        <div style="background:var(--bg-card); padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <div style="display:flex; justify-content:space-between;">
            <strong style="font-size:14px; color:#fff;">${p.cliente}</strong>
            <span style="font-size:11px; color:var(--accent-green);">${p.fecha}</span>
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${p.metodo}</div>
        </div>
      `).join('');
    }
  }

  renderDashboardStats();
}

// Advanced Combined Filters (Category + Equipment + Risk Level + Search Text)
let currentCategoria = 'todos';
let currentEquipamiento = 'todos';
let currentRiesgo = 'todos';
let currentSearchText = '';

function renderBiblioteca() {
  const grid = document.getElementById('library-grid');
  if (!grid) return;

  let filtrados = ejerciciosDB;

  if (currentCategoria !== 'todos') {
    filtrados = filtrados.filter(e => e.categoria === currentCategoria || (currentCategoria === 'piernas' && (e.categoria === 'cuadriceps' || e.categoria === 'isquiotibiales' || e.categoria === 'gluteos' || e.categoria === 'pantorrillas')) || (currentCategoria === 'brazos' && (e.categoria === 'biceps' || e.categoria === 'triceps')));
  }

  if (currentEquipamiento !== 'todos') {
    filtrados = filtrados.filter(e => e.equipamiento && e.equipamiento.toLowerCase().includes(currentEquipamiento.toLowerCase()));
  }

  if (currentRiesgo !== 'todos') {
    filtrados = filtrados.filter(e => e.riesgo === currentRiesgo);
  }

  if (currentSearchText.trim() !== '') {
    const q = currentSearchText.toLowerCase();
    filtrados = filtrados.filter(e => 
      e.nombre.toLowerCase().includes(q) || 
      (e.musculos && e.musculos.toLowerCase().includes(q)) || 
      (e.categoria && e.categoria.toLowerCase().includes(q)) ||
      (e.musculoPrimario && e.musculoPrimario.toLowerCase().includes(q)) ||
      (e.equipamiento && e.equipamiento.toLowerCase().includes(q))
    );
  }

  if (filtrados.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; background:var(--bg-surface); padding:36px; border-radius:var(--radius-lg); border:1px solid var(--border-color); text-align:center;">
        <div style="font-size:28px; margin-bottom:8px;">🔍</div>
        <h3 style="color:#fff; font-family:var(--font-heading); margin-bottom:4px;">Sin coincidencias</h3>
        <p style="color:var(--text-muted); font-size:14px; margin:0;">No se encontraron ejercicios con los filtros de músculo, equipamiento y riesgo seleccionados.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtrados.map(ej => {
    let badgeRiskClass = 'badge-risk-low';
    if (ej.riesgo === 'Moderado') badgeRiskClass = 'badge-risk-med';
    if (ej.riesgo === 'Alto') badgeRiskClass = 'badge-risk-high';

    const equipIcon = ej.equipamiento === 'Barra' ? '🏋️ Barra' :
                      ej.equipamiento === 'Mancuerna' ? '🔩 Mancuernas' :
                      ej.equipamiento === 'Polea' ? '⚙️ Polea' :
                      ej.equipamiento === 'Máquina' ? '🦾 Máquina' :
                      ej.equipamiento === 'Peso Corporal' ? '🤸 Peso Corporal' : '🎗️ Banda';

    const catIcon = ej.categoria === 'cuadriceps' ? '🦵 Cuádriceps' :
                    ej.categoria === 'isquiotibiales' ? '🦵 Isquiotibiales' :
                    ej.categoria === 'gluteos' ? '🍑 Glúteos' :
                    ej.categoria === 'pecho' ? '🛡️ Pecho' :
                    ej.categoria === 'espalda' ? '🦅 Espalda' :
                    ej.categoria === 'hombros' ? '💪 Hombros' :
                    ej.categoria === 'biceps' ? '💪 Bíceps' :
                    ej.categoria === 'triceps' ? '⚡ Tríceps' :
                    ej.categoria === 'core' ? '🧱 Core' : '🦶 Pantorrillas';

    return `
      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:20px; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s, box-shadow 0.2s;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='translateY(0)'">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:6px;">
            <div style="display:flex; gap:6px; align-items:center;">
              <span class="badge badge-primary" style="font-size:10px; text-transform:uppercase;">${catIcon}</span>
              <span class="badge badge-green" style="font-size:10px;">${equipIcon}</span>
            </div>
            <span class="badge ${badgeRiskClass}" style="font-size:10px;">Riesgo ${ej.riesgo}</span>
          </div>

          <h3 style="color:#fff; margin:0 0 8px 0; font-size:16px; font-family:var(--font-heading); line-height:1.3;">${ej.nombre}</h3>
          
          <div style="font-size:12px; color:#38bdf8; font-weight:600; margin-bottom:12px;">
            🎯 Enfoque: ${ej.musculoPrimario || ej.categoria}
          </div>
        </div>

        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-md); font-size:12px; border:1px solid var(--border-color);">
          <p style="color:#e4e4e7; margin:0 0 6px 0; line-height:1.4;">
            <strong style="color:var(--accent-green);">Anatomía:</strong> ${ej.musculos}
          </p>
          <p style="color:var(--text-muted); margin:0; font-size:11px; line-height:1.4;">
            <strong style="color:#fbbf24;">Técnica:</strong> ${ej.ejecucion}
          </p>
        </div>
      </div>
    `;
  }).join('');
}

function filtrarBiblioteca(cat, btn) {
  document.querySelectorAll('#library-filters .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentCategoria = cat;
  renderBiblioteca();
}

function filtrarEquipamiento(eq, btn) {
  document.querySelectorAll('#equipment-filters .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentEquipamiento = eq;
  renderBiblioteca();
}

function filtrarRiesgo(riesgoLevel, btn) {
  document.querySelectorAll('#risk-filters .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  currentRiesgo = riesgoLevel;
  renderBiblioteca();
}

function filtrarBibliotecaTexto(val) {
  currentSearchText = val;
  renderBiblioteca();
}

// Scientific Supplements
function renderSuplementos() {
  const grid = document.getElementById('supplements-grid');
  if (!grid) return;

  grid.innerHTML = suplementosDB.map(s => `
    <div class="card" style="margin-bottom:0;">
      <span class="badge badge-green" style="margin-bottom:10px;">${s.evidencia}</span>
      <h3 style="color:var(--accent-green); font-family:var(--font-heading); margin-bottom:8px; font-size:18px;">${s.nombre}</h3>
      <p style="color:#fff; font-size:13px; margin-bottom:8px;"><strong>Dosis recomendada:</strong> ${s.dosis}</p>
      <p style="color:var(--text-muted); font-size:13px; margin:0;">${s.beneficio}</p>
    </div>
  `).join('');
}

// Injury Rehabilitation Tracker
function abrirModalLesion() {
  const selectCliente = document.getElementById('modal-lesion-cliente');
  if (selectCliente) {
    selectCliente.innerHTML = getClientesActivos().map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
  }
  document.getElementById('modal-lesion').classList.remove('hidden');
}

function cerrarModalLesion() {
  document.getElementById('modal-lesion').classList.add('hidden');
}

function guardarLesion() {
  const clienteSelect = document.getElementById('modal-lesion-cliente');
  const cliente = sanitizeText(clienteSelect ? clienteSelect.value : '', 80);
  const condicionInput = document.getElementById('modal-lesion-condicion');
  const condicion = sanitizeText(condicionInput ? condicionInput.value : '', 120);
  const zonaArticular = sanitizeText(document.getElementById('modal-lesion-zona')?.value || 'otro', 40);
  const dolorEva = sanitizeNumber(document.getElementById('modal-lesion-eva')?.value, 4, 1, 10);
  const severidad = sanitizeText(document.getElementById('modal-lesion-severidad')?.value || 'moderada', 30);
  const contraindicadosInput = document.getElementById('modal-lesion-contraindicados');
  const contraindicados = contraindicadosInput && contraindicadosInput.value.trim() 
    ? contraindicadosInput.value.split(',').map(s => sanitizeText(s, 60)).filter(Boolean)
    : [];
  const recomendacionesInput = document.getElementById('modal-lesion-recomendaciones');
  const recomendaciones = sanitizeText(recomendacionesInput?.value || 'Modificación biomecánica y supervisión articular activa.', 300);

  if (!cliente || !condicion) {
    showToast("Por favor selecciona un atleta e ingresa la condición médica o diagnóstico.", "warning", "Datos Incompletos");
    return;
  }

  const nuevaLesion = {
    id: Date.now(),
    gym_id: gimnasioActivoId,
    cliente,
    condicion,
    zonaArticular,
    dolorEva,
    severidad,
    estado: "En Tratamiento Clínico",
    contraindicaciones: contraindicados.length > 0 ? contraindicados : undefined,
    recomendaciones
  };

  lesionesDB.unshift(nuevaLesion);
  localStorage.setItem('fitpro_lesiones', JSON.stringify(lesionesDB));

  renderLesiones();
  cerrarModalLesion();

  if (condicionInput) condicionInput.value = '';
  if (contraindicadosInput) contraindicadosInput.value = '';
  if (recomendacionesInput) recomendacionesInput.value = '';
}

let filtroLesionesZonaActual = 'todas';
let filtroLesionesTextoActual = '';

function filtrarLesionesZona(zona, btn) {
  filtroLesionesZonaActual = zona;
  document.querySelectorAll('#injuries-zone-filters .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLesiones();
}

function filtrarLesionesTexto(txt) {
  filtroLesionesTextoActual = txt;
  renderLesiones();
}

function actualizarTextoLesionEva(val) {
  const lbl = document.getElementById('lbl-lesion-eva');
  if (!lbl) return;
  const num = parseInt(val) || 1;
  if (num <= 2) {
    lbl.innerText = `${num} / 10 (Dolor Leve)`;
    lbl.style.color = '#4ade80';
  } else if (num <= 5) {
    lbl.innerText = `${num} / 10 (Dolor Moderado)`;
    lbl.style.color = '#fbbf24';
  } else {
    lbl.innerText = `${num} / 10 (Dolor Severo)`;
    lbl.style.color = '#f87171';
  }
}

function renderLesiones() {
  const grid = document.getElementById('injuries-list');
  if (!grid) return;

  const lesionesGym = getLesionesActivas();

  const filtradas = lesionesGym.filter(l => {
    const cumpleZona = filtroLesionesZonaActual === 'todas' || (l.zonaArticular && l.zonaArticular.toLowerCase() === filtroLesionesZonaActual.toLowerCase()) || l.condicion.toLowerCase().includes(filtroLesionesZonaActual.toLowerCase());
    const q = (filtroLesionesTextoActual || '').toLowerCase().trim();
    const cumpleTexto = !q || l.cliente.toLowerCase().includes(q) || l.condicion.toLowerCase().includes(q) || (l.recomendaciones && l.recomendaciones.toLowerCase().includes(q));
    return cumpleZona && cumpleTexto;
  });

  if (filtradas.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; background:var(--bg-surface); padding:32px; border-radius:var(--radius-lg); border:1px solid var(--border-color); text-align:center;">
        <div style="font-size:28px; margin-bottom:8px;">🩺</div>
        <h3 style="color:#fff; font-family:var(--font-heading); margin-bottom:4px;">Sin lesiones registradas en esta categoría</h3>
        <p style="color:var(--text-muted); font-size:14px; margin:0;">No se encontraron afecciones articulares con los filtros seleccionados.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtradas.map(l => {
    let badgeClass = 'badge-yellow';
    if (l.severidad === 'severa') badgeClass = 'badge-red';
    if (l.severidad === 'leve') badgeClass = 'badge-green';

    const eva = l.dolorEva || (l.severidad === 'severa' ? 7 : l.severidad === 'moderada' ? 4 : 2);
    const colorEva = eva <= 2 ? '#4ade80' : eva <= 5 ? '#fbbf24' : '#f87171';
    const bgEva = eva <= 2 ? 'rgba(74, 222, 128, 0.12)' : eva <= 5 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(239, 68, 68, 0.15)';
    const zonaIcon = l.zonaArticular === 'columna' ? '🦴 Columna' : l.zonaArticular === 'rodilla' ? '🦵 Rodilla' : l.zonaArticular === 'hombro' ? '💪 Hombro' : l.zonaArticular === 'cadera' ? '🩻 Cadera' : '🩹 Articular';

    const contraindicados = l.contraindicaciones || (
      l.zonaArticular === 'columna' || l.condicion.toLowerCase().includes('lumb') ? ["Sentadillas Libres", "Peso Muerto", "Remo 90°"] :
      l.zonaArticular === 'rodilla' || l.condicion.toLowerCase().includes('rotul') || l.condicion.toLowerCase().includes('artrosis') ? ["Extensión en Máquina Pesada", "Sentadilla Profunda >90°", "Pliometría"] :
      ["Press Trasnuca", "Elevaciones con Rotación Interna", "Fondos Profundos"]
    );

    const sustitutos = l.ejerciciosSustitutos || (
      l.zonaArticular === 'columna' || l.condicion.toLowerCase().includes('lumb') ? ["Prensa 45° Guiada", "Bird-Dog Isométrico", "Jalón al Pecho Neutro"] :
      l.zonaArticular === 'rodilla' || l.condicion.toLowerCase().includes('rotul') || l.condicion.toLowerCase().includes('artrosis') ? ["Sit-to-Stand / Box Squat", "Prensa 45° a 90°", "Puente de Glúteo"] :
      ["Press Inclinado con Mancuernas (30°)", "Face-Pulls", "Band Pull-Aparts"]
    );

    const docsAdjuntos = archivosMedicosDB.filter(d => d.cliente === l.cliente);

    return `
      <div class="card" style="margin-bottom:0; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='translateY(0)'">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
            <div>
              <strong style="font-size:16px; color:#fff;">${l.cliente}</strong>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Zona: <span style="color:#38bdf8; font-weight:600;">${zonaIcon}</span></div>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
              <span class="badge ${badgeClass}">${l.estado || 'En Tratamiento'}</span>
            </div>
          </div>

          <div style="color:#f87171; font-weight:700; font-size:14px; margin-bottom:8px;">🚑 ${l.condicion}</div>

          <!-- ESCALA DE DOLOR VAS / EVA -->
          <div style="background:${bgEva}; border:1px solid ${colorEva}; padding:8px 12px; border-radius:var(--radius-sm); margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; color:#fff; font-weight:600;">Escala de Dolor (VAS):</span>
            <strong style="color:${colorEva}; font-size:13px;">${eva} / 10 (${eva <= 2 ? 'Leve' : eva <= 5 ? 'Moderado' : 'Severo'})</strong>
          </div>

          <!-- PROTOCOLO DE RESTRICCIONES AUTOMÁTICAS -->
          <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:12px; font-size:12px;">
            <div style="color:#f87171; font-weight:700; margin-bottom:4px;">🚫 Ejercicios Contraindicados:</div>
            <div style="color:var(--text-muted); margin-bottom:8px; line-height:1.4;">
              ${contraindicados.map(c => `<span style="display:inline-block; background:rgba(239, 68, 68, 0.1); color:#fca5a5; padding:2px 6px; border-radius:3px; margin:2px 3px 2px 0;">✕ ${c}</span>`).join('')}
            </div>

            <div style="color:#4ade80; font-weight:700; margin-bottom:4px;">✅ Sustitutos Biomecánicos Seguros:</div>
            <div style="color:var(--text-muted); line-height:1.4;">
              ${sustitutos.map(s => `<span style="display:inline-block; background:rgba(74, 222, 128, 0.1); color:#86efac; padding:2px 6px; border-radius:3px; margin:2px 3px 2px 0;">✓ ${s}</span>`).join('')}
            </div>
          </div>

          <!-- DICTÁMENES MÉDICOS ASOCIADOS -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(56, 189, 248, 0.06); border:1px solid rgba(56, 189, 248, 0.2); padding:8px 12px; border-radius:var(--radius-sm); margin-bottom:12px;">
            <div style="font-size:12px; color:#fff;">
              📁 <strong style="color:#38bdf8;">${docsAdjuntos.length}</strong> ${docsAdjuntos.length === 1 ? 'Dictamen Adjunto' : 'Dictámenes Adjuntos'}
            </div>
            <button class="btn-secondary" style="font-size:11px; padding:4px 8px; color:#38bdf8; border-color:#38bdf8;" onclick="abrirModalSubirDictamen('${l.cliente}', '${l.condicion}')">+ Adjuntar</button>
          </div>

          <p style="color:var(--text-muted); font-size:12px; margin:0 0 14px 0; line-height:1.4;">
            📝 <strong>Pauta Clínica:</strong> ${l.recomendaciones}
          </p>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:10px; display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <div style="display:flex; gap:6px;">
            <button class="btn-secondary" style="font-size:11px; padding:5px 10px; color:#38bdf8; border-color:#38bdf8;" onclick="abrirBitacoraClinica('${l.cliente}')">🩺 Bitácora</button>
            <button class="btn-secondary" style="font-size:11px; padding:5px 10px;" onclick="abrirModalSubirDictamen('${l.cliente}', '${l.condicion}')">📁 Subir Dictamen</button>
          </div>
          <button class="btn-primary" style="font-size:11px; padding:5px 10px;" onclick="generarEntrenamientoParaCliente('${l.cliente}')">⚡ Prescribir Rutina</button>
        </div>
      </div>
    `;
  }).join('');
}

// Medical Documents & Clinical Files Management
let archivoMedicoTemporalData = null;
let archivoMedicoTemporalNombre = '';
let archivoMedicoTemporalTipo = '';
let archivoMedicoTemporalTamano = '';

function procesarArchivoMedicoSeleccionado(input) {
  const file = input.files && input.files[0];
  const statusEl = document.getElementById('modal-doc-file-status');
  if (!file) {
    archivoMedicoTemporalData = null;
    return;
  }

  archivoMedicoTemporalNombre = file.name;
  archivoMedicoTemporalTipo = file.type || 'application/pdf';
  archivoMedicoTemporalTamano = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

  const reader = new FileReader();
  reader.onload = function(e) {
    archivoMedicoTemporalData = e.target.result;
    if (statusEl) {
      statusEl.innerHTML = `✅ <strong style="color:var(--accent-green);">${file.name}</strong> (${archivoMedicoTemporalTamano}) cargado y listo para respaldar.`;
    }
  };
  reader.readAsDataURL(file);
}

function abrirModalSubirDictamen(clienteNombre = '', condicion = '') {
  const selectCliente = document.getElementById('modal-doc-cliente');
  const tituloInput = document.getElementById('modal-doc-titulo');
  const fechaInput = document.getElementById('modal-doc-fecha');
  const statusEl = document.getElementById('modal-doc-file-status');
  const fileInput = document.getElementById('modal-doc-file');

  if (selectCliente) {
    selectCliente.innerHTML = clientes.map(c => `<option value="${c.nombre}">${c.nombre} (${c.edad || 28} años - ${c.objetivo})</option>`).join('');
    if (clienteNombre) selectCliente.value = clienteNombre;
  }

  if (tituloInput && condicion) {
    tituloInput.value = `Dictamen Clínico: ${condicion}`;
  } else if (tituloInput) {
    tituloInput.value = '';
  }

  if (fechaInput) {
    fechaInput.value = new Date().toISOString().split('T')[0];
  }

  if (fileInput) fileInput.value = '';
  if (statusEl) statusEl.innerText = 'Formatos admitidos: PDF, JPG, PNG, WEBP, DOCX (Hasta 25MB)';
  archivoMedicoTemporalData = null;

  const m = document.getElementById('modal-subir-dictamen');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
    m.style.zIndex = '9999';
  }
}

function cerrarModalSubirDictamen() {
  const m = document.getElementById('modal-subir-dictamen');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function guardarDocumentoMedico() {
  const clienteSelect = document.getElementById('modal-doc-cliente');
  const cliente = sanitizeText(clienteSelect ? clienteSelect.value : '', 80);
  const tipo = sanitizeText(document.getElementById('modal-doc-tipo')?.value || 'Informe Traumatológico', 60);
  const titulo = sanitizeText(document.getElementById('modal-doc-titulo')?.value || 'Estudio Clínico & Diagnóstico', 120);
  const fecha = document.getElementById('modal-doc-fecha')?.value || new Date().toISOString().split('T')[0];
  const medico = sanitizeText(document.getElementById('modal-doc-medico')?.value || 'Médico Especialista Colegiado', 80);
  const notas = sanitizeText(document.getElementById('modal-doc-notas')?.value || 'Pautas de entrenamiento aprobadas bajo supervisión biomecánica.', 500);
  const restriccionActiva = document.getElementById('modal-doc-restriccion')?.checked ?? true;

  if (!cliente || !titulo) {
    showToast("Por favor selecciona un cliente e ingresa el título o diagnóstico del estudio.", "warning", "Datos Incompletos");
    return;
  }

  const userId = getUsuarioActualId() || 'demo_coach';
  const nuevoDoc = {
    id: Date.now(),
    user_id: userId,
    cliente,
    tipo,
    titulo,
    fecha,
    medicoEspecialista: medico,
    archivoNombre: sanitizeText(archivoMedicoTemporalNombre, 100) || `dictamen_${Date.now()}.pdf`,
    archivoTipo: archivoMedicoTemporalTipo || 'application/pdf',
    archivoTamano: archivoMedicoTemporalTamano || '1.2 MB',
    archivoData: archivoMedicoTemporalData,
    notas,
    restriccionActiva
  };

  archivosMedicosDB.unshift(nuevoDoc);
  persistirDatosUsuarioActual();

  cerrarModalSubirDictamen();
  renderLesiones();
  renderSeniorsList();

  showToast(`Dictamen médico "${titulo}" registrado y respaldado exitosamente para ${cliente}.`, "success", "📁 Dictamen Guardado");

  const mDetalle = document.getElementById('modal-cliente-detalle');
  if (mDetalle && !mDetalle.classList.contains('hidden')) {
    const cliObj = clientes.find(c => c.nombre === cliente);
    if (cliObj) abrirDetalleCliente(cliObj.id);
  }
}

function abrirVisorDocumento(id) {
  const doc = archivosMedicosDB.find(d => d.id == id);
  if (!doc) return;

  const modalTitulo = document.getElementById('modal-visor-doc-titulo');
  const modalBody = document.getElementById('modal-visor-doc-body');

  if (modalTitulo) modalTitulo.innerText = `Visor de Documento: ${doc.titulo}`;

  if (modalBody) {
    const isImage = doc.archivoTipo && doc.archivoTipo.startsWith('image');
    const hasData = !!doc.archivoData;

    modalBody.innerHTML = `
      <!-- ENCABEZADO HOSPITALARIO / CLÍNICO -->
      <div style="background:linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(34, 197, 94, 0.15)); border:1px solid rgba(56, 189, 248, 0.3); border-radius:var(--radius-md); padding:18px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
          <div>
            <span class="badge badge-green" style="font-size:12px; margin-bottom:6px;">${doc.tipo}</span>
            <h3 style="color:#fff; font-size:20px; font-family:var(--font-heading); margin:4px 0;">${doc.titulo}</h3>
            <div style="font-size:13px; color:var(--text-muted);">🏥 Especialista: <strong style="color:#38bdf8;">${doc.medicoEspecialista}</strong></div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px; color:#fff; font-weight:600;">📅 Fecha: ${doc.fecha}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Atleta: <strong style="color:#fff;">${doc.cliente}</strong></div>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; font-size:12px; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
          <span>📎 Archivo: <strong style="color:#fff;">${doc.archivoNombre}</strong> (${doc.archivoTamano || '1.5 MB'})</span>
          <span>•</span>
          <span>Restricción Biomecánica: <strong style="color:${doc.restriccionActiva ? '#f87171' : '#4ade80'};">${doc.restriccionActiva ? '⚠️ ACTIVA' : '✅ LIBERADA'}</strong></span>
        </div>
      </div>

      <!-- VISUALIZADOR DE CONTENIDO MÉDICO -->
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:20px; margin-bottom:20px;">
        <h4 style="color:#38bdf8; font-family:var(--font-heading); margin:0 0 12px 0; font-size:16px;">🔬 Diagnóstico y Conclusiones del Médico Especialista</h4>
        
        <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-sm); border-left:4px solid #38bdf8; color:#e4e4e7; font-size:13px; line-height:1.6; margin-bottom:16px;">
          ${doc.notas}
        </div>

        ${isImage && hasData ? `
          <div style="text-align:center; background:#000; padding:12px; border-radius:var(--radius-sm); margin-bottom:16px;">
            <img src="${doc.archivoData}" alt="${doc.titulo}" style="max-width:100%; max-height:400px; border-radius:var(--radius-sm); object-fit:contain;">
          </div>
        ` : `
          <!-- DOCUMENTO DIGITALIZADO CON SELLO -->
          <div style="border:1px dashed rgba(56, 189, 248, 0.4); background:rgba(0,0,0,0.25); border-radius:var(--radius-sm); padding:20px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
              <span style="font-size:12px; color:var(--text-muted);">CERTIFICADO DE ADMISIÓN CLÍNICA Y READAPTACIÓN FÍSICA</span>
              <span style="font-size:11px; color:#4ade80; font-weight:700;">DOCUMENTO DIGITAL AUDITADO</span>
            </div>
            <div style="font-size:13px; color:#fff; line-height:1.5;">
              Por medio del presente documento, se hace constar que el paciente <strong>${doc.cliente}</strong> ha sido evaluado en consulta especializada con relación al diagnóstico de <strong>${doc.titulo}</strong>. Se aprueba la continuación de su plan de acondicionamiento físico y readaptación funcional bajo las consideraciones y vectores de descarga detallados en el expediente.
            </div>
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px; font-size:12px; color:var(--text-muted);">
              <div>
                <div>Emitido por: <strong>${doc.medicoEspecialista}</strong></div>
                <div>Firma y Cédula Profesional Digital: <strong>CP-8492048-MED</strong></div>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-green" style="font-size:11px;">VERIFICADO FITPRO SUITE</span>
              </div>
            </div>
          </div>
        `}
      </div>

      <!-- BOTONES DE ACCIÓN -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:16px; flex-wrap:wrap; gap:10px;">
        <button class="btn-secondary" onclick="cerrarVisorDocumento()">Cerrar Visor</button>
        <div style="display:flex; gap:10px;">
          <button class="btn-secondary" style="color:#38bdf8; border-color:#38bdf8;" onclick="imprimirDocumentoMedico(${doc.id})">🖨️ Imprimir / Guardar Copia</button>
          <button class="btn-primary" onclick="cerrarVisorDocumento(); generarEntrenamientoParaCliente('${doc.cliente}')">⚡ Prescribir Rutina con este Dictamen</button>
        </div>
      </div>
    `;
  }

  const m = document.getElementById('modal-visor-documento');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
    m.style.zIndex = '9999';
  }
}

function cerrarVisorDocumento() {
  const m = document.getElementById('modal-visor-documento');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function imprimirDocumentoMedico(id) {
  const doc = archivosMedicosDB.find(d => d.id == id);
  if (!doc) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast("Por favor permite las ventanas emergentes para imprimir el dictamen médico.", "warning", "Ventana Emergente Bloqueada");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dictamen Médico - ${doc.cliente}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.6; }
        .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
        .hosp-title { font-size: 22px; font-weight: bold; color: #0284c7; }
        .doc-meta { margin-bottom: 20px; background: #f0f9ff; padding: 15px; border-radius: 6px; }
        .section-title { font-size: 16px; font-weight: bold; margin-top: 20px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .sign-box { border-top: 1px solid #000; width: 220px; text-align: center; padding-top: 5px; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="hosp-title">FITPRO SUITE PRO - EXPEDIENTE CLÍNICO DEPORTIVO</div>
          <div>CENTRO DE EVALUACIÓN BIOMECÁNICA Y READAPTACIÓN FUNCIONAL</div>
        </div>
        <div style="text-align:right;">
          <div><strong>Fecha:</strong> ${doc.fecha}</div>
          <div><strong>ID:</strong> #${doc.id}</div>
        </div>
      </div>

      <div class="doc-meta">
        <div><strong>Atleta / Paciente:</strong> ${doc.cliente}</div>
        <div><strong>Tipo de Documento:</strong> ${doc.tipo}</div>
        <div><strong>Título del Estudio:</strong> ${doc.titulo}</div>
        <div><strong>Médico Especialista:</strong> ${doc.medicoEspecialista}</div>
      </div>

      <div class="section-title">CONCLUSIONES CLÍNICAS & PAUTAS DE ENTRENAMIENTO:</div>
      <p style="font-size:14px; margin-top:10px;">${doc.notas}</p>

      <div class="section-title">RESTRICCIONES Y SEGURIDAD BIOMECÁNICA:</div>
      <p style="font-size:14px; margin-top:10px;">
        ${doc.restriccionActiva 
          ? "⚠️ ALERTA CLÍNICA: Se restringen movimientos de alta compresión axial y cizallamiento articular en el motor de prescripción de ejercicios." 
          : "✅ AUTORIZADO: Paciente apto para cargas progresivas en rango completo de movimiento."}
      </p>

      <div class="signature">
        <div class="sign-box">
          Firma del Especialista<br>
          <strong>${doc.medicoEspecialista}</strong>
        </div>
        <div class="sign-box">
          Firma del Entrenador / Readaptador<br>
          <strong>Coach Pro (FitPro Master)</strong>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

// Financial Module
function abrirModalNuevoPago(clienteNombre = '') {
  const select = document.getElementById('pago-cliente-select');
  const fechaInput = document.getElementById('pago-fecha');

  if (select) {
    select.innerHTML = getClientesActivos().map(c => `<option value="${c.nombre}">${c.nombre} (${c.objetivo})</option>`).join('');
    if (clienteNombre) select.value = clienteNombre;
  }

  if (fechaInput) {
    fechaInput.value = new Date().toISOString().split('T')[0];
  }

  document.getElementById('modal-pago').classList.remove('hidden');
}

function cerrarModalNuevoPago() {
  document.getElementById('modal-pago').classList.add('hidden');
}

function guardarNuevoPago() {
  const clienteSelect = document.getElementById('pago-cliente-select');
  const clienteNombre = sanitizeText(clienteSelect ? clienteSelect.value : '', 80);
  const concepto = sanitizeText(document.getElementById('pago-concepto')?.value || 'Membresía Mensual', 80);
  const monto = sanitizeNumber(document.getElementById('pago-monto')?.value, 0, 0, 1000000);
  const metodo = sanitizeText(document.getElementById('pago-metodo')?.value || 'Tarjeta de Crédito', 40);
  const estado = sanitizeText(document.getElementById('pago-estado')?.value || 'pagado', 20);
  const fecha = document.getElementById('pago-fecha')?.value || new Date().toISOString().split('T')[0];
  const userId = getUsuarioActualId() || 'demo_coach';

  if (!clienteNombre || monto <= 0) {
    showToast("Por favor selecciona un atleta e ingresa un monto válido mayor a 0.", "warning", "Datos Incompletos");
    return;
  }

  const nuevaTransaccion = {
    id: Date.now(),
    user_id: userId,
    gym_id: gimnasioActivoId,
    cliente: clienteNombre,
    concepto,
    monto,
    metodo,
    estado: estado === 'pagado' ? 'Pagado' : estado === 'pendiente' ? 'Pendiente' : 'Atrasado',
    fecha
  };

  transaccionesFinancieras.unshift(nuevaTransaccion);
  persistirDatosUsuarioActual();

  // Sync to Supabase Cloud finances table
  if (supabaseClient && userId && !sesionUsuarioActual?.esModoDemo) {
    supabaseClient.from('finances').upsert({
      id: nuevaTransaccion.id,
      user_id: userId,
      gym_id: gimnasioActivoId,
      cliente: clienteNombre,
      concepto,
      monto,
      metodo,
      estado: nuevaTransaccion.estado,
      fecha,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.warn("Supabase finances sync error:", error.message);
    });
  }

  // Sync client membership state if paid
  if (estado === 'pagado') {
    const clienteObj = clientes.find(c => c.nombre === clienteNombre);
    if (clienteObj) {
      clienteObj.estadoMembresia = 'activa';
      persistirDatosUsuarioActual();
      sincronizarClienteConSupabase(clienteObj);
    }
  }

  renderFinanzas();
  renderClientes();
  renderAlertasProactivas();
  cerrarModalNuevoPago();

  showToast(`Pago de $${monto.toFixed(2)} registrado exitosamente para ${clienteNombre}.`, "success", "💳 Pago Registrado");
}

function renderFinanzas() {
  const tbody = document.getElementById('table-finances-body');
  const statTotal = document.getElementById('stat-fin-total');
  const statPendiente = document.getElementById('stat-fin-pendiente');
  const statPendCount = document.getElementById('stat-fin-pend-count');
  const statMrr = document.getElementById('stat-fin-mrr');
  const statEfectividad = document.getElementById('stat-fin-efectividad');

  const transaccionesGym = getFinanzasActivas();

  let cobrado = 0;
  let pendiente = 0;
  let pendCount = 0;

  transaccionesGym.forEach(t => {
    if (t.estado === 'Pagado') {
      cobrado += (Number(t.monto) || 0);
    } else {
      pendiente += (Number(t.monto) || 0);
      pendCount++;
    }
  });

  const totalCount = transaccionesGym.length;
  const pagadoCount = transaccionesGym.filter(t => t.estado === 'Pagado').length;
  const efectividad = totalCount > 0 ? ((pagadoCount / totalCount) * 100).toFixed(1) : '100.0';
  const mrr = cobrado;

  if (statTotal) statTotal.innerText = `$${cobrado.toFixed(2)}`;
  if (statPendiente) statPendiente.innerText = `$${pendiente.toFixed(2)}`;
  if (statPendCount) statPendCount.innerText = `(${pendCount} Pendientes)`;
  if (statMrr) statMrr.innerText = `$${mrr.toFixed(2)}`;
  if (statEfectividad) statEfectividad.innerText = `${efectividad}%`;

  if (tbody) {
    if (transaccionesGym.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted); font-size:13px;">No hay registros financieros en esta sede aún. Registra pagos con "+ Nuevo Pago".</td></tr>`;
    } else {
      tbody.innerHTML = transaccionesGym.map(f => {
        const badgeClass = f.estado === 'Pagado' ? 'badge-green' : f.estado === 'Pendiente' ? 'badge-risk-med' : 'badge-danger';

        return `
          <tr>
            <td><strong style="color:#fff;">${f.cliente}</strong></td>
            <td style="color:var(--text-muted); font-size:13px;">${f.concepto}</td>
            <td style="color:var(--text-muted); font-size:13px;">${f.fecha}</td>
            <td style="font-weight:700; color:var(--accent-green);">$${Number(f.monto || 0).toFixed(2)}</td>
            <td style="font-size:12px; color:var(--text-muted);">${f.metodo || 'Transferencia'}</td>
            <td><span class="badge ${badgeClass}">${f.estado}</span></td>
            <td>
              <button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="alternarEstadoPago(${f.id})">
                ${f.estado === 'Pagado' ? 'Marcar Pendiente' : '🟢 Marcar Pagado'}
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  renderDashboardStats();
}

function alternarEstadoPago(id) {
  const t = transaccionesFinancieras.find(x => x.id === id);
  if (!t) return;

  t.estado = t.estado === 'Pagado' ? 'Pendiente' : 'Pagado';
  
  if (t.estado === 'Pagado') {
    const clienteObj = clientes.find(c => c.nombre === t.cliente);
    if (clienteObj) {
      clienteObj.estadoMembresia = 'activa';
      localStorage.setItem('fitpro_clientes', JSON.stringify(clientes));
    }
  }

  localStorage.setItem('fitpro_finanzas', JSON.stringify(transaccionesFinancieras));
  renderFinanzas();
  renderClientes();
  renderAlertasProactivas();
}

// Interactive Dashboard Stat Modals & Deep Analytics
function abrirDetalleStat(tipo) {
  const title = document.getElementById('modal-stat-title');
  const body = document.getElementById('modal-stat-body');

  if (!title || !body) return;

  if (tipo === 'clientes') {
    title.innerHTML = `👥 Análisis de Cartera de Clientes Activos`;
    body.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px;">
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:var(--accent-green); font-family:var(--font-heading);">${clientes.length}</div>
          <div style="font-size:12px; color:var(--text-muted);">Atletas Activos</div>
        </div>
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:#4ade80; font-family:var(--font-heading);">96%</div>
          <div style="font-size:12px; color:var(--text-muted);">Tasa de Retención</div>
        </div>
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:#60a5fa; font-family:var(--font-heading);">4%</div>
          <div style="font-size:12px; color:var(--text-muted);">Tasa de Churn</div>
        </div>
      </div>

      <h4 style="color:#fff; font-family:var(--font-heading); margin-bottom:12px;">Distribución por Nivel de Experiencia:</h4>
      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; font-size:13px;">
          <span>Avanzado (+3 años)</span><strong style="color:var(--accent-green);">50%</strong>
        </div>
        <div style="background:#27272a; height:8px; border-radius:4px; margin-bottom:14px; overflow:hidden;">
          <div style="background:var(--accent-green); width:50%; height:100%;"></div>
        </div>
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; font-size:13px;">
          <span>Intermedio (1-3 años)</span><strong style="color:#60a5fa;">30%</strong>
        </div>
        <div style="background:#27272a; height:8px; border-radius:4px; margin-bottom:14px; overflow:hidden;">
          <div style="background:#60a5fa; width:30%; height:100%;"></div>
        </div>
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; font-size:13px;">
          <span>Principiante (0-1 años)</span><strong style="color:#fbbf24;">20%</strong>
        </div>
        <div style="background:#27272a; height:8px; border-radius:4px; overflow:hidden;">
          <div style="background:#fbbf24; width:20%; height:100%;"></div>
        </div>
      </div>

      <h4 style="color:#fff; font-family:var(--font-heading); margin-bottom:12px;">Listado de Atletas:</h4>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${clientes.map(c => `
          <div style="background:var(--bg-card); padding:10px 14px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:#fff; font-size:14px;">${c.nombre}</strong>
              <div style="color:var(--text-muted); font-size:12px;">${c.objetivo} • ${c.nivel || 'Atleta'}</div>
            </div>
            <span class="badge badge-green">${c.adherencia || '90%'}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tipo === 'ingresos') {
    title.innerHTML = `💰 Desglose Financiero y Recaudación Mensual`;
    body.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px;">
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:var(--accent-green); font-family:var(--font-heading);">$2,450.00</div>
          <div style="font-size:12px; color:var(--text-muted);">Recaudado (MRR)</div>
        </div>
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:#fbbf24; font-family:var(--font-heading);">$450.00</div>
          <div style="font-size:12px; color:var(--text-muted);">Pendiente Cobro</div>
        </div>
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:#60a5fa; font-family:var(--font-heading);">$612.50</div>
          <div style="font-size:12px; color:var(--text-muted);">ARPU Promedio</div>
        </div>
      </div>

      <h4 style="color:#fff; font-family:var(--font-heading); margin-bottom:12px;">Desglose por Concepto de Servicio:</h4>
      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
          <span>SaaS Personalizado / Coaching 6M</span><strong style="color:var(--accent-green);">$1,200.00 (41%)</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
          <span>Coaching Deportivo Elite</span><strong style="color:#60a5fa;">$750.00 (26%)</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
          <span>Evaluaciones Biomecánicas</span><strong style="color:#fbbf24;">$600.00 (21%)</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px;">
          <span>Planes Nutrición + Rutina 1M</span><strong style="color:#a1a1aa;">$350.00 (12%)</strong>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end;">
        <button class="btn-primary" onclick="cerrarModalStat(); navegarA('finances');">Ir al Módulo Financiero Completo ➔</button>
      </div>
    `;
  } else if (tipo === 'adherencia') {
    title.innerHTML = `📊 Reporte de Adherencia y Cumplimiento`;
    body.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px;">
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:var(--accent-green); font-family:var(--font-heading);">91%</div>
          <div style="font-size:12px; color:var(--text-muted);">Cumplimiento Promedio</div>
        </div>
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:#4ade80; font-family:var(--font-heading);">142 / 156</div>
          <div style="font-size:12px; color:var(--text-muted);">Sesiones Completadas</div>
        </div>
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:#60a5fa; font-family:var(--font-heading);">94%</div>
          <div style="font-size:12px; color:var(--text-muted);">RPE Objetivo Alcanzado</div>
        </div>
      </div>

      <h4 style="color:#fff; font-family:var(--font-heading); margin-bottom:12px;">Top Atletas por Consistencia:</h4>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
          <div><strong style="color:#fff;">Alejandro Gómez</strong><div style="font-size:12px; color:var(--text-muted);">20/20 Sesiones registradas este mes</div></div>
          <span class="badge badge-green">95% Adherencia</span>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
          <div><strong style="color:#fff;">Carlos Eduardo</strong><div style="font-size:12px; color:var(--text-muted);">18/19 Sesiones registradas este mes</div></div>
          <span class="badge badge-green">92% Adherencia</span>
        </div>
        <div style="background:var(--bg-card); padding:12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center;">
          <div><strong style="color:#fff;">Sofía Martínez</strong><div style="font-size:12px; color:var(--text-muted);">16/18 Sesiones registradas este mes</div></div>
          <span class="badge badge-green">88% Adherencia</span>
        </div>
      </div>
    `;
  } else if (tipo === 'satisfaccion') {
    title.innerHTML = `⭐ Encuestas de Satisfacción y NPS`;
    body.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px;">
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:#fbbf24; font-family:var(--font-heading);">4.9 / 5.0</div>
          <div style="font-size:12px; color:var(--text-muted);">Puntuación General</div>
        </div>
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:var(--accent-green); font-family:var(--font-heading);">94%</div>
          <div style="font-size:12px; color:var(--text-muted);">Net Promoter Score (NPS)</div>
        </div>
        <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
          <div style="font-size:26px; font-weight:700; color:#60a5fa; font-family:var(--font-heading);">98%</div>
          <div style="font-size:12px; color:var(--text-muted);">Tasa de Respuesta</div>
        </div>
      </div>

      <h4 style="color:#fff; font-family:var(--font-heading); margin-bottom:12px;">Comentarios de Atletas:</h4>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color); font-size:13px;">
          <div style="color:#fbbf24; margin-bottom:4px;">★★★★★</div>
          <p style="color:#e4e4e7; margin:0 0 6px 0;">"El ajuste biomecánico para mi lumbalgia eliminó el dolor en sólo 2 semanas. La interfaz para ver los ejercicios es impecable."</p>
          <div style="color:var(--text-muted); font-size:11px;">— Alejandro Gómez (Atleta Avanzado)</div>
        </div>
        <div style="background:var(--bg-card); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color); font-size:13px;">
          <div style="color:#fbbf24; margin-bottom:4px;">★★★★★</div>
          <p style="color:#e4e4e7; margin:0 0 6px 0;">"Súper profesional. Los cálculos de macros y la guía de suplementos científicos son lo mejor que he usado."</p>
          <div style="color:var(--text-muted); font-size:11px;">— Sofía Martínez (Atleta Intermedio)</div>
        </div>
      </div>
    `;
  }

  const m = document.getElementById('modal-stat-detalle');
  if (m) m.classList.remove('hidden');
}

function cerrarModalStat() {
  const m = document.getElementById('modal-stat-detalle');
  if (m) m.classList.add('hidden');
}

// Global Window Exports for 100% Inline Event Compatibility
window.navegarA = navegarA;
window.irAGenerador = irAGenerador;
window.initNavigation = initNavigation;
window.abrirModalCliente = abrirModalCliente;
window.cerrarModalCliente = cerrarModalCliente;
window.guardarCliente = guardarCliente;
window.abrirDetalleCliente = abrirDetalleCliente;
window.cerrarDetalleCliente = cerrarDetalleCliente;
window.cerrarModalDetalleCliente = cerrarDetalleCliente;
window.cambiarModoVistaClientes = cambiarModoVistaClientes;
window.alternarVisibilidadInput = alternarVisibilidadInput;
window.ejecutarCambioPasswordObligatorioWeb = ejecutarCambioPasswordObligatorioWeb;
window.abrirModalPlan = abrirModalPlan;
window.cerrarModalPlan = cerrarModalPlan;
window.abrirModalPlanManual = abrirModalPlanManual;
window.cerrarModalPlanManual = cerrarModalPlanManual;
window.agregarFilaEjercicioManual = agregarFilaEjercicioManual;
window.guardarPlanManual = guardarPlanManual;
window.abrirModalLesion = abrirModalLesion;
window.cerrarModalLesion = cerrarModalLesion;
window.guardarLesion = guardarLesion;
window.renderLesiones = renderLesiones;
window.filtrarLesionesZona = filtrarLesionesZona;
window.filtrarLesionesTexto = filtrarLesionesTexto;
window.actualizarTextoLesionEva = actualizarTextoLesionEva;
window.lesionesDB = lesionesDB;
window.abrirModalNuevoPago = abrirModalNuevoPago;
window.cerrarModalNuevoPago = cerrarModalNuevoPago;
window.guardarNuevoPago = guardarNuevoPago;
window.abrirDetalleStat = abrirDetalleStat;
window.cerrarModalStat = cerrarModalStat;
window.toggleDropdownMenu = toggleDropdownMenu;
window.renovarRutinaMensual = renovarRutinaMensual;
window.prepararPlanPara = prepararPlanPara;
window.confirmarEliminarCliente = confirmarEliminarCliente;
window.confirmarEliminarPlan = confirmarEliminarPlan;
window.filtrarBiblioteca = filtrarBiblioteca;
window.filtrarEquipamiento = filtrarEquipamiento;
window.filtrarRiesgo = filtrarRiesgo;
window.filtrarBibliotecaTexto = filtrarBibliotecaTexto;
window.ejerciciosDB = ejerciciosDB;
window.imprimirPlan = imprimirPlan;
window.imprimirBiblioteca = imprimirBiblioteca;
window.analizarYGenerarPlan = analizarYGenerarPlan;
window.cambiarPestañaModalPlan = cambiarPestañaModalPlan;
window.cambiarPestañaModalCliente = cambiarPestañaModalCliente;
window.cambiarTabCalculadora = cambiarTabCalculadora;
window.autoCompletarCalculadoraCliente = autoCompletarCalculadoraCliente;
window.ejecutarCalcularTDEE = ejecutarCalcularTDEE;
window.ejecutarCalcularGrasa = ejecutarCalcularGrasa;
window.ejecutarCalcular1RM = ejecutarCalcular1RM;
window.ejecutarCalcularCardio = ejecutarCalcularCardio;
window.sincronizarResultadoCliente = sincronizarResultadoCliente;
window.agregarFilaLesionModal = agregarFilaLesionModal;
window.agregarEnfermedadPersonalizada = agregarEnfermedadPersonalizada;
window.filtrarClientes = filtrarClientes;
window.generarUsuarioYPasswordAtleta = generarUsuarioYPasswordAtleta;
window.enviarEnlaceWhatsAppAtleta = enviarEnlaceWhatsAppAtleta;

// Nutrition Module Exports
window.renderDietas = renderDietas;
window.filtrarDietas = filtrarDietas;
window.filtrarDietasTexto = filtrarDietasTexto;
window.abrirModalDietaManual = abrirModalDietaManual;
window.cerrarModalDietaManual = cerrarModalDietaManual;
window.agregarFilaComidaManual = agregarFilaComidaManual;
window.guardarDietaManual = guardarDietaManual;
window.generarPropuestaDietaAutomatica = generarPropuestaDietaAutomatica;
window.guardarPropuestaDietaAutomaticaDirecta = guardarPropuestaDietaAutomaticaDirecta;
window.abrirDetalleDieta = abrirDetalleDieta;
window.cerrarDetalleDieta = cerrarDetalleDieta;
window.cambiarPestañaModalDieta = cambiarPestañaModalDieta;
window.cambiarTabModalDieta = cambiarPestañaModalDieta;
window.avanzarCicloNutricional = avanzarCicloNutricional;
window.alternarACreadorManual = alternarACreadorManual;
window.guardarDietaDesdeCalculadora = guardarDietaDesdeCalculadora;
window.renderAlimentosBase = renderAlimentosBase;
window.generarEntrenamientoParaCliente = generarEntrenamientoParaCliente;
window.generarNutricionParaCliente = generarNutricionParaCliente;
window.abrirBitacoraClinica = abrirBitacoraClinica;
window.cerrarModalBitacora = cerrarModalBitacora;
window.guardarRegistroBitacora = guardarRegistroBitacora;
window.actualizarTextoEva = actualizarTextoEva;
window.bitacoraClinicaDB = bitacoraClinicaDB;
window.abrirModalClienteGeriatrico = abrirModalClienteGeriatrico;
window.renderSeniorsList = renderSeniorsList;
window.abrirModalSubirDictamen = abrirModalSubirDictamen;
window.cerrarModalSubirDictamen = cerrarModalSubirDictamen;
window.guardarDocumentoMedico = guardarDocumentoMedico;
window.procesarArchivoMedicoSeleccionado = procesarArchivoMedicoSeleccionado;
window.abrirVisorDocumento = abrirVisorDocumento;
window.cerrarVisorDocumento = cerrarVisorDocumento;
window.imprimirDocumentoMedico = imprimirDocumentoMedico;
window.archivosMedicosDB = archivosMedicosDB;
window.metricasEvolucionDB = metricasEvolucionDB;
window.analizarEstancamientoEIntervencion = analizarEstancamientoEIntervencion;
window.renderAnalyticsAtleta = renderAnalyticsAtleta;
window.irAAnalyticsAtleta = irAAnalyticsAtleta;
window.abrirModalRegistrarMetrica = abrirModalRegistrarMetrica;
window.cerrarModalRegistrarMetrica = cerrarModalRegistrarMetrica;
window.guardarNuevaMetrica = guardarNuevaMetrica;
window.aplicarSemanaDescarga = aplicarSemanaDescarga;
window.recalcularProgresionCargas = recalcularProgresionCargas;
window.dietasGuardadas = dietasGuardadas;
window.clientes = clientes;
// Supabase Cloud Exports
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
window.initSupabaseClient = initSupabaseClient;
window.sincronizarClienteConSupabase = sincronizarClienteConSupabase;
window.eliminarClienteDeSupabase = eliminarClienteDeSupabase;
window.cargarClientesDesdeSupabase = cargarClientesDesdeSupabase;
window.sincronizarTodoConSupabase = sincronizarTodoConSupabase;
window.iniciarSuscripcionesRealtimeSupabase = iniciarSuscripcionesRealtimeSupabase;

// Multi-Gym Tenant Architecture Exports
window.gimnasiosDB = gimnasiosDB;
window.gimnasioActivoId = gimnasioActivoId;
window.getGimnasioActivo = getGimnasioActivo;
window.getClientesActivos = getClientesActivos;
window.getPlanesActivos = getPlanesActivos;
window.getDietasActivas = getDietasActivas;
window.getFinanzasActivas = getFinanzasActivas;
window.getLesionesActivas = getLesionesActivas;
window.getArchivosMedicosActivos = getArchivosMedicosActivos;
window.getBitacoraClinicaActiva = getBitacoraClinicaActiva;
window.getMetricasActivas = getMetricasActivas;
window.cambiarGimnasioActivo = cambiarGimnasioActivo;
window.toggleMobileSidebar = toggleMobileSidebar;
window.toggleNavGroup = toggleNavGroup;
window.solicitarConfirmacionSemanaDescarga = solicitarConfirmacionSemanaDescarga;
window.solicitarConfirmacionRenovacionRutina = solicitarConfirmacionRenovacionRutina;
window.escapeHTML = escapeHTML;
window.sanitizeText = sanitizeText;
window.sanitizeNumber = sanitizeNumber;
window.sanitizeArray = sanitizeArray;
window.FitProSanitizer = FitProSanitizer;
window.FitProSchema = FitProSchema;

// ==========================================
// 🔐 EXPORTACIONES GLOBALES DE LOGIN & AUTENTICACIÓN
// ==========================================
window.ejecutarCambioPasswordObligatorioWeb = ejecutarCambioPasswordObligatorioWeb;
window.verificarCambioPasswordObligatorioWeb = verificarCambioPasswordObligatorioWeb;
window.seleccionarPerfilAuth = seleccionarPerfilAuth;
window.alternarModoAuthDirecto = alternarModoAuthDirecto;
window.entrarModoLocalDemo = entrarModoLocalDemo;
window.cambiarModoAuth = cambiarModoAuth;
window.alternarVisibilidadPassword = alternarVisibilidadPassword;
window.procesarFormularioAuth = procesarFormularioAuth;
window.iniciarSesionSupabase = iniciarSesionSupabase;
window.registrarUsuarioSupabase = registrarUsuarioSupabase;
window.cerrarSesionSupabaseAuth = cerrarSesionSupabaseAuth;
window.cerrarSesion = cerrarSesionSupabaseAuth;
window.salir = cerrarSesionSupabaseAuth;
window.logout = cerrarSesionSupabaseAuth;
window.verificarYEscucharSupabaseAuth = verificarYEscucharSupabaseAuth;
window.establecerSesionActiva = establecerSesionActiva;
window.mostrarPantallaAuth = mostrarPantallaAuth;
window.mostrarErrorAuth = mostrarErrorAuth;
window.mostrarExitoAuth = mostrarExitoAuth;
window.limpiarErrorAuth = limpiarErrorAuth;
window.alternarVisibilidadPasswordAtleta = alternarVisibilidadPasswordAtleta;
window.registrarCredencialesAtletaSupabase = registrarCredencialesAtletaSupabase;

// Exportaciones de PDF, Email y WhatsApp
window.generarPDFPlan = generarPDFPlan;
window.generarPDFDieta = generarPDFDieta;
window.obtenerEmailCliente = obtenerEmailCliente;
window.enviarPlanPorEmail = enviarPlanPorEmail;
window.enviarPorEmail = enviarPorEmail;
window.enviarDietaPorEmail = enviarDietaPorEmail;
window.enviarPlanPorWhatsApp = enviarPlanPorWhatsApp;
window.enviarPorWhatsApp = enviarPorWhatsApp;
window.enviarDietaPorWhatsApp = enviarDietaPorWhatsApp;
window.eliminarPlan = eliminarPlan;
window.eliminarDieta = eliminarDieta;
window.resolverPlanData = resolverPlanData;
window.obtenerTelefonoCliente = obtenerTelefonoCliente;
window.abrirModalInstruccionWhatsApp = abrirModalInstruccionWhatsApp;
window.cerrarModalInstruccionWhatsApp = cerrarModalInstruccionWhatsApp;
window.abrirModalEnvioEmail = abrirModalEnvioEmail;
window.cerrarModalEnvioEmail = cerrarModalEnvioEmail;
window.ejecutarEnvioMailtoDirecto = ejecutarEnvioMailtoDirecto;
window.abrirGmailWebDirecto = abrirGmailWebDirecto;
window.abrirOutlookWebDirecto = abrirOutlookWebDirecto;
window.copiarMensajeEmailAlPortapapeles = copiarMensajeEmailAlPortapapeles;
window.abrirMailtoLimpio = abrirMailtoLimpio;
window.guardarPlanGeneratedMultiBlock = guardarPlanGeneratedMultiBlock;
window.guardarPlanGenerado = guardarPlanGenerado;

// ==========================================
// 📲 APK & PWA INSTALLATION SUITE
// ==========================================
function abrirModalDescargaAPK() {
  const m = document.getElementById('modal-descarga-apk');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
  }
}

function cerrarModalDescargaAPK() {
  const m = document.getElementById('modal-descarga-apk');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function notificarDescargaIniciada() {
  showToast("Iniciando descarga de android-app-release.apk...", "info", "📲 Descargando APK", 5000);
}

function ejecutarInstalacionPwa() {
  if (window.deferredPwaPrompt) {
    window.deferredPwaPrompt.prompt();
    window.deferredPwaPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast("¡FitPro Suite Pro instalado en tu dispositivo!", "success", "📲 Instalación Exitosa", 5000);
      }
      window.deferredPwaPrompt = null;
    });
  } else {
    showToast("Para instalar en Chrome: pulsa en los 3 puntos ⋮ y selecciona 'Instalar aplicación' o 'Añadir a pantalla de inicio'.", "info", "📱 PWA Chrome", 8000);
  }
}

window.abrirModalDescargaAPK = abrirModalDescargaAPK;
window.cerrarModalDescargaAPK = cerrarModalDescargaAPK;
window.notificarDescargaIniciada = notificarDescargaIniciada;
window.ejecutarInstalacionPwa = ejecutarInstalacionPwa;
window.procesarDeepLinkAtletaUrl = procesarDeepLinkAtletaUrl;

// ==========================================
// 🚀 APP STARTUP & AUTH LIFECYCLE INITIALIZER
// ==========================================
function arrancarAplicacionFitPro() {
  console.log("🚀 Arrancando FitPro Suite Pro Engine...");

  try {
    // 1. Inicializar navegación y delegación de eventos del sidebar
    initNavigation();

    // 2. Inicializar cliente Supabase Cloud
    initSupabaseClient();

    // 3. Vincular eventos directos del formulario de autenticación y controles
    const authForm = document.getElementById('form-auth-supabase');
    if (authForm) {
      authForm.onsubmit = procesarFormularioAuth;
      authForm.addEventListener('submit', procesarFormularioAuth);
    }

    const authSubmitBtn = document.getElementById('auth-btn-submit');
    if (authSubmitBtn && authForm) {
      authSubmitBtn.onclick = (e) => {
        if (authForm.checkValidity && !authForm.checkValidity()) {
          return;
        }
        e.preventDefault();
        procesarFormularioAuth(e);
      };
    }

    const tabLogin = document.getElementById('auth-tab-login');
    if (tabLogin) {
      tabLogin.addEventListener('click', () => cambiarModoAuth('login'));
    }

    const tabSignup = document.getElementById('auth-tab-signup');
    if (tabSignup) {
      tabSignup.addEventListener('click', () => cambiarModoAuth('signup'));
    }

    const switchBtn = document.getElementById('auth-switch-btn');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => alternarModoAuthDirecto());
    }

    const pwdToggles = document.querySelectorAll('.auth-password-toggle');
    pwdToggles.forEach(btn => {
      btn.addEventListener('click', alternarVisibilidadPassword);
    });

    const demoBtns = document.querySelectorAll('.auth-btn-demo');
    demoBtns.forEach(btn => {
      btn.addEventListener('click', () => entrarModoLocalDemo());
    });

    const emailInput = document.getElementById('auth-input-email');
    if (emailInput) emailInput.addEventListener('input', limpiarErrorAuth);

    const passInput = document.getElementById('auth-input-password');
    if (passInput) passInput.addEventListener('input', limpiarErrorAuth);

    const nombreInput = document.getElementById('auth-input-nombre');
    if (nombreInput) nombreInput.addEventListener('input', limpiarErrorAuth);

    // 4. Renderizar todas las vistas del sistema con manejo seguro de excepciones
    renderDashboardStats();
    renderClientes();
    renderPlanes();
    renderDietas();
    renderLesiones();
    renderFinanzas();
    renderBiblioteca();
    renderSuplementos();
    renderSeniorsList();
    renderAnalyticsAtleta();

    // 5. Escuchar y restaurar sesión de Supabase Auth
    verificarYEscucharSupabaseAuth();

    // 6. Conectar eventos click directos y delegados para botones de salida
    const selectoresLogout = [
      '#btn-logout-sidebar',
      '#btn-logout-dashboard',
      '#btn-logout-mobile',
      '.btn-logout',
      '#btn-logout',
      'button[title*="Cerrar Sesión"]',
      'button[title*="Salir"]',
      'button[onclick*="cerrarSesion"]',
      'button[onclick*="salir"]'
    ];

    selectoresLogout.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        btn.onclick = cerrarSesionSupabaseAuth;
        btn.addEventListener('click', cerrarSesionSupabaseAuth, { passive: false });
      });
    });

    document.addEventListener('click', (e) => {
      const target = e.target.closest('#btn-logout-sidebar, #btn-logout-dashboard, #btn-logout-mobile, .btn-logout, #btn-logout, button[title*="Cerrar Sesión"], button[title*="Salir"]');
      if (target) {
        e.preventDefault();
        cerrarSesionSupabaseAuth(e);
      }
    });

    // 7. Registro de Service Worker para PWA (Instalación en Android/iOS)
    if ('serviceWorker' in navigator && (window.location.protocol.startsWith('http') || window.location.protocol === 'https:')) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('📱 FitPro PWA Service Worker registrado:', reg.scope))
        .catch(err => console.info('PWA notice:', err.message));
    }

    // 9. Procesamiento inteligente de Deep-Links (URL Parameters para Atletas)
    procesarDeepLinkAtletaUrl();

    console.log("✅ FitPro Suite Pro listo e interactivo.");
  } catch (err) {
    console.error("Critical error starting FitPro Suite Pro:", err);
  }
}

function procesarDeepLinkAtletaUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const atletaParam = urlParams.get('atleta') || urlParams.get('cliente');
    const emailParam = urlParams.get('email') || urlParams.get('atletaEmail');
    const atletaIdParam = urlParams.get('id') || urlParams.get('atletaId');
    const vistaParam = urlParams.get('view') || urlParams.get('vista');

    if (atletaParam || emailParam || vistaParam === 'athlete') {
      console.log(`🔗 Modo Portal del Atleta activado vía URL`);
      window.esSesionModoAtleta = true;
      document.body.classList.add('is-athlete-mode');

      // Personalizar la interfaz de autenticación para que sea limpia y exclusiva de atleta
      const authTitle = document.querySelector('.auth-title');
      if (authTitle) authTitle.innerText = "Portal del Atleta";

      const authSubtitle = document.getElementById('auth-header-subtitle');
      if (authSubtitle) {
        const decodedNombre = atletaParam ? decodeURIComponent(atletaParam) : "Atleta";
        authSubtitle.innerHTML = `¡Hola <strong>${decodedNombre}</strong>! Ingresa con tus credenciales para ver tu rutina y dieta.`;
      }

      // Ocultar tabs de registro de coach y botones demo de superadmin
      const authTabs = document.querySelector('.auth-tabs');
      if (authTabs) authTabs.style.display = 'none';

      const demoDiv = document.querySelector('.auth-demo-divider');
      if (demoDiv) demoDiv.style.display = 'none';

      const demoBtns = document.querySelectorAll('.auth-btn-demo');
      demoBtns.forEach(b => b.style.display = 'none');

      const switchPrompt = document.getElementById('auth-switch-prompt');
      if (switchPrompt && switchPrompt.parentElement) switchPrompt.parentElement.style.display = 'none';

      const authBtnText = document.getElementById('auth-btn-text');
      if (authBtnText) authBtnText.innerText = "🏋️ Acceder a Mi Plan Deportivo";

      if (emailParam) {
        const authEmailInput = document.getElementById('auth-input-email');
        if (authEmailInput) {
          authEmailInput.value = decodeURIComponent(emailParam);
        }
      }

      const passInput = document.getElementById('auth-input-password');
      if (passInput) passInput.focus();

      // Si ya hay sesión activa, renderizar de inmediato el portal del atleta
      if (sesionUsuarioActual?.user) {
        renderPortalAtleta(sesionUsuarioActual.user);
        navegarA('athlete-portal');
      }
    }
  } catch (err) {
    console.warn("Notice procesando deep link URL:", err);
  }
}

function renderPortalAtleta(userObj) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const atletaParam = urlParams.get('atleta') || urlParams.get('cliente');
    const atletaIdParam = urlParams.get('id') || urlParams.get('atletaId');

    // 1. Buscar atleta en la base de datos de clientes
    let cliente = null;
    if (atletaIdParam) {
      cliente = clientes.find(c => String(c.id) === String(atletaIdParam));
    }
    if (!cliente && (userObj?.email || userObj?.user_metadata?.email)) {
      const email = (userObj?.email || userObj?.user_metadata?.email || '').toLowerCase();
      cliente = clientes.find(c => c.email && c.email.toLowerCase() === email);
    }
    if (!cliente && atletaParam) {
      const decoded = decodeURIComponent(atletaParam).toLowerCase();
      cliente = clientes.find(c => c.nombre && c.nombre.toLowerCase() === decoded);
    }
    if (!cliente && clientes.length > 0) {
      cliente = clientes[0];
    }

    if (!cliente) {
      cliente = {
        nombre: userObj?.user_metadata?.full_name || (atletaParam ? decodeURIComponent(atletaParam) : "Atleta FitPro"),
        email: userObj?.email || "atleta@fitprosuite.com",
        objetivo: "Acondicionamiento Físico & Rendimiento",
        nivel: "Intermedio",
        entrenador: "Coach Master Pro",
        peso: 75.0,
        altura: 175,
        imc: 24.5,
        porcentajeGrasa: 15.0,
        porcentajeMusculo: 42.0,
        estadoMembresia: "activa"
      };
    }

    window.atletaActivoPortal = cliente;

    // Actualizar cabecera del portal
    const nombreEl = document.getElementById('athlete-portal-nombre');
    const objetivoEl = document.getElementById('athlete-portal-objetivo');
    const gymEl = document.getElementById('athlete-portal-gym');
    const coachEl = document.getElementById('athlete-portal-coach');
    const avatarEl = document.getElementById('athlete-portal-avatar');
    const badgeMembresia = document.getElementById('athlete-portal-badge-membresia');

    if (nombreEl) nombreEl.innerText = cliente.nombre;
    if (objetivoEl) objetivoEl.innerText = cliente.objetivo || "Hipertrofia & Rendimiento";
    if (gymEl) gymEl.innerText = getGimnasioActivo().nombre;
    if (coachEl) coachEl.innerText = cliente.entrenador || "Coach Master Pro";
    if (avatarEl) {
      const iniciales = cliente.nombre.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'AT';
      avatarEl.innerText = iniciales;
    }
    if (badgeMembresia) {
      badgeMembresia.className = cliente.estadoMembresia === 'activa' ? 'badge badge-green' : 'badge badge-risk-med';
      badgeMembresia.innerText = cliente.estadoMembresia === 'activa' ? '🟢 Membresía Activa' : '🟡 Membresía en Revisión';
    }

    // 2. Renderizar Rutina del Atleta
    const rutinaContainer = document.getElementById('athlete-portal-rutina-container');
    if (rutinaContainer) {
      const planesCliente = planesGuardados.filter(p => p.cliente && p.cliente.toLowerCase() === cliente.nombre.toLowerCase());
      if (planesCliente && planesCliente.length > 0) {
        const plan = planesCliente[0];
        let ejerciciosHtml = '';
        if (plan.dias && plan.dias.length > 0) {
          ejerciciosHtml = plan.dias.map((d, dIdx) => `
            <div class="card" style="margin-bottom:16px; border:1px solid rgba(56, 189, 248, 0.25);">
              <div class="card-header" style="background:rgba(56, 189, 248, 0.05); padding:12px 16px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:16px; color:#38bdf8;">📅 ${d.nombre || `Día ${dIdx + 1}`} — ${d.enfoque || 'Sesión de Fuerza'}</h3>
                <span class="badge badge-primary">${d.ejercicios ? d.ejercicios.length : 0} Ejercicios</span>
              </div>
              <div style="padding:16px; display:grid; gap:12px;">
                ${(d.ejercicios || []).map((e, eIdx) => `
                  <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                      <div style="font-weight:700; font-size:14px; color:#fff;">${eIdx + 1}. ${e.nombre || e.ejercicio}</div>
                      <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                        🎯 Series: <strong>${e.series || 4}</strong> • Reps: <strong>${e.repeticiones || '8-12'}</strong> • RPE: <strong>@${e.rpe || 8}</strong> (RIR ${e.rir || 2})
                      </div>
                      ${e.notas ? `<div style="font-size:11px; color:#38bdf8; margin-top:4px;">💡 ${e.notas}</div>` : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="badge badge-risk-low">⏱️ Descanso: ${e.descanso || '90s'}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('');
        } else if (plan.ejercicios) {
          const lista = Array.isArray(plan.ejercicios) ? plan.ejercicios : String(plan.ejercicios).split('|');
          ejerciciosHtml = `
            <div class="card" style="padding:16px;">
              <h3 style="color:#38bdf8; margin-top:0;">📋 Prescripción de Ejercicios Principales</h3>
              <ul style="padding-left:20px; line-height:1.8; color:#e4e4e7;">
                ${lista.map(ej => `<li><strong>${ej}</strong></li>`).join('')}
              </ul>
            </div>
          `;
        }

        rutinaContainer.innerHTML = `
          <div style="background:rgba(34,197,94,0.05); border:1px solid rgba(34,197,94,0.2); padding:14px 18px; border-radius:var(--radius-md); margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <div style="font-weight:700; color:#fff; font-size:15px;">Plan Asignado: ${plan.metodo || 'Sobrecarga Progresiva Adaptada'}</div>
              <div style="font-size:12px; color:var(--text-muted);">Actualizado: ${plan.fecha || 'Reciente'} • RPE Promedio: @${plan.rpe_objetivo || 8}</div>
            </div>
            <button class="btn-primary" style="font-size:12px; padding:6px 12px;" onclick="window.print()">🖨️ Descargar / Imprimir Rutina</button>
          </div>
          ${ejerciciosHtml}
        `;
      } else {
        rutinaContainer.innerHTML = `
          <div class="card" style="text-align:center; padding:40px 20px;">
            <div style="font-size:36px; margin-bottom:12px;">🏋️‍♂️</div>
            <h3 style="color:#fff; margin-bottom:6px;">Tu entrenador está diseñando tu rutina</h3>
            <p style="color:var(--text-muted); font-size:13px; max-width:500px; margin:0 auto 16px auto;">
              En breve tu coach asignará tus ejercicios biomecánicos con series, repeticiones y cargas adaptadas.
            </p>
          </div>
        `;
      }
    }

    // 3. Renderizar Plan Nutricional
    const dietaContainer = document.getElementById('athlete-portal-dieta-container');
    if (dietaContainer) {
      const dietasCliente = dietasGuardadas.filter(d => d.cliente && d.cliente.toLowerCase() === cliente.nombre.toLowerCase());
      if (dietasCliente && dietasCliente.length > 0) {
        const dieta = dietasCliente[0];
        dietaContainer.innerHTML = `
          <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card">
              <div class="stat-icon">🔥</div>
              <div>
                <div class="stat-value">${dieta.tdee || 2400} kcal</div>
                <div class="stat-label">Objetivo Calórico Diario</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🥩</div>
              <div>
                <div class="stat-value">${dieta.proteina || 160} g</div>
                <div class="stat-label">Proteínas (2.0g/kg)</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🍚</div>
              <div>
                <div class="stat-value">${dieta.carbo || 260} g</div>
                <div class="stat-label">Carbohidratos</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🥑</div>
              <div>
                <div class="stat-value">${dieta.grasa || 65} g</div>
                <div class="stat-label">Grasas Saludables</div>
              </div>
            </div>
          </div>
          <div class="card" style="padding:20px;">
            <h3 style="margin-top:0; color:var(--accent-green);">🥗 Pauta de Comidas Diarias</h3>
            <div style="display:grid; gap:12px;">
              <div style="background:var(--bg-surface); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                <div style="font-weight:700; color:#fff;">🍳 Desayuno (Energía & Enzimas)</div>
                <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">3 Huevos enteros + 80g Avena con fruta y frutos secos.</div>
              </div>
              <div style="background:var(--bg-surface); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                <div style="font-weight:700; color:#fff;">🍗 Almuerzo (Anabolismo & Recuperación)</div>
                <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">200g Pechuga de pollo / Salmón + 200g Arroz jazmín + Ensalada verde con aceite de oliva.</div>
              </div>
              <div style="background:var(--bg-surface); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                <div style="font-weight:700; color:#fff;">🥪 Merienda Pre/Post Entrenamiento</div>
                <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">Batido de proteína Isolate + 1 Plátano + 30g Mantequilla de maní.</div>
              </div>
              <div style="background:var(--bg-surface); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                <div style="font-weight:700; color:#fff;">🥩 Cena (Reparación Tisular Nocturna)</div>
                <div style="color:var(--text-muted); font-size:13px; margin-top:4px;">180g Ternera magra / Pescado blanco + 250g Camote al horno + Espárragos.</div>
              </div>
            </div>
          </div>
        `;
      } else {
        dietaContainer.innerHTML = `
          <div class="card" style="text-align:center; padding:40px 20px;">
            <div style="font-size:36px; margin-bottom:12px;">🥗</div>
            <h3 style="color:#fff; margin-bottom:6px;">Plan Nutricional en Elaboración</h3>
            <p style="color:var(--text-muted); font-size:13px; max-width:500px; margin:0 auto;">
              Tu coach está calculando tu balance calórico y macronutrientes adaptados a tu gasto energético.
            </p>
          </div>
        `;
      }
    }

    // 4. Renderizar Medidas y Evolución
    const medidasContainer = document.getElementById('athlete-portal-medidas-container');
    if (medidasContainer) {
      medidasContainer.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px;">
          <div class="stat-card">
            <div class="stat-icon">⚖️</div>
            <div>
              <div class="stat-value">${cliente.peso || 75.0} kg</div>
              <div class="stat-label">Peso Corporal Actual</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📉</div>
            <div>
              <div class="stat-value">${cliente.porcentajeGrasa || 15.0}%</div>
              <div class="stat-label">% Grasa Estimada</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💪</div>
            <div>
              <div class="stat-value">${cliente.porcentajeMusculo || 42.0}%</div>
              <div class="stat-label">% Masa Muscular</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📏</div>
            <div>
              <div class="stat-value">${cliente.imc || 24.5}</div>
              <div class="stat-label">Índice IMC</div>
            </div>
          </div>
        </div>

        <div class="card" style="padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <h3 style="margin:0; color:#fff;">📏 Perímetros y Medidas Antropométricas</h3>
            <button class="btn-primary" style="font-size:12px; padding:6px 12px;" onclick="abrirModalRegistrarMetrica('${cliente.nombre}')">
              ➕ Registrar Mis Medidas de Hoy
            </button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
            <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
              <div style="font-size:11px; color:var(--text-muted);">Cintura</div>
              <div style="font-size:16px; font-weight:700; color:#fff;">${cliente.perimetroCintura || 82} cm</div>
            </div>
            <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
              <div style="font-size:11px; color:var(--text-muted);">Pecho / Tórax</div>
              <div style="font-size:16px; font-weight:700; color:#fff;">${cliente.perimetroPecho || 104} cm</div>
            </div>
            <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
              <div style="font-size:11px; color:var(--text-muted);">Brazo (Der / Izq)</div>
              <div style="font-size:16px; font-weight:700; color:#fff;">${cliente.brazoDerecho || 38} cm / ${cliente.brazoIzquierdo || 37.5} cm</div>
            </div>
            <div style="background:var(--bg-surface); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
              <div style="font-size:11px; color:var(--text-muted);">Muslo (Der / Izq)</div>
              <div style="font-size:16px; font-weight:700; color:#fff;">${cliente.musloDerecho || 60} cm / ${cliente.musloIzquierdo || 59.5} cm</div>
            </div>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error("Error al renderizar portal del atleta:", err);
  }
}

function cambiarPestañaPortalAtleta(tabName) {
  const btnRutina = document.getElementById('tab-portal-btn-rutina');
  const btnDieta = document.getElementById('tab-portal-btn-dieta');
  const btnMedidas = document.getElementById('tab-portal-btn-medidas');

  const contRutina = document.getElementById('tab-portal-content-rutina');
  const contDieta = document.getElementById('tab-portal-content-dieta');
  const contMedidas = document.getElementById('tab-portal-content-medidas');

  if (btnRutina) btnRutina.classList.toggle('active', tabName === 'rutina');
  if (btnDieta) btnDieta.classList.toggle('active', tabName === 'dieta');
  if (btnMedidas) btnMedidas.classList.toggle('active', tabName === 'medidas');

  if (contRutina) contRutina.classList.toggle('hidden', tabName !== 'rutina');
  if (contDieta) contDieta.classList.toggle('hidden', tabName !== 'dieta');
  if (contMedidas) contMedidas.classList.toggle('hidden', tabName !== 'medidas');
}

function abrirModalCambiarPasswordManual() {
  const m = document.getElementById('modal-cambiar-password-obligatorio');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
  }
}

window.renderPortalAtleta = renderPortalAtleta;
window.cambiarPestañaPortalAtleta = cambiarPestañaPortalAtleta;
window.abrirModalCambiarPasswordManual = abrirModalCambiarPasswordManual;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', arrancarAplicacionFitPro);
} else {
  arrancarAplicacionFitPro();
}




