import { GENEROS, obtenerEtiqueta } from '../../../../shared/catalogos.js';
import { describirParroquia } from '../../../../shared/services/dpa.service.js';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', { dateStyle: 'short', timeStyle: 'short' });
const DURACION_RESALTADO_MS = 4000;

function nombreCompleto(productor) {
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

function crearEnlaceMapa(productor) {
  const enlace = document.createElement('a');
  enlace.href = `https://www.google.com/maps?q=${productor.ceragric_productores_latitud},${productor.ceragric_productores_longitud}`;
  enlace.target = '_blank';
  enlace.rel = 'noopener noreferrer';
  enlace.textContent = 'Ver mapa';
  return enlace;
}

/**
 * Tabla de productores con filtro por texto. Todo el contenido se inserta con textContent (sin HTML crudo).
 */
export function crearTablaProductores({ cuerpo, inputBusqueda, contador, estadoVacio, alEditar }) {
  const productores = new Map();

  const coincideBusqueda = (productor) => {
    const termino = inputBusqueda.value.trim().toUpperCase();
    if (!termino) return true;
    return `${productor.ceragric_productores_cedula} ${nombreCompleto(productor)} ${productor.ceragric_productores_recinto}`
      .toUpperCase()
      .includes(termino);
  };

  const crearFila = async (productor) => {
    const ubicacion = await describirParroquia(productor.ceragric_parroquia_id);
    const fila = document.createElement('tr');
    fila.dataset.id = productor.ceragric_productores_id;

    const celdaMapa = document.createElement('td');
    celdaMapa.dataset.etiqueta = 'GPS';
    celdaMapa.append(crearEnlaceMapa(productor));

    const celdaAccion = document.createElement('td');
    const botonEditar = document.createElement('button');
    botonEditar.type = 'button';
    botonEditar.className = 'boton boton--secundario boton--compacto';
    botonEditar.textContent = 'Editar';
    botonEditar.addEventListener('click', () => alEditar(productores.get(productor.ceragric_productores_id)));
    celdaAccion.append(botonEditar);

    fila.append(
      crearCelda(productor.ceragric_productores_cedula, 'Cédula'),
      crearCelda(nombreCompleto(productor), 'Productor'),
      crearCelda(obtenerEtiqueta(GENEROS, productor.ceragric_productores_genero), 'Género'),
      crearCelda(`${ubicacion.canton} / ${ubicacion.parroquia}`, 'Cantón / Parroquia'),
      crearCelda(productor.ceragric_productores_recinto, 'Recinto'),
      crearCelda(productor.ceragric_productores_telefono ?? '—', 'Teléfono'),
      crearCelda(FORMATO_FECHA.format(new Date(productor.ceragric_productores_fecha_registro)), 'Registro'),
      celdaMapa,
      celdaAccion
    );
    fila.hidden = !coincideBusqueda(productor);
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

  inputBusqueda.addEventListener('input', () => {
    for (const fila of cuerpo.rows) fila.hidden = !coincideBusqueda(productores.get(fila.dataset.id));
    actualizarContador();
  });

  return {
    async cargar(lista) {
      productores.clear();
      for (const productor of lista) productores.set(productor.ceragric_productores_id, productor);
      cuerpo.replaceChildren(...(await Promise.all(lista.map(crearFila))));
      actualizarContador();
    },

    async agregar(productor) {
      if (productores.has(productor.ceragric_productores_id)) return;
      productores.set(productor.ceragric_productores_id, productor);
      const fila = await crearFila(productor);
      cuerpo.prepend(fila);
      resaltar(fila);
      actualizarContador();
    },

    async reemplazar(productor) {
      productores.set(productor.ceragric_productores_id, productor);
      const filaAnterior = cuerpo.querySelector(`tr[data-id="${CSS.escape(productor.ceragric_productores_id)}"]`);
      const filaNueva = await crearFila(productor);
      if (filaAnterior) filaAnterior.replaceWith(filaNueva);
      else cuerpo.prepend(filaNueva);
      resaltar(filaNueva);
      actualizarContador();
    },
  };
}
