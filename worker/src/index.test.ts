// @vitest-environment node
import { describe, expect, test, vi } from 'vitest'
import { CACHE_SECONDS, handle } from './index'

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
