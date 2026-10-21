const DECIMALES_COORDENADA = 6;
const OPCIONES_GEOLOCALIZACION = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };

const MENSAJES_ERROR = {
  1: 'Permiso de ubicación denegado. Actívelo en la configuración del navegador y vuelva a intentar.',
  2: 'No se pudo determinar la ubicación. Verifique que el GPS esté activo.',
  3: 'La ubicación tardó demasiado. Intente nuevamente.',
};

export function iniciarCapturaUbicacion({ boton, inputLatitud, inputLongitud, estado }) {
  const mostrarEstado = (mensaje, tipo) => {
    estado.textContent = mensaje;
    estado.dataset.tipo = tipo;
  };

  const capturar = () => {
    if (!('geolocation' in navigator)) {
      mostrarEstado('Este navegador no permite obtener la ubicación.', 'error');
      return;
    }

    boton.disabled = true;
    mostrarEstado('Obteniendo ubicación…', 'info');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        inputLatitud.value = coords.latitude.toFixed(DECIMALES_COORDENADA);
        inputLongitud.value = coords.longitude.toFixed(DECIMALES_COORDENADA);
        mostrarEstado(`Ubicación obtenida (precisión aprox. ${Math.round(coords.accuracy)} m).`, 'ok');
        boton.disabled = false;
        boton.textContent = 'Actualizar ubicación';
      },
      (error) => {
        mostrarEstado(MENSAJES_ERROR[error.code] ?? MENSAJES_ERROR[2], 'error');
        boton.disabled = false;
      },
      OPCIONES_GEOLOCALIZACION
    );
  };

  boton.addEventListener('click', capturar);
}
