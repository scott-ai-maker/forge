import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET, POST } from '@/app/api/fitness/cardio/route'
import { AuthzError } from '@/lib/authz'

function makeAdmin(insertReturn: unknown = null, selectReturn: unknown[] = []) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return {
                    limit: async () => ({ data: selectReturn, error: null }),
                  }
                },
              }
            },
          }
        },
        insert() {
          return {
            select() {
              return {
                single: async () => ({
                  data: insertReturn,
                  error: insertReturn ? null : { message: 'db error' },
                }),
              }
            },
          }
        },
      }
    },
  }
}

const authedUser = { user: { id: 'user-1' }, client: { role: 'client' } }

describe('GET /api/fitness/cardio', () => {
  beforeEach(() => vi.clearAllMocks())

  function makeGetRequest() {
    return new NextRequest('http://localhost/api/fitness/cardio', { method: 'GET' })
  }

  it('returns 401 when unauthenticated', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns logs for authenticated user', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    const logs = [{ id: 'log-1', activity_type: 'running', duration_mins: 30 }]
    supabaseAdminMock.mockReturnValue(makeAdmin(null, logs))
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ logs })
  })
})

describe('POST /api/fitness/cardio', () => {
  beforeEach(() => vi.clearAllMocks())

  function makeRequest(body: object) {
    return new NextRequest('http://localhost/api/fitness/cardio', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 401 when unauthenticated', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ session_date: '2026-01-01', activity_type: 'swim', duration_mins: 30 }))
    expect(res.status).toBe(401)
  })

  it('rejects missing session_date', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ activity_type: 'run', duration_mins: 30 }))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining('session_date') })
  })

  it('rejects bad date format', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ session_date: '01/01/2026', activity_type: 'run', duration_mins: 30 }))
    expect(res.status).toBe(400)
  })

  it('rejects missing activity_type', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ session_date: '2026-01-01', duration_mins: 30 }))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining('activity_type') })
  })

  it('rejects invalid duration_mins', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ session_date: '2026-01-01', activity_type: 'run', duration_mins: 0 }))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining('duration_mins') })
  })

  it('rejects perceived_effort out of range', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ session_date: '2026-01-01', activity_type: 'run', duration_mins: 30, perceived_effort: 11 }))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining('perceived_effort') })
  })

  it('creates a cardio log with valid payload and no-store cache headers', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    const log = { id: 'log-1', activity_type: 'cycling', duration_mins: 45, session_date: '2026-01-15' }
    supabaseAdminMock.mockReturnValue(makeAdmin(log))
    const res = await POST(makeRequest({ session_date: '2026-01-15', activity_type: 'cycling', duration_mins: 45, perceived_effort: 7 }))
    expect(res.status).toBe(201)
    expect(res.headers.get('cache-control')).toBe('no-store, max-age=0')
    await expect(res.json()).resolves.toMatchObject(log)
  })

  it('preserves null optional fields from CardioLogForm instead of coercing null to 0 or 400', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    let capturedInsert: Record<string, unknown> | null = null
    supabaseAdminMock.mockReturnValue({
      from() {
        return {
          insert(payload: Record<string, unknown>) {
            capturedInsert = payload
            return {
              select() {
                return {
                  single: async () => ({
                    data: { id: 'log-nulls', ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      },
    })

    const res = await POST(
      makeRequest({
        session_date: '2026-02-28',
        activity_type: '<b>Zone 2 Aerobic</b>',
        duration_mins: 30,
        distance_km: null,
        avg_heart_rate: null,
        calories: null,
        perceived_effort: null,
        notes: '<script>alert(1)</script> Easy nasal breathing',
      })
    )

    expect(res.status).toBe(201)
    expect(capturedInsert).toMatchObject({
      activity_type: 'bZone 2 Aerobic/b',
      distance_km: null,
      avg_heart_rate: null,
      calories: null,
      perceived_effort: null,
      notes: 'scriptalert(1)/script Easy nasal breathing',
    })
  })

  it('rejects calendar-invalid dates, NaN perceived_effort, out-of-range biometrics, and rate-limited bursts', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())

    // Calendar-invalid date 2026-02-31
    const badDateRes = await POST(
      makeRequest({ session_date: '2026-02-31', activity_type: 'run', duration_mins: 30 })
    )
    expect(badDateRes.status).toBe(400)

    // Non-numeric perceived_effort ("abc" -> NaN)
    const nanRpeRes = await POST(
      makeRequest({ session_date: '2026-02-20', activity_type: 'run', duration_mins: 30, perceived_effort: 'abc' })
    )
    expect(nanRpeRes.status).toBe(400)

    // Out-of-bounds heart rate
    const badHrRes = await POST(
      makeRequest({ session_date: '2026-02-20', activity_type: 'run', duration_mins: 30, avg_heart_rate: 999 })
    )
    expect(badHrRes.status).toBe(400)

    // Rate-limited (429)
    supabaseAdminMock.mockReturnValue({
      ...makeAdmin(),
      rpc: async () => ({
        data: [{ allowed: false, remaining: 0, reset_at: '2026-02-20T00:01:00Z', current_count: 31 }],
        error: null,
      }),
    })
    const rlRes = await POST(
      makeRequest({ session_date: '2026-02-20', activity_type: 'run', duration_mins: 30 })
    )
    expect(rlRes.status).toBe(429)
  })
})
