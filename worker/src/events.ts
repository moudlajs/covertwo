// What happened between two looks at a scoreboard: the alerts a minute brings.
// Pure: the Durable Object (alerts.ts) feeds it the last and the new games.
import { isCrunchTime } from '../../src/data/crunch'
import type { Game, Team } from '../../src/data/game'

/** The few team fields an alert needs; stored between runs, so kept small. */
export type TeamSnap = Pick<Team, 'id' | 'abbr' | 'name' | 'score' | 'rank' | 'winner'>

/** A game as stored between runs. */
export type Snap = Pick<
  Game,
  'id' | 'state' | 'period' | 'clock' | 'halftime' | 'network' | 'startsAt'
> & {
  home: TeamSnap
  away: TeamSnap
}

export function snap(game: Game): Snap {
  const team = ({ id, abbr, name, score, rank, winner }: Team): TeamSnap => ({
    id,
    abbr,
    name,
    score,
    rank,
    winner,
  })
  const { id, state, period, clock, halftime, network, startsAt } = game
  return {
    id,
    state,
    period,
    clock,
    halftime,
    network,
    startsAt,
    home: team(game.home),
    away: team(game.away),
  }
}

export type AlertKind = 'score' | 'kickoff' | 'final' | 'close' | 'upset'

export type League = 'nfl' | 'ncaaf'

export type Alert = {
  kind: AlertKind
  league: League
  gameId: string
  /** A ranked team plays (college): close finishes only count for these. */
  ranked: boolean
  /** Team ids in the game, to match favourites. */
  teams: [string, string]
  title: string
  body: string
}

/** "BAL 24 – 17 DAL" (away first, as on the board). */
function line(g: Snap): string {
  return `${g.away.abbr} ${g.away.score ?? 0} – ${g.home.score ?? 0} ${g.home.abbr}`
}

/** "Q3 3:58", "OT 2:10". */
function clock(g: Snap): string {
  return `${g.period > 4 ? 'OT' : `Q${g.period}`} ${g.clock}`
}

/** A ranked college team trailing in the fourth quarter or later. */
function upset(g: Snap): TeamSnap | null {
  const { home, away } = g
  if (g.state !== 'in' || g.period < 4 || home.score === null || away.score === null) return null
  const rankOf = (t: TeamSnap) => t.rank ?? Infinity
  // The better-ranked team (lower number) is the favourite.
  if (home.rank !== null && rankOf(home) < rankOf(away) && home.score < away.score) return home
  if (away.rank !== null && rankOf(away) < rankOf(home) && away.score < home.score) return away
  return null
}

function scoreTitle(points: number, team: TeamSnap): string {
  if (points >= 6 && points <= 8) return `Touchdown, ${team.name}`
  if (points === 3) return `Field goal, ${team.name}`
  return `${team.name} score`
}

/**
 * The alerts between two snapshots of the same slate. Only changes count, so a
 * game already live, final or close in `prev` alerts nothing again. Scoring
 * under 3 points (extra points, two-point tries, safeties) is left out: the
 * next touchdown or field goal alert carries the score.
 */
export function diff(prev: Snap[], next: Snap[], league: League = 'nfl'): Alert[] {
  const before = new Map(prev.map((g) => [g.id, g]))
  const alerts: Alert[] = []
  for (const g of next) {
    const p = before.get(g.id)
    if (!p) continue // new to the slate: nothing to compare yet
    const base = {
      league,
      gameId: g.id,
      ranked: g.home.rank !== null || g.away.rank !== null,
      teams: [g.away.id, g.home.id] as [string, string],
    }
    if (p.state === 'pre' && g.state === 'in')
      alerts.push({
        ...base,
        kind: 'kickoff',
        title: `Kickoff: ${g.away.name} at ${g.home.name}`,
        body: g.network ? `On ${g.network}` : line(g),
      })
    if (g.state === 'in' || g.state === 'post')
      for (const side of ['away', 'home'] as const) {
        const points = (g[side].score ?? 0) - (p[side].score ?? 0)
        if (points >= 3)
          alerts.push({
            ...base,
            kind: 'score',
            title: scoreTitle(points, g[side]),
            body: g.state === 'in' ? `${line(g)} · ${clock(g)}` : line(g),
          })
      }
    if (p.state === 'in' && g.state === 'post') {
      const winner = g.home.winner ? g.home : g.away.winner ? g.away : null
      alerts.push({
        ...base,
        kind: 'final',
        title: winner ? `Final: ${winner.name} win` : 'Final: a tie',
        body: line(g),
      })
    }
    if (isCrunchTime(g) && !isCrunchTime(p))
      alerts.push({
        ...base,
        kind: 'close',
        title: `Close finish: ${g.away.abbr} at ${g.home.abbr}`,
        body: `${line(g)} · ${clock(g)}`,
      })
    const trailing = upset(g)
    if (trailing && !upset(p))
      alerts.push({
        ...base,
        kind: 'upset',
        title: `Upset alert: No. ${trailing.rank} ${trailing.name} trail`,
        body: `${line(g)} · ${clock(g)}`,
      })
  }
  return alerts
}

/** What one subscriber asked for. */
export type Prefs = {
  /** Favourite team ids per league (the app's ★). */
  teams: { nfl: string | null; ncaaf: string | null }
  scores: boolean
  kickoffFinal: boolean
  close: boolean
  upsets: boolean
}

/**
 * Whether a subscriber wants this alert: team alerts for their team in that
 * league (ESPN ids overlap across leagues), the rest for any game; in college
 * only games with a ranked team, or every small game would alert.
 */
export function wants(prefs: Prefs, alert: Alert): boolean {
  const favourite = prefs.teams[alert.league]
  const mine = favourite !== null && alert.teams.includes(favourite)
  switch (alert.kind) {
    case 'score':
      return prefs.scores && mine
    case 'kickoff':
    case 'final':
      return prefs.kickoffFinal && mine
    case 'close':
      return prefs.close && (alert.league === 'nfl' || alert.ranked)
    case 'upset':
      return prefs.upsets
  }
}
