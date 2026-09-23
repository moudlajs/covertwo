import { useEffect, useId, useRef, useState } from 'react'

/**
 * Hamburger button with a small dropdown panel. A home for future settings;
 * for now it shows the version and a link to the repo. Escape closes it and
 * returns focus to the button; a click outside just closes it.
 */
export function Menu() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    // Escape returns focus to the button; an outside click already put focus
    // where the user wanted it, so it only closes.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
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
        onClick={() => setOpen((o) => !o)}
        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none"
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
        className="absolute top-full right-0 z-10 mt-2 w-48 rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-400 shadow-xl ring-1 ring-slate-700"
      >
        <p className="text-slate-500">Settings coming soon.</p>
        <hr className="my-2 border-slate-800" />
        <p>
          covertwo <span className="text-amber-400">v{__APP_VERSION__}</span>
        </p>
        <a
          href="https://github.com/moudlajs/covertwo"
          className="mt-1 inline-block text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white"
        >
          Source on GitHub
        </a>
      </div>
    </div>
  )
}
