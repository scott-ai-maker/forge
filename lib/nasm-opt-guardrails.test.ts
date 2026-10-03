import { describe, it, expect } from 'vitest'
import {
  validateAndEnforceNasmOptGuardrails,
  enforcePhaseExerciseConstraints,
  substituteMissingEquipment,
  injectKineticCorrectives,
} from './nasm-opt-guardrails'
import { type GeneratedMacrocyclePlan, type GeneratedWorkoutDay } from './rag-nasm-program-generator'

describe('nasm-opt-guardrails', () => {
  it('auto-repairs Phase 1 stabilization tempo and reps when violating', () => {
    const repairs: string[] = []
    const exercise = {
      block: 'resistance' as const,
      name: 'Stability Ball Dumbbell Chest Press',
      sets: '3',
      reps: '5', // Invalid for Phase 1
      tempo: '2/0/2', // Invalid for Phase 1
      rest: '120s',
      coachingCues: ['Retract scapulae'],
      nasmClinicalSource: 'NASM-CPT 7th Ed, Ch. 14',
    }

    const sanitized = enforcePhaseExerciseConstraints(exercise, 1, repairs)

    expect(sanitized.tempo).toBe('4/2/1')
    expect(sanitized.reps).toBe('12-15')
    expect(sanitized.rest).toBe('0-60s')
    expect(repairs.length).toBeGreaterThanOrEqual(2)
  })

  it('auto-repairs Phase 4 maximal strength reps and rest intervals', () => {
    const repairs: string[] = []
    const exercise = {
      block: 'resistance' as const,
      name: 'Barbell Back Squat',
      sets: '5',
      reps: '15', // Invalid for Phase 4
      tempo: '4/2/1',
      rest: '30s', // Invalid for Phase 4
      coachingCues: ['Brace core'],
      nasmClinicalSource: 'NASM-CPT 7th Ed, Ch. 17',
    }

    const sanitized = enforcePhaseExerciseConstraints(exercise, 4, repairs)

    expect(sanitized.reps).toBe('3-5')
    expect(sanitized.rest).toBe('2-3 min')
    expect(repairs.length).toBeGreaterThanOrEqual(1)
  })

  it('auto-substitutes barbell exercises when client only has dumbbells and bands', () => {
    const repairs: string[] = []
    const substituted = substituteMissingEquipment(
      'Barbell Bench Press',
      ['Dumbbells', 'Resistance Bands', 'Exercise Mat'],
      repairs
    )

    expect(substituted).toBe('Dumbbell Flat Chest Press')
    expect(repairs.length).toBe(1)
    expect(repairs[0]).toContain('Substituted')
  })

  it('auto-substitutes Lying Leg Curl to Floor Bridge when client has stability ball', () => {
    const repairs: string[] = []
    const substituted = substituteMissingEquipment(
      'Lying Leg Curl',
      ['Bodyweight', 'Bench', 'Dumbbells', 'Foam Roller', 'Medicine Ball', 'Stability Ball'],
      repairs
    )

    expect(substituted).toBe('Floor Bridge')
    expect(repairs.length).toBe(1)
    expect(repairs[0]).toContain("Substituted 'Lying Leg Curl' with 'Floor Bridge'")
  })

  it('auto-substitutes Lying Leg Curl to Dumbbell Romanian Deadlift when client has dumbbells only', () => {
    const repairs: string[] = []
    const substituted = substituteMissingEquipment(
      'Lying Leg Curl',
      ['Bodyweight', 'Dumbbells'],
      repairs
    )

    expect(substituted).toBe('Dumbbell Romanian Deadlift')
    expect(repairs.length).toBe(1)
  })

  it('auto-substitutes Lying Leg Curl to Resistance Band Hamstring Curl when client has bands only', () => {
    const repairs: string[] = []
    const substituted = substituteMissingEquipment(
      'Lying Leg Curl',
      ['Resistance Bands'],
      repairs
    )

    expect(substituted).toBe('Resistance Band Hamstring Curl')
    expect(repairs.length).toBe(1)
  })

  it('auto-substitutes Lying Leg Curl to Single Leg Floor Bridge for bodyweight-only athletes', () => {
    const repairs: string[] = []
    const substituted = substituteMissingEquipment(
      'Lying Leg Curl',
      ['Bodyweight'],
      repairs
    )

    expect(substituted).toBe('Single Leg Floor Bridge')
    expect(repairs.length).toBe(1)
  })

  it('preserves Lying Leg Curl for full commercial gym athletes', () => {
    const repairs: string[] = []
    const substituted = substituteMissingEquipment(
      'Lying Leg Curl',
      ['Full Commercial Gym'],
      repairs
    )

    expect(substituted).toBe('Lying Leg Curl')
    expect(repairs.length).toBe(0)
  })

  it('injects kinetic compensation correctives into warmup protocol', () => {
    const repairs: string[] = []
    const mockDay: GeneratedWorkoutDay = {
      day: 1,
      dayName: 'Day 1',
      focus: 'Lower Body',
      nasmOptPhase: 1,
      phaseName: 'Stabilization Endurance',
      estimatedDurationMins: 60,
      warmupProtocol: {
        inhibitSmr: [],
        lengthenStaticStretch: [],
        activateDynamic: [],
      },
      exercises: [],
      dailyPeriodizationMemo: 'Focus on form',
    }

    const corrected = injectKineticCorrectives(mockDay, ['knees_cave_in', 'arms_fall_forward'], repairs)

    expect(corrected.warmupProtocol.inhibitSmr.some(i => i.includes('TFL'))).toBe(true)
    expect(corrected.warmupProtocol.activateDynamic.some(a => a.includes('Tube Walking'))).toBe(true)
    expect(corrected.warmupProtocol.inhibitSmr.some(i => i.includes('Latissimus'))).toBe(true)
    expect(repairs.length).toBe(2)
  })

  it('runs master validation pipeline across full macrocycle and returns audit', () => {
    const mockPlan: GeneratedMacrocyclePlan = {
      planTitle: 'Custom Athletic Protocol',
      primaryGoal: 'fat_loss',
      nasmOptPhase: 1,
      phaseName: 'Stabilization Endurance',
      totalWeeks: 4,
      sessionsPerWeek: 3,
      ragSourcesCited: [],
      strengthCardioBlendSummary: {
        goal: 'Fat Loss',
        blendRatio: '50/50',
        strengthPct: 50,
        cardioPct: 50,
        weeklyStrengthSessions: 3,
        weeklyCardioMinutes: 90,
        primaryCardioStages: 'Stage 1',
        interferenceShieldStrategy: 'Separation',
        clinicalGuideline: 'NASM',
      },
      workouts: [
        {
          day: 1,
          dayName: 'Day 1',
          focus: 'Full Body Stabilization',
          nasmOptPhase: 1,
          phaseName: 'Stabilization Endurance',
          estimatedDurationMins: 60,
          warmupProtocol: {
            inhibitSmr: [],
            lengthenStaticStretch: [],
            activateDynamic: [],
          },
          exercises: [
            {
              block: 'resistance',
              name: 'Barbell Deadlift',
              sets: '3',
              reps: '5',
              tempo: '2/0/2',
              rest: '120s',
              coachingCues: [],
              nasmClinicalSource: 'NASM',
            },
          ],
          dailyPeriodizationMemo: 'Memo',
        },
      ],
      periodizationWeeklyMemos: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    }

    const { sanitizedPlan, audit } = validateAndEnforceNasmOptGuardrails(mockPlan, {
      equipmentAccess: ['Dumbbells', 'Bands'],
      kineticCompensations: ['knees_cave_in'],
      targetPhase: 1,
    })

    expect(sanitizedPlan.workouts[0].exercises[0].name).toBe('Dumbbell Romanian Deadlift')
    expect(sanitizedPlan.workouts[0].exercises[0].tempo).toBe('4/2/1')
    expect(sanitizedPlan.workouts[0].exercises[0].reps).toBe('12-15')
    expect(audit.violationsFound).toBeGreaterThan(0)
    expect(audit.isCompliant).toBe(false) // Violations were found and repaired
    expect(audit.repairsApplied.length).toBeGreaterThan(0)
  })
})

