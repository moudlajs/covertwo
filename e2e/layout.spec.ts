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
