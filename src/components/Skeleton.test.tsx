import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Skeleton } from './Skeleton'

test('is a busy, labelled list of placeholder rows', () => {
  render(<Skeleton />)
  const list = screen.getByRole('list', { name: 'Loading games' })
  expect(list).toHaveAttribute('aria-busy', 'true')
  expect(screen.getAllByRole('listitem')).toHaveLength(8)
})

test('pulse stops under reduced motion', () => {
  render(<Skeleton />)
  for (const row of screen.getAllByRole('listitem'))
    expect(row).toHaveClass('animate-pulse', 'motion-reduce:animate-none')
})
