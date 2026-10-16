import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { getClientReferralDashboard } from '@/lib/referrals'
import { getTrustedAppBaseUrl } from '@/lib/app-base-url'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    const admin = supabaseAdmin()

    let baseUrl = 'https://forgeathletic.com'
    try {
      baseUrl = getTrustedAppBaseUrl()
    } catch {
      // fallback default
    }

    const data = await getClientReferralDashboard(admin, authz.user.id, baseUrl)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch referral profile'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
