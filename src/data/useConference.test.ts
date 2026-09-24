import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { useConference } from './useConference'

afterEach(() => localStorage.clear())

test('defaults to all conferences, persists a choice, ignores unknown ids', () => {
  const { result } = renderHook(() => useConference())
  expect(result.current[0]).toBe('all')
  act(() => result.current[1]('8'))
  expect(renderHook(() => useConference()).result.current[0]).toBe('8')
  localStorage.setItem('covertwo:conference', '999')
  expect(renderHook(() => useConference()).result.current[0]).toBe('all')
})
