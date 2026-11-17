import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getRequestAuthzMock,
  requireCoachAssignedClientMock,
  supabaseAdminMock,
  enforceRateLimitMock,
  notifyUserMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  notifyUserMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireCoachAssignedClient: requireCoachAssignedClientMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: enforceRateLimitMock,
}))

vi.mock('@/lib/notifications', () => ({
  notifyUser: notifyUserMock,
}))

import { POST } from './route'

describe('POST /api/coach/clients/[id]/live-session-start (Phase 0 Hold & ERAP Readiness)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1', email: 'coach@forge-athletic.app' },
      client: { role: 'coach' },
    })
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    enforceRateLimitMock.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 })
    notifyUserMock.mockResolvedValue({ channels: ['push'] })
  })

  it('blocks live session start with 409 when client has an uncleared PAR-Q+ cardiac/syncope hold', async () => {
    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    parq_any_yes: true,
                    parq_answers: { experiencesChestPain: true },
                    emergency_contact_name: 'Jane Doe',
                    emergency_contact_phone: '617-555-0199',
                  },
                }),
              }),
            }),
          }
        }
        if (table === 'coach_onboarding_gates') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null }),
                }),
              }),
            }),
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/coach/clients/client-1/live-session-start', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'client-1' }) })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('MEDICAL_CLEARANCE_HOLD')
    expect(notifyUserMock).not.toHaveBeenCalled()
  })

  it('dispatches 1:1 live invite and surfaces erapWarning when athlete has not yet entered 10-digit local dispatch', async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    parq_any_yes: false,
                    parq_answers: { hasHeartCondition: false, localEmergencyDispatchPhone: '911' },
                    emergency_contact_name: 'Jane Doe',
                    emergency_contact_phone: '617-555-0199',
                  },
                }),
              }),
            }),
          }
        }
        if (table === 'clients') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { full_name: 'Alex Mercer', email: 'alex@example.com' },
                }),
              }),
            }),
          }
        }
        if (table === 'coach_client_messages') {
          return { insert: insertSpy }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost/api/coach/clients/client-1/live-session-start', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'client-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.erapComplete).toBe(false)
    expect(body.erapWarning).toContain('10-digit local dispatch')
    expect(insertSpy).toHaveBeenCalledTimes(1)
  })
})
