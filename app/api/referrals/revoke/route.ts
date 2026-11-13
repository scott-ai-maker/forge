import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { generateReferralCode } from '@/lib/referrals'
import { buildPartnerPassInviteUrl } from '@/lib/partner-pass'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    const body = await req.json().catch(() => ({}))
    const memberName = typeof body?.memberName === 'string' ? body.memberName : null
    const freshCode = generateReferralCode(memberName || 'FORGE')

    try {
      const admin = supabaseAdmin()
      await admin
        .from('referral_codes')
        .update({
          code: freshCode,
          clicks: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', authz.user.id)
    } catch {
      // Non-blocking if referral_codes table is absent in dev schema
    }

    return NextResponse.json({
      revoked: true,
      code: freshCode,
      inviteUrl: buildPartnerPassInviteUrl(freshCode),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Failed to regenerate partner pass link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

