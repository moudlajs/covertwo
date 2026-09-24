import { useCallback, useEffect, useState } from 'react'
import type { League } from './leagues'

export type Favorite = { id: string; name: string } | null
export type Favorites = Record<League, Favorite>

const KEY = 'covertwo:favorites'
const DEFAULTS: Favorites = { nfl: { id: '33', name: 'Baltimore Ravens' }, ncaaf: null }

function valid(f: unknown): f is Favorite {
  if (f === null) return true
  const t = f as { id?: unknown; name?: unknown }
  return typeof t?.id === 'string' && typeof t.name === 'string'
}

function read(): Favorites {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Favorites> | null
    return {
      nfl: stored && valid(stored.nfl) ? stored.nfl : DEFAULTS.nfl,
      ncaaf: stored && valid(stored.ncaaf) ? stored.ncaaf : DEFAULTS.ncaaf,
    }
  } catch {
    return DEFAULTS // blocked storage or unparsable JSON
  }
}

/**
 * Favourite team per league, persisted in localStorage. Defaults: Baltimore
 * Ravens in the NFL, none in college. The name is stored too so a college
 * favourite can be shown when their game isn't in the loaded slate.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorites>(read)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(favorites))
    } catch {
      // Not persisting is fine.
    }
  }, [favorites])
  const setFavorite = useCallback(
    (league: League, favorite: Favorite) => setFavorites((f) => ({ ...f, [league]: favorite })),
    [],
  )
  return [favorites, setFavorite] as const
}
