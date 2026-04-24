/**
 * ============================================================================
 *  CONFIGURACIÓN GLOBAL + RUTEO WEB
 *  Aquí editas casi todo lo que es "personalizable" sin tocar la lógica.
 * ============================================================================
 *
 *  CÓMO INSTALARLO:
 *  1. Abre tu Google Sheet (será la base de datos).
 *  2. Menú: Extensiones > Apps Script.
 *  3. Crea estos archivos en el editor (mismos nombres exactos):
 *        - Config.gs
 *        - Dashboard.gs
 *        - Inventario.gs
 *        - Utilidades.gs
 *        - DashboardUI.html      (Apps Script no permite que el .gs y el
 *        - InventarioUI.html      .html tengan el mismo nombre, por eso "UI")
 *  4. Ejecuta UNA vez `inicializarHoja()` (está en Inventario.gs) para
 *     crear la hoja "Equipos" con las columnas básicas y datos de ejemplo.
 *  5. Implementar > Nueva implementación > Tipo: Aplicación web.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
//  CONFIGURACIÓN  -- edita esta sección a tu gusto
// ----------------------------------------------------------------------------
const CONFIG = {
  // Nombre de la hoja (pestaña) que actúa como base de datos
  HOJA: 'Equipos',

  // ¡IMPORTANTE!
  // El sistema lee AUTOMÁTICAMENTE las columnas reales de la primera fila
  // de tu hoja. Puedes agregar/quitar/renombrar columnas en Sheets cuando
  // quieras y aparecerán solas en la tabla y en el formulario.
  //
  // Esta lista solo se usa la primera vez (cuando ejecutas inicializarHoja
  // y la hoja está vacía) para crear los encabezados iniciales.
  COLUMNAS_INICIALES: [
    'ID',
    'Nombre',
    'Categoria',
    'Estado',
    'Area',
    'Fecha'
  ],

  // El sistema necesita saber cuáles de tus columnas tienen significado
  // especial (ID único, estado, área, fecha). Si en tu hoja les pones
  // otro nombre (por ejemplo "Código" en vez de "ID"), cámbialo aquí.
  // Si alguna no existe en tu hoja, déjala en '' y se ignora.
  CAMPOS_CLAVE: {
    id:     'Nombre PC',          // identificador único de cada equipo
    estado: 'Estado',             // estado del equipo (alimenta tarjetas y dona)
    area:   'Área',               // ubicación / área (alimenta gráfico de barras)
    fecha:  'Fecha Adquisición'   // fecha (alimenta "recientes" y alertas)
  },

  // Estados posibles. Cambia/agrega los tuyos y dales un tipo de color:
  //   ok = verde, warn = naranja, bad = rojo
  ESTADOS: [
    { nombre: 'Operativo',     tipo: 'ok'   },
    { nombre: 'Mantenimiento', tipo: 'warn' },
    { nombre: 'Baja',          tipo: 'bad'  }
  ],

  // Encabezado de la app
  MARCA:  'Inventario HSJ',
  TITULO: 'Dashboard',

  // Prefijo automático para los IDs nuevos (EQ-001, EQ-002…)
  PREFIJO_ID: 'EQ-',

  // ============================================================
  // GRUPOS DE FILTROS (página Reportes Personalizados)
  // ------------------------------------------------------------
  // Cada grupo es una sección colapsable en el panel de filtros.
  // - clave  = nombre que se muestra en el panel (ej. "Ubicación")
  // - valor  = lista de columnas REALES de tu hoja que pertenecen
  //            a ese grupo. El sistema agarra los valores únicos
  //            de cada una y los muestra como casillas marcables.
  //
  // Si una columna que pongas no existe en la hoja, simplemente
  // se omite (no rompe nada). Para agregar/quitar grupos, edita
  // este objeto.
  // ============================================================
  GRUPOS_FILTROS: {
    '🪪 Identificación': [
      'Nombre PC', 'Cod. Patrimonio', 'Código Patrimonio',
      'Usuario', 'Fecha Adquisición'
    ],
    '📍 Ubicación': [
      'Unidad', 'Oficina', 'Área'
    ],
    '🖥️ CPU': [
      'Marca CPU', 'Modelo CPU', 'Estado CPU'
    ],
    '🔧 Mainboard': [
      'Marca Mainboard', 'Modelo Mainboard'
    ],
    '⚙️ Procesador': [
      'Marca Procesador', 'Procesador',
      'Velocidad Procesador', 'Velocidad',
      'Generación Procesador', 'Generación'
    ],
    '💾 Memoria': [
      'Tipo Memoria', 'Total Memoria (GB)', 'Total RAM', 'Memoria RAM'
    ],
    '💽 Disco': [
      'Marca Disco', 'Capacidad Disco', 'Capacidad', 'Tipo Disco', 'Disco Duro'
    ],
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
      'Sistema Operativo', 'Versión SO', 'Office', 'Versión Office',
      'Antivirus'
    ],
    '🌐 Internet / Red': [
      'IP', 'Número de IP', 'MAC', 'Dirección MAC',
      'Tipo Conexión', 'Red', 'Switch', 'Punto de Red'
    ]
  }
};

// ----------------------------------------------------------------------------
//  RUTEO WEB  (Equipos / Impresoras)
// ----------------------------------------------------------------------------
/**
 * Punto de entrada ÚNICO de toda la app web.
 *  - ?sistema=equipos     -> AppUI         (Dashboard / Inventario / Reportes de equipos)
 *  - ?sistema=impresoras  -> ImpresorasUI  (Inventario de impresoras)
 *  - ?page=...            -> pestaña inicial dentro de la app elegida
 */
function doGet(e) {
  const sistema = (e && e.parameter && e.parameter.sistema) || 'equipos';
  const page    = (e && e.parameter && e.parameter.page)    || '';

  if (sistema === 'impresoras') {
    const tpl = HtmlService.createTemplateFromFile('ImpresorasUI');
    tpl.pestanaInicial = page || 'inventario';
    return tpl.evaluate()
      .setTitle('Inventario de Impresoras')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Por defecto: app de Equipos
  const tpl = HtmlService.createTemplateFromFile('AppUI');
  tpl.pestanaInicial = page || 'dashboard';
  return tpl.evaluate()
    .setTitle('Inventario de Equipos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** URL base de la app web (la usan los enlaces del menú superior). */
function getUrlApp() {
  return ScriptApp.getService().getUrl();
}
