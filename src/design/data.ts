// Throwaway data shaping for the design exploration only. The real mapper is
// issue #16; this file is deleted with the variants once a design is chosen.
import fixture from '../../fixtures/espn-scoreboard.json'

export type Side = { abbr: string; name: string; logo: string; score: string; winner: boolean }
export type Row = {
  id: string
  state: 'pre' | 'in' | 'post'
  kickoff: string
  status: string
  network: string
  away: Side
  home: Side
  redZone: boolean
  possession: 'home' | 'away' | null
}
export type Day = { label: string; rows: Row[] }

const TZ = 'Europe/Prague'
const time = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
const day = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})
const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short' })

function status(s: (typeof fixture.events)[number]['status'], start: Date): string {
  if (s.type.state === 'pre') return `${weekday.format(start)} ${time.format(start)}`
  if (s.type.state === 'post') return s.type.shortDetail
  if (s.type.name === 'STATUS_HALFTIME') return 'Halftime'
  return `Q${s.period} · ${s.displayClock}`
}

export function days(): Day[] {
  const byDay = new Map<string, Row[]>()
  for (const e of fixture.events) {
    const c = e.competitions[0]
    if (!c) continue
    const start = new Date(e.date)
    const side = (homeAway: string): Side => {
      const t = c.competitors.find((x) => x.homeAway === homeAway)
      return {
        abbr: t?.team.abbreviation ?? '',
        name: t?.team.displayName ?? '',
        logo: t?.team.logo ?? '',
        score: t?.score ?? '',
        winner: Boolean(t && 'winner' in t && t.winner),
      }
    }
    const sit = 'situation' in c ? (c.situation as Record<string, unknown>) : undefined
    const home = c.competitors.find((x) => x.homeAway === 'home')
    const row: Row = {
      id: e.id,
      state: e.status.type.state as Row['state'],
      kickoff: time.format(start),
      status: status(e.status, start),
      network: c.broadcast ?? '',
      away: side('away'),
      home: side('home'),
      redZone: sit?.isRedZone === true,
      possession: sit?.possession ? (sit.possession === home?.team.id ? 'home' : 'away') : null,
    }
    const key = day.format(start)
    byDay.set(key, [...(byDay.get(key) ?? []), row])
  }
  return [...byDay].map(([label, rows]) => ({ label, rows }))
}

export function downDistance(id: string): string {
  const e = fixture.events.find((x) => x.id === id)
  const c = e?.competitions[0]
  const sit = c && 'situation' in c ? (c.situation as Record<string, unknown>) : undefined
  return typeof sit?.downDistanceText === 'string' ? sit.downDistanceText : ''
}

/** `?league` in the URL reveals the reserved NFL/NCAA toggle slot. */
export const showLeague = new URLSearchParams(location.search).has('league')
