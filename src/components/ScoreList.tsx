import { useState, type ReactNode } from 'react'
import type { Game } from '../data/game'
import type { League } from '../data/leagues'
import { groupByDay, type Day } from '../time/days'
import { dayKey, formatDay, type TimeMode } from '../time/format'
import { useSessionSet } from '../lib/useSessionSet'
import { GameRow } from './GameRow'

const HEADING =
  'sticky top-[var(--header-h,46px)] z-10 flex items-center gap-2 border-y border-slate-800 bg-heading px-3 py-1 font-mono text-[10px] tracking-wider text-label uppercase'

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
  league = 'nfl',
  foldPast = true,
}: {
  games: Game[]
  mode: TimeMode
  flashing?: Map<string, ('home' | 'away')[]>
  /** Favourite team id. */
  favorite?: string | null
  now?: number
  /** Scopes the remembered day toggles, so NFL and college don't share them. */
  league?: League
  /** Fold finished past days; off when browsing another week (you went there to see it). */
  foldPast?: boolean
}) {
  // One row open at a time.
  const [open, setOpen] = useState<string | null>(null)
  // Days the user opened or closed this session, per league.
  const [flipped, toggleDay] = useSessionSet('covertwo:flipped-days')
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

  // Every day heading toggles its games. Past days where every game is final
  // start folded; the rest start open. Today never folds by default, nor does
  // the most recent past day: on Monday morning Sunday's results stay open.
  const days = groupByDay(rest, mode)
  const today = dayKey(new Date(now ?? Date.now()).toISOString(), mode)
  const lastPast = days.filter((d) => d.key < today).at(-1)?.key
  const finished = (day: Day) =>
    foldPast &&
    day.key < today &&
    day.key !== lastPast &&
    day.games.every((g) => g.state === 'post')
  const daySection = (day: Day) => {
    const folds = finished(day)
    // A tap is remembered against the day's default, so it lapses once that changes.
    const flip = `${league}:${day.key}:${folds ? 'opened' : 'closed'}`
    const isOpen = folds === flipped.has(flip)
    return (
      <section key={day.key} aria-labelledby={`day-${day.key}`}>
        <h2 id={`day-${day.key}`} className={HEADING.replace(' px-3', '')}>
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={`games-${day.key}`}
            onClick={() => toggleDay(flip)}
            className="flex w-full cursor-pointer items-center gap-2 px-3 text-left uppercase hover:text-amber-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-300/60"
          >
            <span aria-hidden="true" className="w-2 text-slate-500">
              {isOpen ? '▾' : '▸'}
            </span>
            {day.label}
            <span className="text-slate-600">
              {day.games.length} {day.games.length === 1 ? 'game' : 'games'}
              {folds && ' · final'}
            </span>
          </button>
        </h2>
        <div id={`games-${day.key}`} hidden={!isOpen}>
          {rows(day.games)}
        </div>
      </section>
    )
  }

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
      {days.map(daySection)}
    </>
  )
}
