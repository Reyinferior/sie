/**
 * ============================================================================
 *  MÓDULO DASHBOARD  (multi-sistema)
 *  Alimenta la pestaña Dashboard con resúmenes (totales, recientes, alertas,
 *  distribución por área). Recibe `sistema` para saber qué hoja consultar.
 * ============================================================================
 */

function obtenerDatosDashboard(sistema) {
  const cfg  = getCfg(sistema);
  const base = {
    marca:     cfg.MARCA,
    titulo:    cfg.TITULO,
    fecha:     formatearFechaLarga(new Date()),
    estados:   cfg.ESTADOS,
    total:     0,
    porEstado: {},
    recientes: [],
    alertas:   [],
    porArea:   [],
    urlApp:    getUrlApp()
  };

  const tabla = leerHoja(cfg);
  if (!tabla.filas.length) return base;

  const enc = tabla.encabezados;
  const colId     = nombreColumnaClave(cfg, enc, 'id');
  const colEstado = nombreColumnaClave(cfg, enc, 'estado');
  const colArea   = nombreColumnaClave(cfg, enc, 'area');
  const colFecha  = nombreColumnaClave(cfg, enc, 'fecha');

  // Buscamos una columna "Nombre" si existe; si no, usamos la 2ª
  const colNombre = enc[buscarIndice(enc, 'Nombre')] || enc[1] || enc[0];

  // ---- conteos ------------------------------------------------------------
  const conteoEstado = {};
  cfg.ESTADOS.forEach(e => conteoEstado[e.nombre] = 0);
  const conteoArea = {};

  tabla.filas.forEach(r => {
    const estado = colEstado ? String(r[colEstado] || '').trim() : '';
    const area   = colArea   ? (String(r[colArea]   || '').trim() || 'Sin asignar') : 'Sin asignar';
    if (estado in conteoEstado) conteoEstado[estado]++;
    conteoArea[area] = (conteoArea[area] || 0) + 1;
  });

  base.total     = tabla.filas.length;
  base.porEstado = conteoEstado;

  // ---- últimos 4 registros por fecha --------------------------------------
  if (colFecha) {
    base.recientes = tabla.filas
      .filter(r => r[colFecha])
      .sort((a, b) => new Date(b[colFecha]) - new Date(a[colFecha]))
      .slice(0, 4)
      .map(r => ({
        id:     colId     ? r[colId]     : '',
        nombre: colNombre ? r[colNombre] : '',
        area:   colArea   ? r[colArea]   : '',
        estado: colEstado ? r[colEstado] : '',
        tipo:   tipoDeEstado(cfg, r[colEstado])
      }));
  }

  // ---- alertas (Mantenimiento o Baja) -------------------------------------
  if (colEstado) {
    const hoy = new Date();
    base.alertas = tabla.filas
      .filter(r => {
        const e = String(r[colEstado] || '').trim();
        return e === 'Mantenimiento' || e === 'Baja';
      })
      .map(r => {
        const estado = String(r[colEstado] || '').trim();
        const nombre = colNombre ? r[colNombre] : '';
        const id     = colId     ? r[colId]     : '';
        const dias   = (colFecha && r[colFecha]) ? diferenciaEnDias(r[colFecha], hoy) : null;
        const titulo = (estado === 'Baja')
          ? (nombre + ' ' + id + ' dado de baja')
          : (nombre + ' ' + id + (dias != null ? ' lleva ' + dias + ' días en mantenimiento' : ' en mantenimiento'));
        return {
          tipo:    estado === 'Baja' ? 'bad' : 'warn',
          titulo:  titulo,
          detalle: dias != null ? 'Hace ' + dias + ' días' : ''
        };
      })
      .slice(0, 5);
  }

  // ---- distribución por área ---------------------------------------------
  base.porArea = Object.keys(conteoArea)
    .map(a => ({ area: a, valor: conteoArea[a] }))
    .sort((x, y) => y.valor - x.valor);

  return base;
}
