import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Retrying } from './Retrying'

test('keeps an empty live region when inactive', () => {
  render(<Retrying active={false} />)
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
})

test('shows retrying when active', () => {
  render(<Retrying active />)
  expect(screen.getByRole('status')).toHaveTextContent('retrying…')
})
