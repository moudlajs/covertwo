import { expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import wildCard from '../../fixtures/espn-nfl-wildcard.json'
import { byeTeams } from './byes'
import { mapScoreboard } from './espn'
import { NFL_ABBR, NFL_TEAMS } from './teams'

const week = mapScoreboard(fixture)
// Drop two games: those four teams are on bye.
const withByes = week.filter(
  (g) => !['BUF', 'KC'].some((abbr) => g.home.abbr === abbr || g.away.abbr === abbr),
)
const missing = week
  .filter((g) => !withByes.includes(g))
  .flatMap((g) => [g.away.abbr, g.home.abbr])
  .sort()

test('teams without a game in a regular-season week, A-Z', () => {
  expect(byeTeams(withByes, '2:2').map((t) => t.abbr)).toEqual(missing)
})

test('a full week has nobody on bye', () => {
  expect(byeTeams(week, '2:2')).toEqual([])
})

test('none outside the regular season, without a week, or with no games', () => {
  expect(byeTeams(withByes, '1:3')).toEqual([])
  expect(byeTeams(withByes, '3:1')).toEqual([])
  expect(byeTeams(mapScoreboard(wildCard), '3:1')).toEqual([])
  expect(byeTeams(withByes, null)).toEqual([])
  expect(byeTeams([], '2:7')).toEqual([])
})

test('every NFL team has an abbreviation', () => {
  expect(NFL_TEAMS.filter((t) => !NFL_ABBR[t.id])).toEqual([])
})

test('the abbreviations match ESPN', () => {
  // The fixture week has all 32 teams.
  const espn = week.flatMap((g) => [g.home, g.away])
  expect(espn).toHaveLength(32)
  for (const t of espn) expect(NFL_ABBR[t.id]).toBe(t.abbr)
})
