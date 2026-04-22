import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';
const DATA_FILE = path.join(__dirname, 'data.json');

const CONFIG = {
  HOJA: 'Equipos',
  COLUMNAS_INICIALES: ['ID', 'Nombre', 'Categoria', 'Estado', 'Area', 'Fecha'],
  CAMPOS_CLAVE: { id: 'ID', estado: 'Estado', area: 'Area', fecha: 'Fecha' },
  ESTADOS: [
    { nombre: 'Operativo', tipo: 'ok' },
    { nombre: 'Mantenimiento', tipo: 'warn' },
    { nombre: 'Baja', tipo: 'bad' }
  ],
  MARCA: 'Inventario HSJ',
  TITULO: 'Dashboard',
  PREFIJO_ID: 'EQ-',
  GRUPOS_FILTROS: {
    'Identificación': ['ID', 'Nombre'],
    'Ubicación': ['Area'],
    'Clasificación': ['Categoria', 'Estado'],
    'Fechas': ['Fecha']
  }
};

function diasAtras(fecha, n) {
  const d = new Date(fecha);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seedData() {
  const hoy = new Date();
  return {
    encabezados: CONFIG.COLUMNAS_INICIALES.slice(),
    filas: [
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
    ]
  };
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    const d = seedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
    return d;
  }
}
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

function normalizar(s) {
  return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function buscarIndice(enc, nombre) {
  if (!nombre) return -1;
  const obj = normalizar(nombre);
  for (let i = 0; i < enc.length; i++) if (normalizar(enc[i]) === obj) return i;
  return -1;
}
function nombreColumnaClave(enc, clave) {
  const i = buscarIndice(enc, CONFIG.CAMPOS_CLAVE[clave]);
  return i >= 0 ? enc[i] : null;
}
function tipoDeEstado(nombre) {
  const e = CONFIG.ESTADOS.find(x => x.nombre === nombre);
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

// ----------- API functions (mirror .gs) -----------
const api = {
  obtenerDatosDashboard() {
    const data = loadData();
    const enc = data.encabezados;
    const base = {
      marca: CONFIG.MARCA, titulo: CONFIG.TITULO,
      fecha: formatearFechaLarga(new Date()),
      estados: CONFIG.ESTADOS, total: 0, porEstado: {},
      recientes: [], alertas: [], porArea: [], urlApp: ''
    };
    if (!data.filas.length) return base;
    const colId = nombreColumnaClave(enc, 'id');
    const colEstado = nombreColumnaClave(enc, 'estado');
    const colArea = nombreColumnaClave(enc, 'area');
    const colFecha = nombreColumnaClave(enc, 'fecha');
    const colNombre = enc[buscarIndice(enc, 'Nombre')] || enc[1] || enc[0];

    const conteoEstado = {};
    CONFIG.ESTADOS.forEach(e => conteoEstado[e.nombre] = 0);
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
          tipo: tipoDeEstado(r[colEstado])
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

  listarEquipos() {
    const data = loadData();
    const enc = data.encabezados;
    const colId = nombreColumnaClave(enc, 'id');
    const colEstado = nombreColumnaClave(enc, 'estado');
    const grupos = [];
    Object.keys(CONFIG.GRUPOS_FILTROS).forEach(nombreGrupo => {
      const cols = CONFIG.GRUPOS_FILTROS[nombreGrupo].filter(c => buscarIndice(enc, c) >= 0);
      if (cols.length) grupos.push({ nombre: nombreGrupo, columnas: cols });
    });
    return {
      marca: CONFIG.MARCA, estados: CONFIG.ESTADOS,
      columnas: enc, grupos,
      filas: data.filas.map(f => ({
        ...f,
        __id: colId ? f[colId] : '',
        __tipoEstado: tipoDeEstado(colEstado ? f[colEstado] : '')
      })),
      campos: {
        id: colId, estado: colEstado,
        area: nombreColumnaClave(enc, 'area'),
        fecha: nombreColumnaClave(enc, 'fecha')
      },
      urlApp: ''
    };
  },

  crearEquipo(datos) {
    const data = loadData();
    const enc = data.encabezados;
    const colId = nombreColumnaClave(enc, 'id');
    const colFecha = nombreColumnaClave(enc, 'fecha');
    if (colId && !datos[colId]) {
      let max = 0;
      data.filas.forEach(f => {
        const m = String(f[colId] || '').match(/(\d+)$/);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      datos[colId] = CONFIG.PREFIJO_ID + String(max + 1).padStart(3, '0');
    }
    if (colFecha && !datos[colFecha]) datos[colFecha] = new Date().toISOString();
    const fila = {};
    enc.forEach(c => fila[c] = datos[c] !== undefined ? datos[c] : '');
    data.filas.push(fila);
    saveData(data);
    return { ok: true, id: colId ? datos[colId] : null };
  },

  actualizarEquipo(id, datos) {
    const data = loadData();
    const enc = data.encabezados;
    const colId = nombreColumnaClave(enc, 'id');
    if (!colId) throw new Error('No hay columna de ID.');
    const idx = data.filas.findIndex(f => String(f[colId]) === String(id));
    if (idx < 0) throw new Error('No se encontró el equipo con ID ' + id);
    enc.forEach(c => { if (datos[c] !== undefined) data.filas[idx][c] = datos[c]; });
    saveData(data);
    return { ok: true };
  },

  eliminarEquipo(id) {
    const data = loadData();
    const enc = data.encabezados;
    const colId = nombreColumnaClave(enc, 'id');
    if (!colId) throw new Error('No hay columna de ID.');
    const idx = data.filas.findIndex(f => String(f[colId]) === String(id));
    if (idx < 0) throw new Error('No se encontró el equipo con ID ' + id);
    data.filas.splice(idx, 1);
    saveData(data);
    return { ok: true };
  },

  obtenerDatosReportes() {
    const data = loadData();
    const enc = data.encabezados;
    const grupos = [];
    Object.keys(CONFIG.GRUPOS_FILTROS).forEach(nombreGrupo => {
      const camposExistentes = [];
      CONFIG.GRUPOS_FILTROS[nombreGrupo].forEach(col => {
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
    return { marca: CONFIG.MARCA, columnas: enc, filas: data.filas, grupos, urlApp: '' };
  }
};

// ----------- HTTP server -----------
const SHIM = `
<script>
  // Shim that emulates google.script.run by calling our REST API.
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
            fetch('/api/' + prop, {
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

function renderHtml(pestanaInicial) {
  let html = fs.readFileSync(path.join(__dirname, 'AppUI.html'), 'utf8');
  html = html.replace(/<\?=\s*pestanaInicial\s*\?>/g, pestanaInicial);
  html = html.replace('</head>', SHIM + '</head>');
  return html;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const page = url.searchParams.get('page') || 'dashboard';
      const html = renderHtml(page);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
      const fn = url.pathname.slice(5);
      if (!api[fn]) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Función no encontrada: ' + fn }));
      }
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const args = body ? JSON.parse(body) : [];
          const result = api[fn](...args);
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
