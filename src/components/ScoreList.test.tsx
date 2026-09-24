import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from '../data/espn'
import { ScoreList } from './ScoreList'

const games = mapScoreboard(fixture)
const row = (name: RegExp) => screen.getByRole('button', { name })
/** Friday of the fixture week (Prague): nothing is in the past yet, so nothing folds. */
const FRIDAY = Date.parse('2026-09-18T12:00:00Z')
/** Tuesday: Friday is final and older than the most recent past day (Monday). */
const TUESDAY = Date.parse('2026-09-22T12:00:00Z')

test('started games expand; scheduled games are not buttons', () => {
  render(<ScoreList games={games} mode="eu" now={FRIDAY} />)
  expect(screen.getAllByRole('button')).toHaveLength(13) // 9 final + 4 live
  expect(screen.queryByRole('button', { name: /Miami Dolphins at/ })).not.toBeInTheDocument()
})

test('one row open at a time, toggled by click', async () => {
  const user = userEvent.setup()
  render(<ScoreList games={games} mode="eu" now={FRIDAY} />)
  const det = row(/^Detroit Lions 31/)
  const gb = row(/^Green Bay Packers 20/)

  await user.click(det)
  expect(det).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('table')).toBeVisible()

  await user.click(gb)
  expect(det).toHaveAttribute('aria-expanded', 'false')
  expect(gb).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getAllByRole('table')).toHaveLength(1) // hidden ones leave the a11y tree

  await user.click(gb)
  expect(gb).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

test('Enter on a focused row expands it', async () => {
  const user = userEvent.setup()
  render(<ScoreList games={games} mode="eu" now={FRIDAY} />)
  row(/^Detroit Lions 31/).focus()
  await user.keyboard('{Enter}')
  expect(row(/^Detroit Lions 31/)).toHaveAttribute('aria-expanded', 'true')
})

test('the favourite team is pinned on top, highlighted, and not repeated in its day', () => {
  render(<ScoreList games={games} mode="eu" now={FRIDAY} favorite="33" />)
  const headings = screen.getAllByRole('heading', { level: 2 })
  expect(headings[0]).toHaveTextContent('Your team: Baltimore Ravens')
  expect(headings[0]).toHaveTextContent('Sunday 20 Sept')
  const pinned = screen.getAllByRole('list')[0]
  expect(pinned?.children).toHaveLength(1)
  expect(pinned?.firstElementChild).toHaveClass('bg-amber-400/[0.07]')
  expect(screen.getAllByRole('button', { name: /Baltimore Ravens/ })).toHaveLength(1)
  expect(screen.getByRole('heading', { name: /^Sunday 20 Sept\s*12 games/ })).toBeInTheDocument()
})

test('no pinned section when the favourite is not playing or none is set', () => {
  const { rerender } = render(<ScoreList games={games} mode="eu" now={FRIDAY} favorite="999" />)
  expect(screen.queryByText(/Your team/)).not.toBeInTheDocument()
  rerender(<ScoreList games={games} mode="eu" now={FRIDAY} />)
  expect(screen.queryByText(/Your team/)).not.toBeInTheDocument()
})

test('an older past day with only finals folds; tap opens it and it stays open', async () => {
  const user = userEvent.setup()
  sessionStorage.clear()
  const { unmount } = render(<ScoreList games={games} mode="eu" now={TUESDAY} />)
  const friday = screen.getByRole('button', { name: /Friday 18 Sept?\s*1 game · final/ })
  expect(friday).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('button', { name: /^Detroit Lions 31/ })).not.toBeInTheDocument()

  await user.click(friday)
  expect(friday).toHaveAttribute('aria-expanded', 'true')
  expect(row(/^Detroit Lions 31/)).toBeVisible()

  unmount() // remembered for the session
  render(<ScoreList games={games} mode="eu" now={TUESDAY} />)
  expect(screen.getByRole('button', { name: /Friday 18/ })).toHaveAttribute('aria-expanded', 'true')
  sessionStorage.clear()
})

test('today and the most recent past day never fold; unfinished days never fold', () => {
  const allFinal = games.map((g) => ({ ...g, state: 'post' as const }))
  render(<ScoreList games={allFinal} mode="eu" now={TUESDAY} />)
  const folded = screen
    .getAllByRole('button', { expanded: false })
    .map((b) => b.textContent)
    .filter((t) => /final/.test(t ?? ''))
  expect(folded).toHaveLength(2) // Friday and Sunday; Monday (last past) and Tuesday (today) stay open
  expect(folded.join()).toMatch(/Friday 18/)
  expect(folded.join()).toMatch(/Sunday 20/)
})
