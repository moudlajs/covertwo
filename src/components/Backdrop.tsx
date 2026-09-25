const HASH_BAND = {
  background: 'repeating-linear-gradient(90deg, var(--hash) 0 3px, transparent 3px 44px)',
  maskImage: 'linear-gradient(transparent, black 30%, black 70%, transparent)',
}

/** Warm glow and two bands of hash marks, partly hidden behind the panel. */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgb(251_191_36/0.14),transparent_45%),radial-gradient(ellipse_at_100%_100%,rgb(56_189_248/0.08),transparent_40%)]" />
      <div
        className="absolute -top-20 -left-1/4 h-72 w-[150%] -rotate-[8deg] opacity-60"
        style={HASH_BAND}
      />
      <div
        className="absolute -bottom-24 -left-1/4 h-72 w-[150%] -rotate-[8deg] opacity-40"
        style={HASH_BAND}
      />
    </div>
  )
}
