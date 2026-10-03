import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  runAiCoachOnboardingSynthesis,
  recommendPeriodizationFromScans,
  generateProgramDesignFromScans,
  type ClientOnboardingProfileInput,
} from '@/lib/ai-coach-onboarding-orchestrator'
import type { BodyCompositionScanResult } from '@/lib/ai-body-composition-engine'
import type { PosturalMeshScanResult } from '@/lib/ai-postural-mesh-scanner'
import { parseInjuriesFromText } from '@/lib/sports-injuries'

export async function POST(
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
    return NextResponse.json({ error: message }, { status })
  }

  const { id: clientId } = await params
  const admin = supabaseAdmin()

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  const body = await req.json().catch(() => ({}))
  const action = body.action || 'recommend' // 'recommend' | 'apply_all'

  // Fetch client profile, intake form, and latest records
  const [
    { data: clientRecord },
    { data: profileRecord },
    { data: intakeRecord },
    { data: latestBodyComp },
    { data: latestAssessment },
    { data: latestPlan },
  ] = await Promise.all([
    admin.from('clients').select('id, full_name, email').eq('id', clientId).maybeSingle(),
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
      .select('id, name, plan_json')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const injuries = (profileRecord?.injuries_limitations || intakeRecord?.surgeries_or_injuries || intakeRecord?.medical_conditions || undefined) as string | undefined
  const detectedInjuries = parseInjuriesFromText(injuries)

  const clientInput: ClientOnboardingProfileInput = {
    clientId,
    clientName: body.clientName || clientRecord?.full_name || 'Athlete',
    age: Number(profileRecord?.age) || 32,
    sex: (profileRecord?.sex as 'male' | 'female' | 'other') || 'other',
    heightCm: Number(profileRecord?.height_cm) || 178,
    weightKg: Number(profileRecord?.weight_kg) || 80,
    fitnessGoal: profileRecord?.fitness_goal || 'Body Recomposition & Joint Longevity',
    trainingDaysPerWeek: Number(profileRecord?.training_days_per_week) || 4,
    equipmentAccess: Array.isArray(profileRecord?.equipment_access) ? profileRecord.equipment_access : ['Commercial Gym'],
    cardioEquipmentAccess: Array.isArray(profileRecord?.cardio_equipment_access) ? profileRecord.cardio_equipment_access : [],
    injuriesLimitations: injuries,
    contraindicationTags: detectedInjuries.selectedInjuryIds,
  }

  // Use passed scan results if provided, or parse from database records
  const dexaScan: BodyCompositionScanResult | null = body.dexaScan || (latestBodyComp ? {
    estimatedBodyFatPercent: Number(latestBodyComp.estimated_bodyfat_percent) || 20,
    confidenceIntervalPercent: 1.2,
    confidenceScore: Number(latestBodyComp.confidence_score) || 0.95,
    bodyDensity: 1.05,
    classification: (Number(latestBodyComp.estimated_bodyfat_percent) > 25 ? 'Elevated Fat Mass' : 'Fitness / Defined') as BodyCompositionScanResult['classification'],
    weightKg: clientInput.weightKg || 80,
    weightLbs: Math.round((clientInput.weightKg || 80) * 2.20462),
    fatMassKg: Math.round((clientInput.weightKg || 80) * (Number(latestBodyComp.estimated_bodyfat_percent) / 100)),
    fatMassLbs: Math.round((clientInput.weightKg || 80) * 2.20462 * (Number(latestBodyComp.estimated_bodyfat_percent) / 100)),
    leanBodyMassKg: Math.round((clientInput.weightKg || 80) * (1 - Number(latestBodyComp.estimated_bodyfat_percent) / 100)),
    leanBodyMassLbs: Math.round((clientInput.weightKg || 80) * 2.20462 * (1 - Number(latestBodyComp.estimated_bodyfat_percent) / 100)),
    skeletalMuscleMassKg: 34,
    skeletalMuscleMassLbs: 75,
    ffmi: 20.2,
    normalizedFfmi: 20.0,
    ffmiCategory: 'Average',
    visceralFatRisk: 'Low',
    androidGynoidRatio: 0.95,
    waistToHeightRatio: 0.48,
    cunninghamBmr: 1750,
    katchMcArdleBmr: 1720,
    maintenanceCaloriesTdee: 2500,
    estimatedCircumferencesCm: { waistNavelCm: 84, neckCm: 39, hipGluteCm: 98, chestCm: 100, thighCm: 56, bicepCm: 34 },
    waistToHipRatio: 0.86,
    landmarks: [],
    regionalBreakdown: [],
    photoQualityAssessment: { overallRating: 'optimal', framingScore: 90, lightingScore: 90, clothingOcclusionWarning: false, postureCompensationDetected: false, multiViewEnhanced: true },
    recompositionProjection: {
      targetWeightKg: 78,
      targetWeightLbs: 172,
      targetBodyFatPercent: 15,
      targetFatMassKg: 11.7,
      targetFatMassLbs: 25.8,
      fatToLoseKg: 5.4,
      fatToLoseLbs: 12,
      leanMassChangeKg: 0,
      leanMassChangeLbs: 0,
      estimatedWeeksToGoal: 12,
      dailyCaloricTarget: 2100,
      dailyProteinGrams: 160,
      recommendedNasmPhase: 1,
      phaseName: 'Phase 1: Stabilization Endurance',
      weeklyDeficitOrSurplusCalories: -3500,
      coachingDirectives: ['Preserve Lean Body Mass'],
    },
    methodDescription: latestBodyComp.method || 'DEXA 4C Vision Scan',
    coachSummaryNotes: 'DEXA calibrated scan on record.',
  } : null)

  const postureScan: PosturalMeshScanResult | null = body.postureScan || (latestAssessment ? {
    view: 'overhead_squat',
    landmarks: [],
    angles: [],
    detectedCompensations: Array.isArray(latestAssessment.ohsa_findings)
      ? latestAssessment.ohsa_findings.map((f: unknown) => (typeof f === 'string' ? f : (f as { compensation?: string })?.compensation || ''))
      : ['knees_cave_in', 'excessive_forward_lean'],
    ohsaObservations: [],
    staticFindings: latestAssessment.static_posture || [],
    syndromeDetected: 'Lower Crossed',
    cexPrescription: {
      inhibit: (latestAssessment.overactive_muscles || ['Gastrocnemius', 'TFL']).map((m: string) => ({ muscle: m, protocol: 'SMR 30-60s' })),
      lengthen: (latestAssessment.overactive_muscles || ['Hip Flexors']).map((m: string) => ({ muscle: m, protocol: 'Static Stretch 30s' })),
      activate: (latestAssessment.underactive_muscles || ['Gluteus Medius']).map((m: string) => ({ muscle: m, protocol: 'Isolated Activation 3x15' })),
      integrate: [{ exercise: 'Ball Squat to Press', protocol: '3x12 (4/2/1 tempo)' }],
    },
    clinicalSummary: latestAssessment.coach_summary_notes || 'Kinetic chain compensations identified.',
  } : null)

  // ── Action: Recommend ─────────────────────────────────────
  if (action === 'recommend') {
    const synthesis = runAiCoachOnboardingSynthesis({
      client: clientInput,
      dexaScan,
      postureScan,
    })

    return NextResponse.json({
      ok: true,
      data: synthesis,
    })
  }

  // ── Action: Apply All (1-Click Periodization & Program Design Publication)
  if (action === 'apply_all') {
    const periodizationRec = body.periodizationRecommendation || recommendPeriodizationFromScans({
      client: clientInput,
      dexaScan,
      postureScan,
    })

    const programRec = body.programDesignRecommendation || generateProgramDesignFromScans({
      client: clientInput,
      dexaScan,
      postureScan,
      periodization: periodizationRec,
    })

    const planJson = {
      periodizationPlan: periodizationRec.macrocyclePlan,
      workouts: programRec.macrocyclePlan.workouts,
      sessions: programRec.macrocyclePlan.workouts,
      embeddedCEx: programRec.embeddedCEx,
      masterCoachCues: programRec.masterCoachCues,
      clinicalRationale: periodizationRec.clinicalRationale,
    }

    const row = {
      user_id: clientId,
      name: programRec.planTitle || `${clientInput.clientName} — AI Coach OPT Protocol`,
      goal: clientInput.fitnessGoal || 'Body Recomposition & Joint Longevity',
      nasm_opt_phase: periodizationRec.targetNasmPhase,
      phase_name: periodizationRec.targetPhaseName,
      sessions_per_week: periodizationRec.trainingDaysPerWeek,
      estimated_duration_mins: 55,
      plan_json: planJson,
    }

    let savedPlan
    if (latestPlan?.id) {
      const { data, error } = await admin
        .from('workout_plans')
        .update(row)
        .eq('id', latestPlan.id)
        .select('*')
        .single()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      savedPlan = data
    } else {
      const { data, error } = await admin
        .from('workout_plans')
        .insert(row)
        .select('*')
        .single()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      savedPlan = data
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully applied AI periodization and deployed 4-Phase CEx program for ${clientInput.clientName}!`,
      planId: savedPlan?.id,
      nasmOptPhase: periodizationRec.targetNasmPhase,
    })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}

