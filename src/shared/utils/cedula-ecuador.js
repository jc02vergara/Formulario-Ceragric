const CODIGO_PROVINCIA_MAXIMO = 24;
const CODIGO_ECUATORIANOS_EXTERIOR = 30;
const TERCER_DIGITO_MAXIMO_PERSONA_NATURAL = 5;
const COEFICIENTES_MODULO_10 = [2, 1, 2, 1, 2, 1, 2, 1, 2];

/**
 * Valida una cédula ecuatoriana de persona natural (algoritmo módulo 10 del Registro Civil).
 */
export function esCedulaEcuatorianaValida(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;

  const digitos = [...cedula].map(Number);
  const codigoProvincia = Number(cedula.slice(0, 2));
  const esProvinciaValida =
    (codigoProvincia >= 1 && codigoProvincia <= CODIGO_PROVINCIA_MAXIMO) ||
    codigoProvincia === CODIGO_ECUATORIANOS_EXTERIOR;

  if (!esProvinciaValida) return false;
  if (digitos[2] > TERCER_DIGITO_MAXIMO_PERSONA_NATURAL) return false;

  const suma = COEFICIENTES_MODULO_10.reduce((acumulado, coeficiente, indice) => {
    const producto = digitos[indice] * coeficiente;
    return acumulado + (producto > 9 ? producto - 9 : producto);
  }, 0);

  const digitoVerificadorEsperado = (10 - (suma % 10)) % 10;
  return digitoVerificadorEsperado === digitos[9];
}
