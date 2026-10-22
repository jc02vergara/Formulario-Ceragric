import { aTituloLegible } from '../utils/texto.js';

const RUTA_DPA = new URL('../../assets/data/dpa-ecuador.json', import.meta.url);

let promesaProvincias = null;

// Estructura del JSON: [codigo, nombre, hijos[]] por nivel (provincia > cantón > parroquia), códigos DPA del INEC.
export function cargarProvincias() {
  promesaProvincias ??= fetch(RUTA_DPA).then((respuesta) => respuesta.json());
  return promesaProvincias;
}

export function buscarHijos(lista, codigo) {
  return lista.find(([codigoItem]) => codigoItem === codigo)?.[2] ?? [];
}

/**
 * Devuelve los nombres legibles de provincia, cantón y parroquia a partir del código de parroquia (6 dígitos).
 */
export async function describirParroquia(codigoParroquia) {
  const provincias = await cargarProvincias();
  const provincia = provincias.find(([codigo]) => codigo === codigoParroquia.slice(0, 2));
  const canton = provincia?.[2].find(([codigo]) => codigo === codigoParroquia.slice(0, 4));
  const parroquia = canton?.[2].find(([codigo]) => codigo === codigoParroquia);

  return {
    provincia: provincia ? aTituloLegible(provincia[1]) : '',
    canton: canton ? aTituloLegible(canton[1]) : '',
    parroquia: parroquia ? aTituloLegible(parroquia[1]) : '',
  };
}
