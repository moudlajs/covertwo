import type { Game } from './game'

const APP = 'covertwo'

/**
 * Browser tab title: the score when exactly one game is live, a count when
 * several are, just the app name otherwise. Favourite-team preference comes
 * with favourites (M4).
 */
export function documentTitle(games: Game[]): string {
  const live = games.filter((g) => g.state === 'in')
  if (live.length === 0) return APP
  if (live.length > 1) return `${live.length} live · ${APP}`
  const [g] = live as [Game]
  return `${g.away.abbr} ${g.away.score ?? 0}-${g.home.score ?? 0} ${g.home.abbr} · ${APP}`
}
