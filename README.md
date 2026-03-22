# Scraps

Track household leftovers before they become waste. A mobile-first PWA built with React, PocketBase, and Podman.

## Prerequisites

- [Node.js 22+](https://nodejs.org/) (for local dev)
- [Podman](https://podman.io/) and [podman-compose](https://github.com/containers/podman-compose) (for containerised deployment)
- A [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) token (optional, for public access)

## Local Development

```bash
# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

The dev server runs at `http://localhost:5173`. It expects a PocketBase instance at `http://localhost:8090` — start one separately or point to your containerised instance.

## Container Deployment

### 1. Copy and fill the environment file

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Purpose |
|----------|---------|
| `PB_ADMIN_EMAIL` | PocketBase superuser email (used by the notifier sidecar) |
| `PB_ADMIN_PASSWORD` | PocketBase superuser password |
| `VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `VAPID_SUBJECT` | `mailto:` address for push notifications |
| `VITE_GEMINI_KEY` | Gemini API key for AI-assisted pantry and recipe features |
| `VITE_SPOONACULAR_KEY` | Spoonacular API key reserved for future recipe discovery |
| `VITE_POCKETBASE_URL` | Override the PocketBase URL (defaults to same origin in production) |
| `TUNNEL_TOKEN` | Cloudflare Tunnel token (only if using the tunnel profile) |

### 2. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

Copy the public and private keys into `.env`.

### 3. Start the stack

```bash
# Local development (3 containers, port 8080)
podman-compose up --build -d

# With Cloudflare Tunnel (4 containers)
podman-compose --profile tunnel up --build -d
```

The app is served at `http://localhost:8080`. PocketBase admin panel is at `http://localhost:8080/_/`.

### 4. First-time PocketBase setup

Open `http://localhost:8080/_/` and create the initial admin account. This email and password must match `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` in your `.env` file.

Then create a user account through the PocketBase admin panel:
1. Go to Collections → users → New record
2. Set email, password, and select a household

### 5. Systemd persistence (optional)

Generate and enable a systemd unit so the pod starts on boot:

```bash
podman generate systemd --new --name scraps-db > ~/.config/systemd/user/scraps-db.service
podman generate systemd --new --name scraps-ui > ~/.config/systemd/user/scraps-ui.service
podman generate systemd --new --name scraps-notifier > ~/.config/systemd/user/scraps-notifier.service

systemctl --user daemon-reload
systemctl --user enable scraps-db scraps-ui scraps-notifier
loginctl enable-linger $USER
```

## Architecture

```
┌───────────────────────────────────────────┐
│  Podman Compose                           │
│                                           │
│  scraps-ui (Nginx:80)  → scraps-db (:8090)│
│  scraps-notifier (Node.js cron)           │
│  scraps-tunnel (cloudflared, optional)    │
└───────────────────────────────────────────┘
```

- **scraps-ui** — Nginx serves the SPA and reverse-proxies `/api/*` to PocketBase
- **scraps-db** — PocketBase handles auth, data, file storage, and real-time SSE
- **scraps-notifier** — Node.js sidecar runs every 2 hours, sends push notifications for items expiring within 24h
- **scraps-tunnel** — Cloudflare Tunnel exposes port 80 publicly (only starts with `--profile tunnel`)

## Project Structure

```
src/
├── app/             App shell, routing, providers
├── modules/
│   ├── auth/        Login flow
│   ├── dashboard/   Leftover cards, expiry logic, swipe actions
│   ├── add-item/    Multi-step add form with camera and AI scan
│   ├── pantry/      Pantry inventory, barcode scanner, recipes
│   ├── shopping-list/ Shopping list with recipe ingredient generation
│   ├── settings/    History log, theme, language, notifications, account
│   ├── stats/       Consumed vs wasted ratio and trend data
│   └── ai/          Gemini-powered item identification and recipe generation
└── shared/
    ├── api/         PocketBase client with injection-safe filter helpers
    ├── hooks/       Push notifications, online status, household context
    ├── i18n/        Internationalisation setup (11 languages)
    └── ui/          Button, Modal, Fab, Select, banners, toasts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, React Router, TanStack Query |
| Backend | PocketBase (SQLite, auth, file storage, real-time SSE) |
| Push | Web Push API with VAPID, Node.js sidecar |
| Infra | Podman, Nginx, Cloudflare Tunnels |
| PWA | Service worker, Web App Manifest |
