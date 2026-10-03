import { describe, expect, it } from 'vitest'
import {
  verifyAppleHealthWebhookToken,
  verifyGoogleHealthWebhookToken,
  normalizeAppleHealthDailyMetrics,
  normalizeGoogleHealthDailyMetrics,
} from './wearable-webhook-adapters'

describe('Single Source of Truth Wearable Webhook Adapters', () => {
  describe('Cryptographic Token Verification', () => {
    it('verifies Apple HealthKit bearer token and shared secrets', () => {
      expect(verifyAppleHealthWebhookToken('Bearer my_secret_token_abc', 'my_secret_token_abc')).toBe(true)
      expect(verifyAppleHealthWebhookToken('my_secret_token_abc', 'my_secret_token_abc')).toBe(true)
      expect(verifyAppleHealthWebhookToken('Bearer wrong_token', 'my_secret_token_abc')).toBe(false)
      expect(verifyAppleHealthWebhookToken(null, 'my_secret_token_abc')).toBe(false)
    })

    it('verifies Google Health Connect bearer token and shared secrets', () => {
      expect(verifyGoogleHealthWebhookToken('Bearer google_token_xyz', 'google_token_xyz')).toBe(true)
      expect(verifyGoogleHealthWebhookToken('google_token_xyz', 'google_token_xyz')).toBe(true)
      expect(verifyGoogleHealthWebhookToken('Bearer wrong_token', 'google_token_xyz')).toBe(false)
      expect(verifyGoogleHealthWebhookToken(undefined, 'google_token_xyz')).toBe(false)
    })
  })

  describe('Apple Health Normalization', () => {
    it('normalizes Apple Health daily biometrics, sleep, and macros', () => {
      const applePayload = {
        date: '2026-08-30',
        resting_heart_rate: 51,
        hrv_rmssd: 82,
        active_calories: 650,
        steps: 10200,
        sleep: {
          total_hours: 8.2,
          deep_hours: 2.3,
          rem_hours: 2.0,
          light_hours: 3.5,
          awake_hours: 0.4,
        },
        nutrition: {
          calories: 2280,
          protein: 192,
          carbs: 230,
          fat: 62,
          fiber: 35,
          water_oz: 120,
        },
      }

      const normalized = normalizeAppleHealthDailyMetrics(applePayload, 'user-apple-123')
      expect(normalized.provider).toBe('apple_health')
      expect(normalized.userId).toBe('user-apple-123')
      expect(normalized.date).toBe('2026-08-30')
      expect(normalized.restingHeartRateBpm).toBe(51)
      expect(normalized.hrvRmssdMs).toBe(82)
      expect(normalized.cnsReadinessScore).toBeGreaterThanOrEqual(80)
      expect(normalized.sleep.totalHours).toBe(8.2)
      expect(normalized.sleep.deepHours).toBe(2.3)
      expect(normalized.nutrition?.proteinGrams).toBe(192)
    })
  })

  describe('Google Health Connect Normalization', () => {
    it('normalizes Google Health Connect daily biometrics, sleep, and macros', () => {
      const googlePayload = {
        date: '2026-08-30',
        resting_heart_rate: 53,
        hrv_rmssd: 79,
        active_calories: 620,
        steps: 9800,
        sleep: {
          total_hours: 7.9,
          deep_hours: 2.1,
          rem_hours: 1.9,
          light_hours: 3.5,
          awake_hours: 0.4,
        },
        nutrition: {
          calories: 2210,
          protein: 186,
          carbs: 225,
          fat: 60,
          fiber: 33,
          water_oz: 110,
        },
      }

      const normalized = normalizeGoogleHealthDailyMetrics(googlePayload, 'user-google-456')
      expect(normalized.provider).toBe('google_fit')
      expect(normalized.userId).toBe('user-google-456')
      expect(normalized.date).toBe('2026-08-30')
      expect(normalized.restingHeartRateBpm).toBe(53)
      expect(normalized.hrvRmssdMs).toBe(79)
      expect(normalized.cnsReadinessScore).toBeGreaterThanOrEqual(80)
      expect(normalized.sleep.totalHours).toBe(7.9)
      expect(normalized.nutrition?.proteinGrams).toBe(186)
    })
  })
})
