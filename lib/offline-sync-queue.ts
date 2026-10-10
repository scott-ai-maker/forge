/**
 * Offline Sync Queue & Mobile Web / Native Haptics Engine
 * Provides optimistic in-gym set logging with local storage persistence,
 * concurrency-locked background synchronization, and native iOS/Android
 * Taptic Engine haptics via Capacitor.
 */

import { Capacitor } from '@capacitor/core'
import { Haptics } from '@capacitor/haptics'

export type HapticImpactStyle = 'heavy' | 'medium' | 'light'
export type HapticNotificationType = 'SUCCESS' | 'WARNING' | 'ERROR'

export interface HapticsPluginInterface {
  impact(options: { style: HapticImpactStyle }): Promise<void>
  notification(options: { type: HapticNotificationType }): Promise<void>
  vibrate(options?: { duration?: number }): Promise<void>
  selectionStart(): Promise<void>
  selectionChanged(): Promise<void>
  selectionEnd(): Promise<void>
}

// Capacitor Haptics native plugin interface
export const NativeHaptics = Haptics as unknown as HapticsPluginInterface

export function isNativePlatform(): boolean {
  try {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export interface QueuedSetLogPayload {
  tempId: string
  queuedAt: number
  workoutPlanId?: string
  sessionDate: string
  exerciseName: string
  setNumber: number
  reps: number
  weightKg?: number
  tempo?: string | null
  restSeconds?: number
  rpe?: number
  rir?: number
  isWarmup?: boolean
  notes?: string
  status: 'pending' | 'syncing' | 'failed'
  retryCount: number
}

const STORAGE_KEY = 'sgf_offline_set_queue_v1'
const MAX_RETRY_COUNT = 5
let isFlushingQueue = false

/**
 * Trigger subtle, native tactile vibration:
 * 1. Uses Capacitor native Taptic Engine on iOS and Android native apps.
 * 2. Falls back to standard Web Vibration API on supported mobile browsers (e.g. Android Chrome).
 * 3. Fails silently with zero errors on unsupported environments (e.g. iOS Safari web).
 */
export function triggerHaptic(type: 'tap' | 'heavy' | 'success' | 'timer' = 'tap'): void {
  void triggerNativeHaptic(type)
}

/**
 * Async version of triggerHaptic for callers that need to await native completion.
 */
export async function triggerNativeHaptic(type: 'tap' | 'heavy' | 'success' | 'timer' = 'tap'): Promise<void> {
  if (typeof window === 'undefined') return

  // 1. Native iOS / Android Capacitor Taptic Engine
  if (isNativePlatform()) {
    try {
      switch (type) {
        case 'tap':
          await NativeHaptics.impact({ style: 'light' })
          return
        case 'heavy':
          await NativeHaptics.impact({ style: 'heavy' })
          return
        case 'success':
          await NativeHaptics.notification({ type: 'SUCCESS' })
          return
        case 'timer':
          await NativeHaptics.notification({ type: 'WARNING' })
          return
      }
    } catch {
      // Fallback to web vibration if plugin call throws
    }
  }

  // 2. Standard Web Vibration API (Android Chrome / Firefox)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'tap':
          navigator.vibrate(12)
          return
        case 'heavy':
          navigator.vibrate(25)
          return
        case 'success':
          navigator.vibrate([15, 40, 30])
          return
        case 'timer':
          navigator.vibrate([100, 50, 150])
          return
      }
    } catch {
      // Ignore unsupported web device errors
    }
  }
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    const globalScope = globalThis as unknown as { localStorage?: Storage }
    if (globalScope?.localStorage) {
      return globalScope.localStorage
    }
  } catch {
    return null
  }
  return null
}

/**
 * Get all queued sets from localStorage.
 */
export function getQueuedOfflineSets(): QueuedSetLogPayload[] {
  const storage = getStorage()
  if (!storage) return []

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as QueuedSetLogPayload[]
  } catch {
    return []
  }
}

/**
 * Save queued sets to localStorage.
 */
function saveQueuedOfflineSets(queue: QueuedSetLogPayload[]): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.error('Failed to save offline sets queue to localStorage:', err)
  }
}

/**
 * Enqueue a set log to the offline storage queue.
 */
export function enqueueOfflineSet(
  payload: Omit<QueuedSetLogPayload, 'tempId' | 'queuedAt' | 'status' | 'retryCount'>
): QueuedSetLogPayload {
  const tempId = `temp_set_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const queuedItem: QueuedSetLogPayload = {
    ...payload,
    tempId,
    queuedAt: Date.now(),
    status: 'pending',
    retryCount: 0,
  }

  const queue = getQueuedOfflineSets()
  queue.push(queuedItem)
  saveQueuedOfflineSets(queue)

  return queuedItem
}

/**
 * Remove an item from the offline queue by its tempId.
 */
export function dequeueOfflineSet(tempId: string): void {
  const queue = getQueuedOfflineSets()
  const updated = queue.filter(item => item.tempId !== tempId)
  saveQueuedOfflineSets(updated)
}

/**
 * Count how many sets are currently pending in the offline queue.
 */
export function getPendingQueueCount(): number {
  return getQueuedOfflineSets().filter(item => item.status === 'pending' || item.status === 'failed').length
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (typeof window === 'undefined') return headers

  try {
    const { createClient } = await import('@/lib/supabase-browser')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch {
    // Silent fallback if session lookup fails in testing or offline
  }

  return headers
}

/**
 * Flush and upload all pending sets in the offline queue to the server.
 * Includes concurrency locking to prevent duplicate submissions from multiple reconnect triggers.
 */
export async function flushOfflineQueue(
  onSetSynced?: (tempId: string, syncedServerRecord: unknown) => void
): Promise<{ synced: number; failed: number }> {
  if (isFlushingQueue) {
    return { synced: 0, failed: 0 }
  }

  const queue = getQueuedOfflineSets()
  if (queue.length === 0) {
    return { synced: 0, failed: 0 }
  }

  isFlushingQueue = true
  let syncedCount = 0
  let failedCount = 0
  const remainingQueue: QueuedSetLogPayload[] = []

  try {
    const headers = await getAuthHeaders()

    for (const item of queue) {
      // Discard permanently unrecoverable items exceeding max retry ceiling
      if (item.retryCount >= MAX_RETRY_COUNT) {
        failedCount++
        continue
      }

      try {
        const res = await fetch('/api/workouts/log-set', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            workoutPlanId: item.workoutPlanId,
            sessionDate: item.sessionDate,
            exerciseName: item.exerciseName,
            setNumber: item.setNumber,
            reps: item.reps,
            weightKg: item.weightKg,
            tempo: item.tempo,
            restSeconds: item.restSeconds,
            rpe: item.rpe,
            rir: item.rir,
            isWarmup: item.isWarmup,
            notes: item.notes,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          syncedCount++
          if (onSetSynced && data.setLog) {
            onSetSynced(item.tempId, data.setLog)
          }
        } else {
          failedCount++
          remainingQueue.push({
            ...item,
            status: 'failed',
            retryCount: item.retryCount + 1,
          })
        }
      } catch {
        failedCount++
        remainingQueue.push({
          ...item,
          status: 'failed',
          retryCount: item.retryCount + 1,
        })
      }
    }

    saveQueuedOfflineSets(remainingQueue)
  } finally {
    isFlushingQueue = false
  }

  return { synced: syncedCount, failed: failedCount }
}

/**
 * Automatically listens for device reconnection events and flushes the queue.
 */
export function registerAutoSyncOnReconnect(
  onSetSynced?: (tempId: string, syncedServerRecord: unknown) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => {
    void flushOfflineQueue(onSetSynced)
  }

  window.addEventListener('online', handleOnline)
  return () => {
    window.removeEventListener('online', handleOnline)
  }
}
