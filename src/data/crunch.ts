import type { Game } from './game'

/** Minutes left on the clock, or null if it can't be read. */
function minutesLeft(clock: string): number | null {
  const m = /^(\d+):(\d{2})$/.exec(clock)
  return m ? Number(m[1]) + Number(m[2]) / 60 : null
}

/**
 * Crunch time: live, 4th quarter or overtime, 5:00 or less on the clock, and
 * within one score (8 points). When timeouts matter at a glance.
 */
export function isCrunchTime(
  game: Pick<Game, 'state' | 'halftime' | 'period' | 'clock'> & {
    home: { score: number | null }
    away: { score: number | null }
  },
): boolean {
  if (game.state !== 'in' || game.halftime || game.period < 4) return false
  const left = minutesLeft(game.clock)
  const { home, away } = game
  if (left === null || left > 5 || home.score === null || away.score === null) return false
  return Math.abs(home.score - away.score) <= 8
}
