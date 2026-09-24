import { expect, test } from 'vitest'
import ncaaf from '../../fixtures/espn-ncaaf-scoreboard.json'
import nfl from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from './espn'
import { onlyRanked, scoreboardUrl } from './leagues'

test('each league has its own Worker path', () => {
  expect(scoreboardUrl('nfl')).toMatch(/\/nfl\/scoreboard$/)
  expect(scoreboardUrl('ncaaf')).toMatch(/\/ncaaf\/scoreboard$/)
})

test('college views map to ESPN groups', () => {
  expect(scoreboardUrl('ncaaf', 'top25')).toMatch(/\/ncaaf\/scoreboard$/)
  expect(scoreboardUrl('ncaaf', 'fbs')).toMatch(/\/ncaaf\/scoreboard\?groups=80$/)
  expect(scoreboardUrl('nfl', 'fbs')).toMatch(/\/nfl\/scoreboard$/) // NFL ignores the view
})

test('a conference loads its ESPN group in either view', () => {
  expect(scoreboardUrl('ncaaf', 'top25', '8')).toMatch(/\/ncaaf\/scoreboard\?groups=8$/)
  expect(scoreboardUrl('ncaaf', 'fbs', '8')).toMatch(/\/ncaaf\/scoreboard\?groups=8$/)
  expect(scoreboardUrl('nfl', 'top25', '8')).toMatch(/\/nfl\/scoreboard$/)
})

test('onlyRanked keeps games with at least one Top 25 team', () => {
  const games = mapScoreboard(ncaaf)
  const kept = onlyRanked(games)
  expect(kept.length).toBeGreaterThan(0)
  expect(kept.every((g) => g.home.rank !== null || g.away.rank !== null)).toBe(true)
  const unranked = games.map((g) => ({
    ...g,
    home: { ...g.home, rank: null },
    away: { ...g.away, rank: null },
  }))
  expect(onlyRanked(unranked)).toEqual([])
})

test('college fixture maps with Top 25 ranks', () => {
  const games = mapScoreboard(ncaaf)
  expect(games).toHaveLength(22)
  const ranks = games.flatMap((g) => [g.home.rank, g.away.rank]).filter((r) => r !== null)
  expect(ranks).toHaveLength(25)
  const mia = games.find((g) => g.away.abbr === 'MIA')
  expect(mia?.away.rank).toBe(5)
  expect(mia?.home.rank).toBeNull() // Wake Forest, unranked (99)
})

test('NFL teams never have a rank', () => {
  expect(mapScoreboard(nfl).every((g) => g.home.rank === null && g.away.rank === null)).toBe(true)
})
