import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { toValidUuidOrNull } from '@/lib/uuid-utils'

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const rawPlanId = req.nextUrl.searchParams.get('planId')
  const planId = toValidUuidOrNull(rawPlanId)

  let query = supabaseAdmin()
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(50)

  if (planId) {
    query = query.eq('workout_plan_id', planId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[workouts/log GET] Query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))

  const sessionDate = String(body.sessionDate ?? '').trim() || new Date().toISOString().split('T')[0]
  const sessionTitle = String(body.sessionTitle ?? '').trim()

  if (!sessionTitle) {
    return NextResponse.json({ error: 'sessionTitle is required' }, { status: 400 })
  }

  const validPlanId = toValidUuidOrNull(body.workoutPlanId)

  const insertPayload = {
    user_id: userId,
    workout_plan_id: validPlanId,
    session_date: sessionDate,
    session_title: sessionTitle,
    completed: Boolean(body.completed),
    exertion_rpe: body.exertionRpe ? Number(body.exertionRpe) : null,
    notes: body.notes ? String(body.notes).trim() : null,
  }

  const { data, error } = await supabaseAdmin()
    .from('workout_logs')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    console.error('[workouts/log POST] Insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, log: data })
}

