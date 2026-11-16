import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getRequestAuthzMock,
  requireRoleMock,
  requireCoachAssignedClientMock,
  supabaseAdminMock,
  enforceRateLimitMock,
  getTeamByIdMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  getTeamByIdMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireRole: requireRoleMock,
    requireCoachAssignedClient: requireCoachAssignedClientMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: enforceRateLimitMock,
}))

vi.mock('@/lib/teams', () => ({
  getTeamById: getTeamByIdMock,
}))

vi.mock('@/lib/notifications', () => ({
  notifyUser: vi.fn().mockResolvedValue({ channels: [] }),
}))

import { POST, GET } from './route'
import { dispatchTeamLiveSessionAlert } from '@/lib/teams-server'
import { AuthzError } from '@/lib/authz'

describe('/api/coach/clients/[id]/live-session & Team Live Ownership Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1', email: 'coach@forge.app' },
      client: { role: 'coach' },
    })
    requireRoleMock.mockReturnValue(undefined)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    enforceRateLimitMock.mockResolvedValue({ allowed: true, remaining: 119, resetAt: Date.now() + 60_000 })
  })

  it('preserves null optional numeric fields instead of coercing Number(null) to 0 and strips <script> tags', async () => {
    let insertedPayload: Record<string, unknown> | null = null
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        insert: (row: Record<string, unknown>) => {
          insertedPayload = row
          return {
            select: () => ({
              single: async () => ({ data: { id: 'set-1', ...row }, error: null }),
            }),
          }
        },
      }),
    })

    const req = new NextRequest('http://localhost/api/coach/clients/client-1/live-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_name: 'Barbell Back Squat <script>evil()</script>',
        reps: 8,
        session_date: '2026-11-15',
        set_number: null,
        weight_kg: null,
        rest_seconds: null,
        rpe: null,
        rir: null,
        notes: 'Clean depth <script>alert(1)</script>',
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-1' }) })
    expect(res.status).toBe(201)
    expect(res.headers.get('cache-control')).toContain('no-store')
    expect(insertedPayload).toMatchObject({
      user_id: 'client-1',
      exercise_name: 'Barbell Back Squat',
      reps: 8,
      set_number: null,
      weight_kg: null,
      rest_seconds: null,
      rpe: null,
      rir: null,
      notes: 'Clean depth',
    })
  })

  it('rejects impossible calendar dates and out-of-range RPE/reps with 400', async () => {
    const badDateReq = new NextRequest('http://localhost/api/coach/clients/client-1/live-session', {
      method: 'POST',
      body: JSON.stringify({
        exercise_name: 'Deadlift',
        reps: 5,
        session_date: '2026-02-30',
      }),
    })
    const badDateRes = await POST(badDateReq, { params: Promise.resolve({ id: 'client-1' }) })
    expect(badDateRes.status).toBe(400)

    const badRpeReq = new NextRequest('http://localhost/api/coach/clients/client-1/live-session', {
      method: 'POST',
      body: JSON.stringify({
        exercise_name: 'Deadlift',
        reps: 5,
        session_date: '2026-11-15',
        rpe: 14,
      }),
    })
    const badRpeRes = await POST(badRpeReq, { params: Promise.resolve({ id: 'client-1' }) })
    expect(badRpeRes.status).toBe(400)
  })

  it('enforces rate limiting (429) on rapid live set logging', async () => {
    enforceRateLimitMock.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 30_000 })

    const req = new NextRequest('http://localhost/api/coach/clients/client-1/live-session', {
      method: 'POST',
      body: JSON.stringify({ exercise_name: 'Bench Press', reps: 5 }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'client-1' }) })
    expect(res.status).toBe(429)
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('returns Cache-Control: no-store on GET live-session sets & plan', async () => {
    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'workout_set_logs') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: async () => ({ data: [{ id: 's1', exercise_name: 'Squat', reps: 5 }], error: null }),
                }),
              }),
            }),
          }
        }
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: { id: 'p1', name: 'Phase 2', plan_json: {} }, error: null }),
                }),
              }),
            }),
          }),
        }
      },
    })

    const req = new NextRequest('http://localhost/api/coach/clients/client-1/live-session')
    const res = await GET(req, { params: Promise.resolve({ id: 'client-1' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('blocks non-owning coaches from dispatching live session alerts to another coach team (403 AuthzError)', async () => {
    getTeamByIdMock.mockResolvedValueOnce({
      id: 'team-alpha',
      name: 'Alpha Squad',
      coachId: 'coach-owner-999',
      members: [{ clientId: 'athlete-1', fullName: 'Athlete One' }],
    })

    await expect(
      dispatchTeamLiveSessionAlert('team-alpha', 'intruder-coach-2', 'intruder@forge.app')
    ).rejects.toMatchObject({
      status: 403,
    } satisfies Partial<AuthzError>)
  })
})
