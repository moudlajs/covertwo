import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import nfl from '../../fixtures/espn-scoreboard.json'
import { mapSeason } from '../data/season'
import { WeekPicker } from './WeekPicker'

const season = mapSeason(nfl)
if (!season) throw new Error('fixture has a calendar')

test('arrows step one week, across season types', async () => {
  const onChange = vi.fn()
  render(<WeekPicker season={season} value="1:4" onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Next week' }))
  expect(onChange).toHaveBeenLastCalledWith('2:1') // Pre Wk 3 → Wk 1
  await userEvent.click(screen.getByRole('button', { name: 'Previous week' }))
  expect(onChange).toHaveBeenLastCalledWith('1:3')
})

test('arrows are disabled at the ends of the season', () => {
  const { rerender } = render(<WeekPicker season={season} value="1:1" onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Previous week' })).toBeDisabled()
  rerender(<WeekPicker season={season} value="3:5" onChange={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Next week' })).toBeDisabled()
})

test('the list jumps to any week, grouped, with this week marked', async () => {
  const onChange = vi.fn()
  render(<WeekPicker season={season} value="2:2" onChange={onChange} />)
  expect(screen.getByRole('option', { name: 'Wk 2 (this week)' })).toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'Postseason' })).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Week' }), 'Super Bowl')
  expect(onChange).toHaveBeenLastCalledWith('3:5')
})

test('shows the short label; amber when not on the current week', () => {
  const { container, rerender } = render(
    <WeekPicker season={season} value="2:2" onChange={vi.fn()} />,
  )
  const label = container.querySelector('span[aria-hidden="true"]')
  expect(label).toHaveTextContent(/^Wk 2$/)
  expect(label).not.toHaveClass('text-amber-300')
  rerender(<WeekPicker season={season} value="2:5" onChange={vi.fn()} />)
  expect(container.querySelector('span[aria-hidden="true"]')).toHaveClass('text-amber-300')
})
