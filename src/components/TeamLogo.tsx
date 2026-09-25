import { darkLogo } from '../data/logos'

/** Decorative team logo in its dark-background variant; the normal logo if that fails to load. */
export function TeamLogo({ src, glow = null }: { src: string; glow?: string | null }) {
  return (
    <img
      src={darkLogo(src)}
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
        glow ? { filter: `drop-shadow(0 0 5px ${glow}) drop-shadow(0 0 2px ${glow}66)` } : undefined
      }
    />
  )
}
