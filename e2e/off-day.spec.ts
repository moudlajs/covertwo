import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('a day without games shows the next kickoff over a resting board', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-19T12:00:00Z')) // Saturday, no NFL games
  await mockEspn(page)
  await page.goto('./')
  const card = page.getByRole('region', { name: 'No games today' })
  await expect(card).toContainText('Sunday 20 Sept')
  await expect(card).toContainText('in 1d 8h')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16) // board still there
})

test('game days show no off-day card', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-20T12:00:00Z')) // Sunday
  await mockEspn(page)
  await page.goto('./')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
  await expect(page.getByRole('region', { name: 'No games today' })).toHaveCount(0)
})
