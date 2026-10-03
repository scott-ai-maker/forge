/**
 * @file exercise-logging-helpers.ts
 * @description Specialized domain helpers for NASM OPT™ exercise logging:
 * 1. Timed static hold stretches (timed by duration in seconds, not by reps)
 * 2. Foam rolling / SMR exercises (timed by duration in seconds, not by reps)
 * 3. Resistance band exercises with band color and corresponding weight equivalents
 */

export interface BandResistanceLevel {
  id: string
  colorName: string
  emoji: string
  colorHex: string
  weightLbsMin: number
  weightLbsMax: number
  weightLbsAvg: number
  weightKgAvg: number
  label: string
  recommendedFor: string
}

export const BAND_COLOR_SPECTRUM: BandResistanceLevel[] = [
  {
    id: 'yellow',
    colorName: 'Yellow',
    emoji: '●',
    colorHex: '#F59E0B',
    weightLbsMin: 5,
    weightLbsMax: 10,
    weightLbsAvg: 10,
    weightKgAvg: 4.5,
    label: 'Yellow (X-Light · 5–10 lbs)',
    recommendedFor: 'Rotator cuff, shoulder rehab, hip mobility',
  },
  {
    id: 'red',
    colorName: 'Red',
    emoji: '●',
    colorHex: '#EF4444',
    weightLbsMin: 10,
    weightLbsMax: 25,
    weightLbsAvg: 20,
    weightKgAvg: 9,
    label: 'Red (Light · 10–25 lbs)',
    recommendedFor: 'Band pull-aparts, face pulls, shoulder activation',
  },
  {
    id: 'green',
    colorName: 'Green',
    emoji: '●',
    colorHex: '#10B981',
    weightLbsMin: 25,
    weightLbsMax: 40,
    weightLbsAvg: 35,
    weightKgAvg: 16,
    label: 'Green (Medium · 25–40 lbs)',
    recommendedFor: 'Banded walks, bicep curls, seated rows',
  },
  {
    id: 'blue',
    colorName: 'Blue',
    emoji: '●',
    colorHex: '#3B82F6',
    weightLbsMin: 40,
    weightLbsMax: 60,
    weightLbsAvg: 50,
    weightKgAvg: 23,
    label: 'Blue (Heavy · 40–60 lbs)',
    recommendedFor: 'Assisted pull-ups, squats, compound rows',
  },
  {
    id: 'black',
    colorName: 'Black',
    emoji: '●',
    colorHex: '#334155',
    weightLbsMin: 60,
    weightLbsMax: 80,
    weightLbsAvg: 70,
    weightKgAvg: 32,
    label: 'Black (X-Heavy · 60–80 lbs)',
    recommendedFor: 'Heavy deadlifts, hip thrusts, max strength',
  },
  {
    id: 'purple',
    colorName: 'Purple',
    emoji: '●',
    colorHex: '#8B5CF6',
    weightLbsMin: 80,
    weightLbsMax: 100,
    weightLbsAvg: 90,
    weightKgAvg: 41,
    label: 'Purple (Monster · 80–100+ lbs)',
    recommendedFor: 'Elite power assistance & heavy overload',
  },
]

/**
 * Detects whether an exercise is a static hold stretch (timed in seconds, not repetitions).
 */
export function isTimedStaticStretch(
  name?: string | null,
  block?: string | null,
  repsText?: string | number | null
): boolean {
  if (!name) return false
  const norm = name.trim().toLowerCase()
  const repsNorm = String(repsText ?? '').toLowerCase()

  // 1. Explicit static stretch or hold keywords
  if (
    norm.includes('static') ||
    norm.includes('stretch') ||
    norm.includes('hold') ||
    norm.includes('isometric') ||
    norm.includes('iso hold') ||
    norm.includes('doorway') ||
    norm.includes('couch stretch') ||
    norm.includes('pigeon') ||
    norm.includes('plank') ||
    norm.includes('wall sit') ||
    norm.includes('dead hang') ||
    norm.includes('hollow hold') ||
    norm.includes('child\'s pose')
  ) {
    // Exclude dynamic movement patterns that happen to contain the words unless they are holds
    if (
      (norm.includes('dynamic') || norm.includes('swing') || norm.includes('circle') || norm.includes('walking lunge')) &&
      !norm.includes('hold') &&
      !norm.includes('static')
    ) {
      return false
    }
    return true
  }

  // 2. Block or reps text indicates time hold
  if (block === 'cool-down' && (norm.includes('pec') || norm.includes('lat') || norm.includes('hamstring') || norm.includes('calf') || norm.includes('flexor'))) {
    return true
  }

  if (repsNorm.includes('sec') || repsNorm.includes('hold') || repsNorm.includes('s hold') || /^\d+\s*s$/i.test(repsNorm)) {
    return true
  }

  return false
}

/**
 * Detects whether an exercise is a foam rolling / Self-Myofascial Release (SMR) exercise.
 */
export function isFoamRollerExercise(name?: string | null): boolean {
  if (!name) return false
  const norm = name.trim().toLowerCase()

  return (
    norm.includes('foam roll') ||
    norm.includes('foam roller') ||
    norm.includes('smr') ||
    norm.includes('myofascial') ||
    norm.includes('lacrosse ball') ||
    norm.includes('massage roller') ||
    norm.includes('massage ball')
  )
}

/**
 * Detects whether an exercise uses resistance bands, mini bands, or tubing.
 */
export function isBandExercise(name?: string | null, equipment?: string[] | null): boolean {
  if (!name) return false
  const norm = name.trim().toLowerCase()

  if (
    norm.includes('band') ||
    norm.includes('banded') ||
    norm.includes('tubing') ||
    norm.includes('tube walking') ||
    norm.includes('monster walk')
  ) {
    return true
  }

  if (equipment && equipment.some(e => /band/i.test(e))) {
    return true
  }

  return false
}

/**
 * Extracts the duration in seconds from an exercise reps string (e.g. "30s", "30-60s", "45 sec", "30s hold").
 * Defaults to 30 seconds for static stretches / SMR if not specified.
 */
export function parseHoldDurationSeconds(repsText?: string | number | null, defaultSec: number = 30): number {
  if (typeof repsText === 'number' && repsText > 0) return repsText
  const text = String(repsText ?? '').trim()
  if (!text) return defaultSec

  const rangeMatch = text.match(/(\d+)\s*[-\u2013to]+\s*(\d+)/i)
  if (rangeMatch) {
    const minVal = parseInt(rangeMatch[1], 10)
    return !isNaN(minVal) ? minVal : defaultSec
  }

  const numMatch = text.match(/(\d+)/)
  if (numMatch) {
    const val = parseInt(numMatch[1], 10)
    return !isNaN(val) && val > 0 ? val : defaultSec
  }

  return defaultSec
}

/**
 * Formats the display target text for an exercise (e.g. "3 sets × 30s hold" for stretches vs "3 sets × 12 reps").
 */
export function formatExerciseTargetDisplay(exercise: {
  name: string
  sets: string | number
  reps: string | number
  rest?: string | null
  block?: string | null
}): string {
  const isStretch = isTimedStaticStretch(exercise.name, exercise.block, exercise.reps)
  const isFoam = isFoamRollerExercise(exercise.name)

  const restText = exercise.rest ? ` · Rest ${exercise.rest}` : ''

  if (isStretch) {
    const holdSec = parseHoldDurationSeconds(exercise.reps, 30)
    return `${exercise.sets} sets × ${holdSec}s hold${restText}`
  }

  if (isFoam) {
    const holdSec = parseHoldDurationSeconds(exercise.reps, 30)
    return `${exercise.sets} sets × ${holdSec}s SMR roll${restText}`
  }

  return `${exercise.sets} sets × ${exercise.reps}${restText}`
}

/**
 * Detects whether an exercise is a strength / resistance exercise where NASM movement tempo applies.
 * Returns false for static stretches, SMR foam rolling, cardio, mobility drills, warmups, and cooldowns.
 */
export function isStrengthExercise(
  name?: string | null,
  block?: string | null,
  repsText?: string | number | null
): boolean {
  if (!name) return false
  const norm = name.trim().toLowerCase()
  const blockNorm = String(block ?? '').trim().toLowerCase()

  // 1. Explicit non-strength blocks
  if (
    blockNorm === 'warmup' ||
    blockNorm === 'warm-up' ||
    blockNorm === 'activation' ||
    blockNorm === 'skill' ||
    blockNorm === 'cooldown' ||
    blockNorm === 'cool-down' ||
    blockNorm === 'smr' ||
    blockNorm === 'cardio' ||
    blockNorm === 'flexibility' ||
    blockNorm === 'mobility'
  ) {
    return false
  }

  // 2. Timed static stretches & SMR foam rolling
  if (isTimedStaticStretch(name, block, repsText) || isFoamRollerExercise(name)) {
    return false
  }

  // 3. Cardio & non-strength patterns in name
  if (
    norm.includes('treadmill') ||
    norm.includes('elliptical') ||
    norm.includes('stairmaster') ||
    norm.includes('airbike') ||
    norm.includes('assault bike') ||
    norm.includes('rower') ||
    norm.includes('running') ||
    norm.includes('jogging') ||
    norm.includes('walking') ||
    norm.includes('cycling') ||
    norm.includes('jump rope') ||
    norm.includes('burpee') ||
    norm.includes('mountain climber') ||
    norm.includes('jumping jack') ||
    norm.includes('stretch') ||
    norm.includes('foam roll') ||
    norm.includes('arm circles') ||
    norm.includes('cat cow') ||
    norm.includes('bird dog')
  ) {
    return false
  }

  return true
}

/**
 * Finds the closest band resistance level for a given weight in pounds or kilograms.
 */
export function findBandByWeight(weight: number, units: 'imperial' | 'metric' = 'imperial'): BandResistanceLevel {
  const weightLbs = units === 'metric' ? weight * 2.20462 : weight
  if (weightLbs <= 15) return BAND_COLOR_SPECTRUM[0] // Yellow
  if (weightLbs <= 30) return BAND_COLOR_SPECTRUM[1] // Red
  if (weightLbs <= 45) return BAND_COLOR_SPECTRUM[2] // Green
  if (weightLbs <= 65) return BAND_COLOR_SPECTRUM[3] // Blue
  if (weightLbs <= 85) return BAND_COLOR_SPECTRUM[4] // Black
  return BAND_COLOR_SPECTRUM[5] // Purple
}

