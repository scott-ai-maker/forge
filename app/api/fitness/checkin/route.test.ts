import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, supabaseAdminMock, upsertMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  upsertMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET, POST } from '@/app/api/fitness/checkin/route'
import { AuthzError } from '@/lib/authz'

const authedUser = { user: { id: 'user-1' }, client: { role: 'client' } }

function makeAdmin(upsertReturn: unknown = null, listReturn: unknown[] = []) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return {
                    limit: async () => ({ data: listReturn, error: null }),
                  }
                },
              }
            },
          }
        },
        upsert(payload: unknown) {
          upsertMock(payload)
          return {
            select() {
              return {
                single: async () => ({
                  data: upsertReturn,
                  error: upsertReturn ? null : { message: 'db error' },
                }),
              }
            },
          }
        },
      }
    },
  }
}

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/fitness/checkin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/fitness/checkin', () => {
  beforeEach(() => vi.clearAllMocks())

  function makeGetRequest() {
    return new NextRequest('http://localhost/api/fitness/checkin', { method: 'GET' })
  }

  it('returns 401 when unauthenticated', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
  })

  it('returns check-ins for authenticated user', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    const checkins = [{ id: 'ci-1', week_start: '2026-04-14', sleep_quality: 7 }]
    supabaseAdminMock.mockReturnValue(makeAdmin(null, checkins))
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ checkins })
  })
})

describe('POST /api/fitness/checkin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ week_start: '2026-04-14' }))
    expect(res.status).toBe(401)
  })

  it('rejects missing week_start', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ sleep_quality: 7 }))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining('week_start') })
  })

  it('rejects invalid week_start format', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin())
    const res = await POST(makeRequest({ week_start: 'April 14' }))
    expect(res.status).toBe(400)
  })

  it('upserts a check-in with valid payload', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    const record = { id: 'ci-1', week_start: '2026-04-14', sleep_quality: 4 }
    supabaseAdminMock.mockReturnValue(makeAdmin(record))
    const res = await POST(makeRequest({ week_start: '2026-04-14', sleep_quality: 4, stress_level: 4 }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject(record)
  })

  it('returns 500 on db error', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin(null))
    const res = await POST(makeRequest({ week_start: '2026-04-14' }))
    expect(res.status).toBe(500)
  })

  it('preserves blank ratings, weight and notes as null rather than zero or text', async () => {
    getRequestAuthzMock.mockResolvedValue(authedUser)
    supabaseAdminMock.mockReturnValue(makeAdmin({ id: 'ci-1' }))
    const res = await POST(makeRequest({
      week_start: '2026-04-14', sleep_quality: null, weight_kg: null, notes: null,
    }))
    expect(res.status).toBe(200)
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({
      sleep_quality: null, stress_level: null, soreness_level: null, energy_level: null,
      weight_kg: null, waist_cm: null, hip_cm: null, neck_cm: null, notes: null,
    }))
  })

  it.each([{ sleep_quality: 6 }, { stress_level: 0 }, { energy_level: 2.5 }, { weight_kg: 0 }, { neck_cm: 'invalid' }])(
    'rejects invalid check-in values %j',
    async fields => {
      getRequestAuthzMock.mockResolvedValue(authedUser)
      const res = await POST(makeRequest({ week_start: '2026-04-14', ...fields }))
      expect(res.status).toBe(400)
      expect(upsertMock).not.toHaveBeenCalled()
    },
  )
})
