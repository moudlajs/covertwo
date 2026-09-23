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
  home: Team
  away: Team
}
