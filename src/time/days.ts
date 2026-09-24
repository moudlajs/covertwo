import type { Game } from '../data/game'
import { dayKey, formatDay, type TimeMode } from './format'

export type Day = { key: string; label: string; games: Game[] }

/** Groups games by calendar day in the mode's time zone, sorted by kickoff. */
export function groupByDay(games: Game[], mode: TimeMode): Day[] {
  const sorted = [...games].sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt) || a.away.abbr.localeCompare(b.away.abbr),
  )
  const days: Day[] = []
  for (const game of sorted) {
    const key = dayKey(game.startsAt, mode)
    const last = days.at(-1)
    if (last?.key === key) last.games.push(game)
    else days.push({ key, label: formatDay(game.startsAt, mode), games: [game] })
  }
  return days
}

/** True when none of the games fall on today's date in the selected time zone. */
export function isOffDay(games: Game[], now: number, mode: TimeMode): boolean {
  const today = dayKey(new Date(now).toISOString(), mode)
  return !games.some((g) => dayKey(g.startsAt, mode) === today)
}
