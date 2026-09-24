import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('college: Top 25 by default, All FBS on demand, ranks shown', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  await expect(page.getByRole('group', { name: 'College games' })).toHaveCount(0) // NFL: no bar

  await page.getByText('NCAA', { exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Top 25' })).toBeChecked()
  const mia = page.getByRole('button', { name: /^No\. 5 Miami Hurricanes 33/ })
  await expect(mia).toBeVisible()

  const fbs = page.waitForRequest(/api\.test\/ncaaf\/scoreboard\?groups=80/)
  await page.getByText('All FBS', { exact: true }).click()
  await fbs
  await page.reload()
  await expect(page.getByRole('radio', { name: 'All FBS' })).toBeChecked()
})

test('college day headings stick flush under the pinned header', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  await page.getByText('NCAA', { exact: true }).click()
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(22)
  const saturday = page.getByRole('heading', { level: 2, name: /Saturday/ })
  const top = await saturday.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
  await page.evaluate((y) => window.scrollTo(0, y + 200), top)
  // Flush against the pinned header block: no gap for rows to show through.
  const block = await page.getByTestId('pinned-header').boundingBox()
  const heading = await saturday.boundingBox()
  expect(heading?.y).toBe((block?.y ?? 0) + (block?.height ?? 0))
})
