/** Menu setting: keep the screen on while games are live. */
export function KeepAwakeToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <label className="mt-3 flex cursor-pointer items-start gap-2 text-slate-300">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-3.5 cursor-pointer accent-amber-400"
      />
      <span>
        Keep screen on
        <span className="block text-slate-500">while games are live</span>
      </span>
    </label>
  )
}
