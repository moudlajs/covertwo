import { darkLogo } from '../data/logos'

/** Decorative team logo in its dark-background variant; the normal logo if that fails to load. */
export function TeamLogo({ src }: { src: string }) {
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
    />
  )
}
