import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { LoadError } from './LoadError'

test('announces the failure and retries on click', async () => {
  const onRetry = vi.fn()
  render(<LoadError onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load scores")
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRetry).toHaveBeenCalledOnce()
})
