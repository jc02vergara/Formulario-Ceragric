import { obtenerClienteSupabase } from '../../../../core/supabase-cliente.js';

export class SinPermisoError extends Error {}

export async function obtenerSesionActual() {
  const { data } = await obtenerClienteSupabase().auth.getSession();
  return data.session;
}

export async function iniciarSesion(correo, contrasena) {
  const { error } = await obtenerClienteSupabase().auth.signInWithPassword({ email: correo, password: contrasena });
  if (error) throw new Error('Correo o contraseña incorrectos.');
}

export async function cerrarSesion() {
  await obtenerClienteSupabase().auth.signOut();
}

export async function verificarAdministrador() {
  const { data, error } = await obtenerClienteSupabase().rpc('ceragric_es_administrador');
  if (error || data !== true) throw new SinPermisoError();
}
