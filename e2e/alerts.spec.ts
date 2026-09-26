import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('the bell opens the alerts panel, which says what this browser can do', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const bell = page.getByRole('button', { name: 'Alerts' })
  await bell.click()
  const panel = page.getByRole('region', { name: 'Alerts' })
  await expect(panel).toBeVisible()
  // The e2e browsers run without a service worker, as iPhone Safari (no push in a tab),
  // or as headless Chrome, which reports notifications as blocked.
  await expect(panel).toContainText(/Add to Home Screen|can't show alerts|blocked|On this device/)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})

for (const width of [360, 393]) {
  test(`the alerts panel stays on screen at ${width}px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'phone layout')
    await mockEspn(page)
    await page.setViewportSize({ width, height: 780 })
    await page.goto('./')
    await page.getByRole('button', { name: 'Alerts' }).click()
    const box = await page.getByRole('region', { name: 'Alerts' }).boundingBox()
    if (!box) throw new Error('no panel')
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
  })
}
