import { describe, expect, it } from 'vitest'
import { chooseNasmOptPhase, estimateBodyFatPercent, generateNasmOptPlan } from '@/lib/fitness'
import { parseRestSecondsFromExercise, resolveNextUnfinishedWorkoutDay } from '@/components/fitness/FitnessTrackerClient'
import { normalizeTempoId } from '@/components/fitness/TempoMetronomeAudio'

describe('fitness planning logic', () => {
  it('selects phase 5 for advanced performance athletes', () => {
    expect(
      chooseNasmOptPhase({
        experienceLevel: 'advanced',
        trainingDaysPerWeek: 5,
        fitnessGoal: 'performance',
      })
    ).toBe(5)
  })

  it('clamps generated sessions per week to a safe upper bound', () => {
    const plan = generateNasmOptPlan({
      experienceLevel: 'advanced',
      trainingDaysPerWeek: 9,
      fitnessGoal: 'muscle-gain',
      equipmentAccess: ['barbell', 'bench'],
    })

    expect(plan.sessionsPerWeek).toBe(6)
  })

  it('replaces unsupported equipment exercises for bodyweight-only users', () => {
    const plan = generateNasmOptPlan({
      experienceLevel: 'beginner',
      trainingDaysPerWeek: 3,
      fitnessGoal: 'fat-loss',
      equipmentAccess: ['bodyweight'],
    })

    const exerciseNames = plan.workouts.flatMap(workout => workout.exercises.map(exercise => exercise.name))

    expect(exerciseNames).not.toContain('Goblet Squat')
    expect(exerciseNames).not.toContain('Single-Leg RDL')
    expect(exerciseNames).not.toContain('Cable Row')
    expect(exerciseNames).not.toContain('Single-Arm Dumbbell Press')
    expect(exerciseNames).not.toContain('TRX Row')
  })

  it('uses circumference inputs when available for body fat estimation', () => {
    const estimate = estimateBodyFatPercent({
      sex: 'male',
      heightCm: 180,
      weightKg: 84,
      waistCm: 89,
      neckCm: 40,
    })

    expect(estimate).toBeGreaterThan(5)
    expect(estimate).toBeLessThan(30)
  })

  it('correctly parses rest intervals from plan strings and converts to exact seconds', () => {
    expect(parseRestSecondsFromExercise('60s', 1)).toBe(60)
    expect(parseRestSecondsFromExercise('90s', 3)).toBe(90)
    expect(parseRestSecondsFromExercise('60-90s', 2)).toBe(90)
    expect(parseRestSecondsFromExercise('2-3m', 4)).toBe(180)
    expect(parseRestSecondsFromExercise('3-5m', 5)).toBe(300)
    expect(parseRestSecondsFromExercise('2m', 3)).toBe(120)
    expect(parseRestSecondsFromExercise(null, 1, 'resistance')).toBe(60)
    expect(parseRestSecondsFromExercise(null, 4, 'resistance')).toBe(240)
  })

  it('normalizes tempo strings to active metronome presets', () => {
    expect(normalizeTempoId('4/2/1')).toBe('4-2-1')
    expect(normalizeTempoId('2/0/2')).toBe('2-0-2')
    expect(normalizeTempoId('3/1/1')).toBe('3-1-1')
    expect(normalizeTempoId('1/1/1')).toBe('1-1-1')
    expect(normalizeTempoId('X/0/X')).toBe('explosive')
    expect(normalizeTempoId('explosive')).toBe('explosive')
    expect(normalizeTempoId(null)).toBe('4-2-1')
  })

  it('automatically selects Day 1 when no workouts have been logged', () => {
    const workouts = [{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]
    const logs: Array<{ completed?: boolean; notes?: string; session_title?: string }> = []
    expect(resolveNextUnfinishedWorkoutDay(workouts, logs)).toBe(1)
  })

  it('automatically selects the first uncompleted workout day in sequence', () => {
    const workouts = [{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]
    const logs = [
      { completed: true, notes: '[workout-day:1] Completed successfully.', session_title: 'Day 1: Chest & Triceps' },
    ]
    expect(resolveNextUnfinishedWorkoutDay(workouts, logs)).toBe(2)
  })

  it('automatically selects Day 3 when Day 1 and Day 2 are completed', () => {
    const workouts = [{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]
    const logs = [
      { completed: true, notes: '[workout-day:1] Done.', session_title: 'Day 1: Chest' },
      { completed: true, notes: '[workout-day:2] Done.', session_title: 'Day 2: Back' },
    ]
    expect(resolveNextUnfinishedWorkoutDay(workouts, logs)).toBe(3)
  })

  it('returns first day if all workout days in plan are completed', () => {
    const workouts = [{ day: 1 }, { day: 2 }]
    const logs = [
      { completed: true, notes: '[workout-day:1] Done.', session_title: 'Day 1: Chest' },
      { completed: true, notes: '[workout-day:2] Done.', session_title: 'Day 2: Back' },
    ]
    expect(resolveNextUnfinishedWorkoutDay(workouts, logs)).toBe(1)
  })

  it('correctly resolves multi-cycle microcycle progression (e.g. Week 2 Day 2)', () => {
    const workouts = [{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]
    // 5 workouts completed: full Week 1 (Days 1..4) + Week 2 Day 1
    const logs = [
      { completed: true, notes: '[workout-day:1] W1D1', session_title: 'Day 1: Chest' },
      { completed: true, notes: '[workout-day:2] W1D2', session_title: 'Day 2: Back' },
      { completed: true, notes: '[workout-day:3] W1D3', session_title: 'Day 3: Legs' },
      { completed: true, notes: '[workout-day:4] W1D4', session_title: 'Day 4: Shoulders' },
      { completed: true, notes: '[workout-day:1] W2D1', session_title: 'Day 1: Chest Overload' },
    ]
    // The next unfinished day in cycle 2 should be Day 2
    expect(resolveNextUnfinishedWorkoutDay(workouts, logs)).toBe(2)
  })


  it('extracts workout day tags accurately from notes strings', async () => {
    const { extractWorkoutDayTag } = await import('@/lib/fitness')
    expect(extractWorkoutDayTag('[workout-day:3] Completed')).toBe(3)
    expect(extractWorkoutDayTag('Some random notes [WORKOUT-DAY:12]')).toBe(12)
    expect(extractWorkoutDayTag('No tag present')).toBeNull()
    expect(extractWorkoutDayTag(null)).toBeNull()
    expect(extractWorkoutDayTag(undefined)).toBeNull()
  })

  describe('resolveWorkoutDayCompletion & filterLogsForPlan', () => {
    const workouts = [{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }]

    it('marks Day 1 completed in Week 1 after first session', async () => {
      const { resolveWorkoutDayCompletion } = await import('@/lib/fitness')
      const logs = [
        { completed: true, notes: '[workout-day:1]', session_title: 'Day 1: Upper' },
      ]
      const res = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: workouts,
        workoutLogs: logs,
        currentWeek: 1,
        sessionsPerWeek: 4,
      })
      expect(res.isCompleted).toBe(true)
      expect(res.completedLog).toBeDefined()
      expect(res.completionCount).toBe(1)
    })

    it('keeps Day 1 UNCOMPLETED when moving to Week 2 if only Week 1 was finished (bug reproduction fix)', async () => {
      const { resolveWorkoutDayCompletion, resolveNextUnfinishedWorkoutDay } = await import('@/lib/fitness')
      // Client completed all 4 workouts of Week 1
      const week1Logs = [
        { completed: true, notes: '[workout-day:1] Week 1', session_title: 'Day 1: Upper' },
        { completed: true, notes: '[workout-day:2] Week 1', session_title: 'Day 2: Lower' },
        { completed: true, notes: '[workout-day:3] Week 1', session_title: 'Day 3: Core' },
        { completed: true, notes: '[workout-day:4] Week 1', session_title: 'Day 4: Full' },
      ]

      // In Week 2, Day 1 must NOT be marked complete because it has not been logged for Week 2 yet
      const day1Status = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: workouts,
        workoutLogs: week1Logs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(day1Status.isCompleted).toBe(false)
      expect(day1Status.completedLog).toBeNull()
      expect(day1Status.completionCount).toBe(1)

      // And the next unfinished day for Week 2 must be Day 1
      expect(resolveNextUnfinishedWorkoutDay(workouts, week1Logs)).toBe(1)
    })

    it('marks Day 1 completed in Week 2 once the athlete actually logs Week 2 Day 1', async () => {
      const { resolveWorkoutDayCompletion, resolveNextUnfinishedWorkoutDay } = await import('@/lib/fitness')
      const logsWithWeek2 = [
        { id: 'w2d1', completed: true, notes: '[workout-day:1] Week 2', session_title: 'Day 1: Upper Overload' },
        { id: 'w1d4', completed: true, notes: '[workout-day:4] Week 1', session_title: 'Day 4: Full' },
        { id: 'w1d3', completed: true, notes: '[workout-day:3] Week 1', session_title: 'Day 3: Core' },
        { id: 'w1d2', completed: true, notes: '[workout-day:2] Week 1', session_title: 'Day 2: Lower' },
        { id: 'w1d1', completed: true, notes: '[workout-day:1] Week 1', session_title: 'Day 1: Upper' },
      ]

      const day1Status = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: workouts,
        workoutLogs: logsWithWeek2,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(day1Status.isCompleted).toBe(true)
      expect(day1Status.completedLog?.notes).toContain('Week 2')
      expect(day1Status.completionCount).toBe(2)

      // Next unfinished workout day should now advance to Day 2
      expect(resolveNextUnfinishedWorkoutDay(workouts, logsWithWeek2)).toBe(2)
    })

    it('properly handles sequential multi-week schedules (e.g. 16 days total)', async () => {
      const { resolveWorkoutDayCompletion } = await import('@/lib/fitness')
      const sequentialWorkouts = Array.from({ length: 16 }, (_, i) => ({ day: i + 1 }))
      const logs = [
        { completed: true, notes: '[workout-day:1]' },
        { completed: true, notes: '[workout-day:2]' },
        { completed: true, notes: '[workout-day:3]' },
        { completed: true, notes: '[workout-day:4]' },
      ]

      // Day 1 should be complete (1 completion required)
      const day1 = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: sequentialWorkouts,
        workoutLogs: logs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(day1.isCompleted).toBe(true)

      // Day 5 (Week 2 Day 1) should NOT be complete
      const day5 = resolveWorkoutDayCompletion({
        day: 5,
        planWorkouts: sequentialWorkouts,
        workoutLogs: logs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(day5.isCompleted).toBe(false)
    })

    it('isolates plan logs using filterLogsForPlan and workout_plan_id', async () => {
      const { filterLogsForPlan, resolveWorkoutDayCompletion, resolveNextUnfinishedWorkoutDay } = await import('@/lib/fitness')
      const targetPlan = { id: 'plan-active', created_at: '2026-09-01T00:00:00Z' }
      const mixedLogs = [
        { id: '1', completed: true, workout_plan_id: 'plan-active', notes: '[workout-day:1]' },
        { id: '2', completed: true, workout_plan_id: 'plan-old-archived', notes: '[workout-day:1]' },
        { id: '3', completed: true, workout_plan_id: 'plan-old-archived', notes: '[workout-day:2]' },
      ]

      const planLogs = filterLogsForPlan(mixedLogs, targetPlan, workouts)
      expect(planLogs.length).toBe(1)
      expect(planLogs[0].id).toBe('1')

      // With planId filtering, stray logs from other plans don't inflate completions
      const res = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: workouts,
        workoutLogs: mixedLogs,
        currentWeek: 1,
        sessionsPerWeek: 4,
        planId: 'plan-active',
      })
      expect(res.completionCount).toBe(1)

      // resolveNextUnfinishedWorkoutDay with targetPlanId ignores other plans
      const nextDay = resolveNextUnfinishedWorkoutDay(workouts, mixedLogs, 'plan-active')
      expect(nextDay).toBe(2)
    })

    it('keeps Day 1 in Week 2 uncompleted EVEN IF Day 1 was logged multiple times in the past', async () => {
      const { resolveWorkoutDayCompletion, resolveNextUnfinishedWorkoutDay } = await import('@/lib/fitness')
      // Athlete logged Day 1 twice during onboarding/testing, then Day 2 and Day 3 (4 logs total -> advanced to Week 2)
      const logsWithDuplicateDay1 = [
        { session_date: '2026-09-01', completed: true, notes: '[workout-day:1] Test 1', session_title: 'Day 1: Upper' },
        { session_date: '2026-09-02', completed: true, notes: '[workout-day:1] Test 2', session_title: 'Day 1: Upper' },
        { session_date: '2026-09-03', completed: true, notes: '[workout-day:2]', session_title: 'Day 2: Lower' },
        { session_date: '2026-09-04', completed: true, notes: '[workout-day:3]', session_title: 'Day 3: Core' },
      ]

      // Week 2 has 0 logs logged in Week 2's slice. Day 1 MUST NOT be complete!
      const res = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: workouts,
        workoutLogs: logsWithDuplicateDay1,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(res.isCompleted).toBe(false)
      expect(res.completedLog).toBeNull()

      // The next unfinished workout in Week 2 is Day 1
      expect(resolveNextUnfinishedWorkoutDay(workouts, logsWithDuplicateDay1, null, 4)).toBe(1)
    })

    it('handles 5-day splits with 4 sessions per week without premature Day 1 completion in Week 2', async () => {
      const { resolveWorkoutDayCompletion } = await import('@/lib/fitness')
      const fiveDaySplit = [{ day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }]
      const logs = [
        { session_date: '2026-09-01', completed: true, notes: '[workout-day:1]', session_title: 'Day 1: Push' },
        { session_date: '2026-09-02', completed: true, notes: '[workout-day:2]', session_title: 'Day 2: Pull' },
        { session_date: '2026-09-03', completed: true, notes: '[workout-day:3]', session_title: 'Day 3: Legs' },
        { session_date: '2026-09-04', completed: true, notes: '[workout-day:4]', session_title: 'Day 4: Core' },
      ]

      // 4 workouts done, entering Week 2. Day 1 of Week 2 must NOT be complete.
      const res = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: fiveDaySplit,
        workoutLogs: logs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(res.isCompleted).toBe(false)
      expect(res.completedLog).toBeNull()
    })

    it('prevents premature completion of Day 4 in Week 2 when client finishes Week 1 with 5 total logs (user reproduction)', async () => {
      const {
        resolveWorkoutDayCompletion,
        resolveNextUnfinishedWorkoutDay,
        resolveMicrocycleWeekCompletedCount,
      } = await import('@/lib/fitness')
      const { calculateActiveMicrocycleProgress } = await import('@/lib/periodization-roadmap')

      // Exact user scenario: 5 logs total.
      // Log 0 is an earlier cardio test from Sep 4.
      // Week 1 formally ran Sep 14 - Sep 22, concluding with Day 4 on Sep 22 at 11:48:43 UTC.
      const userLogs = [
        { id: 'log-0', session_date: '2026-09-04', created_at: '2026-09-04T12:00:00Z', completed: true, notes: '[workout-day:1] Treadmill cardio test', session_title: 'Day 1: Cardio' },
        { id: 'log-1', session_date: '2026-09-14', created_at: '2026-09-14T10:00:00Z', completed: true, notes: '[workout-day:1]', session_title: 'Day 1: Upper' },
        { id: 'log-2', session_date: '2026-09-15', created_at: '2026-09-15T10:00:00Z', completed: true, notes: '[workout-day:2]', session_title: 'Day 2: Lower' },
        { id: 'log-3', session_date: '2026-09-21', created_at: '2026-09-21T10:00:00Z', completed: true, notes: '[workout-day:3]', session_title: 'Day 3: Core' },
        { id: 'log-4', session_date: '2026-09-22', created_at: '2026-09-22T11:48:43Z', completed: true, notes: '[workout-day:4]', session_title: 'Day 4: Full' },
      ]

      // Client just moved to Week 2. ALL days in Week 2 must be UNCOMPLETED!
      const week2Day1 = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: workouts,
        workoutLogs: userLogs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2Day1.isCompleted).toBe(false)
      expect(week2Day1.completedLog).toBeNull()

      const week2Day2 = resolveWorkoutDayCompletion({
        day: 2,
        planWorkouts: workouts,
        workoutLogs: userLogs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2Day2.isCompleted).toBe(false)
      expect(week2Day2.completedLog).toBeNull()

      const week2Day3 = resolveWorkoutDayCompletion({
        day: 3,
        planWorkouts: workouts,
        workoutLogs: userLogs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2Day3.isCompleted).toBe(false)
      expect(week2Day3.completedLog).toBeNull()

      // CRITICAL: Day 4 was previously showing completed because it was at index 4 (the 5th log)!
      const week2Day4 = resolveWorkoutDayCompletion({
        day: 4,
        planWorkouts: workouts,
        workoutLogs: userLogs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2Day4.isCompleted).toBe(false)
      expect(week2Day4.completedLog).toBeNull()
      expect(week2Day4.completionCount).toBe(1)

      // Total workouts completed in Week 2 must be 0
      const week2CompletedCount = resolveMicrocycleWeekCompletedCount({
        planWorkouts: workouts,
        workoutLogs: userLogs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2CompletedCount).toBe(0)

      // Microcycle progress banner must read "Week 2 · Session 1 of 4" with 0% progress
      const progress = calculateActiveMicrocycleProgress(userLogs.length, 4, 12, week2CompletedCount)
      expect(progress.currentWeek).toBe(2)
      expect(progress.sessionInWeek).toBe(1)
      expect(progress.completedInCurrentWeek).toBe(0)
      expect(progress.progressInWeekPercent).toBe(0)
      expect(progress.displayLabel).toBe('Week 2 · Session 1 of 4')

      // Active next unfinished workout must be Day 1
      expect(resolveNextUnfinishedWorkoutDay(workouts, userLogs, null, 4)).toBe(1)
    })

    it('advances properly to Day 2 after client logs Week 2 Day 1 after the Week 1 cutoff', async () => {
      const {
        resolveWorkoutDayCompletion,
        resolveNextUnfinishedWorkoutDay,
        resolveMicrocycleWeekCompletedCount,
      } = await import('@/lib/fitness')
      const { calculateActiveMicrocycleProgress } = await import('@/lib/periodization-roadmap')

      const userLogsWithWeek2Day1 = [
        { id: 'log-0', session_date: '2026-09-04', created_at: '2026-09-04T12:00:00Z', completed: true, notes: '[workout-day:1] Treadmill cardio test', session_title: 'Day 1: Cardio' },
        { id: 'log-1', session_date: '2026-09-14', created_at: '2026-09-14T10:00:00Z', completed: true, notes: '[workout-day:1]', session_title: 'Day 1: Upper' },
        { id: 'log-2', session_date: '2026-09-15', created_at: '2026-09-15T10:00:00Z', completed: true, notes: '[workout-day:2]', session_title: 'Day 2: Lower' },
        { id: 'log-3', session_date: '2026-09-21', created_at: '2026-09-21T10:00:00Z', completed: true, notes: '[workout-day:3]', session_title: 'Day 3: Core' },
        { id: 'log-4', session_date: '2026-09-22', created_at: '2026-09-22T11:48:43Z', completed: true, notes: '[workout-day:4]', session_title: 'Day 4: Full' },
        { id: 'log-5', session_date: '2026-09-23', created_at: '2026-09-23T10:00:00Z', completed: true, notes: '[workout-day:1] [workout-week:2] Upper Body Phase 1', session_title: 'Day 1: Upper' },
      ]

      // Day 1 of Week 2 is now completed
      const week2Day1 = resolveWorkoutDayCompletion({
        day: 1,
        planWorkouts: workouts,
        workoutLogs: userLogsWithWeek2Day1,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2Day1.isCompleted).toBe(true)
      expect(week2Day1.completedLog?.id).toBe('log-5')

      // Days 2..4 remain uncompleted
      expect(resolveWorkoutDayCompletion({ day: 2, planWorkouts: workouts, workoutLogs: userLogsWithWeek2Day1, currentWeek: 2, sessionsPerWeek: 4 }).isCompleted).toBe(false)
      expect(resolveWorkoutDayCompletion({ day: 3, planWorkouts: workouts, workoutLogs: userLogsWithWeek2Day1, currentWeek: 2, sessionsPerWeek: 4 }).isCompleted).toBe(false)
      expect(resolveWorkoutDayCompletion({ day: 4, planWorkouts: workouts, workoutLogs: userLogsWithWeek2Day1, currentWeek: 2, sessionsPerWeek: 4 }).isCompleted).toBe(false)

      const week2CompletedCount = resolveMicrocycleWeekCompletedCount({
        planWorkouts: workouts,
        workoutLogs: userLogsWithWeek2Day1,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2CompletedCount).toBe(1)

      const progress = calculateActiveMicrocycleProgress(userLogsWithWeek2Day1.length, 4, 12, week2CompletedCount)
      expect(progress.currentWeek).toBe(2)
      expect(progress.sessionInWeek).toBe(2)
      expect(progress.completedInCurrentWeek).toBe(1)
      expect(progress.progressInWeekPercent).toBe(25)
      expect(progress.displayLabel).toBe('Week 2 · Session 2 of 4')

      // Next unfinished workout day advances to Day 2
      expect(resolveNextUnfinishedWorkoutDay(workouts, userLogsWithWeek2Day1, null, 4)).toBe(2)
    })
  })

  describe('Microcycle Week Set Log Isolation Engine', () => {
    it('extracts workout-week tags accurately', async () => {
      const { extractWorkoutWeekTag } = await import('@/lib/fitness')
      expect(extractWorkoutWeekTag('[workout-day:1] [workout-week:2] Set 1')).toBe(2)
      expect(extractWorkoutWeekTag('[WORKOUT-WEEK:4] Heavy set')).toBe(4)
      expect(extractWorkoutWeekTag('[workout-day:3] No week tag')).toBeNull()
      expect(extractWorkoutWeekTag(null)).toBeNull()
      expect(extractWorkoutWeekTag(undefined)).toBeNull()
    })

    it('isolates sets to active microcycle week preventing Week 1 sets from copying into Week 2', async () => {
      const { filterSetLogsForMicrocycleWeek } = await import('@/lib/fitness')

      // Athlete completed Week 1 (4 workouts):
      // Day 1: 3 sets
      // Day 2: 2 sets (skipped set 3)
      // Day 3: 3 sets
      // Day 4: 3 sets
      const week1WorkoutLogs = [
        { id: 'wl-1', session_date: '2026-09-01', created_at: '2026-09-01T15:00:00Z', completed: true, notes: '[workout-day:1]' },
        { id: 'wl-2', session_date: '2026-09-02', created_at: '2026-09-02T15:00:00Z', completed: true, notes: '[workout-day:2]' },
        { id: 'wl-3', session_date: '2026-09-04', created_at: '2026-09-04T15:00:00Z', completed: true, notes: '[workout-day:3]' },
        { id: 'wl-4', session_date: '2026-09-05', created_at: '2026-09-05T15:00:00Z', completed: true, notes: '[workout-day:4]' },
      ]

      const week1SetLogs = [
        { id: 's-1', session_date: '2026-09-01', created_at: '2026-09-01T14:10:00Z', exercise_name: 'Bench Press', reps: 10, notes: '[workout-day:1] Set 1' },
        { id: 's-2', session_date: '2026-09-01', created_at: '2026-09-01T14:20:00Z', exercise_name: 'Bench Press', reps: 10, notes: '[workout-day:1] Set 2' },
        { id: 's-3', session_date: '2026-09-01', created_at: '2026-09-01T14:30:00Z', exercise_name: 'Bench Press', reps: 10, notes: '[workout-day:1] Set 3' },
        // Day 2: skipped 1 set in Week 1
        { id: 's-4', session_date: '2026-09-02', created_at: '2026-09-02T14:10:00Z', exercise_name: 'Squat', reps: 8, notes: '[workout-day:2] Set 1' },
        { id: 's-5', session_date: '2026-09-02', created_at: '2026-09-02T14:20:00Z', exercise_name: 'Squat', reps: 8, notes: '[workout-day:2] Set 2' },
      ]

      // In Week 2 (before any sets logged):
      // Day 1 MUST have 0 sets logged (not 3 sets copied from Week 1)
      const week2Day1Sets = filterSetLogsForMicrocycleWeek({
        setLogs: week1SetLogs,
        workoutLogs: week1WorkoutLogs,
        workoutDay: 1,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2Day1Sets).toEqual([])

      // Day 2 MUST have 0 sets logged (not 2 sets copied from Week 1)
      const week2Day2Sets = filterSetLogsForMicrocycleWeek({
        setLogs: week1SetLogs,
        workoutLogs: week1WorkoutLogs,
        workoutDay: 2,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2Day2Sets).toEqual([])

      // All active sets across Week 2 must be 0
      const allWeek2Sets = filterSetLogsForMicrocycleWeek({
        setLogs: week1SetLogs,
        workoutLogs: week1WorkoutLogs,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(allWeek2Sets).toEqual([])

      // Now athlete logs Set 1 in Week 2 Day 1:
      const week2Set1 = {
        id: 's-w2-1',
        session_date: '2026-09-08',
        created_at: '2026-09-08T14:10:00Z',
        exercise_name: 'Bench Press',
        reps: 10,
        notes: '[workout-day:1] [workout-week:2] Set 1',
      }
      const combinedSets = [week2Set1, ...week1SetLogs]

      const week2Day1AfterLog = filterSetLogsForMicrocycleWeek({
        setLogs: combinedSets,
        workoutLogs: week1WorkoutLogs,
        workoutDay: 1,
        currentWeek: 2,
        sessionsPerWeek: 4,
      })
      expect(week2Day1AfterLog.length).toBe(1)
      expect(week2Day1AfterLog[0].id).toBe('s-w2-1')

      // Meanwhile, inspecting Week 1 still preserves Week 1 sets
      const week1Day1Sets = filterSetLogsForMicrocycleWeek({
        setLogs: combinedSets,
        workoutLogs: week1WorkoutLogs,
        workoutDay: 1,
        currentWeek: 1,
        sessionsPerWeek: 4,
      })
      expect(week1Day1Sets.length).toBe(3)
      expect(week1Day1Sets.map(s => s.id)).toEqual(['s-1', 's-2', 's-3'])
    })
  })
})