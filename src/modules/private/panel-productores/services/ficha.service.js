import { ESTADOS_CIVILES, GENEROS, NIVELES_ESTUDIO, obtenerEtiqueta } from '../../../../shared/catalogos.js';
import { describirParroquia } from '../../../../shared/services/dpa.service.js';

/**
 * Resumen en texto plano de un productor, listo para pegar en un chat o correo.
 */
export async function construirFicha(productor) {
  const ubicacion = await describirParroquia(productor.ceragric_parroquia_id);
  return [
    `Productor: ${productor.ceragric_productores_nombres} ${productor.ceragric_productores_apellido_paterno} ${productor.ceragric_productores_apellido_materno}`,
    `Cédula: ${productor.ceragric_productores_cedula}`,
    `Género: ${obtenerEtiqueta(GENEROS, productor.ceragric_productores_genero)}`,
    `Fecha de nacimiento: ${productor.ceragric_productores_fecha_nacimiento}`,
    `Estado civil: ${obtenerEtiqueta(ESTADOS_CIVILES, productor.ceragric_productores_estado_civil)}`,
    `Nivel de estudio: ${obtenerEtiqueta(NIVELES_ESTUDIO, productor.ceragric_productores_nivel_estudio)}`,
    `Ubicación: ${ubicacion.provincia} / ${ubicacion.canton} / ${ubicacion.parroquia} — Recinto ${productor.ceragric_productores_recinto}`,
    `Teléfono: ${productor.ceragric_productores_telefono ?? 'No registrado'}`,
    `GPS: ${productor.ceragric_productores_latitud}, ${productor.ceragric_productores_longitud}`,
  ].join('\n');
}
