import { teamColor } from './colors'
import type { Game, GameState, Team } from './game'

// Only the fields we read. Everything is optional: this is an unofficial API,
// so the mapper checks each field instead of trusting the shape.
type EspnCompetitor = {
  homeAway?: string
  linescores?: { value?: number }[]
  score?: string
  winner?: boolean
  /** College football poll rank; 99 means unranked. */
  curatedRank?: { current?: number }
  team?: {
    id?: string
    abbreviation?: string
    displayName?: string
    logo?: string
    color?: string
    alternateColor?: string
  }
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
    /** false when only the day is set; `date` then holds a placeholder time. */
    timeValid?: boolean
    venue?: { fullName?: string; address?: { city?: string; state?: string } }
    leaders?: {
      name?: string
      leaders?: {
        displayValue?: string
        athlete?: { shortName?: string }
        team?: { id?: string }
      }[]
    }[]
    situation?: {
      possession?: string
      shortDownDistanceText?: string
      possessionText?: string
      isRedZone?: boolean
      homeTimeouts?: number
      awayTimeouts?: number
      lastPlay?: { text?: string }
    }
  }[]
}

const STATES: readonly string[] = ['pre', 'in', 'post'] satisfies GameState[]

/** A Top 25 rank, or null (ESPN uses 99 for unranked). */
function rank(n: number | undefined): number | null {
  return typeof n === 'number' && n >= 1 && n <= 25 ? n : null
}

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
    rank: rank(c.curatedRank?.current),
    color: teamColor(t.color, t.alternateColor),
  }
}

const LEADER_STATS = {
  passing: 'passingYards',
  rushing: 'rushingYards',
  receiving: 'receivingYards',
} as const

function leaders(
  list: NonNullable<NonNullable<EspnEvent['competitions']>[number]['leaders']> | undefined,
  homeId: string,
  awayId: string,
): Game['leaders'] {
  const out: Game['leaders'] = {}
  for (const [key, stat] of Object.entries(LEADER_STATS) as [keyof Game['leaders'], string][]) {
    const top = list?.find((l) => l.name === stat)?.leaders?.[0]
    const teamId = top?.team?.id
    const side = teamId === homeId ? 'home' : teamId === awayId ? 'away' : null
    if (top?.athlete?.shortName && top.displayValue && side)
      out[key] = { name: top.athlete.shortName, side, line: top.displayValue }
  }
  return out
}

function quarters(home: EspnCompetitor | undefined, away: EspnCompetitor | undefined) {
  const points = (c: EspnCompetitor | undefined) =>
    (c?.linescores ?? []).map((l) => l.value).filter((v): v is number => typeof v === 'number')
  const h = points(home)
  const a = points(away)
  return h.length > 0 && h.length === a.length ? { home: h, away: a } : null
}

/** "SoFi Stadium · Inglewood, CA", or whatever part ESPN has. */
function venue(v: NonNullable<EspnEvent['competitions']>[number]['venue']): string | null {
  const place = [v?.address?.city, v?.address?.state].filter(Boolean).join(', ')
  return [v?.fullName, place].filter(Boolean).join(' · ') || null
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
    timeTbd: comp?.timeValid === false,
    venue: venue(comp?.venue),
    possession,
    down,
    redZone: inPlay && comp?.situation?.isRedZone === true,
    timeouts: timeouts(state, comp?.situation),
    // At halftime it only repeats "END OF 2ND QUARTER".
    quarters: state === 'pre' ? null : quarters(side('home'), side('away')),
    leaders: state === 'pre' ? {} : leaders(comp?.leaders, home.id, away.id),
    lastPlay: (state === 'in' && !halftime && comp?.situation?.lastPlay?.text?.trim()) || null,
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
