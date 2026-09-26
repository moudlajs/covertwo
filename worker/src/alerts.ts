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
/** What a notification shows; the tag makes a newer one replace an older one. */
export type Message = { title: string; body: string; tag: string }

/** The last check, kept for GET /push/status: aggregates only, no subscriber data. */
export type LastCheck = {
  at: number
  looked: boolean
  leagues: League[]
  alerts: number
  /** The push services' HTTP statuses for this check's sends (0 = network error). */
  sends: number[]
}

export type Deps = {
  storage: Storage
  /** ESPN's scoreboard (all FBS for college when a subscriber's team may be unranked). */
  scoreboard: (league: League, allFbs: boolean) => Promise<unknown>
  /** Sends one notification; returns the push service's HTTP status. */
  send: (subscription: PushSubscriptionJSON, message: Message) => Promise<number>
  now: () => number
  /** Runs work after the response has gone out (the Durable Object's waitUntil). */
  background: (work: Promise<unknown>) => void
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

/** Shown once when a device turns alerts on: proof the whole way to its lock screen works. */
export const WELCOME: Message = {
  title: 'Alerts are on',
  body: "You'll get the alerts you picked, even with covertwo closed.",
  tag: 'welcome',
}
/** What the test button sends. */
export const TEST: Message = {
  title: 'Test alert',
  body: 'This is how covertwo alerts look on this device.',
  tag: 'test',
}
/** One test per device this often, at most. */
const TEST_GAP_MS = 30_000

/**
 * Adds or updates a subscriber. A new one gets the welcome notification at
 * once. `full` when the cap is reached.
 */
export async function subscribe(
  deps: Deps,
  subscriber: Subscriber,
): Promise<'new' | 'updated' | 'full'> {
  const key = await keyFor(subscriber.subscription.endpoint)
  const existing = await deps.storage.get(key)
  if (!existing && (await deps.storage.list({ prefix: 'sub:' })).size >= MAX_SUBSCRIBERS)
    return 'full'
  await deps.storage.put(key, subscriber)
  await deps.storage.put('next', 0) // look now: the new subscriber may care about a live game
  if (existing) return 'updated'
  // In the background: turning alerts on shouldn't wait for the push service.
  deps.background(deps.send(subscriber.subscription, WELCOME).catch(() => 0))
  return 'new'
}

/** Sends the test notification to a subscribed device: the push service's status, or why not. */
export async function sendTest(deps: Deps, endpoint: string): Promise<number | 'unknown' | 'wait'> {
  const key = await keyFor(endpoint)
  const subscriber = await deps.storage.get<Subscriber>(key)
  if (!subscriber) return 'unknown'
  const last = (await deps.storage.get<number>(`test:${key}`)) ?? 0
  if (deps.now() - last < TEST_GAP_MS) return 'wait'
  await deps.storage.put(`test:${key}`, deps.now())
  return deps.send(subscriber.subscription, TEST).catch(() => 0)
}

/** For GET /push/status: counts and the last check, nothing about who. */
export async function status(deps: Deps) {
  return {
    subscribers: (await deps.storage.list({ prefix: 'sub:' })).size,
    next: (await deps.storage.get<number>('next')) ?? 0,
    last: (await deps.storage.get<LastCheck>('last')) ?? null,
  }
}

export async function unsubscribe(deps: Deps, endpoint: string): Promise<void> {
  const key = await keyFor(endpoint)
  await deps.storage.delete(key)
  await deps.storage.delete(`test:${key}`)
}

/** One minute's work: look at the leagues someone cares about and send what changed. */
export async function tick(deps: Deps): Promise<{ looked: boolean; sent: number }> {
  const now = deps.now()
  if (now < ((await deps.storage.get<number>('next')) ?? 0)) return { looked: false, sent: 0 }
  const check: LastCheck = { at: now, looked: true, leagues: [], alerts: 0, sends: [] }
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
    check.leagues.push(league)
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
      const message = { title: alert.title, body: alert.body, tag: alert.gameId }
      const status = await deps.send(subscriber.subscription, message).catch(() => 0)
      check.sends.push(status)
      if (status === 404 || status === 410) {
        await deps.storage.delete(key) // unsubscribed or expired at the push service
        break
      }
      if (status >= 200 && status < 300) sent++
    }
  check.alerts = alerts.length
  check.sends = check.sends.slice(0, 20)
  await deps.storage.put('last', check)
  return { looked: true, sent }
}
