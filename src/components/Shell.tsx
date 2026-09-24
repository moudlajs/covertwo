import type { ReactNode } from 'react'
import { Backdrop } from './Backdrop'
import { Header } from './Header'

/**
 * Background plus the single elevated panel everything lives in. The page
 * itself scrolls (no nested scroll area); the header sticks to the top of the
 * viewport and the footer to the bottom, both opaque so rows pass under them.
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
    <div className="min-h-dvh bg-[#0b1020] px-2 py-6 text-slate-100 sm:py-12">
      <Backdrop />
      {/* No overflow-hidden anywhere up the tree: it would break the sticky
          header/footer and clip the menu dropdown. */}
      <div
        data-testid="panel"
        className="relative mx-auto w-full max-w-[560px] rounded-xl bg-slate-900 shadow-[0_0_0_1px_rgb(51_65_85/0.7),0_24px_48px_-12px_rgb(0_0_0/0.85),0_4px_12px_-2px_rgb(0_0_0/0.5)]"
      >
        {/* 46px tall (2px edge + h-11 header); day headings stick right below it. */}
        <div className="sticky top-0 z-20 rounded-t-xl bg-[#070d1f]">
          <div
            aria-hidden="true"
            className="mx-3 h-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-rose-500"
          />
          <Header controls={controls} />
        </div>
        <main>{children}</main>
        {footer && (
          <footer className="sticky bottom-0 z-20 flex justify-between rounded-b-xl border-t border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-[10px] text-slate-500">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
