'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import {
  rehydratePostureProfileFromServer,
  type ServerTelemetryRehydrationPayload,
} from '@/lib/posture-profile-state'
import {
  clearTelemetryQueue,
  getTelemetryAuthHeaders,
  initTelemetryLifecycle,
  setTelemetryAuthContext,
} from '@/src/lib/telemetry/telemetryClient'
import TelemetryDiagnosticsDrawer from './TelemetryDiagnosticsDrawer'

export const OPEN_TELEMETRY_DIAGNOSTICS_EVENT = 'forge:open-telemetry-diagnostics'
const REHYDRATION_MIN_INTERVAL_MS = 5 * 60_000

/**
 * Global client telemetry lifecycle bootstrapper & `?debug=telemetry` inspector host.
 *
 * Responsibilities:
 * 1. Caches the active Supabase `access_token` synchronously in `telemetryClient` so iOS
 *    Safari ITP & WKWebView `keepalive` flushes always attach `Authorization: Bearer <token>`.
 * 2. Registers cross-platform `visibilitychange`, `pagehide`, `online`, Capacitor native
 *    background/backButton, and PWA Service Worker `sync` flush listeners.
 * 3. Rehydrates baseline posture scores, OPT™ phase/environment state, Desk Audit flags,
 *    and Joint Comfort history from `/api/telemetry` on launch to mitigate iOS 7-day
 *    script-writable storage eviction.
 * 4. Opens the Store-Launch Telemetry Diagnostic Drawer whenever `?debug=telemetry` is present.
 */
export default function TelemetryBootstrap() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const lastRehydratedAtRef = useRef<number>(0)

  const rehydrateFromServer = useCallback(async (force = false) => {
    if (typeof window === 'undefined') return
    if (navigator.onLine === false) return

    const now = Date.now()
    if (!force && now - lastRehydratedAtRef.current < REHYDRATION_MIN_INTERVAL_MS) {
      return
    }
    lastRehydratedAtRef.current = now

    try {
      const fetchInit: RequestInit & { priority?: 'low' | 'high' | 'auto' } = {
        method: 'GET',
        headers: getTelemetryAuthHeaders(),
        credentials: 'same-origin',
        cache: 'no-store',
        priority: 'low',
      }
      const res = await fetch('/api/telemetry', fetchInit)
      if (!res.ok) return

      const data = (await res.json()) as {
        ok?: boolean
        rehydration?: ServerTelemetryRehydrationPayload
      }
      if (data?.ok && data.rehydration) {
        rehydratePostureProfileFromServer(data.rehydration)
      }
    } catch {
      // Offline or unauthenticated public page — silent no-op
    }
  }, [])

  useEffect(() => {
    const checkDebugQueryParam = () => {
      try {
        const params = new URLSearchParams(window.location.search)
        if (params.get('debug') === 'telemetry') {
          setDrawerOpen(true)
        }
      } catch {
        // Ignore malformed query string
      }
    }

    checkDebugQueryParam()

    const handleOpenDrawer = () => setDrawerOpen(true)
    window.addEventListener('popstate', checkDebugQueryParam)
    window.addEventListener(OPEN_TELEMETRY_DIAGNOSTICS_EVENT, handleOpenDrawer)

    let unsubscribeAuth: (() => void) | null = null
    try {
      const supabase = createClient()
      void supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          setTelemetryAuthContext({
            userId: session?.user?.id ?? null,
            accessToken: session?.access_token ?? null,
          })
          if (session?.user?.id) {
            void rehydrateFromServer(true)
          }
        })
        .catch(() => {
          // Unconfigured or offline session read
        })

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          void clearTelemetryQueue()
          return
        }
        setTelemetryAuthContext({
          userId: session?.user?.id ?? null,
          accessToken: session?.access_token ?? null,
        })
        if (event === 'SIGNED_IN' && session?.user?.id) {
          void rehydrateFromServer(true)
        }
      })
      unsubscribeAuth = () => data.subscription.unsubscribe()
    } catch {
      // Supabase client env vars absent in static test environments
    }

    const cleanupLifecycle = initTelemetryLifecycle({
      onForegroundResume: () => {
        void rehydrateFromServer(false)
      },
    })

    return () => {
      window.removeEventListener('popstate', checkDebugQueryParam)
      window.removeEventListener(OPEN_TELEMETRY_DIAGNOSTICS_EVENT, handleOpenDrawer)
      unsubscribeAuth?.()
      cleanupLifecycle()
    }
  }, [rehydrateFromServer])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        if (url.searchParams.get('debug') === 'telemetry') {
          url.searchParams.delete('debug')
          window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
        }
      } catch {
        // Ignore history state errors
      }
    }
  }, [])

  return <TelemetryDiagnosticsDrawer open={drawerOpen} onClose={handleCloseDrawer} />
}
