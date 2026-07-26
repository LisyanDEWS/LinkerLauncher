# AGENTS.md — conventions for AI agents working on this repo

## Project

LinkerRu :Re — React 19 + Vite 6 + Tailwind v4 + Firebase + Express + ws.
See `README.md` for full architecture.

## Run / verify

- Dev: `npm run dev` (port 3000, Vite + WS signaling — **not** `vite dev`).
- Typecheck: `npm run lint` (runs `tsc --noEmit`). **Always run this before
  declaring a task complete.**
- Build: `npm run build`.
- No test framework is configured yet — verify changes via typecheck + manual
  HMR check in the running dev server.

## Code style

- TypeScript everywhere. `tsc --noEmit` must pass with zero errors.
- Tailwind v4 (via `@tailwindcss/vite`). Prefer utility classes; use
  `var(--*)` CSS variables for theme-aware colors (see `App.tsx` :root effect).
- Animations: `motion/react` (Framer Motion). Use `whileHover`/`whileTap` for
  micro-interactions; choreograph entrances with staggered variants.
- Icons: `lucide-react` only. Do not add other icon libraries.
- No emojis in code or UI unless explicitly requested.
- Do not add or remove comments unless asked. Preserve existing comments.
- Compact code: collapse duplicate branches, avoid needless nesting.

## Conventions

- localStorage keys use the `linkerru_*` namespace. Persist new preferences
  the same way existing ones are (init from localStorage in `useState` lazy
  initializer + write on change).
- Cross-tab sync: use `storage` events or a custom `linkerru_*_changed` event
  dispatched on `window`.
- Theme tokens are CSS variables set on `:root` in `App.tsx`. New components
  should consume `var(--surface)`, `var(--on-surface)`, `var(--accent)`, etc.
  — **never hardcode `bg-black`/`text-white`** in shared components. The login
  screen is a local exception with its own palette object.
- i18n: every user-facing string must exist in both `ru` and `en`. Inline
  ternaries (`lang === 'ru' ? '...' : '...'`) are acceptable for short strings;
  use `src/data/translations.ts` for longer ones.
- Theme modes: `'light' | 'dark'` for the main app; the login screen adds
  `'system'` (auto) which resolves to light/dark via `matchMedia`.

## Component patterns

- Modals: controlled by an `isXOpen` state in `App.tsx`, rendered at the end of
  the tree, accept `isOpen` + `onClose` props.
- New home-screen tiles: see `NextGenHome.tsx` for the bento-tile pattern
  (`BentoTile` wrapper, glass surface style, accent glow on hover).
- Feature flags: opt-in via `localStorage` boolean, default off, with a visible
  toggle to enable/disable. See `linkerru_nextgen_home` for the pattern.

## Window manager (popup apps)

Apps that open as floating popups (Agno, Settings, Lisyan, Weather, Calculator)
go through the `useWindows()` hook + `<WindowManagerLayer>` in
`src/components/WindowManager.tsx`. Features: draggable title bar, resizable
corner, maximize/restore, minimize-to-taskbar, focus z-stacking, singleton
mode (re-opening an id focuses the existing window).

**To open an app as a window:**
```ts
wm.open({
  id: 'myapp',           // unique; singleton by default
  title: 'My App',
  icon: <MyIcon size={14} />,
  initialWidth: 720, initialHeight: 560,
  minWidth: 360, minHeight: 280,
  render: () => <MyAppComponent ... />,
});
```
The `WindowManagerLayer` must be rendered once at the root of the app tree.
The legacy fullscreen-modal pattern (`isXOpen` + `motion.div` overlay) is still
used for Clock, Calendar, Changelog, Notifications, Onboarding, Server — these
are intentionally not windows because they are full-screen experiences.

## Home screen versions

The app supports multiple hotswappable home screen designs. The active version
is stored in `localStorage` under `linkerru_home_version` (values: `'classic'`,
`'nextgen'`, `'expressive'`, `'fusion'`). The old `linkerru_nextgen_home` boolean
flag is auto-migrated on first load.

- `classic` — original header + tile grid.
- `nextgen` — glassmorphic bento with aurora background.
- `expressive` — M3 Expressive OS launcher with dock + sections + Now card.
- `fusion` — v4 hybrid: NextGen glass + Expressive sections/dock + aurora.

**To add a new home version:**
1. Add a new value to `HomeVersion` in `src/types.ts`.
2. Add an entry to `HOME_VERSIONS` in `src/components/HomeVersionPicker.tsx`
   (id, icon, title, description, tag).
3. Create the component (e.g. `src/components/MyNewHome.tsx`) — it must be
   fully presentational (all actions via props, consume `var(--*)` tokens,
   support both `light`/`dark` themes, i18n `ru`/`en`).
4. Add a `homeVersion === 'mynew'` branch in `App.tsx`'s desktop render block,
   wiring all the same callbacks the other homes use.
5. Run `tsc --noEmit` — must pass with zero errors.

**Design guidelines for new home versions:**
- Each version should be a **distinct design language**, not a minor tweak.
- Organize apps by purpose (communication, intelligence, tools, system) — do
  NOT dump everything into one unstructured grid.
- Provide a clear focal point (a "Now" card, a hero, a primary action).
- Use spring physics for entrances and micro-interactions.
- Consume the existing `var(--*)` CSS variables — never hardcode
  `bg-black`/`text-white` in shared components.
- Include a way to open the `HomeVersionPicker` (dock button, floating button,
  or header pill) so users can switch back.

## Safety

- Never commit secrets. Firebase web config is intentionally committed; real
  secrets go in `.env` (gitignored).
- Never weaken `firestore.rules` — they are owner-scoped, deny-by-default.
- The WS signaling server has no auth — do not add features that assume it is
  trusted without first adding auth/origin checks.
- Destructive ops (rm -rf, dropping data, force-push) require explicit user
  confirmation.

## Known debt (good targets for improvement)

- `App.tsx` is ~2,600 lines (god component). Extracting a `usePersistentState`
  hook and modal containers would help a lot.
- ESLint + Prettier are configured (`eslint.config.js`, `.prettierrc.json`).
  `npm run lint` runs `eslint .`; warnings are tolerated, errors are not.
- No tests — Vitest + React Testing Library would be a good addition.
- Several `any` casts (Firebase errors, battery API, window) — replace with
  typed helpers when touched.
- The window manager's `__updateGeometry` is stashed on the manager object via
  a cast — refactor to expose it cleanly via a context or returned tuple.
