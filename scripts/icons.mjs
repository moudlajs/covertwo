// Renders the icon PNGs in public/icons/ from the SVG sources in design/icons/.
// The SVGs use Anton from Google Fonts, so this needs the network once.
// Usage: npm run icons
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const OUT = 'public/icons'
// [source, output, size, corner radius as a share of the size]
const ICONS = [
  ['poster.svg', 'icon-192.png', 192, 0],
  ['poster.svg', 'icon-512.png', 512, 0],
  ['poster-maskable.svg', 'icon-maskable-512.png', 512, 0],
  ['poster.svg', 'apple-touch-icon.png', 180, 0], // iOS rounds it itself
  ['c2.svg', 'favicon-32.png', 32, 0.2],
  ['c2.svg', 'favicon-16.png', 16, 0.2],
]

const browser = await chromium.launch()
for (const [source, output, size, radius] of ICONS) {
  const svg = readFileSync(`design/icons/${source}`, 'utf8')
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&display=swap">
     <style>html,body{margin:0;background:transparent}
     div{width:${size}px;height:${size}px;border-radius:${radius * size}px;overflow:hidden}
     svg{display:block;width:100%;height:100%}</style><div>${svg}</div>`,
  )
  await page.evaluate(() => document.fonts.load('150px Anton').then(() => document.fonts.ready))
  await page.locator('div').screenshot({ path: `${OUT}/${output}`, omitBackground: true })
  await page.close()
  console.log(`${OUT}/${output}`)
}
await browser.close()
