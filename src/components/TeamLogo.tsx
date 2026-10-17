import { useContext } from 'react'
import { darkLogo } from '../data/logos'
import { ThemeContext } from '../lib/theme'

/**
 * Decorative team logo: on the dark theme its dark-background variant (the
 * normal logo if that fails to load), on the light theme the normal logo.
 * No effect around it: the logo carries the team colour on its own (#241).
 */
export function TeamLogo({ src }: { src: string }) {
  const dark = useContext(ThemeContext) === 'dark'
  return (
    <img
      src={dark ? darkLogo(src) : src}
      onError={(e) => {
        // Fall back once; a missing normal logo must not loop.
        if (e.currentTarget.src !== src) e.currentTarget.src = src
      }}
      alt=""
      width={24}
      height={24}
      className="size-6 shrink-0"
    />
  )
}
