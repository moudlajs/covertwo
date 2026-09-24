# covertwo

[![CI](https://github.com/moudlajs/covertwo/actions/workflows/ci.yml/badge.svg)](https://github.com/moudlajs/covertwo/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/moudlajs/covertwo?include_prereleases&sort=semver)](https://github.com/moudlajs/covertwo/releases)
[![Deploy](https://img.shields.io/github/deployments/moudlajs/covertwo/github-pages?label=deploy)](https://github.com/moudlajs/covertwo/deployments/github-pages)
[![License: MIT](https://img.shields.io/github/license/moudlajs/covertwo)](LICENSE)

A small, modest NFL live scoreboard. One compact row per game, grouped by
day, with a Europe/US time toggle. A widget, not a website.

**Live:** https://moudlajs.github.io/covertwo/

<img src="docs/screenshot.png" alt="covertwo showing a week of NFL games grouped by day, with kickoff times in Prague time" width="560">

## Architecture

A static site on GitHub Pages plus one tiny Cloudflare Worker. ESPN's API
rejects browser requests from other sites, so the Worker fetches it
server-side, caches it for ~15s and adds CORS headers.

```mermaid
flowchart LR
  subgraph Browser
    App[covertwo<br/>React SPA]
    LS[(localStorage<br/>time mode)]
  end
  Worker[Cloudflare Worker<br/>proxy + 15s cache]
  ESPN[ESPN scoreboard API<br/>site.api.espn.com]
  CDN[ESPN CDN<br/>team logos]
  subgraph GitHub
    Repo[main branch] --> Actions[GitHub Actions] --> Pages[GitHub Pages]
  end
  Pages -- static files --> App
  App -- "GET /nfl/scoreboard<br/>(30s while live)" --> Worker
  Worker --> ESPN
  App -- img --> CDN
  App <--> LS
```

## Development workflow

Every change is an issue, a branch, and a draft PR. The PR title becomes the
squash commit, which release-please turns into a version and changelog.

```mermaid
flowchart LR
  Issue[Issue<br/>milestone + labels] --> Branch["Branch<br/>type/N-slug"]
  Branch --> Draft[Draft PR<br/>Closes #N]
  Draft --> CI{CI green?}
  CI -- no --> Branch
  CI -- yes --> Ready[Ready for review]
  Ready --> Review[Claude review]
  Review --> Merge[Squash merge<br/>to main]
  Merge --> RP[release-please<br/>release PR]
  RP --> Tag[Tag + GitHub Release]
  Tag --> Deploy[Deploy to Pages]
```

## CI/CD pipeline

```mermaid
flowchart TB
  subgraph PR["Pull request"]
    direction LR
    lint & typecheck & test & e2e & build
    title[pr-title]
    claude[claude-review<br/>non-draft only]
  end
  subgraph Main["Push to main (both run in parallel)"]
    direction LR
    ci2[CI jobs]
    rp[release-please] -- release created --> deploy[deploy.yml<br/>build → Pages]
  end
  PR -- squash merge --> Main
```

All seven PR checks are required by the `main` ruleset. e2e runs Playwright
against a local ESPN fixture; CI never calls the real API.

## Local development

Requires Node 22+.

```sh
npm ci
npm run dev          # http://localhost:5173/covertwo/
```

## Testing

```sh
npm run lint         # ESLint + Prettier
npm run typecheck
npm test             # Vitest + React Testing Library
npx playwright install chromium   # once
npm run e2e          # Playwright, mobile + desktop, mocked ESPN
npm run build
```

## Releasing

Releases are automated. Merging `feat:` / `fix:` PRs makes release-please
open (or update) a release PR; merging that tags `vX.Y.Z`, publishes a GitHub
Release, and deploys to Pages. Versions come from the PR titles only:
`feat` bumps the minor version, `fix` the patch. Milestones are for planning
and don't set versions; the one manual override is `Release-As: 1.0.0` when
the MVP (M1) ships.

To redeploy without a release, run the **Deploy** workflow manually.

## Roadmap

See the [milestones](https://github.com/moudlajs/covertwo/milestones).
Contributing rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
