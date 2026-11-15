'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  flushOfflineQueue,
  getPendingQueueCount,
  OFFLINE_QUEUE_CHANGED_EVENT,
} from '@/lib/offline-sync-queue'

export function formatSyncSuccessMessage(syncedCount: number): string {
  if (syncedCount <= 0) return ''
  return `✓ Synced ${syncedCount} offline workout set${syncedCount > 1 ? 's' : ''} to cloud.`
}

export function useOfflineSyncManager<TRecord extends { id: string }>(
  onRecordSynced?: (tempId: string, serverRecord: TRecord) => void,
  onStatusMessage?: (msg: string) => void
) {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0)

  const syncQueue = useCallback(async () => {
    const res = await flushOfflineQueue((tempId, serverRecord) => {
      onRecordSynced?.(tempId, serverRecord as TRecord)
    })
    setPendingSyncCount(getPendingQueueCount())
    if (res.synced > 0) {
      onStatusMessage?.(formatSyncSuccessMessage(res.synced))
    }
    return res
  }, [onRecordSynced, onStatusMessage])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOnline(navigator.onLine)
    setPendingSyncCount(getPendingQueueCount())

    const handleOnline = async () => {
      setIsOnline(true)
      await syncQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    const handleQueueChanged = () => {
      setPendingSyncCount(getPendingQueueCount())
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, handleQueueChanged)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, handleQueueChanged)
    }
  }, [syncQueue])

  return {
    isOnline,
    pendingSyncCount,
    setPendingSyncCount,
    syncQueue,
  }
}

