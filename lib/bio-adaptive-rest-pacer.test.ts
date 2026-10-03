import { describe, it, expect } from 'vitest'
import {
  calculateBioAdaptiveRestInterval,
  isCompoundLift,
  isHammerCurlMovement,
} from './bio-adaptive-rest-pacer'

describe('Bio-Adaptive Rest Timer Pacer Engine', () => {
  it('extends rest by +45s for compound lifts reaching involuntary failure (RIR 0)', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Barbell Back Squat',
      baseRestSeconds: 90,
      rir: 0,
      rpe: 10,
    })

    expect(result.isBioPaced).toBe(true)
    expect(result.deltaSeconds).toBe(45)
    expect(result.finalRestSeconds).toBe(135)
    expect(result.pacingAction).toBe('extended_failure')
    expect(result.badgeText).toContain('+45s')
    expect(result.adaptationReason).toContain('ATP-CP')
  })

  it('extends rest by +30s for isolation lifts reaching involuntary failure (RIR 0)', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Dumbbell Lateral Raise',
      baseRestSeconds: 60,
      rir: 0,
      rpe: 10,
    })

    expect(result.isBioPaced).toBe(true)
    expect(result.deltaSeconds).toBe(30)
    expect(result.finalRestSeconds).toBe(90)
    expect(result.pacingAction).toBe('extended_failure')
  })

  it('extends rest by +30s for compound lifts under high strain (RIR 1.0)', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Barbell Bench Press',
      baseRestSeconds: 90,
      rir: 1,
      rpe: 9,
    })

    expect(result.isBioPaced).toBe(true)
    expect(result.deltaSeconds).toBe(30)
    expect(result.finalRestSeconds).toBe(120)
    expect(result.pacingAction).toBe('extended_strain')
  })

  it('preserves baseline rest interval when training in optimal hypertrophy window (RIR 2.0)', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Seated Cable Row',
      baseRestSeconds: 75,
      rir: 2,
      rpe: 8,
    })

    expect(result.isBioPaced).toBe(false)
    expect(result.deltaSeconds).toBe(0)
    expect(result.finalRestSeconds).toBe(75)
    expect(result.pacingAction).toBe('preserved_optimal')
  })

  it('accelerates rest by −15s for high reserve sets (RIR >= 4.0)', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Dumbbell Bicep Curl',
      baseRestSeconds: 60,
      rir: 4,
      rpe: 6,
    })

    expect(result.isBioPaced).toBe(true)
    expect(result.deltaSeconds).toBe(-15)
    expect(result.finalRestSeconds).toBe(45)
    expect(result.pacingAction).toBe('accelerated_density')
  })

  it('preserves base rest for warm-up sets without bio-pacing adjustments', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Barbell Deadlift',
      baseRestSeconds: 60,
      isWarmup: true,
      rir: 0,
    })

    expect(result.isBioPaced).toBe(false)
    expect(result.finalRestSeconds).toBe(60)
  })

  it('preserves base rest when autoAdaptiveEnabled is set to false', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Barbell Back Squat',
      baseRestSeconds: 90,
      rir: 0,
      autoAdaptiveEnabled: false,
    })

    expect(result.isBioPaced).toBe(false)
    expect(result.finalRestSeconds).toBe(90)
  })

  it('preserves rapid transition rest (< 30s) in supersets without distortion', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Barbell Bench Press',
      baseRestSeconds: 15,
      rir: 0,
      rpe: 10,
    })

    expect(result.isBioPaced).toBe(false)
    expect(result.finalRestSeconds).toBe(15)
    expect(result.badgeText).toBe('Transition Rest')
    expect(result.adaptationReason).toContain('Rapid superset transition')
  })

  it('correctly identifies compound vs isolation movements', () => {
    expect(isCompoundLift('Barbell Back Squat')).toBe(true)
    expect(isCompoundLift('Barbell Bench Press')).toBe(true)
    expect(isCompoundLift('Dumbbell Incline Bench Press')).toBe(true)
    expect(isCompoundLift('Seated Cable Row')).toBe(true)
    expect(isCompoundLift('Dumbbell Lateral Raise')).toBe(false)
    expect(isCompoundLift('Dumbbell Hammer Curl')).toBe(false)
  })

  it('identifies hammer curl exercises for guardrail compliance', () => {
    expect(isHammerCurlMovement('Dumbbell Hammer Curl')).toBe(true)
    expect(isHammerCurlMovement('Single Leg Hammer Curl')).toBe(true)
    expect(isHammerCurlMovement('Barbell Curl')).toBe(false)
  })

  it('extends rest for acute fatigue drops (>15% rep decay or >20% velocity loss)', () => {
    const result = calculateBioAdaptiveRestInterval({
      exerciseName: 'Barbell Back Squat',
      baseRestSeconds: 90,
      hasAcuteFatigueDrop: true,
      acuteFatigueDropPercent: 25,
    })

    expect(result.isBioPaced).toBe(true)
    expect(result.deltaSeconds).toBe(40)
    expect(result.finalRestSeconds).toBe(130)
    expect(result.pacingAction).toBe('extended_acute_fatigue')
    expect(result.badgeText).toContain('+40s (Acute Fatigue)')
  })
})

