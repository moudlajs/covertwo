import { createContext, useEffect, useSyncExternalStore } from 'react'
import { usePersistedChoice } from './usePersistedChoice'

export type Theme = 'light' | 'dark'
export type ThemeChoice = 'system' | Theme

/** Also read by the inline script in index.html, which sets the theme before first paint. */
export const THEME_KEY = 'covertwo:theme'
const CHOICES = ['system', 'light', 'dark'] as const satisfies readonly ThemeChoice[]
const LIGHT = '(prefers-color-scheme: light)'
/** Browser UI colour per theme: the page background. */
const THEME_COLOR: Record<Theme, string> = { dark: '#0b1020', light: '#f3efe6' }

function subscribe(onChange: () => void) {
  const query = window.matchMedia?.(LIGHT)
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}
const systemTheme = (): Theme => (window.matchMedia?.(LIGHT).matches ? 'light' : 'dark')

/**
 * The theme choice (System by default, persisted) and the theme it resolves
 * to, which is applied to <html data-theme> and follows system changes live.
 */
export function useTheme() {
  const [choice, setChoice] = usePersistedChoice<ThemeChoice>(THEME_KEY, CHOICES, 'system')
  const system = useSyncExternalStore(subscribe, systemTheme, (): Theme => 'dark')
  const theme = choice === 'system' ? system : choice
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])
  return { choice, setChoice, theme }
}

/** The resolved theme, for the few things CSS can't switch (logo images). */
export const ThemeContext = createContext<Theme>('dark')
