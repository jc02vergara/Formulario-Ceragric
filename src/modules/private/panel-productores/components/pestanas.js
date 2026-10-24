/**
 * Pestañas simples: cada botón [data-pestana] muestra el bloque [data-panel] con el mismo nombre.
 */
export function iniciarPestanas(contenedor) {
  const botones = [...contenedor.querySelectorAll('[data-pestana]')];

  const activar = (nombre) => {
    for (const boton of botones) {
      const activo = boton.dataset.pestana === nombre;
      boton.setAttribute('aria-selected', String(activo));
      document.querySelector(`[data-panel="${boton.dataset.pestana}"]`).hidden = !activo;
    }
  };

  for (const boton of botones) boton.addEventListener('click', () => activar(boton.dataset.pestana));
  return { activar };
}
