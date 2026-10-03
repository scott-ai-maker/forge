import { describe, expect, it } from 'vitest'
import {
  generate12WeekMacrocycle,
  insertDeloadWeek,
  acceleratePhaseTransition,
  extendCurrentPhase,
  applySetbackCorrection,
  updateMicrocycleWeek,
} from './periodization-roadmap'

describe('periodization-roadmap', () => {
  it('generates a complete 12-week macrocycle across 4 phases with acute variables', () => {
    const roadmap = generate12WeekMacrocycle(5)

    expect(roadmap.totalWeeks).toBe(12)
    expect(roadmap.currentWeek).toBe(5)
    expect(roadmap.phases.length).toBe(4)
    expect(roadmap.weeks.length).toBe(12)
    expect(roadmap.adaptationVelocity).toBe('standard')
    expect(roadmap.weeks[0].tempo).toBe('4/2/1 (Slow Eccentric)')
    expect(roadmap.weeks[0].targetIntensity1RmPercent).toBe(55)
  })

  it('correctly marks completed, current, and upcoming weeks based on current week', () => {
    const roadmap = generate12WeekMacrocycle(6)

    const completed = roadmap.weeks.filter(w => w.status === 'completed')
    const current = roadmap.weeks.filter(w => w.status === 'current')
    const upcoming = roadmap.weeks.filter(w => w.status === 'upcoming')

    expect(completed.length).toBe(5)
    expect(current.length).toBe(1)
    expect(current[0].weekNumber).toBe(6)
    expect(upcoming.length).toBe(6)
  })

  it('identifies scheduled re-assessment milestone weeks (Week 1, 8, 12)', () => {
    const roadmap = generate12WeekMacrocycle(1)
    const reassessmentWeeks = roadmap.weeks.filter(w => w.isReassessmentWeek).map(w => w.weekNumber)

    expect(reassessmentWeeks).toContain(1)
    expect(reassessmentWeeks).toContain(8)
    expect(reassessmentWeeks).toContain(12)
  })

  it('inserts an active restorative deload week and shifts downstream weeks seamlessly', () => {
    const initial = generate12WeekMacrocycle(3)
    const modulated = insertDeloadWeek(initial, 4, 'Acute knee soreness - active SMR deload inserted')

    expect(modulated.totalWeeks).toBe(13)
    expect(modulated.weeks.length).toBe(13)
    expect(modulated.adaptationVelocity).toBe('setback')
    expect(modulated.coachCalibratedAt).toBeDefined()

    const week4 = modulated.weeks.find(w => w.weekNumber === 4)
    expect(week4).toBeDefined()
    expect(week4?.isDeloadWeek).toBe(true)
    expect(week4?.theme).toContain('Active Restorative Deload')
    expect(week4?.targetIntensity1RmPercent).toBe(50)
    expect(week4?.coachWeeklyMemo).toContain('Acute knee soreness')

    // Verify downstream week 4 was shifted to week 5
    const week5 = modulated.weeks.find(w => w.weekNumber === 5)
    expect(week5?.phase).toBe('Phase 1: Stabilization')
  })

  it('accelerates phase transitions for athletes who conquer milestones early', () => {
    const initial = generate12WeekMacrocycle(3)
    // Athlete mastered stabilization in Week 3, fast track to Phase 2 at Week 4
    const accelerated = acceleratePhaseTransition(initial, 4, 2, 'Passed OHSA early with 0 compensations')

    expect(accelerated.adaptationVelocity).toBe('accelerated')
    const week4 = accelerated.weeks.find(w => w.weekNumber === 4)
    expect(week4?.phaseNumber).toBe(2)
    expect(week4?.theme).toContain('Accelerated')
    expect(week4?.targetIntensity1RmPercent).toBe(75)
    expect(week4?.coachWeeklyMemo).toContain('Passed OHSA early')
  })

  it('extends current phase for athletes slower to develop or needing extra stabilization', () => {
    const initial = generate12WeekMacrocycle(4)
    // Extend Phase 1 by 2 weeks
    const extended = extendCurrentPhase(initial, 1, 2, 'Reinforce core stability and rotator cuff endurance')

    expect(extended.totalWeeks).toBe(14)
    expect(extended.adaptationVelocity).toBe('remedial')
    const phase1Weeks = extended.weeks.filter(w => w.phaseNumber === 1)
    expect(phase1Weeks.length).toBe(6) // 4 base + 2 extended
  })

  it('applies acute setback correction for joint flare-ups', () => {
    const initial = generate12WeekMacrocycle(6)
    const modulated = applySetbackCorrection(initial, 6, 'Shoulder impingement flare-up')

    expect(modulated.adaptationVelocity).toBe('setback')
    const week6 = modulated.weeks.find(w => w.weekNumber === 6)
    expect(week6?.tempo).toBe('4/2/1 (Controlled Tempo)')
    expect(week6?.targetIntensity1RmPercent).toBe(50)
    expect(week6?.theme).toContain('Setback Mitigation: Shoulder impingement')
  })

  it('allows granular microcycle editing for specific weeks', () => {
    const initial = generate12WeekMacrocycle(2)
    const updated = updateMicrocycleWeek(initial, 2, {
      theme: 'Custom High-Velocity Eccentric Session',
      targetIntensity1RmPercent: 62,
      coachWeeklyMemo: 'Strict 5-second eccentric tempo on all goblet squats.',
    })

    const week2 = updated.weeks.find(w => w.weekNumber === 2)
    expect(week2?.theme).toBe('Custom High-Velocity Eccentric Session')
    expect(week2?.targetIntensity1RmPercent).toBe(62)
    expect(week2?.coachWeeklyMemo).toBe('Strict 5-second eccentric tempo on all goblet squats.')
  })
})


