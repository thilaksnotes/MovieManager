# ScreenLog — Movie & Series Tracker frontend

A static, responsive frontend prototype for the MovieManager repository.

## Files

- `index.html` — application layout and sections
- `styles.css` — responsive dark theme
- `app.js` — sample data, dashboard calculations, search/filter, form validation, and duplicate-title warning

## Important: preview mode only

This version is intentionally **not connected to Google Sheets or Google Apps Script**. It makes no network requests and includes no spreadsheet credentials or API URL. The eight sample history entries are illustrative preview data, not a complete copy of the spreadsheet.

Adding a title only changes the in-memory data in the current browser page. Reloading resets it. Nothing is written to the spreadsheet.

## Preview locally

Open `index.html` in a modern browser. No build step or package installation is required.

## Publish with GitHub Pages

After committing these files to the repository, open **Settings → Pages** in GitHub and configure the source to deploy from the `main` branch and `/ (root)` folder. This only publishes the static frontend. It does not deploy or expose the Apps Script API.

## Before connecting Apps Script

The current Apps Script handler supports read-only `dashboard`, `recentHistory`, and `checkDuplicate` actions. Before making any browser requests to it, test the deployed web app's access and cross-origin behavior. Do not put credentials or secrets in client-side code. Add-entry persistence requires a separately reviewed, validated server-side write endpoint; do not assume the preview form writes to the sheet.
