import { describe, expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from '../data/espn'
import { groupByDay } from './days'

const games = mapScoreboard(fixture)
const summary = (mode: 'eu' | 'us') => groupByDay(games, mode).map((d) => [d.label, d.games.length])

describe('groupByDay', () => {
  // Thursday's 00:15 UTC kickoff is Thursday evening in New York but
  // Friday 02:15 in Prague; same for the Sunday and Monday night games.
  test('EU groups by Prague calendar day', () => {
    expect(summary('eu')).toEqual([
      ['Friday 18 Sept', 1],
      ['Sunday 20 Sept', 13],
      ['Monday 21 Sept', 1],
      ['Tuesday 22 Sept', 1],
    ])
  })

  test('US groups by New York calendar day', () => {
    expect(summary('us')).toEqual([
      ['Thursday, Sep 17', 1],
      ['Sunday, Sep 20', 14],
      ['Monday, Sep 21', 1],
    ])
  })

  test('sorts by kickoff, then away team', () => {
    const sunday = groupByDay(games, 'us')[1]?.games ?? []
    const kickoffs = sunday.map((g) => g.startsAt)
    expect(kickoffs).toEqual([...kickoffs].sort())
    const early = sunday.filter((g) => g.startsAt === sunday[0]?.startsAt).map((g) => g.away.abbr)
    expect(early).toEqual([...early].sort())
  })

  test('no games, no days', () => {
    expect(groupByDay([], 'eu')).toEqual([])
  })
})
