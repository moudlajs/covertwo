import { useCallback, useEffect, useState } from 'react'

/** A set of strings kept in sessionStorage (this tab only). Storage failures are ignored. */
export function useSessionSet(key: string) {
  const [set, setSet] = useState<Set<string>>(() => {
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem(key) ?? '[]')
      return new Set(Array.isArray(stored) ? stored.filter((v) => typeof v === 'string') : [])
    } catch {
      return new Set()
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify([...set]))
    } catch {
      // Not persisting is fine.
    }
  }, [key, set])
  const toggle = useCallback(
    (value: string) =>
      setSet((s) => {
        const next = new Set(s)
        if (next.has(value)) next.delete(value)
        else next.add(value)
        return next
      }),
    [],
  )
  return [set, toggle] as const
}
