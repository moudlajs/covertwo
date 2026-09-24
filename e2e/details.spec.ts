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

test('an older finished day is folded until tapped', async ({ page }) => {
  await mockEspn(page)
  await page.clock.setFixedTime(new Date('2026-09-22T12:00:00Z')) // Tuesday: Friday is old and final
  await page.goto('./')
  const friday = page.getByRole('button', { name: /Friday 18/ })
  await expect(friday).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('button', { name: /^Detroit Lions 31/ })).toBeHidden()
  await friday.click()
  await expect(page.getByRole('button', { name: /^Detroit Lions 31/ })).toBeVisible()
})
