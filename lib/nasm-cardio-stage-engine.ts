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
  hasHeartMedications?: boolean
  isMedicationSuppressed?: boolean
  clinicalGuidance?: string
  intensityGuidance?: string
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
 * Calculates Tanaka HRmax (208 - 0.7 * age) and official NASM 3-Zone Heart Rates (%HRmax method).
 * Standard NASM CPT-7 percentages:
 * - Zone 1: 65% - 75% HRmax (Aerobic Base / Below VT1)
 * - Zone 2: 76% - 85% HRmax (Lactate Threshold / VT1 to VT2)
 * - Zone 3: 86% - 95% HRmax (Anaerobic Power / Peak Intervals)
 * 
 * Pharmacological Safety: If the athlete is prescribed beta-blockers or antihypertensive heart medications,
 * age-predicted formulas (Tanaka/Karvonen) are pharmacologically invalidated due to blunted adrenergic response.
 * In this scenario, isMedicationSuppressed is set to true and cardiovascular intensity must strictly be
 * monitored via the Rating of Perceived Exertion (RPE / Borg scale) and the Talk Test.
 */
export function calculateCardioZones(
  age: number,
  restingHr: number = 65,
  hasHeartMedications: boolean = false
): CardioZoneMetrics {
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

  const clinicalGuidance = hasHeartMedications
    ? '⚠️ Pharmacological Heart Rate Alert: Client is prescribed cardiac or hypertension medications (e.g. beta-blockers) that blunt autonomic heart rate response. Age-predicted heart rate formulas (Tanaka/Karvonen) are pharmacologically invalidated. Do NOT use BPM targets to gauge cardiorespiratory intensity. Strictly monitor intensity using RPE (Borg 1-10) and the Talk Test.'
    : undefined

  const intensityGuidance = hasHeartMedications
    ? 'Primary Intensity Governor: RPE and Talk Test. Heart rate numbers are provided for observational reference only and will underestimate physical exertion.'
    : 'Primary Intensity Governor: %HRmax Target Zones combined with RPE & Talk Test validation.'

  return {
    hrMaxBpm: hrMax,
    restingHrBpm: safeRestingHr,
    hrReserveBpm: hrr,
    hasHeartMedications,
    isMedicationSuppressed: hasHeartMedications,
    clinicalGuidance,
    intensityGuidance,
    zone1: {
      name: 'Zone 1: Aerobic Base & Recovery',
      code: 'zone1',
      minBpm: z1Min,
      maxBpm: z1Max,
      pctRange: '65% - 75% HRmax',
      intensity: hasHeartMedications ? 'Moderate / Aerobic Base (Governed by RPE 3-4)' : 'Moderate / Aerobic Base',
      rpeScale: 'RPE 3 - 4 / 10',
      talkTest: 'Below VT1: Continuous conversation is easy, natural, and unbroken.',
      optPhase: 'Phase 1: Stabilization Endurance',
      bioenergeticFocus: 'Oxidative phosphorylation, lipid oxidation, mitochondrial biogenesis.',
    },
    zone2: {
      name: 'Zone 2: Aerobic Threshold / VT1 Intervals',
      code: 'zone2',
      minBpm: z2Min,
      maxBpm: z2Max,
      pctRange: '76% - 85% HRmax',
      intensity: hasHeartMedications ? 'Challenging / Lactate Inflection (Governed by RPE 5-6)' : 'Challenging / Lactate Inflection',
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
      intensity: hasHeartMedications ? 'Maximal / Anaerobic Peak (Caution: Physician clearance required)' : 'Maximal / Anaerobic Peak',
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
export function identifyHeartRateZone(
  bpm: number,
  age: number,
  restingHr: number = 65,
  hasHeartMedications: boolean = false
): {
  zoneCode: 'below_zone1' | 'zone1' | 'zone2' | 'zone3' | 'above_zone3'
  zoneName: string
  color: string
  description: string
  isMedicationSuppressed?: boolean
} {
  const zones = calculateCardioZones(age, restingHr, hasHeartMedications)
  const medPrefix = hasHeartMedications
    ? '⚠️ [Medication Alert: Heart rate blunted] '
    : ''

  if (bpm < zones.zone1.minBpm) {
    return {
      zoneCode: 'below_zone1',
      zoneName: 'Active Recovery / Below Zone 1',
      color: '#94A3B8',
      description: `${medPrefix}Light active recovery (${bpm} BPM < ${zones.zone1.minBpm} BPM). Suitable for cool-downs and warm-ups.${hasHeartMedications ? ' Validate with RPE 1-2.' : ''}`,
      isMedicationSuppressed: hasHeartMedications,
    }
  }
  if (bpm <= zones.zone1.maxBpm) {
    return {
      zoneCode: 'zone1',
      zoneName: 'Zone 1: Aerobic Base',
      color: '#10B981',
      description: `${medPrefix}Aerobic endurance base (${bpm} BPM). Optimal for lipid mobilization and baseline mitochondrial conditioning.${hasHeartMedications ? ' Target RPE 3-4.' : ''}`,
      isMedicationSuppressed: hasHeartMedications,
    }
  }
  if (bpm <= zones.zone2.maxBpm) {
    return {
      zoneCode: 'zone2',
      zoneName: 'Zone 2: Lactate Threshold (VT1)',
      color: '#F59E0B',
      description: `${medPrefix}Aerobic threshold (${bpm} BPM). Increases lactate threshold and cardiorespiratory buffering capacity.${hasHeartMedications ? ' Target RPE 5-6.' : ''}`,
      isMedicationSuppressed: hasHeartMedications,
    }
  }
  if (bpm <= zones.zone3.maxBpm) {
    return {
      zoneCode: 'zone3',
      zoneName: 'Zone 3: Anaerobic Peak (VT2)',
      color: '#EF4444',
      description: `${medPrefix}Peak high-intensity interval (${bpm} BPM). Maximizes VO2 peak and cardiac stroke volume.${hasHeartMedications ? ' Caution: Verify physician clearance; target RPE 7-8.' : ''}`,
      isMedicationSuppressed: hasHeartMedications,
    }
  }
  return {
    zoneCode: 'above_zone3',
    zoneName: 'Supramaximal Zone (>95% HRmax)',
    color: '#EC4899',
    description: `${medPrefix}Supramaximal effort (${bpm} BPM > ${zones.zone3.maxBpm} BPM). Limit to very short explosive bursts (<15s).`,
    isMedicationSuppressed: hasHeartMedications,
  }
}

/**
 * Generates NASM Stage 1, 2, or 3 Conditioning Workouts
 */
export function generateStageWorkout(
  stage: 1 | 2 | 3,
  age: number = 35,
  restingHr: number = 65,
  hasHeartMedications: boolean = false
): StageConditioningWorkout {
  const zones = calculateCardioZones(age, restingHr, hasHeartMedications)

  if (stage === 1) {
    return {
      stage: 1,
      title: 'Stage 1: Aerobic Base Development',
      subtitle: hasHeartMedications
        ? 'Continuous steady-state conditioning (RPE & Talk-Test Governed / Beta-Blocker Safe)'
        : 'Continuous steady-state conditioning for mitochondrial density & recovery',
      targetOptPhase: 'Phase 1: Stabilization Endurance',
      targetRpe: 'RPE 3 - 4 (Moderate Aerobic)',
      durationMins: 30,
      workRestRatio: 'Continuous Steady State',
      warmup: hasHeartMedications
        ? `5-10 mins very light warm-up at RPE 2 (gradual transition to prevent orthostatic pressure drops)`
        : `5-10 mins in light recovery (<${zones.zone1.minBpm} BPM)`,
      mainConditioning: hasHeartMedications
        ? `20-30 mins continuous steady state guided strictly by RPE 3-4 and the Talk Test. (Observed target reference: ~${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM).`
        : `20-30 mins continuous steady state in Zone 1 (${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM).`,
      cooldown: `5-10 mins gradual cooldown dropping to RPE 1-2 followed by SMR foam rolling. Gradual cooldown prevents venous blood pooling.`,
      coachingCues: hasHeartMedications
        ? [
            '🛡️ Medication Guidance: Heart rate response is suppressed by medication. Strictly rely on RPE 3-4 and the Talk Test.',
            'Maintain a pace where you can comfortably speak in complete, unbroken sentences without gasping.',
            'Never abruptly stop moving; perform a gradual 5-minute cool-down to prevent post-exercise hypotension.',
          ]
        : [
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
      subtitle: hasHeartMedications
        ? '1:3 interval training governed by RPE 5-6 (Talk-Test Inflection / Cardiac Safe)'
        : '1:3 and 1:2 interval training to elevate anaerobic threshold & lactate tolerance',
      targetOptPhase: 'Phase 2 & 3: Strength Endurance / Hypertrophy',
      targetRpe: hasHeartMedications ? 'RPE 5 - 6 (Challenging Threshold Pace)' : 'RPE 5 - 7 (Challenging to Hard)',
      durationMins: 35,
      workRestRatio: '1:3 Work-to-Rest (Progress to 1:2)',
      warmup: hasHeartMedications
        ? `5-10 mins gradual aerobic warm-up at RPE 3`
        : `5-10 mins in Zone 1 (${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM)`,
      mainConditioning: hasHeartMedications
        ? `6-8 rounds: 1 min at RPE 5-6 (VT1 inflection: talking requires effort) followed by 3 mins active recovery at RPE 3. Do not push past RPE 6.`
        : `6-8 rounds: 1 min in Zone 2 (${zones.zone2.minBpm} - ${zones.zone2.maxBpm} BPM) followed by 3 mins active recovery in Zone 1 (${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM).`,
      cooldown: `5-10 mins light cooldown dropping to RPE 1-2 + static stretching.`,
      coachingCues: hasHeartMedications
        ? [
            '🛡️ Medication Guidance: Do NOT chase heart rate numbers — beta-blockers/antihypertensives blunt maximum cardiac output.',
            'During the 1-minute interval, push until speech is broken into short phrases (RPE 5-6).',
            'During recovery, allow breathing to fully return to comfortable conversational baseline (RPE 3) before next round.',
            'Strictly avoid Valsalva breath-holding to prevent intra-thoracic blood pressure spikes.',
          ]
        : [
            'During the 1-minute work interval, push intensity until speech becomes challenging and broken into short phrases.',
            'During the 3-minute recovery, actively focus on bringing heart rate back down into Zone 1 before starting the next round.',
            'As fitness improves, progress interval ratio to 1:2 (1 min Zone 2 ↔ 2 mins Zone 1).',
          ],
    }
  }

  return {
    stage: 3,
    title: 'Stage 3: Anaerobic Power & VO2 Max HIIT',
    subtitle: hasHeartMedications
      ? 'High-intensity intervals (Requires Physician Clearance / Strict RPE 7-8 Monitoring)'
      : 'High-intensity anaerobic intervals for peak aerobic power and metabolic rate',
    targetOptPhase: 'Phase 4 & 5: Maximal Strength / Power',
    targetRpe: hasHeartMedications ? 'RPE 7 - 8 (Controlled Hard — Physician Clearance Required)' : 'RPE 7 - 9 (Very Hard to Maximal)',
    durationMins: 30,
    workRestRatio: '1:3 Work-to-Recovery (Peak Sprints)',
    warmup: hasHeartMedications
      ? `10 mins thorough progressive warmup moving from RPE 2 to RPE 4`
      : `10 mins progressive warmup moving from Zone 1 to Zone 2 (${zones.zone1.minBpm} - ${zones.zone2.maxBpm} BPM)`,
    mainConditioning: hasHeartMedications
      ? `4-5 rounds: 30s controlled hard push at RPE 7-8 followed by 3 mins full active recovery at RPE 2-3. (Physician clearance mandatory).`
      : `5-6 rounds: 30-45s maximal effort in Zone 3 (${zones.zone3.minBpm} - ${zones.zone3.maxBpm} BPM) followed by 2-3 mins full active recovery in Zone 1 (${zones.zone1.minBpm} - ${zones.zone1.maxBpm} BPM).`,
    cooldown: `5-10 mins Zone 1 / RPE 2 walk followed by SMR myofascial release.`,
    coachingCues: hasHeartMedications
      ? [
            '🛡️ Clinical Prerequisite: Stage 3 high-intensity intervals require explicit physician clearance when taking cardiac medications.',
            'Intensity is governed strictly by RPE 7-8 and Talk Test — do NOT attempt to reach calculated Zone 3 BPM.',
            'Immediately terminate the session if experiencing lightheadedness, chest tightness, or irregular heartbeats.',
          ]
      : [
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
  hasHeartMedications?: boolean
}): RockportWalkResult {
  const { weightLbs, age, sex, timeMinutes, endHeartRateBpm, hasHeartMedications = false } = params
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

  const description = hasHeartMedications
    ? `Estimated VO2max: ${roundedVo2} mL/kg/min (${fitnessCategory} capacity for age ${age}). ⚠️ Pharmacological Heart Rate Alert: Client is taking cardiac/blood pressure medication (e.g. beta-blockers) that blunts heart rate response. Heart-rate-dependent VO2max formulas overestimate actual cardiorespiratory capacity. Use strictly as a relative baseline trend; govern all exercise intensity using RPE (1-10) and the Talk Test.`
    : `Estimated VO2max: ${roundedVo2} mL/kg/min (${fitnessCategory} cardiorespiratory capacity for age ${age}).`

  return {
    vo2Max: roundedVo2,
    fitnessCategory,
    description,
  }
}

/**
 * Evaluates YMCA 3-Minute Step Test 1-minute recovery heart rate.
 * 
 * Pharmacological Safety: If taking beta-blockers or cardiac medications, recovery heart rate is
 * artificially low and fitness will be falsely overestimated. Suggested starting stage is forced to Stage 1.
 */
export function evaluateYmcaStepTest(
  postTestRecoveryHr: number,
  age: number,
  sex: 'male' | 'female' | 'other',
  hasHeartMedications: boolean = false
): YmcaStepResult {
  const isMale = sex !== 'female'

  if (hasHeartMedications) {
    return {
      postTestRecoveryHr,
      fitnessRating: 'Average',
      suggestedStartingStage: 1,
      rationale:
        '⚠️ Pharmacological Heart Rate Alert: Client is prescribed beta-blockers or cardiac medications which artificially suppress post-exercise recovery heart rate. Do NOT assume high aerobic capacity based on recovery pulse alone. Begin strictly in Stage 1 with RPE 3-4 and the Talk Test until cardiorespiratory baseline is established.',
    }
  }

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
