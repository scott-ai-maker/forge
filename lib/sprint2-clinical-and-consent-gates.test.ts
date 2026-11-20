import { describe, expect, it } from 'vitest'
import {
  checkClientMedicalClearanceGate,
  isValidTenDigitMunicipalDispatch,
} from '@/lib/liability-shield'
import { checkClientLegalConsentGate, LEGAL_DOCUMENTS } from '@/lib/legal-compliance'
import { getThorneGoalCollection } from '@/lib/supplement-prescriptions'
import { parseNutritionTargets } from '@/lib/weight-loss-program'
import { generateRecompositionPlan } from '@/lib/ai-body-composition-engine'
import { calculateEnergyExpenditure } from '@/lib/metabolic-nutrition'

describe('Sprint 2 — Clinical Safety, Contraindications, Waivers & Dietetics Floors', () => {
  it('rejects dummy/placeholder 10-digit emergency dispatch numbers while accepting real municipal numbers (#5)', () => {
    expect(isValidTenDigitMunicipalDispatch('911')).toBe(false)
    expect(isValidTenDigitMunicipalDispatch('000-000-0000')).toBe(false)
    expect(isValidTenDigitMunicipalDispatch('911-911-9119')).toBe(false)
    expect(isValidTenDigitMunicipalDispatch('123-456-7890')).toBe(false)
    expect(isValidTenDigitMunicipalDispatch('541-555-0911')).toBe(true)
    expect(isValidTenDigitMunicipalDispatch('+1 (617) 555-0199')).toBe(true)
  })

  it('blocks unsigned draft onboarding records and unspecified parq_any_yes flags in checkClientMedicalClearanceGate (#4/#8)', async () => {
    const draftAdmin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                parq_any_yes: false,
                parq_answers: {},
                consent_liability_waiver: false,
                consent_signature_name: 'Draft In Progress',
              },
              error: null,
            }),
          }),
        }),
      }),
    }
    const draftRes = await checkClientMedicalClearanceGate(draftAdmin, 'client-draft-1')
    expect(draftRes.blocked).toBe(true)
    expect(draftRes.effectiveMaxOptPhase).toBe(0)

    const unspecifiedYesAdmin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
            maybeSingle: async () => ({
              data: {
                parq_any_yes: true,
                parq_answers: {},
                consent_liability_waiver: true,
                consent_signature_name: 'Alex Mercer',
              },
              error: null,
            }),
          }),
        }),
      }),
    }
    const unspecifiedRes = await checkClientMedicalClearanceGate(unspecifiedYesAdmin, 'client-flag-1')
    expect(unspecifiedRes.blocked).toBe(true)
    expect(unspecifiedRes.effectiveMaxOptPhase).toBe(0)
  })

  it('suppresses contraindicated Thorne SKUs for anticoagulants, CKD, and pregnancy (#3)', () => {
    const warfarinWellness = getThorneGoalCollection('general_health', {
      medications: 'Taking Eliquis 5mg BID for atrial fibrillation',
    })
    expect(warfarinWellness.products.some(p => p.sku === 'SP608')).toBe(false)

    const ckdHypertrophy = getThorneGoalCollection('hypertrophy', {
      medical_conditions: 'Stage 3 chronic kidney disease (CKD)',
    })
    expect(ckdHypertrophy.products.some(p => p.sku === 'SF903')).toBe(false)
    expect(ckdHypertrophy.products.some(p => p.sku === 'SP110')).toBe(false)
    expect(ckdHypertrophy.products.some(p => p.sku === 'SF822')).toBe(false)

    const prenatalStack = getThorneGoalCollection('fat_loss', {
      medical_conditions: 'Currently 20 weeks pregnant',
    })
    expect(prenatalStack.products).toHaveLength(0)
  })

  it('enforces 1,500 kcal male floor, 12% female / 6% male BF floors, and zero deficit on pregnancy/ED (#24)', () => {
    expect(
      parseNutritionTargets(
        { targetCalories: 1350, proteinGrams: 150, carbGrams: 100, fatGrams: 45 },
        'male'
      )
    ).toBeNull()
    expect(
      parseNutritionTargets(
        { targetCalories: 1500, proteinGrams: 150, carbGrams: 100, fatGrams: 45 },
        'male'
      )?.targetCalories
    ).toBe(1500)

    const maleProjection = generateRecompositionPlan(58, 25, 'male', 3)
    expect(maleProjection.targetBodyFatPercent).toBeGreaterThanOrEqual(6)
    expect(maleProjection.dailyCaloricTarget).toBeGreaterThanOrEqual(1500)

    const femaleProjection = generateRecompositionPlan(60, 28, 'female', 5)
    expect(femaleProjection.targetBodyFatPercent).toBeGreaterThanOrEqual(12)

    const prenatalEnergy = calculateEnergyExpenditure({
      sex: 'female',
      age: 31,
      heightCm: 168,
      weightKg: 68,
      activityTier: 'moderately_active',
      goal: 'fat_loss',
      medicalNotes: 'Second trimester pregnancy',
    } as Parameters<typeof calculateEnergyExpenditure>[0] & { medicalNotes: string })
    expect(prenatalEnergy.calorieDelta).toBe(0)
  })

  it('does not treat liability waiver alone as Terms acceptance and aligns canonical texts (#7/#16/#31/#32)', async () => {
    const mockAdmin = {
      from: (table: string) => {
        if (table === 'client_intake_forms') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    consent_liability_waiver: true,
                    consent_coaching_agreement: false,
                    consent_privacy_practices: true,
                    consent_signature_name: 'Jordan Brooks',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: () => ({
            eq: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }
      },
    }

    const gate = await checkClientLegalConsentGate(
      mockAdmin as unknown as Parameters<typeof checkClientLegalConsentGate>[0],
      'user-1',
      { requireTermsOfService: true, requireLiabilityWaiver: true }
    )
    expect(gate.verified).toBe(false)
    expect(gate.missingDocuments).toContain('terms_of_service')

    expect(LEGAL_DOCUMENTS.terms_of_service.canonicalFullText).toContain('24-month contract horizon cap')
    expect(LEGAL_DOCUMENTS.consumer_health_biometric_policy.canonicalFullText).not.toContain('zero-retention')
    expect(LEGAL_DOCUMENTS.consumer_health_biometric_policy.canonicalFullText).toContain('55-day')
    expect(LEGAL_DOCUMENTS.athletic_liability_waiver.canonicalFullText).toContain('M.G.L. c. 229, § 2')
  })
})
