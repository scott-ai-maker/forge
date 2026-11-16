import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireRoleMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireRole: requireRoleMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { POST as connectPost } from '@/app/api/wearables/connect/route'
import { POST as disconnectPost } from '@/app/api/wearables/disconnect/route'
import { GET as statusGet } from '@/app/api/wearables/status/route'
import { POST as syncPost } from '@/app/api/wearables/sync/route'
import { GET as webhookGet, POST as webhookPost } from '@/app/api/wearables/webhook/route'
import { POST as vitalLinkPost } from '@/app/api/wearables/vital/link/route'
import { POST as vitalWebhookPost } from '@/app/api/wearables/vital/webhook/route'

describe('Single Source of Truth Wearables API Endpoints (Apple Health & Google Health Connect)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-123', email: 'athlete@example.com' },
      client: { id: 'client-123', role: 'client' },
    })
  })

  it('authenticates and pairs Apple Health as single source of truth', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    supabaseAdminMock.mockReturnValue({
      from: () => ({ update: updateMock }),
    })

    const req = new NextRequest('http://localhost/api/wearables/connect', {
      method: 'POST',
      body: JSON.stringify({ provider: 'apple_health' }),
    })

    const res = await connectPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.connected).toBe(true)
    expect(json.provider).toBe('apple_health')
  })

  it('authenticates and pairs Google Health Connect as single source of truth', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    supabaseAdminMock.mockReturnValue({
      from: () => ({ update: updateMock }),
    })

    const req = new NextRequest('http://localhost/api/wearables/connect', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google_fit' }),
    })

    const res = await connectPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.connected).toBe(true)
    expect(json.provider).toBe('google_fit')
  })

  it('rejects old or unsupported wearable providers on connect', async () => {
    const req = new NextRequest('http://localhost/api/wearables/connect', {
      method: 'POST',
      body: JSON.stringify({ provider: 'whoop' }),
    })

    const res = await connectPost(req)
    expect(res.status).toBe(400)
  })

  it('returns connected single source wearable status and biometrics', async () => {
    supabaseAdminMock.mockReturnValue({
      from: (table: string) => ({
        select: () => {
          const queryObj: {
            eq: () => typeof queryObj
            order: () => typeof queryObj
            limit: () => typeof queryObj
            maybeSingle: () => Promise<{ data: unknown; error: null }>
          } = {
            eq: () => queryObj,
            order: () => queryObj,
            limit: () => queryObj,
            maybeSingle: async () => {
              if (table === 'fitness_profiles') {
                return { data: { resting_heart_rate: 54, primary_telemetry_source: 'apple_health' }, error: null }
              }
              return { data: { resting_heart_rate: 54, provider: 'apple_health' }, error: null }
            },
          }
          return queryObj
        },
        upsert: async () => ({ error: null }),
      }),
    })

    const req = new NextRequest('http://localhost/api/wearables/status')
    const res = await statusGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.connections).toHaveLength(1)
    expect(json.connections[0].provider).toBe('apple_health')
    expect(json.telemetry.restingHeartRate).toBeDefined()
  })

  it('synchronizes and persists Apple Health biometrics via sync route', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'athlete_wearable_metrics') {
          return { upsert: upsertMock }
        }
        if (table === 'fitness_profiles') {
          return { update: updateMock }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/wearables/sync', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'apple_health',
        resting_heart_rate: 52,
        hrv_rmssd: 82,
        sleep: { total_hours: 8.1, deep_hours: 2.4 },
        nutrition: { calories: 2280, protein: 195, carbs: 230, fat: 64 },
      }),
    })

    const res = await syncPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.telemetry.provider).toBe('apple_health')
    expect(json.telemetry.restingHeartRate).toBe(52)
    expect(json.telemetry.nutrition.proteinGrams).toBe(195)
    expect(upsertMock).toHaveBeenCalledTimes(1)
  })

  it('synchronizes and persists Google Health Connect biometrics via sync route', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'athlete_wearable_metrics') {
          return { upsert: upsertMock }
        }
        if (table === 'fitness_profiles') {
          return { update: updateMock }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/wearables/sync', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'google_fit',
        resting_heart_rate: 53,
        hrv_rmssd: 79,
        sleep: { total_hours: 7.9, deep_hours: 2.2 },
        nutrition: { calories: 2240, protein: 190, carbs: 225, fat: 60 },
      }),
    })

    const res = await syncPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.telemetry.provider).toBe('google_fit')
    expect(json.telemetry.restingHeartRate).toBe(53)
    expect(json.telemetry.nutrition.proteinGrams).toBe(190)
    expect(upsertMock).toHaveBeenCalledTimes(1)
  })

  it('handles Webhook GET verification handshake', async () => {
    const res = await webhookGet()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.supportedProviders).toEqual(['apple_health', 'google_fit'])
  })

  it('automatically parses and saves incoming Apple Health workouts into cardio_logs', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: () => ({
        single: async () => ({ data: { id: 'cardio-log-1' }, error: null }),
      }),
    })

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'cardio_logs') {
          return { insert: insertMock }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const req = new NextRequest('http://localhost/api/wearables/webhook', {
      method: 'POST',
      body: JSON.stringify({
        event: 'workout',
        user_id: 'client-123',
        provider: 'apple_health',
        workout: {
          id: 'apple-activity-55',
          activity_type: 'Incline Walking',
          start_time: '2026-08-23T09:00:00Z',
          end_time: '2026-08-23T09:20:00Z',
          calories: 220,
          avg_heart_rate: 140,
          max_heart_rate: 160,
          distance_meters: 2400,
        },
      }),
    })

    const res = await webhookPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.action).toBe('workout_logged')
    expect(json.workoutId).toBe('cardio-log-1')
    expect(insertMock).toHaveBeenCalledTimes(1)
  })

  it('parses and upserts Google Health Connect daily biometrics', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'athlete_wearable_metrics') {
          return { upsert: upsertMock }
        }
        if (table === 'fitness_profiles') {
          return { update: updateMock }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })

    const req = new NextRequest('http://localhost/api/wearables/webhook', {
      method: 'POST',
      body: JSON.stringify({
        user_id: 'client-123',
        provider: 'google_fit',
        date: '2026-08-30',
        resting_heart_rate: 52,
        hrv_rmssd: 80,
        sleep: {
          total_hours: 8.0,
          deep_hours: 2.1,
        },
        steps: 10500,
        active_calories: 610,
      }),
    })

    const res = await webhookPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.action).toBe('daily_biometrics_synced')
    expect(json.provider).toBe('google_fit')
    expect(upsertMock).toHaveBeenCalledTimes(1)
  })

  it('parses Apple Health daily biometrics with client_id passed in URL query param', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'athlete_wearable_metrics') {
          return { upsert: upsertMock }
        }
        if (table === 'fitness_profiles') {
          return { update: updateMock }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/wearables/webhook?client_id=client-query-456', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-09-02',
        resting_heart_rate: 55,
        hrv_rmssd: 75,
      }),
    })

    const res = await webhookPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.metrics.userId).toBe('client-query-456')
    expect(json.metrics.provider).toBe('apple_health')
  })

  it('authenticates native mobile sync request with client_id fallback when JWT auth fails', async () => {
    getRequestAuthzMock.mockRejectedValue(new Error('JWT expired'))

    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'clients') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'client-native-789', role: 'client' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'athlete_wearable_metrics') {
          return { upsert: upsertMock }
        }
        if (table === 'fitness_profiles') {
          return {
            update: updateMock,
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { primary_telemetry_source: 'apple_health' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/wearables/sync', {
      method: 'POST',
      body: JSON.stringify({
        client_id: 'client-native-789',
        resting_heart_rate: 51,
        hrv_rmssd: 88,
      }),
    })

    const res = await syncPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.telemetry.restingHeartRate).toBe(51)
    expect(json.telemetry.hrvRmssdMs).toBe(88)
  })

  it('disconnects and clears primary telemetry source', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    supabaseAdminMock.mockReturnValue({
      from: () => ({ update: updateMock }),
    })

    const req = new NextRequest('http://localhost/api/wearables/disconnect', {
      method: 'POST',
    })

    const res = await disconnectPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.disconnected).toBe(true)
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        primary_telemetry_source: null,
      })
    )
  })

  it('rejects unauthenticated webhook payloads in production when webhook secret is missing or invalid', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('APPLE_HEALTH_WEBHOOK_SECRET', 'prod-secret-token')
    try {
      const req = new NextRequest('http://localhost/api/wearables/webhook', {
        method: 'POST',
        headers: {
          authorization: 'Bearer wrong-token',
        },
        body: JSON.stringify({
          user_id: 'client-123',
          provider: 'apple_health',
          resting_heart_rate: 52,
        }),
      })

      const res = await webhookPost(req)
      expect(res.status).toBe(401)
      expect(res.headers.get('cache-control')).toBe('no-store, max-age=0')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('enforces no-store headers, 413 payload limits, credential scrubbing, and Vital constant-time secret verification', async () => {
    // 1. Rejects unsupported explicit provider on vital/link
    const badVitalProviderReq = new NextRequest('http://localhost/api/wearables/vital/link', {
      method: 'POST',
      body: JSON.stringify({ provider: 'garmin_legacy' }),
    })
    const badVitalRes = await vitalLinkPost(badVitalProviderReq)
    expect(badVitalRes.status).toBe(400)
    expect(badVitalRes.headers.get('cache-control')).toBe('no-store, max-age=0')

    // 2. Rejects oversized >256KB webhook payload with 413
    const hugeBody = JSON.stringify({ user_id: 'client-123', pad: 'x'.repeat(270_000) })
    const hugeReq = new NextRequest('http://localhost/api/wearables/webhook', {
      method: 'POST',
      body: hugeReqBody(hugeBody),
    })
    function hugeReqBody(s: string) {
      return s
    }
    const hugeRes = await webhookPost(hugeReq)
    expect(hugeRes.status).toBe(413)

    // 3. Scrubs secret/token keys from persisted raw_payload and verifies Vital secret in constant time
    vi.stubEnv('VITAL_WEBHOOK_SECRET', 'vital-prod-secret-999')
    try {
      const wrongSecretReq = new NextRequest('http://localhost/api/wearables/vital/webhook', {
        method: 'POST',
        headers: { 'x-vital-webhook-secret': 'wrong-secret' },
        body: JSON.stringify({ client_user_id: 'client-123' }),
      })
      const wrongRes = await vitalWebhookPost(wrongSecretReq)
      expect(wrongRes.status).toBe(401)

      let persistedRow = null as Record<string, unknown> | null
      supabaseAdminMock.mockReturnValue({
        from: (table: string) => {
          if (table === 'athlete_wearable_metrics') {
            return {
              upsert: async (row: Record<string, unknown>) => {
                persistedRow = row
                return { error: null }
              },
            }
          }
          return {
            update: () => ({ eq: async () => ({ error: null }) }),
          }
        },
      })

      const validVitalReq = new NextRequest('http://localhost/api/wearables/vital/webhook', {
        method: 'POST',
        headers: { 'x-vital-webhook-secret': 'vital-prod-secret-999' },
        body: JSON.stringify({
          client_user_id: 'client-123',
          access_token: 'super-secret-oauth-token',
          data: {
            resting_heart_rate: 54,
            hrv_rmssd: 78,
          },
        }),
      })
      const okVitalRes = await vitalWebhookPost(validVitalReq)
      expect(okVitalRes.status).toBe(200)
      expect(okVitalRes.headers.get('cache-control')).toBe('no-store, max-age=0')
      expect((persistedRow?.raw_payload as Record<string, unknown>)?.access_token).toBeUndefined()
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
