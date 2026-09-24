import { CONFERENCES, type ConferenceChoice } from '../data/leagues'

/** Native select: the most accessible and compact control for 12 options. */
export function ConferenceSelect({
  value,
  onChange,
}: {
  value: ConferenceChoice
  onChange: (value: ConferenceChoice) => void
}) {
  return (
    <label className="ml-auto flex items-center">
      <span className="sr-only">Conference</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ConferenceChoice)}
        className="cursor-pointer rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-slate-300 ring-1 ring-slate-700 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none"
      >
        <option value="all">All conferences</option>
        {CONFERENCES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  )
}
