/**
 * ============================================================================
 *  IMPRESORAS · CONFIGURACIÓN
 *  ----------------------------------------------------------------------------
 *  Vive en el MISMO proyecto Apps Script que la app de Equipos. Para no
 *  chocar con `CONFIG` (que es de equipos) este objeto se llama `CONFIG_IMP`.
 *
 *  Las URLs de cada app dentro del mismo despliegue son:
 *     <URL>?sistema=equipos      -> AppUI (Dashboard / Inventario / Reportes)
 *     <URL>?sistema=impresoras   -> ImpresorasUI (Inventario de impresoras)
 *
 *  Aquí se ajustan: nombre de la pestaña del Sheet, columnas iniciales,
 *  qué columnas son "clave" (ID, área, etc.), estados, y los grupos del
 *  formulario "Nueva/Editar impresora".
 * ============================================================================
 */

const CONFIG_IMP = {
  // Pestaña del Sheet que actúa como base de datos de impresoras.
  HOJA: 'Inventario_de_Impresoras',

  // Columnas que se siembran SOLO si la pestaña está vacía.
  // Después, las columnas se leen AUTOMÁTICAMENTE de la fila 1 de la hoja:
  // si agregas/quitas/renombras, aparecen solas en la tabla y el formulario.
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
    id:     'CODPAT',         // identificador único
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

  MARCA:  'Inventario HSJ — Impresoras',
  TITULO: 'Inventario de Impresoras',

  // Prefijo para autogenerar IDs cuando creas una nueva sin escribir CODPAT
  PREFIJO_ID: 'IMP-',

  // ============================================================
  // GRUPOS DE CAMPOS (para el formulario Nueva/Editar impresora)
  //   clave = nombre del bloque mostrado en el formulario
  //   valor = lista de columnas REALES de la hoja en ese bloque
  // Las columnas que no existan en la hoja se omiten sin romper nada.
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
