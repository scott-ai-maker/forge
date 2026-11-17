import { describe, expect, it } from 'vitest'
import {
  evaluateIntakePhysicianConsultFlag,
  FDA_DSHEA_DISCLAIMER,
  FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
  getThorneGoalCollection,
  MA_SAFE_HARBOR_SCOPE_NOTICE,
  normalizeSupplementGoal,
  THORNE_GOAL_COLLECTIONS,
  VALID_SUPPLEMENT_GOALS,
} from './supplement-prescriptions'

describe('Thorne Goal-Based Partner Storefront (Custom Dosing Disabled)', () => {
  it('maps every training goal to a stimulant-free NSF Certified for Sport® Thorne collection with zero dosages', () => {
    for (const goal of VALID_SUPPLEMENT_GOALS) {
      const collection = getThorneGoalCollection(goal)
      expect(collection.goal).toBe(goal)
      expect(collection.products.length).toBeGreaterThan(0)

      for (const product of collection.products) {
        expect(product.certificationBadge).toBe('NSF Certified for Sport®')
        expect(product.productUrl).toContain('thorne.com')
        expect(product.labelGuidance).toContain('Supplement Facts label')
        // Never prescribe custom milligram/gram dosing or drug co-prescriptions
        expect(product.name).not.toMatch(/Ubiquinol|CoQ10|B12|Caffeine|Pre-Workout/i)
      }
    }
  })

  it('normalizes natural-language training goals cleanly', () => {
    expect(normalizeSupplementGoal('Muscle Hypertrophy')).toBe('hypertrophy')
    expect(normalizeSupplementGoal('Weight Loss & Lean Cut')).toBe('fat_loss')
    expect(normalizeSupplementGoal('Explosive Power')).toBe('athletic_power')
    expect(normalizeSupplementGoal('Joint Mobility & Longevity')).toBe('longevity_vitality')
    expect(normalizeSupplementGoal('General Wellness')).toBe('general_health')
    expect(Object.keys(THORNE_GOAL_COLLECTIONS)).toHaveLength(5)
  })

  it('flags physician/pharmacist consultation whenever PAR-Q+, medications, conditions, or allergies exist', () => {
    const flagged = evaluateIntakePhysicianConsultFlag({
      parq_any_yes: false,
      medications: 'Eliquis 5mg twice daily',
      medical_conditions: 'None',
      allergies: '',
    })
    expect(flagged.requiresPhysicianConsultNotice).toBe(true)
    expect(flagged.reasons).toContain('reported medications')
    expect(flagged.message).toContain('does not perform drug–supplement interaction screening')

    const clean = evaluateIntakePhysicianConsultFlag({
      parq_any_yes: false,
      medications: 'None',
      medical_conditions: 'N/A',
      allergies: '',
    })
    expect(clean.requiresPhysicianConsultNotice).toBe(false)
  })

  it('includes FTC 16 CFR § 255.5 affiliate, FDA DSHEA, and MA Safe Harbor disclosures', () => {
    expect(FTC_PROXIMATE_AFFILIATE_DISCLOSURE).toContain('15%')
    expect(FTC_PROXIMATE_AFFILIATE_DISCLOSURE).toContain('commission')
    expect(FDA_DSHEA_DISCLAIMER).toContain('Food and Drug Administration')
    expect(MA_SAFE_HARBOR_SCOPE_NOTICE).toContain('M.G.L. c. 112, § 206')
  })
})
