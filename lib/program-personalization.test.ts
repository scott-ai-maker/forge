import { describe, expect, it } from 'vitest'
import type { GeneratedExerciseItem, GeneratedMacrocyclePlan } from './rag-nasm-program-generator'
import { buildCoachPersonalNote, buildPersonalReason, personalizePlan } from './program-personalization'

function exercise(overrides: Partial<GeneratedExerciseItem>): GeneratedExerciseItem {
  return {
    block: 'resistance',
    name: 'Goblet Squat',
    sets: '3',
    reps: '12',
    tempo: '4/2/1',
    rest: '60s',
    coachingCues: [],
    nasmClinicalSource: 'NASM',
    ...overrides,
  }
}

describe('buildPersonalReason', () => {
  it('ties lower-body work to a knee valgus compensation', () => {
    const reason = buildPersonalReason(exercise({ name: 'Glute Bridge' }), { kineticCompensations: ['Knee Valgus'] })
    expect(reason).toMatch(/knees tracking straight/)
  })

  it('ties pulling work to an arms-forward compensation', () => {
    const reason = buildPersonalReason(exercise({ name: 'Seated Cable Row' }), { kineticCompensations: ['Arms Fall Forward'] })
    expect(reason).toMatch(/upper back/)
  })

  it('explains contraindication swaps using the athlete limitation', () => {
    const reason = buildPersonalReason(
      exercise({ name: 'Step Up', contraindicationReplacedFrom: 'Jump Lunge' }),
      { injuriesLimitations: 'Runner knee' }
    )
    expect(reason).toContain('instead of Jump Lunge')
    expect(reason).toContain('runner knee')
  })

  it('uses block-specific copy for warmup and cooldown', () => {
    expect(buildPersonalReason(exercise({ block: 'warmup', name: 'Arm Circles' }), {})).toMatch(/ready/)
    expect(buildPersonalReason(exercise({ block: 'cooldown', name: 'Child Pose' }), {})).toMatch(/recover/)
  })

  it('falls back to a goal-based reason', () => {
    expect(buildPersonalReason(exercise({ name: 'Bench Press' }), { goal: 'fat_loss' })).toMatch(/fat-loss/)
  })
})

describe('buildCoachPersonalNote', () => {
  it('addresses the athlete by first name and references their screen and limitation', () => {
    const note = buildCoachPersonalNote({
      clientName: 'Jennifer Miller',
      goal: 'fat loss',
      targetPhase: 1,
      kineticCompensations: ['Knee Valgus'],
      injuriesLimitations: 'Runner knee',
    })
    expect(note.startsWith('Jennifer, ')).toBe(true)
    expect(note).toContain('knees caving in')
    expect(note).toContain('runner knee')
    expect(note).toContain('stability phase')
  })

  it('omits the name for template sandboxes', () => {
    expect(buildCoachPersonalNote({ clientName: 'New Athlete' }).startsWith('I built')).toBe(true)
  })
})

describe('personalizePlan', () => {
  const plan = {
    planTitle: 'Test',
    primaryGoal: 'hypertrophy',
    nasmOptPhase: 3,
    phaseName: 'Muscular Development',
    totalWeeks: 4,
    sessionsPerWeek: 3,
    ragSourcesCited: [],
    strengthCardioBlendSummary: {},
    periodizationWeeklyMemos: [],
    workouts: [
      {
        day: 1,
        focus: 'Lower',
        exercises: [exercise({ name: 'Leg Press' }), exercise({ name: 'Calf Raise', whyForYou: 'Coach wrote this.' })],
      },
    ],
  } as unknown as GeneratedMacrocyclePlan

  it('fills missing reasons and note while preserving coach-authored text', () => {
    const result = personalizePlan(plan, { clientName: 'Scott Gordon' })
    expect(result.coachPersonalNote).toMatch(/^Scott, /)
    expect(result.workouts[0].exercises[0].whyForYou).toMatch(/build/)
    expect(result.workouts[0].exercises[1].whyForYou).toBe('Coach wrote this.')
  })

  it('keeps an existing coach note', () => {
    const result = personalizePlan({ ...plan, coachPersonalNote: 'Custom note' }, {})
    expect(result.coachPersonalNote).toBe('Custom note')
  })
})
