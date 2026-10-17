import { expect, test } from '@playwright/test'
import scoreboard from '../fixtures/espn-scoreboard.json' with { type: 'json' }
import { mockEspn, SCOREBOARD_API } from './mock-espn'

test('teams without a game are listed as on bye, NFL only', async ({ page }) => {
  await mockEspn(page)
  // The fixture week minus its first game: those two teams are on bye.
  const week = { ...scoreboard, events: scoreboard.events.slice(1) }
  await page.route(SCOREBOARD_API, (route) => route.fulfill({ json: week }))
  await page.goto('./')
  const bye = page.getByText(/^On bye: /)
  await expect(bye).toHaveCount(1)
  await page.getByText('NCAA', { exact: true }).click()
  await expect(bye).toHaveCount(0)
})

test('a full week shows no bye line', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  // The board has rendered (a game from the fixture week), so the check below means something.
  await expect(page.getByText('Final/OT').first()).toBeVisible()
  await expect(page.getByText(/^On bye: /)).toHaveCount(0)
})
