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
const mockIntakeEq = vi.fn()
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
          select: vi.fn(() => ({
            eq: mockIntakeEq.mockImplementation(() => ({
              maybeSingle: mockIntakeSingle,
            })),
          })),
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

describe('Coach Thorne Goal Storefront API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfileSingle.mockResolvedValue({
      data: {
        fitness_goal: 'fat_loss',
      },
      error: null,
    })
    mockClientSingle.mockResolvedValue({
      data: { full_name: 'Jennifer Rainville', email: 'jennifer@example.com' },
      error: null,
    })
    mockIntakeSingle.mockResolvedValue({
      data: {
        parq_any_yes: false,
        parq_answers: {},
        medications: 'Eliquis 5mg (anticoagulant)',
        medical_conditions: 'History of DVT',
        allergies: null,
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

  it('queries client_intake_forms by user_id and flags physician consultation on GET', async () => {
    const { getRequestAuthz, requireCoachAssignedClient } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'coach-123' },
      client: { id: 'coach-123', role: 'coach', email: 'coach@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(requireCoachAssignedClient).mockResolvedValueOnce(undefined)

    const req = new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
      method: 'GET',
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(200)
    expect(mockIntakeEq).toHaveBeenCalledWith('user_id', 'client-123')

    const json = await res.json()
    expect(json.supplementEngineDisabled).toBe(true)
    expect(json.goal).toBe('fat_loss')
    expect(json.physicianConsultAlert.requiresPhysicianConsultNotice).toBe(true)
  })

  it('shares goal-only Thorne storefront link with valid coach_client_messages schema (sender_id & message_body)', async () => {
    const { getRequestAuthz, requireCoachAssignedClient } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'coach-123' },
      client: { id: 'coach-123', role: 'coach', email: 'coach@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(requireCoachAssignedClient).mockResolvedValueOnce(undefined)

    const req = new NextRequest('http://localhost/api/coach/clients/client-123/supplements', {
      method: 'POST',
      body: JSON.stringify({
        goal: 'fat_loss',
        customCoachNote: 'Focus on whole foods first.',
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'client-123' }) })
    expect(res.status).toBe(200)
    expect(mockIntakeEq).toHaveBeenCalledWith('user_id', 'client-123')
    expect(mockMessageInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        coach_id: 'coach-123',
        client_id: 'client-123',
        sender_id: 'coach-123',
        message_body: expect.stringContaining('OPTIONAL THORNE PARTNER STOREFRONT'),
      })
    )
    const insertedArg = mockMessageInsert.mock.calls[0][0]
    expect(insertedArg).not.toHaveProperty('sender_role')
    expect(insertedArg).not.toHaveProperty('body')
  })
})
