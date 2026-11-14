'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingQueueCount, flushOfflineQueue, triggerHaptic } from '@/lib/offline-sync-queue'
import {
  flushTelemetry,
  getTelemetryHealth,
  subscribeTelemetryHealth,
} from '@/src/lib/telemetry/telemetryClient'

export default function OfflineTelemetryBadge() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSyncedNotice, setShowSyncedNotice] = useState(false)

  const checkPending = useCallback(() => {
    const health = getTelemetryHealth()
    setPendingCount(health.queueDepth)
  }, [])

  const attemptSync = useCallback(async () => {
    if (isSyncing) return
    const healthBefore = getTelemetryHealth()
    if (healthBefore.queueDepth === 0) return

    setIsSyncing(true)
    try {
      const [setResult, telemetryResult] = await Promise.all([
        getPendingQueueCount() > 0 ? flushOfflineQueue() : Promise.resolve({ synced: 0, failed: 0 }),
        flushTelemetry({ reason: 'manual', interactive: true }),
      ])
      if (setResult.synced > 0 || telemetryResult.acceptedCount > 0) {
        triggerHaptic('success')
        setShowSyncedNotice(true)
        setTimeout(() => setShowSyncedNotice(false), 3500)
      }
    } finally {
      setIsSyncing(false)
      checkPending()
    }
  }, [isSyncing, checkPending])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)
    checkPending()

    const unsubscribeHealth = subscribeTelemetryHealth(snapshot => {
      setIsOnline(snapshot.isOnline)
      setPendingCount(snapshot.queueDepth)
    })

    const handleOnline = () => {
      setIsOnline(true)
      void attemptSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      checkPending()
      triggerHaptic('heavy')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const interval = setInterval(checkPending, 5000)

    return () => {
      unsubscribeHealth()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [attemptSync, checkPending])

  if (isOnline && pendingCount === 0 && !showSyncedNotice && !isSyncing) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(12px + env(safe-area-inset-top, 0px))',
        right: 'max(clamp(12px, 2.5vw, 24px), env(safe-area-inset-right, 12px))',
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
    >
      <div
        className={`forge-glass-pill inline-flex min-h-[44px] items-center gap-2.5 rounded-full px-3.5 py-1.5 ${
          !isOnline
            ? 'border-amber-500/35'
            : showSyncedNotice
              ? 'border-emerald-500/35'
              : 'border-white/15'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            !isOnline ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
          }`}
        />

        <span
          className={`font-mono text-[11px] font-bold uppercase tracking-[0.1em] tabular-nums ${
            !isOnline ? 'text-amber-300' : showSyncedNotice ? 'text-emerald-300' : 'text-zinc-200'
          }`}
        >
          {isSyncing
            ? `Syncing ${pendingCount} ${pendingCount === 1 ? 'event' : 'events'}...`
            : showSyncedNotice
              ? '✓ Telemetry Synced'
              : !isOnline
                ? `Offline${pendingCount > 0 ? ` · ${pendingCount} Queued` : ''}`
                : `${pendingCount} Unsynced`}
        </span>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            type="button"
            onClick={() => void attemptSync()}
            className="forge-tactile-press ml-1 inline-flex min-h-[32px] items-center rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-300 transition-colors hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  )
}
