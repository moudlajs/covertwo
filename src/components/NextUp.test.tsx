import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from '../data/espn'
import { isOffDay } from '../time/days'
import { NextUp } from './NextUp'

const games = mapScoreboard(fixture)
const at = (iso: string) => Date.parse(iso)

test('off day: no game on today’s date in the selected time zone', () => {
  expect(isOffDay(games, at('2026-09-19T12:00:00Z'), 'eu')).toBe(true) // Saturday
  expect(isOffDay(games, at('2026-09-20T12:00:00Z'), 'eu')).toBe(false) // Sunday
  // 21:00 UTC Thursday: 17:00 in New York, where TNF (20:15) is tonight, but
  // 23:00 in Prague, where TNF (02:15) is tomorrow.
  expect(isOffDay(games, at('2026-09-17T21:00:00Z'), 'us')).toBe(false)
  expect(isOffDay(games, at('2026-09-17T21:00:00Z'), 'eu')).toBe(true)
})

test('a day without games: the same "Up next" card, no extra "Next"', () => {
  render(<NextUp games={games} now={at('2026-09-19T12:00:00Z')} mode="eu" offDay />)
  expect(screen.getByRole('region', { name: 'Up next' })).not.toHaveTextContent('Next ')
  expect(screen.getByText('Sunday 20 Sept')).toBeInTheDocument()
  expect(screen.getByText('22:25')).toHaveAttribute('datetime', '2026-09-20T20:25:00.000Z')
  expect(screen.getByText('in 1d 8h')).toBeInTheDocument()
})

test('no upcoming game: the week is done', () => {
  const done = games.map((g) => ({ ...g, state: 'post' as const }))
  render(<NextUp games={done} now={at('2026-09-23T12:00:00Z')} mode="eu" offDay />)
  expect(screen.getByText("This week's games are done.")).toBeInTheDocument()
})

test('game day before kickoff: "Up next" with how many games start together', () => {
  const kickoff = '2026-09-27T17:00:00.000Z'
  const sunday = games.slice(0, 9).map((g) => ({ ...g, state: 'pre' as const, startsAt: kickoff }))
  render(<NextUp games={sunday} now={at('2026-09-27T15:00:00Z')} mode="eu" offDay={false} />)
  const card = screen.getByRole('region', { name: 'Up next' })
  expect(card).toHaveTextContent('Sunday 27')
  expect(card).toHaveTextContent('19:00 · 9 games')
  expect(card).toHaveTextContent('in 2h 0m')
  expect(card).not.toHaveTextContent('Next ')
})

test('a single game at the next kickoff has no count', () => {
  render(<NextUp games={games} now={at('2026-09-19T12:00:00Z')} mode="eu" offDay />)
  expect(screen.getByRole('region', { name: 'Up next' })).not.toHaveTextContent(/\d+ games/)
})

test('game day with no kickoff left: nothing', () => {
  const done = games.map((g) => ({ ...g, state: 'post' as const }))
  const { container } = render(
    <NextUp games={done} now={at('2026-09-20T23:00:00Z')} mode="eu" offDay={false} />,
  )
  expect(container).toBeEmptyDOMElement()
})

test('next kickoff with only the day set: "time TBD", no countdown', () => {
  const tbd = games.map((g) => ({ ...g, timeTbd: true }))
  render(<NextUp games={tbd} now={at('2026-09-19T12:00:00Z')} mode="eu" offDay />)
  const card = screen.getByRole('region', { name: 'Up next' })
  expect(card).toHaveTextContent('Sunday 20 Sept · time TBD')
  expect(card).not.toHaveTextContent(/in 1d/)
})
