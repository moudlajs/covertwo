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

No backend, no state library, no router until a milestone needs one. KISS:
no abstractions ahead of need.

## Data source

ESPN unofficial API, no key:
`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`

- CORS: responds with `access-control-allow-origin: *`.
- Map the response to a clean internal type at the edge; keep all times UTC
  and only format them in the UI (Europe/Prague 24h or America/New_York 12h).
- Poll every 30s only while a game is live; otherwise load once and refetch
  on window focus.
- On a fetch error keep the last good data, show a small "retrying"
  indicator, and `console.error` with context (URL, status).
- `fixtures/espn-scoreboard.json` is real week-2 2026 data, with four games
  rewritten as live (3rd qtr, halftime, 4th qtr in the red zone, 1st qtr) and
  three as scheduled. The `situation` blocks on the live games are
  hand-written to ESPN's shape, not captured.
- **Tests never hit the real API.** Unit tests import the fixture; e2e uses
  `e2e/mock-espn.ts`, which also stubs logos and aborts any other ESPN URL.

## Design

Dark background with a subtle accent partly hidden behind one centered,
elevated, rounded panel (~560-640px on desktop, near full width on mobile).
Compact, table-aligned rows that are not an HTML table. Header: title, EU/US
toggle, hamburger menu. A reserved NFL/NCAA segmented toggle slot, hidden
until the College Football milestone. No NFL shield logo.

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

The reference render lives in `src/design/` (open
`/covertwo/design/index.html`, `?league` shows the league toggle) with
screenshots in `design/screenshots/`. Delete both once #21 and #22 have
implemented it.

## Milestones

M0 Foundation · M1 MVP Scoreboard · M2 Live Game Context · M3 College
Football · M4 Navigation & Personalization · M5 PWA · M6 Context & Stats.
Each milestone is one minor release. From M3 on, every feature works for both
leagues or says "NFL-only" in its issue.

## Out of scope

- Fantasy / Sleeper features of any kind (that lives in waiverwatch).
- A backend or proxy. If ESPN ever blocks CORS, stop and ask.
- Server push notifications (needs a Worker; backlog).
- The NFL shield or other league trademarks in the UI.
