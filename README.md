# HA Dashboard Frontend

React + Vite frontend that connects to Home Assistant through `home-assistant-js-websocket`.

## Local development

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment:

```bash
cp .env.local.example .env.local
```

3. Start dev server:

```bash
pnpm dev
```

## Deploy to Home Assistant Green

This app can be deployed as static files under Home Assistant's `/local/...` path.

1. Set environment variables in `.env.local` (or `.env.production`):

```env
# Optional, defaults to current browser origin.
VITE_HA_URL=http://homeassistant.local:8123

# Optional, if omitted OAuth flow is used.
# VITE_HA_TOKEN=your_long_lived_access_token_here

# Important for HA static hosting
VITE_BASE_PATH=/local/ha-wallpanel/
```

2. Build:

```bash
pnpm build
```

3. Copy `dist/*` to Home Assistant at:

```text
/config/www/ha-wallpanel/
```

4. You can open it directly at:

```text
/local/ha-wallpanel/
```

## Serve it at `/web-app` on Home Assistant

If you want this URL to work:

```text
http://192.168.1.137:8123/web-app
```

add this to your Home Assistant `configuration.yaml`:

```yaml
panel_custom:
  - name: web-app-panel
    sidebar_title: Web App
    sidebar_icon: mdi:view-dashboard
    url_path: web-app
    module_url: /local/ha-wallpanel/web-app-panel.js
    require_admin: false
```

Then restart Home Assistant. The route `/web-app` will load your static app from `/local/ha-wallpanel/`.

## Auto-deploy on every `main` push (GitHub Actions)

This repo now includes:

- Workflow: `.github/workflows/deploy-ha.yml`

This workflow is **GitHub-hosted** (no LAN runner required).  
On every push to `main`, it:

1. Installs dependencies
2. Builds with `VITE_BASE_PATH=/local/ha-wallpanel/`
3. Publishes the built files to branch `ha-deploy`

### 1. Enable sync in Home Assistant (Git pull add-on)

Use Home Assistant's **Git pull** add-on to sync this repo branch into:

```text
/config/www/ha-wallpanel
```

Use Git pull with:

- Repository: `https://github.com/pabloibanezcom/ha-wallpanel.git`
- Branch (`git_branch`): `ha-deploy`
- Command (`git_command`): `pull`
- Polling (`repeat.active`): `true`
- Polling interval (`repeat.interval`): e.g. `300`

Example add-on config:

```yaml
repository: "https://github.com/pabloibanezcom/ha-wallpanel.git"
git_branch: "ha-deploy"
git_remote: "origin"
git_command: "pull"
git_prune: false
auto_restart: false
repeat:
  active: true
  interval: 300
```

Note: Git pull syncs into `/config`. The workflow publishes files under `www/ha-wallpanel/` in `ha-deploy`, so they land at `/config/www/ha-wallpanel/`.

### 2. Push to `main`

After each push, GitHub updates `ha-deploy`.  
When HA Git pull syncs, your app is served from:

```text
http://192.168.1.137:8123/web-app
```

## Auth notes

- Preferred: no `VITE_HA_TOKEN`, use Home Assistant OAuth (`getAuth`).
- If you set `VITE_HA_TOKEN`, it is bundled into frontend assets at build time.
