/* bradley.io service worker — anti-cloud, offline-first.
 * - app shell + static assets cached for offline launch
 * - live sensor JSON (/api/*) cached network-first so dashboards render the
 *   last-seen data when the network drops
 * - never touches the wargames socket, cross-origin, or non-GET requests
 */
const VERSION = "v1"
const SHELL = `bio-shell-${VERSION}` // navigations + static assets
const DATA = `bio-data-${VERSION}` // live JSON snapshots
const PRECACHE = ["/offline.html"]

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// network-first with cache fallback (for fresh-but-resilient resources)
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(req)
    if (res && res.ok) cache.put(req, res.clone())
    return res
  } catch {
    const hit = await cache.match(req)
    if (hit) return hit
    throw new Error("offline, no cache")
  }
}

// cache-first (for content-hashed immutable assets)
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res && res.ok) cache.put(req, res.clone())
  return res
}

self.addEventListener("fetch", (e) => {
  const req = e.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // cross-origin (incl. wss / tiles) untouched
  if (url.pathname.startsWith("/api/socket")) return // wargames socket.io — hands off

  // Live data JSON → network-first into the DATA cache (offline snapshot).
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(networkFirst(req, DATA))
    return
  }

  // Immutable build assets → cache-first.
  if (url.pathname.startsWith("/_next/static/") || /\.(woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(cacheFirst(req, SHELL))
    return
  }

  // Navigations → network-first, fall back to cached page then the offline shell.
  if (req.mode === "navigate") {
    e.respondWith(
      networkFirst(req, SHELL).catch(async () => {
        const cache = await caches.open(SHELL)
        return (await cache.match(req)) || (await cache.match("/offline.html")) || Response.error()
      }),
    )
    return
  }

  // Everything else same-origin → network-first, cache fallback.
  e.respondWith(networkFirst(req, SHELL).catch(() => caches.match(req)))
})
