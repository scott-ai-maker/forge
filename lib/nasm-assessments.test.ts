import { describe, it, expect } from 'vitest'
import {
  compareNasmAssessments,
  NASM_SUPERSET_PAIRS,
  calculateNasmCardioZones,
  evaluateNasm2For2Rule,
  calculateEstimated1Rm,
  type NasmAssessmentRecord,
} from './nasm-assessments'

describe('NASM Domain Logic & Calculators', () => {
  it('correctly calculates Tanaka target heart rate zones', () => {
    const zones = calculateNasmCardioZones(30, 60)
    expect(zones.hrMaxBpm).toBe(187)
    expect(zones.zone1.minBpm).toBe(122)
    expect(zones.zone2.minBpm).toBe(142)
    expect(zones.zone3.maxBpm).toBe(178)
  })

  it('correctly evaluates 2-for-2 progressive overload rule', () => {
    const recUpper = evaluateNasm2For2Rule({
      currentWorkingWeightKg: 80,
      targetReps: 8,
      actualRepsLastSetSession1: 10,
      actualRepsLastSetSession2: 10,
      exerciseName: 'Bench Press',
    })
    expect(recUpper.eligibleForProgression).toBe(true)
    expect(recUpper.bodyPartCategory).toBe('upper_body')
    expect(recUpper.recommendedPercentageIncrease).toBe(3.5)

    const recLower = evaluateNasm2For2Rule({
      currentWorkingWeightKg: 100,
      targetReps: 10,
      actualRepsLastSetSession1: 12,
      actualRepsLastSetSession2: 12,
      exerciseName: 'Back Squat',
    })
    expect(recLower.eligibleForProgression).toBe(true)
    expect(recLower.bodyPartCategory).toBe('lower_body')
    expect(recLower.recommendedPercentageIncrease).toBe(7.5)

    const recFail = evaluateNasm2For2Rule({
      currentWorkingWeightKg: 80,
      targetReps: 8,
      actualRepsLastSetSession1: 10,
      actualRepsLastSetSession2: 8,
      exerciseName: 'Bench Press',
    })
    expect(recFail.eligibleForProgression).toBe(false)
  })

  it('calculates 1RM estimate using Brzycki and Epley formulas', () => {
    const rm = calculateEstimated1Rm(100, 10)
    expect(rm.brzycki1RmKg).toBe(133.4)
    expect(rm.epley1RmKg).toBe(133.3)
    expect(rm.average1RmKg).toBe(133.3)
    expect(rm.percentages[80]).toBe(106.5)
  })

  it('contains standard NASM OPT superset pairings for Phase 2 and Phase 5', () => {
    expect(NASM_SUPERSET_PAIRS.length).toBeGreaterThanOrEqual(6)
    const benchPress = NASM_SUPERSET_PAIRS.find(p => p.id === 'chest-bench-press')
    expect(benchPress).toBeDefined()
    expect(benchPress?.phase2StabilizerMatch.name).toContain('Stability Ball Push-Up')
    expect(benchPress?.phase5PowerMatch.name).toContain('Medicine Ball Chest Pass')
  })

  it('compares baseline and follow-up movement screens and identifies resolved compensations', () => {
    const baseline: NasmAssessmentRecord = {
      id: 'base-1',
      client_id: 'client-1',
      coach_id: 'coach-1',
      assessment_date: '2026-01-01',
      static_posture: [],
      ohsa_findings: [
        { compensation: 'feet_turn_out', view: 'anterior', checkpoint: 'feet_ankles', severity: 'moderate' },
        { compensation: 'knees_move_inward', view: 'anterior', checkpoint: 'knees', severity: 'severe' },
      ],
      overactive_muscles: ['Gastrocnemius / Soleus', 'Tensor Fasciae Latae (TFL)', 'Adductor Complex'],
      underactive_muscles: ['Gluteus Medius / Maximus', 'Anterior Tibialis'],
      prescribed_correctives: { inhibit: [], lengthen: [], activate: [], integrate: [], summary: '' },
      cardio_vitals: {
        restingHeartRateBpm: 72,
        stepTestRecoveryHrBpm: 110,
        cardioFitnessRating: 'average',
      },
      created_at: '2026-01-01T00:00:00Z',
    }

    const followUp: NasmAssessmentRecord = {
      id: 'follow-1',
      client_id: 'client-1',
      coach_id: 'coach-1',
      assessment_date: '2026-02-15',
      static_posture: [],
      ohsa_findings: [
        { compensation: 'feet_turn_out', view: 'anterior', checkpoint: 'feet_ankles', severity: 'mild' },
      ],
      overactive_muscles: ['Gastrocnemius / Soleus'],
      underactive_muscles: ['Anterior Tibialis'],
      prescribed_correctives: { inhibit: [], lengthen: [], activate: [], integrate: [], summary: '' },
      cardio_vitals: {
        restingHeartRateBpm: 66,
        stepTestRecoveryHrBpm: 96,
        cardioFitnessRating: 'good',
      },
      created_at: '2026-02-15T00:00:00Z',
    }

    const comparison = compareNasmAssessments(baseline, followUp)
    expect(comparison.resolvedCompensations.length).toBe(1)
    expect(comparison.resolvedCompensations[0]?.compensation).toBe('knees_move_inward')
    expect(comparison.persistentCompensations.length).toBe(1)
    expect(comparison.persistentCompensations[0]?.compensation).toBe('feet_turn_out')
    expect(comparison.cardioDelta.restingHrDelta).toBe(-6)
    expect(comparison.cardioDelta.recoveryPulseDelta).toBe(-14)
    expect(comparison.overallMovementScoreDelta).toBe(50)
  })
})
