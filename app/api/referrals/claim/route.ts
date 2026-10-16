import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateReferralCode, normalizeReferralCode, recordReferralClick } from '@/lib/referrals'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawCode = typeof body?.code === 'string' ? body.code : ''
    const normalized = normalizeReferralCode(rawCode)

    if (!normalized) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const result = await validateReferralCode(admin, normalized)

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error || 'Invalid or expired referral code',
        },
        { status: 404 }
      )
    }

    // Record click
    await recordReferralClick(admin, normalized)

    const response = NextResponse.json({
      valid: true,
      code: result.code,
      referrerName: result.referrerName,
      refereeDiscountCents: result.refereeDiscountCents,
      refereeTrialDays: result.refereeTrialDays,
      headline: '30-Day Extended VIP Pass Unlocked',
    })

    // Store referral attribution cookie for 30 days
    response.cookies.set('forge_referral_code', result.code!, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate referral code'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
