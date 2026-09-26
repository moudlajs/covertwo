// The watcher behind lock-screen alerts: keeps the subscriptions and the last
// look at each league, and once a minute (the cron in index.ts) sends what
// changed. The logic takes its storage, ESPN and push sending as arguments, so
// it's tested without Cloudflare; the Alerts class at the end wires them up.
import { mapScoreboard } from '../../src/data/espn'
import { diff, snap, wants, type Alert, type League, type Prefs, type Snap } from './events'

/** The parts of Durable Object storage used here (its key-value API). */
export type Storage = {
  get<T>(key: string): Promise<T | undefined>
  put(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<boolean>
  list<T>(options: { prefix: string }): Promise<Map<string, T>>
}

export type PushSubscriptionJSON = { endpoint: string; keys: { p256dh: string; auth: string } }
export type Subscriber = { subscription: PushSubscriptionJSON; prefs: Prefs }

export type Deps = {
  storage: Storage
  /** ESPN's scoreboard (all FBS for college when a subscriber's team may be unranked). */
  scoreboard: (league: League, allFbs: boolean) => Promise<unknown>
  /** Sends one alert; returns the push service's HTTP status. */
  send: (subscription: PushSubscriptionJSON, alert: Alert) => Promise<number>
  now: () => number
}

/** A cap that keeps the free plan free. */
export const MAX_SUBSCRIBERS = 2000
/** Start checking this long before a kickoff. */
const SOON_MS = 15 * 60_000
/** With nothing on, look again this often (new weeks, schedule changes). */
const QUIET_MS = 60 * 60_000
/** A kickoff this far back with the game not started (postponed): stop waiting. */
const STALE_MS = 6 * 60 * 60_000

async function keyFor(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `sub:${hex.slice(0, 32)}`
}

/** Adds or updates a subscriber. False when full. */
export async function subscribe(deps: Deps, subscriber: Subscriber): Promise<boolean> {
  const key = await keyFor(subscriber.subscription.endpoint)
  const existing = await deps.storage.get(key)
  if (!existing && (await deps.storage.list({ prefix: 'sub:' })).size >= MAX_SUBSCRIBERS)
    return false
  await deps.storage.put(key, subscriber)
  await deps.storage.put('next', 0) // look now: the new subscriber may care about a live game
  return true
}

export async function unsubscribe(deps: Deps, endpoint: string): Promise<void> {
  await deps.storage.delete(await keyFor(endpoint))
}

/** One minute's work: look at the leagues someone cares about and send what changed. */
export async function tick(deps: Deps): Promise<{ looked: boolean; sent: number }> {
  const now = deps.now()
  if (now < ((await deps.storage.get<number>('next')) ?? 0)) return { looked: false, sent: 0 }
  const subscribers = await deps.storage.list<Subscriber>({ prefix: 'sub:' })
  const all = [...subscribers.values()]
  const needs: Record<League, boolean> = {
    nfl: all.some((s) => s.prefs.teams.nfl !== null || s.prefs.close),
    ncaaf: all.some((s) => s.prefs.teams.ncaaf !== null || s.prefs.close || s.prefs.upsets),
  }
  const allFbs = all.some((s) => s.prefs.teams.ncaaf !== null)

  const alerts: Alert[] = []
  let next = now + QUIET_MS
  for (const league of ['nfl', 'ncaaf'] as const) {
    if (!needs[league]) continue
    let games: Snap[]
    try {
      games = mapScoreboard(await deps.scoreboard(league, league === 'ncaaf' && allFbs)).map(snap)
    } catch (error) {
      console.error('[alerts] scoreboard failed', { league, error: String(error) })
      next = now // try again next minute
      continue
    }
    const prev = (await deps.storage.get<Snap[]>(`games:${league}`)) ?? []
    alerts.push(...diff(prev, games, league))
    await deps.storage.put(`games:${league}`, games)
    for (const g of games) {
      if (g.state === 'in') next = now
      const kickoff = Date.parse(g.startsAt)
      if (g.state === 'pre' && kickoff > now - STALE_MS)
        next = Math.min(next, Math.max(now, kickoff - SOON_MS))
    }
  }
  await deps.storage.put('next', next)

  let sent = 0
  for (const [key, subscriber] of subscribers)
    for (const alert of alerts) {
      if (!wants(subscriber.prefs, alert)) continue
      const status = await deps.send(subscriber.subscription, alert).catch(() => 0)
      if (status === 404 || status === 410) {
        await deps.storage.delete(key) // unsubscribed or expired at the push service
        break
      }
      if (status >= 200 && status < 300) sent++
    }
  return { looked: true, sent }
}
