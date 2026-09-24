import { expect, test } from '@playwright/test'
import ncaaf from '../fixtures/espn-ncaaf-scoreboard.json' with { type: 'json' }
import { mockEspn } from './mock-espn'

test('conference filter loads that conference; Top 25 keeps its ranked games', async ({ page }) => {
  await mockEspn(page)
  // Pretend the SEC slate is the first four fixture games, only the first involving a ranked team.
  const sec = {
    ...ncaaf,
    events: ncaaf.events.slice(0, 4).map((e, i) =>
      i === 0
        ? e
        : {
            ...e,
            competitions: e.competitions.map((c) => ({
              ...c,
              competitors: c.competitors.map((t) => ({ ...t, curatedRank: { current: 99 } })),
            })),
          },
    ),
  }
  await page.route(/api\.test\/ncaaf\/scoreboard\?groups=8$/, (route) =>
    route.fulfill({ json: sec }),
  )
  await page.goto('./')
  await page.getByText('NCAA', { exact: true }).click()

  const request = page.waitForRequest(/groups=8$/)
  await page.getByLabel('Conference').selectOption({ label: 'SEC' })
  await request
  const games = page.getByRole('main').getByRole('listitem')
  await expect(games).toHaveCount(1) // Top 25 view: only the ranked game

  await page.getByText('All FBS', { exact: true }).click()
  await expect(games).toHaveCount(4) // same SEC slate, unfiltered

  await page.reload()
  await expect(page.getByLabel('Conference')).toHaveValue('8')
})
