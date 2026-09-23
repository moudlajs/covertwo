/**
 * Segmented toggle built from native radio inputs, so arrow keys, focus and
 * screen-reader semantics come for free. Also used for NFL/NCAA later.
 */
export function Segmented<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string
  name: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex rounded bg-slate-950 p-0.5 font-mono text-[11px] ring-1 ring-slate-700">
      <legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className="cursor-pointer rounded-sm px-2 py-0.5 text-slate-400 hover:text-slate-100 has-checked:bg-amber-400 has-checked:font-bold has-checked:text-slate-950 has-focus-visible:ring-2 has-focus-visible:ring-amber-200"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  )
}
