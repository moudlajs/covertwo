import { expect, test } from 'vitest'
import ncaaf from '../../fixtures/espn-ncaaf-scoreboard.json'
import nfl from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from './espn'
import { scoreboardUrl, top25With } from './leagues'

test('each league has its own Worker path', () => {
  expect(scoreboardUrl('nfl')).toMatch(/\/nfl\/scoreboard$/)
  expect(scoreboardUrl('ncaaf')).toMatch(/\/ncaaf\/scoreboard$/)
})

test('college views map to ESPN groups', () => {
  expect(scoreboardUrl('ncaaf', 'top25')).toMatch(/\/ncaaf\/scoreboard$/)
  expect(scoreboardUrl('ncaaf', 'fbs')).toMatch(/\/ncaaf\/scoreboard\?groups=80$/)
  expect(scoreboardUrl('nfl', 'fbs')).toMatch(/\/nfl\/scoreboard$/) // NFL ignores the view
})

test('a college favourite loads all FBS; NFL ignores it', () => {
  expect(scoreboardUrl('ncaaf', 'top25', true)).toMatch(/\/ncaaf\/scoreboard\?groups=80$/)
  expect(scoreboardUrl('ncaaf', 'top25', false)).toMatch(/\/ncaaf\/scoreboard$/)
  expect(scoreboardUrl('nfl', 'top25', true)).toMatch(/\/nfl\/scoreboard$/)
})

test('top25With keeps ranked games plus the favourite, even unranked', () => {
  const games = mapScoreboard(ncaaf)
  const unranked = games.map((g) => ({
    ...g,
    home: { ...g.home, rank: null },
    away: { ...g.away, rank: null },
  }))
  const target = unranked[3]
  if (!target) throw new Error('fixture changed')
  expect(top25With(unranked, target.home.id)).toEqual([target])
  expect(top25With(games, 'none').length).toBe(games.length) // all fixture games have a ranked team
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
