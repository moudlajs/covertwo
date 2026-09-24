import type { ReactNode } from 'react'

/** Title on the left, settings (time zone, menu) on the right. */
export function Header({ controls, demo = false }: { controls?: ReactNode; demo?: boolean }) {
  return (
    <header className="flex h-11 items-center gap-3 px-3">
      {/* "two" in amber: the name is a football pun (Cover 2 defense). */}
      <h1 className="font-mono text-base font-bold tracking-tight">
        cover<span className="text-amber-400">two</span>
        <span aria-hidden="true">_</span>
      </h1>
      {demo && (
        <span className="rounded-sm bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">
          DEMO
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">{controls}</div>
    </header>
  )
}
