import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

// Heading 0 is the pinned favourite (Ravens); 1 is the first day.
test('EU/US toggle changes times and day grouping, and survives a reload', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const main = page.getByRole('main')
  await expect(main.getByText('22:25', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 }).nth(1)).toHaveText(/Friday 18 Sept?/)

  await page.getByText('US', { exact: true }).click()
  await expect(main.getByText('4:25 PM', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 }).nth(1)).toHaveText(/Thursday, Sep 17/)

  await page.reload()
  await expect(page.getByRole('radio', { name: 'US' })).toBeChecked()
  await expect(main.getByText('4:25 PM', { exact: true })).toBeVisible()
})
