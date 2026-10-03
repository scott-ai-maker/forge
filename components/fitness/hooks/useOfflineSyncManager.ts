'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  flushOfflineQueue,
  getPendingQueueCount,
} from '@/lib/offline-sync-queue'

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
      onStatusMessage?.(`✓ Synced ${res.synced} offline workout set${res.synced > 1 ? 's' : ''} to cloud.`)
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

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncQueue])

  return {
    isOnline,
    pendingSyncCount,
    setPendingSyncCount,
    syncQueue,
  }
}

