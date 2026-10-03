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
  const sessionDate = req.nextUrl.searchParams.get('sessionDate')
  const exerciseName = req.nextUrl.searchParams.get('exerciseName')

  let query = supabaseAdmin()
    .from('workout_set_logs')
    .select('*')
    .eq('user_id', userId)

  if (planId) query = query.eq('workout_plan_id', planId)
  if (sessionDate) query = query.eq('session_date', sessionDate)
  if (exerciseName) query = query.eq('exercise_name', exerciseName.trim())

  const finalQuery = query
    .order('session_date', { ascending: false })
    .order('set_number', { ascending: true })
    .limit(exerciseName ? 50 : 200)

  const { data, error } = await finalQuery
  if (error) {
    console.error('[workouts/log-set GET] Query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ setLogs: data ?? [] })
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

  const exerciseName = String(body.exerciseName ?? '').trim()
  if (!exerciseName) {
    return NextResponse.json({ error: 'exerciseName is required' }, { status: 400 })
  }

  const reps = Number(body.reps)
  if (!Number.isFinite(reps) || reps <= 0) {
    return NextResponse.json({ error: 'reps must be a positive number' }, { status: 400 })
  }

  const sessionDate = String(body.sessionDate ?? '').trim() || new Date().toISOString().split('T')[0]
  const validPlanId = toValidUuidOrNull(body.workoutPlanId)
  const validLogId = toValidUuidOrNull(body.workoutLogId)

  const payload = {
    user_id: userId,
    workout_log_id: validLogId,
    workout_plan_id: validPlanId,
    session_date: sessionDate,
    exercise_name: exerciseName,
    set_number: body.setNumber != null && !isNaN(Number(body.setNumber)) ? Number(body.setNumber) : null,
    reps: Math.round(reps),
    weight_kg: body.weightKg != null && !isNaN(Number(body.weightKg)) ? Number(body.weightKg) : null,
    rest_seconds: body.restSeconds != null && !isNaN(Number(body.restSeconds)) ? Number(body.restSeconds) : null,
    rpe: body.rpe != null && !isNaN(Number(body.rpe)) ? Number(body.rpe) : null,
    rir: body.rir != null && !isNaN(Number(body.rir)) ? Number(body.rir) : null,
    tempo: body.tempo ? String(body.tempo).trim() : null,
    is_warmup: Boolean(body.isWarmup),
    notes: body.notes ? String(body.notes).trim() : null,
  }

  const { data, error } = await supabaseAdmin()
    .from('workout_set_logs')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('[workouts/log-set POST] Insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, setLog: data, record: data })
}
