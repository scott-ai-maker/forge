import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { dispatchTeamLiveSessionAlert } from '@/lib/teams-server'
import { enforceRateLimit } from '@/lib/rate-limit'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let authz
  try {
    authz = await getRequestAuthz(req)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  if (authz.client.role !== 'coach') {
    return NextResponse.json(
      { error: 'Only assigned coaches can initiate live session alerts.' },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  const { id: teamId } = await context.params

  const rl = await enforceRateLimit({
    key: `team-live-start:${authz.user.id}:${teamId}`,
    limit: 10,
    windowSeconds: 300,
    route: '/api/coach/teams/[id]/live-session-start',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many team live session alerts sent recently. Please wait a few minutes.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  try {
    const result = await dispatchTeamLiveSessionAlert(teamId, authz.user.id, authz.user.email)
    const holdSuffix =
      result.skippedMedicalHoldCount > 0
        ? ` (${result.skippedMedicalHoldCount} skipped due to Phase 0 medical clearance hold)`
        : ''

    return NextResponse.json(
      {
        success: true,
        notifiedCount: result.notifiedCount,
        skippedMedicalHoldCount: result.skippedMedicalHoldCount,
        teamName: result.teamName,
        message: `Alert dispatched to ${result.notifiedCount} team member(s) of ${result.teamName}${holdSuffix}.`,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (err) {
    const status = err instanceof AuthzError ? err.status : 500
    const message = err instanceof Error ? err.message : 'Failed to dispatch team alert'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }
}
