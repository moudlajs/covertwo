import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('keep-screen-on: a header button where supported, remembered', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const supported = await page.evaluate(() => 'wakeLock' in navigator)
  const button = page.getByRole('button', { name: 'Keep screen on while covertwo is open' })
  if (!supported) {
    await expect(button).toHaveCount(0) // hidden where the browser can't do it
    return
  }
  await expect(button).toHaveAttribute('aria-pressed', 'false') // off by default
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Screen stays on while covertwo is open')).toBeVisible()
  await page.reload()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
})
