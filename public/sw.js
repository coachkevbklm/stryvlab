const CACHE_NAME = 'stryv-client-v2'

// Assets statiques à pré-cacher
const STATIC_ASSETS = [
  '/client',
  '/client/programme',
  '/client/bilans',
  '/client/profil',
  '/manifest.json',
]

// Patterns d'URL qui ne doivent PAS être mis en cache (hors API — gérée par networkFirst ci-dessous)
const NO_CACHE_PATTERNS = [
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

  if (request.method !== 'GET') return
  if (NO_CACHE_PATTERNS.some((p) => p.test(url.pathname + url.hostname))) return

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets statiques versionnés → cache-first (hash dans le nom = jamais stale)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Pages client → network-first avec timeout 3s
  if (url.pathname.startsWith('/client')) {
    event.respondWith(networkFirstWithTimeout(request, 3000))
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

async function networkFirstWithTimeout(request, timeoutMs) {
  const cache = await caches.open(CACHE_NAME)

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs)
  )

  try {
    const response = await Promise.race([fetch(request), timeoutPromise])
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Timeout ou offline → servir le cache
    const cached = await cache.match(request)
    return cached ?? new Response('Offline', { status: 503 })
  }
}
