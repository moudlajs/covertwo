import type { Game, GameState, Team } from './game'

/**
 * Served by our Cloudflare Worker (`worker/`), which forwards to ESPN's
 * scoreboard API. ESPN rejects browser requests from other sites.
 */
export const SCOREBOARD_URL = `${import.meta.env.VITE_API_BASE}/nfl/scoreboard`

// Only the fields we read. Everything is optional: this is an unofficial API,
// so the mapper checks each field instead of trusting the shape.
type EspnCompetitor = {
  homeAway?: string
  score?: string
  winner?: boolean
  team?: { id?: string; abbreviation?: string; displayName?: string; logo?: string }
}

type EspnEvent = {
  id?: string
  date?: string
  status?: {
    period?: number
    displayClock?: string
    type?: { name?: string; state?: string; shortDetail?: string }
  }
  competitions?: {
    competitors?: EspnCompetitor[]
    broadcast?: string
    situation?: {
      possession?: string
      shortDownDistanceText?: string
      possessionText?: string
      isRedZone?: boolean
      homeTimeouts?: number
      awayTimeouts?: number
    }
  }[]
}

const STATES: readonly string[] = ['pre', 'in', 'post'] satisfies GameState[]

function mapTeam(c: EspnCompetitor | undefined, state: GameState): Team | null {
  const t = c?.team
  if (!c || !t?.id || !t.abbreviation) return null
  const score = Number(c.score)
  return {
    id: t.id,
    abbr: t.abbreviation,
    name: t.displayName ?? t.abbreviation,
    logo: t.logo ?? '',
    score: state === 'pre' || c.score === undefined || Number.isNaN(score) ? null : score,
    winner: c.winner === true,
  }
}

function timeouts(
  state: string,
  s: { homeTimeouts?: number; awayTimeouts?: number } | undefined,
): Game['timeouts'] {
  const ok = (n: unknown): n is number => typeof n === 'number' && n >= 0 && n <= 3
  if (state !== 'in' || !ok(s?.homeTimeouts) || !ok(s?.awayTimeouts)) return null
  return { home: s.homeTimeouts, away: s.awayTimeouts }
}

function mapEvent(e: EspnEvent | null): Game | null {
  if (!e || typeof e !== 'object') return null
  const type = e.status?.type
  const state = type?.state
  if (!e.id || !e.date || !state || !STATES.includes(state)) return null
  const startsAt = new Date(e.date)
  if (Number.isNaN(startsAt.getTime())) return null

  const comp = e.competitions?.[0]
  const side = (homeAway: string) => comp?.competitors?.find((c) => c.homeAway === homeAway)
  const home = mapTeam(side('home'), state as GameState)
  const away = mapTeam(side('away'), state as GameState)
  if (!home || !away) return null

  // ESPN may keep the last situation around at halftime, so exclude it explicitly.
  const halftime = type.name === 'STATUS_HALFTIME'
  const ball = state === 'in' && !halftime ? comp?.situation?.possession : undefined
  const possession = ball === home.id ? 'home' : ball === away.id ? 'away' : null
  // Down & distance only while the clock can run: not at halftime, between
  // quarters (STATUS_END_PERIOD) or during other breaks.
  const inPlay = type.name === 'STATUS_IN_PROGRESS'
  const distance = inPlay ? comp?.situation?.shortDownDistanceText : undefined
  const down = distance ? { distance, spot: comp?.situation?.possessionText || null } : null

  return {
    id: e.id,
    startsAt: startsAt.toISOString(),
    state: state as GameState,
    detail: type.shortDetail ?? '',
    period: e.status?.period ?? 0,
    clock: e.status?.displayClock ?? '',
    halftime,
    network: comp?.broadcast || null,
    possession,
    down,
    redZone: inPlay && comp?.situation?.isRedZone === true,
    timeouts: timeouts(state, comp?.situation),
    home,
    away,
  }
}

/** Maps an ESPN scoreboard response to games. Malformed events are skipped, never thrown. */
export function mapScoreboard(json: unknown): Game[] {
  const events = (json as { events?: unknown } | null)?.events
  if (!Array.isArray(events)) {
    console.warn('[espn] scoreboard response has no events array')
    return []
  }
  return events.flatMap((e: EspnEvent | null) => {
    const game = mapEvent(e)
    if (!game) console.warn('[espn] skipping malformed event', e?.id)
    return game ? [game] : []
  })
}
