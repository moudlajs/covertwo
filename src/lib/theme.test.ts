import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { THEME_KEY, useTheme } from './theme'

// A controllable prefers-color-scheme (jsdom has no matchMedia).
let systemLight = false
const listeners = new Set<() => void>()
function setSystem(light: boolean) {
  systemLight = light
  listeners.forEach((l) => l())
}

beforeEach(() => {
  localStorage.clear()
  systemLight = false
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return systemLight
    },
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  listeners.clear()
  delete document.documentElement.dataset.theme
})

test('follows the system by default, live', () => {
  const { result } = renderHook(() => useTheme())
  expect(result.current).toMatchObject({ choice: 'system', theme: 'dark' })
  expect(document.documentElement.dataset.theme).toBe('dark')
  act(() => setSystem(true))
  expect(result.current.theme).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('a manual choice overrides the system and is remembered', () => {
  systemLight = true
  const { result, unmount } = renderHook(() => useTheme())
  act(() => result.current.setChoice('dark'))
  expect(result.current.theme).toBe('dark')
  expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  unmount()
  expect(renderHook(() => useTheme()).result.current).toMatchObject({
    choice: 'dark',
    theme: 'dark',
  })
})

test('sets the browser UI colour', () => {
  const meta = document.createElement('meta')
  meta.name = 'theme-color'
  document.head.append(meta)
  const { result } = renderHook(() => useTheme())
  act(() => result.current.setChoice('light'))
  expect(meta.content).toBe('#f3efe6')
  meta.remove()
})
