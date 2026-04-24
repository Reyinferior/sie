/**
 * ============================================================================
 *  IMPRESORAS · CONFIGURACIÓN GLOBAL + RUTEO WEB
 *  ----------------------------------------------------------------------------
 *  Este es un proyecto Apps Script SEPARADO del de Equipos.
 *  Tiene su propia URL (despliegue) y lee de la pestaña
 *  "Inventario_de_Impresoras" del MISMO Google Sheet.
 *
 *  CÓMO INSTALARLO:
 *  1. Abre el Google Sheet (el mismo donde está la pestaña
 *     "Inventario_de_Impresoras").
 *  2. Extensiones > Apps Script > "Nuevo proyecto" (uno NUEVO,
 *     no el de Equipos).
 *  3. Crea estos archivos con estos nombres exactos:
 *        - Config.gs
 *        - Esquema.gs
 *        - Inventario.gs
 *        - Inicializacion.gs
 *        - Utilidades.gs
 *        - ImpresorasUI.html
 *  4. (Opcional) Ejecuta UNA vez `inicializarHojaImpresoras()` para
 *     dejar lista la pestaña con los encabezados base si aún no existe.
 *  5. Implementar > Nueva implementación > Aplicación web.
 * ============================================================================
 */

const CONFIG = {
  // Pestaña del Sheet que actúa como base de datos de impresoras.
  HOJA: 'Inventario_de_Impresoras',

  // Las columnas se leen AUTOMÁTICAMENTE de la fila 1 de la hoja.
  // Esta lista solo se usa la primera vez (cuando ejecutas
  // inicializarHojaImpresoras y la hoja está vacía) para sembrar los
  // encabezados base. Después puedes agregar/quitar/renombrar columnas
  // en Sheets cuando quieras y aparecerán solas en la tabla y en el
  // formulario.
  COLUMNAS_INICIALES: [
    'N°',
    'UNIDAD/DPTO',
    'AREA/SERVICIO',
    'USUARIO(A)',
    'CODPAT',
    'COD. INV',
    'TIPO DE EQUIPO',
    'MARCA',
    'MODELO',
    'TIPO DE IMPRESORA',
    'SERIE',
    'MAC'
  ],

  // Mapeo de columnas con significado especial. Si en tu hoja les pones
  // otro nombre, cámbialo aquí. Si una no existe, déjala en '' y se ignora.
  CAMPOS_CLAVE: {
    id:     'CODPAT',         // identificador único de cada impresora
    estado: '',               // (aún no hay columna de estado en tu hoja)
    area:   'AREA/SERVICIO',  // ubicación
    fecha:  ''                // (aún no hay columna de fecha)
  },

  // Estados (por si más adelante agregas la columna "Estado").
  // ok = verde, warn = naranja, bad = rojo.
  ESTADOS: [
    { nombre: 'Operativa',     tipo: 'ok'   },
    { nombre: 'Mantenimiento', tipo: 'warn' },
    { nombre: 'Baja',          tipo: 'bad'  }
  ],

  // Encabezado de la app
  MARCA:  'Inventario HSJ — Impresoras',
  TITULO: 'Inventario de Impresoras',

  // Prefijo para autogenerar IDs (cuando creas una nueva sin escribir CODPAT)
  PREFIJO_ID: 'IMP-',

  // ============================================================
  // GRUPOS DE CAMPOS (para el formulario "Nueva/Editar impresora")
  // ------------------------------------------------------------
  //   clave  = nombre del bloque mostrado en el formulario
  //   valor  = lista de columnas REALES de la hoja que pertenecen
  //            a ese bloque. Si una columna que pongas no existe
  //            en la hoja, se omite (no rompe nada).
  // ============================================================
  GRUPOS_FILTROS: {
    '🪪 Identificación': [
      'N°', 'CODPAT', 'COD. INV', 'SERIE', 'MAC'
    ],
    '📍 Ubicación': [
      'UNIDAD/DPTO', 'AREA/SERVICIO', 'USUARIO(A)'
    ],
    '🖨️ Equipo': [
      'TIPO DE EQUIPO', 'MARCA', 'MODELO', 'TIPO DE IMPRESORA'
    ]
  }
};

// ----------------------------------------------------------------------------
//  RUTEO WEB
// ----------------------------------------------------------------------------
/** Punto de entrada cuando alguien abre la URL de la app web. */
function doGet(e) {
  const tpl = HtmlService.createTemplateFromFile('ImpresorasUI');
  tpl.pestanaInicial = (e && e.parameter && e.parameter.page) || 'inventario';
  return tpl.evaluate()
    .setTitle('Inventario de Impresoras')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** URL base del despliegue web (la usan los enlaces internos). */
function getUrlAppImpresoras() {
  return ScriptApp.getService().getUrl();
}
