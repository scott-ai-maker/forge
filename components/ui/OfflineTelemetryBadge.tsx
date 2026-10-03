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
      attemptSync()
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

  // Don't render anything if online and no pending offline sets and no notice
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
        right: 'clamp(12px, 2.5vw, 24px)',
        zIndex: 99999,
        animation: 'fadeIn 0.25s ease-out',
        pointerEvents: 'auto',
      }}
    >
      <div
        className="glass-card"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 20,
          background: !isOnline
            ? 'rgba(245, 158, 11, 0.16)'
            : showSyncedNotice
              ? 'rgba(16, 185, 129, 0.18)'
              : 'rgba(14, 23, 36, 0.92)',
          border: !isOnline
            ? '1px solid rgba(245, 158, 11, 0.5)'
            : showSyncedNotice
              ? '1px solid rgba(52, 211, 153, 0.5)'
              : '1px solid rgba(197, 160, 89, 0.4)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: !isOnline ? '#F59E0B' : '#34D399',
            boxShadow: `0 0 8px ${!isOnline ? '#F59E0B' : '#34D399'}`,
          }}
        />

        <span
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: !isOnline ? '#FDE68A' : showSyncedNotice ? '#A7F3D0' : 'var(--gold-lt)',
          }}
        >
          {!isOnline ? (
            pendingCount > 0
              ? `Offline · ${pendingCount} Set${pendingCount > 1 ? 's' : ''} Queued`
              : 'Offline Mode'
          ) : isSyncing ? (
            'Syncing Telemetry...'
          ) : showSyncedNotice ? (
            '✓ Telemetry Synced'
          ) : pendingCount > 0 ? (
            `${pendingCount} Set${pendingCount > 1 ? 's' : ''} Pending Sync`
          ) : null}
        </span>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            type="button"
            onClick={attemptSync}
            aria-label="Sync offline sets now"
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--gold)',
              color: '#080E14',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Sync
          </button>
        )}
      </div>
    </div>
  )
}

