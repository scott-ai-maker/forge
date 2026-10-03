import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { generateVitalLinkToken } from '@/lib/vital-health-bridge'
import { WearableProvider } from '@/lib/wearables-telemetry'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    const userId = authz.user.id

    const body = await req.json().catch(() => ({}))
    const provider: WearableProvider = body.provider === 'google_fit' ? 'google_fit' : 'apple_health'

    const linkInfo = await generateVitalLinkToken(userId, provider)

    // Also mark as primary source in fitness_profiles
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const admin = supabaseAdmin()
      await admin
        .from('fitness_profiles')
        .update({
          primary_telemetry_source: provider,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } catch (dbErr) {
      console.warn('[wearables/vital/link] Profile update notice:', dbErr)
    }

    return NextResponse.json({
      success: true,
      ...linkInfo,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Failed generating Vital connection link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

