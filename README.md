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
- Deploy script: `scripts/deploy-ha.sh`

Important: GitHub-hosted runners cannot reach `192.168.1.137` (private LAN IP).  
Use a **self-hosted runner** in your local network.

### 1. Prepare Home Assistant SSH access

Enable SSH access to your HA host (for example through an SSH add-on) and verify this works from your runner machine:

```bash
ssh <user>@192.168.1.137
```

The deploy target path is:

```text
/config/www/ha-wallpanel
```

### 2. Create a self-hosted GitHub runner in LAN

Create a runner attached to this repo on a machine inside your home network and add label:

```text
ha-lan
```

Workflow `runs-on` is:

```text
self-hosted, linux, ha-lan
```

### 3. Add repository secrets

In GitHub repo settings, add:

- `HA_SSH_HOST` (example: `192.168.1.137`)
- `HA_SSH_USER` (SSH user in HA)
- `HA_SSH_PRIVATE_KEY` (private key used by Actions runner)
- Optional: `HA_SSH_PORT` (default `22`)
- Optional: `HA_SSH_KNOWN_HOSTS` (recommended for strict host key pinning)

### 4. Push to `main`

Every push to `main` will:

1. Install dependencies
2. Build with `VITE_BASE_PATH=/local/ha-wallpanel/`
3. Deploy `dist/` to `/config/www/ha-wallpanel`

Your app will then be available at:

```text
http://192.168.1.137:8123/web-app
```

## Auth notes

- Preferred: no `VITE_HA_TOKEN`, use Home Assistant OAuth (`getAuth`).
- If you set `VITE_HA_TOKEN`, it is bundled into frontend assets at build time.
