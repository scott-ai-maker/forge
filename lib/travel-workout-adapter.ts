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

export function adaptExerciseForTravel(
  exerciseName: string,
  scenario: TravelLocationScenario
): { name: string; tempo: string; reps: string; coachingCue: string } {
  const safeName = typeof exerciseName === 'string' && exerciseName.trim() ? exerciseName : 'Compound Movement'

  if (scenario === 'commercial_full_gym') {
    return {
      name: safeName,
      tempo: '4/2/1',
      reps: '8-12',
      coachingCue: 'Standard full-gym protocol execution.',
    }
  }

  const matchedRule = TRAVEL_SUBSTITUTION_RULES.find(rule =>
    safeName.toLowerCase().includes(rule.targetExercise.toLowerCase()) ||
    rule.targetExercise.toLowerCase().includes(safeName.toLowerCase())
  )

  if (matchedRule && matchedRule.substitutions && matchedRule.substitutions[scenario]) {
    return matchedRule.substitutions[scenario]
  }

  // Fallback generic travel substitution
  if (scenario === 'hotel_dumbbells_only') {
    return {
      name: `DB ${safeName.replace(/Barbell/gi, 'Dumbbell')}`,
      tempo: '4/2/1',
      reps: '12-15',
      coachingCue: 'Execute with slower 4-second eccentric tempo to match barbell intensity with available dumbbells.',
    }
  }

  if (scenario === 'hotel_room_bands') {
    return {
      name: `Banded / Bodyweight ${safeName}`,
      tempo: '3/2/1',
      reps: '15-20',
      coachingCue: 'Focus on maximum muscular tension and 2-second peak isometric squeeze on every rep.',
    }
  }

  return {
    name: `Cable ${safeName}`,
    tempo: '3/1/1',
    reps: '12-15',
    coachingCue: 'Utilize continuous cable tension throughout full active range of motion.',
  }
}

export function adaptWorkoutForTravel(
  exercises: ExercisePlanItem[],
  scenario: TravelLocationScenario
): ExercisePlanItem[] {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return []
  }

  return exercises.map(ex => {
    const rawName = ex?.name || 'Compound Movement'
    const adapted = adaptExerciseForTravel(rawName, scenario)
    return {
      ...ex,
      originalBarbellName: ex?.originalBarbellName || rawName,
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
    const adaptedExercises = originalExercises.map((ex: ExercisePlanItem) => {
      if (isRestoringStandard) {
        // If restoring to commercial gym and original name exists, restore it
        const originalName = ex.originalBarbellName || ex.name.replace(/^(DB|Cable|Banded \/ Bodyweight)\s+/i, '')
        return {
          ...ex,
          name: originalName,
          originalBarbellName: undefined,
        }
      }

      const adapted = adaptExerciseForTravel(ex.name, scenario)
      return {
        ...ex,
        originalBarbellName: ex.originalBarbellName || ex.name,
        name: adapted.name,
        tempo: adapted.tempo || ex.tempo,
        reps: adapted.reps || ex.reps,
        notes: ex.notes ? `${ex.notes} · Cue: ${adapted.coachingCue}` : `Travel Cue: ${adapted.coachingCue}`,
      }
    })

    const travelFocusNote = isRestoringStandard
      ? (workoutObj.focus || 'Training Session')
      : `${workoutObj.focus || 'Training Session'} (${scenarioMeta.label.split('(')[0].trim()} Adaptation)`

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

