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

import { POST } from '@/app/api/coach/clients/[id]/periodization/auto-triage/route'
import { AuthzError } from '@/lib/authz'

const coachUser = { user: { id: 'coach-123' }, client: { role: 'coach' } }
const clientId = 'client-456'

describe('/api/coach/clients/[id]/periodization/auto-triage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue(coachUser)
  })

  it('rejects unauthorized unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/periodization/auto-triage', {
      method: 'POST',
      body: JSON.stringify({ action: 'insert_deload' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(401)
  })

  it('executes 1-click deload insertion and persists to workout plan', async () => {
    const mockStoredPlan = generate12WeekMacrocycle(2, 'Power Development')
    let updatedPayload: Record<string, unknown> | null = null
    let messagePayload: Record<string, unknown> | null = null

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
                    maybeSingle: async () => ({
                      data: {
                        id: 'plan-1',
                        plan_json: { periodizationPlan: mockStoredPlan },
                      },
                      error: null,
                    }),
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
            update: (payload: Record<string, unknown>) => ({
              eq: async () => {
                updatedPayload = payload
                return { error: null }
              },
            }),
          }
        }
        if (table === 'coach_client_messages' || table === 'messages') {
          return {
            insert: async (msg: Record<string, unknown>) => {
              messagePayload = msg
              return { error: null }
            },
          }
        }
        return {}
      },
    })

    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/periodization/auto-triage', {
      method: 'POST',
      body: JSON.stringify({ action: 'insert_deload', reason: 'ACWR Spike 1.58' }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect((updatedPayload as unknown as { plan_json: { periodizationPlan: unknown } })?.plan_json?.periodizationPlan).toBeDefined()
    expect((messagePayload as unknown as { client_id?: string; recipient_id?: string })?.client_id || (messagePayload as unknown as { client_id?: string; recipient_id?: string })?.recipient_id).toBe(clientId)
    expect((messagePayload as unknown as { message_body?: string; content?: string })?.message_body || (messagePayload as unknown as { message_body?: string; content?: string })?.content).toContain('Periodization Auto-Triage: Plan Calibrated')
  })
})
