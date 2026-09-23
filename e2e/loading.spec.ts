import { expect, test } from '@playwright/test'
import scoreboard from '../fixtures/espn-scoreboard.json' with { type: 'json' }
import { mockEspn, SCOREBOARD_API } from './mock-espn'

test('skeleton rows match real row height, then real rows replace them', async ({ page }) => {
  await mockEspn(page)
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  await page.route(SCOREBOARD_API, async (route) => {
    await gate
    await route.fulfill({ json: scoreboard })
  })
  await page.goto('./')

  const skeleton = page.getByTestId('skeleton')
  await expect(skeleton).toHaveAttribute('aria-busy', 'true')
  const placeholder = await skeleton.getByRole('listitem').first().boundingBox()

  release()
  await expect(skeleton).toBeHidden()
  const row = await page.getByRole('main').getByRole('listitem').first().boundingBox()
  expect(Math.abs((placeholder?.height ?? 0) - (row?.height ?? -99))).toBeLessThanOrEqual(1)
})

test('an empty week says so', async ({ page }) => {
  await mockEspn(page)
  await page.route(SCOREBOARD_API, (route) =>
    route.fulfill({ json: { ...scoreboard, events: [] } }),
  )
  await page.goto('./')
  await expect(page.getByText('No games scheduled.')).toBeVisible()
})
