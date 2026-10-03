import { describe, it, expect } from 'vitest'
import {
  RPE_SCALE_POINTS,
  normalizeRpeValue,
  normalizeRirValue,
  getRpeScalePoint,
  mapRpeToRir,
  mapRirToRpe,
  getFatigueSafetyNotice,
} from './rpe-exertion-scale'

describe('RPE & RIR Exertion Science Engine', () => {
  describe('Value Normalization', () => {
    it('normalizes undefined, null, and empty inputs to default 7.0', () => {
      expect(normalizeRpeValue(undefined)).toBe(7.0)
      expect(normalizeRpeValue(null)).toBe(7.0)
      expect(normalizeRpeValue('')).toBe(7.0)
      expect(normalizeRpeValue('invalid')).toBe(7.0)
    })

    it('clamps RPE to valid 1.0 - 10.0 range', () => {
      expect(normalizeRpeValue(0.5)).toBe(1.0)
      expect(normalizeRpeValue(12)).toBe(10.0)
      expect(normalizeRpeValue('8.5')).toBe(8.5)
      expect(normalizeRpeValue(9.24)).toBe(9.2)
    })

    it('clamps RIR to valid 0.0 - 6.0 range', () => {
      expect(normalizeRirValue(-1)).toBe(0.0)
      expect(normalizeRirValue(8)).toBe(6.0)
      expect(normalizeRirValue('1.5')).toBe(1.5)
    })
  })

  describe('Scale Point Resolution', () => {
    it('accurately resolves exact RPE points', () => {
      const pt8 = getRpeScalePoint(8.0)
      expect(pt8.rpe).toBe(8.0)
      expect(pt8.rir).toBe(2.0)
      expect(pt8.shortLabel).toContain('Hypertrophy')
      expect(pt8.fatigueTier).toBe('moderate')

      const pt10 = getRpeScalePoint(10.0)
      expect(pt10.rpe).toBe(10.0)
      expect(pt10.rir).toBe(0.0)
      expect(pt10.fatigueTier).toBe('maximal')
    })

    it('resolves closest point for fractional values', () => {
      const pt = getRpeScalePoint(7.8)
      expect(pt.rpe).toBe(8.0)

      const ptLow = getRpeScalePoint(4.0)
      expect(ptLow.rpe).toBe(4.0)
      expect(ptLow.shortLabel).toContain('Warm-up')
    })

    it('verifies RPE scale points have valid colors and non-empty strings', () => {
      for (const pt of RPE_SCALE_POINTS) {
        expect(pt.colorHex).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(pt.shortLabel.length).toBeGreaterThan(0)
        expect(pt.effortDescription.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Two-way RPE and RIR Conversions', () => {
    it('converts RPE to RIR accurately', () => {
      expect(mapRpeToRir(10)).toBe(0)
      expect(mapRpeToRir(9)).toBe(1)
      expect(mapRpeToRir(8)).toBe(2)
      expect(mapRpeToRir(7)).toBe(3)
      expect(mapRpeToRir(6.5)).toBe(3.5)
    })

    it('converts RIR to RPE accurately', () => {
      expect(mapRirToRpe(0)).toBe(10)
      expect(mapRirToRpe(1)).toBe(9)
      expect(mapRirToRpe(2)).toBe(8)
      expect(mapRirToRpe(3)).toBe(7)
    })
  })

  describe('Fatigue Safety & Biomechanical Guardrails', () => {
    it('emits critical advisory when RPE reaches 9.5 or 10', () => {
      const notice = getFatigueSafetyNotice('Barbell Back Squat', 10, 0)
      expect(notice).not.toBeNull()
      expect(notice?.level).toBe('critical')
      expect(notice?.hasWarning).toBe(true)
      expect(notice?.message).toContain('kinetic chain')
    })

    it('enforces strict neutral hammer grip guardrail for hammer curls at peak exertion', () => {
      const notice = getFatigueSafetyNotice('Dumbbell Hammer Curl', 9.5, 0.5)
      expect(notice).not.toBeNull()
      expect(notice?.level).toBe('critical')
      expect(notice?.message).toContain('STRICT neutral hammer grip')
      expect(notice?.message).toContain('ZERO twisting or supination')
      expect(notice?.message).toContain('thumbs pointing up')
    })

    it('provides caution guidance for high working sets (RPE 8.5–9)', () => {
      const notice = getFatigueSafetyNotice('Barbell Bench Press', 8.5, 1.5)
      expect(notice).not.toBeNull()
      expect(notice?.level).toBe('caution')
      expect(notice?.title).toContain('High Intensity')
    })

    it('provides sweet spot info for RPE 7.0–8.0', () => {
      const notice = getFatigueSafetyNotice('Incline Dumbbell Press', 7.5, 2.5)
      expect(notice).not.toBeNull()
      expect(notice?.level).toBe('info')
      expect(notice?.title).toContain('Sweet Spot')
    })

    it('returns null for warm-up or sub-maximal sets below RPE 7.0', () => {
      const notice = getFatigueSafetyNotice('Lat Pulldown', 6.0, 4.0)
      expect(notice).toBeNull()
    })
  })
})
