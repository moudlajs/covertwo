import { expect, test } from 'vitest'
import ncaaf from '../../fixtures/espn-ncaaf-scoreboard.json'
import nfl from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from './espn'
import { scoreboardUrl } from './leagues'

test('each league has its own Worker path', () => {
  expect(scoreboardUrl('nfl')).toMatch(/\/nfl\/scoreboard$/)
  expect(scoreboardUrl('ncaaf')).toMatch(/\/ncaaf\/scoreboard$/)
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
