# Copilot Coding Agent Instructions for gestion-tir-arc-fscf

## Project Overview
- **gestion-tir-arc-fscf** is a Progressive Web App (PWA) for managing archery competitions under [FSCF rules](https://www.fscf.asso.fr/sites/fscf/files/uploads/documents/institutionnel/ra_tir_a_larc_valide_13092025.pdf).
- The app is designed for full offline use, with data stored in IndexedDB and a service worker for caching.
- Main features: archer management, shooting range setup, result entry, data export (CSV/JSON), and PWA installability.

## Architecture & Key Components
- **Entry Point:** `js/app.js` initializes the app, database, service worker, routes, and event listeners.
- **Database:** `js/db.js` manages IndexedDB. Key stores: `archers`, `categories`, `shootingRanges`, `results`, and `series`.
- **Routing:** `js/router.js` implements a hash-based SPA router. Pages are in `js/pages/` (e.g., `archers.js`, `results.js`).
- **UI:** Main HTML in `index.html`. Navigation uses hash routes (e.g., `#archers`).
- **Utilities:** `js/utils.js` provides helpers (toasts, loading overlays, date formatting, online status).
- **Service Worker:** `service-worker.js` caches all static assets and enables offline mode. It auto-detects its base path for GitHub Pages compatibility.
- **PWA Manifest & Icons:** `manifest.json` and `icons/` for installability and platform integration.

## Developer Workflows
- **Local Development:**
  - Serve with any static HTTP server (e.g., `python -m http.server 8000` or `npx http-server -p 8000`).
  - Open `http://localhost:8000` in a browser.
- **Deployment:**
  - Pushed to `main` branch triggers GitHub Actions workflow for GitHub Pages deployment.
  - All paths are relative for subdirectory deployment.
- **Testing Offline:**
  - Install the PWA, then disable network to verify offline functionality.

## Project-Specific Conventions
- **Relative Paths:** All asset and script paths are relative (`./`) for GitHub Pages compatibility.
- **SPA Navigation:** Uses hash-based routing (`#archers`, `#results`, etc.).
- **IndexedDB Schema:** See `js/db.js` for object store structure and upgrade logic.
- **Toast Notifications:** Use `showToast()` from `js/utils.js` for user feedback.
- **Page Modules:** Each page (archers, results, etc.) is a module in `js/pages/` and registered in `app.js`.
- **No Frameworks:** Pure JavaScript, no React/Vue/Angular.

## Integration Points
- **Service Worker:** Handles caching, offline, and updates. See `service-worker.js` for asset list and cache versioning.
- **Export:** Data export logic in `js/pages/export.js`.
- **Icons:** Scripts in `icons/` for generating icon sets.

## Key Files & Directories
- `index.html` — Main HTML shell
- `js/app.js` — App bootstrap and main logic
- `js/db.js` — IndexedDB management
- `js/router.js` — SPA routing
- `js/pages/` — Page modules (archers, results, etc.)
- `js/utils.js` — Utility functions
- `service-worker.js` — PWA offline support
- `manifest.json`, `icons/` — PWA metadata and icons

## Notable Patterns
- **All navigation and page rendering is handled client-side.**
- **No backend/server logic; all data is local to the browser.**
- **All static assets must be listed in the service worker for offline use.**
- **Always use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) to keep track of your work.**
- **Always use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for pull request title.**

---

For further details, see `README.md` and `DEPLOYMENT.md`.
