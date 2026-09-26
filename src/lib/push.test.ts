import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { DEFAULT_PREFS, pushState, sendTest, turnOff, turnOn, VAPID_PUBLIC_KEY } from './push'

const favorites = { nfl: { id: '33', name: 'Baltimore Ravens' }, ncaaf: null }
const endpoint = 'https://web.push.apple.com/abc'

// A fake browser push stack: a service worker registration with a push manager.
let subscription: {
  endpoint: string
  toJSON: () => unknown
  unsubscribe: ReturnType<typeof vi.fn>
} | null
let permission: NotificationPermission
const pushManager = {
  getSubscription: vi.fn(async () => subscription),
  subscribe: vi.fn(async () => {
    subscription = {
      endpoint,
      toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }),
      unsubscribe: vi.fn(async () => true),
    }
    return subscription
  }),
}
const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))

beforeEach(() => {
  subscription = null
  permission = 'default'
  vi.stubGlobal('PushManager', function PushManager() {})
  vi.stubGlobal('Notification', {
    get permission() {
      return permission
    },
    requestPermission: vi.fn(async () => permission),
  })
  vi.stubGlobal('navigator', {
    ...navigator,
    userAgent: 'Desktop',
    serviceWorker: { getRegistration: async () => ({ pushManager }) },
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

test('state follows the browser: off, on, blocked', async () => {
  expect(await pushState()).toBe('off')
  permission = 'granted'
  await pushManager.subscribe()
  expect(await pushState()).toBe('on')
  permission = 'denied'
  expect(await pushState()).toBe('blocked')
})

test('an iPhone in a Safari tab needs the Home Screen app', async () => {
  vi.stubGlobal('PushManager', undefined)
  // @ts-expect-error: removing it on purpose, like Safari tabs on iPhone
  delete window.PushManager
  vi.stubGlobal('navigator', {
    ...navigator,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)',
  })
  expect(await pushState()).toBe('install')
})

test('turning on: permission, subscription with our key, then the choices to the Worker', async () => {
  permission = 'granted'
  expect(await turnOn(DEFAULT_PREFS, favorites)).toBe('on')
  expect(pushManager.subscribe).toHaveBeenCalledWith({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY,
  })
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toMatch(/\/push\/subscribe$/)
  expect(JSON.parse(init.body as string)).toEqual({
    subscription: { endpoint, keys: { p256dh: 'p', auth: 'a' } },
    prefs: { ...DEFAULT_PREFS, teams: { nfl: '33', ncaaf: null } },
  })
})

test('permission refused: blocked, nothing subscribed or sent', async () => {
  permission = 'denied'
  expect(await turnOn(DEFAULT_PREFS, favorites)).toBe('blocked')
  expect(pushManager.subscribe).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('turning off: the Worker forgets this device and the browser drops it', async () => {
  permission = 'granted'
  await pushManager.subscribe()
  const sub = subscription
  expect(await turnOff()).toBe('off')
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toMatch(/\/push\/unsubscribe$/)
  expect(JSON.parse(init.body as string)).toEqual({ endpoint })
  expect(sub?.unsubscribe).toHaveBeenCalled()
})

test('test alert: sent, too soon, unknown to the server, refused', async () => {
  permission = 'granted'
  await pushManager.subscribe()
  const answer = (status: number, body: unknown) =>
    fetchMock.mockImplementationOnce(async () => Response.json(body, { status }))
  answer(200, { push: 201 })
  expect(await sendTest()).toBe('sent')
  answer(429, { error: 'wait' })
  expect(await sendTest()).toBe('wait')
  answer(404, { error: 'unknown' })
  expect(await sendTest()).toBe('gone')
  answer(200, { push: 403 })
  expect(await sendTest()).toBe(403)
})
