# LinkerRu :Re

A unified personal digital hub — widgets, AI assistant, P2P file transfer,
weather, calendar, clock, notifications, and a customizable home screen.
Built with React 19, Vite 6, Tailwind v4, Firebase, and an Express + WebSocket
signaling server.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000  (Vite + WS signaling)
```

> The dev server (`tsx server.ts`) starts Vite in middleware mode **and** the
> WebSocket signaling server on the same port (3000). Use this, not `vite dev`,
> if you want Lisyan Connect P2P to work locally.

## Scripts

| Script            | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `npm run dev`     | Dev server (Vite middleware + WS signaling) on port 3000             |
| `npm run build`   | Vite build + esbuild bundles `server.ts` → `dist/server.cjs`         |
| `npm start`       | Run the production server (`node dist/server.cjs`)                   |
| `npm run preview` | Preview the production Vite build                                    |
| `npm run lint`    | `tsc --noEmit` (typecheck only — ESLint is recommended, see below)   |
| `npm run clean`   | Remove `dist/` and stray `server.js`                                 |

## Environment

Copy `.env.example` → `.env` and fill in:

- `GEMINI_API_KEY` — Google Gemini key for AI features.
- `APP_URL` — public URL of the deployment (used for self-referential links).

Firebase web config (Auth + Firestore) is committed in
`src/lib/userFirebase.ts` — this is normal for client-side Firebase, but
**security is enforced by `firestore.rules`** (owner-scoped, deny-by-default).

## Architecture

```
index.html              Vite entry
server.ts               Express + ws signaling server (Lisyan Connect)
netlify/
  functions/            Serverless /api/* handlers used by the Netlify deploy
  lib/                  Shared provider + GitHub helpers for those functions
src/
  main.tsx              React bootstrap
  App.tsx               Root app: state, persistence, modals, home shell
  types.ts              Shared types (Language, ThemeMode, palettes, …)
  index.css             Tailwind v4 entry + global styles
  data/
    themes.ts           Material-3 palettes
    translations.ts     i18n strings
    sounds.ts           Click / notification sound definitions
  lib/
    firebase.ts         App Firebase (internal)
    userFirebase.ts     User Auth + Firestore (LinkerID)
  components/
    LoginScreen.tsx     Auth screen (light/dark/system theme toggle)
    NextGenHome.tsx     Next-gen home screen (opt-in via feature flag)
    ClockModal.tsx      Clock widget modal
    CalendarModal.tsx   Calendar widget modal
    WeatherModal.tsx    Weather widget modal
    WeatherApp.tsx      Full weather app (floating window)
    SettingsModal.tsx   Quick settings
    FullSettingsModal.tsx  Full settings (tabs)
    ServerModal.tsx     Proxy server selector
    ChangelogModal.tsx  Changelog viewer
    StandbyClock.tsx    Standby / always-on clock
    StandbySetupModal.tsx  Standby configuration
    NotificationsModal.tsx  Notifications center
    OnboardingModal.tsx   First-run onboarding
    LisyanConnectModal.tsx  P2P file transfer UI
    SquashToggle.tsx    Toggle pill
  homescreen/
    index.html          Custom homescreen template
```

### State & persistence

All user preferences are persisted to `localStorage` under the `linkerru_*`
namespace. Cross-tab sync is handled via `storage` events and custom events
(`linkerru_links_changed`, `linkerru_toggles_changed`, `linker-theme-change`).

Theme tokens are mounted as CSS variables on `:root` from `App.tsx` and respect
the active palette + light/dark mode + high-contrast toggle.

### Home screen versions

The app supports multiple hotswappable home screen designs. Switch between them
via the **"Home Design"** pill (classic home branding section), the **"+"**
button in the Expressive dock, or the floating **"Home Design"** button on the
NextGen home. The picker modal lists all registered versions with descriptions.

The active version is persisted in `localStorage` under
`linkerru_home_version` (`'classic'` | `'nextgen'` | `'expressive'`). The old
`linkerru_nextgen_home` boolean flag is auto-migrated on first load.

| Version      | File                              | Concept                                              |
| ------------ | --------------------------------- | ---------------------------------------------------- |
| `classic`    | `src/App.tsx` (inline)            | Original bento launcher with top bar + widgets       |
| `nextgen`    | `src/components/NextGenHome.tsx`  | Glassmorphic bento grid + aurora background + search |
| `expressive` | `src/components/ExpressiveHome.tsx` | M3 Expressive platform launcher: dock + sections + Now-card |

**To add a new home version**, see `AGENTS.md` → "Home screen versions".

### Lisyan Connect (P2P)

`server.ts` runs a minimal WebSocket signaling server that forwards messages
between peers in the same `roomId`. The browser side uses WebRTC for the actual
file transfer (see `src/components/LisyanConnectModal.tsx` and
`src/components/lisyanconnect-useP2P.ts`).

## Deployment

```bash
npm run build
npm start          # serves dist/ + WS signaling on port 3000
```

Set `NODE_ENV=production` so the server serves the built static bundle instead
of Vite middleware.

### Netlify (static + Functions)

Netlify only serves the built `dist/` bundle, so the Express server never runs
there. Every same-origin `/api/*` call the frontend makes is served by a
Netlify Function instead (declared with `config.path`, see `netlify.toml`):

| Function | Route | Purpose |
| --- | --- | --- |
| `netlify/functions/ai-chat.mjs` | `POST /api/ai/chat` | Lisyan AI proxy: Cerebras → Groq → NVIDIA NIM → OpenRouter failover |
| `netlify/functions/ai-warmup.mjs` | `GET /api/ai/warmup` | First-run provider probe |
| `netlify/functions/ai-search.mjs` | `GET /api/ai/search` | DuckDuckGo web search for the AI |
| `netlify/functions/geoip.mjs` | `GET /api/geoip` | IP geolocation for Weather |
| `netlify/functions/meta.mjs` | `GET /api/build-info`, `GET /api/changelog[/:sha]` | GitHub proxy for the changelog |
| `netlify/functions/health.mjs` | `GET /api/health` | Liveness probe |

Shared provider/GitHub helpers live in `netlify/lib/` (outside the functions
directory so they are bundled as dependencies, never deployed as functions).
Required environment variables: `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`,
`NVIDIA_API_KEY`, `VITE_GROQ_API_KEY` (or `GROQ_API_KEY`) — scoped to
**Builds, Functions, Runtime**.

If no server-side proxy is reachable at all (404/405), `chatApi.ts` falls back
to a direct browser-side Groq call using the public `VITE_GROQ_API_KEY`, so the
assistant still answers on a purely static host.

## Security notes

- Firestore rules (`firestore.rules`) are owner-scoped and deny-by-default.
- The WebSocket signaling server has **no auth** — do not expose it directly to
  the public internet without an auth/origin-check layer in front of it.
- Never commit secrets to the repo. Use `.env` (gitignored) or your host's
  secret manager.

## License

See repository metadata. Made with care.
