import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'

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

    return NextResponse.json({
      success: true,
      disconnected: true,
      message: 'Successfully disconnected telemetry single source of truth.',
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Failed disconnecting wearable'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

