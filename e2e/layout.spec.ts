import { expect, test } from '@playwright/test'
import scoreboard from '../fixtures/espn-scoreboard.json' with { type: 'json' }
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

test('the header fits a 360px phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phone layout')
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('./')
  const header = page.getByRole('banner')
  const fits = await header.evaluate((el) => el.scrollWidth <= el.clientWidth)
  expect(fits).toBe(true)
  // EU/US ends the row, inside the screen.
  const zone = await page.getByRole('group', { name: 'Time zone' }).boundingBox()
  if (!zone) throw new Error('no time zone toggle')
  expect(zone.x + zone.width).toBeLessThanOrEqual(360)
})

test('the footer has the version and a link to the source', async ({ page }) => {
  const footer = page.getByRole('contentinfo')
  await expect(footer).toContainText(/v\d+\.\d+\.\d+|vdev/)
  await expect(footer.getByRole('link', { name: 'source' })).toHaveAttribute(
    'href',
    'https://github.com/moudlajs/covertwo',
  )
})

test('a short week keeps a short panel pinned at the top', async ({ page }) => {
  const firstPanel = await page.getByTestId('panel').boundingBox()
  await page.route(SCOREBOARD_API, (route) =>
    route.fulfill({ json: { ...scoreboard, events: scoreboard.events.slice(0, 1) } }),
  )
  await page.reload()
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(1)
  const panel = await page.getByTestId('panel').boundingBox()
  const viewport = page.viewportSize()
  if (!panel || !firstPanel || !viewport) throw new Error('no layout')
  expect(panel.y).toBe(firstPanel.y) // same top margin as a full week
  expect(panel.height).toBeLessThan(viewport.height / 2)
})

test('rows keep aligned columns whatever the status line says', async ({ page }) => {
  const rows = page.getByRole('main').getByRole('listitem')
  await expect(rows).toHaveCount(16)
  const centres = await rows.evaluateAll((lis) =>
    lis.map((li) => {
      const r = li.querySelector('[data-centre]')?.getBoundingClientRect()
      return r ? [Math.round(r.x), Math.round(r.width)] : null
    }),
  )
  expect(new Set(centres.map((c) => JSON.stringify(c))).size).toBe(1)
})

test('the page scrolls; header and footer stay pinned, no nested scroll area', async ({ page }) => {
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
  const main = page.getByRole('main')
  expect(await main.evaluate((el) => getComputedStyle(el).overflowY)).toBe('visible')
  // Halfway down the page: past the panel's top, well before its end.
  await page.evaluate(() =>
    window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) / 2),
  )
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const header = await page.getByRole('banner').boundingBox()
  const footer = await page.getByRole('contentinfo').boundingBox()
  const viewport = page.viewportSize()
  if (!header || !footer || !viewport) throw new Error('no layout')
  expect(header.y).toBeLessThanOrEqual(2) // pinned to the top edge
  expect(Math.round(footer.y + footer.height)).toBe(viewport.height) // pinned to the bottom
})

test('day headings stick just under the pinned header', async ({ page }) => {
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
  const sunday = page.getByRole('heading', { level: 2, name: /^Sunday/ })
  const top = await sunday.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
  await page.evaluate((y) => window.scrollTo(0, y + 200), top) // well into Sunday
  // Flush against the pinned header block: no gap for rows to show through.
  const block = await page.getByTestId('pinned-header').boundingBox()
  const heading = await sunday.boundingBox()
  expect(heading?.y).toBe((block?.y ?? 0) + (block?.height ?? 0))
})

test('on a short week the status message sits right above the footer', async ({ page }) => {
  await page.route(SCOREBOARD_API, (route) =>
    route.fulfill({ json: { ...scoreboard, events: scoreboard.events.slice(0, 1) } }),
  )
  await page.reload()
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(1)
  await page.getByLabel('Favourite team').selectOption({ label: 'Dallas Cowboys' })
  const toast = page.getByTestId('toast').getByText('Dallas Cowboys pinned to the top')
  await expect(toast).toBeVisible()
  const t = await toast.boundingBox()
  const f = await page.getByRole('contentinfo').boundingBox()
  if (!t || !f) throw new Error('no layout')
  expect(t.y + t.height).toBeLessThanOrEqual(f.y)
  expect(f.y - (t.y + t.height)).toBeLessThan(16)
})

test('on a 360px phone no team abbreviation or status line is cut off', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phone layout')
  await page.setViewportSize({ width: 360, height: 780 })
  await page.reload()
  await expect(page.getByRole('main').getByRole('listitem').first()).toBeVisible()
  const cut = await page.evaluate(() =>
    [...document.querySelectorAll('[data-side] .truncate, [data-centre] > *')]
      .filter((el) => el.scrollWidth > el.clientWidth + 0.5)
      .map((el) => el.textContent),
  )
  expect(cut).toEqual([])
})
