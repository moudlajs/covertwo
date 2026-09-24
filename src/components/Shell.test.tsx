import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Shell } from './Shell'

test('renders the title, landmarks, controls and footer', () => {
  render(
    <Shell controls={<button type="button">Menu</button>} footer={<span>ESPN</span>}>
      <p>games</p>
    </Shell>,
  )
  expect(screen.getByRole('heading', { level: 1, name: 'covertwo' })).toBeInTheDocument()
  expect(screen.getByRole('banner')).toContainElement(screen.getByRole('button', { name: 'Menu' }))
  expect(screen.getByRole('main')).toHaveTextContent('games')
  expect(screen.getByRole('contentinfo')).toHaveTextContent('ESPN')
})

test('second header row: league on the left, view on the right, both pinned', () => {
  render(
    <Shell league={<button type="button">NFL</button>} view={<button type="button">Top 25</button>}>
      x
    </Shell>,
  )
  const pinned = screen.getByTestId('pinned-header')
  expect(pinned).toContainElement(screen.getByRole('button', { name: 'NFL' }))
  expect(pinned).toContainElement(screen.getByRole('button', { name: 'Top 25' }))
  expect(screen.getByRole('banner')).not.toContainElement(
    screen.getByRole('button', { name: 'NFL' }),
  )
})
