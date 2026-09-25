import { expect, test, type Page } from '@playwright/test'
import { mockEspn } from './mock-espn'

const html = (page: Page) => page.locator('html')
const panelBg = (page: Page) =>
  page
    .getByRole('main')
    .evaluate((el) => (el.parentElement ? getComputedStyle(el.parentElement).backgroundColor : ''))

test.beforeEach(async ({ page }) => {
  await mockEspn(page)
})

test('follows a light system, with normal logos', async ({ page }, info) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('./')
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
  expect(await panelBg(page)).toBe('rgb(255, 255, 255)')
  await expect(page.locator('main img').first()).not.toHaveAttribute('src', /500-dark/)
  await info.attach('light', { body: await page.screenshot(), contentType: 'image/png' })
})

test('follows a dark system', async ({ page }, info) => {
  await page.goto('./')
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')
  expect(await panelBg(page)).not.toBe('rgb(255, 255, 255)')
  await info.attach('dark', { body: await page.screenshot(), contentType: 'image/png' })
})

test('the menu choice overrides the system and survives a reload', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('group', { name: 'Theme' }).getByText('Light', { exact: true }).click()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
})

test('no flash: the theme is set before the app script runs', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  // Without the app bundle, only the inline script in index.html can set it.
  await page.route(/\/assets\/.*\.js$/, (route) => route.abort())
  await page.goto('./')
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f3efe6')
})
