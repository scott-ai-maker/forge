export type GoalType = 'fat-loss' | 'muscle-gain' | 'performance' | 'general-fitness'
import { calculateEstimatedWorkoutDuration } from './workout-duration-engine'
export type WorkoutLocation = 'home' | 'gym' | 'both'
export type EquipmentType =
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'bench'
  | 'cable-machine'
  | 'machines'
  | 'kettlebells'
  | 'bands'
  | 'trx'
  | 'medicine-ball'
  | 'bosu'
  | 'stability-ball'

export type NasmOptPhase = 1 | 2 | 3 | 4 | 5

export interface ProfileInputs {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  trainingDaysPerWeek?: number
  fitnessGoal?: GoalType
  workoutLocation?: WorkoutLocation
  equipmentAccess?: string[]
}

export interface WorkoutTemplate {
  day: number
  focus: string
  exercises: Array<{
    name: string
    sets: string
    reps: string
    tempo?: string
    rest?: string
  }>
}

export interface GeneratedWorkoutPlan {
  phase: NasmOptPhase
  phaseName: string
  rationale: string
  sessionsPerWeek: number
  estimatedDurationMins: number
  workouts: WorkoutTemplate[]
}

const PHASE_NAMES: Record<NasmOptPhase, string> = {
  1: 'Stabilization Endurance',
  2: 'Strength Endurance',
  3: 'Muscular Development',
  4: 'Maximal Strength',
  5: 'Power',
}

const EXERCISE_REQUIREMENTS: Record<string, EquipmentType[]> = {
  'Goblet Squat': ['dumbbells'],
  'Push-Up': ['bodyweight'],
  'Single-Leg RDL': ['dumbbells'],
  'Single-Arm Dumbbell Row': ['dumbbells'],
  'Band Row': ['bands'],
  'Dumbbell Romanian Deadlift': ['dumbbells'],
  'Dumbbell Push Press': ['dumbbells'],
  'Cable Row': ['cable-machine'],
  'Step-Up to Balance': ['bodyweight'],
  'Single-Arm Dumbbell Press': ['dumbbells'],
  'TRX Row': ['trx'],
  'Plank': ['bodyweight'],
  'Back Squat': ['barbell'],
  'Squat Jump': ['bodyweight'],
  'Romanian Deadlift': ['barbell'],
  'Dumbbell Bench Press': ['dumbbells', 'bench'],
  'Medicine Ball Chest Pass': ['medicine-ball'],
  'Bent Over Row': ['barbell'],
  'Barbell Bench Press': ['barbell', 'bench'],
  'Incline Dumbbell Press': ['dumbbells', 'bench'],
  'Overhead Press': ['barbell'],
  'Deadlift': ['barbell'],
  'Lat Pulldown': ['cable-machine'],
  'Leg Press': ['machines'],
  'Bench Press': ['barbell', 'bench'],
  'Weighted Pull-Up': ['bodyweight'],
  'Barbell Row': ['barbell'],
  'Hang Clean': ['barbell'],
  'Box Jump': ['bodyweight'],
  'Front Squat': ['barbell'],
  'Push Press': ['barbell'],
  'Medicine Ball Slam': ['medicine-ball'],
  'Split Squat': ['bodyweight'],
  'BOSU Plank': ['bosu'],
  'BOSU Push-Up': ['bosu'],
  'BOSU Dome Squat': ['bosu'],
  'BOSU Single-Leg Balance Reach': ['bosu'],
  'BOSU Glute Bridge': ['bosu'],
  'BOSU Bird-Dog': ['bosu'],
  'BOSU Dumbbell Chest Press': ['bosu', 'dumbbells'],
  'BOSU Lunge to Balance': ['bosu'],
  'BOSU Mountain Climbers': ['bosu'],
  'BOSU Russian Twist': ['bosu'],
  'BOSU Lateral Bound with Stabilization': ['bosu'],
  'BOSU Burpee with Overhead Press': ['bosu'],
  'Stability Ball Hamstring Curl': ['stability-ball'],
  'Stability Ball Push-Up': ['stability-ball'],
  'Stability Ball Wall Squat': ['stability-ball'],
  'Stability Ball Crunch': ['stability-ball'],
  'Stability Ball Dumbbell Chest Press': ['stability-ball', 'dumbbells'],
  'Stability Ball Prone Cobra': ['stability-ball'],
  'Stability Ball Roll-In': ['stability-ball'],
  'Stability Ball Pike': ['stability-ball'],
  'Stability Ball Back Extension with Rotation': ['stability-ball'],
  'Stability Ball Loaded Bridge': ['stability-ball'],
  'Stability Ball Russian Twist': ['stability-ball'],
  'Stability Ball Scapular Triad': ['stability-ball'],
  'Stability Ball Prone Shoulder Press': ['stability-ball'],
}

function normalizeEquipment(input: string[] | undefined): Set<EquipmentType> {
  const set = new Set<EquipmentType>()
  for (const raw of input ?? []) {
    const value = String(raw).trim().toLowerCase()
    if (value === 'bodyweight') set.add('bodyweight')
    if (value === 'dumbbells') set.add('dumbbells')
    if (value === 'barbell') set.add('barbell')
    if (value === 'bench') set.add('bench')
    if (value === 'cable-machine') set.add('cable-machine')
    if (value === 'machines') set.add('machines')
    if (value === 'kettlebells') set.add('kettlebells')
    if (value === 'bands') set.add('bands')
    if (value === 'trx') set.add('trx')
    if (value === 'medicine-ball') set.add('medicine-ball')
    if (value === 'bosu' || value === 'bosu-ball' || value === 'bosu ball' || value === 'bosu balance trainer') set.add('bosu')
    if (value === 'stability-ball' || value === 'stability ball' || value === 'swiss ball' || value === 'exercise ball' || value === 'theraband ball' || value === 'physio ball') set.add('stability-ball')
  }
  if (set.size === 0) set.add('bodyweight')
  return set
}

function canPerformExercise(name: string, equipment: Set<EquipmentType>) {
  const required = EXERCISE_REQUIREMENTS[name]
  if (!required || required.length === 0) return true
  return required.every(item => equipment.has(item))
}

function pickReplacement(name: string, equipment: Set<EquipmentType>) {
  const has = (key: EquipmentType) => equipment.has(key)

  if ((name === 'Back Squat' || name === 'Front Squat') && has('dumbbells')) return 'Goblet Squat'
  if ((name === 'Back Squat' || name === 'Front Squat') && has('bodyweight')) return 'Split Squat'
  if (name === 'Deadlift' && has('dumbbells')) return 'Dumbbell Romanian Deadlift'
  if (name === 'Romanian Deadlift' && has('dumbbells')) return 'Dumbbell Romanian Deadlift'

  if ((name === 'Cable Row' || name === 'Lat Pulldown') && has('dumbbells')) return 'Single-Arm Dumbbell Row'
  if ((name === 'Cable Row' || name === 'Lat Pulldown') && has('bands')) return 'Band Row'
  if ((name === 'Cable Row' || name === 'Lat Pulldown') && has('trx')) return 'TRX Row'

  if ((name === 'Barbell Bench Press' || name === 'Bench Press') && has('dumbbells') && has('bench')) return 'Dumbbell Bench Press'
  if ((name === 'Barbell Bench Press' || name === 'Bench Press') && has('bodyweight')) return 'Push-Up'
  if (name === 'Incline Dumbbell Press' && has('bodyweight')) return 'Push-Up'
  if (name === 'Overhead Press' && has('dumbbells')) return 'Single-Arm Dumbbell Press'

  if (name === 'Leg Press' && has('bodyweight')) return 'Step-Up to Balance'
  if (name === 'Bent Over Row' && has('dumbbells')) return 'Single-Arm Dumbbell Row'
  if (name === 'Barbell Row' && has('trx')) return 'TRX Row'

  if (name === 'Medicine Ball Chest Pass' && has('bodyweight')) return 'Push-Up'
  if (name === 'Medicine Ball Slam' && has('bodyweight')) return 'Squat Jump'

  if ((name === 'Hang Clean' || name === 'Push Press') && has('dumbbells')) return 'Dumbbell Push Press'
  if ((name === 'Hang Clean' || name === 'Push Press') && has('bodyweight')) return 'Squat Jump'

  return has('bodyweight') ? 'Plank' : name
}

function adaptWorkoutsForEquipment(workouts: WorkoutTemplate[], equipment: Set<EquipmentType>): WorkoutTemplate[] {
  return workouts.map(day => ({
    ...day,
    exercises: day.exercises.map(exercise => {
      if (canPerformExercise(exercise.name, equipment)) return exercise

      const replacementName = pickReplacement(exercise.name, equipment)
      if (replacementName === exercise.name || !canPerformExercise(replacementName, equipment)) {
        return { ...exercise, name: 'Plank' }
      }

      return { ...exercise, name: replacementName }
    }),
  }))
}

export function chooseNasmOptPhase(inputs: ProfileInputs): NasmOptPhase {
  const exp = inputs.experienceLevel ?? 'beginner'
  const days = inputs.trainingDaysPerWeek ?? 3
  const goal = inputs.fitnessGoal ?? 'general-fitness'

  if (goal === 'fat-loss' || goal === 'general-fitness') return exp === 'advanced' && days >= 4 ? 2 : 1
  if (goal === 'muscle-gain') return exp === 'advanced' ? 3 : 2
  if (goal === 'performance') return exp === 'advanced' ? 5 : 4

  return 1
}

function baseTemplate(phase: NasmOptPhase): WorkoutTemplate[] {
  if (phase === 1) {
    return [
      {
        day: 1,
        focus: 'Total Body Stability',
        exercises: [
          { name: 'Goblet Squat', sets: '2-3', reps: '12-20', tempo: '4/2/1', rest: '0-60s' },
          { name: 'Push-Up', sets: '2-3', reps: '12-20', tempo: '4/2/1', rest: '0-60s' },
          { name: 'Single-Leg RDL', sets: '2-3', reps: '12-20', tempo: '4/2/1', rest: '0-60s' },
          { name: 'Cable Row', sets: '2-3', reps: '12-20', tempo: '4/2/1', rest: '0-60s' },
        ],
      },
      {
        day: 2,
        focus: 'Core + Balance',
        exercises: [
          { name: 'Step-Up to Balance', sets: '2-3', reps: '10-15', tempo: '4/2/1', rest: '0-60s' },
          { name: 'Single-Arm Dumbbell Press', sets: '2-3', reps: '12-20', tempo: '4/2/1', rest: '0-60s' },
          { name: 'TRX Row', sets: '2-3', reps: '12-20', tempo: '4/2/1', rest: '0-60s' },
          { name: 'Plank', sets: '2-3', reps: '30-60s', rest: '0-60s' },
        ],
      },
    ]
  }

  if (phase === 2) {
    return [
      {
        day: 1,
        focus: 'Lower Body Strength Endurance',
        exercises: [
          { name: 'Back Squat', sets: '3-4', reps: '8-12', tempo: '2/0/2', rest: '60-90s' },
          { name: 'Squat Jump', sets: '3', reps: '8-10', rest: '60s' },
          { name: 'Romanian Deadlift', sets: '3-4', reps: '8-12', tempo: '2/0/2', rest: '60-90s' },
        ],
      },
      {
        day: 2,
        focus: 'Upper Body Strength Endurance',
        exercises: [
          { name: 'Dumbbell Bench Press', sets: '3-4', reps: '8-12', tempo: '2/0/2', rest: '60-90s' },
          { name: 'Medicine Ball Chest Pass', sets: '3', reps: '8-10', rest: '60s' },
          { name: 'Bent Over Row', sets: '3-4', reps: '8-12', tempo: '2/0/2', rest: '60-90s' },
        ],
      },
    ]
  }

  if (phase === 3) {
    return [
      {
        day: 1,
        focus: 'Hypertrophy Push',
        exercises: [
          { name: 'Barbell Bench Press', sets: '3-5', reps: '6-12', tempo: '2/0/2', rest: '0-60s' },
          { name: 'Incline Dumbbell Press', sets: '3-4', reps: '8-12', rest: '0-60s' },
          { name: 'Overhead Press', sets: '3-4', reps: '8-12', rest: '0-60s' },
        ],
      },
      {
        day: 2,
        focus: 'Hypertrophy Pull + Legs',
        exercises: [
          { name: 'Deadlift', sets: '3-5', reps: '6-10', tempo: '2/0/2', rest: '0-60s' },
          { name: 'Lat Pulldown', sets: '3-4', reps: '8-12', rest: '0-60s' },
          { name: 'Leg Press', sets: '3-4', reps: '8-12', rest: '0-60s' },
        ],
      },
    ]
  }

  if (phase === 4) {
    return [
      {
        day: 1,
        focus: 'Maximal Strength Lower',
        exercises: [
          { name: 'Back Squat', sets: '4-6', reps: '1-5', tempo: 'x/x/x', rest: '3-5m' },
          { name: 'Deadlift', sets: '4-6', reps: '1-5', tempo: 'x/x/x', rest: '3-5m' },
          { name: 'Split Squat', sets: '3-4', reps: '6-8', rest: '2-3m' },
        ],
      },
      {
        day: 2,
        focus: 'Maximal Strength Upper',
        exercises: [
          { name: 'Bench Press', sets: '4-6', reps: '1-5', tempo: 'x/x/x', rest: '3-5m' },
          { name: 'Weighted Pull-Up', sets: '4-6', reps: '1-5', tempo: 'x/x/x', rest: '3-5m' },
          { name: 'Barbell Row', sets: '3-4', reps: '4-6', rest: '2-3m' },
        ],
      },
    ]
  }

  return [
    {
      day: 1,
      focus: 'Power Lower',
      exercises: [
        { name: 'Hang Clean', sets: '4-5', reps: '3-5', rest: '3-5m' },
        { name: 'Box Jump', sets: '4-5', reps: '5-8', rest: '2m' },
        { name: 'Front Squat', sets: '3-4', reps: '3-5', rest: '2-3m' },
      ],
    },
    {
      day: 2,
      focus: 'Power Upper',
      exercises: [
        { name: 'Push Press', sets: '4-5', reps: '3-5', rest: '3-5m' },
        { name: 'Medicine Ball Slam', sets: '4-5', reps: '6-8', rest: '2m' },
        { name: 'Weighted Pull-Up', sets: '3-4', reps: '3-5', rest: '2-3m' },
      ],
    },
  ]
}

export function generateNasmOptPlan(inputs: ProfileInputs): GeneratedWorkoutPlan {
  const phase = chooseNasmOptPhase(inputs)
  const phaseName = PHASE_NAMES[phase]
  const sessionsPerWeek = Math.min(Math.max(inputs.trainingDaysPerWeek ?? 3, 2), 6)
  const equipment = normalizeEquipment(inputs.equipmentAccess)
  const workouts = adaptWorkoutsForEquipment(baseTemplate(phase), equipment)
  const equipmentSummary = [...equipment].join(', ')

  const avgDuration = workouts.length > 0
    ? Math.round(
        workouts.reduce((acc, w) => {
          return acc + calculateEstimatedWorkoutDuration({ workout: w, optPhase: phase }).totalDurationMins
        }, 0) / workouts.length
      )
    : (phase <= 2 ? 55 : 75)

  return {
    phase,
    phaseName,
    rationale: `Plan starts in NASM OPT Phase ${phase} (${phaseName}) based on stated goal and experience, and is constrained to selected equipment (${equipmentSummary}).`,
    sessionsPerWeek,
    estimatedDurationMins: avgDuration,
    workouts,
  }
}

export interface BodyFatInputs {
  sex: 'male' | 'female' | 'other'
  heightCm: number
  weightKg: number
  waistCm?: number
  neckCm?: number
  hipCm?: number
}

function roundToTwo(n: number) {
  return Math.round(n * 100) / 100
}

export function estimateBodyFatPercent(inputs: BodyFatInputs): number {
  const { sex, heightCm, waistCm, neckCm, hipCm, weightKg } = inputs

  if (sex === 'male' && waistCm && neckCm) {
    const value = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450
    return roundToTwo(Math.max(3, Math.min(value, 45)))
  }

  if (sex === 'female' && waistCm && neckCm && hipCm) {
    const value = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450
    return roundToTwo(Math.max(8, Math.min(value, 55)))
  }

  // Fallback to BMI-derived estimate if circumference fields are unavailable.
  const bmi = weightKg / ((heightCm / 100) * (heightCm / 100))
  const sexFlag = sex === 'male' ? 1 : 0
  const value = 1.2 * bmi + 0.23 * 30 - 10.8 * sexFlag - 5.4
  return roundToTwo(Math.max(5, Math.min(value, 50)))
}

export function extractWorkoutDayTag(notes: string | null | undefined): number | null {
  const match = String(notes ?? '').match(/\[workout-day:(\d+)\]/i)
  if (!match) return null

  const day = Number(match[1])
  return Number.isFinite(day) ? day : null
}

export function extractWorkoutWeekTag(notes: string | null | undefined): number | null {
  const match = String(notes ?? '').match(/\[workout-week:(\d+)\]/i)
  if (!match) return null

  const week = Number(match[1])
  return Number.isFinite(week) ? week : null
}

export interface SetLogLike {
  id?: string
  session_date?: string
  exercise_name?: string
  set_number?: number | string | null
  reps?: number | string | null
  weight_kg?: number | null
  rpe?: number | string | null
  rir?: number | string | null
  is_warmup?: boolean | null
  notes?: string | null
  workout_log_id?: string | null
  workout_plan_id?: string | null
  created_at?: string | null
}

/**
 * Filters workout set logs strictly to the sets belonging to the target microcycle week.
 *
 * Prevents historical sets from preceding microcycle weeks (e.g. Week 1) from bleeding into
 * and prematurely marking sets as logged/done in subsequent weeks (e.g. Week 2).
 */
export function filterSetLogsForMicrocycleWeek<T extends SetLogLike>({
  setLogs,
  workoutLogs,
  workoutDay,
  currentWeek = 1,
  sessionsPerWeek = 4,
}: {
  setLogs: T[]
  workoutLogs?: WorkoutLogLike[]
  workoutDay?: number
  currentWeek?: number
  sessionsPerWeek?: number
}): T[] {
  if (!setLogs || setLogs.length === 0) return []

  const safeCurrentWeek = Math.max(1, Math.floor(currentWeek || 1))
  const safeSessionsPerWeek = Math.max(1, Math.floor(sessionsPerWeek || 4))

  // Sort all completed workout logs chronologically ascending (earliest first)
  const sortedCompletedLogs = (workoutLogs || [])
    .filter(l => l.completed !== false)
    .sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : (a.session_date ? new Date(`${a.session_date}T23:59:59Z`).getTime() : 0)
      const tB = b.created_at ? new Date(b.created_at).getTime() : (b.session_date ? new Date(`${b.session_date}T23:59:59Z`).getTime() : 0)
      return tA - tB
    })

  // If we are in week W > 1, all workouts from microcycle weeks 1..(W-1) are already completed.
  // The cutoff for microcycle week (W - 1) is the ((W - 1) * S)-th completed workout log.
  const prevMicrocycleEndIndex = (safeCurrentWeek - 1) * safeSessionsPerWeek - 1
  const prevMicrocycleEndLog = prevMicrocycleEndIndex >= 0 && prevMicrocycleEndIndex < sortedCompletedLogs.length
    ? sortedCompletedLogs[prevMicrocycleEndIndex]
    : null

  const prevMicrocycleCutoff = prevMicrocycleEndLog
    ? (prevMicrocycleEndLog.created_at
        ? new Date(prevMicrocycleEndLog.created_at).getTime()
        : (prevMicrocycleEndLog.session_date ? new Date(`${prevMicrocycleEndLog.session_date}T23:59:59Z`).getTime() : 0))
    : 0

  return setLogs.filter(set => {
    const day = extractWorkoutDayTag(set.notes)
    if (workoutDay !== undefined && day !== workoutDay) {
      return false
    }

    // 1. Explicit microcycle week tag takes precedence
    const taggedWeek = extractWorkoutWeekTag(set.notes)
    if (taggedWeek !== null) {
      return taggedWeek === safeCurrentWeek
    }

    // 2. If no day tag exists, fall back to preserving the set
    if (day === null) {
      return true
    }

    const setTime = set.created_at
      ? new Date(set.created_at).getTime()
      : (set.session_date ? new Date(`${set.session_date}T12:00:00Z`).getTime() : 0)

    // 3. For legacy set logs: if week > 1, any set logged on/before the prior microcycle cutoff belongs to earlier weeks
    if (safeCurrentWeek > 1 && prevMicrocycleCutoff > 0) {
      if (prevMicrocycleEndLog?.session_date && set.session_date) {
        if (set.session_date < prevMicrocycleEndLog.session_date) return false
        if (set.session_date === prevMicrocycleEndLog.session_date && setTime <= prevMicrocycleCutoff) return false
      } else if (setTime <= prevMicrocycleCutoff) {
        return false
      }
    }

    // 4. Partition using completed workout logs for this specific workout day
    const matchingWorkoutLogs = sortedCompletedLogs.filter(l => {
      const taggedLogDay = extractWorkoutDayTag(l.notes)
      if (taggedLogDay === day) return true
      const titleMatch = l.session_title?.match(/^Day\s*(\d+):/i)
      if (titleMatch && Number(titleMatch[1]) === day) return true
      return false
    })

    const previousCompletionsCount = safeCurrentWeek - 1

    if (previousCompletionsCount <= 0) {
      // In Week 1: if Day D is already completed in Week 1, sets logged on/before it belong to Week 1
      if (matchingWorkoutLogs.length > 0) {
        const week1Log = matchingWorkoutLogs[0]
        const cutoff = week1Log.created_at
          ? new Date(week1Log.created_at).getTime()
          : (week1Log.session_date ? new Date(`${week1Log.session_date}T23:59:59Z`).getTime() : 0)
        if (week1Log.session_date && set.session_date) {
          return set.session_date <= week1Log.session_date
        }
        return setTime <= cutoff
      }
      return true
    }

    // In Week 2+: we need previous completions cutoff
    if (matchingWorkoutLogs.length < previousCompletionsCount) {
      if (prevMicrocycleCutoff > 0) {
        return true
      }
      if (matchingWorkoutLogs.length > 0) {
        const lastPrev = matchingWorkoutLogs[matchingWorkoutLogs.length - 1]
        const cutoff = lastPrev.created_at
          ? new Date(lastPrev.created_at).getTime()
          : (lastPrev.session_date ? new Date(`${lastPrev.session_date}T23:59:59Z`).getTime() : 0)
        if (lastPrev.session_date && set.session_date) {
          return set.session_date > lastPrev.session_date
        }
        return setTime > cutoff
      }
      return false
    }

    const prevLog = matchingWorkoutLogs[previousCompletionsCount - 1]
    const prevCutoff = prevLog.created_at
      ? new Date(prevLog.created_at).getTime()
      : (prevLog.session_date ? new Date(`${prevLog.session_date}T23:59:59Z`).getTime() : 0)

    // Has Day D already been completed in safeCurrentWeek?
    const hasCurrentWeekLog = matchingWorkoutLogs.length >= safeCurrentWeek
    if (hasCurrentWeekLog) {
      const currLog = matchingWorkoutLogs[safeCurrentWeek - 1]
      const currCutoff = currLog.created_at
        ? new Date(currLog.created_at).getTime()
        : (currLog.session_date ? new Date(`${currLog.session_date}T23:59:59Z`).getTime() : 0)
      if (currLog.session_date && prevLog.session_date && set.session_date) {
        return set.session_date > prevLog.session_date && set.session_date <= currLog.session_date
      }
      return setTime > prevCutoff && setTime <= currCutoff
    }

    // Day D is NOT yet completed in safeCurrentWeek -> only sets logged strictly after previous completion belong to active session
    if (prevLog.session_date && set.session_date) {
      return set.session_date > prevLog.session_date
    }
    return setTime > prevCutoff
  })
}

export interface PlanWorkoutLike {
  day: number
  focus?: string | null
  scheduledDate?: string | null
  notes?: string | null
  exercises?: unknown[]
}

export interface WorkoutLogLike {
  id?: string
  completed?: boolean
  notes?: string | null
  session_title?: string | null
  session_date?: string | null
  workout_plan_id?: string | null
  created_at?: string | null
  exertion_rpe?: number | null
}

export interface PlanRecordLike {
  id?: string | null
  created_at?: string | null
  sessions_per_week?: number | null
  plan_json?: { workouts?: Array<{ day: number }> } | null
}

/**
 * Filters raw workout logs to those that strictly belong to the specified workout plan and its scheduled days.
 */
export function filterLogsForPlan(
  workoutLogs: WorkoutLogLike[],
  plan: PlanRecordLike | null,
  planWorkouts: PlanWorkoutLike[]
): WorkoutLogLike[] {
  if (!workoutLogs || workoutLogs.length === 0) return []
  if (!planWorkouts || planWorkouts.length === 0) return []

  const validDays = new Set(planWorkouts.map(w => w.day))

  return workoutLogs.filter(log => {
    if (log.completed === false) return false

    // If log has an explicit workout_plan_id, it must match plan.id
    if (plan?.id && log.workout_plan_id) {
      if (log.workout_plan_id !== plan.id) return false
    }

    // Must correspond to one of the days in planWorkouts
    const taggedDay = extractWorkoutDayTag(log.notes)
    let matchedDay: number | null = null
    if (taggedDay !== null && validDays.has(taggedDay)) {
      matchedDay = taggedDay
    } else if (log.session_title) {
      const match = log.session_title.match(/^Day\s*(\d+):/i)
      if (match && validDays.has(Number(match[1]))) {
        matchedDay = Number(match[1])
      }
    }

    if (matchedDay === null) return false

    return true
  })
}

/**
 * Evaluates whether a specific workout day is completed in the target microcycle week
 * using chronological microcycle slicing.
 *
 * Microcycle Slicing Rule:
 * For a given week W (1-indexed) and sessions per week S:
 * - Logs belonging to week W reside within slice: [(W-1)*S, W*S) of the chronologically sorted plan logs.
 * - Day D is completed in week W if and only if a matching log for Day D exists within week W's slice.
 * - If Week W has 0 logs completed (e.g. client just finished Week 1 and moved to Week 2),
 *   then week W's slice is empty, and ZERO workouts in Week W can evaluate as completed.
 */
/**
 * Deterministically assigns plan workout logs to microcycle weeks using a two-pass chronological assignment engine:
 * 1. Phase A: Binds logs carrying an explicit [workout-week:W] tag directly to week W.
 * 2. Phase B: Sequentially assigns unassigned logs to unfilled days in week W. For repeating splits,
 *    logs in week W > 1 must have occurred strictly after the completion cutoff timestamp of week W - 1.
 * 3. Enforces strict 1-to-1 log assignment: no log is ever double-counted across multiple weeks or days.
 */
export function assignPlanLogsToMicrocycles({
  planWorkouts,
  workoutLogs,
  sessionsPerWeek,
  targetPlanId,
  maxWeeks = 16,
}: {
  planWorkouts: PlanWorkoutLike[]
  workoutLogs: WorkoutLogLike[]
  sessionsPerWeek?: number | null
  targetPlanId?: string | null
  maxWeeks?: number
}): Map<number, Map<number, WorkoutLogLike>> {
  const result = new Map<number, Map<number, WorkoutLogLike>>()
  if (!planWorkouts || planWorkouts.length === 0) return result

  const safeSessionsPerWeek = Math.max(
    1,
    Math.floor(sessionsPerWeek || (planWorkouts.length <= 6 ? planWorkouts.length : 4))
  )

  const isSequential =
    planWorkouts.length >= safeSessionsPerWeek * 2 &&
    planWorkouts.some(w => w.day > safeSessionsPerWeek)

  // 1. Filter raw workout logs to completed logs valid for this plan
  const validDays = new Set(planWorkouts.map(w => w.day))
  const validPlanLogs = (workoutLogs || []).filter(log => {
    if (log.completed === false) return false
    if (targetPlanId && log.workout_plan_id && log.workout_plan_id !== targetPlanId) return false

    const taggedDay = extractWorkoutDayTag(log.notes)
    if (taggedDay !== null && validDays.has(taggedDay)) return true

    const titleMatch = log.session_title?.match(/^Day\s*(\d+):/i)
    if (titleMatch && validDays.has(Number(titleMatch[1]))) return true

    return false
  })

  // 2. Sort valid logs chronologically ascending (earliest first)
  const parseLogTime = (item: WorkoutLogLike): number => {
    if (item.created_at) {
      const t = new Date(item.created_at).getTime()
      if (!isNaN(t) && t > 0) return t
    }
    if (item.session_date) {
      const t = new Date(`${item.session_date}T12:00:00Z`).getTime()
      if (!isNaN(t) && t > 0) return t
    }
    return 0
  }

  const indexedLogs = validPlanLogs.map((log, index) => ({ log, originalIndex: index }))

  indexedLogs.sort((a, b) => {
    const tA = parseLogTime(a.log)
    const tB = parseLogTime(b.log)

    if (tA > 0 && tB > 0 && tA !== tB) {
      return tA - tB
    }

    // Fallback for ties or untimed mocks: reverse-originalIndex for descending lists
    return b.originalIndex - a.originalIndex
  })

  const sortedLogs = indexedLogs.map(item => item.log)

  const getLogDay = (log: WorkoutLogLike): number | null => {
    const taggedDay = extractWorkoutDayTag(log.notes)
    if (taggedDay !== null && validDays.has(taggedDay)) return taggedDay
    const titleMatch = log.session_title?.match(/^Day\s*(\d+):/i)
    if (titleMatch && validDays.has(Number(titleMatch[1]))) return Number(titleMatch[1])
    return null
  }

  const getEffectiveLogTime = (log: WorkoutLogLike, sortedIndex: number): number => {
    const t = parseLogTime(log)
    if (t > 0) return t
    // Synthetic sequence for untimed mocks: 1, 2, 3...
    return sortedIndex + 1
  }

  const getLogIdKey = (log: WorkoutLogLike, index: number): string => {
    return log.id || `${log.session_date || ''}-${log.session_title || ''}-${log.notes || ''}-${index}`
  }

  // Sequential multi-week schedule handling (e.g. 16 distinct workouts, Day 1..16)
  if (isSequential) {
    const assignedLogKeys = new Set<string>()
    for (let i = 0; i < planWorkouts.length; i++) {
      const workout = planWorkouts[i]
      const scheduledWeek = Math.floor(i / safeSessionsPerWeek) + 1
      if (!result.has(scheduledWeek)) {
        result.set(scheduledWeek, new Map())
      }
      const matchIndex = sortedLogs.findIndex((l, idx) => {
        const key = getLogIdKey(l, idx)
        if (assignedLogKeys.has(key)) return false
        return getLogDay(l) === workout.day
      })
      if (matchIndex !== -1) {
        const match = sortedLogs[matchIndex]
        assignedLogKeys.add(getLogIdKey(match, matchIndex))
        result.get(scheduledWeek)!.set(workout.day, match)
      }
    }
    return result
  }

  // Repeating split handling (e.g. 4-day split repeating across weeks)
  const assignedLogKeys = new Set<string>()
  let previousWeekCutoffTime = 0

  for (let w = 1; w <= maxWeeks; w++) {
    const weekCompletions = new Map<number, WorkoutLogLike>()
    result.set(w, weekCompletions)

    // Phase A: First pass - match logs explicitly tagged with [workout-week:w]
    for (const workout of planWorkouts) {
      const day = workout.day
      const matchIndex = sortedLogs.findIndex((l, idx) => {
        const key = getLogIdKey(l, idx)
        if (assignedLogKeys.has(key)) return false
        if (getLogDay(l) !== day) return false
        const taggedWeek = extractWorkoutWeekTag(l.notes)
        return taggedWeek === w
      })
      if (matchIndex !== -1) {
        const match = sortedLogs[matchIndex]
        assignedLogKeys.add(getLogIdKey(match, matchIndex))
        weekCompletions.set(day, match)
      }
    }

    // Phase B: Second pass - match unassigned logs for days not yet filled in this week
    for (const workout of planWorkouts) {
      const day = workout.day
      if (weekCompletions.has(day)) continue

      const matchIndex = sortedLogs.findIndex((l, idx) => {
        const key = getLogIdKey(l, idx)
        if (assignedLogKeys.has(key)) return false
        if (getLogDay(l) !== day) return false

        // If the log is explicitly tagged for a different week, do not claim it here
        const taggedWeek = extractWorkoutWeekTag(l.notes)
        if (taggedWeek !== null && taggedWeek !== w) return false

        // For week 1, any unassigned matching log can be assigned
        if (w === 1) return true

        // For week > 1, the log MUST have been performed strictly after the previous week's cutoff
        if (previousWeekCutoffTime > 0) {
          const logTime = getEffectiveLogTime(l, idx)
          if (logTime <= previousWeekCutoffTime) return false
        }

        return true
      })

      if (matchIndex !== -1) {
        const match = sortedLogs[matchIndex]
        assignedLogKeys.add(getLogIdKey(match, matchIndex))
        weekCompletions.set(day, match)
      }
    }

    // Calculate this week's latest completion timestamp
    let currentWeekLatestTime = 0
    for (const log of weekCompletions.values()) {
      const idx = sortedLogs.indexOf(log)
      const t = getEffectiveLogTime(log, idx >= 0 ? idx : 0)
      if (t > currentWeekLatestTime) {
        currentWeekLatestTime = t
      }
    }

    if (currentWeekLatestTime > 0) {
      previousWeekCutoffTime = Math.max(previousWeekCutoffTime, currentWeekLatestTime)
    }

    // Early termination: if no workouts were assigned to this week, stop
    if (weekCompletions.size === 0) {
      break
    }
  }

  return result
}

/**
 * Evaluates whether a specific workout day is completed in the target microcycle week
 * using the deterministic microcycle assignment engine.
 */
export function resolveWorkoutDayCompletion({
  day,
  planWorkouts,
  workoutLogs,
  currentWeek,
  sessionsPerWeek,
  planId,
}: {
  day: number
  planWorkouts: PlanWorkoutLike[]
  workoutLogs: WorkoutLogLike[]
  currentWeek: number
  sessionsPerWeek: number
  planId?: string | null
}): {
  isCompleted: boolean
  completedLog: WorkoutLogLike | null
  completionCount: number
} {
  if (!planWorkouts || planWorkouts.length === 0) {
    return { isCompleted: false, completedLog: null, completionCount: 0 }
  }

  const safeSessionsPerWeek = Math.max(
    1,
    Math.floor(sessionsPerWeek || (planWorkouts.length <= 6 ? planWorkouts.length : 4))
  )

  const workoutIndex = planWorkouts.findIndex(w => w.day === day)
  if (workoutIndex === -1) {
    return { isCompleted: false, completedLog: null, completionCount: 0 }
  }

  const isSequential =
    planWorkouts.length >= safeSessionsPerWeek * 2 &&
    planWorkouts.some(w => w.day > safeSessionsPerWeek)

  const targetWeek = isSequential
    ? Math.floor(workoutIndex / safeSessionsPerWeek) + 1
    : Math.max(1, Math.floor(currentWeek || 1))

  const assignments = assignPlanLogsToMicrocycles({
    planWorkouts,
    workoutLogs,
    sessionsPerWeek: safeSessionsPerWeek,
    targetPlanId: planId,
    maxWeeks: Math.max(12, targetWeek + 2),
  })

  const completedLog = assignments.get(targetWeek)?.get(day) ?? null
  const isCompleted = completedLog !== null

  const totalCompletionsForThisDay = (workoutLogs || []).filter(log => {
    if (log.completed === false) return false
    if (planId && log.workout_plan_id && log.workout_plan_id !== planId) return false
    const taggedDay = extractWorkoutDayTag(log.notes)
    if (taggedDay === day) return true
    const titleMatch = log.session_title?.match(/^Day\s*(\d+):/i)
    if (titleMatch && Number(titleMatch[1]) === day) return true
    return false
  }).length

  return {
    isCompleted,
    completedLog,
    completionCount: totalCompletionsForThisDay,
  }
}

/**
 * Returns the exact count of unique workouts completed within the target microcycle week.
 */
export function resolveMicrocycleWeekCompletedCount({
  planWorkouts,
  workoutLogs,
  currentWeek,
  sessionsPerWeek,
  planId,
}: {
  planWorkouts: PlanWorkoutLike[]
  workoutLogs: WorkoutLogLike[]
  currentWeek: number
  sessionsPerWeek: number
  planId?: string | null
}): number {
  if (!planWorkouts || planWorkouts.length === 0) return 0

  const safeSessionsPerWeek = Math.max(
    1,
    Math.floor(sessionsPerWeek || (planWorkouts.length <= 6 ? planWorkouts.length : 4))
  )
  const targetWeek = Math.max(1, Math.floor(currentWeek || 1))

  const assignments = assignPlanLogsToMicrocycles({
    planWorkouts,
    workoutLogs,
    sessionsPerWeek: safeSessionsPerWeek,
    targetPlanId: planId,
    maxWeeks: Math.max(12, targetWeek + 2),
  })

  return assignments.get(targetWeek)?.size ?? 0
}

export function resolveNextUnfinishedWorkoutDay(
  planWorkouts: PlanWorkoutLike[],
  workoutLogs: WorkoutLogLike[],
  targetPlanId?: string | null,
  sessionsPerWeek?: number | null
): number {
  if (!planWorkouts || planWorkouts.length === 0) return 1

  const safeSessionsPerWeek = Math.max(
    1,
    Math.floor(sessionsPerWeek || (planWorkouts.length <= 6 ? planWorkouts.length : 4))
  )

  const isSequential =
    planWorkouts.length >= safeSessionsPerWeek * 2 &&
    planWorkouts.some(w => w.day > safeSessionsPerWeek)

  const validDays = new Set(planWorkouts.map(w => w.day))
  const validPlanLogs = (workoutLogs || []).filter(log => {
    if (log.completed === false) return false
    if (targetPlanId && log.workout_plan_id && log.workout_plan_id !== targetPlanId) return false
    const taggedDay = extractWorkoutDayTag(log.notes)
    if (taggedDay !== null && validDays.has(taggedDay)) return true
    const titleMatch = log.session_title?.match(/^Day\s*(\d+):/i)
    if (titleMatch && validDays.has(Number(titleMatch[1]))) return true
    return false
  })

  // For sequential schedules, search across all days
  if (isSequential) {
    const assignments = assignPlanLogsToMicrocycles({
      planWorkouts,
      workoutLogs: validPlanLogs,
      sessionsPerWeek: safeSessionsPerWeek,
      targetPlanId,
      maxWeeks: Math.ceil(planWorkouts.length / safeSessionsPerWeek),
    })

    for (let i = 0; i < planWorkouts.length; i++) {
      const workout = planWorkouts[i]
      const scheduledWeek = Math.floor(i / safeSessionsPerWeek) + 1
      if (!assignments.get(scheduledWeek)?.has(workout.day)) {
        return workout.day
      }
    }
    return planWorkouts[0].day
  }

  // Repeating split: determine current microcycle week
  const currentWeek = Math.floor(validPlanLogs.length / safeSessionsPerWeek) + 1

  const assignments = assignPlanLogsToMicrocycles({
    planWorkouts,
    workoutLogs: validPlanLogs,
    sessionsPerWeek: safeSessionsPerWeek,
    targetPlanId,
    maxWeeks: Math.max(12, currentWeek + 2),
  })

  const currentWeekCompletions = assignments.get(currentWeek)

  // Find the first workout in planWorkouts that is not completed in currentWeek
  for (const workout of planWorkouts) {
    if (!currentWeekCompletions?.has(workout.day)) {
      return workout.day
    }
  }

  return planWorkouts[0].day
}

