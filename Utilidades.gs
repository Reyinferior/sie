/**
 * ============================================================================
 *  UTILIDADES COMPARTIDAS  (multi-sistema)
 * ============================================================================
 *  Cada función recibe el `cfg` del sistema activo (CONFIGS[sistema]) para
 *  saber qué hoja leer y qué columnas son las "clave".
 */

/**
 * Lee la hoja del sistema indicado y devuelve:
 *   - encabezados (fila 1 real de la hoja)
 *   - filas como objetos { 'NombreColumna': valor, ... }
 *   - idx: índice de las columnas clave (id/estado/area/fecha)
 */
function leerHoja(cfg) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.HOJA);
  const out  = { hoja: hoja, encabezados: [], filas: [], idx: {} };

  if (!hoja || hoja.getLastRow() < 1) return out;

  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0]
                          .map(c => String(c).trim());
  out.encabezados = encabezados;

  out.idx = {
    id:     buscarIndice(encabezados, cfg.CAMPOS_CLAVE.id),
    estado: buscarIndice(encabezados, cfg.CAMPOS_CLAVE.estado),
    area:   buscarIndice(encabezados, cfg.CAMPOS_CLAVE.area),
    fecha:  buscarIndice(encabezados, cfg.CAMPOS_CLAVE.fecha)
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

/** Devuelve el NOMBRE REAL en la hoja para una clave (id/estado/area/fecha). */
function nombreColumnaClave(cfg, encabezados, clave) {
  const i = buscarIndice(encabezados, cfg.CAMPOS_CLAVE[clave]);
  return i >= 0 ? encabezados[i] : null;
}

/** Busca un encabezado sin distinguir mayúsculas/acentos. -1 si no existe. */
function buscarIndice(encabezados, nombre) {
  if (!nombre) return -1;
  const objetivo = normalizar(nombre);
  for (let i = 0; i < encabezados.length; i++) {
    if (normalizar(encabezados[i]) === objetivo) return i;
  }
  return -1;
}

function normalizar(s) {
  return String(s).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Busca el "tipo" (ok/warn/bad) de un estado configurado en este sistema. */
function tipoDeEstado(cfg, nombre) {
  const e = cfg.ESTADOS.find(x => x.nombre === nombre);
  return e ? e.tipo : 'ok';
}

/** Devuelve una fecha N días atrás (se usa en los datos de ejemplo). */
function diasAtras(fecha, n) {
  const d = new Date(fecha);
  d.setDate(d.getDate() - n);
  return d;
}

/** Diferencia en días entre dos fechas (entera, no negativa). */
function diferenciaEnDias(desde, hasta) {
  const ms = new Date(hasta) - new Date(desde);
  return Math.max(0, Math.floor(ms / 86400000));
}

/** Formatea una fecha como "martes, 21 de abril de 2026". */
function formatearFechaLarga(d) {
  const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return dias[d.getDay()] + ', ' + d.getDate() + ' de ' +
         meses[d.getMonth()] + ' de ' + d.getFullYear();
}
