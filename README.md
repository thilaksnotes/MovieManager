# ScreenLog — Movie & Series Tracker frontend

Static frontend for the MovieManager repository.

## Files

- `index.html` — application layout
- `styles.css` — responsive styling
- `app.js` — dashboard, chart, history filters, form validation and data adapters

## Current status: preview mode

The app is deliberately configured with `API_CONFIG.enabled = false` and an empty API URL. It makes no network requests. Sample entries and sample dashboard data are displayed locally.

The sample dashboard shape mirrors the current Apps Script `calculateDashboardData()` result, and sample history rows use the actual sheet-column names. The monthly chart consumes the same `monthlyTrend` shape as the Apps Script output.

Adding a title remains browser-preview-only. It does not update Google Sheets.

## Local preview

Open `index.html` in a modern browser. No build step or package installation is required.

## GitHub Pages

Publish from the `main` branch and `/ (root)` folder in repository Settings → Pages. Publishing this frontend does not deploy Apps Script.

## Before enabling live read access

1. Review the Apps Script web-app access settings and the risks of exposing read endpoints.
2. Deploy only after explicit approval.
3. Test a browser request from the GitHub Pages origin, including the ContentService redirect and CORS behavior.
4. Configure `API_CONFIG.enabled = true` and set `API_CONFIG.url` to the deployed web-app URL only after those tests.
5. Verify that the endpoint returns `{ "ok": true, "data": ... }` for `dashboard`, `recentHistory`, and `checkDuplicate`.

No secrets or spreadsheet credentials should be added to client-side files.

## No writes yet

The add form only updates in-memory preview data. Do not interpret this as persistence to Google Sheets. A write endpoint requires a separate design, server-side validation and explicit review.
