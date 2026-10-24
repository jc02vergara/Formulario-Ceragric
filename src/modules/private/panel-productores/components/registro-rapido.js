import { esCedulaEcuatorianaValida } from '../../../../shared/utils/cedula-ecuador.js';
import { normalizarNombrePropio } from '../../../../shared/utils/texto.js';

const MENSAJE_CEDULA_INVALIDA = 'Ingrese una cédula ecuatoriana válida de 10 dígitos.';

function soloDigitos(input, maximo) {
  input.value = input.value.replace(/\D/g, '').slice(0, maximo);
}

/**
 * Formulario de registro rápido (cédula, nombre y teléfono). Tras guardar se limpia para el siguiente.
 */
export function iniciarRegistroRapido({ formulario, alRegistrar }) {
  const campos = formulario.elements;
  const boton = formulario.querySelector('button[type="submit"]');

  campos.cedula.addEventListener('input', () => {
    soloDigitos(campos.cedula, 10);
    const esValida = campos.cedula.value.length < 10 || esCedulaEcuatorianaValida(campos.cedula.value);
    campos.cedula.setCustomValidity(esValida ? '' : MENSAJE_CEDULA_INVALIDA);
  });
  campos.telefono.addEventListener('input', () => soloDigitos(campos.telefono, 10));

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!esCedulaEcuatorianaValida(campos.cedula.value)) campos.cedula.setCustomValidity(MENSAJE_CEDULA_INVALIDA);
    if (!formulario.reportValidity()) return;

    boton.disabled = true;
    const exito = await alRegistrar({
      cedula: campos.cedula.value,
      nombres: normalizarNombrePropio(campos.nombre.value),
      telefono: campos.telefono.value,
    });
    boton.disabled = false;

    if (exito) {
      formulario.reset();
      campos.cedula.focus();
    }
  });
}
