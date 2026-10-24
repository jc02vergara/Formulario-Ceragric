import { ESTADOS_CIVILES, GENEROS, NIVELES_ESTUDIO, TIPO_REGISTRO } from '../../../../shared/catalogos.js';
import { iniciarSelectorUbicacion } from '../../../../shared/components/selector-ubicacion.js';
import { normalizarNombrePropio } from '../../../../shared/utils/texto.js';

function llenarCatalogo(select, catalogo) {
  for (const { valor, etiqueta } of catalogo) select.add(new Option(etiqueta, String(valor)));
}

// Campos que un registro rápido puede dejar vacíos; en un registro completo son obligatorios.
const CAMPOS_COMPLETOS = [
  'apellido_paterno', 'apellido_materno', 'genero', 'fecha_nacimiento', 'estado_civil', 'nivel_estudio',
  'provincia', 'canton', 'parroquia', 'recinto', 'latitud', 'longitud',
];

// Un campo vacío se envía como null (registro rápido aún incompleto).
const leerTexto = (datos, nombre) => normalizarNombrePropio(datos.get(nombre) ?? '') || null;
const leerNumero = (datos, nombre) => (datos.get(nombre) ? Number(datos.get(nombre)) : null);
const leerValor = (datos, nombre) => datos.get(nombre) || null;

function construirCambios(datos) {
  return {
    ceragric_productores_nombres: leerTexto(datos, 'nombres'),
    ceragric_productores_apellido_paterno: leerTexto(datos, 'apellido_paterno'),
    ceragric_productores_apellido_materno: leerTexto(datos, 'apellido_materno'),
    ceragric_productores_genero: leerNumero(datos, 'genero'),
    ceragric_productores_fecha_nacimiento: leerValor(datos, 'fecha_nacimiento'),
    ceragric_productores_estado_civil: leerNumero(datos, 'estado_civil'),
    ceragric_productores_nivel_estudio: leerNumero(datos, 'nivel_estudio'),
    ceragric_parroquia_id: leerValor(datos, 'parroquia'),
    ceragric_productores_recinto: leerTexto(datos, 'recinto'),
    ceragric_productores_telefono: (datos.get('telefono') ?? '').replace(/\D/g, '') || null,
    ceragric_productores_latitud: leerNumero(datos, 'latitud'),
    ceragric_productores_longitud: leerNumero(datos, 'longitud'),
  };
}

/**
 * Diálogo modal para editar un productor. La cédula es de solo lectura.
 * En un registro rápido los datos pendientes son opcionales; al completarlos todos, la base lo pasa a completo.
 */
export async function crearDialogoEdicion({ dialogo, alGuardar }) {
  const formulario = dialogo.querySelector('form');
  const campos = formulario.elements;
  const mensajeError = dialogo.querySelector('[data-error]');
  const botonGuardar = dialogo.querySelector('[data-guardar]');
  const notaRegistroRapido = dialogo.querySelector('[data-nota-rapido]');
  let productorActual = null;

  llenarCatalogo(campos.genero, GENEROS);
  llenarCatalogo(campos.estado_civil, ESTADOS_CIVILES);
  llenarCatalogo(campos.nivel_estudio, NIVELES_ESTUDIO);

  const selector = await iniciarSelectorUbicacion({
    selectProvincia: campos.provincia,
    selectCanton: campos.canton,
    selectParroquia: campos.parroquia,
  });

  dialogo.querySelector('[data-cancelar]').addEventListener('click', () => dialogo.close());

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mensajeError.hidden = true;
    if (!formulario.reportValidity()) return;

    botonGuardar.disabled = true;
    try {
      await alGuardar(productorActual.ceragric_productores_id, construirCambios(new FormData(formulario)));
      dialogo.close();
    } catch (error) {
      mensajeError.textContent = error.message;
      mensajeError.hidden = false;
    } finally {
      botonGuardar.disabled = false;
    }
  });

  return {
    abrir(productor) {
      productorActual = productor;
      mensajeError.hidden = true;
      const esRapido = productor.ceragric_productores_tipo_registro === TIPO_REGISTRO.RAPIDO;
      notaRegistroRapido.hidden = !esRapido;
      for (const nombre of CAMPOS_COMPLETOS) campos[nombre].required = !esRapido;
      campos.telefono.required = esRapido;

      campos.cedula.value = productor.ceragric_productores_cedula;
      campos.nombres.value = productor.ceragric_productores_nombres;
      campos.apellido_paterno.value = productor.ceragric_productores_apellido_paterno ?? '';
      campos.apellido_materno.value = productor.ceragric_productores_apellido_materno ?? '';
      campos.genero.value = productor.ceragric_productores_genero ?? '';
      campos.fecha_nacimiento.value = productor.ceragric_productores_fecha_nacimiento ?? '';
      campos.estado_civil.value = productor.ceragric_productores_estado_civil ?? '';
      campos.nivel_estudio.value = productor.ceragric_productores_nivel_estudio ?? '';
      campos.recinto.value = productor.ceragric_productores_recinto ?? '';
      campos.telefono.value = productor.ceragric_productores_telefono ?? '';
      campos.latitud.value = productor.ceragric_productores_latitud ?? '';
      campos.longitud.value = productor.ceragric_productores_longitud ?? '';
      selector.establecerParroquia(productor.ceragric_parroquia_id);
      dialogo.showModal();
    },
  };
}
