import type { Game } from '../data/game'
import { formatCountdown } from '../time/countdown'
import { formatDay, formatTime, type TimeMode } from '../time/format'

/**
 * The next kickoff, shown whenever nothing is live: "UP NEXT" on a game day,
 * "NO GAMES TODAY" on a day without games (when it also covers an empty rest
 * of the week). Renders nothing on a game day with no kickoff left.
 */
export function NextUp({
  games,
  now,
  mode,
  offDay,
}: {
  games: Game[]
  now: number
  mode: TimeMode
  offDay: boolean
}) {
  const upcoming = games
    .filter((g) => g.state === 'pre' && Date.parse(g.startsAt) > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const next = upcoming[0]
  if (!next && !offDay) return null
  const heading = offDay ? 'No games today' : 'Up next'
  const together = next ? upcoming.filter((g) => g.startsAt === next.startsAt).length : 0

  return (
    <section
      aria-label={heading}
      className="border-b border-slate-800 bg-[radial-gradient(ellipse_at_top,rgb(251_191_36/0.08),transparent_70%)] px-3 py-4 text-center font-mono"
    >
      <p className="text-[10px] tracking-widest text-slate-500 uppercase">{heading}</p>
      {next ? (
        <>
          <p className="mt-2 text-sm text-slate-300">
            {offDay && 'Next '}
            <span className="font-bold text-slate-100">
              {formatDay(next.startsAt, mode)}
            </span> ·{' '}
            {next.timeTbd ? (
              'time TBD'
            ) : (
              <time dateTime={next.startsAt}>{formatTime(next.startsAt, mode)}</time>
            )}
            {together > 1 && <span className="text-slate-400"> · {together} games</span>}
          </p>
          {!next.timeTbd && (
            <p className="mt-1 text-2xl font-bold text-amber-400 tabular-nums">
              {formatCountdown(Date.parse(next.startsAt) - now)}
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-400">This week's games are done.</p>
      )}
    </section>
  )
}
