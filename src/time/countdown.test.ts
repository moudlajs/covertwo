import { expect, test } from 'vitest'
import { formatCountdown } from './countdown'

const m = 60_000
test.each([
  [2 * 1440 * m + 3 * 60 * m + 20 * m, 'in 2d 3h'],
  [2 * 60 * m + 14 * m, 'in 2h 14m'],
  [60 * m, 'in 1h 0m'],
  [14 * m + 59_000, 'in 14m'],
  [30_000, 'in <1m'],
  [0, 'starting'],
  [-5 * m, 'starting'], // kickoff passed, ESPN hasn't flipped to live yet
])('%i ms → %s', (ms, text) => {
  expect(formatCountdown(ms)).toBe(text)
})
