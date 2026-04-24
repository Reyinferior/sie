/**
 * ============================================================================
 *  CONFIGURACIÓN GLOBAL + RUTEO WEB  (multi-sistema)
 * ============================================================================
 *  Cada "sistema" (equipos, impresoras, mantenimiento, tickets…) vive en su
 *  propio HTML y en su propia hoja de Sheets. Aquí los declaras todos en el
 *  objeto CONFIGS y agregas un botón en la barra superior de cada UI.
 *
 *  CÓMO INSTALARLO EN APPS SCRIPT:
 *  1. Abre tu Google Sheet (será la base de datos).
 *  2. Menú: Extensiones > Apps Script.
 *  3. Crea estos archivos en el editor (mismos nombres exactos):
 *        - Config.gs, Dashboard.gs, Inventario.gs, Reportes.gs, Utilidades.gs
 *        - EquiposUI.html
 *        - ImpresorasUI.html
 *  4. Ejecuta UNA vez `inicializarHojas()` (en Inventario.gs) para crear
 *     las hojas con los encabezados iniciales de cada sistema.
 *  5. Implementar > Nueva implementación > Tipo: Aplicación web.
 * ============================================================================
 */

const CONFIGS = {

  // ============================================================
  //  SISTEMA: EQUIPOS
  // ============================================================
  equipos: {
    HTML_FILE: 'EquiposUI',
    HOJA: 'Equipos',
    COLUMNAS_INICIALES: ['ID', 'Nombre', 'Categoria', 'Estado', 'Area', 'Fecha'],
    CAMPOS_CLAVE: {
      id:     'Nombre PC',          // identificador único de cada equipo
      estado: 'Estado',
      area:   'Área',
      fecha:  'Fecha Adquisición'
    },
    ESTADOS: [
      { nombre: 'Operativo',     tipo: 'ok'   },
      { nombre: 'Mantenimiento', tipo: 'warn' },
      { nombre: 'Baja',          tipo: 'bad'  }
    ],
    MARCA:  'Inventario HSJ',
    TITULO: 'Dashboard',
    PREFIJO_ID: 'EQ-',
    GRUPOS_FILTROS: {
      '🪪 Identificación': [
        'Nombre PC', 'Cod. Patrimonio', 'Código Patrimonio',
        'Usuario', 'Fecha Adquisición'
      ],
      '📍 Ubicación': ['Unidad', 'Oficina', 'Área'],
      '🖥️ CPU': ['Marca CPU', 'Modelo CPU', 'Estado CPU'],
      '🔧 Mainboard': ['Marca Mainboard', 'Modelo Mainboard'],
      '⚙️ Procesador': [
        'Marca Procesador', 'Procesador',
        'Velocidad Procesador', 'Velocidad',
        'Generación Procesador', 'Generación'
      ],
      '💾 Memoria': ['Tipo Memoria', 'Total Memoria (GB)', 'Total RAM', 'Memoria RAM'],
      '💽 Disco': ['Marca Disco', 'Capacidad Disco', 'Capacidad', 'Tipo Disco', 'Disco Duro'],
      '🎮 Tarjeta de Video': [
        'Marca T.Video', 'Marca T. Video', 'Marca Tarjeta Video',
        'Modelo T.Video', 'Modelo Tarjeta Video', 'Memoria Video'
      ],
      '💿 DVD': [
        'Marca Grabadora DVD', 'Marca DVD',
        'Tipo Grabadora DVD', 'Tipo DVD',
        'Velocidad Grabadora', 'Velocidad DVD'
      ],
      '⌨️ Teclado': [
        'Marca Teclado', 'Modelo Teclado',
        'N° Serie Teclado', 'Nº Serie Teclado', 'Serie Teclado',
        'Cod. Teclado', 'Cód. Patrimonio Teclado', 'Estado Teclado'
      ],
      '🖱️ Mouse': [
        'Marca Mouse', 'Modelo Mouse',
        'N° Serie Mouse', 'Nº Serie Mouse', 'Serie Mouse',
        'Cod. Mouse', 'Cód. Patrimonio Mouse', 'Estado Mouse'
      ],
      '🖥️ Monitor': [
        'Marca Monitor', 'Modelo Monitor', 'Tipo Monitor',
        'N° Serie Monitor', 'Nº Serie Monitor', 'Serie Monitor',
        'Cod. Monitor', 'Cód. Patrimonio Monitor', 'Estado Monitor'
      ],
      '⚡ Estabilizador / UPS': [
        'Marca Estabilizador', 'Modelo Estabilizador',
        'N° Serie Estabilizador', 'Estado Estabilizador',
        'Estabilizador', 'UPS', 'Marca UPS', 'Modelo UPS'
      ],
      '💿 Software': [
        'Sistema Operativo', 'Versión SO', 'Office', 'Versión Office', 'Antivirus'
      ],
      '🌐 Internet / Red': [
        'IP', 'Número de IP', 'MAC', 'Dirección MAC',
        'Tipo Conexión', 'Red', 'Switch', 'Punto de Red'
      ]
    }
  },

  // ============================================================
  //  SISTEMA: IMPRESORAS
  // ============================================================
  impresoras: {
    HTML_FILE: 'ImpresorasUI',
    HOJA: 'Inventario_de_Impresoras',
    COLUMNAS_INICIALES: [
      'COD. INV', 'UNIDAD /DPTO', 'AREA / SERVICIO', 'USUARIO(A)', 'CODPAT',
      'TIPO DE EQUIPO', 'MARCA', 'MODELO', 'TIPO DE IMPRESORA', 'SERIE', 'MAC',
      'Estado', 'Fecha'
    ],
    CAMPOS_CLAVE: {
      id:     'COD. INV',
      estado: 'Estado',
      area:   'AREA / SERVICIO',
      fecha:  'Fecha'
    },
    ESTADOS: [
      { nombre: 'Operativo',     tipo: 'ok'   },
      { nombre: 'Mantenimiento', tipo: 'warn' },
      { nombre: 'Baja',          tipo: 'bad'  }
    ],
    MARCA:  'Inventario HSJ — Impresoras',
    TITULO: 'Dashboard de Impresoras',
    PREFIJO_ID: '',  // Se ingresa manual (formato del Excel: "NNNNN-AAAA")
    GRUPOS_FILTROS: {
      '🪪 Identificación': ['COD. INV', 'CODPAT', 'SERIE', 'MAC'],
      '🖨️ Equipo':         ['TIPO DE EQUIPO', 'MARCA', 'MODELO', 'TIPO DE IMPRESORA'],
      '📍 Ubicación':      ['UNIDAD /DPTO', 'AREA / SERVICIO', 'USUARIO(A)'],
      '🗓️ Estado y Fechas':['Estado', 'Fecha']
    }
  }

};

// Compatibilidad: cualquier código antiguo que aún use `CONFIG` cae en equipos.
const CONFIG = CONFIGS.equipos;

/** Devuelve la configuración del sistema activo. */
function getCfg(sistema) {
  return CONFIGS[sistema] || CONFIGS.equipos;
}


// ----------------------------------------------------------------------------
//  RUTEO WEB
// ----------------------------------------------------------------------------
/**
 * Punto de entrada. Lee ?sistema= y ?page= y abre el HTML correspondiente.
 *   ?sistema=equipos     -> EquiposUI.html
 *   ?sistema=impresoras  -> ImpresorasUI.html
 * (Por defecto: equipos)
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const sistema = CONFIGS[params.sistema] ? params.sistema : 'equipos';
  const cfg     = CONFIGS[sistema];
  const tpl     = HtmlService.createTemplateFromFile(cfg.HTML_FILE);
  tpl.sistema        = sistema;
  tpl.pestanaInicial = params.page || 'dashboard';
  return tpl.evaluate()
    .setTitle(cfg.MARCA)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** URL base de la app web (la usan los enlaces internos). */
function getUrlApp() {
  return ScriptApp.getService().getUrl();
}
