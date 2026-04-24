import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

const CONFIGS = {
  equipos: {
    LABEL: 'Equipos',
    HTML_FILE: 'EquiposUI.html',
    DATA_FILE: path.join(__dirname, 'data_equipos.json'),
    HOJA: 'Equipos',
    COLUMNAS_INICIALES: ['ID', 'Nombre', 'Categoria', 'Estado', 'Area', 'Fecha'],
    CAMPOS_CLAVE: { id: 'ID', estado: 'Estado', area: 'Area', fecha: 'Fecha' },
    ESTADOS: [
      { nombre: 'Operativo', tipo: 'ok' },
      { nombre: 'Mantenimiento', tipo: 'warn' },
      { nombre: 'Baja', tipo: 'bad' }
    ],
    MARCA: 'Inventario HSJ — Equipos',
    TITULO: 'Dashboard',
    PREFIJO_ID: 'EQ-',
    GRUPOS_FILTROS: {
      'Identificación': ['ID', 'Nombre'],
      'Ubicación': ['Area'],
      'Clasificación': ['Categoria', 'Estado'],
      'Fechas': ['Fecha']
    },
    SEED: () => {
      const hoy = new Date();
      return [
        { ID: 'EQ-001', Nombre: 'Monitor Samsung',     Categoria: 'Monitor',    Estado: 'Operativo',     Area: 'Emergencias', Fecha: diasAtras(hoy, 1) },
        { ID: 'EQ-002', Nombre: 'Desfibrilador',       Categoria: 'Equipo Med', Estado: 'Mantenimiento', Area: 'UCI',         Fecha: diasAtras(hoy, 15) },
        { ID: 'EQ-003', Nombre: 'Ecógrafo Portátil',   Categoria: 'Equipo Med', Estado: 'Operativo',     Area: 'Radiología',  Fecha: diasAtras(hoy, 3) },
        { ID: 'EQ-004', Nombre: 'Ventilador Mecánico', Categoria: 'Equipo Med', Estado: 'Baja',          Area: 'UCI',         Fecha: diasAtras(hoy, 2) },
        { ID: 'EQ-005', Nombre: 'Laptop Dell',         Categoria: 'Laptop',     Estado: 'Operativo',     Area: 'UCI',         Fecha: diasAtras(hoy, 4) },
        { ID: 'EQ-006', Nombre: 'PC HP EliteDesk',     Categoria: 'PC',         Estado: 'Operativo',     Area: 'UCI',         Fecha: diasAtras(hoy, 5) },
        { ID: 'EQ-007', Nombre: 'Monitor LG',          Categoria: 'Monitor',    Estado: 'Operativo',     Area: 'UCI',         Fecha: diasAtras(hoy, 6) },
        { ID: 'EQ-008', Nombre: 'Impresora Epson',     Categoria: 'Impresora',  Estado: 'Operativo',     Area: 'Emergencias', Fecha: diasAtras(hoy, 7) },
        { ID: 'EQ-009', Nombre: 'Laptop Lenovo',       Categoria: 'Laptop',     Estado: 'Operativo',     Area: 'Radiología',  Fecha: diasAtras(hoy, 8) },
        { ID: 'EQ-010', Nombre: 'PC Dell OptiPlex',    Categoria: 'PC',         Estado: 'Operativo',     Area: 'Laboratorio', Fecha: diasAtras(hoy, 9) }
      ];
    }
  },

  impresoras: {
    LABEL: 'Impresoras',
    HTML_FILE: 'ImpresorasUI.html',
    DATA_FILE: path.join(__dirname, 'data_impresoras.json'),
    HOJA: 'Inventario_de_Impresoras',
    // Mismos nombres de columna que la hoja Excel "Inventario_de_Impresoras"
    COLUMNAS_INICIALES: [
      'COD. INV', 'UNIDAD /DPTO', 'AREA / SERVICIO', 'USUARIO(A)', 'CODPAT',
      'TIPO DE EQUIPO', 'MARCA', 'MODELO', 'TIPO DE IMPRESORA', 'SERIE', 'MAC',
      'Estado', 'Fecha'
    ],
    CAMPOS_CLAVE: { id: 'COD. INV', estado: 'Estado', area: 'AREA / SERVICIO', fecha: 'Fecha' },
    ESTADOS: [
      { nombre: 'Operativo', tipo: 'ok' },
      { nombre: 'Mantenimiento', tipo: 'warn' },
      { nombre: 'Baja', tipo: 'bad' }
    ],
    MARCA: 'Inventario HSJ — Impresoras',
    TITULO: 'Dashboard de Impresoras',
    PREFIJO_ID: '',  // Se ingresa manual (formato del Excel: "NNNNN-AAAA")
    GRUPOS_FILTROS: {
      'Identificación':  ['COD. INV', 'CODPAT', 'SERIE', 'MAC'],
      'Equipo':          ['TIPO DE EQUIPO', 'MARCA', 'MODELO', 'TIPO DE IMPRESORA'],
      'Ubicación':       ['UNIDAD /DPTO', 'AREA / SERVICIO', 'USUARIO(A)'],
      'Estado y Fechas': ['Estado', 'Fecha']
    },
    SEED: () => {
      const hoy = new Date();
      const f = (anio) => new Date(anio, 0, 1).toISOString();
      return [
        { 'COD. INV':'07309-2022', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'DIGITACION 2DO PISO',              'USUARIO(A)':'',                  'CODPAT':'742223580021',     'TIPO DE EQUIPO':'IMPRESORA',  'MARCA':'EPSON', 'MODELO':'M205',           'TIPO DE IMPRESORA':'MULTIFUNCIONAL',     'SERIE':'SEAY012188',  'MAC':'', 'Estado':'Operativo', 'Fecha':f(2022) },
        { 'COD. INV':'07997-2022', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'DIGITACION 1ER PISO',              'USUARIO(A)':'',                  'CODPAT':'742223580019',     'TIPO DE EQUIPO':'IMPRESORA',  'MARCA':'EPSON', 'MODELO':'M205',           'TIPO DE IMPRESORA':'MULTIFUNCIONAL',     'SERIE':'SEAY012073',  'MAC':'', 'Estado':'Operativo', 'Fecha':f(2022) },
        { 'COD. INV':'06393-2022', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'DIGITACION 1ER PISO',              'USUARIO(A)':'',                  'CODPAT':'740840043008',     'TIPO DE EQUIPO':'ETIQUETERA', 'MARCA':'ZEBRA', 'MODELO':'TLP2844',        'TIPO DE IMPRESORA':'TÉRMICA',            'SERIE':'41/122303790','MAC':'', 'Estado':'Operativo', 'Fecha':f(2022) },
        { 'COD. INV':'07883-2024', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'ECOGRAFIA - ENTRADA',              'USUARIO(A)':'',                  'CODPAT':'740836500147',     'TIPO DE EQUIPO':'IMPRESORA',  'MARCA':'HP',    'MODELO':'P1102w (CE658A)','TIPO DE IMPRESORA':'LASER',              'SERIE':'BRBSH4G6N5',  'MAC':'', 'Estado':'Operativo', 'Fecha':f(2024) },
        { 'COD. INV':'05992-2025', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'ECOGRAFIA - FONDO',                'USUARIO(A)':'',                  'CODPAT':'740836500147',     'TIPO DE EQUIPO':'IMPRESORA',  'MARCA':'EPSON', 'MODELO':'L4160',          'TIPO DE IMPRESORA':'INYECCIÓN DE TINTA', 'SERIE':'X53003202',   'MAC':'', 'Estado':'Operativo', 'Fecha':f(2025) },
        { 'COD. INV':'07910-2022', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'ECOGRAFIA - FONDO',                'USUARIO(A)':'',                  'CODPAT':'532250000013-6',   'TIPO DE EQUIPO':'IMPRESORA',  'MARCA':'EPSON', 'MODELO':'L310',           'TIPO DE IMPRESORA':'INYECCIÓN DE TINTA', 'SERIE':'VHLK015753',  'MAC':'', 'Estado':'Operativo', 'Fecha':f(2022) },
        { 'COD. INV':'06577-2022', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'JEFATURA DIAGNOSTICO POR IMAGEN',  'USUARIO(A)':'',                  'CODPAT':'742223580062',     'TIPO DE EQUIPO':'IMPRESORA',  'MARCA':'EPSON', 'MODELO':'M200 (C472A)',   'TIPO DE IMPRESORA':'MULTIFUNCIONAL',     'SERIE':'UKTY005310',  'MAC':'', 'Estado':'Operativo', 'Fecha':f(2022) },
        { 'COD. INV':'06557-2022', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'SECRETARIA',                       'USUARIO(A)':'VANESSA MARCHAND',  'CODPAT':'740836500190',     'TIPO DE EQUIPO':'IMPRESORA',  'MARCA':'EPSON', 'MODELO':'M3170',          'TIPO DE IMPRESORA':'MULTIFUNCIONAL',     'SERIE':'XSTM003618',  'MAC':'', 'Estado':'Operativo', 'Fecha':f(2022) },
        { 'COD. INV':'09006-2024', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'TOMOGRAFIA',                       'USUARIO(A)':'',                  'CODPAT':'532296880001-31',  'TIPO DE EQUIPO':'IMPRESORA',  'MARCA':'EPSON', 'MODELO':'L1210',          'TIPO DE IMPRESORA':'MULTIFUNCIONAL',     'SERIE':'X8LA005210',  'MAC':'', 'Estado':'Operativo', 'Fecha':f(2024) },
        { 'COD. INV':'07925-2022', 'UNIDAD /DPTO':'DIAGNOSTICO POR IMAGEN', 'AREA / SERVICIO':'VENTANILLA',                       'USUARIO(A)':'',                  'CODPAT':'740838750015',     'TIPO DE EQUIPO':'ETIQUETERA', 'MARCA':'ZEBRA', 'MODELO':'GC420t',         'TIPO DE IMPRESORA':'TÉRMICA',            'SERIE':'54/143701305','MAC':'', 'Estado':'Operativo', 'Fecha':f(2022) }
      ];
    }
  }
};

function diasAtras(fecha, n) {
  const d = new Date(fecha);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function getSistema(name) {
  return CONFIGS[name] ? name : 'equipos';
}
function loadData(sistema) {
  const cfg = CONFIGS[sistema];
  try {
    return JSON.parse(fs.readFileSync(cfg.DATA_FILE, 'utf8'));
  } catch {
    const d = { encabezados: cfg.COLUMNAS_INICIALES.slice(), filas: cfg.SEED() };
    fs.writeFileSync(cfg.DATA_FILE, JSON.stringify(d, null, 2));
    return d;
  }
}
function saveData(sistema, d) {
  fs.writeFileSync(CONFIGS[sistema].DATA_FILE, JSON.stringify(d, null, 2));
}

function normalizar(s) {
  return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function buscarIndice(enc, nombre) {
  if (!nombre) return -1;
  const obj = normalizar(nombre);
  for (let i = 0; i < enc.length; i++) if (normalizar(enc[i]) === obj) return i;
  return -1;
}
function nombreColumnaClave(cfg, enc, clave) {
  const i = buscarIndice(enc, cfg.CAMPOS_CLAVE[clave]);
  return i >= 0 ? enc[i] : null;
}
function tipoDeEstado(cfg, nombre) {
  const e = cfg.ESTADOS.find(x => x.nombre === nombre);
  return e ? e.tipo : 'ok';
}
function diferenciaEnDias(desde, hasta) {
  return Math.max(0, Math.floor((new Date(hasta) - new Date(desde)) / 86400000));
}
function formatearFechaLarga(d) {
  const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

// ----------- API functions -----------
const api = {
  obtenerDatosDashboard(sistema) {
    const cfg = CONFIGS[sistema];
    const data = loadData(sistema);
    const enc = data.encabezados;
    const base = {
      marca: cfg.MARCA, titulo: cfg.TITULO,
      fecha: formatearFechaLarga(new Date()),
      estados: cfg.ESTADOS, total: 0, porEstado: {},
      recientes: [], alertas: [], porArea: [], urlApp: ''
    };
    if (!data.filas.length) return base;
    const colId = nombreColumnaClave(cfg, enc, 'id');
    const colEstado = nombreColumnaClave(cfg, enc, 'estado');
    const colArea = nombreColumnaClave(cfg, enc, 'area');
    const colFecha = nombreColumnaClave(cfg, enc, 'fecha');
    const colNombre = enc[buscarIndice(enc, 'Nombre')] || enc[1] || enc[0];

    const conteoEstado = {};
    cfg.ESTADOS.forEach(e => conteoEstado[e.nombre] = 0);
    const conteoArea = {};
    data.filas.forEach(r => {
      const estado = colEstado ? String(r[colEstado] || '').trim() : '';
      const area = colArea ? (String(r[colArea] || '').trim() || 'Sin asignar') : 'Sin asignar';
      if (estado in conteoEstado) conteoEstado[estado]++;
      conteoArea[area] = (conteoArea[area] || 0) + 1;
    });
    base.total = data.filas.length;
    base.porEstado = conteoEstado;
    if (colFecha) {
      base.recientes = data.filas
        .filter(r => r[colFecha])
        .sort((a, b) => new Date(b[colFecha]) - new Date(a[colFecha]))
        .slice(0, 4)
        .map(r => ({
          id: colId ? r[colId] : '',
          nombre: colNombre ? r[colNombre] : '',
          area: colArea ? r[colArea] : '',
          estado: colEstado ? r[colEstado] : '',
          tipo: tipoDeEstado(cfg, r[colEstado])
        }));
    }
    if (colEstado) {
      const hoy = new Date();
      base.alertas = data.filas
        .filter(r => {
          const e = String(r[colEstado] || '').trim();
          return e === 'Mantenimiento' || e === 'Baja';
        })
        .map(r => {
          const estado = String(r[colEstado] || '').trim();
          const nombre = colNombre ? r[colNombre] : '';
          const id = colId ? r[colId] : '';
          const dias = (colFecha && r[colFecha]) ? diferenciaEnDias(r[colFecha], hoy) : null;
          const titulo = (estado === 'Baja')
            ? `${nombre} ${id} dado de baja`
            : `${nombre} ${id}${dias != null ? ` lleva ${dias} días en mantenimiento` : ' en mantenimiento'}`;
          return {
            tipo: estado === 'Baja' ? 'bad' : 'warn',
            titulo, detalle: dias != null ? `Hace ${dias} días` : ''
          };
        }).slice(0, 5);
    }
    base.porArea = Object.keys(conteoArea)
      .map(a => ({ area: a, valor: conteoArea[a] }))
      .sort((x, y) => y.valor - x.valor);
    return base;
  },

  listarEquipos(sistema) {
    const cfg = CONFIGS[sistema];
    const data = loadData(sistema);
    const enc = data.encabezados;
    const colId = nombreColumnaClave(cfg, enc, 'id');
    const colEstado = nombreColumnaClave(cfg, enc, 'estado');
    const grupos = [];
    Object.keys(cfg.GRUPOS_FILTROS).forEach(nombreGrupo => {
      const cols = cfg.GRUPOS_FILTROS[nombreGrupo].filter(c => buscarIndice(enc, c) >= 0);
      if (cols.length) grupos.push({ nombre: nombreGrupo, columnas: cols });
    });
    return {
      marca: cfg.MARCA, estados: cfg.ESTADOS,
      columnas: enc, grupos,
      filas: data.filas.map(f => ({
        ...f,
        __id: colId ? f[colId] : '',
        __tipoEstado: tipoDeEstado(cfg, colEstado ? f[colEstado] : '')
      })),
      campos: {
        id: colId, estado: colEstado,
        area: nombreColumnaClave(cfg, enc, 'area'),
        fecha: nombreColumnaClave(cfg, enc, 'fecha')
      },
      urlApp: ''
    };
  },

  crearEquipo(sistema, datos) {
    const cfg = CONFIGS[sistema];
    const data = loadData(sistema);
    const enc = data.encabezados;
    const colId = nombreColumnaClave(cfg, enc, 'id');
    const colFecha = nombreColumnaClave(cfg, enc, 'fecha');
    if (colId && !datos[colId]) {
      let max = 0;
      data.filas.forEach(f => {
        const m = String(f[colId] || '').match(/(\d+)$/);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      datos[colId] = cfg.PREFIJO_ID + String(max + 1).padStart(3, '0');
    }
    if (colFecha && !datos[colFecha]) datos[colFecha] = new Date().toISOString();
    const fila = {};
    enc.forEach(c => fila[c] = datos[c] !== undefined ? datos[c] : '');
    data.filas.push(fila);
    saveData(sistema, data);
    return { ok: true, id: colId ? datos[colId] : null };
  },

  actualizarEquipo(sistema, id, datos) {
    const cfg = CONFIGS[sistema];
    const data = loadData(sistema);
    const enc = data.encabezados;
    const colId = nombreColumnaClave(cfg, enc, 'id');
    if (!colId) throw new Error('No hay columna de ID.');
    const idx = data.filas.findIndex(f => String(f[colId]) === String(id));
    if (idx < 0) throw new Error('No se encontró el registro con ID ' + id);
    enc.forEach(c => { if (datos[c] !== undefined) data.filas[idx][c] = datos[c]; });
    saveData(sistema, data);
    return { ok: true };
  },

  eliminarEquipo(sistema, id) {
    const cfg = CONFIGS[sistema];
    const data = loadData(sistema);
    const enc = data.encabezados;
    const colId = nombreColumnaClave(cfg, enc, 'id');
    if (!colId) throw new Error('No hay columna de ID.');
    const idx = data.filas.findIndex(f => String(f[colId]) === String(id));
    if (idx < 0) throw new Error('No se encontró el registro con ID ' + id);
    data.filas.splice(idx, 1);
    saveData(sistema, data);
    return { ok: true };
  },

  obtenerDatosReportes(sistema) {
    const cfg = CONFIGS[sistema];
    const data = loadData(sistema);
    const enc = data.encabezados;
    const grupos = [];
    Object.keys(cfg.GRUPOS_FILTROS).forEach(nombreGrupo => {
      const camposExistentes = [];
      cfg.GRUPOS_FILTROS[nombreGrupo].forEach(col => {
        if (buscarIndice(enc, col) < 0) return;
        const setVals = {};
        data.filas.forEach(f => {
          const v = String(f[col] || '').trim();
          if (v) setVals[v] = true;
        });
        camposExistentes.push({ columna: col, valores: Object.keys(setVals).sort() });
      });
      if (camposExistentes.length) grupos.push({ nombre: nombreGrupo, campos: camposExistentes });
    });
    return { marca: cfg.MARCA, columnas: enc, filas: data.filas, grupos, urlApp: '' };
  }
};

// ----------- HTTP server -----------
const SHIM = `
<script>
  // Shim that emulates google.script.run by calling our REST API.
  // It automatically prepends the active sistema as the first argument
  // so each system has its own data.
  (function() {
    const params = new URLSearchParams(location.search);
    window.SISTEMA = params.get('sistema') === 'impresoras' ? 'impresoras' : 'equipos';
  })();
  window.google = window.google || {};
  google.script = google.script || {};
  google.script.run = (function() {
    function builder(state) {
      const proxy = {
        withSuccessHandler(fn) { return builder({ ...state, ok: fn }); },
        withFailureHandler(fn) { return builder({ ...state, err: fn }); }
      };
      return new Proxy(proxy, {
        get(target, prop) {
          if (prop in target) return target[prop];
          return function(...args) {
            fetch('/api/' + prop + '?sistema=' + encodeURIComponent(window.SISTEMA), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(args)
            }).then(r => r.json().then(b => ({ ok: r.ok, body: b })))
              .then(({ ok, body }) => {
                if (!ok) (state.err || console.error)({ message: body.error || 'Error' });
                else (state.ok || (()=>{}))(body);
              })
              .catch(e => (state.err || console.error)({ message: e.message }));
          };
        }
      });
    }
    return builder({});
  })();
</script>
`;

function renderHtml(sistema, pestanaInicial) {
  const cfg = CONFIGS[sistema];
  let html = fs.readFileSync(path.join(__dirname, cfg.HTML_FILE), 'utf8');
  html = html.replace(/<\?=\s*pestanaInicial\s*\?>/g, pestanaInicial);
  html = html.replace('</head>', SHIM + '</head>');
  return html;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const page = url.searchParams.get('page') || 'dashboard';
      const sistema = getSistema(url.searchParams.get('sistema'));
      const html = renderHtml(sistema, page);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
      const fn = url.pathname.slice(5);
      if (!api[fn]) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Función no encontrada: ' + fn }));
      }
      const sistema = getSistema(url.searchParams.get('sistema'));
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const args = body ? JSON.parse(body) : [];
          const result = api[fn](sistema, ...args);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    res.writeHead(404); res.end('Not found');
  } catch (e) {
    res.writeHead(500); res.end(e.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Inventario HSJ listening on http://${HOST}:${PORT}`);
});
