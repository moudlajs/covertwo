import type { Game } from '../data/game'
import { formatCountdown } from '../time/countdown'
import { formatDay, formatTime, type TimeMode } from '../time/format'

/** Card for days without games: when the next one kicks off. */
export function OffDay({ games, now, mode }: { games: Game[]; now: number; mode: TimeMode }) {
  const next = games
    .filter((g) => g.state === 'pre' && Date.parse(g.startsAt) > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
  return (
    <section
      aria-label="No games today"
      className="border-b border-slate-800 bg-[radial-gradient(ellipse_at_top,rgb(251_191_36/0.08),transparent_70%)] px-3 py-4 text-center font-mono"
    >
      <p className="text-[10px] tracking-widest text-slate-500 uppercase">No games today</p>
      {next ? (
        <>
          <p className="mt-2 text-sm text-slate-300">
            Next <span className="font-bold text-slate-100">{formatDay(next.startsAt, mode)}</span>{' '}
            · <time dateTime={next.startsAt}>{formatTime(next.startsAt, mode)}</time>
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-400 tabular-nums">
            {formatCountdown(Date.parse(next.startsAt) - now)}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-400">This week's games are done.</p>
      )}
    </section>
  )
}
