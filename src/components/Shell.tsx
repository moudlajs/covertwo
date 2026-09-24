import type { ReactNode } from 'react'
import { Backdrop } from './Backdrop'
import { Header } from './Header'

/**
 * Background plus the single elevated panel everything lives in. The panel is
 * at most the viewport's height: header and footer stay put and only the main
 * content scrolls. Short content keeps a short panel, pinned at the top.
 */
export function Shell({
  controls,
  footer,
  children,
}: {
  controls?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col bg-[#0b1020] px-2 py-6 text-slate-100 sm:py-12">
      <Backdrop />
      <div
        data-testid="panel"
        className="relative mx-auto flex max-h-full min-h-0 w-full max-w-[560px] flex-col rounded-xl bg-slate-900 shadow-[0_0_0_1px_rgb(51_65_85/0.7),0_24px_48px_-12px_rgb(0_0_0/0.85),0_4px_12px_-2px_rgb(0_0_0/0.5)]"
      >
        {/* No overflow-hidden on the panel, so the menu dropdown is never clipped.
            The edge is inset to stay inside the rounded corners instead. */}
        <div
          aria-hidden="true"
          className="mx-3 h-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-rose-500"
        />
        <Header controls={controls} />
        {/* relative: keeps absolutely positioned descendants (sr-only text) inside
            the scroll container, so they can't stretch the page. */}
        <main className="relative min-h-0 overflow-y-auto overscroll-contain [scrollbar-color:var(--color-slate-700)_transparent] [scrollbar-width:thin]">
          {children}
        </main>
        {footer && (
          <footer className="flex justify-between border-t border-slate-800 px-3 py-1.5 font-mono text-[10px] text-slate-500">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
