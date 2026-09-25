import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('installable: a valid manifest with icons that load', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()
  const url = new URL(href ?? '', page.url())
  const res = await page.request.get(url.href)
  expect(res.ok()).toBe(true)
  const manifest = await res.json()
  expect(manifest).toMatchObject({
    name: 'covertwo',
    short_name: 'covertwo',
    start_url: './',
    scope: './',
    display: 'standalone',
  })
  // Chrome's install criteria: a 192 and a 512 icon; Android also gets a maskable one.
  const sizes = manifest.icons.map(
    (i: { sizes: string; purpose: string }) => `${i.sizes} ${i.purpose}`,
  )
  expect(sizes).toEqual(expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']))
  for (const icon of manifest.icons) {
    const img = await page.request.get(new URL(icon.src, url).href)
    expect(img.ok(), icon.src).toBe(true)
    expect(img.headers()['content-type']).toContain('image/png')
  }
})

test('favicon and home-screen icon load', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  for (const selector of ['link[rel="icon"][sizes="32x32"]', 'link[rel="apple-touch-icon"]']) {
    const href = await page.locator(selector).getAttribute('href')
    const res = await page.request.get(new URL(href ?? '', page.url()).href)
    expect(res.ok(), selector).toBe(true)
  }
})
