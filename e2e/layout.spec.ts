import { expect, test } from '@playwright/test'
import { mockEspn, SCOREBOARD_API } from './mock-espn'

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

test('open menu stays inside the viewport', async ({ page }) => {
  await page.getByRole('button', { name: 'Menu' }).click()
  const link = page.getByRole('link', { name: 'Source on GitHub' })
  await expect(link).toBeVisible()
  const box = await link.boundingBox()
  const viewport = page.viewportSize()
  if (!box || !viewport) throw new Error('no layout')
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
})

test('menu is not clipped by the panel while it is still loading', async ({ page }) => {
  await page.route(SCOREBOARD_API, () => {}) // never answers: stays in the loading state
  await page.reload()
  await expect(page.getByTestId('skeleton')).toBeVisible()
  await page.getByRole('button', { name: 'Menu' }).click()
  const dropdown = page.getByRole('link', { name: 'Source on GitHub' }).locator('..')
  const box = await dropdown.boundingBox()
  if (!box) throw new Error('no dropdown box')
  // Just inside the dropdown's bottom edge: if an ancestor clips it, the
  // topmost element there belongs to something else.
  const inside = await dropdown.evaluate(
    (el, [x, y]) => el.contains(document.elementFromPoint(x, y)),
    [box.x + 8, box.y + box.height - 0.5] as const,
  )
  expect(inside).toBe(true)
})
