import { expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from './espn'
import { documentTitle } from './title'

const games = mapScoreboard(fixture)
const onlyLive = (away: string) => games.filter((g) => g.state !== 'in' || g.away.abbr === away)

test('several live games: a count', () => {
  expect(documentTitle(games)).toBe('4 live · covertwo')
})

test('one live game: its score, away team first', () => {
  expect(documentTitle(onlyLive('WSH'))).toBe('WSH 23-20 DAL · covertwo')
})

test('nothing live: just the name', () => {
  expect(documentTitle(games.filter((g) => g.state !== 'in'))).toBe('covertwo')
  expect(documentTitle([])).toBe('covertwo')
})
