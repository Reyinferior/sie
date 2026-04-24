# Inventario HSJ

## Overview
This project is a **single Google Apps Script (GAS) web app** that uses ONE
Google Sheet as its database. The same Apps Script project hosts two web
"sub-apps", switched by the `?sistema=` URL parameter:

- `?sistema=equipos`     → **AppUI** (Dashboard / Inventario / Reportes of equipment)
- `?sistema=impresoras`  → **ImpresorasUI** (Inventario of printers)

Both sub-apps share `Config.gs` (router) and `Utilidades.gs` (generic helpers).
Printer-specific files use the `Impresoras*` prefix and a `CONFIG_IMP` object
to avoid colliding with the equipment side.

## Source files (Google Apps Script)
Equipment sub-app:
- `Config.gs` — global config + ROUTER `doGet` (chooses AppUI vs ImpresorasUI)
- `Dashboard.gs` — KPIs and chart data
- `Inventario.gs` — equipment sheet schema + list/create/update/delete
- `Reportes.gs` — filtered data for the reports view
- `Utilidades.gs` — shared helpers (`normalizar`, `buscarIndice`, etc.)
- `AppUI.html` — single-page UI for equipment

Printer sub-app (same project, flat files, `Impresoras*` prefix):
- `ImpresorasConfig.gs` — `CONFIG_IMP` (sheet, columns, key fields, states)
- `ImpresorasInventario.gs` — printer sheet read + CRUD
  (`listarImpresoras`, `crearImpresora`, `actualizarImpresora`, `eliminarImpresora`)
- `ImpresorasInicializacion.gs` — `inicializarHojaImpresoras()` (one-time setup)
- `ImpresorasUI.html` — single-page UI for printers

In Apps Script the HTML talks to the `.gs` server via `google.script.run`.

## How it runs on Replit
Apps Script can't execute on Replit (no GAS runtime, no Sheets backend). To
make the project visible in the Replit preview pane there is a tiny static
server:

- `server.js` — Node.js HTTP server on `0.0.0.0:5000` that serves `AppUI.html`
  and injects a `google.script.run` shim so the UI loads without errors.
  Calls to server functions show a banner explaining that real data only
  works once deployed to Google Apps Script.

Workflow: `Start application` → `node server.js` (port 5000, webview).

## Deploying the real app
1. Open the target Google Sheet → Extensions → Apps Script.
2. Create files in Apps Script with the SAME names as the `.gs` files and the
   two `*.html` files (Apps Script files are flat, no folders).
3. Run once: `inicializarHoja()` (equipment) and `inicializarHojaImpresoras()`
   (printers) to create the corresponding sheets if they don't exist.
4. Deploy → New deployment → Web app. ONE deployment serves both sub-apps:
   - `<URL>?sistema=equipos`
   - `<URL>?sistema=impresoras`

## Recent changes
- 2026-04: Added a second sub-app **Impresoras** inside the SAME Apps Script
  project. New files: `ImpresorasConfig.gs`, `ImpresorasInventario.gs`,
  `ImpresorasInicializacion.gs`, `ImpresorasUI.html`. Config.gs `doGet` now
  routes by `?sistema=`. Naming chosen to avoid collisions with equipment
  side: `CONFIG_IMP`, `leerHojaImpresoras`, `nombreColumnaClaveImp`,
  `tipoDeEstadoImp`, `generarNuevoIdImp`. Generic helpers (`normalizar`,
  `buscarIndice`) are reused from `Utilidades.gs`.
- 2025: Imported from Replit Agent. Added `server.js` + `package.json` and a
  workflow so the UI is previewable on Replit.
