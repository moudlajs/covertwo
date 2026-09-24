import { useState } from 'react'
import type { Game } from '../data/game'
import { groupByDay } from '../time/days'
import type { TimeMode } from '../time/format'
import { GameRow } from './GameRow'

/** Games grouped under day headings, in the selected time zone. */
export function ScoreList({
  games,
  mode,
  flashing,
}: {
  games: Game[]
  mode: TimeMode
  flashing?: Map<string, ('home' | 'away')[]>
}) {
  // One row open at a time.
  const [open, setOpen] = useState<string | null>(null)
  return groupByDay(games, mode).map((day) => (
    <section key={day.key} aria-labelledby={`day-${day.key}`}>
      <h2
        id={`day-${day.key}`}
        className="sticky top-0 z-[1] flex items-center gap-2 border-y border-slate-800 bg-[#0b1224] px-3 py-1 font-mono text-[10px] tracking-wider text-amber-400/80 uppercase"
      >
        {day.label}
        <span className="text-slate-600">
          {day.games.length} {day.games.length === 1 ? 'game' : 'games'}
        </span>
      </h2>
      <ul className="divide-y divide-slate-800/70">
        {day.games.map((g) => (
          <GameRow
            key={g.id}
            game={g}
            mode={mode}
            flashing={flashing?.get(g.id)}
            expanded={open === g.id}
            onToggle={() => setOpen((o) => (o === g.id ? null : g.id))}
          />
        ))}
      </ul>
    </section>
  ))
}
