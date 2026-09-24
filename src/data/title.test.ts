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

test('two live games: a count', () => {
  const two = games.filter((g) => g.state !== 'in' || ['WSH', 'JAX'].includes(g.away.abbr))
  expect(documentTitle(two)).toBe('2 live · covertwo')
})

test('a missing live score shows as a dash, not zero', () => {
  const [g] = onlyLive('WSH').filter((x) => x.state === 'in')
  if (!g) throw new Error('no live game')
  expect(documentTitle([{ ...g, away: { ...g.away, score: null } }])).toBe(
    'WSH --20 DAL · covertwo',
  )
})

test("the favourite's live game wins over the count", () => {
  expect(documentTitle(games, '6')).toBe('WSH 23-20 DAL · covertwo') // Dallas
  expect(documentTitle(games, '33')).toBe('4 live · covertwo') // Ravens not live
})

test('nothing live: just the name', () => {
  expect(documentTitle(games.filter((g) => g.state !== 'in'))).toBe('covertwo')
  expect(documentTitle([])).toBe('covertwo')
})
