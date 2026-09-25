# Notes for Claude

Read `CONTRIBUTING.md` first. Branch naming, PR flow and title format apply
to you.

## The rule

**One issue = one branch = one draft PR.** Open as draft, link the issue with
`Closes #N`, mark ready only when CI is green. Never push to `main`. Don't
start a milestone until the owner says so.

Never write the literal `@claude` in a GitHub comment, PR, or issue body: it
triggers a Claude run on the owner's subscription.

## What this is

covertwo: a small, modest NFL live scoreboard. One compact row per game,
grouped by day, EU/US time toggle. A widget, not a website. Hosted on GitHub
Pages at `/covertwo/`.

## Stack

React 19, Vite, TypeScript (strict, `noUncheckedIndexedAccess`), Tailwind v4
(`@tailwindcss/vite`, no config file), Vitest + React Testing Library,
Playwright, ESLint 9 (pinned: `eslint-plugin-jsx-a11y` does not support 10
yet) + Prettier.

No backend except the API proxy Worker (`worker/`), no state library, no
router until a milestone needs one. KISS: no abstractions ahead of need.

## Data source

ESPN unofficial API, no key, reached **through our Cloudflare Worker**:
app → `VITE_API_BASE/nfl/scoreboard` (`worker/`) →
`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`

- Why the proxy (verified 2026-09-24, #18): ESPN's bot protection answers
  browser requests from other sites with a 403 **without** CORS headers, so
  it surfaces as a CORS error. It hit the owner's phone on mobile data and
  over a VPN; server-side requests pass. `curl` checks are misleading
  (plain `curl` passes, `curl` with a browser User-Agent gets 403). Only a
  real browser on the deployed site proves anything.
- Verified 2026-09-24 on the live site (v0.3.0) through the Worker: 6/6
  loads in headless Chromium, the client ESPN blocked every time, returned
  200 with all games.
- The Worker forwards allow-listed paths only (not an open proxy), adds CORS
  for the Pages and localhost origins, and caches ~15s at the edge so all
  viewers share one upstream request. Deployed by `.github/workflows/worker.yml`.
- College football: `VITE_API_BASE/ncaaf/scoreboard` → ESPN
  `football/college-football/scoreboard`, same response shape. ESPN's
  `groups` param picks the slate: none = games with a Top 25 team (~18,
  ~330 KB), `80` = all FBS (~70, ~1.3 MB), a conference id = that conference
  (ACC 1, Big 12 4, Big Ten 5, SEC 8, Pac-12 9, C-USA 12, MAC 15, Mountain
  West 17, FBS Independents 18, Sun Belt 37, American 151). Ranks come from
  `competitors[].curatedRank.current` (99 = unranked).
- Map the response to a clean internal type at the edge; keep all times UTC
  and only format them in the UI (Europe/Prague 24h or America/New_York 12h).
- Poll every 30s only while a game is live, or while retrying after a failed
  load (until the next success); otherwise load once and refetch on window
  focus. Polls are skipped while the tab is hidden.
- On a fetch error keep the last good data, show a small "retrying"
  indicator, and `console.error` with context (URL, status).
- `fixtures/espn-ncaaf-scoreboard.json` is real college week-3 2026 data
  (Top 25 slate, all final).
- `fixtures/espn-scoreboard.json` is real week-2 2026 data, with four games
  rewritten as live (3rd qtr, halftime, 4th qtr in the red zone, 1st qtr) and
  three as scheduled. The `situation` blocks on the live games are
  hand-written to ESPN's shape, not captured.
- `fixtures/espn-nfl-wildcard.json` and `espn-nfl-superbowl.json` are real
  (captured 2026-09-25) future playoff rounds: "TBD @ TBD" teams (ids -1/-2)
  and, before times are set, `timeValid: false` with a placeholder 05:00Z.
- Offline (#53): a hand-written service worker (`src/sw.js`, written to
  `dist/sw.js` by the `serviceWorker()` plugin in `vite.config.ts` with the
  list of files to save) keeps the app, the last good scoreboard per URL and
  the logos. A saved copy carries `x-covertwo-saved-at`; `useScoreboard` then
  reports `offline` and the footer shows it. Production builds only; e2e
  blocks the worker except in `offline.spec.ts` (Chromium only).
- **Tests never hit the real API.** Unit tests import the fixture; e2e uses
  `e2e/mock-espn.ts`, which also stubs logos and aborts any other ESPN URL.

## Design

Dark background with a subtle accent partly hidden behind one centered,
elevated, rounded panel (~560-640px on desktop, near full width on mobile).
Compact, table-aligned rows that are not an HTML table. Header: title, EU/US
toggle, hamburger menu. The NFL/NCAA segmented toggle sits right after the
title (the slot was reserved from the start). No NFL shield logo.

**Chosen: variant D** (#14). C's "ticker" graphics with B's centered layout:

- Background: `#0b1020` with a warm amber glow top-left, a faint sky glow
  bottom-right, and two diagonal bands of hash marks partly behind the panel.
- Panel: solid `slate-900`, `rounded-xl`, layered drop shadow plus a 1px
  slate ring, and a 2px amber→rose gradient top edge. Max width 560px.
- Header: darker strip, monospace `covertwo_` title with an amber underscore,
  amber segmented toggles (EU/US now, NFL/NCAA later in the same row), and
  a hamburger button.
- Day headings: monospace, uppercase, amber, with a muted "N games" count.
- Rows: compact 3-column grid, away | centre | home. The centre holds the
  score (monospace, tabular) or kickoff time, with a status line under it:
  "Final", network for scheduled games, or a pulsing rose dot + "Q3 · 8:42 ·
  2nd & 7" when live. The losing team is dimmed on finals. Live rows get a
  lighter background; red zone adds a rose left edge and an "RZ" tag.
- Footer: monospace source and "updated Xs ago".

**Light theme** (#48, variant A "warm paper"): the first visit follows the
system; a sun/moon button next to EU/US switches it (`src/lib/theme.ts`, persisted). It
is one CSS block in `src/index.css` that inverts the slate scale and deepens
the accents under `html[data-theme=light]`, so components keep their dark
class names. Use `bg-page`/`bg-chrome`/`bg-heading`, `bg-accent`/`text-on-accent`
and `text-label` instead of hard-coded colours. Light uses normal team logos
without the glow. An inline script in `index.html` sets the theme before first
paint. Every light text colour meets WCAG AA.

**App icon** (#52): "Poster" (COVER / TWO_ in Anton, the amber-to-rose bar as
the underscore) for the home screen and install, and the plain "C2" small mark
for favicons. Sources are SVGs in `design/icons/`; `npm run icons` renders the
PNGs in `public/icons/` (commit both). The manifest is
`public/manifest.webmanifest`, scoped to `/covertwo/`. The other concepts from
the design round (Varsity, Cursor, Jersey) live on the design canvas only.

**App mode** (#204): launched from the home screen, the inline script in
`index.html` sets `html[data-display=app]`, and the `app:` Tailwind variant
(phones only, under 640px) makes the panel full-screen: no card, corners or
margins, no overscroll bounce, safe-area padding for the status bar and home
indicator. Browser tabs and tablets keep the floating panel.

Implemented in `src/components/` (`Shell`, `Backdrop`, `Header`, `GameRow`).

## Milestones

M0 Foundation · M1 MVP Scoreboard · M2 Live Game Context · M3 College
Football · M4 Navigation & Personalization · M5 PWA · M6 Context & Stats.
Milestones are for planning only; versions come from commits via
release-please (`feat` → minor, `fix` → patch), with 1.0.0 cut when M1 ships.
From M3 on, every feature works for both leagues or says "NFL-only" in its
issue.

## Out of scope

- Fantasy / Sleeper features of any kind (that lives in waiverwatch).
- Any backend beyond the proxy Worker. Ask before adding server features.
- Server push notifications (needs a Worker; backlog).
- The NFL shield or other league trademarks in the UI.
