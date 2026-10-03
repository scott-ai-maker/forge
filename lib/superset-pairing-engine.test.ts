import { describe, it, expect } from 'vitest'
import {
  isAntagonistPair,
  hasExplicitSupersetTag,
  detectAndGroupSupersets,
} from './superset-pairing-engine'

describe('NASM Smart Superset & Circuit Pairing Engine', () => {
  it('identifies standard antagonist pairs accurately', () => {
    expect(isAntagonistPair('Barbell Bench Press', 'Bent-Over Barbell Row').isMatch).toBe(true)
    expect(isAntagonistPair('Biceps Dumbbell Curl', 'Triceps Cable Pushdown').isMatch).toBe(true)
    expect(isAntagonistPair('Barbell Back Squat', 'Romanian Deadlift').isMatch).toBe(true)
    expect(isAntagonistPair('Barbell Back Squat', 'Leg Extension').isMatch).toBe(false)
  })

  it('detects explicit 1A / 1B notation in exercise names or notes', () => {
    const ex1A = { name: '1A. Dumbbell Incline Press', sets: '3', reps: '10' }
    const ex1B = { name: '1B. Seated Cable Row', sets: '3', reps: '10' }

    expect(hasExplicitSupersetTag(ex1A).isTagged).toBe(true)
    expect(hasExplicitSupersetTag(ex1A).groupNumber).toBe('1')
    expect(hasExplicitSupersetTag(ex1A).subLetter).toBe('A')

    const grouped = detectAndGroupSupersets([ex1A, ex1B])
    expect(grouped.length).toBe(1)
    expect(grouped[0].isSuperset).toBe(true)
    if (grouped[0].isSuperset) {
      expect(grouped[0].pair.exerciseA.name).toBe('1A. Dumbbell Incline Press')
      expect(grouped[0].pair.exerciseB.name).toBe('1B. Seated Cable Row')
      expect(grouped[0].pair.transitionRestSeconds).toBe(15)
    }
  })

  it('clusters antagonist exercises into supersets automatically', () => {
    const workout = [
      { name: 'Dumbbell Bench Press', sets: '3', reps: '12' },
      { name: 'Single-Arm Dumbbell Row', sets: '3', reps: '12' },
      { name: 'Plank', sets: '3', reps: '60s' },
    ]

    const grouped = detectAndGroupSupersets(workout, 2)
    expect(grouped.length).toBe(2)
    expect(grouped[0].isSuperset).toBe(true)
    expect(grouped[1].isSuperset).toBe(false)
  })

  it('detects Phase 5 Power superset complexes (Heavy Strength + Explosive Plyo)', () => {
    const workout = [
      { name: 'Barbell Back Squat', sets: '4', reps: '3', notes: '85% 1RM Heavy Potentiation' },
      { name: 'Squat Jumps', sets: '4', reps: '6', notes: 'Explosive plyometric power' },
    ]

    const grouped = detectAndGroupSupersets(workout, 5)
    expect(grouped.length).toBe(1)
    expect(grouped[0].isSuperset).toBe(true)
    if (grouped[0].isSuperset) {
      expect(grouped[0].pair.category).toBe('phase5_power')
      expect(grouped[0].pair.compoundRestSeconds).toBe(90)
    }
  })

  it('strictly prohibits superset auto-clustering in Phase 1 (Stabilization Endurance)', () => {
    const workout = [
      { name: 'Dumbbell Bench Press', sets: '3', reps: '15', tempo: '4/2/1' },
      { name: 'Single-Arm Dumbbell Row', sets: '3', reps: '15', tempo: '4/2/1' },
      { name: 'Single-Leg Balance Reach', sets: '3', reps: '12' },
    ]

    const grouped = detectAndGroupSupersets(workout, 1)
    expect(grouped.length).toBe(3)
    expect(grouped.every(g => !g.isSuperset)).toBe(true)
  })

  it('strictly prohibits superset auto-clustering in Phase 4 (Maximal Strength)', () => {
    const workout = [
      { name: 'Barbell Bench Press', sets: '5', reps: '3', rest: '3 min' },
      { name: 'Bent-Over Barbell Row', sets: '5', reps: '3', rest: '3 min' },
    ]

    const grouped = detectAndGroupSupersets(workout, 4)
    expect(grouped.length).toBe(2)
    expect(grouped[0].isSuperset).toBe(false)
    expect(grouped[1].isSuperset).toBe(false)
  })

  it('detects Phase 2 Strength + Stabilization contrast pairs', () => {
    const workout = [
      { name: 'Barbell Bench Press', sets: '3', reps: '8', tempo: '2/0/2' },
      { name: 'Stability Ball Push-Up', sets: '3', reps: '10', tempo: '4/2/1' },
    ]

    const grouped = detectAndGroupSupersets(workout, 2)
    expect(grouped.length).toBe(1)
    expect(grouped[0].isSuperset).toBe(true)
    if (grouped[0].isSuperset) {
      expect(grouped[0].pair.category).toBe('phase2_endurance')
      expect(grouped[0].pair.transitionRestSeconds).toBe(0)
    }
  })
})

