# Scraps — Implementation Plan (V1)

> Based on the PRD and refinement decisions made during planning.

---

## 0. Consolidated Decisions

| # | Topic | Decision |
|---|-------|----------|
| 1 | Photo field | Add `photo (File, optional, 2 MB)` to `leftovers` |
| 2 | Household onboarding | Admin pre-creates via PocketBase UI — no in-app flow |
| 3 | Quantity field | Excluded from V1 |
| 4 | Notes field | `notes (Text, optional, max 60 chars)` on `leftovers` |
| 5 | Notifications | In-app banner + Web Push (VAPID, 2h check cycle, per-item alerts) |
| 6 | Stats view | Included in V1 (consumed vs. wasted ratio) |
| 7 | Offline | Online-only; clean "No Connection" error state |
| 8 | Sorting/Filtering | Expiry ascending only — no filters, no search |
| 9 | Dark mode | Auto via `prefers-color-scheme` — no manual toggle |
| 10 | Categories | `meat, poultry, seafood, veg, dairy, grains, prepared, other` (8 total) |
| 11 | i18n | `react-i18next` from day one; English default; namespace JSON files |

---

## 1. Technical Stack (Final)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend framework | React 18 + TypeScript | Vite 5 bundler |
| Styling | Tailwind CSS 3 | Auto dark mode via media query strategy |
| Icons | Lucide React | Category-specific icon mapping |
| Server state | @tanstack/react-query v5 | Caching, optimistic updates, loading/error states |
| Gestures | @use-gesture/react | Swipe-to-act on item cards |
| i18n | react-i18next + i18next | JSON namespaces, lazy loading ready |
| Routing | react-router v7 | 3 routes: login, dashboard, stats |
| Backend / DB | PocketBase (latest) | SQLite, REST API, real-time subscriptions |
| Push notifications | web-push (Node.js sidecar) | VAPID keys, 2h check cycle |
| Container runtime | Podman + podman-compose | 4-container pod |
| Web server | Nginx (Alpine) | Static asset delivery |
| Tunnel | cloudflared | Cloudflare Zero Trust ingress |

### Dependency Summary (npm)
```
# Core
react react-dom react-router
vite @vitejs/plugin-react typescript

# Styling & UI
tailwindcss @tailwindcss/vite lucide-react

# Data & State
pocketbase @tanstack/react-query

# Interaction
@use-gesture/react

# i18n
i18next react-i18next

# Dev
@types/react @types/react-dom
```

**Notifier sidecar (separate `package.json`):**
```
web-push node-cron pocketbase
```

No charting library — stats view uses pure CSS bars/visuals to keep the bundle lean.

---

## 2. Project Structure (Feature-First)

```
scraps/
├── PRD.md
├── IMPLEMENTATION_PLAN.md
├── podman-compose.yml
├── Dockerfile                        # Multi-stage: build React → serve via Nginx
├── nginx.conf
├── notifier/                         # Push notification sidecar service
│   ├── Dockerfile                    # Alpine Node.js image
│   ├── package.json
│   └── index.js                      # Cron check + web-push send
│
├── pb_migrations/                    # PocketBase JS migration files
│   └── 001_initial_schema.js
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker (push handler + install prompt)
│   ├── icons/                        # PWA icons (192, 512)
│   └── locales/
│       └── en/
│           └── translation.json      # English strings
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
└── src/
    ├── main.tsx                      # Entry: mounts <App />
    ├── index.css                     # Tailwind directives + global resets
    │
    ├── app/                          # App shell: routing, providers, layout
    │   ├── App.tsx                   # Top-level provider composition
    │   ├── Router.tsx                # Route definitions
    │   ├── Layout.tsx                # App shell (header, nav, outlet)
    │   └── providers/
    │       ├── AuthProvider.tsx       # Auth context + PocketBase auth state
    │       └── QueryProvider.tsx      # TanStack Query client setup
    │
    ├── modules/
    │   ├── auth/                     # Login feature
    │   │   ├── LoginPage.tsx
    │   │   ├── auth-api.ts           # PocketBase auth calls
    │   │   └── use-auth.ts           # Auth hook (login, logout, current user)
    │   │
    │   ├── dashboard/                # Main dashboard feature
    │   │   ├── DashboardPage.tsx      # Page: banner + leftover list
    │   │   ├── ExpiryBanner.tsx       # "X items expiring today" alert
    │   │   ├── LeftoverList.tsx       # Sorted list container
    │   │   ├── LeftoverCard.tsx       # Single item card (color, swipe, actions)
    │   │   ├── SwipeActions.tsx       # Swipe gesture wrapper
    │   │   ├── leftover-api.ts        # CRUD + real-time subscription
    │   │   ├── use-leftovers.ts       # Query hooks (list, mutate status)
    │   │   └── expiry-utils.ts        # Tr calc, color mapping, category shelf-life
    │   │
    │   ├── add-item/                 # Add leftover feature
    │   │   ├── AddItemModal.tsx        # Full-screen modal form
    │   │   ├── CategoryPicker.tsx      # Category grid with icons
    │   │   ├── CameraCapture.tsx       # Camera → canvas → webp pipeline
    │   │   ├── image-utils.ts          # Resize + compress logic
    │   │   └── use-add-item.ts         # Mutation hook
    │   │
    │   └── stats/                    # Stats feature
    │       ├── StatsPage.tsx           # Page: period selector + charts
    │       ├── WasteRatioBar.tsx       # CSS-based consumed/wasted ratio bar
    │       ├── PeriodSummary.tsx       # Numeric summary (items saved, wasted, total)
    │       ├── stats-api.ts            # Query logic for aggregated stats
    │       └── use-stats.ts            # Stats query hooks
    │
    └── shared/                       # Cross-cutting, non-feature code
        ├── api/
        │   └── pocketbase.ts          # PocketBase client singleton
        ├── i18n/
        │   └── i18n.ts               # i18next init + config
        ├── hooks/
        │   ├── use-online-status.ts   # Navigator.onLine + event listeners
        │   └── use-push.ts            # Push subscription management hook
        └── ui/
            ├── Button.tsx             # Shared button component
            ├── Fab.tsx                # Floating action button
            ├── Modal.tsx              # Full-screen modal shell
            ├── NotificationPrompt.tsx  # One-time "Enable notifications" bottom sheet
            └── OfflineBanner.tsx       # "No Connection" overlay
```

### Structure Rules
- **Feature-first**: All logic for a feature lives in its `modules/[feature]/` directory.
- **300-line limit**: Any file exceeding 300 lines gets decomposed.
- **Shared code**: Only truly cross-cutting concerns (PocketBase client, i18n config, generic UI primitives) live in `shared/`.
- **No barrel exports**: Direct imports to avoid circular dependencies.

---

## 3. Database Schema (Final)

### Collection: `households`
| Field | Type | Constraints |
|-------|------|-------------|
| id | Auto | PB standard |
| name | Text | Required |

API Rules: Admin-only (all CRUD). No user-facing household management.

### Collection: `users` (PocketBase system collection — extended)
| Field | Type | Constraints |
|-------|------|-------------|
| household_id | Relation → households | Required, single |
| avatar | File | Optional, max 2 MB |
| (email, password) | System | PocketBase managed |

### Collection: `leftovers`
| Field | Type | Constraints |
|-------|------|-------------|
| household_id | Relation → households | Required, single |
| added_by | Relation → users | Required, single |
| item_name | Text | Required |
| category | Select | `meat, poultry, seafood, veg, dairy, grains, prepared, other` |
| expiry_date | Date | Required |
| status | Select | `active, consumed, wasted` (default: `active`) |
| photo | File | Optional, max 2 MB, mime: `image/*` |
| notes | Text | Optional, max 60 chars |
| notified_at | Date | Nullable. Set when expiry push notification sent |

### Collection: `push_subscriptions`
| Field | Type | Constraints |
|-------|------|-------------|
| user_id | Relation → users | Required, single |
| household_id | Relation → households | Required, single |
| endpoint | Text | Required (browser push endpoint URL) |
| p256dh | Text | Required (client public key) |
| auth_key | Text | Required (client auth secret) |

API Rules (push_subscriptions):
| Rule | Expression |
|------|------------|
| List / View | `@request.auth.id = user_id` |
| Create | `@request.auth.id = @request.data.user_id` |
| Delete | `@request.auth.id = user_id` |

### API Rules (leftovers)
| Rule | Expression |
|------|-----------|
| List / View | `@request.auth.household_id = household_id` |
| Create | `@request.auth.household_id = @request.data.household_id` |
| Update / Delete | `@request.auth.household_id = household_id` |

---

## 4. Category → Shelf-Life → Icon Map

| Category | Shelf Life (days) | Lucide Icon |
|----------|-------------------|-------------|
| seafood | 2 | `Fish` |
| meat | 3 | `Beef` |
| poultry | 3 | `Drumstick` |
| dairy | 4 | `MilkOff` |
| prepared | 4 | `CookingPot` |
| grains | 5 | `Wheat` |
| veg | 5 | `Carrot` |
| other | 5 | `Package` |

---

## 5. Expiry Color Logic

```
Tr = expiry_date - now()

if Tr > 48h  → GREEN  (bg-emerald-100 / dark:bg-emerald-900)
if 0 < Tr ≤ 48h → YELLOW (bg-amber-100  / dark:bg-amber-900)
if Tr ≤ 0    → RED    (bg-red-100    / dark:bg-red-900)
```

Text shows:
- `> 24h` → "X days left"
- `≤ 24h and > 0` → "X hours left"
- `≤ 0` → "Expired X hours/days ago"

---

## 6. Implementation Phases

### Phase 1 — Scaffolding & Infrastructure
**Goal:** Bootable dev environment with all tooling configured.

| Step | Task | Output |
|------|------|--------|
| 1.1 | `npm create vite@latest` with React + TypeScript template | Vite project |
| 1.2 | Install all dependencies (see §1 Dependency Summary) | `package.json` |
| 1.3 | Configure Tailwind CSS with `darkMode: 'media'` | `tailwind.config.ts`, `index.css` |
| 1.4 | Configure TypeScript (`strict: true`, path aliases `@/`) | `tsconfig.json`, `vite.config.ts` |
| 1.5 | Set up `react-i18next` with English namespace JSON | `shared/i18n/i18n.ts`, `public/locales/en/translation.json` |
| 1.6 | Create PocketBase client singleton | `shared/api/pocketbase.ts` |
| 1.7 | Create PocketBase migration file (`pb_migrations/001_initial_schema.js`) | Schema auto-created on PB start |
| 1.8 | Create `podman-compose.yml` (3 containers), `Dockerfile`, `nginx.conf` | Infra files |
| 1.9 | Create PWA manifest + minimal service worker | `public/manifest.json`, `public/sw.js` |

### Phase 2 — App Shell & Auth
**Goal:** User can log in and see a protected app shell.

| Step | Task | Output |
|------|------|--------|
| 2.1 | Create `AuthProvider` — wraps PB auth state, exposes context | `app/providers/AuthProvider.tsx` |
| 2.2 | Create `QueryProvider` — TanStack Query client | `app/providers/QueryProvider.tsx` |
| 2.3 | Create `Router` — 3 routes: `/login`, `/`, `/stats` | `app/Router.tsx` |
| 2.4 | Create `Layout` — app header (app name, user avatar, logout) + `<Outlet>` | `app/Layout.tsx` |
| 2.5 | Create `App` — compose providers + router | `app/App.tsx` |
| 2.6 | Create `LoginPage` — email + password form, calls PB auth | `modules/auth/LoginPage.tsx` |
| 2.7 | Create `auth-api.ts` and `use-auth.ts` | PB SDK auth wrappers |
| 2.8 | Protected route guard — redirect unauthenticated to `/login` | Inside `Router.tsx` |

### Phase 3 — Dashboard (Core Feature)
**Goal:** User sees their household's active leftovers, color-coded, with quick actions.

| Step | Task | Output |
|------|------|--------|
| 3.1 | Create `expiry-utils.ts` — shelf-life map, Tr calculation, color resolver | Pure functions, fully testable |
| 3.2 | Create `leftover-api.ts` — list (filtered by `status=active`, sorted by `expiry_date`), update status | PB SDK calls |
| 3.3 | Create `use-leftovers.ts` — `useQuery` for list, `useMutation` for status changes, real-time subscription invalidation | TanStack Query hooks |
| 3.4 | Create `LeftoverCard` — photo thumb, name, category icon, Tr display, color bg | Stateless component |
| 3.5 | Create `SwipeActions` — `@use-gesture/react` swipe handler wrapping each card, reveals "Ate it" / "Tossed" buttons | Gesture component |
| 3.6 | Create `LeftoverList` — maps data → `LeftoverCard` wrapped in `SwipeActions` | List container |
| 3.7 | Create `ExpiryBanner` — counts items where `Tr ≤ 24h`, shows alert | Banner component |
| 3.8 | Create `DashboardPage` — composes `ExpiryBanner` + `LeftoverList` | Page component |
| 3.9 | Wire real-time: subscribe to `leftovers` collection changes → invalidate query cache | In `use-leftovers.ts` |

### Phase 4 — Add Item Flow
**Goal:** User can add a new leftover via a streamlined modal.

| Step | Task | Output |
|------|------|--------|
| 4.1 | Create shared `Modal` component — full-screen, slide-up, trap focus | `shared/ui/Modal.tsx` |
| 4.2 | Create shared `Fab` component — bottom-right floating "+" button | `shared/ui/Fab.tsx` |
| 4.3 | Create `CategoryPicker` — 2×4 grid of icon+label buttons, auto-sets expiry | Controlled component |
| 4.4 | Create `image-utils.ts` — `resizeAndCompress(file): Promise<Blob>` (canvas resize to 800px max dim, webp 0.8) | Pure utility |
| 4.5 | Create `CameraCapture` — `getUserMedia` live preview, capture button, returns compressed blob; falls back to file input on desktop | Camera component |
| 4.6 | Create `AddItemModal` — step flow: Name → Category → Photo (optional) → Notes (optional) → Save | Form modal |
| 4.7 | Create `use-add-item.ts` — `useMutation` that constructs `FormData` and calls PB create | Mutation hook |
| 4.8 | Wire FAB on `DashboardPage` to open `AddItemModal` | Integration |

### Phase 5 — Stats View
**Goal:** User sees consumed vs. wasted ratio for their household.

| Step | Task | Output |
|------|------|--------|
| 5.1 | Create `stats-api.ts` — fetch all non-active leftovers, aggregate by status and time period | PB query + client-side aggregation |
| 5.2 | Create `use-stats.ts` — `useQuery` with period parameter (7d, 30d, all) | Query hook |
| 5.3 | Create `WasteRatioBar` — horizontal CSS bar (green portion = consumed %, red = wasted %) | Pure CSS component |
| 5.4 | Create `PeriodSummary` — large numbers: total items, eaten count, wasted count, waste % | Summary cards |
| 5.5 | Create `StatsPage` — period toggle + `WasteRatioBar` + `PeriodSummary` | Page component |

### Phase 6 — Push Notifications
**Goal:** Users receive native push alerts when items are about to expire.

| Step | Task | Output |
|------|------|--------|
| 6.1 | Generate VAPID key pair (`web-push generate-vapid-keys`) | Keys stored in `.env` / compose env |
| 6.2 | Expand `public/sw.js` — add `push` event listener → `showNotification()` | Service worker push handler |
| 6.3 | Create `shared/hooks/use-push.ts` — subscribe/unsubscribe, save to PB `push_subscriptions` | Push management hook |
| 6.4 | Create `shared/ui/NotificationPrompt.tsx` — bottom sheet shown after first login if push available | One-time prompt component |
| 6.5 | Add notification toggle to app header / user menu (persistent setting) | Header integration |
| 6.6 | iOS gate: only show push prompt when `navigator.standalone === true`; otherwise show "Add to Home Screen" hint | Platform-aware UX |
| 6.7 | Create `notifier/index.js` — Node.js sidecar: `node-cron` every 2h → query PB for items where `Tr < 24h` AND `notified_at` is null → send push → update `notified_at` | Sidecar service |
| 6.8 | Create `notifier/Dockerfile` — Alpine Node.js, copies sidecar code | Container image |
| 6.9 | Add `scraps-notifier` container to `podman-compose.yml` (env: VAPID keys, PB URL) | Compose integration |

### Phase 7 — Polish & PWA
**Goal:** Production-quality UX touches.

| Step | Task | Output |
|------|------|--------|
| 7.1 | Create `use-online-status.ts` hook + `OfflineBanner` component | "No Connection" overlay |
| 7.2 | Add loading skeletons to `DashboardPage` and `StatsPage` | Tailwind animate-pulse placeholders |
| 7.3 | Add empty state to dashboard ("No leftovers! Your fridge is clear.") | Illustration + text |
| 7.4 | Verify WCAG AAA contrast for all color states (green/yellow/red × light/dark) | Manual audit |
| 7.5 | Verify 44×44px minimum touch targets on all interactive elements | Manual audit |
| 7.6 | Test PWA installability (manifest + service worker + HTTPS) | Lighthouse PWA audit |
| 7.7 | Add `<meta name="theme-color">` that matches app shell | `index.html` |

### Phase 8 — Deployment & Infrastructure
**Goal:** Single-command deployment on Linux host.

| Step | Task | Output |
|------|------|--------|
| 8.1 | Finalize `Dockerfile` (multi-stage: Node build → Nginx Alpine serve) | `Dockerfile` |
| 8.2 | Finalize `nginx.conf` (SPA fallback, gzip, cache headers, proxy `/api` → PB) | `nginx.conf` |
| 8.3 | Finalize `podman-compose.yml` (4 containers, volumes for PB data, env vars for VAPID + tunnel token) | `podman-compose.yml` |
| 8.4 | Document `cloudflared` tunnel setup (two hostnames: app + `api.` subdomain, or single with path routing) | README section |
| 8.5 | Generate systemd unit: `podman generate systemd --new --name scraps-pod` | Documented in README |
| 8.6 | Write `README.md` with full deployment instructions | `README.md` |

---

## 7. i18n Strategy

**Library:** `react-i18next` with `i18next`

**Namespace structure:**
```
public/locales/
├── en/
│   └── translation.json
└── [future-lang]/
    └── translation.json
```

**Key conventions:**
```json
{
  "common": {
    "appName": "Scraps",
    "save": "Save",
    "cancel": "Cancel",
    "logout": "Log out"
  },
  "auth": {
    "emailLabel": "Email",
    "passwordLabel": "Password",
    "loginButton": "Log in"
  },
  "dashboard": {
    "expiryBanner": "{{count}} item expiring today",
    "expiryBanner_plural": "{{count}} items expiring today",
    "daysLeft": "{{count}} day left",
    "daysLeft_plural": "{{count}} days left",
    "hoursLeft": "{{count}}h left",
    "expired": "Expired",
    "markConsumed": "Ate it",
    "markWasted": "Tossed",
    "emptyState": "No leftovers! Your fridge is clear."
  },
  "addItem": {
    "title": "Add Leftover",
    "nameLabel": "What is it?",
    "namePlaceholder": "e.g. Chicken curry",
    "categoryLabel": "Category",
    "photoLabel": "Take Photo",
    "notesLabel": "Notes",
    "notesPlaceholder": "e.g. Blue container, top shelf"
  },
  "stats": {
    "title": "Stats",
    "consumed": "Eaten",
    "wasted": "Wasted",
    "total": "Total items",
    "wasteRate": "Waste rate",
    "period7d": "7 days",
    "period30d": "30 days",
    "periodAll": "All time"
  },
  "categories": {
    "meat": "Meat",
    "poultry": "Poultry",
    "seafood": "Seafood",
    "veg": "Vegetables",
    "dairy": "Dairy",
    "grains": "Grains",
    "prepared": "Prepared",
    "other": "Other"
  },
  "notifications": {
    "promptTitle": "Stay ahead of spoilage",
    "promptBody": "Get notified before your food expires",
    "enable": "Enable Notifications",
    "notNow": "Not Now",
    "iosHint": "Add Scraps to your Home Screen to enable notifications",
    "enabled": "Notifications enabled",
    "disabled": "Notifications disabled",
    "pushTitle": "⚠️ {{itemName}} expires tomorrow!",
    "pushBody": "Use it or lose it."
  },
  "errors": {
    "offline": "No internet connection",
    "generic": "Something went wrong"
  }
}
```

**Rules:**
- Every user-visible string goes through `t()` — no hardcoded text in components.
- Use `{{count}}` with pluralization for dynamic numbers.
- Flat top-level keys matching feature module names.

---

## 8. Dark Mode Strategy

**Approach:** Tailwind `darkMode: 'media'` — zero JS, respects OS setting automatically.

**Color palette plan:**
| Element | Light | Dark |
|---------|-------|------|
| Background | `bg-gray-50` | `dark:bg-gray-950` |
| Surface (cards) | `bg-white` | `dark:bg-gray-900` |
| Text primary | `text-gray-900` | `dark:text-gray-50` |
| Text secondary | `text-gray-500` | `dark:text-gray-400` |
| Fresh (green) | `bg-emerald-100 text-emerald-800` | `dark:bg-emerald-900 dark:text-emerald-100` |
| Warning (yellow) | `bg-amber-100 text-amber-800` | `dark:bg-amber-900 dark:text-amber-100` |
| Expired (red) | `bg-red-100 text-red-800` | `dark:bg-red-900 dark:text-red-100` |

---

## 9. Image Capture Pipeline

```
User taps "Take Photo"
    │
    ▼
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    │
    ▼
Live <video> preview in modal
    │
    ▼
User taps capture → drawImage to <canvas>
    │
    ▼
Resize: max(width, height) > 800 ? scale proportionally : no-op
    │
    ▼
canvas.toBlob(blob, 'image/webp', 0.8)
    │
    ▼
Show preview thumbnail + "Retake" option
    │
    ▼
On form submit → append blob to FormData → PocketBase upload
```

**Fallback:** If `getUserMedia` is unavailable (desktop browser, denied permission), show a standard `<input type="file" accept="image/*" capture="environment">` which still triggers the phone camera on mobile.

---

## 10. Real-Time Sync Strategy

PocketBase supports real-time via SSE (Server-Sent Events).

```
On dashboard mount:
  pb.collection('leftovers').subscribe('*', (event) => {
    queryClient.invalidateQueries({ queryKey: ['leftovers'] })
  })

On dashboard unmount:
  pb.collection('leftovers').unsubscribe('*')
```

This ensures that when household member A adds/updates an item, household member B sees it immediately without refresh.

---

## 11. Optimistic Updates

For "Mark Consumed" and "Mark Tossed" actions:

```typescript
useMutation({
  mutationFn: (id, status) => updateLeftoverStatus(id, status),
  onMutate: async ({ id, status }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['leftovers'] })
    // Snapshot previous value
    const previous = queryClient.getQueryData(['leftovers'])
    // Optimistically remove the item from the active list
    queryClient.setQueryData(['leftovers'], (old) =>
      old.filter(item => item.id !== id)
    )
    return { previous }
  },
  onError: (err, vars, context) => {
    // Rollback on error
    queryClient.setQueryData(['leftovers'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['leftovers'] })
  }
})
```

This gives instant feedback — the card disappears immediately, and the server confirms in the background.

---

## 12. Push Notification Architecture

### Overview
Web Push (VAPID) notifications alert users when leftovers are about to expire. Works on Android (Chrome/Firefox/Edge) and iOS 16.4+ (Safari, **only when installed to Home Screen**).

### Flow: Subscribing

```
User taps "Enable Notifications"
    │
    ▼
Notification.requestPermission()  →  "granted"?
    │
    ▼
navigator.serviceWorker.ready
    │
    ▼
registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
})
    │
    ▼
Returns PushSubscription { endpoint, keys: { p256dh, auth } }
    │
    ▼
POST to PocketBase: pb.collection('push_subscriptions').create({
  user_id, household_id, endpoint, p256dh, auth_key
})
```

### Flow: Sending (Notifier Sidecar)

```
Every 2 hours (node-cron):
    │
    ▼
Query PB: leftovers where status='active'
  AND expiry_date > now
  AND expiry_date < now + 24h
  AND notified_at IS NULL
    │
    ▼
Group items by household_id
    │
    ▼
For each household:
  Fetch push_subscriptions for that household
    │
    ▼
  For each item × subscription:
    webpush.sendNotification(subscription, JSON.stringify({
      title: "⚠️ {item_name} expires tomorrow!",
      body: "Use it or lose it."
    }))
    │
    ▼
  Update leftover: set notified_at = now()
    │
    ▼
  Handle 410 Gone → delete stale subscription
```

### Flow: Receiving (Service Worker)

```js
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: data.itemId,           // Prevent duplicate notifications
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
```

### UX: Notification Prompt

**One-time bottom sheet** (shown after first successful login):
- Condition: `'PushManager' in window` AND not already subscribed AND not dismissed within 7 days
- iOS special case: if `!navigator.standalone` → show "Add Scraps to your Home Screen to enable notifications" instead
- Dismissal stored in `localStorage` as `{ key: 'push_dismissed_at', value: timestamp }`

**Persistent setting** (in app header / user menu):
- Toggle: "Notifications: ON / OFF"
- ON → subscribe + save to PB
- OFF → `pushSubscription.unsubscribe()` + delete record from PB

### Environment Variables (Notifier)
| Var | Description |
|-----|-------------|
| `VAPID_PUBLIC_KEY` | VAPID public key (shared with frontend too) |
| `VAPID_PRIVATE_KEY` | VAPID private key (server-only) |
| `VAPID_SUBJECT` | `mailto:admin@yourdomain.com` |
| `PB_URL` | PocketBase internal URL (`http://localhost:8090`) |
| `PB_ADMIN_EMAIL` | PocketBase admin credentials for API access |
| `PB_ADMIN_PASSWORD` | PocketBase admin password |
| `CHECK_INTERVAL_HOURS` | Check frequency, default `2` |

---

## 13. Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│  Podman Pod: scraps-pod                               │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐                   │
│  │  scraps-ui   │  │  scraps-db   │                   │
│  │  Nginx:80    │  │  PB:8090     │                   │
│  │  (static +   │──│  (API +      │                   │
│  │   /api proxy)│  │   realtime)  │                   │
│  └─────────────┘  └──────────────┘                   │
│                          ▲                            │
│  ┌────────────────┐      │  ┌──────────────────┐     │
│  │ scraps-tunnel   │      │  │ scraps-notifier   │    │
│  │ cloudflared     │──→   │  │ Node.js cron      │    │
│  │ (connects :80)  │ CF   └──│ (2h cycle, push)  │    │
│  └────────────────┘ Edge  └──────────────────┘     │
│                     ├─ scraps.domain.com              │
│                     └─ Zero Trust auth                │
└──────────────────────────────────────────────────────┘
```

**Nginx** proxies `/api/*` and `/_/*` requests to PocketBase on `localhost:8090`. All other routes serve the SPA with a fallback to `index.html`.

**scraps-notifier** queries PocketBase every 2h for items expiring within 24h, sends Web Push notifications via VAPID-signed requests, updates `notified_at` on each item.

**Cloudflared** exposes only port 80 (Nginx) — PocketBase is never directly exposed. The Nginx reverse proxy handles API routing internally within the pod.

---

## 14. File Count & Complexity Estimate

| Directory | Files | Purpose |
|-----------|-------|---------|
| Root config | 7 | `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `Dockerfile`, `nginx.conf`, `podman-compose.yml` |
| `notifier/` | 3 | Sidecar: `Dockerfile`, `package.json`, `index.js` |
| `src/app/` | 5 | Shell, routing, providers |
| `src/modules/auth/` | 3 | Login feature |
| `src/modules/dashboard/` | 8 | Core dashboard feature |
| `src/modules/add-item/` | 5 | Add item feature |
| `src/modules/stats/` | 5 | Stats feature |
| `src/shared/` | 8 | PB client, i18n, hooks (online, push), UI primitives (+ NotificationPrompt) |
| `public/` | 4 | Manifest, SW, icons dir, locales |
| `pb_migrations/` | 1 | Schema migration |
| **Total** | **~50** | |

No file should exceed 300 lines. Most components will be 50–150 lines.

---

## 15. Implementation Order (Recommended)

```
Phase 1 (Scaffolding)     ██████░░░░░░░░░░░░░░░░░░░░░░░░  Steps 1.1–1.9
Phase 2 (Auth + Shell)    ░░░░░░██████░░░░░░░░░░░░░░░░░░  Steps 2.1–2.8
Phase 3 (Dashboard)       ░░░░░░░░░░░░████████░░░░░░░░░░  Steps 3.1–3.9
Phase 4 (Add Item)        ░░░░░░░░░░░░░░░░░░░░████░░░░░░  Steps 4.1–4.8
Phase 5 (Stats)           ░░░░░░░░░░░░░░░░░░░░░░░░██░░░░  Steps 5.1–5.5
Phase 6 (Push Notifs)     ░░░░░░░░░░░░░░░░░░░░░░░░░░██░░  Steps 6.1–6.9
Phase 7 (Polish)          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  Steps 7.1–7.7
Phase 8 (Deploy)          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  Steps 8.1–8.6
```

Each phase builds on the previous. Phases 1–4 are the critical path. Phases 5–7 can be parallelized.
