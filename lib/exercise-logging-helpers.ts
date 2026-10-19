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
    label: 'Yellow (Very Light · 5–10 lbs)',
    recommendedFor: 'Rotator cuff, shoulder rehab, hip mobility',
  },
  {
    id: 'green',
    colorName: 'Green',
    emoji: '●',
    colorHex: '#10B981',
    weightLbsMin: 10,
    weightLbsMax: 25,
    weightLbsAvg: 20,
    weightKgAvg: 9,
    label: 'Green (Light · 10–25 lbs)',
    recommendedFor: 'Band pull-aparts, face pulls, shoulder activation',
  },
  {
    id: 'red',
    colorName: 'Red',
    emoji: '●',
    colorHex: '#EF4444',
    weightLbsMin: 25,
    weightLbsMax: 40,
    weightLbsAvg: 35,
    weightKgAvg: 16,
    label: 'Red (Medium · 25–40 lbs)',
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
    id: 'purple',
    colorName: 'Purple',
    emoji: '●',
    colorHex: '#8B5CF6',
    weightLbsMin: 60,
    weightLbsMax: 80,
    weightLbsAvg: 70,
    weightKgAvg: 32,
    label: 'Purple (Ultra Heavy · 60–80 lbs)',
    recommendedFor: 'Heavy deadlifts, hip thrusts, max strength',
  },
  {
    id: 'black',
    colorName: 'Black',
    emoji: '●',
    colorHex: '#334155',
    weightLbsMin: 80,
    weightLbsMax: 100,
    weightLbsAvg: 90,
    weightKgAvg: 41,
    label: 'Black (Super Heavy · 80–100+ lbs)',
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
 * Detects whether an exercise, stretch, or corrective movement is unilateral (performed one side at a time).
 * Unilateral movements require timing both sides (Side 1 and Side 2) rather than a single timer.
 */
export interface UnilateralMovementCheckInput {
  name?: string | null
  phase?: string | null
  protocol?: string | null
  target?: string | null
  targetMuscle?: string | null
  instructions?: string[] | null
  reps?: string | number | null
  repsOrDuration?: string | number | null
  block?: string | null
  description?: string | null
  cues?: string[] | null
  coachingCues?: string[] | null
  isUnilateral?: boolean
}

/**
 * Detects whether an exercise, stretch, or corrective movement is unilateral (performed one side at a time).
 * Unilateral movements require timing both sides (Side 1 and Side 2) rather than a single timer.
 */
export function isUnilateralMovement(movement?: UnilateralMovementCheckInput | string | null): boolean {
  if (!movement) return false

  if (typeof movement === 'string') {
    movement = { name: movement }
  }

  if (typeof movement.isUnilateral === 'boolean') {
    return movement.isUnilateral
  }

  const combinedText = [
    movement.name ?? '',
    movement.protocol ?? '',
    movement.target ?? '',
    movement.targetMuscle ?? '',
    movement.reps ?? '',
    movement.repsOrDuration ?? '',
    movement.phase ?? '',
    movement.block ?? '',
    movement.description ?? '',
    ...(movement.instructions ?? []),
    ...(movement.cues ?? []),
    ...(movement.coachingCues ?? []),
  ].join(' ').toLowerCase()

  // Explicit bilateral exclusions
  if (
    combinedText.includes('both sides at once') ||
    combinedText.includes('bilateral') ||
    combinedText.includes('both legs') ||
    combinedText.includes('both arms') ||
    combinedText.includes("child's pose") ||
    combinedText.includes('childs pose') ||
    combinedText.includes('forward fold') ||
    combinedText.includes('wall sit') ||
    combinedText.includes('dead hang') ||
    combinedText.includes('prone cobra') ||
    combinedText.includes('cat cow') ||
    combinedText.includes('cat-cow') ||
    (combinedText.includes('glute bridge') && !combinedText.includes('single')) ||
    (combinedText.includes('plank') && !combinedText.includes('side') && !combinedText.includes('single'))
  ) {
    return false
  }

  // 1. Explicit per-side, per-limb, or single-side indicators
  if (
    combinedText.includes('single body part') ||
    combinedText.includes('single body-part') ||
    combinedText.includes('single bodypart') ||
    combinedText.includes('single limb') ||
    combinedText.includes('single side') ||
    combinedText.includes('single-side') ||
    combinedText.includes('one side') ||
    combinedText.includes('per side') ||
    combinedText.includes('each side') ||
    combinedText.includes('/ side') ||
    combinedText.includes('/side') ||
    combinedText.includes('a side') ||
    combinedText.includes('both sides') ||
    combinedText.includes('single-leg') ||
    combinedText.includes('single leg') ||
    combinedText.includes('1-leg') ||
    combinedText.includes('one leg') ||
    combinedText.includes('per leg') ||
    combinedText.includes('each leg') ||
    combinedText.includes('/ leg') ||
    combinedText.includes('/leg') ||
    combinedText.includes('a leg') ||
    combinedText.includes('single-arm') ||
    combinedText.includes('single arm') ||
    combinedText.includes('1-arm') ||
    combinedText.includes('one arm') ||
    combinedText.includes('per arm') ||
    combinedText.includes('each arm') ||
    combinedText.includes('/ arm') ||
    combinedText.includes('/arm') ||
    combinedText.includes('a arm') ||
    combinedText.includes('per limb') ||
    combinedText.includes('each limb') ||
    combinedText.includes('/ limb') ||
    combinedText.includes('/limb') ||
    combinedText.includes('per foot') ||
    combinedText.includes('each foot') ||
    combinedText.includes('/ foot') ||
    combinedText.includes('/foot') ||
    combinedText.includes('unilateral')
  ) {
    return true
  }

  // 2. Specific single-side corrective / stretch patterns
  if (
    /\b(doorway|kneeling hip flexor|standing hip flexor|half[- ]kneeling|pigeon|couch stretch|side plank|figure[- ]?4|90[- ]?90|piriformis|sleeper stretch|cross[- ]body)\b/i.test(combinedText) ||
    (/\b(stretch|stretching|lengthen|lengthening|smr|foam|roll|rolling|hold|iso|isometric|mobility)\b/i.test(combinedText) &&
      /\b(calves|calf|gastrocnemius|gastroc|soleus|quads|quad|quadriceps|rectus femoris|vastus|hamstrings|hamstring|biceps femoris|lats|lat|latissimus|latissimus dorsi|pecs|pec|pectoral|pectorals|pectoralis|glutes|glute|gluteus|gluteal|hip flexor|hip flexors|psoas|iliopsoas|tfl|tensor fasciae|tensor fasciae latae|adductors|adductor|abductors|abductor|groin|inner thigh|traps|trap|trapezius|upper trap|upper trapezius|scalene|scalenes|levator|deltoid|deltoids|shoulder|shoulders|rotator cuff|bicep|biceps|tricep|triceps|forearm|forearms|wrist|wrists|ankle|ankles)\b/i.test(combinedText))
  ) {
    return true
  }

  // 3. In NASM CEx, Lengthen phase static stretches are unilateral by default
  if (movement.phase === 'lengthen' || movement.block === 'cooldown' || movement.block === 'warmup') {
    if (/\b(stretch|lengthen|hold)\b/i.test(combinedText)) {
      return true
    }
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
  const sideMatch = String(exercise.reps).match(/(?:per\s+|\/\s*)(side|leg|arm)\b/i)
  const sideText = sideMatch ? ` per ${sideMatch[1].toLowerCase()}` : ''

  if (isStretch) {
    const holdSec = parseHoldDurationSeconds(exercise.reps, 30)
    return `${exercise.sets} sets × ${holdSec}s hold${sideText}${restText}`
  }

  if (isFoam) {
    const holdSec = parseHoldDurationSeconds(exercise.reps, 30)
    return `${exercise.sets} sets × ${holdSec}s SMR roll${sideText}${restText}`
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
  if (weightLbs <= 15) return BAND_COLOR_SPECTRUM[0] // Yellow (~10 lbs)
  if (weightLbs <= 30) return BAND_COLOR_SPECTRUM[1] // Green (~20 lbs)
  if (weightLbs <= 45) return BAND_COLOR_SPECTRUM[2] // Red (~35 lbs)
  if (weightLbs <= 65) return BAND_COLOR_SPECTRUM[3] // Blue (~50 lbs)
  if (weightLbs <= 85) return BAND_COLOR_SPECTRUM[4] // Purple (~70 lbs)
  return BAND_COLOR_SPECTRUM[5] // Black (~90 lbs)
}
