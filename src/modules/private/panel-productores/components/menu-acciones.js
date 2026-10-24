import {
  crearEnlaceLlamada,
  crearEnlaceMapa,
  crearEnlaceRuta,
  crearEnlaceWhatsApp,
  esCelular,
} from '../services/contacto.service.js';

function crearEnlace(texto, href, { externo = true } = {}) {
  const enlace = document.createElement('a');
  enlace.className = 'menu__item';
  enlace.textContent = texto;
  enlace.href = href;
  if (externo) {
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
  }
  return enlace;
}

function crearBoton(texto, alPulsar, { peligro = false } = {}) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = peligro ? 'menu__item menu__item--peligro' : 'menu__item';
  boton.textContent = texto;
  boton.addEventListener('click', alPulsar);
  return boton;
}

function crearItemDeshabilitado(texto, motivo) {
  const item = document.createElement('span');
  item.className = 'menu__item menu__item--deshabilitado';
  item.textContent = texto;
  item.title = motivo;
  return item;
}

/**
 * Celda de acciones: botón Editar + menú desplegable (<details>) con contacto, mapa, copiar y eliminar.
 */
export function crearCeldaAcciones(productor, acciones) {
  const { ceragric_productores_telefono: telefono, ceragric_productores_latitud: latitud } = productor;
  const longitud = productor.ceragric_productores_longitud;
  const celda = document.createElement('td');
  celda.className = 'celda-acciones';

  const botonEditar = document.createElement('button');
  botonEditar.type = 'button';
  botonEditar.className = 'boton boton--secundario boton--compacto';
  botonEditar.textContent = 'Editar';
  botonEditar.addEventListener('click', () => acciones.alEditar(productor.ceragric_productores_id));

  const menu = document.createElement('details');
  menu.className = 'menu';
  const disparador = document.createElement('summary');
  disparador.className = 'boton boton--secundario boton--compacto menu__disparador';
  disparador.textContent = 'Más ▾';
  disparador.setAttribute('aria-label', 'Más acciones');

  const lista = document.createElement('div');
  lista.className = 'menu__lista';
  const cerrarYEjecutar = (accion) => () => {
    menu.open = false;
    accion(productor.ceragric_productores_id);
  };

  const sinTelefono = 'Registre un teléfono con Editar';
  lista.append(
    esCelular(telefono)
      ? crearEnlace('Contactar por WhatsApp', crearEnlaceWhatsApp(telefono, productor.ceragric_productores_nombres))
      : crearItemDeshabilitado('Contactar por WhatsApp', telefono ? 'Solo disponible para celulares (09…)' : sinTelefono),
    telefono
      ? crearEnlace('Llamar', crearEnlaceLlamada(telefono), { externo: false })
      : crearItemDeshabilitado('Llamar', sinTelefono),
    ...(latitud === null || latitud === undefined
      ? [
          crearItemDeshabilitado('Ver en Google Maps', 'Registre las coordenadas con Editar'),
          crearItemDeshabilitado('Cómo llegar', 'Registre las coordenadas con Editar'),
        ]
      : [
          crearEnlace('Ver en Google Maps', crearEnlaceMapa(latitud, longitud)),
          crearEnlace('Cómo llegar', crearEnlaceRuta(latitud, longitud)),
        ]),
    crearBoton('Copiar cédula', cerrarYEjecutar(acciones.alCopiarCedula)),
    crearBoton('Copiar ficha', cerrarYEjecutar(acciones.alCopiarFicha)),
    crearBoton('Eliminar registro', cerrarYEjecutar(acciones.alEliminar), { peligro: true })
  );

  // La tabla tiene overflow horizontal, que recortaría un menú absoluto: se posiciona fijo respecto al botón.
  menu.addEventListener('toggle', () => {
    if (!menu.open) return;
    const rect = disparador.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    lista.style.right = `${window.innerWidth - rect.right}px`;
    if (espacioAbajo < lista.offsetHeight + 8) {
      lista.style.top = '';
      lista.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    } else {
      lista.style.bottom = '';
      lista.style.top = `${rect.bottom + 4}px`;
    }
  });

  menu.append(disparador, lista);
  celda.append(botonEditar, menu);
  return celda;
}
