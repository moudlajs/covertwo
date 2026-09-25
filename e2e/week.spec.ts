import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('week picker: step, jump, and back to the current week on league switch', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const week = page.getByRole('combobox', { name: 'Week' })
  await expect(week).toHaveValue('2:2') // the fixture's current week

  const next = page.waitForRequest(/nfl\/scoreboard\?seasontype=2&week=3$/)
  await page.getByRole('button', { name: 'Next week' }).click()
  await next
  await expect(week).toHaveValue('2:3')

  const superBowl = page.waitForRequest(/nfl\/scoreboard\?seasontype=3&week=5$/)
  await week.selectOption({ label: 'Super Bowl' })
  await superBowl
  await expect(page.getByRole('button', { name: 'Next week' })).toBeDisabled()

  await page.getByText('NCAA', { exact: true }).click()
  await page.getByText('NFL', { exact: true }).click()
  await expect(week).toHaveValue('2:2') // league switch → current week again
})

test('another week shows no next-up card or resting board', async ({ page }) => {
  await mockEspn(page)
  await page.clock.setFixedTime(new Date('2026-09-19T12:00:00Z')) // an off day in the current week
  await page.goto('./')
  await page.getByRole('button', { name: 'Previous week' }).click()
  await expect(page.getByRole('combobox', { name: 'Week' })).toHaveValue('2:1')
  await expect(page.getByRole('region', { name: /No games today|Up next/ })).toHaveCount(0)
})

test('the week picker sits at the right end of the league row', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const league = await page.getByRole('group', { name: 'League' }).boundingBox()
  const next = await page.getByRole('button', { name: 'Next week' }).boundingBox()
  const header = await page.getByTestId('pinned-header').boundingBox()
  if (!league || !next || !header) throw new Error('no layout')
  expect(next.x).toBeGreaterThan(league.x + league.width)
  // Right-aligned: its right edge sits within the row's right padding.
  expect(header.x + header.width - (next.x + next.width)).toBeLessThan(20)
})

test('on college the picker and the Top 25 toggle fit in one row', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  await page.getByText('NCAA', { exact: true }).click()
  const row = await page.getByRole('group', { name: 'League' }).boundingBox()
  const prev = await page.getByRole('button', { name: 'Previous week' }).boundingBox()
  const view = await page.getByRole('group', { name: 'College games' }).boundingBox()
  const header = await page.getByTestId('pinned-header').boundingBox()
  if (!row || !prev || !view || !header) throw new Error('no layout')
  // Same line, in order, nothing past the panel's edge.
  expect(Math.abs(prev.y + prev.height / 2 - (view.y + view.height / 2))).toBeLessThan(4)
  expect(prev.x).toBeGreaterThan(row.x + row.width)
  expect(view.x + view.width).toBeLessThanOrEqual(header.x + header.width)
})
