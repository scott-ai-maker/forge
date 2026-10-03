import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

import { POST } from '@/app/api/coach/ai-architect/route'
import { AuthzError } from '@/lib/authz'

describe('POST /api/coach/ai-architect', () => {
  beforeEach(() => vi.clearAllMocks())

  function makePostRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost:3000/api/coach/ai-architect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('rejects unauthenticated requests in production environment', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW

    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const res = await POST(makePostRequest({ goal: 'fat_loss' }))
    expect(res.status).toBe(401)

    vi.unstubAllEnvs()
  })

  it('successfully generates a Master NASM OPT plan with official CDN videos and images', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    })

    const res = await POST(
      makePostRequest({
        clientName: 'Alexander Hamilton',
        clientAge: 40,
        goal: 'hypertrophy',
        targetNasmPhase: 3,
        trainingDaysPerWeek: 3,
        equipmentAccess: ['barbell', 'dumbbell', 'cable', 'bench'],
      })
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.coachIdentity).toContain('Coach Gordon')
    expect(json.plan).toBeDefined()
    expect(json.plan.nasmOptPhase).toBe(3)
    expect(json.plan.workouts.length).toBe(3)

    // Verify CDN media attached
    const firstExercise = json.plan.workouts[0].exercises[0]
    expect(firstExercise.videoUrl).toBeDefined()
    expect(firstExercise.embedUrl).toBeDefined()
    expect(firstExercise.imageUrl).toBeDefined()
  })
})
