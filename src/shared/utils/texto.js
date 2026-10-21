const PALABRAS_MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'en']);

export function aTituloLegible(texto) {
  return texto
    .toLowerCase()
    .split(' ')
    .map((palabra, indice) =>
      indice > 0 && PALABRAS_MENORES.has(palabra)
        ? palabra
        : palabra.replace(/^(\(?)(\p{L})/u, (_, parentesis, letra) => parentesis + letra.toUpperCase())
    )
    .join(' ');
}

export function normalizarNombrePropio(texto) {
  return texto.trim().replace(/\s+/g, ' ').toUpperCase();
}
