import { CONFIG } from '../../../../core/config.js';
import { obtenerClienteSupabase } from '../../../../core/supabase-cliente.js';

const COLUMNA_FECHA_REGISTRO = 'ceragric_productores_fecha_registro';
const CANAL_TIEMPO_REAL = 'ceragric-productores-panel';

export async function listarProductores() {
  const { data, error } = await obtenerClienteSupabase()
    .from(CONFIG.TABLA_PRODUCTORES)
    .select('*')
    .order(COLUMNA_FECHA_REGISTRO, { ascending: false });

  if (error) throw new Error('No se pudieron cargar los registros.');
  return data;
}

export async function actualizarProductor(id, cambios) {
  const { data, error } = await obtenerClienteSupabase()
    .from(CONFIG.TABLA_PRODUCTORES)
    .update(cambios)
    .eq('ceragric_productores_id', id)
    .select()
    .single();

  if (error) throw new Error('No se pudieron guardar los cambios. Revise los datos ingresados.');
  return data;
}

/**
 * Escucha inserciones y actualizaciones en tiempo real. La RLS limita los eventos a administradores.
 */
export function escucharCambiosProductores({ alInsertar, alActualizar, alCambiarEstado }) {
  const canal = obtenerClienteSupabase()
    .channel(CANAL_TIEMPO_REAL)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: CONFIG.TABLA_PRODUCTORES }, ({ new: fila }) =>
      alInsertar(fila)
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: CONFIG.TABLA_PRODUCTORES }, ({ new: fila }) =>
      alActualizar(fila)
    )
    .subscribe((estado) => alCambiarEstado(estado === 'SUBSCRIBED'));

  return () => obtenerClienteSupabase().removeChannel(canal);
}
