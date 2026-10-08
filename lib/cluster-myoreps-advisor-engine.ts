/**
 * Forge Athletic — Cluster Set & Myo-Reps Intra-Set Protocol Advisor Engine
 * 
 * Evidence-based intra-set training methodology engine:
 * 1. Cluster Sets (Tufano, Haff, Latella):
 *    - Divides a traditional set into clusters of 2-4 reps separated by 15-20s intra-set rest.
 *    - Preserves mean concentric velocity (>85% of baseline), peak kinetic power output, and mechanical tension
 *      while minimizing lactate accumulation, ammonia accumulation, and neuromuscular fatigue.
 * 2. Myo-Reps (Borge Fagerli):
 *    - High-density hypertrophy protocol consisting of an Activation Set (10-15 reps, RIR 1-2)
 *      followed by 15s micro-rest intervals and multiple high-effective-rep mini-sets (e.g. 3-5 sets of 3-5 reps).
 *    - Every mini-set rep is an "effective rep" due to sustained 100% motor unit recruitment.
 * 3. NASM Clinical Biomechanical Guardrail Enforcement:
 *    - For all hammer curl variants, mandates strictly neutral grip (palms facing inward), vertical dumbbell
 *      heads, thumbs pointed toward the ceiling, and zero wrist supination/twisting during cluster bursts or mini-sets.
 */

import { isHammerCurlMovement, isCompoundLift } from './bio-adaptive-rest-pacer'
import { roundToNearestIncrement } from './intensity-protocols-engine'

export interface ClusterStage {
  clusterIndex: number
  reps: number
  intraRestSeconds: number
  weightLbs: number
  weightKg: number
}

export interface ClusterSetPlan {
  exerciseName: string
  totalReps: number
  clusterCount: number
  repsPerCluster: number
  intraRestSeconds: number
  weightLbs: number
  weightKg: number
  stages: ClusterStage[]
  totalVolumeLbs: number
  totalVolumeKg: number
  notesTag: string
  coachVoiceCue: string
  rationale: string
  isHammerCurl: boolean
  guardrailMandate?: string
}

export interface MyoMiniSet {
  miniSetIndex: number
  targetReps: number
  intraRestSeconds: number
}

export interface MyoRepsPlan {
  exerciseName: string
  activationWeightLbs: number
  activationWeightKg: number
  activationReps: number
  intraRestSeconds: number
  miniSets: MyoMiniSet[]
  totalEffectiveReps: number
  totalReps: number
  totalVolumeLbs: number
  totalVolumeKg: number
  notesTag: string
  coachVoiceCue: string
  rationale: string
  isHammerCurl: boolean
  guardrailMandate?: string
}

export interface ClusterSetAdvisorInput {
  exerciseName: string
  currentWeightLbs: number
  targetReps?: number | string | null
  units?: 'imperial' | 'metric'
  intraRestSeconds?: number
  isCompound?: boolean
}

export interface MyoRepsAdvisorInput {
  exerciseName: string
  currentWeightLbs: number
  targetReps?: number | string | null
  units?: 'imperial' | 'metric'
  intraRestSeconds?: number
}

/**
 * Synthesizes an evidence-based Cluster Set protocol tailored to the exercise mechanics and load.
 */
export function generateClusterSetPlan(input: ClusterSetAdvisorInput): ClusterSetPlan {
  const {
    exerciseName,
    currentWeightLbs,
    targetReps = 8,
    units = 'imperial',
    intraRestSeconds,
    isCompound = isCompoundLift(exerciseName),
  } = input

  const isHammer = isHammerCurlMovement(exerciseName)
  const hammerGuardrail = isHammer
    ? 'Strict Neutral Grip Guardrail: Dumbbells must remain oriented vertically with thumbs pointed up toward ceiling and zero wrist twisting/supination across all cluster bursts. If wrist supinates, terminate the cluster immediately.'
    : undefined

  const rawTargetReps = typeof targetReps === 'number'
    ? targetReps
    : parseInt(String(targetReps || 8).replace(/[^0-9]/g, ''), 10) || 8

  const weightLbs = roundToNearestIncrement(Math.max(5, currentWeightLbs), units === 'imperial' ? 5 : 2.5)
  const weightKg = Math.round((weightLbs / 2.20462) * 10) / 10

  // Standard intra-set rest: 20s for compound multi-joint, 15s for isolation/accessory
  const intraRest = intraRestSeconds ?? (isCompound ? 20 : 15)

  // Determine optimal cluster rep subdivision:
  // Low reps (<=6): 3 clusters of 2 reps (2+2+2)
  // Moderate reps (7-9): 3 clusters of 3 reps (3+3+3)
  // Higher reps (10-12): 3 clusters of 4 reps (4+4+4)
  let repsPerCluster = 3
  let clusterCount = 3

  if (rawTargetReps <= 6) {
    repsPerCluster = 2
    clusterCount = 3
  } else if (rawTargetReps >= 10) {
    repsPerCluster = 4
    clusterCount = 3
  } else {
    repsPerCluster = 3
    clusterCount = 3
  }

  const totalReps = repsPerCluster * clusterCount
  const totalVolumeLbs = weightLbs * totalReps
  const totalVolumeKg = Math.round(totalVolumeLbs / 2.20462)

  const stages: ClusterStage[] = Array.from({ length: clusterCount }, (_, idx) => ({
    clusterIndex: idx + 1,
    reps: repsPerCluster,
    intraRestSeconds: idx < clusterCount - 1 ? intraRest : 0,
    weightLbs,
    weightKg,
  }))

  const unitLabel = units === 'imperial' ? 'lb' : 'kg'
  const displayWeight = units === 'imperial' ? weightLbs : weightKg
  const clusterStr = Array(clusterCount).fill(repsPerCluster).join('+')
  const notesTag = `[Cluster: ${displayWeight}${unitLabel} × (${clusterStr}) | ${intraRest}s intra-rest | Vol: ${units === 'imperial' ? totalVolumeLbs.toLocaleString() : totalVolumeKg.toLocaleString()} ${unitLabel}]`

  const coachVoiceCue = `Cluster Set ready: ${clusterCount} clusters of ${repsPerCluster} reps at ${displayWeight} ${unitLabel} with ${intraRest} seconds intra-rest.`
  const rationale = `Subdivides ${totalReps} total reps into ${clusterCount} high-power clusters of ${repsPerCluster} reps with ${intraRest}s intra-rest to preserve concentric bar velocity and prevent form degradation.`

  return {
    exerciseName,
    totalReps,
    clusterCount,
    repsPerCluster,
    intraRestSeconds: intraRest,
    weightLbs,
    weightKg,
    stages,
    totalVolumeLbs,
    totalVolumeKg,
    notesTag,
    coachVoiceCue,
    rationale,
    isHammerCurl: isHammer,
    guardrailMandate: hammerGuardrail,
  }
}

/**
 * Synthesizes a high-effective-rep Myo-Reps protocol.
 */
export function generateMyoRepsPlan(input: MyoRepsAdvisorInput): MyoRepsPlan {
  const {
    exerciseName,
    currentWeightLbs,
    targetReps = 12,
    units = 'imperial',
    intraRestSeconds = 15,
  } = input

  const isHammer = isHammerCurlMovement(exerciseName)
  const hammerGuardrail = isHammer
    ? 'Strict Neutral Grip Guardrail: Maintain vertical dumbbell orientation, thumbs pointing up toward ceiling, zero wrist supination/twisting throughout the activation set and all mini-sets. Do not use torso swing to complete mini-sets.'
    : undefined

  const rawTargetReps = typeof targetReps === 'number'
    ? targetReps
    : parseInt(String(targetReps || 12).replace(/[^0-9]/g, ''), 10) || 12

  // Activation set is typically 10-15 reps (default 12)
  const activationReps = Math.max(8, Math.min(15, rawTargetReps))
  const weightLbs = roundToNearestIncrement(Math.max(5, currentWeightLbs), units === 'imperial' ? 5 : 2.5)
  const weightKg = Math.round((weightLbs / 2.20462) * 10) / 10

  // 4 mini-sets of 3 reps with 15s intra-set rest (5 deep breaths)
  const miniSets: MyoMiniSet[] = [
    { miniSetIndex: 1, targetReps: 3, intraRestSeconds },
    { miniSetIndex: 2, targetReps: 3, intraRestSeconds },
    { miniSetIndex: 3, targetReps: 3, intraRestSeconds },
    { miniSetIndex: 4, targetReps: 3, intraRestSeconds },
  ]

  const totalMiniSetReps = miniSets.reduce((sum, s) => sum + s.targetReps, 0)
  const totalReps = activationReps + totalMiniSetReps
  const totalVolumeLbs = weightLbs * totalReps
  const totalVolumeKg = Math.round(totalVolumeLbs / 2.20462)

  // In sports science, the last 4-5 reps of activation plus 100% of mini-set reps are effective reps
  const totalEffectiveReps = Math.min(5, activationReps) + totalMiniSetReps

  const unitLabel = units === 'imperial' ? 'lb' : 'kg'
  const displayWeight = units === 'imperial' ? weightLbs : weightKg
  const miniStr = miniSets.map(s => s.targetReps).join('+')
  const notesTag = `[MyoReps: ${displayWeight}${unitLabel} × ${activationReps} + (${miniStr}) | ${intraRestSeconds}s intra-rest | ${totalEffectiveReps} Effective Reps]`

  const coachVoiceCue = `Myo-Reps protocol ready: ${activationReps} rep activation set followed by 4 mini-sets of 3 reps with 15 seconds rest.`
  const rationale = `Activation set recruits high-threshold motor units; 4 mini-sets yield ${totalEffectiveReps} maximum-tension effective reps with minimal joint impact and high metabolic density.`

  return {
    exerciseName,
    activationWeightLbs: weightLbs,
    activationWeightKg: weightKg,
    activationReps,
    intraRestSeconds,
    miniSets,
    totalEffectiveReps,
    totalReps,
    totalVolumeLbs,
    totalVolumeKg,
    notesTag,
    coachVoiceCue,
    rationale,
    isHammerCurl: isHammer,
    guardrailMandate: hammerGuardrail,
  }
}
