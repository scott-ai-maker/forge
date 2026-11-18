import { describe, expect, it } from 'vitest'
import { evaluateClinicalUrgencyTriage } from './ask-coach-gordon-types'
import { recommendWorkingLoad } from './dynamic-load-recommender'
import {
  generateUserScopedWearableToken,
  verifyUserScopedWearableToken,
} from './wearable-webhook-adapters'

describe('Tier 3B Safety & Wearable Security Guardrails (#35, #37)', () => {
  it('detects anginal equivalents, acute self-harm crisis (988), and disordered eating red flags (#37)', () => {
    const anginal = evaluateClinicalUrgencyTriage('I feel radiating jaw pain and left arm numbness during rows')
    expect(anginal.isEmergency911).toBe(true)
    expect(anginal.tier).toBe('EMERGENCY_911')

    const crisis = evaluateClinicalUrgencyTriage('I feel hopeless and want to hurt myself tonight')
    expect(crisis.isEmergency911).toBe(true)
    expect(crisis.overrideMarkdown).toContain('988')

    const ed = evaluateClinicalUrgencyTriage('I have been starving myself and purging after meals to cut weight')
    expect(ed.tier).toBe('SERIOUS_MEDICAL_REFERRAL')
    expect(ed.requiresCoachPing).toBe(true)
    expect(ed.overrideMarkdown).toContain('1-866-662-1235')
  })

  it('halts load prescription on PAR-Q+ Phase 0 hold and caps beta-blocker intensity <= 70% 1RM / RPE 7.0 (#37)', () => {
    const hold = recommendWorkingLoad({
      exerciseName: 'Barbell Back Squat',
      nasmOptPhase: 3,
      historicalSets: [{ weightLbs: 225, reps: 5 }],
      parqClearanceRequired: true,
    })
    expect(hold.recommendedWeightLbs).toBe(0)
    expect(hold.recommendedRpe).toBe(0)
    expect(hold.badge).toContain('Medical Hold')

    const betaBlocker = recommendWorkingLoad({
      exerciseName: 'Barbell Bench Press',
      nasmOptPhase: 4,
      targetRepsText: '3-5',
      dailyReadinessScore: 95,
      historicalSets: [{ weightLbs: 225, reps: 5 }],
      takesBetaBlocker: true,
    })
    expect(betaBlocker.targetIntensityPercentage).toBeLessThanOrEqual(70)
    expect(betaBlocker.recommendedRpe).toBeLessThanOrEqual(7.0)
    expect(betaBlocker.rationale).toContain('Talk Test')
  })

  it('prevents cross-user wearable biometric spoofing via userId-scoped HMAC tokens (#35)', () => {
    const masterSecret = 'wearable-master-hmac-secret-2026'
    const tokenUserA = generateUserScopedWearableToken('athlete-a', 'apple_health', masterSecret)
    expect(tokenUserA).toMatch(/^fwt1_[a-f0-9]{64}$/)

    expect(verifyUserScopedWearableToken(`Bearer ${tokenUserA}`, 'athlete-a', 'apple_health', masterSecret)).toBe(true)
    expect(verifyUserScopedWearableToken(`Bearer ${tokenUserA}`, 'athlete-b', 'apple_health', masterSecret)).toBe(false)
    expect(verifyUserScopedWearableToken(`Bearer ${tokenUserA}`, 'athlete-a', 'google_fit', masterSecret)).toBe(false)
  })
})
