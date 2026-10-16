import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { recordReferralClick } from '@/lib/referrals'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const code = typeof body?.code === 'string' ? body.code : ''

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    await recordReferralClick(admin, code)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed tracking click'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
