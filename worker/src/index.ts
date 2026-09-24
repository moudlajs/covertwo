// Proxy between the app and ESPN's scoreboard API. ESPN's bot protection
// rejects browser requests from other sites, but not server-side ones, so the
// app calls this Worker instead. Only allow-listed paths are forwarded.

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

export async function handle(request: Request, upstream: Fetch = fetch): Promise<Response> {
  const origin = request.headers.get('Origin')
  const cors: Record<string, string> =
    origin && ORIGINS.has(origin)
      ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
      : { Vary: 'Origin' }

  if (request.method === 'OPTIONS')
    return new Response(null, {
      status: 204,
      headers: { ...cors, 'Access-Control-Allow-Methods': 'GET' },
    })
  if (request.method !== 'GET')
    return new Response('Method not allowed', { status: 405, headers: cors })

  const url = new URL(request.url)
  const path = ROUTES[url.pathname]
  if (!path) return new Response('Not found', { status: 404, headers: cors })

  try {
    const res = await upstream(UPSTREAM + path + url.search, {
      headers: { 'User-Agent': 'covertwo (+https://github.com/moudlajs/covertwo)' },
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

export default { fetch: (request: Request) => handle(request) }
