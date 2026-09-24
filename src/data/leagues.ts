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

export function scoreboardUrl(league: League): string {
  return `${import.meta.env.VITE_API_BASE}${LEAGUES[league].path}`
}
