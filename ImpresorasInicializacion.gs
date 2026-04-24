/**
 * ============================================================================
 *  IMPRESORAS · INICIALIZACIÓN
 *  ----------------------------------------------------------------------------
 *  Ejecuta `inicializarHojaImpresoras()` UNA vez desde el editor de Apps
 *  Script para asegurarte de que la pestaña "Inventario_de_Impresoras"
 *  exista y tenga los encabezados base.
 *
 *  - Si la pestaña ya existe y tiene datos: NO toca nada.
 *  - Si la pestaña existe pero está vacía: siembra los encabezados.
 *  - Si la pestaña no existe: la crea y siembra los encabezados.
 * ============================================================================
 */

function inicializarHojaImpresoras() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = ss.getSheetByName(CONFIG_IMP.HOJA);
  if (!hoja) hoja = ss.insertSheet(CONFIG_IMP.HOJA);

  if (hoja.getLastRow() === 0) {
    const cols = CONFIG_IMP.COLUMNAS_INICIALES;
    hoja.getRange(1, 1, 1, cols.length).setValues([cols]);
    hoja.getRange(1, 1, 1, cols.length)
        .setFontWeight('bold')
        .setBackground('#0f172a')
        .setFontColor('#fff');
    hoja.setFrozenRows(1);
  }

  SpreadsheetApp.getUi().alert('Hoja "' + CONFIG_IMP.HOJA + '" lista.');
}
