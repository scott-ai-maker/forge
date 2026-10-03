import { describe, it, expect } from 'vitest'
import {
  calculateCardioZones,
  identifyHeartRateZone,
  generateStageWorkout,
  calculateRockportVo2Max,
  evaluateYmcaStepTest,
} from './nasm-cardio-stage-engine'

describe('NASM Cardiorespiratory Stage Training & Zone Engine', () => {
  it('calculates Tanaka HRmax and standard NASM %HRmax 3-Zone Target Heart Rates', () => {
    // Age: 40
    // Tanaka HRmax = 208 - (0.7 * 40) = 208 - 28 = 180 bpm
    // Zone 1 (65-75% HRmax): 180 * 0.65 = 117 bpm, 180 * 0.75 = 135 bpm
    // Zone 2 (76-85% HRmax): 180 * 0.76 = 137 bpm, 180 * 0.85 = 153 bpm
    // Zone 3 (86-95% HRmax): 180 * 0.86 = 155 bpm, 180 * 0.95 = 171 bpm
    const zones = calculateCardioZones(40, 60)
    expect(zones.hrMaxBpm).toBe(180)
    expect(zones.zone1.minBpm).toBe(117)
    expect(zones.zone1.maxBpm).toBe(135)
    expect(zones.zone2.minBpm).toBe(137)
    expect(zones.zone2.maxBpm).toBe(153)
    expect(zones.zone3.minBpm).toBe(155)
    expect(zones.zone3.maxBpm).toBe(171)
  })

  it('correctly maps specific heart rates to NASM bioenergetic zones', () => {
    const age = 40
    const restHr = 60

    const below = identifyHeartRateZone(100, age, restHr)
    expect(below.zoneCode).toBe('below_zone1')

    const z1 = identifyHeartRateZone(125, age, restHr)
    expect(z1.zoneCode).toBe('zone1')
    expect(z1.zoneName).toContain('Zone 1')

    const z2 = identifyHeartRateZone(145, age, restHr)
    expect(z2.zoneCode).toBe('zone2')
    expect(z2.zoneName).toContain('Zone 2')

    const z3 = identifyHeartRateZone(160, age, restHr)
    expect(z3.zoneCode).toBe('zone3')
    expect(z3.zoneName).toContain('Zone 3')
  })

  it('generates Stage 1, Stage 2, and Stage 3 conditioning workout prescriptions', () => {
    const stage1 = generateStageWorkout(1, 35, 65)
    expect(stage1.stage).toBe(1)
    expect(stage1.workRestRatio).toContain('Continuous Steady State')
    expect(stage1.targetOptPhase).toContain('Phase 1')

    const stage2 = generateStageWorkout(2, 35, 65)
    expect(stage2.stage).toBe(2)
    expect(stage2.workRestRatio).toContain('1:3')
    expect(stage2.mainConditioning).toContain('Zone 2')

    const stage3 = generateStageWorkout(3, 35, 65)
    expect(stage3.stage).toBe(3)
    expect(stage3.mainConditioning).toContain('Zone 3')
  })

  it('calculates Rockport 1-Mile Walk Test VO2 Max accurately', () => {
    const result = calculateRockportVo2Max({
      weightLbs: 180,
      age: 35,
      sex: 'male',
      timeMinutes: 14.5,
      endHeartRateBpm: 140,
    })

    expect(result.vo2Max).toBeGreaterThan(35)
    expect(result.vo2Max).toBeLessThan(55)
    expect(result.fitnessCategory).toBeDefined()
    expect(result.description).toContain('Estimated VO2max')
  })

  it('evaluates YMCA 3-Minute Step Test recovery pulse and starting stage', () => {
    const excellentMale = evaluateYmcaStepTest(82, 30, 'male')
    expect(excellentMale.fitnessRating).toBe('Excellent')
    expect(excellentMale.suggestedStartingStage).toBe(2)

    const averageFemale = evaluateYmcaStepTest(115, 30, 'female')
    expect(averageFemale.fitnessRating).toBe('Average')
    expect(averageFemale.suggestedStartingStage).toBe(1)
  })
})
