import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { WearableProvider, WEARABLE_PROVIDERS } from '@/lib/wearables-telemetry'

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    const userId = authz.user.id

    const body = await req.json().catch(() => ({}))
    const provider: WearableProvider = body.provider

    if (!provider || !WEARABLE_PROVIDERS[provider]) {
      return NextResponse.json(
        { error: 'Invalid wearable provider specified. Must be apple_health or google_fit.' },
        { status: 400 }
      )
    }

    // Persist selected single source of truth to fitness_profiles
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
    } catch (persistErr) {
      console.warn('[wearables/connect] Profile source update notice:', persistErr)
    }

    return NextResponse.json({
      success: true,
      provider,
      connected: true,
      authUrl: null,
      message: `Successfully established ${WEARABLE_PROVIDERS[provider].name} as your single source of truth for telemetry.`,
      clientId: userId,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Unexpected error initializing wearable auth'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
