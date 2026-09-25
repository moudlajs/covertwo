/** Shown only when the very first load fails and there is nothing to keep showing. */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-3 py-8 text-center">
      <p className="font-mono text-xs text-slate-400">Couldn't load scores from ESPN.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded bg-accent px-3 py-1 font-mono text-[11px] font-bold text-on-accent hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none"
      >
        Retry
      </button>
    </div>
  )
}
