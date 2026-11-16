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

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 59 }),
}))

const mockProfileSingle = vi.fn()
const mockIntakeSingle = vi.fn()

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
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: mockIntakeSingle,
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

describe('/api/fitness/supplements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfileSingle.mockResolvedValue({
      data: {
        user_id: 'athlete-1',
        fitness_goal: 'Athletic Hypertrophy',
        age: 41,
        sex: 'male',
        training_experience: 'advanced',
      },
      error: null,
    })
    mockIntakeSingle.mockResolvedValue({
      data: {
        parq_answers: {},
        medications: 'Lisinopril 10mg daily; Levothyroxine 75mcg morning',
        medical_conditions: 'Controlled Stage 1 Hypertension; Hypothyroidism',
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
        body: JSON.stringify({ timingWindow: 'morning_with_breakfast' }),
      })
    )
    expect(postRes.status).toBe(401)
    expect(postRes.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('hydrates athlete supplement stack with intake medication contraindication shields on GET', async () => {
    const { getRequestAuthz } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'athlete-1' },
      client: { id: 'athlete-1', role: 'client', email: 'athlete@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    const res = await GET(new NextRequest('http://localhost/api/fitness/supplements'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.stack.clientProfile.goal).toBe('hypertrophy')
    expect(json.stack.clientProfile.age).toBe(41)
    expect(json.stack.drugInteractions.length).toBeGreaterThanOrEqual(2)
    expect(
      json.stack.drugInteractions.some((d: { medicationCategory: string }) =>
        /Blood Pressure|Antihypertensive|Thyroid/i.test(d.medicationCategory)
      )
    ).toBe(true)
  })

  it('validates adherence payloads on POST and rejects malformed JSON or invalid enums with 400', async () => {
    const { getRequestAuthz } = await import('@/lib/authz')
    const authzPayload = {
      user: { id: 'athlete-1' },
      client: { id: 'athlete-1', role: 'client', email: 'athlete@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>

    // Malformed JSON
    vi.mocked(getRequestAuthz).mockResolvedValueOnce(authzPayload)
    const badJsonRes = await POST(
      new NextRequest('http://localhost/api/fitness/supplements', {
        method: 'POST',
        body: '{bad-json',
      })
    )
    expect(badJsonRes.status).toBe(400)

    // Invalid timingWindow
    vi.mocked(getRequestAuthz).mockResolvedValueOnce(authzPayload)
    const badWindowRes = await POST(
      new NextRequest('http://localhost/api/fitness/supplements', {
        method: 'POST',
        body: JSON.stringify({ timingWindow: 'midnight_snack' }),
      })
    )
    expect(badWindowRes.status).toBe(400)

    // Invalid date
    vi.mocked(getRequestAuthz).mockResolvedValueOnce(authzPayload)
    const badDateRes = await POST(
      new NextRequest('http://localhost/api/fitness/supplements', {
        method: 'POST',
        body: JSON.stringify({ timingWindow: 'morning_with_breakfast', date: '11/15/2026' }),
      })
    )
    expect(badDateRes.status).toBe(400)

    // Invalid itemId
    vi.mocked(getRequestAuthz).mockResolvedValueOnce(authzPayload)
    const badItemRes = await POST(
      new NextRequest('http://localhost/api/fitness/supplements', {
        method: 'POST',
        body: JSON.stringify({
          timingWindow: 'morning_with_breakfast',
          date: '2026-11-15',
          itemId: '<script>alert(1)</script>',
        }),
      })
    )
    expect(badItemRes.status).toBe(400)

    // Valid adherence log
    vi.mocked(getRequestAuthz).mockResolvedValueOnce(authzPayload)
    const okRes = await POST(
      new NextRequest('http://localhost/api/fitness/supplements', {
        method: 'POST',
        body: JSON.stringify({
          timingWindow: 'daily_flexible',
          itemId: 'creatine_monohydrate',
          date: '2026-11-15',
          completed: true,
        }),
      })
    )
    expect(okRes.status).toBe(200)
    expect(okRes.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    const okJson = await okRes.json()
    expect(okJson).toMatchObject({
      ok: true,
      timingWindow: 'daily_flexible',
      itemId: 'creatine_monohydrate',
      date: '2026-11-15',
      completed: true,
    })
  })

  it('enforces per-user rate limiting with 429', async () => {
    const { getRequestAuthz } = await import('@/lib/authz')
    const { enforceRateLimit } = await import('@/lib/rate-limit')
    vi.mocked(getRequestAuthz).mockResolvedValueOnce({
      user: { id: 'athlete-1' },
      client: { id: 'athlete-1', role: 'client', email: 'athlete@example.com', status: 'active', designated_coach_id: null },
    } as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
    vi.mocked(enforceRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0 } as Awaited<ReturnType<typeof enforceRateLimit>>)

    const res = await POST(
      new NextRequest('http://localhost/api/fitness/supplements', {
        method: 'POST',
        body: JSON.stringify({ timingWindow: 'morning_with_breakfast' }),
      })
    )
    expect(res.status).toBe(429)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })
})
