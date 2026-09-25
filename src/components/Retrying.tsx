/**
 * Small footer status: "offline" while showing a saved copy (no network), and
 * "retrying…" while showing stale data after a failed load.
 */
export function Retrying({ active, offline = false }: { active: boolean; offline?: boolean }) {
  // The live region stays mounted so the change is announced.
  return (
    <span role="status" className="flex items-center gap-2 text-label">
      {offline && (
        <span className="rounded-sm bg-slate-800 px-1.5 font-bold text-slate-300 uppercase">
          offline
        </span>
      )}
      {active && (
        <span className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="size-1.5 animate-pulse rounded-full bg-amber-400 motion-reduce:animate-none"
          />
          retrying…
        </span>
      )}
    </span>
  )
}
