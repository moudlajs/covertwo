// Captures the chosen design (variant D) at mobile and desktop widths.
// Run: node design/screenshot.ts  (starts its own Vite dev server)
// Logos load from the real ESPN CDN; this is a local tool, never run in CI.
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const server = await createServer({ server: { port: 5199, strictPort: true } })
await server.listen()
const base = 'http://localhost:5199/covertwo/design/index.html'
const browser = await chromium.launch()

for (const v of ['d']) {
  for (const [name, width, height, scale] of [
    ['mobile', 390, 844, 3],
    ['desktop', 1280, 800, 1],
  ] as const) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale })
    await page.goto(base, { waitUntil: 'networkidle' })
    // Grow the viewport to the page height instead of `fullPage`, so the
    // fixed background covers the whole capture.
    const full = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.setViewportSize({ width, height: Math.max(height, full) })
    await page.screenshot({ path: `design/screenshots/${v}-${name}.png` })
    await page.setViewportSize({ width, height })
    // Same header with the reserved NFL/NCAA toggle revealed.
    await page.goto(`${base}?league`, { waitUntil: 'networkidle' })
    await page.locator('header').screenshot({ path: `design/screenshots/${v}-${name}-league.png` })
    await page.close()
  }
}

await browser.close()
await server.close()
