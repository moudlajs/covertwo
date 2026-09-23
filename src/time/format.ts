/** EU = Europe/Prague, 24h. US = America/New_York, 12h. */
export type TimeMode = 'eu' | 'us'

const ZONES: Record<
  TimeMode,
  { locale: string; timeZone: string; hour12: boolean; hour: '2-digit' | 'numeric' }
> = {
  eu: { locale: 'en-GB', timeZone: 'Europe/Prague', hour12: false, hour: '2-digit' },
  us: { locale: 'en-US', timeZone: 'America/New_York', hour12: true, hour: 'numeric' },
}

const cache = new Map<string, Intl.DateTimeFormat>()
function formatter(mode: TimeMode, options: Intl.DateTimeFormatOptions) {
  const key = mode + JSON.stringify(options)
  let f = cache.get(key)
  if (!f) {
    const { locale, timeZone, hour12 } = ZONES[mode]
    f = new Intl.DateTimeFormat(locale, { timeZone, hour12, ...options })
    cache.set(key, f)
  }
  return f
}

/** Kickoff time, e.g. "22:25" (EU) or "4:25 PM" (US). */
export function formatTime(iso: string, mode: TimeMode): string {
  return formatter(mode, { hour: ZONES[mode].hour, minute: '2-digit' }).format(new Date(iso))
}
