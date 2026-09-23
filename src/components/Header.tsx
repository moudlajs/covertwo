import type { ReactNode } from 'react'

/**
 * Title on the left, controls on the right. The league slot is reserved for
 * the NFL/NCAA toggle (M3) and stays hidden until then; it sits in the same
 * row, so showing it needs no layout change.
 */
export function Header({ controls }: { controls?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 bg-slate-950/60 px-3 py-2.5">
      <h1 className="font-mono text-sm font-bold tracking-tight">
        covertwo
        <span aria-hidden="true" className="text-amber-400">
          _
        </span>
      </h1>
      <div data-slot="league" hidden />
      <div className="ml-auto flex items-center gap-2">{controls}</div>
    </header>
  )
}
