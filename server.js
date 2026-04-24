const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';

const SHIM = `
<script>
(function () {
  if (window.google && window.google.script && window.google.script.run) return;

  var BANNER_ID = '__gas_preview_banner__';
  function showBanner() {
    if (document.getElementById(BANNER_ID)) return;
    var div = document.createElement('div');
    div.id = BANNER_ID;
    div.textContent = 'Vista previa: este proyecto es de Google Apps Script. Las funciones del servidor (datos de la hoja) solo funcionan al implementarlo en Apps Script.';
    div.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#fef3c7;color:#78350f;border-top:1px solid #f59e0b;padding:8px 14px;font:13px -apple-system,Segoe UI,Roboto,sans-serif;text-align:center;';
    (document.body || document.documentElement).appendChild(div);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }

  function makeRunner(success, failure) {
    var handler = {
      get: function (_t, prop) {
        if (prop === 'withSuccessHandler') {
          return function (fn) { return makeRunner(fn, failure); };
        }
        if (prop === 'withFailureHandler') {
          return function (fn) { return makeRunner(success, fn); };
        }
        if (prop === 'withUserObject') {
          return function () { return makeRunner(success, failure); };
        }
        return function () {
          var err = new Error('google.script.run no está disponible en la vista previa de Replit. Implementa el proyecto en Google Apps Script para usar las funciones del servidor.');
          if (typeof failure === 'function') {
            try { failure(err); } catch (e) { console.error(e); }
          } else {
            console.warn('[GAS preview]', prop, 'llamada ignorada');
          }
        };
      }
    };
    return new Proxy(function () {}, handler);
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = makeRunner(null, null);
  window.google.script.host = { close: function () {}, setHeight: function () {}, setWidth: function () {}, origin: '' };
  window.google.script.url = { getLocation: function (cb) { cb({ hash: '', parameter: {}, parameters: {} }); } };
})();
</script>
`;

const server = http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/' || urlPath === '/index.html') {
    urlPath = '/AppUI.html';
  }

  const safe = path.normalize(urlPath).replace(/^([/\\])+/, '');
  const filePath = path.join(__dirname, safe);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css':  'text/css; charset=utf-8',
      '.js':   'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg':  'image/svg+xml',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif':  'image/gif',
      '.ico':  'image/x-icon',
      '.txt':  'text/plain; charset=utf-8'
    };
    const type = types[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', type);

    if (ext === '.html') {
      fs.readFile(filePath, 'utf8', (e, data) => {
        if (e) { res.writeHead(500); res.end('Server error'); return; }
        const injected = data.includes('</head>')
          ? data.replace('</head>', SHIM + '</head>')
          : SHIM + data;
        res.writeHead(200);
        res.end(injected);
      });
    } else {
      res.writeHead(200);
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Preview server running at http://${HOST}:${PORT}`);
});
