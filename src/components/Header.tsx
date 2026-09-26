import type { ReactNode } from 'react'

/** Title on the left; your settings (team, screen, theme) and the time zone on the right. */
export function Header({ controls }: { controls?: ReactNode }) {
  return (
    <header className="flex h-11 items-center gap-2 px-3">
      {/* "two" in amber: the name is a football pun (Cover 2 defense). */}
      <h1 className="font-mono text-base font-bold tracking-tight">
        cover<span className="text-amber-400">two</span>
        <span aria-hidden="true">_</span>
      </h1>
      <div className="ml-auto flex items-center gap-1.5">{controls}</div>
    </header>
  )
}
