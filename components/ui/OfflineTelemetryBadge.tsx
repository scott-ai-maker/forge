'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingQueueCount, flushOfflineQueue, triggerHaptic } from '@/lib/offline-sync-queue'

export default function OfflineTelemetryBadge() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSyncedNotice, setShowSyncedNotice] = useState(false)

  const checkPending = useCallback(() => {
    setPendingCount(getPendingQueueCount())
  }, [])

  const attemptSync = useCallback(async () => {
    if (isSyncing) return
    const count = getPendingQueueCount()
    if (count === 0) return

    setIsSyncing(true)
    try {
      const result = await flushOfflineQueue()
      if (result.synced > 0) {
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
            !isOnline ? 'text-amber-200' : showSyncedNotice ? 'text-emerald-200' : 'text-zinc-200'
          }`}
        >
          {!isOnline ? (
            pendingCount > 0
              ? `Offline · ${pendingCount} Set${pendingCount > 1 ? 's' : ''} Saved Locally`
              : 'Offline Mode · Sets Cached Locally'
          ) : isSyncing ? (
            'Syncing Telemetry…'
          ) : showSyncedNotice ? (
            '✓ Telemetry Synced'
          ) : pendingCount > 0 ? (
            `${pendingCount} Set${pendingCount > 1 ? 's' : ''} Ready to Sync`
          ) : null}
        </span>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            type="button"
            onClick={() => void attemptSync()}
            aria-label="Sync offline sets now"
            className="forge-tactile-press min-h-[32px] rounded-full bg-emerald-400 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  )
}
