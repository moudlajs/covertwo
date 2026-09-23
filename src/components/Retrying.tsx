/** Small footer indicator while showing stale data after a failed load. */
export function Retrying({ active }: { active: boolean }) {
  // The live region stays mounted so the change is announced.
  return (
    <span role="status" className="flex items-center gap-1 text-amber-400/80">
      {active && (
        <>
          <span
            aria-hidden="true"
            className="size-1.5 animate-pulse rounded-full bg-amber-400 motion-reduce:animate-none"
          />
          retrying…
        </>
      )}
    </span>
  )
}
