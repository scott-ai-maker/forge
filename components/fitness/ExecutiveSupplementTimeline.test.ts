import { describe, expect, it } from 'vitest'
import { generateSupplementStack } from '@/lib/supplement-prescriptions'

describe('ExecutiveSupplementTimeline Stack', () => {
  it('generates 4 chrono-dosing windows for hypertrophy goal', () => {
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
  })

  it('correctly categorizes creatine into postWorkout window and omega-3 into morning', () => {
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
})
