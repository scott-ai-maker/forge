import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as logSetPost, GET as logSetGet } from './log-set/route'
import { POST as logPost, GET as logGet } from './log/route'
import { getRequestAuthz } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

vi.mock('@/lib/authz', () => ({
  getRequestAuthz: vi.fn(),
  requireRole: vi.fn(),
  AuthzError: class AuthzError extends Error {
    status: number
    constructor(message: string, status = 403) {
      super(message)
      this.status = status
    }
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(),
}))

describe('Workout Logging API Routes', () => {
  const mockUser = { id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', email: 'athlete@example.com' }
  const mockClientAuthz = {
    user: mockUser,
    client: { role: 'client', id: 'client-1', is_active: true },
  }

  let mockInsert: ReturnType<typeof vi.fn>
  let mockSelect: ReturnType<typeof vi.fn>
  let mockSingle: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestAuthz).mockResolvedValue(mockClientAuthz as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'log-123', exercise_name: 'Barbell Back Squat', reps: 5, weight_kg: 100 },
      error: null,
    })
    mockSelect = vi.fn().mockReturnValue({
      single: mockSingle,
    })
    mockInsert = vi.fn().mockReturnValue({
      select: mockSelect,
    })

    const mockQuery: Record<string, unknown> = {}
    mockQuery.eq = vi.fn().mockReturnValue(mockQuery)
    mockQuery.order = vi.fn().mockReturnValue(mockQuery)
    mockQuery.limit = vi.fn().mockResolvedValue({
      data: [{ id: 'log-1', exercise_name: 'Bench Press', reps: 8 }],
      error: null,
    })
    mockQuery.then = (resolve: (value: unknown) => unknown) => (mockQuery.limit as () => Promise<unknown>)().then(resolve)

    vi.mocked(supabaseAdmin).mockReturnValue({
      from: vi.fn(() => ({
        insert: mockInsert,
        select: vi.fn(() => mockQuery),
      })),
    } as unknown as ReturnType<typeof supabaseAdmin>)
  })

  describe('POST /api/workouts/log-set', () => {
    it('successfully logs a set with a valid plan UUID', async () => {
      const req = new NextRequest('http://localhost/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify({
          workoutPlanId: '123e4567-e89b-12d3-a456-426614174000',
          sessionDate: '2026-09-01',
          exerciseName: 'Barbell Back Squat',
          setNumber: 1,
          reps: 5,
          weightKg: 100,
        }),
      })

      const res = await logSetPost(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.setLog).toBeDefined()
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workout_plan_id: '123e4567-e89b-12d3-a456-426614174000',
          exercise_name: 'Barbell Back Squat',
          reps: 5,
        })
      )
    })

    it('sanitizes placeholder/non-UUID plan IDs (e.g. demo-plan-1) to null without 500 error', async () => {
      const req = new NextRequest('http://localhost/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify({
          workoutPlanId: 'demo-plan-1',
          sessionDate: '2026-09-01',
          exerciseName: 'Romanian Deadlift',
          setNumber: 2,
          reps: 8,
          weightKg: 80,
        }),
      })

      const res = await logSetPost(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workout_plan_id: null,
          exercise_name: 'Romanian Deadlift',
          reps: 8,
        })
      )
    })

    it('rejects with 400 if exerciseName is missing', async () => {
      const req = new NextRequest('http://localhost/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify({
          reps: 5,
        }),
      })

      const res = await logSetPost(req)
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/workouts/log-set', () => {
    it('retrieves set logs for the authenticated user', async () => {
      const req = new NextRequest('http://localhost/api/workouts/log-set?sessionDate=2026-09-01&exerciseName=Bench%20Press')
      const res = await logSetGet(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(Array.isArray(data.setLogs)).toBe(true)
    })
  })

  describe('POST /api/workouts/log', () => {
    it('successfully logs a workout session header', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'session-log-1', session_title: 'Full Body A', completed: true },
        error: null,
      })

      const req = new NextRequest('http://localhost/api/workouts/log', {
        method: 'POST',
        body: JSON.stringify({
          sessionDate: '2026-09-01',
          sessionTitle: 'Full Body A',
          completed: true,
          workoutPlanId: 'demo-plan-1',
        }),
      })

      const res = await logPost(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_title: 'Full Body A',
          workout_plan_id: null,
        })
      )
    })
  })

  describe('GET /api/workouts/log', () => {
    it('retrieves workout session logs for the authenticated user', async () => {
      const req = new NextRequest('http://localhost/api/workouts/log?limit=10')
      const res = await logGet(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(Array.isArray(data.logs)).toBe(true)
    })
  })
})
