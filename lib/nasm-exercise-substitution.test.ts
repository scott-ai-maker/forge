import { describe, expect, it } from 'vitest'
import { getSmartSubstitutions, detectMovementPattern } from './nasm-exercise-substitution'

describe('Smart Exercise Substitution Engine', () => {
  it('detects correct movement patterns', () => {
    expect(detectMovementPattern('Barbell Flat Bench Press')).toBe('horizontal_push')
    expect(detectMovementPattern('Barbell Back Squat')).toBe('squat')
    expect(detectMovementPattern('Barbell Romanian Deadlift')).toBe('hinge')
    expect(detectMovementPattern('Wide-Grip Lat Pulldown')).toBe('vertical_pull')
  })

  it('suggests shoulder-friendly pain regressions for bench press', () => {
    const subs = getSmartSubstitutions('Barbell Bench Press', 'Phase 2', 'shoulder')
    expect(subs.length).toBeGreaterThanOrEqual(2)
    expect(subs[0].name).toContain('Floor Press')
    expect(subs[0].benefitTag).toBe('Pain-Free Regression')
    expect(subs[0].reasoning).toContain('subacromial space')
  })

  it('suggests lumbar-sparing regressions for back squats', () => {
    const subs = getSmartSubstitutions('Barbell Back Squat', 'Phase 2', 'lower_back')
    expect(subs.some(s => s.name.includes('Goblet Box Squat') || s.name.includes('Bulgarian Split Squat'))).toBe(true)
    expect(subs[0].benefitTag).toBe('Pain-Free Regression')
  })

  it('suggests patellar-sparing regressions for knee discomfort', () => {
    const subs = getSmartSubstitutions('Barbell Back Squat', 'Phase 2', 'knee')
    expect(subs.some(s => s.name.includes('Box Squat') || s.name.includes('Reverse Lunge'))).toBe(true)
  })

  it('adapts tempos to Phase 1 Stabilization (4-2-1)', () => {
    const subs = getSmartSubstitutions('Barbell Bench Press', 'Phase 1: Stabilization Endurance')
    expect(subs.some(s => s.prescribedTempo === '4-2-1')).toBe(true)
  })

  it('suggests strict neutral hammer curl for tennis elbow with zero twisting', () => {
    const subs = getSmartSubstitutions('Barbell Biceps Curl', 'Phase 2', 'tennis_elbow')
    expect(subs.some(s => s.name.includes('Hammer Curl'))).toBe(true)
    const hammerSub = subs.find(s => s.name.includes('Hammer Curl'))
    expect(hammerSub?.reasoning.toLowerCase()).toContain('neutral hammer grip')
    expect(hammerSub?.reasoning.toLowerCase()).toContain('zero twisting or supination')
  })

  it('suggests Spanish squats and box squats for runners knee', () => {
    const subs = getSmartSubstitutions('Barbell Back Squat', 'Phase 2', 'runners_knee')
    expect(subs.some(s => s.name.includes('Spanish Squats'))).toBe(true)
    expect(subs.some(s => s.name.includes('Box Squat'))).toBe(true)
  })

  it('suggests non-impact cardio and tibialis raises for shin splints', () => {
    const subs = getSmartSubstitutions('Treadmill Running', 'Phase 2', 'shin_splints')
    expect(subs.some(s => s.name.includes('Air Bike') || s.name.includes('Tibialis'))).toBe(true)
  })

  it('suggests Rathleff protocol for plantar fasciitis', () => {
    const subs = getSmartSubstitutions('Standing Calf Raise', 'Phase 2', 'plantar_fasciitis')
    expect(subs.some(s => s.name.includes('Rathleff'))).toBe(true)
  })
})
