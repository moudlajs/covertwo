import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Toast, TOAST_MS } from './Toast'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

test('shows a message, then clears it', () => {
  render(<Toast message={{ text: 'Screen stays on', id: 1 }} />)
  expect(screen.getByTestId('toast')).toHaveTextContent('Screen stays on')
  act(() => vi.advanceTimersByTime(TOAST_MS))
  expect(screen.getByTestId('toast')).toBeEmptyDOMElement()
})

test('the same text again shows again', () => {
  const { rerender } = render(<Toast message={{ text: 'No team pinned', id: 1 }} />)
  act(() => vi.advanceTimersByTime(TOAST_MS))
  rerender(<Toast message={{ text: 'No team pinned', id: 2 }} />)
  expect(screen.getByTestId('toast')).toHaveTextContent('No team pinned')
})

test('an empty live region when there is nothing to say', () => {
  render(<Toast message={null} />)
  expect(screen.getByTestId('toast')).toBeEmptyDOMElement()
})
