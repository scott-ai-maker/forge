import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generate12WeekMacrocycle } from '@/lib/periodization-roadmap'

const { getRequestAuthzMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET, POST } from '@/app/api/coach/clients/[id]/periodization/route'
import { AuthzError } from '@/lib/authz'

const coachUser = { user: { id: 'coach-123' }, client: { role: 'coach' } }
const clientId = 'client-456'

describe('/api/coach/clients/[id]/periodization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue(coachUser)
  })

  it('rejects unauthorized unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/periodization')
    const res = await GET(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(401)
  })

  it('rejects coaches not assigned to the client with 403', async () => {
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { id: clientId, designated_coach_id: 'other-coach' },
              error: null,
            }),
          }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/periodization')
    const res = await GET(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(403)
  })

  it('returns stored periodization plan when available', async () => {
    const mockStoredPlan = generate12WeekMacrocycle(3, 'Muscle Hypertrophy')

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'clients') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: clientId, designated_coach_id: 'coach-123' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'workout_plans') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    single: async () => ({
                      data: {
                        id: 'plan-1',
                        plan_json: { periodizationPlan: mockStoredPlan },
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/periodization')
    const res = await GET(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.source).toBe('stored')
    expect(json.plan.currentWeek).toBe(3)
  })

  it('saves coach modulated periodization plan and returns updated plan', async () => {
    const planToSave = generate12WeekMacrocycle(4, 'Strength & Power')
    let updatedPayload: Record<string, unknown> | null = null

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'clients') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: clientId, designated_coach_id: 'coach-123' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'workout_plans') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    single: async () => ({
                      data: { id: 'plan-1', plan_json: {} },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: (payload: Record<string, unknown>) => ({
              eq: async () => {
                updatedPayload = payload
                return { error: null }
              },
            }),
          }
        }
        if (table === 'messages') {
          return {
            insert: async () => ({ error: null }),
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/periodization', {
      method: 'POST',
      body: JSON.stringify({
        plan: planToSave,
        dispatchMessage: true,
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.plan.coachCalibratedAt).toBeDefined()
    expect((updatedPayload as unknown as { plan_json: { periodizationPlan: unknown } })?.plan_json?.periodizationPlan).toBeDefined()
  })
})
