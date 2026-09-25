import { expect, test } from '@playwright/test'
import scoreboard from '../fixtures/espn-scoreboard.json' with { type: 'json' }
import { mockEspn, SCOREBOARD_API } from './mock-espn'

// The fixture with its live games already finished: realistic for a moment
// when nothing is live (the card only shows then).
const nothingLive = {
  ...scoreboard,
  events: scoreboard.events.map((e) =>
    e.status.type.state === 'in'
      ? { ...e, status: { ...e.status, type: { ...e.status.type, state: 'post' } } }
      : e,
  ),
}

test('a day without games shows the next kickoff over a resting board', async ({ page }) => {
  await mockEspn(page)
  await page.clock.setFixedTime(new Date('2026-09-19T12:00:00Z')) // Saturday, no NFL games
  await page.route(SCOREBOARD_API, (route) => route.fulfill({ json: nothingLive }))
  await page.goto('./')
  const card = page.getByRole('region', { name: 'Up next' })
  await expect(card).toContainText(/Sunday 20 Sept?/) // Safari: "Sep", Chromium: "Sept"
  await expect(card).toContainText('in 1d 8h')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16) // board still there
})

test('game day before kickoff (nothing live) shows "Up next"', async ({ page }) => {
  await mockEspn(page)
  await page.clock.setFixedTime(new Date('2026-09-20T20:00:00Z')) // Sunday 22:00 Prague
  await page.route(SCOREBOARD_API, (route) => route.fulfill({ json: nothingLive }))
  await page.goto('./')
  const card = page.getByRole('region', { name: 'Up next' })
  await expect(card).toContainText('22:25')
  await expect(card).toContainText('in 25m')
})

test('while a game is live there is no card', async ({ page }) => {
  await mockEspn(page)
  await page.clock.setFixedTime(new Date('2026-09-20T20:00:00Z'))
  await page.goto('./')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
  await expect(page.getByRole('region', { name: 'Up next' })).toHaveCount(0)
})
