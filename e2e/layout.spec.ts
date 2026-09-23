import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test.beforeEach(async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
})

test('panel is compact on desktop and nearly full width on mobile', async ({ page }) => {
  const viewport = page.viewportSize()
  const box = await page.getByTestId('panel').boundingBox()
  if (!viewport || !box) throw new Error('no layout')
  if (viewport.width >= 1024) {
    expect(box.width).toBeLessThanOrEqual(560)
    expect(box.x).toBeGreaterThan(200) // centred, not stretched
  } else {
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 24)
  }
})

test('page never scrolls horizontally', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})
