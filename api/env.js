// Vercel Serverless Function: expone las variables de entorno configuradas
// en el dashboard de Vercel al navegador. Esta app no tiene paso de build
// (vercel.json: buildCommand: null), así que las env vars nunca llegan al
// HTML/JS estático por sí solas — este endpoint es el puente en runtime.
// Solo se exponen valores públicos por diseño (URL/anon key protegida por
// RLS, y el email del admin que solo sirve para mostrar/ocultar un botón).
// Nunca agregar aquí SUPABASE_SERVICE_ROLE_KEY ni ADMIN_SECRET — esos viven
// exclusivamente en api/admin-*.js, que corren en el servidor.
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID || '',
    EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID || '',
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || '',
    ADMIN_EMAIL: (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
  };

  res.status(200).send('window.ENV = ' + JSON.stringify(env) + ';');
};
