import { ESTADOS_CIVILES, GENEROS, NIVELES_ESTUDIO } from '../../../../shared/catalogos.js';
import { iniciarSelectorUbicacion } from '../../../../shared/components/selector-ubicacion.js';
import { normalizarNombrePropio } from '../../../../shared/utils/texto.js';

function llenarCatalogo(select, catalogo) {
  for (const { valor, etiqueta } of catalogo) select.add(new Option(etiqueta, String(valor)));
}

function construirCambios(datos) {
  const telefono = datos.get('telefono').replace(/\D/g, '');
  return {
    ceragric_productores_nombres: normalizarNombrePropio(datos.get('nombres')),
    ceragric_productores_apellido_paterno: normalizarNombrePropio(datos.get('apellido_paterno')),
    ceragric_productores_apellido_materno: normalizarNombrePropio(datos.get('apellido_materno')),
    ceragric_productores_genero: Number(datos.get('genero')),
    ceragric_productores_fecha_nacimiento: datos.get('fecha_nacimiento'),
    ceragric_productores_estado_civil: Number(datos.get('estado_civil')),
    ceragric_productores_nivel_estudio: Number(datos.get('nivel_estudio')),
    ceragric_parroquia_id: datos.get('parroquia'),
    ceragric_productores_recinto: normalizarNombrePropio(datos.get('recinto')),
    ceragric_productores_telefono: telefono || null,
  };
}

/**
 * Diálogo modal para editar un productor. La cédula y las coordenadas son de solo lectura.
 */
export async function crearDialogoEdicion({ dialogo, alGuardar }) {
  const formulario = dialogo.querySelector('form');
  const campos = formulario.elements;
  const mensajeError = dialogo.querySelector('[data-error]');
  const botonGuardar = dialogo.querySelector('[data-guardar]');
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
      campos.cedula.value = productor.ceragric_productores_cedula;
      campos.nombres.value = productor.ceragric_productores_nombres;
      campos.apellido_paterno.value = productor.ceragric_productores_apellido_paterno;
      campos.apellido_materno.value = productor.ceragric_productores_apellido_materno;
      campos.genero.value = String(productor.ceragric_productores_genero);
      campos.fecha_nacimiento.value = productor.ceragric_productores_fecha_nacimiento;
      campos.estado_civil.value = String(productor.ceragric_productores_estado_civil);
      campos.nivel_estudio.value = String(productor.ceragric_productores_nivel_estudio);
      campos.recinto.value = productor.ceragric_productores_recinto;
      campos.telefono.value = productor.ceragric_productores_telefono ?? '';
      campos.coordenadas.value = `${productor.ceragric_productores_latitud}, ${productor.ceragric_productores_longitud}`;
      selector.establecerParroquia(productor.ceragric_parroquia_id);
      dialogo.showModal();
    },
  };
}
