# GitHub Pages Deployment Setup

## What was changed

This PR updates the PWA to work correctly on GitHub Pages by:

1. **Converting absolute paths to relative paths**: All paths in `index.html`, `manifest.json`, `service-worker.js`, and `app.js` now use relative paths (`./`) instead of absolute paths (`/`). This ensures the app works correctly when deployed to a GitHub Pages subdirectory.

2. **Dynamic base path in Service Worker**: The service worker now automatically detects its base path, making it work both locally and on GitHub Pages without configuration changes.

3. **GitHub Actions workflow**: Added `.github/workflows/deploy.yml` that automatically deploys the `main` branch to GitHub Pages on every push.

4. **Jekyll bypass**: Added `.nojekyll` file to prevent GitHub Pages from processing files through Jekyll.

## How to complete the deployment

After merging this PR to the `main` branch, you need to configure GitHub Pages in the repository settings:

### Step-by-step:

1. Go to your repository on GitHub: `https://github.com/jry25/gestion-tir-arc-fscf`

2. Click on **Settings** (in the top menu)

3. In the left sidebar, click on **Pages**

4. Under **Source**, select **GitHub Actions** (instead of "Deploy from a branch")

5. Save the changes

6. The GitHub Actions workflow will automatically run on the next push to `main`

7. After the workflow completes (check the **Actions** tab), your PWA will be available at:
   ```
   https://jry25.github.io/gestion-tir-arc-fscf/
   ```

## Verification

Once deployed, you can verify the PWA works correctly by:

1. Opening the URL in a browser
2. Checking that all resources load correctly (no 404 errors in console)
3. Verifying the PWA can be installed (look for install icon in address bar)
4. Testing offline functionality by:
   - Installing the PWA
   - Turning off network
   - Reopening the app - it should still work

## Local Development

The changes are fully backward compatible. You can still develop locally using:

```bash
python -m http.server 8000
# or
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## Technical Details

### Relative Paths
- **Before**: `/manifest.json`, `/icons/icon-192x192.png`
- **After**: `./manifest.json`, `./icons/icon-192x192.png`

### Service Worker Base Path
The service worker now calculates its base path dynamically:
```javascript
const BASE_PATH = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);
```

This means:
- On `localhost:8000/`: BASE_PATH = `/`
- On `jry25.github.io/gestion-tir-arc-fscf/`: BASE_PATH = `/gestion-tir-arc-fscf/`

### GitHub Actions Workflow
The workflow:
1. Checks out the code
2. Configures GitHub Pages
3. Uploads the entire repository as an artifact
4. Deploys to GitHub Pages

No build step is needed since this is a vanilla JavaScript PWA.

## Notes

- The PWA will work exactly the same locally and on GitHub Pages
- All functionality is preserved (offline mode, installation, caching)
- The app uses only static files, no server-side processing required
- Data is stored locally in IndexedDB, nothing is sent to any server
