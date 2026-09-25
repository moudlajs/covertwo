import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { THEME_KEY, useTheme } from './theme'

// A controllable prefers-color-scheme (jsdom has no matchMedia).
let systemLight = false

beforeEach(() => {
  localStorage.clear()
  systemLight = false
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return systemLight
    },
  }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
})

test('the first visit follows the system', () => {
  systemLight = true
  expect(renderHook(() => useTheme()).result.current[0]).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('a choice overrides the system and is remembered', () => {
  systemLight = true
  const { result, unmount } = renderHook(() => useTheme())
  act(() => result.current[1]('dark'))
  expect(result.current[0]).toBe('dark')
  expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  unmount()
  expect(renderHook(() => useTheme()).result.current[0]).toBe('dark')
})

test('an old "system" value falls back to the system', () => {
  localStorage.setItem(THEME_KEY, 'system')
  systemLight = true
  expect(renderHook(() => useTheme()).result.current[0]).toBe('light')
})

test('sets the browser UI colour', () => {
  const meta = document.createElement('meta')
  meta.name = 'theme-color'
  document.head.append(meta)
  const { result } = renderHook(() => useTheme())
  act(() => result.current[1]('light'))
  expect(meta.content).toBe('#f3efe6')
  meta.remove()
})
