import { expect, test } from '@playwright/test'
import scoreboard from '../fixtures/espn-scoreboard.json' with { type: 'json' }
import { mockEspn, SCOREBOARD_API } from './mock-espn'

test('a score change flashes the new score and is announced', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const main = page.getByRole('main')
  await expect(main.getByRole('listitem')).toHaveCount(16)

  // Dallas scores a touchdown before the next refetch.
  const touchdown = structuredClone(scoreboard)
  for (const e of touchdown.events)
    for (const c of e.competitions[0]?.competitors ?? [])
      if (c.team.abbreviation === 'DAL') c.score = String(Number(c.score) + 7)
  await page.route(SCOREBOARD_API, (route) => route.fulfill({ json: touchdown }))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))

  await expect(main.locator('[data-centre]').getByText('27', { exact: true })).toHaveClass(
    /animate-score-flash/,
  )
  await expect(page.locator('[aria-live="polite"]:not([data-testid="toast"])')).toHaveText(
    'Score: Washington Commanders 23, Dallas Cowboys 27',
  )
})
