/**
 * Forge Athletic — Master RAG NASM Program Generation Engine
 * Synthesizes all 76 ingested sports science documents and 36 periodized workout suites:
 * - 12 Fat Loss / Metabolic Stabilization Routines (Phases 1 & 2)
 * - 12 Hypertrophy / Muscular Development Routines (Phase 3)
 * - 12 Maximal Strength & Athletic Power Routines (Phases 4 & 5)
 * - Distinct, authentic exercise programming adapted to available client equipment
 *   (Commercial Gym, Home Dumbbells & Bands, Minimalist Travel Bands, Bodyweight Calisthenics).
 */

import { calculateOneRepMax, calculateTargetTrainingLoad } from './sports-science-knowledge'

// Without a recorded benchmark no load is prescribed; the coach sets it in session.
function loadFromOneRepMax(oneRepMaxLbs: number | undefined, pct: number): number | undefined {
  return oneRepMaxLbs === undefined ? undefined : calculateTargetTrainingLoad(oneRepMaxLbs, pct)
}
import { queryNasmRagLibrary } from './nasm-rag-knowledge-base'
import { calculateCardioZones } from './nasm-cardio-stage-engine'
import { enrichExerciseMedia } from './nasm-exercise-video-catalog'
import { checkExerciseContraindications } from './liability-shield'
import { parseInjuriesFromText, getInjuryAugmentations } from './sports-injuries'
import { substituteMissingEquipment } from './nasm-opt-guardrails'
import { calculateEstimatedWorkoutDuration } from './workout-duration-engine'

export interface RagProgramGenerationRequest {
  clientName?: string
  clientAge?: number
  clientSex?: 'male' | 'female'
  goal: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'
  targetNasmPhase?: number // 1, 2, 3, 4, or 5
  trainingDaysPerWeek?: number // 2, 3, 4, 5, or 6
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  equipmentAccess?: string[]
  knownBenchmarks?: Record<string, { weightLbs: number; reps: number }>
  kineticCompensations?: string[] // e.g. ['knees_cave_in', 'excessive_forward_lean', 'arms_fall_forward']
  cardioBlendStyle?: 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush' | 'none'
  cardioEquipmentAccess?: string[]
  contraindicationTags?: string[] // e.g. ['knee_patellofemoral', 'lumbar_disc_condition', 'shoulder_impingement']
  injuriesLimitations?: string
}

export interface GeneratedExerciseItem {
  block: 'warmup' | 'core_balance' | 'saq' | 'resistance' | 'cooldown'
  name: string
  sets: string
  reps: string
  tempo: string
  rest: string
  intensityPercentage1RM?: number
  targetLoadLbs?: number
  supersetPairWith?: string
  coachingCues: string[]
  nasmClinicalSource: string
  imageUrl?: string | null
  videoUrl?: string | null
  embedUrl?: string | null
  contraindicationReplacedFrom?: string
}

export interface IntegratedCardioPrescription {
  title: string
  protocolType: 'post_lift_finisher' | 'stage_interval_conditioning' | 'steady_state_base' | 'pap_hiit_contrast' | 'active_recovery_flush'
  stage: 1 | 2 | 3
  stageName: string
  targetZone: string
  targetBpmRange?: string
  targetRpe: string
  durationMins: number
  workRestRatio: string
  timingGuideline: string
  recommendedModalities: string[]
  metabolicRationale: string
  coachingCues: string[]
  nasmChapterSource: string
}

export interface GeneratedWorkoutDay {
  day: number
  dayName: string
  focus: string
  nasmOptPhase: number
  phaseName: string
  estimatedDurationMins: number
  warmupProtocol: {
    inhibitSmr: string[]
    lengthenStaticStretch: string[]
    activateDynamic: string[]
  }
  exercises: GeneratedExerciseItem[]
  cardioProtocol?: IntegratedCardioPrescription
  dailyPeriodizationMemo: string
}

export interface StrengthCardioBlendSummary {
  goal: string
  blendRatio: string // e.g. '55% Strength / 45% Cardio'
  strengthPct: number
  cardioPct: number
  weeklyStrengthSessions: number
  weeklyCardioMinutes: number
  primaryCardioStages: string
  interferenceShieldStrategy: string
  clinicalGuideline: string
}

export interface HandPortionNutritionPlan {
  philosophy: 'precision_nutrition_hand_portion'
  title: string
  mealsPerDay: number
  guidelines: {
    protein: { portionsPerMeal: string; handMeasure: string; examples: string; rationale: string }
    vegetables: { portionsPerMeal: string; handMeasure: string; examples: string; rationale: string }
    smartCarbs: { portionsPerMeal: string; handMeasure: string; examples: string; rationale: string }
    healthyFats: { portionsPerMeal: string; handMeasure: string; examples: string; rationale: string }
  }
  mindfulEatingCue: string
  hydrationAnchor: string
  summary: string
}

export interface DualCardioPlanSummary {
  sweatyFinisher: {
    title: string
    durationMins: number
    modality: string
    zone: string
    timing: string
    rationale: string
  }
  freshNeatWalk?: {
    title: string
    durationMins: number
    frequency: string
    modality: string
    timing: string
    rationale: string
  }
}

export interface GeneratedMacrocyclePlan {
  planTitle: string
  primaryGoal: string
  nasmOptPhase: number
  phaseName: string
  totalWeeks: number
  sessionsPerWeek: number
  ragSourcesCited: string[]
  strengthCardioBlendSummary: StrengthCardioBlendSummary
  workouts: GeneratedWorkoutDay[]
  periodizationWeeklyMemos: string[]
  clinicalRationale?: string
  handPortionPlan?: HandPortionNutritionPlan | null
  dualCardioPlan?: DualCardioPlanSummary | null
}

import {
  type EquipmentCapabilities,
  parseEquipmentCapabilities,
  type CardioEquipmentCapabilities,
  parseCardioEquipmentCapabilities,
} from './nasm-equipment-detector'

export type { EquipmentCapabilities, CardioEquipmentCapabilities }
export { parseEquipmentCapabilities, parseCardioEquipmentCapabilities }

/**
 * Builds recommended cardio modalities restricted strictly to equipment the client possesses.
 */
export function buildRecommendedCardioModalities(
  stage: 1 | 2 | 3,
  goal: string,
  caps: CardioEquipmentCapabilities
): string[] {
  const modalities: string[] = []

  if (caps.hasTreadmill) modalities.push('Treadmill')
  if (caps.hasAirBike) modalities.push('Assault / Air Bike')
  if (caps.hasStationaryBike) modalities.push('Stationary / Spin Bike')
  if (caps.hasRower) modalities.push('Rowing Machine')
  if (caps.hasElliptical) modalities.push('Elliptical')
  if (caps.hasStairmaster) modalities.push('Stairmaster / StepMill')
  if (caps.hasSkiErg) modalities.push('SkiErg')
  if (caps.hasJumpRope) modalities.push('Jump Rope')
  if (caps.hasOutdoorRunning) modalities.push('Outdoor Running')
  if (caps.hasOutdoorCycling) modalities.push('Outdoor Cycling')
  if (caps.hasHiking) modalities.push('Outdoor Walking / Rucking')
  if (caps.hasSwimming) modalities.push('Swimming')

  if (caps.isBodyweightCardioOnly) {
    modalities.push('Outdoor Walking / Rucking')
    modalities.push('Outdoor Running / Jogging')
    modalities.push('Bodyweight Aerobic / Agility Intervals')
  }

  const unique = Array.from(new Set(modalities))
  return unique.length > 0 ? unique : ['Outdoor Walking / Rucking', 'Bodyweight Aerobic Intervals']
}

export const NASM_OPT_PHASE_STANDARDS: Record<
  number,
  {
    phaseName: string
    reps: string
    sets: string
    tempo: string
    rest: string
    intensityPctRange: [number, number]
    systemDescription: string
  }
> = {
  1: {
    phaseName: 'Stabilization Endurance',
    reps: '12–20',
    sets: '2–3',
    tempo: '4/2/1',
    rest: '0–90s',
    intensityPctRange: [0.5, 0.7],
    systemDescription: 'High neuromuscular demand, proprioceptively enriched environments, slow eccentric & isometric control to fortify joint ligaments, core stabilizers, and postural integrity.',
  },
  2: {
    phaseName: 'Strength Endurance',
    reps: '8–12 (Superset)',
    sets: '2–4',
    tempo: '2/0/2 (Strength) + 4/2/1 (Stability)',
    rest: '0–60s',
    intensityPctRange: [0.7, 0.8],
    systemDescription: 'Biomechanical contrast supersets pairing a heavy stable prime mover exercise immediately with a biomechanically similar stabilization challenge.',
  },
  3: {
    phaseName: 'Muscular Development (Hypertrophy)',
    reps: '6–12',
    sets: '3–5',
    tempo: '2/0/2',
    rest: '60–90s',
    intensityPctRange: [0.75, 0.85],
    systemDescription: 'Maximal mechanical tension and metabolic stress across 12–20 weekly sets per muscle group to stimulate maximal myofibrillar and sarcoplasmic hypertrophy.',
  },
  4: {
    phaseName: 'Maximal Strength',
    reps: '1–5',
    sets: '4–6',
    tempo: 'Explosive / 1/1/1',
    rest: '3–5 min',
    intensityPctRange: [0.85, 1.0],
    systemDescription: 'Maximal motor unit recruitment, rate coding, and central nervous system force production with full neurological recovery.',
  },
  5: {
    phaseName: 'Power & Post-Activation Potentiation',
    reps: '1–5 (Strength) + 8–10 (Power)',
    sets: '3–5',
    tempo: 'Max Explosive Velocity',
    rest: '1–2 min between pairs, 3 min between sets',
    intensityPctRange: [0.85, 0.9],
    systemDescription: 'Post-Activation Potentiation (PAP) contrast supersets pairing a maximal strength lift (85-100% 1RM) with an explosive, high-velocity movement (30-45% 1RM or bodyweight) to maximize Rate of Force Development (RFD).',
  },
}

export function generateStrengthCardioBlendSummary(
  goal: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness',
  sessionsPerWeek: number,
  nasmOptPhase: number = 1
): StrengthCardioBlendSummary {
  const phaseLabel = `OPT™ Phase ${nasmOptPhase}`
  switch (goal) {
    case 'fat_loss':
      return {
        goal: `Fat Loss & Metabolic Rate Optimization (${phaseLabel})`,
        blendRatio: nasmOptPhase === 1 ? '50% Strength / 50% Cardio Base' : '55% Strength / 45% Cardio & EPOC',
        strengthPct: nasmOptPhase === 1 ? 50 : 55,
        cardioPct: nasmOptPhase === 1 ? 50 : 45,
        weeklyStrengthSessions: sessionsPerWeek,
        weeklyCardioMinutes: sessionsPerWeek * 20 + 30,
        primaryCardioStages: nasmOptPhase === 1
          ? 'Stage 1 (Aerobic Base / Zone 1)'
          : 'Stage 1 (Aerobic Base / Zone 1) + Stage 2 (Lactate Threshold Intervals / Zone 2)',
        interferenceShieldStrategy: 'Cardio performed immediately post-resistance training (or separated by ≥6 hours). Low-impact modalities (incline walk, rower, cycle) prevent joint strain while protecting lean muscle mass and BMR.',
        clinicalGuideline: `NASM CPT-7 Ch. 8 (Bioenergetics) & Ch. 15 (Cardiorespiratory Training): Resistance training depletes glycogen and elevates EPOC; ${phaseLabel} cardio maximizes lipid oxidation without cortisol spikes.`,
      }
    case 'hypertrophy':
      return {
        goal: `Muscular Development (${phaseLabel})`,
        blendRatio: '80% Strength / 20% Cardio & Recovery',
        strengthPct: 80,
        cardioPct: 20,
        weeklyStrengthSessions: sessionsPerWeek,
        weeklyCardioMinutes: sessionsPerWeek * 12,
        primaryCardioStages: 'Stage 1 (Low-Impact Aerobic Base / Zone 1)',
        interferenceShieldStrategy: 'Cardio kept at low intensity (<75% HRmax, 10–15 mins) to stimulate capillary density and nutrient delivery without activating AMPK-mediated catabolism or blunting mTOR protein synthesis.',
        clinicalGuideline: 'NASM CPT-7 Ch. 15: Low-impact Zone 1 cycling/walking accelerates inter-set metabolic recovery and venous return with zero eccentric interference on hypertrophy.',
      }
    case 'performance':
      return {
        goal: `Maximal Strength & Athletic Power (${phaseLabel})`,
        blendRatio: '65% Strength & Power / 35% SAQ & HIIT',
        strengthPct: 65,
        cardioPct: 35,
        weeklyStrengthSessions: sessionsPerWeek,
        weeklyCardioMinutes: sessionsPerWeek * 15,
        primaryCardioStages: nasmOptPhase === 5
          ? 'Stage 3 & Stage 4 (Peak Anaerobic Power / Zone 3 & 4 Tabata Sprints)'
          : 'Stage 2 & Stage 3 (Anaerobic Power / Zone 2 & 3 HIIT)',
        interferenceShieldStrategy: 'High-intensity intervals structured as 1:3 or 1:2 work-to-rest sprints (30s max effort / 90s active recovery) on curved treadmills or air bikes to mirror athletic bioenergetics.',
        clinicalGuideline: 'NASM CPT-7 Ch. 8 & 19: High-velocity intervals enhance rate of force development (RFD) and fast glycolytic power without degrading maximal CNS force output.',
      }
    case 'general_fitness':
    default:
      return {
        goal: `Functional Health & Cardiometabolic Longevity (${phaseLabel})`,
        blendRatio: '50% Strength / 50% Cardio & Longevity',
        strengthPct: 50,
        cardioPct: 50,
        weeklyStrengthSessions: sessionsPerWeek,
        weeklyCardioMinutes: 150,
        primaryCardioStages: 'Stage 1 (Zone 1 Base) & Stage 2 (Zone 2 Moderate Intervals)',
        interferenceShieldStrategy: 'Balanced concurrent training targeting 150 minutes of weekly moderate aerobic activity alongside full-body multiplanar stabilization resistance.',
        clinicalGuideline: 'NASM CPT-7 Ch. 1 & 15: Meets ACSM/AHA evidence-based physical activity guidelines for optimal cardiometabolic risk reduction and functional independence.',
      }
  }
}

export function buildIntegratedCardioPrescription(params: {
  goal: string
  phase: number
  dayIndex: number
  totalDays: number
  clientAge?: number
  blendStyle?: 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush' | 'none'
  equipmentAccess?: string[]
  cardioEquipmentAccess?: string[]
}): IntegratedCardioPrescription | undefined {
  const { goal, phase, dayIndex, totalDays, clientAge = 35, blendStyle = 'integrated_finishers', equipmentAccess, cardioEquipmentAccess } = params
  if (blendStyle === 'none') return undefined

  const zones = calculateCardioZones(clientAge)
  const caps = parseCardioEquipmentCapabilities(cardioEquipmentAccess, equipmentAccess)

  if (goal === 'fat_loss') {
    const isIntervalDay = dayIndex % 2 === 0 && (phase > 1 || totalDays <= 3)
    if (isIntervalDay) {
      const modalities = buildRecommendedCardioModalities(2, goal, caps)
      return {
        title: 'Stage 2: Aerobic Threshold Intervals',
        protocolType: 'stage_interval_conditioning',
        stage: 2,
        stageName: 'Stage 2: Threshold Interval Protocol',
        targetZone: `Zone 2 (${zones.zone2.minBpm}–${zones.zone2.maxBpm} BPM) ↔ Zone 1 (${zones.zone1.minBpm}–${zones.zone1.maxBpm} BPM)`,
        targetBpmRange: `${zones.zone2.minBpm}–${zones.zone2.maxBpm} BPM`,
        targetRpe: 'RPE 6–7 / 10 (Challenging Threshold Pace)',
        durationMins: phase === 1 ? 15 : 20,
        workRestRatio: 'Intervals: 1:2 Work-to-Rest (60s Work / 120s Recovery × 6 rounds)',
        timingGuideline: 'Perform immediately post-resistance training (or separated by ≥6 hours). Strength first → Cardio second.',
        recommendedModalities: modalities,
        metabolicRationale: 'Pushes aerobic threshold and elevates 24-hour Excess Post-Exercise Oxygen Consumption (EPOC) to increase total daily energy expenditure.',
        coachingCues: [
          'Work Intervals: Push effort to RPE 6–7 (speaking requires pausing for breath).',
          'Recovery Intervals: Active recovery at RPE 2–3 to bring heart rate back into Zone 1 before the next round.',
          'Maintain steady pacing, tall posture, and controlled breathing.',
        ],
        nasmChapterSource: 'NASM CPT-7 Chapter 8 (Bioenergetics) & Chapter 15 (Cardiorespiratory Stage Training)',
      }
    } else {
      const modalities = buildRecommendedCardioModalities(1, goal, caps)
      return {
        title: 'Stage 1: Steady-State Aerobic Base',
        protocolType: 'post_lift_finisher',
        stage: 1,
        stageName: 'Stage 1: Aerobic Base & Lipid Mobilization',
        targetZone: `Zone 1 (${zones.zone1.minBpm}–${zones.zone1.maxBpm} BPM / 65–75% HRmax)`,
        targetBpmRange: `${zones.zone1.minBpm}–${zones.zone1.maxBpm} BPM`,
        targetRpe: 'RPE 3–4 / 10 (Moderate Conversational Pace)',
        durationMins: 20,
        workRestRatio: 'Steady State: Continuous Aerobic Pace',
        timingGuideline: 'Perform immediately following strength training when glycogen is depleted for enhanced fatty acid oxidation.',
        recommendedModalities: modalities,
        metabolicRationale: 'Maximizes fat oxidation in a glycogen-depleted state without elevating cortisol or interfering with joint and muscular recovery.',
        coachingCues: [
          'Maintain a smooth, continuous conversational pace at RPE 3–4 (able to speak in complete sentences).',
          'Maintain upright posture with natural arm swing; avoid gripping handrails.',
          'Focus on smooth diaphragmatic nasal breathing throughout.',
        ],
        nasmChapterSource: 'NASM CPT-7 Chapter 15 & Fat Loss Suites (CPT7_Fat_Loss1–12.pdf)',
      }
    }
  }

  if (goal === 'hypertrophy') {
    const modalities = buildRecommendedCardioModalities(1, goal, caps)
    return {
      title: 'Stage 1: Low-Impact Active Recovery Flush',
      protocolType: 'active_recovery_flush',
      stage: 1,
      stageName: 'Stage 1: Active Recovery Flush',
      targetZone: `Zone 1 (${zones.zone1.minBpm}–${zones.zone1.maxBpm} BPM / 65–75% HRmax)`,
      targetBpmRange: `${zones.zone1.minBpm}–${zones.zone1.maxBpm} BPM`,
      targetRpe: 'RPE 3 / 10 (Light Recovery Pace)',
      durationMins: 15,
      workRestRatio: 'Steady State: Continuous Low-Impact',
      timingGuideline: 'Perform post-lift for 10–15 mins or on non-lifting recovery days. Avoid high-impact running to preserve leg recovery for heavy squats.',
      recommendedModalities: modalities,
      metabolicRationale: 'Stimulates intramuscular capillary network density and enhances venous return for accelerated metabolite clearance without activating AMPK or blunting mTOR protein synthesis.',
      coachingCues: [
        'Keep intensity strictly at RPE 3 to facilitate active metabolite clearance without adding fatigue.',
        'Prioritize smooth, low-impact motion to preserve muscular recovery for strength sessions.',
        'Relax upper-body tension and breathe diaphragmatically.',
      ],
      nasmChapterSource: 'NASM CPT-7 Chapter 15 (Aerobic Base) & Chapter 20 (Resistance Systems)',
    }
  }

  if (goal === 'performance') {
    const isSprintDay = dayIndex % 2 === 1
    if (isSprintDay) {
      const modalities = buildRecommendedCardioModalities(3, goal, caps)
      return {
        title: 'Stage 3: Anaerobic Power Sprint Intervals',
        protocolType: 'pap_hiit_contrast',
        stage: 3,
        stageName: 'Stage 3: Anaerobic Power & Peak Output HIIT',
        targetZone: `Zone 3 (${zones.zone3.minBpm}–${zones.zone3.maxBpm} BPM) ↔ Zone 1 (${zones.zone1.minBpm}–${zones.zone1.maxBpm} BPM)`,
        targetBpmRange: `${zones.zone3.minBpm}–${zones.zone3.maxBpm} BPM`,
        targetRpe: 'RPE 8–9 / 10 (Near Maximal High Power)',
        durationMins: 15,
        workRestRatio: 'Sprint Intervals: 1:3 Work-to-Rest (30s High Output / 90s Recovery × 5 rounds)',
        timingGuideline: 'Perform at the end of athletic power / PAP training sessions or as a dedicated conditioning wave.',
        recommendedModalities: modalities,
        metabolicRationale: 'Challenges Rate of Force Development (RFD), peak anaerobic glycolysis, and rapid ATP-PC regeneration matching high-level athletic performance demands.',
        coachingCues: [
          'Work Intervals: Attack with high power intent at RPE 8–9.',
          'Recovery Intervals: Full active rest at RPE 2–3 to bring heart rate down before the next sprint.',
          'Prioritize form and mechanics over pure fatigue.',
        ],
        nasmChapterSource: 'NASM CPT-7 Chapter 8 (Bioenergetics), Chapter 18 (Plyometrics) & Chapter 19 (SAQ)',
      }
    } else {
      const modalities = buildRecommendedCardioModalities(2, goal, caps)
      return {
        title: 'Stage 2: Lactate Threshold Intervals',
        protocolType: 'stage_interval_conditioning',
        stage: 2,
        stageName: 'Stage 2: Threshold Interval Protocol',
        targetZone: `Zone 2 (${zones.zone2.minBpm}–${zones.zone2.maxBpm} BPM) ↔ Zone 1 Recovery`,
        targetBpmRange: `${zones.zone2.minBpm}–${zones.zone2.maxBpm} BPM`,
        targetRpe: 'RPE 6–7 / 10 (Challenging Threshold Pace)',
        durationMins: 16,
        workRestRatio: 'Intervals: 1:2 Work-to-Rest (45s Work / 90s Recovery × 6 rounds)',
        timingGuideline: 'Perform post-strength or on dedicated conditioning days.',
        recommendedModalities: modalities,
        metabolicRationale: 'Improves lactate buffering capacity and cardiovascular stroke volume.',
        coachingCues: [
          'Work Intervals: Maintain strong threshold effort at RPE 6–7.',
          'Recovery: Active recovery at RPE 2–3 with rhythmic breathing.',
        ],
        nasmChapterSource: 'NASM CPT-7 Chapter 15',
      }
    }
  }

  const stageNumber: 1 | 2 = dayIndex % 2 === 1 ? 1 : 2
  const modalities = buildRecommendedCardioModalities(stageNumber, goal, caps)
  return {
    title: stageNumber === 1 ? 'Stage 1: Steady-State Aerobic Base' : 'Stage 2: Aerobic Threshold Intervals',
    protocolType: 'steady_state_base',
    stage: stageNumber,
    stageName: stageNumber === 1 ? 'Stage 1: Aerobic Base (Zone 1)' : 'Stage 2: Aerobic Threshold (Zone 2)',
    targetZone: stageNumber === 1 ? `Zone 1 (${zones.zone1.minBpm}–${zones.zone1.maxBpm} BPM / 65–75% HRmax)` : `Zone 2 (${zones.zone2.minBpm}–${zones.zone2.maxBpm} BPM / 76–85% HRmax)`,
    targetBpmRange: stageNumber === 1 ? `${zones.zone1.minBpm}–${zones.zone1.maxBpm} BPM` : `${zones.zone2.minBpm}–${zones.zone2.maxBpm} BPM`,
    targetRpe: stageNumber === 1 ? 'RPE 3–4 / 10 (Moderate Conversational Pace)' : 'RPE 5–6 / 10 (Moderate to Challenging)',
    durationMins: 20,
    workRestRatio: stageNumber === 1 ? 'Steady State: Continuous Aerobic Pace' : 'Intervals: 1:2 Work-to-Rest (60s Work / 120s Recovery × 6 rounds)',
    timingGuideline: 'Perform post-workout to achieve the 150 min/week physical activity target for longevity.',
    recommendedModalities: modalities,
    metabolicRationale: 'Reduces cardiometabolic disease risk, improves insulin sensitivity, and preserves cardiovascular functional reserve.',
    coachingCues: [
      'Focus on consistent pacing, diaphragmatic breathing, and perceived exertion.',
      'Maintain tall spine and relaxed shoulders.',
    ],
    nasmChapterSource: 'NASM CPT-7 Chapter 1 (Health & Fitness) & Chapter 15 (Cardiorespiratory Training)',
  }
}

export function generateRagNasmProgram(request: RagProgramGenerationRequest): GeneratedMacrocyclePlan {
  let phase = request.targetNasmPhase
  if (!phase) {
    if (request.goal === 'fat_loss') phase = request.experienceLevel === 'beginner' ? 1 : 2
    else if (request.goal === 'hypertrophy') phase = 3
    else if (request.goal === 'performance') phase = request.experienceLevel === 'elite' ? 5 : 4
    else phase = 1
  }

  const phaseMeta = NASM_OPT_PHASE_STANDARDS[phase] ?? NASM_OPT_PHASE_STANDARDS[1]
  const daysPerWeek = Math.min(6, Math.max(2, request.trainingDaysPerWeek ?? 4))

  const citedDocs = queryNasmRagLibrary({
    goal: request.goal === 'general_fitness' ? 'fat_loss' : request.goal,
    nasmOptPhase: phase,
  })
  const ragSourcesCited = citedDocs.map(d => `${d.title} (${d.filename})`)

  const eq = parseEquipmentCapabilities(request.equipmentAccess)
  const strengthCardioBlendSummary = generateStrengthCardioBlendSummary(request.goal, daysPerWeek, phase)
  const detectedInjuries = parseInjuriesFromText(request.injuriesLimitations)
  const allContraTags = Array.from(
    new Set([...(request.contraindicationTags ?? []), ...detectedInjuries.selectedInjuryIds])
  )
  const injuryAugmentations = getInjuryAugmentations(allContraTags)

  const workouts: GeneratedWorkoutDay[] = []

  for (let dayIndex = 1; dayIndex <= daysPerWeek; dayIndex++) {
    const workoutDay = buildDistinctOptWorkoutDay({
      dayIndex,
      totalDays: daysPerWeek,
      phase,
      goal: request.goal,
      clientAge: request.clientAge,
      cardioBlendStyle: request.cardioBlendStyle,
      equipment: request.equipmentAccess ?? [
        'barbell',
        'squat rack',
        'dumbbell',
        'cable',
        'machines',
        'bench',
        'band',
        'pull-up bar',
        'stability ball',
        'medicine ball',
        'bodyweight',
      ],
      benchmarks: request.knownBenchmarks,
      kineticCompensations: request.kineticCompensations,
      cardioEquipment: request.cardioEquipmentAccess,
    })

    // 1. Strict Equipment Boundary Shield: Enforce client equipment availability & auto-substitute first
    if (request.equipmentAccess && request.equipmentAccess.length > 0) {
      for (const exercise of workoutDay.exercises) {
        const originalName = exercise.name
        const substitutedName = substituteMissingEquipment(originalName, request.equipmentAccess, [])
        if (substitutedName !== originalName) {
          exercise.name = substitutedName
        }
      }
    }

    // 2. Apply Biomechanical Contraindications Shield (Sports Injuries & Orthopedic Substitutions) with final authority
    if (allContraTags.length > 0) {
      for (const exercise of workoutDay.exercises) {
        const contraCheck = checkExerciseContraindications(exercise.name, allContraTags)
        if (contraCheck.isContraindicated && contraCheck.replacement) {
          const originalName = exercise.name
          exercise.name = contraCheck.replacement
          exercise.contraindicationReplacedFrom = originalName
          if (contraCheck.coachingCue) {
            exercise.coachingCues = [
              `🛡️ Injury Protection Shield: Replaced "${originalName}" (${contraCheck.ruleLabel || 'Medical Safety'})`,
              contraCheck.coachingCue,
              ...exercise.coachingCues,
            ]
          }
          if (contraCheck.rationale) {
            exercise.nasmClinicalSource = `${exercise.nasmClinicalSource} | Biomechanical Safety: ${contraCheck.rationale}`
          }
        }
      }

      // Augment Warmup Continuum with targeted SMR and dynamic activations for injuries
      if (injuryAugmentations.warmupSmr.length > 0) {
        workoutDay.warmupProtocol.inhibitSmr = Array.from(
          new Set([...injuryAugmentations.warmupSmr, ...workoutDay.warmupProtocol.inhibitSmr])
        )
      }
      if (injuryAugmentations.warmupDynamic.length > 0) {
        workoutDay.warmupProtocol.activateDynamic = Array.from(
          new Set([...injuryAugmentations.warmupDynamic, ...workoutDay.warmupProtocol.activateDynamic])
        )
      }

      // Augment Cardio Protocol if impact-sensitive injuries exist
      if (workoutDay.cardioProtocol && injuryAugmentations.avoidCardioModalities.length > 0) {
        const filteredModalities = workoutDay.cardioProtocol.recommendedModalities.filter(
          m => !injuryAugmentations.avoidCardioModalities.includes(m)
        )
        if (filteredModalities.length > 0) {
          workoutDay.cardioProtocol.recommendedModalities = filteredModalities
        } else if (injuryAugmentations.recommendedCardioModalities.length > 0) {
          workoutDay.cardioProtocol.recommendedModalities = [
            ...injuryAugmentations.recommendedCardioModalities,
          ]
        }
      }

      // Augment Daily Periodization Memo with injury safeguards
      if (injuryAugmentations.trainerProtocols.length > 0) {
        const primaryProtocols = injuryAugmentations.trainerProtocols.slice(0, 2).join('; ')
        workoutDay.dailyPeriodizationMemo = `${workoutDay.dailyPeriodizationMemo} [Orthopedic Protection]: ${primaryProtocols}.`
      }
    }

    // Strict Media Resolution: Guarantee 100% official NASM video demos & CDN thumbnails on every exercise
    workoutDay.exercises = workoutDay.exercises.map(ex => enrichExerciseMedia(ex))

    workouts.push(workoutDay)
  }

  let envSuffix = ''
  if (eq.isBodyweightOnly) envSuffix = ' (Bodyweight / Calisthenics)'
  else if (eq.isBandsOnly) envSuffix = ' (Travel Bands Suite)'
  else if (eq.isHomeDumbbellOnly) envSuffix = ' (Home Dumbbell & Bands)'
  else if (!eq.hasBarbell) envSuffix = ' (Home Studio)'

  const planTitle = `Executive ${phaseMeta.phaseName} Macrocycle${envSuffix} [${strengthCardioBlendSummary.strengthPct}/${strengthCardioBlendSummary.cardioPct} Strength-Cardio] (${daysPerWeek}-Day Split)`

  const periodizationWeeklyMemos = [
    `Week 1 (${phaseMeta.phaseName} Introduction - ${eq.summaryLabel}): Establish movement quality, strict tempo control (${phaseMeta.tempo}), and baseline neuromuscular stabilization on available equipment. Integrated Cardio: ${strengthCardioBlendSummary.primaryCardioStages}.`,
    `Week 2 (Progressive Volume & Work Capacity Increment): Increase working volume and resistance density while maintaining pristine biomechanical alignment and prescribed rest periods (${phaseMeta.rest}).`,
    `Week 3 (Peak Mesocycle Intensity & EPOC Drive): Challenge maximal progressive overload within the target ${Math.round(phaseMeta.intensityPctRange[0] * 100)}–${Math.round(phaseMeta.intensityPctRange[1] * 100)}% load window. Push interval conditioning work-to-rest intensity.`,
    `Week 4 (Deload / Consolidation & Assessment): Reduce strength volume by 30% and maintain Zone 1 active recovery to clear systemic fatigue and prepare for the next OPT™ phase.`,
  ]

  return {
    planTitle,
    primaryGoal: request.goal.replace(/_/g, ' ').toUpperCase(),
    nasmOptPhase: phase,
    phaseName: phaseMeta.phaseName,
    totalWeeks: 4,
    sessionsPerWeek: daysPerWeek,
    ragSourcesCited,
    strengthCardioBlendSummary,
    workouts,
    periodizationWeeklyMemos,
  }
}

/**
 * Builds completely distinct, authentic daily workout programming based on day number, phase, and available equipment.
 */
function buildDistinctOptWorkoutDay(params: {
  dayIndex: number
  totalDays: number
  phase: number
  goal: string
  equipment: string[]
  cardioEquipment?: string[]
  clientAge?: number
  cardioBlendStyle?: 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush' | 'none'
  benchmarks?: Record<string, { weightLbs: number; reps: number }>
  kineticCompensations?: string[]
}): GeneratedWorkoutDay {
  const { dayIndex, phase, benchmarks, kineticCompensations = [], equipment, cardioEquipment, goal, totalDays, clientAge, cardioBlendStyle } = params
  const phaseMeta = NASM_OPT_PHASE_STANDARDS[phase]
  const eq = parseEquipmentCapabilities(equipment)

  // Calculate 1RM loads
  const rawBench1RM = benchmarks?.['Bench Press'] ? calculateOneRepMax(benchmarks['Bench Press'].weightLbs, benchmarks['Bench Press'].reps) : undefined
  const rawSquat1RM = benchmarks?.['Squat'] ? calculateOneRepMax(benchmarks['Squat'].weightLbs, benchmarks['Squat'].reps) : undefined
  const rawDeadlift1RM = benchmarks?.['Deadlift'] ? calculateOneRepMax(benchmarks['Deadlift'].weightLbs, benchmarks['Deadlift'].reps) : undefined

  let focus = 'Total Body'
  const exercises: GeneratedExerciseItem[] = []

  // Dynamic Warmup based on Movement Screen
  const warmupProtocol = {
    inhibitSmr: [
      'Gastrocnemius / Soleus (Calves) SMR - 30 seconds hold per side',
      'Tensor Fasciae Latae (TFL) & IT Band SMR - 30 seconds per side',
      'Latissimus Dorsi SMR - 30 seconds hold along lateral ribcage',
    ],
    lengthenStaticStretch: [
      'Static Standing Calf Stretch - 30 seconds hold',
      'Static Kneeling Hip Flexor Stretch - 30 seconds hold',
      'Static Ball / Doorframe Pectoral Stretch - 30 seconds hold',
    ],
    activateDynamic: [
      'Prone Cobra (Scapular Retraction) - 12 reps with 3s hold',
      'Single-Leg Floor Bridge (Gluteus Maximus Activation) - 15 reps/leg',
      'Multiplanar Step-to-Balance - 10 reps/leg',
    ],
  }

  // ── DEDICATED CARDIO / ACTIVE RECOVERY DAY (Off-Day for Strength) ──────────
  if (cardioBlendStyle === 'dedicated_conditioning' && dayIndex % 2 === 0) {
    const cardioProtocol = buildIntegratedCardioPrescription({
      goal,
      phase,
      dayIndex,
      totalDays,
      clientAge,
      blendStyle: 'dedicated_conditioning',
      equipmentAccess: equipment,
      cardioEquipmentAccess: cardioEquipment,
    })

    const primaryModality = cardioProtocol?.recommendedModalities[0] || 'Incline Treadmill Walk'
    const secondaryModality = cardioProtocol?.recommendedModalities[1] || 'Concept2 Rower'

    const cardioExercises: GeneratedExerciseItem[] = [
      {
        block: 'warmup',
        name: 'Foam Roll Calves',
        sets: '1',
        reps: '60s',
        tempo: 'Hold tender spots',
        rest: '0s',
        coachingCues: ['Progressively elevate core body temperature, roll slowly and hold tender trigger points for 30-60s.'],
        nasmClinicalSource: 'NASM CPT-7 Chapter 14 & 15',
      },
      {
        block: 'saq',
        name: `Prescribed Cardiorespiratory Protocol: ${primaryModality}`,
        sets: '1',
        reps: `${cardioProtocol?.durationMins || 20} min`,
        tempo: cardioProtocol?.workRestRatio || 'Continuous',
        rest: '0s',
        coachingCues: cardioProtocol?.coachingCues || ['Stay strictly within prescribed heart rate zone.'],
        nasmClinicalSource: cardioProtocol?.nasmChapterSource || 'NASM CPT-7 Chapter 15',
      },
      {
        block: 'saq',
        name: `Active Recovery Modality: ${secondaryModality}`,
        sets: '1',
        reps: '10 min',
        tempo: 'Steady Zone 1 Flush',
        rest: '0s',
        coachingCues: ['Low-impact steady movement to facilitate metabolite flush and capillary circulation.'],
        nasmClinicalSource: 'NASM CPT-7 Chapter 15',
      },
      {
        block: 'cooldown',
        name: 'Static Kneeling Hip Flexor Stretch',
        sets: '1',
        reps: '30s',
        tempo: 'Slow diaphragmatic',
        rest: '0s',
        coachingCues: ['Deep diaphragmatic breathing to initiate rapid parasympathetic nervous system recovery. Hold static for 30s per side.'],
        nasmClinicalSource: 'NASM CPT-7 Chapter 14',
      },
    ]

    const cardioFocus = `Stage ${cardioProtocol?.stage || 1} Cardiorespiratory Conditioning & Active Recovery`

    return {
      day: dayIndex,
      dayName: `Day ${dayIndex}: ${cardioFocus}`,
      focus: cardioFocus,
      nasmOptPhase: phase,
      phaseName: 'Cardiorespiratory Conditioning & Recovery',
      estimatedDurationMins: (cardioProtocol?.durationMins || 20) + 15,
      warmupProtocol,
      exercises: cardioExercises,
      cardioProtocol,
      dailyPeriodizationMemo: `Dedicated cardiorespiratory conditioning session (${cardioProtocol?.title}) designed to enhance aerobic capacity, lactate threshold, and metabolic recovery without neuromuscular interference on non-strength days.`,
    }
  }

  if (kineticCompensations.includes('knees_cave_in')) {
    warmupProtocol.inhibitSmr.push('Adductor Complex SMR - 30s per leg')
    warmupProtocol.lengthenStaticStretch.push('Static Side Lunge Adductor Stretch - 30s per side')
    warmupProtocol.activateDynamic.push(
      eq.hasBands
        ? 'Lateral Band Walk (Gluteus Medius Activation) - 15 steps each way'
        : 'Side-Lying Clamshell with 2s Hold - 15 reps/leg'
    )
  }

  if (kineticCompensations.includes('excessive_forward_lean')) {
    warmupProtocol.inhibitSmr.push('Quadriceps & Rectus Femoris SMR - 30s per leg')
    warmupProtocol.lengthenStaticStretch.push('Static Quad & Psoas Stretch - 30s per side')
    warmupProtocol.activateDynamic.push('Standing Quadruped Bird-Dog - 12 reps per side')
  }

  if (kineticCompensations.includes('arms_fall_forward')) {
    warmupProtocol.inhibitSmr.push('Pectoralis Major / Minor SMR - 30s per side')
    warmupProtocol.lengthenStaticStretch.push('Static Doorframe Latissimus Stretch - 30s per side')
    warmupProtocol.activateDynamic.push('Band / Bodyweight Wall Slides (Lower Trapezius Activation) - 12 reps')
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── PHASE 1: STABILIZATION ENDURANCE (4/2/1 Tempo, Proprioceptive Demand) ───
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 1) {
    if (dayIndex === 1) {
      focus = 'Upper Body Horizontal Push & Pull Stabilization'

      // 1. Core / Balance
      if (eq.hasStabilityBall) {
        exercises.push({
          block: 'core_balance',
          name: 'Dead Bug',
          sets: '2',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '30s',
          coachingCues: ['Maintain neutral lumbopelvic alignment', 'Drawing-in maneuver active'],
          nasmClinicalSource: 'CPT7_Ch16 (Core Stabilization Concepts)',
        })
      } else {
        exercises.push({
          block: 'core_balance',
          name: 'Single Leg Floor Bridge',
          sets: '2',
          reps: '12 per leg (3s hold)',
          tempo: '4/2/1',
          rest: '30s',
          coachingCues: ['Drive through active heel', 'Keep pelvis level, no rotation'],
          nasmClinicalSource: 'CPT7_Ch16 (Floor Core Stabilization)',
        })
      }

      // 2. Push Stabilization
      if (eq.hasStabilityBall && eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bench Press',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.65,
          targetLoadLbs: loadFromOneRepMax(rawBench1RM, 0.65),
          coachingCues: ['4-second eccentric descent, 2-second hold at bottom', 'Keep glutes bridged high'],
          nasmClinicalSource: 'CPT7_Fat_Loss1.pdf & Chapter 21',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bench Press',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.65,
          targetLoadLbs: loadFromOneRepMax(rawBench1RM, 0.65),
          coachingCues: ['Hold bridge position for core engagement', 'Strict 4-second descent to floor tap'],
          nasmClinicalSource: 'CPT7_Fat_Loss1.pdf (Home Dumbbell Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Two Arm Dumbbell Chest Press With Band',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Press forward while balancing on single leg', 'Resist backward band recoil with core'],
          nasmClinicalSource: 'CPT7_Ch21 (Elastic Resistance Progressions)',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Push Up',
          sets: '3',
          reps: '12–15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Lower chest to 2 inches from floor in 4 seconds', 'Hold bottom for 2 seconds before pushing'],
          nasmClinicalSource: 'CPT7_Ch21 (Calisthenic Stabilization Continuum)',
        })
      }

      // 3. Pull Stabilization
      if (eq.hasCables) {
        exercises.push({
          block: 'resistance',
          name: 'Single Arm Standing Row With Rotation',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.6,
          coachingCues: ['Resist rotational torque with contralateral core', 'Retract scapula before elbow pull'],
          nasmClinicalSource: 'CPT7_Fat_Loss2.pdf & Chapter 21',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bent Over Row',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.6,
          coachingCues: ['Hinge at hip on standing leg', 'Row dumbbell to hip while keeping back flat'],
          nasmClinicalSource: 'CPT7_Fat_Loss2.pdf (Home Dumbbell Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Standing Tubing Row',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Anchor band at mid-torso height', 'Drive elbow into pocket without torso twist'],
          nasmClinicalSource: 'CPT7_Ch21 (Banded Unilateral Systems)',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Floor Prone Cobra',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Rotate thumbs externally toward ceiling', 'Squeeze middle and lower trapezius for 3s hold'],
          nasmClinicalSource: 'CPT7_Ch16 (Posterior Chain Activation)',
        })
      }

      // 4. Shoulder Stabilization
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Scaption',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.5,
          coachingCues: ['Raise dumbbells in 45-degree scapular plane', 'Do not shrug upper trapezius'],
          nasmClinicalSource: 'CPT7_Ch21 (Shoulder Stabilization)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Scaption',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Step on band with active foot', 'Raise arms at 45 degrees with thumbs facing upward'],
          nasmClinicalSource: 'CPT7_Ch21 (Elastic Shoulder Systems)',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Single Arm Scaption',
          sets: '3',
          reps: '12 per position',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Cycle Y, T, and W arm positions in balance', 'Hold peak scapular squeeze 2 seconds'],
          nasmClinicalSource: 'CPT7_Ch21 (Proprioceptive Scapular Protocols)',
        })
      }

      // 5. Arm / Triceps Stabilization
      if (eq.hasStabilityBall && eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bent Over Extention',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.55,
          coachingCues: ['Lock elbows at ribcage level', 'Hold 2-second peak triceps contraction'],
          nasmClinicalSource: 'CPT7_Fat_Loss3-1.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bent Over Extention',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.55,
          coachingCues: ['Hinge slightly at hips on single leg', 'Full elbow extension with 2s hold'],
          nasmClinicalSource: 'CPT7_Fat_Loss3-1.pdf (Home Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Seated Single Arm Dumbbell Tricep Extension',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Pin elbows to side ribs', '4-second eccentric return'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Plank Walkup',
          sets: '3',
          reps: '12–15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['From forearm plank, press through palms to extend elbows', 'Control descent back to forearms'],
          nasmClinicalSource: 'CPT7_Ch16',
        })
      }
    } else if (dayIndex === 2) {
      focus = 'Lower Body Knee & Hip Stabilization'

      // 1. Balance
      exercises.push({
        block: 'core_balance',
        name: 'Single Leg Balance Reach Multiplanar',
        sets: '2',
        reps: '12 per leg',
        tempo: '4/2/1',
        rest: '30s',
        coachingCues: ['Reach anterior, lateral, and posterior without foot touchdown'],
        nasmClinicalSource: 'CPT7_Ch17 (Balance Training Concepts)',
      })

      // 2. Unilateral Squat
      exercises.push({
        block: 'resistance',
        name: eq.hasDumbbells
          ? 'Single-Leg Squat to Box / Bench (Dumbbell Counterbalance)'
          : 'Single-Leg Squat to Chair / Step (Bodyweight Balance)',
        sets: '3',
        reps: '15 per leg',
        tempo: '4/2/1',
        rest: '60s',
        intensityPercentage1RM: 0.6,
        targetLoadLbs: eq.hasDumbbells ? loadFromOneRepMax(rawSquat1RM, 0.45) : undefined,
        coachingCues: ['Knee stays aligned over 2nd and 3rd toes', '4-second slow descent to gentle tap'],
        nasmClinicalSource: 'CPT7_Fat_Loss4.pdf & Chapter 21',
      })

      // 3. Unilateral Hinge
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Romanian Deadlift',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.55,
          coachingCues: ['Hinge at hip with neutral spine', 'Square hips to the floor'],
          nasmClinicalSource: 'CPT7_Fat_Loss5.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Romanian Deadlift',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Loop band under front foot', 'Drive hips forward against band tension'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Romanian Deadlift To Pnf Pattern 1',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Form a straight line from head to back heel', 'Pause 2s in horizontal plane'],
          nasmClinicalSource: 'CPT7_Ch17',
        })
      }

      // 4. Integrated Step / Lunge
      exercises.push({
        block: 'resistance',
        name: eq.hasDumbbells
          ? 'Multiplanar Step-Up to Balance (Dumbbells)'
          : 'Multiplanar Lunge to Balance (Bodyweight)',
        sets: '3',
        reps: '15 per leg',
        tempo: '4/2/1',
        rest: '60s',
        intensityPercentage1RM: 0.5,
        coachingCues: ['Pause at the top for 2 seconds in single-leg balance before stepping down'],
        nasmClinicalSource: 'CPT7_Ch21 (Integrated Step Progressions)',
      })

      // 5. Hamstring / Glute Posterior Complex
      exercises.push({
        block: 'resistance',
        name: 'Floor Bridge',
        sets: '3',
        reps: '15',
        tempo: '4/2/1',
        rest: '60s',
        intensityPercentage1RM: 0.6,
        coachingCues: ['Drive through heels, squeeze glutes at top peak contraction', 'Keep ribs pulled down, avoid lumbar hyperextension'],
        nasmClinicalSource: 'CPT7_Ch16 (Posterior Core Complex)',
      })
    } else if (dayIndex === 3) {
      focus = 'Rotary Power, Back & Vertical Push Stabilization'

      // 1. Anti-Rotation Core
      if (eq.hasCables) {
        exercises.push({
          block: 'core_balance',
          name: 'Half Kneeling Tubing Rotation',
          sets: '2',
          reps: '15 per side',
          tempo: '4/2/1',
          rest: '30s',
          coachingCues: ['Resist anti-rotation', 'Lock glute of rear leg'],
          nasmClinicalSource: 'CPT7_Ch16 (Anti-Rotation Core Systems)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'core_balance',
          name: 'Half Kneeling Tubing Rotation',
          sets: '2',
          reps: '15 per side',
          tempo: '4/2/1',
          rest: '30s',
          coachingCues: ['Hold hands at sternum, press directly forward without torso twisting', '2s isometric hold'],
          nasmClinicalSource: 'CPT7_Ch16 (Elastic Anti-Rotation)',
        })
      } else {
        exercises.push({
          block: 'core_balance',
          name: 'Side Plank',
          sets: '2',
          reps: '10 per side',
          tempo: '4/2/1',
          rest: '30s',
          coachingCues: ['Maintain straight lateral kinetic chain', 'Zero hip drop'],
          nasmClinicalSource: 'CPT7_Ch16',
        })
      }

      // 2. Vertical Push
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Overhead Press',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.6,
          coachingCues: ['Do not arch lumbar spine', 'Press overhead while balancing on one foot'],
          nasmClinicalSource: 'CPT7_Fat_Loss6.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Standing Tubing Overhead Press',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Loop band under active foot', 'Press overhead in scapular plane'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Pike Push Up',
          sets: '3',
          reps: '12 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Hips high in inverted V', 'Lower crown of head toward floor under strict 4s control'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // 3. Vertical / Inverted Pull
      if (eq.hasCables) {
        exercises.push({
          block: 'resistance',
          name: 'Seated Row',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.6,
          coachingCues: ['Maintain plank posture', 'Retract shoulder blades fully at top'],
          nasmClinicalSource: 'CPT7_Ch22 (Suspension Training Modalities)',
        })
      } else if (eq.hasPullupBar) {
        exercises.push({
          block: 'resistance',
          name: 'Pull Up',
          sets: '3',
          reps: '8–10',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Drive chin over bar', 'Resist gravity for full 4-second descent to dead hang'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bent Over Row',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.6,
          coachingCues: ['Keep lats engaged throughout arch', 'Balance on single leg'],
          nasmClinicalSource: 'CPT7_Fat_Loss6.pdf (Home Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Standing Tubing Row',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Drive elbows down and back into ribcage', '4s eccentric release'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Floor Prone Cobra',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Pull towel taut outward while pulling back to chest', 'Engage entire lat complex'],
          nasmClinicalSource: 'CPT7_Ch16',
        })
      }

      // 4. Diagonal Rotational Pattern
      if (eq.hasCables) {
        exercises.push({
          block: 'resistance',
          name: 'Half Kneeling Tubing Rotation',
          sets: '3',
          reps: '15 per side',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.55,
          coachingCues: ['Pivot on rear foot', 'Engage core through entire diagonal path'],
          nasmClinicalSource: 'CPT7_Fat_Loss7.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Half Kneeling Tubing Rotation',
          sets: '3',
          reps: '15 per side',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Step on band with lead foot', 'Drive diagonal rotation from hips through core'],
          nasmClinicalSource: 'CPT7_Fat_Loss7.pdf (Banded Adaptation)',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Russian Twist',
          sets: '3',
          reps: '15 per side',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.55,
          coachingCues: ['Rotate from trail hip through thoracic spine', '4s eccentric return'],
          nasmClinicalSource: 'CPT7_Fat_Loss7.pdf (Home Dumbbell Adaptation)',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Lunge To Balance Transverse',
          sets: '3',
          reps: '15 per side',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Lunge backwards and sweep arms diagonally across lead knee', 'Maintain balance'],
          nasmClinicalSource: 'CPT7_Ch17',
        })
      }
    } else {
      focus = 'Integrated Full-Body Functional Stability'

      // Core
      exercises.push({
        block: 'core_balance',
        name: 'Plank With Arm Reach',
        sets: '2',
        reps: '12 per side',
        tempo: '4/2/1',
        rest: '30s',
        coachingCues: ['Zero pelvic rotation during reaches'],
        nasmClinicalSource: 'CPT7_Ch16',
      })

      // Squat-to-Press
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Squat To Overhead Press',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.6,
          coachingCues: ['Smooth kinetic transfer from leg drive to overhead lockout'],
          nasmClinicalSource: 'CPT7_Fat_Loss8.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Tubing Squat To Overhead Press',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Stand on loop band, press overhead at top of squat'],
          nasmClinicalSource: 'CPT7_Fat_Loss8.pdf (Banded Adaptation)',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Prisoner Squat Calf Raise',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Full depth squat to explosive calf raise and 2s reach hold'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // Lat / Renegade Row
      if (eq.hasCables) {
        exercises.push({
          block: 'resistance',
          name: 'Seated Machine Row Close Grip',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.6,
          coachingCues: ['Drive elbows down into pockets', '4-second eccentric return'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Renegade Row To Push Up',
          sets: '3',
          reps: '12 per side',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.6,
          coachingCues: ['Lock hips level, row dumbbell to pocket with zero hip sway'],
          nasmClinicalSource: 'CPT7_Ch21 (Home Dumbbell Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Standing Tubing Row',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Anchor band high', 'Drive elbows down while balancing on one foot'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Bird Dog',
          sets: '3',
          reps: '15 per side',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Opposite arm and leg extended in horizontal alignment', 'Squeeze glute and lat'],
          nasmClinicalSource: 'CPT7_Ch16',
        })
      }

      // Lunge to Biceps
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Lunge To Balance',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.55,
          coachingCues: ['Step sagittal, frontal, then transverse'],
          nasmClinicalSource: 'CPT7_Fat_Loss9.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Lunge To Balance',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Step into lunge and curl band at bottom position'],
          nasmClinicalSource: 'CPT7_Fat_Loss9.pdf (Banded Adaptation)',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Lunge To Balance Transverse',
          sets: '3',
          reps: '15 per leg',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Hold bottom lunge for 2 seconds while rotating over front knee'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── PHASE 2: STRENGTH ENDURANCE (Superset: Heavy Strength + Stability) ──────
  // ════════════════════════════════════════════════════════════════════════════
  else if (phase === 2) {
    if (dayIndex % 2 === 1) {
      focus = 'Upper Body Contrast Supersets (Chest, Back & Shoulders)'

      // Pair 1: Chest
      const chestStrengthName = eq.hasBarbell
        ? 'Barbell Flat Bench Press (Strength 1A)'
        : eq.hasDumbbells
        ? 'Dual Dumbbell Flat Bench Press (Strength 1A)'
        : eq.hasBands
        ? 'Heavy Banded Push-Up (Strength 1A)'
        : 'Tempo Deficit Push-Ups (Strength 1A)'

      const chestStabilityName = eq.hasStabilityBall
        ? 'Stability Ball Push-Up (Stability 1B)'
        : 'Push-Up with Single-Leg Balance (Stability 1B)'

      exercises.push(
        {
          block: 'resistance',
          name: chestStrengthName,
          sets: '3',
          reps: '10',
          tempo: '2/0/2',
          rest: '0s (Immediate transition to 1B)',
          intensityPercentage1RM: 0.75,
          targetLoadLbs: eq.hasBarbell || eq.hasDumbbells ? loadFromOneRepMax(rawBench1RM, 0.75) : undefined,
          supersetPairWith: chestStabilityName,
          coachingCues: ['Drive weight with explosive intent @ 75% 1RM', 'Zero rest before stability movement'],
          nasmClinicalSource: 'CPT7_Fat_Loss8.pdf & Chapter 21',
        },
        {
          block: 'resistance',
          name: chestStabilityName,
          sets: '3',
          reps: '12',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.5,
          supersetPairWith: chestStrengthName,
          coachingCues: ['Strict 4-second descent to recruit stabilizer motor units', '2-second bottom pause'],
          nasmClinicalSource: 'CPT7_Fat_Loss8.pdf & Chapter 21',
        }
      )

      // Pair 2: Back
      const backStrengthName = eq.hasCables
        ? 'Seated Cable Row (Strength 2A)'
        : eq.hasBarbell
        ? 'Barbell Bent-Over Row (Strength 2A)'
        : eq.hasDumbbells
        ? 'Dual Dumbbell Bent-Over Row (Strength 2A)'
        : eq.hasBands
        ? 'Heavy Standing Band Row (Strength 2A)'
        : 'Inverted Bodyweight Row (Strength 2A)'

      const backStabilityName = eq.hasCables
        ? 'Single-Leg Cable Row (Stability 2B)'
        : eq.hasDumbbells
        ? 'Single-Leg Dumbbell Row (Stability 2B)'
        : eq.hasBands
        ? 'Single-Leg Resistance Band Row (Stability 2B)'
        : 'Prone Cobra with 4-Second Hold (Stability 2B)'

      exercises.push(
        {
          block: 'resistance',
          name: backStrengthName,
          sets: '3',
          reps: '10',
          tempo: '2/0/2',
          rest: '0s (Immediate transition to 2B)',
          intensityPercentage1RM: 0.75,
          supersetPairWith: backStabilityName,
          coachingCues: ['Heavy prime mover row with strong lat contraction'],
          nasmClinicalSource: 'CPT7_Fat_Loss9.pdf',
        },
        {
          block: 'resistance',
          name: backStabilityName,
          sets: '3',
          reps: '12 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.5,
          supersetPairWith: backStrengthName,
          coachingCues: ['Single-leg balance with 4-second eccentric return'],
          nasmClinicalSource: 'CPT7_Fat_Loss9.pdf',
        }
      )

      // Pair 3: Shoulders
      const shoulderStrengthName = eq.hasDumbbells
        ? 'Seated Dumbbell Shoulder Press (Strength 3A)'
        : eq.hasBarbell
        ? 'Standing Barbell Overhead Press (Strength 3A)'
        : eq.hasBands
        ? 'Heavy Banded Overhead Press (Strength 3A)'
        : 'Feet-Elevated Pike Push-Up (Strength 3A)'

      const shoulderStabilityName = eq.hasDumbbells
        ? 'Single-Leg Dumbbell Scaption (Stability 3B)'
        : eq.hasBands
        ? 'Single-Leg Banded Scaption (Stability 3B)'
        : 'Single-Leg Y-Raise with 4-Second Eccentric (Stability 3B)'

      exercises.push(
        {
          block: 'resistance',
          name: shoulderStrengthName,
          sets: '3',
          reps: '10',
          tempo: '2/0/2',
          rest: '0s (Immediate transition to 3B)',
          intensityPercentage1RM: 0.75,
          supersetPairWith: shoulderStabilityName,
          coachingCues: ['Heavy overhead strength press'],
          nasmClinicalSource: 'CPT7_Fat_Loss10.pdf',
        },
        {
          block: 'resistance',
          name: shoulderStabilityName,
          sets: '3',
          reps: '12 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.5,
          supersetPairWith: shoulderStrengthName,
          coachingCues: ['45-degree angle in single leg balance', 'Strict stabilizer tempo'],
          nasmClinicalSource: 'CPT7_Fat_Loss10.pdf',
        }
      )
    } else {
      focus = 'Lower Body Contrast Supersets (Quads, Hamstrings & Glutes)'

      // Pair 1: Quads / Squat
      const squatStrengthName = eq.hasBarbell && eq.hasSquatRack
        ? 'Barbell Back Squat (Strength 1A)'
        : eq.hasDumbbells
        ? 'Heavy Dumbbell Goblet Squat (Strength 1A)'
        : eq.hasBands
        ? 'Heavy Banded Squat (Strength 1A)'
        : 'Bulgarian Split Squat (Strength 1A)'

      const squatStabilityName = 'Single-Leg Step-Up to Balance (Stability 1B)'

      exercises.push(
        {
          block: 'resistance',
          name: squatStrengthName,
          sets: '3',
          reps: '10',
          tempo: '2/0/2',
          rest: '0s (Immediate transition to 1B)',
          intensityPercentage1RM: 0.75,
          targetLoadLbs: eq.hasBarbell || eq.hasDumbbells ? loadFromOneRepMax(rawSquat1RM, 0.75) : undefined,
          supersetPairWith: squatStabilityName,
          coachingCues: ['Full depth squat @ 75% 1RM', 'Zero rest before step-up balance'],
          nasmClinicalSource: 'CPT7_Fat_Loss11-1.pdf & Chapter 21',
        },
        {
          block: 'resistance',
          name: squatStabilityName,
          sets: '3',
          reps: '12 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.5,
          supersetPairWith: squatStrengthName,
          coachingCues: ['Step onto box/chair, pause in single-leg balance 2 seconds'],
          nasmClinicalSource: 'CPT7_Fat_Loss11-1.pdf & Chapter 21',
        }
      )

      // Pair 2: Hamstrings / Hinge
      const deadliftStrengthName = eq.hasBarbell
        ? 'Barbell Romanian Deadlift (Strength 2A)'
        : eq.hasDumbbells
        ? 'Dual Dumbbell Romanian Deadlift (Strength 2A)'
        : eq.hasBands
        ? 'Heavy Banded Romanian Deadlift (Strength 2A)'
        : 'Single-Leg Glute Bridge with Hold (Strength 2A)'

      const deadliftStabilityName = 'Single-Leg Romanian Deadlift with Reach (Stability 2B)'

      exercises.push(
        {
          block: 'resistance',
          name: deadliftStrengthName,
          sets: '3',
          reps: '10',
          tempo: '2/0/2',
          rest: '0s (Immediate transition to 2B)',
          intensityPercentage1RM: 0.75,
          targetLoadLbs: eq.hasBarbell || eq.hasDumbbells ? loadFromOneRepMax(rawDeadlift1RM, 0.65) : undefined,
          supersetPairWith: deadliftStabilityName,
          coachingCues: ['Hip hinge with flat back', 'Full hamstring engagement'],
          nasmClinicalSource: 'CPT7_Fat_Loss12.pdf',
        },
        {
          block: 'resistance',
          name: deadliftStabilityName,
          sets: '3',
          reps: '12 per leg',
          tempo: '4/2/1',
          rest: '60s',
          intensityPercentage1RM: 0.5,
          supersetPairWith: deadliftStrengthName,
          coachingCues: ['4-second lowering on one foot', 'Square hips to floor'],
          nasmClinicalSource: 'CPT7_Fat_Loss12.pdf',
        }
      )
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── PHASE 3: HYPERTROPHY / MUSCULAR DEVELOPMENT (2/0/2 Tempo, 75-85% 1RM) ──
  // ════════════════════════════════════════════════════════════════════════════
  else if (phase === 3) {
    if (dayIndex === 1) {
      focus = 'Chest, Front Deltoids & Triceps (Push Hypertrophy)'

      // 1. Primary Incline / Flat Press
      if (eq.hasBarbell && eq.hasBench) {
        exercises.push({
          block: 'resistance',
          name: 'Incline Barbell Bench Press',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '75s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawBench1RM, 0.8),
          coachingCues: ['Control eccentric lowering for 2 seconds', 'Upper clavicular stretch'],
          nasmClinicalSource: 'CPT7_Muscle_Gain1.pdf & Chapter 21',
        })
      } else if (eq.hasDumbbells && eq.hasBench) {
        exercises.push({
          block: 'resistance',
          name: 'Incline Dumbbell Bench Press',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '75s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawBench1RM, 0.75),
          coachingCues: ['45-degree bench angle', 'Deep horizontal adduction at top lockout'],
          nasmClinicalSource: 'CPT7_Muscle_Gain1.pdf (Home Adaptation)',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bench Press',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '75s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawBench1RM, 0.75),
          coachingCues: ['Pause triceps gently on floor each rep', 'Drive up explosively'],
          nasmClinicalSource: 'CPT7_Muscle_Gain1.pdf (Home Floor Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Two Arm Dumbbell Chest Press With Band',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Anchor band behind back', '2s peak contraction at full reach'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Push Up Plus',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Deep chest stretch below hand level', 'Drive up under full control'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // 2. Flat / Secondary Chest Press
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bench Press',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.75,
          coachingCues: ['Deep horizontal adduction', 'Continuous muscular tension'],
          nasmClinicalSource: 'CPT7_Muscle_Gain2.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Cable Crossover',
          sets: '4',
          reps: '12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Cross hands at midline for peak sternal head contraction'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Decline Push Up',
          sets: '4',
          reps: '12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Elevate feet to overload upper chest and deltoids'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // 3. Shoulder Press
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Overhead Press',
          sets: '3',
          reps: '10',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.75,
          coachingCues: ['Press in scapular plane', 'No arching of lower back'],
          nasmClinicalSource: 'CPT7_Muscle_Gain3.pdf',
        })
      } else if (eq.hasBarbell) {
        exercises.push({
          block: 'resistance',
          name: 'Barbell Overhead Press',
          sets: '3',
          reps: '10',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.75,
          coachingCues: ['Lock core, press bar in straight vertical bar path'],
          nasmClinicalSource: 'CPT7_Muscle_Gain3.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Overhead Press',
          sets: '3',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Step inside loop band, press to full lockout'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Pike Push Up',
          sets: '3',
          reps: '10',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Hips at 90 degrees', 'Target anterior and lateral deltoids'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // 4. Triceps Isolation
      if (eq.hasCables) {
        exercises.push({
          block: 'resistance',
          name: 'Seated Single Arm Dumbbell Tricep Extension',
          sets: '3',
          reps: '12',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.7,
          coachingCues: ['Spread rope handles at top lockout'],
          nasmClinicalSource: 'CPT7_Muscle_Gain4.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Supine Dumbbell Extension',
          sets: '3',
          reps: '12',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.7,
          coachingCues: ['Keep elbows tucked in', 'Full stretch on long head of triceps'],
          nasmClinicalSource: 'CPT7_Muscle_Gain4.pdf (Home Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Seated Single Arm Dumbbell Tricep Extension',
          sets: '3',
          reps: '12–15',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Lock elbows forward, flare band at lockout'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Bench Dips',
          sets: '3',
          reps: '12–15',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Hands close together under sternum', 'Pin elbows to ribcage'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }
    } else if (dayIndex === 2) {
      focus = 'Lats, Upper Back & Biceps (Pull Hypertrophy)'

      // 1. Heavy Row
      if (eq.hasBarbell) {
        exercises.push({
          block: 'resistance',
          name: 'Barbell Bent Over Row Pronated',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '75s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.6),
          coachingCues: ['Torso at 45 degrees', 'Pull bar to lower sternum'],
          nasmClinicalSource: 'CPT7_Muscle_Gain5.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Bent Over Row',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '75s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.55),
          coachingCues: ['Hinge to 45 degrees with flat back', 'Row dumbbells into hip pockets'],
          nasmClinicalSource: 'CPT7_Muscle_Gain5.pdf (Home Dumbbell Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Standing Tubing Row',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Loop band around feet', 'Drive elbows back with 1s peak squeeze'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Seated Row',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Maintain rigid plank', 'Pull chest to bar/edge'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // 2. Vertical Pull
      if (eq.hasCables) {
        exercises.push({
          block: 'resistance',
          name: 'Seated Machine Row Close Grip',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.75,
          coachingCues: ['Drive elbows down and back', 'Avoid backward swinging'],
          nasmClinicalSource: 'CPT7_Muscle_Gain6.pdf',
        })
      } else if (eq.hasPullupBar) {
        exercises.push({
          block: 'resistance',
          name: 'Pull Up',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Full stretch at bottom', 'Chin clear over bar on concentric'],
          nasmClinicalSource: 'CPT7_Muscle_Gain6.pdf (Calisthenic Adaptation)',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Supported Bent Over Dumbbell Row',
          sets: '4',
          reps: '10–12 per side',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.75,
          coachingCues: ['Support torso on bench/chair', 'Full lat stretch at bottom'],
          nasmClinicalSource: 'CPT7_Muscle_Gain6.pdf (Home Dumbbell Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Standing Tubing Row',
          sets: '4',
          reps: '12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Kneel down facing anchor', 'Pull down in wide arc to outer chest'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Floor Prone Cobra',
          sets: '4',
          reps: '12–15',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Constant outward tension on towel', 'Pull bar to chin with lats fired'],
          nasmClinicalSource: 'CPT7_Ch16',
        })
      }

      // 3. Biceps Isolation
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Incline Dumbbell Curl',
          sets: '3',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.7,
          coachingCues: ['Full supination', 'Control 2-second eccentric lowering'],
          nasmClinicalSource: 'CPT7_Muscle_Gain7.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Barbell Bicep Curl',
          sets: '3',
          reps: '12–15',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Step on band', 'Lock elbows to ribs and curl to chin with 1s squeeze'],
          nasmClinicalSource: 'CPT7_Muscle_Gain7.pdf (Banded Adaptation)',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Pull Up',
          sets: '3',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Supinated grip to maximize biceps engagement'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // 4. Rear Delts / Face Pull
      if (eq.hasCables) {
        exercises.push({
          block: 'resistance',
          name: 'Face Pull',
          sets: '3',
          reps: '15',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.65,
          coachingCues: ['Pull rope to eye level while rotating thumbs back'],
          nasmClinicalSource: 'CPT7_Muscle_Gain8.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Bent Over Dumbbell Rear Fly',
          sets: '3',
          reps: '15',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.65,
          coachingCues: ['Hinge at 45 degrees', 'Lead with elbows to isolate posterior deltoids'],
          nasmClinicalSource: 'CPT7_Muscle_Gain8.pdf (Home Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Face Pull',
          sets: '3',
          reps: '15',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Anchor band at eye level', 'Pull band to face while externally rotating forearms'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Activation Ball Prone Shoulder Press',
          sets: '3',
          reps: '12 per position',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Isolate rhomboids and posterior deltoids with zero momentum'],
          nasmClinicalSource: 'CPT7_Ch16',
        })
      }
    } else if (dayIndex === 3) {
      focus = 'Quadriceps, Calves & Anterior Core (Legs A)'

      // 1. Primary Squat
      if (eq.hasBarbell && eq.hasSquatRack) {
        exercises.push({
          block: 'resistance',
          name: 'Barbell Back Squat',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '90s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawSquat1RM, 0.8),
          coachingCues: ['Upright torso', 'Drive knees forward in line with toes'],
          nasmClinicalSource: 'CPT7_Muscle_Gain9.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Front Squat',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '90s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawSquat1RM, 0.7),
          coachingCues: ['Rest dumbbells on anterior deltoids', 'Full depth with tall spine'],
          nasmClinicalSource: 'CPT7_Muscle_Gain9.pdf (Home Dumbbell Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Goblet Squat',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Stand on loop band and hold top around chest level', 'Deep quadriceps tension'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Prisoner Squat',
          sets: '4',
          reps: '12–15',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Squat to bottom, come up halfway, drop back down, then stand tall'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // 2. Unilateral Quad Overload
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Lunge To Balance',
          sets: '3',
          reps: '12 per leg',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.75,
          coachingCues: ['Keep front knee at 90 degrees on descent'],
          nasmClinicalSource: 'CPT7_Muscle_Gain10.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Bulgarian Split Squat',
          sets: '3',
          reps: '12 per leg',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Rear foot elevated on chair/couch', 'Drive through front heel'],
          nasmClinicalSource: 'CPT7_Muscle_Gain10.pdf (Banded Adaptation)',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Bulgarian Split Squat',
          sets: '3',
          reps: '12 per leg',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Elevate back foot', 'Pause 2 seconds at full depth'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }

      // 3. Leg Press / Secondary Quad
      if (eq.hasMachines) {
        exercises.push({
          block: 'resistance',
          name: 'Leg Press',
          sets: '3',
          reps: '12',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.75,
          coachingCues: ['Controlled lowering to 90 degrees knee flexion'],
          nasmClinicalSource: 'CPT7_Muscle_Gain11.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Step Up To Balance Frontal',
          sets: '3',
          reps: '12 per leg',
          tempo: '2/0/2',
          rest: '60s',
          intensityPercentage1RM: 0.75,
          coachingCues: ['Step onto chair/bench', 'Drive trailing knee up to waist level'],
          nasmClinicalSource: 'CPT7_Muscle_Gain11.pdf (Home Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Goblet Squat',
          sets: '3',
          reps: '15 per leg',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Anchor band at knee height', 'Lock knee into full extension with 2s VMO contraction'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Squat',
          sets: '3',
          reps: '45 seconds',
          tempo: 'Isometric',
          rest: '60s',
          coachingCues: ['Thighs parallel to floor', 'Extend one leg out for 5s intervals'],
          nasmClinicalSource: 'CPT7_Ch16',
        })
      }

      // 4. Calves
      if (eq.hasMachines || eq.hasBarbell) {
        exercises.push({
          block: 'resistance',
          name: 'Leg Press Calf Raise',
          sets: '4',
          reps: '15',
          tempo: '2/0/2',
          rest: '45s',
          intensityPercentage1RM: 0.7,
          coachingCues: ['Full plantarflexion at top with 1s pause'],
          nasmClinicalSource: 'CPT7_Muscle_Gain12.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Prisoner Squat Calf Raise',
          sets: '4',
          reps: '15 per leg',
          tempo: '2/0/2',
          rest: '45s',
          coachingCues: ['Full stretch at bottom of stair/step', 'Hold peak contraction 2 seconds'],
          nasmClinicalSource: 'CPT7_Muscle_Gain12.pdf (Home Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Prisoner Squat Calf Raise',
          sets: '4',
          reps: '15',
          tempo: '2/0/2',
          rest: '45s',
          coachingCues: ['Loop band around feet and shoulders', 'Full plantarflexion against elastic tension'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Prisoner Squat Calf Raise',
          sets: '4',
          reps: '20 per leg',
          tempo: '2/0/2',
          rest: '45s',
          coachingCues: ['Slow 3-second eccentric drop into deep ankle dorsiflexion'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }
    } else {
      focus = 'Hamstrings, Glutes & Lateral Deltoids (Legs B & Delts)'

      // 1. Primary Hinge
      if (eq.hasBarbell) {
        exercises.push({
          block: 'resistance',
          name: 'Romanian Deadlift',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '90s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.75),
          coachingCues: ['Send hips back to wall', 'Maintain hamstring tension'],
          nasmClinicalSource: 'CPT7_Muscle_Gain9.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Romanian Deadlift',
          sets: '4',
          reps: '8–10',
          tempo: '2/0/2',
          rest: '90s',
          intensityPercentage1RM: 0.8,
          targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.65),
          coachingCues: ['Keep dumbbells glued close to shins', 'Hips back with flat spine'],
          nasmClinicalSource: 'CPT7_Muscle_Gain9.pdf (Home Dumbbell Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Good Mornings',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Step on band, loop over neck/shoulders', 'Hinge hips backward with soft knees'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Romanian Deadlift',
          sets: '4',
          reps: '12 per leg',
          tempo: '3/1/1',
          rest: '60s',
          coachingCues: ['Reach fingertips to toe', 'Feel deep stretch in hamstring of standing leg'],
          nasmClinicalSource: 'CPT7_Ch17',
        })
      }

      // 2. Glute Thrust
      if (eq.hasBarbell) {
        exercises.push({
          block: 'resistance',
          name: 'Floor Bridge',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '75s',
          intensityPercentage1RM: 0.8,
          coachingCues: ['Drive heels into floor', 'Full hip extension lock'],
          nasmClinicalSource: 'CPT7_Muscle_Gain10.pdf',
        })
      } else if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Floor Bridge',
          sets: '4',
          reps: '10–12',
          tempo: '2/0/2',
          rest: '75s',
          intensityPercentage1RM: 0.8,
          coachingCues: ['Rest heavy dumbbell across pelvis', 'Lockout glutes at top with 2s squeeze'],
          nasmClinicalSource: 'CPT7_Muscle_Gain10.pdf (Home Adaptation)',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Floor Bridge',
          sets: '4',
          reps: '12–15',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Loop band across hips and anchor under feet', 'Full extension'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Single Leg Floor Bridge',
          sets: '4',
          reps: '12 per leg',
          tempo: '2/0/2',
          rest: '60s',
          coachingCues: ['Elevate foot on chair', 'Drive hips high with 2s peak squeeze'],
          nasmClinicalSource: 'CPT7_Ch16',
        })
      }

      // 3. Lateral Delts
      if (eq.hasDumbbells) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Lateral Raise',
          sets: '4',
          reps: '12–15',
          tempo: '2/0/2',
          rest: '45s',
          intensityPercentage1RM: 0.65,
          coachingCues: ['Slight forward torso lean', 'Lead with elbows'],
          nasmClinicalSource: 'CPT7_Muscle_Gain11.pdf',
        })
      } else if (eq.hasBands) {
        exercises.push({
          block: 'resistance',
          name: 'Dumbbell Lateral Raise',
          sets: '4',
          reps: '15',
          tempo: '2/0/2',
          rest: '45s',
          coachingCues: ['Step on band with center foot', 'Raise handles to shoulder height with elbows high'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      } else {
        exercises.push({
          block: 'resistance',
          name: 'Bent Elbow Dumbbell Lateral Raise',
          sets: '4',
          reps: '15 per side',
          tempo: '2/0/2',
          rest: '45s',
          coachingCues: ['Isolate medial deltoid with strict horizontal abduction against wall/floor'],
          nasmClinicalSource: 'CPT7_Ch21',
        })
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── PHASE 4: MAXIMAL STRENGTH (1-5 Reps @ 85-100% 1RM, 3-5m Rest) ───────────
  // ════════════════════════════════════════════════════════════════════════════
  else if (phase === 4) {
    if (dayIndex === 1) {
      focus = 'Upper Body Maximal Force Production (Bench & Row)'

      if (eq.hasBarbell) {
        exercises.push(
          {
            block: 'resistance',
            name: 'Barbell Bench Press',
            sets: '5',
            reps: '3–5',
            tempo: '1/1/1',
            rest: '3–5 min',
            intensityPercentage1RM: 0.88,
            targetLoadLbs: loadFromOneRepMax(rawBench1RM, 0.88),
            coachingCues: ['Maximal motor unit recruitment', 'Drive bar with maximal intent'],
            nasmClinicalSource: 'CPT7_Performance1.pdf & Chapter 21',
          },
          {
            block: 'resistance',
            name: 'Bent Over Barbel Row Supinated',
            sets: '5',
            reps: '3–5',
            tempo: '1/1/1',
            rest: '3–5 min',
            intensityPercentage1RM: 0.88,
            targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.65),
            coachingCues: ['Dead stop on floor every rep', 'Explosive concentric pull'],
            nasmClinicalSource: 'CPT7_Performance2.pdf',
          },
          {
            block: 'resistance',
            name: 'Incline Dumbbell Bench Press',
            sets: '3',
            reps: '5',
            tempo: '1/1/1',
            rest: '3 min',
            intensityPercentage1RM: 0.85,
            coachingCues: ['Full stability', 'Lockout under control'],
            nasmClinicalSource: 'CPT7_Performance3.pdf',
          }
        )
      } else {
        // Home Heavy Dumbbells / Calisthenics Maximal Overload
        exercises.push(
          {
            block: 'resistance',
            name: 'Dumbbell Bench Press',
            sets: '5',
            reps: '5',
            tempo: '1/1/1',
            rest: '3 min',
            intensityPercentage1RM: 0.85,
            targetLoadLbs: loadFromOneRepMax(rawBench1RM, 0.8),
            coachingCues: ['Heavy bilateral press', 'Maximal neural drive with tight arch'],
            nasmClinicalSource: 'CPT7_Performance1.pdf (Home Adaptation)',
          },
          {
            block: 'resistance',
            name: 'Supported Bent Over Dumbbell Row',
            sets: '5',
            reps: '5 per arm',
            tempo: '1/1/1',
            rest: '3 min',
            intensityPercentage1RM: 0.85,
            targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.6),
            coachingCues: ['Heavy pulling strength', 'Brace core with hand on bench'],
            nasmClinicalSource: 'CPT7_Performance2.pdf (Home Adaptation)',
          },
          {
            block: 'resistance',
            name: 'Band Push Up',
            sets: '3',
            reps: '5',
            tempo: '1/1/1',
            rest: '3 min',
            coachingCues: ['Heavy resistance over upper back', 'Full lockout'],
            nasmClinicalSource: 'CPT7_Performance3.pdf',
          }
        )
      }
    } else if (dayIndex === 2) {
      focus = 'Lower Body Maximal Force Production (Squat & Posterior Chain)'

      if (eq.hasBarbell && eq.hasSquatRack) {
        exercises.push(
          {
            block: 'resistance',
            name: 'Barbell Back Squat',
            sets: '5',
            reps: '3–5',
            tempo: '1/1/1',
            rest: '3–5 min',
            intensityPercentage1RM: 0.88,
            targetLoadLbs: loadFromOneRepMax(rawSquat1RM, 0.88),
            coachingCues: ['Brace core with intra-abdominal pressure', 'Drive through midfoot'],
            nasmClinicalSource: 'CPT7_Performance4.pdf',
          },
          {
            block: 'resistance',
            name: 'Good Mornings',
            sets: '4',
            reps: '5',
            tempo: '2/0/2',
            rest: '3 min',
            intensityPercentage1RM: 0.8,
            coachingCues: ['Posterior chain spinal erector loading', 'Neutral spine'],
            nasmClinicalSource: 'CPT7_Performance5.pdf',
          }
        )
      } else {
        // Home Heavy Dumbbells / Bands Squat Protocol
        exercises.push(
          {
            block: 'resistance',
            name: 'Dumbbell Front Squat',
            sets: '5',
            reps: '5',
            tempo: '3/1/1',
            rest: '3 min',
            intensityPercentage1RM: 0.85,
            targetLoadLbs: loadFromOneRepMax(rawSquat1RM, 0.75),
            coachingCues: ['Heavy dumbbells racked on shoulders', 'Pause 3 seconds in the hole to eliminate stretch reflex'],
            nasmClinicalSource: 'CPT7_Performance4.pdf (Home Adaptation)',
          },
          {
            block: 'resistance',
            name: 'Dumbbell Romanian Deadlift',
            sets: '4',
            reps: '5',
            tempo: '2/0/2',
            rest: '3 min',
            intensityPercentage1RM: 0.85,
            targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.7),
            coachingCues: ['Heavy hip hinge', 'Spine completely locked in neutral alignment'],
            nasmClinicalSource: 'CPT7_Performance5.pdf (Home Adaptation)',
          }
        )
      }
    } else if (dayIndex === 3) {
      focus = 'Vertical Push & Pull Maximal Strength (Overhead & Pull-Up)'

      const overheadName = eq.hasBarbell
        ? 'Standing Barbell Overhead Military Press'
        : eq.hasDumbbells
        ? 'Heavy Standing Dumbbell Overhead Press'
        : 'Strict Pike / Handstand Push-Up'

      const verticalPullName = eq.hasPullupBar
        ? 'Weighted Pull-Up / Strict Chest-to-Bar Pull-Up'
        : eq.hasCables
        ? 'Heavy Wide-Grip Lat Pulldown'
        : eq.hasDumbbells
        ? 'Heavy Incline Prone Dumbbell Row'
        : 'Heavy Banded Lat Pulldown'

      exercises.push(
        {
          block: 'resistance',
          name: overheadName,
          sets: '5',
          reps: '3–5',
          tempo: '1/1/1',
          rest: '3–5 min',
          intensityPercentage1RM: 0.88,
          coachingCues: ['Squeeze glutes and quads', 'Lockout directly over ears'],
          nasmClinicalSource: 'CPT7_Performance6.pdf',
        },
        {
          block: 'resistance',
          name: verticalPullName,
          sets: '5',
          reps: '3–5',
          tempo: '1/1/1',
          rest: '3–5 min',
          intensityPercentage1RM: 0.88,
          coachingCues: ['Full range of motion', 'Dead hang stretch at bottom'],
          nasmClinicalSource: 'CPT7_Performance6.pdf',
        }
      )
    } else {
      focus = 'Posterior Chain Maximal Strength (Deadlift & Hip Drive)'

      if (eq.hasBarbell) {
        exercises.push(
          {
            block: 'resistance',
            name: 'Barbell Deadlift',
            sets: '5',
            reps: '3–5',
            tempo: '1/1/1',
            rest: '3–5 min',
            intensityPercentage1RM: 0.9,
            targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.9),
            coachingCues: ['Pack lats tight', 'Push floor away with legs'],
            nasmClinicalSource: 'CPT7_Performance1.pdf',
          },
          {
            block: 'resistance',
            name: 'Barbell Front Squat With Clean Position',
            sets: '4',
            reps: '3–5',
            tempo: '1/1/1',
            rest: '3 min',
            intensityPercentage1RM: 0.85,
            targetLoadLbs: loadFromOneRepMax(rawSquat1RM, 0.75),
            coachingCues: ['Elbows high', 'Solid thoracic extension'],
            nasmClinicalSource: 'CPT7_Performance2.pdf',
          }
        )
      } else {
        exercises.push(
          {
            block: 'resistance',
            name: 'Dumbbell Romanian Deadlift',
            sets: '5',
            reps: '5',
            tempo: '1/1/1',
            rest: '3 min',
            intensityPercentage1RM: 0.88,
            targetLoadLbs: loadFromOneRepMax(rawDeadlift1RM, 0.75),
            coachingCues: ['Drive floor away', 'Full hip lockout with glute squeeze'],
            nasmClinicalSource: 'CPT7_Performance1.pdf (Home Adaptation)',
          },
          {
            block: 'resistance',
            name: 'Bulgarian Split Squat',
            sets: '4',
            reps: '5 per leg',
            tempo: '2/0/2',
            rest: '3 min',
            intensityPercentage1RM: 0.85,
            coachingCues: ['Heavy dumbbells in each hand', 'Deep single-leg force production'],
            nasmClinicalSource: 'CPT7_Performance2.pdf (Home Adaptation)',
          }
        )
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── PHASE 5: POWER & PAP (Post-Activation Potentiation Contrast Pairs) ──────
  // ════════════════════════════════════════════════════════════════════════════
  else {
    if (dayIndex % 2 === 1) {
      focus = 'Upper Body Post-Activation Potentiation (Bench & Explosive Ball/Plyo Contrast)'

      const upperPAPStrengthName = eq.hasBarbell
        ? 'Heavy Barbell Bench Press (Strength 1A)'
        : eq.hasDumbbells
        ? 'Heavy Dumbbell Flat Bench Press (Strength 1A)'
        : 'Heavy Resistance Band Push-Up (Strength 1A)'

      const upperPAPPowerName = eq.hasMedicineBall
        ? 'Explosive Medicine Ball Chest Pass (Power 1B)'
        : 'Explosive Plyometric Push-Up / Clapping Push-Up (Power 1B)'

      const upperPAPRowStrengthName = eq.hasBarbell
        ? 'Heavy Barbell Bent-Over Row (Strength 2A)'
        : eq.hasDumbbells
        ? 'Heavy Dual Dumbbell Row (Strength 2A)'
        : 'Heavy Band Row (Strength 2A)'

      const upperPAPRowPowerName = eq.hasMedicineBall
        ? 'Medicine Ball Soccer Throw (Power 2B)'
        : 'Banded Explosive Speed Row (Power 2B)'

      exercises.push(
        {
          block: 'resistance',
          name: upperPAPStrengthName,
          sets: '4',
          reps: '3–5',
          tempo: '1/1/1',
          rest: '0s (Immediate transition to 1B)',
          intensityPercentage1RM: 0.88,
          targetLoadLbs: eq.hasBarbell || eq.hasDumbbells ? loadFromOneRepMax(rawBench1RM, 0.88) : undefined,
          supersetPairWith: upperPAPPowerName,
          coachingCues: ['Heavy neural primer @ 88% 1RM', 'Immediately unrack for explosive power contrast'],
          nasmClinicalSource: 'CPT7_Performance7.pdf & Chapter 18/21',
        },
        {
          block: 'resistance',
          name: upperPAPPowerName,
          sets: '4',
          reps: '8–10',
          tempo: 'Max Explosive Velocity',
          rest: '2–3 min',
          intensityPercentage1RM: 0.35,
          supersetPairWith: upperPAPStrengthName,
          coachingCues: ['Maximal release velocity / explosive drive', 'Take advantage of PAP primed motor units'],
          nasmClinicalSource: 'CPT7_Performance7.pdf & Chapter 18',
        },
        {
          block: 'resistance',
          name: upperPAPRowStrengthName,
          sets: '4',
          reps: '3–5',
          tempo: '1/1/1',
          rest: '0s (Immediate transition to 2B)',
          intensityPercentage1RM: 0.88,
          targetLoadLbs: eq.hasBarbell || eq.hasDumbbells ? loadFromOneRepMax(rawDeadlift1RM, 0.65) : undefined,
          supersetPairWith: upperPAPRowPowerName,
          coachingCues: ['Heavy pulling primer', 'Zero rest before explosive speed throw/row'],
          nasmClinicalSource: 'CPT7_Performance8.pdf',
        },
        {
          block: 'resistance',
          name: upperPAPRowPowerName,
          sets: '4',
          reps: '8–10',
          tempo: 'Max Explosive Velocity',
          rest: '2–3 min',
          intensityPercentage1RM: 0.35,
          supersetPairWith: upperPAPRowStrengthName,
          coachingCues: ['Explosive velocity contraction', 'Maximal rate of force development'],
          nasmClinicalSource: 'CPT7_Performance8.pdf',
        }
      )
    } else {
      focus = 'Lower Body Post-Activation Potentiation (Squat & Jump Contrast)'

      const lowerPAPSquatStrengthName = eq.hasBarbell && eq.hasSquatRack
        ? 'Heavy Barbell Back Squat (Strength 1A)'
        : eq.hasDumbbells
        ? 'Heavy Dual Dumbbell Front Squat (Strength 1A)'
        : 'Heavy Banded Squat (Strength 1A)'

      const lowerPAPJumpPowerName = 'Explosive Tuck Jump / Jump Squat (Power 1B)'

      const lowerPAPHipStrengthName = eq.hasBarbell
        ? 'Heavy Barbell Hip Thrust (Strength 2A)'
        : eq.hasDumbbells
        ? 'Heavy Dumbbell Hip Thrust / RDL (Strength 2A)'
        : 'Heavy Banded Hip Thrust (Strength 2A)'

      const lowerPAPHipPowerName = eq.hasMedicineBall
        ? 'Medicine Ball Backward Overhead Slam (Power 2B)'
        : eq.hasDumbbells || eq.hasKettlebell
        ? 'Explosive Dumbbell / Kettlebell Hinge Swing (Power 2B)'
        : 'Explosive Broad Jump to Stick (Power 2B)'

      exercises.push(
        {
          block: 'resistance',
          name: lowerPAPSquatStrengthName,
          sets: '4',
          reps: '3–5',
          tempo: '1/1/1',
          rest: '0s (Immediate transition to 1B)',
          intensityPercentage1RM: 0.88,
          targetLoadLbs: eq.hasBarbell || eq.hasDumbbells ? loadFromOneRepMax(rawSquat1RM, 0.88) : undefined,
          supersetPairWith: lowerPAPJumpPowerName,
          coachingCues: ['Heavy prime mover @ 88% 1RM', 'Step out immediately to jump'],
          nasmClinicalSource: 'CPT7_Performance9.pdf & Chapter 18/21',
        },
        {
          block: 'resistance',
          name: lowerPAPJumpPowerName,
          sets: '4',
          reps: '8–10',
          tempo: 'Max Explosive Velocity',
          rest: '2–3 min',
          intensityPercentage1RM: 0.3,
          supersetPairWith: lowerPAPSquatStrengthName,
          coachingCues: ['Maximal vertical displacement', 'Soft landing with triple flexion'],
          nasmClinicalSource: 'CPT7_Performance9.pdf & Chapter 18',
        },
        {
          block: 'resistance',
          name: lowerPAPHipStrengthName,
          sets: '4',
          reps: '3–5',
          tempo: '1/1/1',
          rest: '0s (Immediate transition to 2B)',
          intensityPercentage1RM: 0.88,
          targetLoadLbs: eq.hasBarbell || eq.hasDumbbells ? loadFromOneRepMax(rawDeadlift1RM, 0.75) : undefined,
          supersetPairWith: lowerPAPHipPowerName,
          coachingCues: ['Heavy glute/posterior chain driver'],
          nasmClinicalSource: 'CPT7_Performance10.pdf',
        },
        {
          block: 'resistance',
          name: lowerPAPHipPowerName,
          sets: '4',
          reps: '8–10',
          tempo: 'Max Explosive Velocity',
          rest: '2–3 min',
          intensityPercentage1RM: 0.35,
          supersetPairWith: lowerPAPHipStrengthName,
          coachingCues: ['Maximal horizontal/vertical kinetic projection'],
          nasmClinicalSource: 'CPT7_Performance10.pdf',
        }
      )
    }
  }

  // Cooldown
  exercises.push({
    block: 'cooldown',
    name: 'Static Kneeling Hip Flexor Stretch',
    sets: '1',
    reps: '30s',
    tempo: 'Slow diaphragmatic',
    rest: '0s',
    coachingCues: ['Inhale 4 seconds, exhale 6 seconds to trigger parasympathetic recovery. Hold static for 30s per side.'],
    nasmClinicalSource: 'Chapter 14 (Flexibility Continuum)',
  })

  const cardioProtocol = buildIntegratedCardioPrescription({
    goal,
    phase,
    dayIndex,
    totalDays,
    clientAge,
    blendStyle: cardioBlendStyle,
    equipmentAccess: equipment,
    cardioEquipmentAccess: cardioEquipment,
  })

  const sessionDurationBreakdown = calculateEstimatedWorkoutDuration({
    workout: { exercises, focus },
    cardio: cardioProtocol ? { durationMins: cardioProtocol.durationMins, stage: cardioProtocol.stage } : null,
    optPhase: phase,
  })

  return {
    day: dayIndex,
    dayName: `Day ${dayIndex}: ${focus}`,
    focus,
    nasmOptPhase: phase,
    phaseName: phaseMeta.phaseName,
    estimatedDurationMins: sessionDurationBreakdown.totalDurationMins,
    warmupProtocol,
    exercises,
    cardioProtocol,
    dailyPeriodizationMemo: `Session designed according to ${phaseMeta.phaseName} standards on ${eq.summaryLabel} (${phaseMeta.reps} reps, ${phaseMeta.tempo} tempo, ${phaseMeta.rest} rest). ${cardioProtocol ? `Integrated Cardio: ${cardioProtocol.title} (${cardioProtocol.durationMins} min in ${cardioProtocol.targetZone}). ` : ''}${phaseMeta.systemDescription}`,
  }
}
