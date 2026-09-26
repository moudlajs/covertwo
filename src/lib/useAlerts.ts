import { useCallback, useEffect, useState } from 'react'
import type { Favorites } from '../data/useFavorites'
import {
  DEFAULT_PREFS,
  pushState,
  sendTest,
  sync,
  turnOff,
  turnOn,
  type AlertPrefs,
  type PushState,
} from './push'

const KEY = 'covertwo:alerts'

function readPrefs(): AlertPrefs {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<AlertPrefs>
    const pick = (k: keyof AlertPrefs) =>
      typeof stored[k] === 'boolean' ? stored[k] : DEFAULT_PREFS[k]
    return {
      scores: pick('scores'),
      kickoffFinal: pick('kickoffFinal'),
      close: pick('close'),
      upsets: pick('upsets'),
    }
  } catch {
    return DEFAULT_PREFS
  }
}

/**
 * Lock-screen alerts for this device: its state, the choices (kept locally),
 * and turning them on or off. While on, the Worker's copy of the choices and
 * favourite teams is refreshed whenever they change, and once per visit.
 */
export function useAlerts(favorites: Favorites) {
  const [prefs, setPrefs] = useState(readPrefs)
  /** null while checking. */
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  /** The last test's result, in words. */
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    pushState()
      .then((s) => current && setState(s))
      .catch(() => current && setState('unsupported'))
    return () => {
      current = false
    }
  }, [])

  useEffect(() => {
    if (state !== 'on') return
    sync(prefs, favorites).catch((error: unknown) => console.error('[alerts] sync failed', error))
  }, [state, prefs, favorites])

  const setPref = useCallback((key: keyof AlertPrefs, value: boolean) => {
    setPrefs((p) => {
      const next = { ...p, [key]: value }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // Not persisting is fine.
      }
      return next
    })
  }, [])

  const run = (action: () => Promise<PushState>) => async () => {
    setBusy(true)
    setFailed(false)
    try {
      setState(await action())
    } catch (error) {
      console.error('[alerts] failed', error)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    setTestResult('Sending…')
    try {
      let result = await sendTest()
      if (result === 'gone') {
        // The Worker lost this device (or never got it): register it again, once.
        await sync(prefs, favorites)
        result = await sendTest()
      }
      setTestResult(
        result === 'sent'
          ? 'Sent. It should be on your lock screen in a moment.'
          : result === 'wait'
            ? 'Just sent one. Try again in a few seconds.'
            : result === 'gone'
              ? "covertwo's server doesn't know this device. Turn alerts off and on again."
              : `The push service refused it (${result || 'no answer'}). Turn alerts off and on again.`,
      )
    } catch (error) {
      console.error('[alerts] test failed', error)
      setTestResult("Couldn't reach covertwo's server. Check your connection.")
    }
  }

  return {
    state,
    testResult,
    test,
    prefs,
    busy,
    failed,
    setPref,
    on: run(() => turnOn(prefs, favorites)),
    off: run(turnOff),
  }
}
