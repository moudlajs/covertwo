import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { AlertPrefs, PushState } from '../lib/push'
import { iconButton } from './iconButton'

function Switch({
  name,
  hint,
  checked,
  disabled = false,
  onChange,
}: {
  name: string
  hint: ReactNode
  checked: boolean
  disabled?: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <label
      className={`flex items-center gap-3 px-3.5 py-2 ${disabled ? 'opacity-50' : 'cursor-pointer hover:bg-slate-900'}`}
    >
      <span className="grid flex-1 gap-0.5">
        <span className="text-[12px] text-slate-100">{name}</span>
        <span className="text-[10.5px] text-slate-500">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-label={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-5 w-[34px] shrink-0 rounded-full bg-slate-700 transition-colors peer-checked:bg-amber-400 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-200 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-slate-200 after:transition-transform peer-checked:after:translate-x-3.5 peer-checked:after:bg-slate-950 motion-reduce:transition-none motion-reduce:after:transition-none"
      />
    </label>
  )
}

const HEADING = 'px-3.5 pt-2.5 pb-1 text-[10px] tracking-wider text-label uppercase'

/**
 * 🔔 in the header: a panel with lock-screen alerts for this device. It stays
 * open while you change things, and closes on a tap outside, Escape or 🔔.
 */
export function AlertsButton({
  state,
  prefs,
  busy,
  failed,
  teams,
  testResult = null,
  onOn,
  onOff,
  onPref,
  onTest = () => {},
}: {
  state: PushState | null
  prefs: AlertPrefs
  busy: boolean
  failed: boolean
  /** Your team per league, for the hints ("Baltimore Ravens"). */
  teams: string[]
  /** What the last test alert did, in words. */
  testResult?: string | null
  onOn: () => void
  onOff: () => void
  onPref: (key: keyof AlertPrefs, on: boolean) => void
  onTest?: () => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
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

  const on = state === 'on'
  const teamHint = teams.length ? teams.join(' · ') : 'Pick your team with ★ first'
  let body: ReactNode
  if (state === 'install')
    body = (
      <p className="px-3.5 pb-3 leading-relaxed text-slate-300">
        On iPhone, alerts come to the Home Screen app: tap Share, then{' '}
        <b className="font-bold text-slate-100">Add to Home Screen</b>, and open covertwo from
        there.
      </p>
    )
  else if (state === 'blocked')
    body = (
      <p className="px-3.5 pb-3 leading-relaxed text-slate-300">
        Notifications are blocked for covertwo. Allow them in your settings, then come back here.
      </p>
    )
  else if (state === 'unsupported' || state === null)
    body = (
      <p className="px-3.5 pb-3 leading-relaxed text-slate-300">
        {state === null ? 'Checking…' : "This browser can't show alerts."}
      </p>
    )
  else
    body = (
      <>
        <Switch
          name="On this device"
          hint={on ? 'Alerts reach your lock screen' : 'Even when covertwo is closed'}
          checked={on}
          disabled={busy}
          onChange={(v) => (v ? onOn() : onOff())}
        />
        {on && (
          <div className="grid gap-1 px-3.5 pb-2">
            <button
              type="button"
              onClick={onTest}
              className="w-fit text-amber-400 underline decoration-amber-400/40 underline-offset-2 hover:text-amber-300"
            >
              Send a test alert
            </button>
            <p aria-live="polite" className="text-[10.5px] leading-relaxed text-slate-400">
              {testResult}
            </p>
          </div>
        )}
        {failed && (
          <p role="alert" className="px-3.5 pb-1 text-rose-400">
            That didn&apos;t work. Check your connection and try again.
          </p>
        )}
        <div className={`${HEADING} border-t border-slate-800`}>Your team</div>
        <Switch
          name="Scores"
          hint={teamHint}
          checked={prefs.scores}
          onChange={(v) => onPref('scores', v)}
        />
        <Switch
          name="Kickoff and final"
          hint="When it starts and ends"
          checked={prefs.kickoffFinal}
          onChange={(v) => onPref('kickoffFinal', v)}
        />
        <div className={`${HEADING} border-t border-slate-800`}>Any game</div>
        <Switch
          name="Close finishes"
          hint="Last 5 min, within 8 points"
          checked={prefs.close}
          onChange={(v) => onPref('close', v)}
        />
        <Switch
          name="College upsets"
          hint="A ranked team losing late"
          checked={prefs.upsets}
          onChange={(v) => onPref('upsets', v)}
        />
        <div className="h-1.5" />
      </>
    )

  return (
    // Not positioned: the panel hangs from the header's right edge (the sticky
    // header block is its positioned ancestor), not from the bell mid-row.
    <div ref={root}>
      <button
        ref={button}
        type="button"
        aria-label="Alerts"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={iconButton(on)}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[18px]"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      </button>
      <div
        id={panelId}
        role="region"
        aria-label="Alerts"
        hidden={!open}
        className="absolute top-full right-2 z-30 mt-1 w-72 max-w-[calc(100%-1rem)] overflow-hidden rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 shadow-xl ring-1 ring-slate-700"
      >
        <div className="px-3.5 pt-3 pb-2">
          <p className="text-[13px] font-bold text-slate-100">Alerts</p>
          <p className="text-[10.5px] text-slate-500">
            On your lock screen, even with covertwo closed
          </p>
        </div>
        {body}
      </div>
    </div>
  )
}
