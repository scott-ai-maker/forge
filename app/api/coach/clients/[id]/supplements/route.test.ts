import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from './route'

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
        data: { full_name: 'Jennifer Rainville', email: 'jennifer@example.com' },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

describe('Coach Supplements API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthorized requests with 401/403', async () => {
    const { getRequestAuthz, AuthzError } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
      method: 'GET',
    })

    const res = await GET(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(401)
  })

  it('prescribes supplement stack and dispatches concierge message', async () => {
    const { getRequestAuthz, requireRole, requireCoachAssignedClient } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'coach-123' },
      client: { id: 'coach-123', role: 'coach', email: 'coach@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(requireRole).mockReturnValue(undefined)
    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
      method: 'POST',
      body: JSON.stringify({
        goal: 'hypertrophy',
        age: 36,
        sex: 'male',
        fitnessLevel: 'intermediate',
        customCoachNote: 'Prioritize Creapure monohydrate and Magnesium L-Threonate before bed.',
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.stack.prescribedItems.length).toBeGreaterThan(0)
    expect(json.conciergeNotified).toBe(true)
  })
})

