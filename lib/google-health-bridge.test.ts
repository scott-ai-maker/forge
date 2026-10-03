import { describe, it, expect } from 'vitest'
import {
  resolveGoogleHealthActivityType,
  normalizeGoogleHealthIngestPayload,
  generateDailyGoogleHealthBaseline,
  formatGoogleHealthTelemetryToBiometricSummary,
} from './google-health-bridge'

describe('google-health-bridge (Android Inbound Telemetry & Nutrition)', () => {
  describe('resolveGoogleHealthActivityType', () => {
    it('correctly maps standard walking', () => {
      const res = resolveGoogleHealthActivityType('Outdoor Walking')
      expect(res.activityType).toBe('workout.walking')
      expect(res.exerciseName).toBe('Walking')
      expect(res.icon).toBe('walker')
      expect(res.caloricMultiplierPerMin).toBeGreaterThan(4)
    })

    it('correctly maps incline walking and 12-3-30 treadmill protocols', () => {
      const resIncline = resolveGoogleHealthActivityType('Incline Walking')
      expect(resIncline.activityType).toBe('workout.walking')
      expect(resIncline.exerciseName).toBe('Incline Walking')
      expect(resIncline.icon).toBe('mountain')
      expect(resIncline.caloricMultiplierPerMin).toBeGreaterThan(7.5)

      const res1230 = resolveGoogleHealthActivityType('12-3-30 Treadmill Incline')
      expect(res1230.exerciseName).toBe('Incline Walking')
    })

    it('maps running, cycling, rowing, strength, and stairs', () => {
      expect(resolveGoogleHealthActivityType('Treadmill Running').activityType).toBe('workout.running')
      expect(resolveGoogleHealthActivityType('Assault AirBike').activityType).toBe('workout.cycling')
      expect(resolveGoogleHealthActivityType('Concept2 Rower').activityType).toBe('workout.rowing')
      expect(resolveGoogleHealthActivityType('StairMaster StepMill').activityType).toBe('workout.stair_climbing')
      expect(resolveGoogleHealthActivityType('HIIT Tabata Sprint').activityType).toBe('workout.high_intensity_interval_training')
      expect(resolveGoogleHealthActivityType('Barbell Squat & Hypertrophy').activityType).toBe('workout.strength_training')
    })
  })

  describe('normalizeGoogleHealthIngestPayload', () => {
    it('normalizes inbound biometrics, sleep stages, and dietary nutrition records', () => {
      const normalized = normalizeGoogleHealthIngestPayload({
        date: '2026-08-29',
        resting_heart_rate: 53,
        hrv_rmssd: 82,
        active_calories: 680,
        steps: 10400,
        distance_miles: 4.6,
        respiratory_rate: 13.9,
        vo2_max: 50.8,
        sleep: {
          total_hours: 8.0,
          deep_hours: 2.2,
          rem_hours: 2.0,
          light_hours: 3.5,
          awake_hours: 0.3,
        },
        nutrition: {
          calories: 2320,
          protein: 190,
          carbs: 235,
          fat: 64,
          fiber: 36,
          water_oz: 120,
        },
        workouts: [
          {
            id: 'pixel-w1',
            name: 'Traditional Strength Training',
            duration_mins: 50,
            calories: 410,
            avg_hr: 136,
            max_hr: 165,
          },
          {
            id: 'pixel-w2',
            name: 'Incline Walking',
            duration_mins: 25,
            calories: 210,
            avg_hr: 142,
          },
        ],
      })

      expect(normalized.date).toBe('2026-08-29')
      expect(normalized.restingHeartRateBpm).toBe(53)
      expect(normalized.hrvRmssdMs).toBe(82)
      expect(normalized.activeEnergyBurnedKcal).toBe(680)
      expect(normalized.stepCount).toBe(10400)
      expect(normalized.vo2MaxMlKgMin).toBe(50.8)

      // Sleep
      expect(normalized.sleep.totalHours).toBe(8.0)
      expect(normalized.sleep.deepHours).toBe(2.2)
      expect(normalized.sleep.remHours).toBe(2.0)
      expect(normalized.sleep.sleepEfficiencyPercent).toBeGreaterThanOrEqual(90)

      // Nutrition
      expect(normalized.nutrition.caloriesConsumedKcal).toBe(2320)
      expect(normalized.nutrition.proteinGrams).toBe(190)
      expect(normalized.nutrition.carbsGrams).toBe(235)
      expect(normalized.nutrition.fatGrams).toBe(64)
      expect(normalized.nutrition.fiberGrams).toBe(36)
      expect(normalized.nutrition.waterOz).toBe(120)

      // Workouts
      expect(normalized.recentWorkouts.length).toBe(2)
      expect(normalized.recentWorkouts[0].exerciseName).toBe('Traditional Strength Training')
      expect(normalized.recentWorkouts[1].exerciseName).toBe('Incline Walking')
    })
  })

  describe('generateDailyGoogleHealthBaseline', () => {
    it('generates consistent, realistic daily telemetry for Android', () => {
      const baseline = generateDailyGoogleHealthBaseline('2026-08-30', 54)
      expect(baseline.date).toBe('2026-08-30')
      expect(baseline.resting_heart_rate).toBeGreaterThanOrEqual(50)
      expect(baseline.resting_heart_rate).toBeLessThanOrEqual(60)
      expect(baseline.hrv_rmssd).toBeGreaterThanOrEqual(68)
      expect(baseline.sleep?.total_hours).toBeGreaterThanOrEqual(7.0)
      expect(baseline.nutrition?.calories).toBeGreaterThanOrEqual(2000)
      expect(baseline.nutrition?.protein).toBeGreaterThanOrEqual(170)
    })
  })

  describe('formatGoogleHealthTelemetryToBiometricSummary', () => {
    it('transforms normalized record to DailyBiometricSummary format with google_fit provider', () => {
      const normalized = normalizeGoogleHealthIngestPayload({
        date: '2026-08-30',
        resting_heart_rate: 53,
        hrv_rmssd: 78,
        active_calories: 640,
        steps: 9600,
        sleep: { total_hours: 7.9, deep_hours: 2.1 },
        nutrition: { calories: 2190, protein: 188, carbs: 220, fat: 58 },
      })
      const summary = formatGoogleHealthTelemetryToBiometricSummary(normalized, 93)
      expect(summary.provider).toBe('google_fit')
      expect(summary.cnsStressScore).toBe(93)
      expect(summary.restingHeartRate).toBe(53)
      expect(summary.sleepHours).toBe(7.9)
      expect(summary.nutrition.proteinGrams).toBe(188)
    })
  })
})

