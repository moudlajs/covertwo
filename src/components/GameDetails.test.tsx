import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import fixture from '../../fixtures/espn-scoreboard.json'
import { mapScoreboard } from '../data/espn'
import { GameDetails } from './GameDetails'

const games = mapScoreboard(fixture)
const game = (away: string) => {
  const g = games.find((x) => x.away.abbr === away)
  if (!g) throw new Error(`no ${away}`)
  return g
}

test('quarter table with totals', () => {
  render(<GameDetails id="d" game={game('DET')} hidden={false} />)
  const table = screen.getByRole('table', { name: 'Score by quarter' })
  const [, det, buf] = within(table).getAllByRole('row')
  expect(det).toHaveTextContent('DET0107143' + '1')
  expect(buf).toHaveTextContent('BUF141377' + '41')
})

test('overtime gets an OT column', () => {
  render(<GameDetails id="d" game={game('GB')} hidden={false} />)
  expect(screen.getByRole('columnheader', { name: 'OT' })).toBeInTheDocument()
})

test('leaders with team', () => {
  render(<GameDetails id="d" game={game('DET')} hidden={false} />)
  expect(screen.getByText('PASS').closest('li')).toHaveTextContent(
    'J. Goff DET26/38, 327 YDS, 4 TD',
  )
  expect(screen.getByText('RUSH').closest('li')).toHaveTextContent('J. Cook III BUF')
})

test('live game: labelled last play and timeouts', () => {
  render(<GameDetails id="d" game={game('JAX')} hidden={false} />)
  expect(screen.getByText('Last play:').parentElement).toHaveTextContent(
    'Last play: T.Etienne run up the middle to DEN 34 for 3 yards.',
  )
  expect(screen.getByText('Timeouts:').parentElement).toHaveTextContent('Timeouts: JAX 2 · DEN 3')
})

test('finished game: no last play or timeouts', () => {
  render(<GameDetails id="d" game={game('DET')} hidden={false} />)
  expect(screen.queryByText('Last play:')).not.toBeInTheDocument()
  expect(screen.queryByText('Timeouts:')).not.toBeInTheDocument()
})
