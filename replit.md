# Inventario HSJ

## Overview
This project is a **Google Apps Script (GAS) web app** that uses a Google Sheet
as its database. It provides three views: Dashboard, Inventario (CRUD over
equipment) and Reportes (filters + Excel/PDF export).

## Source files (Google Apps Script)
- `Config.gs` — global config + web routing (`doGet`, `include`, etc.)
- `Dashboard.gs` — KPIs and chart data
- `Inventario.gs` — sheet schema, list/create/update/delete, sheet init
- `Reportes.gs` — filtered data for the reports view
- `Utilidades.gs` — shared helpers
- `AppUI.html` — single-page UI (Dashboard / Inventario / Reportes tabs)

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
2. Create files with the same names as the `.gs` files and `AppUI.html`.
3. Run `inicializarHoja()` once to create the `Equipos` sheet.
4. Deploy → New deployment → Web app.

## Recent changes
- 2025: Imported from Replit Agent. Added `server.js` + `package.json` and a
  workflow so the UI is previewable on Replit. No `.gs` / `AppUI.html`
  application logic was modified.
