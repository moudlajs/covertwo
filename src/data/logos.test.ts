import { expect, test } from 'vitest'
import { darkLogo } from './logos'

test('NFL and college logos map to their dark-background variants', () => {
  expect(darkLogo('https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/nyg.png')).toBe(
    'https://a.espncdn.com/i/teamlogos/nfl/500-dark/nyg.png',
  )
  expect(darkLogo('https://a.espncdn.com/i/teamlogos/ncaa/500/213.png')).toBe(
    'https://a.espncdn.com/i/teamlogos/ncaa/500-dark/213.png',
  )
})

test('unknown URLs are left alone', () => {
  expect(darkLogo('https://example.com/logo.png')).toBe('https://example.com/logo.png')
  expect(darkLogo('')).toBe('')
})
