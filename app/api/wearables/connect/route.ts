import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { WearableProvider, WEARABLE_PROVIDERS } from '@/lib/wearables-telemetry'
import { generateUserScopedWearableToken } from '@/lib/wearable-webhook-adapters'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    const userId = authz.user.id

    const parsed = await req.json().catch(() => null)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'Invalid wearable provider payload.' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }
    const body = parsed as Record<string, unknown>
    const provider = body.provider as WearableProvider

    if (!provider || !WEARABLE_PROVIDERS[provider]) {
      return NextResponse.json(
        { error: 'Invalid wearable provider specified. Must be apple_health or google_fit.' },
        { status: 400, headers: NO_STORE_HEADERS }
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

    const masterSecret =
      provider === 'google_fit'
        ? process.env.GOOGLE_HEALTH_WEBHOOK_SECRET?.trim()
        : process.env.APPLE_HEALTH_WEBHOOK_SECRET?.trim()
    const syncToken = masterSecret
      ? generateUserScopedWearableToken(userId, provider, masterSecret)
      : undefined

    return NextResponse.json(
      {
        success: true,
        provider,
        connected: true,
        authUrl: null,
        ...(syncToken ? { syncToken } : {}),
        message: `Successfully established ${WEARABLE_PROVIDERS[provider].name} as your single source of truth for telemetry.`,
        clientId: userId,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE_HEADERS })
    }
    return NextResponse.json({ error: 'Unexpected error initializing wearable auth' }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
