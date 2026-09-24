import type { ReactNode } from 'react'

/** Title on the left, settings (time zone, menu) on the right. */
export function Header({ controls }: { controls?: ReactNode }) {
  return (
    <header className="flex h-11 items-center gap-3 px-3">
      <h1 className="font-mono text-sm font-bold tracking-tight">
        covertwo
        <span aria-hidden="true" className="text-amber-400">
          _
        </span>
      </h1>
      <div className="ml-auto flex items-center gap-2">{controls}</div>
    </header>
  )
}
