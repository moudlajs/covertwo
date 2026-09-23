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

test('reserves a hidden league slot in the header', () => {
  const { container } = render(<Shell>x</Shell>)
  const slot = container.querySelector('[data-slot="league"]')
  expect(slot).not.toBeNull()
  expect(slot).not.toBeVisible()
})
