import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  getThorneGoalCollection,
  normalizeSupplementGoal,
  normalizeClientSex,
  normalizeFitnessLevel,
} from '@/lib/supplement-prescriptions'

describe('ExecutiveSupplementTimeline & Nutrition Accessibility Contracts', () => {
  it('maps training goals to curated stimulant-free Thorne collections without personalized dosing', () => {
    const collection = getThorneGoalCollection('hypertrophy')
    expect(collection.products.length).toBe(3)
    expect(collection.products.some(p => p.name.includes('Creatine'))).toBe(true)
    expect(collection.products.some(p => p.name.includes('Whey'))).toBe(true)
  })

  it('normalizes natural-language goals, biological sex, and fitness level safely', () => {
    expect(normalizeSupplementGoal('Athletic Power & Explosiveness')).toBe('athletic_power')
    expect(normalizeSupplementGoal('Fat Loss & Conditioning')).toBe('fat_loss')
    expect(normalizeSupplementGoal('Longevity & Vitality')).toBe('longevity_vitality')
    expect(normalizeSupplementGoal('General Health & Wellness')).toBe('general_health')
    expect(normalizeSupplementGoal(undefined)).toBe('hypertrophy')

    expect(normalizeClientSex('female')).toBe('female')
    expect(normalizeClientSex('other')).toBe('other')
    expect(normalizeClientSex('unknown')).toBe('male')

    expect(normalizeFitnessLevel('beginner')).toBe('beginner')
    expect(normalizeFitnessLevel('advanced')).toBe('advanced_athlete')
    expect(normalizeFitnessLevel('unknown')).toBe('intermediate')
  })

  it('enforces native <dialog>, <progress>, <fieldset>/<legend>, and programmatic <label htmlFor> across nutrition components', () => {
    const timelineSrc = fs.readFileSync(
      path.join(process.cwd(), 'components/fitness/ExecutiveSupplementTimeline.tsx'),
      'utf8'
    )
    expect(timelineSrc).toContain('<dialog')
    expect(timelineSrc).toContain('closedby')
    expect(timelineSrc).toContain('.showModal(')
    expect(timelineSrc).not.toContain('role="dialog"')

    const nutritionSrc = fs.readFileSync(
      path.join(process.cwd(), 'components/fitness/MetabolicNutritionProtocol.tsx'),
      'utf8'
    )
    expect(nutritionSrc).toContain('<progress')
    expect(nutritionSrc).toContain('forge-range-slider')
    expect(nutritionSrc).toContain('htmlFor=')
    expect(nutritionSrc).toContain('optPhaseNumberToKey')

    const advisorSrc = fs.readFileSync(
      path.join(process.cwd(), 'components/fitness/SupplementAdvisorWidget.tsx'),
      'utf8'
    )
    expect(advisorSrc).toContain('<fieldset')
    expect(advisorSrc).toContain('<legend')
    expect(advisorSrc).toContain('htmlFor=')

    const prescriberSrc = fs.readFileSync(
      path.join(process.cwd(), 'components/coach/CoachSupplementPrescriber.tsx'),
      'utf8'
    )
    expect(prescriberSrc).toContain('<fieldset')
    expect(prescriberSrc).toContain('<legend')
    expect(prescriberSrc).toContain('htmlFor=')
  })
})
