// @vitest-environment node
import { describe, expect, test, vi } from 'vitest'
import { CACHE_SECONDS, handle, isPushService } from './index'

const ok = () => vi.fn(async () => new Response('{"events":[]}', { status: 200 }))
const get = (path: string, origin = 'https://moudlajs.github.io', method = 'GET') =>
  new Request(`https://covertwo-api.example.workers.dev${path}`, {
    method,
    headers: origin ? { Origin: origin } : {},
  })

describe('worker', () => {
  test('forwards the NFL scoreboard with query string, CORS and cache headers', async () => {
    const upstream = ok()
    const res = await handle(get('/nfl/scoreboard?week=3&seasontype=2'), upstream)
    expect(upstream).toHaveBeenCalledWith(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=3&seasontype=2',
      expect.objectContaining({
        cf: {
          cacheTtlByStatus: { '200-299': CACHE_SECONDS, '300-599': 0 },
          cacheEverything: true,
        },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('{"events":[]}')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://moudlajs.github.io')
    expect(res.headers.get('Cache-Control')).toBe(`public, max-age=${CACHE_SECONDS}`)
  })

  test('forwards college football, query string included', async () => {
    const upstream = ok()
    await handle(get('/ncaaf/scoreboard?groups=8'), upstream)
    expect(upstream).toHaveBeenCalledWith(
      'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=8',
      expect.anything(),
    )
  })

  test('is not an open proxy: unknown paths are 404 and never fetched', async () => {
    const upstream = ok()
    const res = await handle(get('/../../../core/whatever'), upstream)
    expect(res.status).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
  })

  test('only allow-listed origins get CORS', async () => {
    const res = await handle(get('/nfl/scoreboard', 'https://evil.example'), ok())
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    const dev = await handle(get('/nfl/scoreboard', 'http://localhost:5173'), ok())
    expect(dev.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })

  test('answers preflight and rejects other methods', async () => {
    const pre = await handle(get('/nfl/scoreboard', undefined, 'OPTIONS'), ok())
    expect(pre.status).toBe(204)
    expect((await handle(get('/nfl/scoreboard', undefined, 'POST'), ok())).status).toBe(405)
  })

  test('passes upstream errors through', async () => {
    const res = await handle(
      get('/nfl/scoreboard'),
      vi.fn(async () => new Response('blocked', { status: 403 })),
    )
    expect(res.status).toBe(403)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://moudlajs.github.io')
    expect(res.headers.get('Cache-Control')).toBe('no-store') // retries must reach upstream
  })

  test('network failure becomes 502 with CORS, so the app can see it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await handle(
      get('/nfl/scoreboard'),
      vi.fn(async () => {
        throw new Error('boom')
      }),
    )
    expect(res.status).toBe(502)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://moudlajs.github.io')
  })
})

describe('push endpoints', () => {
  const valid = {
    subscription: {
      endpoint: 'https://web.push.apple.com/abc',
      keys: { p256dh: 'BMw4ryOGue1hP3_wEq_Yi22GCbF8W4X0j', auth: 'tBHItJI5svbpez7KI4CCXg' },
    },
    prefs: {
      teams: { nfl: '33', ncaaf: null },
      scores: true,
      kickoffFinal: false,
      close: true,
      upsets: false,
    },
  }
  const env = () => {
    const stub = { fetch: vi.fn(async () => new Response(null, { status: 204 })) }
    return {
      stub,
      env: { ALERTS: { idFromName: () => 'main', get: () => stub }, VAPID_PRIVATE_JWK: '{}' },
    }
  }
  const post = (path: string, body: unknown, origin = 'https://moudlajs.github.io') =>
    new Request(`https://covertwo-api.example.workers.dev${path}`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  test('a valid subscription goes to the Alerts object', async () => {
    const { stub, env: e } = env()
    const res = await handle(post('/push/subscribe', valid), ok(), e)
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://moudlajs.github.io')
    expect(stub.fetch).toHaveBeenCalledWith('https://alerts/subscribe', {
      method: 'POST',
      body: JSON.stringify(valid),
    })
  })

  test('unsubscribe with an endpoint', async () => {
    const { stub, env: e } = env()
    const res = await handle(
      post('/push/unsubscribe', { endpoint: 'https://web.push.apple.com/abc' }),
      ok(),
      e,
    )
    expect(res.status).toBe(204)
    expect(stub.fetch).toHaveBeenCalledWith('https://alerts/unsubscribe', expect.anything())
  })

  test('other sites may not subscribe', async () => {
    const { stub, env: e } = env()
    const res = await handle(post('/push/subscribe', valid, 'https://evil.example'), ok(), e)
    expect(res.status).toBe(403)
    expect(stub.fetch).not.toHaveBeenCalled()
  })

  test('bad bodies are refused before storage', async () => {
    const { stub, env: e } = env()
    const bad = [
      'not json',
      { ...valid, subscription: { ...valid.subscription, endpoint: 'http://insecure.example' } },
      {
        ...valid,
        subscription: { ...valid.subscription, endpoint: 'https://attacker.example/hook' },
      },
      { ...valid, prefs: { ...valid.prefs, scores: 'yes' } },
      { ...valid, prefs: { ...valid.prefs, teams: { nfl: 'DROP TABLE', ncaaf: null } } },
      'x'.repeat(5000),
    ]
    for (const body of bad)
      expect((await handle(post('/push/subscribe', body), ok(), e)).status).toBeGreaterThanOrEqual(
        400,
      )
    expect(stub.fetch).not.toHaveBeenCalled()
  })

  test('the test alert returns the push service answer to the app', async () => {
    const stub = { fetch: vi.fn(async () => Response.json({ push: 201 })) }
    const e = { ALERTS: { idFromName: () => 'main', get: () => stub }, VAPID_PRIVATE_JWK: '{}' }
    const res = await handle(
      post('/push/test', { endpoint: 'https://web.push.apple.com/abc' }),
      ok(),
      e,
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ push: 201 })
  })

  test('status is public and never cached', async () => {
    const stub = { fetch: vi.fn(async () => Response.json({ subscribers: 1 })) }
    const e = { ALERTS: { idFromName: () => 'main', get: () => stub }, VAPID_PRIVATE_JWK: '{}' }
    const res = await handle(get('/push/status'), ok(), e)
    expect(await res.json()).toEqual({ subscribers: 1 })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  test('the preflight allows POST with a JSON body', async () => {
    const res = await handle(get('/push/subscribe', 'https://moudlajs.github.io', 'OPTIONS'))
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST')
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type')
  })
})

test('only real push services may be endpoints', () => {
  for (const ok of [
    'https://web.push.apple.com/QGuQyavXutnMH',
    'https://fcm.googleapis.com/fcm/send/dAPT',
    'https://updates.push.services.mozilla.com/wpush/v2/gAAA',
    'https://wns2-par02p.notify.windows.com/w/?token=x',
  ])
    expect(isPushService(ok)).toBe(true)
  for (const bad of [
    'https://attacker.example/hook',
    'http://web.push.apple.com/x',
    'https://web.push.apple.com.attacker.example/x',
    'https://fcm.googleapis.com@attacker.example/x',
    'not a url',
  ])
    expect(isPushService(bad)).toBe(false)
})
