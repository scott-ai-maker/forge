import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  signInWithPasswordMock,
  listUsersMock,
  createUserMock,
  updateUserByIdMock,
  enforceRateLimitMock,
} = vi.hoisted(() => ({
  signInWithPasswordMock: vi.fn(),
  listUsersMock: vi.fn(),
  createUserMock: vi.fn(),
  updateUserByIdMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
  })),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    auth: {
      admin: {
        listUsers: listUsersMock,
        createUser: createUserMock,
        updateUserById: updateUserByIdMock,
      },
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: 'plan-1' }], error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: enforceRateLimitMock,
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

import { GET } from './route'

describe('GET /api/auth/demo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    enforceRateLimitMock.mockResolvedValue({ allowed: true, remaining: 10 })
    listUsersMock.mockResolvedValue({ data: { users: [{ id: 'user-demo-1', email: 'vip.athlete@gordonathleticadvisory.com' }] }, error: null })
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: 'user-demo-1' } }, error: null })
  })

  it('blocks demo login in production when ENABLE_DEMO_LOGIN is not enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.ENABLE_DEMO_LOGIN

    const req = new NextRequest('http://localhost:3000/api/auth/demo')
    const res = await GET(req)

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('disabled in this environment')

    vi.unstubAllEnvs()
  })

  it('allows demo login in production when ENABLE_DEMO_LOGIN=true', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ENABLE_DEMO_LOGIN', 'true')

    const req = new NextRequest('http://localhost:3000/api/auth/demo')
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/dashboard/fitness?workspace=train')

    vi.unstubAllEnvs()
  })

  it('allows coach demo login when role=coach is requested even in production without ENABLE_DEMO_LOGIN', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.ENABLE_DEMO_LOGIN

    listUsersMock.mockResolvedValueOnce({
      data: { users: [{ id: 'coach-demo-1', email: 'scott.gordon72@outlook.com' }] },
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/api/auth/demo?role=coach')
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/coach')

    vi.unstubAllEnvs()
  })

  it('rejects when rate limit is exceeded', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    enforceRateLimitMock.mockResolvedValueOnce({ allowed: false, remaining: 0 })

    const req = new NextRequest('http://localhost:3000/api/auth/demo')
    const res = await GET(req)

    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toContain('Too many demo login requests')

    vi.unstubAllEnvs()
  })
})
