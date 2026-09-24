export type GameState = 'pre' | 'in' | 'post'

export type Team = {
  id: string
  abbr: string
  name: string
  logo: string
  /** `null` before kickoff. */
  score: number | null
  winner: boolean
}

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
  /** Points per period (index 4+ is overtime); once the game has started. */
  quarters: { home: number[]; away: number[] } | null
  /** Top passer / rusher / receiver of the game, when ESPN lists them. */
  leaders: { passing?: Leader; rushing?: Leader; receiving?: Leader }
  home: Team
  away: Team
}
