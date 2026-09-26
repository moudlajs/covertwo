// @vitest-environment node
import { describe, expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from '../../src/data/espn'
import { diff, snap, wants, type Prefs, type Snap } from './events'

const games = mapScoreboard(fixture).map(snap)
/** A fixture game by its home team, changed as needed. */
const game = (home: string, change: (g: Snap) => Partial<Snap> = () => ({})): Snap => {
  const g = games.find((x) => x.home.abbr === home)
  if (!g) throw new Error(`no ${home} game`)
  return { ...g, ...change(g) }
}
const scored = (g: Snap, side: 'home' | 'away', points: number): Snap => ({
  ...g,
  [side]: { ...g[side], score: (g[side].score ?? 0) + points },
})

describe('diff', () => {
  test('nothing changed, nothing to say', () => {
    expect(diff(games, games)).toEqual([])
  })

  test('touchdown and field goal, named for the scoring team', () => {
    const before = game('DEN') // JAX at DEN, live in Q3
    const [td] = diff([before], [scored(before, 'away', 7)])
    expect(td).toMatchObject({ kind: 'score', title: 'Touchdown, Jacksonville Jaguars' })
    expect(td?.body).toMatch(/^JAX 24 – 10 DEN · Q3 /)
    const [fg] = diff([before], [scored(before, 'home', 3)])
    expect(fg?.title).toBe('Field goal, Denver Broncos')
  })

  test('extra points and two-point tries alone say nothing', () => {
    const before = game('DEN')
    expect(diff([before], [scored(before, 'home', 1)])).toEqual([])
    expect(diff([before], [scored(before, 'home', 2)])).toEqual([])
  })

  test('kickoff, then final with the winner', () => {
    const pre = game('SF') // MIA at SF, scheduled
    const live = { ...pre, state: 'in' as const, period: 1, clock: '15:00' }
    expect(diff([pre], [live])[0]).toMatchObject({
      kind: 'kickoff',
      title: 'Kickoff: Miami Dolphins at San Francisco 49ers',
    })
    const final: Snap = {
      ...live,
      state: 'post',
      home: { ...live.home, score: 24, winner: true },
      away: { ...live.away, score: 20, winner: false },
    }
    const alerts = diff(
      [{ ...live, home: { ...live.home, score: 24 }, away: { ...live.away, score: 20 } }],
      [final],
    )
    expect(alerts).toEqual([
      expect.objectContaining({
        kind: 'final',
        title: 'Final: San Francisco 49ers win',
        body: 'MIA 20 – 24 SF',
      }),
    ])
  })

  test('a close finish once, when it becomes one', () => {
    const before = game('DEN', () => ({ period: 4, clock: '5:30' }))
    const now = { ...before, clock: '4:59' }
    expect(diff([before], [now]).map((a) => a.kind)).toEqual(['close'])
    expect(diff([now], [{ ...now, clock: '3:10' }])).toEqual([]) // still close: no repeat
  })

  test('college upset: a ranked team trailing in the fourth', () => {
    const base = game('DEN', (g) => ({
      period: 3,
      home: { ...g.home, rank: 7, name: 'Ohio State Buckeyes', score: 14 },
      away: { ...g.away, rank: null, score: 10 },
    }))
    const trailing = { ...base, period: 4, away: { ...base.away, score: 17 } }
    const alerts = diff([base], [trailing])
    expect(alerts.find((a) => a.kind === 'upset')?.title).toBe(
      'Upset alert: No. 7 Ohio State Buckeyes trail',
    )
    expect(
      diff([trailing], [{ ...trailing, clock: '2:00' }]).filter((a) => a.kind === 'upset'),
    ).toEqual([])
  })

  test('a game new to the slate says nothing yet', () => {
    expect(diff([], games)).toEqual([])
  })
})

describe('wants', () => {
  const prefs: Prefs = {
    teams: { nfl: '30', ncaaf: null }, // Jacksonville
    scores: true,
    kickoffFinal: false,
    close: true,
    upsets: false,
  }
  const alert = (
    kind: 'score' | 'kickoff' | 'close' | 'upset',
    teams: [string, string],
    league: 'nfl' | 'ncaaf' = 'nfl',
    ranked = false,
  ) => ({ kind, league, ranked, gameId: '1', teams, title: '', body: '' })

  test('team alerts only for your team, the rest for any game', () => {
    expect(wants(prefs, alert('score', ['30', '7']))).toBe(true)
    expect(wants(prefs, alert('score', ['1', '2']))).toBe(false)
    expect(wants(prefs, alert('kickoff', ['30', '7']))).toBe(false) // switched off
    expect(wants(prefs, alert('close', ['1', '2']))).toBe(true)
    expect(wants(prefs, alert('upset', ['1', '2']))).toBe(false)
  })

  test('team ids are per league: a college team with your NFL id is not yours', () => {
    expect(wants(prefs, alert('score', ['30', '7'], 'ncaaf'))).toBe(false)
  })

  test('college close finishes only for games with a ranked team', () => {
    expect(wants(prefs, alert('close', ['1', '2'], 'ncaaf', false))).toBe(false)
    expect(wants(prefs, alert('close', ['1', '2'], 'ncaaf', true))).toBe(true)
  })
})
