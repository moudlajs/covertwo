import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('link preview tags, with an image that exists', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const meta = (key: string) =>
    page.locator(`meta[property="${key}"], meta[name="${key}"]`).getAttribute('content')
  expect(await meta('og:title')).toBe('covertwo')
  expect(await meta('og:description')).toMatch(/NFL and college football/)
  expect(await meta('og:url')).toBe('https://moudlajs.github.io/covertwo/')
  expect(await meta('twitter:card')).toBe('summary_large_image')
  const image = await meta('og:image')
  expect(image).toBe('https://moudlajs.github.io/covertwo/og.png')
  // Served by this build under the same path (the absolute URL is the live site).
  const res = await page.request.get(new URL('og.png', page.url()).href)
  expect(res.ok()).toBe(true)
  expect(res.headers()['content-type']).toContain('image/png')
})
