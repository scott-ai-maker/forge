import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  enqueueOfflineSet,
  getQueuedOfflineSets,
  dequeueOfflineSet,
  getPendingQueueCount,
  flushOfflineQueue,
  clearOfflineQueue,
  setOfflineQueueAccessToken,
  OFFLINE_QUEUE_CHANGED_EVENT,
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

  it('preserves the optimistic set ID for reconciliation after retry', () => {
    const item = enqueueOfflineSet({
      sessionDate: '2026-10-10',
      exerciseName: 'Bench Press',
      setNumber: 1,
      reps: 10,
    }, 'temp_set_existing')
    expect(item.tempId).toBe('temp_set_existing')
    expect(getQueuedOfflineSets()[0].tempId).toBe('temp_set_existing')
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
    enqueueOfflineSet({
      sessionDate: '2026-08-26',
      exerciseName: 'Malformed Deadlift',
      setNumber: 1,
      reps: 5,
    })

    // Manually set retryCount to 5 in storage across both Forge and legacy keys
    const rawQueue = JSON.parse(store['forge_offline_set_queue_v1'])
    rawQueue[0].retryCount = 5
    store['forge_offline_set_queue_v1'] = JSON.stringify(rawQueue)
    store['sgf_offline_set_queue_v1'] = JSON.stringify(rawQueue)

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as unknown as Response)

    const res = await flushOfflineQueue()
    expect(res.failed).toBe(1)
    expect(res.synced).toBe(0)
    // The expired item should be purged from the active queue
    expect(getPendingQueueCount()).toBe(0)
  })

  it('drops non-retryable 400/422 poison-pill payloads immediately without blocking subsequent valid sets', async () => {
    enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Invalid Poison Set',
      setNumber: 1,
      reps: -5,
    })
    enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Valid Goblet Squat',
      setNumber: 2,
      reps: 10,
      weightKg: 28,
    })

    global.fetch = vi.fn().mockImplementation(async (_url, init) => {
      const parsed = JSON.parse(String(init?.body || '{}'))
      if (parsed.exerciseName === 'Invalid Poison Set') {
        return { ok: false, status: 422 } as unknown as Response
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ setLog: { id: 'srv_valid_2' } }),
      } as unknown as Response
    })

    const res = await flushOfflineQueue()
    expect(res.synced).toBe(1)
    expect(res.failed).toBe(1)
    expect(getPendingQueueCount()).toBe(0)
  })

  it('preserves sets enqueued while flushOfflineQueue is in flight and respects mid-flight dequeues', async () => {
    const failedSet = enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Set 1 (Transient 503)',
      setNumber: 1,
      reps: 8,
    })
    const removedMidFlight = enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Set 2 (User Deleted Mid-Flush)',
      setNumber: 2,
      reps: 8,
    })

    let newlyAddedTempId = ''
    global.fetch = vi.fn().mockImplementation(async (_url, init) => {
      const parsed = JSON.parse(String(init?.body || '{}'))
      if (parsed.exerciseName === 'Set 1 (Transient 503)') {
        // Athlete logs Set 3 and deletes Set 2 while Set 1 POST is in flight!
        const added = enqueueOfflineSet({
          sessionDate: '2026-11-15',
          exerciseName: 'Set 3 (Logged Mid-Flush)',
          setNumber: 3,
          reps: 10,
          weightKg: 80,
        })
        newlyAddedTempId = added.tempId
        dequeueOfflineSet(removedMidFlight.tempId)
      }
      return { ok: false, status: 503 } as unknown as Response
    })

    const res = await flushOfflineQueue()
    expect(res.failed).toBe(2)

    const remaining = getQueuedOfflineSets()
    expect(remaining.map(r => r.tempId)).toEqual([failedSet.tempId, newlyAddedTempId])
    expect(remaining[0].retryCount).toBe(1)
    expect(remaining[1].retryCount).toBe(0)
    expect(remaining[1].status).toBe('pending')
  })

  it('multiplexes onSetSynced callbacks across concurrent flushOfflineQueue callers without duplicate POSTs', async () => {
    const item = enqueueOfflineSet(
      {
        sessionDate: '2026-11-15',
        exerciseName: 'Front Squat',
        setNumber: 1,
        reps: 6,
        weightKg: 110,
      },
      'temp_set_mux_1'
    )

    const fetchSpy = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 25))
      return {
        ok: true,
        status: 200,
        json: async () => ({ setLog: { id: 'srv_mux_001', exercise_name: 'Front Squat' } }),
      } as unknown as Response
    })
    global.fetch = fetchSpy

    const lateReconciler = vi.fn()
    // Badge triggers flush first without callback; hook joins 5ms later with onSetSynced
    const badgeFlush = flushOfflineQueue()
    await new Promise(resolve => setTimeout(resolve, 5))
    const hookFlush = flushOfflineQueue(lateReconciler)

    const [res1, res2] = await Promise.all([badgeFlush, hookFlush])
    expect(res1.synced + res2.synced).toBe(1)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(lateReconciler).toHaveBeenCalledWith(
      item.tempId,
      expect.objectContaining({ id: 'srv_mux_001' })
    )
  })

  it('attaches cached iOS WKWebView Bearer token and clears it on clearOfflineQueue()', async () => {
    setOfflineQueueAccessToken('ios-wkwebview-jwt-999')
    enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Incline Dumbbell Press',
      setNumber: 1,
      reps: 10,
    })

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ setLog: { id: 'srv_jwt_1' } }),
    } as unknown as Response)
    global.fetch = fetchSpy

    await flushOfflineQueue()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0]
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer ios-wkwebview-jwt-999'
    )

    clearOfflineQueue()
    enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Incline Dumbbell Press',
      setNumber: 2,
      reps: 10,
    })
    await flushOfflineQueue()
    const [, initAfterClear] = fetchSpy.mock.calls[1]
    expect((initAfterClear.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('gracefully handles malformed or non-array localStorage JSON and emits OFFLINE_QUEUE_CHANGED_EVENT', () => {
    store['forge_offline_set_queue_v1'] = '{"corrupted":true}'
    expect(getQueuedOfflineSets()).toEqual([])

    store['forge_offline_set_queue_v1'] = 'not-valid-json{{{'
    expect(getQueuedOfflineSets()).toEqual([])
    clearOfflineQueue()

    const dispatchSpy = vi.fn()
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: dispatchSpy,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Kettlebell Swing',
      setNumber: 1,
      reps: 15,
    })

    expect(dispatchSpy).toHaveBeenCalled()
    const emittedEvent = dispatchSpy.mock.calls[0][0] as CustomEvent
    expect(emittedEvent.type).toBe(OFFLINE_QUEUE_CHANGED_EVENT)
    vi.unstubAllGlobals()
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
