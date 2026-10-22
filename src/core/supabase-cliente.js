import { CONFIG } from './config.js';

// supabase-js se sirve localmente (src/assets/vendor) y se carga como script clásico, exponiendo window.supabase.
let cliente = null;

export function obtenerClienteSupabase() {
  cliente ??= window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, storageKey: 'ceragric-panel-sesion' },
  });
  return cliente;
}
