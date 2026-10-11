import { describe, expect, it } from 'vitest'
import { buildWorkoutSchedule } from './workout-schedule'

describe('workout schedule', () => {
  it('uses the explicit program calendar and excludes undated sessions', () => {
    expect(buildWorkoutSchedule({
      calendar: [
        { day: 2, focus: 'Strength', scheduledDate: '2026-10-12', exerciseCount: 1, durationMins: 30 },
        { day: 3, focus: 'Rest', scheduledDate: null, exerciseCount: 0, durationMins: 0 },
      ],
      workouts: [{ day: 1, focus: 'Fallback', scheduledDate: '2026-10-10', exercises: [] }],
    })).toEqual([{
      date: '2026-10-12', title: 'Day 2: Strength', subtitle: '1 exercise • 30 mins', workoutDay: 2,
    }])
  })

  it('falls back to dated workout days and supports an unassigned program', () => {
    expect(buildWorkoutSchedule({ workouts: [
      { day: 1, focus: 'Strength', scheduledDate: '2026-10-10', exercises: [{}, {}] },
      { day: 2, focus: 'Rest', exercises: [] },
    ] })).toEqual([{
      date: '2026-10-10', title: 'Day 1: Strength', subtitle: '2 exercises', workoutDay: 1,
    }])
    expect(buildWorkoutSchedule(null)).toEqual([])
  })
})
