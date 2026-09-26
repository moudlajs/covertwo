import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/** How long the menu stays open after a change, so the change is seen. */
const CLOSE_DELAY_MS = 200

/**
 * Hamburger button with a small dropdown panel: settings, the version and a
 * link to the repo. Changing a setting applies it and closes the menu, as do
 * Escape (which returns focus to the button) and a click outside.
 */
export function Menu({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const closing = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(closing.current), [])

  useEffect(() => {
    if (!open) return
    // Escape returns focus to the button; an outside click already put focus
    // where the user wanted it, so it only closes.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      window.clearTimeout(closing.current)
      setOpen(false)
      button.current?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      if (root.current?.contains(e.target as Node)) return
      window.clearTimeout(closing.current) // a pending close must not pull focus back
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          window.clearTimeout(closing.current)
          setOpen((o) => !o)
        }}
        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div
        id={panelId}
        hidden={!open}
        // A setting changed (change events bubble): apply it and get out of the
        // way, after a beat so a switch is seen flipping.
        onChange={() => {
          window.clearTimeout(closing.current)
          closing.current = window.setTimeout(() => {
            setOpen(false)
            button.current?.focus()
          }, CLOSE_DELAY_MS)
        }}
        className="absolute top-full right-0 z-10 mt-2 w-72 overflow-hidden rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 shadow-xl ring-1 ring-slate-700"
      >
        {children}
        <div className="flex items-center justify-between border-t border-slate-800 px-3.5 py-2.5">
          <span>
            covertwo <span className="text-amber-400">v{__APP_VERSION__}</span>
          </span>
          <a
            href="https://github.com/moudlajs/covertwo"
            className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-slate-100"
          >
            Source on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
