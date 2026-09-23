/** EU = Europe/Prague, 24h. US = America/New_York, 12h. */
export type TimeMode = 'eu' | 'us'

const ZONES: Record<
  TimeMode,
  { locale: string; timeZone: string; hour12: boolean; hour: '2-digit' | 'numeric' }
> = {
  eu: { locale: 'en-GB', timeZone: 'Europe/Prague', hour12: false, hour: '2-digit' },
  us: { locale: 'en-US', timeZone: 'America/New_York', hour12: true, hour: 'numeric' },
}

function formatter(mode: TimeMode, options: Intl.DateTimeFormatOptions) {
  const { locale, timeZone, hour12 } = ZONES[mode]
  return new Intl.DateTimeFormat(locale, { timeZone, hour12, ...options })
}

/** Kickoff time, e.g. "22:25" (EU) or "4:25 PM" (US). */
export function formatTime(iso: string, mode: TimeMode): string {
  return formatter(mode, { hour: ZONES[mode].hour, minute: '2-digit' }).format(new Date(iso))
}

/** Calendar day in the mode's time zone as `YYYY-MM-DD`, for grouping. */
export function dayKey(iso: string, mode: TimeMode): string {
  const parts = formatter(mode, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Day heading, e.g. "Sunday 20 Sept" (EU) or "Sunday, Sep 20" (US). */
export function formatDay(iso: string, mode: TimeMode): string {
  return formatter(mode, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(iso))
}
