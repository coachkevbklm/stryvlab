const CACHE_NAME = 'stryv-client-v1'

// Assets statiques à pré-cacher
const STATIC_ASSETS = [
  '/client',
  '/client/programme',
  '/client/bilans',
  '/client/profil',
  '/manifest.json',
]

// Patterns d'URL qui ne doivent PAS être mis en cache
const NO_CACHE_PATTERNS = [
  /\/api\//,
  /supabase/,
  /\.hot-update\./,
]

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET et les patterns exclus
  if (request.method !== 'GET') return
  if (NO_CACHE_PATTERNS.some((p) => p.test(url.pathname + url.hostname))) return

  // API routes → network-first (données fraîches)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets statiques (_next/static) → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Pages client → stale-while-revalidate
  if (url.pathname.startsWith('/client')) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
})

// ─── Stratégies ────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached ?? new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)
  return cached ?? (await fetchPromise) ?? new Response('Offline', { status: 503 })
}
