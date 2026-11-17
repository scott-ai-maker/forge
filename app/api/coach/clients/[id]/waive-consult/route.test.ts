import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { getRequestAuthz, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: vi.fn(),
    requireCoachAssignedClient: vi.fn(),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(),
}))

const coachUser = { user: { id: 'coach-1' }, client: { role: 'coach' } }

describe('POST /api/coach/clients/[id]/waive-consult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    vi.mocked(getRequestAuthz).mockRejectedValue(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/waive-consult', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(401)
  })

  it('inserts waiver session and returns success', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue(coachUser as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'sessions') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'session-waived-99' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'coach_client_messages') {
          return {
            insert: vi.fn().mockResolvedValue({}),
          }
        }
        return {}
      }),
    }

    vi.mocked(supabaseAdmin).mockReturnValue(mockAdmin as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/waive-consult', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.sessionId).toBe('session-waived-99')
  })

  it('blocks consultation waiver with 409 when athlete has PAR-Q+ medical or orthopedic flags', async () => {
    vi.mocked(getRequestAuthz).mockResolvedValue(coachUser as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const insertSessionMock = vi.fn()
    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    parq_any_yes: true,
                    parq_answers: { experiencesChestPain: true },
                    medical_conditions: null,
                    surgeries_or_injuries: null,
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'sessions') {
          return { insert: insertSessionMock }
        }
        return {}
      }),
    }

    vi.mocked(supabaseAdmin).mockReturnValue(mockAdmin as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/waive-consult', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(409)
    expect(insertSessionMock).not.toHaveBeenCalled()
  })
})
