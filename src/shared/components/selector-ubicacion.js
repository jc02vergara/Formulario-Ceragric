import { buscarHijos, cargarProvincias } from '../services/dpa.service.js';
import { aTituloLegible } from '../utils/texto.js';

function llenarSelect(select, opciones, textoVacio) {
  select.replaceChildren(new Option(textoVacio, ''));
  for (const [codigo, nombre] of opciones) select.add(new Option(aTituloLegible(nombre), codigo));
  select.disabled = opciones.length === 0;
}

/**
 * Enlaza tres selects en cascada (provincia > cantón > parroquia).
 * Devuelve `establecerParroquia(codigo)` para preseleccionar los tres niveles a partir de una parroquia
 * (con `null` deja los tres selects vacíos).
 */
export async function iniciarSelectorUbicacion({
  selectProvincia,
  selectCanton,
  selectParroquia,
  provinciaPredeterminada,
}) {
  const provincias = await cargarProvincias();
  let cantones = [];

  const cargarCantones = () => {
    cantones = buscarHijos(provincias, selectProvincia.value);
    llenarSelect(selectCanton, cantones, cantones.length ? 'Seleccione un cantón' : 'Seleccione primero la provincia');
    llenarSelect(selectParroquia, [], 'Seleccione primero el cantón');
  };

  const cargarParroquias = () => {
    llenarSelect(selectParroquia, buscarHijos(cantones, selectCanton.value), 'Seleccione una parroquia');
  };

  llenarSelect(selectProvincia, provincias, 'Seleccione una provincia');
  selectProvincia.value = provinciaPredeterminada ?? '';
  cargarCantones();

  selectProvincia.addEventListener('change', cargarCantones);
  selectCanton.addEventListener('change', cargarParroquias);

  return {
    establecerParroquia(codigoParroquia) {
      selectProvincia.value = codigoParroquia?.slice(0, 2) ?? '';
      cargarCantones();
      if (!codigoParroquia) return;
      selectCanton.value = codigoParroquia.slice(0, 4);
      cargarParroquias();
      selectParroquia.value = codigoParroquia;
    },
  };
}
