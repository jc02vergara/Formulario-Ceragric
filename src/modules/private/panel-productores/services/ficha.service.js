import { ESTADOS_CIVILES, GENEROS, NIVELES_ESTUDIO, TIPO_REGISTRO, obtenerEtiqueta } from '../../../../shared/catalogos.js';

const PENDIENTE = 'Pendiente';
import { describirParroquia } from '../../../../shared/services/dpa.service.js';

/**
 * Resumen en texto plano de un productor, listo para pegar en un chat o correo.
 */
export async function construirFicha(productor) {
  const ubicacion = await describirParroquia(productor.ceragric_parroquia_id);
  const nombre = [
    productor.ceragric_productores_nombres,
    productor.ceragric_productores_apellido_paterno,
    productor.ceragric_productores_apellido_materno,
  ]
    .filter(Boolean)
    .join(' ');
  const textoUbicacion = ubicacion.canton
    ? `${ubicacion.provincia} / ${ubicacion.canton} / ${ubicacion.parroquia} — Recinto ${productor.ceragric_productores_recinto ?? PENDIENTE}`
    : PENDIENTE;
  const textoGps =
    productor.ceragric_productores_latitud === null
      ? PENDIENTE
      : `${productor.ceragric_productores_latitud}, ${productor.ceragric_productores_longitud}`;

  return [
    `Productor: ${nombre}`,
    ...(productor.ceragric_productores_tipo_registro === TIPO_REGISTRO.RAPIDO ? ['Tipo: Registro rápido (datos por completar)'] : []),
    `Cédula: ${productor.ceragric_productores_cedula}`,
    `Género: ${obtenerEtiqueta(GENEROS, productor.ceragric_productores_genero) || PENDIENTE}`,
    `Fecha de nacimiento: ${productor.ceragric_productores_fecha_nacimiento ?? PENDIENTE}`,
    `Estado civil: ${obtenerEtiqueta(ESTADOS_CIVILES, productor.ceragric_productores_estado_civil) || PENDIENTE}`,
    `Nivel de estudio: ${obtenerEtiqueta(NIVELES_ESTUDIO, productor.ceragric_productores_nivel_estudio) || PENDIENTE}`,
    `Ubicación: ${textoUbicacion}`,
    `Teléfono: ${productor.ceragric_productores_telefono ?? 'No registrado'}`,
    `GPS: ${textoGps}`,
    `Inspección en campo: ${productor.ceragric_productores_inspeccionado ? 'Realizada' : 'Pendiente'}`,
  ].join('\n');
}
