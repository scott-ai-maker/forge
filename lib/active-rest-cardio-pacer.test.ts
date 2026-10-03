import { describe, it, expect } from 'vitest'
import {
  evaluateHeartRateRecovery,
  getBreathWorkCadenceState,
  getIntraRestMobilityCue,
} from './active-rest-cardio-pacer'

describe('Active Rest Cardio Pacer & Heart Rate Recovery Engine', () => {
  describe('evaluateHeartRateRecovery', () => {
    it('classifies exceptional vagal reactivation for drops >= 30 bpm', () => {
      const result = evaluateHeartRateRecovery({
        peakHeartRateBpm: 165,
        currentHeartRateBpm: 130,
        elapsedRestSeconds: 60,
        restingHeartRateBpm: 55,
      })

      expect(result.dropBpm).toBe(35)
      expect(result.tier).toBe('exceptional')
      expect(result.tierLabel).toContain('Exceptional')
      expect(result.clinicalInsight).toContain('Superior cardiovascular efficiency')
    })

    it('classifies athletic recovery for drops between 20 and 29 bpm', () => {
      const result = evaluateHeartRateRecovery({
        peakHeartRateBpm: 155,
        currentHeartRateBpm: 132,
        elapsedRestSeconds: 60,
        restingHeartRateBpm: 58,
      })

      expect(result.dropBpm).toBe(23)
      expect(result.tier).toBe('athletic')
      expect(result.tierLabel).toContain('Athletic')
    })

    it('classifies moderate recovery for drops between 12 and 19 bpm', () => {
      const result = evaluateHeartRateRecovery({
        peakHeartRateBpm: 150,
        currentHeartRateBpm: 135,
        elapsedRestSeconds: 60,
      })

      expect(result.dropBpm).toBe(15)
      expect(result.tier).toBe('moderate')
      expect(result.clinicalInsight).toContain('4-2-6 down-regulation')
    })

    it('flags delayed recovery for sluggish drops < 12 bpm', () => {
      const result = evaluateHeartRateRecovery({
        peakHeartRateBpm: 150,
        currentHeartRateBpm: 144,
        elapsedRestSeconds: 60,
      })

      expect(result.dropBpm).toBe(6)
      expect(result.tier).toBe('delayed')
      expect(result.clinicalInsight).toContain('Slow parasympathetic reactivation')
    })

    it('calculates target recovery HR and indicates if athlete has reached target', () => {
      const result = evaluateHeartRateRecovery({
        peakHeartRateBpm: 150,
        currentHeartRateBpm: 95,
        elapsedRestSeconds: 90,
        restingHeartRateBpm: 55,
        userAge: 30,
      })

      expect(result.targetRecoveryBpm).toBeGreaterThan(55)
      expect(result.targetRecoveryBpm).toBeLessThan(130)
      expect(result.isAtTarget).toBe(true)
    })
  })

  describe('getBreathWorkCadenceState', () => {
    it('accurately cycles through Down-Regulation (4-2-6) pattern', () => {
      // Inhale at t=2 (duration 4s)
      const inhale = getBreathWorkCadenceState(2, 'down_regulation_4_2_6')
      expect(inhale.phase).toBe('inhale')
      expect(inhale.phaseProgress).toBeCloseTo(0.5)

      // Hold at t=5 (duration 2s)
      const hold = getBreathWorkCadenceState(5, 'down_regulation_4_2_6')
      expect(hold.phase).toBe('hold')
      expect(hold.phaseProgress).toBe(1.0)

      // Exhale at t=9 (duration 6s)
      const exhale = getBreathWorkCadenceState(9, 'down_regulation_4_2_6')
      expect(exhale.phase).toBe('exhale')
      expect(exhale.phaseProgress).toBeCloseTo(0.5)

      // Cycles smoothly into cycle 2 at t=14
      const nextCycle = getBreathWorkCadenceState(14, 'down_regulation_4_2_6')
      expect(nextCycle.cycleCount).toBe(2)
      expect(nextCycle.phase).toBe('inhale')
    })

    it('accurately cycles through Box Breathing (4-4-4-4) pattern', () => {
      const inhale = getBreathWorkCadenceState(1, 'box_4_4_4_4')
      expect(inhale.phase).toBe('inhale')

      const hold = getBreathWorkCadenceState(5, 'box_4_4_4_4')
      expect(hold.phase).toBe('hold')

      const exhale = getBreathWorkCadenceState(10, 'box_4_4_4_4')
      expect(exhale.phase).toBe('exhale')

      const pause = getBreathWorkCadenceState(14, 'box_4_4_4_4')
      expect(pause.phase).toBe('pause')
    })

    it('accurately cycles through Physiological Sigh pattern', () => {
      const firstInhale = getBreathWorkCadenceState(1, 'physiological_sigh')
      expect(firstInhale.phase).toBe('inhale')

      const topUp = getBreathWorkCadenceState(2.5, 'physiological_sigh')
      expect(topUp.phase).toBe('inhale_top_up')

      const exhale = getBreathWorkCadenceState(5, 'physiological_sigh')
      expect(exhale.phase).toBe('exhale')
    })
  })

  describe('getIntraRestMobilityCue & Biomechanical Guardrails', () => {
    it('enforces strict neutral grip guardrail for Dumbbell Hammer Curl', () => {
      const cue = getIntraRestMobilityCue('Dumbbell Hammer Curl')
      expect(cue.isHammerCurl).toBe(true)
      expect(cue.title).toContain('Neutral Hammer Grip')
      expect(cue.action).toContain('palms facing inward')
      expect(cue.guardrailMandate).toBeDefined()
      expect(cue.guardrailMandate).toContain('NEUTRAL GRIP')
      expect(cue.guardrailMandate).toContain('STRICTLY ZERO TWISTING OR SUPINATION')
      expect(cue.guardrailMandate).toContain('THUMBS POINTED UP')
    })

    it('enforces strict neutral grip guardrail for Single Leg Hammer Curl', () => {
      const cue = getIntraRestMobilityCue('Single Leg Hammer Curl')
      expect(cue.isHammerCurl).toBe(true)
      expect(cue.guardrailMandate).toContain('NEUTRAL GRIP')
    })

    it('provides hip capsule reset for squat movements', () => {
      const cue = getIntraRestMobilityCue('Barbell Back Squat')
      expect(cue.isHammerCurl).toBe(false)
      expect(cue.title).toContain('Hip Flexor')
    })

    it('provides cat-cow decompression for deadlift movements', () => {
      const cue = getIntraRestMobilityCue('Barbell Deadlift')
      expect(cue.isHammerCurl).toBe(false)
      expect(cue.title).toContain('Cat-Cow')
    })

    it('provides pec & thoracic stretch for bench press movements', () => {
      const cue = getIntraRestMobilityCue('Barbell Bench Press')
      expect(cue.isHammerCurl).toBe(false)
      expect(cue.title).toContain('Doorway Pec')
    })

    it('provides lat decompression for rowing movements', () => {
      const cue = getIntraRestMobilityCue('Barbell Bent-Over Row')
      expect(cue.isHammerCurl).toBe(false)
      expect(cue.title).toContain('Lat')
    })

    it('provides diaphragmatic walking flush as fallback', () => {
      const cue = getIntraRestMobilityCue('Calf Raise')
      expect(cue.isHammerCurl).toBe(false)
      expect(cue.title).toContain('Diaphragmatic Walking')
    })
  })
})
