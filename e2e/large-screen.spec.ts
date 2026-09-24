import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test.describe('panel size by screen', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop viewports only')

  for (const [name, viewport, width] of [
    ['laptop (MacBook)', { width: 1512, height: 982 }, 560],
    ['large monitor', { width: 2560, height: 1300 }, 700],
    ['4K at 100%', { width: 3840, height: 2000 }, 840],
  ] as const) {
    test(`${name}: panel is ${width}px wide`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await mockEspn(page)
      await page.goto('./')
      await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
      const box = await page.getByTestId('panel').boundingBox()
      expect(Math.round(box?.width ?? 0)).toBe(width)
    })
  }

  test('large monitor: day headings still stick flush under the header', async ({ page }) => {
    // Large enough to scale; the college slate (22 games) is long enough to scroll.
    await page.setViewportSize({ width: 2560, height: 1050 })
    await mockEspn(page)
    await page.goto('./')
    await page.getByText('NCAA', { exact: true }).click()
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(22)
    const saturday = page.getByRole('heading', { level: 2, name: /^Saturday/ })
    const top = await saturday.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
    await page.evaluate((y) => window.scrollTo(0, y + 100), top)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    const block = await page.getByTestId('pinned-header').boundingBox()
    const heading = await saturday.boundingBox()
    expect(Math.abs((heading?.y ?? 0) - ((block?.y ?? 0) + (block?.height ?? 0)))).toBeLessThan(0.5)
  })

  test('4K at 100%: the scaled NFL week still fits without scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 3840, height: 2000 })
    await mockEspn(page)
    await page.goto('./')
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
