// Vercel Serverless Function: aprueba o rechaza el registro de un entrenador
// pendiente. Marca approval_status en su user_metadata de Supabase Auth
// (no borra la cuenta en el rechazo, para dejar rastro y poder revertir).
//
// Protegida por ADMIN_SECRET (header x-admin-secret). SUPABASE_SERVICE_ROLE_KEY
// nunca debe exponerse al navegador; solo se usa aquí, en el servidor.
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  // Mismo criterio que admin-pending.js: separar "falta la variable en el
  // servidor" de "la clave no coincide", para que el fallo sea diagnosticable.
  if (!process.env.ADMIN_SECRET) {
    res.status(500).json({ error: 'Falta configurar ADMIN_SECRET en Vercel (Settings > Environment Variables, habilitada para Production)' });
    return;
  }

  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  let payload;
  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    payload = JSON.parse(body || '{}');
  } catch {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }

  const { userId, action } = payload;
  if (!userId || (action !== 'approve' && action !== 'reject')) {
    res.status(400).json({ error: 'Parámetros inválidos (userId, action: approve|reject)' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: 'Falta configurar SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel' });
    return;
  }

  try {
    // El endpoint PUT de Supabase reemplaza user_metadata por completo, así
    // que primero hay que leer la metadata actual para no perder full_name/
    // role/gym_id al actualizar solo approval_status.
    const getRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    if (!getRes.ok) throw new Error('Usuario no encontrado en Supabase');
    const userData = await getRes.json();

    const nuevaMetadata = {
      ...(userData.user_metadata || {}),
      approval_status: action === 'approve' ? 'approved' : 'rejected'
    };

    const putRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_metadata: nuevaMetadata })
    });
    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error('No se pudo actualizar el usuario: ' + errText);
    }

    res.status(200).json({ ok: true, status: nuevaMetadata.approval_status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
