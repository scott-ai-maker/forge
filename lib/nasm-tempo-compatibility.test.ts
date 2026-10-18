import { describe, it, expect } from 'vitest'
import {
  classifyExerciseTempoCategory,
  isExerciseExcludedFromTempo,
  resolveAppropriateTempoAndVolume,
  NASM_TEMPO_RULES,
} from './nasm-tempo-compatibility'
import { enforcePhaseExerciseConstraints } from './nasm-opt-guardrails'

describe('nasm-tempo-compatibility', () => {
  describe('classifyExerciseTempoCategory', () => {
    it('classifies SMR and static/active stretching', () => {
      expect(classifyExerciseTempoCategory('Foam Roll Calves', 'warmup')).toBe('smr_flexibility')
      expect(classifyExerciseTempoCategory('SMR Peroneals')).toBe('smr_flexibility')
      expect(classifyExerciseTempoCategory('Static Pec Stretch', 'cooldown')).toBe('smr_flexibility')
      expect(classifyExerciseTempoCategory('Active Hip Flexor Stretch')).toBe('smr_flexibility')
    })

    it('classifies static core and isometric holds', () => {
      expect(classifyExerciseTempoCategory('Front Plank', 'core')).toBe('isometric_core_hold')
      expect(classifyExerciseTempoCategory('Side Plank')).toBe('isometric_core_hold')
      expect(classifyExerciseTempoCategory('Wall Sit')).toBe('isometric_core_hold')
      expect(classifyExerciseTempoCategory('Prone Iso-Abs')).toBe('isometric_core_hold')
      expect(classifyExerciseTempoCategory('Bird Dog Hold')).toBe('isometric_core_hold')
      expect(classifyExerciseTempoCategory('Hollow Body Hold')).toBe('isometric_core_hold')
    })

    it('classifies plyometric and reactive exercises', () => {
      expect(classifyExerciseTempoCategory('Squat Jump', 'resistance')).toBe('plyometric')
      expect(classifyExerciseTempoCategory('Box Jump-Up with Stabilization Hold')).toBe('plyometric')
      expect(classifyExerciseTempoCategory('Dynamic Tuck Jumps')).toBe('plyometric')
      expect(classifyExerciseTempoCategory('Ice Skaters (Lateral Skater Jumps)')).toBe('plyometric')
      expect(classifyExerciseTempoCategory('Medicine Ball Slams')).toBe('plyometric')
      expect(classifyExerciseTempoCategory('Burpees')).toBe('plyometric')
    })

    it('classifies ballistic and Olympic triple-extension lifts', () => {
      expect(classifyExerciseTempoCategory('Kettlebell Swings')).toBe('ballistic_olympic')
      expect(classifyExerciseTempoCategory('Power Clean')).toBe('ballistic_olympic')
      expect(classifyExerciseTempoCategory('Barbell Snatch')).toBe('ballistic_olympic')
      expect(classifyExerciseTempoCategory('Clean and Jerk')).toBe('ballistic_olympic')
      expect(classifyExerciseTempoCategory('Push Press')).toBe('ballistic_olympic')
    })

    it('classifies floor-start compound deadlifts vs romanian deadlifts', () => {
      expect(classifyExerciseTempoCategory('Conventional Barbell Deadlift')).toBe('floor_compound_deadlift')
      expect(classifyExerciseTempoCategory('Barbell Sumo Deadlift')).toBe('floor_compound_deadlift')
      expect(classifyExerciseTempoCategory('Trap Bar Deadlift')).toBe('floor_compound_deadlift')

      // RDLs belong to dynamic resistance and allow controlled 4/2/1 tempo
      expect(classifyExerciseTempoCategory('Dumbbell Romanian Deadlift')).toBe('dynamic_resistance')
      expect(classifyExerciseTempoCategory('Barbell RDL')).toBe('dynamic_resistance')
      expect(classifyExerciseTempoCategory('Single-Leg Romanian Deadlift')).toBe('dynamic_resistance')
    })

    it('classifies standard dynamic resistance exercises', () => {
      expect(classifyExerciseTempoCategory('Stability Ball Dumbbell Chest Press')).toBe('dynamic_resistance')
      expect(classifyExerciseTempoCategory('Barbell Back Squat')).toBe('dynamic_resistance')
      expect(classifyExerciseTempoCategory('Seated Cable Row')).toBe('dynamic_resistance')
      expect(classifyExerciseTempoCategory('Dumbbell Bicep Curl')).toBe('dynamic_resistance')
    })
  })

  describe('isExerciseExcludedFromTempo', () => {
    it('excludes 4/2/1 tempo from static holds, plyos, ballistics, and floor deadlifts', () => {
      expect(isExerciseExcludedFromTempo('Front Plank', '4/2/1').isExcluded).toBe(true)
      expect(isExerciseExcludedFromTempo('Squat Jump', '4/2/1').isExcluded).toBe(true)
      expect(isExerciseExcludedFromTempo('Kettlebell Swing', '4/2/1').isExcluded).toBe(true)
      expect(isExerciseExcludedFromTempo('Conventional Barbell Deadlift', '4/2/1').isExcluded).toBe(true)
      expect(isExerciseExcludedFromTempo('Foam Roll Calves', '4/2/1').isExcluded).toBe(true)
    })

    it('permits 4/2/1 tempo for Phase 1 stabilization resistance exercises and RDLs', () => {
      expect(isExerciseExcludedFromTempo('Stability Ball Dumbbell Chest Press', '4/2/1').isExcluded).toBe(false)
      expect(isExerciseExcludedFromTempo('Single-Leg Dumbbell Romanian Deadlift', '4/2/1').isExcluded).toBe(false)
      expect(isExerciseExcludedFromTempo('Standing Cable Row', '4/2/1').isExcluded).toBe(false)
    })
  })

  describe('resolveAppropriateTempoAndVolume', () => {
    it('resolves static core holds with duration hold tempo and reps', () => {
      const repairs: string[] = []
      const resolved = resolveAppropriateTempoAndVolume(
        { name: 'Front Plank', tempo: '4/2/1', reps: '15' },
        1,
        repairs
      )

      expect(resolved.tempo).toBe('Hold 30-60s')
      expect(resolved.reps).toBe('30-60s hold')
      expect(repairs.length).toBeGreaterThan(0)
    })

    it('resolves Phase 1 plyometrics with 3-5s landing freeze tempo and 5-8 reps', () => {
      const repairs: string[] = []
      const resolved = resolveAppropriateTempoAndVolume(
        { name: 'Box Jump-Up', tempo: '4/2/1', reps: '15' },
        1,
        repairs
      )

      expect(resolved.tempo).toBe('Explosive -> 3-5s landing freeze')
      expect(resolved.reps).toBe('5-8')
      expect(repairs.length).toBeGreaterThan(0)
    })

    it('resolves Phase 5 plyometrics with X/0/X tempo', () => {
      const resolved = resolveAppropriateTempoAndVolume(
        { name: 'Ice Skaters', tempo: '2/0/2', reps: '10' },
        5
      )

      expect(resolved.tempo).toContain('X/0/X')
      expect(resolved.reps).toBe('10')
    })

    it('resolves ballistic kettlebell swings away from 4/2/1', () => {
      const repairs: string[] = []
      const resolved = resolveAppropriateTempoAndVolume(
        { name: 'Kettlebell Swing', tempo: '4/2/1', reps: '15' },
        1,
        repairs
      )

      expect(resolved.tempo).toBe('Explosive / 1/0/X')
      expect(repairs.length).toBeGreaterThan(0)
    })
  })

  describe('Integration with enforcePhaseExerciseConstraints', () => {
    it('repairs contraindicated 4/2/1 tempo on Front Plank in Phase 1 without ruining stabilization resistance lifts', () => {
      const repairs: string[] = []

      const plank = enforcePhaseExerciseConstraints(
        {
          block: 'core_balance',
          name: 'Front Plank',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: [],
          nasmClinicalSource: 'NASM',
        },
        1,
        repairs
      )

      expect(plank.tempo).toBe('Hold 30-60s')
      expect(plank.reps).toBe('30-60s hold')

      const chestPress = enforcePhaseExerciseConstraints(
        {
          block: 'resistance',
          name: 'Stability Ball Dumbbell Chest Press',
          sets: '3',
          reps: '15',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: [],
          nasmClinicalSource: 'NASM',
        },
        1,
        repairs
      )

      expect(chestPress.tempo).toBe('4/2/1')
      expect(chestPress.reps).toBe('15')
    })
  })
})
