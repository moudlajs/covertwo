import { expect, test } from 'vitest'
import { formatTime } from './format'

test('EU is Prague time, 24h', () => {
  expect(formatTime('2026-09-20T20:25:00Z', 'eu')).toBe('22:25')
  expect(formatTime('2026-09-21T00:20:00Z', 'eu')).toBe('02:20')
})

test('US is New York time, 12h', () => {
  expect(formatTime('2026-09-20T20:25:00Z', 'us')).toBe('4:25 PM')
  expect(formatTime('2026-09-21T00:20:00Z', 'us')).toBe('8:20 PM')
})
