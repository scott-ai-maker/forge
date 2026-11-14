import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  BACKOFF_SCHEDULE_MS,
   computeRetryBackoffMs,
  detectTelemetryPlatform,
  flushTelemetry,
  flushTelemetryOnBackground,
  formatIsoWithLocalOffset,
  generateTelemetryUuid,
  getTelemetryHealth,
  recordCameraFpsSample,
  sanitizeTelemetryPayload,
  sendTelemetryDiagnosticPing,
  setTelemetryAuthContext,
  trackEvent,
  __resetTelemetryClientForTests,
} from './telemetryClient'

function createMockLocalStorage() {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v)
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
    dump: () => ({ ...store }),
  }
}

function createMockIndexedDb() {
  const records = new Map<string, Record<string, unknown>>()

  const open = () => {
    const req: Record<string, unknown> = {
      result: null,
      error: null,
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      onblocked: null,
    }

    const db = {
      objectStoreNames: {
        contains: () => true,
      },
      createObjectStore: () => ({
        createIndex: () => {},
      }),
      onversionchange: null,
      close: () => {},
      transaction: () => {
        const tx: Record<string, unknown> = {
          oncomplete: null,
          onerror: null,
          onabort: null,
          error: null,
          objectStore: () => ({
            put: (val: { event_id: string }) => {
              records.set(val.event_id, val)
            },
            delete: (id: string) => {
              records.delete(id)
            },
            clear: () => {
              records.clear()
            },
            getAll: () => {
              const getReq: Record<string, unknown> = {
                result: Array.from(records.values()),
                onsuccess: null,
                onerror: null,
              }
              queueMicrotask(() => {
                if (typeof getReq.onsuccess === 'function') {
                  ;(getReq.onsuccess as () => void)()
                }
              })
              return getReq
            },
          }),
        }
        queueMicrotask(() => {
          if (typeof tx.oncomplete === 'function') {
            ;(tx.oncomplete as () => void)()
          }
        })
        return tx
      },
    }

    req.result = db
    queueMicrotask(() => {
      if (typeof req.onsuccess === 'function') {
        ;(req.onsuccess as () => void)()
      }
    })
    return req
  }

  return {
    open,
    getRecords: () => Array.from(records.values()),
  }
}

describe('Forge Athletic Unified Telemetry Client', () => {
  let mockLs: ReturnType<typeof createMockLocalStorage>
  let mockIdb: ReturnType<typeof createMockIndexedDb>

  beforeEach(() => {
    mockLs = createMockLocalStorage()
    mockIdb = createMockIndexedDb()

    const winListeners = new Map<string, Set<EventListener>>()
    const docListeners = new Map<string, Set<EventListener>>()

    vi.stubGlobal('localStorage', mockLs)
    vi.stubGlobal('sessionStorage', createMockLocalStorage())
    vi.stubGlobal('navigator', {
      onLine: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36',
      connection: { effectiveType: '4g' },
      sendBeacon: vi.fn().mockReturnValue(true),
    })
    vi.stubGlobal('document', {
      visibilityState: 'visible',
      referrer: '',
      createElement: () => ({
        getContext: () => ({
          getExtension: () => ({ loseContext: () => {} }),
        }),
      }),
      addEventListener: (type: string, cb: EventListener) => {
        if (!docListeners.has(type)) docListeners.set(type, new Set())
        docListeners.get(type)!.add(cb)
      },
      removeEventListener: (type: string, cb: EventListener) => {
        docListeners.get(type)?.delete(cb)
      },
    })
    vi.stubGlobal('window', {
      localStorage: mockLs,
      sessionStorage: createMockLocalStorage(),
      indexedDB: mockIdb,
      matchMedia: () => ({ matches: false }),
      addEventListener: (type: string, cb: EventListener) => {
        if (!winListeners.has(type)) winListeners.set(type, new Set())
        winListeners.get(type)!.add(cb)
      },
      removeEventListener: (type: string, cb: EventListener) => {
        winListeners.get(type)?.delete(cb)
      },
      dispatchEvent: () => true,
    })

    __resetTelemetryClientForTests()
  })

  afterEach(() => {
    __resetTelemetryClientForTests()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('generates RFC 4122 UUIDv4 event IDs and ISO-8601 timestamps with local timezone offset', () => {
    const id = generateTelemetryUuid()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )

    const { isoWithOffset, timezoneOffsetMins } = formatIsoWithLocalOffset(
      new Date('2026-11-13T18:30:00.000Z')
    )
    expect(isoWithOffset).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/
    )
    expect(typeof timezoneOffsetMins).toBe('number')
  })

  it('auto-detects ios_app, android_app (TWA & Capacitor), pwa_standalone, mobile_web, and desktop_web', () => {
    expect(
      detectTelemetryPlatform({ isNativeCapacitor: true, capacitorPlatform: 'ios' })
    ).toBe('ios_app')

    expect(
      detectTelemetryPlatform({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
        hasWebkitBridge: true,
      })
    ).toBe('ios_app')

    expect(
      detectTelemetryPlatform({
        referrer: 'android-app://app.forgeathletic.mobile',
        userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/131.0',
      })
    ).toBe('android_app')

    expect(
      detectTelemetryPlatform({
        isStandalone: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Safari/604.1',
      })
    ).toBe('pwa_standalone')

    expect(
      detectTelemetryPlatform({
        isStandalone: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Mobile/15E148 Safari/604.1',
      })
    ).toBe('mobile_web')

    expect(
      detectTelemetryPlatform({
        isStandalone: false,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Chrome/131.0',
      })
    ).toBe('desktop_web')
  })

  it('strips occluded undefined landmark fields and normalizes NaN / Infinity to null', () => {
    const dirtyLandmarks = {
      scan_mode: 'full_33_point_mesh',
      forward_head_tilt_deg: Number.NaN,
      shoulder_symmetry_deg: Number.POSITIVE_INFINITY,
      pelvic_symmetry_deg: Number.NEGATIVE_INFINITY,
      occluded_joint: undefined,
      joint_deltas_33: [
        { index: 0, name: 'nose', x: 0.51, y: Number.NaN, z: undefined, visibility: 0.98 },
        undefined,
      ],
    }

    const sanitized = sanitizeTelemetryPayload(dirtyLandmarks)
    const serialized = JSON.stringify(sanitized)
    const reparsed = JSON.parse(serialized)

    expect(reparsed.forward_head_tilt_deg).toBeNull()
    expect(reparsed.shoulder_symmetry_deg).toBeNull()
    expect(reparsed.pelvic_symmetry_deg).toBeNull()
    expect('occluded_joint' in reparsed).toBe(false)
    expect(reparsed.joint_deltas_33[0]).toEqual({
      index: 0,
      name: 'nose',
      x: 0.51,
      y: null,
      visibility: 0.98,
    })
    expect(reparsed.joint_deltas_33[1]).toBeNull()
  })

  it('persists offline events in IndexedDB and flushes high-priority events immediately with Bearer token', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, accepted: 1 }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    setTelemetryAuthContext({ userId: 'user-uuid-1', accessToken: 'ios-jwt-token-123' })
    recordCameraFpsSample(30)
    recordCameraFpsSample(28)

    const env = await trackEvent('workout_completed', {
      session_date: '2026-11-13',
      opt_phase: 2,
      express_20m: true,
      environment_profile: 'hotel_travel',
      rpe: 8,
      duration_mins: 20,
      completed: true,
    })

    expect(env.user_id).toBe('user-uuid-1')
    expect(env.cv_capability.avg_camera_fps).toBe(29)

    // Allow microtask flush to settle
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/telemetry')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer ios-jwt-token-123'
    )
    expect(getTelemetryHealth().queueDepth).toBe(0)
    expect(mockIdb.getRecords()).toHaveLength(0)
  })

  it('falls back to localStorage automatically when IndexedDB is restricted (iOS Private Browsing)', async () => {
    __resetTelemetryClientForTests({ disableIndexedDb: true })
    vi.stubGlobal('navigator', {
      onLine: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    })

    await trackEvent('joint_comfort_logged', {
      comfort_score: 86,
      comfort_label: 'Fluid',
    })

    const health = getTelemetryHealth()
    expect(health.storageEngine).toBe('localstorage')
    expect(health.queueDepth).toBe(1)
    expect(mockLs.getItem('forge_telemetry_queue_v1')).toContain('joint_comfort_logged')
  })

  it('batches high-frequency set_logged events until threshold (10 events) with priority: low', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, accepted: 10 }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    for (let i = 1; i <= 9; i += 1) {
      await trackEvent('set_logged', {
        session_date: '2026-11-13',
        exercise_name: 'Goblet Squat',
        set_number: i,
        reps: 10,
        weight_kg: 24,
        rpe: 7,
        opt_phase: 1,
        express_20m: false,
        environment_profile: 'home_gym',
      })
    }

    // Below 10-event threshold -> still queued, not flushed yet
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getTelemetryHealth().telemetryQueueDepth).toBe(9)

    // 10th event triggers immediate batch flush
    await trackEvent('set_logged', {
      session_date: '2026-11-13',
      exercise_name: 'Goblet Squat',
      set_number: 10,
      reps: 10,
      weight_kg: 24,
      rpe: 8,
      opt_phase: 1,
      express_20m: false,
      environment_profile: 'home_gym',
    })

    await new Promise(resolve => setTimeout(resolve, 25))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0]
    expect(init.priority).toBe('low')
    expect(getTelemetryHealth().telemetryQueueDepth).toBe(0)
  })

  it('computes jittered exponential backoff following 1s -> 2s -> 4s -> 16s -> 60s schedule', () => {
    expect(BACKOFF_SCHEDULE_MS).toEqual([1000, 2000, 4000, 16000, 60000])

    // Midpoint random (0.5) => 1.0x multiplier
    expect(computeRetryBackoffMs(0, () => 0.5)).toBe(1000)
    expect(computeRetryBackoffMs(1, () => 0.5)).toBe(2000)
    expect(computeRetryBackoffMs(2, () => 0.5)).toBe(4000)
    expect(computeRetryBackoffMs(3, () => 0.5)).toBe(16000)
    expect(computeRetryBackoffMs(4, () => 0.5)).toBe(60000)
    expect(computeRetryBackoffMs(9, () => 0.5)).toBe(60000)
  })

  it('uses fetch(..., { keepalive: true }) on backgrounding so packets survive iOS tab suspension', async () => {
    // Queue event while offline first, then come online and trigger background flush
    vi.stubGlobal('navigator', {
      onLine: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X)',
    })
    setTelemetryAuthContext({ userId: 'athlete-9', accessToken: 'wkwebview-bearer' })

    await trackEvent('desk_reset_completed', {
      duration_sec: 300,
      drills_completed: 4,
      strain_flags_targeted: ['forward_head'],
    })
    expect(getTelemetryHealth().telemetryQueueDepth).toBe(1)

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubGlobal('navigator', {
      onLine: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X)',
    })

    flushTelemetryOnBackground()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0]
    expect(init.keepalive).toBe(true)
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer wkwebview-bearer')
  })

  it('verifies end-to-end diagnostic ping round-trip against GET /api/telemetry?verifyEventId=', async () => {
    const fetchSpy = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, accepted: 1 }),
        }
      }
      expect(url).toContain('/api/telemetry?verifyEventId=')
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          verified: true,
          receivedAt: '2026-11-13T21:55:00.000Z',
          storageMode: 'supabase',
        }),
      }
    })
    vi.stubGlobal('fetch', fetchSpy)

    const ping = await sendTelemetryDiagnosticPing()
    expect(ping.verified).toBe(true)
    expect(ping.httpStatus).toBe(200)
    expect(ping.storageMode).toBe('supabase')
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    // Ensure flushTelemetry remains clean after ping
    const postFlush = await flushTelemetry()
    expect(postFlush.ok).toBe(true)
  })
})
