import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from '../data/espn'
import { ScoreList } from './ScoreList'

const games = mapScoreboard(fixture)
const row = (name: RegExp) => screen.getByRole('button', { name })

test('started games expand; scheduled games are not buttons', () => {
  render(<ScoreList games={games} mode="eu" />)
  expect(screen.getAllByRole('button')).toHaveLength(13) // 9 final + 4 live
  expect(screen.queryByRole('button', { name: /Miami Dolphins at/ })).not.toBeInTheDocument()
})

test('one row open at a time, toggled by click', async () => {
  const user = userEvent.setup()
  render(<ScoreList games={games} mode="eu" />)
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
  render(<ScoreList games={games} mode="eu" />)
  row(/^Detroit Lions 31/).focus()
  await user.keyboard('{Enter}')
  expect(row(/^Detroit Lions 31/)).toHaveAttribute('aria-expanded', 'true')
})

test('the favourite team is pinned on top, highlighted, and not repeated in its day', () => {
  render(<ScoreList games={games} mode="eu" favorite="33" />)
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
  const { rerender } = render(<ScoreList games={games} mode="eu" favorite="999" />)
  expect(screen.queryByText(/Your team/)).not.toBeInTheDocument()
  rerender(<ScoreList games={games} mode="eu" />)
  expect(screen.queryByText(/Your team/)).not.toBeInTheDocument()
})
