import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { useFavorites } from './useFavorites'

afterEach(() => localStorage.clear())

test('defaults: Ravens in the NFL, none in college', () => {
  const [favorites] = renderHook(() => useFavorites()).result.current
  expect(favorites).toEqual({ nfl: { id: '33', name: 'Baltimore Ravens' }, ncaaf: null })
})

test('persists per league', () => {
  const { result } = renderHook(() => useFavorites())
  act(() => result.current[1]('ncaaf', { id: '2390', name: 'Miami Hurricanes' }))
  act(() => result.current[1]('nfl', null))
  expect(renderHook(() => useFavorites()).result.current[0]).toEqual({
    nfl: null,
    ncaaf: { id: '2390', name: 'Miami Hurricanes' },
  })
})

test('garbage in storage falls back to the defaults', () => {
  localStorage.setItem('covertwo:favorites', '{"nfl": 42, "ncaaf": "x"')
  expect(renderHook(() => useFavorites()).result.current[0].nfl?.id).toBe('33')
  localStorage.setItem('covertwo:favorites', '{"nfl": {"id": 1}, "ncaaf": null}')
  expect(renderHook(() => useFavorites()).result.current[0].nfl?.id).toBe('33')
})
