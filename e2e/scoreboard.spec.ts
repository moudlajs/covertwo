import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test.beforeEach(async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
})

test('renders one row per fixture game, grouped by day', async ({ page }) => {
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    /Friday 18 Sept/,
    /Sunday 20 Sept/,
    /Monday 21 Sept/,
    /Tuesday 22 Sept/,
  ])
})

test('shows final, live and scheduled states', async ({ page }) => {
  const games = page.getByRole('main')
  await expect(games.getByText('Final/OT', { exact: true })).toBeVisible()
  await expect(games.getByText('Q3 · 8:42', { exact: true })).toBeVisible()
  await expect(games.getByText('Halftime', { exact: true })).toBeVisible()
  await expect(games.getByText('22:25', { exact: true })).toBeVisible()
})

test('footer shows when the data was last updated', async ({ page }) => {
  await expect(page.getByRole('contentinfo')).toContainText('updated just now')
})
