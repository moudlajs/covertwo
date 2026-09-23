import type { Page } from '@playwright/test'
import scoreboard from '../fixtures/espn-scoreboard.json' with { type: 'json' }

// 1x1 transparent PNG, served in place of every ESPN logo.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

/**
 * Route every ESPN request to local fixtures. CI must never hit the real API;
 * any other ESPN URL fails the request loudly instead of reaching the network.
 */
export async function mockEspn(page: Page) {
  await page.route(/espncdn\.com/, (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.route(
    /site\.api\.espn\.com\/apis\/site\/v2\/sports\/football\/nfl\/scoreboard/,
    (route) => route.fulfill({ json: scoreboard }),
  )
  await page.route(/espn\.com/, (route) => route.abort())
}
