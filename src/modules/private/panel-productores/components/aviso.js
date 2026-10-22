const DURACION_AVISO_MS = 3000;

/**
 * Aviso breve (toast) en la esquina inferior. tipo: 'ok' | 'error'.
 */
export function crearAviso(contenedor) {
  let temporizador = null;

  return function mostrarAviso(texto, tipo = 'ok') {
    contenedor.textContent = texto;
    contenedor.dataset.tipo = tipo;
    contenedor.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      contenedor.hidden = true;
    }, DURACION_AVISO_MS);
  };
}
