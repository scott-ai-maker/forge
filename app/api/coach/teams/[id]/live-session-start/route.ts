import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { dispatchTeamLiveSessionAlert } from '@/lib/teams'

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
    return NextResponse.json({ error: message }, { status })
  }

  if (authz.client.role !== 'coach') {
    return NextResponse.json({ error: 'Only assigned coaches can initiate live session alerts.' }, { status: 403 })
  }

  const { id: teamId } = await context.params

  try {
    const result = await dispatchTeamLiveSessionAlert(teamId, authz.user.id)
    return NextResponse.json({
      success: true,
      notifiedCount: result.notifiedCount,
      teamName: result.teamName,
      message: `Alert dispatched to ${result.notifiedCount} team members of ${result.teamName}.`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to dispatch team alert'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
