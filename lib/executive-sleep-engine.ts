/**
 * Forge Athletic — Executive Sleep & Autonomic Biometrics Engine
 * 
 * Clinical sports science analysis of sleep architecture, autonomic nervous system balance (HRV rMSSD),
 * nocturnal resting heart rate dip %, and recovery-informed training recommendations.
 */

export interface SleepStageDurationHours {
  deep: number // Slow-wave sleep (physical repair, GH release)
  rem: number // Rapid eye movement (cognitive, motor memory consolidation)
  light: number // Baseline restorative transition
  awake: number // Disruptions and latency
}

export interface ExecutiveSleepRecord {
  date: string // YYYY-MM-DD
  bedtime: string // e.g. "22:45"
  wakeTime: string // e.g. "06:30"
  totalSleepDurationHours: number
  timeInBedHours: number
  stages: SleepStageDurationHours
  nocturnalHrvRmssdMs: number
  baselineHrvRmssdMs: number
  nocturnalMinRhrBpm: number
  daytimeAvgRhrBpm: number
  respiratoryRateBpm?: number // e.g. 14.5
  skinTempDeviationCelsius?: number // e.g. +0.2 or -0.1
  sleepLatencyMinutes?: number // e.g. 12
  awakeningsCount?: number // e.g. 2
  provider?: string // 'apple_health' | 'google_fit' | 'manual'
}

export type AutonomicStatus = 'prime_adaptation' | 'balanced_optimal' | 'moderate_sympathetic_strain' | 'severe_fatigue_deficit'
export type HeartRateDipClass = 'optimal_dipper' | 'normal_dipper' | 'non_dipper' | 'reverse_dipper'
export type SleepQualityTier = 'elite' | 'optimal' | 'compromised' | 'critical'

export interface ExecutiveSleepAnalysis {
  overallSleepScore: number // 0 - 100
  sleepQualityTier: SleepQualityTier
  sleepEfficiencyPercent: number // e.g. 91%
  deepSleepPercent: number // e.g. 21%
  remSleepPercent: number // e.g. 24%
  lightSleepPercent: number // e.g. 50%
  awakePercent: number // e.g. 5%
  deepSleepStatus: 'optimal' | 'suboptimal' | 'deficient'
  remSleepStatus: 'optimal' | 'suboptimal' | 'deficient'
  nocturnalRhrDipPercent: number // e.g. 14.2%
  rhrDipClassification: HeartRateDipClass
  hrvRatioToBaseline: number // e.g. 1.08 (108%)
  autonomicRecoveryStatus: AutonomicStatus
  trainingCapacityStatus: string
  clinicalGuidance: string
  recoveryKeyActions: string[]
}

/**
 * Calculates Cardiovascular Nocturnal Dip Percentage:
 * Dip % = ((Daytime Avg RHR - Nocturnal Min RHR) / Daytime Avg RHR) * 100
 */
export function calculateNocturnalRhrDip(daytimeAvgRhr: number, nocturnalMinRhr: number): {
  dipPercent: number
  classification: HeartRateDipClass
  description: string
} {
  if (daytimeAvgRhr <= 0 || nocturnalMinRhr <= 0) {
    return {
      dipPercent: 0,
      classification: 'normal_dipper',
      description: 'Insufficient heart rate data to evaluate cardiovascular dip.',
    }
  }

  const dipPercent = Math.round(((daytimeAvgRhr - nocturnalMinRhr) / daytimeAvgRhr) * 1000) / 10

  let classification: HeartRateDipClass = 'normal_dipper'
  let description = 'Healthy autonomic cardiovascular deceleration during sleep (10-20% dip).'

  if (dipPercent >= 20) {
    classification = 'optimal_dipper'
    description = 'Exceptional parasympathetic tone with deep nocturnal cardiac unloading (>20% dip).'
  } else if (dipPercent >= 10) {
    classification = 'normal_dipper'
    description = 'Standard healthy autonomic dipping (10-20% dip).'
  } else if (dipPercent > 0) {
    classification = 'non_dipper'
    description = 'Suboptimal autonomic relaxation (<10% dip). Indicates residual sympathetic tone, late meals, or stress.'
  } else {
    classification = 'reverse_dipper'
    description = 'Elevated nocturnal heart rate. High systemic strain, illness, or severe overreaching.'
  }

  return { dipPercent, classification, description }
}

/**
 * Evaluates Deep & REM sleep stage proportions according to sports medicine benchmarks
 */
export function evaluateSleepStages(
  totalSleep: number,
  deep: number,
  rem: number,
  light: number,
  awake: number
): {
  deepPercent: number
  remPercent: number
  lightPercent: number
  awakePercent: number
  deepStatus: 'optimal' | 'suboptimal' | 'deficient'
  remStatus: 'optimal' | 'suboptimal' | 'deficient'
} {
  const totalDuration = totalSleep > 0 ? totalSleep : (deep + rem + light)
  if (totalDuration <= 0) {
    return {
      deepPercent: 0,
      remPercent: 0,
      lightPercent: 0,
      awakePercent: 0,
      deepStatus: 'deficient',
      remStatus: 'deficient',
    }
  }

  const deepPercent = Math.round((deep / totalDuration) * 100)
  const remPercent = Math.round((rem / totalDuration) * 100)
  const lightPercent = Math.round((light / totalDuration) * 100)
  const awakePercent = Math.round((awake / (totalDuration + awake)) * 100)

  // Benchmarks: Deep optimal >= 18% (or >= 1.3 hrs), REM optimal >= 20% (or >= 1.4 hrs)
  const deepStatus = deepPercent >= 18 || deep >= 1.4 ? 'optimal' : deepPercent >= 12 || deep >= 0.9 ? 'suboptimal' : 'deficient'
  const remStatus = remPercent >= 20 || rem >= 1.5 ? 'optimal' : remPercent >= 14 || rem >= 1.0 ? 'suboptimal' : 'deficient'

  return {
    deepPercent,
    remPercent,
    lightPercent,
    awakePercent,
    deepStatus,
    remStatus,
  }
}

/**
 * Master Evaluation: Analyzes full sleep session and generates executive telemetry report
 */
export function evaluateExecutiveSleepSession(record: ExecutiveSleepRecord): ExecutiveSleepAnalysis {
  const totalSleep = record.totalSleepDurationHours || 0
  const inBed = record.timeInBedHours || (totalSleep + (record.stages?.awake || 0.4))
  const efficiency = inBed > 0 ? Math.min(100, Math.round((totalSleep / inBed) * 100)) : 85

  const stageEval = evaluateSleepStages(
    totalSleep,
    record.stages?.deep || 0,
    record.stages?.rem || 0,
    record.stages?.light || 0,
    record.stages?.awake || 0
  )

  const dipEval = calculateNocturnalRhrDip(record.daytimeAvgRhrBpm, record.nocturnalMinRhrBpm)

  // HRV Comparison vs 14-day rolling baseline
  const baselineHrv = record.baselineHrvRmssdMs > 0 ? record.baselineHrvRmssdMs : 65
  const currentHrv = record.nocturnalHrvRmssdMs > 0 ? record.nocturnalHrvRmssdMs : baselineHrv
  const hrvRatio = Math.round((currentHrv / baselineHrv) * 100) / 100

  // Autonomic Classification
  let autonomicStatus: AutonomicStatus = 'balanced_optimal'
  if (hrvRatio >= 1.05 && dipEval.dipPercent >= 10 && stageEval.deepStatus !== 'deficient') {
    autonomicStatus = 'prime_adaptation'
  } else if (hrvRatio >= 0.90 && dipEval.dipPercent >= 7) {
    autonomicStatus = 'balanced_optimal'
  } else if (hrvRatio >= 0.75 && dipEval.dipPercent >= 4) {
    autonomicStatus = 'moderate_sympathetic_strain'
  } else {
    autonomicStatus = 'severe_fatigue_deficit'
  }

  // Composite Sleep Score (0 - 100)
  // Weights: Total Duration (30%), Efficiency (20%), Deep Sleep (20%), REM (15%), Autonomic HRV (15%)
  let score = 0

  // 1. Duration (Optimal 7.5 - 9.0 hrs)
  if (totalSleep >= 7.5 && totalSleep <= 9.0) score += 30
  else if (totalSleep >= 6.5) score += 24
  else if (totalSleep >= 5.5) score += 16
  else score += 8

  // 2. Efficiency (Optimal >= 88%)
  if (efficiency >= 90) score += 20
  else if (efficiency >= 85) score += 16
  else if (efficiency >= 78) score += 10
  else score += 4

  // 3. Deep Sleep (Physical Recovery)
  if (stageEval.deepStatus === 'optimal') score += 20
  else if (stageEval.deepStatus === 'suboptimal') score += 14
  else score += 6

  // 4. REM Sleep (Cognitive / Motor Learning)
  if (stageEval.remStatus === 'optimal') score += 15
  else if (stageEval.remStatus === 'suboptimal') score += 10
  else score += 4

  // 5. Autonomic HRV Alignment
  if (autonomicStatus === 'prime_adaptation') score += 15
  else if (autonomicStatus === 'balanced_optimal') score += 12
  else if (autonomicStatus === 'moderate_sympathetic_strain') score += 6
  else score += 2

  // Temperature / Disruption bonus/penalties
  if (record.skinTempDeviationCelsius && record.skinTempDeviationCelsius > 0.6) {
    score = Math.max(10, score - 6) // Elevated temperature indicates immune activation or thermal stress
  }
  if (record.awakeningsCount && record.awakeningsCount > 4) {
    score = Math.max(10, score - 4)
  }

  score = Math.min(100, Math.max(10, Math.round(score)))

  let qualityTier: SleepQualityTier = 'optimal'
  if (score >= 88) qualityTier = 'elite'
  else if (score >= 75) qualityTier = 'optimal'
  else if (score >= 60) qualityTier = 'compromised'
  else qualityTier = 'critical'

  // Training Capacity & Clinical Recommendations
  let trainingCapacityStatus = 'Normal Progressive Overload'
  let clinicalGuidance = 'Autonomic nervous system is balanced. Standard progressive resistance training recommended.'
  const recoveryKeyActions: string[] = []

  switch (autonomicStatus) {
    case 'prime_adaptation':
      trainingCapacityStatus = 'High Adaptation Capacity (CNS Primed)'
      clinicalGuidance = `Optimal sleep architecture (${stageEval.deepPercent}% Deep, ${stageEval.remPercent}% REM) with nocturnal HRV +${Math.round((hrvRatio - 1) * 100)}% above baseline. CNS is primed for maximal neuromuscular overload or PR attempts.`
      recoveryKeyActions.push('Execute scheduled heavy resistance training or high-intensity intervals.')
      recoveryKeyActions.push('Ensure post-workout protein (30-40g) and electrolyte replenishment.')
      break

    case 'balanced_optimal':
      trainingCapacityStatus = 'Standard Adaptation Capacity'
      clinicalGuidance = `Sleep duration (${totalSleep.toFixed(1)} hrs) and autonomic balance are in target equilibrium. Proceed with scheduled training volume.`
      recoveryKeyActions.push('Maintain current pre-sleep wind-down cadence and ambient temperature (65-68°F).')
      recoveryKeyActions.push('Hydrate with 500mL water + mineral pinch upon waking.')
      break

    case 'moderate_sympathetic_strain':
      trainingCapacityStatus = 'Autoregulated Load (Volume Hold)'
      clinicalGuidance = `Elevated nocturnal strain detected (HRV ${Math.round(hrvRatio * 100)}% of baseline, RHR dip ${dipEval.dipPercent}%). Hold working weights at current levels and maintain 2+ reps in reserve (RIR).`
      recoveryKeyActions.push('Cap training RPE at 7.5; avoid training to muscular failure.')
      recoveryKeyActions.push('Prioritize 10-15 minutes of post-workout parasympathetic breathwork (4-7-8 pacing).')
      recoveryKeyActions.push('Ensure last calorie intake is at least 2.5 hours before bedtime tonight.')
      break

    case 'severe_fatigue_deficit':
      trainingCapacityStatus = 'Restorative Regeneration / Deload'
      clinicalGuidance = `Significant autonomic deficit (Sleep Score: ${score}/100, HRV -${Math.round((1 - hrvRatio) * 100)}% vs baseline). Switch today to active recovery, mobility, or Zone 2 recovery flush.`
      recoveryKeyActions.push('Shift session to NASM Phase 1 Stabilization or 20-min Zone 2 mobility flow.')
      recoveryKeyActions.push('Target 60-90 min sleep extension tonight with magnesium glycinate support.')
      recoveryKeyActions.push('Avoid high-dose caffeine after 12:00 PM.')
      break
  }

  return {
    overallSleepScore: score,
    sleepQualityTier: qualityTier,
    sleepEfficiencyPercent: efficiency,
    deepSleepPercent: stageEval.deepPercent,
    remSleepPercent: stageEval.remPercent,
    lightSleepPercent: stageEval.lightPercent,
    awakePercent: stageEval.awakePercent,
    deepSleepStatus: stageEval.deepStatus,
    remSleepStatus: stageEval.remStatus,
    nocturnalRhrDipPercent: dipEval.dipPercent,
    rhrDipClassification: dipEval.classification,
    hrvRatioToBaseline: hrvRatio,
    autonomicRecoveryStatus: autonomicStatus,
    trainingCapacityStatus,
    clinicalGuidance,
    recoveryKeyActions,
  }
}
