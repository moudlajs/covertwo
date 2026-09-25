import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { KeepAwakeToggle } from './KeepAwakeToggle'

test('a labelled checkbox', async () => {
  const onChange = vi.fn()
  render(<KeepAwakeToggle value={false} onChange={onChange} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Keep screen on/ }))
  expect(onChange).toHaveBeenCalledWith(true)
})
