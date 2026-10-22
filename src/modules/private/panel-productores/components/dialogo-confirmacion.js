/**
 * Confirmación modal propia (<dialog>), en lugar de window.confirm. Resuelve true si se acepta.
 */
export function crearDialogoConfirmacion(dialogo) {
  const titulo = dialogo.querySelector('[data-titulo]');
  const descripcion = dialogo.querySelector('[data-descripcion]');
  const botonAceptar = dialogo.querySelector('[data-aceptar]');
  const botonCancelar = dialogo.querySelector('[data-cancelar]');

  return {
    confirmar({ textoTitulo, textoDescripcion, textoAceptar }) {
      titulo.textContent = textoTitulo;
      descripcion.textContent = textoDescripcion;
      botonAceptar.textContent = textoAceptar;
      dialogo.showModal();
      botonCancelar.focus();

      return new Promise((resolver) => {
        const cerrar = (aceptado) => {
          botonAceptar.removeEventListener('click', aceptar);
          botonCancelar.removeEventListener('click', cancelar);
          dialogo.removeEventListener('cancel', cancelar);
          dialogo.close();
          resolver(aceptado);
        };
        const aceptar = () => cerrar(true);
        const cancelar = () => cerrar(false);
        botonAceptar.addEventListener('click', aceptar);
        botonCancelar.addEventListener('click', cancelar);
        dialogo.addEventListener('cancel', cancelar);
      });
    },
  };
}
