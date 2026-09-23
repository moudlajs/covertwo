import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { Menu } from './Menu'

const setup = () => {
  const user = userEvent.setup()
  render(
    <>
      <Menu />
      <p>outside</p>
    </>,
  )
  return { user, button: screen.getByRole('button', { name: 'Menu' }) }
}

test('opens and closes with the button', async () => {
  const { user, button } = setup()
  expect(button).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('link', { name: 'Source on GitHub' })).not.toBeInTheDocument()
  await user.click(button)
  expect(button).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: 'Source on GitHub' })).toBeVisible()
  await user.click(button)
  expect(button).toHaveAttribute('aria-expanded', 'false')
})

test('Escape closes and returns focus to the button', async () => {
  const { user, button } = setup()
  await user.click(button)
  await user.tab()
  expect(screen.getByRole('link', { name: 'Source on GitHub' })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(button).toHaveAttribute('aria-expanded', 'false')
  expect(button).toHaveFocus()
})

test('a click outside closes it', async () => {
  const { user, button } = setup()
  await user.click(button)
  await user.click(screen.getByText('outside'))
  expect(button).toHaveAttribute('aria-expanded', 'false')
})

test('shows the app version', async () => {
  const { user, button } = setup()
  await user.click(button)
  expect(screen.getByText(/^v\d+\.\d+\.\d+$/)).toBeInTheDocument()
})
