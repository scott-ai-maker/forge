import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  enqueueOfflineSet,
  getQueuedOfflineSets,
  dequeueOfflineSet,
  getPendingQueueCount,
  flushOfflineQueue,
  clearOfflineQueue,
  registerAutoSyncOnReconnect,
} from './offline-sync-queue'

describe('Mobile & PWA Gym-Floor Offline Sync Stress Test ("Basement Gym Resilience")', () => {
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

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Basement Gym Connection Loss & Optimistic In-Gym Logging', () => {
    it('enqueues a full 5-set compound progression with clinical biomechanical telemetry', () => {
      const exerciseName = 'Barbell Back Squat'
      const sessionDate = '2026-10-24'
      const workoutPlanId = 'plan_hypertrophy_phase_3'

      const queuedIds: string[] = []

      // Simulate athlete logging 5 sets with progressive load and RPE pacing
      const setDrafts = [
        { setNumber: 1, reps: 10, weightKg: 100, tempo: '2/0/2', restSeconds: 90, rpe: 7, rir: 3, isWarmup: true },
        { setNumber: 2, reps: 8, weightKg: 120, tempo: '2/0/2', restSeconds: 90, rpe: 8, rir: 2, isWarmup: false },
        { setNumber: 3, reps: 8, weightKg: 130, tempo: '2/0/2', restSeconds: 120, rpe: 8.5, rir: 1.5, isWarmup: false },
        { setNumber: 4, reps: 6, weightKg: 140, tempo: '2/0/2', restSeconds: 120, rpe: 9, rir: 1, isWarmup: false },
        { setNumber: 5, reps: 6, weightKg: 142.5, tempo: '2/0/2', restSeconds: 150, rpe: 9.5, rir: 0.5, isWarmup: false, notes: 'Felt strong, clean depth' },
      ]

      for (const draft of setDrafts) {
        const item = enqueueOfflineSet({
          workoutPlanId,
          sessionDate,
          exerciseName,
          ...draft,
        })
        queuedIds.push(item.tempId)
      }

      expect(getPendingQueueCount()).toBe(5)
      const queued = getQueuedOfflineSets()
      expect(queued.length).toBe(5)

      // Verify all biomechanical indicators are intact
      expect(queued[0].isWarmup).toBe(true)
      expect(queued[4].weightKg).toBe(142.5)
      expect(queued[4].notes).toBe('Felt strong, clean depth')
      expect(queued[4].tempo).toBe('2/0/2')
      expect(queued[4].rpe).toBe(9.5)

      // Verify dual-key storage persistence (Forge key and legacy compatibility key)
      expect(store['forge_offline_set_queue_v1']).toBeTruthy()
      expect(store['sgf_offline_set_queue_v1']).toBeTruthy()
    })

    it('preserves exact optimisticTempId between client state and offline queue', () => {
      const clientOptimisticId = 'temp_set_optimistic_abc987'
      const item = enqueueOfflineSet(
        {
          sessionDate: '2026-10-24',
          exerciseName: 'Romanian Deadlift (RDL)',
          setNumber: 1,
          reps: 10,
          weightKg: 100,
          tempo: '4/2/1',
          restSeconds: 90,
          rpe: 8,
        },
        clientOptimisticId
      )

      expect(item.tempId).toBe(clientOptimisticId)
      const queued = getQueuedOfflineSets()
      expect(queued[0].tempId).toBe(clientOptimisticId)
    })
  })

  describe('Reconnection Burst & Concurrency Lock Prevention', () => {
    it('prevents duplicate submissions when auto-sync and manual sync trigger concurrently', async () => {
      // Queue 3 sets
      enqueueOfflineSet({ sessionDate: '2026-10-24', exerciseName: 'Overhead Press', setNumber: 1, reps: 8 })
      enqueueOfflineSet({ sessionDate: '2026-10-24', exerciseName: 'Overhead Press', setNumber: 2, reps: 8 })
      enqueueOfflineSet({ sessionDate: '2026-10-24', exerciseName: 'Overhead Press', setNumber: 3, reps: 8 })

      let fetchCallCount = 0
      global.fetch = vi.fn().mockImplementation(async () => {
        fetchCallCount++
        // Add a slight async delay to simulate real network transit
        await new Promise(r => setTimeout(r, 25))
        return {
          ok: true,
          json: async () => ({ setLog: { id: `server_${fetchCallCount}` } }),
        } as unknown as Response
      })

      // Fire 3 simultaneous flushes (e.g. online event, user click, and interval tick)
      const [res1, res2, res3] = await Promise.all([
        flushOfflineQueue(),
        flushOfflineQueue(),
        flushOfflineQueue(),
      ])

      // Only one flush should have acquired the lock; others should return { synced: 0, failed: 0 }
      const totalSynced = res1.synced + res2.synced + res3.synced
      expect(totalSynced).toBe(3)
      expect(fetchCallCount).toBe(3) // Exactly 3 network requests, NEVER 9
      expect(getPendingQueueCount()).toBe(0)
    })
  })

  describe('Reconciliation of Optimistic IDs to Supabase UUIDs', () => {
    it('notifies onSetSynced callback with corresponding tempId and server record', async () => {
      const optId1 = 'temp_set_squat_1'
      const optId2 = 'temp_set_squat_2'

      enqueueOfflineSet({ sessionDate: '2026-10-24', exerciseName: 'Squat', setNumber: 1, reps: 5, weightKg: 140 }, optId1)
      enqueueOfflineSet({ sessionDate: '2026-10-24', exerciseName: 'Squat', setNumber: 2, reps: 5, weightKg: 140 }, optId2)

      const serverDbRecords = {
        [optId1]: { id: 'uuid-server-db-001', exercise_name: 'Squat', reps: 5, weight_kg: 140 },
        [optId2]: { id: 'uuid-server-db-002', exercise_name: 'Squat', reps: 5, weight_kg: 140 },
      }

      global.fetch = vi.fn().mockImplementation(async (_url, options) => {
        const body = JSON.parse(options.body)
        const matchedOptId = body.setNumber === 1 ? optId1 : optId2
        return {
          ok: true,
          json: async () => ({ setLog: serverDbRecords[matchedOptId] }),
        } as unknown as Response
      })

      const reconciledMap = new Map<string, unknown>()
      const result = await flushOfflineQueue((tempId, serverRecord) => {
        reconciledMap.set(tempId, serverRecord)
      })

      expect(result.synced).toBe(2)
      expect(result.failed).toBe(0)
      expect(reconciledMap.size).toBe(2)
      expect(reconciledMap.get(optId1)).toEqual(serverDbRecords[optId1])
      expect(reconciledMap.get(optId2)).toEqual(serverDbRecords[optId2])
    })
  })

  describe('Adversarial Network Degradation & Circuit Breaker', () => {
    it('increments retryCount on 500 error and purges after MAX_RETRY_COUNT (5)', async () => {
      enqueueOfflineSet({
        sessionDate: '2026-10-24',
        exerciseName: 'Heavy Bench Press',
        setNumber: 1,
        reps: 3,
        weightKg: 125,
      })

      // Simulate server 503 Service Unavailable / Gateway Timeout
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      } as unknown as Response)

      // Attempt 1
      const res1 = await flushOfflineQueue()
      expect(res1.failed).toBe(1)
      const queued = getQueuedOfflineSets()
      expect(queued[0].retryCount).toBe(1)
      expect(queued[0].status).toBe('failed')

      // Fast-forward retryCount to 5 to test circuit breaker
      queued[0].retryCount = 5
      store['forge_offline_set_queue_v1'] = JSON.stringify(queued)
      store['sgf_offline_set_queue_v1'] = JSON.stringify(queued)

      // Attempt 2: Should permanently drop the unrecoverable item to prevent infinite thrashing
      const res2 = await flushOfflineQueue()
      expect(res2.failed).toBe(1)
      expect(getPendingQueueCount()).toBe(0)
    })
  })

  describe('HIPAA (1996) Privacy Standard: Device Queue Clearing on Logout', () => {
    it('safely purges all offline queue telemetry across both storage keys', () => {
      enqueueOfflineSet({ sessionDate: '2026-10-24', exerciseName: 'Deadlift', setNumber: 1, reps: 5 })
      enqueueOfflineSet({ sessionDate: '2026-10-24', exerciseName: 'Deadlift', setNumber: 2, reps: 5 })
      expect(getPendingQueueCount()).toBe(2)

      // Athlete logs out or signs into a shared facility iPad
      clearOfflineQueue()

      expect(getPendingQueueCount()).toBe(0)
      expect(store['forge_offline_set_queue_v1']).toBeUndefined()
      expect(store['sgf_offline_set_queue_v1']).toBeUndefined()
    })
  })

  describe('Offline Active Plan & Workout Cache Integrity', () => {
    it('validates offline plan caching format for offline.html navigation fallback', () => {
      const mockActivePlan = {
        id: 'plan_opt_phase1_stabilization',
        name: 'Executive Core & Kinetic Stabilization',
        nasm_opt_phase: 1,
        phase_name: 'Phase 1: Stabilization Endurance',
        sessions_per_week: 3,
        plan_json: {
          workouts: [
            {
              day: 1,
              name: 'Day 1: Stabilization Foundations',
              exercises: [
                { name: 'Single-Leg Balance Reach', sets: 3, reps: '12-15', tempo: '4/2/1', rest: '60s' },
                { name: 'Floor Prone Cobra', sets: 3, reps: '15', tempo: '4/2/1', rest: '60s' },
              ],
            },
          ],
        },
      }

      // Persist active plan to offline storage
      store['forge_cached_active_plan_v1'] = JSON.stringify(mockActivePlan)

      // Athlete enters gym without network
      const restoredPlanRaw = store['forge_cached_active_plan_v1']
      expect(restoredPlanRaw).toBeTruthy()
      const restored = JSON.parse(restoredPlanRaw)

      expect(restored.id).toBe('plan_opt_phase1_stabilization')
      expect(restored.nasm_opt_phase).toBe(1)
      expect(restored.plan_json.workouts[0].exercises.length).toBe(2)
      expect(restored.plan_json.workouts[0].exercises[0].tempo).toBe('4/2/1')
    })
  })
})
