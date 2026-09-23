# Contributing

Solo project: the owner is product owner and reviewer, Claude implements.
The rules still apply to both.

## Flow

1. **Issue first.** Every change has an issue with a milestone, and a
   `type:`, `area:` and `priority:` label. Use the issue forms.
2. **One issue = one branch = one draft PR.**
   Branch: `<type>/<issue-number>-<short-slug>`, e.g. `feat/12-week-picker`.
3. **Open the PR as a draft** with `Closes #N` in the body.
4. **Mark it ready only when CI is green.** That triggers the Claude review.
   Resolve every review conversation before merging.
5. **Squash merge.** The PR title becomes the commit on `main`.

## PR titles

[Conventional Commits](https://www.conventionalcommits.org/), checked in CI:
`feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `perf`.

Versions come from these titles, never from milestones: `feat` bumps the
minor version, `fix` the patch. release-please opens a release PR; merging it
tags, releases and deploys. Milestones are for planning only. The one manual
override is `Release-As: 1.0.0` when the MVP (M1) ships.

## Checks

```sh
npm run lint        # ESLint + Prettier
npm run typecheck
npm test            # Vitest
npm run e2e         # Playwright, against fixtures/ - never the real API
npm run build
```

All five run in CI and are required on `main`, along with the PR title check
and the Claude review.
