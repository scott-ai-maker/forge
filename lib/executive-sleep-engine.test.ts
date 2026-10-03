import { describe, it, expect } from 'vitest'
import {
  evaluateExecutiveSleepSession,
  calculateNocturnalRhrDip,
  evaluateSleepStages,
  type ExecutiveSleepRecord,
} from './executive-sleep-engine'

describe('executive-sleep-engine', () => {
  describe('calculateNocturnalRhrDip', () => {
    it('accurately calculates and classifies normal dippers (10-20%)', () => {
      const res = calculateNocturnalRhrDip(65, 55) // (65 - 55) / 65 = 15.4%
      expect(res.dipPercent).toBe(15.4)
      expect(res.classification).toBe('normal_dipper')
    })

    it('classifies optimal dippers (>= 20%)', () => {
      const res = calculateNocturnalRhrDip(65, 48) // 26.2%
      expect(res.dipPercent).toBe(26.2)
      expect(res.classification).toBe('optimal_dipper')
    })

    it('identifies non-dippers (< 10%) indicating residual sympathetic tone', () => {
      const res = calculateNocturnalRhrDip(65, 62) // 4.6%
      expect(res.dipPercent).toBe(4.6)
      expect(res.classification).toBe('non_dipper')
    })

    it('flags reverse dippers (nocturnal HR higher than daytime)', () => {
      const res = calculateNocturnalRhrDip(60, 64) // -6.7%
      expect(res.dipPercent).toBe(-6.7)
      expect(res.classification).toBe('reverse_dipper')
    })
  })

  describe('evaluateSleepStages', () => {
    it('correctly derives stage percentages and optimal status', () => {
      const res = evaluateSleepStages(8.0, 1.8, 2.0, 4.2, 0.4)
      expect(res.deepPercent).toBe(23) // 1.8 / 8.0 = 22.5% -> 23%
      expect(res.remPercent).toBe(25) // 2.0 / 8.0 = 25%
      expect(res.deepStatus).toBe('optimal')
      expect(res.remStatus).toBe('optimal')
    })

    it('detects deficient deep sleep', () => {
      const res = evaluateSleepStages(7.0, 0.5, 1.5, 5.0, 0.5)
      expect(res.deepPercent).toBe(7) // 7%
      expect(res.deepStatus).toBe('deficient')
    })
  })

  describe('evaluateExecutiveSleepSession', () => {
    it('scores an elite recovery session with high score and CNS primed guidance', () => {
      const record: ExecutiveSleepRecord = {
        date: '2026-08-27',
        bedtime: '22:30',
        wakeTime: '06:45',
        totalSleepDurationHours: 8.0,
        timeInBedHours: 8.5,
        stages: {
          deep: 1.8,
          rem: 2.0,
          light: 4.2,
          awake: 0.5,
        },
        nocturnalHrvRmssdMs: 78,
        baselineHrvRmssdMs: 70,
        nocturnalMinRhrBpm: 48,
        daytimeAvgRhrBpm: 60, // 20% dip
        respiratoryRateBpm: 14.2,
        skinTempDeviationCelsius: -0.1,
      }

      const analysis = evaluateExecutiveSleepSession(record)
      expect(analysis.overallSleepScore).toBeGreaterThanOrEqual(88)
      expect(analysis.sleepQualityTier).toBe('elite')
      expect(analysis.autonomicRecoveryStatus).toBe('prime_adaptation')
      expect(analysis.trainingCapacityStatus).toContain('High Adaptation Capacity')
      expect(analysis.recoveryKeyActions.length).toBeGreaterThan(0)
    })

    it('identifies severe sleep and autonomic deficit on short, low-HRV sleep', () => {
      const record: ExecutiveSleepRecord = {
        date: '2026-08-27',
        bedtime: '01:30',
        wakeTime: '06:00',
        totalSleepDurationHours: 4.5,
        timeInBedHours: 5.5,
        stages: {
          deep: 0.4,
          rem: 0.6,
          light: 3.5,
          awake: 1.0,
        },
        nocturnalHrvRmssdMs: 40,
        baselineHrvRmssdMs: 70, // -43% vs baseline
        nocturnalMinRhrBpm: 62,
        daytimeAvgRhrBpm: 64, // ~3% dip
        skinTempDeviationCelsius: +0.8, // thermal stress
      }

      const analysis = evaluateExecutiveSleepSession(record)
      expect(analysis.overallSleepScore).toBeLessThan(60)
      expect(analysis.sleepQualityTier).toBe('critical')
      expect(analysis.autonomicRecoveryStatus).toBe('severe_fatigue_deficit')
      expect(analysis.trainingCapacityStatus).toContain('Restorative')
    })
  })
})
