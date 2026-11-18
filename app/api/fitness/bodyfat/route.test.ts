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

  it('rejects unauthenticated requests in production even with a spoofed /test-harness/ referer header', async () => {
    const { createClient } = await import('@/lib/supabase-server')
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    vi.stubEnv('NODE_ENV', 'production')
    try {
      const req = new NextRequest('http://localhost/api/fitness/bodyfat', {
        method: 'POST',
        headers: {
          referer: 'https://attacker.example/test-harness/fake',
        },
        body: JSON.stringify({
          sex: 'male',
          heightCm: 182,
          weightKg: 82,
        }),
      })

      const res = await POST(req)
      expect(res!.status).toBe(401)
      expect(res!.headers.get('cache-control')).toContain('no-store')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('rejects non-finite or out-of-range heightCm/weightKg/sex with 400', async () => {
    const badHeightReq = new NextRequest('http://localhost/api/fitness/bodyfat', {
      method: 'POST',
      body: JSON.stringify({ sex: 'male', heightCm: 'abc', weightKg: 82 }),
    })
    const badHeightRes = await POST(badHeightReq)
    expect(badHeightRes!.status).toBe(400)
    await expect(badHeightRes!.json()).resolves.toMatchObject({
      error: 'heightCm must be between 100 and 260',
    })

    const badSexReq = new NextRequest('http://localhost/api/fitness/bodyfat', {
      method: 'POST',
      body: JSON.stringify({ sex: 'invalid', heightCm: 180, weightKg: 82 }),
    })
    const badSexRes = await POST(badSexReq)
    expect(badSexRes!.status).toBe(400)
  })

  it('clamps extreme targetBodyFatPercent safely in generateRecompositionPlan without division by zero', async () => {
    const { generateRecompositionPlan } = await import('@/lib/ai-body-composition-engine')
    const planAt100 = generateRecompositionPlan(85, 22, 'male', 100)
    expect(Number.isFinite(planAt100.targetWeightKg)).toBe(true)
    expect(planAt100.targetBodyFatPercent).toBeLessThanOrEqual(45)

    const planNegative = generateRecompositionPlan(65, 24, 'female', -10)
    expect(Number.isFinite(planNegative.targetWeightKg)).toBe(true)
    expect(planNegative.targetBodyFatPercent).toBeGreaterThanOrEqual(10)
  })

  it('blocks body-composition photograph upload without standalone BIPA/MHMDA biometric release (403)', async () => {
    const req = new NextRequest('http://localhost/api/fitness/bodyfat', {
      method: 'POST',
      body: JSON.stringify({
        sex: 'male',
        heightCm: 182,
        weightKg: 82,
        anteriorPhotoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/',
      }),
    })

    const res = await POST(req)
    expect(res!.status).toBe(403)
    const json = await res!.json()
    expect(json.error).toContain('740 ILCS 14/15(b)')
  })

  it('never persists raw data:image Base64 strings into body_composition_analyses.photo_data_url', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase')
    let capturedInsertRow: Record<string, unknown> | null = null

    vi.mocked(supabaseAdmin).mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: { path: 'ok' }, error: null }),
        })),
      },
      from: vi.fn((table: string) => {
        if (table === 'legal_consent_audit_log') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) }
        }
        return {
          insert: vi.fn((row: Record<string, unknown>) => {
            capturedInsertRow = row
            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'analysis-vault-1', ...row },
                  error: null,
                }),
              })),
            }
          }),
        }
      }),
    } as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost/api/fitness/bodyfat', {
      method: 'POST',
      body: JSON.stringify({
        sex: 'male',
        heightCm: 182,
        weightKg: 82,
        biometricScanConsent: true,
        anteriorPhotoBase64: 'data:image/jpeg;base64,' + Buffer.from('valid-scan-bytes').toString('base64'),
      }),
    })

    const res = await POST(req)
    expect(res!.status).toBe(200)
    expect(capturedInsertRow).not.toBeNull()
    const storedRef = String(capturedInsertRow!['photo_data_url'] ?? '')
    expect(storedRef.startsWith('data:')).toBe(false)
    expect(storedRef).toMatch(/^user-123\/bodycomp-\d+-[a-f0-9]+\.jpg$/)
  })
})

