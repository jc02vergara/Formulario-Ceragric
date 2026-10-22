import { crearAviso } from '../components/aviso.js';
import { crearDialogoConfirmacion } from '../components/dialogo-confirmacion.js';
import { crearDialogoEdicion } from '../components/dialogo-edicion.js';
import { crearFiltrosProductores } from '../components/filtros-productores.js';
import { crearTablaProductores, nombreCompleto } from '../components/tabla-productores.js';
import { exportarProductoresExcel } from '../services/exportar-productores.service.js';
import { construirFicha } from '../services/ficha.service.js';
import {
  actualizarProductor,
  eliminarProductor,
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

  const mostrarAviso = crearAviso(document.getElementById('aviso'));
  const confirmacion = crearDialogoConfirmacion(document.getElementById('dialogo-confirmacion'));

  const copiar = async (texto, mensajeExito) => {
    try {
      await navigator.clipboard.writeText(texto);
      mostrarAviso(mensajeExito);
    } catch {
      mostrarAviso('No se pudo copiar al portapapeles.', 'error');
    }
  };

  const confirmarYEliminar = async (id) => {
    const productor = tabla.obtener(id);
    const aceptado = await confirmacion.confirmar({
      textoTitulo: 'Eliminar registro',
      textoDescripcion: `Se eliminará definitivamente a ${nombreCompleto(productor)} (cédula ${productor.ceragric_productores_cedula}). Esta acción no se puede deshacer.`,
      textoAceptar: 'Eliminar',
    });
    if (!aceptado) return;

    try {
      await eliminarProductor(id);
      tabla.eliminar(id);
      mostrarAviso('Registro eliminado.');
    } catch (error) {
      mostrarAviso(error.message, 'error');
    }
  };

  const marcarInspeccion = async (id, inspeccionado) => {
    try {
      await tabla.reemplazar(await actualizarProductor(id, { ceragric_productores_inspeccionado: inspeccionado }));
      mostrarAviso(inspeccionado ? 'Marcado como inspeccionado.' : 'Inspección desmarcada.');
      return true;
    } catch {
      mostrarAviso('No se pudo actualizar la inspección. Intente nuevamente.', 'error');
      return false;
    }
  };

  const filtros = crearFiltrosProductores({
    selectCanton: document.getElementById('filtro-canton'),
    selectParroquia: document.getElementById('filtro-parroquia'),
    selectInspeccion: document.getElementById('filtro-inspeccion'),
    botonLimpiar: document.getElementById('boton-limpiar-filtros'),
    alCambiar: () => tabla.refiltrar(),
  });

  const tabla = crearTablaProductores({
    cuerpo: document.getElementById('cuerpo-productores'),
    inputBusqueda: document.getElementById('busqueda'),
    contador: document.getElementById('contador'),
    estadoVacio: document.getElementById('estado-vacio'),
    acciones: {
      alEditar: (id) => dialogo.abrir(tabla.obtener(id)),
      alCopiarCedula: (id) => copiar(tabla.obtener(id).ceragric_productores_cedula, 'Cédula copiada.'),
      alCopiarFicha: async (id) => copiar(await construirFicha(tabla.obtener(id)), 'Ficha copiada.'),
      alEliminar: confirmarYEliminar,
      alMarcarInspeccion: marcarInspeccion,
    },
    filtro: filtros,
    alCambiarDatos: async (productores) => {
      await filtros.actualizarOpciones(productores);
      tabla.refiltrar();
    },
  });

  const dialogo = await crearDialogoEdicion({
    dialogo: document.getElementById('dialogo-edicion'),
    alGuardar: async (id, cambios) => {
      await tabla.reemplazar(await actualizarProductor(id, cambios));
      mostrarAviso('Cambios guardados.');
    },
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
      alEliminar: (id) => id && tabla.eliminar(id),
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

  document.getElementById('boton-exportar').addEventListener('click', () =>
    exportarProductoresExcel(tabla.obtenerVisibles())
  );

  document.getElementById('boton-salir').addEventListener('click', async () => {
    await cerrarSesion();
    mostrarAcceso();
  });

  if (await obtenerSesionActual()) await mostrarPanel();
  else mostrarAcceso();
}
