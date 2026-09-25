import { useContext } from 'react'
import { darkLogo } from '../data/logos'
import { ThemeContext } from '../lib/theme'

/**
 * Decorative team logo: on the dark theme its dark-background variant (the
 * normal logo if that fails to load) with a team-colour glow; on the light
 * theme the normal logo, plain.
 */
export function TeamLogo({ src, glow = null }: { src: string; glow?: string | null }) {
  const dark = useContext(ThemeContext) === 'dark'
  const halo = dark ? glow : null
  return (
    <img
      src={dark ? darkLogo(src) : src}
      onError={(e) => {
        // Fall back once; a missing normal logo must not loop.
        if (e.currentTarget.src !== src) e.currentTarget.src = src
      }}
      alt=""
      width={20}
      height={20}
      className="size-5 shrink-0"
      // A soft glow in the team colour; decorative, never carries meaning.
      style={
        halo ? { filter: `drop-shadow(0 0 5px ${halo}) drop-shadow(0 0 2px ${halo}66)` } : undefined
      }
    />
  )
}
