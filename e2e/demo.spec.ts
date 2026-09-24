import { expect, test } from '@playwright/test'

test('?demo shows built-in live data without calling the API', async ({ page }) => {
  const apiCalls: string[] = []
  page.on('request', (r) => {
    if (/api\.test|workers\.dev|espn\.com\/apis/.test(r.url())) apiCalls.push(r.url())
  })
  await page.route(/espncdn\.com/, (route) => route.abort()) // logos not needed here
  await page.goto('./?demo')
  await expect(page.getByText('DEMO', { exact: true })).toBeVisible()
  const main = page.getByRole('main')
  await expect(main.getByRole('listitem')).toHaveCount(16)
  await expect(main.getByText('Q3 · 8:42', { exact: true })).toBeVisible()
  await expect(main.getByText('FOX · in 25m', { exact: true })).toBeVisible() // frozen demo clock
  await expect(page.getByRole('region', { name: 'No games today' })).toHaveCount(0) // a game day
  expect(apiCalls).toEqual([])
})
