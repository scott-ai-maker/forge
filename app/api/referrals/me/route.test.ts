import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/referrals/me/route'
import { AuthzError } from '@/lib/authz'

vi.mock('@/lib/authz', () => ({
  getRequestAuthz: vi.fn(),
  AuthzError: class AuthzError extends Error {
    status: number
    constructor(msg: string, status = 403) {
      super(msg)
      this.status = status
    }
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/referrals', () => ({
  getClientReferralDashboard: vi.fn(),
}))

describe('GET /api/referrals/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401/403 if unauthorized', async () => {
    const { getRequestAuthz } = await import('@/lib/authz')
    vi.mocked(getRequestAuthz).mockRejectedValue(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('https://forgeathletic.com/api/referrals/me')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns dashboard data for authenticated user', async () => {
    const { getRequestAuthz } = await import('@/lib/authz')
    const { getClientReferralDashboard } = await import('@/lib/referrals')

    vi.mocked(getRequestAuthz).mockResolvedValue({
      user: { id: 'user-123' },
      client: { role: 'client' },
    } as any)

    vi.mocked(getClientReferralDashboard).mockResolvedValue({
      code: 'SCOTT-7B3K',
      shareUrl: 'https://forgeathletic.com/r/SCOTT-7B3K',
      clicks: 12,
      signupsCount: 3,
      conversionsCount: 1,
      totalRewardsEarnedCents: 2000,
      availableBalanceCents: 2000,
      refereeDiscountCents: 2000,
      refereeTrialDays: 30,
      milestones: {
        currentTier: { level: 1, name: 'Recruit' } as any,
        nextTier: { level: 2, name: 'Lead Athlete' } as any,
        progressToNext: 0,
        allTiers: [],
      },
      history: [],
      rewards: [],
    })

    const req = new NextRequest('https://forgeathletic.com/api/referrals/me')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.code).toBe('SCOTT-7B3K')
    expect(json.conversionsCount).toBe(1)
    expect(json.totalRewardsEarnedCents).toBe(2000)
  })
})
