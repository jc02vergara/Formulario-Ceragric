import { CONFIG } from '../../../../core/config.js';
import { esCedulaEcuatorianaValida } from '../../../../shared/utils/cedula-ecuador.js';
import { normalizarNombrePropio } from '../../../../shared/utils/texto.js';
import { ESTADOS_CIVILES, GENEROS, NIVELES_ESTUDIO } from '../../../../shared/catalogos.js';
import { iniciarCapturaUbicacion } from '../components/captura-ubicacion.js';
import { iniciarSelectorUbicacion } from '../../../../shared/components/selector-ubicacion.js';
import { CedulaDuplicadaError, registrarProductor } from '../services/productor.service.js';

const MENSAJE_CEDULA_INVALIDA = 'Ingrese una cédula ecuatoriana válida de 10 dígitos.';
const MENSAJE_UBICACION_REQUERIDA = 'Debe obtener la ubicación antes de enviar.';

function llenarCatalogo(select, catalogo) {
  for (const { valor, etiqueta } of catalogo) select.add(new Option(etiqueta, String(valor)));
}

function calcularFechaMaximaNacimiento() {
  const fecha = new Date();
  fecha.setFullYear(fecha.getFullYear() - CONFIG.EDAD_MINIMA_PRODUCTOR);
  return fecha.toISOString().slice(0, 10);
}

function construirProductor(datos) {
  return {
    ceragric_productores_cedula: datos.get('cedula'),
    ceragric_productores_genero: Number(datos.get('genero')),
    ceragric_productores_fecha_nacimiento: datos.get('fecha_nacimiento'),
    ceragric_productores_estado_civil: Number(datos.get('estado_civil')),
    ceragric_productores_latitud: Number(datos.get('latitud')),
    ceragric_productores_longitud: Number(datos.get('longitud')),
    ceragric_productores_nombres: normalizarNombrePropio(datos.get('nombres')),
    ceragric_productores_apellido_paterno: normalizarNombrePropio(datos.get('apellido_paterno')),
    ceragric_productores_apellido_materno: normalizarNombrePropio(datos.get('apellido_materno')),
    ceragric_parroquia_id: datos.get('parroquia'),
    ceragric_productores_recinto: normalizarNombrePropio(datos.get('recinto')),
    ceragric_productores_nivel_estudio: Number(datos.get('nivel_estudio')),
  };
}

export async function iniciarRegistroProductor() {
  const formulario = document.getElementById('formulario-productor');
  const campos = formulario.elements;
  const mensaje = document.getElementById('mensaje-formulario');
  const botonEnviar = document.getElementById('boton-enviar');
  const estadoUbicacion = document.getElementById('estado-ubicacion');

  llenarCatalogo(campos.genero, GENEROS);
  llenarCatalogo(campos.estado_civil, ESTADOS_CIVILES);
  llenarCatalogo(campos.nivel_estudio, NIVELES_ESTUDIO);
  campos.fecha_nacimiento.max = calcularFechaMaximaNacimiento();

  campos.cedula.addEventListener('input', () => {
    campos.cedula.value = campos.cedula.value.replace(/\D/g, '').slice(0, 10);
    const esValida = campos.cedula.value.length < 10 || esCedulaEcuatorianaValida(campos.cedula.value);
    campos.cedula.setCustomValidity(esValida ? '' : MENSAJE_CEDULA_INVALIDA);
  });

  iniciarCapturaUbicacion({
    boton: document.getElementById('boton-ubicacion'),
    inputLatitud: campos.latitud,
    inputLongitud: campos.longitud,
    estado: estadoUbicacion,
  });

  await iniciarSelectorUbicacion({
    selectProvincia: campos.provincia,
    selectCanton: campos.canton,
    selectParroquia: campos.parroquia,
    provinciaPredeterminada: CONFIG.PROVINCIA_PREDETERMINADA,
  });

  const mostrarMensaje = (texto, tipo) => {
    mensaje.textContent = texto;
    mensaje.dataset.tipo = tipo;
    mensaje.hidden = false;
    mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mensaje.hidden = true;

    if (!esCedulaEcuatorianaValida(campos.cedula.value)) campos.cedula.setCustomValidity(MENSAJE_CEDULA_INVALIDA);
    if (!campos.latitud.value || !campos.longitud.value) {
      estadoUbicacion.textContent = MENSAJE_UBICACION_REQUERIDA;
      estadoUbicacion.dataset.tipo = 'error';
      mostrarMensaje(MENSAJE_UBICACION_REQUERIDA, 'error');
      return;
    }
    if (!formulario.reportValidity()) return;

    botonEnviar.disabled = true;
    botonEnviar.textContent = 'Enviando…';

    try {
      await registrarProductor(construirProductor(new FormData(formulario)));
      formulario.reset();
      formulario.hidden = true;
      mostrarMensaje('¡Gracias! La información del productor fue registrada correctamente.', 'ok');
    } catch (error) {
      const texto =
        error instanceof CedulaDuplicadaError
          ? 'Esta cédula ya fue registrada. Si necesita corregir datos, contacte a Ceragric S.A.S.'
          : 'No se pudo enviar la información. Revise su conexión e intente nuevamente.';
      mostrarMensaje(texto, 'error');
    } finally {
      botonEnviar.disabled = false;
      botonEnviar.textContent = 'Enviar información';
    }
  });
}
