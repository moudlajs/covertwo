// Proxy between the app and ESPN's scoreboard API. ESPN's bot protection
// rejects browser requests from other sites, but not server-side ones, so the
// app calls this Worker instead. Only allow-listed paths are forwarded.
//
// It also runs lock-screen alerts (#69): the app subscribes at /push/*, and a
// cron every minute has the Alerts Durable Object (alerts.ts) send what changed.
import { buildPushHTTPRequest } from '@pushforge/builder'
import {
  sendTest,
  status,
  subscribe,
  tick,
  unsubscribe,
  type Deps,
  type Message,
  type PushSubscriptionJSON,
  type Storage,
  type Subscriber,
} from './alerts'
import type { League } from './events'

const UPSTREAM = 'https://site.api.espn.com/apis/site/v2/sports/'

/** Public path → ESPN path. */
const ROUTES: Record<string, string> = {
  '/nfl/scoreboard': 'football/nfl/scoreboard',
  '/ncaaf/scoreboard': 'football/college-football/scoreboard',
}

const ORIGINS = new Set([
  'https://moudlajs.github.io',
  'http://localhost:5173', // vite dev
  'http://localhost:4173', // vite preview / e2e
])

/** Seconds the edge and browsers may reuse a response; all viewers share one upstream fetch. */
export const CACHE_SECONDS = 15

type Fetch = (input: string, init?: RequestInit & { cf?: unknown }) => Promise<Response>

/** The Cloudflare bindings used here (declared by hand: no workers-types dependency). */
type Stub = { fetch(input: string, init?: RequestInit): Promise<Response> }
export type Env = {
  ALERTS: { idFromName(name: string): unknown; get(id: unknown): Stub }
  VAPID_PRIVATE_JWK: string
}

/** The one Alerts object: few subscribers, one place. */
const alerts = (env: Env) => env.ALERTS.get(env.ALERTS.idFromName('main'))

const ESPN_HEADERS = { 'User-Agent': 'covertwo (+https://github.com/moudlajs/covertwo)' }

/**
 * Push services the browsers use (Safari, Chrome and most Android browsers,
 * Firefox, Edge). Only these may be a subscription's endpoint: the watcher
 * POSTs to it every alert, so anything else would let a caller aim it anywhere.
 */
export function isPushService(endpoint: string): boolean {
  let host: string
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:') return false
    host = url.hostname
  } catch {
    return false
  }
  return (
    host === 'web.push.apple.com' ||
    host === 'fcm.googleapis.com' ||
    host.endsWith('.push.services.mozilla.com') ||
    host.endsWith('.notify.windows.com')
  )
}

const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isKey = (v: unknown) => typeof v === 'string' && /^[A-Za-z0-9_-]{10,200}=*$/.test(v)
const isTeam = (v: unknown) => v === null || (typeof v === 'string' && /^\d{1,8}$/.test(v))

/** A subscribe request's body, checked field by field; null if anything is off. */
export function parseSubscriber(json: unknown): Subscriber | null {
  const { subscription: sub, prefs } = (json ?? {}) as Partial<
    Record<string, Record<string, unknown>>
  >
  const keys = (sub?.keys ?? {}) as Record<string, unknown>
  const teams = (prefs?.teams ?? {}) as Record<string, unknown>
  if (
    typeof sub?.endpoint !== 'string' ||
    sub.endpoint.length > 1000 ||
    !isPushService(sub.endpoint) ||
    !isKey(keys.p256dh) ||
    !isKey(keys.auth) ||
    !prefs ||
    !isTeam(teams.nfl) ||
    !isTeam(teams.ncaaf) ||
    ![prefs.scores, prefs.kickoffFinal, prefs.close, prefs.upsets].every(isBool)
  )
    return null
  return {
    subscription: {
      endpoint: sub.endpoint,
      keys: { p256dh: keys.p256dh as string, auth: keys.auth as string },
    },
    prefs: {
      teams: { nfl: teams.nfl as string | null, ncaaf: teams.ncaaf as string | null },
      scores: prefs.scores as boolean,
      kickoffFinal: prefs.kickoffFinal as boolean,
      close: prefs.close as boolean,
      upsets: prefs.upsets as boolean,
    },
  }
}

/** POST /push/subscribe and /push/unsubscribe: the app's origins only, bodies checked, then to Alerts. */
async function push(request: Request, path: string, cors: Record<string, string>, env?: Env) {
  if (!cors['Access-Control-Allow-Origin'])
    return new Response('Forbidden', { status: 403, headers: cors })
  if (!env) return new Response('Unavailable', { status: 503, headers: cors })
  const text = await request.text()
  if (text.length > 4000) return new Response('Too large', { status: 413, headers: cors })
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return new Response('Bad JSON', { status: 400, headers: cors })
  }
  let body: unknown
  if (path === '/push/subscribe') body = parseSubscriber(json)
  else {
    const endpoint = (json as { endpoint?: unknown } | null)?.endpoint
    body = typeof endpoint === 'string' && isPushService(endpoint) ? { endpoint } : null
  }
  if (!body) return new Response('Invalid', { status: 400, headers: cors })
  const res = await alerts(env).fetch(`https://alerts${path.slice('/push'.length)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  // The test's result (the push service's answer) goes back to the app.
  if (path === '/push/test')
    return new Response(await res.text(), {
      status: res.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  return new Response(null, { status: res.status, headers: cors })
}

export async function handle(
  request: Request,
  upstream: Fetch = fetch,
  env?: Env,
): Promise<Response> {
  const origin = request.headers.get('Origin')
  const cors: Record<string, string> =
    origin && ORIGINS.has(origin)
      ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
      : { Vary: 'Origin' }

  const url = new URL(request.url)
  if (request.method === 'OPTIONS')
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  if (
    request.method === 'POST' &&
    ['/push/subscribe', '/push/unsubscribe', '/push/test'].includes(url.pathname)
  )
    return push(request, url.pathname, cors, env)
  // What the watcher is doing: counts and the last check, no subscriber data.
  if (request.method === 'GET' && url.pathname === '/push/status') {
    if (!env) return new Response('Unavailable', { status: 503, headers: cors })
    const res = await alerts(env).fetch('https://alerts/status')
    return new Response(await res.text(), {
      status: res.status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }
  if (request.method !== 'GET')
    return new Response('Method not allowed', { status: 405, headers: cors })

  const path = ROUTES[url.pathname]
  if (!path) return new Response('Not found', { status: 404, headers: cors })

  try {
    const res = await upstream(UPSTREAM + path + url.search, {
      headers: ESPN_HEADERS,
      // Cache successes only, so a blocked or failing upstream is retried at once.
      cf: { cacheTtlByStatus: { '200-299': CACHE_SECONDS, '300-599': 0 }, cacheEverything: true },
    })
    return new Response(res.body, {
      status: res.status,
      headers: {
        ...cors,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': res.ok ? `public, max-age=${CACHE_SECONDS}` : 'no-store',
      },
    })
  } catch (error) {
    console.error('upstream fetch failed', { path, error: String(error) })
    return new Response('Bad gateway', { status: 502, headers: cors })
  }
}

/** Sends one notification through the device's push service, signed with our VAPID key. */
async function send(
  jwk: string,
  subscription: PushSubscriptionJSON,
  message: Message,
): Promise<number> {
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK: jwk,
    subscription,
    message: {
      payload: message,
      adminContact: 'https://github.com/moudlajs/covertwo',
      // A score alert is old news after a quarter of an hour.
      options: { ttl: 15 * 60, urgency: 'high' },
    },
  })
  return (await fetch(endpoint, { method: 'POST', headers, body })).status
}

/** ESPN's scoreboard for the watcher, through the same short edge cache. */
async function scoreboard(league: League, allFbs: boolean): Promise<unknown> {
  const path = ROUTES[`/${league}/scoreboard`]
  const res = await fetch(`${UPSTREAM}${path}${allFbs ? '?groups=80' : ''}`, {
    headers: ESPN_HEADERS,
    cf: { cacheTtlByStatus: { '200-299': CACHE_SECONDS, '300-599': 0 }, cacheEverything: true },
  } as RequestInit)
  if (!res.ok) throw new Error(`ESPN ${res.status}`)
  return res.json()
}

/**
 * The Durable Object holding subscribers and the last look at each league
 * (key-value storage on the free plan's SQLite backend). The logic is in alerts.ts.
 */
export class Alerts {
  private deps: Deps
  constructor(state: { storage: Storage }, env: Env) {
    this.deps = {
      storage: state.storage,
      scoreboard,
      send: (subscription, message) => send(env.VAPID_PRIVATE_JWK, subscription, message),
      now: () => Date.now(),
    }
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname
    if (path === '/tick') return Response.json(await tick(this.deps))
    if (path === '/status') return Response.json(await status(this.deps))
    const body = (await request.json()) as Subscriber & { endpoint: string }
    if (path === '/subscribe')
      return new Response(null, {
        status: (await subscribe(this.deps, body)) === 'full' ? 503 : 204,
      })
    if (path === '/test') {
      const result = await sendTest(this.deps, body.endpoint)
      // 200 with the push service's answer; 404 for an unknown device, 429 too soon.
      if (result === 'unknown') return Response.json({ error: 'unknown' }, { status: 404 })
      if (result === 'wait') return Response.json({ error: 'wait' }, { status: 429 })
      return Response.json({ push: result })
    }
    if (path === '/unsubscribe') {
      await unsubscribe(this.deps, body.endpoint)
      return new Response(null, { status: 204 })
    }
    return new Response('Not found', { status: 404 })
  }
}

export default {
  fetch: (request: Request, env: Env) => handle(request, fetch, env),
  /** Every minute: the watcher looks, if anyone is subscribed and anything is on. */
  scheduled: (_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) =>
    ctx.waitUntil(alerts(env).fetch('https://alerts/tick', { method: 'POST' })),
}
