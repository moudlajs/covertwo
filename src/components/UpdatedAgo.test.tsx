import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { UpdatedAgo } from './UpdatedAgo'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-20T20:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

const at = new Date('2026-09-20T20:00:00Z').getTime()

test('nothing before the first load', () => {
  const { container } = render(<UpdatedAgo at={null} live={false} />)
  expect(container).toBeEmptyDOMElement()
})

test('ticks every second while live', () => {
  render(<UpdatedAgo at={at} live />)
  expect(screen.getByText('just now')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(12_000))
  expect(screen.getByText('12s ago')).toBeInTheDocument()
})

test('ticks every 15s when nothing is live', () => {
  render(<UpdatedAgo at={at} live={false} />)
  act(() => vi.advanceTimersByTime(14_000))
  expect(screen.getByText('just now')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(1_000))
  expect(screen.getByText('15s ago')).toBeInTheDocument()
})

test('counts from the given load time', () => {
  render(<UpdatedAgo at={at - 180_000} live={false} />)
  expect(screen.getByText('3m ago')).toHaveAttribute('datetime', '2026-09-20T19:57:00.000Z')
})
