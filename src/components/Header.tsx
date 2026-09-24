import type { ReactNode } from 'react'

/**
 * Title, then the league switch, then the other controls on the right. The
 * league slot was reserved in the layout from the start; it sits in the same
 * row, so showing it needs no layout change.
 */
export function Header({ league, controls }: { league?: ReactNode; controls?: ReactNode }) {
  return (
    <header className="flex h-11 items-center gap-3 px-3">
      <h1 className="font-mono text-sm font-bold tracking-tight">
        covertwo
        <span aria-hidden="true" className="text-amber-400">
          _
        </span>
      </h1>
      <div data-slot="league">{league}</div>
      <div className="ml-auto flex items-center gap-2">{controls}</div>
    </header>
  )
}
