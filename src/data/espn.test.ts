import { afterEach, describe, expect, test, vi } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from './espn'

const games = mapScoreboard(fixture)
const byMatchup = (away: string, home: string) => {
  const g = games.find((x) => x.away.abbr === away && x.home.abbr === home)
  if (!g) throw new Error(`no game ${away} @ ${home} in fixture`)
  return g
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mapScoreboard', () => {
  test('maps every fixture event', () => {
    expect(games).toHaveLength(16)
    expect(games.filter((g) => g.state === 'post')).toHaveLength(9)
    expect(games.filter((g) => g.state === 'in')).toHaveLength(4)
    expect(games.filter((g) => g.state === 'pre')).toHaveLength(3)
  })

  test('keeps kickoff times in UTC', () => {
    expect(byMatchup('DET', 'BUF').startsAt).toBe('2026-09-18T00:15:00.000Z')
  })

  test('final: numeric scores and winner', () => {
    const g = byMatchup('DET', 'BUF')
    expect(g).toMatchObject({ state: 'post', detail: 'Final' })
    expect(g.home).toMatchObject({ abbr: 'BUF', score: 41, winner: true })
    expect(g.away).toMatchObject({ abbr: 'DET', score: 31, winner: false })
  })

  test('overtime final keeps the OT detail', () => {
    expect(byMatchup('GB', 'NYJ').detail).toBe('Final/OT')
  })

  test('live: period and clock', () => {
    expect(byMatchup('JAX', 'DEN')).toMatchObject({
      state: 'in',
      period: 3,
      clock: '8:42',
      halftime: false,
    })
  })

  test('possession: side with the ball, only while live', () => {
    expect(byMatchup('JAX', 'DEN').possession).toBe('away')
    expect(byMatchup('WSH', 'DAL').possession).toBe('home')
    expect(byMatchup('LV', 'LAC').possession).toBeNull() // halftime: no possession reported
    expect(byMatchup('DET', 'BUF').possession).toBeNull() // final
  })

  test('no possession at halftime even if ESPN still reports one', () => {
    type Live = { competitions: { situation: { possession?: string } }[] }
    const e = structuredClone(fixture.events.find((x) => x.shortName === 'LV @ LAC')) as Live
    const situation = e.competitions[0]?.situation
    if (!situation) throw new Error('fixture changed')
    situation.possession = '13' // LV
    expect(mapScoreboard({ events: [e] })[0]?.possession).toBeNull()
  })

  test('possession ignores an unknown team id', () => {
    type Live = { competitions: { situation: { possession: string } }[] }
    const e = structuredClone(fixture.events.find((x) => x.shortName === 'JAX @ DEN')) as Live
    const situation = e.competitions[0]?.situation
    if (!situation) throw new Error('fixture changed')
    situation.possession = '999'
    expect(mapScoreboard({ events: [e] })[0]?.possession).toBeNull()
  })

  test('down & distance while in play', () => {
    expect(byMatchup('JAX', 'DEN').down).toEqual({ distance: '2nd & 7', spot: 'DEN 34' })
    expect(byMatchup('LV', 'LAC').down).toBeNull() // halftime
    expect(byMatchup('DET', 'BUF').down).toBeNull() // final
  })

  test('no down & distance between quarters even if ESPN keeps the situation', () => {
    type Live = { status: { type: { name: string } } }
    const e = structuredClone(fixture.events.find((x) => x.shortName === 'JAX @ DEN')) as Live
    e.status.type.name = 'STATUS_END_PERIOD'
    expect(mapScoreboard({ events: [e] })[0]?.down).toBeNull()
  })

  test('halftime is flagged', () => {
    expect(byMatchup('LV', 'LAC')).toMatchObject({ state: 'in', halftime: true })
  })

  test('scheduled: scores are null, network kept', () => {
    const g = byMatchup('MIA', 'SF')
    expect(g.state).toBe('pre')
    expect(g.home.score).toBeNull()
    expect(g.away.score).toBeNull()
    expect(g.network).toBe('FOX')
  })

  test('skips malformed events with a warning instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const good = fixture.events[0]
    const result = mapScoreboard({
      events: [good, { id: 'broken', date: 'not a date' }, { id: 'nostate' }, null],
    })
    expect(result).toHaveLength(1)
    expect(warn).toHaveBeenCalledWith('[espn] skipping malformed event', 'broken')
  })

  test('returns no games for a response without events', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(mapScoreboard({})).toEqual([])
    expect(mapScoreboard(null)).toEqual([])
  })
})
