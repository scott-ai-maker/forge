import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'

const storedEvents = new Map<string, Record<string, unknown>>()
const storedSnapshots = new Map<string, Record<string, unknown>>()

const mockGetRequestAuthz = vi.fn()

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: (...args: unknown[]) => mockGetRequestAuthz(...args),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'client_telemetry_events') {
        return {
          select: () => ({
            in: async (_col: string, ids: string[]) => ({
              data: ids
                .filter(id => storedEvents.has(id))
                .map(id => ({ event_id: id })),
              error: null,
            }),
            eq: (_col1: string, val1: string) => ({
              eq: (_col2: string, val2: string) => ({
                maybeSingle: async () => {
                  const row = storedEvents.get(val1)
                  if (row && row.user_id === val2) {
                    return { data: row, error: null }
                  }
                  return { data: null, error: null }
                },
              }),
            }),
          }),
          upsert: async (rows: Array<Record<string, unknown>>) => {
            for (const row of rows) {
              const id = String(row.event_id)
              if (!storedEvents.has(id)) {
                storedEvents.set(id, row)
              }
            }
            return { error: null }
          },
        }
      }

      if (table === 'client_telemetry_snapshots') {
        return {
          select: () => ({
            eq: (_col: string, userId: string) => ({
              maybeSingle: async () => ({
                data: storedSnapshots.get(userId) ?? null,
                error: null,
              }),
            }),
          }),
          upsert: async (row: Record<string, unknown>) => {
            storedSnapshots.set(String(row.user_id), row)
            return { error: null }
          },
        }
      }

      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }
    },
  }),
}))

import { GET, POST } from './route'
import { __resetServerTelemetryFallbackForTests } from '@/lib/telemetry-storage'

describe('/api/telemetry route', () => {
  beforeEach(() => {
    storedEvents.clear()
    storedSnapshots.clear()
    __resetServerTelemetryFallbackForTests()
    mockGetRequestAuthz.mockReset()
    mockGetRequestAuthz.mockResolvedValue({
      user: { id: 'athlete-uuid-001', email: 'athlete@forge-athletic.app' },
      client: { id: 'athlete-uuid-001', role: 'client', designated_coach_id: 'coach-gordon' },
    })
  })

  it('rejects unauthenticated telemetry POST requests with 401', async () => {
    mockGetRequestAuthz.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost:3000/api/telemetry', {
      method: 'POST',
      body: JSON.stringify({ events: [] }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('enforces idempotent event_id deduplication (ON CONFLICT DO NOTHING) and updates Coach Portal snapshot', async () => {
    const eventId1 = '550e8400-e29b-41d4-a716-446655440001'
    const eventId2 = '550e8400-e29b-41d4-a716-446655440002'

    const batchPayload = {
      events: [
        {
          event_id: eventId1,
          event_type: 'readiness_check_completed',
          user_id: 'spoofed-other-user',
          session_id: 'sess-ios-1',
          client_timestamp: '2026-11-13T08:15:00.000-05:00',
          timezone_offset_mins: -300,
          platform: 'ios_app',
          app_version: '1.53.1',
          network_type: 'wifi',
          cv_capability: { webgl2: true, avg_camera_fps: 30 },
          payload: {
            readiness_index: 91,
            movement_type: 'overhead_squat',
            peak_rom_deltas: {},
            restriction_flags: [],
            injected_warmup_drills: [{ id: 'd1', title: 'Thoracic Opener', duration_sec: 45 }],
          },
        },
        {
          event_id: eventId2,
          event_type: 'joint_comfort_logged',
          session_id: 'sess-ios-1',
          client_timestamp: '2026-11-13T08:16:00.000-05:00',
          timezone_offset_mins: -300,
          platform: 'ios_app',
          app_version: '1.53.1',
          payload: {
            comfort_score: 88,
            comfort_label: 'Fluid',
          },
        },
      ],
    }

    const req1 = new NextRequest('http://localhost:3000/api/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-ios-token',
      },
      body: JSON.stringify(batchPayload),
    })

    const res1 = await POST(req1)
    const json1 = await res1.json()
    expect(res1.status).toBe(200)
    expect(json1.inserted).toBe(2)
    expect(json1.deduplicatedCount).toBe(0)

    // Verify server stamped `authz.user.id` rather than trusting client-supplied `user_id`
    expect(storedEvents.get(eventId1)?.user_id).toBe('athlete-uuid-001')

    // Replay the exact same batch (simulating network retry after dropped mobile response)
    const req2 = new NextRequest('http://localhost:3000/api/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-ios-token',
      },
      body: JSON.stringify(batchPayload),
    })

    const res2 = await POST(req2)
    const json2 = await res2.json()
    expect(res2.status).toBe(200)
    expect(json2.inserted).toBe(0)
    expect(json2.deduplicatedCount).toBe(2)

    // Snapshot has exact single Joint Comfort sparkline entry and Readiness Score 91
    const snap = storedSnapshots.get('athlete-uuid-001')
    expect(snap?.latest_readiness_score).toBe(91)
    expect((snap?.joint_comfort_history as unknown[]).length).toBe(1)
  })

  it('verifies round-trip diagnostic ping via GET /api/telemetry?verifyEventId=<uuid> and returns launch rehydration state', async () => {
    const pingEventId = '550e8400-e29b-41d4-a716-446655440099'

    await POST(
      new NextRequest('http://localhost:3000/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            {
              event_id: pingEventId,
              event_type: 'client_runtime_diagnostic',
              session_id: 'sess-playstore-twa',
              client_timestamp: '2026-11-13T10:00:00.000-05:00',
              timezone_offset_mins: -300,
              platform: 'android_app',
              app_version: '1.53.1',
              payload: {
                diagnostic_kind: 'diagnostic_ping',
                ping_tag: 'weekend-store-launch',
              },
            },
          ],
        }),
      })
    )

    const verifyRes = await GET(
      new NextRequest(`http://localhost:3000/api/telemetry?verifyEventId=${pingEventId}`)
    )
    const verifyJson = await verifyRes.json()
    expect(verifyRes.status).toBe(200)
    expect(verifyJson.verified).toBe(true)
    expect(verifyJson.eventId).toBe(pingEventId)

    const rehydrateRes = await GET(new NextRequest('http://localhost:3000/api/telemetry'))
    const rehydrateJson = await rehydrateRes.json()
    expect(rehydrateRes.status).toBe(200)
    expect(rehydrateJson.ok).toBe(true)
    expect(rehydrateJson.rehydration.snapshot.lastPlatform).toBe('android_app')
  })
})
