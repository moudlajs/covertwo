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
  // One visit, no reload: the worker takes charge after the page has loaded
  // and must still end up with the scores and the logos.
  await page.goto('./')
  const rows = page.getByRole('main').getByRole('listitem')
  await expect(rows).toHaveCount(16)
  await expect(page.getByRole('contentinfo')).not.toContainText('offline')
  const saved = (name: string) =>
    page.evaluate(async (n) => (await (await caches.open(n)).keys()).length, name)
  await expect.poll(() => saved('covertwo-data')).toBeGreaterThan(0)
  await expect.poll(() => saved('covertwo-logos')).toBeGreaterThan(20)

  await context.unroute(API)
  await context.route(API, (route) => route.abort('internetdisconnected'))
  await context.setOffline(true)
  await page.reload()
  await expect(rows).toHaveCount(16)
  await expect(page.getByRole('contentinfo')).toContainText('offline')
  await expect(page.getByRole('contentinfo')).toContainText('updated')
})
