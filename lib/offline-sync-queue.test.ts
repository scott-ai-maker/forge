import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  enqueueOfflineSet,
  getQueuedOfflineSets,
  dequeueOfflineSet,
  getPendingQueueCount,
  flushOfflineQueue,
  triggerHaptic,
  registerAutoSyncOnReconnect,
} from './offline-sync-queue'

describe('offline-sync-queue', () => {
  let store: Record<string, string> = {}

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    })
    vi.restoreAllMocks()
  })

  it('enqueues a set log payload and saves to localStorage', () => {
    const item = enqueueOfflineSet({
      sessionDate: '2026-08-26',
      exerciseName: 'Barbell Bench Press',
      setNumber: 1,
      reps: 10,
      weightKg: 100,
      restSeconds: 60,
    })

    expect(item.tempId).toMatch(/^temp_set_/)
    expect(item.status).toBe('pending')
    expect(getPendingQueueCount()).toBe(1)

    const queued = getQueuedOfflineSets()
    expect(queued.length).toBe(1)
    expect(queued[0].exerciseName).toBe('Barbell Bench Press')
  })

  it('dequeues an item by tempId', () => {
    const item1 = enqueueOfflineSet({
      sessionDate: '2026-08-26',
      exerciseName: 'Barbell Back Squat',
      setNumber: 1,
      reps: 8,
      weightKg: 140,
    })

    const item2 = enqueueOfflineSet({
      sessionDate: '2026-08-26',
      exerciseName: 'Romanian Deadlift',
      setNumber: 1,
      reps: 10,
      weightKg: 110,
    })

    expect(getPendingQueueCount()).toBe(2)

    dequeueOfflineSet(item1.tempId)

    const remaining = getQueuedOfflineSets()
    expect(remaining.length).toBe(1)
    expect(remaining[0].tempId).toBe(item2.tempId)
  })

  it('flushes pending queue successfully on fetch 200', async () => {
    enqueueOfflineSet({
      sessionDate: '2026-08-26',
      exerciseName: 'Pull-Ups',
      setNumber: 1,
      reps: 12,
    })

    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        setLog: { id: 'srv_123', exercise_name: 'Pull-Ups', reps: 12 },
      }),
    } as unknown as Response)

    const syncedCallback = vi.fn()
    const res = await flushOfflineQueue(syncedCallback)

    expect(res.synced).toBe(1)
    expect(res.failed).toBe(0)
    expect(syncedCallback).toHaveBeenCalledWith(
      expect.stringMatching(/^temp_set_/),
      expect.objectContaining({ id: 'srv_123' })
    )
    expect(getPendingQueueCount()).toBe(0)
  })

  it('handles offline / network error gracefully during flush', async () => {
    enqueueOfflineSet({
      sessionDate: '2026-08-26',
      exerciseName: 'Overhead Press',
      setNumber: 1,
      reps: 8,
    })

    // Mock failed fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'))

    const res = await flushOfflineQueue()

    expect(res.synced).toBe(0)
    expect(res.failed).toBe(1)
    expect(getPendingQueueCount()).toBe(1)
  })

  it('triggers haptic feedback safely without error', () => {
    expect(() => triggerHaptic('tap')).not.toThrow()
    expect(() => triggerHaptic('heavy')).not.toThrow()
    expect(() => triggerHaptic('success')).not.toThrow()
    expect(() => triggerHaptic('timer')).not.toThrow()
  })

  it('discards items exceeding MAX_RETRY_COUNT (5 retries)', async () => {
    const item = enqueueOfflineSet({
      sessionDate: '2026-08-26',
      exerciseName: 'Malformed Deadlift',
      setNumber: 1,
      reps: 5,
    })

    // Manually set retryCount to 5 in storage
    const rawQueue = JSON.parse(store['sgf_offline_set_queue_v1'])
    rawQueue[0].retryCount = 5
    store['sgf_offline_set_queue_v1'] = JSON.stringify(rawQueue)

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    } as unknown as Response)

    const res = await flushOfflineQueue()
    expect(res.failed).toBe(1)
    expect(res.synced).toBe(0)
    // The expired item should be purged from the active queue
    expect(getPendingQueueCount()).toBe(0)
  })

  it('registers auto-sync on reconnect and cleans up listener', () => {
    const mockWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    vi.stubGlobal('window', mockWindow)

    const cleanup = registerAutoSyncOnReconnect()
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))

    cleanup()
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    vi.unstubAllGlobals()
  })
})
