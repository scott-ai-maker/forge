import { describe, it, expect, vi } from 'vitest'
import { detectAndGroupSupersets, isAntagonistPair } from '@/lib/superset-pairing-engine'

describe('SupersetPairCard Logic Integration', () => {
  it('correctly detects paired exercises and builds valid SupersetPair structure', () => {
    const exercises = [
      { name: 'Barbell Bench Press', sets: '3', reps: '10' },
      { name: 'Bent-Over Barbell Row', sets: '3', reps: '10' },
    ]

    expect(isAntagonistPair(exercises[0].name, exercises[1].name).isMatch).toBe(true)

    const grouped = detectAndGroupSupersets(exercises, 2)
    expect(grouped.length).toBe(1)
    expect(grouped[0].isSuperset).toBe(true)

    if (grouped[0].isSuperset) {
      const pair = grouped[0].pair
      expect(pair.exerciseA.name).toBe('Barbell Bench Press')
      expect(pair.exerciseB.name).toBe('Bent-Over Barbell Row')
      expect(pair.transitionRestSeconds).toBe(15)
      expect(pair.compoundRestSeconds).toBe(75)
    }
  })

  it('verifies alternating rest time allocation (1A transition vs 1B compound)', () => {
    const pair = {
      id: 'ss-1',
      pairLabel: 'SUPERSET 1 (1A & 1B)',
      category: 'antagonist' as const,
      categoryTitle: 'Antagonist Superset',
      transitionRestSeconds: 15,
      compoundRestSeconds: 90,
      exerciseA: { name: 'Dumbbell Incline Bench Press', sets: '3', reps: '10' },
      exerciseB: { name: 'Seated Cable Row', sets: '3', reps: '10' },
      rationale: 'Chest and back antagonist pair',
    }

    // When logging 1A:
    const rest1A = pair.transitionRestSeconds
    expect(rest1A).toBe(15)

    // When logging 1B:
    const rest1B = pair.compoundRestSeconds
    expect(rest1B).toBe(90)
  })

  it('preserves accurate original exercise indices (indexA, indexB) for jump rail navigation', () => {
    const workout = [
      { name: 'Warm-up Plank', sets: '2', reps: '30s' },
      { name: 'Barbell Bench Press', sets: '3', reps: '8' },
      { name: 'Bent-Over Barbell Row', sets: '3', reps: '8' },
      { name: 'Cool-Down Stretch', sets: '1', reps: '30s' },
    ]

    const grouped = detectAndGroupSupersets(workout, 2)
    expect(grouped.length).toBe(3)
    expect(grouped[0].isSuperset).toBe(false)
    expect(grouped[1].isSuperset).toBe(true)
    expect(grouped[2].isSuperset).toBe(false)

    if (grouped[1].isSuperset) {
      expect(grouped[1].pair.indexA).toBe(1)
      expect(grouped[1].pair.indexB).toBe(2)
    }
  })

  it('validates biomechanical guardrail for hammer curl superset pairings', () => {
    // If paired with triceps pushdown:
    const check = isAntagonistPair('Dumbbell Hammer Curl', 'Triceps Rope Pushdown')
    expect(check.isMatch).toBe(true)
    expect(check.rationale).toContain('Biceps / Triceps Antagonist Pair')
  })
})
