import { expect, test } from '@playwright/test'
import scoreboard from '../fixtures/espn-scoreboard.json' with { type: 'json' }
import { blockAnalytics, FIXTURE_NOW } from './mock-espn'

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)
const API = /^http:\/\/api\.test\//

test.use({ serviceWorkers: 'allow' })

test('offline after a first visit: the app and the last scores still show, marked offline', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    "Playwright only routes a service worker's requests in Chromium",
  )
  await page.clock.setFixedTime(FIXTURE_NOW)
  await blockAnalytics(page)
  // Context-level routes also catch the service worker's own requests.
  await context.route(API, (route) => route.fulfill({ json: scoreboard }))
  await context.route(/espncdn\.com/, (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  // Controlled now: this load goes through the worker, which saves the scores.
  await page.reload()
  const rows = page.getByRole('main').getByRole('listitem')
  await expect(rows).toHaveCount(16)
  await expect(page.getByRole('contentinfo')).not.toContainText('offline')

  await context.unroute(API)
  await context.route(API, (route) => route.abort('internetdisconnected'))
  await context.setOffline(true)
  await page.reload()
  await expect(rows).toHaveCount(16)
  await expect(page.getByRole('contentinfo')).toContainText('offline')
  await expect(page.getByRole('contentinfo')).toContainText('updated')
})
