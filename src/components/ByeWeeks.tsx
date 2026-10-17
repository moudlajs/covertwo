import type { ByeTeam } from '../data/byes'

/** "Bye · BAL BUF CIN" under the week's games; nothing when nobody is on bye. */
export function ByeWeeks({ teams }: { teams: ByeTeam[] }) {
  if (teams.length === 0) return null
  return (
    <p className="flex flex-wrap gap-x-2 gap-y-1 border-t border-slate-800 px-3 py-2 font-mono text-[10px] text-slate-400">
      <span className="sr-only">On bye: {teams.map((t) => t.name).join(', ')}</span>
      <span aria-hidden="true" className="text-label uppercase">
        Bye
      </span>
      {teams.map((t) => (
        <span key={t.id} aria-hidden="true">
          {t.abbr}
        </span>
      ))}
    </p>
  )
}
