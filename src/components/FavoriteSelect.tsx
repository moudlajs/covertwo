import type { Favorite } from '../data/useFavorites'

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
    <label className="block">
      <span className="mb-1 block text-slate-500">Favourite team</span>
      <select
        value={value?.id ?? ''}
        onChange={(e) => onChange(options.find((t) => t.id === e.target.value) ?? null)}
        className="w-full cursor-pointer rounded bg-slate-900 px-1.5 py-1 text-slate-200 ring-1 ring-slate-700 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none"
      >
        <option value="">None</option>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  )
}
