import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import {
  loadClientEntitlements,
  resolveClientMembershipState,
  summarizeAllFeatureAccess,
} from '@/lib/addon-entitlements'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
}

export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== 'production'
    const isTestHarness = isDev && (req.headers.get('referer')?.includes('/test-harness/') || false)
    if (isTestHarness) {
      const open = { active: true, expiresAt: null, usesRemaining: null }
      return NextResponse.json(
        {
          tierId: 'coach_support',
          hasActiveMembership: true,
          role: 'coach',
          allowQaPreview: true,
          features: { 'video-review': open, nutrition: open, travel: open },
        },
        { headers: NO_STORE_HEADERS }
      )
    }

    const authz = await getRequestAuthz(req)

    // Coaches use every feature for client work and may use the QA Tier Preview Switcher.
    if (authz.client.role === 'coach') {
      const open = { active: true, expiresAt: null, usesRemaining: null }
      return NextResponse.json(
        {
          tierId: 'coach_support',
          hasActiveMembership: true,
          role: 'coach',
          allowQaPreview: true,
          features: { 'video-review': open, nutrition: open, travel: open },
        },
        { headers: NO_STORE_HEADERS }
      )
    }

    const rows = await loadClientEntitlements(authz.user.id)
    const { tierId, hasActiveMembership } = await resolveClientMembershipState(authz.user.id, rows)
    return NextResponse.json(
      {
        tierId,
        hasActiveMembership,
        role: 'client',
        allowQaPreview: isDev,
        features: summarizeAllFeatureAccess(rows),
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: NO_STORE_HEADERS }
      )
    }
    const message = error instanceof Error ? error.message : 'Failed to load entitlements'
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
