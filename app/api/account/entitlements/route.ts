import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { loadClientEntitlements, summarizeAllFeatureAccess } from '@/lib/addon-entitlements'

export async function GET(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)

    // Coaches use every feature for client work, so they are never gated.
    if (authz.client.role === 'coach') {
      const open = { active: true, expiresAt: null, usesRemaining: null }
      return NextResponse.json({ features: { 'video-review': open, nutrition: open, travel: open } })
    }

    const rows = await loadClientEntitlements(authz.user.id)
    return NextResponse.json({ features: summarizeAllFeatureAccess(rows) })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Failed to load entitlements'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
