import { useState, type ReactNode } from 'react'
import type { Game } from '../data/game'
import { groupByDay } from '../time/days'
import { formatDay, type TimeMode } from '../time/format'
import { GameRow } from './GameRow'

const HEADING =
  'sticky top-[var(--header-h,46px)] z-10 flex items-center gap-2 border-y border-slate-800 bg-[#0b1224] px-3 py-1 font-mono text-[10px] tracking-wider text-amber-400/80 uppercase'

/**
 * Games grouped under day headings, in the selected time zone. The favourite
 * team's game is pinned above them (and not repeated in its day).
 */
export function ScoreList({
  games,
  mode,
  flashing,
  favorite = null,
  now,
}: {
  games: Game[]
  mode: TimeMode
  flashing?: Map<string, ('home' | 'away')[]>
  /** Favourite team id. */
  favorite?: string | null
  now?: number
}) {
  // One row open at a time.
  const [open, setOpen] = useState<string | null>(null)
  const isFavorite = (g: Game) => g.home.id === favorite || g.away.id === favorite
  const pinned = favorite ? games.filter(isFavorite) : []
  const rest = pinned.length > 0 ? games.filter((g) => !isFavorite(g)) : games

  const rows = (list: Game[], highlight = false) => (
    <ul className="divide-y divide-slate-800/70">
      {list.map((g) => (
        <GameRow
          key={g.id}
          game={g}
          mode={mode}
          flashing={flashing?.get(g.id)}
          expanded={open === g.id}
          onToggle={() => setOpen((o) => (o === g.id ? null : g.id))}
          highlight={highlight}
          now={now}
        />
      ))}
    </ul>
  )
  const section = (key: string, heading: ReactNode, list: Game[], highlight = false) => (
    <section key={key} aria-labelledby={`day-${key}`}>
      <h2 id={`day-${key}`} className={HEADING}>
        {heading}
      </h2>
      {rows(list, highlight)}
    </section>
  )

  const first = pinned[0]
  const team = first && (first.home.id === favorite ? first.home : first.away)
  return (
    <>
      {first &&
        team &&
        section(
          'favorite',
          <>
            <span aria-hidden="true">★</span>
            <span className="sr-only">Your team:</span> {team.name}
            <span className="text-slate-600">{formatDay(first.startsAt, mode)}</span>
          </>,
          pinned,
          true,
        )}
      {groupByDay(rest, mode).map((day) =>
        section(
          day.key,
          <>
            {day.label}
            <span className="text-slate-600">
              {day.games.length} {day.games.length === 1 ? 'game' : 'games'}
            </span>
          </>,
          day.games,
        ),
      )}
    </>
  )
}
