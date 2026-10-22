// Generador mínimo de archivos .xlsx (Office Open XML) sin dependencias: una hoja, texto y números.
// El ZIP se arma sin compresión (método "stored"), suficiente para exportes de unos miles de filas.

const TIPO_MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const codificador = new TextEncoder();

const TABLA_CRC32 = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function calcularCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = TABLA_CRC32[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function escaparXml(texto) {
  return String(texto)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nombreColumna(indice) {
  let nombre = '';
  for (let n = indice + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    nombre = String.fromCharCode(65 + ((n - 1) % 26)) + nombre;
  }
  return nombre;
}

function crearCelda(valor, referencia, estilo) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'number' && Number.isFinite(valor)) return `<c r="${referencia}"${estilo}><v>${valor}</v></c>`;
  return `<c r="${referencia}" t="inlineStr"${estilo}><is><t xml:space="preserve">${escaparXml(valor)}</t></is></c>`;
}

function crearHoja(encabezados, filas) {
  const anchos = encabezados
    .map((encabezado, indice) => {
      const largo = Math.max(encabezado.length, ...filas.map((fila) => String(fila[indice] ?? '').length));
      return `<col min="${indice + 1}" max="${indice + 1}" width="${Math.min(largo + 2, 50)}" customWidth="1"/>`;
    })
    .join('');

  const xmlFilas = [encabezados, ...filas]
    .map((fila, indiceFila) => {
      const estilo = indiceFila === 0 ? ' s="1"' : '';
      const celdas = fila
        .map((valor, indiceColumna) => crearCelda(valor, `${nombreColumna(indiceColumna)}${indiceFila + 1}`, estilo))
        .join('');
      return `<row r="${indiceFila + 1}">${celdas}</row>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    `<cols>${anchos}</cols><sheetData>${xmlFilas}</sheetData>` +
    `<autoFilter ref="A1:${nombreColumna(encabezados.length - 1)}${filas.length + 1}"/>` +
    '</worksheet>'
  );
}

function crearArchivosLibro(nombreHoja, encabezados, filas) {
  return {
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
    'xl/workbook.xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<sheets><sheet name="${escaparXml(nombreHoja)}" sheetId="1" r:id="rId1"/></sheets>` +
      '<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">' +
      `'${escaparXml(nombreHoja)}'!$A$1:$${nombreColumna(encabezados.length - 1)}$${filas.length + 1}` +
      '</definedName></definedNames></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>',
    'xl/styles.xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border/></borders>' +
      '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
      '<cellXfs count="2"><xf xfId="0"/><xf xfId="0" fontId="1" applyFont="1"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>',
    'xl/worksheets/sheet1.xml': crearHoja(encabezados, filas),
  };
}

function empaquetarZip(archivos) {
  const partes = [];
  const directorio = [];
  let desplazamiento = 0;

  for (const [nombre, contenido] of Object.entries(archivos)) {
    const bytesNombre = codificador.encode(nombre);
    const datos = codificador.encode(contenido);
    const crc = calcularCrc32(datos);

    const cabecera = new DataView(new ArrayBuffer(30));
    cabecera.setUint32(0, 0x04034b50, true);
    cabecera.setUint16(4, 20, true);
    cabecera.setUint16(6, 0x0800, true); // nombres en UTF-8
    cabecera.setUint32(14, crc, true);
    cabecera.setUint32(18, datos.length, true);
    cabecera.setUint32(22, datos.length, true);
    cabecera.setUint16(26, bytesNombre.length, true);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, datos.length, true);
    central.setUint32(24, datos.length, true);
    central.setUint16(28, bytesNombre.length, true);
    central.setUint32(42, desplazamiento, true);

    partes.push(cabecera, bytesNombre, datos);
    directorio.push(central, bytesNombre);
    desplazamiento += 30 + bytesNombre.length + datos.length;
  }

  const tamanoDirectorio = directorio.reduce((total, parte) => total + parte.byteLength, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, directorio.length / 2, true);
  fin.setUint16(10, directorio.length / 2, true);
  fin.setUint32(12, tamanoDirectorio, true);
  fin.setUint32(16, desplazamiento, true);

  return new Blob([...partes, ...directorio, fin], { type: TIPO_MIME_XLSX });
}

/**
 * Genera y descarga un .xlsx con una hoja. `filas` es un arreglo de arreglos (texto o número).
 */
export function descargarXlsx({ nombreArchivo, nombreHoja, encabezados, filas }) {
  const blob = empaquetarZip(crearArchivosLibro(nombreHoja, encabezados, filas));
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
