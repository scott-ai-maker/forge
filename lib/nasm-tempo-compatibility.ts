/**
 * Forge Athletic — NASM OPT™ Tempo Compatibility & Exclusion Engine
 * 
 * Formalizes biomechanical and neurophysiological rules for exercise tempos across all 5 NASM OPT phases.
 * Specifically prevents contraindicated, mechanically incompatible, or nonsensical tempo assignments
 * (e.g. assigning 4/2/1 or 12 reps to a Plank, assigning 4/2/1 to a Box Jump destroying the Stretch-Shortening Cycle,
 * or forcing a 4s eccentric + 2s bottom hover on a Kettlebell Swing or Floor Deadlift).
 */

export type TempoExerciseCategory =
  | 'smr_flexibility'
  | 'isometric_core_hold'
  | 'plyometric'
  | 'ballistic_olympic'
  | 'floor_compound_deadlift'
  | 'saq_cardio'
  | 'rapid_alternating_core'
  | 'dynamic_resistance'

export interface TempoExclusionRule {
  category: TempoExerciseCategory
  label: string
  excludedTempos: string[]
  biomechanicalRationale: string
  recommendedPrescription: (phase: number, exerciseName?: string) => { tempo: string; reps?: string; rest?: string }
}

export const NASM_TEMPO_RULES: Record<TempoExerciseCategory, TempoExclusionRule> = {
  smr_flexibility: {
    category: 'smr_flexibility',
    label: 'SMR & Static/Active Flexibility',
    excludedTempos: ['4/2/1', '4:2:1', '2/0/2', '1/1/1', 'X/0/X'],
    biomechanicalRationale:
      'Governed by autogenic/reciprocal inhibition neurophysiology (stimulating Golgi Tendon Organs via sustained compression). Repetition cadences destroy sustained tissue relaxation.',
    recommendedPrescription: (_phase, exerciseName = '') => {
      const lower = exerciseName.toLowerCase()
      if (lower.includes('foam roll') || lower.includes('smr') || lower.includes('roller')) {
        return { tempo: 'Hold 30-60s on tender spots', reps: '1-2 areas', rest: '0-30s' }
      }
      if (lower.includes('active')) {
        return { tempo: 'Hold 1-2s', reps: '5-10 reps', rest: '0s' }
      }
      return { tempo: 'Hold 30s', reps: '1-2 sets', rest: '0s' }
    },
  },

  isometric_core_hold: {
    category: 'isometric_core_hold',
    label: 'Static Core & Isometric Postures',
    excludedTempos: ['4/2/1', '4:2:1', '2/0/2', '1/1/1', 'X/0/X'],
    biomechanicalRationale:
      'Pure static isometric stabilization with zero eccentric or concentric muscle action spectrum. Assigning dynamic repetition tempos or 12-15 reps to a static plank is biomechanically invalid.',
    recommendedPrescription: () => ({
      tempo: 'Hold 30-60s',
      reps: '30-60s hold',
      rest: '0-60s',
    }),
  },

  plyometric: {
    category: 'plyometric',
    label: 'Plyometric & Reactive Power',
    excludedTempos: ['4/2/1', '4:2:1', '2/0/2'],
    biomechanicalRationale:
      'Relies on the Stretch-Shortening Cycle (SSC). An amortization pause > 150ms dissipates stored elastic potential energy in titin and collagen into heat, destroying reactive power.',
    recommendedPrescription: (phase) => {
      if (phase === 1) {
        // NASM Tier 1: Plyometric Stabilization
        return { tempo: 'Explosive -> 3-5s landing freeze', reps: '5-8', rest: '90s' }
      }
      if (phase === 5) {
        // NASM Tier 3: Plyometric Power
        return { tempo: 'X/0/X (<150ms amortization)', reps: '8-10', rest: '1-2 min' }
      }
      // NASM Tier 2: Plyometric Strength (Phases 2-4)
      return { tempo: 'Continuous repeat jumps', reps: '8-10', rest: '60s' }
    },
  },

  ballistic_olympic: {
    category: 'ballistic_olympic',
    label: 'Ballistic & Olympic Triple Extension',
    excludedTempos: ['4/2/1', '4:2:1'],
    biomechanicalRationale:
      'Momentum-driven triple extension exercises cannot be performed with prolonged eccentric deceleration or bottom isometric pauses without severe lumbar shear and kinetic chain collapse.',
    recommendedPrescription: (phase) => {
      if (phase === 4 || phase === 5) {
        return { tempo: 'Explosive / 1/0/X', reps: '1-5', rest: '1-2 min' }
      }
      return { tempo: 'Explosive / 1/0/X', reps: '8-12', rest: '60-90s' }
    },
  },

  floor_compound_deadlift: {
    category: 'floor_compound_deadlift',
    label: 'Floor-Start Compound Deadlifts',
    excludedTempos: ['4/2/1', '4:2:1'],
    biomechanicalRationale:
      'Conventional and sumo deadlifts begin concentrically from a dead stop on the floor. Lowering for 4s into a 2s floating hover near the floor generates dangerous shear on the lumbar spine.',
    recommendedPrescription: (phase) => {
      if (phase === 4) {
        return { tempo: '2/0/2', reps: '3-5', rest: '2-3 min' }
      }
      return { tempo: '2/0/2', reps: '8-12', rest: '60-90s' }
    },
  },

  saq_cardio: {
    category: 'saq_cardio',
    label: 'Speed, Agility, Quickness (SAQ) & Cardio',
    excludedTempos: ['4/2/1', '4:2:1', '2/0/2', '1/1/1'],
    biomechanicalRationale:
      'Locomotion and agility drills are governed by foot speed, ground contact time, and metabolic heart rate zones rather than rep tempos.',
    recommendedPrescription: () => ({
      tempo: 'Max Velocity / Rapid Recoil',
      reps: '3-5 drills',
      rest: '60-90s',
    }),
  },

  rapid_alternating_core: {
    category: 'rapid_alternating_core',
    label: 'Rapid Dynamic Core Conditioning',
    excludedTempos: ['4/2/1', '4:2:1'],
    biomechanicalRationale:
      'High-cadence core conditioning movements (e.g. mountain climbers, bicycle crunches) become rhythmically discordant at 4/2/1 unless explicitly prescribed as isolated holds.',
    recommendedPrescription: () => ({
      tempo: 'Controlled / 1/1/1',
      reps: '15-20 per side',
      rest: '0-60s',
    }),
  },

  dynamic_resistance: {
    category: 'dynamic_resistance',
    label: 'Standard Dynamic Resistance',
    excludedTempos: [],
    biomechanicalRationale:
      'Standard multi-joint and single-joint isotonic resistance exercises follow classical NASM OPT phase tempos.',
    recommendedPrescription: (phase, exerciseName = '') => {
      const lower = exerciseName.toLowerCase()
      switch (phase) {
        case 1:
          return { tempo: '4/2/1', reps: '12-15', rest: '0-60s' }
        case 2: {
          const isStab =
            lower.includes('ball') ||
            lower.includes('single-leg') ||
            lower.includes('bosu') ||
            lower.includes('standing cable')
          return {
            tempo: isStab ? '4/2/1' : '2/0/2',
            reps: '8-12',
            rest: '0-60s',
          }
        }
        case 3:
          return { tempo: '2/0/2', reps: '8-12', rest: '45-60s' }
        case 4:
          return { tempo: '2/0/2', reps: '3-5', rest: '2-3 min' }
        case 5:
          return { tempo: '2/0/2', reps: '1-5', rest: '1-2 min' }
        default:
          return { tempo: '2/0/2', reps: '8-12', rest: '60s' }
      }
    },
  },
}

/**
 * Classifies an exercise into its functional biomechanical tempo category.
 */
export function classifyExerciseTempoCategory(
  exerciseName: string,
  block?: string
): TempoExerciseCategory {
  const name = exerciseName.toLowerCase().trim()
  const b = block ? block.toLowerCase().trim() : ''

  // 1. SMR & Flexibility
  const isStretch = name.includes('stretch') && !name.includes('stretch band') && !name.includes('stretch cord')
  if (
    name.includes('foam roll') ||
    name.includes('smr') ||
    name.includes('roller') ||
    name.includes('lacrosse ball') ||
    name.includes('active-isolated') ||
    isStretch
  ) {
    return 'smr_flexibility'
  }

  // 2. Plyometric & Reactive Power (evaluated before isometric hold so jump holds are treated as plyometrics)
  if (
    name.includes('jump') ||
    name.includes('hop') ||
    name.includes('bound') ||
    name.includes('slam') ||
    name.includes('burpee') ||
    name.includes('skater') ||
    name.includes('power step-up') ||
    b === 'plyometric'
  ) {
    return 'plyometric'
  }

  // 3. Ballistic & Olympic Triple Extension
  if (
    name.includes('kettlebell swing') ||
    name.includes('kb swing') ||
    name.includes('clean') ||
    name.includes('snatch') ||
    name.includes('jerk') ||
    name.includes('push press') ||
    name.includes('high pull')
  ) {
    return 'ballistic_olympic'
  }

  // 4. Static Core & Isometric Postures
  if (
    name.includes('plank') ||
    name.includes('wall sit') ||
    name.includes('hollow body') ||
    name.includes('hollow hold') ||
    name.includes('bird dog hold') ||
    name.includes('prone iso-abs') ||
    name.includes('dead bug hold') ||
    name.includes('pallof hold') ||
    name.includes('prone cobra hold') ||
    name.endsWith(' hold') ||
    name.endsWith(' freeze')
  ) {
    return 'isometric_core_hold'
  }

  // 5. Floor-Start Compound Deadlift (Explicitly exclude Romanian Deadlifts / RDLs which work well at 4/2/1)
  const isDeadlift = name.includes('deadlift')
  const isRomanianOrRdl = name.includes('romanian') || name.includes('rdl') || name.includes('straight-leg')
  if (isDeadlift && !isRomanianOrRdl) {
    return 'floor_compound_deadlift'
  }

  // 6. Speed, Agility, Quickness (SAQ) & Cardio
  if (
    name.includes('ladder') ||
    name.includes('cone') ||
    name.includes('shuttle') ||
    name.includes('carioca') ||
    name.includes('a-skip') ||
    name.includes('b-skip') ||
    name.includes('treadmill') ||
    name.includes('rower') ||
    name.includes('assault bike') ||
    b === 'saq'
  ) {
    return 'saq_cardio'
  }

  // 7. Rapid Dynamic Core Conditioning
  if (
    name.includes('mountain climber') ||
    name.includes('bicycle crunch') ||
    name.includes('flutter kick') ||
    name.includes('scissor kick')
  ) {
    return 'rapid_alternating_core'
  }

  // 8. Default: Standard dynamic resistance exercise
  return 'dynamic_resistance'
}

/**
 * Checks whether an exercise is excluded from a proposed tempo.
 */
export function isExerciseExcludedFromTempo(
  exerciseName: string,
  proposedTempo: string,
  block?: string
): { isExcluded: boolean; category: TempoExerciseCategory; reason?: string } {
  const category = classifyExerciseTempoCategory(exerciseName, block)
  const rule = NASM_TEMPO_RULES[category]
  const normalizedTempo = proposedTempo.replace(/:/g, '/').trim()

  const isExcluded = rule.excludedTempos.some(
    t => t.replace(/:/g, '/').toLowerCase() === normalizedTempo.toLowerCase()
  )

  if (isExcluded) {
    return {
      isExcluded: true,
      category,
      reason: `${rule.label} is incompatible with '${proposedTempo}' tempo. ${rule.biomechanicalRationale}`,
    }
  }

  return { isExcluded: false, category }
}

/**
 * Resolves the physiologically optimal tempo, reps, and rest for an exercise
 * in a given NASM OPT phase, repairing invalid or contraindicated tempos.
 */
export function resolveAppropriateTempoAndVolume(
  exercise: {
    name: string
    block?: string
    tempo?: string
    reps?: string
    rest?: string
  },
  targetPhase: number,
  repairs?: string[]
): { tempo: string; reps: string; rest: string } {
  const category = classifyExerciseTempoCategory(exercise.name, exercise.block)
  const rule = NASM_TEMPO_RULES[category]
  const currentTempo = (exercise.tempo || '').trim()

  // 1. Check if current tempo violates exclusions
  const exclusionCheck = isExerciseExcludedFromTempo(exercise.name, currentTempo, exercise.block)
  const recommended = rule.recommendedPrescription(targetPhase, exercise.name)

  let finalTempo = currentTempo
  let finalReps = (exercise.reps || '').trim()
  let finalRest = (exercise.rest || '').trim()

  if (!currentTempo || exclusionCheck.isExcluded) {
    finalTempo = recommended.tempo
    if (repairs) {
      repairs.push(
        `Auto-repaired tempo for '${exercise.name}' from '${currentTempo || 'unspecified'}' to '${finalTempo}' (${rule.label} rule: ${rule.biomechanicalRationale})`
      )
    }
  }

  // 2. Normalize Reps and Rest for Special Categories
  if (category === 'isometric_core_hold') {
    // If reps is numeric (e.g. '12-15' or '15 reps'), normalize to duration hold
    const numericReps = parseInt(finalReps, 10)
    if (!isNaN(numericReps) && !finalReps.includes('s') && !finalReps.includes('sec')) {
      const repairedReps = '30-60s hold'
      if (repairs) {
        repairs.push(`Auto-repaired reps for static hold '${exercise.name}' from '${finalReps}' to '${repairedReps}'`)
      }
      finalReps = repairedReps
    }
    if (!finalRest) finalRest = '0-60s'
  } else if (category === 'smr_flexibility') {
    if (!finalReps || !finalReps.includes('s')) {
      finalReps = recommended.reps || '30s hold'
    }
    if (!finalRest) finalRest = '0s'
  } else if (category === 'plyometric') {
    if (!finalRest || parseInt(finalRest, 10) < 60) {
      finalRest = recommended.rest || '60-90s'
    }
    // If Phase 1, ensure reps are within 5-8 stabilization boundary
    if (targetPhase === 1) {
      const numReps = parseInt(finalReps, 10)
      if (isNaN(numReps) || numReps > 8 || numReps < 5) {
        if (repairs) {
          repairs.push(`Auto-repaired Phase 1 plyometric reps for '${exercise.name}' from '${finalReps}' to '5-8'`)
        }
        finalReps = '5-8'
      }
    } else if (targetPhase === 5) {
      const numReps = parseInt(finalReps, 10)
      if (isNaN(numReps) || numReps < 6 || numReps > 12) {
        if (repairs) {
          repairs.push(`Auto-repaired Phase 5 plyometric reps for '${exercise.name}' from '${finalReps}' to '8-10'`)
        }
        finalReps = '8-10'
      }
    }
  } else if (category === 'ballistic_olympic') {
    if (!finalRest || parseInt(finalRest, 10) < 60) {
      finalRest = '60-90s'
    }
  } else if (category === 'floor_compound_deadlift') {
    if (!finalRest) finalRest = targetPhase === 4 ? '2-3 min' : '60-90s'
  }

  // Default rest fallback if still empty
  if (!finalRest) {
    finalRest = targetPhase === 4 ? '2-3 min' : '0-60s'
  }

  return {
    tempo: finalTempo,
    reps: finalReps || (recommended.reps || '8-12'),
    rest: finalRest,
  }
}
