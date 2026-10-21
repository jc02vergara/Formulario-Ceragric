// Diccionario de valores numéricos. Debe coincidir con los COMMENT de la base de datos.

export const GENEROS = Object.freeze([
  { valor: 1, etiqueta: 'Hombre' },
  { valor: 2, etiqueta: 'Mujer' },
]);

export const ESTADOS_CIVILES = Object.freeze([
  { valor: 1, etiqueta: 'Soltero/a' },
  { valor: 2, etiqueta: 'Casado/a' },
  { valor: 3, etiqueta: 'Unión de hecho' },
  { valor: 4, etiqueta: 'Divorciado/a' },
  { valor: 5, etiqueta: 'Viudo/a' },
]);

export const NIVELES_ESTUDIO = Object.freeze([
  { valor: 1, etiqueta: 'Primaria' },
  { valor: 2, etiqueta: 'Secundaria' },
  { valor: 3, etiqueta: 'Superior' },
  { valor: 4, etiqueta: 'Máster' },
  { valor: 0, etiqueta: 'Sin respuesta' },
]);
