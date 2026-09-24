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
  /** Ball inside the opponent's 20, while in play. */
  redZone: boolean
  /** Which side has the ball; only while live and ESPN reports it. */
  possession: 'home' | 'away' | null
  home: Team
  away: Team
}
