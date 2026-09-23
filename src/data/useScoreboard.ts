import { useCallback, useEffect, useRef, useState } from 'react'
import { mapScoreboard, SCOREBOARD_URL } from './espn'
import type { Game } from './game'

export type ScoreboardStatus = 'loading' | 'ready' | 'error'

export type Scoreboard = {
  games: Game[]
  status: ScoreboardStatus
  /** Epoch ms of the last successful load, `null` until the first one. */
  lastUpdated: number | null
}

/**
 * Loads the scoreboard once on mount and again whenever the window regains
 * focus or the tab becomes visible. A newer request aborts an older one.
 */
export function useScoreboard(url = SCOREBOARD_URL): Scoreboard {
  const [board, setBoard] = useState<Scoreboard>({
    games: [],
    status: 'loading',
    lastUpdated: null,
  })
  const inFlight = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    let status: number | undefined
    try {
      const res = await fetch(url, { signal: controller.signal })
      status = res.status
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const games = mapScoreboard(await res.json())
      setBoard({ games, status: 'ready', lastUpdated: Date.now() })
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('[scoreboard] load failed', { url, status, error })
      setBoard((prev) => ({ ...prev, status: 'error' }))
    }
  }, [url])

  useEffect(() => {
    // Fetching on mount is the point of this hook; the state update happens
    // asynchronously after the response, not synchronously in the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
      inFlight.current?.abort()
    }
  }, [load])

  return board
}
