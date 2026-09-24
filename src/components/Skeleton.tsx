const ROWS = 8

/** Placeholder rows with the same grid and height as GameRow. */
export function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading games" role="list" data-testid="skeleton">
      <div className="h-[23px] border-y border-slate-800 bg-slate-950/30" />
      <div className="divide-y divide-slate-800/70">
        {Array.from({ length: ROWS }, (_, i) => (
          <div
            key={i}
            role="listitem"
            className="grid animate-pulse grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-1.5 motion-reduce:animate-none"
          >
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-full bg-slate-800" />
              <div className="h-3 w-8 rounded bg-slate-800" />
            </div>
            <div className="flex min-w-24 flex-col items-center leading-none">
              <div className="h-[15px] w-12 rounded bg-slate-800" />
              <div className="mt-1 h-2.5 w-10 rounded bg-slate-800/60" />
            </div>
            <div className="flex flex-row-reverse items-center gap-2">
              <div className="size-5 rounded-full bg-slate-800" />
              <div className="h-3 w-8 rounded bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
