import { useEffect } from 'react'
import { usePersistedChoice } from './usePersistedChoice'

/** Screen Wake Lock exists here (not in every browser, e.g. older Safari). */
export const wakeLockSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator

/** The "keep the screen on while covertwo is open" setting: off by default, persisted. */
export function useKeepAwake() {
  const [value, setValue] = usePersistedChoice('covertwo:keep-awake', ['on', 'off'] as const, 'off')
  return [value === 'on', (on: boolean) => setValue(on ? 'on' : 'off')] as const
}

/**
 * Holds a screen wake lock while `active`. The browser drops the lock when
 * the tab is hidden; it's taken again when the tab comes back, and released
 * as soon as `active` turns false.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !wakeLockSupported()) return
    let lock: WakeLockSentinel | null = null
    let pending = false // one request at a time, so no lock is ever orphaned
    let stopped = false
    const acquire = async () => {
      if (pending || document.visibilityState !== 'visible' || (lock && !lock.released)) return
      pending = true
      try {
        const next = await navigator.wakeLock.request('screen')
        if (stopped) void next.release()
        else lock = next
      } catch {
        // Refused (battery saver, permissions policy): the screen just sleeps as usual.
      } finally {
        pending = false
      }
    }
    void acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release()
    }
  }, [active])
}
