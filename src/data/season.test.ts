import { expect, test } from 'vitest'
import ncaaf from '../../fixtures/espn-ncaaf-scoreboard.json'
import nfl from '../../fixtures/espn-scoreboard.json'
import { mapSeason, stepWeek } from './season'

const season = mapSeason(nfl)
if (!season) throw new Error('fixture has a calendar')

test('NFL calendar: preseason, 18 weeks, postseason; current week from the response', () => {
  expect(season.weeks).toHaveLength(4 + 18 + 5)
  expect(season.current).toBe('2:2')
  expect(season.types).toMatchObject({ 1: 'Preseason', 2: 'Regular Season', 3: 'Postseason' })
  expect(season.weeks.find((w) => w.id === '2:3')?.short).toBe('Wk 3')
  expect(season.weeks.find((w) => w.id === '1:1')?.short).toBe('HOF')
  expect(season.weeks.find((w) => w.id === '3:2')?.short).toBe('Div Rd')
})

test('college calendar has weeks and bowls', () => {
  const college = mapSeason(ncaaf)
  expect(college?.current).toBe('2:3')
  expect(college?.weeks.map((w) => w.short)).toContain('Bowls')
})

test('stepping crosses season types and stops at the ends', () => {
  expect(stepWeek(season.weeks, '1:4', 1)?.id).toBe('2:1') // Pre Wk 3 → Week 1
  expect(stepWeek(season.weeks, '2:18', 1)?.id).toBe('3:1') // Week 18 → Wild Card
  expect(stepWeek(season.weeks, '1:1', -1)).toBeNull()
  expect(stepWeek(season.weeks, '3:5', 1)).toBeNull()
})

test('no calendar: null', () => {
  expect(mapSeason({})).toBeNull()
  expect(mapSeason(null)).toBeNull()
})
