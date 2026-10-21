// Configuración pública del cliente. La clave publishable/anon es pública por diseño:
// la seguridad la garantizan las políticas RLS de la base de datos (solo INSERT).
export const CONFIG = Object.freeze({
  SUPABASE_URL: 'https://vmozwtdacmroznlxdkzl.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_V3XXd3WDH5XyoTPdSMh2Rw_IduZYXFt',
  TABLA_PRODUCTORES: 'ceragric_productores',
  EDAD_MINIMA_PRODUCTOR: 18,
  PROVINCIA_PREDETERMINADA: '12', // Los Ríos (código DPA INEC)
});
