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

export async function iniciarSelectorUbicacion({ selectProvincia, selectCanton, selectParroquia }) {
  const respuesta = await fetch(RUTA_DPA);
  const provincias = await respuesta.json();
  let cantones = [];

  llenarSelect(selectProvincia, provincias, 'Seleccione una provincia');
  llenarSelect(selectCanton, [], 'Seleccione primero la provincia');
  llenarSelect(selectParroquia, [], 'Seleccione primero el cantón');

  selectProvincia.addEventListener('change', () => {
    cantones = buscarHijos(provincias, selectProvincia.value);
    llenarSelect(selectCanton, cantones, 'Seleccione un cantón');
    llenarSelect(selectParroquia, [], 'Seleccione primero el cantón');
  });

  selectCanton.addEventListener('change', () => {
    llenarSelect(selectParroquia, buscarHijos(cantones, selectCanton.value), 'Seleccione una parroquia');
  });
}
