import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

test('names and switches to the other theme', async () => {
  const onChange = vi.fn()
  const { rerender } = render(<ThemeToggle theme="dark" onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
  expect(onChange).toHaveBeenCalledWith('light')
  rerender(<ThemeToggle theme="light" onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
  expect(onChange).toHaveBeenLastCalledWith('dark')
})
