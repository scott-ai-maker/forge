import { describe, it, expect } from 'vitest'
import {
  resolveAppleCardioActivityType,
  normalizeAppleHealthIngestPayload,
  generateDailyAppleHealthBaseline,
  formatAppleHealthTelemetryToBiometricSummary,
} from './apple-health-bridge'

describe('apple-health-bridge (Inbound Telemetry & Nutrition)', () => {
  describe('resolveAppleCardioActivityType', () => {
    it('correctly maps standard walking', () => {
      const res = resolveAppleCardioActivityType('Outdoor Walking')
      expect(res.activityType).toBe('HKWorkoutActivityTypeWalking')
      expect(res.appleExerciseName).toBe('Walking')
      expect(res.icon).toBe('walker')
      expect(res.caloricMultiplierPerMin).toBeGreaterThan(4)
    })

    it('correctly maps incline walking and 12-3-30 treadmill protocols', () => {
      const resIncline = resolveAppleCardioActivityType('Incline Walking')
      expect(resIncline.activityType).toBe('HKWorkoutActivityTypeWalking')
      expect(resIncline.appleExerciseName).toBe('Incline Walking')
      expect(resIncline.icon).toBe('mountain')
      expect(resIncline.caloricMultiplierPerMin).toBeGreaterThan(7.5)

      const res1230 = resolveAppleCardioActivityType('12-3-30 Treadmill Incline')
      expect(res1230.appleExerciseName).toBe('Incline Walking')
    })

    it('maps running, cycling, rowing, and stairs', () => {
      expect(resolveAppleCardioActivityType('Treadmill Running').activityType).toBe('HKWorkoutActivityTypeRunning')
      expect(resolveAppleCardioActivityType('Assault AirBike').activityType).toBe('HKWorkoutActivityTypeCycling')
      expect(resolveAppleCardioActivityType('Concept2 Rower').activityType).toBe('HKWorkoutActivityTypeRowing')
      expect(resolveAppleCardioActivityType('StairMaster StepMill').activityType).toBe('HKWorkoutActivityTypeStairs')
      expect(resolveAppleCardioActivityType('HIIT Tabata Sprint').activityType).toBe('HKWorkoutActivityTypeHighIntensityIntervalTraining')
    })
  })

  describe('normalizeAppleHealthIngestPayload', () => {
    it('normalizes inbound biometrics, sleep stages, and dietary nutrition records', () => {
      const normalized = normalizeAppleHealthIngestPayload({
        date: '2026-08-29',
        resting_heart_rate: 52,
        hrv_rmssd: 84,
        active_calories: 710,
        steps: 10840,
        distance_miles: 4.8,
        respiratory_rate: 13.8,
        vo2_max: 51.2,
        sleep: {
          total_hours: 8.2,
          deep_hours: 2.3,
          rem_hours: 2.1,
          light_hours: 3.5,
          awake_hours: 0.3,
        },
        nutrition: {
          calories: 2350,
          protein: 195,
          carbs: 240,
          fat: 65,
          fiber: 38,
          water_oz: 128,
        },
        workouts: [
          {
            id: 'watch-w1',
            name: 'Traditional Strength Training',
            duration_mins: 55,
            calories: 420,
            avg_hr: 138,
            max_hr: 168,
          },
          {
            id: 'watch-w2',
            name: 'Incline Walking',
            duration_mins: 20,
            calories: 180,
            avg_hr: 144,
          },
        ],
      })

      expect(normalized.date).toBe('2026-08-29')
      expect(normalized.restingHeartRateBpm).toBe(52)
      expect(normalized.hrvRmssdMs).toBe(84)
      expect(normalized.activeEnergyBurnedKcal).toBe(710)
      expect(normalized.stepCount).toBe(10840)
      expect(normalized.vo2MaxMlKgMin).toBe(51.2)

      // Sleep
      expect(normalized.sleep.totalHours).toBe(8.2)
      expect(normalized.sleep.deepHours).toBe(2.3)
      expect(normalized.sleep.remHours).toBe(2.1)
      expect(normalized.sleep.sleepEfficiencyPercent).toBeGreaterThanOrEqual(90)

      // Nutrition
      expect(normalized.nutrition.caloriesConsumedKcal).toBe(2350)
      expect(normalized.nutrition.proteinGrams).toBe(195)
      expect(normalized.nutrition.carbsGrams).toBe(240)
      expect(normalized.nutrition.fatGrams).toBe(65)
      expect(normalized.nutrition.fiberGrams).toBe(38)
      expect(normalized.nutrition.waterOz).toBe(128)

      // Workouts
      expect(normalized.recentWorkouts.length).toBe(2)
      expect(normalized.recentWorkouts[0].appleExerciseName).toBe('Traditional Strength Training')
      expect(normalized.recentWorkouts[1].appleExerciseName).toBe('Incline Walking')
    })

    it('correctly ingests water tracking when only water is logged without food', () => {
      const normalized = normalizeAppleHealthIngestPayload({
        water_oz: 96,
        nutrition: {
          water_oz: 96,
        },
      })
      expect(normalized.nutrition.waterOz).toBe(96)
    })

    it('preserves 0 oz water intake without falling back to mock defaults', () => {
      const normalized = normalizeAppleHealthIngestPayload({
        water_oz: 0,
        nutrition: {
          water_oz: 0,
        },
      })
      expect(normalized.nutrition.waterOz).toBe(0)
    })

    it('accepts top-level water_oz and waterOz fields directly', () => {
      const normalized1 = normalizeAppleHealthIngestPayload({ water_oz: 84 })
      expect(normalized1.nutrition.waterOz).toBe(84)

      const normalized2 = normalizeAppleHealthIngestPayload({ waterOz: 115 })
      expect(normalized2.nutrition.waterOz).toBe(115)
    })

    it('preserves bedtime and wakeTime from HealthKit sleep session', () => {
      const normalized = normalizeAppleHealthIngestPayload({
        sleep: {
          total_hours: 7.6,
          deep_hours: 1.8,
          rem_hours: 1.7,
          bedtime: '23:14',
          wakeTime: '06:50',
        },
      })
      expect(normalized.sleep.bedtime).toBe('23:14')
      expect(normalized.sleep.wakeTime).toBe('06:50')
    })
  })

  describe('generateDailyAppleHealthBaseline', () => {
    it('generates consistent, realistic daily telemetry for a specific date', () => {
      const baseline = generateDailyAppleHealthBaseline('2026-08-30', 54)
      expect(baseline.date).toBe('2026-08-30')
      expect(baseline.resting_heart_rate).toBeGreaterThanOrEqual(50)
      expect(baseline.resting_heart_rate).toBeLessThanOrEqual(60)
      expect(baseline.hrv_rmssd).toBeGreaterThanOrEqual(70)
      expect(baseline.sleep?.total_hours).toBeGreaterThanOrEqual(7.0)
      expect(baseline.nutrition?.calories).toBeGreaterThanOrEqual(2000)
      expect(baseline.nutrition?.protein).toBeGreaterThanOrEqual(170)
    })
  })

  describe('formatAppleHealthTelemetryToBiometricSummary', () => {
    it('transforms normalized record to DailyBiometricSummary format', () => {
      const normalized = normalizeAppleHealthIngestPayload({
        date: '2026-08-30',
        current_heart_rate: 136,
        resting_heart_rate: 54,
        hrv_rmssd: 80,
        active_calories: 650,
        steps: 9800,
        sleep: { total_hours: 8.0, deep_hours: 2.2, bedtime: '22:45', wakeTime: '06:45' },
        nutrition: { calories: 2200, protein: 190, carbs: 225, fat: 60, water_oz: 120 },
      })
      expect(normalized.currentHeartRateBpm).toBe(136)
      const summary = formatAppleHealthTelemetryToBiometricSummary(normalized, 95)
      expect(summary.provider).toBe('apple_health')
      expect(summary.currentHeartRate).toBe(136)
      expect(summary.cnsStressScore).toBe(95)
      expect(summary.restingHeartRate).toBe(54)
      expect(summary.sleepHours).toBe(8.0)
      expect(summary.bedtime).toBe('22:45')
      expect(summary.wakeTime).toBe('06:45')
      expect(summary.nutrition.proteinGrams).toBe(190)
      expect(summary.nutrition.waterOz).toBe(120)
    })

    it('preserves 0 oz water in biometric summary without converting to 108', () => {
      const normalized = normalizeAppleHealthIngestPayload({
        nutrition: { water_oz: 0 },
      })
      const summary = formatAppleHealthTelemetryToBiometricSummary(normalized)
      expect(summary.nutrition.waterOz).toBe(0)
    })
  })
})
