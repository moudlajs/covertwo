import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('tapping a finished game shows quarter scores and leaders', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const det = page.getByRole('button', { name: /^Detroit Lions 31/ })
  await det.click()
  await expect(det).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('table', { name: 'Score by quarter' })).toBeVisible()
  await expect(page.getByText('J. Goff')).toBeVisible()
  await det.click()
  await expect(page.getByRole('table')).toBeHidden()
})
