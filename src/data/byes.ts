import type { Game } from './game'
import { NFL_ABBR, NFL_TEAMS } from './teams'

/** ESPN's season type for the regular season ("2:7" is week 7). */
const REGULAR_SEASON = 2

export type ByeTeam = { id: string; name: string; abbr: string }

/**
 * NFL teams without a game in this regular-season week, in A-Z order. Empty
 * for any other week (preseason, playoffs) or a week with no games loaded.
 */
export function byeTeams(games: Game[], weekId: string | null): ByeTeam[] {
  if (games.length === 0 || weekId?.split(':')[0] !== String(REGULAR_SEASON)) return []
  const playing = new Set(games.flatMap((g) => [g.home.id, g.away.id]))
  return NFL_TEAMS.filter((t) => !playing.has(t.id))
    .map((t) => ({ ...t, abbr: NFL_ABBR[t.id] ?? t.name }))
    .sort((a, b) => a.abbr.localeCompare(b.abbr))
}
