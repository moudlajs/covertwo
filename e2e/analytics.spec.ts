import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('Cloudflare Web Analytics beacon is on the page, deferred, and never called in tests', async ({
  page,
}) => {
  const reached: string[] = []
  page.on('requestfinished', (r) => {
    if (/cloudflareinsights\.com/.test(r.url())) reached.push(r.url())
  })
  await mockEspn(page)
  await page.goto('./')
  const beacon = page.locator('script[src="https://static.cloudflareinsights.com/beacon.min.js"]')
  await expect(beacon).toHaveCount(1)
  await expect(beacon).toHaveAttribute('defer', '')
  await expect(beacon).toHaveAttribute('data-cf-beacon', /"token"/)
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(16)
  expect(reached).toEqual([])
})
