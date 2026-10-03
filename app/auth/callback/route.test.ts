import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  exchangeCodeForSessionMock,
  verifyOtpMock,
  getUserMock,
  supabaseAdminMock,
  adminFromMock,
  adminUpdateUserByIdMock,
} = vi.hoisted(() => {
  return {
    exchangeCodeForSessionMock: vi.fn(),
    verifyOtpMock: vi.fn(),
    getUserMock: vi.fn(),
    supabaseAdminMock: vi.fn(),
    adminFromMock: vi.fn(),
    adminUpdateUserByIdMock: vi.fn(),
  }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      verifyOtp: verifyOtpMock,
      getUser: getUserMock,
    },
  })),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET } from '@/app/auth/callback/route'

describe('GET /auth/callback (OAuth & PKCE flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'

    adminUpdateUserByIdMock.mockResolvedValue({ data: {}, error: null })
    supabaseAdminMock.mockReturnValue({
      from: adminFromMock,
      auth: {
        admin: {
          updateUserById: adminUpdateUserByIdMock,
        },
      },
    })
  })

  it('redirects to /auth/login with error message when OAuth provider returns error params', async () => {
    const req = new NextRequest(
      'https://example.com/auth/callback?error=access_denied&error_description=User+cancelled+sign+in'
    )
    const res = await GET(req)

    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/auth/login')
    expect(location.searchParams.get('error')).toBe('User cancelled sign in')
  })

  it('redirects to /auth/login when code exchange fails', async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({
      error: { message: 'Invalid or expired auth code' },
    })

    const req = new NextRequest('https://example.com/auth/callback?code=bad-code&next=/dashboard')
    const res = await GET(req)

    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/auth/login')
    expect(location.searchParams.get('error')).toBe('Invalid or expired auth code')
    expect(location.searchParams.get('next')).toBe('/dashboard')
  })

  it('successfully exchanges code, auto-provisions client profile, and redirects to /dashboard', async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({ error: null })
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'client-uuid-1',
          email: 'client@example.com',
          user_metadata: {
            full_name: 'Jane Doe',
            surface_role: 'client',
          },
        },
      },
    })

    const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }), // No existing profile
            }),
          }),
          upsert: upsertMock,
        }
      }
      return {}
    })

    const req = new NextRequest('https://example.com/auth/callback?code=valid-code')
    const res = await GET(req)

    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/dashboard')
    expect(upsertMock).toHaveBeenCalledWith(
      {
        id: 'client-uuid-1',
        email: 'client@example.com',
        full_name: 'Jane Doe',
        avatar_path: null,
        role: 'client',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  })

  it('redirects coach users to /coach when target is default /dashboard', async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({ error: null })
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'coach-uuid-1',
          email: 'coach@example.com',
          user_metadata: {
            full_name: 'Scott Gordon',
            surface_role: 'coach',
          },
        },
      },
    })

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'coach-uuid-1',
                  role: 'coach',
                  avatar_path: null,
                },
              }),
            }),
          }),
          update: updateMock,
        }
      }
      return {}
    })

    const req = new NextRequest('https://example.com/auth/callback?code=valid-coach-code')
    const res = await GET(req)

    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/coach')
  })

  it('attaches designated_coach_id when valid coach referral param is passed', async () => {
    exchangeCodeForSessionMock.mockResolvedValueOnce({ error: null })
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'client-uuid-2',
          email: 'referred@example.com',
          user_metadata: {
            name: 'Referred Client',
          },
        },
      },
    })

    const coachId = 'a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab'
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })

    adminFromMock.mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          select: () => ({
            eq: (col: string, val: string) => {
              if (col === 'id' && val === 'client-uuid-2') {
                return {
                  maybeSingle: async () => ({ data: null }),
                }
              }
              if (col === 'id' && val === coachId) {
                return {
                  eq: () => ({
                    maybeSingle: async () => ({ data: { id: coachId } }),
                  }),
                }
              }
              return { maybeSingle: async () => ({ data: null }) }
            },
          }),
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          update: updateMock,
        }
      }
      return {}
    })

    const req = new NextRequest(
      `https://example.com/auth/callback?code=valid-code&coach=${coachId}`
    )
    const res = await GET(req)

    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/dashboard')
    expect(updateMock).toHaveBeenCalledWith({ designated_coach_id: coachId })
  })
})
