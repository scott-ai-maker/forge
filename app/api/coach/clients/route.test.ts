import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET } from '@/app/api/coach/clients/route'
import { AuthzError } from '@/lib/authz'

describe('/api/coach/clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-123' },
      client: { role: 'coach' },
    })
  })

  it('rejects unauthenticated requests with 401 and no-store cache headers', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/coach/clients')
    const res = await GET(req)
    expect(res.status).toBe(401)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('rejects regular client role with 403', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-999' },
      client: { role: 'client' },
    })
    const req = new NextRequest('http://localhost:3000/api/coach/clients')
    const res = await GET(req)
    expect(res.status).toBe(403)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('sums unexpired client_packages sessions_remaining without querying nonexistent is_active column', async () => {
    const eqCallsByTable: Record<string, Array<[string, unknown]>> = {}
    const selectCallsByTable: Record<string, string[]> = {}

    const futureIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const pastIso = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        eqCallsByTable[table] ??= []
        selectCallsByTable[table] ??= []

        if (table === 'clients') {
          const chain = {
            eq: (col: string, val: unknown) => {
              eqCallsByTable[table].push([col, val])
              return chain
            },
            order: () => chain,
            then: (resolve: (value: unknown) => unknown) =>
              Promise.resolve({
                data: [
                  {
                    id: 'athlete-1',
                    email: 'athlete1@forge.app',
                    full_name: 'Marcus Vance',
                    role: 'client',
                    status: 'active',
                    status_reason: null,
                    status_updated_at: null,
                    designated_coach_id: 'coach-123',
                  },
                  {
                    id: 'athlete-2',
                    email: 'athlete2@forge.app',
                    full_name: 'Elena Rostova',
                    role: 'client',
                    status: 'paused',
                    status_reason: 'medical_hold',
                    status_updated_at: '2026-11-10T12:00:00Z',
                    designated_coach_id: 'coach-123',
                  },
                ],
                error: null,
              }).then(resolve),
          }
          return {
            select: (cols: string) => {
              selectCallsByTable[table].push(cols)
              return chain
            },
          }
        }

        if (table === 'client_packages') {
          const pkgChain = {
            eq: (col: string, val: unknown) => {
              eqCallsByTable[table].push([col, val])
              return pkgChain
            },
            in: async () => ({
              data: [
                { client_id: 'athlete-1', sessions_remaining: 6, expires_at: futureIso },
                { client_id: 'athlete-1', sessions_remaining: 4, expires_at: null },
                { client_id: 'athlete-1', sessions_remaining: 9, expires_at: pastIso }, // expired -> ignored
                { client_id: 'athlete-2', sessions_remaining: 0, expires_at: futureIso },
                { client_id: 'athlete-2', sessions_remaining: 5, expires_at: pastIso }, // expired -> ignored
              ],
              error: null,
            }),
          }
          return {
            select: (cols: string) => {
              selectCallsByTable[table].push(cols)
              return pkgChain
            },
          }
        }

        if (table === 'fitness_profiles') {
          return {
            select: (cols: string) => {
              selectCallsByTable[table].push(cols)
              return {
                in: async () => ({
                  data: [{ user_id: 'athlete-1', onboarding_completed_at: '2026-10-01T10:00:00Z' }],
                  error: null,
                }),
              }
            },
          }
        }

        if (table === 'weekly_checkins') {
          return {
            select: (cols: string) => {
              selectCallsByTable[table].push(cols)
              return {
                in: () => ({
                  order: async () => ({
                    data: [
                      { user_id: 'athlete-1', created_at: '2026-11-14T08:00:00Z' },
                      { user_id: 'athlete-1', created_at: '2026-11-07T08:00:00Z' },
                    ],
                    error: null,
                  }),
                }),
              }
            },
          }
        }

        return {}
      },
    })

    const req = new NextRequest('http://localhost:3000/api/coach/clients?status=paused')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    // Verify nonexistent client_packages.is_active column is never queried
    expect(eqCallsByTable.client_packages).toEqual([])
    expect(selectCallsByTable.client_packages[0]).toContain('expires_at')
    expect(eqCallsByTable.clients).toContainEqual(['designated_coach_id', 'coach-123'])
    expect(eqCallsByTable.clients).toContainEqual(['status', 'paused'])

    const json = await res.json()
    expect(json.clients).toHaveLength(2)
    expect(json.clients[0].sessions_remaining).toBe(10) // 6 + 4 unexpired; 9 expired ignored
    expect(json.clients[0].last_checkin_date).toBe('2026-11-14T08:00:00Z')
    expect(json.clients[1].sessions_remaining).toBe(0)
  })
})
