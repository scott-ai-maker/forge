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

import { GET, POST, DELETE } from '@/app/api/coach/workout-plans/route'
import { AuthzError } from '@/lib/authz'

const coachUser = { user: { id: 'coach-123' }, client: { role: 'coach' } }
const clientId = 'client-456'

describe('/api/coach/workout-plans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
  })

  describe('GET', () => {
    it('rejects unauthorized requests with 401', async () => {
      getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
      const req = new NextRequest('http://localhost:3000/api/coach/workout-plans?clientId=client-456')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when clientId parameter is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/coach/workout-plans')
      const res = await GET(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('clientId query parameter is required')
    })

    it('retrieves all workout plans for client', async () => {
      const mockPlans = [
        { id: 'plan-1', name: 'Phase 3 Hypertrophy', nasm_opt_phase: 3 },
        { id: 'plan-2', name: 'Phase 1 Stabilization', nasm_opt_phase: 1 },
      ]

      supabaseAdminMock.mockReturnValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: mockPlans, error: null }),
              }),
            }),
          }),
        }),
      })

      const req = new NextRequest('http://localhost:3000/api/coach/workout-plans?clientId=client-456')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.plans).toHaveLength(2)
    })
  })

  describe('POST', () => {
    it('creates a new workout plan when overwrite is false', async () => {
      let insertPayload: Record<string, unknown> | null = null

      supabaseAdminMock.mockReturnValue({
        from: (table: string) => {
          if (table === 'fitness_profiles') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { weight_kg: 80, height_cm: 180, age: 35, sex: 'male', activity_level: 'moderately_active' },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'body_composition_analyses') {
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
          }
          if (table === 'workout_plans') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({ data: [], error: null }),
                  }),
                }),
              }),
              insert: (payload: Record<string, unknown>) => {
                insertPayload = payload
                return {
                  select: () => ({
                    single: async () => ({ data: { id: 'plan-new', ...payload }, error: null }),
                  }),
                }
              },
            }
          }
          if (table === 'coach_client_messages') {
            return {
              insert: async () => ({ error: null }),
            }
          }
          if (table === 'exercise_library_entries' || table === 'equipment_library_entries') {
            const queryBuilder: any = {
              eq: () => queryBuilder,
              in: () => queryBuilder,
              limit: async () => ({ data: [], error: null }),
              then: (resolve: (val: any) => void) => Promise.resolve({ data: [], error: null }).then(resolve),
            }
            return {
              select: () => queryBuilder,
            }
          }
          return {}
        },
      })

      const req = new NextRequest('http://localhost:3000/api/coach/workout-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name: 'Hypertrophy Block A',
          goal: 'hypertrophy',
          nasmOptPhase: 3,
          phaseName: 'Muscular Development',
          sessionsPerWeek: 4,
          estimatedDurationMins: 55,
          workouts: [
            {
              day: 1,
              focus: 'Chest & Back',
              notes: 'Warmup -> Resistance',
              exercises: [{ name: 'Barbell Bench Press', sets: '3', reps: '10' }],
            },
          ],
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.isOverwritten).toBe(false)
      expect(insertPayload).toBeDefined()
      expect(data.plan.plan_json.nutritionTargets.targetCalories).toBeGreaterThan(0)
    })

    it('overwrites existing active workout plan in place when overwrite is true', async () => {
      let updatedPayload: Record<string, unknown> | null = null

      supabaseAdminMock.mockReturnValue({
        from: (table: string) => {
          if (table === 'fitness_profiles') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { weight_kg: 80, height_cm: 180, age: 35, sex: 'male', activity_level: 'moderately_active' },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'body_composition_analyses') {
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
          }
          if (table === 'workout_plans') {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [{ id: 'plan-active-1', name: 'Old Plan' }],
                      error: null,
                    }),
                  }),
                }),
              }),
              update: (payload: Record<string, unknown>) => {
                updatedPayload = payload
                return {
                  eq: () => ({
                    eq: () => ({
                      select: () => ({
                        single: async () => ({ data: { id: 'plan-active-1', ...payload }, error: null }),
                      }),
                    }),
                  }),
                }
              },
            }
          }
          if (table === 'coach_client_messages') {
            return {
              insert: async () => ({ error: null }),
            }
          }
          if (table === 'exercise_library_entries' || table === 'equipment_library_entries') {
            const queryBuilder: any = {
              eq: () => queryBuilder,
              in: () => queryBuilder,
              limit: async () => ({ data: [], error: null }),
              then: (resolve: (val: any) => void) => Promise.resolve({ data: [], error: null }).then(resolve),
            }
            return {
              select: () => queryBuilder,
            }
          }
          return {}
        },
      })

      const req = new NextRequest('http://localhost:3000/api/coach/workout-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name: 'New Safe Knee-Adapted Mesocycle',
          goal: 'hypertrophy',
          nasmOptPhase: 3,
          phaseName: 'Muscular Development',
          sessionsPerWeek: 4,
          estimatedDurationMins: 55,
          overwrite: true,
          targetPlanId: 'plan-active-1',
          workouts: [
            {
              day: 1,
              focus: 'Legs / Spanish Squats',
              exercises: [{ name: 'Spanish Squats', sets: '3', reps: '12' }],
            },
          ],
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.isOverwritten).toBe(true)
      expect(updatedPayload).toBeDefined()
    })
  })

  describe('DELETE', () => {
    it('deletes specific workout plan by id', async () => {
      let deletedPlanId: string | null = null

      supabaseAdminMock.mockReturnValue({
        from: () => ({
          delete: () => ({
            eq: (col1: string, val1: string) => ({
              eq: (_col2: string, _val2: string) => {
                if (col1 === 'id') deletedPlanId = val1
                return Promise.resolve({ error: null })
              },
            }),
          }),
        }),
      })

      const req = new NextRequest('http://localhost:3000/api/coach/workout-plans?id=plan-to-remove&clientId=client-456', {
        method: 'DELETE',
      })

      const res = await DELETE(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(deletedPlanId).toBe('plan-to-remove')
    })
  })
})
