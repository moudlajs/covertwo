import type { Season } from '../data/season'
import { stepWeek } from '../data/season'

const ARROW =
  'grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-30 disabled:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none'

/**
 * "‹ Wk 3 ›": step one week, or pick any week from the native list (grouped
 * by preseason / regular season / postseason). The label turns amber when
 * the shown week isn't the current one. Tells the parent the chosen week id,
 * "seasonType:week".
 */
export function WeekPicker({
  season,
  value,
  onChange,
}: {
  season: Season
  /** The shown week id. */
  value: string
  onChange: (id: string) => void
}) {
  const prev = stepWeek(season.weeks, value, -1)
  const next = stepWeek(season.weeks, value, 1)
  const types = [...new Set(season.weeks.map((w) => w.seasonType))]
  const shown = season.weeks.find((w) => w.id === value)
  return (
    <div className="flex items-center font-mono text-[11px]">
      <button
        type="button"
        aria-label="Previous week"
        disabled={!prev}
        onClick={() => prev && onChange(prev.id)}
        className={ARROW}
      >
        ‹
      </button>
      {/* The visible label is ours; an invisible native select on top opens the
          list. (A visible select sizes itself to its longest option in Safari.) */}
      <div className="relative rounded has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-amber-200">
        <span
          aria-hidden="true"
          className={`block px-1.5 py-0.5 text-center ${value === season.current ? 'text-slate-200' : 'text-amber-300'}`}
        >
          {shown?.short ?? '?'}
        </span>
        <select
          aria-label="Week"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {types.map((type) => (
            <optgroup key={type} label={season.types[type] ?? ''}>
              {season.weeks
                .filter((w) => w.seasonType === type)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id === season.current ? `${w.short} (this week)` : w.short}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>
      <button
        type="button"
        aria-label="Next week"
        disabled={!next}
        onClick={() => next && onChange(next.id)}
        className={ARROW}
      >
        ›
      </button>
    </div>
  )
}
