/**
 * Forge Athletic — Client Training Split Recommendation & RAG Routine Architect
 *
 * Provides personalized training split options, OPT™ phase recommendations, and
 * split-specific daily workout composition powered by the 76-document NASM RAG
 * knowledge base whenever a client does not have a custom Coach Gordon certified plan.
 */

import { queryNasmRagLibrary } from './nasm-rag-knowledge-base'
import { parseEquipmentCapabilities } from './nasm-equipment-detector'
import { parseInjuriesFromText } from './sports-injuries'
import { calculateOneRepMax, calculateTargetTrainingLoad } from './sports-science-knowledge'
import type { GeneratedExerciseItem } from './rag-nasm-program-generator'

export type TrainingSplitId =
  | 'full_body'
  | 'upper_lower'
  | 'push_pull_4day'
  | 'push_pull_legs'
  | 'metabolic_contrast'

export interface ClientTrainingSplitOption {
  id: TrainingSplitId
  title: string
  shortLabel: string
  subtitle: string
  idealDaysPerWeek: number[]
  recommendedForLevels: Array<'beginner' | 'intermediate' | 'advanced' | 'elite'>
  fitScore: number
  isTopRecommendation: boolean
  matchBadge: 'Best Match for You' | 'Strong Alternative' | 'Available Split'
  whyForYou: string
  daySchedulePreview: string[]
  ragCitation: string
}

export interface ClientTrainingRecommendationSummary {
  recommendedSplitId: TrainingSplitId
  recommendedSplitTitle: string
  recommendedNasmPhase: number
  recommendedPhaseName: string
  recommendedCardioBlend: 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush'
  effectiveDaysPerWeek: number
  effectiveGoal: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness'
  effectiveExperienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  equipmentSummaryLabel: string
  ragHeadline: string
  ragRationale: string
  ragSourcesCited: string[]
  options: ClientTrainingSplitOption[]
}

export interface ClientTrainingRecommendationInput {
  experienceLevel?: string | null
  trainingDaysPerWeek?: number | null
  fitnessGoal?: string | null
  equipmentAccess?: string[] | null
  injuriesLimitations?: string | string[] | null
  kineticCompensations?: string[] | null
  preferredSplit?: TrainingSplitId | 'auto' | null
}

export function normalizeClientGoal(
  rawGoal?: string | null
): 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness' {
  const g = String(rawGoal || '').toLowerCase()
  if (g.includes('fat') || g.includes('weight') || g.includes('lean') || g.includes('cut') || g.includes('recomp')) {
    return 'fat_loss'
  }
  if (g.includes('hypertrophy') || g.includes('muscle') || g.includes('mass') || g.includes('build') || g.includes('size')) {
    return 'hypertrophy'
  }
  if (g.includes('performance') || g.includes('power') || g.includes('athletic') || g.includes('strength') || g.includes('sport')) {
    return 'performance'
  }
  return 'general_fitness'
}

export function normalizeExperienceLevel(
  rawLevel?: string | null
): 'beginner' | 'intermediate' | 'advanced' | 'elite' {
  const l = String(rawLevel || '').toLowerCase().trim()
  if (l === 'elite' || l.includes('compet')) return 'elite'
  if (l === 'advanced' || l.includes('adv')) return 'advanced'
  if (l === 'intermediate' || l.includes('inter') || l.includes('moderate')) return 'intermediate'
  return 'beginner'
}

const PHASE_NAMES: Record<number, string> = {
  1: 'Stabilization Endurance',
  2: 'Strength Endurance',
  3: 'Muscular Development (Hypertrophy)',
  4: 'Maximal Strength',
  5: 'Power & Post-Activation Potentiation',
}

/**
 * Generates day-by-day preview titles for a given split and weekly training frequency.
 */
export function buildSplitSchedulePreview(splitId: TrainingSplitId, daysPerWeek: number): string[] {
  const days = Math.min(6, Math.max(2, daysPerWeek || 4))
  const preview: string[] = []

  for (let d = 1; d <= days; d++) {
    if (splitId === 'full_body') {
      const variants = [
        'Total-Body A: Horizontal Push/Pull & Squat Integration',
        'Total-Body B: Vertical Push/Pull, Hinge & Unilateral Balance',
        'Total-Body C: Multiplanar Strength & Core Stabilization',
        'Total-Body D: Posterior Chain, Glutes & Functional Carry',
        'Total-Body E: Metabolic Peripheral Heart Action Circuit',
        'Total-Body F: Dynamic Mobility, Core & Aerobic Flush',
      ]
      preview.push(`Day ${d}: ${variants[(d - 1) % variants.length]}`)
    } else if (splitId === 'upper_lower') {
      const variants = [
        'Upper Body A: Horizontal Chest Press, Row & Core',
        'Lower Body A: Knee-Dominant Squat, Lunge & Calves',
        'Upper Body B: Incline/Overhead Press, Vertical Pull & Arms',
        'Lower Body B: Hip-Dominant RDL, Glute Bridge & Unilateral',
        'Upper Body C: Hypertrophy Contrast & Shoulder Stabilization',
        'Lower Body C: Posterior Chain & Athletic Conditioning',
      ]
      preview.push(`Day ${d}: ${variants[(d - 1) % variants.length]}`)
    } else if (splitId === 'push_pull_4day') {
      const variants = [
        'Push A: Chest Press, Quad Squat, Shoulders & Triceps',
        'Pull A: Posterior Hinge, Horizontal Row, Rear Delts & Biceps',
        'Push B: Incline/Overhead Press, Unilateral Split Squat & Triceps',
        'Pull B: Glute Bridge/Unilateral RDL, Vertical Pull & Biceps',
        'Push C: Mechanical Tension Push & Quad Finisher',
        'Pull C: Posterior Chain & Back Density Finisher',
      ]
      preview.push(`Day ${d}: ${variants[(d - 1) % variants.length]}`)
    } else if (splitId === 'push_pull_legs') {
      const variants = [
        'Push: Chest, Anterior/Lateral Deltoids & Triceps',
        'Pull: Lats, Upper Back, Posterior Deltoids & Biceps',
        'Legs & Core: Quads, Hamstrings, Glutes & Calves',
        days === 4
          ? 'Full-Body / Upper-Lower Hypertrophy Synthesis'
          : 'Push B: Incline & Overhead Hypertrophy Focus',
        'Pull B: Vertical Lat Width & Arm Specialization',
        'Legs B: Posterior Hinge, Unilateral Glutes & Core',
      ]
      preview.push(`Day ${d}: ${variants[(d - 1) % variants.length]}`)
    } else {
      // metabolic_contrast
      const variants = [
        'Day 1: Upper/Lower PHA Contrast Supersets + Stage 2 Finisher',
        'Day 2: Posterior Chain & Core + Aerobic Threshold Conditioning',
        'Day 3: Multiplanar Push/Pull Contrast + Metabolic Intervals',
        'Day 4: Unilateral Legs, Glutes & Athletic Conditioning Flush',
        'Day 5: Total-Body Metabolic Density Circuit',
        'Day 6: Active Recovery Mobility & Zone 1 Aerobic Flush',
      ]
      preview.push(variants[(d - 1) % variants.length])
    }
  }

  return preview
}

/**
 * Evaluates a client's profile and returns ranked training split recommendations
 * backed by the NASM CPT-7 RAG knowledge base.
 */
export function recommendClientTrainingSplits(
  input: ClientTrainingRecommendationInput
): ClientTrainingRecommendationSummary {
  const level = normalizeExperienceLevel(input.experienceLevel)
  const days = Math.min(6, Math.max(2, Number(input.trainingDaysPerWeek) || 4))
  const goal = normalizeClientGoal(input.fitnessGoal)
  const eq = parseEquipmentCapabilities(input.equipmentAccess ?? ['dumbbell', 'band', 'bodyweight'])
  const rawInjuriesText = Array.isArray(input.injuriesLimitations)
    ? input.injuriesLimitations.join(', ')
    : input.injuriesLimitations ?? undefined
  const parsedInjuries = parseInjuriesFromText(rawInjuriesText)
  const hasCompensations =
    (input.kineticCompensations && input.kineticCompensations.length > 0) ||
    parsedInjuries.selectedInjuryIds.length > 0

  // Determine recommended NASM OPT Phase
  let phase = 1
  if (level === 'beginner') {
    phase = 1
  } else if (goal === 'fat_loss') {
    phase = 2
  } else if (goal === 'hypertrophy') {
    phase = 3
  } else if (goal === 'performance') {
    phase = level === 'elite' && !hasCompensations ? 5 : hasCompensations ? 2 : 4
  } else {
    phase = 2
  }

  // Enforce NASM OPT safety gate
  if (phase >= 4 && (level === 'beginner' || hasCompensations)) {
    phase = level === 'beginner' ? 1 : 2
  }

  const phaseName = PHASE_NAMES[phase] || PHASE_NAMES[1]

  const recommendedCardioBlend: 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush' =
    goal === 'fat_loss'
      ? 'integrated_finishers'
      : goal === 'hypertrophy'
      ? 'minimal_flush'
      : 'integrated_finishers'

  // Query RAG library for clinical citations
  const ragDocs = queryNasmRagLibrary({
    goal: goal === 'general_fitness' ? 'fat_loss' : goal,
    nasmOptPhase: phase,
  })
  const ragSourcesCited = ragDocs.map(d => `${d.title} (${d.filename})`)

  // Score each split based on days/week, experience level, and goal
  const scores: Record<TrainingSplitId, number> = {
    full_body: 65,
    upper_lower: 70,
    push_pull_4day: 70,
    push_pull_legs: 65,
    metabolic_contrast: 65,
  }

  if (days <= 3) {
    scores.full_body += 30
    if (days === 3 && (goal === 'hypertrophy' || level === 'advanced' || level === 'elite')) {
      scores.push_pull_legs += 26
    }
    if (goal === 'fat_loss') {
      scores.metabolic_contrast += 22
    }
    scores.upper_lower += 10
    scores.push_pull_4day += 8
  } else if (days === 4) {
    scores.upper_lower += 28
    scores.push_pull_4day += 27
    if (goal === 'hypertrophy' || goal === 'performance') {
      scores.push_pull_4day += 4 // Slight edge for 4-day Push/Pull on hypertrophy/strength
      scores.upper_lower += 3
    }
    if (goal === 'fat_loss') {
      scores.metabolic_contrast += 25
      scores.upper_lower += 3
    }
    if (level === 'beginner') {
      scores.upper_lower += 6
      scores.full_body += 18
    }
  } else {
    // 5 or 6 days/week
    scores.push_pull_legs += 32
    scores.upper_lower += 18
    scores.push_pull_4day += 16
    if (goal === 'fat_loss') {
      scores.metabolic_contrast += 24
    }
  }

  if (level === 'beginner') {
    scores.full_body += 12
    scores.push_pull_legs -= 8
  } else if (level === 'intermediate') {
    scores.upper_lower += 5
    scores.push_pull_4day += 5
  } else {
    // advanced / elite
    scores.push_pull_4day += 6
    scores.push_pull_legs += 6
  }

  const rawOptions: Array<Omit<ClientTrainingSplitOption, 'isTopRecommendation' | 'matchBadge'>> = [
    {
      id: 'upper_lower',
      title: 'Upper / Lower 4-Day Split',
      shortLabel: 'Upper / Lower',
      subtitle: 'Balanced 2×/week regional frequency separating upper-torso and lower-extremity days',
      idealDaysPerWeek: [4, 2],
      recommendedForLevels: ['beginner', 'intermediate', 'advanced'],
      fitScore: Math.min(99, scores.upper_lower),
      whyForYou: `With ${days} training days/week and a ${goal.replace(/_/g, ' ')} focus, an Upper / Lower split stimulates every major muscle group twice weekly while granting 48–72 hours of localized neuromuscular recovery between sessions.`,
      daySchedulePreview: buildSplitSchedulePreview('upper_lower', days),
      ragCitation: 'NASM CPT-7 Ch. 21 (OPT™ Split-Routine Periodization & Recovery)',
    },
    {
      id: 'push_pull_4day',
      title: 'Push / Pull 4-Day Split',
      shortLabel: 'Push / Pull (4-Day)',
      subtitle: 'Anterior Push + Quad Squat paired against Posterior Pull + Hip Hinge with zero spinal overlap',
      idealDaysPerWeek: [4],
      recommendedForLevels: ['intermediate', 'advanced', 'elite'],
      fitScore: Math.min(99, scores.push_pull_4day),
      whyForYou: `Pairs anterior pushing muscles (chest, shoulders, triceps, quads) on Push days and posterior pulling muscles (lats, upper back, hamstrings, glutes, biceps) on Pull days—eliminating lower-back axial fatigue overlap across your ${days}-day schedule.`,
      daySchedulePreview: buildSplitSchedulePreview('push_pull_4day', days),
      ragCitation: 'NASM CPT-7 Ch. 20 & Muscular Development Split Architecture',
    },
    {
      id: 'push_pull_legs',
      title: 'Push / Pull / Legs (PPL)',
      shortLabel: 'Push / Pull / Legs',
      subtitle: 'Dedicated movement-pattern specialization for maximum mechanical tension and volume',
      idealDaysPerWeek: [3, 5, 6],
      recommendedForLevels: ['intermediate', 'advanced', 'elite'],
      fitScore: Math.min(99, scores.push_pull_legs),
      whyForYou: `Groups synergistic prime movers into dedicated Push, Pull, and Lower-Body sessions so you can accumulate higher quality sets per muscle group under ${phaseName} tempo standards without systemic burnout.`,
      daySchedulePreview: buildSplitSchedulePreview('push_pull_legs', days),
      ragCitation: 'NASM CPT-7 Hypertrophy & Muscular Development Suite (CPT7_Muscle_Gain)',
    },
    {
      id: 'full_body',
      title: 'Total-Body Kinetic Integration',
      shortLabel: 'Full-Body Split',
      subtitle: 'High-frequency total-body sessions rotating squat, hinge, push, pull, and core stability',
      idealDaysPerWeek: [2, 3, 4],
      recommendedForLevels: ['beginner', 'intermediate'],
      fitScore: Math.min(99, scores.full_body),
      whyForYou: `Ideal for ${days} days/week or foundational movement mastery: trains the entire kinetic chain each session using rotating exercise variations (A/B/C) to maximize caloric burn, motor learning, and joint stabilization.`,
      daySchedulePreview: buildSplitSchedulePreview('full_body', days),
      ragCitation: 'NASM CPT-7 Ch. 16–21 (Integrated Total-Body Stabilization & PHA)',
    },
    {
      id: 'metabolic_contrast',
      title: 'Strength & Conditioning Contrast',
      shortLabel: 'Metabolic Contrast',
      subtitle: 'Peripheral Heart Action (PHA) strength supersets paired with Stage 1–3 cardio conditioning',
      idealDaysPerWeek: [3, 4, 5],
      recommendedForLevels: ['beginner', 'intermediate', 'advanced'],
      fitScore: Math.min(99, scores.metabolic_contrast),
      whyForYou: `Alternates upper and lower body movements within high-density supersets alongside targeted cardio intervals to maximize post-exercise oxygen consumption (EPOC), insulin sensitivity, and body recomposition.`,
      daySchedulePreview: buildSplitSchedulePreview('metabolic_contrast', days),
      ragCitation: 'NASM CPT-7 Fat Loss & Metabolic Conditioning Suite (CPT7_Fat_Loss)',
    },
  ]

  // Sort options by fitScore descending
  rawOptions.sort((a, b) => b.fitScore - a.fitScore)

  const topId =
    input.preferredSplit && input.preferredSplit !== 'auto'
      ? input.preferredSplit
      : rawOptions[0].id

  const options: ClientTrainingSplitOption[] = rawOptions.map((opt, idx) => {
    const isTop = opt.id === topId
    return {
      ...opt,
      isTopRecommendation: isTop,
      matchBadge: isTop
        ? 'Best Match for You'
        : idx <= 2
        ? 'Strong Alternative'
        : 'Available Split',
    }
  })

  const selectedOption = options.find(o => o.id === topId) || options[0]

  const ragHeadline = `Recommended for Your Profile: ${selectedOption.title} · NASM OPT™ Phase ${phase} (${phaseName})`
  const ragRationale = `Based on your ${level} experience level, ${days} training days/week, ${eq.summaryLabel} access, and ${goal.replace(/_/g, ' ')} goal, the Forge NASM RAG Engine recommends the **${selectedOption.title}** in **Phase ${phase}: ${phaseName}**. ${selectedOption.whyForYou}${hasCompensations ? ' Your routine automatically embeds corrective warm-ups and orthopedic exercise substitutions for joint protection.' : ''}`

  return {
    recommendedSplitId: selectedOption.id,
    recommendedSplitTitle: selectedOption.title,
    recommendedNasmPhase: phase,
    recommendedPhaseName: phaseName,
    recommendedCardioBlend,
    effectiveDaysPerWeek: days,
    effectiveGoal: goal,
    effectiveExperienceLevel: level,
    equipmentSummaryLabel: eq.summaryLabel,
    ragHeadline,
    ragRationale,
    ragSourcesCited,
    options,
  }
}

function loadFrom1RM(oneRepMaxLbs: number | undefined, pct: number): number | undefined {
  return oneRepMaxLbs === undefined ? undefined : calculateTargetTrainingLoad(oneRepMaxLbs, pct)
}

/**
 * Adapts sets, reps, tempo, and rest of an exercise item to the active NASM OPT™ phase.
 */
function applyPhaseAcuteVariables(
  item: Omit<GeneratedExerciseItem, 'sets' | 'reps' | 'tempo' | 'rest'> & {
    sets?: string
    reps?: string
    tempo?: string
    rest?: string
  },
  phase: number,
  isBeginner: boolean
): GeneratedExerciseItem {
  if (item.block === 'cooldown') {
    return {
      ...item,
      sets: item.sets || '1',
      reps: item.reps || '30s',
      tempo: item.tempo || 'Slow diaphragmatic',
      rest: item.rest || '0s',
    }
  }
  if (item.block === 'core_balance') {
    return {
      ...item,
      sets: isBeginner ? '2' : '3',
      reps: item.reps || '12–15',
      tempo: phase === 1 ? '4/2/1' : '2/0/2',
      rest: '30–45s',
    }
  }

  if (phase === 1) {
    return {
      ...item,
      sets: isBeginner ? '2' : '3',
      reps: item.reps || '12–15',
      tempo: '4/2/1',
      rest: '60s',
    }
  }
  if (phase === 2) {
    const isStability = item.supersetTag?.includes('B')
    return {
      ...item,
      sets: '3',
      reps: isStability ? '12' : '10',
      tempo: isStability ? '4/2/1' : '2/0/2',
      rest: item.supersetTag?.includes('A') ? '0s (Immediate transition to B)' : '60s',
    }
  }
  if (phase === 3) {
    return {
      ...item,
      sets: isBeginner ? '3' : '4',
      reps: item.reps || '8–12',
      tempo: '2/0/2',
      rest: '60–90s',
    }
  }
  if (phase === 4) {
    return {
      ...item,
      sets: '4–5',
      reps: '3–5',
      tempo: '1/1/1',
      rest: '3 min',
    }
  }
  // Phase 5
  const isPower = item.supersetTag?.includes('B')
  return {
    ...item,
    sets: '4',
    reps: isPower ? '8–10' : '3–5',
    tempo: isPower ? 'Max Explosive Velocity' : '1/1/1',
    rest: item.supersetTag?.includes('A') ? '0s (Immediate transition to B)' : '2–3 min',
  }
}

/**
 * Crafts a split-specific workout day (focus title + tailored exercise sequence + personalized whyForYou)
 * when the client or RAG engine specifies a `TrainingSplitId`.
 */
export function buildSplitSpecificExercises(params: {
  splitId: TrainingSplitId
  dayIndex: number
  totalDays: number
  phase: number
  goal: string
  equipment: string[]
  benchmarks?: Record<string, { weightLbs: number; reps: number }>
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
}): { focus: string; exercises: GeneratedExerciseItem[] } {
  const { splitId, dayIndex, phase, goal, equipment, benchmarks, experienceLevel } = params
  const isBeginner = experienceLevel === 'beginner'
  const eq = parseEquipmentCapabilities(equipment)

  const rawBench1RM = benchmarks?.['Bench Press']
    ? calculateOneRepMax(benchmarks['Bench Press'].weightLbs, benchmarks['Bench Press'].reps)
    : undefined
  const rawSquat1RM = benchmarks?.['Squat']
    ? calculateOneRepMax(benchmarks['Squat'].weightLbs, benchmarks['Squat'].reps)
    : undefined
  const rawDeadlift1RM = benchmarks?.['Deadlift']
    ? calculateOneRepMax(benchmarks['Deadlift'].weightLbs, benchmarks['Deadlift'].reps)
    : undefined

  const goalLabel = String(goal || 'general_fitness').replace(/_/g, ' ')

  // Helper movement selectors adapted to client equipment
  const primaryChestPress = eq.hasBarbell && eq.hasBench
    ? 'Barbell Bench Press'
    : eq.hasDumbbells
    ? 'Dumbbell Bench Press'
    : eq.hasBands
    ? 'Band Push Up'
    : 'Push Up'

  const inclineOrAltChestPress = eq.hasDumbbells && eq.hasBench
    ? 'Incline Dumbbell Bench Press'
    : eq.hasBarbell && eq.hasBench
    ? 'Incline Barbell Bench Press'
    : eq.hasDumbbells
    ? 'Single Arm Dumbbell Chest Press'
    : 'Incline Push Up'

  const primaryOverheadPress = eq.hasDumbbells
    ? 'Dumbbell Overhead Press'
    : eq.hasBarbell
    ? 'Barbell Overhead Press'
    : eq.hasBands
    ? 'Standing Scaption'
    : 'Pike Push Up'

  const lateralShoulder = eq.hasDumbbells
    ? 'Dumbbell Lateral Raise'
    : 'Single Leg Scaption'

  const primaryTriceps = eq.hasCables
    ? 'Cable Crossover'
    : eq.hasDumbbells
    ? 'Supported Bent Over Dumbbell Extension'
    : 'Bench Dips'

  const primaryHorizontalRow = eq.hasCables
    ? 'Seated Row'
    : eq.hasBarbell
    ? 'Bent Over Barbel Row Supinated'
    : eq.hasDumbbells
    ? 'Dumbbell Bent Over Row'
    : eq.hasBands
    ? 'Standing Tubing Row'
    : 'Floor Prone Cobra'

  const secondaryRow = eq.hasDumbbells
    ? 'Supported Bent Over Dumbbell Row'
    : eq.hasCables
    ? 'Seated Machine Row Close Grip'
    : eq.hasBands
    ? 'Standing Tubing Row'
    : 'Floor Prone Cobra'

  const primaryVerticalPull = eq.hasPullupBar && !isBeginner
    ? 'Pull Up'
    : eq.hasPullupBar && eq.hasBands
    ? 'Band Assisted Pull Up'
    : eq.hasDumbbells
    ? 'Dumbbell Bent Over Row'
    : 'Standing Tubing Row'

  const posteriorDeltOrFacePull = eq.hasCables
    ? 'Face Pull'
    : eq.hasDumbbells
    ? 'Bent Over Dumbbell Rear Fly'
    : 'Floor Prone Cobra'

  const primaryBiceps = eq.hasDumbbells
    ? 'Dumbbell Hammer Curl'
    : eq.hasBarbell
    ? 'Barbell Bicep Curl'
    : 'Standing Tubing Row'

  const primarySquat = eq.hasBarbell && eq.hasSquatRack && !isBeginner
    ? 'Barbell Back Squat'
    : eq.hasDumbbells
    ? 'Goblet Squat'
    : 'Box Squat'

  const secondaryQuadUnilateral = eq.hasDumbbells && !isBeginner
    ? 'Bulgarian Split Squat'
    : eq.hasDumbbells
    ? 'Reverse Lunge'
    : 'Step Up To Balance'

  const primaryHinge = eq.hasBarbell && !isBeginner
    ? 'Barbell Deadlift'
    : eq.hasDumbbells
    ? 'Dumbbell Romanian Deadlift'
    : 'Single Leg Romanian Deadlift'

  const primaryGluteBridge = eq.hasDumbbells || eq.hasBarbell
    ? 'Floor Bridge'
    : 'Single Leg Floor Bridge'

  const rawItems: Array<
    Omit<GeneratedExerciseItem, 'sets' | 'reps' | 'tempo' | 'rest'> & {
      sets?: string
      reps?: string
      tempo?: string
      rest?: string
    }
  > = []

  let focus = 'Total-Body Integration'

  if (splitId === 'push_pull_4day') {
    const isPushDay = dayIndex % 2 === 1
    const isVariantB = dayIndex >= 3

    if (isPushDay) {
      focus = isVariantB
        ? 'Push B: Incline/Overhead Press, Unilateral Quads & Triceps'
        : 'Push A: Horizontal Chest Press, Quad Squat, Delts & Triceps'

      rawItems.push(
        {
          block: 'core_balance',
          name: isVariantB ? 'Plank With Arm Reach' : 'Dead Bug',
          coachingCues: ['Brace core with drawing-in maneuver before initiating anterior push loading'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 16 (Core Stabilization)',
          whyForYou: `Primes lumbopelvic stability before your ${focus.split(':')[0]} compound pressing and squatting.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? secondaryQuadUnilateral : primarySquat,
          intensityPercentage1RM: 0.78,
          targetLoadLbs: !isVariantB ? loadFrom1RM(rawSquat1RM, 0.78) : undefined,
          coachingCues: ['Track knees in line with 2nd and 3rd toes', 'Control eccentric lowering'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21 (Anterior Chain Push Pattern)',
          whyForYou: `Targets quadriceps and glutes on Push day so your posterior chain recovers completely for Pull day.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? inclineOrAltChestPress : primaryChestPress,
          intensityPercentage1RM: 0.78,
          targetLoadLbs: !isVariantB ? loadFrom1RM(rawBench1RM, 0.78) : undefined,
          coachingCues: ['Retract and depress shoulder blades into bench', 'Maintain 45° elbow path'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21 (Horizontal Push Progression)',
          whyForYou: `Primary upper-body horizontal press matched to your ${eq.summaryLabel} for ${goalLabel}.`,
        },
        {
          block: 'resistance',
          name: primaryOverheadPress,
          intensityPercentage1RM: 0.72,
          coachingCues: ['Keep ribcage stacked over pelvis; avoid lumbar hyperextension'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21 (Vertical Push Progression)',
          whyForYou: `Develops anterior and medial deltoid strength across the vertical pushing plane.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? primaryTriceps : lateralShoulder,
          intensityPercentage1RM: 0.68,
          coachingCues: ['Isolate target musculature with zero momentum or torso swing'],
          nasmClinicalSource: 'NASM CPT-7 Muscular Development Suite',
          whyForYou: `Completes your Push kinetic chain volume for shoulder stability and elbow extension.`,
        }
      )
    } else {
      focus = isVariantB
        ? 'Pull B: Vertical Pull, Glute Bridge, Unilateral Hinge & Biceps'
        : 'Pull A: Posterior Hip Hinge, Horizontal Row, Rear Delts & Biceps'

      rawItems.push(
        {
          block: 'core_balance',
          name: isVariantB ? 'Single Leg Balance Reach Frontal Plane' : 'Bird Dog',
          coachingCues: ['Engage posterior oblique sling from glute through contralateral lat'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 16 & 17 (Core & Balance)',
          whyForYou: `Activates spinal erectors and single-leg stabilizers prior to posterior chain pulling.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? primaryGluteBridge : primaryHinge,
          intensityPercentage1RM: 0.78,
          targetLoadLbs: !isVariantB ? loadFrom1RM(rawDeadlift1RM, 0.75) : undefined,
          coachingCues: ['Hinge from hips with neutral spine', 'Drive heels through floor on lockout'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21 (Hip Hinge & Posterior Chain)',
          whyForYou: `Anchors your Pull day with hamstrings and glutes to eliminate axial overlap with Push day squats.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? primaryVerticalPull : primaryHorizontalRow,
          intensityPercentage1RM: 0.76,
          coachingCues: ['Initiate pull by depressing and retracting scapulae', 'Pause 1s at peak contraction'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21 (Upper-Body Pull Progression)',
          whyForYou: `Builds latissimus dorsi and mid-back thickness using your ${eq.summaryLabel}.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? secondaryRow : posteriorDeltOrFacePull,
          intensityPercentage1RM: 0.7,
          coachingCues: ['Keep upper traps relaxed; drive elbows back at 45°–90°'],
          nasmClinicalSource: 'NASM CPT-7 Postural & Scapular Retraction Protocol',
          whyForYou: `Reinforces posterior shoulder health and balances your Push-day pressing volume.`,
        },
        {
          block: 'resistance',
          name: primaryBiceps,
          intensityPercentage1RM: 0.7,
          coachingCues: ['Keep elbows pinned to sides with neutral wrist alignment'],
          nasmClinicalSource: 'NASM CPT-7 Elbow Flexion Standards',
          whyForYou: `Targeted brachialis and biceps recruitment to finish your Pull session.`,
        }
      )
    }
  } else if (splitId === 'upper_lower') {
    const isUpperDay = dayIndex % 2 === 1
    const isVariantB = dayIndex >= 3

    if (isUpperDay) {
      focus = isVariantB
        ? 'Upper Body B: Incline Press, Vertical Pull, Shoulders & Arms'
        : 'Upper Body A: Horizontal Press, Row, Overhead & Core'

      rawItems.push(
        {
          block: 'core_balance',
          name: isVariantB ? 'Plank Walkup' : 'Dead Bug',
          coachingCues: ['Maintain rigid lumbopelvic cylinder throughout'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 16',
          whyForYou: `Stabilizes your trunk before bilateral and unilateral upper-body loading.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? inclineOrAltChestPress : primaryChestPress,
          intensityPercentage1RM: 0.78,
          targetLoadLbs: !isVariantB ? loadFrom1RM(rawBench1RM, 0.78) : undefined,
          supersetPairWith: phase === 2 ? 'Push Up' : undefined,
          supersetTag: phase === 2 ? 'Strength 1A' : undefined,
          coachingCues: ['Controlled eccentric descent; drive powerfully through palms'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21',
          whyForYou: `Primary horizontal pushing compound lift for upper-body strength and ${goalLabel}.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? primaryVerticalPull : primaryHorizontalRow,
          intensityPercentage1RM: 0.78,
          coachingCues: ['Full scapular retraction at peak contraction'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21',
          whyForYou: `Antagonist back pull paired 1:1 with pressing to maintain shoulder joint centration.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? lateralShoulder : primaryOverheadPress,
          intensityPercentage1RM: 0.72,
          coachingCues: ['Press in scapular plane with neutral cervical posture'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21',
          whyForYou: `Builds three-dimensional deltoid strength and overhead scapular upward rotation.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? primaryBiceps : posteriorDeltOrFacePull,
          intensityPercentage1RM: 0.7,
          coachingCues: ['Strict tempo with zero trunk momentum'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21',
          whyForYou: `Completes upper-extremity volume while protecting elbow and rotator cuff tendons.`,
        }
      )
    } else {
      focus = isVariantB
        ? 'Lower Body B: Posterior Hip Hinge, Glutes & Unilateral Balance'
        : 'Lower Body A: Knee-Dominant Squat, Split Squat & Calves'

      rawItems.push(
        {
          block: 'core_balance',
          name: isVariantB ? 'Single Leg Balance Reach Frontal Plane' : 'Bird Dog',
          coachingCues: ['Lock glute medius on stance leg to keep pelvis level'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 17',
          whyForYou: `Activates hip abductors and deep core stabilizers before lower-body loading.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? primaryHinge : primarySquat,
          intensityPercentage1RM: 0.8,
          targetLoadLbs: isVariantB ? loadFrom1RM(rawDeadlift1RM, 0.75) : loadFrom1RM(rawSquat1RM, 0.78),
          coachingCues: ['Maintain neutral spine and drive through full foot tripod'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21',
          whyForYou: isVariantB
            ? `Primary posterior-chain hinge targeting hamstrings, glutes, and erector spinae.`
            : `Primary knee-dominant compound lift for lower-body force production.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? primaryGluteBridge : secondaryQuadUnilateral,
          intensityPercentage1RM: 0.75,
          coachingCues: ['Pause 1–2s at peak glute/quad contraction; prevent knee valgus'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 21',
          whyForYou: `Addresses bilateral limb asymmetries and fortifies knee and hip stability.`,
        },
        {
          block: 'resistance',
          name: isVariantB ? 'Single Leg Romanian Deadlift' : 'Prisoner Squat Calf Raise',
          intensityPercentage1RM: 0.68,
          coachingCues: ['Controlled 3-second eccentric phase'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 17 & 21',
          whyForYou: `Develops ankle plantarflexion and single-leg posterior chain resilience.`,
        }
      )
    }
  } else if (splitId === 'push_pull_legs') {
    const mod = (dayIndex - 1) % 3
    const isCycleB = dayIndex > 3

    if (mod === 0) {
      focus = isCycleB
        ? 'Push B: Incline Press, Overhead Shoulder & Triceps Hypertrophy'
        : 'Push A: Chest, Anterior/Lateral Deltoids & Triceps'

      rawItems.push(
        {
          block: 'core_balance',
          name: 'Dead Bug',
          coachingCues: ['Keep lower ribs pinned down to mat'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 16',
          whyForYou: `Establishes anti-extension core control for overhead and horizontal pressing.`,
        },
        {
          block: 'resistance',
          name: isCycleB ? inclineOrAltChestPress : primaryChestPress,
          intensityPercentage1RM: 0.78,
          targetLoadLbs: !isCycleB ? loadFrom1RM(rawBench1RM, 0.78) : undefined,
          coachingCues: ['Full pectoral stretch on eccentric; explosive concentric press'],
          nasmClinicalSource: 'CPT7_Muscle_Gain1.pdf',
          whyForYou: `Primary sternal and clavicular pectoral compound movement.`,
        },
        {
          block: 'resistance',
          name: primaryOverheadPress,
          intensityPercentage1RM: 0.75,
          coachingCues: ['Drive dumbbells/barbell overhead in line with ears'],
          nasmClinicalSource: 'CPT7_Muscle_Gain3.pdf',
          whyForYou: `Builds anterior and medial deltoid hypertrophy and overhead lockout strength.`,
        },
        {
          block: 'resistance',
          name: lateralShoulder,
          intensityPercentage1RM: 0.68,
          coachingCues: ['Lead with elbows in scapular plane'],
          nasmClinicalSource: 'CPT7_Muscle_Gain5.pdf',
          whyForYou: `Targets medial deltoid width and supraspinatus endurance.`,
        },
        {
          block: 'resistance',
          name: primaryTriceps,
          intensityPercentage1RM: 0.7,
          coachingCues: ['Keep upper arms stationary; lock out elbows under control'],
          nasmClinicalSource: 'CPT7_Muscle_Gain6.pdf',
          whyForYou: `Isolates all three heads of the triceps brachii to finish Push day.`,
        }
      )
    } else if (mod === 1) {
      focus = isCycleB
        ? 'Pull B: Vertical Lat Width, Posterior Deltoids & Biceps'
        : 'Pull A: Lats, Upper Back Thickness, Rear Delts & Biceps'

      rawItems.push(
        {
          block: 'core_balance',
          name: 'Bird Dog',
          coachingCues: ['Extend opposite arm and leg with zero pelvic rotation'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 16',
          whyForYou: `Engages posterior oblique subsystem prior to heavy back pulling.`,
        },
        {
          block: 'resistance',
          name: isCycleB ? primaryVerticalPull : primaryHorizontalRow,
          intensityPercentage1RM: 0.78,
          coachingCues: ['Drive elbows down and back toward hips'],
          nasmClinicalSource: 'CPT7_Muscle_Gain2.pdf',
          whyForYou: `Primary compound back builder matched to your ${eq.summaryLabel}.`,
        },
        {
          block: 'resistance',
          name: isCycleB ? secondaryRow : primaryVerticalPull,
          intensityPercentage1RM: 0.75,
          coachingCues: ['Squeeze rhomboids and middle trapezius for 1s at peak'],
          nasmClinicalSource: 'CPT7_Muscle_Gain4.pdf',
          whyForYou: `Combines vertical and horizontal pulling planes for complete back development.`,
        },
        {
          block: 'resistance',
          name: posteriorDeltOrFacePull,
          intensityPercentage1RM: 0.68,
          coachingCues: ['Externally rotate shoulders at end range'],
          nasmClinicalSource: 'CPT7_Muscle_Gain7.pdf',
          whyForYou: `Develops posterior deltoids and external rotators for posture and shoulder longevity.`,
        },
        {
          block: 'resistance',
          name: primaryBiceps,
          intensityPercentage1RM: 0.72,
          coachingCues: ['Controlled 2-second lowering with zero shoulder swing'],
          nasmClinicalSource: 'CPT7_Muscle_Gain8.pdf',
          whyForYou: `Maximizes biceps brachii and brachioradialis tension at the end of Pull day.`,
        }
      )
    } else {
      focus = isCycleB
        ? 'Legs B: Posterior Chain Hinge, Glute Thrust & Unilateral Stability'
        : 'Legs A: Quadriceps Squat, Hamstring Hinge, Glutes & Calves'

      rawItems.push(
        {
          block: 'core_balance',
          name: 'Single Leg Balance Reach Frontal Plane',
          coachingCues: ['Maintain tripod foot contact and level hips'],
          nasmClinicalSource: 'NASM CPT-7 Ch. 17',
          whyForYou: `Primes ankle, knee, and hip mechanoreceptors before lower-body compound lifts.`,
        },
        {
          block: 'resistance',
          name: isCycleB ? primaryHinge : primarySquat,
          intensityPercentage1RM: 0.8,
          targetLoadLbs: isCycleB ? loadFrom1RM(rawDeadlift1RM, 0.75) : loadFrom1RM(rawSquat1RM, 0.78),
          coachingCues: ['Brace core 360° and drive forcefully through mid-foot'],
          nasmClinicalSource: 'CPT7_Muscle_Gain9.pdf',
          whyForYou: `Anchor lower-body compound lift for maximal mechanical tension.`,
        },
        {
          block: 'resistance',
          name: isCycleB ? secondaryQuadUnilateral : primaryHinge,
          intensityPercentage1RM: 0.75,
          coachingCues: ['Full eccentric hamstring stretch with neutral lumbar spine'],
          nasmClinicalSource: 'CPT7_Muscle_Gain10.pdf',
          whyForYou: `Balances anterior quad and posterior hamstring recruitment within your Legs session.`,
        },
        {
          block: 'resistance',
          name: primaryGluteBridge,
          intensityPercentage1RM: 0.75,
          coachingCues: ['Pause 2 seconds at full hip extension'],
          nasmClinicalSource: 'CPT7_Muscle_Gain11.pdf',
          whyForYou: `Directly loads gluteus maximus in shortened range for hip power and pelvic stability.`,
        },
        {
          block: 'resistance',
          name: 'Prisoner Squat Calf Raise',
          intensityPercentage1RM: 0.68,
          coachingCues: ['Pause 1s at peak plantarflexion'],
          nasmClinicalSource: 'CPT7_Muscle_Gain12.pdf',
          whyForYou: `Strengthens gastrocnemius and soleus for ankle stability.`,
        }
      )
    }
  } else if (splitId === 'metabolic_contrast') {
    const isVariantB = dayIndex % 2 === 0
    focus = isVariantB
      ? `Metabolic PHA Contrast B: Posterior Hinge, Overhead Push & Core Conditioning`
      : `Metabolic PHA Contrast A: Squat, Horizontal Push/Pull & EPOC Finisher`

    rawItems.push(
      {
        block: 'core_balance',
        name: isVariantB ? 'Plank With Arm Reach' : 'Dead Bug',
        coachingCues: ['Continuous rhythmic breathing while bracing core'],
        nasmClinicalSource: 'CPT7_Fat_Loss1.pdf',
        whyForYou: `Activates deep core musculature ahead of Peripheral Heart Action (PHA) supersets.`,
      },
      {
        block: 'resistance',
        name: isVariantB ? primaryHinge : primarySquat,
        supersetPairWith: isVariantB ? primaryOverheadPress : primaryChestPress,
        supersetTag: 'PHA 1A',
        intensityPercentage1RM: 0.72,
        coachingCues: ['Transition immediately to upper-body movement to drive Peripheral Heart Action blood shunting'],
        nasmClinicalSource: 'CPT7_Fat_Loss4.pdf (Peripheral Heart Action)',
        whyForYou: `Lower-body compound driver paired with an upper-body press to maximize caloric burn and vascular demand.`,
      },
      {
        block: 'resistance',
        name: isVariantB ? primaryOverheadPress : primaryChestPress,
        supersetPairWith: isVariantB ? primaryHinge : primarySquat,
        supersetTag: 'PHA 1B',
        intensityPercentage1RM: 0.72,
        coachingCues: ['Maintain crisp posture under metabolic fatigue'],
        nasmClinicalSource: 'CPT7_Fat_Loss4.pdf (Peripheral Heart Action)',
        whyForYou: `Shunts blood flow from lower extremities to upper torso to elevate EPOC and metabolic rate.`,
      },
      {
        block: 'resistance',
        name: isVariantB ? secondaryQuadUnilateral : primaryGluteBridge,
        supersetPairWith: isVariantB ? secondaryRow : primaryHorizontalRow,
        supersetTag: 'PHA 2A',
        intensityPercentage1RM: 0.7,
        coachingCues: ['Smooth kinetic control; zero rest before row'],
        nasmClinicalSource: 'CPT7_Fat_Loss6.pdf',
        whyForYou: `Second lower-body PHA pair sustaining lean muscle retention during fat loss.`,
      },
      {
        block: 'resistance',
        name: isVariantB ? secondaryRow : primaryHorizontalRow,
        supersetPairWith: isVariantB ? secondaryQuadUnilateral : primaryGluteBridge,
        supersetTag: 'PHA 2B',
        intensityPercentage1RM: 0.7,
        coachingCues: ['Retract shoulder blades and exhale forcefully on concentric pull'],
        nasmClinicalSource: 'CPT7_Fat_Loss6.pdf',
        whyForYou: `Balances anterior pushing with posterior back musculature while keeping heart rate in Zone 2.`,
      }
    )
  } else {
    // full_body (Total-Body Kinetic Integration rotating A / B / C)
    const variantIdx = (dayIndex - 1) % 3
    const titles = [
      'Total-Body A: Squat, Horizontal Press, Row & Core Stabilization',
      'Total-Body B: Posterior Hinge, Incline/Overhead Press, Vertical Pull & Balance',
      'Total-Body C: Unilateral Lunge, Glute Bridge, Multiplanar Push/Pull & Core',
    ]
    focus = titles[variantIdx]

    rawItems.push(
      {
        block: 'core_balance',
        name: variantIdx === 0 ? 'Dead Bug' : variantIdx === 1 ? 'Bird Dog' : 'Plank With Arm Reach',
        coachingCues: ['Engage transverse abdominis before initiating limb movement'],
        nasmClinicalSource: 'NASM CPT-7 Ch. 16',
        whyForYou: `Primes intervertebral stability prior to total-body compound patterns.`,
      },
      {
        block: 'resistance',
        name: variantIdx === 0 ? primarySquat : variantIdx === 1 ? primaryHinge : secondaryQuadUnilateral,
        intensityPercentage1RM: 0.75,
        targetLoadLbs:
          variantIdx === 0
            ? loadFrom1RM(rawSquat1RM, 0.75)
            : variantIdx === 1
            ? loadFrom1RM(rawDeadlift1RM, 0.72)
            : undefined,
        coachingCues: ['Maintain neutral knee and hip alignment throughout full range'],
        nasmClinicalSource: 'NASM CPT-7 Ch. 21',
        whyForYou: `Primary lower-body pattern rotated across the week so every session hits fresh motor units.`,
      },
      {
        block: 'resistance',
        name: variantIdx === 0 ? primaryChestPress : variantIdx === 1 ? primaryOverheadPress : inclineOrAltChestPress,
        intensityPercentage1RM: 0.75,
        targetLoadLbs: variantIdx === 0 ? loadFrom1RM(rawBench1RM, 0.75) : undefined,
        coachingCues: ['Stabilize shoulder girdle and control the eccentric phase'],
        nasmClinicalSource: 'NASM CPT-7 Ch. 21',
        whyForYou: `Upper-body pushing progression tailored to your ${eq.summaryLabel}.`,
      },
      {
        block: 'resistance',
        name: variantIdx === 0 ? primaryHorizontalRow : variantIdx === 1 ? primaryVerticalPull : secondaryRow,
        intensityPercentage1RM: 0.75,
        coachingCues: ['Initiate pull from scapular retractors; avoid shrugging upper traps'],
        nasmClinicalSource: 'NASM CPT-7 Ch. 21',
        whyForYou: `Balances pushing volume and strengthens posterior posture across your full-body schedule.`,
      },
      {
        block: 'resistance',
        name: variantIdx === 0 ? primaryGluteBridge : variantIdx === 1 ? secondaryQuadUnilateral : posteriorDeltOrFacePull,
        intensityPercentage1RM: 0.7,
        coachingCues: ['Pause 1–2 seconds at peak contraction for neuromuscular control'],
        nasmClinicalSource: 'NASM CPT-7 Ch. 17 & 21',
        whyForYou: `Complementary kinetic chain movement rounding out your total-body session.`,
      }
    )
  }

  // Append cooldown stretch
  rawItems.push({
    block: 'cooldown',
    name: 'Static Kneeling Hip Flexor Stretch',
    sets: '1',
    reps: '30s',
    tempo: 'Slow diaphragmatic',
    rest: '0s',
    coachingCues: ['Inhale 4 seconds, exhale 6 seconds to trigger parasympathetic recovery. Hold static for 30s per side.'],
    nasmClinicalSource: 'NASM CPT-7 Ch. 14 (Flexibility Continuum)',
    whyForYou: 'Restores hip extension length and initiates post-workout parasympathetic recovery.',
  })

  const exercises = rawItems.map(item => applyPhaseAcuteVariables(item, phase, isBeginner))
  return { focus, exercises }
}
