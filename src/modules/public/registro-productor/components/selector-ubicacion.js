import { aTituloLegible } from '../../../../shared/utils/texto.js';

const RUTA_DPA = new URL('../../../../assets/data/dpa-ecuador.json', import.meta.url);

// Estructura del JSON: [codigo, nombre, hijos[]] por nivel (provincia > cantón > parroquia), códigos DPA del INEC.
function llenarSelect(select, opciones, textoVacio) {
  select.replaceChildren(new Option(textoVacio, ''));
  for (const [codigo, nombre] of opciones) select.add(new Option(aTituloLegible(nombre), codigo));
  select.disabled = opciones.length === 0;
}

function buscarHijos(lista, codigo) {
  return lista.find(([codigoItem]) => codigoItem === codigo)?.[2] ?? [];
}

export async function iniciarSelectorUbicacion({
  selectProvincia,
  selectCanton,
  selectParroquia,
  provinciaPredeterminada,
}) {
  const respuesta = await fetch(RUTA_DPA);
  const provincias = await respuesta.json();
  let cantones = [];

  const cargarCantones = () => {
    cantones = buscarHijos(provincias, selectProvincia.value);
    llenarSelect(selectCanton, cantones, cantones.length ? 'Seleccione un cantón' : 'Seleccione primero la provincia');
    llenarSelect(selectParroquia, [], 'Seleccione primero el cantón');
  };

  llenarSelect(selectProvincia, provincias, 'Seleccione una provincia');
  selectProvincia.value = provinciaPredeterminada ?? '';
  cargarCantones();

  selectProvincia.addEventListener('change', cargarCantones);

  selectCanton.addEventListener('change', () => {
    llenarSelect(selectParroquia, buscarHijos(cantones, selectCanton.value), 'Seleccione una parroquia');
  });
}
