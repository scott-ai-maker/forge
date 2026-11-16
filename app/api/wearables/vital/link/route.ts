import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { generateVitalLinkToken } from '@/lib/vital-health-bridge'
import { WearableProvider, WEARABLE_PROVIDERS } from '@/lib/wearables-telemetry'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    const userId = authz.user.id

    const parsed = await req.json().catch(() => ({}))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    const body = parsed as Record<string, unknown>
    if (body.provider !== undefined && !WEARABLE_PROVIDERS[body.provider as WearableProvider]) {
      return NextResponse.json(
        { error: 'Invalid wearable provider specified. Must be apple_health or google_fit.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
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

    return NextResponse.json(
      {
        success: true,
        ...linkInfo,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE_HEADERS })
    }
    return NextResponse.json({ error: 'Failed generating Vital connection link' }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

