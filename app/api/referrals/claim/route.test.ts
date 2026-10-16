import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/referrals/claim/route'

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/referrals', () => ({
  validateReferralCode: vi.fn(),
  normalizeReferralCode: vi.fn((code: string) => code?.trim().toUpperCase() || ''),
  recordReferralClick: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/referrals/claim', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 if code is missing', async () => {
    const req = new NextRequest('https://forgeathletic.com/api/referrals/claim', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Referral code is required')
  })

  it('returns 404 if code is invalid or expired', async () => {
    const { validateReferralCode } = await import('@/lib/referrals')
    vi.mocked(validateReferralCode).mockResolvedValue({
      valid: false,
      refereeDiscountCents: 2000,
      refereeTrialDays: 30,
      error: 'Invalid or expired referral code',
    })

    const req = new NextRequest('https://forgeathletic.com/api/referrals/claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'INVALID' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.valid).toBe(false)
  })

  it('returns 200, offer details, and sets attribution cookie when code is valid', async () => {
    const { validateReferralCode } = await import('@/lib/referrals')
    vi.mocked(validateReferralCode).mockResolvedValue({
      valid: true,
      code: 'SCOTT-7B3K',
      referrerId: 'user-1',
      referrerName: 'Scott Gordon',
      refereeDiscountCents: 2000,
      refereeTrialDays: 30,
    })

    const req = new NextRequest('https://forgeathletic.com/api/referrals/claim', {
      method: 'POST',
      body: JSON.stringify({ code: 'SCOTT-7B3K' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(true)
    expect(json.code).toBe('SCOTT-7B3K')
    expect(json.referrerName).toBe('Scott Gordon')
    expect(json.refereeTrialDays).toBe(30)

    // Verify cookie set
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toBeDefined()
    expect(setCookie).toContain('forge_referral_code=SCOTT-7B3K')
  })
})
