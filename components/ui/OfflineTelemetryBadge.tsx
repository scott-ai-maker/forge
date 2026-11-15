'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getPendingQueueCount,
  flushOfflineQueue,
  OFFLINE_QUEUE_CHANGED_EVENT,
  triggerHaptic,
} from '@/lib/offline-sync-queue'
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
  const [syncErrorNotice, setSyncErrorNotice] = useState(false)
  const syncedNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkPending = useCallback(() => {
    const health = getTelemetryHealth()
    setIsOnline(health.isOnline)
    setPendingCount(health.queueDepth)
  }, [])

  const attemptSync = useCallback(async () => {
    if (isSyncing) return
    const healthBefore = getTelemetryHealth()
    if (healthBefore.queueDepth === 0) return

    setIsSyncing(true)
    setSyncErrorNotice(false)
    try {
      const hadOfflineSets = healthBefore.offlineSetQueueDepth > 0
      const hadTelemetryEvents = healthBefore.telemetryQueueDepth > 0
      const [setResult, telemetryResult] = await Promise.all([
        hadOfflineSets ? flushOfflineQueue() : Promise.resolve({ synced: 0, failed: 0 }),
        flushTelemetry({ reason: 'manual', interactive: true }),
      ])
      const remainingSets = getPendingQueueCount()
      const setsDrained = hadOfflineSets && (setResult.synced > 0 || remainingSets === 0)
      const setsFailed = hadOfflineSets && remainingSets > 0
      const telemetryDrained = hadTelemetryEvents && telemetryResult.acceptedCount > 0
      const telemetryFailed = hadTelemetryEvents && telemetryResult.ok === false

      if ((setsDrained || telemetryDrained) && !setsFailed && !telemetryFailed) {
        triggerHaptic('success')
        setShowSyncedNotice(true)
        if (syncedNoticeTimerRef.current) clearTimeout(syncedNoticeTimerRef.current)
        syncedNoticeTimerRef.current = setTimeout(() => {
          setShowSyncedNotice(false)
          syncedNoticeTimerRef.current = null
        }, 3500)
      } else if (setsFailed || setResult.failed > 0 || telemetryFailed) {
        setSyncErrorNotice(true)
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
      if (snapshot.queueDepth === 0) {
        setSyncErrorNotice(false)
      }
    })

    const handleOnline = () => {
      setIsOnline(true)
      void attemptSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncErrorNotice(false)
      checkPending()
      triggerHaptic('heavy')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, checkPending)
    const interval = setInterval(checkPending, 5000)

    return () => {
      unsubscribeHealth()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, checkPending)
      clearInterval(interval)
      if (syncedNoticeTimerRef.current) {
        clearTimeout(syncedNoticeTimerRef.current)
      }
    }
  }, [attemptSync, checkPending])

  if (isOnline && pendingCount === 0 && !showSyncedNotice && !isSyncing) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-telemetry-badge"
      style={{
        position: 'fixed',
        top: 'calc(12px + env(safe-area-inset-top, 0px))',
        right: 'max(clamp(12px, 2.5vw, 24px), env(safe-area-inset-right, 12px))',
        maxWidth: 'calc(100vw - 24px)',
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
    >
      <div
        className={`forge-glass-pill inline-flex min-h-[44px] flex-wrap items-center gap-2 rounded-full px-3.5 py-1 ${
          !isOnline || syncErrorNotice
            ? 'border-amber-500/35'
            : showSyncedNotice
              ? 'border-emerald-500/35'
              : 'border-white/15'
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 rounded-full ${
            !isOnline || syncErrorNotice
              ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
              : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
          }`}
        />

        <span
          className={`font-mono text-[11px] font-bold uppercase tracking-[0.1em] tabular-nums ${
            !isOnline || syncErrorNotice
              ? 'text-amber-300'
              : showSyncedNotice
                ? 'text-emerald-300'
                : 'text-zinc-200'
          }`}
        >
          {isSyncing
            ? `Syncing ${pendingCount} ${pendingCount === 1 ? 'event' : 'events'}...`
            : showSyncedNotice
              ? '✓ Telemetry Synced'
              : !isOnline
                ? `Offline${pendingCount > 0 ? ` · ${pendingCount} Queued` : ''}`
                : syncErrorNotice
                  ? `Sync Retry · ${pendingCount} Unsynced`
                  : `${pendingCount} Unsynced`}
        </span>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            type="button"
            onClick={() => void attemptSync()}
            className="forge-tactile-press ml-0.5 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-300 transition-colors hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  )
}
