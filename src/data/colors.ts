/** WCAG relative luminance of a 6-digit hex colour (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const n = parseInt(hex, 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}

const HEX = /^[0-9a-f]{6}$/i
/** Above this, a glow would read as white glare rather than a team colour. */
const GLARE = 0.8

/**
 * The team colour that reads better on the dark panel: the brighter of
 * ESPN's primary and alternate, unless that one is near-white.
 */
export function teamColor(primary?: string, alternate?: string): string | null {
  const valid = [primary, alternate].filter((h): h is string => !!h && HEX.test(h))
  const usable = valid.filter((h) => luminance(h) <= GLARE)
  const pick = usable.sort((a, b) => luminance(b) - luminance(a))[0]
  return pick ? `#${pick.toLowerCase()}` : null
}
