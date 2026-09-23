import { useEffect, useState } from 'react'
import type { TimeMode } from './format'

const KEY = 'covertwo:time-mode'

function read(): TimeMode {
  try {
    const stored = localStorage.getItem(KEY)
    return stored === 'us' || stored === 'eu' ? stored : 'eu'
  } catch {
    return 'eu' // storage blocked (private mode, disabled cookies)
  }
}

/** EU/US time mode, persisted in localStorage. Defaults to EU. */
export function useTimeMode() {
  const [mode, setMode] = useState<TimeMode>(read)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, mode)
    } catch {
      // Not persisting is fine; the toggle still works for this visit.
    }
  }, [mode])
  return [mode, setMode] as const
}
