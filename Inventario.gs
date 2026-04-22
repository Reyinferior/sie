/**
 * ============================================================================
 *  MÓDULO INVENTARIO
 *  CRUD de equipos + inicialización de la hoja.
 *
 *  Las columnas se detectan AUTOMÁTICAMENTE desde la fila 1 de la hoja.
 *  Solo `inicializarHoja()` usa CONFIG.COLUMNAS_INICIALES (cuando la hoja
 *  está vacía) para sembrar los encabezados por primera vez.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
//  INICIALIZACIÓN  (ejecútala UNA vez desde el editor de Apps Script)
// ----------------------------------------------------------------------------
function inicializarHoja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = ss.getSheetByName(CONFIG.HOJA);
  if (!hoja) hoja = ss.insertSheet(CONFIG.HOJA);

  // Solo si la hoja está vacía, sembramos encabezados y datos de ejemplo
  if (hoja.getLastRow() === 0) {
    const cols = CONFIG.COLUMNAS_INICIALES;
    hoja.getRange(1, 1, 1, cols.length).setValues([cols]);
    hoja.getRange(1, 1, 1, cols.length)
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#fff');
    hoja.setFrozenRows(1);

    // Datos de ejemplo (solo los necesarios para el orden por defecto).
    // Bórralos cuando metas tus datos reales.
    const hoy = new Date();
    const ej = [
      ['EQ-001', 'Monitor Samsung',     'Monitor',    'Operativo',     'Emergencias',  diasAtras(hoy, 1)],
      ['EQ-002', 'Desfibrilador',       'Equipo Med', 'Mantenimiento', 'UCI',          diasAtras(hoy, 15)],
      ['EQ-003', 'Ecógrafo Portátil',   'Equipo Med', 'Operativo',     'Radiología',   diasAtras(hoy, 3)],
      ['EQ-004', 'Ventilador Mecánico', 'Equipo Med', 'Baja',          'UCI',          diasAtras(hoy, 2)],
      ['EQ-005', 'Laptop Dell',         'Laptop',     'Operativo',     'UCI',          diasAtras(hoy, 4)],
      ['EQ-006', 'PC HP EliteDesk',     'PC',         'Operativo',     'UCI',          diasAtras(hoy, 5)],
      ['EQ-007', 'Monitor LG',          'Monitor',    'Operativo',     'UCI',          diasAtras(hoy, 6)],
      ['EQ-008', 'Impresora Epson',     'Impresora',  'Operativo',     'Emergencias',  diasAtras(hoy, 7)],
      ['EQ-009', 'Laptop Lenovo',       'Laptop',     'Operativo',     'Radiología',   diasAtras(hoy, 8)],
      ['EQ-010', 'PC Dell OptiPlex',    'PC',         'Operativo',     'Laboratorio',  diasAtras(hoy, 9)]
    ];
    hoja.getRange(2, 1, ej.length, ej[0].length).setValues(ej);
  }

  SpreadsheetApp.getUi().alert('Hoja "' + CONFIG.HOJA + '" lista.');
}

// ----------------------------------------------------------------------------
//  LISTAR (alimenta InventarioUI.html)
// ----------------------------------------------------------------------------
function listarEquipos() {
  const tabla = leerHoja();

  // Nombres reales de las columnas clave (lo que tenga el usuario en su hoja)
  const colId     = nombreColumnaClave(tabla.encabezados, 'id');
  const colEstado = nombreColumnaClave(tabla.encabezados, 'estado');

  // Construye grupos de columnas (mismas categorías que en Reportes) para
  // que el formulario de "Editar/Nuevo equipo" se muestre segmentado.
  const grupos = [];
  Object.keys(CONFIG.GRUPOS_FILTROS).forEach(nombreGrupo => {
    const cols = CONFIG.GRUPOS_FILTROS[nombreGrupo].filter(c =>
      buscarIndice(tabla.encabezados, c) >= 0
    );
    if (cols.length) grupos.push({ nombre: nombreGrupo, columnas: cols });
  });

  return {
    marca:    CONFIG.MARCA,
    estados:  CONFIG.ESTADOS,
    columnas: tabla.encabezados,            // <-- columnas REALES de la hoja
    grupos:   grupos,                       // segmentación del formulario
    filas:    tabla.filas.map(f => {
      // Agregamos info útil para el frontend:
      f.__id   = colId     ? f[colId]     : '';
      f.__tipoEstado = tipoDeEstado(colEstado ? f[colEstado] : '');
      return f;
    }),
    campos:   {                             // mapeo: clave -> nombre real
      id:     colId,
      estado: colEstado,
      area:   nombreColumnaClave(tabla.encabezados, 'area'),
      fecha:  nombreColumnaClave(tabla.encabezados, 'fecha')
    },
    urlApp:   getUrlApp()
  };
}

// ----------------------------------------------------------------------------
//  CREAR
// ----------------------------------------------------------------------------
function crearEquipo(datos) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA);
  if (!hoja) throw new Error('La hoja "' + CONFIG.HOJA + '" no existe. Ejecuta inicializarHoja().');

  const enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
                  .map(c => String(c).trim());

  const colId    = nombreColumnaClave(enc, 'id');
  const colFecha = nombreColumnaClave(enc, 'fecha');

  // ID automático si hay columna ID y no nos la mandaron
  if (colId && !datos[colId]) datos[colId] = generarNuevoId(hoja, enc, colId);
  // Fecha actual si hay columna Fecha y no nos la mandaron
  if (colFecha && !datos[colFecha]) datos[colFecha] = new Date();

  const fila = enc.map(c => datos[c] !== undefined ? datos[c] : '');
  hoja.appendRow(fila);
  return { ok: true, id: colId ? datos[colId] : null };
}

// ----------------------------------------------------------------------------
//  ACTUALIZAR
// ----------------------------------------------------------------------------
function actualizarEquipo(id, datos) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA);
  const enc  = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
                   .map(c => String(c).trim());

  const colId = nombreColumnaClave(enc, 'id');
  if (!colId) throw new Error('No hay columna de ID en la hoja (revisa CONFIG.CAMPOS_CLAVE.id).');
  const colIdNum = enc.indexOf(colId) + 1;

  const ultima = hoja.getLastRow();
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
  throw new Error('No se encontró el equipo con ID ' + id);
}

// ----------------------------------------------------------------------------
//  ELIMINAR
// ----------------------------------------------------------------------------
function eliminarEquipo(id) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA);
  const enc  = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
                   .map(c => String(c).trim());

  const colId = nombreColumnaClave(enc, 'id');
  if (!colId) throw new Error('No hay columna de ID en la hoja (revisa CONFIG.CAMPOS_CLAVE.id).');
  const colIdNum = enc.indexOf(colId) + 1;

  const ultima = hoja.getLastRow();
  const ids = hoja.getRange(2, colIdNum, ultima - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      hoja.deleteRow(i + 2);
      return { ok: true };
    }
  }
  throw new Error('No se encontró el equipo con ID ' + id);
}

// ----------------------------------------------------------------------------
//  HELPERS LOCALES
// ----------------------------------------------------------------------------

/** Devuelve el NOMBRE REAL en la hoja para una clave (id, estado, area, fecha). */
function nombreColumnaClave(encabezados, clave) {
  const i = buscarIndice(encabezados, CONFIG.CAMPOS_CLAVE[clave]);
  return i >= 0 ? encabezados[i] : null;
}

/** Genera el siguiente ID con el prefijo configurado (EQ-001, EQ-002…) */
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
