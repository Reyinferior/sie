/**
 * ============================================================================
 *  IMPRESORAS · ESQUEMA DE LA HOJA
 *  ----------------------------------------------------------------------------
 *  Funciones que LEEN la estructura de la hoja:
 *    - leerHoja()             -> encabezados + filas como objetos
 *    - obtenerEncabezados()   -> solo los nombres de columna actuales
 *    - buscarIndice()         -> índice de un encabezado (sin tildes)
 *    - nombreColumnaClave()   -> nombre real de una columna "clave" (id, área…)
 *
 *  Si agregas/quitas/renombras columnas en Sheets, todo lo demás se adapta
 *  solo porque pasa por aquí.
 * ============================================================================
 */

/** Devuelve los encabezados (fila 1) ya normalizados a string. */
function obtenerEncabezados() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA);
  if (!hoja || hoja.getLastRow() < 1 || hoja.getLastColumn() < 1) return [];
  return hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
             .map(c => String(c).trim());
}

/**
 * Lee toda la hoja y devuelve:
 *   - hoja          (referencia a la Sheet)
 *   - encabezados   (array con los nombres reales de columna)
 *   - filas         (array de objetos { 'NombreColumna': valor, ... })
 *   - idx           (índices de las columnas clave del CONFIG)
 */
function leerHoja() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA);
  const out  = { hoja: hoja, encabezados: [], filas: [], idx: {} };

  if (!hoja || hoja.getLastRow() < 1) return out;

  const encabezados = obtenerEncabezados();
  out.encabezados = encabezados;

  out.idx = {
    id:     buscarIndice(encabezados, CONFIG.CAMPOS_CLAVE.id),
    estado: buscarIndice(encabezados, CONFIG.CAMPOS_CLAVE.estado),
    area:   buscarIndice(encabezados, CONFIG.CAMPOS_CLAVE.area),
    fecha:  buscarIndice(encabezados, CONFIG.CAMPOS_CLAVE.fecha)
  };

  if (hoja.getLastRow() < 2) return out;

  const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, encabezados.length).getValues();

  out.filas = datos.map(f => {
    const obj = {};
    encabezados.forEach((c, i) => {
      const v = f[i];
      // Las fechas las pasamos a ISO para que viajen bien al frontend
      obj[c] = (v instanceof Date) ? v.toISOString() : v;
    });
    return obj;
  });

  return out;
}

/** Índice de un encabezado (sin distinguir mayúsculas/acentos). -1 si no está. */
function buscarIndice(encabezados, nombre) {
  if (!nombre) return -1;
  const objetivo = normalizar(nombre);
  for (let i = 0; i < encabezados.length; i++) {
    if (normalizar(encabezados[i]) === objetivo) return i;
  }
  return -1;
}

/** Devuelve el NOMBRE REAL en la hoja para una clave (id, estado, area, fecha). */
function nombreColumnaClave(encabezados, clave) {
  const i = buscarIndice(encabezados, CONFIG.CAMPOS_CLAVE[clave]);
  return i >= 0 ? encabezados[i] : null;
}
