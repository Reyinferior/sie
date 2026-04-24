/**
 * ============================================================================
 *  MÓDULO REPORTES PERSONALIZADOS  (multi-sistema)
 *
 *  Devuelve al frontend de Reportes:
 *   - Todas las filas y columnas reales de la hoja del sistema activo
 *   - Los grupos de filtros configurados (cfg.GRUPOS_FILTROS) ya enriquecidos
 *     con los valores únicos que existen en cada columna, listos para pintar
 *     como casillas marcables.
 *
 *  El filtrado y la búsqueda se hacen en el navegador para que sea instantáneo.
 * ============================================================================
 */
function obtenerDatosReportes(sistema) {
  const cfg   = getCfg(sistema);
  const tabla = leerHoja(cfg);
  const enc   = tabla.encabezados;

  const grupos = [];
  Object.keys(cfg.GRUPOS_FILTROS).forEach(nombreGrupo => {
    const columnas = cfg.GRUPOS_FILTROS[nombreGrupo];
    const camposExistentes = [];

    columnas.forEach(col => {
      if (buscarIndice(enc, col) < 0) return;

      const setVals = {};
      tabla.filas.forEach(f => {
        const v = String(f[col] || '').trim();
        if (v) setVals[v] = true;
      });
      camposExistentes.push({ columna: col, valores: Object.keys(setVals).sort() });
    });

    if (camposExistentes.length) {
      grupos.push({ nombre: nombreGrupo, campos: camposExistentes });
    }
  });

  return {
    marca:    cfg.MARCA,
    columnas: enc,
    filas:    tabla.filas,
    grupos:   grupos,
    urlApp:   getUrlApp()
  };
}
