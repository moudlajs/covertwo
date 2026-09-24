import { useEffect, useState } from 'react'

/**
 * A choice among fixed string options, persisted in localStorage. Unknown
 * stored values and blocked storage (private mode) fall back to `fallback`;
 * the choice still works for the visit.
 */
export function usePersistedChoice<T extends string>(
  key: string,
  options: readonly T[],
  fallback: T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return options.find((o) => o === stored) ?? fallback
    } catch {
      return fallback
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Not persisting is fine.
    }
  }, [key, value])
  return [value, setValue] as const
}
