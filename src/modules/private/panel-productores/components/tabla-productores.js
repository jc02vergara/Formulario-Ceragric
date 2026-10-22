import { GENEROS, obtenerEtiqueta } from '../../../../shared/catalogos.js';
import { describirParroquia } from '../../../../shared/services/dpa.service.js';
import { crearCeldaAcciones } from './menu-acciones.js';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', { dateStyle: 'short', timeStyle: 'short' });
const FORMATO_FECHA_CORTA = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium' });
const DURACION_RESALTADO_MS = 4000;

export function nombreCompleto(productor) {
  return [
    productor.ceragric_productores_nombres,
    productor.ceragric_productores_apellido_paterno,
    productor.ceragric_productores_apellido_materno,
  ].join(' ');
}

function crearCelda(texto, etiqueta) {
  const celda = document.createElement('td');
  celda.textContent = texto;
  celda.dataset.etiqueta = etiqueta;
  return celda;
}

function crearCeldaInspeccion(productor, alMarcar) {
  const celda = document.createElement('td');
  celda.dataset.etiqueta = 'Inspeccionado';
  const etiqueta = document.createElement('label');
  etiqueta.className = 'casilla';
  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = productor.ceragric_productores_inspeccionado;
  casilla.setAttribute('aria-label', 'Inspeccionado en campo');
  const fecha = document.createElement('span');
  fecha.className = 'casilla__fecha';
  fecha.textContent = productor.ceragric_productores_fecha_inspeccion
    ? FORMATO_FECHA_CORTA.format(new Date(productor.ceragric_productores_fecha_inspeccion))
    : 'Pendiente';

  casilla.addEventListener('change', async () => {
    casilla.disabled = true;
    const exito = await alMarcar(productor.ceragric_productores_id, casilla.checked);
    if (!exito) casilla.checked = !casilla.checked;
    casilla.disabled = false;
  });

  etiqueta.append(casilla, fecha);
  celda.append(etiqueta);
  return celda;
}

/**
 * Tabla de productores con búsqueda por texto y filtros externos. Todo el contenido se inserta con textContent (sin HTML crudo).
 */
export function crearTablaProductores({ cuerpo, inputBusqueda, contador, estadoVacio, acciones, filtro, alCambiarDatos }) {
  const productores = new Map();

  // Un solo menú abierto a la vez; se cierra al hacer clic fuera o con Escape.
  document.addEventListener('click', (evento) => {
    for (const menu of cuerpo.querySelectorAll('details.menu[open]')) {
      if (!menu.contains(evento.target)) menu.open = false;
    }
  });
  // El menú usa posición fija: al desplazar la página se cierra para no quedar desalineado.
  window.addEventListener(
    'scroll',
    () => {
      for (const menu of cuerpo.querySelectorAll('details.menu[open]')) menu.open = false;
    },
    { capture: true, passive: true }
  );
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    for (const menu of cuerpo.querySelectorAll('details.menu[open]')) menu.open = false;
  });

  const coincide = (productor) => {
    if (!filtro.coincide(productor)) return false;
    const termino = inputBusqueda.value.trim().toUpperCase();
    if (!termino) return true;
    return `${productor.ceragric_productores_cedula} ${nombreCompleto(productor)} ${productor.ceragric_productores_recinto}`
      .toUpperCase()
      .includes(termino);
  };

  const notificarCambioDatos = () => alCambiarDatos([...productores.values()]);

  const crearFila = async (productor) => {
    const ubicacion = await describirParroquia(productor.ceragric_parroquia_id);
    const fila = document.createElement('tr');
    fila.dataset.id = productor.ceragric_productores_id;
    fila.classList.toggle('fila--inspeccionada', productor.ceragric_productores_inspeccionado);

    fila.append(
      crearCelda(productor.ceragric_productores_cedula, 'Cédula'),
      crearCelda(nombreCompleto(productor), 'Productor'),
      crearCelda(obtenerEtiqueta(GENEROS, productor.ceragric_productores_genero), 'Género'),
      crearCelda(`${ubicacion.canton} / ${ubicacion.parroquia}`, 'Cantón / Parroquia'),
      crearCelda(productor.ceragric_productores_recinto, 'Recinto'),
      crearCelda(productor.ceragric_productores_telefono ?? '—', 'Teléfono'),
      crearCelda(FORMATO_FECHA.format(new Date(productor.ceragric_productores_fecha_registro)), 'Registro'),
      crearCeldaInspeccion(productor, acciones.alMarcarInspeccion),
      crearCeldaAcciones(productor, acciones)
    );
    fila.hidden = !coincide(productor);
    return fila;
  };

  const actualizarContador = () => {
    const visibles = cuerpo.querySelectorAll('tr:not([hidden])').length;
    contador.textContent = `${visibles} de ${productores.size} registros`;
    estadoVacio.hidden = productores.size > 0;
  };

  const resaltar = (fila) => {
    fila.classList.add('fila--nueva');
    setTimeout(() => fila.classList.remove('fila--nueva'), DURACION_RESALTADO_MS);
  };

  const refiltrar = () => {
    for (const fila of cuerpo.rows) fila.hidden = !coincide(productores.get(fila.dataset.id));
    actualizarContador();
  };

  inputBusqueda.addEventListener('input', refiltrar);

  return {
    refiltrar,

    obtener(id) {
      return productores.get(id);
    },

    eliminar(id) {
      productores.delete(id);
      cuerpo.querySelector(`tr[data-id="${CSS.escape(id)}"]`)?.remove();
      actualizarContador();
      notificarCambioDatos();
    },

    obtenerVisibles() {
      return [...cuerpo.rows].filter((fila) => !fila.hidden).map((fila) => productores.get(fila.dataset.id));
    },

    async cargar(lista) {
      productores.clear();
      for (const productor of lista) productores.set(productor.ceragric_productores_id, productor);
      cuerpo.replaceChildren(...(await Promise.all(lista.map(crearFila))));
      actualizarContador();
      notificarCambioDatos();
    },

    async agregar(productor) {
      if (productores.has(productor.ceragric_productores_id)) return;
      productores.set(productor.ceragric_productores_id, productor);
      const fila = await crearFila(productor);
      cuerpo.prepend(fila);
      resaltar(fila);
      actualizarContador();
      notificarCambioDatos();
    },

    async reemplazar(productor) {
      productores.set(productor.ceragric_productores_id, productor);
      const filaNueva = await crearFila(productor);
      // La fila anterior se busca después de construir la nueva: el guardado y Realtime pueden llegar casi a la vez.
      const filaAnterior = cuerpo.querySelector(`tr[data-id="${CSS.escape(productor.ceragric_productores_id)}"]`);
      if (filaAnterior) filaAnterior.replaceWith(filaNueva);
      else cuerpo.prepend(filaNueva);
      resaltar(filaNueva);
      actualizarContador();
      notificarCambioDatos();
    },
  };
}
