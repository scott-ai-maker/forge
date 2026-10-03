import { describe, it, expect } from 'vitest'
import {
  evaluateDaviesTest,
  evaluateSharkSkillTest,
  evaluateProShuttle,
  evaluatePushUpEndurance,
  calculateCompositeAthleticProfile,
} from './nasm-performance-testing'

describe('NASM Athletic Performance Testing Engine', () => {
  it('evaluates Davies upper-body agility test with 3-trial averages', () => {
    // 36, 38, 37 -> avg 37 (Male Excellent/Elite)
    const result = evaluateDaviesTest(36, 38, 37, 'male')
    expect(result.averageTouches).toBe(37)
    expect(result.fitnessRating).toBe('Excellent')
    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.recommendations[0]).toContain('Upper extremity stability is optimal')
  })

  it('evaluates Shark Skill test with penalties and asymmetry detection', () => {
    // Right: 8.5s + 2 penalties (+0.2s) = 8.7s (Excellent)
    // Left: 10.5s + 0 penalties = 10.5s (Good)
    // Asymmetry: |8.7 - 10.5| / 10.5 = 17.1% asymmetry
    const result = evaluateSharkSkillTest(8.5, 2, 10.5, 0)
    expect(result.rightLegAdjustedSeconds).toBe(8.7)
    expect(result.leftLegAdjustedSeconds).toBe(10.5)
    expect(result.asymmetryPercent).toBeGreaterThan(15)
    expect(result.dominantLeg).toBe('right')
    expect(result.coachingCues[0]).toContain('Significant bilateral deficit detected')
  })

  it('evaluates 5-10-5 Pro Shuttle change of direction test', () => {
    const result = evaluateProShuttle(4.35, 'male')
    expect(result.rating).toBe('Excellent')
    expect(result.score).toBe(88)
    expect(result.decelerationEfficiency).toContain('Strong center of mass drop')
  })

  it('evaluates 1-Minute Push-Up Endurance test with age stratification', () => {
    const maleYoung = evaluatePushUpEndurance(46, 'male', 25)
    expect(maleYoung.rating).toBe('Excellent')
    expect(maleYoung.score).toBe(98)

    const maleMaster = evaluatePushUpEndurance(32, 'male', 52)
    expect(maleMaster.rating).toBe('Excellent')
    expect(maleMaster.score).toBe(98)

    const femaleResult = evaluatePushUpEndurance(20, 'female', 35)
    expect(femaleResult.rating).toBe('Good')
    expect(femaleResult.score).toBe(88)
  })

  it('calculates composite athletic profile across all 4 movement dimensions', () => {
    const davies = evaluateDaviesTest(36, 38, 37, 'male')
    const shark = evaluateSharkSkillTest(8.5, 0, 8.8, 0)
    const shuttle = evaluateProShuttle(4.20, 'male')
    const pushups = evaluatePushUpEndurance(48, 'male', 30)

    const profile = calculateCompositeAthleticProfile(davies, shark, shuttle, pushups)
    expect(profile.overallAthleticismScore).toBeGreaterThanOrEqual(90)
    expect(profile.tier).toBe('Elite Competitor')
    expect(profile.recommendedOptPhase).toContain('Phase 5')
  })
})
