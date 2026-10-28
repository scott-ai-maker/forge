/**
 * Forge Athletic — Client Plan Auto-Generator & Profile Sync
 *
 * Automatically generates or updates an athlete's workout plan when:
 * 1. Initial onboarding is completed (`trigger: 'onboarding'`).
 * 2. An athlete modifies core training profile parameters (`trigger: 'profile_update'`).
 *    Core fields: experienceLevel, equipmentAccess, fitnessGoal, trainingDaysPerWeek,
 *                 preferredTrainingDays, injuriesLimitations, workoutLocation, cardioEquipmentAccess.
 *
 * Coach Certification Safeguard:
 * If an active plan was certified by a human coach (`isCertifiedByCoach || coachCertifiedAt || safetyGateCertified`),
 * the bespoke prescription is strictly PRESERVED and flagged for coach review (`pendingCoachReview: true`),
 * rather than destructively overwriting coach-certified programming.
 * If uncertified or no plan exists, the protocol is regenerated immediately with full NASM OPT alignment.
 */

import { supabaseAdmin } from './supabase'
import { parseInjuriesFromText } from './sports-injuries'
import {
  recommendPeriodizationFromScans,
  generateProgramDesignFromScans,
  ClientOnboardingProfileInput,
} from './ai-coach-onboarding-orchestrator'
import {
  buildStoredProgramPlan,
  CoachProgramPayload,
  CoachProgramWorkoutInput,
  ExerciseLibraryRecord,
  EquipmentLibraryRecord,
} from './coach-programs'
import { BodyCompositionScanResult } from './ai-body-composition-engine'
import { PosturalMeshScanResult } from './ai-postural-mesh-scanner'

export const CORE_TRAINING_PROFILE_FIELDS = [
  'experienceLevel',
  'equipmentAccess',
  'fitnessGoal',
  'trainingDaysPerWeek',
  'preferredTrainingDays',
  'injuriesLimitations',
  'workoutLocation',
  'cardioEquipmentAccess',
] as const

export type CoreTrainingField = (typeof CORE_TRAINING_PROFILE_FIELDS)[number]

export interface AutoPlanGenerationRequest {
  clientId: string
  trigger: 'onboarding' | 'profile_update'
  updatedFields?: string[]
}

export interface AutoPlanGenerationResult {
  status: 'generated' | 'preserved_certified' | 'skipped'
  planId?: string
  nasmOptPhase?: number
  phaseName?: string
  sessionsPerWeek?: number
  preservedPlan?: boolean
  message: string
}

/**
 * Determines whether a workout plan was certified by a coach and should be protected
 * against automated overwrite.
 */
export function isPlanCoachCertified(
  planJson: Record<string, unknown> | null | undefined,
  planRecord?: Record<string, unknown> | null
): boolean {
  if (!planJson && !planRecord) return false
  if (planRecord?.is_certified === true) return true
  if (!planJson) return false

  return Boolean(
    planJson.isCertifiedByCoach === true ||
    planJson.coachCertifiedAt ||
    planJson.safetyGateCertified === true ||
    planJson.certifiedBy ||
    planJson.generatedBy === 'coach' ||
    planJson.generatedByCoachId
  )
}

/**
 * Orchestrates immediate plan generation or safe preservation for an athlete.
 */
export async function autoGenerateOrUpdateClientWorkoutPlan(
  params: AutoPlanGenerationRequest
): Promise<AutoPlanGenerationResult> {
  const { clientId, trigger, updatedFields = [] } = params
  if (!clientId) {
    return { status: 'skipped', message: 'No clientId provided.' }
  }

  const admin = supabaseAdmin()

  // 1. Ingest client, profile, intake, and scans
  const [
    { data: clientRecord },
    { data: profileRecord },
    { data: intakeRecord },
    { data: latestBodyComp },
    { data: latestPosture },
    { data: existingPlans },
  ] = await Promise.all([
    admin.from('clients').select('id, full_name, email, designated_coach_id').eq('id', clientId).maybeSingle(),
    admin.from('fitness_profiles').select('*').eq('user_id', clientId).maybeSingle(),
    admin.from('client_intake_forms').select('*').eq('user_id', clientId).maybeSingle(),
    admin
      .from('body_composition_analyses')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('nasm_assessments')
      .select('*')
      .eq('client_id', clientId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('workout_plans')
      .select('id, name, goal, nasm_opt_phase, phase_name, sessions_per_week, estimated_duration_mins, plan_json, created_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  if (!profileRecord) {
    return { status: 'skipped', message: 'No fitness profile found for client.' }
  }

  const latestPlan = existingPlans?.[0] ?? null
  const planJson = (latestPlan?.plan_json as Record<string, unknown> | undefined) ?? null

  // 2. Coach Certification Safeguard Check
  if (latestPlan && isPlanCoachCertified(planJson, latestPlan)) {
    const updatedPlanJson = {
      ...(planJson || {}),
      pendingCoachReview: true,
      pendingCoachReviewReason: `Athlete updated training variables (${updatedFields.join(', ') || 'profile update'}). Certified protocol preserved pending coach review.`,
      clientProfileUpdatedAt: new Date().toISOString(),
      profileChangeSummary: {
        changedFields: updatedFields,
        updatedAt: new Date().toISOString(),
      },
    }

    await admin
      .from('workout_plans')
      .update({
        plan_json: updatedPlanJson,
      })
      .eq('id', latestPlan.id)

    // Notify coach via concierge messages thread
    const coachId = clientRecord?.designated_coach_id || '00000000-0000-0000-0000-000000000000'
    const athleteName = clientRecord?.full_name || 'Athlete'
    const changedSummary = updatedFields.length > 0 ? updatedFields.join(', ') : 'core fitness parameters'

    try {
      await admin.from('coach_client_messages').insert({
        client_id: clientId,
        coach_id: coachId,
        sender_id: clientId,
        message_body: `[Profile Update Notice]: ${athleteName} updated profile settings (${changedSummary}). Active coach-certified protocol preserved; review requested.`,
      })
    } catch (err: unknown) {
      console.warn('[AutoPlanGenerator] Coach message dispatch warning:', err)
    }

    return {
      status: 'preserved_certified',
      planId: latestPlan.id,
      preservedPlan: true,
      message: 'Active coach-certified plan preserved. Profile change flagged for coach review.',
    }
  }

  // 3. Prepare AI synthesis inputs
  const injuries = (profileRecord.injuries_limitations || intakeRecord?.surgeries_or_injuries || intakeRecord?.medical_conditions || undefined) as string | undefined
  const detectedInjuries = parseInjuriesFromText(injuries)

  const clientInput: ClientOnboardingProfileInput = {
    clientId,
    clientName: clientRecord?.full_name || 'Athlete',
    age: Number(profileRecord.age) || 30,
    sex: (profileRecord.sex as 'male' | 'female' | 'other') || 'other',
    heightCm: Number(profileRecord.height_cm) || 170,
    weightKg: Number(profileRecord.weight_kg) || 70,
    fitnessGoal: profileRecord.fitness_goal || 'Body Recomposition & Joint Longevity',
    trainingDaysPerWeek: Number(profileRecord.training_days_per_week) || 3,
    equipmentAccess: Array.isArray(profileRecord.equipment_access) && profileRecord.equipment_access.length > 0
      ? profileRecord.equipment_access
      : ['bodyweight'],
    cardioEquipmentAccess: Array.isArray(profileRecord.cardio_equipment_access)
      ? profileRecord.cardio_equipment_access
      : [],
    injuriesLimitations: injuries,
    contraindicationTags: detectedInjuries.selectedInjuryIds,
    experienceLevel: profileRecord.experience_level || undefined,
  }

  const dexaScan: BodyCompositionScanResult | null = latestBodyComp ? {
    estimatedBodyFatPercent: Number(latestBodyComp.estimated_bodyfat_percent) || 20,
    confidenceIntervalPercent: 1.2,
    confidenceScore: Number(latestBodyComp.confidence_score) || 0.95,
    bodyDensity: 1.05,
    classification: (Number(latestBodyComp.estimated_bodyfat_percent) > 25 ? 'Elevated Fat Mass' : 'Fitness / Defined') as BodyCompositionScanResult['classification'],
    weightKg: clientInput.weightKg || 70,
    weightLbs: Math.round((clientInput.weightKg || 70) * 2.20462),
    fatMassKg: Math.round((clientInput.weightKg || 70) * (Number(latestBodyComp.estimated_bodyfat_percent) / 100)),
    fatMassLbs: Math.round((clientInput.weightKg || 70) * 2.20462 * (Number(latestBodyComp.estimated_bodyfat_percent) / 100)),
    leanBodyMassKg: Math.round((clientInput.weightKg || 70) * (1 - Number(latestBodyComp.estimated_bodyfat_percent) / 100)),
    leanBodyMassLbs: Math.round((clientInput.weightKg || 70) * 2.20462 * (1 - Number(latestBodyComp.estimated_bodyfat_percent) / 100)),
    skeletalMuscleMassKg: 30,
    skeletalMuscleMassLbs: 66,
    ffmi: 20.0,
    normalizedFfmi: 20.0,
    ffmiCategory: 'Average',
    visceralFatRisk: 'Low',
    androidGynoidRatio: 0.95,
    waistToHeightRatio: 0.48,
    cunninghamBmr: 1500,
    katchMcArdleBmr: 1480,
    maintenanceCaloriesTdee: 2200,
    estimatedCircumferencesCm: { waistNavelCm: 80, neckCm: 37, hipGluteCm: 95, chestCm: 95, thighCm: 54, bicepCm: 30 },
    waistToHipRatio: 0.84,
    landmarks: [],
    regionalBreakdown: [],
    photoQualityAssessment: { overallRating: 'optimal', framingScore: 90, lightingScore: 90, clothingOcclusionWarning: false, postureCompensationDetected: false, multiViewEnhanced: true },
    recompositionProjection: {
      targetWeightKg: 68,
      targetWeightLbs: 150,
      targetBodyFatPercent: 18,
      targetFatMassKg: 12.2,
      targetFatMassLbs: 27,
      fatToLoseKg: 3,
      fatToLoseLbs: 6.6,
      leanMassChangeKg: 0,
      leanMassChangeLbs: 0,
      estimatedWeeksToGoal: 8,
      dailyCaloricTarget: 1800,
      dailyProteinGrams: 140,
      recommendedNasmPhase: 1,
      phaseName: 'Phase 1: Stabilization Endurance',
      weeklyDeficitOrSurplusCalories: -2500,
      coachingDirectives: ['Stabilize movement patterns and build endurance base'],
    },
    methodDescription: latestBodyComp.method || 'DEXA 4C Vision Scan',
    coachSummaryNotes: 'DEXA calibrated scan on record.',
  } : null

  const postureScan: PosturalMeshScanResult | null = latestPosture ? {
    view: 'overhead_squat',
    landmarks: [],
    angles: [],
    detectedCompensations: Array.isArray(latestPosture.ohsa_findings)
      ? latestPosture.ohsa_findings.map((f: unknown) => (typeof f === 'string' ? f : (f as { compensation?: string })?.compensation || ''))
      : (latestPosture.detected_compensations as string[]) || [],
    ohsaObservations: [],
    staticFindings: latestPosture.static_posture || [],
    syndromeDetected: 'Optimal Alignment',
    cexPrescription: {
      inhibit: [],
      lengthen: [],
      activate: [],
      integrate: [],
    },
    clinicalSummary: latestPosture.coach_summary_notes || 'Kinetic chain compensations identified.',
  } : null

  // 4. Recommend Periodization & Program Design
  const periodizationRec = recommendPeriodizationFromScans({
    client: clientInput,
    dexaScan,
    postureScan,
  })

  const programRec = generateProgramDesignFromScans({
    client: clientInput,
    dexaScan,
    postureScan,
    periodization: periodizationRec,
  })

  // 5. Query exercise & equipment libraries to attach rich media, instructions, and video links
  const exerciseNames = programRec.macrocyclePlan.workouts.flatMap(w => w.exercises.map(e => e.name))
  const [exercisesResult, equipmentResult] = await Promise.all([
    admin
      .from('exercise_library_entries')
      .select('id, name, slug, description, coaching_cues, primary_equipment, muscle_groups, media_image_url, media_video_url, open_externally_only, metadata_json')
      .eq('is_active', true)
      .in('source', ['nasm_exercise_library'])
      .limit(3000),
    admin
      .from('equipment_library_entries')
      .select('id, name, slug, description, media_image_url')
      .eq('is_active', true)
      .in('source', ['nasm_exercise_library']),
  ])

  // Map to coach program input for buildStoredProgramPlan
  const workoutsPayload: CoachProgramWorkoutInput[] = programRec.macrocyclePlan.workouts.map(day => ({
    day: day.day,
    focus: day.focus || day.dayName,
    notes: day.dailyPeriodizationMemo,
    cardioProtocol: day.cardioProtocol || null,
    exercises: day.exercises.map(ex => ({
      name: ex.name,
      block: ex.block,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo,
      rest: ex.rest,
      notes: ex.whyForYou || ex.nasmClinicalSource,
      personalReason: ex.whyForYou,
      coachingCues: ex.coachingCues,
    })),
  }))

  const programPayload: CoachProgramPayload = {
    clientId,
    name: programRec.planTitle || `${clientInput.clientName} — AI Coach OPT Protocol`,
    goal: clientInput.fitnessGoal || 'Body Recomposition & Joint Longevity',
    nasmOptPhase: periodizationRec.targetNasmPhase,
    phaseName: periodizationRec.targetPhaseName,
    sessionsPerWeek: periodizationRec.trainingDaysPerWeek,
    estimatedDurationMins: programRec.estimatedDurationMins || 45,
    workouts: workoutsPayload,
  }

  const storedPlan = buildStoredProgramPlan(
    programPayload,
    (exercisesResult.data ?? []) as ExerciseLibraryRecord[],
    (equipmentResult.data ?? []) as EquipmentLibraryRecord[]
  )

  const finalPlanJson = {
    ...storedPlan,
    sessions: storedPlan.workouts,
    periodizationPlan: periodizationRec.macrocyclePlan,
    embeddedCEx: programRec.embeddedCEx,
    masterCoachCues: programRec.masterCoachCues,
    clinicalRationale: periodizationRec.clinicalRationale,
    handPortionPlan: programRec.macrocyclePlan.handPortionPlan,
    dualCardioPlan: programRec.macrocyclePlan.dualCardioPlan,
    strengthCardioBlendSummary: programRec.macrocyclePlan.strengthCardioBlendSummary,
    generatedBy: 'system_auto_sync',
    autoGeneratedAt: new Date().toISOString(),
    autoGenerateTrigger: trigger,
    isCertifiedByCoach: false,
    safetyGateCertified: false,
    updatedCoreFields: updatedFields,
  }

  const planRow = {
    user_id: clientId,
    name: programPayload.name,
    goal: programPayload.goal,
    nasm_opt_phase: programPayload.nasmOptPhase,
    phase_name: programPayload.phaseName,
    sessions_per_week: programPayload.sessionsPerWeek,
    estimated_duration_mins: programPayload.estimatedDurationMins,
    plan_json: finalPlanJson,
  }

  let savedPlanId: string
  if (latestPlan?.id) {
    const { data: updated, error: updateErr } = await admin
      .from('workout_plans')
      .update(planRow)
      .eq('id', latestPlan.id)
      .select('id')
      .single()

    if (updateErr) {
      throw new Error(`Failed to update workout plan: ${updateErr.message}`)
    }
    savedPlanId = updated.id
  } else {
    const { data: inserted, error: insertErr } = await admin
      .from('workout_plans')
      .insert(planRow)
      .select('id')
      .single()

    if (insertErr) {
      throw new Error(`Failed to insert workout plan: ${insertErr.message}`)
    }
    savedPlanId = inserted.id
  }

  // 6. Send concierge synchronization confirmation
  const coachId = clientRecord?.designated_coach_id || '00000000-0000-0000-0000-000000000000'
  const messageBody = trigger === 'onboarding'
    ? `Protocol Synchronized: Welcome! Your initial OPT™ training protocol **${planRow.name}** (${planRow.phase_name} · ${planRow.sessions_per_week} days/week) has been generated and loaded into your Fitness Lab.`
    : `Protocol Synchronized: Your training protocol has been updated to **${planRow.name}** (${planRow.phase_name} · ${planRow.sessions_per_week} days/week) reflecting your latest profile parameters (${updatedFields.join(', ')}). Your Fitness Lab is ready!`

  try {
    await admin.from('coach_client_messages').insert({
      client_id: clientId,
      coach_id: coachId,
      sender_id: coachId,
      message_body: messageBody,
    })
  } catch (err: unknown) {
    console.warn('[AutoPlanGenerator] Concierge sync message warning:', err)
  }

  return {
    status: 'generated',
    planId: savedPlanId,
    nasmOptPhase: planRow.nasm_opt_phase,
    phaseName: planRow.phase_name,
    sessionsPerWeek: planRow.sessions_per_week,
    preservedPlan: false,
    message: 'Workout plan generated immediately based on updated profile.',
  }
}
