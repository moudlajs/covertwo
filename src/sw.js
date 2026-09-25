/* covertwo service worker (#53): the app works offline after the first visit.
 * The build (serviceWorker() in vite.config.ts) replaces the two placeholders
 * below and writes this file to dist/sw.js. Plain JS: it runs as-is. */
const PRECACHE = self.__PRECACHE__ // every built file, plus public/
const VERSION = self.__VERSION__ // changes with every build that changes a file
const SHELL = `covertwo-shell-${VERSION}`
const DATA = 'covertwo-data'
const LOGOS = 'covertwo-logos'
/** Set on saved scoreboard copies: when they were saved (epoch ms). The app reads it. */
const SAVED_AT = 'x-covertwo-saved-at'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('covertwo-shell-') && k !== SHELL)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (request.mode === 'navigate') event.respondWith(page(request))
  else if (url.pathname.endsWith('/scoreboard')) event.respondWith(scores(request))
  else if (url.hostname.endsWith('espncdn.com')) event.respondWith(logo(request))
  else if (url.origin === self.location.origin) event.respondWith(file(request))
})

/** The page: always the newest when online, the saved one offline. */
async function page(request) {
  try {
    return await fetch(request)
  } catch (error) {
    return (await caches.match('./', { ignoreVary: true })) ?? Promise.reject(error)
  }
}

/**
 * Built files have content hashes in their names, so a saved copy is always
 * right. ignoreVary: module scripts are requested with an Origin header the
 * precache request didn't have, and a `Vary: Origin` would miss them.
 */
async function file(request) {
  return (await caches.match(request, { ignoreVary: true })) ?? fetch(request)
}

/** Scores: the network first; the last good copy for this URL (league, week, slate) when offline. */
async function scores(request) {
  const cache = await caches.open(DATA)
  try {
    const response = await fetch(request)
    if (response.ok) {
      const headers = new Headers(response.headers)
      headers.set(SAVED_AT, String(Date.now()))
      const body = await response.clone().arrayBuffer()
      await cache.put(request.url, new Response(body, { status: 200, headers }))
    }
    return response
  } catch (error) {
    return (await cache.match(request.url, { ignoreVary: true })) ?? Promise.reject(error)
  }
}

/** Team logos: saved as they load, so they show offline too. */
async function logo(request) {
  const cache = await caches.open(LOGOS)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') await cache.put(request, response.clone())
  return response
}
