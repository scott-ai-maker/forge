// If running on localhost or dev environment, immediately unregister and clear all caches
if (
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.endsWith('.local')
) {
  self.addEventListener('install', () => self.skipWaiting())
  self.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    )
  })
}

const VERSION = 'gaa-v1.36.0'
const OFFLINE_URL = '/offline.html'

const PRECACHE = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/exercises/image-not-available.jpg',
]

// Static immutable Next.js assets cache name
const STATIC_CACHE = `${VERSION}-static`

self.addEventListener('install', event => {
  self.skipWaiting()
  if (
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1' ||
    self.location.hostname.endsWith('.local')
  ) {
    return
  }
  event.waitUntil(
    caches.open(VERSION).then(async cache => {
      // Resilient precaching: don't let any individual missing asset abort SW installation
      await Promise.allSettled(
        PRECACHE.map(url =>
          fetch(url)
            .then(res => {
              if (res.ok) return cache.put(url, res)
            })
            .catch(err => console.warn('Precache failed for:', url, err))
        )
      )
    })
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !key.startsWith(VERSION))
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Ignore cross-origin requests
  if (url.origin !== self.location.origin) return

  // Never intercept or cache requests in localhost or dev environments, or webpack hot reload assets
  if (
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1' ||
    self.location.hostname.endsWith('.local') ||
    url.pathname.includes('/webpack') ||
    url.pathname.includes('.hot-update.')
  ) {
    return
  }

  // 1. Exercise Images & Media -> Stale-While-Revalidate with Luxury Fallback
  // Instantaneous local cache response (0ms) with background network revalidation
  if (url.pathname.startsWith('/images/exercises/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async cache => {
        const cachedResponse = await cache.match(request)

        const fetchPromise = fetch(request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(async () => {
            if (cachedResponse) return cachedResponse
            const fallback = await caches.match('/images/exercises/image-not-available.jpg')
            return fallback || new Response('', { status: 404, statusText: 'Image Not Found' })
          })

        return cachedResponse || fetchPromise
      })
    )
    return
  }

  // 2. Immutable Next.js static assets (_next/static/*) -> Cache-First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached

        try {
          const response = await fetch(request)
          if (response.ok) {
            cache.put(request, response.clone())
          }
          return response
        } catch {
          return cached || new Response('', { status: 408, statusText: 'Request timed out' })
        }
      })
    )
    return
  }

  // 3. Navigation requests (HTML page loads) -> Always Live Network, Fallback to Offline Page only on complete network loss
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlineFallback = await caches.match(OFFLINE_URL)
        return offlineFallback || new Response('Offline - Gordon Athletic Advisory', {
          headers: { 'Content-Type': 'text/html' },
        })
      })
    )
    return
  }

  // 4. Static Media (other images, fonts, audio, icons) -> Stale-While-Revalidate
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'audio' ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async cache => {
        const cached = await cache.match(request)
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(() => cached)

        return cached || fetchPromise
      })
    )
    return
  }

  // 5. Default fetch handler
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
