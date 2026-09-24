import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('switching to NCAA loads college games and survives a reload', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const games = page.getByRole('main').getByRole('listitem')
  await expect(games).toHaveCount(16)

  await page.getByText('NCAA', { exact: true }).click()
  await expect(page.getByRole('radio', { name: 'NCAA' })).toBeChecked()
  await expect(games).toHaveCount(22)
  await expect(page.getByRole('main')).toContainText('WAKE')

  await page.reload()
  await expect(page.getByRole('radio', { name: 'NCAA' })).toBeChecked()
  await expect(games).toHaveCount(22)

  await page.getByText('NFL', { exact: true }).click()
  await expect(games).toHaveCount(16)
})
