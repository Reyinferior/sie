/**
 * ============================================================================
 *  MÓDULO INVENTARIO  (multi-sistema)
 *  CRUD de equipos/impresoras + inicialización de hojas.
 *
 *  Todas las funciones expuestas reciben `sistema` como primer parámetro
 *  (lo inyecta el frontend automáticamente desde window.SISTEMA).
 *
 *  Las columnas se detectan AUTOMÁTICAMENTE desde la fila 1 de la hoja del
 *  sistema. Solo `inicializarHojas()` usa CONFIGS[*].COLUMNAS_INICIALES la
 *  primera vez (cuando la hoja está vacía).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
//  INICIALIZACIÓN  (ejecútala UNA vez desde el editor de Apps Script)
//  Crea las hojas de TODOS los sistemas declarados en CONFIGS.
// ----------------------------------------------------------------------------
function inicializarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(CONFIGS).forEach(function(sis) {
    const cfg = CONFIGS[sis];
    let hoja = ss.getSheetByName(cfg.HOJA);
    if (!hoja) hoja = ss.insertSheet(cfg.HOJA);

    if (hoja.getLastRow() === 0) {
      const cols = cfg.COLUMNAS_INICIALES;
      hoja.getRange(1, 1, 1, cols.length).setValues([cols]);
      hoja.getRange(1, 1, 1, cols.length)
        .setFontWeight('bold').setBackground('#0f172a').setFontColor('#fff');
      hoja.setFrozenRows(1);
    }
  });
  SpreadsheetApp.getUi().alert('Hojas listas: ' + Object.keys(CONFIGS).map(s => CONFIGS[s].HOJA).join(', '));
}

// ----------------------------------------------------------------------------
//  LISTAR
// ----------------------------------------------------------------------------
function listarEquipos(sistema) {
  const cfg   = getCfg(sistema);
  const tabla = leerHoja(cfg);

  const colId     = nombreColumnaClave(cfg, tabla.encabezados, 'id');
  const colEstado = nombreColumnaClave(cfg, tabla.encabezados, 'estado');

  // Grupos para el formulario "Editar/Nuevo" (mismas categorías que en Reportes)
  const grupos = [];
  Object.keys(cfg.GRUPOS_FILTROS).forEach(nombreGrupo => {
    const cols = cfg.GRUPOS_FILTROS[nombreGrupo].filter(c =>
      buscarIndice(tabla.encabezados, c) >= 0
    );
    if (cols.length) grupos.push({ nombre: nombreGrupo, columnas: cols });
  });

  return {
    marca:    cfg.MARCA,
    estados:  cfg.ESTADOS,
    columnas: tabla.encabezados,
    grupos:   grupos,
    filas:    tabla.filas.map(f => {
      f.__id         = colId     ? f[colId]     : '';
      f.__tipoEstado = tipoDeEstado(cfg, colEstado ? f[colEstado] : '');
      return f;
    }),
    campos: {
      id:     colId,
      estado: colEstado,
      area:   nombreColumnaClave(cfg, tabla.encabezados, 'area'),
      fecha:  nombreColumnaClave(cfg, tabla.encabezados, 'fecha')
    },
    urlApp: getUrlApp()
  };
}

// ----------------------------------------------------------------------------
//  CREAR
// ----------------------------------------------------------------------------
function crearEquipo(sistema, datos) {
  const cfg  = getCfg(sistema);
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.HOJA);
  if (!hoja) throw new Error('La hoja "' + cfg.HOJA + '" no existe. Ejecuta inicializarHojas().');

  const enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
                  .map(c => String(c).trim());

  const colId    = nombreColumnaClave(cfg, enc, 'id');
  const colFecha = nombreColumnaClave(cfg, enc, 'fecha');

  if (colId && !datos[colId])     datos[colId]    = generarNuevoId(cfg, hoja, enc, colId);
  if (colFecha && !datos[colFecha]) datos[colFecha] = new Date();

  const fila = enc.map(c => datos[c] !== undefined ? datos[c] : '');
  hoja.appendRow(fila);
  return { ok: true, id: colId ? datos[colId] : null };
}

// ----------------------------------------------------------------------------
//  ACTUALIZAR
// ----------------------------------------------------------------------------
function actualizarEquipo(sistema, id, datos) {
  const cfg  = getCfg(sistema);
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.HOJA);
  const enc  = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
                   .map(c => String(c).trim());

  const colId = nombreColumnaClave(cfg, enc, 'id');
  if (!colId) throw new Error('No hay columna de ID en la hoja "' + cfg.HOJA + '".');
  const colIdNum = enc.indexOf(colId) + 1;

  const ultima = hoja.getLastRow();
  const ids = hoja.getRange(2, colIdNum, ultima - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const filaActual = hoja.getRange(i + 2, 1, 1, enc.length).getValues()[0];
      const nueva = enc.map((c, j) => datos[c] !== undefined ? datos[c] : filaActual[j]);
      hoja.getRange(i + 2, 1, 1, enc.length).setValues([nueva]);
      return { ok: true };
    }
  }
  throw new Error('No se encontró el registro con ID ' + id);
}

// ----------------------------------------------------------------------------
//  ELIMINAR
// ----------------------------------------------------------------------------
function eliminarEquipo(sistema, id) {
  const cfg  = getCfg(sistema);
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.HOJA);
  const enc  = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
                   .map(c => String(c).trim());

  const colId = nombreColumnaClave(cfg, enc, 'id');
  if (!colId) throw new Error('No hay columna de ID en la hoja "' + cfg.HOJA + '".');
  const colIdNum = enc.indexOf(colId) + 1;

  const ultima = hoja.getLastRow();
  const ids = hoja.getRange(2, colIdNum, ultima - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      hoja.deleteRow(i + 2);
      return { ok: true };
    }
  }
  throw new Error('No se encontró el registro con ID ' + id);
}

// ----------------------------------------------------------------------------
//  HELPERS LOCALES
// ----------------------------------------------------------------------------

/** Genera el siguiente ID con el prefijo del sistema (EQ-001, EQ-002…). */
function generarNuevoId(cfg, hoja, enc, colId) {
  if (!cfg.PREFIJO_ID) return '';   // sistemas sin prefijo automático -> usuario lo ingresa
  const colNum = enc.indexOf(colId) + 1;
  if (!colNum || hoja.getLastRow() < 2) return cfg.PREFIJO_ID + '001';
  const ids = hoja.getRange(2, colNum, hoja.getLastRow() - 1, 1).getValues();
  let max = 0;
  ids.forEach(([v]) => {
    const m = String(v).match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return cfg.PREFIJO_ID + String(max + 1).padStart(3, '0');
}
