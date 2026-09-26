/**
 * Header icon buttons (favourite, keep screen on, alerts, theme): grey, or
 * amber with a soft amber well while their setting is on. One or the other,
 * never both: the colour classes would fight, and Tailwind's order (amber
 * before slate) would quietly keep the grey.
 */
export function iconButton(on = false): string {
  const base =
    'grid size-7 place-items-center rounded focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none'
  return on
    ? `${base} bg-amber-400/12 text-amber-400 ring-1 ring-amber-400/35 ring-inset hover:bg-amber-400/20`
    : `${base} text-slate-400 hover:bg-slate-800 hover:text-slate-100`
}
