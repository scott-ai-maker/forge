import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { getRequestAuthz, requireCoachAssignedClient } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

vi.mock('@/lib/authz', () => ({
  getRequestAuthz: vi.fn(),
  requireCoachAssignedClient: vi.fn(),
  AuthzError: class AuthzError extends Error {
    status = 403
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/push-notifications', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(true),
}))

describe('Live Session Conclude API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unassigned coach requests', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    vi.mocked(requireCoachAssignedClient).mockRejectedValue(new Error('Forbidden'))

    const req = new NextRequest('http://localhost/api/coach/clients/client-456/live-session-conclude', {
      method: 'POST',
      body: JSON.stringify({ summaryMessage: 'Session finished.' }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(500)
  })

  it('validates summaryMessage presence', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/coach/clients/client-456/live-session-conclude', {
      method: 'POST',
      body: JSON.stringify({ summaryMessage: '' }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'summaryMessage is required.' })
  })

  it('completes session and inserts message', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'coach_client_messages') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'msg-999', created_at: '2026-08-23' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    lte: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'client_packages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'pkg-1', sessions_remaining: 3 }, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        return {}
      }),
    }

    vi.mocked(supabaseAdmin).mockReturnValue(mockAdmin as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/coach/clients/client-456/live-session-conclude', {
      method: 'POST',
      body: JSON.stringify({ summaryMessage: 'Session completed with 12,000 lbs tonnage.' }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.creditDeducted).toBe(true)
    expect(json.briefingId).toBe('msg-999')
  })

  it('completes session from structured wrapup payload without precomputed summaryMessage', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Jane Smith' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'coach_client_messages') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'msg-1001', created_at: '2026-09-03' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    lte: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'client_packages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'pkg-1', sessions_remaining: 2 }, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }
        }
        return {}
      }),
    }

    vi.mocked(supabaseAdmin).mockReturnValue(mockAdmin as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/coach/clients/client-456/live-session-conclude', {
      method: 'POST',
      body: JSON.stringify({
        optPhase: 'Phase 2: Strength Endurance',
        sessionDate: '2026-09-03',
        coachNotes: 'Flawless eccentric control.',
        recoveryDirective: 'Hydrate and sleep 8 hours.',
        deductCredit: true,
        sets: [
          { exercise_name: 'Back Squat', reps: 5, weight_kg: 100, is_warmup: false },
        ],
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.briefingId).toBe('msg-1001')
    expect(json.creditDeducted).toBe(true)
  })

  it('does NOT double-deduct package credit if scheduled session was already booked for today', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const updatePackageSpy = vi.fn()
    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'coach_client_messages') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'msg-999', created_at: '2026-08-23' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    lte: vi.fn().mockResolvedValue({ data: [{ id: 'sess-today', package_id: 'pkg-1' }], error: null }),
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    lte: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'client_packages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'pkg-1', sessions_remaining: 3 }, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: updatePackageSpy,
          }
        }
        return {}
      }),
    }

    vi.mocked(supabaseAdmin).mockReturnValue(mockAdmin as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/coach/clients/client-456/live-session-conclude', {
      method: 'POST',
      body: JSON.stringify({ summaryMessage: 'Live session completed with scheduled booking.' }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.creditDeducted).toBe(true)
    // Package update should NOT have been called because credit was already decremented at booking
    expect(updatePackageSpy).not.toHaveBeenCalled()
  })
})
