/**
 * ============================================================================
 *  MÓDULO REPORTES PERSONALIZADOS
 *
 *  Devuelve al frontend (ReportesUI.html):
 *   - Todas las filas y columnas reales de la hoja
 *   - Los grupos de filtros configurados (CONFIG.GRUPOS_FILTROS) ya
 *     enriquecidos con los valores únicos que existen en cada columna,
 *     listos para pintar como casillas marcables.
 *
 *  El filtrado y la búsqueda se hacen en el navegador para que sea
 *  instantáneo y no haya que volver a llamar al servidor.
 * ============================================================================
 */
function obtenerDatosReportes() {
  const tabla = leerHoja();
  const enc   = tabla.encabezados;

  // Construye los grupos de filtros con sus valores únicos
  const grupos = [];
  Object.keys(CONFIG.GRUPOS_FILTROS).forEach(nombreGrupo => {
    const columnas = CONFIG.GRUPOS_FILTROS[nombreGrupo];
    const camposExistentes = [];

    columnas.forEach(col => {
      // Solo incluimos columnas que realmente existan en la hoja
      if (buscarIndice(enc, col) < 0) return;

      // Valores únicos de esa columna (sin vacíos, ordenados)
      const setVals = {};
      tabla.filas.forEach(f => {
        const v = String(f[col] || '').trim();
        if (v) setVals[v] = true;
      });
      const valores = Object.keys(setVals).sort();

      camposExistentes.push({ columna: col, valores: valores });
    });

    // Solo agregamos el grupo si al menos una columna existe
    if (camposExistentes.length) {
      grupos.push({ nombre: nombreGrupo, campos: camposExistentes });
    }
  });

  return {
    marca:    CONFIG.MARCA,
    columnas: enc,
    filas:    tabla.filas,
    grupos:   grupos,
    urlApp:   getUrlApp()
  };
}
