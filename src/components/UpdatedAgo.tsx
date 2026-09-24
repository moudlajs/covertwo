import { useEffect, useState } from 'react'
import { formatAgo } from '../time/ago'

/**
 * "updated 12s ago" for the last successful load. Ticks every second while a
 * game is live, every 15s otherwise. Renders nothing before the first load.
 */
export function UpdatedAgo({ at, live }: { at: number | null; live: boolean }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), live ? 1_000 : 15_000)
    return () => clearInterval(id)
  }, [live])
  if (at === null) return null
  return (
    <span className="tabular-nums">
      updated <time dateTime={new Date(at).toISOString()}>{formatAgo(now - at)}</time>
    </span>
  )
}
