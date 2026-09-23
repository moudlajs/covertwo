import type { ReactNode } from 'react'
import { Backdrop } from './Backdrop'
import { Header } from './Header'

/** Background plus the single elevated panel everything lives in. */
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
      <div
        data-testid="panel"
        className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-xl bg-slate-900 shadow-[0_0_0_1px_rgb(51_65_85/0.7),0_24px_48px_-12px_rgb(0_0_0/0.85),0_4px_12px_-2px_rgb(0_0_0/0.5)]"
      >
        <div
          aria-hidden="true"
          className="h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-rose-500"
        />
        <Header controls={controls} />
        <main>{children}</main>
        {footer && (
          <footer className="flex justify-between border-t border-slate-800 px-3 py-1.5 font-mono text-[10px] text-slate-500">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
