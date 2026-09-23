import { expect, test, type Route } from '@playwright/test'
import { mockEspn, SCOREBOARD_API } from './mock-espn'

const fail = (route: Route) => route.fulfill({ status: 500, body: '' })

test('first-load failure shows an error with a working retry', async ({ page }) => {
  await mockEspn(page)
  await page.route(SCOREBOARD_API, fail) // registered last, so it wins
  await page.goto('./')
  await expect(page.getByRole('alert')).toContainText("Couldn't load scores")

  await page.unroute(SCOREBOARD_API, fail)
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
})

test('a failed refetch keeps the games and shows retrying', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)

  await page.route(SCOREBOARD_API, fail)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('status')).toHaveText('retrying…')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
})
