# Inventario HSJ

Originally a Google Apps Script web app (Sheets-backed inventory). Adapted to run on Replit with a small Node.js server that emulates the GAS backend so the original HTML pages run unmodified. Multiple independent systems are supported (Equipos, Impresoras, …) — each has its own HTML file and its own JSON data store, switched at the top via `?sistema=<nombre>`.

## Architecture
- **`EquiposUI.html`** — single-page UI (Dashboard, Inventario, Reportes) for the **Equipos** system. Uses `google.script.run` for backend calls.
- **`ImpresorasUI.html`** — same UI but for the **Impresoras** system (own title, button labels, columns).
- **`server.js`** — Node.js HTTP server (no deps). Holds a `CONFIGS` map (one entry per system) where each entry has its own `HTML_FILE`, `DATA_FILE`, columns, estados, etc. Serves the matching HTML based on `?sistema=` and exposes the `.gs` functions as REST endpoints under `/api/<funcion>`. Injects a `google.script.run` shim into the HTML head that automatically appends `?sistema=` to all backend calls so the frontend works unchanged.

### Adding a new system (e.g. Mantenimiento, Tickets)
1. Create a new HTML file (e.g. `MantenimientoUI.html`) — easiest: copy one of the existing UIs and tweak titles/labels/buttons.
2. Add an entry to `CONFIGS` in `server.js` with `HTML_FILE`, `DATA_FILE`, `MARCA`, `PREFIJO_ID`, `COLUMNAS_INICIALES`, `ESTADOS`, `GRUPOS_FILTROS` and a `SEED` block.
3. Add the corresponding pill button in the top bar (`.topbar`) of every UI HTML file.
That's it — the same backend automatically serves the new system at `?sistema=mantenimiento`.
- **`data.json`** — local JSON store that replaces the Google Sheet. Auto-seeded on first run.
- **`.gs` files** — kept as the source of truth for the original GAS deployment.

## Endpoints
`POST /api/obtenerDatosDashboard | listarEquipos | crearEquipo | actualizarEquipo | eliminarEquipo | obtenerDatosReportes` — body is a JSON array of positional arguments.

## Run
- Workflow `Server`: `node server.js` on port 5000 (host `0.0.0.0`).
