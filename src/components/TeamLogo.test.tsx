import { fireEvent, render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ThemeContext } from '../lib/theme'
import { TeamLogo } from './TeamLogo'

const normal = 'https://a.espncdn.com/i/teamlogos/ncaa/500/213.png'

test('uses the dark variant, decorative', () => {
  const { container } = render(<TeamLogo src={normal} />)
  const img = container.querySelector('img')
  expect(img).toHaveAttribute('src', 'https://a.espncdn.com/i/teamlogos/ncaa/500-dark/213.png')
  expect(img).toHaveAttribute('alt', '')
})

test('glows in the team colour when there is one', () => {
  const { container, rerender } = render(<TeamLogo src={normal} glow="#241773" />)
  expect(container.querySelector('img')?.style.filter).toContain('#241773')
  rerender(<TeamLogo src={normal} />)
  expect(container.querySelector('img')?.style.filter).toBe('')
})

test('falls back to the normal logo once if the dark one fails', () => {
  const { container } = render(<TeamLogo src={normal} />)
  const img = container.querySelector('img') as HTMLImageElement
  fireEvent.error(img)
  expect(img.src).toBe(normal)
  fireEvent.error(img) // the normal one failing too must not loop
  expect(img.src).toBe(normal)
})

test('light theme: the normal logo, no glow', () => {
  const { container } = render(
    <ThemeContext value="light">
      <TeamLogo src={normal} glow="#241773" />
    </ThemeContext>,
  )
  const img = container.querySelector('img')
  expect(img).toHaveAttribute('src', normal)
  expect(img?.style.filter).toBe('')
})
