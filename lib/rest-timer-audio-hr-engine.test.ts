import { describe, it, expect } from 'vitest'
import {
  calculateTanakaHrMax,
  classifyHeartRateZone,
  evaluateDynamicRestHeartRateRecovery,
  getRestAudioMetronomeTone,
} from './rest-timer-audio-hr-engine'

describe('Rest Timer Audio Metronome & Heart Rate Zone Dynamic Adaptation Engine', () => {
  it('calculates Tanaka HR max accurately for age ranges', () => {
    // 208 - (0.7 * 30) = 208 - 21 = 187
    expect(calculateTanakaHrMax(30)).toBe(187)
    // 208 - (0.7 * 20) = 208 - 14 = 194
    expect(calculateTanakaHrMax(20)).toBe(194)
    // 208 - (0.7 * 50) = 208 - 35 = 173
    expect(calculateTanakaHrMax(50)).toBe(173)
  })

  it('classifies heart rate into 5 clinical exercise science zones', () => {
    // Tanaka HR max for age 30 is 187
    // Zone 1 (<60% = <112.2 bpm)
    const z1 = classifyHeartRateZone(105, 30, 60)
    expect(z1.zone).toBe(1)
    expect(z1.recoveryStatus).toBe('recovered')
    expect(z1.zoneLabel).toContain('Zone 1')

    // Zone 2 (60%-70% = 112 - 130 bpm)
    const z2 = classifyHeartRateZone(122, 30, 60)
    expect(z2.zone).toBe(2)
    expect(z2.recoveryStatus).toBe('recovering')

    // Zone 3 (70%-80% = 131 - 149 bpm)
    const z3 = classifyHeartRateZone(140, 30, 60)
    expect(z3.zone).toBe(3)
    expect(z3.recoveryStatus).toBe('elevated')

    // Zone 4 (80%-90% = 150 - 168 bpm)
    const z4 = classifyHeartRateZone(158, 30, 60)
    expect(z4.zone).toBe(4)
    expect(z4.recoveryStatus).toBe('excessive_strain')

    // Zone 5 (>=90% = >=169 bpm)
    const z5 = classifyHeartRateZone(175, 30, 60)
    expect(z5.zone).toBe(5)
    expect(z5.recoveryStatus).toBe('excessive_strain')
  })

  it('detects early parasympathetic recovery (Zone 1) and suggests ready to lift', () => {
    const result = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Barbell Bench Press',
      baseRestSeconds: 90,
      remainingSeconds: 40,
      elapsedRestSeconds: 50,
      currentHeartRateBpm: 102, // Zone 1
      userAge: 30,
    })

    expect(result.isRecoveredEarly).toBe(true)
    expect(result.recommendedAction).toBe('ready_to_lift')
    expect(result.suggestedTrimmingSeconds).toBeGreaterThan(0)
    expect(result.coachVoiceCue).toContain('Ready for the next set')
  })

  it('detects delayed cardiac recovery (Zone 3+) near rest expiry and extends rest', () => {
    const result = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Barbell Back Squat',
      baseRestSeconds: 120,
      remainingSeconds: 12, // Approaching zero
      elapsedRestSeconds: 108,
      currentHeartRateBpm: 145, // Zone 3 for age 30
      userAge: 30,
    })

    expect(result.shouldExtend).toBe(true)
    expect(result.recommendedAction).toBe('extend_rest')
    expect(result.suggestedExtensionSeconds).toBe(20)
    expect(result.adaptationReason).toContain('Delayed cardiac recovery')
    expect(result.coachVoiceCue).toContain('Adding 20 seconds for cardiac recovery')
  })

  it('integrates acute fatigue drop to prescribe +20s to +30s phosphagen rest extension', () => {
    const result = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Dumbbell Hammer Curl',
      baseRestSeconds: 60,
      remainingSeconds: 45,
      elapsedRestSeconds: 15,
      hasAcuteFatigueDrop: true,
      acuteFatigueDropPercent: 28,
      currentHeartRateBpm: 120,
    })

    expect(result.shouldExtend).toBe(true)
    expect(result.suggestedExtensionSeconds).toBe(30)
    expect(result.adaptationReason).toContain('Acute fatigue detected (28% rep drop)')
    expect(result.adaptationReason).toContain('phosphagen (ATP-CP) replenishment')
  })

  it('strictly validates neutral hammer grip biomechanical guardrail', () => {
    const result = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Dumbbell Hammer Curl',
      baseRestSeconds: 60,
      remainingSeconds: 30,
      elapsedRestSeconds: 30,
      currentHeartRateBpm: 115,
    })

    expect(result.isHammerCurl).toBe(true)
    expect(result.guardrailMandate).toBeDefined()
    expect(result.guardrailMandate).toContain('Palms must strictly face inward')
    expect(result.guardrailMandate).toContain('thumbs pointed up toward the ceiling')
    expect(result.guardrailMandate).toContain('zero wrist twisting/supination')
  })

  it('generates accurate audio metronome tones across modes', () => {
    // Countdown pips at 3, 2, 1s
    const pip3 = getRestAudioMetronomeTone('countdown_only', 87, 3)
    expect(pip3?.freq).toBe(880)
    expect(pip3?.description).toContain('Countdown Pip: 3')

    // Rest completion gong at 0s
    const gong = getRestAudioMetronomeTone('countdown_only', 90, 0)
    expect(gong?.freq).toBe(1318.5)
    expect(gong?.description).toContain('Rest Completion Gong')

    // Cardiac Pulse metronome (lub-dub)
    const pulse = getRestAudioMetronomeTone('cardiac_pulse', 15, 45)
    expect(pulse?.description).toContain('Cardiac Pulse')
    expect(pulse?.secondaryTone).toBeDefined()
    expect(pulse?.secondaryTone?.freq).toBe(85)

    // Breath Pacer metronome at inhale, hold, exhale
    const breathInhale = getRestAudioMetronomeTone('breath_pacer', 0, 60)
    expect(breathInhale?.freq).toBe(440)
    const breathHold = getRestAudioMetronomeTone('breath_pacer', 4, 56)
    expect(breathHold?.freq).toBe(523.25)
    const breathExhale = getRestAudioMetronomeTone('breath_pacer', 6, 54)
    expect(breathExhale?.freq).toBe(329.63)

    // 5s Interval Marker
    const interval5 = getRestAudioMetronomeTone('interval_5s', 10, 50)
    expect(interval5?.description).toContain('5-Second Interval Marker')
  })
})
