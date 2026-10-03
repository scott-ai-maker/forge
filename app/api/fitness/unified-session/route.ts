import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, requireRole, requireActiveClient, AuthzError } from '@/lib/authz'
import { toValidUuidOrNull } from '@/lib/uuid-utils'

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    requireActiveClient(authz.client)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))

  if (!body.sessionDate || !body.sessionTitle) {
    return NextResponse.json({ error: 'sessionDate and sessionTitle are required' }, { status: 400 })
  }

  const sessionDate = body.sessionDate
  const workoutDay = Number(body.workoutDay) || 1
  const sessionTitle = body.sessionTitle
  const workoutPlanId = toValidUuidOrNull(body.workoutPlanId)
  const _durationMinutes = Number(body.durationMinutes) || 45

  const strengthData = body.strength || {
    completedSets: 0,
    totalVolumeKg: 0,
    totalVolumeLbs: 0,
    exerciseCount: 0,
    avgRpe: 7,
    notes: '',
  }

  const cardioData = body.cardio || null

  const admin = supabaseAdmin()

  // 1. Log the Strength / Primary Workout Day Completion
  const strengthNotes = [
    `[workout-day:${workoutDay}]`,
    `Unified Strength + Cardio Session`,
    `Working Sets: ${strengthData.completedSets}`,
    `Volume: ${Math.round(strengthData.totalVolumeLbs || strengthData.totalVolumeKg * 2.20462)} lbs`,
    cardioData ? `Cardio: Stage ${cardioData.stage} (${cardioData.modality || 'Cardio'}) - ${cardioData.durationMins || 20}m` : '',
    strengthData.notes || '',
  ].filter(Boolean).join(' · ')

  const { data: workoutLog, error: workoutError } = await admin
    .from('workout_logs')
    .insert({
      user_id: userId,
      workout_plan_id: workoutPlanId,
      session_date: sessionDate,
      session_title: sessionTitle,
      completed: true,
      exertion_rpe: strengthData.avgRpe ? Math.round(strengthData.avgRpe) : 7,
      notes: strengthNotes,
    })
    .select('*')
    .single()

  if (workoutError) {
    return NextResponse.json({ error: `Failed to log workout: ${workoutError.message}` }, { status: 500 })
  }

  // 2. Log Cardio Protocol if present
  let cardioLog = null
  if (cardioData && (Number(cardioData.durationMins) > 0 || cardioData.stage)) {
    const rawModality = String(cardioData.modality || 'cardio').toLowerCase()
    let activityType = 'treadmill'
    if (rawModality.includes('row')) activityType = 'rowing-machine'
    else if (rawModality.includes('airbike') || rawModality.includes('assault') || rawModality.includes('echo')) activityType = 'assault-bike'
    else if (rawModality.includes('bike') || rawModality.includes('cycle') || rawModality.includes('spin')) activityType = 'stationary-bike'
    else if (rawModality.includes('stair') || rawModality.includes('step')) activityType = 'stairmaster'
    else if (rawModality.includes('run') || rawModality.includes('sprint')) activityType = 'outdoor-running'
    else if (rawModality.includes('walk') || rawModality.includes('treadmill')) activityType = 'treadmill'
    else if (rawModality.includes('elliptical')) activityType = 'elliptical'
    else activityType = 'other'

    const cardioNotes = [
      `[Day ${workoutDay} Unified Cardio]`,
      `Stage ${cardioData.stage || 1} (${cardioData.modality || 'Cardio'})`,
      cardioData.avgHeartRate ? `Avg HR: ${cardioData.avgHeartRate} BPM` : '',
      cardioData.calories ? `${cardioData.calories} kcal` : '',
    ].filter(Boolean).join(' · ')

    const { data: savedCardio } = await admin
      .from('cardio_logs')
      .insert({
        user_id: userId,
        session_date: sessionDate,
        activity_type: activityType,
        duration_mins: Number(cardioData.durationMins) || 20,
        distance_km: cardioData.distanceKm ? Number(cardioData.distanceKm) : null,
        avg_heart_rate: cardioData.avgHeartRate ? Number(cardioData.avgHeartRate) : null,
        calories: cardioData.calories ? Number(cardioData.calories) : null,
        perceived_effort: cardioData.perceivedEffort ? Number(cardioData.perceivedEffort) : 6,
        notes: cardioNotes,
      })
      .select('*')
      .maybeSingle()

    cardioLog = savedCardio
  }

  return NextResponse.json({
    success: true,
    message: `Unified Strength & Cardio Session logged for Day ${workoutDay} successfully!`,
    workoutLog,
    cardioLog,
  })
}
