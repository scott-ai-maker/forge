'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Inside native Capacitor iOS/Android apps or local development, unregister service workers
    // and purge caches to ensure direct network throughput and prevent stale chunk caching or hydration mismatches
    const isCapacitor = Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
    )
    const isDev =
      process.env.NODE_ENV !== 'production' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local')

    if (isCapacitor || isDev) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister()
        }
      })
      if (typeof caches !== 'undefined') {
        caches.keys().then(keys => {
          for (const key of keys) {
            caches.delete(key)
          }
        })
      }
      return
    }

    let registration: ServiceWorkerRegistration | null = null
    let updateInterval: ReturnType<typeof setInterval> | null = null

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && registration) {
        void registration.update()
      }
    }

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        // Auto-check for updates when athlete returns to the active PWA
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Periodic hourly check for long-running standalone sessions
        updateInterval = setInterval(() => {
          if (registration) {
            void registration.update()
          }
        }, 60 * 60 * 1000)
      } catch (error) {
        console.warn('Service worker registration failed', error)
      }
    }

    void register()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (updateInterval) clearInterval(updateInterval)
    }
  }, [])

  return null
}
