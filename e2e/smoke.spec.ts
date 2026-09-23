import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test.beforeEach(async ({ page }) => {
  await mockEspn(page)
})

test('app loads and shows the title', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'covertwo' })).toBeVisible()
})
