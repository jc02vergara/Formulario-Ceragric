import { CONFIG } from '../../../../core/config.js';

const CODIGO_POSTGRES_VIOLACION_UNICIDAD = '23505';

export class CedulaDuplicadaError extends Error {}

/**
 * Registra un productor vía PostgREST. El rol anónimo solo tiene permiso de INSERT
 * y no recibe la fila de vuelta (return=minimal).
 */
export async function registrarProductor(productor) {
  const respuesta = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLA_PRODUCTORES}`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(productor),
  });

  if (respuesta.ok) return;

  const detalle = await respuesta.json().catch(() => ({}));
  if (detalle.code === CODIGO_POSTGRES_VIOLACION_UNICIDAD) throw new CedulaDuplicadaError();
  throw new Error('No se pudo registrar la información.');
}
