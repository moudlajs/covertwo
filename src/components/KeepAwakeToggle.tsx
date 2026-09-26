import { ROW, SettingText } from './SettingRow'

/** Settings row: keep the screen on while games are live, as a switch. */
export function KeepAwakeToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <label className={`${ROW} cursor-pointer hover:bg-slate-900`}>
      <SettingText name="Keep screen on" hint="While games are live" />
      <input
        type="checkbox"
        role="switch"
        aria-label="Keep screen on"
        checked={value}
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
