import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { CONFERENCES } from '../data/leagues'
import { ConferenceSelect } from './ConferenceSelect'

test('labelled select with all conferences, reports the chosen id', async () => {
  const onChange = vi.fn()
  render(<ConferenceSelect value="all" onChange={onChange} />)
  const select = screen.getByLabelText('Conference')
  expect(screen.getAllByRole('option')).toHaveLength(CONFERENCES.length + 1)
  expect(select).toHaveValue('all')
  await userEvent.selectOptions(select, 'SEC')
  expect(onChange).toHaveBeenCalledWith('8')
})
