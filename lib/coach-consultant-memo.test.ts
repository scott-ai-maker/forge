import { describe, expect, it } from 'vitest'
import { generateConsultantMemo } from './coach-consultant-memo'

describe('coach-consultant-memo', () => {
  it('generates an executive memo with 2-for-2 progression overload for high adherence and recovery', () => {
    const memo = generateConsultantMemo({
      clientName: 'Marcus Vance',
      optPhase: 2,
      totalSetsLogged: 48,
      targetSetsPlanned: 50,
      avgReadiness: 88,
      cexStreakDays: 7,
      topPrBreakthrough: 'Barbell Squat 335 lbs x 5 reps',
    })

    expect(memo.headline).toContain('Phase 2')
    expect(memo.recoveryTone).toBe('Optimal (Green Light)')
    expect(memo.performanceReview).toContain('335 lbs')
    expect(memo.recommendedProgression).toContain('NASM 2-for-2 Progression Trigger')
    expect(memo.fullMemoMarkdown).toContain('Scott Gordon')
    expect(memo.fullMemoMarkdown).toContain('Forge Athletic')
  })

  it('triggers recovery modulation when client readiness indicates fatigue', () => {
    const memo = generateConsultantMemo({
      clientName: 'Elena Rostova',
      optPhase: 4,
      totalSetsLogged: 30,
      targetSetsPlanned: 45,
      avgReadiness: 48,
      cexStreakDays: 2,
      activeKineticCompensation: 'Knee valgus on heavy sets',
    })

    expect(memo.recoveryTone).toBe('Fatigue Alert (Recovery Shift)')
    expect(memo.biomechanicalPrescription).toContain('Knee valgus')
    expect(memo.recommendedProgression).toContain('Recovery Modulation')
  })
})

