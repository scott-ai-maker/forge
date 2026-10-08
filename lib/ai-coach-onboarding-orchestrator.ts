/**
 * Forge Athletic — AI Coach Onboarding & Synthesis Orchestrator
 * 
 * Clinical & Athletic Synthesis Engine:
 * Ingests data exclusively from:
 * 1. AI Posture & OHSA Movement Scanner (Kinetic compensations, distortion syndromes, 4-phase CEx)
 * 2. AI DEXA Body Comp Scanner (4C body fat %, LBM, FFMI, Cunningham BMR, recomposition trajectory)
 * 
 * From these 2 diagnostics, AI Coach Scott Gordon automatically recommends:
 * 1. 12-Week OPT™ Periodization Architecture (Phase 1-5 trajectory, mesocycles, deloads, adaptation velocity)
 * 2. Bespoke Program Design with 4-Phase CEx Warmups embedded on every workout day
 * 
 * Provides an effortless, rapid flow for coaches to onboard and program athletes in seconds.
 */

import { BodyCompositionScanResult } from './ai-body-composition-engine'
import { PosturalMeshScanResult } from './ai-postural-mesh-scanner'
import {
  generate12WeekMacrocycle,
  MacrocyclePlan,
  RoadmapWeek,
  AdaptationVelocity,
  recalculatePhaseRanges,
} from './periodization-roadmap'
import {
  generateRagNasmProgram,
  GeneratedMacrocyclePlan,
  GeneratedWorkoutDay,
} from './rag-nasm-program-generator'
import {
  generateCorrectiveExercisePlan,
  OhsaCompensation,
  OhsaObservation,
} from './nasm-assessments'

export interface ClientOnboardingProfileInput {
  clientId: string
  clientName: string
  age?: number
  sex?: 'male' | 'female' | 'other'
  heightCm?: number
  weightKg?: number
  fitnessGoal?: string
  trainingDaysPerWeek?: number
  equipmentAccess?: string[]
  cardioEquipmentAccess?: string[]
  injuriesLimitations?: string
  contraindicationTags?: string[]
}

export interface AiCoachClinicalRationale {
  summary: string
  bodyCompAnalysis: string
  postureOhsaAnalysis: string
  recommendedStrategy: string
  weeklyCardioPrescription: string
}

export interface AiPeriodizationRecommendation {
  targetNasmPhase: number
  targetPhaseName: string
  macrocyclePlan: MacrocyclePlan
  adaptationVelocity: AdaptationVelocity
  clinicalRationale: AiCoachClinicalRationale
  recommendedCardioStage: 1 | 2 | 3
  cardioBlendStyle: 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush' | 'none'
  trainingDaysPerWeek: number
}

export interface EmbeddedCExSummary {
  inhibit: string[]
  lengthen: string[]
  activate: string[]
  integrate: string[]
  summary: string
}

export interface AiProgramDesignRecommendation {
  planTitle: string
  goal: string
  nasmOptPhase: number
  phaseName: string
  sessionsPerWeek: number
  estimatedDurationMins: number
  macrocyclePlan: GeneratedMacrocyclePlan
  embeddedCEx: EmbeddedCExSummary
  masterCoachCues: string[]
  summary: string
}

export interface UnifiedAiOnboardingSynthesis {
  clientId: string
  clientName: string
  dexaScan: BodyCompositionScanResult | null
  postureScan: PosturalMeshScanResult | null
  periodizationRecommendation: AiPeriodizationRecommendation
  programDesignRecommendation: AiProgramDesignRecommendation
  synthesizedAt: string
}

/**
 * Evaluates whether movement compensations mandate Phase 1: Stabilization Endurance.
 * Under NASM OPT standards, observable joint valgus, excessive lumbar extension/flexion,
 * or Upper/Lower Crossed Syndromes require neuromuscular stabilization prior to heavy progressive loading.
 */
function evaluateOptPhaseRequirement(
  postureScan: PosturalMeshScanResult | null,
  dexaScan: BodyCompositionScanResult | null,
  clientGoal?: string
): { targetPhase: number; targetPhaseName: string; velocity: AdaptationVelocity } {
  const goalStr = (clientGoal || '').toLowerCase()
  const compensations = postureScan?.detectedCompensations || []
  const syndrome = postureScan?.syndromeDetected

  const hasHighRiskCompensation =
    compensations.some(c =>
      c.includes('cave') ||
      c.includes('valgus') ||
      c.includes('inward') ||
      c.includes('lean') ||
      c.includes('arch')
    ) ||
    syndrome === 'Lower Crossed' ||
    syndrome === 'Pronation Distortion'

  const hasUpperCrossedOnly =
    syndrome === 'Upper Crossed' ||
    compensations.some(c => c.includes('arms') || c.includes('head'))

  const isElevatedBodyFat =
    (dexaScan?.estimatedBodyFatPercent ?? 0) > 25 ||
    dexaScan?.classification === 'Elevated Fat Mass' ||
    dexaScan?.classification === 'Moderately Elevated'

  // Rule 1: High risk lower kinetic chain compensations mandate Phase 1 Stabilization
  if (hasHighRiskCompensation) {
    return {
      targetPhase: 1,
      targetPhaseName: 'Phase 1: Stabilization Endurance',
      velocity: compensations.length >= 3 ? 'remedial' : 'standard',
    }
  }

  // Rule 2: Elevated body fat with mild upper crossed can start Phase 1 or Phase 2 depending on experience
  if (isElevatedBodyFat && !goalStr.includes('power')) {
    return {
      targetPhase: 1,
      targetPhaseName: 'Phase 1: Stabilization Endurance',
      velocity: 'standard',
    }
  }

  // Rule 3: Upper Crossed without lower instability can bridge into Phase 2 Strength Endurance
  if (hasUpperCrossedOnly) {
    if (goalStr.includes('hypertrophy') || goalStr.includes('muscle')) {
      return {
        targetPhase: 2,
        targetPhaseName: 'Phase 2: Strength Endurance',
        velocity: 'standard',
      }
    }
    return {
      targetPhase: 1,
      targetPhaseName: 'Phase 1: Stabilization Endurance',
      velocity: 'standard',
    }
  }

  // Rule 4: Optimal alignment or athlete goal
  if (goalStr.includes('hypertrophy') || goalStr.includes('muscle') || goalStr.includes('size')) {
    return {
      targetPhase: 3,
      targetPhaseName: 'Phase 3: Muscular Development',
      velocity: 'accelerated',
    }
  }

  if (goalStr.includes('power') || goalStr.includes('golf') || goalStr.includes('athletic')) {
    return {
      targetPhase: 2,
      targetPhaseName: 'Phase 2: Strength Endurance',
      velocity: 'standard',
    }
  }

  return {
    targetPhase: 1,
    targetPhaseName: 'Phase 1: Stabilization Endurance',
    velocity: 'standard',
  }
}

/**
 * Synthesizes the AI Coach Clinical Rationale from DEXA and Postural/OHSA findings.
 */
function buildClinicalRationale(
  client: ClientOnboardingProfileInput,
  dexaScan: BodyCompositionScanResult | null,
  postureScan: PosturalMeshScanResult | null,
  targetPhase: number
): AiCoachClinicalRationale {
  const name = client.clientName || 'Athlete'

  // DEXA narrative
  let bodyCompAnalysis = ''
  if (dexaScan) {
    bodyCompAnalysis = `AI DEXA scan indicates ${dexaScan.estimatedBodyFatPercent}% body fat (±${dexaScan.confidenceIntervalPercent}%) categorized as "${dexaScan.classification}". Lean Body Mass is ${dexaScan.leanBodyMassLbs} lbs with a Fat-Free Mass Index (FFMI) of ${dexaScan.ffmi} (${dexaScan.ffmiCategory}). Cunningham Basal Metabolic Rate is ${dexaScan.cunninghamBmr} kcal/day with maintenance TDEE at ${dexaScan.maintenanceCaloriesTdee} kcal/day.`
  } else {
    bodyCompAnalysis = `Baseline biometrics established without prior DEXA scan. Calibrated using standard anthropometric ensemble (${client.heightCm || 178}cm / ${client.weightKg || 80}kg).`
  }

  // Posture & OHSA narrative
  let postureOhsaAnalysis = ''
  if (postureScan) {
    const compList = postureScan.detectedCompensations.join(', ').replace(/_/g, ' ') || 'None observed'
    postureOhsaAnalysis = `AI Posture & OHSA Scanner identified primary distortion syndrome "${postureScan.syndromeDetected || 'Kinetic Imbalance'}" with key compensations: ${compList}. Specific kinetic checkpoints show altered length-tension relationships requiring targeted neuromuscular inhibition and activation.`
  } else {
    postureOhsaAnalysis = `Awaiting multi-view AI Posture & OHSA mesh scan. Default kinetic chain stabilization protocols active.`
  }

  // Strategy narrative
  let recommendedStrategy = ''
  if (targetPhase === 1) {
    recommendedStrategy = `Recommended initial 4-week mesocycle in NASM OPT Phase 1 (Stabilization Endurance). Prioritizes 4/2/1 tempo, high proprioceptive instability, and joint realignment to correct identified compensations before progressive external loading.`
  } else if (targetPhase === 2) {
    recommendedStrategy = `Recommended mesocycle in NASM OPT Phase 2 (Strength Endurance). Uses superset contrast pairs (stable strength lift immediately paired with stabilization movement) to advance work capacity while reinforcing kinetic chain alignment.`
  } else {
    recommendedStrategy = `Recommended mesocycle in NASM OPT Phase 3 (Muscular Development). Focuses on 75-85% 1RM mechanical tension and volume landmarks to accelerate lean body mass accrual.`
  }

  // Cardio prescription
  const isHighBf = (dexaScan?.estimatedBodyFatPercent ?? 0) > 22
  const weeklyCardioPrescription = isHighBf
    ? 'Tanaka Stage 1 & 2 Interval Conditioning: 2-3 sessions/week (20-30 min) targeting fat oxidation and mitochondrial biogenesis without neuromuscular interference.'
    : 'Tanaka Stage 2 Lactate Threshold Conditioning: 2 sessions/week (15-20 min) with integrated high-density finishers.'

  const summary = `Master Coach Scott Gordon: Synthesized dual diagnostic evaluation for ${name}. Body composition and postural screen align on ${targetPhase === 1 ? 'Phase 1 Stabilization' : targetPhase === 2 ? 'Phase 2 Strength Endurance' : 'Phase 3 Muscular Development'} with custom 4-phase CEx warmups.`

  return {
    summary,
    bodyCompAnalysis,
    postureOhsaAnalysis,
    recommendedStrategy,
    weeklyCardioPrescription,
  }
}

/**
 * AI Coach generates 12-Week OPT™ Periodization Recommendation from DEXA and Posture/OHSA scans.
 */
export function recommendPeriodizationFromScans(params: {
  client: ClientOnboardingProfileInput
  dexaScan: BodyCompositionScanResult | null
  postureScan: PosturalMeshScanResult | null
}): AiPeriodizationRecommendation {
  const { client, dexaScan, postureScan } = params

  const { targetPhase, targetPhaseName, velocity } = evaluateOptPhaseRequirement(
    postureScan,
    dexaScan,
    client.fitnessGoal
  )

  const clinicalRationale = buildClinicalRationale(client, dexaScan, postureScan, targetPhase)

  // Generate 12-week macrocycle structure
  const rawMacrocycle = generate12WeekMacrocycle(
    targetPhase,
    client.fitnessGoal || (dexaScan?.recompositionProjection?.phaseName ? `Recomposition: ${dexaScan.recompositionProjection.phaseName}` : 'Body Recomposition & Movement Efficiency')
  )

  // Customize weeks and coach memos based on findings
  const customizedWeeks: RoadmapWeek[] = rawMacrocycle.weeks.map(week => {
    let memo = week.coachWeeklyMemo || ''
    if (week.weekNumber === 1) {
      memo = `Kickoff: ${clinicalRationale.summary} Focus on 4-Phase CEx Warmup and 4/2/1 tempo.`
    } else if (week.isReassessmentWeek) {
      memo = 'Mid-Cycle Checkpoint: Re-run AI Posture & OHSA Scanner to quantify kinetic chain compensation reductions.'
    } else if (week.isDeloadWeek) {
      memo = 'Active Restorative Deload: SMR, mobility flushes, and central nervous system recovery.'
    }
    return {
      ...week,
      coachWeeklyMemo: memo,
    }
  })

  const customizedMacrocycle: MacrocyclePlan = {
    ...rawMacrocycle,
    adaptationVelocity: velocity,
    coachNotes: clinicalRationale.summary,
    coachCalibratedAt: new Date().toISOString(),
    weeks: customizedWeeks,
    phases: recalculatePhaseRanges(customizedWeeks),
  }

  const recommendedCardioStage = (dexaScan?.estimatedBodyFatPercent ?? 0) > 24 ? 1 : 2
  const cardioBlendStyle = (dexaScan?.estimatedBodyFatPercent ?? 0) > 22 ? 'dedicated_conditioning' : 'integrated_finishers'
  const trainingDays = client.trainingDaysPerWeek && client.trainingDaysPerWeek >= 2 && client.trainingDaysPerWeek <= 6
    ? client.trainingDaysPerWeek
    : 4

  return {
    targetNasmPhase: targetPhase,
    targetPhaseName,
    macrocyclePlan: customizedMacrocycle,
    adaptationVelocity: velocity,
    clinicalRationale,
    recommendedCardioStage,
    cardioBlendStyle,
    trainingDaysPerWeek: trainingDays,
  }
}

/**
 * Extracts or compiles the 4-Phase CEx Warmup Continuum (Inhibit, Lengthen, Activate, Integrate).
 */
export function extractCExContinuum(
  postureScan: PosturalMeshScanResult | null
): EmbeddedCExSummary {
  if (postureScan?.cexPrescription) {
    const p = postureScan.cexPrescription
    return {
      inhibit: p.inhibit.map(i => `${i.muscle}: ${i.protocol}`),
      lengthen: p.lengthen.map(l => `${l.muscle}: ${l.protocol}`),
      activate: p.activate.map(a => `${a.muscle}: ${a.protocol}`),
      integrate: p.integrate.map(it => `${it.exercise}: ${it.protocol}`),
      summary: `4-Phase CEx Warmup targeted to ${postureScan.syndromeDetected || 'observed kinetic compensations'}.`,
    }
  }

  // Compile from compensations if available
  const compensations = (postureScan?.detectedCompensations || ['knees_cave_in', 'excessive_forward_lean']) as OhsaCompensation[]
  const observations: OhsaObservation[] = compensations.map(c => ({
    compensation: c,
    checkpoint: c.includes('knee') ? 'knees' : c.includes('arm') ? 'shoulders' : 'lphc',
    severity: 'moderate',
    view: 'lateral',
  }))

  const { plan } = generateCorrectiveExercisePlan(observations)

  return {
    inhibit: (plan?.inhibit || []).map(i => `${i.targetMuscle} SMR — ${i.repsOrDuration}`),
    lengthen: (plan?.lengthen || []).map(l => `${l.name} — ${l.repsOrDuration}`),
    activate: (plan?.activate || []).map(a => `${a.name} — ${a.repsOrDuration}`),
    integrate: (plan?.integrate || []).map(it => `${it.name} — ${it.repsOrDuration}`),
    summary: plan?.summary || '4-Phase Corrective Exercise Warmup Continuum initialized.',
  }
}

/**
 * AI Coach generates Program Design with 4-Phase CEx Warmup embedded into every workout session.
 */
export function generateProgramDesignFromScans(params: {
  client: ClientOnboardingProfileInput
  dexaScan: BodyCompositionScanResult | null
  postureScan: PosturalMeshScanResult | null
  periodization: AiPeriodizationRecommendation
}): AiProgramDesignRecommendation {
  const { client, dexaScan, postureScan, periodization } = params

  const targetPhase = periodization.targetNasmPhase
  const daysPerWeek = periodization.trainingDaysPerWeek
  const goal = (dexaScan?.classification === 'Elevated Fat Mass' || dexaScan?.classification === 'Moderately Elevated')
    ? 'fat_loss'
    : (client.fitnessGoal?.toLowerCase().includes('hypertrophy') || client.fitnessGoal?.toLowerCase().includes('muscle'))
    ? 'hypertrophy'
    : 'general_fitness'

  const cexSummary = extractCExContinuum(postureScan)

  // Generate base RAG program
  const baseProgram = generateRagNasmProgram({
    clientName: client.clientName,
    clientAge: client.age || 32,
    clientSex: client.sex === 'female' ? 'female' : 'male',
    goal,
    targetNasmPhase: targetPhase,
    trainingDaysPerWeek: daysPerWeek,
    equipmentAccess: client.equipmentAccess,
    kineticCompensations: postureScan?.detectedCompensations,
    cardioBlendStyle: periodization.cardioBlendStyle,
    cardioEquipmentAccess: client.cardioEquipmentAccess,
    contraindicationTags: client.contraindicationTags,
    injuriesLimitations: client.injuriesLimitations,
  })

  // Explicitly embed the 4-Phase CEx Warmup Continuum into each workout day
  const enrichedWorkouts: GeneratedWorkoutDay[] = baseProgram.workouts.map(day => {
    return {
      ...day,
      warmupProtocol: {
        inhibitSmr: Array.from(new Set([...day.warmupProtocol.inhibitSmr, ...cexSummary.inhibit])),
        lengthenStaticStretch: Array.from(new Set([...day.warmupProtocol.lengthenStaticStretch, ...cexSummary.lengthen])),
        activateDynamic: Array.from(new Set([...day.warmupProtocol.activateDynamic, ...cexSummary.activate])),
      },
      dailyPeriodizationMemo: `${day.dailyPeriodizationMemo} [AI 4-Phase CEx]: Inhibit ${cexSummary.inhibit[0] || 'tight lines'}, Lengthen ${cexSummary.lengthen[0] || 'hip flexors'}, Activate ${cexSummary.activate[0] || 'glutes'}, Integrate ${cexSummary.integrate[0] || 'movement patterns'}.`,
    }
  })

  const masterCoachCues = [
    `Maintain strict 4/2/1 tempo on stabilization exercises (4s eccentric down, 2s isometric hold, 1s concentric up).`,
    postureScan?.detectedCompensations.some(c => c.includes('knee') || c.includes('cave'))
      ? `Drive through tripod of foot and maintain active knee tracking over 2nd toe; resist medial knee collapse.`
      : `Engage core prior to all compound lifts to prevent anterior pelvic tilt and excessive lumbar lordosis.`,
    postureScan?.detectedCompensations.some(c => c.includes('arms') || c.includes('shoulder'))
      ? `Retract and depress scapulae during overhead and pulling movements; keep ribs pinned down.`
      : `Breathe diaphragmatically on eccentric phase; exhale forcefully on concentric exertion.`,
    dexaScan ? `Nutritional synchronization: Maintain protein at 1.0g per lb Lean Body Mass (${Math.round(dexaScan.leanBodyMassLbs)}g/day) to preserve skeletal muscle.` : `Fuel adequately 90 minutes prior to training session.`,
  ]

  const enrichedPlan: GeneratedMacrocyclePlan = {
    ...baseProgram,
    workouts: enrichedWorkouts,
    planTitle: `${client.clientName} — 4-Phase CEx & OPT Phase ${targetPhase} Protocol`,
  }

  return {
    planTitle: enrichedPlan.planTitle,
    goal: enrichedPlan.primaryGoal,
    nasmOptPhase: targetPhase,
    phaseName: periodization.targetPhaseName,
    sessionsPerWeek: daysPerWeek,
    estimatedDurationMins: 55,
    macrocyclePlan: enrichedPlan,
    embeddedCEx: cexSummary,
    masterCoachCues,
    summary: `Complete ${daysPerWeek}-day OPT Phase ${targetPhase} workout program designed by AI Coach with custom 4-Phase CEx Warmup embedded on every day.`,
  }
}

/**
 * Unified 1-Step Orchestrator: Synthesizes both Periodization & Program Design in a single execution.
 */
export function runAiCoachOnboardingSynthesis(params: {
  client: ClientOnboardingProfileInput
  dexaScan: BodyCompositionScanResult | null
  postureScan: PosturalMeshScanResult | null
}): UnifiedAiOnboardingSynthesis {
  const periodizationRecommendation = recommendPeriodizationFromScans(params)
  const programDesignRecommendation = generateProgramDesignFromScans({
    client: params.client,
    dexaScan: params.dexaScan,
    postureScan: params.postureScan,
    periodization: periodizationRecommendation,
  })

  return {
    clientId: params.client.clientId,
    clientName: params.client.clientName,
    dexaScan: params.dexaScan,
    postureScan: params.postureScan,
    periodizationRecommendation,
    programDesignRecommendation,
    synthesizedAt: new Date().toISOString(),
  }
}
