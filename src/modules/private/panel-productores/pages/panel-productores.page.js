import { crearDialogoEdicion } from '../components/dialogo-edicion.js';
import { crearTablaProductores } from '../components/tabla-productores.js';
import {
  actualizarProductor,
  escucharCambiosProductores,
  listarProductores,
  obtenerProductor,
} from '../services/productores.service.js';
import {
  SinPermisoError,
  cerrarSesion,
  iniciarSesion,
  obtenerSesionActual,
  verificarAdministrador,
} from '../services/sesion.service.js';

const MENSAJE_SIN_PERMISO = 'Esta cuenta no tiene permisos de administrador.';

export async function iniciarPanelProductores() {
  const vistaAcceso = document.getElementById('vista-acceso');
  const vistaPanel = document.getElementById('vista-panel');
  const formularioAcceso = document.getElementById('formulario-acceso');
  const errorAcceso = document.getElementById('error-acceso');
  const estadoConexion = document.getElementById('estado-conexion');
  const indicadorVivo = document.getElementById('indicador-vivo');
  let dejarDeEscuchar = null;

  const tabla = crearTablaProductores({
    cuerpo: document.getElementById('cuerpo-productores'),
    inputBusqueda: document.getElementById('busqueda'),
    contador: document.getElementById('contador'),
    estadoVacio: document.getElementById('estado-vacio'),
    alEditar: (productor) => dialogo.abrir(productor),
  });

  const dialogo = await crearDialogoEdicion({
    dialogo: document.getElementById('dialogo-edicion'),
    alGuardar: async (id, cambios) => tabla.reemplazar(await actualizarProductor(id, cambios)),
  });

  const refrescarFila = async (id, aplicar) => {
    if (!id) return;
    try {
      await aplicar(await obtenerProductor(id));
    } catch {
      // Si el registro ya no es visible (sesión expirada o permisos), se conserva la fila actual.
    }
  };

  const mostrarAcceso = (mensaje = '') => {
    dejarDeEscuchar?.();
    vistaPanel.hidden = true;
    vistaAcceso.hidden = false;
    errorAcceso.textContent = mensaje;
    errorAcceso.hidden = !mensaje;
  };

  const mostrarPanel = async () => {
    try {
      await verificarAdministrador();
    } catch (error) {
      await cerrarSesion();
      mostrarAcceso(error instanceof SinPermisoError ? MENSAJE_SIN_PERMISO : error.message);
      return;
    }

    vistaAcceso.hidden = true;
    vistaPanel.hidden = false;
    await tabla.cargar(await listarProductores());
    dejarDeEscuchar = escucharCambiosProductores({
      alInsertar: (id) => refrescarFila(id, tabla.agregar),
      alActualizar: (id) => refrescarFila(id, tabla.reemplazar),
      alCambiarEstado: (conectado) => {
        estadoConexion.textContent = conectado ? 'En vivo' : 'Sin conexión en vivo';
        indicadorVivo.hidden = !conectado;
      },
    });
  };

  formularioAcceso.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datos = new FormData(formularioAcceso);
    try {
      await iniciarSesion(datos.get('correo'), datos.get('contrasena'));
      formularioAcceso.reset();
      await mostrarPanel();
    } catch (error) {
      mostrarAcceso(error.message);
    }
  });

  document.getElementById('boton-salir').addEventListener('click', async () => {
    await cerrarSesion();
    mostrarAcceso();
  });

  if (await obtenerSesionActual()) await mostrarPanel();
  else mostrarAcceso();
}
