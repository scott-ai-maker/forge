import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'

vi.mock('@/lib/authz', () => ({
  getRequestAuthz: vi.fn(),
  AuthzError: class AuthzError extends Error {
    status: number
    constructor(message: string, status = 401) {
      super(message)
      this.status = status
    }
  },
}))

const mockProfileSingle = vi.fn()
const mockIntakeSingle = vi.fn()
const mockIntakeEq = vi.fn()

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
      if (table === 'client_intake_forms') {
        return {
          select: vi.fn(() => ({
            eq: mockIntakeEq.mockImplementation(() => ({
              maybeSingle: mockIntakeSingle,
            })),
          })),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  })),
}))

describe('/api/fitness/supplements (Goal-Based Thorne Storefront)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfileSingle.mockResolvedValue({
      data: {
        fitness_goal: 'Athletic Hypertrophy',
      },
      error: null,
    })
    mockIntakeSingle.mockResolvedValue({
      data: {
        parq_any_yes: true,
        parq_answers: {},
        medications: 'Lisinopril 10mg daily',
        medical_conditions: 'Controlled Stage 1 Hypertension',
        allergies: null,
      },
      error: null,
    })
  })

  it('rejects unauthenticated GET and POST requests with 401 and no-store cache headers', async () => {
    const { getRequestAuthz, AuthzError } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const getRes = await GET(new NextRequest('http://localhost/api/fitness/supplements'))
    expect(getRes.status).toBe(401)
    expect(getRes.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    vi.mocked(getRequestAuthz).mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const postRes = await POST(
      new NextRequest('http://localhost/api/fitness/supplements', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    )
    expect(postRes.status).toBe(401)
    expect(postRes.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('queries client_intake_forms by user_id and returns goal-based Thorne collection + physician consult alert', async () => {
    const { getRequestAuthz } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'athlete-1' },
      client: { id: 'athlete-1', role: 'client', email: 'athlete@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    const res = await GET(new NextRequest('http://localhost/api/fitness/supplements'))
    expect(res.status).toBe(200)
    expect(mockIntakeEq).toHaveBeenCalledWith('user_id', 'athlete-1')

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.supplementEngineDisabled).toBe(true)
    expect(json.goal).toBe('hypertrophy')
    expect(json.collection.products.length).toBeGreaterThan(0)
    expect(json.physicianConsultAlert.requiresPhysicianConsultNotice).toBe(true)
    expect(json.disclosures.ftcAffiliate).toContain('commission')
    expect(json.disclosures.fdaDshea).toContain('Food and Drug Administration')
  })

  it('returns 410 Gone on POST since personalized supplement adherence/dosing is disabled', async () => {
    const { getRequestAuthz } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'athlete-1' },
      client: { id: 'athlete-1', role: 'client', email: 'athlete@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    const res = await POST(
      new NextRequest('http://localhost/api/fitness/supplements', {
        method: 'POST',
        body: JSON.stringify({ timingWindow: 'morning_with_breakfast' }),
      })
    )
    expect(res.status).toBe(410)
    const json = await res.json()
    expect(json.supplementEngineDisabled).toBe(true)
  })
})
