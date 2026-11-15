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

function makeAdmin(
  existingPlan: Record<string, unknown> | null,
  capturedMessages: Record<string, unknown>[] = []
) {
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
      if (table === 'coach_client_messages') {
        return {
          insert: async (payload: Record<string, unknown>) => {
            capturedMessages.push(payload)
            return { data: null, error: null }
          },
        }
      }
      if (table === 'client_lifecycle_events') {
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

  it('rejects unauthorized users with 401 and Cache-Control: no-store', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/travel-recalibrate', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'hotel_dumbbells_only' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(401)
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })

  it('enforces HIPAA assigned-coach check and rejects unassigned coaches with 403', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockRejectedValue(
      new AuthzError('Forbidden: Coach is not assigned to this client', 403)
    )

    const req = new NextRequest('http://localhost/api/coach/clients/c-unassigned/travel-recalibrate', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'hotel_dumbbells_only' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-unassigned' }) })
    expect(res.status).toBe(403)
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })

  it('rejects invalid or prototype-polluted travel scenarios with 400', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/travel-recalibrate', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'toString' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(400)
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })

  it('returns 404 when client has no active workout plan to recalibrate', async () => {
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    supabaseAdminMock.mockReturnValue(makeAdmin(null))

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/travel-recalibrate', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'hotel_dumbbells_only' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })

  it('recalibrates active workout plan, sanitizes coach notes (strips HTML + caps at 500 chars), and supports commercial_full_gym restoration', async () => {
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
            exercises: [{ name: 'Barbell Back Squat', sets: 4, reps: '8-10', tempo: '3/1/1' }],
          },
        ],
      },
    }

    const capturedMessages: Record<string, unknown>[] = []
    supabaseAdminMock.mockReturnValue(makeAdmin(existingPlan, capturedMessages))

    const rawUnsafeNote =
      `<script>alert("xss")</script>Focus on 4-second descents! ` + 'A'.repeat(600)

    const req = new NextRequest('http://localhost/api/coach/clients/c-1/travel-recalibrate', {
      method: 'POST',
      body: JSON.stringify({
        scenario: 'hotel_dumbbells_only',
        customNotes: rawUnsafeNote,
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'c-1' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('no-store')
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.plan.name).toContain('[Travel: Hotel Dumbbell Gym]')
    expect(json.plan.plan_json.workouts[0].exercises[0].name).toContain('DB Goblet Squat')
    expect(json.plan.plan_json.coachTravelNotes).not.toContain('<script>')
    expect(json.plan.plan_json.coachTravelNotes.length).toBeLessThanOrEqual(500)
    expect(String(capturedMessages[0]?.message_body || '')).not.toContain('<script>')

    // Now restore commercial_full_gym from the adapted plan
    supabaseAdminMock.mockReturnValue(makeAdmin(json.plan))
    const restoreReq = new NextRequest(
      'http://localhost/api/coach/clients/c-1/travel-recalibrate',
      {
        method: 'POST',
        body: JSON.stringify({ scenario: 'commercial_full_gym' }),
      }
    )
    const restoreRes = await POST(restoreReq, { params: Promise.resolve({ id: 'c-1' }) })
    expect(restoreRes.status).toBe(200)
    const restoreJson = await restoreRes.json()
    expect(restoreJson.plan.name).toBe('Phase 2 Strength Protocol')
    expect(restoreJson.plan.plan_json.isTravelAdapted).toBe(false)
    expect(restoreJson.plan.plan_json.workouts[0].exercises[0].name).toBe('Barbell Back Squat')
  })
})
