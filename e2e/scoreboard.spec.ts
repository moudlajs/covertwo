import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test.beforeEach(async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
})

test('renders one row per fixture game', async ({ page }) => {
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('listitem')).toHaveCount(16)
})

test('shows final, live and scheduled states', async ({ page }) => {
  const games = page.getByRole('list', { name: 'Games' })
  await expect(games.getByText('Final/OT')).toBeVisible()
  await expect(games.getByText('Q3 · 8:42')).toBeVisible()
  await expect(games.getByText('Halftime')).toBeVisible()
  await expect(games.getByText('22:25')).toBeVisible()
})
