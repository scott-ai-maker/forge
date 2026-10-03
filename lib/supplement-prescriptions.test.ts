import { describe, expect, it } from 'vitest'
import { generateSupplementStack } from './supplement-prescriptions'

describe('supplement-prescriptions & drug-nutrient interactions', () => {
  it('generates a gold-standard Tier A foundational stack for a healthy 28yo male athlete', () => {
    const res = generateSupplementStack({
      goal: 'hypertrophy',
      age: 28,
      sex: 'male',
      fitnessLevel: 'intermediate',
      bodyweightKg: 85,
    })

    expect(res.prescribedItems.some(i => i.id === 'creatine_monohydrate')).toBe(true)
    expect(res.prescribedItems.some(i => i.id === 'protein_isolate')).toBe(true)
    expect(res.prescribedItems.some(i => i.id === 'omega_3_high')).toBe(true)
    expect(res.prescribedItems.some(i => i.id === 'magnesium_glycinate')).toBe(true)
    expect(res.prescribedItems.some(i => i.id === 'vit_d3_k2')).toBe(true)
    expect(res.flaggedContraindications.length).toBe(0)
    expect(res.legalDisclaimer).toContain('MANDATORY FDA & MEDICAL DISCLAIMER')
    expect(res.thirdPartyQualityStandards).toContain('NSF Certified for Sport')
  })

  it('suppresses Vitamin K2 and prescribes Pure Vitamin D3 for clients on Anticoagulant blood thinners', () => {
    const res = generateSupplementStack({
      goal: 'general_health',
      age: 58,
      sex: 'male',
      fitnessLevel: 'beginner',
      healthConditions: {
        takingAnticoagulants: true,
      },
    })

    expect(res.prescribedItems.some(i => i.id === 'vit_d3_k2')).toBe(false)
    expect(res.prescribedItems.some(i => i.id === 'vit_d3_pure')).toBe(true)
    expect(res.prescribedItems.some(i => i.id === 'omega_3_mod')).toBe(true)
    expect(res.drugInteractions.some(d => d.medicationCategory.includes('Anticoagulant'))).toBe(true)
  })

  it('suppresses high-potassium electrolytes and stimulants for clients on Antihypertensive medications', () => {
    const res = generateSupplementStack({
      goal: 'fat_loss',
      age: 46,
      sex: 'female',
      fitnessLevel: 'intermediate',
      healthConditions: {
        takingAntihypertensives: true,
      },
    })

    expect(res.prescribedItems.some(i => i.id === 'caffeine_theanine')).toBe(false)
    expect(res.prescribedItems.some(i => i.id === 'l_citrulline_nonstim')).toBe(true)
    expect(res.prescribedItems.some(i => i.id === 'low_potassium_hydration')).toBe(true)
    expect(res.drugInteractions.some(d => d.medicationCategory.includes('Antihypertensives'))).toBe(true)
  })

  it('enforces a mandatory 4-hour separation rule for clients on Thyroid Hormone replacement (Levothyroxine)', () => {
    const res = generateSupplementStack({
      goal: 'longevity_vitality',
      age: 44,
      sex: 'female',
      fitnessLevel: 'intermediate',
      healthConditions: {
        takingThyroidHormone: true,
      },
    })

    expect(res.chronoSeparationRules.some(r => r.includes('4-Hour Separation'))).toBe(true)
    const mg = res.prescribedItems.find(i => i.id === 'magnesium_glycinate')
    expect(mg?.chronoSeparationNote).toContain('Levothyroxine')
    expect(res.drugInteractions.some(d => d.severity === 'CHRONO_SEPARATION_REQUIRED')).toBe(true)
  })

  it('automatically adds active Ubiquinol CoQ10 as a beneficial co-prescription for clients on Statins', () => {
    const res = generateSupplementStack({
      goal: 'general_health',
      age: 52,
      sex: 'male',
      fitnessLevel: 'intermediate',
      healthConditions: {
        takingStatins: true,
      },
    })

    const coq10 = res.prescribedItems.find(i => i.id === 'ubiquinol_coq10')
    expect(coq10).toBeDefined()
    expect(coq10?.isBeneficialCoPrescription).toBe(true)
    expect(coq10?.name).toContain('Statin Muscle Protection')
    expect(res.drugInteractions.some(d => d.medicationCategory.includes('Statins'))).toBe(true)
  })

  it('blacklists 5-HTP and St. Johns Wort to prevent Serotonin Syndrome for clients on Antidepressants (SSRIs/SNRIs)', () => {
    const res = generateSupplementStack({
      goal: 'general_health',
      age: 32,
      sex: 'female',
      fitnessLevel: 'beginner',
      healthConditions: {
        takingAntidepressants: true,
      },
    })

    expect(res.drugInteractions.some(d => d.medicationCategory.includes('Antidepressants'))).toBe(true)
    expect(res.drugInteractions.some(d => d.pharmacologicalRationale.includes('Serotonin Syndrome'))).toBe(true)
  })

  it('prescribes bioavailable Methyl-B12 and suppresses high-dose Berberine for clients on Diabetes/Metformin therapy', () => {
    const res = generateSupplementStack({
      goal: 'fat_loss',
      age: 49,
      sex: 'male',
      fitnessLevel: 'intermediate',
      healthConditions: {
        takingDiabetesMedications: true,
      },
    })

    expect(res.prescribedItems.some(i => i.id === 'methyl_b12')).toBe(true)
    expect(res.drugInteractions.some(d => d.medicationCategory.includes('Diabetes Medications'))).toBe(true)
  })

  it('enforces 2-4 hour mineral separation for Oral Antibiotic regimens', () => {
    const res = generateSupplementStack({
      goal: 'general_health',
      age: 36,
      sex: 'female',
      fitnessLevel: 'intermediate',
      healthConditions: {
        takingOralAntibiotics: true,
      },
    })

    expect(res.chronoSeparationRules.some(r => r.includes('2–4 Hour Separation'))).toBe(true)
    expect(res.drugInteractions.some(d => d.medicationCategory.includes('Oral Antibiotics'))).toBe(true)
  })

  it('suppresses immune-stimulating herbals and protects bone minerals for clients on Immunosuppressants/Steroids', () => {
    const res = generateSupplementStack({
      goal: 'general_health',
      age: 41,
      sex: 'male',
      fitnessLevel: 'beginner',
      healthConditions: {
        takingImmunosuppressantsOrSteroids: true,
      },
    })

    expect(res.drugInteractions.some(d => d.medicationCategory.includes('Immunosuppressants'))).toBe(true)
  })

  it('attaches clinical partner dispensary metadata, SKUs, and 15% client discount pricing to all items', () => {
    const res = generateSupplementStack({
      goal: 'hypertrophy',
      age: 32,
      sex: 'male',
      fitnessLevel: 'advanced_athlete',
    })

    expect(res.prescribedItems.length).toBeGreaterThan(0)
    for (const item of res.prescribedItems) {
      expect(item.recommendedBrand).toBeDefined()
      expect(typeof item.recommendedBrand).toBe('string')
      expect(item.dispensarySku).toBeDefined()
      expect(item.clientDiscountPrice).toContain('$')
      expect(item.dispensaryUrl).toContain('http')
    }

    const creatine = res.prescribedItems.find(i => i.id === 'creatine_monohydrate')
    expect(creatine?.recommendedBrand).toBe('Momentous')
    expect(creatine?.dispensarySku).toBe('MOMENTOUS-CREAPURE')
    expect(creatine?.clientDiscountPrice).toBe('$35.70')

    const mag = res.prescribedItems.find(i => i.id === 'magnesium_glycinate')
    expect(mag?.recommendedBrand).toBe('Thorne')
    expect(mag?.dispensarySku).toBe('THORNE-MAG-BISGLYCINATE')
    expect(mag?.clientDiscountPrice).toBe('$39.10')
  })
})
