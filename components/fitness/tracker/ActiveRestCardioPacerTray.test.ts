import { describe, it, expect } from 'vitest'
import {
  evaluateHeartRateRecovery,
  getBreathWorkCadenceState,
  getIntraRestMobilityCue,
} from '@/lib/active-rest-cardio-pacer'

describe('ActiveRestCardioPacerTray Engine & UI Verification', () => {
  it('computes heart rate drop and target recovery for tray telemetry', () => {
    const hrr = evaluateHeartRateRecovery({
      peakHeartRateBpm: 160,
      currentHeartRateBpm: 125,
      elapsedRestSeconds: 60,
      restingHeartRateBpm: 55,
      userAge: 32,
    })

    expect(hrr.dropBpm).toBe(35)
    expect(hrr.tier).toBe('exceptional')
    expect(hrr.targetRecoveryBpm).toBeLessThan(125)
    expect(hrr.clinicalInsight).toContain('Superior cardiovascular efficiency')
  })

  it('manages 4-2-6 down-regulation breathing cycle phases and progress', () => {
    const inhale = getBreathWorkCadenceState(2, 'down_regulation_4_2_6')
    expect(inhale.phase).toBe('inhale')
    expect(inhale.phaseLabel).toContain('Inhale')
    expect(inhale.phaseProgress).toBeCloseTo(0.5)

    const hold = getBreathWorkCadenceState(5, 'down_regulation_4_2_6')
    expect(hold.phase).toBe('hold')
    expect(hold.phaseLabel).toContain('Hold')

    const exhale = getBreathWorkCadenceState(8, 'down_regulation_4_2_6')
    expect(exhale.phase).toBe('exhale')
    expect(exhale.phaseLabel).toContain('Exhale')
  })

  it('provides box breathing (4-4-4-4) cycle phases', () => {
    const pause = getBreathWorkCadenceState(13, 'box_4_4_4_4')
    expect(pause.phase).toBe('pause')
    expect(pause.guidanceText).toContain('stillness')
  })

  it('provides physiological sigh (2-1-6) cycle phases', () => {
    const topUp = getBreathWorkCadenceState(2.2, 'physiological_sigh')
    expect(topUp.phase).toBe('inhale_top_up')
    expect(topUp.guidanceText).toContain('re-inflate alveoli')
  })

  it('strictly enforces neutral grip guardrail for Dumbbell Hammer Curl in mobility tab', () => {
    const mobility = getIntraRestMobilityCue('Dumbbell Hammer Curl')
    expect(mobility.isHammerCurl).toBe(true)
    expect(mobility.guardrailMandate).toBeDefined()
    expect(mobility.guardrailMandate).toContain('NEUTRAL GRIP')
    expect(mobility.guardrailMandate).toContain('STRICTLY ZERO TWISTING OR SUPINATION')
    expect(mobility.guardrailMandate).toContain('THUMBS POINTED UP')
  })

  it('classifies cardiac recovery zone for 5-zone meter visualization', async () => {
    const { classifyHeartRateZone } = await import('@/lib/rest-timer-audio-hr-engine')
    const zone = classifyHeartRateZone(118, 30, 55)
    expect(zone.zone).toBe(2)
    expect(zone.zoneLabel).toContain('Zone 2')
    expect(zone.percentHrMax).toBeGreaterThan(50)
  })
})

