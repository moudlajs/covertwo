import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { KeepAwakeToggle } from './KeepAwakeToggle'

test('a switch named for the setting, with its hint', async () => {
  const onChange = vi.fn()
  render(<KeepAwakeToggle value={false} onChange={onChange} />)
  const toggle = screen.getByRole('switch', { name: 'Keep screen on' })
  expect(toggle).not.toBeChecked()
  expect(screen.getByText('While games are live')).toBeInTheDocument()
  await userEvent.click(screen.getByText('Keep screen on')) // the whole row toggles
  expect(onChange).toHaveBeenCalledWith(true)
})
