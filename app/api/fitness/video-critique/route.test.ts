import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getRequestAuthz: vi.fn(),
  consumeFeatureUse: vi.fn(),
  refundFeatureUse: vi.fn(),
}))

vi.mock('@/lib/authz', () => {
  class MockAuthzError extends Error {
    status: number
    constructor(message: string, status = 401) {
      super(message)
      this.status = status
    }
  }
  return {
    AuthzError: MockAuthzError,
    getRequestAuthz: mocks.getRequestAuthz,
  }
})

vi.mock('@/lib/addon-entitlements', () => ({
  consumeFeatureUse: mocks.consumeFeatureUse,
  refundFeatureUse: mocks.refundFeatureUse,
}))

import { AuthzError } from '@/lib/authz'
import { POST } from './route'

function buildRequest(body: string | Record<string, unknown>): NextRequest {
  const payload = typeof body === 'string' ? body : JSON.stringify(body)
  return new NextRequest('http://localhost:3000/api/fitness/video-critique', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  })
}

describe('POST /api/fitness/video-critique', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests with 401 and HIPAA no-store cache headers', async () => {
    mocks.getRequestAuthz.mockRejectedValueOnce(new AuthzError('Authentication required', 401))

    const res = await POST(buildRequest({ lift_type: 'barbell_back_squat' }))
    expect(res.status).toBe(401)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    expect(mocks.consumeFeatureUse).not.toHaveBeenCalled()
  })

  it('validates malformed JSON, prototype keys, and numeric bounds BEFORE consuming add-on credits', async () => {
    mocks.getRequestAuthz.mockResolvedValue({
      user: { id: 'athlete-1' },
      client: { role: 'client' },
    })

    const badJsonRes = await POST(buildRequest('{not-valid-json'))
    expect(badJsonRes.status).toBe(400)
    expect(badJsonRes.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    const protoLiftRes = await POST(buildRequest({ lift_type: '__proto__' }))
    expect(protoLiftRes.status).toBe(400)

    const badLoadRes = await POST(
      buildRequest({ lift_type: 'barbell_back_squat', load_lbs: -50 })
    )
    expect(badLoadRes.status).toBe(400)

    const badRepsRes = await POST(
      buildRequest({ lift_type: 'barbell_back_squat', reps_count: 500 })
    )
    expect(badRepsRes.status).toBe(400)

    const badDeviationsRes = await POST(
      buildRequest({
        lift_type: 'barbell_back_squat',
        observed_deviations: 'not_an_array',
      })
    )
    expect(badDeviationsRes.status).toBe(400)

    expect(mocks.consumeFeatureUse).not.toHaveBeenCalled()
  })

  it('returns 402 ADDON_REQUIRED when a client has no video-review uses remaining', async () => {
    mocks.getRequestAuthz.mockResolvedValueOnce({
      user: { id: 'athlete-1' },
      client: { role: 'client' },
    })
    mocks.consumeFeatureUse.mockResolvedValueOnce(false)

    const res = await POST(buildRequest({ lift_type: 'barbell_deadlift', load_lbs: 315 }))
    expect(res.status).toBe(402)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    const json = await res.json()
    expect(json.code).toBe('ADDON_REQUIRED')
    expect(json.addonId).toBe('addon-video-review-pack')
  })

  it('consumes 1 credit for valid client requests, preserves 0 lb OHSA load, and sanitizes clinical notes', async () => {
    mocks.getRequestAuthz.mockResolvedValueOnce({
      user: { id: 'athlete-2' },
      client: { role: 'client' },
    })
    mocks.consumeFeatureUse.mockResolvedValueOnce(true)

    const res = await POST(
      buildRequest({
        lift_type: 'overhead_squat_assessment',
        load_lbs: 0,
        reps_count: 5,
        observed_deviations: ['knee_valgus', 'arms_fall_forward'],
        notes: '  <script>alert(1)</script>Tight ankles on reps 4-5  ',
      })
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    expect(mocks.consumeFeatureUse).toHaveBeenCalledWith('athlete-2', 'video-review')
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.analysis.liftType).toBe('overhead_squat_assessment')
    expect(data.analysis.loadLbs).toBe(0)
    expect(data.analysis.overallFormScore).toBe(68)
    expect(data.analysis.rating).toBe('Needs Recalibration')
    expect(data.analysis.spokenAudioSummary).toContain('Coach Gordon here')
  })

  it('bypasses credit consumption when invoked by an authenticated coach', async () => {
    mocks.getRequestAuthz.mockResolvedValueOnce({
      user: { id: 'coach-gordon' },
      client: { role: 'coach' },
    })

    const res = await POST(
      buildRequest({
        lift_type: 'barbell_bench_press',
        load_lbs: 245,
        reps_count: 5,
        observed_deviations: ['butt_off_bench'],
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.consumeFeatureUse).not.toHaveBeenCalled()
    const data = await res.json()
    expect(data.analysis.overallFormScore).toBe(85)
    expect(data.analysis.rating).toBe('Proficient')
  })
})
