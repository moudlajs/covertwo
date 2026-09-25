/**
 * Fired once when the service worker first takes charge of this page. The
 * first visit loaded before it existed, so nothing was saved for offline yet:
 * the scoreboard reloads through it (useScoreboard), and the new board sends
 * its logos (saveLogos).
 */
export const OFFLINE_READY = 'covertwo:offline-ready'

/** Registers the service worker (src/sw.js); on the first visit, tells the app once it's in charge. */
export function registerServiceWorker() {
  const sw = navigator.serviceWorker
  if (!sw.controller) {
    // The first take-over only; a later deploy's worker taking over needs nothing.
    sw.addEventListener('controllerchange', () => window.dispatchEvent(new Event(OFFLINE_READY)), {
      once: true,
    })
  }
  window.addEventListener('load', () => {
    sw.register('./sw.js').catch((error: unknown) => {
      console.error('[sw] registration failed', error)
    })
  })
}

/**
 * Asks the service worker to save these logos for offline use. Ones loaded
 * through it are saved already; this covers those loaded before it took
 * charge (the first visit). It skips any it has.
 */
export function saveLogos(urls: string[]) {
  navigator.serviceWorker?.controller?.postMessage({ type: 'save-logos', urls })
}
