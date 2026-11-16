import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  generateSupplementStack,
  normalizeSupplementGoal,
  normalizeClientSex,
  normalizeFitnessLevel,
} from '@/lib/supplement-prescriptions'

describe('ExecutiveSupplementTimeline & Nutrition Accessibility Contracts', () => {
  it('generates all chrono-dosing windows including dailyFlexible for hypertrophy goal', () => {
    const stack = generateSupplementStack({
      goal: 'hypertrophy',
      age: 35,
      sex: 'male',
      fitnessLevel: 'intermediate',
    })

    expect(stack.chronoSchedule.morning.length).toBeGreaterThan(0)
    expect(stack.chronoSchedule.preWorkout.length).toBeGreaterThan(0)
    expect(stack.chronoSchedule.postWorkout.length).toBeGreaterThan(0)
    expect(stack.chronoSchedule.night.length).toBeGreaterThan(0)
    expect(stack.chronoSchedule.dailyFlexible.length).toBeGreaterThan(0)

    const scheduledTotal =
      stack.chronoSchedule.morning.length +
      stack.chronoSchedule.preWorkout.length +
      stack.chronoSchedule.postWorkout.length +
      stack.chronoSchedule.night.length +
      stack.chronoSchedule.dailyFlexible.length
    expect(scheduledTotal).toBe(stack.prescribedItems.length)
  })

  it('correctly categorizes protein into postWorkout, omega-3 into morning, and creatine into dailyFlexible', () => {
    const stack = generateSupplementStack({
      goal: 'hypertrophy',
      age: 35,
      sex: 'male',
      fitnessLevel: 'intermediate',
    })

    const hasProtein = stack.chronoSchedule.postWorkout.some(s => s.name.includes('Protein') || s.id.includes('protein'))
    const hasOmega3 = stack.chronoSchedule.morning.some(s => s.name.includes('Omega-3'))
    const hasCreatine = stack.chronoSchedule.dailyFlexible.some(s => s.name.includes('Creatine'))

    expect(hasProtein).toBe(true)
    expect(hasOmega3).toBe(true)
    expect(hasCreatine).toBe(true)
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
    expect(timelineSrc).toContain('<progress')
    expect(timelineSrc).toContain('daily_flexible')
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
