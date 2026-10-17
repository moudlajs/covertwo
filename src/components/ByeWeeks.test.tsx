import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ByeWeeks } from './ByeWeeks'

const teams = [
  { id: '33', name: 'Baltimore Ravens', abbr: 'BAL' },
  { id: '2', name: 'Buffalo Bills', abbr: 'BUF' },
]

test('lists the abbreviations, and full names for screen readers', () => {
  const { container } = render(<ByeWeeks teams={teams} />)
  expect(container).toHaveTextContent('Bye')
  expect(container).toHaveTextContent('BAL')
  expect(container).toHaveTextContent('BUF')
  expect(screen.getByText('On bye: Baltimore Ravens, Buffalo Bills')).toHaveClass('sr-only')
})

test('renders nothing when nobody is on bye', () => {
  const { container } = render(<ByeWeeks teams={[]} />)
  expect(container).toBeEmptyDOMElement()
})
