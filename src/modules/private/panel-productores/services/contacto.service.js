const CODIGO_PAIS_ECUADOR = '593';
const PATRON_CELULAR = /^09\d{8}$/;

export function esCelular(telefono) {
  return PATRON_CELULAR.test(telefono ?? '');
}

export function crearEnlaceWhatsApp(telefono, nombres) {
  const numeroInternacional = CODIGO_PAIS_ECUADOR + telefono.slice(1);
  const mensaje = `Hola ${nombres}, le saludamos de Ceragric S.A.S. respecto a su registro para la certificación Rainforest Alliance.`;
  return `https://wa.me/${numeroInternacional}?text=${encodeURIComponent(mensaje)}`;
}

export function crearEnlaceLlamada(telefono) {
  return `tel:+${CODIGO_PAIS_ECUADOR}${telefono.slice(1)}`;
}

export function crearEnlaceMapa(latitud, longitud) {
  return `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`;
}

export function crearEnlaceRuta(latitud, longitud) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;
}
