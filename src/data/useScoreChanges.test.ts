import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from './espn'
import type { Game } from './game'
import { FLASH_MS, useScoreChanges } from './useScoreChanges'

const games = mapScoreboard(fixture)
const dallasScores = (list: Game[]): Game[] =>
  list.map((g) =>
    g.home.abbr === 'DAL' ? { ...g, home: { ...g.home, score: (g.home.score ?? 0) + 7 } } : g,
  )

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

const setup = (initial: Game[]) =>
  renderHook(({ list }) => useScoreChanges(list), { initialProps: { list: initial } })

test('the first load flashes nothing', () => {
  const { result, rerender } = setup([])
  rerender({ list: games })
  expect(result.current.flashing.size).toBe(0)
  expect(result.current.announcement).toBe('')
})

test('a changed score flashes that side and is announced', () => {
  const { result, rerender } = setup(games)
  rerender({ list: dallasScores(games) })
  const dal = games.find((g) => g.home.abbr === 'DAL')
  expect(result.current.flashing.get(dal?.id ?? '')).toEqual(['home'])
  expect(result.current.announcement).toBe('Score: Washington Commanders 23, Dallas Cowboys 27')
})

test('kickoff (no score → 0) flashes nothing', () => {
  const scheduled = games.map((g) =>
    g.state === 'pre'
      ? g
      : { ...g, home: { ...g.home, score: null }, away: { ...g.away, score: null } },
  )
  const { result, rerender } = setup(scheduled)
  rerender({
    list: scheduled.map((g) =>
      g.home.score === null
        ? { ...g, home: { ...g.home, score: 0 }, away: { ...g.away, score: 0 } }
        : g,
    ),
  })
  expect(result.current.flashing.size).toBe(0)
  expect(result.current.announcement).toBe('')
})

test('an unchanged refetch flashes nothing', () => {
  const { result, rerender } = setup(games)
  rerender({ list: games.map((g) => ({ ...g })) })
  expect(result.current.flashing.size).toBe(0)
})

test('the highlight clears after FLASH_MS', () => {
  const { result, rerender } = setup(games)
  rerender({ list: dallasScores(games) })
  expect(result.current.flashing.size).toBe(1)
  act(() => vi.advanceTimersByTime(FLASH_MS))
  expect(result.current.flashing.size).toBe(0)
  expect(result.current.announcement).toBe('')
})
