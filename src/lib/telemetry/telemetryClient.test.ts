import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  BACKOFF_SCHEDULE_MS,
  MAX_TELEMETRY_HTTP_RETRIES,
  clearTelemetryQueue,
  computeRetryBackoffMs,
  detectTelemetryPlatform,
  flushTelemetry,
  flushTelemetryOnBackground,
  formatIsoWithLocalOffset,
  generateTelemetryUuid,
  getTelemetryHealth,
  recordCameraFpsSample,
  sanitizeTelemetryPayload,
  scrubDiagnosticText,
  sendTelemetryDiagnosticPing,
  setTelemetryAuthContext,
  trackEvent,
  __resetTelemetryClientForTests,
} from './telemetryClient'
import { enqueueOfflineSet, getPendingQueueCount } from '@/lib/offline-sync-queue'

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

  it('scrubs Bearer tokens, OAuth query tokens, emails, and phone numbers in diagnostic payloads (HIPAA Minimum Necessary)', async () => {
    const rawLeak =
      'Auth failed for athlete.jane@forge-athletic.app (+1 415-555-0199) with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret at https://forge-athletic.app/cb?access_token=tok_live_999&code=oauth_code_123'
    const scrubbed = scrubDiagnosticText(rawLeak)
    expect(scrubbed).not.toContain('athlete.jane@forge-athletic.app')
    expect(scrubbed).not.toContain('415-555-0199')
    expect(scrubbed).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
    expect(scrubbed).not.toContain('tok_live_999')
    expect(scrubbed).not.toContain('oauth_code_123')
    expect(scrubbed).toContain('[REDACTED_EMAIL]')
    expect(scrubbed).toContain('[REDACTED_PHONE]')
    expect(scrubbed).toContain('Bearer [REDACTED_TOKEN]')

    vi.stubGlobal('navigator', {
      onLine: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    })

    const env = await trackEvent('client_runtime_diagnostic', {
      diagnostic_kind: 'exception',
      error_name: 'AuthTokenLeakError',
      error_message: rawLeak,
      component_context: 'callback?refresh_token=sec_refresh_777',
    })

    expect(env.payload.error_message).not.toContain('athlete.jane@forge-athletic.app')
    expect(env.payload.error_message).toContain('[REDACTED_EMAIL]')
    expect(env.payload.component_context).toContain('refresh_token=[REDACTED]')
  })

  it('drains newly enqueued diagnostic ping events even when called while another batch POST is in flight', async () => {
    vi.stubGlobal('navigator', {
      onLine: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    })
    await trackEvent('joint_comfort_logged', {
      comfort_score: 82,
      comfort_label: 'Steady',
    })

    vi.stubGlobal('navigator', {
      onLine: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    })

    const flushedEventIds = new Set<string>()
    const fetchSpy = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body || '{"events":[]}')) as {
          events: Array<{ event_id: string }>
        }
        // Delay first batch so sendTelemetryDiagnosticPing overlaps in-flight!
        if (flushedEventIds.size === 0) {
          await new Promise(resolve => setTimeout(resolve, 35))
        }
        for (const ev of body.events) {
          flushedEventIds.add(ev.event_id)
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, accepted: body.events.length }),
        }
      }

      const verifyId = new URL(url, 'http://localhost:3000').searchParams.get('verifyEventId') || ''
      const wasAlreadyFlushed = flushedEventIds.has(verifyId)
      return {
        ok: wasAlreadyFlushed,
        status: wasAlreadyFlushed ? 200 : 404,
        json: async () => ({
          ok: wasAlreadyFlushed,
          verified: wasAlreadyFlushed,
          storageMode: 'supabase',
        }),
      }
    })
    vi.stubGlobal('fetch', fetchSpy)

    const backgroundFlush = flushTelemetry({ reason: 'online' })
    await new Promise(resolve => setTimeout(resolve, 5))
    const pingResult = await sendTelemetryDiagnosticPing()
    await backgroundFlush

    expect(pingResult.verified).toBe(true)
    expect(flushedEventIds.has(pingResult.eventId)).toBe(true)
    expect(getTelemetryHealth().telemetryQueueDepth).toBe(0)
  })

  it('drains multi-batch queues (>50 events) deterministically within a single awaited flushTelemetry call', async () => {
    vi.stubGlobal('navigator', {
      onLine: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    })

    for (let i = 1; i <= 65; i += 1) {
      await trackEvent('set_logged', {
        session_date: '2026-11-15',
        exercise_name: 'Cable Row',
        set_number: i,
        reps: 12,
        weight_kg: 55,
        rpe: 7,
        opt_phase: 2,
        express_20m: false,
        environment_profile: 'commercial_gym',
      })
    }
    expect(getTelemetryHealth().telemetryQueueDepth).toBe(65)

    const batchSizes: number[] = []
    vi.stubGlobal('navigator', {
      onLine: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
        const parsed = JSON.parse(String(init?.body || '{"events":[]}')) as { events: unknown[] }
        batchSizes.push(parsed.events.length)
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, accepted: parsed.events.length }),
        }
      })
    )

    const flushRes = await flushTelemetry({ reason: 'manual', interactive: true })
    expect(flushRes.ok).toBe(true)
    expect(flushRes.acceptedCount).toBe(65)
    expect(batchSizes).toEqual([50, 15])
    expect(getTelemetryHealth().telemetryQueueDepth).toBe(0)
  })

  it('evicts permanently failing envelopes after MAX_TELEMETRY_HTTP_RETRIES and purges both queues on clearTelemetryQueue()', async () => {
    vi.stubGlobal('navigator', {
      onLine: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    })
    await trackEvent('joint_comfort_logged', {
      comfort_score: 70,
      comfort_label: 'Guarded',
    })

    vi.stubGlobal('navigator', {
      onLine: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      })
    )

    for (let attempt = 1; attempt <= MAX_TELEMETRY_HTTP_RETRIES; attempt += 1) {
      await flushTelemetry({ reason: 'manual', interactive: true })
    }

    // Circuit breaker evicts the unrecoverable envelope on the 10th failed HTTP attempt
    expect(getTelemetryHealth().telemetryQueueDepth).toBe(0)

    // Verify unified sign-out purge clears both telemetry queue and offline set queue
    vi.stubGlobal('navigator', {
      onLine: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    })
    await trackEvent('joint_comfort_logged', {
      comfort_score: 90,
      comfort_label: 'Fluid',
    })
    enqueueOfflineSet({
      sessionDate: '2026-11-15',
      exerciseName: 'Front Squat',
      setNumber: 1,
      reps: 6,
      weightKg: 95,
    })
    expect(getTelemetryHealth().queueDepth).toBe(2)
    expect(getPendingQueueCount()).toBe(1)

    await clearTelemetryQueue()
    expect(getTelemetryHealth().queueDepth).toBe(0)
    expect(getPendingQueueCount()).toBe(0)
  })
})
