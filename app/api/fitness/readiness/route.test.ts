import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

import { POST } from '@/app/api/fitness/readiness/route'
import { AuthzError } from '@/lib/authz'

const authedClient = {
  user: { id: 'athlete-1' },
  client: {
    id: 'athlete-1',
    role: 'client' as const,
    status: 'active' as const,
    email: 'athlete@forge-athletic.app',
    designated_coach_id: null,
  },
}

function makePost(body: unknown) {
  return new NextRequest('http://localhost/api/fitness/readiness', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/fitness/readiness', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 with no-store headers when unauthenticated', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const res = await POST(makePost({ sleep_hours: 8 }))
    expect(res.status).toBe(401)
    expect(res.headers.get('cache-control')).toBe('no-store, max-age=0')
  })

  it('blocks paused client accounts with 403', async () => {
    getRequestAuthzMock.mockResolvedValue({
      ...authedClient,
      client: { ...authedClient.client, status: 'paused' },
    })
    const res = await POST(makePost({ sleep_hours: 8 }))
    expect(res.status).toBe(403)
    expect(res.headers.get('cache-control')).toBe('no-store, max-age=0')
  })

  it('rejects malformed JSON bodies with 400', async () => {
    getRequestAuthzMock.mockResolvedValue(authedClient)
    const res = await POST(makePost('{broken'))
    expect(res.status).toBe(400)
  })

  it.each([
    { sleep_hours: 30 },
    { sleep_hours: -1 },
    { sleep_quality: 11 },
    { sleep_quality: 0 },
    { resting_heart_rate: 15 },
    { resting_heart_rate: 280 },
    { soreness_level: 12 },
    { stress_level: 0 },
    { recent_workload_units: new Array(65).fill(300) },
    { recent_workload_units: [400, -50] },
  ])('rejects out-of-bounds physiological payload %j with 400', async payload => {
    getRequestAuthzMock.mockResolvedValue(authedClient)
    const res = await POST(makePost(payload))
    expect(res.status).toBe(400)
    expect(res.headers.get('cache-control')).toBe('no-store, max-age=0')
  })

  it('evaluates GREEN, YELLOW, RED, and NO_DATA readiness gates accurately', async () => {
    getRequestAuthzMock.mockResolvedValue(authedClient)

    const noDataRes = await POST(makePost({}))
    expect(noDataRes.status).toBe(200)
    expect(noDataRes.headers.get('cache-control')).toBe('no-store, max-age=0')
    const noDataJson = await noDataRes.json()
    expect(noDataJson.evaluation.gate).toBe('NO_DATA')
    expect(noDataJson.evaluation.userId).toBe('athlete-1')

    const greenRes = await POST(
      makePost({
        sleep_hours: 8.4,
        sleep_quality: 9,
        resting_heart_rate: 50,
        baseline_rhr: 52,
        soreness_level: 2,
        stress_level: 2,
        recent_workload_units: [350, 350, 0, 400, 350, 0, 350],
        chronic_avg_weekly_workload: 1800,
      })
    )
    expect(greenRes.status).toBe(200)
    const greenJson = await greenRes.json()
    expect(greenJson.evaluation.gate).toBe('GREEN')
    expect(greenJson.evaluation.score).toBeGreaterThanOrEqual(80)

    const redRes = await POST(
      makePost({
        sleep_hours: 4.8,
        sleep_quality: 3,
        resting_heart_rate: 66,
        baseline_rhr: 52,
        soreness_level: 9,
        stress_level: 9,
        recent_workload_units: [850, 900, 0, 850, 900, 0, 850],
        chronic_avg_weekly_workload: 2100,
      })
    )
    expect(redRes.status).toBe(200)
    const redJson = await redRes.json()
    expect(redJson.evaluation.gate).toBe('RED')
    expect(redJson.evaluation.workoutAction).toBe('trigger_deload')
  })
})
