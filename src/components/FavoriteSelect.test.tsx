import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { FBS_TEAMS, NFL_TEAMS } from '../data/teams'
import { FavoriteSelect } from './FavoriteSelect'

test('all NFL teams plus None; picking one reports id and name', async () => {
  const onChange = vi.fn()
  render(<FavoriteSelect teams={NFL_TEAMS} value={NFL_TEAMS[2] ?? null} onChange={onChange} />)
  const select = screen.getByLabelText('Favourite team')
  expect(screen.getAllByRole('option')).toHaveLength(33)
  expect(select).toHaveValue('33')
  await userEvent.selectOptions(select, 'Dallas Cowboys')
  expect(onChange).toHaveBeenCalledWith({ id: '6', name: 'Dallas Cowboys' })
  await userEvent.selectOptions(select, 'None')
  expect(onChange).toHaveBeenLastCalledWith(null)
})

test('keeps a favourite that is not in the list selectable', () => {
  render(
    <FavoriteSelect
      teams={[]}
      value={{ id: '2390', name: 'Miami Hurricanes' }}
      onChange={vi.fn()}
    />,
  )
  expect(screen.getByLabelText('Favourite team')).toHaveValue('2390')
})

test('college lists every FBS team, including unranked Maryland', () => {
  render(<FavoriteSelect teams={FBS_TEAMS} value={null} onChange={vi.fn()} />)
  expect(screen.getAllByRole('option')).toHaveLength(FBS_TEAMS.length + 1)
  expect(FBS_TEAMS).toHaveLength(138)
  expect(screen.getByRole('option', { name: 'Maryland Terrapins' })).toHaveValue('120')
})

test('shows the current team as the row value', () => {
  render(
    <FavoriteSelect
      teams={NFL_TEAMS}
      value={{ id: '33', name: 'Baltimore Ravens' }}
      onChange={vi.fn()}
    />,
  )
  expect(screen.getByText('Baltimore Ravens', { selector: 'span' })).toBeInTheDocument()
  expect(screen.getByText('Pinned to the top')).toBeInTheDocument()
})

test('None when no team is picked', () => {
  render(<FavoriteSelect teams={NFL_TEAMS} value={null} onChange={vi.fn()} />)
  expect(screen.getByText('None', { selector: 'span' })).toBeInTheDocument()
})
