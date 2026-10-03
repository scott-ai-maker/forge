import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

vi.mock('@/lib/csrf', () => ({
  protectCSRF: vi.fn().mockResolvedValue({ valid: true }),
}))

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'athlete@example.com' } },
        error: null,
      }),
    },
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'analysis-123',
              user_id: 'user-123',
              estimated_bodyfat_percent: 13.5,
              method: 'DEXA 4C Multi-View AI Spatial Anthropometry',
              confidence_score: 0.94,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      })),
    })),
  })),
}))

describe('POST /api/fitness/bodyfat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects requests missing required biometrics (sex, heightCm, weightKg)', async () => {
    const req = new NextRequest('http://localhost/api/fitness/bodyfat', {
      method: 'POST',
      body: JSON.stringify({ sex: 'male' }),
    })

    const res = await POST(req)
    expect(res).toBeDefined()
    expect(res!.status).toBe(400)
    const json = await res!.json()
    expect(json.error).toContain('required')
  })

  it('computes DEXA-calibrated multi-compartment body fat and returns full result', async () => {
    const req = new NextRequest('http://localhost/api/fitness/bodyfat', {
      method: 'POST',
      body: JSON.stringify({
        sex: 'male',
        heightCm: 182,
        weightKg: 82,
        age: 33,
        waistCm: 84,
        neckCm: 39,
        hipCm: 98,
      }),
    })

    const res = await POST(req)
    expect(res).toBeDefined()
    expect(res!.status).toBe(200)
    const json = await res!.json()
    expect(json.analysis).toBeDefined()
    expect(json.scanResult).toBeDefined()
    expect(json.scanResult.estimatedBodyFatPercent).toBeGreaterThan(5)
    expect(json.scanResult.leanBodyMassKg).toBeGreaterThan(50)
    expect(json.scanResult.ffmi).toBeGreaterThan(17)
    expect(json.scanResult.cunninghamBmr).toBeGreaterThan(1500)
    expect(json.scanResult.recompositionProjection).toBeDefined()
  })
})

