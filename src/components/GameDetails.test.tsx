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

/** The <dd> value next to a <dt> label. */
const value = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling

test('labels and values share one list, in order', () => {
  render(<GameDetails id="d" game={game('JAX')} hidden={false} />)
  const labels = screen.getAllByRole('term').map((dt) => dt.textContent)
  expect(labels).toEqual(['PLAY', 'TO', 'PASS', 'RUSH', 'REC'])
})

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
  expect(value('PASS')).toHaveTextContent('J. Goff DET 26/38, 327 YDS, 4 TD')
  expect(value('RUSH')).toHaveTextContent('J. Cook III BUF')
})

test('live game: labelled last play and timeouts', () => {
  render(<GameDetails id="d" game={game('JAX')} hidden={false} />)
  expect(value('PLAY')).toHaveTextContent('T.Etienne run up the middle to DEN 34 for 3 yards.')
  expect(value('TO')).toHaveTextContent('JAX 2 · DEN 3')
})

test('finished game: no last play or timeouts', () => {
  render(<GameDetails id="d" game={game('DET')} hidden={false} />)
  expect(screen.queryByText('PLAY')).not.toBeInTheDocument()
  expect(screen.queryByText('TO')).not.toBeInTheDocument()
})
