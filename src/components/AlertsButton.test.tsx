import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { DEFAULT_PREFS, type PushState } from '../lib/push'
import { AlertsButton } from './AlertsButton'

const setup = (state: PushState | null, teams: string[] = ['Baltimore Ravens']) => {
  const props = {
    onOn: vi.fn(),
    onOff: vi.fn(),
    onPref: vi.fn(),
    onTest: vi.fn(),
    testResult: null,
    testing: false,
  }
  render(
    <>
      <AlertsButton
        state={state}
        prefs={DEFAULT_PREFS}
        busy={false}
        failed={false}
        teams={teams}
        {...props}
      />
      <p>outside</p>
    </>,
  )
  return { ...props, user: userEvent.setup(), bell: screen.getByRole('button', { name: 'Alerts' }) }
}

test('off: a switch turns alerts on; the choices are there', async () => {
  const { user, bell, onOn } = setup('off')
  await user.click(bell)
  const panel = screen.getByRole('region', { name: 'Alerts' })
  expect(panel).toBeVisible()
  await user.click(screen.getByRole('switch', { name: 'On this device' }))
  expect(onOn).toHaveBeenCalled()
  expect(screen.getByRole('switch', { name: 'Scores' })).toBeChecked()
  expect(screen.getByRole('switch', { name: 'College upsets' })).not.toBeChecked()
  expect(panel).toHaveTextContent('Baltimore Ravens')
})

test('changing a choice keeps the panel open', async () => {
  const { user, bell, onPref } = setup('on')
  await user.click(bell)
  await user.click(screen.getByRole('switch', { name: 'Close finishes' }))
  expect(onPref).toHaveBeenCalledWith('close', true)
  expect(bell).toHaveAttribute('aria-expanded', 'true')
})

test('on: the bell is lit and the switch turns alerts off', async () => {
  const { user, bell, onOff } = setup('on')
  expect(bell.className).toContain('text-amber-400')
  expect(bell.className).not.toContain('text-slate-400') // the grey would win over the amber
  await user.click(bell)
  await user.click(screen.getByRole('switch', { name: 'On this device' }))
  expect(onOff).toHaveBeenCalled()
})

test('a test alert button once alerts are on, with its result', async () => {
  const onTest = vi.fn()
  const user = userEvent.setup()
  const { rerender } = render(
    <AlertsButton
      testResult={null}
      testing={false}
      state="off"
      prefs={DEFAULT_PREFS}
      busy={false}
      failed={false}
      teams={[]}
      onOn={vi.fn()}
      onOff={vi.fn()}
      onPref={vi.fn()}
      onTest={onTest}
    />,
  )
  await user.click(screen.getByRole('button', { name: 'Alerts' }))
  expect(screen.queryByRole('button', { name: 'Send a test alert' })).not.toBeInTheDocument()
  rerender(
    <AlertsButton
      state="on"
      prefs={DEFAULT_PREFS}
      busy={false}
      failed={false}
      teams={[]}
      testResult="Sent. It should be on your lock screen in a moment."
      testing={false}
      onOn={vi.fn()}
      onOff={vi.fn()}
      onPref={vi.fn()}
      onTest={onTest}
    />,
  )
  await user.click(screen.getByRole('button', { name: 'Send a test alert' }))
  expect(onTest).toHaveBeenCalled()
  expect(screen.getByText(/lock screen in a moment/)).toBeInTheDocument()
})

test('no team yet: the hint says to pick one', async () => {
  const { user, bell } = setup('off', [])
  await user.click(bell)
  expect(screen.getByText('Pick your team with ★ first')).toBeInTheDocument()
})

test('an iPhone in Safari is told to add covertwo to the Home Screen', async () => {
  const { user, bell } = setup('install')
  await user.click(bell)
  expect(screen.getByRole('region', { name: 'Alerts' })).toHaveTextContent('Add to Home Screen')
  expect(screen.queryByRole('switch')).not.toBeInTheDocument()
})

test('blocked notifications say where to fix it', async () => {
  const { user, bell } = setup('blocked')
  await user.click(bell)
  expect(screen.getByRole('region', { name: 'Alerts' })).toHaveTextContent(
    'Allow them in your settings',
  )
})

test('Escape and a tap outside close it', async () => {
  const { user, bell } = setup('off')
  await user.click(bell)
  await user.keyboard('{Escape}')
  expect(bell).toHaveAttribute('aria-expanded', 'false')
  expect(bell).toHaveFocus()
  await user.click(bell)
  await user.click(screen.getByText('outside'))
  expect(bell).toHaveAttribute('aria-expanded', 'false')
})
