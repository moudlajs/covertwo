import { expect, test } from 'vitest'
import { luminance, teamColor } from './colors'

test('luminance endpoints', () => {
  expect(luminance('000000')).toBe(0)
  expect(luminance('ffffff')).toBeCloseTo(1)
})

test('picks the brighter colour that is not glare', () => {
  expect(teamColor('241773', '000000')).toBe('#241773') // Ravens: purple over black
  expect(teamColor('061440', 'ffffff')).toBe('#061440') // Penn State: navy, not white glare
  expect(teamColor('fb4f14', '002244')).toBe('#fb4f14') // Broncos orange
})

test('missing or invalid colours give null', () => {
  expect(teamColor()).toBeNull()
  expect(teamColor('zzz', '')).toBeNull()
  expect(teamColor('ffffff', 'fefefe')).toBeNull() // only glare
})
