export type GameState = 'pre' | 'in' | 'post'

export type Team = {
  id: string
  abbr: string
  name: string
  logo: string
  /** `null` before kickoff. */
  score: number | null
  winner: boolean
  /** College football Top 25 rank; always null in the NFL. */
  rank: number | null
  /** Season record, e.g. "5-1" or "5-1-1"; null when ESPN has none. */
  record: string | null
}

/** A team not decided yet: ESPN's "TBD" placeholders (ids -1 and -2) in future playoff rounds. */
export const undecided = (t: Team) => Number(t.id) < 0 || t.abbr === 'TBD'

/** A scheduled game has something to open: a line or an outdoor forecast. */
export const hasPregame = (game: Game) => game.odds !== null || game.weather !== null

export type Leader = {
  /** e.g. "J. Goff" */
  name: string
  side: 'home' | 'away'
  /** e.g. "26/38, 327 YDS, 4 TD" */
  line: string
}

/** A game as the UI sees it. All times are UTC ISO strings. */
export type Game = {
  id: string
  startsAt: string
  state: GameState
  /** ESPN's short status text, e.g. "Final/OT" or "8:42 - 3rd". */
  detail: string
  period: number
  clock: string
  halftime: boolean
  network: string | null
  /** The day is set but the kickoff time isn't (ESPN `timeValid: false`): `startsAt` is a placeholder time. */
  timeTbd: boolean
  /** "SoFi Stadium · Inglewood, CA", when ESPN has it. */
  venue: string | null
  /** "2nd & 7" and "DEN 34"; only while the ball is in play. */
  down: { distance: string; spot: string | null } | null
  /** ESPN's text for the most recent play, while live. */
  lastPlay: string | null
  /** Timeouts left per side, while live (ESPN resets them at halftime). */
  timeouts: { home: number; away: number } | null
  /** Ball inside the opponent's 20, while in play. */
  redZone: boolean
  /** Which side has the ball; only while live and ESPN reports it. */
  possession: 'home' | 'away' | null
  /** ESPN's chance the home team wins (0-1), while live and ESPN reports it. */
  winProb: { home: number } | null
  /** Points per period (index 4+ is overtime); once the game has started. */
  quarters: { home: number[]; away: number[] } | null
  /** Before kickoff: the betting line ("KC -3.5") and over/under, when ESPN has them. */
  odds: { line: string | null; overUnder: number | null } | null
  /** Before kickoff at an outdoor venue: forecast in °F and ESPN's condition text. */
  weather: { tempF: number; condition: string | null } | null
  /** Top passer / rusher / receiver of the game, when ESPN lists them. */
  leaders: { passing?: Leader; rushing?: Leader; receiving?: Leader }
  home: Team
  away: Team
}
