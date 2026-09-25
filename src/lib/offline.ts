/**
 * Fired once when the service worker first takes charge of this page. The
 * first visit loaded before it existed, so nothing was saved for offline yet:
 * the scoreboard reloads through it (useScoreboard), and the logos already on
 * screen are handed to it here.
 */
export const OFFLINE_READY = 'covertwo:offline-ready'

/** Registers the service worker (src/sw.js) and primes it on the first visit. */
export function registerServiceWorker() {
  const sw = navigator.serviceWorker
  const firstVisit = !sw.controller
  sw.addEventListener('controllerchange', (event) => {
    if (!firstVisit) return
    const controller = (event.currentTarget as ServiceWorkerContainer).controller
    window.dispatchEvent(new Event(OFFLINE_READY))
    const logos = [...document.images]
      .map((img) => img.currentSrc)
      .filter((src) => src.includes('espncdn.com'))
    controller?.postMessage({ type: 'save-logos', urls: logos })
  })
  window.addEventListener('load', () => {
    sw.register('./sw.js').catch((error: unknown) => {
      console.error('[sw] registration failed', error)
    })
  })
}
