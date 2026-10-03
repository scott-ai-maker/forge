import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireRoleMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireRole: requireRoleMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET } from '@/app/api/sessions/available/route'
import { AuthzError } from '@/lib/authz'

describe('GET /api/sessions/available', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client' },
    })
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              lte: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    })
  })

  it('rejects unauthenticated requests', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost/api/sessions/available')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('allows client and returns slots', async () => {
    const req = new NextRequest('http://localhost/api/sessions/available')
    const res = await GET(req)
    expect(requireRoleMock).toHaveBeenCalledWith('client', ['client', 'coach'])
    expect(res.status).toBe(200)
    const slots = await res.json()
    expect(Array.isArray(slots)).toBe(true)
  })

  it('allows coach and returns slots', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { role: 'coach' },
    })
    const req = new NextRequest('http://localhost/api/sessions/available')
    const res = await GET(req)
    expect(requireRoleMock).toHaveBeenCalledWith('coach', ['client', 'coach'])
    expect(res.status).toBe(200)
    const slots = await res.json()
    expect(Array.isArray(slots)).toBe(true)
  })
})

