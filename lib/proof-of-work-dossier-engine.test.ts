import { describe, expect, it } from 'vitest'
import {
  estimate1Rm,
  buildProofOfWorkDossier,
  encodeProofOfWorkToken,
  decodeProofOfWorkToken,
} from './proof-of-work-dossier-engine'

describe('Proof of Work Dossier Engine', () => {
  describe('estimate1Rm', () => {
    it('returns exact weight for 1 rep', () => {
      expect(estimate1Rm(315, 1)).toBe(315)
    })

    it('calculates accurate 1RM using Brzycki formula for moderate reps', () => {
      // 225 x 5 reps -> 225 * (36 / 32) = 253.125 -> 253 lbs
      expect(estimate1Rm(225, 5)).toBe(253)
    })

    it('handles high rep sets gracefully', () => {
      // 100 lbs x 15 reps -> 100 * (1 + 0.0333 * 15) = 150 lbs
      expect(estimate1Rm(100, 15)).toBe(150)
    })

    it('returns 0 for non-positive values', () => {
      expect(estimate1Rm(0, 5)).toBe(0)
      expect(estimate1Rm(100, 0)).toBe(0)
    })
  })

  describe('buildProofOfWorkDossier', () => {
    it('builds a complete executive dossier with default fallbacks', () => {
      const dossier = buildProofOfWorkDossier({
        athleteName: 'Alexander Hayes',
        sanctuaryFocusScore: 98,
        sanctuaryBreathsCount: 24,
      })

      expect(dossier.athleteName).toBe('Alexander Hayes')
      expect(dossier.athleteInitials).toBe('AH')
      expect(dossier.docRefId).toMatch(/^FORGE-POW-[0-9A-F]{4}-\d{4}$/)
      expect(dossier.verificationSeal).toMatch(/^FORGE-SEAL-[0-9A-F]{4}-VERIFIED$/)
      expect(dossier.totalTonnageLbs).toBeGreaterThan(0)
      expect(dossier.compoundLifts.length).toBe(5)
      expect(dossier.sanctuaryAudit.averageFocusScore).toBe(98)
      expect(dossier.sanctuaryAudit.tier).toBe('DIAMOND')
      expect(dossier.acwrAudit.zone).toBe('Sweet Spot')
      expect(dossier.coachGordonAttestation.credentials).toContain('NASM Master Trainer Candidate')
      expect(dossier.peerInvitation.shareUrl).toContain('https://forgeathletic.com/r/')
      expect(dossier.shareToken).toBeDefined()
    })

    it('updates compound lifts when actual personal records are provided', () => {
      const dossier = buildProofOfWorkDossier({
        athleteName: 'Sarah Jenkins',
        personalRecords: [
          {
            exercise_name: 'Barbell Back Squat',
            weight_lbs: 265,
            reps: 5,
            achieved_at: '2026-10-15',
          },
        ],
      })

      const squat = dossier.compoundLifts.find(c => c.exerciseName === 'Barbell Back Squat')
      expect(squat).toBeDefined()
      // 265 x 5 -> estimated ~298 lbs
      expect(squat!.current1RmLbs).toBe(298)
      expect(squat!.topSetDisplay).toBe('265 lbs × 5 reps')
      expect(squat!.improvementPct).toBeGreaterThan(15)
    })

    it('assigns correct Sanctuary tier based on focus score', () => {
      const d1 = buildProofOfWorkDossier({ athleteName: 'A', sanctuaryFocusScore: 97 })
      expect(d1.sanctuaryAudit.tier).toBe('DIAMOND')

      const d2 = buildProofOfWorkDossier({ athleteName: 'B', sanctuaryFocusScore: 88 })
      expect(d2.sanctuaryAudit.tier).toBe('GOLD')

      const d3 = buildProofOfWorkDossier({ athleteName: 'C', sanctuaryFocusScore: 75 })
      expect(d3.sanctuaryAudit.tier).toBe('SILVER')

      const d4 = buildProofOfWorkDossier({ athleteName: 'D', sanctuaryFocusScore: 50 })
      expect(d4.sanctuaryAudit.tier).toBe('BRONZE')
    })
  })

  describe('Token Encoding & Decoding', () => {
    it('round-trips dossier data accurately through URL-safe tokens', () => {
      const original = buildProofOfWorkDossier({
        athleteName: 'Marcus Vance',
        optPhase: 3,
        phaseName: 'Muscular Development / Hypertrophy',
        currentMicrocycleWeek: 4,
        sanctuaryFocusScore: 94,
        referralCode: 'MARCUS-VIP',
      })

      const token = encodeProofOfWorkToken(original)
      expect(typeof token).toBe('string')
      expect(token).not.toContain('+')
      expect(token).not.toContain('/')
      expect(token).not.toContain('=')

      const decoded = decodeProofOfWorkToken(token)
      expect(decoded).not.toBeNull()
      expect(decoded!.athleteName).toBe('Marcus Vance')
      expect(decoded!.docRefId).toBe(original.docRefId)
      expect(decoded!.totalTonnageLbs).toBe(original.totalTonnageLbs)
      expect(decoded!.sanctuaryAudit.averageFocusScore).toBe(94)
      expect(decoded!.peerInvitation.referralCode).toBe('MARCUS-VIP')
      expect(decoded!.compoundLifts.length).toBe(original.compoundLifts.length)
    })

    it('returns null for corrupted or invalid tokens', () => {
      expect(decodeProofOfWorkToken('')).toBeNull()
      expect(decodeProofOfWorkToken('short')).toBeNull()
      expect(decodeProofOfWorkToken('invalid-base-64-corrupted-!@#$%')).toBeNull()
    })
  })
})
