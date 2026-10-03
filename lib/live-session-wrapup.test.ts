import { describe, expect, it } from 'vitest'
import { computeLiveSessionSummary } from './live-session-wrapup'

describe('Live Session Wrap-Up Engine', () => {
  it('aggregates live session sets, tonnage, and generates a formatted message', () => {
    const sampleSets = [
      { exercise_name: 'Barbell Flat Bench Press', weight_kg: 100, reps: 8, is_warmup: false }, // ~220 lbs * 8 = 1760 lbs
      { exercise_name: 'Barbell Flat Bench Press', weight_kg: 100, reps: 8, is_warmup: false }, // ~220 lbs * 8 = 1760 lbs
      { exercise_name: 'Barbell Bent-Over Row', weight_kg: 80, reps: 10, is_warmup: false },   // ~176 lbs * 10 = 1760 lbs
      { exercise_name: 'Barbell Bent-Over Row', weight_kg: 50, reps: 10, is_warmup: true },    // warmup skipped
    ]

    const summary = computeLiveSessionSummary({
      athleteName: 'Jordan Reed',
      optPhase: 'Phase 2: Strength Endurance',
      sessionDate: '2026-08-23',
      sets: sampleSets,
      coachNotes: 'Great scapular retraction on rows.',
      recoveryDirective: 'Take 5g creatine post workout.',
    })

    expect(summary.totalSets).toBe(4)
    expect(summary.workingSets).toBe(3)
    expect(summary.uniqueExercisesCount).toBe(2)
    expect(summary.totalTonnageLbs).toBeGreaterThanOrEqual(5000)
    expect(summary.heaviestLift?.exercise).toBe('Barbell Flat Bench Press')
    expect(summary.formattedBriefingMessage).toContain('1:1 LIVE COACHING CONSULTATION RECAP')
    expect(summary.formattedBriefingMessage).toContain('Great scapular retraction on rows.')
  })

  it('handles zero sets gracefully', () => {
    const summary = computeLiveSessionSummary({
      athleteName: 'New Athlete',
      optPhase: 'Phase 1: Stabilization Endurance',
      sessionDate: '2026-08-23',
      sets: [],
    })

    expect(summary.totalTonnageLbs).toBe(0)
    expect(summary.workingSets).toBe(0)
    expect(summary.heaviestLift).toBeNull()
  })
})
