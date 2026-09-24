import type { Game } from './game'

const APP = 'covertwo'

/**
 * Browser tab title: the favourite team's score while they're live; otherwise
 * the score when exactly one game is live, a count when several are, just
 * the app name when none are.
 */
export function documentTitle(games: Game[], favorite: string | null = null): string {
  const live = games.filter((g) => g.state === 'in')
  const mine = live.find((g) => g.home.id === favorite || g.away.id === favorite)
  if (mine) return score(mine)
  if (live.length === 0) return APP
  if (live.length > 1) return `${live.length} live · ${APP}`
  return score(live[0] as Game)
}

function score(g: Game): string {
  return `${g.away.abbr} ${g.away.score ?? '-'}-${g.home.score ?? '-'} ${g.home.abbr} · ${APP}`
}
