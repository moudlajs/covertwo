import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { KeepAwakeButton } from './KeepAwakeButton'

test('a toggle button that says whether it is on', async () => {
  const onChange = vi.fn()
  const { rerender } = render(<KeepAwakeButton value={false} onChange={onChange} />)
  const button = screen.getByRole('button', { name: 'Keep screen on during live games' })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(button)
  expect(onChange).toHaveBeenCalledWith(true)
  rerender(<KeepAwakeButton value onChange={onChange} />)
  expect(button).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(button)
  expect(onChange).toHaveBeenLastCalledWith(false)
})
