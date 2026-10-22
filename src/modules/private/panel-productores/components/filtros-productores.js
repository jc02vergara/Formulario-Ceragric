import { describirParroquia } from '../../../../shared/services/dpa.service.js';

const ESTADOS_INSPECCION = Object.freeze({ TODOS: '', INSPECCIONADOS: 'si', PENDIENTES: 'no' });

function reemplazarOpciones(select, textoTodos, opciones) {
  const valorActual = select.value;
  select.replaceChildren(new Option(textoTodos, ''));
  for (const [valor, texto] of opciones) select.add(new Option(texto, valor));
  // Conserva la selección si sigue existiendo entre las opciones nuevas.
  select.value = opciones.some(([valor]) => valor === valorActual) ? valorActual : '';
}

function ordenarPorTexto(mapa) {
  return [...mapa].sort(([, a], [, b]) => a.localeCompare(b, 'es'));
}

/**
 * Filtros por cantón, parroquia y estado de inspección. Las opciones salen de los registros existentes.
 */
export function crearFiltrosProductores({ selectCanton, selectParroquia, selectInspeccion, botonLimpiar, alCambiar }) {
  let productoresActuales = [];

  const actualizarParroquias = async () => {
    const cantonSeleccionado = selectCanton.value;
    const parroquias = new Map();
    for (const productor of productoresActuales) {
      const codigo = productor.ceragric_parroquia_id;
      if (cantonSeleccionado && !codigo.startsWith(cantonSeleccionado)) continue;
      if (!parroquias.has(codigo)) parroquias.set(codigo, (await describirParroquia(codigo)).parroquia);
    }
    reemplazarOpciones(selectParroquia, 'Todas las parroquias', ordenarPorTexto(parroquias));
  };

  const actualizarBotonLimpiar = () => {
    botonLimpiar.hidden = !selectCanton.value && !selectParroquia.value && !selectInspeccion.value;
  };

  selectCanton.addEventListener('change', async () => {
    await actualizarParroquias();
    actualizarBotonLimpiar();
    alCambiar();
  });

  for (const select of [selectParroquia, selectInspeccion]) {
    select.addEventListener('change', () => {
      actualizarBotonLimpiar();
      alCambiar();
    });
  }

  botonLimpiar.addEventListener('click', async () => {
    selectCanton.value = '';
    selectInspeccion.value = ESTADOS_INSPECCION.TODOS;
    await actualizarParroquias();
    selectParroquia.value = '';
    actualizarBotonLimpiar();
    alCambiar();
  });

  actualizarBotonLimpiar();

  return {
    async actualizarOpciones(productores) {
      productoresActuales = productores;
      const cantones = new Map();
      for (const productor of productores) {
        const codigo = productor.ceragric_parroquia_id.slice(0, 4);
        if (!cantones.has(codigo)) cantones.set(codigo, (await describirParroquia(productor.ceragric_parroquia_id)).canton);
      }
      reemplazarOpciones(selectCanton, 'Todos los cantones', ordenarPorTexto(cantones));
      await actualizarParroquias();
      actualizarBotonLimpiar();
    },

    coincide(productor) {
      const codigo = productor.ceragric_parroquia_id;
      if (selectCanton.value && !codigo.startsWith(selectCanton.value)) return false;
      if (selectParroquia.value && codigo !== selectParroquia.value) return false;
      if (selectInspeccion.value === ESTADOS_INSPECCION.INSPECCIONADOS) return productor.ceragric_productores_inspeccionado;
      if (selectInspeccion.value === ESTADOS_INSPECCION.PENDIENTES) return !productor.ceragric_productores_inspeccionado;
      return true;
    },
  };
}
