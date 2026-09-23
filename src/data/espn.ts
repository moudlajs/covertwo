import type { Game, GameState, Team } from './game'

export const SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'

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
  competitions?: { competitors?: EspnCompetitor[]; broadcast?: string }[]
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

  return {
    id: e.id,
    startsAt: startsAt.toISOString(),
    state: state as GameState,
    detail: type.shortDetail ?? '',
    period: e.status?.period ?? 0,
    clock: e.status?.displayClock ?? '',
    halftime: type.name === 'STATUS_HALFTIME',
    network: comp?.broadcast || null,
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
