import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireCoachAssignedClientMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
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

import { POST } from '@/app/api/coach/clients/[id]/travel-recalibrate/route'
import { AuthzError } from '@/lib/authz'

const coachUser = { user: { id: 'coach-1' }, client: { role: 'coach' } }

function makeAdmin(existingPlan: Record<string, unknown> | null) {
  return {
    from(table: string) {
      if (table === 'workout_plans') {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      limit() {
                        return {
                          maybeSingle: async () => ({ data: existingPlan, error: null }),
                        }
                      },
                    }
                  },
                }
              },
            }
          },
          insert(row: Record<string, unknown>) {
            return {
              select() {
                return {
                  single: async () => ({ data: { id: 'new-plan-1', ...row }, error: null }),
                }
              },
            }
          },
        }
      }
      if (table === 'coach_client_messages' || table === 'client_lifecycle_events') {
        return {
          insert: async () => ({ data: null, error: null }),
        }
      }
      return {}
    },
  }
}

describe('POST /api/coach/clients/[id]/travel-recalibrate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthorized users', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/travel-recalibrate', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'hotel_dumbbells_only' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(401)
  })

  it('rejects invalid travel scenarios', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/travel-recalibrate', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'invalid_scenario' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(400)
  })

  it('recalibrates active workout plan for hotel dumbbells and notifies athlete', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)

    const existingPlan = {
      id: 'old-plan-1',
      user_id: 'c-1',
      name: 'Phase 2 Strength Protocol',
      goal: 'hypertrophy',
      nasm_opt_phase: 2,
      phase_name: 'Strength Endurance',
      sessions_per_week: 4,
      plan_json: {
        workouts: [
          {
            day: 1,
            focus: 'Lower Body',
            exercises: [{ name: 'Barbell Back Squat', sets: 4, reps: '8-10' }],
          },
        ],
      },
    }

    supabaseAdminMock.mockReturnValue(makeAdmin(existingPlan))

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/travel-recalibrate', {
      method: 'POST',
      body: JSON.stringify({
        scenario: 'hotel_dumbbells_only',
        customNotes: 'Focus on 4-second descents with hotel dumbbells!',
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.plan.name).toContain('[Travel: Hotel Dumbbell Gym]')
    expect(json.plan.plan_json.workouts[0].exercises[0].name).toContain('DB Goblet Squat')
  })
})

