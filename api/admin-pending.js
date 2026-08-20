// Vercel Serverless Function: lista los entrenadores con registro pendiente
// de aprobación. Usa la Admin REST API de Supabase (GoTrue) directamente
// con fetch nativo de Node — sin dependencias npm, para no romper el
// esquema de despliegue sin build de este proyecto.
//
// Protegida por ADMIN_SECRET (header x-admin-secret). SUPABASE_SERVICE_ROLE_KEY
// nunca debe exponerse al navegador; solo se usa aquí, en el servidor.
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const secret = req.headers['x-admin-secret'];
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: 'Falta configurar SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel' });
    return;
  }

  try {
    const allPending = [];
    let page = 1;
    const perPage = 200;
    // Recorre todas las páginas de usuarios (GoTrue Admin API pagina de a 200 por defecto)
    while (true) {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
      });
      if (!r.ok) throw new Error(`Supabase Admin API respondió ${r.status}`);
      const data = await r.json();
      const users = data.users || [];
      users.forEach(u => {
        if (u.user_metadata?.approval_status === 'pending') {
          allPending.push({
            id: u.id,
            email: u.email,
            full_name: u.user_metadata?.full_name || '',
            role: u.user_metadata?.role || '',
            gym_id: u.user_metadata?.gym_id || '',
            created_at: u.created_at
          });
        }
      });
      if (users.length < perPage) break;
      page++;
      if (page > 20) break; // salvaguarda contra loops infinitos
    }

    allPending.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.status(200).json({ pending: allPending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
