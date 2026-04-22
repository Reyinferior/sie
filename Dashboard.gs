/**
 * ============================================================================
 *  MÓDULO DASHBOARD
 *  Funciones que alimentan la página DashboardUI.html con los datos resumidos.
 *
 *  Las columnas se detectan AUTOMÁTICAMENTE de la hoja. Solo necesita
 *  conocer cuáles son las columnas de "Estado", "Area" y "Fecha", y eso
 *  se configura en CONFIG.CAMPOS_CLAVE (en Config.gs).
 * ============================================================================
 */

function obtenerDatosDashboard() {
  const base = {
    marca:     CONFIG.MARCA,
    titulo:    CONFIG.TITULO,
    fecha:     formatearFechaLarga(new Date()),
    estados:   CONFIG.ESTADOS,
    total:     0,
    porEstado: {},
    recientes: [],
    alertas:   [],
    porArea:   [],
    urlApp:    getUrlApp()
  };

  // Lee toda la hoja con auto-detección de columnas
  const tabla = leerHoja();
  if (!tabla.filas.length) return base;

  const enc = tabla.encabezados;

  // Nombres reales de las columnas clave (los que el usuario tenga)
  const colId     = CONFIG.CAMPOS_CLAVE.id     && enc[buscarIndice(enc, CONFIG.CAMPOS_CLAVE.id)];
  const colEstado = CONFIG.CAMPOS_CLAVE.estado && enc[buscarIndice(enc, CONFIG.CAMPOS_CLAVE.estado)];
  const colArea   = CONFIG.CAMPOS_CLAVE.area   && enc[buscarIndice(enc, CONFIG.CAMPOS_CLAVE.area)];
  const colFecha  = CONFIG.CAMPOS_CLAVE.fecha  && enc[buscarIndice(enc, CONFIG.CAMPOS_CLAVE.fecha)];

  // Buscamos una columna "Nombre" si existe; si no, usamos la 2ª
  const colNombre = enc[buscarIndice(enc, 'Nombre')] || enc[1] || enc[0];

  // ---- conteos ------------------------------------------------------------
  const conteoEstado = {};
  CONFIG.ESTADOS.forEach(e => conteoEstado[e.nombre] = 0);
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
        tipo:   tipoDeEstado(r[colEstado])
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
          : (nombre + ' ' + id + (dias != null
                ? ' lleva ' + dias + ' días en mantenimiento'
                : ' en mantenimiento'));

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
