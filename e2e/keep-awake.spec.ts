import { expect, test } from '@playwright/test'
import { mockEspn } from './mock-espn'

test('keep-screen-on setting: in the menu where supported, remembered', async ({ page }) => {
  await mockEspn(page)
  await page.goto('./')
  const supported = await page.evaluate(() => 'wakeLock' in navigator)
  await page.getByRole('button', { name: 'Menu' }).click()
  const box = page.getByRole('checkbox', { name: /Keep screen on/ })
  if (!supported) {
    await expect(box).toHaveCount(0) // hidden where the browser can't do it
    return
  }
  await expect(box).not.toBeChecked() // off by default
  await box.check()
  await page.reload()
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.getByRole('checkbox', { name: /Keep screen on/ })).toBeChecked()
})
