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

export async function obtenerProductor(id) {
  const { data, error } = await obtenerClienteSupabase()
    .from(CONFIG.TABLA_PRODUCTORES)
    .select('*')
    .eq('ceragric_productores_id', id)
    .single();

  if (error) throw new Error('No se pudo cargar el registro.');
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

export async function eliminarProductor(id) {
  const { error } = await obtenerClienteSupabase()
    .from(CONFIG.TABLA_PRODUCTORES)
    .delete()
    .eq('ceragric_productores_id', id);

  if (error) throw new Error('No se pudo eliminar el registro.');
}

/**
 * Escucha inserciones, actualizaciones y eliminaciones en tiempo real. La RLS limita los eventos a administradores.
 * Solo entrega el id: el payload de Realtime puede llegar incompleto, así que la fila se vuelve a consultar.
 */
export function escucharCambiosProductores({ alInsertar, alActualizar, alEliminar, alCambiarEstado }) {
  const canal = obtenerClienteSupabase()
    .channel(CANAL_TIEMPO_REAL)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: CONFIG.TABLA_PRODUCTORES }, ({ new: fila }) =>
      alInsertar(fila?.ceragric_productores_id)
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: CONFIG.TABLA_PRODUCTORES }, ({ new: fila }) =>
      alActualizar(fila?.ceragric_productores_id)
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: CONFIG.TABLA_PRODUCTORES }, ({ old: fila }) =>
      alEliminar(fila?.ceragric_productores_id)
    )
    .subscribe((estado) => alCambiarEstado(estado === 'SUBSCRIBED'));

  return () => obtenerClienteSupabase().removeChannel(canal);
}
