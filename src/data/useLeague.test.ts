import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { useLeague } from './useLeague'

afterEach(() => localStorage.clear())

test('defaults to NFL, persists NCAA', () => {
  const { result } = renderHook(() => useLeague())
  expect(result.current[0]).toBe('nfl')
  act(() => result.current[1]('ncaaf'))
  expect(renderHook(() => useLeague()).result.current[0]).toBe('ncaaf')
})
