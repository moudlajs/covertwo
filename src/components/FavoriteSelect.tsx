import type { Favorite } from '../data/useFavorites'
import { ROW, SettingText } from './SettingRow'

/**
 * Settings row: the favourite team as a value with a ›. The phone's own
 * picker opens from an invisible native select laid over the whole row.
 */
export function FavoriteSelect({
  teams,
  value,
  onChange,
}: {
  teams: { id: string; name: string }[]
  value: Favorite
  onChange: (favorite: Favorite) => void
}) {
  // Keep a stored favourite selectable even if it's missing from the list
  // (e.g. a team that left FBS).
  const options = value && !teams.some((t) => t.id === value.id) ? [value, ...teams] : teams
  return (
    <div
      className={`${ROW} relative hover:bg-slate-900 has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-amber-200 has-[select:focus-visible]:ring-inset`}
    >
      <SettingText name="Favourite team" hint="Pinned to the top" />
      <span aria-hidden="true" className="flex min-w-0 items-center gap-1 text-slate-300">
        <span className="truncate">{value?.name ?? 'None'}</span>
        <span className="text-slate-500">›</span>
      </span>
      <select
        aria-label="Favourite team"
        value={value?.id ?? ''}
        onChange={(e) => onChange(options.find((t) => t.id === e.target.value) ?? null)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">None</option>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  )
}
