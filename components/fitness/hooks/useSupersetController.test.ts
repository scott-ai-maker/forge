import { describe, expect, it } from 'vitest'
import {
  computeSupersetGrouping,
  validateSupersetToggle,
} from './useSupersetController'
import type { ExerciseItemInfo } from '@/lib/superset-pairing-engine'

describe('useSupersetController Logic & Phase Governance', () => {
  const sampleExercises: ExerciseItemInfo[] = [
    {
      name: 'Barbell Bench Press',
      sets: '3',
      reps: '8-10',
      tempo: '2/0/2',
    },
    {
      name: 'Bent-Over Barbell Row',
      sets: '3',
      reps: '8-10',
      tempo: '2/0/2',
    },
  ]

  it('prohibits supersets in Phase 1 (Stabilization Endurance)', () => {
    const check = validateSupersetToggle(false, 1)
    expect(check.allowed).toBe(false)
    expect(check.nextState).toBe(false)
    expect(check.message).toContain('not prescribed in Phase 1')
  })

  it('permits superset toggling in Phase 2 (Strength Endurance)', () => {
    // Toggling from false to true
    const checkOn = validateSupersetToggle(false, 2)
    expect(checkOn.allowed).toBe(true)
    expect(checkOn.nextState).toBe(true)
    expect(checkOn.message).toContain('Supersets enabled for Phase 2')

    // Toggling from true to false
    const checkOff = validateSupersetToggle(true, 2)
    expect(checkOff.allowed).toBe(true)
    expect(checkOff.nextState).toBe(false)
    expect(checkOff.message).toContain('Supersets disabled')
  })

  it('prohibits supersets in Phase 4 (Maximal Strength)', () => {
    const check = validateSupersetToggle(false, 4)
    expect(check.allowed).toBe(false)
    expect(check.nextState).toBe(false)
    expect(check.message).toContain('not prescribed in Phase 4')
  })

  it('permits supersets in Phase 5 (Power)', () => {
    const check = validateSupersetToggle(false, 5)
    expect(check.allowed).toBe(true)
    expect(check.nextState).toBe(true)
  })

  it('groups exercises into superset pairs when enabled, and sequential entries when disabled', () => {
    // Disabled in Phase 2 -> 2 separate single entries
    const disabledGrouping = computeSupersetGrouping(sampleExercises, false, 2)
    expect(disabledGrouping.length).toBe(2)
    expect(disabledGrouping[0].isSuperset).toBe(false)
    expect(disabledGrouping[1].isSuperset).toBe(false)

    // Enabled in Phase 2 -> 1 paired superset entry
    const enabledGrouping = computeSupersetGrouping(sampleExercises, true, 2)
    expect(enabledGrouping.length).toBe(1)
    expect(enabledGrouping[0].isSuperset).toBe(true)
    if (enabledGrouping[0].isSuperset) {
      expect(enabledGrouping[0].pair.exerciseA.name).toBe('Barbell Bench Press')
      expect(enabledGrouping[0].pair.exerciseB.name).toBe('Bent-Over Barbell Row')
    }

    // Enabled in Phase 1 -> phase guardrail keeps them separate
    const phase1Grouping = computeSupersetGrouping(sampleExercises, true, 1)
    expect(phase1Grouping.length).toBe(2)
    expect(phase1Grouping[0].isSuperset).toBe(false)
  })
})
