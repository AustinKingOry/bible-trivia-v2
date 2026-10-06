/* TriviaPath service worker: offline-first app shell.
   - Static assets: cache-first (Next fingerprints /_next/static, so they never go stale)
   - Pages: network-first, fall back to the last cached copy, then /offline
   - /api and cross-origin (Supabase) requests are never touched */
const VERSION = 'v1'
const STATIC = `tp-static-${VERSION}`
const PAGES = `tp-pages-${VERSION}`
const WARM_PAGES = ['/offline', '/game']
const WARM_FILES = ['/logo.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.ico']
const MAX_PAGES = 40

async function warm(url, cacheName) {
  try {
    const res = await fetch(url, { credentials: 'same-origin' })
    if (!res.ok) return
    const cache = await caches.open(cacheName)
    await cache.put(url, res.clone())
    if ((res.headers.get('content-type') || '').includes('text/html')) {
      // Also grab the JS/CSS the page needs so it renders offline on first launch.
      const html = await res.text()
      const assets = [...new Set(html.match(/\/_next\/static\/[^"'\\\s)]+/g) || [])]
      const sc = await caches.open(STATIC)
      await Promise.all(assets.map((a) => sc.add(a).catch(() => {})))
    }
  } catch (_) { /* offline during install: runtime caching will fill in later */ }
}

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([
    ...WARM_PAGES.map((u) => warm(u, PAGES)),
    ...WARM_FILES.map((u) => warm(u, STATIC)),
  ]))
  // No skipWaiting here: the app asks the user before swapping versions mid-game.
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [STATIC, PAGES]
    await Promise.all((await caches.keys()).filter((k) => k.startsWith('tp-') && !keep.includes(k)).map((k) => caches.delete(k)))
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)))
}

async function navigate(event) {
  const { request } = event
  try {
    const res = (await event.preloadResponse) || (await fetch(request))
    if (res && res.ok && res.type === 'basic') {
      const copy = res.clone()
      event.waitUntil(caches.open(PAGES).then((c) => c.put(request, copy)).then(() => trim(PAGES, MAX_PAGES)))
    }
    return res
  } catch (_) {
    const cache = await caches.open(PAGES)
    return (await cache.match(request, { ignoreSearch: true })) || (await cache.match('/offline')) || Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok && res.type === 'basic') cache.put(request, res.clone())
  return res
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return
  if (request.mode === 'navigate') return event.respondWith(navigate(event))
  if (url.pathname.startsWith('/_next/static/') || /^\/(icons|tones)\//.test(url.pathname) ||
      ['style', 'script', 'font', 'image', 'audio'].includes(request.destination)) {
    return event.respondWith(cacheFirst(request))
  }
})
