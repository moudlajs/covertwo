import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Node 25+ has an experimental global `localStorage` that shadows jsdom's
// (and is unusable without --localstorage-file). Use jsdom's everywhere.
const { jsdom } = globalThis as unknown as { jsdom: { window: Window } }
for (const key of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, key, {
    value: jsdom.window[key],
    configurable: true,
  })
}

afterEach(() => {
  cleanup()
})
