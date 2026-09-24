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

test('the page never scrolls; the game list scrolls inside the panel', async ({ page }) => {
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
  const { pageOverflow, listOverflow } = await page.evaluate(() => {
    const main = document.querySelector('main')
    const root = document.documentElement
    return {
      pageOverflow: root.scrollHeight - root.clientHeight,
      listOverflow: main ? main.scrollHeight - main.clientHeight : 0,
    }
  })
  expect(pageOverflow).toBe(0)
  expect(listOverflow).toBeGreaterThan(0)
  await expect(page.getByRole('banner')).toBeInViewport()
  await expect(page.getByRole('contentinfo')).toBeInViewport()
})

test('day headings stick to the top of the list while scrolling', async ({ page }) => {
  const main = page.getByRole('main')
  await expect(main.getByRole('listitem')).toHaveCount(16)
  await main.evaluate((el) => el.scrollBy(0, 300)) // well into Sunday's games
  const sunday = page.getByRole('heading', { level: 2, name: /Sunday/ })
  const [mainBox, headingBox] = [await main.boundingBox(), await sunday.boundingBox()]
  expect(Math.abs((headingBox?.y ?? -99) - (mainBox?.y ?? 0))).toBeLessThanOrEqual(1)
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

test('keyboard users can tab to the game list and scroll it', async ({ page }) => {
  const main = page.getByRole('main')
  await expect(main.getByRole('listitem')).toHaveCount(16)
  for (let i = 0; i < 5 && !(await main.evaluate((el) => el === document.activeElement)); i++)
    await page.keyboard.press('Tab')
  await expect(main).toBeFocused()
  await page.keyboard.press('PageDown')
  await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
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
