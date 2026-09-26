// Lock-screen alerts, app side (#55): subscribing this device with the push
// service and telling the Worker (#69) what to send. The service worker
// (src/sw.js) shows the alerts.
import type { Favorites } from '../data/useFavorites'

/** Our VAPID public key (the private one signs alerts in the Worker; it's a secret). */
export const VAPID_PUBLIC_KEY =
  'BMw4ryOGue1hP3_wEq_Yi22GCbF8W4X0j_Qun1qGaZ6gPFaOsCWdCjKuiTVXaT4Lj2DT5vd13SGQgNbdRLPI-bE'

/** What to be alerted about; the favourite teams come from the ★. */
export type AlertPrefs = { scores: boolean; kickoffFinal: boolean; close: boolean; upsets: boolean }
export const DEFAULT_PREFS: AlertPrefs = {
  scores: true,
  kickoffFinal: true,
  close: false,
  upsets: false,
}

/**
 * Where alerts stand on this device: `install` is an iPhone or iPad in a
 * Safari tab (alerts need the Home Screen app), `blocked` is notifications
 * denied in settings.
 */
export type PushState = 'unsupported' | 'install' | 'blocked' | 'off' | 'on'

const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isInstalled = () =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration()) ?? null
}

/** The state on this device right now. */
export async function pushState(): Promise<PushState> {
  if (!('PushManager' in window) || !('Notification' in window))
    return isAppleMobile() && !isInstalled() ? 'install' : 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  const reg = await registration()
  if (!reg) return 'unsupported' // no service worker (dev builds, or it failed)
  return (await reg.pushManager.getSubscription()) ? 'on' : 'off'
}

/** The body the Worker's /push/subscribe expects, minus the subscription. */
export function prefsBody(prefs: AlertPrefs, favorites: Favorites) {
  return {
    ...prefs,
    teams: { nfl: favorites.nfl?.id ?? null, ncaaf: favorites.ncaaf?.id ?? null },
  }
}

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
}

/**
 * Asks for permission (must run from a tap), subscribes this device and sends
 * the choices. Resolves to the new state.
 */
export async function turnOn(prefs: AlertPrefs, favorites: Favorites): Promise<PushState> {
  if ((await Notification.requestPermission()) !== 'granted') return 'blocked'
  const reg = await registration()
  if (!reg) return 'unsupported'
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    }))
  await post('/push/subscribe', {
    subscription: subscription.toJSON(),
    prefs: prefsBody(prefs, favorites),
  })
  return 'on'
}

/** Sends changed choices (or a new favourite) for the existing subscription. */
export async function sync(prefs: AlertPrefs, favorites: Favorites): Promise<void> {
  const subscription = await (await registration())?.pushManager.getSubscription()
  if (subscription)
    await post('/push/subscribe', {
      subscription: subscription.toJSON(),
      prefs: prefsBody(prefs, favorites),
    })
}

/** Stops alerts on this device: the Worker forgets it, and the browser drops the subscription. */
export async function turnOff(): Promise<PushState> {
  const subscription = await (await registration())?.pushManager.getSubscription()
  if (subscription) {
    await post('/push/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {})
    await subscription.unsubscribe()
  }
  return 'off'
}

/**
 * Asks the Worker to send this device a test alert. `sent` means the push
 * service took it; `gone` means the Worker doesn't know this device (sync and
 * retry); a number is the push service's refusal status (0 = no answer).
 */
export async function sendTest(): Promise<'sent' | 'wait' | 'gone' | number> {
  const subscription = await (await registration())?.pushManager.getSubscription()
  if (!subscription) return 'gone'
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/push/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })
  if (res.status === 429) return 'wait'
  if (res.status === 404) return 'gone'
  if (!res.ok) throw new Error(`/push/test: HTTP ${res.status}`)
  const { push } = (await res.json()) as { push: number }
  return push >= 200 && push < 300 ? 'sent' : push
}
