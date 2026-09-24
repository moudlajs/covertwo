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
