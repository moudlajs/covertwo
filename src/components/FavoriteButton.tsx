import type { Favorite } from '../data/useFavorites'
import { iconButton } from './iconButton'

/**
 * ★ in the header: one tap opens the phone's own team picker (an invisible
 * native select laid over the icon). Filled amber while a team is pinned.
 */
export function FavoriteButton({
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
    <span
      className={`relative ${iconButton(value !== null)} has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-amber-200`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        aria-hidden="true"
        fill={value ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
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
    </span>
  )
}
