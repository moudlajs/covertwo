/** `?demo` in the URL: show built-in fixture data instead of live ESPN data. */
export const DEMO = new URLSearchParams(location.search).has('demo')

/**
 * The fixture's moment: Sunday 20 Sep 2026, 22:00 in Prague. Four games are
 * live, early games are final, and later ones are counting down.
 */
export const DEMO_NOW = Date.parse('2026-09-20T20:00:00Z')

/**
 * Fixture files as separate build assets, fetched only in demo mode (normal
 * visits never download them).
 */
export const DEMO_DATA = {
  nfl: new URL('../../fixtures/espn-scoreboard.json', import.meta.url).href,
  ncaaf: new URL('../../fixtures/espn-ncaaf-scoreboard.json', import.meta.url).href,
}
