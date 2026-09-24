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

export function scoreboardUrl(league: League, view: NcaaView = 'top25'): string {
  const base = `${import.meta.env.VITE_API_BASE}${LEAGUES[league].path}`
  return league === 'ncaaf' && view === 'fbs' ? `${base}?groups=80` : base
}
