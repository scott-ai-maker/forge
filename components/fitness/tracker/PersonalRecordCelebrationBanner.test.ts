import { describe, it, expect } from 'vitest'
import { generatePersonalRecordSeal, verifyCryptographicSeal } from '@/lib/cryptographic-seal'
import type { PrDetectionResult } from '@/lib/personal-record-engine'

describe('PersonalRecordCelebrationBanner Institutional Standards', () => {
  const mockPr: PrDetectionResult = {
    isNewPr: true,
    isFirstRecord: false,
    exerciseName: 'Barbell Deadlift',
    previousBest1RmLbs: 405,
    previousBest1RmKg: 183.7,
    new1RmLbs: 425,
    new1RmKg: 192.8,
    deltaLbs: 20,
    percentageIncrease: 4.9,
    loggedWeightLbs: 385,
    loggedReps: 3,
  }

  it('generates an audited sovereign peak seal for PR breakthroughs', () => {
    const seal = generatePersonalRecordSeal({
      exerciseName: mockPr.exerciseName,
      weightLbsOrKg: mockPr.loggedWeightLbs,
      reps: mockPr.loggedReps,
      date: '2026-09-12',
    })

    expect(seal).toMatch(/^GAA-SIG-[0-9A-F]{4}-PEAK$/)
    expect(verifyCryptographicSeal(seal)).toBe(true)
  })

  it('computes consistent verification hashes regardless of casing or whitespace', () => {
    const seal1 = generatePersonalRecordSeal({
      exerciseName: 'Barbell Deadlift',
      weightLbsOrKg: 385,
      reps: 3,
      date: '2026-09-12',
    })
    const seal2 = generatePersonalRecordSeal({
      exerciseName: '  barbell deadlift  ',
      weightLbsOrKg: 385,
      reps: 3,
      date: '2026-09-12',
    })
    expect(seal1).toBe(seal2)
  })

  it('accurately formats load telemetry and eliminates floating-point drift (e.g. 24.99997 -> 25)', async () => {
    const { formatWeightVal } = await import('./PersonalRecordCelebrationBanner')
    expect(formatWeightVal(24.999970268734998)).toBe('25')
    expect(formatWeightVal(25)).toBe('25')
    expect(formatWeightVal(22.5)).toBe('22.5')
    expect(formatWeightVal(22.54)).toBe('22.5')
    expect(formatWeightVal(22.56)).toBe('22.6')
    expect(formatWeightVal(0)).toBe('0')
    expect(formatWeightVal(Number.NaN)).toBe('0')
  })

  it('detectPersonalRecord sanitizes unrounded floating-point weights', async () => {
    const { detectPersonalRecord } = await import('@/lib/personal-record-engine')
    const result = detectPersonalRecord(
      {
        exerciseName: 'Dumbbell Bench Press',
        weightLbs: 24.999970268734998,
        reps: 15,
      },
      []
    )
    expect(result.loggedWeightLbs).toBe(25)
    expect(result.isNewPr).toBe(true)
  })
})
