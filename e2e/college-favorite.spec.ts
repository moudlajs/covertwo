import { expect, test } from '@playwright/test'
import ncaaf from '../fixtures/espn-ncaaf-scoreboard.json' with { type: 'json' }
import { mockEspn } from './mock-espn'

// The all-FBS slate: the Top 25 fixture plus an unranked Maryland game.
const [first] = ncaaf.events
if (!first) throw new Error('fixture changed')
const maryland = {
  ...first,
  id: 'md-game',
  competitions: first.competitions.map((c) => ({
    ...c,
    competitors: c.competitors.map((t, i) => ({
      ...t,
      curatedRank: { current: 99 },
      team:
        i === 0
          ? { ...t.team, id: '120', abbreviation: 'MD', displayName: 'Maryland Terrapins' }
          : { ...t.team, id: '999', abbreviation: 'UNR', displayName: 'Unranked State' },
    })),
  })),
}
const allFbs = { ...ncaaf, events: [...ncaaf.events, maryland] }

test('an unranked college favourite (Maryland) shows, pinned, in the Top 25 view', async ({
  page,
}) => {
  await mockEspn(page)
  await page.route(/api\.test\/ncaaf\/scoreboard\?groups=80$/, (route) =>
    route.fulfill({ json: allFbs }),
  )
  await page.goto('./')
  await page.getByText('NCAA', { exact: true }).click()
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(22) // plain Top 25

  const fbs = page.waitForRequest(/ncaaf\/scoreboard\?groups=80$/)
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByLabel('Favourite team').selectOption({ label: 'Maryland Terrapins' })
  await fbs
  await page.keyboard.press('Escape')

  await expect(page.getByRole('radio', { name: 'Top 25' })).toBeChecked()
  await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Maryland Terrapins')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(23) // Top 25 + Maryland
})
