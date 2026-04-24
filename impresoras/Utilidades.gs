/**
 * ============================================================================
 *  IMPRESORAS · UTILIDADES COMPARTIDAS
 *  ----------------------------------------------------------------------------
 *  Funciones cortas que usan varios módulos.
 * ============================================================================
 */

/** Normaliza un texto para comparar sin tildes ni mayúsculas. */
function normalizar(s) {
  return String(s).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Busca el "tipo" (ok/warn/bad) de un estado configurado. */
function tipoDeEstado(nombre) {
  if (!nombre) return 'ok';
  const e = CONFIG.ESTADOS.find(x => x.nombre === nombre);
  return e ? e.tipo : 'ok';
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
