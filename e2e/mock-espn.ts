import type { Page } from '@playwright/test'
import ncaaf from '../fixtures/espn-ncaaf-scoreboard.json' with { type: 'json' }
import scoreboard from '../fixtures/espn-scoreboard.json' with { type: 'json' }

// 1x1 transparent PNG, served in place of every ESPN logo.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

/** College football scoreboard via the fake API host. */
export const NCAAF_API = /^http:\/\/api\.test\/ncaaf\/scoreboard/

/** The scoreboard API URL, for tests that override its response. */
export const SCOREBOARD_API = /^http:\/\/api\.test\/nfl\/scoreboard/

/**
 * Route every ESPN request to local fixtures. CI must never hit the real API;
 * any other ESPN URL fails the request loudly instead of reaching the network.
 */
export async function mockEspn(page: Page) {
  // Playwright tries the most recently registered route first, so the
  // catch-all abort goes first and the specific routes after it.
  await page.route(/espn\.com|api\.test/, (route) => route.abort())
  await page.route(/espncdn\.com/, (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.route(SCOREBOARD_API, (route) => route.fulfill({ json: scoreboard }))
  await page.route(NCAAF_API, (route) => route.fulfill({ json: ncaaf }))
}
