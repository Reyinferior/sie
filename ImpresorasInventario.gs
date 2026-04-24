/**
 * ============================================================================
 *  IMPRESORAS · INVENTARIO (lectura + CRUD)
 *  ----------------------------------------------------------------------------
 *  Funciones llamadas desde ImpresorasUI.html vía google.script.run:
 *     listarImpresoras()
 *     crearImpresora(datos)
 *     actualizarImpresora(id, datos)
 *     eliminarImpresora(id)
 *
 *  Helpers compartidos con la app de Equipos que se reutilizan tal cual:
 *     buscarIndice()  -> Utilidades.gs
 *     normalizar()    -> Utilidades.gs
 *
 *  Helpers específicos de impresoras (definidos aquí para no chocar con
 *  los de Equipos, que usan CONFIG):
 *     leerHojaImpresoras()
 *     obtenerEncabezadosImp()
 *     nombreColumnaClaveImp()
 *     tipoDeEstadoImp()
 *     generarNuevoIdImp()
 * ============================================================================
 */

// ----------------------------------------------------------------------------
//  LECTURA DE LA HOJA
// ----------------------------------------------------------------------------
function obtenerEncabezadosImp() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_IMP.HOJA);
  if (!hoja || hoja.getLastRow() < 1 || hoja.getLastColumn() < 1) return [];
  return hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
             .map(c => String(c).trim());
}

function leerHojaImpresoras() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_IMP.HOJA);
  const out  = { hoja: hoja, encabezados: [], filas: [] };

  if (!hoja || hoja.getLastRow() < 1) return out;

  const encabezados = obtenerEncabezadosImp();
  out.encabezados = encabezados;

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

/** NOMBRE REAL en la hoja para una clave de CONFIG_IMP (id, estado, area, fecha). */
function nombreColumnaClaveImp(encabezados, clave) {
  const i = buscarIndice(encabezados, CONFIG_IMP.CAMPOS_CLAVE[clave]); // helper compartido
  return i >= 0 ? encabezados[i] : null;
}

/** Devuelve el "tipo" (ok/warn/bad) de un estado de impresora. */
function tipoDeEstadoImp(nombre) {
  if (!nombre) return 'ok';
  const e = CONFIG_IMP.ESTADOS.find(x => x.nombre === nombre);
  return e ? e.tipo : 'ok';
}

// ----------------------------------------------------------------------------
//  LISTAR  (alimenta ImpresorasUI.html)
// ----------------------------------------------------------------------------
function listarImpresoras() {
  const tabla = leerHojaImpresoras();

  const colId     = nombreColumnaClaveImp(tabla.encabezados, 'id');
  const colEstado = nombreColumnaClaveImp(tabla.encabezados, 'estado');

  // Solo agrega al formulario los grupos cuyas columnas existen en la hoja.
  const grupos = [];
  Object.keys(CONFIG_IMP.GRUPOS_FILTROS).forEach(nombreGrupo => {
    const cols = CONFIG_IMP.GRUPOS_FILTROS[nombreGrupo].filter(c =>
      buscarIndice(tabla.encabezados, c) >= 0
    );
    if (cols.length) grupos.push({ nombre: nombreGrupo, columnas: cols });
  });

  return {
    marca:    CONFIG_IMP.MARCA,
    titulo:   CONFIG_IMP.TITULO,
    estados:  CONFIG_IMP.ESTADOS,
    columnas: tabla.encabezados,
    grupos:   grupos,
    filas:    tabla.filas.map(f => {
      f.__id         = colId     ? f[colId]     : '';
      f.__tipoEstado = tipoDeEstadoImp(colEstado ? f[colEstado] : '');
      return f;
    }),
    campos: {
      id:     colId,
      estado: colEstado,
      area:   nombreColumnaClaveImp(tabla.encabezados, 'area'),
      fecha:  nombreColumnaClaveImp(tabla.encabezados, 'fecha')
    },
    urlApp: getUrlApp()    // helper de Config.gs (reusado)
  };
}

// ----------------------------------------------------------------------------
//  CREAR
// ----------------------------------------------------------------------------
function crearImpresora(datos) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_IMP.HOJA);
  if (!hoja) throw new Error('La hoja "' + CONFIG_IMP.HOJA + '" no existe. Ejecuta inicializarHojaImpresoras().');

  const enc      = obtenerEncabezadosImp();
  const colId    = nombreColumnaClaveImp(enc, 'id');
  const colFecha = nombreColumnaClaveImp(enc, 'fecha');

  // ID automático si hay columna ID y no nos la mandaron
  if (colId && !datos[colId]) datos[colId] = generarNuevoIdImp(hoja, enc, colId);
  // Fecha actual si hay columna Fecha y no nos la mandaron
  if (colFecha && !datos[colFecha]) datos[colFecha] = new Date();

  // Si la hoja tiene columna 'N°' la rellenamos con el siguiente número visible
  const idxN = buscarIndice(enc, 'N°');
  if (idxN >= 0 && !datos[enc[idxN]]) {
    datos[enc[idxN]] = (hoja.getLastRow() < 2) ? 1 : hoja.getLastRow();
  }

  const fila = enc.map(c => datos[c] !== undefined ? datos[c] : '');
  hoja.appendRow(fila);
  return { ok: true, id: colId ? datos[colId] : null };
}

// ----------------------------------------------------------------------------
//  ACTUALIZAR
// ----------------------------------------------------------------------------
function actualizarImpresora(id, datos) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_IMP.HOJA);
  const enc  = obtenerEncabezadosImp();

  const colId = nombreColumnaClaveImp(enc, 'id');
  if (!colId) throw new Error('No hay columna de ID en la hoja (revisa CONFIG_IMP.CAMPOS_CLAVE.id).');
  const colIdNum = enc.indexOf(colId) + 1;

  const ultima = hoja.getLastRow();
  if (ultima < 2) throw new Error('No se encontró la impresora con ID ' + id);

  const ids = hoja.getRange(2, colIdNum, ultima - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const filaActual = hoja.getRange(i + 2, 1, 1, enc.length).getValues()[0];
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
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_IMP.HOJA);
  const enc  = obtenerEncabezadosImp();

  const colId = nombreColumnaClaveImp(enc, 'id');
  if (!colId) throw new Error('No hay columna de ID en la hoja (revisa CONFIG_IMP.CAMPOS_CLAVE.id).');
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
//  GENERADOR DE ID
// ----------------------------------------------------------------------------
function generarNuevoIdImp(hoja, enc, colId) {
  const colNum = enc.indexOf(colId) + 1;
  if (!colNum || hoja.getLastRow() < 2) return CONFIG_IMP.PREFIJO_ID + '001';
  const ids = hoja.getRange(2, colNum, hoja.getLastRow() - 1, 1).getValues();
  let max = 0;
  ids.forEach(([v]) => {
    const m = String(v).match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return CONFIG_IMP.PREFIJO_ID + String(max + 1).padStart(3, '0');
}
