import { describe, it, expect } from 'vitest'
import {
  generateExecutiveVerificationHash,
  generatePersonalRecordSeal,
  generateLongitudinalAuditSeal,
  verifyCryptographicSeal,
} from './cryptographic-seal'

describe('cryptographic-seal', () => {
  it('generates deterministic executive verification hash in GAA-SIG-XXXX-EXEC format', () => {
    const sig1 = generateExecutiveVerificationHash({
      athleteId: 'scott-exec-1',
      sessionDate: '2026-09-12',
      totalVolumeKg: 14200,
      totalSets: 24,
      nasmOptPhase: 2,
    })
    const sig2 = generateExecutiveVerificationHash({
      athleteId: 'scott-exec-1',
      sessionDate: '2026-09-12',
      totalVolumeKg: 14200,
      totalSets: 24,
      nasmOptPhase: 2,
    })
    expect(sig1).toBe(sig2)
    expect(sig1).toMatch(/^GAA-SIG-[0-9A-F]{4}-EXEC$/)
  })

  it('generates distinct hashes for different sessions or metrics', () => {
    const sigA = generateExecutiveVerificationHash({
      athleteId: 'athlete-a',
      sessionDate: '2026-09-12',
      totalVolumeKg: 5000,
      totalSets: 12,
    })
    const sigB = generateExecutiveVerificationHash({
      athleteId: 'athlete-b',
      sessionDate: '2026-09-12',
      totalVolumeKg: 5000,
      totalSets: 12,
    })
    expect(sigA).not.toBe(sigB)
  })

  it('generates deterministic personal record seal in GAA-SIG-XXXX-PEAK format', () => {
    const peakSig = generatePersonalRecordSeal({
      exerciseName: 'Barbell Back Squat',
      weightLbsOrKg: 315,
      reps: 5,
      date: '2026-09-12',
    })
    expect(peakSig).toMatch(/^GAA-SIG-[0-9A-F]{4}-PEAK$/)

    const peakSig2 = generatePersonalRecordSeal({
      exerciseName: 'barbell back squat',
      weightLbsOrKg: 315,
      reps: 5,
      date: '2026-09-12',
    })
    expect(peakSig).toBe(peakSig2)
  })

  it('generates longitudinal audit seal in GAA-SIG-XXXX-AUDIT format', () => {
    const auditSig = generateLongitudinalAuditSeal({
      athleteId: 'athlete-1',
      startDate: '2026-08-01',
      endDate: '2026-08-28',
      completedSessions: 16,
      compliancePct: 100,
    })
    expect(auditSig).toMatch(/^GAA-SIG-[0-9A-F]{4}-AUDIT$/)
  })

  it('validates authentic GAA verification hashes and rejects malformed inputs', () => {
    expect(verifyCryptographicSeal('GAA-SIG-8492-EXEC')).toBe(true)
    expect(verifyCryptographicSeal('GAA-SIG-7E2B-PEAK')).toBe(true)
    expect(verifyCryptographicSeal('GAA-SIG-F0A1-AUDIT')).toBe(true)
    expect(verifyCryptographicSeal('GAA-SIG-E3A9-7B14')).toBe(true)

    expect(verifyCryptographicSeal('')).toBe(false)
    expect(verifyCryptographicSeal('INVALID-HASH')).toBe(false)
    expect(verifyCryptographicSeal('GAA-SIG-123-EXEC')).toBe(false)
    expect(verifyCryptographicSeal('GAA-SIG-12345-EXEC')).toBe(false)
  })
})
