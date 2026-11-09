import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  recommendClientTrainingSplits,
  type TrainingSplitId,
} from '@/lib/client-training-recommendations'
import {
  autoGenerateOrUpdateClientWorkoutPlan,
  isPlanCoachCertified,
} from '@/lib/client-plan-auto-generator'

const VALID_SPLITS = new Set<string>([
  'auto',
  'full_body',
  'upper_lower',
  'push_pull_4day',
  'push_pull_legs',
  'metabolic_contrast',
])

export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()

  const [{ data: profile }, { data: intake }, { data: latestPlan }] = await Promise.all([
    admin.from('fitness_profiles').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('client_intake_forms').select('surgeries_or_injuries, medical_conditions').eq('user_id', userId).maybeSingle(),
    admin
      .from('workout_plans')
      .select('id, name, goal, nasm_opt_phase, phase_name, sessions_per_week, estimated_duration_mins, plan_json, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const planJson = (latestPlan?.plan_json as Record<string, unknown> | undefined) ?? null
  const isCoachCertified = isPlanCoachCertified(planJson, latestPlan)

  const queryDays = Number(req.nextUrl.searchParams.get('days')) || undefined
  const queryGoal = req.nextUrl.searchParams.get('goal') || undefined
  const queryLevel = req.nextUrl.searchParams.get('level') || undefined

  const activeSplit = (planJson?.trainingSplit as TrainingSplitId | undefined) || undefined

  const recommendation = recommendClientTrainingSplits({
    experienceLevel: queryLevel || profile?.experience_level || 'intermediate',
    trainingDaysPerWeek: queryDays || Number(profile?.training_days_per_week) || Number(latestPlan?.sessions_per_week) || 4,
    fitnessGoal: queryGoal || profile?.fitness_goal || latestPlan?.goal || 'Body Recomposition & Joint Longevity',
    equipmentAccess: Array.isArray(profile?.equipment_access) ? profile.equipment_access : ['dumbbell', 'band', 'bodyweight'],
    injuriesLimitations: profile?.injuries_limitations || intake?.surgeries_or_injuries || intake?.medical_conditions || null,
    preferredSplit: activeSplit || 'auto',
  })

  return NextResponse.json({
    ok: true,
    isCoachCertified,
    activePlanId: latestPlan?.id ?? null,
    activeSplit: activeSplit ?? recommendation.recommendedSplitId,
    recommendation,
  })
}

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
  }

  const rawSplit = String(body.trainingSplit || 'auto').trim()
  const trainingSplit: TrainingSplitId | 'auto' = VALID_SPLITS.has(rawSplit)
    ? (rawSplit as TrainingSplitId | 'auto')
    : 'auto'

  const trainingDaysPerWeek = body.trainingDaysPerWeek
    ? Math.min(6, Math.max(2, Number(body.trainingDaysPerWeek)))
    : undefined
  const fitnessGoal = typeof body.fitnessGoal === 'string' && body.fitnessGoal.trim()
    ? body.fitnessGoal.trim()
    : undefined
  const experienceLevel = typeof body.experienceLevel === 'string' && body.experienceLevel.trim()
    ? body.experienceLevel.trim()
    : undefined
  const targetNasmPhase = body.targetNasmPhase ? Number(body.targetNasmPhase) : undefined
  const cardioBlendStyle =
    body.cardioBlendStyle === 'integrated_finishers' ||
    body.cardioBlendStyle === 'dedicated_conditioning' ||
    body.cardioBlendStyle === 'minimal_flush'
      ? body.cardioBlendStyle
      : undefined

  const admin = supabaseAdmin()

  // Ensure fitness_profiles row exists and sync updated client training preferences
  const { data: existingProfile } = await admin
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const updatedFields: string[] = ['trainingSplit']
  const profileUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (trainingDaysPerWeek) {
    profileUpdates.training_days_per_week = trainingDaysPerWeek
    updatedFields.push('trainingDaysPerWeek')
  }
  if (fitnessGoal) {
    profileUpdates.fitness_goal = fitnessGoal
    updatedFields.push('fitnessGoal')
  }
  if (experienceLevel) {
    profileUpdates.experience_level = experienceLevel
    updatedFields.push('experienceLevel')
  }

  if (existingProfile) {
    await admin.from('fitness_profiles').update(profileUpdates).eq('user_id', userId)
  } else {
    await admin.from('fitness_profiles').insert({
      user_id: userId,
      training_days_per_week: trainingDaysPerWeek || 4,
      fitness_goal: fitnessGoal || 'Body Recomposition & Joint Longevity',
      experience_level: experienceLevel || 'intermediate',
      equipment_access: ['dumbbell', 'band', 'bodyweight'],
      ...profileUpdates,
    })
  }

  const genResult = await autoGenerateOrUpdateClientWorkoutPlan({
    clientId: userId,
    trigger: 'client_split_selection',
    updatedFields,
    trainingSplit,
    trainingDaysPerWeek,
    fitnessGoal,
    experienceLevel,
    targetNasmPhase,
    cardioBlendStyle,
  })

  if (genResult.status === 'preserved_certified') {
    return NextResponse.json(
      {
        ok: false,
        status: genResult.status,
        preservedPlan: true,
        message: genResult.message,
      },
      { status: 409 }
    )
  }

  const { data: updatedPlan } = await admin
    .from('workout_plans')
    .select('id, name, goal, nasm_opt_phase, phase_name, sessions_per_week, estimated_duration_mins, plan_json, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    status: genResult.status,
    result: genResult,
    plan: updatedPlan ?? null,
  })
}

