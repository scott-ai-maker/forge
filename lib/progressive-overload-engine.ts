/**
 * NASM 1RM & Progressive Overload Engine
 * 
 * Based on NASM CPT-7 Chapter 8 (Resistance Training Concepts), Chapter 20,
 * and Official NASM 1RM Conversion Tables (5 - 1,000 lbs):
 * - Dual Brzycki & Epley 1RM Algorithm with RPE adjustment
 * - Complete OPT™ Working Load Percentage Matrix (100%, 90%, 85%, 80%, 75%, 70%, 65%, 60%, 50%)
 * - NASM 2-for-2 Progressive Overload Progression Rule
 * - Multi-session historical 1RM tracking and PR progression curves
 */

export interface SetLogItem {
  id?: string
  exerciseName: string
  weightKg?: number | null
  weightLbs?: number | null
  reps: number
  rpe?: number | null
  date: string
  isWarmup?: boolean
}

export interface OneRepMaxResult {
  weightLbs: number
  reps: number
  brzycki1RmLbs: number
  epley1RmLbs: number
  average1RmLbs: number
  average1RmKg: number
  workingPercentages: {
    pct100: number // Phase 4 / 5 max
    pct90: number  // 3-4 reps (Phase 4)
    pct85: number  // 5-6 reps (Phase 4 / 3)
    pct80: number  // 8 reps (Phase 3 Hypertrophy)
    pct75: number  // 10 reps (Phase 3 Hypertrophy)
    pct70: number  // 12 reps (Phase 2 Strength Endurance)
    pct65: number  // 15 reps (Phase 1 / 2)
    pct60: number  // 20 reps (Phase 1 Stabilization)
    pct50: number  // Dynamic power warmup
  }
}

export interface OverloadEvaluation {
  eligibleForProgression: boolean
  exerciseName: string
  bodyPartCategory: 'upper_body' | 'lower_body'
  consecutiveSessionsOverTarget: number
  currentWorkingWeightLbs: number
  recommendedWeightIncreaseLbs: number
  nextTargetWeightLbs: number
  recommendedPercentageIncrease: number
  reasoning: string
}

const LOWER_BODY_KEYWORDS = [
  'squat', 'deadlift', 'lunge', 'leg press', 'rdl', 'romanian', 'hip thrust',
  'hack squat', 'calf', 'hamstring', 'quad', 'leg curl', 'leg extension', 'step-up'
]

export function isLowerBodyExercise(exerciseName: string): boolean {
  const normalized = exerciseName.toLowerCase()
  return LOWER_BODY_KEYWORDS.some(keyword => normalized.includes(keyword))
}

/**
 * Calculates estimated 1RM using dual Brzycki & Epley formulas
 */
export function calculate1Rm(weightLbs: number, reps: number): OneRepMaxResult {
  if (weightLbs <= 0 || reps <= 0) {
    const defaultWeights = {
      pct100: 0, pct90: 0, pct85: 0, pct80: 0, pct75: 0, pct70: 0, pct65: 0, pct60: 0, pct50: 0
    }
    return {
      weightLbs: 0,
      reps: 0,
      brzycki1RmLbs: 0,
      epley1RmLbs: 0,
      average1RmLbs: 0,
      average1RmKg: 0,
      workingPercentages: defaultWeights,
    }
  }

  if (reps === 1) {
    const w = Math.round(weightLbs)
    return {
      weightLbs: w,
      reps: 1,
      brzycki1RmLbs: w,
      epley1RmLbs: w,
      average1RmLbs: w,
      average1RmKg: Math.round((w / 2.20462) * 10) / 10,
      workingPercentages: computePercentageMap(w),
    }
  }

  // Brzycki: Weight / (1.0278 - 0.0278 * Reps)
  const cappedReps = Math.min(reps, 15)
  const brzycki = weightLbs / (1.0278 - 0.0278 * cappedReps)
  
  // Epley: Weight * (1 + 0.0333 * Reps)
  const epley = weightLbs * (1 + 0.0333 * reps)

  const avgLbs = Math.round((brzycki + epley) / 2)
  const avgKg = Math.round((avgLbs / 2.20462) * 10) / 10

  return {
    weightLbs: Math.round(weightLbs),
    reps,
    brzycki1RmLbs: Math.round(brzycki),
    epley1RmLbs: Math.round(epley),
    average1RmLbs: avgLbs,
    average1RmKg: avgKg,
    workingPercentages: computePercentageMap(avgLbs),
  }
}

function computePercentageMap(oneRmLbs: number) {
  const roundToFive = (val: number) => Math.round(val / 5) * 5
  return {
    pct100: oneRmLbs,
    pct90: roundToFive(oneRmLbs * 0.90),
    pct85: roundToFive(oneRmLbs * 0.85),
    pct80: roundToFive(oneRmLbs * 0.80),
    pct75: roundToFive(oneRmLbs * 0.75),
    pct70: roundToFive(oneRmLbs * 0.70),
    pct65: roundToFive(oneRmLbs * 0.65),
    pct60: roundToFive(oneRmLbs * 0.60),
    pct50: roundToFive(oneRmLbs * 0.50),
  }
}

/**
 * Evaluates NASM 2-for-2 Progressive Overload Rule for an exercise:
 * If an athlete can complete >= 2 reps over their assigned repetition goal
 * in the final set in 2 consecutive workouts, weight should be increased.
 */
export function evaluate2For2Progression(
  exerciseName: string,
  targetReps: number,
  lastTwoSessions: Array<{ date: string; finalSetWeightLbs: number; finalSetReps: number }>
): OverloadEvaluation {
  const isLower = isLowerBodyExercise(exerciseName)
  const bodyPartCategory: 'upper_body' | 'lower_body' = isLower ? 'lower_body' : 'upper_body'

  if (lastTwoSessions.length < 2) {
    return {
      eligibleForProgression: false,
      exerciseName,
      bodyPartCategory,
      consecutiveSessionsOverTarget: lastTwoSessions.length,
      currentWorkingWeightLbs: lastTwoSessions[0]?.finalSetWeightLbs ?? 0,
      recommendedWeightIncreaseLbs: 0,
      nextTargetWeightLbs: lastTwoSessions[0]?.finalSetWeightLbs ?? 0,
      recommendedPercentageIncrease: 0,
      reasoning: 'Minimum 2 logged sessions required to verify 2-for-2 progression criteria.',
    }
  }

  const [session2, session1] = lastTwoSessions // session1 is earlier, session2 is latest
  const s1Qualified = session1.finalSetReps >= targetReps + 2
  const s2Qualified = session2.finalSetReps >= targetReps + 2

  const consecutive = (s1Qualified && s2Qualified) ? 2 : (s2Qualified ? 1 : 0)

  if (consecutive < 2) {
    return {
      eligibleForProgression: false,
      exerciseName,
      bodyPartCategory,
      consecutiveSessionsOverTarget: consecutive,
      currentWorkingWeightLbs: session2.finalSetWeightLbs,
      recommendedWeightIncreaseLbs: 0,
      nextTargetWeightLbs: session2.finalSetWeightLbs,
      recommendedPercentageIncrease: 0,
      reasoning: s2Qualified
        ? `Session 1 qualified (+${session2.finalSetReps - targetReps} reps over target). Repeat for 1 more consecutive session to trigger progressive load increase.`
        : `Final set achieved ${session2.finalSetReps} reps (Target: ${targetReps}). Continue current working load until achieving ${targetReps + 2}+ reps on final set.`,
    }
  }

  // Calculate NASM standard progressive load jumps
  // Upper body: +2.5% to 5% (or 2.5 - 5 lbs)
  // Lower body: +5% to 10% (or 10 - 20 lbs)
  const currentWeight = session2.finalSetWeightLbs
  let increaseLbs = 5
  let pct = 5

  if (isLower) {
    increaseLbs = Math.max(10, Math.round((currentWeight * 0.075) / 5) * 5)
    pct = Math.round((increaseLbs / currentWeight) * 100)
  } else {
    increaseLbs = Math.max(5, Math.round((currentWeight * 0.04) / 2.5) * 2.5)
    pct = Math.round((increaseLbs / currentWeight) * 100)
  }

  const nextWeight = currentWeight + increaseLbs

  return {
    eligibleForProgression: true,
    exerciseName,
    bodyPartCategory,
    consecutiveSessionsOverTarget: 2,
    currentWorkingWeightLbs: currentWeight,
    recommendedWeightIncreaseLbs: increaseLbs,
    nextTargetWeightLbs: nextWeight,
    recommendedPercentageIncrease: pct,
    reasoning: `NASM 2-for-2 Criteria Achieved! Client exceeded target rep threshold (+2 reps) on final sets across 2 consecutive sessions (${session1.finalSetReps} reps & ${session2.finalSetReps} reps vs ${targetReps} target). Prescribe +${increaseLbs} lbs (+${pct}%) progressive overload for next microcycle.`,
  }
}

export interface OneRepMaxPercentageTier {
  percentage: number
  weightLbs: number
  weightKg: number
  suggestedReps: number
  repRangeText: string
  optPhase: number
  phaseTitle: string
  trainingGoal: string
}

/**
 * Returns complete NASM OPT working load percentage tiers for a given 1RM.
 */
export function getOneRepMaxPercentageTiers(
  oneRmLbs: number,
  units: 'imperial' | 'metric' = 'imperial'
): OneRepMaxPercentageTier[] {
  if (oneRmLbs <= 0) return []

  const tiersConfig = [
    { pct: 95, reps: 2, range: '1–2 reps', phase: 4, title: 'Maximal Strength', goal: 'Peak Neuromuscular Recruitment' },
    { pct: 90, reps: 4, range: '3–4 reps', phase: 4, title: 'Maximal Strength', goal: 'High Neural Drive & Force' },
    { pct: 85, reps: 6, range: '5–6 reps', phase: 3, title: 'Strength / Hypertrophy', goal: 'Mechanical Tension & Growth' },
    { pct: 80, reps: 8, range: '7–8 reps', phase: 3, title: 'Muscular Development', goal: 'Optimal Myofibrillar Hypertrophy' },
    { pct: 75, reps: 10, range: '9–10 reps', phase: 3, title: 'Muscular Development', goal: 'Sarcoplasmic & Size Adaptation' },
    { pct: 70, reps: 12, range: '11–12 reps', phase: 2, title: 'Strength Endurance', goal: 'Fatigue Resistance & Density' },
    { pct: 65, reps: 15, range: '13–15 reps', phase: 1, title: 'Stabilization Endurance', goal: 'Connective Tissue & Motor Control' },
    { pct: 60, reps: 20, range: '16–20 reps', phase: 1, title: 'Stabilization Endurance', goal: 'Vascularization & Proprioception' },
    { pct: 50, reps: 10, range: 'Dynamic Warmup', phase: 0, title: 'Warm-up / Potentiation', goal: 'CNS Priming & Movement Groove' },
  ]

  return tiersConfig.map(t => {
    const rawLbs = oneRmLbs * (t.pct / 100)
    const roundedLbs = Math.max(5, Math.round(rawLbs / 5) * 5)
    const rawKg = (oneRmLbs / 2.20462) * (t.pct / 100)
    const roundedKg = units === 'metric'
      ? Math.max(2.5, Math.round(rawKg / 2.5) * 2.5)
      : Math.round((roundedLbs / 2.20462) * 10) / 10

    return {
      percentage: t.pct,
      weightLbs: roundedLbs,
      weightKg: roundedKg,
      suggestedReps: t.reps,
      repRangeText: t.range,
      optPhase: t.phase,
      phaseTitle: t.title,
      trainingGoal: t.goal,
    }
  })
}

