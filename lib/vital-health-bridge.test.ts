import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getVitalApiBaseUrl,
  generateVitalLinkToken,
  normalizeVitalDailyPayload,
} from './vital-health-bridge'

describe('Vital Health Bridge Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.VITAL_API_KEY
    delete process.env.VITAL_ENVIRONMENT
  })

  it('resolves sandbox and production base URLs', () => {
    process.env.VITAL_ENVIRONMENT = 'production'
    expect(getVitalApiBaseUrl()).toBe('https://api.tryvital.io/v2')

    process.env.VITAL_ENVIRONMENT = 'sandbox'
    expect(getVitalApiBaseUrl()).toBe('https://api.sandbox.tryvital.io/v2')
  })

  it('generates simulated Vital Link token when API key is unconfigured', async () => {
    const res = await generateVitalLinkToken('client-abc', 'apple_health')
    expect(res.linkToken).toBeDefined()
    expect(res.connectUrl).toContain('https://link.tryvital.io/?token=')
    expect(res.provider).toBe('apple_health')
    expect(res.isSandbox).toBe(true)
  })

  it('normalizes incoming Vital daily metrics payload into GAA summary', () => {
    const payload = {
      event_type: 'daily.data.apple_health.created',
      client_user_id: 'client-999',
      source: 'apple_health',
      data: {
        calendar_date: '2026-08-31',
        resting_hr: 52,
        hrv_rmssd: 84,
        steps: 10400,
        active_calories: 680,
        sleep: {
          duration_hours: 8.2,
          deep_hours: 2.3,
        },
        nutrition: {
          calories: 2400,
          protein: 205,
          carbs: 235,
          fat: 66,
        },
      },
    }

    const { userId, provider, summary, date } = normalizeVitalDailyPayload(payload, 'client-fallback')
    expect(userId).toBe('client-999')
    expect(provider).toBe('apple_health')
    expect(date).toBe('2026-08-31')
    expect(summary.restingHeartRate).toBe(52)
    expect(summary.hrvRmssdMs).toBe(84)
    expect(summary.sleepHours).toBe(8.2)
    expect(summary.deepSleepHours).toBe(2.3)
    expect(summary.stepsCount).toBe(10400)
    expect(summary.activeCaloriesKcal).toBe(680)
    expect(summary.nutrition?.proteinGrams).toBe(205)
    expect(summary.cnsStressScore).toBeGreaterThan(70)
  })
})

