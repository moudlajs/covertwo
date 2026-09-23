import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { Segmented } from './Segmented'

function Harness() {
  const [v, setV] = useState<'eu' | 'us'>('eu')
  return (
    <Segmented
      label="Time zone"
      name="tz"
      value={v}
      onChange={setV}
      options={[
        { value: 'eu', label: 'EU' },
        { value: 'us', label: 'US' },
      ]}
    />
  )
}

test('is a labelled radio group', () => {
  render(<Harness />)
  expect(screen.getByRole('group', { name: 'Time zone' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'EU' })).toBeChecked()
})

test('switches by click and by arrow key', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByText('US'))
  expect(screen.getByRole('radio', { name: 'US' })).toBeChecked()
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByRole('radio', { name: 'EU' })).toBeChecked()
})
