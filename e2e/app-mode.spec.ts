import { expect, test, type Page } from '@playwright/test'
import { mockEspn } from './mock-espn'

/** Pretend to be launched from the iPhone home screen (what iOS reports). */
const launchFromHomeScreen = (page: Page) =>
  page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }))

const panelBox = async (page: Page) => {
  const panel = page.getByTestId('panel')
  const box = await panel.boundingBox()
  const radius = await panel.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
  if (!box) throw new Error('no panel')
  return { ...box, radius }
}

test('from the home screen on a phone: the panel fills the screen', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phone layout')
  await launchFromHomeScreen(page)
  await mockEspn(page)
  await page.goto('./')
  await expect(page.locator('html')).toHaveAttribute('data-display', 'app')
  const box = await panelBox(page)
  expect(box.x).toBe(0)
  expect(box.width).toBe(page.viewportSize()?.width)
  expect(box.radius).toBe('0px')
})

test('in a browser tab the floating panel stays', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  await expect(page.locator('html')).not.toHaveAttribute('data-display', 'app')
  const box = await panelBox(page)
  expect(box.x).toBeGreaterThan(0)
  expect(box.radius).not.toBe('0px')
})

test('as an app on a wide screen (tablet) the floating panel stays too', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'wide layout')
  await launchFromHomeScreen(page)
  await mockEspn(page)
  await page.goto('./')
  await expect(page.locator('html')).toHaveAttribute('data-display', 'app') // detected, just wide
  expect((await panelBox(page)).radius).not.toBe('0px')
})
