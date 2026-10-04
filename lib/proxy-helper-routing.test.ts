import { describe, it, expect, vi, beforeEach } from 'vitest'
import { proxy } from '../proxy'
import { NextRequest } from 'next/server'
import * as ssr from '@supabase/ssr'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

describe('proxy - In-Gym Helper App & Telemetry Decoupling', () => {
  const mockGetUser = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'

    vi.mocked(ssr.createServerClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    } as unknown as ReturnType<typeof ssr.createServerClient>)
  })

  it('allows standard web browser requests to root / to view marketing homepage', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://127.0.0.1:3000/')
    const res = await proxy(req)

    // Should not redirect standard web request
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows standard web requests with a helper-mode cookie to view marketing homepage', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://127.0.0.1:3000/', {
      headers: { cookie: 'gaa_helper_mode=1' },
    })
    const res = await proxy(req)

    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects helper app request (Capacitor header) at root / to companion login when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://127.0.0.1:3000/', {
      headers: { 'x-capacitor-platform': 'ios' },
    })
    const res = await proxy(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toContain('/auth/login')
    expect(location).toContain('mode=companion')
    expect(location).toContain('next=%2Fdashboard%2Ffitness')
  })

  it('redirects helper app request (source=pwa query) at root / to companion login when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://127.0.0.1:3000/?source=pwa')
    const res = await proxy(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toContain('/auth/login')
    expect(location).toContain('mode=companion')
  })

  it('redirects helper app request at root / to fitness lab when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'test-athlete', user_metadata: {} },
      },
    })
    const req = new NextRequest('http://127.0.0.1:3000/?mode=companion')
    const res = await proxy(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toContain('/dashboard/fitness')
    expect(location).toContain('source=helper')
  })

  it('redirects unauthenticated helper app dashboard access to companion login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://127.0.0.1:3000/dashboard/fitness', {
      headers: { 'x-companion-mode': 'true' },
    })
    const res = await proxy(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toContain('/auth/login')
    expect(location).toContain('mode=companion')
  })
})
