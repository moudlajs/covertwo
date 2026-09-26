import type { CSSProperties, ReactNode } from 'react'
import { Backdrop } from './Backdrop'
import { Header } from './Header'

/**
 * Background plus the single elevated panel everything lives in. The page
 * itself scrolls (no nested scroll area); the header sticks to the top of the
 * viewport and the footer to the bottom, both opaque so rows pass under them.
 */
export function Shell({
  demo = false,
  league,
  view,
  controls,
  footer,
  toast,
  children,
}: {
  /** Show the DEMO badge next to the title. */
  demo?: boolean
  /** Second header row, left: which league. */
  league?: ReactNode
  /** Second header row, right: the week picker, and on college which games (Top 25 / All FBS). */
  view?: ReactNode
  controls?: ReactNode
  footer?: ReactNode
  /** Shown just above the footer (the Toast). */
  toast?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-page px-2 py-6 text-slate-100 app:p-0 sm:py-12">
      <Backdrop />
      {/* No overflow-hidden anywhere up the tree: it would break the sticky
          header/footer and clip the menu dropdown. */}
      <div
        data-testid="panel"
        // Height of the pinned header block (plus the status bar in the app);
        // day headings stick right below it. Scaled per screen size by
        // --panel-scale (see index.css).
        style={{ '--header-h': 'calc(86px + env(safe-area-inset-top, 0px))' } as CSSProperties}
        className="relative mx-auto w-full max-w-[560px] rounded-xl [zoom:var(--panel-scale)] bg-slate-900 shadow-[var(--panel-shadow)] app:flex app:min-h-dvh app:max-w-none app:flex-col app:rounded-none app:shadow-none"
      >
        {/* Status bar inset + 2px edge + h-11 header + h-10 league row (border included) = --header-h above. */}
        <div
          data-testid="pinned-header"
          className="sticky top-0 z-20 rounded-t-xl bg-chrome pt-[env(safe-area-inset-top)] app:rounded-none"
        >
          <div
            aria-hidden="true"
            className="mx-3 h-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-rose-500"
          />
          <Header controls={controls} demo={demo} />
          <div className="flex h-10 items-center justify-between gap-2 border-t border-slate-800 px-3">
            {league}
            {view}
          </div>
        </div>
        <main className="app:flex-1">{children}</main>
        {footer && (
          <footer className="sticky bottom-0 z-20 flex justify-between rounded-b-xl border-t border-slate-800 bg-slate-900 px-3 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] font-mono text-[10px] text-slate-500 app:rounded-none">
            {footer}
            {toast}
          </footer>
        )}
      </div>
    </div>
  )
}
