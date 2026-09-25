import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { mapScoreboard } from './espn'
import { mapSeason, type Season } from './season'
import type { Game } from './game'
import { OFFLINE_READY } from '../lib/offline'

/** How often to refetch while a game is live, or while retrying after a failure. */
export const POLL_MS = 30_000

/** A kickoff further back than this with the game still not started (postponed): stop waiting for it. */
const KICKOFF_GRACE_MS = 6 * 60 * 60_000
/** setTimeout's limit (~24.8 days); later kickoffs are re-checked on the next load anyway. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1

export type ScoreboardStatus = 'loading' | 'ready' | 'error'

export type Scoreboard = {
  games: Game[]
  status: ScoreboardStatus
  /** Epoch ms of the last successful load, `null` until the first one. */
  lastUpdated: number | null
  /** ESPN's season calendar from the last successful load. */
  season: Season | null
  /** The data is a saved copy from the service worker (no network): `lastUpdated` is when it was saved. */
  offline: boolean
}

const INITIAL: Scoreboard = {
  games: [],
  status: 'loading',
  lastUpdated: null,
  season: null,
  offline: false,
}

/** Set by the service worker (src/sw.js) on a saved copy served offline. */
const SAVED_AT = 'x-covertwo-saved-at'

/**
 * Loads the scoreboard once on mount and again whenever the window regains
 * focus or the tab becomes visible. While any game is live, or the last load
 * failed, it also refetches every 30s (skipped while the tab is hidden); with
 * nothing live it wakes at the next kickoff and does the same until that game
 * starts. A failed load keeps the last good games. A newer request aborts an
 * older one.
 */
export function useScoreboard(url: string): Scoreboard & { live: boolean; retry: () => void } {
  const [board, setBoard] = useState<Scoreboard>(INITIAL)
  // A new URL (league switch) starts from scratch instead of showing the old
  // league's games while the new ones load.
  const [boardUrl, setBoardUrl] = useState(url)
  if (url !== boardUrl) {
    setBoardUrl(url)
    setBoard(INITIAL)
  }
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
      const json: unknown = await res.json()
      const savedAt = Number(res.headers.get(SAVED_AT)) || null
      setBoard({
        games: mapScoreboard(json),
        season: mapSeason(json),
        status: 'ready',
        lastUpdated: savedAt ?? Date.now(),
        offline: savedAt !== null,
      })
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
    // Once more through the new service worker, so the first visit is saved for offline.
    window.addEventListener(OFFLINE_READY, onFocus)
    // Back online: replace a saved copy with fresh data straight away.
    window.addEventListener('online', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(OFFLINE_READY, onFocus)
      window.removeEventListener('online', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
      inFlight.current?.abort()
    }
  }, [load])

  const live = board.games.some((g) => g.state === 'in')
  const failed = board.status === 'error'
  // Kickoff times of games ESPN hasn't started yet (a known time only), as a
  // string: every poll brings a new games array, and only a real change of
  // kickoffs may restart the timer below.
  const kickoffs = useMemo(
    () =>
      board.games
        .filter((g) => g.state === 'pre' && !g.timeTbd)
        .map((g) => Date.parse(g.startsAt))
        .join(','),
    [board.games],
  )
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') void load()
    }
    if (live || failed) {
      const id = setInterval(tick, POLL_MS)
      return () => clearInterval(id)
    }
    // Nothing live: wake at the next kickoff, then keep checking until ESPN
    // starts the game (it turns live and the interval above takes over).
    const now = Date.now()
    const times = kickoffs ? kickoffs.split(',').map(Number) : []
    const next = Math.min(...times.filter((t) => t > now - KICKOFF_GRACE_MS))
    if (!Number.isFinite(next)) return
    let id: ReturnType<typeof setInterval> | undefined
    const wake = setTimeout(
      () => {
        tick()
        id = setInterval(tick, POLL_MS)
      },
      Math.min(Math.max(0, next - now), MAX_TIMEOUT_MS),
    )
    return () => {
      clearTimeout(wake)
      clearInterval(id)
    }
  }, [live, failed, kickoffs, load])

  const retry = useCallback(() => void load(), [load])
  return { ...board, live, retry }
}
