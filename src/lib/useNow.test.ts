import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useNow } from './useNow'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-20T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

test('starts at the current time and ticks every interval', () => {
  const { result } = renderHook(() => useNow(60_000))
  const start = Date.parse('2026-09-20T12:00:00Z')
  expect(result.current).toBe(start)
  act(() => vi.advanceTimersByTime(59_000))
  expect(result.current).toBe(start) // not yet
  act(() => vi.advanceTimersByTime(1_000))
  expect(result.current).toBe(start + 60_000)
})

test('stops ticking after unmount', () => {
  const { unmount } = renderHook(() => useNow(60_000))
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
