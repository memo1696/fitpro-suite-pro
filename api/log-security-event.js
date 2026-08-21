// Vercel Serverless Function: registra eventos de acceso en la tabla
// security_events (ver supabase_security_events.sql).
//
// POR QUE EXISTE
// Sin registro de intentos fallidos no hay forma de detectar un ataque de
// fuerza bruta contra la cuenta de un entrenador, ni de responder "quien
// intento entrar y cuando" en una auditoria (OWASP A09).
//
// POR QUE NO ESCRIBE EL NAVEGADOR DIRECTO
// Solo tiene la clave anon, que es publica: con ella cualquiera podria inundar
// la tabla. Ademas, el navegador no puede acreditar su propia IP. Aqui la pone
// el servidor a partir de las cabeceras de Vercel.
//
// POR QUE NO PIDE AUTENTICACION
// El evento mas importante que registra es un login FALLIDO, que por
// definicion no tiene sesion. A cambio, el endpoint no devuelve datos, acota
// los tipos de evento y recorta cada campo.

// Tipos aceptados. Cualquier otro valor se descarta: asi el endpoint no sirve
// de almacenamiento de texto arbitrario.
const EVENTOS_VALIDOS = new Set([
  'login_fallido',
  'login_exitoso',
  'password_reset_solicitado',
  'password_cambiado'
]);

const LIMITES = {
  email: 160,
  motivo: 300,
  gym_id: 64,
  user_agent: 300
};

// Caracteres de control, saltos de linea incluidos. Se construye desde una
// cadena a proposito: escrito como literal dejaria bytes de control en este
// archivo. Neutralizarlos evita que alguien inyecte lineas falsas en la salida
// de la consola de Vercel.
const CARACTERES_DE_CONTROL = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');

// Freno de mano contra inundaciones. Es por instancia de la funcion y se
// pierde en cada arranque en frio, asi que no es un limite duro: solo corta el
// caso ruidoso de un script golpeando la misma instancia. La proteccion real
// es que aqui no se puede escribir nada que no sea uno de los cuatro eventos.
const MAX_POR_MINUTO = 30;
const golpes = new Map();

function excedeLimite(ip) {
  const ahora = Date.now();
  const ventana = ahora - 60000;
  const previos = (golpes.get(ip) || []).filter(t => t > ventana);
  previos.push(ahora);
  golpes.set(ip, previos);

  // Poda para que el Map no crezca sin techo en una instancia de larga vida.
  if (golpes.size > 500) {
    for (const [clave, marcas] of golpes) {
      if (!marcas.some(t => t > ventana)) golpes.delete(clave);
    }
  }
  return previos.length > MAX_POR_MINUTO;
}

function recortar(valor, max) {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).replace(CARACTERES_DE_CONTROL, ' ').trim();
  return texto ? texto.slice(0, max) : null;
}

function ipDelCliente(req) {
  // En Vercel, x-forwarded-for viene como "cliente, proxy1, proxy2".
  const cabecera = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '';
  const primera = String(cabecera).split(',')[0].trim();
  return primera || null;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    // Se responde 204 igual: que falte configuracion del servidor no es asunto
    // del navegador, y este endpoint nunca debe alterar el flujo de acceso.
    console.warn('log-security-event: falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    res.status(204).end();
    return;
  }

  const ip = ipDelCliente(req);
  if (ip && excedeLimite(ip)) {
    res.status(429).json({ error: 'Demasiados eventos' });
    return;
  }

  try {
    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const evento = recortar(cuerpo.evento, 40);
    if (!evento || !EVENTOS_VALIDOS.has(evento)) {
      res.status(400).json({ error: 'Evento no reconocido' });
      return;
    }

    const fila = {
      evento,
      email: recortar(cuerpo.email, LIMITES.email),
      motivo: recortar(cuerpo.motivo, LIMITES.motivo),
      gym_id: recortar(cuerpo.gym_id, LIMITES.gym_id),
      user_agent: recortar(req.headers['user-agent'], LIMITES.user_agent),
      ip
    };

    const r = await fetch(`${SUPABASE_URL}/rest/v1/security_events`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(fila)
    });

    if (!r.ok) {
      const detalle = await r.text();
      console.warn(`log-security-event: Supabase respondio ${r.status}: ${detalle.slice(0, 300)}`);
    }
  } catch (err) {
    // Un fallo registrando no puede convertirse en un fallo de acceso.
    console.warn('log-security-event: excepcion registrando el evento:', err && err.message);
  }

  // Siempre 204, pase lo que pase: el navegador no debe poder distinguir si el
  // correo existe ni si el registro prospero.
  res.status(204).end();
};
