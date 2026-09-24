import { expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { isCrunchTime } from './crunch'
import { mapScoreboard } from './espn'

const games = mapScoreboard(fixture)
const wshDal = games.find((g) => g.away.abbr === 'WSH')
if (!wshDal) throw new Error('fixture changed')

test('Q4 1:54, 23-20: crunch time', () => {
  expect(isCrunchTime(wshDal)).toBe(true)
})

test.each([
  ['3rd quarter', { period: 3 }],
  ['more than 5:00 left', { clock: '5:01' }],
  ['more than one score apart', { home: { ...wshDal.home, score: 11 } }], // 23-11
  ['final', { state: 'post' as const }],
  ['unreadable clock', { clock: '' }],
])('not crunch time: %s', (_, change) => {
  expect(isCrunchTime({ ...wshDal, ...change })).toBe(false)
})

test('overtime counts', () => {
  expect(isCrunchTime({ ...wshDal, period: 5, clock: '4:00' })).toBe(true)
})
