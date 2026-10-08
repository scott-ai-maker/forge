/**
 * Forge Athletic — Dynamic Autoregulation & Session RPE Deload Advisor Engine
 * 
 * Based on modern Velocity-Loss & RIR Autoregulation Science (Zourdos, Helms, Tuchscherer)
 * and Foster Session-RPE (sRPE) Training Load models:
 * - Real-time RIR decay and intra-session velocity degradation tracking
 * - Acute Intra-Set Fatigue Drop Detection (>15% Drop Threshold)
 * - Optimal Back-Off Load Recommendations (-10% to -15%)
 * - Auto-Regulated Drop-Set Transition Plans (Multi-Stage Load Stripping)
 * - Calculates Foster Session RPE (sRPE × Duration) in Arbitrary Units (A.U.)
 * - Enforces NASM clinical biomechanical guardrails (strict neutral grip on hammer curls)
 */

import { normalizeRpeValue, normalizeRirValue, mapRpeToRir } from './rpe-exertion-scale'
import { calculateDropStages, type DropStage } from './intensity-protocols-engine'

export type AutoregulationAction =
  | 'reduce_load_5pct'
  | 'reduce_load_10pct'
  | 'reduce_load_15pct'
  | 'transition_drop_set'
  | 'cap_reps'
  | 'extend_rest'
  | 'terminate_exercise'
  | 'maintain'

export type FatigueLevel = 'fresh' | 'optimal_strain' | 'elevated_fatigue' | 'critical_overload'

export interface CompletedSetPerformance {
  setNumber: number
  weightLbs: number
  weightKg?: number
  reps: number
  rpe?: number | string | null
  rir?: number | string | null
  isWarmup?: boolean
  sessionDate?: string
  concentricSec?: number
}

export interface AcuteFatigueDropDetails {
  hasDrop: boolean
  dropPercent: number
  reason: string
  severity: 'none' | 'mild' | 'moderate' | 'severe'
  previousMetric: string
  currentMetric: string
}

export interface BackOffPlan {
  backOffWeightLbs: number
  backOffWeightKg: number
  reductionPercent: number
  targetReps: number
  rationale: string
}

export interface DropSetRecommendation {
  shouldConvert: boolean
  reason: string
  stages: DropStage[]
  totalVolumeLbs: number
  totalVolumeKg: number
}

export interface AutoregulationAdvice {
  exerciseName: string
  action: AutoregulationAction
  fatigueLevel: FatigueLevel
  badgeText: string
  headline: string
  rationale: string
  suggestedWeightLbs?: number
  suggestedWeightKg?: number
  suggestedReps?: number
  suggestedRestExtensionSeconds?: number
  isHammerCurl: boolean
  biomechanicalWarning?: string
  hasAcuteFatigueDrop?: boolean
  acuteFatigueDropPercent?: number
  acuteFatigueDropReason?: string
  backOffPlan?: BackOffPlan
  dropSetRecommendation?: DropSetRecommendation
  coachVoiceCue?: string
}

export interface SessionRpeMetrics {
  sessionRpeFoster: number
  sessionDurationMinutes: number
  fosterTrainingLoadAu: number
  loadZone: 'recovery' | 'maintenance' | 'optimal' | 'high_strain' | 'overreaching'
  loadZoneLabel: string
  loadZoneColor: string
  averageRpe: number
  averageRir: number
  totalWorkingSets: number
  failureSetsCount: number
  excessiveFatigueDetected: boolean
  sessionGuidance: string
}

/**
 * Detects if an exercise name involves hammer curls requiring strict neutral grip guardrail.
 */
export function isHammerCurlExercise(exerciseName: string): boolean {
  return exerciseName.toLowerCase().includes('hammer curl')
}

/**
 * Detects whether an acute intra-set fatigue drop (>15%) has occurred.
 */
export function detectAcuteFatigueDrop(params: {
  plannedReps: number
  actualReps: number
  previousSetReps?: number
  actualRpe?: number
  velocityLossPercent?: number
}): AcuteFatigueDropDetails {
  const { plannedReps, actualReps, previousSetReps, actualRpe, velocityLossPercent } = params

  const baseReps = previousSetReps && previousSetReps > 0 ? previousSetReps : plannedReps
  const repDropPercent = baseReps > 0 && actualReps < baseReps
    ? Math.round(((baseReps - actualReps) / baseReps) * 100)
    : 0

  const velDrop = velocityLossPercent ?? 0
  const isRpeOvershoot = (actualRpe ?? 0) >= 9.5

  const maxDropPercent = Math.max(repDropPercent, velDrop)

  if (maxDropPercent >= 25 || (isRpeOvershoot && maxDropPercent >= 15)) {
    return {
      hasDrop: true,
      dropPercent: maxDropPercent,
      severity: 'severe',
      reason: repDropPercent >= 25
        ? `Acute rep decay: output dropped ${repDropPercent}% from ${baseReps} to ${actualReps} reps.`
        : `Severe bar deceleration: velocity dropped ${velDrop}% below baseline.`,
      previousMetric: `${baseReps} reps`,
      currentMetric: `${actualReps} reps`,
    }
  }

  if (maxDropPercent >= 15) {
    return {
      hasDrop: true,
      dropPercent: maxDropPercent,
      severity: 'moderate',
      reason: repDropPercent >= 15
        ? `Moderate rep decay: output dropped ${repDropPercent}% from ${baseReps} to ${actualReps} reps.`
        : `Bar velocity loss of ${velDrop}% indicates approaching muscular failure.`,
      previousMetric: `${baseReps} reps`,
      currentMetric: `${actualReps} reps`,
    }
  }

  if (maxDropPercent > 0) {
    return {
      hasDrop: false,
      dropPercent: maxDropPercent,
      severity: 'mild',
      reason: `Minor fatigue accumulation (${maxDropPercent}% drop), well within normal bioenergetic variance.`,
      previousMetric: `${baseReps} reps`,
      currentMetric: `${actualReps} reps`,
    }
  }

  return {
    hasDrop: false,
    dropPercent: 0,
    severity: 'none',
    reason: 'Pristine velocity and rep endurance preserved.',
    previousMetric: `${baseReps} reps`,
    currentMetric: `${actualReps} reps`,
  }
}

/**
 * Generates tailored Back-Off load and auto-regulated Drop-Set plans.
 */
export function generateBackOffAndDropSetPlan(params: {
  exerciseName: string
  currentWeightLbs: number
  currentReps: number
  targetReps: number
  fatigueDropPercent: number
  units?: 'imperial' | 'metric'
}): {
  backOffPlan: BackOffPlan
  dropSetRecommendation: DropSetRecommendation
  coachVoiceCue: string
} {
  const {
    exerciseName,
    currentWeightLbs,
    currentReps,
    targetReps,
    fatigueDropPercent,
    units = 'imperial',
  } = params

  const isSevere = fatigueDropPercent >= 25
  const reductionPercent = isSevere ? 15 : 10
  const rawReducedLbs = currentWeightLbs * (1 - reductionPercent / 100)
  const backOffWeightLbs = Math.max(5, Math.round(rawReducedLbs / 5) * 5)
  const backOffWeightKg = Math.max(2.5, Math.round((backOffWeightLbs / 2.20462) / 2.5) * 2.5)

  const backOffPlan: BackOffPlan = {
    backOffWeightLbs,
    backOffWeightKg,
    reductionPercent,
    targetReps: Math.max(targetReps, currentReps),
    rationale: isSevere
      ? `Strip ${reductionPercent}% load to ${units === 'imperial' ? `${backOffWeightLbs} lb` : `${backOffWeightKg} kg`} to maintain mechanical tension and hit ${targetReps} reps without joint shear.`
      : `Apply a moderate ${reductionPercent}% back-off load to stay in the optimal hypertrophy sweet spot without form breakdown.`,
  }

  // Generate 3-Stage Drop Set Plan starting at the current or back-off weight
  const dropStages = calculateDropStages(
    currentWeightLbs,
    Math.max(6, currentReps),
    2,
    20,
    units === 'imperial' ? 5 : 2.5
  )

  const totalDropVolumeLbs = dropStages.reduce((sum, s) => sum + s.volumeLbs, 0)
  const totalDropVolumeKg = Math.round(totalDropVolumeLbs / 2.20462)

  const dropSetRecommendation: DropSetRecommendation = {
    shouldConvert: true,
    reason: `Convert upcoming set into a 3-Stage Drop Set starting at ${units === 'imperial' ? `${currentWeightLbs} lb` : `${Math.round(currentWeightLbs / 2.20462)} kg`} to maximize metabolic stress without grinding heavy loads.`,
    stages: dropStages,
    totalVolumeLbs: totalDropVolumeLbs,
    totalVolumeKg: totalDropVolumeKg,
  }

  const coachVoiceCue = isSevere
    ? `Acute fatigue drop detected. Recommend dropping load ${reductionPercent} percent to ${units === 'imperial' ? backOffWeightLbs : backOffWeightKg} or converting to a drop set.`
    : `Fatigue detected. Consider taking a ${reductionPercent} percent back-off load.`

  return {
    backOffPlan,
    dropSetRecommendation,
    coachVoiceCue,
  }
}

/**
 * Evaluates intra-session fatigue and generates dynamic autoregulation recommendations.
 */
export function evaluateExerciseAutoregulation(params: {
  exerciseName: string
  currentDraftWeightLbs: number
  currentDraftReps: number
  targetReps?: number | string | null
  completedSets: CompletedSetPerformance[]
  units?: 'imperial' | 'metric'
  velocityLossPercent?: number
}): AutoregulationAdvice {
  const {
    exerciseName,
    currentDraftWeightLbs,
    currentDraftReps,
    targetReps,
    completedSets,
    units = 'imperial',
    velocityLossPercent,
  } = params

  const isHammer = isHammerCurlExercise(exerciseName)
  const hammerGuardrailText = isHammer
    ? 'Strict Neutral Grip Guardrail: Under high bicep & brachioradialis fatigue, maintain strictly vertical dumbbells with thumbs pointing up and zero wrist supination/twisting. Never swing dumbbells horizontally. If form wavers, accept the Back-Off load reduction immediately.'
    : undefined

  // Filter for valid working sets
  const workingSets = completedSets.filter(s => !s.isWarmup && s.reps > 0 && s.weightLbs > 0)
  const parsedTargetReps = typeof targetReps === 'number'
    ? targetReps
    : parseInt(String(targetReps || currentDraftReps).replace(/[^0-9]/g, ''), 10) || currentDraftReps || 8

  // If no sets completed yet, athlete is fresh
  if (workingSets.length === 0) {
    return {
      exerciseName,
      action: 'maintain',
      fatigueLevel: 'fresh',
      badgeText: 'Pristine Velocity',
      headline: 'Fresh Neuromuscular Reserve',
      rationale: 'No working set fatigue accumulated yet. Execute scheduled working load with explosive concentric intent.',
      isHammerCurl: isHammer,
      biomechanicalWarning: hammerGuardrailText,
      hasAcuteFatigueDrop: false,
      acuteFatigueDropPercent: 0,
    }
  }

  const lastSet = workingSets[workingSets.length - 1]
  const lastRpe = normalizeRpeValue(lastSet.rpe ?? (lastSet.rir !== undefined && lastSet.rir !== null ? 10 - Number(lastSet.rir) : 7.5))
  const lastRir = lastSet.rir !== undefined && lastSet.rir !== null
    ? normalizeRirValue(lastSet.rir)
    : mapRpeToRir(lastRpe)

  // Evaluate acute fatigue drop
  const prevSet = workingSets.length >= 2 ? workingSets[workingSets.length - 2] : undefined
  const acuteDrop = detectAcuteFatigueDrop({
    plannedReps: parsedTargetReps,
    actualReps: lastSet.reps,
    previousSetReps: prevSet?.reps,
    actualRpe: lastRpe,
    velocityLossPercent,
  })

  const { backOffPlan, dropSetRecommendation, coachVoiceCue } = generateBackOffAndDropSetPlan({
    exerciseName,
    currentWeightLbs: currentDraftWeightLbs,
    currentReps: lastSet.reps,
    targetReps: parsedTargetReps,
    fatigueDropPercent: acuteDrop.dropPercent,
    units,
  })

  const isConsecutiveFailure =
    workingSets.length >= 2 &&
    (lastRir === 0 || lastRpe >= 9.5) &&
    (() => {
      const prev = workingSets[workingSets.length - 2]
      const prevRpe = normalizeRpeValue(prev.rpe ?? (prev.rir !== undefined && prev.rir !== null ? 10 - Number(prev.rir) : 7.5))
      const prevRir = prev.rir !== undefined && prev.rir !== null ? normalizeRirValue(prev.rir) : mapRpeToRir(prevRpe)
      return prevRir === 0 || prevRpe >= 9.5
    })()

  // ── 1. Critical Failure: 2 Consecutive Sets to Involuntary Failure ──
  if (isConsecutiveFailure) {
    const rawReduced = currentDraftWeightLbs * 0.90
    const roundedLbs = Math.max(5, Math.round(rawReduced / 5) * 5)
    const roundedKg = Math.max(2.5, Math.round((roundedLbs / 2.20462) / 2.5) * 2.5)

    return {
      exerciseName,
      action: 'reduce_load_10pct',
      fatigueLevel: 'critical_overload',
      badgeText: '−10% Back-Off Load',
      headline: 'Consecutive Involuntary Failure Detected (RIR 0)',
      rationale: 'Multiple consecutive sets reached absolute failure. Reduce working load by −10% to prevent technical breakdown and safeguard neuromuscular recovery.',
      suggestedWeightLbs: roundedLbs,
      suggestedWeightKg: roundedKg,
      suggestedRestExtensionSeconds: 45,
      isHammerCurl: isHammer,
      biomechanicalWarning: hammerGuardrailText,
      hasAcuteFatigueDrop: true,
      acuteFatigueDropPercent: Math.max(20, acuteDrop.dropPercent),
      acuteFatigueDropReason: acuteDrop.reason,
      backOffPlan,
      dropSetRecommendation,
      coachVoiceCue,
    }
  }

  // ── 2. Single or Multi-Set Failure with Missed Target: −5% Load Deload ──
  if ((lastRir === 0 || lastRpe >= 9.5) && lastSet.reps < parsedTargetReps) {
    const rawReduced = currentDraftWeightLbs * 0.95
    const roundedLbs = Math.max(5, Math.round(rawReduced / 5) * 5)
    const roundedKg = Math.max(2.5, Math.round((roundedLbs / 2.20462) / 2.5) * 2.5)

    return {
      exerciseName,
      action: 'reduce_load_5pct',
      fatigueLevel: 'elevated_fatigue',
      badgeText: '−5% Load Deload',
      headline: 'Rep Target Missed at Failure (RIR 0)',
      rationale: `Completed ${lastSet.reps} reps vs ${parsedTargetReps} target at RIR 0. Apply a −5% load reduction to maintain the target rep range without technical failure.`,
      suggestedWeightLbs: roundedLbs,
      suggestedWeightKg: roundedKg,
      suggestedRestExtensionSeconds: 30,
      isHammerCurl: isHammer,
      biomechanicalWarning: hammerGuardrailText,
      hasAcuteFatigueDrop: true,
      acuteFatigueDropPercent: acuteDrop.dropPercent,
      acuteFatigueDropReason: acuteDrop.reason,
      backOffPlan,
      dropSetRecommendation,
      coachVoiceCue,
    }
  }

  // ── 3. Consecutive Sets Velocity Decay: Reps Dropped by >= 2 Reps ──
  if (workingSets.length >= 2) {
    const prev = workingSets[workingSets.length - 2]
    const repDrop = prev.reps - lastSet.reps
    if (repDrop >= 2 && lastSet.weightLbs >= prev.weightLbs) {
      const suggestedRepsCap = Math.max(1, lastSet.reps)

      return {
        exerciseName,
        action: 'cap_reps',
        fatigueLevel: 'elevated_fatigue',
        badgeText: `Cap at ${suggestedRepsCap} Reps`,
        headline: 'Velocity Loss & Rep Decay Detected',
        rationale: `Repetitions dropped from ${prev.reps} to ${lastSet.reps} at equal load. Cap upcoming set at ${suggestedRepsCap} reps to maintain bar velocity and prevent failure.`,
        suggestedReps: suggestedRepsCap,
        suggestedRestExtensionSeconds: 20,
        isHammerCurl: isHammer,
        biomechanicalWarning: hammerGuardrailText,
        hasAcuteFatigueDrop: true,
        acuteFatigueDropPercent: Math.round((repDrop / prev.reps) * 100),
        acuteFatigueDropReason: `Reps dropped from ${prev.reps} to ${lastSet.reps}.`,
        backOffPlan,
        dropSetRecommendation,
        coachVoiceCue,
      }
    }
  }

  // ── 4. Acute Fatigue Drop Detected (>15% Drop Threshold) ──
  if (acuteDrop.hasDrop) {
    const isSevere = acuteDrop.severity === 'severe'
    const action: AutoregulationAction = isSevere ? 'reduce_load_15pct' : 'reduce_load_10pct'
    const badgeText = isSevere ? `−15% Back-Off (${acuteDrop.dropPercent}% Drop)` : `−10% Back-Off (${acuteDrop.dropPercent}% Drop)`

    return {
      exerciseName,
      action,
      fatigueLevel: isSevere ? 'critical_overload' : 'elevated_fatigue',
      badgeText,
      headline: `Acute Fatigue Drop Detected (−${acuteDrop.dropPercent}%)`,
      rationale: `${acuteDrop.reason} Apply a recommended Back-Off load to preserve high mechanical tension, or convert to a 3-stage Drop Set to maximize motor unit recruitment safely.`,
      suggestedWeightLbs: backOffPlan.backOffWeightLbs,
      suggestedWeightKg: backOffPlan.backOffWeightKg,
      suggestedReps: parsedTargetReps,
      suggestedRestExtensionSeconds: isSevere ? 45 : 30,
      isHammerCurl: isHammer,
      biomechanicalWarning: hammerGuardrailText,
      hasAcuteFatigueDrop: true,
      acuteFatigueDropPercent: acuteDrop.dropPercent,
      acuteFatigueDropReason: acuteDrop.reason,
      backOffPlan,
      dropSetRecommendation,
      coachVoiceCue,
    }
  }

  // ── 4. Momentary Failure on Final Rep of Target: Extend Rest ──
  if (lastRir === 0 || lastRpe >= 9.5) {
    return {
      exerciseName,
      action: 'extend_rest',
      fatigueLevel: 'elevated_fatigue',
      badgeText: '+30s Rest Extension',
      headline: 'Momentary Failure Reached (RIR 0)',
      rationale: 'Hit zero reps in reserve on the final rep. Extend rest interval by +30 seconds to allow complete ATP-CP resynthesis before your next set.',
      suggestedRestExtensionSeconds: 30,
      isHammerCurl: isHammer,
      biomechanicalWarning: hammerGuardrailText,
      hasAcuteFatigueDrop: false,
      acuteFatigueDropPercent: 0,
      backOffPlan,
      dropSetRecommendation,
      coachVoiceCue,
    }
  }

  // ── 5. Velocity Decay: Reps Dropped by >= 2 Across Consecutive Sets ──
  if (workingSets.length >= 2) {
    const prev = workingSets[workingSets.length - 2]
    const repDrop = prev.reps - lastSet.reps
    if (repDrop >= 2 && lastSet.weightLbs >= prev.weightLbs) {
      const suggestedRepsCap = Math.max(1, lastSet.reps)

      return {
        exerciseName,
        action: 'cap_reps',
        fatigueLevel: 'elevated_fatigue',
        badgeText: `Cap at ${suggestedRepsCap} Reps`,
        headline: 'Velocity Loss & Rep Decay Detected',
        rationale: `Repetitions dropped from ${prev.reps} to ${lastSet.reps} at equal load. Cap upcoming set at ${suggestedRepsCap} reps to maintain bar velocity and prevent failure.`,
        suggestedReps: suggestedRepsCap,
        suggestedRestExtensionSeconds: 20,
        isHammerCurl: isHammer,
        biomechanicalWarning: hammerGuardrailText,
        hasAcuteFatigueDrop: true,
        acuteFatigueDropPercent: Math.round((repDrop / prev.reps) * 100),
        acuteFatigueDropReason: `Reps dropped from ${prev.reps} to ${lastSet.reps}.`,
        backOffPlan,
        dropSetRecommendation,
        coachVoiceCue,
      }
    }
  }

  // ── 6. Optimal Neuromuscular Strain (RIR 1-3) ──
  return {
    exerciseName,
    action: 'maintain',
    fatigueLevel: 'optimal_strain',
    badgeText: `${lastRir} RIR (Optimal Stimulus)`,
    headline: 'Optimal Hypertrophic Reserve',
    rationale: `Previous set logged at RPE ${lastRpe} (${lastRir} RIR). Neuromuscular output is in the ideal stimulus-to-fatigue zone. Proceed with scheduled load.`,
    isHammerCurl: isHammer,
    biomechanicalWarning: hammerGuardrailText,
    hasAcuteFatigueDrop: false,
    acuteFatigueDropPercent: 0,
  }
}

/**
 * Computes Foster Session-RPE (sRPE) and cumulative training load across an entire workout.
 */
export function computeSessionRpeTelemetry(
  completedSets: CompletedSetPerformance[],
  sessionDurationMinutes: number = 45
): SessionRpeMetrics {
  const workingSets = completedSets.filter(s => !s.isWarmup && s.reps > 0)
  const duration = Math.max(5, sessionDurationMinutes)

  if (workingSets.length === 0) {
    return {
      sessionRpeFoster: 7.0,
      sessionDurationMinutes: duration,
      fosterTrainingLoadAu: Math.round(7.0 * duration),
      loadZone: 'maintenance',
      loadZoneLabel: 'Pre-Session Baseline',
      loadZoneColor: '#38BDF8',
      averageRpe: 7.0,
      averageRir: 3.0,
      totalWorkingSets: 0,
      failureSetsCount: 0,
      excessiveFatigueDetected: false,
      sessionGuidance: 'Ready to commence session. Execute warm-up ramp and primary compound movements.',
    }
  }

  // Compute average RPE
  let totalRpe = 0
  let totalRir = 0
  let failureCount = 0

  workingSets.forEach(s => {
    const rpeVal = normalizeRpeValue(s.rpe ?? (s.rir !== undefined && s.rir !== null ? 10 - Number(s.rir) : 7.5))
    const rirVal = s.rir !== undefined && s.rir !== null ? normalizeRirValue(s.rir) : mapRpeToRir(rpeVal)

    totalRpe += rpeVal
    totalRir += rirVal

    if (rirVal === 0 || rpeVal >= 9.5) {
      failureCount += 1
    }
  })

  const avgRpe = Math.round((totalRpe / workingSets.length) * 10) / 10
  const avgRir = Math.round((totalRir / workingSets.length) * 10) / 10

  // Foster sRPE score matches the session perceived exertion
  const sessionRpeFoster = avgRpe
  const fosterTrainingLoadAu = Math.round(sessionRpeFoster * duration)

  // Classify Training Load Zones (Foster et al., Arbitrary Units [A.U.])
  let loadZone: SessionRpeMetrics['loadZone'] = 'optimal'
  let loadZoneLabel = 'Optimal Hypertrophic Stimulus'
  let loadZoneColor = '#10B981' // Emerald
  let sessionGuidance = 'Training strain is well balanced. Maintain crisp movement tempo and scheduled rest intervals.'

  if (fosterTrainingLoadAu < 200) {
    loadZone = 'recovery'
    loadZoneLabel = 'Active Recovery / Primer'
    loadZoneColor = '#06B6D4' // Cyan
    sessionGuidance = 'Low systemic strain. Suitable for recovery microcycles, mobility, or kinetic primers.'
  } else if (fosterTrainingLoadAu < 320) {
    loadZone = 'maintenance'
    loadZoneLabel = 'Aerobic / Muscular Maintenance'
    loadZoneColor = '#38BDF8' // Sky
    sessionGuidance = 'Moderate training density. Excellent volume accumulation without joint wear.'
  } else if (fosterTrainingLoadAu <= 520) {
    loadZone = 'optimal'
    loadZoneLabel = 'Optimal Hypertrophic Stimulus'
    loadZoneColor = '#10B981' // Emerald
    sessionGuidance = 'Prime adaptive zone for myofibrillar protein synthesis and mechanical tension.'
  } else if (fosterTrainingLoadAu <= 700) {
    loadZone = 'high_strain'
    loadZoneLabel = 'High Neuromuscular Strain'
    loadZoneColor = '#F59E0B' // Amber
    sessionGuidance = 'Elevated central nervous system fatigue. Consider capping remaining sets at 2 RIR.'
  } else {
    loadZone = 'overreaching'
    loadZoneLabel = 'Overreaching / Deload Threshold'
    loadZoneColor = '#EF4444' // Ruby
    sessionGuidance = 'Systemic fatigue threshold exceeded. Avoid failure on accessory lifts and prioritize post-session nutrition.'
  }

  const excessiveFatigueDetected = failureCount >= 3 || loadZone === 'overreaching'

  return {
    sessionRpeFoster,
    sessionDurationMinutes: duration,
    fosterTrainingLoadAu,
    loadZone,
    loadZoneLabel,
    loadZoneColor,
    averageRpe: avgRpe,
    averageRir: avgRir,
    totalWorkingSets: workingSets.length,
    failureSetsCount: failureCount,
    excessiveFatigueDetected,
    sessionGuidance,
  }
}
