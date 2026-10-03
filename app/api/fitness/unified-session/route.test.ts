import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { POST } from '@/app/api/fitness/unified-session/route'
import { AuthzError } from '@/lib/authz'

function makeAdmin(workoutReturn: unknown = { id: 'wl-1' }, cardioReturn: unknown = { id: 'cl-1' }) {
  return {
    from(table: string) {
      return {
        insert() {
          return {
            select() {
              return {
                single: async () => ({
                  data: table === 'workout_logs' ? workoutReturn : cardioReturn,
                  error: null,
                }),
                maybeSingle: async () => ({
                  data: cardioReturn,
                  error: null,
                }),
              }
            },
          }
        },
      }
    },
  }
}

const authedUser = { user: { id: 'user-apple-1' }, client: { role: 'client' } }

describe('POST /api/fitness/unified-session', () => {
  beforeEach(() => vi.clearAllMocks())

  function makePostRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost:3000/api/fitness/unified-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('rejects unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const req = makePostRequest({ sessionDate: '2026-08-25', sessionTitle: 'Day 1' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when sessionDate or sessionTitle is missing', async () => {
    getRequestAuthzMock.mockResolvedValueOnce(authedUser)
    const req = makePostRequest({ sessionDate: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('successfully logs unified strength and cardio workout and returns Apple HealthKit payload', async () => {
    getRequestAuthzMock.mockResolvedValueOnce(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())

    const req = makePostRequest({
      sessionDate: '2026-08-25',
      sessionTitle: 'Day 1: Stabilization & Stage 2 Cardio',
      workoutDay: 1,
      durationMinutes: 55,
      strength: {
        completedSets: 12,
        totalVolumeKg: 4200,
        totalVolumeLbs: 9259,
        exerciseCount: 4,
        avgRpe: 7.5,
      },
      cardio: {
        stage: 2,
        modality: 'Treadmill Incline Intervals',
        durationMins: 20,
        distanceKm: 3.2,
        avgHeartRate: 154,
        maxHeartRate: 172,
        calories: 220,
      },
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.workoutLog).toBeDefined()
    expect(json.cardioLog).toBeDefined()
  })
})
