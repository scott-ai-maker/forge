/**
 * NASM Cardiorespiratory Stage Training & Bioenergetic Zone Engine
 * 
 * Based on NASM CPT-7:
 * - Chapter 6: The Cardiorespiratory System
 * - Chapter 8: Cardiorespiratory Training Concepts (Stage 1, 2, 3, 4 Training)
 * - Chapter 15: Cardiorespiratory Assessments & Conditioning (YMCA 3-Min Step Test, Rockport Walk Test, VT1/VT2)
 */

export interface CardioZoneMetrics {
  hrMaxBpm: number
  restingHrBpm: number
  hrReserveBpm: number
  zone1: {
    name: string
    code: 'zone1'
    minBpm: number
    maxBpm: number
    pctRange: string
    intensity: string
    rpeScale: string
    talkTest: string
    optPhase: string
    bioenergeticFocus: string
  }
  zone2: {
    name: string
    code: 'zone2'
    minBpm: number
    maxBpm: number
    pctRange: string
    intensity: string
    rpeScale: string
    talkTest: string
    optPhase: string
    bioenergeticFocus: string
  }
  zone3: {
    name: string
    code: 'zone3'
    minBpm: number
    maxBpm: number
    pctRange: string
    intensity: string
    rpeScale: string
    talkTest: string
    optPhase: string
    bioenergeticFocus: string
  }
}

export interface StageConditioningWorkout {
  stage: 1 | 2 | 3
  title: string
  subtitle: string
  targetOptPhase: string
  targetRpe: string
  durationMins: number
  workRestRatio: string
  warmup: string
  mainConditioning: string
  cooldown: string
  coachingCues: string[]
}

export interface RockportWalkResult {
  vo2Max: number
  fitnessCategory: 'Very Poor' | 'Poor' | 'Fair' | 'Good' | 'Excellent' | 'Superior'
  description: string
}

export interface YmcaStepResult {
  postTestRecoveryHr: number
  fitnessRating: 'Excellent' | 'Good' | 'Above Average' | 'Average' | 'Below Average' | 'Poor' | 'Very Poor'
  suggestedStartingStage: 1 | 2 | 3
  rationale: string
}

/**
 * Calculates Tanaka HRmax (208 - 0.7 * age) and official NASM 3-Zone Heart Rates (%HRmax method)
 * Standard NASM CPT-7 percentages:
 * - Zone 1: 65% - 75% HRmax (Aerobic Base / Below VT1)
 * - Zone 2: 76% - 85% HRmax (Lactate Threshold / VT1 to VT2)
 * - Zone 3: 86% - 95% HRmax (Anaerobic Power / Peak Intervals)
 */
export function calculateCardioZones(age: number, restingHr: number = 65): CardioZoneMetrics {
  const safeAge = Math.max(16, Math.min(95, age))
  const hrMax = Math.round(208 - 0.7 * safeAge)
  const safeRestingHr = Math.max(35, Math.min(120, restingHr))
  const hrr = Math.max(40, hrMax - safeRestingHr)

  // NASM standard %HRmax formula
  const z1Min = Math.round(hrMax * 0.65)
  const z1Max = Math.round(hrMax * 0.75)

  const z2Min = Math.round(hrMax * 0.76)
  const z2Max = Math.round(hrMax * 0.85)

  const z3Min = Math.round(hrMax * 0.86)
  const z3Max = Math.round(hrMax * 0.95)

  return {
    hrMaxBpm: hrMax,
    restingHrBpm: safeRestingHr,
    hrReserveBpm: hrr,
    zone1: {
      name: 'Zone 1: Aerobic Base & Recovery',
      code: 'zone1',
      minBpm: z1Min,
      maxBpm: z1Max,
      pctRange: '65% - 75% HRmax',
      intensity: 'Moderate / Aerobic Base',
      rpeScale: 'RPE 3 - 4 / 10',
      talkTest: 'Below VT1: Continuous conversation is easy and natural.',
      optPhase: 'Phase 1: Stabilization Endurance',
      bioenergeticFocus: 'Oxidative phosphorylation, lipid oxidation, mitochondrial biogenesis.',
    },
    zone2: {
      name: 'Zone 2: Aerobic Threshold / VT1 Intervals',
      code: 'zone2',
      minBpm: z2Min,
      maxBpm: z2Max,
      pctRange: '76% - 85% HRmax',
      intensity: 'Challenging / Lactate Inflection',
      rpeScale: 'RPE 5 - 7 / 10',
      talkTest: 'At / Near VT1: Speech is broken into short phrases; breathing is noticeable.',
      optPhase: 'Phase 2 & 3: Strength Endurance / Hypertrophy',
      bioenergeticFocus: 'Glycolytic & oxidative hybrid, lactate clearance efficiency.',
    },
    zone3: {
      name: 'Zone 3: Anaerobic Power / VT2 Peak HIIT',
      code: 'zone3',
      minBpm: z3Min,
      maxBpm: z3Max,
      pctRange: '86% - 95% HRmax',
      intensity: 'Maximal / Anaerobic Peak',
      rpeScale: 'RPE 7 - 9 / 10',
      talkTest: 'At / Above VT2: Speaking is impossible beyond 1-2 single words.',
      optPhase: 'Phase 4 & 5: Maximal Strength / Power',
      bioenergeticFocus: 'Fast glycolysis and phosphagen regeneration, maximal VO2 stimulation.',
    },
  }
}

/**
 * Identifies the NASM Heart Rate Zone for a given BPM reading
 */
export function identifyHeartRateZone(bpm: number, age: number, restingHr: number = 65): {
  zoneCode: 'below_zone1' | 'zone1' | 'zone2' | 'zone3' | 'above_zone3'
  zoneName: string
  color: string
  description: string
} {
  const zones = calculateCardioZones(age, restingHr)
  if (bpm < zones.zone1.minBpm) {
    return {
      zoneCode: 'below_zone1',
      zoneName: 'Active Recovery / Below Zone 1',
      color: '#94A3B8',
      description: `Light active recovery (${bpm} BPM < ${zones.zone1.minBpm} BPM). Suitable for cool-downs and warm-ups.`,
    }
  }
  if (bpm <= zones.zone1.maxBpm) {
    return {
      zoneCode: 'zone1',
      zoneName: 'Zone 1: Aerobic Base',
      color: '#10B981',
      description: `Aerobic endurance base (${bpm} BPM). Optimal for lipid mobilization and baseline mitochondrial conditioning.`,
    }
  }
  if (bpm <= zones.zone2.maxBpm) {
    return {
      zoneCode: 'zone2',
      zoneName: 'Zone 2: Lactate Threshold (VT1)',
      color: '#F59E0B',
      description: `Aerobic threshold (${bpm} BPM). Increases lactate threshold and cardiorespiratory buffering capacity.`,
    }
  }
  if (bpm <= zones.zone3.maxBpm) {
    return {
      zoneCode: 'zone3',
      zoneName: 'Zone 3: Anaerobic Peak (VT2)',
      color: '#EF4444',
      description: `Peak high-intensity interval (${bpm} BPM). Maximizes VO2 peak and cardiac stroke volume.`,
    }
  }
  return {
    zoneCode: 'above_zone3',
    zoneName: 'Supramaximal Zone (>95% HRmax)',
    color: '#EC4899',
    description: `Supramaximal effort (${bpm} BPM > ${zones.zone3.maxBpm} BPM). Limit to very short explosive bursts (<15s).`,
  }
}

/**
 * Generates NASM Stage 1, 2, or 3 Conditioning Workouts
 */
export function generateStageWorkout(stage: 1 | 2 | 3, age: number = 35, restingHr: number = 65): StageConditioningWorkout {
  const zones = calculateCardioZones(age, restingHr)

  if (stage === 1) {
    return {
      stage: 1,
      title: 'Stage 1: Aerobic Base Development',
      subtitle: 'Continuous steady-state conditioning for mitochondrial density & recovery',
      targetOptPhase: 'Phase 1: Stabilization Endurance',
      targetRpe: 'RPE 3 - 4 (Moderate)',
      durationMins: 30,
      workRestRatio: 'Continuous Steady State',
      warmup: `5-10 mins in light recovery (<${zones.zone1.minBpm} BPM)`,
      mainConditioning: `20-30 mins continuous steady state in Zone 1 (${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM).`,
      cooldown: `5-10 mins gradually dropping below ${zones.zone1.minBpm} BPM followed by SMR foam rolling.`,
      coachingCues: [
        'Maintain a steady pace where you can recite the alphabet or speak in full sentences without gasping.',
        'Focus on diaphragmatic breathing (nasal inhale, controlled oral exhale).',
        'If heart rate exceeds Zone 1 max, reduce speed/incline until HR stabilizes.',
      ],
    }
  }

  if (stage === 2) {
    return {
      stage: 2,
      title: 'Stage 2: Aerobic Threshold / VT1 Interval Protocol',
      subtitle: '1:3 and 1:2 interval training to elevate anaerobic threshold & lactate tolerance',
      targetOptPhase: 'Phase 2 & 3: Strength Endurance / Hypertrophy',
      targetRpe: 'RPE 5 - 7 (Challenging to Hard)',
      durationMins: 35,
      workRestRatio: '1:3 Work-to-Rest (Progress to 1:2)',
      warmup: `5-10 mins in Zone 1 (${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM)`,
      mainConditioning: `6-8 rounds: 1 min in Zone 2 (${zones.zone2.minBpm} - ${zones.zone2.maxBpm} BPM) followed by 3 mins active recovery in Zone 1 (${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM).`,
      cooldown: `5 mins light cooldown dropping below ${zones.zone1.minBpm} BPM + static stretching.`,
      coachingCues: [
        'During the 1-minute work interval, push intensity until speech becomes challenging and broken into short phrases.',
        'During the 3-minute recovery, actively focus on bringing heart rate back down into Zone 1 before starting the next round.',
        'As fitness improves, progress interval ratio to 1:2 (1 min Zone 2 ↔ 2 mins Zone 1).',
      ],
    }
  }

  return {
    stage: 3,
    title: 'Stage 3: Anaerobic Power & VO2 Max HIIT',
    subtitle: 'High-intensity anaerobic intervals for peak aerobic power and metabolic rate',
    targetOptPhase: 'Phase 4 & 5: Maximal Strength / Power',
    targetRpe: 'RPE 7 - 9 (Very Hard to Maximal)',
    durationMins: 30,
    workRestRatio: '1:3 Work-to-Recovery (Peak Sprints)',
    warmup: `10 mins progressive warmup moving from Zone 1 to Zone 2 (${zones.zone1.minBpm} - ${zones.zone2.maxBpm} BPM)`,
    mainConditioning: `5-6 rounds: 30-45s maximal effort in Zone 3 (${zones.zone3.minBpm} - ${zones.zone3.maxBpm} BPM) followed by 2-3 mins full active recovery in Zone 1 (${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM).`,
    cooldown: `5-10 mins Zone 1 spin/walk followed by SMR myofascial release.`,
    coachingCues: [
      'Give maximal explosive effort during the 30-45s sprint interval (Zone 3). Talking should be impossible.',
      'Do NOT begin the next high-intensity interval until heart rate drops fully back into Zone 1.',
      'Limit Stage 3 training to 1-2 sessions per week to prevent autonomic nervous system overtraining.',
    ],
  }
}

/**
 * Computes Rockport 1-Mile Walk Test VO2 Max
 * Formula: 132.853 - (0.0769 * weightLbs) - (0.3877 * age) + (6.315 * genderFactor) - (3.2649 * timeMins) - (0.1565 * finalHr)
 */
export function calculateRockportVo2Max(params: {
  weightLbs: number
  age: number
  sex: 'male' | 'female' | 'other'
  timeMinutes: number
  endHeartRateBpm: number
}): RockportWalkResult {
  const { weightLbs, age, sex, timeMinutes, endHeartRateBpm } = params
  const genderFactor = sex === 'female' ? 0 : 1

  const vo2 =
    132.853 -
    0.0769 * weightLbs -
    0.3877 * age +
    6.315 * genderFactor -
    3.2649 * timeMinutes -
    0.1565 * endHeartRateBpm

  const roundedVo2 = Math.max(10, Math.round(vo2 * 10) / 10)

  let fitnessCategory: RockportWalkResult['fitnessCategory'] = 'Fair'
  if (sex === 'male') {
    if (roundedVo2 < 30) fitnessCategory = 'Poor'
    else if (roundedVo2 < 38) fitnessCategory = 'Fair'
    else if (roundedVo2 < 44) fitnessCategory = 'Good'
    else if (roundedVo2 < 52) fitnessCategory = 'Excellent'
    else fitnessCategory = 'Superior'
  } else {
    if (roundedVo2 < 24) fitnessCategory = 'Poor'
    else if (roundedVo2 < 31) fitnessCategory = 'Fair'
    else if (roundedVo2 < 38) fitnessCategory = 'Good'
    else if (roundedVo2 < 46) fitnessCategory = 'Excellent'
    else fitnessCategory = 'Superior'
  }

  return {
    vo2Max: roundedVo2,
    fitnessCategory,
    description: `Estimated VO2max: ${roundedVo2} mL/kg/min (${fitnessCategory} cardiorespiratory capacity for age ${age}).`,
  }
}

/**
 * Evaluates YMCA 3-Minute Step Test 1-minute recovery heart rate
 */
export function evaluateYmcaStepTest(postTestRecoveryHr: number, age: number, sex: 'male' | 'female' | 'other'): YmcaStepResult {
  const isMale = sex !== 'female'

  let fitnessRating: YmcaStepResult['fitnessRating'] = 'Average'
  let suggestedStartingStage: 1 | 2 | 3 = 1
  let rationale = ''

  if (isMale) {
    if (postTestRecoveryHr < 85) {
      fitnessRating = 'Excellent'
      suggestedStartingStage = 2
      rationale = 'High cardiorespiratory recovery. Client can safely begin Stage 2 interval training.'
    } else if (postTestRecoveryHr < 100) {
      fitnessRating = 'Good'
      suggestedStartingStage = 2
      rationale = 'Solid cardiorespiratory base. Candidate for Stage 1 base conditioning with Stage 2 introductions.'
    } else if (postTestRecoveryHr < 115) {
      fitnessRating = 'Average'
      suggestedStartingStage = 1
      rationale = 'Moderate recovery. Establish 4-6 weeks of Stage 1 Zone 1 base training first.'
    } else {
      fitnessRating = 'Below Average'
      suggestedStartingStage = 1
      rationale = 'Elevated recovery pulse. Prescribe Stage 1 Zone 1 training exclusively to develop aerobic foundations.'
    }
  } else {
    if (postTestRecoveryHr < 90) {
      fitnessRating = 'Excellent'
      suggestedStartingStage = 2
      rationale = 'High cardiorespiratory recovery. Client can safely begin Stage 2 interval training.'
    } else if (postTestRecoveryHr < 105) {
      fitnessRating = 'Good'
      suggestedStartingStage = 2
      rationale = 'Solid cardiorespiratory base. Candidate for Stage 1 base conditioning with Stage 2 introductions.'
    } else if (postTestRecoveryHr < 120) {
      fitnessRating = 'Average'
      suggestedStartingStage = 1
      rationale = 'Moderate recovery. Establish 4-6 weeks of Stage 1 Zone 1 base training first.'
    } else {
      fitnessRating = 'Below Average'
      suggestedStartingStage = 1
      rationale = 'Elevated recovery pulse. Prescribe Stage 1 Zone 1 training exclusively to develop aerobic foundations.'
    }
  }

  return {
    postTestRecoveryHr,
    fitnessRating,
    suggestedStartingStage,
    rationale,
  }
}
