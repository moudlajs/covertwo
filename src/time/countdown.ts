const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Countdowns are shown for games starting within this window. */
export const COUNTDOWN_WINDOW_MS = 12 * HOUR

/**
 * Time until kickoff: "in 2d 3h", "in 2h 14m", "in 14m". At or past kickoff
 * it says "starting": the switch to live comes from ESPN's data, not the clock.
 */
export function formatCountdown(ms: number): string {
  if (ms < MINUTE) return ms <= 0 ? 'starting' : 'in <1m'
  const d = Math.floor(ms / DAY)
  const h = Math.floor((ms % DAY) / HOUR)
  const m = Math.floor((ms % HOUR) / MINUTE)
  if (d > 0) return `in ${d}d ${h}h`
  if (h > 0) return `in ${h}h ${m}m`
  return `in ${m}m`
}
