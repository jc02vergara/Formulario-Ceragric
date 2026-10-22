import { ESTADOS_CIVILES, GENEROS, NIVELES_ESTUDIO, obtenerEtiqueta } from '../../../../shared/catalogos.js';
import { describirParroquia } from '../../../../shared/services/dpa.service.js';
import { descargarXlsx } from './xlsx.js';

const ENCABEZADOS = [
  'Cédula', 'Nombres', 'Apellido paterno', 'Apellido materno', 'Género', 'Fecha de nacimiento',
  'Estado civil', 'Nivel de estudio', 'Provincia', 'Cantón', 'Parroquia', 'Recinto', 'Teléfono',
  'Latitud', 'Longitud', 'Inspeccionado', 'Fecha de inspección', 'Fecha de registro', 'Última actualización',
];

const FORMATO_FECHA_HORA = new Intl.DateTimeFormat('es-EC', { dateStyle: 'short', timeStyle: 'short' });

function formatearFechaHora(valor) {
  return valor ? FORMATO_FECHA_HORA.format(new Date(valor)) : '';
}

async function construirFila(productor) {
  const ubicacion = await describirParroquia(productor.ceragric_parroquia_id);
  return [
    productor.ceragric_productores_cedula,
    productor.ceragric_productores_nombres,
    productor.ceragric_productores_apellido_paterno,
    productor.ceragric_productores_apellido_materno,
    obtenerEtiqueta(GENEROS, productor.ceragric_productores_genero),
    productor.ceragric_productores_fecha_nacimiento,
    obtenerEtiqueta(ESTADOS_CIVILES, productor.ceragric_productores_estado_civil),
    obtenerEtiqueta(NIVELES_ESTUDIO, productor.ceragric_productores_nivel_estudio),
    ubicacion.provincia,
    ubicacion.canton,
    ubicacion.parroquia,
    productor.ceragric_productores_recinto,
    productor.ceragric_productores_telefono ?? '',
    Number(productor.ceragric_productores_latitud),
    Number(productor.ceragric_productores_longitud),
    productor.ceragric_productores_inspeccionado ? 'Sí' : 'No',
    formatearFechaHora(productor.ceragric_productores_fecha_inspeccion),
    formatearFechaHora(productor.ceragric_productores_fecha_registro),
    formatearFechaHora(productor.ceragric_productores_fecha_actualizacion),
  ];
}

export async function exportarProductoresExcel(productores) {
  const fecha = new Date().toISOString().slice(0, 10);
  descargarXlsx({
    nombreArchivo: `productores-ceragric-${fecha}.xlsx`,
    nombreHoja: 'Productores',
    encabezados: ENCABEZADOS,
    filas: await Promise.all(productores.map(construirFila)),
  });
}
