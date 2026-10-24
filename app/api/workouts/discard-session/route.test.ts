import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as discardSessionPost } from './route'
import { getRequestAuthz } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { syncDatabasePersonalRecordsForExercises } from '@/lib/sync-personal-records'

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

vi.mock('@/lib/sync-personal-records', () => ({
  syncDatabasePersonalRecordsForExercises: vi.fn(),
}))

describe('POST /api/workouts/discard-session', () => {
  const mockUser = { id: 'user-123', email: 'athlete@example.com' }
  const mockClientAuthz = {
    user: mockUser,
    client: { role: 'client', id: 'client-1', is_active: true },
  }

  let mockDelete: ReturnType<typeof vi.fn>
  let mockIn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestAuthz).mockResolvedValue(mockClientAuthz as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    mockIn = vi.fn().mockResolvedValue({ error: null })
    mockDelete = vi.fn().mockReturnValue({
      in: mockIn,
    })
  })

  it('returns deletedCount 0 when no unfinalized sets exist for the workout session', async () => {
    const mockQuery: Record<string, unknown> = {}
    mockQuery.select = vi.fn().mockReturnValue(mockQuery)
    mockQuery.eq = vi.fn().mockReturnValue(mockQuery)
    mockQuery.is = vi.fn().mockReturnValue(mockQuery)
    mockQuery.like = vi.fn().mockReturnValue(mockQuery)
    mockQuery.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve)

    vi.mocked(supabaseAdmin).mockReturnValue({
      from: vi.fn(() => mockQuery),
    } as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/workouts/discard-session', {
      method: 'POST',
      body: JSON.stringify({
        workoutDay: 3,
        sessionDate: '2026-10-23',
      }),
    })

    const res = await discardSessionPost(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.deletedCount).toBe(0)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes unfinalized sets and recalculates PRs when aborting a workout session', async () => {
    const matchingSets = [
      { id: 'set-1', exercise_name: 'Russian Twist' },
      { id: 'set-2', exercise_name: 'Russian Twist' },
      { id: 'set-3', exercise_name: 'Dumbbell Bent Over Row' },
    ]

    const mockSelectQuery: Record<string, unknown> = {}
    mockSelectQuery.select = vi.fn().mockReturnValue(mockSelectQuery)
    mockSelectQuery.eq = vi.fn().mockReturnValue(mockSelectQuery)
    mockSelectQuery.is = vi.fn().mockReturnValue(mockSelectQuery)
    mockSelectQuery.like = vi.fn().mockReturnValue(mockSelectQuery)
    mockSelectQuery.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: matchingSets, error: null }).then(resolve)

    vi.mocked(supabaseAdmin).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'workout_set_logs') {
          return {
            ...mockSelectQuery,
            delete: mockDelete,
          }
        }
        return {}
      }),
    } as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/workouts/discard-session', {
      method: 'POST',
      body: JSON.stringify({
        workoutDay: 3,
        sessionDate: '2026-10-23',
      }),
    })

    const res = await discardSessionPost(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.deletedCount).toBe(3)
    expect(mockIn).toHaveBeenCalledWith('id', ['set-1', 'set-2', 'set-3'])
    expect(syncDatabasePersonalRecordsForExercises).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      ['Russian Twist', 'Dumbbell Bent Over Row']
    )
  })
})
