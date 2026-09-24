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

/** FBS conferences by ESPN group id (verified 2026-09-24). */
export const CONFERENCES = [
  { id: '1', name: 'ACC' },
  { id: '151', name: 'American' },
  { id: '4', name: 'Big 12' },
  { id: '5', name: 'Big Ten' },
  { id: '12', name: 'C-USA' },
  { id: '18', name: 'Independents' },
  { id: '15', name: 'MAC' },
  { id: '17', name: 'Mountain West' },
  { id: '9', name: 'Pac-12' },
  { id: '8', name: 'SEC' },
  { id: '37', name: 'Sun Belt' },
] as const

export type ConferenceId = (typeof CONFERENCES)[number]['id']
/** `'all'` or a conference id. */
export type ConferenceChoice = 'all' | ConferenceId
export const CONFERENCE_CHOICES = ['all', ...CONFERENCES.map((c) => c.id)] as const

/**
 * The ESPN slate to load. A conference always loads that conference's games
 * (`groups=<id>`); the Top 25 view then keeps the ranked ones on the client
 * (see `onlyRanked`). Without a conference, Top 25 is ESPN's default slate
 * and All FBS is `groups=80`.
 */
export function scoreboardUrl(
  league: League,
  view: NcaaView = 'top25',
  conference: ConferenceChoice = 'all',
): string {
  const base = `${import.meta.env.VITE_API_BASE}${LEAGUES[league].path}`
  if (league !== 'ncaaf') return base
  if (conference !== 'all') return `${base}?groups=${conference}`
  return view === 'fbs' ? `${base}?groups=80` : base
}

/** Games involving at least one Top 25 team. */
export function onlyRanked<
  T extends { home: { rank: number | null }; away: { rank: number | null } },
>(games: T[]): T[] {
  return games.filter((g) => g.home.rank !== null || g.away.rank !== null)
}
