# Inventario HSJ

Originally a Google Apps Script web app (Sheets-backed inventory). Adapted to run on Replit with a small Node.js server that emulates the GAS backend so the original `AppUI.html` runs unmodified.

## Architecture
- **`AppUI.html`** — original single-page UI (Dashboard, Inventario, Reportes). Uses `google.script.run` for backend calls.
- **`server.js`** — Node.js HTTP server (no deps). Serves `AppUI.html` and exposes the `.gs` functions as REST endpoints under `/api/<funcion>`. Injects a `google.script.run` shim into the HTML head so the frontend works unchanged.
- **`data.json`** — local JSON store that replaces the Google Sheet. Auto-seeded on first run.
- **`.gs` files** — kept as the source of truth for the original GAS deployment.

## Endpoints
`POST /api/obtenerDatosDashboard | listarEquipos | crearEquipo | actualizarEquipo | eliminarEquipo | obtenerDatosReportes` — body is a JSON array of positional arguments.

## Run
- Workflow `Server`: `node server.js` on port 5000 (host `0.0.0.0`).
