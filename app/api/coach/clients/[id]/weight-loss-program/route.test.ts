import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  getRequestAuthzMock,
  requireRoleMock,
  requireCoachAssignedClientMock,
  supabaseAdminMock,
  enforceRateLimitMock,
  generateMasterNasmOptProgramMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  enforceRateLimitMock: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 14,
    resetAt: new Date(Date.now() + 300_000).toISOString(),
  }),
  generateMasterNasmOptProgramMock: vi.fn().mockResolvedValue({
    phase_name: 'Phase 2: Strength Endurance',
    nasm_opt_phase: 2,
    workouts: [],
  }),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireRole: requireRoleMock,
    requireCoachAssignedClient: requireCoachAssignedClientMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: enforceRateLimitMock,
}))

vi.mock('@/lib/gemini-nasm-master-coach', () => ({
  generateMasterNasmOptProgram: generateMasterNasmOptProgramMock,
}))

import { POST } from './route'
import { AuthzError } from '@/lib/authz'

describe('POST /api/coach/clients/[id]/weight-loss-program', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 14,
      resetAt: new Date(Date.now() + 300_000).toISOString(),
    })
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { id: 'coach-1', role: 'coach' },
    })
    requireRoleMock.mockReturnValue(undefined)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    supabaseAdminMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'client-1',
            full_name: 'Test Athlete',
            age: 36,
            sex: 'male',
            height_cm: 180,
            weight_kg: 92,
            target_weight_kg: 82,
            estimated_bodyfat_percent: 22,
            target_bodyfat_percent: 14,
            training_days_per_week: 4,
          },
          error: null,
        }),
      })),
    })
  })

  it('rejects unassigned coach access with 403 and no-store', async () => {
    requireCoachAssignedClientMock.mockRejectedValueOnce(new AuthzError('Forbidden', 403))
    const req = new NextRequest('http://localhost/api/coach/clients/client-1/weight-loss-program', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'client-1' }) })
    expect(res.status).toBe(403)
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('validates targetNasmPhase bounds (1..5) with 400', async () => {
    const req = new NextRequest('http://localhost/api/coach/clients/client-1/weight-loss-program', {
      method: 'POST',
      body: JSON.stringify({ targetNasmPhase: 9 }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'client-1' }) })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('targetNasmPhase'),
    })
  })

  it('generates weight-loss program with sanitized coachGuidanceNotes and no-store header', async () => {
    const req = new NextRequest('http://localhost/api/coach/clients/client-1/weight-loss-program', {
      method: 'POST',
      body: JSON.stringify({
        targetNasmPhase: 2,
        trainingDaysPerWeek: 4,
        coachGuidanceNotes: 'Prioritize Zone 2 incline walking <script>bad()</script>',
      }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'client-1' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toContain('no-store')
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(generateMasterNasmOptProgramMock).toHaveBeenCalledOnce()
    const passedReq = generateMasterNasmOptProgramMock.mock.calls[0][0]
    expect(JSON.stringify(passedReq)).not.toContain('<script>')
  })
})
