import { describe, it, expect } from 'vitest'
import {
  evaluateDynamicRestHeartRateRecovery,
  classifyHeartRateZone,
  getRestAudioMetronomeTone,
} from '@/lib/rest-timer-audio-hr-engine'

describe('FloatingRestTimerDock Logic & Dynamic Adaptation', () => {
  it('correctly assesses acute fatigue drop and recommends +20s rest extension', () => {
    const adaptation = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Barbell Bench Press',
      baseRestSeconds: 90,
      remainingSeconds: 45,
      elapsedRestSeconds: 45,
      currentHeartRateBpm: 125,
      hasAcuteFatigueDrop: true,
      acuteFatigueDropPercent: 20,
    })

    expect(adaptation.shouldExtend).toBe(true)
    expect(adaptation.suggestedExtensionSeconds).toBe(20)
    expect(adaptation.recommendedAction).toBe('extend_rest')
    expect(adaptation.adaptationReason).toContain('Acute fatigue detected')
  })

  it('triggers delayed cardiac recovery alert when HR is Zone 3+ near rest completion', () => {
    const adaptation = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Barbell Back Squat',
      baseRestSeconds: 120,
      remainingSeconds: 10,
      elapsedRestSeconds: 110,
      currentHeartRateBpm: 152, // Zone 4 for age 30
      userAge: 30,
    })

    expect(adaptation.shouldExtend).toBe(true)
    expect(adaptation.suggestedExtensionSeconds).toBe(30)
    expect(adaptation.adaptationReason).toContain('Delayed cardiac recovery')
    expect(adaptation.zoneTelemetry.zone).toBe(4)
  })

  it('triggers early ready prompt when HR reaches Zone 1 ahead of schedule', () => {
    const adaptation = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Incline Dumbbell Press',
      baseRestSeconds: 90,
      remainingSeconds: 35,
      elapsedRestSeconds: 55,
      currentHeartRateBpm: 105, // Zone 1 (<60% of 187)
      userAge: 30,
    })

    expect(adaptation.isRecoveredEarly).toBe(true)
    expect(adaptation.recommendedAction).toBe('ready_to_lift')
    expect(adaptation.zoneTelemetry.zone).toBe(1)
    expect(adaptation.suggestedTrimmingSeconds).toBeGreaterThan(0)
  })

  it('strictly validates neutral hammer grip guardrail during hammer curl rest', () => {
    const adaptation = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Dumbbell Hammer Curl',
      baseRestSeconds: 60,
      remainingSeconds: 30,
      elapsedRestSeconds: 30,
      currentHeartRateBpm: 115,
    })

    expect(adaptation.isHammerCurl).toBe(true)
    expect(adaptation.guardrailMandate).toContain('Palms must strictly face inward')
    expect(adaptation.guardrailMandate).toContain('thumbs pointed up toward the ceiling')
    expect(adaptation.guardrailMandate).toContain('zero wrist twisting/supination')
  })

  it('generates correct metronome tone on cardiac pulse mode', () => {
    const tone = getRestAudioMetronomeTone('cardiac_pulse', 5, 25)
    expect(tone).toBeDefined()
    expect(tone?.description).toContain('Cardiac Pulse')
    expect(tone?.secondaryTone?.freq).toBe(85)
  })
})
