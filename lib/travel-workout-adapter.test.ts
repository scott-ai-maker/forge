import { describe, expect, it } from 'vitest'
import {
  adaptExerciseForTravel,
  adaptWorkoutForTravel,
  adaptFullPlanForTravel,
  TRAVEL_SUBSTITUTION_RULES,
} from './travel-workout-adapter'

describe('travel-workout-adapter', () => {
  it('adapts Barbell Back Squat to DB Goblet Squat with isometric pause for hotel dumbbells', () => {
    const result = adaptExerciseForTravel('Barbell Back Squat', 'hotel_dumbbells_only')
    expect(result.name).toContain('DB Goblet Squat')
    expect(result.tempo).toBe('4/3/1')
    expect(result.coachingCue).toContain('isometric pause')
  })

  it('adapts Barbell Bench Press to Banded Deficit Push-ups for hotel room bands', () => {
    const result = adaptExerciseForTravel('Barbell Bench Press', 'hotel_room_bands')
    expect(result.name).toContain('Banded Deficit Push-ups')
    expect(result.reps).toBe('15-20')
  })

  it('adapts entire workout plan preserving exercise count while substituting names and cues', () => {
    const sampleWorkout = [
      { name: 'Barbell Back Squat', sets: 4, reps: '8-10' },
      { name: 'Barbell Bench Press', sets: 4, reps: '8-10' },
      { name: 'Barbell Bent-Over Row', sets: 3, reps: '10-12' },
    ]

    const adapted = adaptWorkoutForTravel(sampleWorkout, 'hotel_dumbbells_only')
    expect(adapted.length).toBe(3)
    expect(adapted[0].name).toContain('DB Goblet Squat')
    expect(adapted[0].originalBarbellName).toBe('Barbell Back Squat')
    expect(adapted[1].name).toContain('Flat DB Chest Press')
    expect(adapted[2].name).toContain('Single-Arm DB Row')
  })

  it('has substitution rules defined for all major barbell compound exercises', () => {
    expect(TRAVEL_SUBSTITUTION_RULES.length).toBeGreaterThanOrEqual(5)
  })

  it('adapts a full multi-day macrocycle plan and allows restoration', () => {
    const rawPlan = {
      workouts: [
        {
          day: 1,
          focus: 'Legs & Core',
          exercises: [
            { name: 'Barbell Back Squat', sets: '4', reps: '8-10', tempo: '4/2/1' },
          ],
        },
      ],
    }

    const adapted = adaptFullPlanForTravel(rawPlan, 'hotel_dumbbells_only', 'Phase 2 Hypertrophy')
    expect(adapted.planTitle).toContain('[Travel: Hotel Dumbbell Gym]')
    expect(adapted.planJson.isTravelAdapted).toBe(true)
    expect(adapted.planJson.workouts[0].exercises[0].name).toContain('DB Goblet Squat')
    expect(adapted.planJson.workouts[0].exercises[0].originalBarbellName).toBe('Barbell Back Squat')

    // Test restoration
    const restored = adaptFullPlanForTravel(adapted.planJson, 'commercial_full_gym', adapted.planTitle)
    expect(restored.planTitle).toBe('Phase 2 Hypertrophy')
    expect(restored.planJson.isTravelAdapted).toBe(false)
    expect(restored.planJson.workouts[0].exercises[0].name).toBe('Barbell Back Squat')
  })

  it('safely handles empty or undefined exercise names without throwing', () => {
    const emptyResult = adaptExerciseForTravel('', 'hotel_dumbbells_only')
    expect(emptyResult.name).toBeDefined()
    expect(emptyResult.tempo).toBeDefined()

    const adaptedEmptyArray = adaptWorkoutForTravel([], 'hotel_dumbbells_only')
    expect(adaptedEmptyArray).toEqual([])
  })
})

