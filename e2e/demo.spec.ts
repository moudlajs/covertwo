import { expect, test } from '@playwright/test'
import { blockAnalytics } from './mock-espn'

test('?demo shows built-in live data without calling the API', async ({ page }) => {
  const apiCalls: string[] = []
  page.on('request', (r) => {
    if (/api\.test|workers\.dev|espn\.com\/apis/.test(r.url())) apiCalls.push(r.url())
  })
  await page.route(/espncdn\.com/, (route) => route.abort()) // logos not needed here
  await blockAnalytics(page)
  await page.goto('./?demo')
  const main = page.getByRole('main')
  await expect(main.getByRole('listitem')).toHaveCount(16)
  await expect(main.getByText('Q3 · 8:42', { exact: true })).toBeVisible()
  await expect(main.getByText('FOX · in 25m', { exact: true })).toBeVisible() // frozen demo clock
  await expect(page.getByRole('region', { name: 'Up next' })).toHaveCount(0) // games are live
  await expect(page.getByRole('button', { name: 'Next week' })).toHaveCount(0) // no picker in demo
  expect(apiCalls).toEqual([])
})

test('demo mode has no badge: the header stays as in normal use', async ({ page }) => {
  await page.goto('./?demo')
  await expect(page.getByRole('main').getByRole('listitem').first()).toBeVisible()
  await expect(page.getByText('DEMO', { exact: true })).toHaveCount(0)
})
