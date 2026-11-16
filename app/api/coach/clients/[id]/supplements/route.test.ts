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

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 19 }),
}))

const mockProfileSingle = vi.fn()
const mockClientSingle = vi.fn()
const mockIntakeSingle = vi.fn()
const mockMessageInsert = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'fitness_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: mockProfileSingle,
        }
      }
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: mockClientSingle,
        }
      }
      if (table === 'client_intake_forms') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: mockIntakeSingle,
        }
      }
      if (table === 'coach_client_messages') {
        return {
          insert: mockMessageInsert,
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: mockMessageInsert,
      }
    }),
  })),
}))

describe('Coach Supplements API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfileSingle.mockResolvedValue({
      data: {
        user_id: 'client-123',
        primary_goal: 'fat_loss',
        age: 44,
        sex: 'female',
        training_experience: 'intermediate',
      },
      error: null,
    })
    mockClientSingle.mockResolvedValue({
      data: { full_name: 'Jennifer Rainville', email: 'jennifer@example.com' },
      error: null,
    })
    mockIntakeSingle.mockResolvedValue({
      data: {
        parq_answers: {},
        medications: 'Eliquis 5mg (anticoagulant)',
        medical_conditions: 'History of DVT',
      },
      error: null,
    })
    mockMessageInsert.mockResolvedValue({ data: null, error: null })
  })

  it('rejects unauthorized or unassigned athlete requests with 401/403 and no-store headers', async () => {
    const { getRequestAuthz, requireCoachAssignedClient, AuthzError } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
      method: 'GET',
    })

    const res = await GET(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(401)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'coach-123' },
      client: { id: 'coach-123', role: 'coach', email: 'coach@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(requireCoachAssignedClient).mockRejectedValueOnce(new AuthzError('Forbidden', 403))

    const forbiddenRes = await GET(req, { params: Promise.resolve({ id: 'unassigned-client' }) })
    expect(forbiddenRes.status).toBe(403)
    expect(forbiddenRes.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('hydrates real athlete profile, intake medications, and contraindication shields on GET', async () => {
    const { getRequestAuthz, requireRole, requireCoachAssignedClient } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'coach-123' },
      client: { id: 'coach-123', role: 'coach', email: 'coach@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(requireRole).mockReturnValue(undefined)
    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
      method: 'GET',
    })

    const res = await GET(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.profile.age).toBe(44)
    expect(json.intake.medications).toContain('Eliquis')
    expect(json.stack.clientProfile.goal).toBe('fat_loss')
    expect(json.stack.clientProfile.sex).toBe('female')
    // Anticoagulant shieldwithholds Omega-3 fish oil and adds anticoagulant interaction warning
    expect(json.stack.prescribedItems.some((i: { id: string }) => i.id === 'omega3_fish_oil')).toBe(false)
    expect(json.stack.drugInteractions.length).toBeGreaterThan(0)
  })

  it('prescribes supplement stack, strips unsafe markup from customCoachNote, and dispatches concierge message', async () => {
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
        customCoachNote: 'Prioritize Creapure monohydrate <script>evil()</script> before bed.',
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.stack.prescribedItems.length).toBeGreaterThan(0)
    expect(json.conciergeNotified).toBe(true)

    const insertedBody = mockMessageInsert.mock.calls[0]?.[0]?.body as string
    expect(insertedBody).toContain('Prioritize Creapure monohydrate')
    expect(insertedBody).not.toContain('<script>')
  })

  it('rejects malformed JSON, invalid enums, out-of-range age, and oversized coach notes with 400', async () => {
    const { getRequestAuthz, requireRole, requireCoachAssignedClient } = await import('@/lib/authz')
    const coachAuth = {
      user: { id: 'coach-123' },
      client: { id: 'coach-123', role: 'coach', email: 'coach@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>
    vi.mocked(requireRole).mockReturnValue(undefined)
    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    const badPayloads = [
      '{malformed',
      JSON.stringify({ goal: 'superhuman_mode' }),
      JSON.stringify({ sex: 'robot' }),
      JSON.stringify({ fitnessLevel: 'olympian' }),
      JSON.stringify({ age: 12 }),
      JSON.stringify({ age: 150 }),
      JSON.stringify({ customCoachNote: 'x'.repeat(601) }),
    ]

    for (const rawBody of badPayloads) {
      vi.mocked(getRequestAuthz).mockResolvedValueOnce(coachAuth)
      const res = await POST(
        new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
          method: 'POST',
          body: rawBody,
        }),
        { params: Promise.resolve({ id: 'client-123' }) }
      )
      expect(res.status).toBe(400)
    }
  })

  it('returns 500 when coach_client_messages insert fails and 429 when rate limited', async () => {
    const { getRequestAuthz, requireRole, requireCoachAssignedClient } = await import('@/lib/authz')
    const { enforceRateLimit } = await import('@/lib/rate-limit')
    const coachAuth = {
      user: { id: 'coach-123' },
      client: { id: 'coach-123', role: 'coach', email: 'coach@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>
    vi.mocked(requireRole).mockReturnValue(undefined)
    vi.mocked(requireCoachAssignedClient).mockResolvedValue(undefined)

    mockMessageInsert.mockResolvedValueOnce({ data: null, error: { message: 'DB write failed' } })
    vi.mocked(getRequestAuthz).mockResolvedValueOnce(coachAuth)
    const dbErrRes = await POST(
      new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
        method: 'POST',
        body: JSON.stringify({ goal: 'hypertrophy', age: 35 }),
      }),
      { params: Promise.resolve({ id: 'client-123' }) }
    )
    expect(dbErrRes.status).toBe(500)

    vi.mocked(getRequestAuthz).mockResolvedValueOnce(coachAuth)
    vi.mocked(enforceRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0 } as Awaited<ReturnType<typeof enforceRateLimit>>)
    const rlRes = await POST(
      new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
        method: 'POST',
        body: JSON.stringify({ goal: 'hypertrophy', age: 35 }),
      }),
      { params: Promise.resolve({ id: 'client-123' }) }
    )
    expect(rlRes.status).toBe(429)
  })
})
