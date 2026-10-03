import { describe, expect, it } from 'vitest'
import { CLIENT_TUTORIAL_STEPS, COACH_TUTORIAL_STEPS } from './tutorials-data'

describe('Tutorials Data Suite', () => {
  it('contains 6 comprehensive steps for client tutorial', () => {
    expect(CLIENT_TUTORIAL_STEPS.length).toBe(6)
    CLIENT_TUTORIAL_STEPS.forEach((step, idx) => {
      expect(step.id).toBeDefined()
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.subtitle).toContain(`Step ${idx + 1} of 6`)
      expect(step.features.length).toBeGreaterThanOrEqual(2)
      expect(step.deepLink).toBeDefined()
    })
  })

  it('contains 7 comprehensive steps for coach tutorial', () => {
    expect(COACH_TUTORIAL_STEPS.length).toBe(7)
    COACH_TUTORIAL_STEPS.forEach((step, idx) => {
      expect(step.id).toBeDefined()
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.subtitle).toContain(`Step ${idx + 1} of 7`)
      expect(step.features.length).toBeGreaterThanOrEqual(2)
      expect(step.deepLink).toBeDefined()
    })
  })
})

