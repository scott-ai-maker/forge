/**
 * Executive Travel & Hotel Gym Workout Adapter
 * Recalibrates full barbell workout plans into constrained hotel equipment scenarios while preserving target OPT phase stimulus.
 */

export type TravelLocationScenario =
  | 'hotel_dumbbells_only'
  | 'hotel_cables_cardio'
  | 'hotel_room_bands'
  | 'commercial_full_gym'

export interface ExercisePlanItem {
  id?: string
  name: string
  sets: number | string
  reps: string
  tempo?: string
  restSeconds?: number
  coachingCue?: string
  originalBarbellName?: string
  originalTempo?: string
  originalReps?: string
  originalNotes?: string
  notes?: string
}

export interface TravelSubstitutionRule {
  targetExercise: string
  substitutions: Record<TravelLocationScenario, {
    name: string
    tempo: string
    reps: string
    coachingCue: string
  }>
}

export const TRAVEL_SUBSTITUTION_RULES: TravelSubstitutionRule[] = [
  {
    targetExercise: 'Barbell Back Squat',
    substitutions: {
      commercial_full_gym: {
        name: 'Barbell Back Squat',
        tempo: '4/2/1',
        reps: '8-12',
        coachingCue: 'Drive chest through bar, spread the floor with glute medius.',
      },
      hotel_dumbbells_only: {
        name: 'DB Goblet Squat (Pause in Hole)',
        tempo: '4/3/1',
        reps: '12-15',
        coachingCue: 'Hold 3-second isometric pause at parallel to maximize motor unit recruitment with lighter load.',
      },
      hotel_cables_cardio: {
        name: 'Cable Goblet Squat with Low Pulley',
        tempo: '4/2/1',
        reps: '12-15',
        coachingCue: 'Maintain continuous horizontal tension from cable to engage core & glutes.',
      },
      hotel_room_bands: {
        name: 'Banded Single-Leg Bulgarian Split Squat (Bed/Chair elevated)',
        tempo: '4/2/1',
        reps: '12-15/leg',
        coachingCue: 'Elevate rear foot on hotel bed; loop band under front foot for peak quadriceps overload.',
      },
    },
  },
  {
    targetExercise: 'Barbell Conventional Deadlift',
    substitutions: {
      commercial_full_gym: {
        name: 'Barbell Conventional Deadlift',
        tempo: '3/1/1',
        reps: '6-8',
        coachingCue: 'Pack lats into back pockets, wedge hips, pull slack.',
      },
      hotel_dumbbells_only: {
        name: 'Double DB Romanian Deadlift (RDL)',
        tempo: '4/2/1',
        reps: '10-12',
        coachingCue: 'Push hips back to hotel wall; feel massive hamstring stretch without lumbar flexion.',
      },
      hotel_cables_cardio: {
        name: 'Cable Pull-Through (Low Pulley)',
        tempo: '3/2/1',
        reps: '12-15',
        coachingCue: 'Face away from cable station; violently snap hips forward into glute contraction.',
      },
      hotel_room_bands: {
        name: 'Heavy Banded Good Mornings + Single-Leg Bodyweight RDL',
        tempo: '3/2/1',
        reps: '15 reps',
        coachingCue: 'Loop heavy loop band around neck and feet; hinge strictly at hips.',
      },
    },
  },
  {
    targetExercise: 'Barbell Bench Press',
    substitutions: {
      commercial_full_gym: {
        name: 'Barbell Bench Press',
        tempo: '3/1/1',
        reps: '6-10',
        coachingCue: 'Retract scapulae into bench, 45° elbow tuck.',
      },
      hotel_dumbbells_only: {
        name: 'Flat DB Chest Press with 2s Stretch Pause',
        tempo: '4/2/1',
        reps: '10-12',
        coachingCue: 'Control deep 4-second descent to maximize pectoral stretch with hotel dumbbells.',
      },
      hotel_cables_cardio: {
        name: 'Standing Dual-Cable Chest Press',
        tempo: '3/1/1',
        reps: '12-15',
        coachingCue: 'Staggered stance, drive cables together with peak chest squeeze.',
      },
      hotel_room_bands: {
        name: 'Banded Deficit Push-ups (Hands on hotel luggage/books)',
        tempo: '3/2/1',
        reps: '15-20',
        coachingCue: 'Wrap band around upper back for accommodating resistance at lockout.',
      },
    },
  },
  {
    targetExercise: 'Barbell Overhead Press',
    substitutions: {
      commercial_full_gym: {
        name: 'Barbell Overhead Press',
        tempo: '3/1/1',
        reps: '6-8',
        coachingCue: 'Glutes locked, press vertically in tight scapular plane.',
      },
      hotel_dumbbells_only: {
        name: 'Standing Neutral-Grip DB Overhead Press',
        tempo: '4/1/1',
        reps: '10-12',
        coachingCue: 'Palms facing each other to protect shoulder subacromial space.',
      },
      hotel_cables_cardio: {
        name: 'Half-Kneeling Single-Arm Cable Overhead Press',
        tempo: '3/1/1',
        reps: '10-12/arm',
        coachingCue: 'Brace core to resist torso rotation while pressing overhead.',
      },
      hotel_room_bands: {
        name: 'Standing Resistance Band Overhead Press',
        tempo: '3/1/1',
        reps: '12-15',
        coachingCue: 'Step onto band with both feet; press through full shoulder flexion.',
      },
    },
  },
  {
    targetExercise: 'Barbell Bent-Over Row',
    substitutions: {
      commercial_full_gym: {
        name: 'Barbell Bent-Over Row',
        tempo: '3/1/1',
        reps: '8-10',
        coachingCue: 'Drive elbows back, squeeze lats at ribcage.',
      },
      hotel_dumbbells_only: {
        name: 'Single-Arm DB Row (Bench Supported)',
        tempo: '3/2/1',
        reps: '10-12/arm',
        coachingCue: 'Hold 2-second peak lat contraction at top before slow 3s descent.',
      },
      hotel_cables_cardio: {
        name: 'Seated Cable Row with Close-Grip V-Bar',
        tempo: '3/1/1',
        reps: '10-12',
        coachingCue: 'Keep chest tall; pull handles to lower sternum.',
      },
      hotel_room_bands: {
        name: 'Seated Banded Row (Loop around hotel room desk/feet)',
        tempo: '3/2/1',
        reps: '15-18',
        coachingCue: 'Sit with tall posture, squeeze shoulder blades together for 2s.',
      },
    },
  },
]

const ALREADY_DUMBBELL_OR_BODYWEIGHT_RE =
  /\b(db|dumbbell|dumbbells|goblet|kettlebell|kb|plank|push-?up|pushup|bodyweight|band|banded|bird\s*dog|dead\s*bug|glute\s*bridge|wall\s*slide|chin\s*tuck|hollow|lunge)\b/i

const ALREADY_BODYWEIGHT_ONLY_RE =
  /\b(bodyweight|plank|push-?up|pushup|bird\s*dog|dead\s*bug|glute\s*bridge|wall\s*slide|chin\s*tuck|hollow|mountain\s*climber|burpee|calisthenic|prone\s*y-t-w|pike\s*push)\b/i

const REQUIRES_COMMERCIAL_GYM_EQUIPMENT_RE =
  /\b(barbell|bb|smith|leg\s*press|hack\s*squat|machine|lat\s*pulldown|cable|pec\s*deck|preacher|pendlay|trap\s*bar|t-bar)\b/i

function stripBarbellPrefix(name: string): string {
  return name.replace(/\b(barbell|bb)\b\s*/gi, '').replace(/\s{2,}/g, ' ').trim()
}

export function adaptExerciseForTravel(
  exerciseName: string,
  scenario: TravelLocationScenario
): { name: string; tempo: string; reps: string; coachingCue: string } {
  const safeName = typeof exerciseName === 'string' && exerciseName.trim() ? exerciseName.trim() : 'Compound Movement'

  const matchedRule = TRAVEL_SUBSTITUTION_RULES.find(rule =>
    safeName.toLowerCase().includes(rule.targetExercise.toLowerCase()) ||
    rule.targetExercise.toLowerCase().includes(safeName.toLowerCase())
  )

  if (matchedRule && matchedRule.substitutions && matchedRule.substitutions[scenario]) {
    return matchedRule.substitutions[scenario]
  }

  if (scenario === 'commercial_full_gym') {
    return {
      name: safeName,
      tempo: '3/1/1',
      reps: '8-12',
      coachingCue: 'Standard full-gym protocol execution.',
    }
  }

  // Fallback generic travel substitution
  if (scenario === 'hotel_dumbbells_only') {
    const cleanCore = stripBarbellPrefix(safeName) || safeName
    const nextName = ALREADY_DUMBBELL_OR_BODYWEIGHT_RE.test(safeName)
      ? safeName
      : `DB ${cleanCore}`
    return {
      name: nextName,
      tempo: '4/2/1',
      reps: '12-15',
      coachingCue: 'Execute with slower 4-second eccentric tempo to match barbell intensity with available dumbbells.',
    }
  }

  if (scenario === 'hotel_room_bands') {
    const cleanCore = stripBarbellPrefix(safeName) || safeName
    const nextName = /\b(band|banded|bodyweight|plank|push-?up|pushup|bird\s*dog|dead\s*bug)\b/i.test(safeName)
      ? safeName
      : `Banded / Bodyweight ${cleanCore}`
    return {
      name: nextName,
      tempo: '3/2/1',
      reps: '15-20',
      coachingCue: 'Focus on maximum muscular tension and 2-second peak isometric squeeze on every rep.',
    }
  }

  const cleanCore = stripBarbellPrefix(safeName) || safeName
  const nextCableName = /\b(cable|plank|push-?up|pushup|bird\s*dog|dead\s*bug)\b/i.test(safeName)
    ? safeName
    : `Cable ${cleanCore}`
  return {
    name: nextCableName,
    tempo: '3/1/1',
    reps: '12-15',
    coachingCue: 'Utilize continuous cable tension throughout full active range of motion.',
  }
}

/**
 * Pure zero-equipment bodyweight calisthenics substitution (for `bodyweight_only` environment profile —
 * never requires resistance bands, dumbbells, benches, or hotel cable towers).
 */
export function adaptExerciseForBodyweightOnly(
  exerciseName: string
): { name: string; tempo: string; reps: string; coachingCue: string } {
  const safeName = typeof exerciseName === 'string' && exerciseName.trim() ? exerciseName.trim() : 'Compound Movement'
  if (ALREADY_BODYWEIGHT_ONLY_RE.test(safeName) && !/\bbanded?\b/i.test(safeName)) {
    return {
      name: safeName,
      tempo: '3/2/1',
      reps: '12-16',
      coachingCue: 'Maintain strict postural alignment and full range of motion.',
    }
  }

  const lower = safeName.toLowerCase()
  if (/\b(squat|leg\s*press|hack|quad|step-?up)\b/.test(lower)) {
    return {
      name: 'Bodyweight Rear-Foot-Elevated Split Squat',
      tempo: '4/2/1',
      reps: '12-15/leg',
      coachingCue: '4-second descent with 2-second bottom pause to maximize single-leg quad & glute recruitment.',
    }
  }
  if (/\b(deadlift|rdl|romanian|hinge|good\s*morning|hamstring|hip\s*thrust)\b/.test(lower)) {
    return {
      name: 'Single-Leg Bodyweight Romanian Hinge & Glute Bridge',
      tempo: '3/2/1',
      reps: '12-15/leg',
      coachingCue: 'Keep pelvis square to the floor and hold a 2-second glute squeeze at lockout.',
    }
  }
  if (/\b(bench|chest|pec|fly|incline\s*press|floor\s*press)\b/.test(lower)) {
    return {
      name: 'Tempo Deficit Push-Up (3s Eccentric + 2s Pause)',
      tempo: '3/2/1',
      reps: '12-18',
      coachingCue: 'Tuck elbows 45°, pause 2 seconds just above the floor, and protract serratus at lockout.',
    }
  }
  if (/\b(overhead|shoulder\s*press|military|arnold|lateral\s*raise|deltoid)\b/.test(lower)) {
    return {
      name: 'Elevated Pike Shoulder Press',
      tempo: '3/1/1',
      reps: '10-14',
      coachingCue: 'Stack hips high in an inverted V and press through the scapular plane with ribs braced.',
    }
  }
  if (/\b(row|pulldown|pull-?up|chin-?up|lat|back|face\s*pull|curl)\b/.test(lower)) {
    return {
      name: 'Prone Y-T-W Scapular Row (3s Isometric Squeeze)',
      tempo: '3/3/1',
      reps: '12-15',
      coachingCue: 'Lift chest slightly, depress lower traps, and hold a 3-second mid-back contraction each rep.',
    }
  }

  const cleanCore = stripBarbellPrefix(safeName).replace(/\b(db|dumbbell|cable|machine|banded?)\b\s*/gi, '').trim() || safeName
  return {
    name: `Tempo Bodyweight ${cleanCore}`,
    tempo: '3/2/1',
    reps: '15-20',
    coachingCue: 'Use slow eccentric control and a 2-second isometric pause to drive metabolic tension without external load.',
  }
}

export interface SessionExpressEnvironmentOptions {
  environmentProfile?: 'home_gym' | 'full_gym' | 'hotel_travel' | 'bodyweight_only'
  expressModeActive?: boolean
  maxExpressExercises?: number
}

export interface AdaptableWorkoutExerciseShape {
  name: string
  sets?: string | number | null
  reps?: string | null
  tempo?: string | null
  rest?: string | null
  notes?: string | null
  description?: string | null
  block?: string | null
  alreadyManuallyAdapted?: boolean
}

/**
 * Applies live Environment Profile ('hotel_travel' | 'bodyweight_only') equipment substitutions
 * AND 20-Minute Express Mode compression (max 4 primary lifts, max 2 working sets, <=45s rest)
 * directly to a session's exercise array while preserving non-resistance blocks and manual swaps.
 */
export function applyExpressAndEnvironmentToExercises<T extends AdaptableWorkoutExerciseShape>(
  exercises: T[],
  options: SessionExpressEnvironmentOptions
): T[] {
  if (!Array.isArray(exercises) || exercises.length === 0) return []
  const env = options.environmentProfile || 'home_gym'
  const express = Boolean(options.expressModeActive)
  const maxExpressCount = options.maxExpressExercises ?? 4

  // 1. Environment substitution (only for travel / bodyweight profiles when not manually swapped)
  const envAdapted = exercises.map(ex => {
    const isNonResistanceBlock = ex.block === 'warmup' || ex.block === 'cooldown' || ex.block === 'warm-up' || ex.block === 'cool-down'
    if (isNonResistanceBlock || ex.alreadyManuallyAdapted) {
      return ex
    }

    if (env === 'hotel_travel') {
      const matchesRule = TRAVEL_SUBSTITUTION_RULES.some(
        r =>
          ex.name.toLowerCase().includes(r.targetExercise.toLowerCase()) ||
          r.targetExercise.toLowerCase().includes(ex.name.toLowerCase())
      )
      if (!matchesRule && !REQUIRES_COMMERCIAL_GYM_EQUIPMENT_RE.test(ex.name)) {
        return ex
      }
      const sub = adaptExerciseForTravel(ex.name, 'hotel_dumbbells_only')
      return {
        ...ex,
        name: sub.name,
        reps: sub.reps || ex.reps,
        tempo: sub.tempo || ex.tempo,
        notes: ex.notes || sub.coachingCue,
      }
    }

    if (env === 'bodyweight_only') {
      if (ALREADY_BODYWEIGHT_ONLY_RE.test(ex.name) && !/\bbanded?\b/i.test(ex.name)) {
        return ex
      }
      const sub = adaptExerciseForBodyweightOnly(ex.name)
      return {
        ...ex,
        name: sub.name,
        reps: sub.reps || ex.reps,
        tempo: sub.tempo || ex.tempo,
        notes: ex.notes || sub.coachingCue,
      }
    }

    return ex
  })

  if (!express) {
    return envAdapted
  }

  // 2. 20-Minute Express Mode compression: cap resistance exercises to top `maxExpressCount`,
  // compress working sets to <= 2 high-density sets, and cap rest intervals to <= 45s.
  let resistanceKept = 0
  const expressFiltered = envAdapted.filter(ex => {
    const isAuxBlock = ex.block === 'warmup' || ex.block === 'cooldown' || ex.block === 'warm-up' || ex.block === 'cool-down'
    if (isAuxBlock) return true
    if (resistanceKept < maxExpressCount) {
      resistanceKept += 1
      return true
    }
    return false
  })

  return expressFiltered.map(ex => {
    const isAuxBlock = ex.block === 'warmup' || ex.block === 'cooldown' || ex.block === 'warm-up' || ex.block === 'cool-down'
    if (isAuxBlock) return ex

    const parsedSets = parseInt(String(ex.sets ?? '3').trim(), 10)
    const compressedSetsNum = Number.isFinite(parsedSets) && parsedSets > 0 ? Math.min(parsedSets, 2) : 2
    const nextSets = typeof ex.sets === 'number' ? compressedSetsNum : String(compressedSetsNum)

    const rawRestMatch = String(ex.rest ?? '').match(/(\d+)/)
    const parsedRest = rawRestMatch ? parseInt(rawRestMatch[1], 10) : 60
    const compressedRestSec = Number.isFinite(parsedRest) && parsedRest > 0 ? Math.min(parsedRest, 45) : 45

    return {
      ...ex,
      sets: nextSets,
      rest: `${compressedRestSec}s`,
    }
  })
}

export function adaptWorkoutForTravel(
  exercises: ExercisePlanItem[],
  scenario: TravelLocationScenario
): ExercisePlanItem[] {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return []
  }

  return exercises.map(ex => {
    const sourceName = ex?.originalBarbellName || ex?.name || 'Compound Movement'
    if (scenario === 'commercial_full_gym' && ex?.originalBarbellName) {
      return {
        ...ex,
        name: ex.originalBarbellName,
        tempo: ex.originalTempo || ex.tempo,
        reps: ex.originalReps || ex.reps,
        coachingCue: ex.coachingCue,
      }
    }
    const adapted = adaptExerciseForTravel(sourceName, scenario)
    return {
      ...ex,
      originalBarbellName: sourceName,
      originalTempo: ex?.originalTempo || ex?.tempo,
      originalReps: ex?.originalReps || ex?.reps,
      name: adapted.name,
      tempo: adapted.tempo,
      reps: adapted.reps,
      coachingCue: adapted.coachingCue,
    }
  })
}

export interface AdaptedFullPlanResult {
  planTitle: string
  scenarioLabel: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  planJson: any
}

export const TRAVEL_SCENARIO_META: Record<TravelLocationScenario, { label: string; icon: string; description: string }> = {
  hotel_dumbbells_only: {
    label: 'Hotel Dumbbell Gym (15–50 lbs)',
    icon: 'barbell',
    description: 'Converts heavy barbell compounds to paused goblet squats, DB RDLs, and unilateral tempo overload.',
  },
  hotel_cables_cardio: {
    label: 'Hotel Cables & Cardio Suite',
    icon: 'assessment',
    description: 'Emphasizes continuous cable tension, cable squats/presses, and cardiovascular stage intervals.',
  },
  hotel_room_bands: {
    label: 'Hotel Room Bands & Calisthenics',
    icon: 'toolbox',
    description: 'Elevated single-leg Bulgarian split squats, banded good mornings, deficit pushups, and core stability.',
  },
  commercial_full_gym: {
    label: 'Commercial Full Gym (Standard Routine)',
    icon: 'program',
    description: 'Restores primary compound barbell lifts, squat racks, and heavy strength progression.',
  },
}

export function adaptFullPlanForTravel(
  rawPlanJson: Record<string, unknown> | null | undefined,
  scenario: TravelLocationScenario,
  basePlanTitle?: string
): AdaptedFullPlanResult {
  const scenarioMeta = TRAVEL_SCENARIO_META[scenario]
  const isRestoringStandard = scenario === 'commercial_full_gym'

  const rawWorkouts = Array.isArray(rawPlanJson?.workouts) ? rawPlanJson.workouts : []

  const adaptedWorkouts = rawWorkouts.map((w: unknown) => {
    const workoutObj = (w && typeof w === 'object' ? w : {}) as { focus?: string; exercises?: ExercisePlanItem[] }
    const originalExercises = Array.isArray(workoutObj.exercises) ? workoutObj.exercises : []
    const cleanBaseFocus = String(workoutObj.focus || 'Training Session')
      .replace(/(\s*\([^)]*Adaptation\))+$/gi, '')
      .trim() || 'Training Session'

    const adaptedExercises = originalExercises.map((ex: ExercisePlanItem) => {
      if (isRestoringStandard) {
        const originalName = ex.originalBarbellName || ex.name.replace(/^(DB|Cable|Banded \/ Bodyweight)\s+/i, '')
        const cleanRestoredNotes =
          ex.originalNotes !== undefined
            ? ex.originalNotes
            : typeof ex.notes === 'string'
              ? ex.notes
                  .replace(/^Travel Cue:\s*.+$/i, '')
                  .replace(/\s*·\s*Cue:\s*.+$/i, '')
                  .trim() || undefined
              : ex.notes
        return {
          ...ex,
          name: originalName,
          tempo: ex.originalTempo ?? ex.tempo,
          reps: ex.originalReps ?? ex.reps,
          notes: cleanRestoredNotes,
          originalBarbellName: undefined,
          originalTempo: undefined,
          originalReps: undefined,
          originalNotes: undefined,
        }
      }

      const sourceName = ex.originalBarbellName || ex.name
      const baseNotes =
        ex.originalNotes !== undefined
          ? ex.originalNotes
          : typeof ex.notes === 'string'
            ? ex.notes
                .replace(/^Travel Cue:\s*.+$/i, '')
                .replace(/\s*·\s*Cue:\s*.+$/i, '')
                .trim()
            : ''
      const adapted = adaptExerciseForTravel(sourceName, scenario)
      return {
        ...ex,
        originalBarbellName: sourceName,
        originalTempo: ex.originalTempo ?? ex.tempo,
        originalReps: ex.originalReps ?? ex.reps,
        originalNotes: baseNotes,
        name: adapted.name,
        tempo: adapted.tempo || ex.tempo,
        reps: adapted.reps || ex.reps,
        notes: baseNotes ? `${baseNotes} · Cue: ${adapted.coachingCue}` : `Travel Cue: ${adapted.coachingCue}`,
      }
    })

    const travelFocusNote = isRestoringStandard
      ? cleanBaseFocus
      : `${cleanBaseFocus} (${scenarioMeta.label.split('(')[0].trim()} Adaptation)`

    return {
      ...workoutObj,
      focus: travelFocusNote,
      exercises: adaptedExercises,
    }
  })

  const cleanBaseTitle = (basePlanTitle || 'OPT Program')
    .replace(/^\[(Travel|Hotel)[^\]]*\]\s*/i, '')
    .trim()

  const planTitle = isRestoringStandard
    ? cleanBaseTitle
    : `[Travel: ${scenarioMeta.label.split('(')[0].trim()}] ${cleanBaseTitle}`

  const planJson = {
    ...(rawPlanJson || {}),
    workouts: adaptedWorkouts,
    isTravelAdapted: !isRestoringStandard,
    travelScenario: scenario,
    travelRecalibratedAt: new Date().toISOString(),
  }

  return {
    planTitle,
    scenarioLabel: scenarioMeta.label,
    planJson,
  }
}

