import { useEffect, useState } from 'react'
import type { Game } from './game'

/** How long a changed score stays highlighted. */
export const FLASH_MS = 2500

export type ScoreChanges = {
  /** Game id → sides whose score just changed. */
  flashing: Map<string, ('home' | 'away')[]>
  /** Text for a polite live region, e.g. "Score: Commanders 23, Cowboys 27". */
  announcement: string
}

const NONE: ScoreChanges = { flashing: new Map(), announcement: '' }

/**
 * Compares each new `games` array with the previous one and reports scores
 * that changed. The first load and failed refetches (same array) report
 * nothing; a change stays reported for FLASH_MS.
 */
export function useScoreChanges(games: Game[]): ScoreChanges {
  const [previous, setPrevious] = useState(games)
  const [changes, setChanges] = useState(NONE)

  // Derive from the prop change during render (React's recommended pattern
  // for "state from previous props"), not in an effect.
  if (games !== previous) {
    setPrevious(games)
    const before = new Map(previous.map((g) => [g.id, g]))
    const flashing = new Map<string, ('home' | 'away')[]>()
    const lines: string[] = []
    for (const g of games) {
      const old = before.get(g.id)
      if (!old) continue // new to the board, e.g. the first load
      const sides = (['away', 'home'] as const).filter((s) => g[s].score !== old[s].score)
      if (sides.length === 0) continue
      flashing.set(g.id, sides)
      lines.push(
        `Score: ${g.away.name} ${g.away.score ?? '-'}, ${g.home.name} ${g.home.score ?? '-'}`,
      )
    }
    if (flashing.size > 0) setChanges({ flashing, announcement: lines.join('. ') })
  }

  useEffect(() => {
    if (changes === NONE) return
    const id = setTimeout(() => setChanges(NONE), FLASH_MS)
    return () => clearTimeout(id)
  }, [changes])

  return changes
}
