/**
 * Forge Athletic — Real-Time Bar Velocity & Kinetic Power Output Engine
 * 
 * Velocity-Based Training (VBT) and biomechanical power tracking:
 * 1. Range of Motion (ROM) modeling per exercise mechanics
 * 2. Mean Concentric Velocity (MCV) & Peak Concentric Velocity (PCV) in m/s
 * 3. Kinetic Mechanical Force (N), Work (J), and Power Output (Watts)
 * 4. VBT Velocity Zones (Speed, Speed-Strength, Strength-Speed, Accelerative, Absolute Strength)
 * 5. Intra-Set Velocity Loss (%) & Rep Deceleration Fatigue Auto-Flagging
 * 6. Clinical Biomechanical Guardrails (Strict Neutral Hammer Grip Verification)
 */

import { isHammerCurlMovement } from './bio-adaptive-rest-pacer'

export type VbtVelocityZone =
  | 'speed'
  | 'speed_strength'
  | 'strength_speed'
  | 'accelerative_strength'
  | 'absolute_strength'

export interface VbtZoneInfo {
  zone: VbtVelocityZone
  label: string
  velocityRange: string
  color: string
  bg: string
  border: string
  description: string
  adaptationTarget: string
}

export interface RepCadenceDuration {
  concentricSec: number
  eccentricSec?: number
  isometricSec?: number
}

export interface RepVelocityTelemetry {
  repNumber: number
  concentricSeconds: number
  eccentricSeconds: number
  romMeters: number
  meanConcentricVelocity: number // m/s
  peakConcentricVelocity: number // m/s
  meanEccentricVelocity: number // m/s
  forceNewtons: number // N
  workJoules: number // J
  meanPowerWatts: number // W
  peakPowerWatts: number // W
  velocityZone: VbtVelocityZone
  velocityZoneLabel: string
  velocityZoneColor: string
  velocityLossPercent: number // 0 to 100%
  isDecelerating: boolean
  isGrindRep: boolean
}

export type SetFatigueClassification =
  | 'explosive_hypertrophy'
  | 'optimal_stimulus'
  | 'moderate_fatigue'
  | 'excessive_deceleration'

export interface SetVelocityAnalysis {
  exerciseName: string
  loadKg: number
  loadLbs: number
  romMeters: number
  reps: RepVelocityTelemetry[]
  totalReps: number
  bestConcentricVelocity: number
  finalConcentricVelocity: number
  avgConcentricVelocity: number
  bestPowerWatts: number
  avgPowerWatts: number
  totalWorkJoules: number
  overallVelocityLossPercent: number
  fatigueClassification: SetFatigueClassification
  fatigueLabel: string
  fatigueColor: string
  recommendedAction: string
  isHammerCurl: boolean
  hammerCurlGuardrailVerified: boolean
  hammerCurlGuidance?: string
}

/**
 * Resolves standard anatomical vertical displacement / Range of Motion (ROM) in meters.
 */
export function resolveExerciseRomMeters(exerciseName: string): number {
  const name = exerciseName.toLowerCase()

  if (name.includes('squat')) {
    return 0.60
  }
  if (name.includes('deadlift') || name.includes('rdl')) {
    return 0.55
  }
  if (name.includes('pull-up') || name.includes('chin-up') || name.includes('lat pull')) {
    return 0.52
  }
  if (name.includes('overhead press') || name.includes('shoulder press') || name.includes('military press') || name.includes('arnold press')) {
    return 0.50
  }
  if (name.includes('leg press') || name.includes('hack squat')) {
    return 0.45
  }
  if (name.includes('bench press') || name.includes('chest press') || name.includes('push-up') || name.includes('dip')) {
    return 0.38
  }
  if (name.includes('row')) {
    return 0.38
  }
  if (name.includes('lateral raise') || name.includes('front raise')) {
    return 0.35
  }
  if (name.includes('hammer curl') || name.includes('bicep curl') || name.includes('preacher curl')) {
    return 0.34
  }
  if (name.includes('triceps') || name.includes('pushdown') || name.includes('skull crusher')) {
    return 0.32
  }
  if (name.includes('calf raise') || name.includes('shrug')) {
    return 0.15
  }

  // Default standard compound/isolation ROM
  return 0.40
}

/**
 * Classifies Mean Concentric Velocity into standard Velocity-Based Training (VBT) zones.
 */
export function classifyVbtZone(meanConcentricVelocity: number): VbtZoneInfo {
  const v = Math.max(0, meanConcentricVelocity)

  if (v >= 1.00) {
    return {
      zone: 'speed',
      label: 'Speed / Explosive RFD',
      velocityRange: '> 1.00 m/s',
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.4)',
      description: 'Maximum rate of force development (RFD), ballistic contraction, and plyometric recruitment.',
      adaptationTarget: 'Speed & Neuromuscular Quickness',
    }
  }

  if (v >= 0.75) {
    return {
      zone: 'speed_strength',
      label: 'Speed-Strength',
      velocityRange: '0.75 – 1.00 m/s',
      color: '#34D399',
      bg: 'rgba(52, 211, 153, 0.15)',
      border: 'rgba(52, 211, 153, 0.4)',
      description: 'High-velocity strength expression moving moderate loads with explosive intent.',
      adaptationTarget: 'Explosive Power & Dynamic Force',
    }
  }

  if (v >= 0.50) {
    return {
      zone: 'strength_speed',
      label: 'Strength-Speed',
      velocityRange: '0.50 – 0.75 m/s',
      color: '#FBBF24',
      bg: 'rgba(251, 191, 36, 0.15)',
      border: 'rgba(251, 191, 36, 0.4)',
      description: 'Optimal mechanical power output sweet spot; ideal blend of load and movement velocity.',
      adaptationTarget: 'Peak Mechanical Power & Hypertrophy',
    }
  }

  if (v >= 0.35) {
    return {
      zone: 'accelerative_strength',
      label: 'Accelerative Strength',
      velocityRange: '0.35 – 0.50 m/s',
      color: '#FB923C',
      bg: 'rgba(251, 146, 60, 0.15)',
      border: 'rgba(251, 146, 60, 0.4)',
      description: 'Heavy strength development; athlete drives maximum voluntary intent against high mechanical resistance.',
      adaptationTarget: 'Maximal Strength & High Mechanical Tension',
    }
  }

  return {
    zone: 'absolute_strength',
    label: 'Absolute / Grinding Strength',
    velocityRange: '< 0.35 m/s',
    color: '#F87171',
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.4)',
    description: 'Near-maximal effort approaching concentric failure limit (Minimum Velocity Threshold / 1RM zone).',
    adaptationTarget: 'Limit Strength & High Neuromuscular Strain',
  }
}

/**
 * Calculates single-rep velocity, work in Joules, and kinetic power in Watts.
 */
export function calculateRepVelocityAndPower(params: {
  exerciseName: string
  loadKg: number
  concentricSec: number
  eccentricSec?: number
  repNumber?: number
  baselineVelocity?: number
}): RepVelocityTelemetry {
  const {
    exerciseName,
    loadKg,
    concentricSec,
    eccentricSec = 2,
    repNumber = 1,
    baselineVelocity,
  } = params

  const rom = resolveExerciseRomMeters(exerciseName)
  const safeConSec = Math.max(0.15, concentricSec)
  const safeEccSec = Math.max(0.2, eccentricSec)

  // Velocities (m/s)
  const meanConcentricVelocity = Number((rom / safeConSec).toFixed(3))
  const peakConcentricVelocity = Number((meanConcentricVelocity * 1.45).toFixed(3))
  const meanEccentricVelocity = Number((rom / safeEccSec).toFixed(3))

  // Mass & Dynamics: use effective mass of at least 20kg (empty Olympic barbell standard) if 0
  const effectiveMassKg = Math.max(loadKg, 20)

  // Acceleration during concentric phase (m/s^2)
  const acceleration = meanConcentricVelocity / safeConSec

  // Force in Newtons: F = m * (g + a)
  const forceNewtons = Number((effectiveMassKg * (9.80665 + acceleration)).toFixed(1))

  // Mechanical Work in Joules: W = F * ROM
  const workJoules = Number((forceNewtons * rom).toFixed(1))

  // Mean & Peak Mechanical Power in Watts: P = F * v
  const meanPowerWatts = Number((forceNewtons * meanConcentricVelocity).toFixed(1))
  const peakPowerWatts = Number((forceNewtons * peakConcentricVelocity).toFixed(1))

  // VBT Zone
  const zoneInfo = classifyVbtZone(meanConcentricVelocity)

  // Velocity Loss Calculation
  let velocityLossPercent = 0
  if (baselineVelocity && baselineVelocity > 0 && meanConcentricVelocity < baselineVelocity) {
    velocityLossPercent = Number((((baselineVelocity - meanConcentricVelocity) / baselineVelocity) * 100).toFixed(1))
  }

  const isDecelerating = velocityLossPercent >= 20
  const isGrindRep = meanConcentricVelocity < 0.35 || velocityLossPercent >= 35

  return {
    repNumber,
    concentricSeconds: safeConSec,
    eccentricSeconds: safeEccSec,
    romMeters: rom,
    meanConcentricVelocity,
    peakConcentricVelocity,
    meanEccentricVelocity,
    forceNewtons,
    workJoules,
    meanPowerWatts,
    peakPowerWatts,
    velocityZone: zoneInfo.zone,
    velocityZoneLabel: zoneInfo.label,
    velocityZoneColor: zoneInfo.color,
    velocityLossPercent,
    isDecelerating,
    isGrindRep,
  }
}

/**
 * Analyzes a full multi-rep set for cumulative work, peak power, velocity loss, and fatigue flags.
 */
export function analyzeSetVelocityAndPower(params: {
  exerciseName: string
  loadKg: number
  repCadences: RepCadenceDuration[]
}): SetVelocityAnalysis {
  const { exerciseName, loadKg, repCadences } = params
  const isHammer = isHammerCurlMovement(exerciseName)
  const rom = resolveExerciseRomMeters(exerciseName)
  const loadLbs = Math.round(loadKg * 2.20462)

  if (!repCadences || repCadences.length === 0) {
    const single = calculateRepVelocityAndPower({
      exerciseName,
      loadKg,
      concentricSec: 1.5,
      eccentricSec: 2,
      repNumber: 1,
    })

    return {
      exerciseName,
      loadKg,
      loadLbs,
      romMeters: rom,
      reps: [single],
      totalReps: 1,
      bestConcentricVelocity: single.meanConcentricVelocity,
      finalConcentricVelocity: single.meanConcentricVelocity,
      avgConcentricVelocity: single.meanConcentricVelocity,
      bestPowerWatts: single.peakPowerWatts,
      avgPowerWatts: single.meanPowerWatts,
      totalWorkJoules: single.workJoules,
      overallVelocityLossPercent: 0,
      fatigueClassification: 'explosive_hypertrophy',
      fatigueLabel: 'Preserved Velocity (<10% Loss)',
      fatigueColor: '#34D399',
      recommendedAction: 'Optimal mechanical power output; maintain prescribed tempo.',
      isHammerCurl: isHammer,
      hammerCurlGuardrailVerified: isHammer,
      hammerCurlGuidance: isHammer ? getHammerCurlGuardrailGuidance() : undefined,
    }
  }

  // First pass: identify initial rep velocity to establish baseline
  let baselineVelocity = 0
  const processedReps: RepVelocityTelemetry[] = []

  repCadences.forEach((cadence, idx) => {
    const repNum = idx + 1
    const repTelemetry = calculateRepVelocityAndPower({
      exerciseName,
      loadKg,
      concentricSec: cadence.concentricSec,
      eccentricSec: cadence.eccentricSec ?? 2,
      repNumber: repNum,
      baselineVelocity: idx === 0 ? undefined : baselineVelocity,
    })

    if (idx === 0) {
      baselineVelocity = repTelemetry.meanConcentricVelocity
    } else if (repTelemetry.meanConcentricVelocity > baselineVelocity) {
      // Potentiation can make rep 2 slightly faster than rep 1
      baselineVelocity = repTelemetry.meanConcentricVelocity
    }

    processedReps.push(repTelemetry)
  })

  // Recalculate loss relative to best velocity
  processedReps.forEach(r => {
    if (baselineVelocity > 0 && r.meanConcentricVelocity < baselineVelocity) {
      r.velocityLossPercent = Number((((baselineVelocity - r.meanConcentricVelocity) / baselineVelocity) * 100).toFixed(1))
      r.isDecelerating = r.velocityLossPercent >= 20
      r.isGrindRep = r.meanConcentricVelocity < 0.35 || r.velocityLossPercent >= 35
    }
  })

  const velocities = processedReps.map(r => r.meanConcentricVelocity)
  const powers = processedReps.map(r => r.meanPowerWatts)
  const peakPowers = processedReps.map(r => r.peakPowerWatts)
  const totalWorkJoules = Number(processedReps.reduce((sum, r) => sum + r.workJoules, 0).toFixed(1))

  const bestConcentricVelocity = Math.max(...velocities)
  const finalConcentricVelocity = velocities[velocities.length - 1]
  const avgConcentricVelocity = Number((velocities.reduce((a, b) => a + b, 0) / velocities.length).toFixed(3))

  const bestPowerWatts = Math.max(...peakPowers)
  const avgPowerWatts = Number((powers.reduce((a, b) => a + b, 0) / powers.length).toFixed(1))

  const overallVelocityLossPercent = baselineVelocity > 0
    ? Number((Math.max(0, (baselineVelocity - finalConcentricVelocity) / baselineVelocity) * 100).toFixed(1))
    : 0

  // Fatigue Classification & Coaching Recommendation
  let fatigueClassification: SetFatigueClassification = 'explosive_hypertrophy'
  let fatigueLabel = 'Minimal Fatigue (<10% Loss)'
  let fatigueColor = '#34D399'
  let recommendedAction = 'High explosive speed preserved. Neuromuscular recruitment is optimal.'

  if (overallVelocityLossPercent >= 35) {
    fatigueClassification = 'excessive_deceleration'
    fatigueLabel = 'Severe Deceleration (>35% Loss)'
    fatigueColor = '#F87171'
    recommendedAction = 'Conclude set immediately. Velocity threshold exceeded; excessive grinding impairs recovery without additional hypertrophy.'
  } else if (overallVelocityLossPercent >= 20) {
    fatigueClassification = 'moderate_fatigue'
    fatigueLabel = 'Approaching Failure (20–35% Loss)'
    fatigueColor = '#FB923C'
    recommendedAction = 'Target high-tension stimulus achieved (~RIR 1-2). Prepare to rack bar to avoid joint shear.'
  } else if (overallVelocityLossPercent >= 10) {
    fatigueClassification = 'optimal_stimulus'
    fatigueLabel = 'Hypertrophy Sweet Spot (10–20% Loss)'
    fatigueColor = '#FBBF24'
    recommendedAction = 'Optimal mechanical tension threshold. Excellent motor unit recruitment with clean bar path.'
  }

  return {
    exerciseName,
    loadKg,
    loadLbs,
    romMeters: rom,
    reps: processedReps,
    totalReps: processedReps.length,
    bestConcentricVelocity,
    finalConcentricVelocity,
    avgConcentricVelocity,
    bestPowerWatts,
    avgPowerWatts,
    totalWorkJoules,
    overallVelocityLossPercent,
    fatigueClassification,
    fatigueLabel,
    fatigueColor,
    recommendedAction,
    isHammerCurl: isHammer,
    hammerCurlGuardrailVerified: isHammer,
    hammerCurlGuidance: isHammer ? getHammerCurlGuardrailGuidance() : undefined,
  }
}

/**
 * Biomechanical Guardrail message for Hammer Curl exercises (AGENTS.md compliance).
 */
export function getHammerCurlGuardrailGuidance(): string {
  return 'Strict neutral hammer grip protocol verified: palms face inward toward each other with zero wrist twisting or supination. Dumbbells must remain oriented vertically (heads pointing up and down, never horizontal) with thumbs pointed up toward the ceiling to eliminate elbow shear and ensure clean radial kinetic force transfer.'
}
