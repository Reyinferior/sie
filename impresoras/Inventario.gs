/**
 * ============================================================================
 *  IMPRESORAS · MÓDULO INVENTARIO (CRUD)
 *  ----------------------------------------------------------------------------
 *  Funciones llamadas desde ImpresorasUI.html vía google.script.run:
 *    - listarImpresoras()
 *    - crearImpresora(datos)
 *    - actualizarImpresora(id, datos)
 *    - eliminarImpresora(id)
 *
 *  Las columnas se detectan AUTOMÁTICAMENTE desde la fila 1 de la hoja
 *  (ver Esquema.gs).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
//  LISTAR
// ----------------------------------------------------------------------------
function listarImpresoras() {
  const tabla = leerHoja();

  // Nombres reales de las columnas clave (lo que tenga el usuario en su hoja)
  const colId     = nombreColumnaClave(tabla.encabezados, 'id');
  const colEstado = nombreColumnaClave(tabla.encabezados, 'estado');

  // Construye los grupos del formulario: solo se incluyen las columnas
  // del grupo que realmente existen en la hoja.
  const grupos = [];
  Object.keys(CONFIG.GRUPOS_FILTROS).forEach(nombreGrupo => {
    const cols = CONFIG.GRUPOS_FILTROS[nombreGrupo].filter(c =>
      buscarIndice(tabla.encabezados, c) >= 0
    );
    if (cols.length) grupos.push({ nombre: nombreGrupo, columnas: cols });
  });

  return {
    marca:    CONFIG.MARCA,
    titulo:   CONFIG.TITULO,
    estados:  CONFIG.ESTADOS,
    columnas: tabla.encabezados,                   // columnas REALES
    grupos:   grupos,                              // segmentación del formulario
    filas:    tabla.filas.map(f => {
      f.__id         = colId     ? f[colId]     : '';
      f.__tipoEstado = tipoDeEstado(colEstado ? f[colEstado] : '');
      return f;
    }),
    campos: {
      id:     colId,
      estado: colEstado,
      area:   nombreColumnaClave(tabla.encabezados, 'area'),
      fecha:  nombreColumnaClave(tabla.encabezados, 'fecha')
    },
    urlApp: getUrlAppImpresoras()
  };
}

// ----------------------------------------------------------------------------
//  CREAR
// ----------------------------------------------------------------------------
function crearImpresora(datos) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA);
  if (!hoja) throw new Error('La hoja "' + CONFIG.HOJA + '" no existe. Ejecuta inicializarHojaImpresoras().');

  const enc = obtenerEncabezados();

  const colId    = nombreColumnaClave(enc, 'id');
  const colFecha = nombreColumnaClave(enc, 'fecha');

  // Si hay columna ID y no nos la mandaron, la auto-generamos
  if (colId && !datos[colId]) datos[colId] = generarNuevoId(hoja, enc, colId);
  // Si hay columna Fecha y no nos la mandaron, ponemos hoy
  if (colFecha && !datos[colFecha]) datos[colFecha] = new Date();

  // Si la hoja tiene una columna 'N°' la rellenamos con el siguiente número
  const idxN = buscarIndice(enc, 'N°');
  if (idxN >= 0 && !datos[enc[idxN]]) {
    datos[enc[idxN]] = (hoja.getLastRow() < 2) ? 1 : (hoja.getLastRow() - 0); // siguiente fila visible
  }

  const fila = enc.map(c => datos[c] !== undefined ? datos[c] : '');
  hoja.appendRow(fila);
  return { ok: true, id: colId ? datos[colId] : null };
}

// ----------------------------------------------------------------------------
//  ACTUALIZAR
// ----------------------------------------------------------------------------
function actualizarImpresora(id, datos) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA);
  const enc  = obtenerEncabezados();

  const colId = nombreColumnaClave(enc, 'id');
  if (!colId) throw new Error('No hay columna de ID en la hoja (revisa CONFIG.CAMPOS_CLAVE.id).');
  const colIdNum = enc.indexOf(colId) + 1;

  const ultima = hoja.getLastRow();
  if (ultima < 2) throw new Error('No se encontró la impresora con ID ' + id);

  const ids = hoja.getRange(2, colIdNum, ultima - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const filaActual = hoja.getRange(i + 2, 1, 1, enc.length).getValues()[0];
      // Conserva lo que no se mande, reemplaza lo que sí
      const nueva = enc.map((c, j) => datos[c] !== undefined ? datos[c] : filaActual[j]);
      hoja.getRange(i + 2, 1, 1, enc.length).setValues([nueva]);
      return { ok: true };
    }
  }
  throw new Error('No se encontró la impresora con ID ' + id);
}

// ----------------------------------------------------------------------------
//  ELIMINAR
// ----------------------------------------------------------------------------
function eliminarImpresora(id) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA);
  const enc  = obtenerEncabezados();

  const colId = nombreColumnaClave(enc, 'id');
  if (!colId) throw new Error('No hay columna de ID en la hoja (revisa CONFIG.CAMPOS_CLAVE.id).');
  const colIdNum = enc.indexOf(colId) + 1;

  const ultima = hoja.getLastRow();
  if (ultima < 2) throw new Error('No se encontró la impresora con ID ' + id);

  const ids = hoja.getRange(2, colIdNum, ultima - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      hoja.deleteRow(i + 2);
      return { ok: true };
    }
  }
  throw new Error('No se encontró la impresora con ID ' + id);
}

// ----------------------------------------------------------------------------
//  HELPERS LOCALES
// ----------------------------------------------------------------------------

/** Genera el siguiente ID con el prefijo configurado (IMP-001, IMP-002…). */
function generarNuevoId(hoja, enc, colId) {
  const colNum = enc.indexOf(colId) + 1;
  if (!colNum || hoja.getLastRow() < 2) return CONFIG.PREFIJO_ID + '001';
  const ids = hoja.getRange(2, colNum, hoja.getLastRow() - 1, 1).getValues();
  let max = 0;
  ids.forEach(([v]) => {
    const m = String(v).match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return CONFIG.PREFIJO_ID + String(max + 1).padStart(3, '0');
}
