import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from '../data/espn'
import { isOffDay } from '../time/days'
import { OffDay } from './OffDay'

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

test('card shows the next kickoff and a countdown', () => {
  render(<OffDay games={games} now={at('2026-09-19T12:00:00Z')} mode="eu" />)
  expect(screen.getByRole('region', { name: 'No games today' })).toBeInTheDocument()
  expect(screen.getByText('Sunday 20 Sept')).toBeInTheDocument()
  expect(screen.getByText('22:25')).toHaveAttribute('datetime', '2026-09-20T20:25:00.000Z')
  expect(screen.getByText('in 1d 8h')).toBeInTheDocument()
})

test('no upcoming game: the week is done', () => {
  const done = games.map((g) => ({ ...g, state: 'post' as const }))
  render(<OffDay games={done} now={at('2026-09-23T12:00:00Z')} mode="eu" />)
  expect(screen.getByText("This week's games are done.")).toBeInTheDocument()
})
