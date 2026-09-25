import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import superBowl from '../../fixtures/espn-nfl-superbowl.json'
import wildCard from '../../fixtures/espn-nfl-wildcard.json'
import { mapScoreboard } from '../data/espn'
import { RoundAhead } from './RoundAhead'

test('a round of undecided games: its name, count and days, no fake times', () => {
  render(<RoundAhead games={mapScoreboard(wildCard)} round="Wild Card" mode="eu" />)
  const card = screen.getByRole('region', { name: 'Wild Card' })
  expect(card).toHaveTextContent(/6 games · Sat 16( Jan)?\s–\sMon 18 Jan/)
  expect(card).toHaveTextContent('Matchups are set once the games before it are played.')
  expect(card).not.toHaveTextContent('06:00')
})

test('US days', () => {
  render(<RoundAhead games={mapScoreboard(wildCard)} round="Wild Card" mode="us" />)
  expect(screen.getByRole('region')).toHaveTextContent(/6 games · Sat, Jan 16\s–\sMon, Jan 18/)
})

test('one game with a set kickoff: its day, time and venue', () => {
  render(<RoundAhead games={mapScoreboard(superBowl)} round="Super Bowl" mode="eu" />)
  const card = screen.getByRole('region', { name: 'Super Bowl' })
  expect(card).toHaveTextContent(/Monday 15 Feb · 00:30/)
  expect(card).toHaveTextContent('SoFi Stadium · Inglewood, CA')
  expect(card).not.toHaveTextContent('1 games')
})
