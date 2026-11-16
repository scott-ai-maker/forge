import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function POST(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    const userId = authz.user.id

    const { supabaseAdmin } = await import('@/lib/supabase')
    const admin = supabaseAdmin()

    // 1. Unlink primary telemetry source in fitness_profiles
    await admin
      .from('fitness_profiles')
      .update({
        primary_telemetry_source: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return NextResponse.json(
      {
        success: true,
        disconnected: true,
        message: 'Successfully disconnected telemetry single source of truth.',
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE_HEADERS })
    }
    return NextResponse.json({ error: 'Failed disconnecting wearable' }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

