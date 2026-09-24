import { expect, test } from 'vitest'
import { formatAgo } from './ago'

test.each([
  [0, 'just now'],
  [4_999, 'just now'],
  [12_000, '12s ago'],
  [59_999, '59s ago'],
  [60_000, '1m ago'],
  [59 * 60_000, '59m ago'],
  [2 * 3_600_000, '2h ago'],
  [-5_000, 'just now'], // clock skew never shows a negative age
])('%i ms → %s', (ms, text) => {
  expect(formatAgo(ms)).toBe(text)
})
