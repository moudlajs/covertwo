import { useCallback, useEffect, useRef, useState } from 'react'
import { mapScoreboard } from './espn'
import type { Game } from './game'

/** How often to refetch while a game is live, or while retrying after a failure. */
export const POLL_MS = 30_000

export type ScoreboardStatus = 'loading' | 'ready' | 'error'

export type Scoreboard = {
  games: Game[]
  status: ScoreboardStatus
  /** Epoch ms of the last successful load, `null` until the first one. */
  lastUpdated: number | null
}

/**
 * Loads the scoreboard once on mount and again whenever the window regains
 * focus or the tab becomes visible. While any game is live, or the last load
 * failed, it also refetches every 30s (skipped while the tab is hidden). A
 * failed load keeps the last good games. A newer request aborts an older one.
 */
export function useScoreboard(url: string): Scoreboard & { live: boolean; retry: () => void } {
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

  const live = board.games.some((g) => g.state === 'in')
  const failed = board.status === 'error'
  useEffect(() => {
    if (!live && !failed) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [live, failed, load])

  const retry = useCallback(() => void load(), [load])
  return { ...board, live, retry }
}
