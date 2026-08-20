// Vercel Serverless Function: crea la cuenta de Supabase Auth de un atleta.
//
// POR QUE EXISTE
// El navegador solo puede usar `auth.signUp()`, que deja al usuario pendiente
// de confirmar su email. Los atletas muchas veces no tienen correo real (la
// app les genera uno en el dominio inexistente @atleta.fitpro.app, ver
// app.js), asi que esa confirmacion no llega nunca y el login queda roto para
// siempre. Ese era el motivo de fondo del fallback que permitia entrar sin
// validar la contrasena.
//
// Desde el servidor si se puede usar la Admin API con `email_confirm: true`,
// que da de alta la cuenta ya confirmada. Con eso `signInWithPassword`
// funciona desde el primer intento, sin depender del envio de correos, y el
// fallback deja de ser necesario.
//
// SEGURIDAD
// - SUPABASE_SERVICE_ROLE_KEY nunca se expone al navegador; solo se usa aqui.
// - Se exige el JWT del coach que hace la llamada y se valida contra Supabase.
//   No alcanza con estar logueado: el rol tiene que ser de entrenador y su
//   approval_status tiene que ser 'approved'. Asi un atleta no puede crear
//   cuentas usando su propio token.
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    res.status(500).json({ error: 'Falta configurar SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY en Vercel' });
    return;
  }

  // 1. Identificar a quien llama a partir de su JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Falta el token de sesión del entrenador' });
    return;
  }

  let coach;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` }
    });
    if (!r.ok) {
      res.status(401).json({ error: 'Sesión inválida o expirada. Volvé a iniciar sesión.' });
      return;
    }
    coach = await r.json();
  } catch (err) {
    res.status(502).json({ error: 'No se pudo validar la sesión: ' + err.message });
    return;
  }

  // 2. Verificar que sea un entrenador aprobado
  const meta = coach.user_metadata || {};
  const esAtleta = meta.role === 'athlete';
  const aprobado = meta.approval_status === 'approved';
  if (esAtleta || !aprobado) {
    res.status(403).json({ error: 'Solo un entrenador aprobado puede crear cuentas de atleta' });
    return;
  }

  // 3. Leer el cuerpo
  let payload;
  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    payload = JSON.parse(body || '{}');
  } catch {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  const fullName = String(payload.full_name || '').trim();
  const gymId = payload.gym_id || meta.gym_id || '';

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Email de atleta inválido' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'La contraseña del atleta debe tener al menos 8 caracteres' });
    return;
  }

  // 4. Crear la cuenta ya confirmada
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true, // clave: sin esto el atleta no podria entrar nunca
        user_metadata: {
          full_name: fullName,
          role: 'athlete',
          gym_id: gymId,
          coach_id: coach.id,
          phone: payload.phone || '',
          must_change_password: true
        }
      })
    });

    const data = await r.json();

    if (!r.ok) {
      // El caso mas comun: el atleta ya tenia cuenta. Se le actualiza la
      // contrasena en vez de fallar, que es lo que el coach espera al pulsar
      // "regenerar credenciales".
      const yaExiste = r.status === 422 ||
        String(data.msg || data.message || data.error_description || '').toLowerCase().includes('already');
      if (!yaExiste) {
        res.status(r.status).json({ error: data.msg || data.message || 'Supabase rechazó la creación' });
        return;
      }

      const buscar = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
      );
      const lista = await buscar.json();
      const existente = (lista.users || []).find(u => (u.email || '').toLowerCase() === email);
      if (!existente) {
        res.status(409).json({ error: 'El email ya está registrado pero no se pudo localizar la cuenta' });
        return;
      }

      const upd = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existente.id}`, {
        method: 'PUT',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password,
          email_confirm: true,
          user_metadata: {
            ...(existente.user_metadata || {}),
            full_name: fullName || existente.user_metadata?.full_name || '',
            role: 'athlete',
            gym_id: gymId,
            coach_id: coach.id,
            must_change_password: true
          }
        })
      });
      const updData = await upd.json();
      if (!upd.ok) {
        res.status(upd.status).json({ error: updData.msg || updData.message || 'No se pudo actualizar la cuenta existente' });
        return;
      }
      res.status(200).json({ auth_user_id: existente.id, actualizado: true });
      return;
    }

    res.status(200).json({ auth_user_id: data.id, actualizado: false });
  } catch (err) {
    res.status(502).json({ error: 'Error hablando con Supabase: ' + err.message });
  }
};
