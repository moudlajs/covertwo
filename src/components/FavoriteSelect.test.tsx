import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { NFL_TEAMS } from '../data/teams'
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
