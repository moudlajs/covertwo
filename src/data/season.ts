/** One week of ESPN's season calendar. `id` is "seasonType:week", e.g. "2:3". */
export type Week = { id: string; seasonType: number; week: string; label: string; short: string }

export type Season = {
  weeks: Week[]
  /** The week this response is for (ESPN's current week when no week is asked). */
  current: string | null
  /** Season type names by number, for grouping (1 Preseason, 2 Regular Season…). */
  types: Record<number, string>
}

type EspnCalendar = {
  leagues?: {
    calendar?: {
      label?: string
      value?: string
      entries?: { label?: string; alternateLabel?: string; value?: string }[]
    }[]
  }[]
  season?: { type?: number }
  week?: { number?: number }
}

/** "Week 3" → "Wk 3" so the stepper stays narrow on phones; other labels as ESPN gives them. */
function shorten(label: string): string {
  return label.replace(/^Week (\d+)$/, 'Wk $1')
}

/** The season calendar and this response's week, or null when ESPN sends none. */
export function mapSeason(json: unknown): Season | null {
  const data = json as EspnCalendar | null
  const calendar = data?.leagues?.[0]?.calendar
  if (!Array.isArray(calendar)) return null
  const weeks: Week[] = []
  const types: Record<number, string> = {}
  for (const type of calendar) {
    const seasonType = Number(type.value)
    if (!Number.isInteger(seasonType) || !type.entries?.length) continue
    types[seasonType] = type.label ?? ''
    for (const e of type.entries) {
      if (!e.value || !e.label) continue
      weeks.push({
        id: `${seasonType}:${e.value}`,
        seasonType,
        week: e.value,
        label: e.label,
        short: shorten(e.alternateLabel ?? e.label),
      })
    }
  }
  if (weeks.length === 0) return null
  const current = `${data?.season?.type}:${data?.week?.number}`
  return { weeks, types, current: weeks.some((w) => w.id === current) ? current : null }
}

/** The week before or after `id` in calendar order (across preseason, regular, postseason). */
export function stepWeek(weeks: Week[], id: string, by: -1 | 1): Week | null {
  const i = weeks.findIndex((w) => w.id === id)
  return i === -1 ? null : (weeks[i + by] ?? null)
}
