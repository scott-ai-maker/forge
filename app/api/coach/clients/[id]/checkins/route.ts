import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyUser } from '@/lib/notifications'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let coachId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id: clientId } = await params

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('weekly_checkins')
    .select('*')
    .eq('user_id', clientId)
    .order('week_start', { ascending: false })
    .limit(24)

  if (error) {
    return NextResponse.json({ error: 'Failed to load check-ins' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json({ checkins: data ?? [] }, { headers: NO_STORE_HEADERS })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let coachId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id: clientId } = await params
  const body = await req.json()

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const checkinId = String(body.checkin_id ?? '').trim()
  if (!checkinId) {
    return NextResponse.json({ error: 'checkin_id required' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const patch: { coach_feedback?: string; coach_rating_adjustment?: number | null } = {}

  if (body.coach_feedback !== undefined) {
    patch.coach_feedback = String(body.coach_feedback).trim()
  }

  if (body.coach_rating_adjustment !== undefined) {
    const adj = body.coach_rating_adjustment === null ? null : Number(body.coach_rating_adjustment)
    patch.coach_rating_adjustment = adj
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('weekly_checkins')
    .update(patch)
    .eq('id', checkinId)
    .eq('user_id', clientId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update check-in' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  if (patch.coach_feedback) {
    void notifyUser({
      userId: clientId,
      type: 'coach_feedback',
      title: 'Coach feedback posted',
      body: 'Coach Gordon posted feedback on your weekly check-in. Sign in to view.',
      data: { checkinId },
    }).catch(() => undefined)
  }

  return NextResponse.json(data, { headers: NO_STORE_HEADERS })
}
