// Shared header controls for the design variants; each variant passes its own
// classes. Deleted with the variants once a design is chosen.
import { showLeague } from './data'

type Seg = { track: string; on: string; off: string }

export function Segmented({ label, options, seg }: { label: string; options: string[]; seg: Seg }) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex ${seg.track}`}>
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={i === 0}
          className={i === 0 ? seg.on : seg.off}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function Hamburger({ className }: { className: string }) {
  return (
    <button type="button" aria-label="Menu" aria-expanded="false" className={className}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}

/** Reserved slot: always takes no space when hidden, so revealing it is additive. */
export function LeagueSlot({ seg }: { seg: Seg }) {
  if (!showLeague) return null
  return <Segmented label="League" options={['NFL', 'NCAA']} seg={seg} />
}

export function Ball({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 10" className={className} role="img" aria-label="has possession">
      <ellipse cx="8" cy="5" rx="7.5" ry="4.5" fill="currentColor" />
      <path d="M5 5h6M6.5 3.8v2.4M8 3.8v2.4M9.5 3.8v2.4" stroke="#000" strokeOpacity=".5" />
    </svg>
  )
}
