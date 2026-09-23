import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { useTimeMode } from './useTimeMode'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

test('defaults to EU', () => {
  expect(renderHook(() => useTimeMode()).result.current[0]).toBe('eu')
})

test('persists the choice and restores it', () => {
  const first = renderHook(() => useTimeMode())
  act(() => first.result.current[1]('us'))
  expect(localStorage.getItem('covertwo:time-mode')).toBe('us')
  expect(renderHook(() => useTimeMode()).result.current[0]).toBe('us')
})

test('ignores garbage in storage', () => {
  localStorage.setItem('covertwo:time-mode', 'mars')
  expect(renderHook(() => useTimeMode()).result.current[0]).toBe('eu')
})

test('falls back to EU when storage throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  const { result } = renderHook(() => useTimeMode())
  expect(result.current[0]).toBe('eu')
  act(() => result.current[1]('us'))
  expect(result.current[0]).toBe('us')
})
