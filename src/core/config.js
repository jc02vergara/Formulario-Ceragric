// Configuración pública del cliente. La clave publishable/anon es pública por diseño:
// la seguridad la garantizan las políticas RLS de la base de datos (solo INSERT).
export const CONFIG = Object.freeze({
  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'TU_PUBLISHABLE_KEY',
  TABLA_PRODUCTORES: 'ceragric_productores',
  EDAD_MINIMA_PRODUCTOR: 18,
});
