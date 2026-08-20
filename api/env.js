// Vercel Serverless Function: expone las variables de entorno configuradas
// en el dashboard de Vercel al navegador. Esta app no tiene paso de build
// (vercel.json: buildCommand: null), así que las env vars nunca llegan al
// HTML/JS estático por sí solas — este endpoint es el puente en runtime.
// Solo se exponen SUPABASE_URL / SUPABASE_ANON_KEY (públicas por diseño,
// protegidas por RLS). Nunca agregar aquí la service_role key.
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID || '',
    EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID || '',
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || ''
  };

  res.status(200).send('window.ENV = ' + JSON.stringify(env) + ';');
};
