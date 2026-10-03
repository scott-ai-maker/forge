import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

vi.mock('@/lib/authz', () => ({
  getRequestAuthz: vi.fn(),
  requireRole: vi.fn(),
  requireCoachAssignedClient: vi.fn(),
  AuthzError: class AuthzError extends Error {
    status: number
    constructor(message: string, status = 403) {
      super(message)
      this.status = status
    }
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { full_name: 'Jennifer Rainville', email: 'jennifer@example.com', height_cm: 168, weight_kg: 62, sex: 'female' },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

describe('POST /api/coach/clients/[id]/body-composition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthorized requests with 401/403', async () => {
    const { getRequestAuthz, AuthzError } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/coach/clients/client-123/body-composition', {
      method: 'POST',
      body: JSON.stringify({ heightCm: 175, weightKg: 75 }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(401)
  })

  it('runs coach DEXA scan for client and returns structured results', async () => {
    const { getRequestAuthz, requireRole, requireCoachAssignedClient } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'coach-123' },
      client: { id: 'coach-123', role: 'coach', email: 'coach@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(requireRole).mockReturnValue(undefined)
    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/coach/clients/client-123/body-composition', {
      method: 'POST',
      body: JSON.stringify({
        heightCm: 168,
        weightKg: 62,
        sex: 'female',
        waistCm: 68,
        neckCm: 33,
        hipCm: 95,
        clientName: 'Jennifer Rainville',
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.data.estimatedBodyFatPercent).toBeGreaterThan(15)
    expect(json.data.leanBodyMassKg).toBeGreaterThan(35)
    expect(json.data.cunninghamBmr).toBeGreaterThan(1200)
    expect(json.data.regionalBreakdown.length).toBe(4)
  })
})

