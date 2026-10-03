/**
 * Autonomous CNS Readiness & Dynamic Periodized Deload Engine
 * 
 * Based on NASM CPT-7:
 * - Chapter 21: Chronic Fatigue, Overtraining Syndrome (OTS) & Recovery Telemetry
 * - Acute-to-Chronic Workload Ratio (ACWR) Injury Risk Modeler
 * - Dynamic 1-Week Periodized Deload Generator (-40% Volume, Maintained Intensity, Zone 1 Recovery)
 */

export interface ReadinessInput {
  sleepHours?: number | null // e.g. 7.5
  sleepQuality?: number | null // 1 - 10
  restingHeartRate?: number | null // e.g. 54 bpm
  baselineRhr?: number | null // e.g. 52 bpm
  sorenessLevel?: number | null // 1 - 10 (1 = fresh, 10 = extreme soreness)
  stressLevel?: number | null // 1 - 10 (1 = calm, 10 = severe stress)
  recentWorkloadUnits?: number[] | null // Last 7 days volume units (e.g. [450, 500, 0, 480, 520, 0, 550])
  chronicAvgWeeklyWorkload?: number | null // Rolling 28-day weekly average (e.g. 2100)
}

export interface AcwrAnalysis {
  acuteWorkload: number // Last 7 days sum
  chronicWorkload: number // 28-day baseline average
  ratio: number | null // Acute : Chronic (e.g. 1.15) or null if no workload data exists
  zone: 'Under-training' | 'Sweet Spot (Optimal Overload)' | 'Overreaching' | 'Danger Zone (OTS Risk)' | 'No Data'
  injuryRiskPercentage: number // 5% to 45%
  deloadRecommended: boolean
  clinicalRationale: string
  hasData: boolean
  isCalibrating?: boolean
}

export interface DeloadMicrocycleDay {
  day: number
  title: string
  focus: string
  volumeReductionPct: number // e.g. 40
  rpeCap: number // e.g. 7
  targetSets: string // e.g. "2 sets instead of 4"
  conditioning: string
  mobilityFocus: string
}

export interface DeloadMicrocycleProtocol {
  protocolTitle: string
  rationale: string
  durationDays: number
  volumeReduction: string
  intensityStrategy: string
  cnsRecoveryAction: string
  days: DeloadMicrocycleDay[]
}

export interface ReadinessEvaluation {
  score: number | null // 0 - 100 or null if no telemetry data exists
  gate: 'GREEN' | 'YELLOW' | 'RED' | 'NO_DATA'
  tier: 'Optimal Adaptation' | 'Moderate Fatigue / Overreaching' | 'High Systemic / CNS Exhaustion' | 'Awaiting Telemetry'
  color: string
  intensityMultiplier: number // 0.7 - 1.05
  rpeCap: number // 7 - 9.5
  restIntervalAdjustmentSec: number // +0s, +30s, +60s
  recommendation: string
  workoutAction: 'proceed_normal' | 'reduce_volume' | 'switch_to_recovery' | 'trigger_deload'
  recoveryProtocol: string[]
  acwr: AcwrAnalysis
  deloadPlan?: DeloadMicrocycleProtocol
  hasTelemetry: boolean
}

/**
 * Calculates Acute-to-Chronic Workload Ratio (ACWR) and injury risk
 */
export function calculateAcwr(
  recentDailyWorkloads?: number[] | null,
  chronicWeeklyAverage?: number | null
): AcwrAnalysis {
  const workloads = recentDailyWorkloads ?? []
  const acuteWorkload = workloads.reduce((acc, curr) => acc + (Number(curr) || 0), 0)
  const chronicWorkload = typeof chronicWeeklyAverage === 'number' && !isNaN(chronicWeeklyAverage)
    ? chronicWeeklyAverage
    : 0

  const hasData = acuteWorkload > 0 || chronicWorkload > 0

  if (!hasData) {
    return {
      acuteWorkload: 0,
      chronicWorkload: 0,
      ratio: null,
      zone: 'No Data',
      injuryRiskPercentage: 0,
      deloadRecommended: false,
      clinicalRationale: 'No workload telemetry logged. Insufficient data to establish acute-to-chronic ratio.',
      hasData: false,
    }
  }

  // If chronicWorkload is 0 or unestablished during cold start, use acuteWorkload as baseline (1.00 ratio).
  const isCalibrating = chronicWorkload === 0 || chronicWorkload === acuteWorkload
  const effectiveChronic = Math.max(1, chronicWorkload > 0 ? chronicWorkload : acuteWorkload)
  const ratio = Math.round((acuteWorkload / effectiveChronic) * 100) / 100

  let zone: AcwrAnalysis['zone'] = 'Sweet Spot (Optimal Overload)'
  let injuryRiskPercentage = 10
  let deloadRecommended = false
  let clinicalRationale = 'Workload accumulation is in the optimal progressive overload window.'

  if (isCalibrating && ratio >= 0.8 && ratio <= 1.30) {
    clinicalRationale = 'Baseline calibration: Establishing chronic workload tolerance. Training stimulus is well tolerated.'
  } else if (ratio < 0.8) {
    zone = 'Under-training'
    injuryRiskPercentage = 15
    clinicalRationale = 'Training stimulus is below baseline capacity. Increase volume or intensity progressively.'
  } else if (ratio <= 1.30) {
    zone = 'Sweet Spot (Optimal Overload)'
    injuryRiskPercentage = 8
    clinicalRationale = 'Sweet spot: Maximum fitness adaptation with minimal soft-tissue injury risk.'
  } else if (ratio <= 1.49) {
    zone = 'Overreaching'
    injuryRiskPercentage = 22
    clinicalRationale = 'Acute workload is spiking above chronic baseline. Monitor recovery closely and cap RPE at 8.'
  } else {
    zone = 'Danger Zone (OTS Risk)'
    injuryRiskPercentage = 42
    deloadRecommended = true
    clinicalRationale = 'ACWR >= 1.50: Severe fatigue accumulation detected. High probability of connective tissue strain and overtraining syndrome. Deload microcycle required.'
  }

  return {
    acuteWorkload,
    chronicWorkload: effectiveChronic,
    ratio,
    zone,
    injuryRiskPercentage,
    deloadRecommended,
    clinicalRationale,
    hasData: true,
    isCalibrating,
  }
}

/**
 * Generates a structured 1-Week Active Deload Microcycle
 * (CPT-7 Chapter 21 Protocol: Volume -40%, Maintain 85% Intensity, Zone 1 Recovery)
 */
export function generateDeloadMicrocycle(): DeloadMicrocycleProtocol {
  return {
    protocolTitle: 'NASM OPT™ Periodized Active Deload Protocol (1-Week Reset)',
    rationale: 'Systemic dissipation of fatigue while maintaining neuromuscular motor unit recruitment via high-intensity, low-volume lifting.',
    durationDays: 7,
    volumeReduction: '-40% to -50% total set volume',
    intensityStrategy: 'Maintain 80–85% 1RM working weights; stop all sets at RPE 6.5–7.0 (RIR 3+)',
    cnsRecoveryAction: 'Daily parasympathetic down-regulation, contrast hydrotherapy, 8+ hours sleep',
    days: [
      {
        day: 1,
        title: 'Upper Kinetic Chain Deload',
        focus: 'Compound pushing & pulling with 2 sets per exercise (reduced from 4). Capped at RPE 7.',
        volumeReductionPct: 45,
        rpeCap: 7,
        targetSets: '2 working sets per movement (RIR 3)',
        conditioning: '15-min Stage 1 Zone 1 Incline Walk (HR 120-135 BPM)',
        mobilityFocus: 'Thoracic foam roll (2 mins) + Pec Minor doorway stretch (30s hold)',
      },
      {
        day: 2,
        title: 'Parasympathetic Active Recovery',
        focus: 'Restorative mobility flow & light aerobic flush.',
        volumeReductionPct: 100,
        rpeCap: 4,
        targetSets: '0 resistance sets',
        conditioning: '30-min Outdoor Zone 1 Recovery Cycle / Walk',
        mobilityFocus: 'Full-body 4-Phase CEx Continuum (Foam rolling calves, TFL, piriformis, lats)',
      },
      {
        day: 3,
        title: 'Lower Kinetic Chain Deload',
        focus: 'Squat & hinge variations with 2 sets per movement. Sharp, explosive reps with 0 grinding.',
        volumeReductionPct: 45,
        rpeCap: 7,
        targetSets: '2 working sets per movement (RIR 3)',
        conditioning: '10-min Easy Spin / Row',
        mobilityFocus: '90/90 Hip Mobility + Adductor static stretches',
      },
      {
        day: 4,
        title: 'Metabolic Equilibrium Day',
        focus: 'Active recovery and central nervous system restoration.',
        volumeReductionPct: 100,
        rpeCap: 4,
        targetSets: '0 resistance sets',
        conditioning: '20-min Zone 1 Swimming or Mobility Walk',
        mobilityFocus: 'Cervical & Thoracic decompression + Diaphragmatic breathing (10 mins)',
      },
      {
        day: 5,
        title: 'Full-Body Neuromuscular Primer',
        focus: 'High-quality technical execution. 1-2 sets of primary compound lifts to prime CNS for next macrocycle.',
        volumeReductionPct: 50,
        rpeCap: 7,
        targetSets: '2 crisp sets per movement (RIR 3)',
        conditioning: '15-min Stage 1 Zone 1 Cool-down',
        mobilityFocus: 'World’s Greatest Stretch + Glute Activation Drills',
      },
      {
        day: 6,
        title: 'Weekend CNS Restoration',
        focus: 'Complete systemic rest, nutrition refeed, and hydration reloading.',
        volumeReductionPct: 100,
        rpeCap: 3,
        targetSets: '0 resistance sets',
        conditioning: 'Optional gentle walk',
        mobilityFocus: 'Static stretching hamstrings and hip flexors',
      },
      {
        day: 7,
        title: 'Pre-Macrocycle Re-Assessment',
        focus: 'Evaluate resting HR, subjective soreness, and readiness gate to transition into next training block.',
        volumeReductionPct: 100,
        rpeCap: 3,
        targetSets: '0 resistance sets',
        conditioning: 'Rest',
        mobilityFocus: 'Foam roll full posterior chain',
      },
    ],
  }
}

/**
 * Computes full daily readiness evaluation, ACWR, and adaptive session throttling
 */
export function calculateReadinessScore(input: ReadinessInput = {}): ReadinessEvaluation {
  const {
    sleepHours,
    sleepQuality,
    restingHeartRate,
    baselineRhr = 52,
    sorenessLevel,
    stressLevel,
    recentWorkloadUnits,
    chronicAvgWeeklyWorkload,
  } = input

  const acwr = calculateAcwr(recentWorkloadUnits, chronicAvgWeeklyWorkload)

  const hasSleep = typeof sleepHours === 'number' && Number.isFinite(sleepHours) && sleepHours > 0
  const hasSleepQuality = typeof sleepQuality === 'number' && Number.isFinite(sleepQuality) && sleepQuality > 0
  const hasRhr = typeof restingHeartRate === 'number' && Number.isFinite(restingHeartRate) && restingHeartRate > 0
  const hasSoreness = typeof sorenessLevel === 'number' && Number.isFinite(sorenessLevel) && sorenessLevel > 0
  const hasStress = typeof stressLevel === 'number' && Number.isFinite(stressLevel) && stressLevel > 0

  const hasBiometrics = hasSleep || hasSleepQuality || hasRhr || hasSoreness || hasStress

  if (!hasBiometrics && !acwr.hasData) {
    return {
      score: null,
      gate: 'NO_DATA',
      tier: 'Awaiting Telemetry',
      color: '#94A3B8',
      intensityMultiplier: 1.0,
      rpeCap: 8.5,
      restIntervalAdjustmentSec: 0,
      recommendation: 'No telemetry data detected. Connect Apple Health, Google Health Connect, or log daily recovery metrics to calibrate your Daily Gate.',
      workoutAction: 'proceed_normal',
      recoveryProtocol: [
        'Awaiting wearable telemetry or morning biometric check-in.',
        'Standard kinetic movement prep & unadjusted working sets.',
      ],
      acwr,
      hasTelemetry: false,
    }
  }

  let score = 50

  // 1. Sleep Duration & Quality Component (Max +35)
  if (hasSleep) {
    const sleepDurationScore = Math.min(20, (sleepHours! / 8) * 20)
    score += sleepDurationScore
  } else {
    score += 12 // Neutral baseline
  }

  if (hasSleepQuality) {
    const sleepQualityScore = (sleepQuality! / 10) * 15
    score += sleepQualityScore
  } else if (hasSleep) {
    score += 12
  } else {
    score += 10
  }

  // 2. Resting Heart Rate Component (Max +/- 15)
  if (hasRhr) {
    const effectiveBaseline = typeof baselineRhr === 'number' && baselineRhr > 0 ? baselineRhr : 52
    const rhrDiff = restingHeartRate! - effectiveBaseline
    if (rhrDiff <= 0) {
      score += 15 // At or below baseline RHR = strong parasympathetic tone
    } else if (rhrDiff <= 3) {
      score += 8
    } else if (rhrDiff <= 6) {
      score -= 5
    } else {
      score -= 15 // Significant RHR elevation = sympathetic exhaustion or illness
    }
  }

  // 3. Soreness & Stress Component (Max -20)
  if (hasSoreness) {
    const sorenessDeduction = (Math.max(0, sorenessLevel! - 1) / 9) * 12
    score -= sorenessDeduction
  }
  if (hasStress) {
    const stressDeduction = (Math.max(0, stressLevel! - 1) / 9) * 8
    score -= stressDeduction
  }

  const clampedScore = Math.max(15, Math.min(100, Math.round(score)))

  // Determine Gate, Tier, and Adaptive Action
  if (clampedScore >= 80 && !acwr.deloadRecommended) {
    return {
      score: clampedScore,
      gate: 'GREEN',
      tier: 'Optimal Adaptation',
      color: '#34d399',
      intensityMultiplier: 1.0,
      rpeCap: 9.5,
      restIntervalAdjustmentSec: 0,
      recommendation: 'Central Nervous System fully recovered. Green light for full programmed volume, heavy compound lifts, and 2-for-2 progressive overload attempts.',
      workoutAction: 'proceed_normal',
      recoveryProtocol: [
        'Standard 10-min dynamic kinetic warm-up',
        'Normal 60–90s rest intervals',
        'Execute planned working sets to target RPE 8.5–9.5',
      ],
      acwr,
      hasTelemetry: true,
    }
  }

  if (clampedScore >= 55 && !acwr.deloadRecommended) {
    return {
      score: clampedScore,
      gate: 'YELLOW',
      tier: 'Moderate Fatigue / Overreaching',
      color: '#C5A059',
      intensityMultiplier: 0.85,
      rpeCap: 8.0,
      restIntervalAdjustmentSec: 30,
      recommendation: 'Moderate accumulated fatigue detected. Execute scheduled lifts but stop 2 reps shy of failure (cap RPE at 8). Cut final burnout sets.',
      workoutAction: 'reduce_volume',
      recoveryProtocol: [
        'Extend rest intervals by +30 seconds between compound sets',
        'Drop final drop set or burnout set from each exercise',
        'Post-workout 10-min foam roll focusing on thoracic and hip flexors',
      ],
      acwr,
      hasTelemetry: true,
    }
  }

  // RED GATE or ACWR Danger Zone Trigger
  const deloadPlan = generateDeloadMicrocycle()

  return {
    score: clampedScore,
    gate: 'RED',
    tier: 'High Systemic / CNS Exhaustion',
    color: '#f87171',
    intensityMultiplier: 0.6,
    rpeCap: 7.0,
    restIntervalAdjustmentSec: 60,
    recommendation: acwr.deloadRecommended
      ? 'CRITICAL: Acute workload ratio (ACWR >= 1.5) indicates extreme fatigue accumulation. Switch immediately to 1-Week Active Deload Microcycle.'
      : 'High systemic/CNS fatigue detected (Elevated RHR or severe DOMS). Recommended: Reduce working sets by -50%, cap RPE at 7, or switch to Active Recovery.',
    workoutAction: acwr.deloadRecommended ? 'trigger_deload' : 'switch_to_recovery',
    recoveryProtocol: [
      '30-minute 4-Phase Corrective Exercise Continuum (Inhibit -> Lengthen -> Activate -> Integrate)',
      '20-minute low-intensity Zone 1 aerobic walk / spin (HR < 120 bpm)',
      'Contrast shower or cold immersion therapy to stimulate vagal nerve parasympathetic tone',
      'Ensure 8.5+ hours of sleep with high magnesium glycinate supplementation',
    ],
    acwr,
    deloadPlan,
    hasTelemetry: true,
  }
}
