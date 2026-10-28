import { describe, it, expect } from 'vitest'
import {
  MOVEMENT_SCREEN_ATTIRE_STANDARDS,
  BODY_COMPOSITION_ATTIRE_STANDARDS,
  validateAssessmentAttire,
} from './assessment-attire-standards'

describe('Assessment Attire Standards & Photo Acceptance Policy', () => {
  describe('Movement Screen Standards (NASM OHSA & Dynamic Screens)', () => {
    it('defines strict clinical requirements for joint visibility and footwear', () => {
      expect(MOVEMENT_SCREEN_ATTIRE_STANDARDS.category).toBe('movement_screen')
      expect(MOVEMENT_SCREEN_ATTIRE_STANDARDS.prohibitedAttire).toContain(
        'Baggy sweatpants, wide-leg joggers, cargo pants, or jeans'
      )
      expect(MOVEMENT_SCREEN_ATTIRE_STANDARDS.prohibitedAttire).toContain(
        'Oversized hoodies, baggy sweatshirts, loose sweaters, or bulky jackets'
      )
      expect(MOVEMENT_SCREEN_ATTIRE_STANDARDS.prohibitedAttire).toContain(
        'Cushioned running shoes, platform sneakers, or elevated-heel lifting shoes'
      )

      // Men and women standards
      expect(
        MOVEMENT_SCREEN_ATTIRE_STANDARDS.requiredAttire.male.some(s => s.includes('crewneck'))
      ).toBe(true)
      expect(
        MOVEMENT_SCREEN_ATTIRE_STANDARDS.requiredAttire.female.some(s => s.includes('performance tank') || s.includes('t-shirt'))
      ).toBe(true)
      expect(
        MOVEMENT_SCREEN_ATTIRE_STANDARDS.requiredAttire.general.some(s => s.includes('checkpoints'))
      ).toBe(true)
    })

    it('rejects movement screens with clothing occlusion or baggy garments', () => {
      const result = validateAssessmentAttire({
        category: 'movement_screen',
        clothingOcclusionDetected: true,
        isBaggyOrNonAthletic: true,
      })

      expect(result.adheresToBestPractices).toBe(false)
      expect(result.isRejected).toBe(true)
      expect(result.rejectionReason).toContain('Movement Screen Rejected')
      expect(result.detectedIssues).toContain('clothing_occlusion')
      expect(result.detectedIssues).toContain('baggy_or_non_athletic_attire')
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('approves compliant movement screen attire', () => {
      const result = validateAssessmentAttire({
        category: 'movement_screen',
        clothingOcclusionDetected: false,
        isBaggyOrNonAthletic: false,
        attireConfirmedByClient: true,
      })

      expect(result.adheresToBestPractices).toBe(true)
      expect(result.isRejected).toBe(false)
      expect(result.rejectionReason).toBeNull()
      expect(result.detectedIssues).toHaveLength(0)
    })
  })

  describe('Body Composition & DEXA-Vision Standards', () => {
    it('defines strict silhouette and waistline visibility standards', () => {
      expect(BODY_COMPOSITION_ATTIRE_STANDARDS.category).toBe('body_composition')
      expect(BODY_COMPOSITION_ATTIRE_STANDARDS.prohibitedAttire).toContain(
        'Baggy t-shirts, oversized flannel shirts, or loose cotton tops'
      )
      expect(BODY_COMPOSITION_ATTIRE_STANDARDS.prohibitedAttire).toContain(
        'Hoodies, jackets, sweatshirts, or robes'
      )
      expect(BODY_COMPOSITION_ATTIRE_STANDARDS.prohibitedAttire).toContain(
        'Underwear, lingerie, or complete nudity'
      )

      expect(
        BODY_COMPOSITION_ATTIRE_STANDARDS.requiredAttire.female.some(s => s.includes('sports bra'))
      ).toBe(true)
      expect(
        BODY_COMPOSITION_ATTIRE_STANDARDS.requiredAttire.male.some(s => s.includes('compression shorts'))
      ).toBe(true)
    })

    it('rejects body composition scans with clothing occlusion or non-compliant attire', () => {
      const result = validateAssessmentAttire({
        category: 'body_composition',
        clothingOcclusionDetected: true,
      })

      expect(result.adheresToBestPractices).toBe(false)
      expect(result.isRejected).toBe(true)
      expect(result.rejectionReason).toContain('Body Composition Scan Rejected')
      expect(result.detectedIssues).toContain('clothing_occlusion')
    })

    it('rejects scans when client fails to confirm attire compliance', () => {
      const result = validateAssessmentAttire({
        category: 'body_composition',
        attireConfirmedByClient: false,
      })

      expect(result.adheresToBestPractices).toBe(false)
      expect(result.isRejected).toBe(true)
      expect(result.detectedIssues).toContain('attire_confirmation_missing')
    })

    it('approves compliant body composition attire', () => {
      const result = validateAssessmentAttire({
        category: 'body_composition',
        clothingOcclusionDetected: false,
        isBaggyOrNonAthletic: false,
        attireConfirmedByClient: true,
      })

      expect(result.adheresToBestPractices).toBe(true)
      expect(result.isRejected).toBe(false)
      expect(result.rejectionReason).toBeNull()
    })
  })
})
