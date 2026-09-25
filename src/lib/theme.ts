import { createContext, useEffect } from 'react'
import { usePersistedChoice } from './usePersistedChoice'

export type Theme = 'light' | 'dark'

/** Also read by the inline script in index.html, which sets the theme before first paint. */
export const THEME_KEY = 'covertwo:theme'
const THEMES = ['light', 'dark'] as const satisfies readonly Theme[]
const LIGHT = '(prefers-color-scheme: light)'
/** Browser UI colour per theme: the page background. */
const THEME_COLOR: Record<Theme, string> = { dark: '#0b1020', light: '#f3efe6' }

const systemTheme = (): Theme => (window.matchMedia?.(LIGHT).matches ? 'light' : 'dark')

/**
 * Light or dark, applied to <html data-theme>. The first visit follows the
 * system; after that the choice is remembered (an old "system" value falls
 * back to the system too).
 */
export function useTheme() {
  const [theme, setTheme] = usePersistedChoice<Theme>(THEME_KEY, THEMES, systemTheme())
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])
  return [theme, setTheme] as const
}

/** The resolved theme, for the few things CSS can't switch (logo images). */
export const ThemeContext = createContext<Theme>('dark')
