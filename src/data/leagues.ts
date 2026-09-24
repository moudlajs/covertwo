export type League = 'nfl' | 'ncaaf'

/**
 * Per-league scoreboard endpoints, served by our Cloudflare Worker
 * (`worker/`), which forwards to ESPN. ESPN rejects browser requests from
 * other sites.
 */
export const LEAGUES: Record<League, { label: string; path: string }> = {
  nfl: { label: 'NFL', path: '/nfl/scoreboard' },
  ncaaf: { label: 'NCAA', path: '/ncaaf/scoreboard' },
}

/** College views. ESPN's default slate is the games with a Top 25 team; groups=80 is all FBS. */
export type NcaaView = 'top25' | 'fbs'
export const NCAA_VIEWS = ['top25', 'fbs'] as const satisfies readonly NcaaView[]

/**
 * The ESPN slate to load. College "Top 25" is ESPN's small default slate,
 * unless `allFbs` asks for every FBS game (groups=80), which a college
 * favourite needs: their game may not involve a ranked team.
 */
export function scoreboardUrl(league: League, view: NcaaView = 'top25', allFbs = false): string {
  const base = `${import.meta.env.VITE_API_BASE}${LEAGUES[league].path}`
  return league === 'ncaaf' && (view === 'fbs' || allFbs) ? `${base}?groups=80` : base
}

/** Client-side Top 25: games with a ranked team, plus the given team's games. */
export function top25With<
  T extends {
    home: { id: string; rank: number | null }
    away: { id: string; rank: number | null }
  },
>(games: T[], teamId: string): T[] {
  return games.filter(
    (g) =>
      g.home.rank !== null || g.away.rank !== null || g.home.id === teamId || g.away.id === teamId,
  )
}
