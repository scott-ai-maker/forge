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

  it('keeps public /auth/signup gated pre-launch while allowing public browsing of splash-linked pages (/packages, /corporate, /audit) and preserving ?next=/coach', async () => {
    delete process.env.NEXT_PUBLIC_SITE_UNMASKED
    delete process.env.ALLOW_PRELAUNCH_PUBLIC_SIGNUP
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const signupRes = await proxy(new NextRequest('http://127.0.0.1:3000/auth/signup'))
    expect(signupRes.status).toBe(307)
    expect(signupRes.headers.get('location')).toContain('/?waitlist=prelaunch')

    // Public informational routes linked from the Founding Cohort splash screen remain browsable
    // (Stripe checkout itself stays locked server-side in /api/stripe/checkout)
    for (const publicPath of ['/packages', '/corporate', '/corporate/proposal', '/audit', '/apply', '/credentials', '/apps']) {
      const res = await proxy(new NextRequest(`http://127.0.0.1:3000${publicPath}`))
      expect(res.headers.get('location')).toBeNull()
    }

    // Coach-invite link remains accessible for controlled pre-launch testing
    const invitedRes = await proxy(
      new NextRequest('http://127.0.0.1:3000/auth/signup?coach=123e4567-e89b-12d3-a456-426614174000')
    )
    expect(invitedRes.headers.get('location')).toBeNull()

    // Unauthenticated /coach redirects to Coach Login with ?next=/coach preserved
    const coachRes = await proxy(new NextRequest('http://127.0.0.1:3000/coach'))
    expect(coachRes.status).toBe(307)
    expect(coachRes.headers.get('location')).toContain('/auth/login?next=%2Fcoach')

    // Master Coach bypasses pre-launch public lockdown on /async-coaching
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'coach-1', email: 'coach@forge-athletic.app', user_metadata: {} } },
    })
    const coachBypassRes = await proxy(new NextRequest('http://127.0.0.1:3000/async-coaching'))
    expect(coachBypassRes.headers.get('location')).toBeNull()
  })
})
