import { describe, it, expect } from 'vitest'
import {
  calculateSessionFatigueCnsIndex,
} from '@/lib/session-fatigue-cns-index'

describe('SessionFatigueCnsSummaryModal Engine & Component Logic', () => {
  it('generates complete post-workout CNS readiness report with accurate training load', () => {
    const report = calculateSessionFatigueCnsIndex({
      sessionDurationMinutes: 55,
      sessionRpe: 8.5,
      setLogs: [
        { exercise_name: 'Barbell Back Squat', weight_kg: 120, reps: 6, rpe: 8.5, rir: 1.5 },
        { exercise_name: 'Barbell Back Squat', weight_kg: 120, reps: 6, rpe: 9, rir: 1 },
        { exercise_name: 'Barbell Back Squat', weight_kg: 120, reps: 6, rpe: 9.5, rir: 0.5 },
        { exercise_name: 'Romanian Deadlift', weight_kg: 100, reps: 8, rpe: 8, rir: 2 },
        { exercise_name: 'Romanian Deadlift', weight_kg: 100, reps: 8, rpe: 8.5, rir: 1.5 },
      ],
    })

    expect(report.sessionRpe).toBe(8.5)
    expect(report.fosterTrainingLoadAu).toBe(468) // 8.5 * 55
    expect(report.totalWorkingSets).toBe(5)
    expect(report.axialLoadingSetsCount).toBe(5) // Squat and RDL
    expect(report.cnsScore).toBeGreaterThanOrEqual(40)
    expect(report.cnsScore).toBeLessThanOrEqual(95)
    expect(report.recoveryHoursNeeded).toBeGreaterThanOrEqual(24)
  })

  it('enforces strict neutral grip guardrail audit for sessions with hammer curls', () => {
    const report = calculateSessionFatigueCnsIndex({
      sessionDurationMinutes: 40,
      sessionRpe: 7.5,
      setLogs: [
        { exercise_name: 'Dumbbell Hammer Curl', weight_kg: 18, reps: 10, rpe: 8, rir: 2 },
        { exercise_name: 'Single Leg Hammer Curl', weight_kg: 16, reps: 10, rpe: 8, rir: 2 },
      ],
    })

    expect(report.hammerCurlGuardrailVerified).toBe(true)
    expect(report.guardrailMessage).toBeDefined()
    expect(report.guardrailMessage).toContain('Strict neutral hammer grip protocol verified')
    expect(report.guardrailMessage).toContain('thumbs pointing up')
    expect(report.guardrailMessage).toContain('zero wrist twisting')
  })
})
