import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { syncDatabasePersonalRecordsForExercises } from '@/lib/sync-personal-records'
import { toValidUuidOrNull } from '@/lib/uuid-utils'

export async function POST(req: NextRequest) {
  let userId: string
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
  const workoutDay = Number(body.workoutDay)
  const sessionDate = body.sessionDate ? String(body.sessionDate).trim() : null
  const validPlanId = toValidUuidOrNull(body.workoutPlanId)

  const admin = supabaseAdmin()

  // 1. Locate unfinalized sets (workout_log_id IS NULL)
  let query = admin
    .from('workout_set_logs')
    .select('id, exercise_name')
    .eq('user_id', userId)
    .is('workout_log_id', null)

  if (Number.isFinite(workoutDay) && workoutDay > 0) {
    query = query.like('notes', `%[workout-day:${workoutDay}]%`)
  }

  if (validPlanId) {
    query = query.eq('workout_plan_id', validPlanId)
  }

  if (sessionDate) {
    query = query.eq('session_date', sessionDate)
  }

  const { data: matchingSets, error: fetchErr } = await query

  if (fetchErr) {
    console.error('[workouts/discard-session POST] Fetch error:', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!matchingSets || matchingSets.length === 0) {
    return NextResponse.json({ success: true, deletedCount: 0, message: 'No unfinalized sets to discard' })
  }

  const affectedExercises = [...new Set(matchingSets.map(s => s.exercise_name))]
  const idsToDelete = matchingSets.map(s => s.id)

  // 2. Delete the unfinalized sets
  const { error: deleteErr } = await admin
    .from('workout_set_logs')
    .delete()
    .in('id', idsToDelete)

  if (deleteErr) {
    console.error('[workouts/discard-session POST] Delete error:', deleteErr)
    return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  }

  // 3. Recalculate PRs for all affected exercises
  await syncDatabasePersonalRecordsForExercises(admin, userId, affectedExercises)

  return NextResponse.json({
    success: true,
    deletedCount: idsToDelete.length,
    discardedExercises: affectedExercises,
    message: `Discarded ${idsToDelete.length} unfinalized set(s) and rolled back PRs successfully.`,
  })
}
