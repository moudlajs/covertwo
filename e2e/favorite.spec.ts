import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('Ravens pinned by default; picking another team re-pins and persists', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const first = page.getByRole('heading', { level: 2 }).first()
  await expect(first).toContainText('Baltimore Ravens')
  await expect(page.getByRole('main').getByRole('listitem').first()).toContainText('BAL')

  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByLabel('Favourite team').selectOption({ label: 'Dallas Cowboys' })
  await expect(first).toContainText('Dallas Cowboys')
  await expect(page).toHaveTitle('WSH 23-20 DAL · covertwo') // favourite is live

  await page.reload()
  await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Dallas Cowboys')
})
