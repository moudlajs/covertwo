import { fireEvent, render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { TeamLogo } from './TeamLogo'

const normal = 'https://a.espncdn.com/i/teamlogos/ncaa/500/213.png'

test('uses the dark variant, decorative', () => {
  const { container } = render(<TeamLogo src={normal} />)
  const img = container.querySelector('img')
  expect(img).toHaveAttribute('src', 'https://a.espncdn.com/i/teamlogos/ncaa/500-dark/213.png')
  expect(img).toHaveAttribute('alt', '')
})

test('falls back to the normal logo once if the dark one fails', () => {
  const { container } = render(<TeamLogo src={normal} />)
  const img = container.querySelector('img') as HTMLImageElement
  fireEvent.error(img)
  expect(img.src).toBe(normal)
  fireEvent.error(img) // the normal one failing too must not loop
  expect(img.src).toBe(normal)
})
