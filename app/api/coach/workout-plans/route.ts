import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireCoachAssignedClient, requireRole, AuthzError } from '@/lib/authz'
import {
  buildPlanName,
  buildStoredProgramPlan,
  type CoachProgramPayload,
  type EquipmentLibraryRecord,
  type ExerciseLibraryRecord,
} from '@/lib/coach-programs'
import { supabaseAdmin } from '@/lib/supabase'

const OFFICIAL_EXERCISE_SOURCES = ['nasm_exercise_library', 'licensed_import']

function parsePayload(body: Record<string, unknown>): CoachProgramPayload | null {
  const workouts = Array.isArray(body.workouts) ? body.workouts : []
  const name = String(body.name ?? '').trim()
  const phaseName = String(body.phaseName ?? '').trim()
  const clientId = String(body.clientId ?? '').trim()
  const nasmOptPhase = Number(body.nasmOptPhase)
  const sessionsPerWeek = Number(body.sessionsPerWeek)
  const estimatedDurationMins = Number(body.estimatedDurationMins)

  if (!clientId || !phaseName || !Number.isFinite(nasmOptPhase) || !Number.isFinite(sessionsPerWeek) || !Number.isFinite(estimatedDurationMins)) {
    return null
  }

  return {
    clientId,
    name,
    goal: String(body.goal ?? '').trim() || null,
    nasmOptPhase,
    phaseName,
    sessionsPerWeek,
    estimatedDurationMins,
    startDate: String(body.startDate ?? '').trim() || null,
    templateId: String(body.templateId ?? '').trim() || null,
    workouts,
  }
}

export async function GET(req: NextRequest) {
  let coachId = ''

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const url = new URL(req.url)
  const clientId = String(url.searchParams.get('clientId') ?? '').trim()

  if (!clientId) {
    return NextResponse.json({ error: 'clientId query parameter is required.' }, { status: 400 })
  }

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('workout_plans')
    .select('id, name, goal, nasm_opt_phase, phase_name, sessions_per_week, estimated_duration_mins, plan_json, created_at')
    .eq('user_id', clientId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ plans: data ?? [] })
}

export async function POST(req: NextRequest) {
  let coachId = ''

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))
  const payload = parsePayload(body)
  const shouldOverwrite = Boolean(body.overwrite)
  const targetPlanId = String(body.targetPlanId ?? '').trim() || null

  if (!payload) {
    return NextResponse.json({ error: 'Invalid workout plan payload.' }, { status: 400 })
  }

  if (!Array.isArray(payload.workouts) || payload.workouts.length === 0) {
    return NextResponse.json({ error: 'Add at least one training day.' }, { status: 400 })
  }

  try {
    await requireCoachAssignedClient(coachId, payload.clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  const exerciseIds = payload.workouts.flatMap(workout =>
    Array.isArray(workout.exercises)
      ? workout.exercises
          .map(exercise => String(exercise.libraryExerciseId ?? '').trim())
          .filter(Boolean)
      : []
  )

  const exerciseNames = payload.workouts.flatMap(workout =>
    Array.isArray(workout.exercises)
      ? workout.exercises
          .map(exercise => String(exercise.name ?? '').trim())
          .filter(Boolean)
      : []
  )

  const [{ data: exercisesById }, { data: exercisesByName }, { data: equipmentData }] = await Promise.all([
    exerciseIds.length
      ? admin
          .from('exercise_library_entries')
          .select('id, name, slug, description, coaching_cues, primary_equipment, media_image_url, media_video_url, open_externally_only')
          .eq('is_active', true)
          .in('source', OFFICIAL_EXERCISE_SOURCES)
          .in('id', exerciseIds)
      : Promise.resolve({ data: [] as ExerciseLibraryRecord[] }),
    exerciseNames.length
      ? admin
          .from('exercise_library_entries')
          .select('id, name, slug, description, coaching_cues, primary_equipment, media_image_url, media_video_url, open_externally_only')
          .eq('is_active', true)
          .in('source', OFFICIAL_EXERCISE_SOURCES)
          .in('name', exerciseNames)
      : Promise.resolve({ data: [] as ExerciseLibraryRecord[] }),
    admin
      .from('equipment_library_entries')
      .select('id, name, slug, description, media_image_url')
      .eq('is_active', true)
      .in('source', OFFICIAL_EXERCISE_SOURCES),
  ])

  const exerciseMap = new Map<string, ExerciseLibraryRecord>()
  for (const exercise of [...(exercisesById ?? []), ...(exercisesByName ?? [])] as ExerciseLibraryRecord[]) {
    exerciseMap.set(exercise.id, exercise)
  }

  const storedPlan = buildStoredProgramPlan(
    payload,
    [...exerciseMap.values()],
    (equipmentData ?? []) as EquipmentLibraryRecord[]
  )

  if (storedPlan.workouts.length === 0) {
    return NextResponse.json({ error: 'Add at least one exercise to a training day.' }, { status: 400 })
  }

  // Check for existing plan to preserve periodization or merge
  let existingPlanJson: Record<string, unknown> | null = null
  let latestExistingId: string | null = targetPlanId

  try {
    if (shouldOverwrite || latestExistingId) {
      const { data: plans } = await admin
        .from('workout_plans')
        .select('id, plan_json')
        .eq('user_id', payload.clientId)
        .order('created_at', { ascending: false })
        .limit(5)

      const planList = (plans ?? []) as Array<{ id: string; plan_json?: unknown }>
      const existingPlan = latestExistingId
        ? planList.find(p => p.id === latestExistingId)
        : planList[0]

      if (existingPlan) {
        latestExistingId = latestExistingId || existingPlan.id
        if (typeof existingPlan.plan_json === 'object' && existingPlan.plan_json) {
          existingPlanJson = existingPlan.plan_json as Record<string, unknown>
        }
      }
    }
  } catch {
    // Fallback gracefully in testing/mocking environments
  }

  const row = {
    user_id: payload.clientId,
    name: buildPlanName(payload),
    goal: payload.goal,
    nasm_opt_phase: Math.max(1, Math.min(5, Number(payload.nasmOptPhase))),
    phase_name: payload.phaseName,
    sessions_per_week: Math.max(1, Math.min(7, Number(payload.sessionsPerWeek))),
    estimated_duration_mins: Math.max(15, Math.min(240, Number(payload.estimatedDurationMins))),
    plan_json: {
      ...(existingPlanJson?.periodizationPlan ? { periodizationPlan: existingPlanJson.periodizationPlan } : {}),
      ...(existingPlanJson?.embeddedCEx ? { embeddedCEx: existingPlanJson.embeddedCEx } : {}),
      ...(existingPlanJson?.clinicalRationale ? { clinicalRationale: existingPlanJson.clinicalRationale } : {}),
      ...storedPlan,
      sessions: storedPlan.workouts,
      generatedByCoachId: coachId,
      generatedBy: 'coach',
      overwrittenAt: (latestExistingId || shouldOverwrite) ? new Date().toISOString() : undefined,
    },
  }

  let data: Record<string, unknown> | null = null
  let isOverwritten = false

  if (latestExistingId) {
    const { data: updated, error: updateErr } = await admin
      .from('workout_plans')
      .update(row)
      .eq('id', latestExistingId)
      .eq('user_id', payload.clientId)
      .select('*')
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }
    data = updated
    isOverwritten = true
  } else {
    const { data: inserted, error: insertErr } = await admin
      .from('workout_plans')
      .insert(row)
      .select('*')
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
    data = inserted
  }

  if (!data) {
    return NextResponse.json({ error: 'Failed to process workout plan.' }, { status: 500 })
  }

  // Automatically post an update notification to the client's concierge message thread
  const planName = data.name || `${data.phase_name} Protocol`
  const messageBody = isOverwritten
    ? `Protocol Calibrated & Overwritten: I've updated and overwritten your active training protocol with **${planName}** (Phase ${data.nasm_opt_phase}: ${data.phase_name} · ${data.sessions_per_week} days/week). Your Fitness Lab is synchronized and ready!`
    : `Protocol Update: I've assigned a new training protocol **${planName}** (Phase ${data.nasm_opt_phase}: ${data.phase_name} · ${data.sessions_per_week} days/week). Your Fitness Lab is synchronized and ready!`

  await admin.from('coach_client_messages').insert({
    client_id: payload.clientId,
    coach_id: coachId,
    sender_id: coachId,
    message_body: messageBody,
  })

  return NextResponse.json({ success: true, plan: data, isOverwritten })
}

export async function DELETE(req: NextRequest) {
  let coachId = ''

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const url = new URL(req.url)
  const planId = String(url.searchParams.get('id') ?? '').trim()
  const clientId = String(url.searchParams.get('clientId') ?? '').trim()

  if (!planId || !clientId) {
    return NextResponse.json({ error: 'Plan ID and Client ID are required.' }, { status: 400 })
  }

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()
  const { error } = await admin
    .from('workout_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', clientId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, deletedPlanId: planId })
}