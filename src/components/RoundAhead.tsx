import type { Game } from '../data/game'
import { formatDay, formatDayRange, formatTime, type TimeMode } from '../time/format'

/** One half of a faint playoff bracket (four → two → one), at a card edge. */
function Bracket({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 160"
      preserveAspectRatio="none"
      className={`absolute inset-y-0 h-full w-10 text-amber-400/15 sm:w-24 ${className}`}
    >
      <path
        d="M0 20H40M0 60H40M0 100H40M0 140H40M40 20V60M40 100V140M40 40H80M40 120H80M80 40V120M80 80H120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * A week whose matchups aren't set yet (future playoff rounds, where ESPN
 * lists "TBD @ TBD"): one calm card with the round, its days and where,
 * instead of rows of placeholders.
 */
export function RoundAhead({
  games,
  round,
  mode,
}: {
  games: Game[]
  round: string
  mode: TimeMode
}) {
  const sorted = [...games].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const first = sorted[0]
  const last = sorted.at(-1)
  if (!first || !last) return null
  const single = sorted.length === 1
  const when =
    single && !first.timeTbd
      ? `${formatDay(first.startsAt, mode)} · ${formatTime(first.startsAt, mode)}`
      : formatDayRange(first.startsAt, last.startsAt, mode)
  const venues = new Set(sorted.map((g) => g.venue))
  const venue = venues.size === 1 ? first.venue : null

  return (
    <section
      aria-labelledby="round-ahead"
      className="relative overflow-hidden bg-[radial-gradient(ellipse_at_center,rgb(251_191_36/0.07),transparent_70%)] px-3 py-12 text-center font-mono"
    >
      <Bracket className="left-0" />
      <Bracket className="right-0 -scale-x-100" />
      <div className="relative">
        <p className="text-[10px] tracking-widest text-slate-500 uppercase">Coming up</p>
        <h2
          id="round-ahead"
          className="mt-2 text-xl font-bold tracking-wider text-amber-400 uppercase"
        >
          {round}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {!single && `${sorted.length} games · `}
          {when}
        </p>
        {venue && <p className="mt-1 text-xs text-slate-400">{venue}</p>}
        <p className="mx-auto mt-5 max-w-60 text-xs leading-relaxed text-slate-500">
          Matchups are set once the games before it are played.
        </p>
      </div>
    </section>
  )
}
