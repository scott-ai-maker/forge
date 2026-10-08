/**
 * Forge Athletic — Vital Health API Bridge
 * Turnkey 1-tap Apple Health & Google Health Connect Aggregator Engine
 * Handles user creation, Link Token generation, and normalized webhook ingestion.
 */

import { computeWearableCnsScore, type WearableProvider, type DailyBiometricSummary } from './wearables-telemetry'

export interface VitalLinkConfig {
  clientUserId: string
  provider?: 'apple_health' | 'google_fit' | 'freestyle_libre'
  redirectUrl?: string
}

export interface VitalLinkResponse {
  linkToken: string
  connectUrl: string
  isSandbox: boolean
  provider: WearableProvider
}

export interface VitalWebhookPayload {
  event_type: string
  user_id: string
  client_user_id?: string
  data: Record<string, unknown>
}

/**
 * Resolves the Vital API Base URL based on environment.
 */
export function getVitalApiBaseUrl(): string {
  const env = process.env.VITAL_ENVIRONMENT || 'sandbox'
  if (env === 'production') {
    return 'https://api.tryvital.io/v2'
  }
  if (env === 'eu') {
    return 'https://api.eu.tryvital.io/v2'
  }
  return 'https://api.sandbox.tryvital.io/v2'
}

/**
 * Creates or retrieves a Vital user for the given GAA client ID.
 */
export async function getOrCreateVitalUser(clientUserId: string): Promise<string> {
  const apiKey = process.env.VITAL_API_KEY

  // In simulated/mock mode when API key isn't configured yet
  if (!apiKey) {
    return `vital-user-sim-${clientUserId}`
  }

  const baseUrl = getVitalApiBaseUrl()
  const res = await fetch(`${baseUrl}/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-vital-api-key': apiKey,
    },
    body: JSON.stringify({ client_user_id: clientUserId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Vital user creation failed: ${err.message || res.statusText}`)
  }

  const data = await res.json()
  return data.user_id
}

/**
 * Generates an instant Vital Link Token and 1-tap mobile pairing URL for a client.
 */
export async function generateVitalLinkToken(
  clientUserId: string,
  provider: WearableProvider = 'apple_health'
): Promise<VitalLinkResponse> {
  const apiKey = process.env.VITAL_API_KEY
  const isSandbox = (process.env.VITAL_ENVIRONMENT || 'sandbox') === 'sandbox'

  // If no API key yet, provide a ready-to-test simulated link
  if (!apiKey) {
    const simulatedToken = `vital_link_sim_${Buffer.from(clientUserId).toString('hex').slice(0, 16)}`
    return {
      linkToken: simulatedToken,
      connectUrl: `https://link.tryvital.io/?token=${simulatedToken}&provider=${provider}`,
      isSandbox: true,
      provider,
    }
  }

  const vitalUserId = await getOrCreateVitalUser(clientUserId)
  const baseUrl = getVitalApiBaseUrl()

  const res = await fetch(`${baseUrl}/link/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-vital-api-key': apiKey,
    },
    body: JSON.stringify({
      user_id: vitalUserId,
      provider: provider === 'google_fit' ? 'google_fit' : 'apple_health',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Failed generating Vital link token: ${err.message || res.statusText}`)
  }

  const data = await res.json()
  const linkToken = data.link_token
  const connectUrl = `https://link.tryvital.io/?token=${linkToken}`

  return {
    linkToken,
    connectUrl,
    isSandbox,
    provider,
  }
}

/**
 * Normalizes an incoming Vital webhook event payload into a GAA DailyBiometricSummary.
 */
export function normalizeVitalDailyPayload(
  payload: Record<string, unknown>,
  fallbackUserId: string
): {
  userId: string
  provider: WearableProvider
  summary: DailyBiometricSummary
  date: string
} {
  const now = new Date().toISOString()
  const data = (payload.data as Record<string, unknown>) || payload
  const providerKey = String(payload.source || data.source || '').toLowerCase()
  const provider: WearableProvider = providerKey.includes('google') || providerKey.includes('android')
    ? 'google_fit'
    : 'apple_health'

  const userId = String(payload.client_user_id || payload.user_id || fallbackUserId)
  const date = String(data.calendar_date || data.date || now.split('T')[0])

  const rhr = data.resting_hr != null
    ? Number(data.resting_hr)
    : (data.resting_heart_rate != null ? Number(data.resting_heart_rate) : null)

  const hrv = data.hrv_rmssd != null
    ? Number(data.hrv_rmssd)
    : (data.hrv != null ? Number(data.hrv) : null)

  const sleepObj = (data.sleep as Record<string, unknown>) || {}
  const sleepHours = sleepObj.duration_hours != null
    ? Number(sleepObj.duration_hours)
    : (data.sleep_hours != null ? Number(data.sleep_hours) : null)

  const deepSleepHours = sleepObj.deep_hours != null
    ? Number(sleepObj.deep_hours)
    : (data.deep_sleep_hours != null ? Number(data.deep_sleep_hours) : null)

  const steps = data.steps != null
    ? Number(data.steps)
    : (data.steps_count != null ? Number(data.steps_count) : null)

  const activeCals = data.active_calories != null
    ? Number(data.active_calories)
    : (data.active_energy_burned != null ? Number(data.active_energy_burned) : null)

  const nutritionObj = (data.nutrition as Record<string, unknown>) || (data.macros as Record<string, unknown>) || null
  const caloriesConsumed = nutritionObj?.calories != null ? Number(nutritionObj.calories) : null
  const protein = nutritionObj?.protein != null ? Number(nutritionObj.protein) : null
  const carbs = nutritionObj?.carbs != null ? Number(nutritionObj.carbs) : null
  const fat = nutritionObj?.fat != null ? Number(nutritionObj.fat) : null

  const hasNutrition = caloriesConsumed != null || protein != null

  const cnsScore = computeWearableCnsScore(hrv, rhr, 65, 54)

  const summary: DailyBiometricSummary = {
    date,
    provider,
    restingHeartRate: rhr,
    hrvRmssdMs: hrv,
    cnsStressScore: cnsScore,
    sleepHours,
    deepSleepHours,
    stepsCount: steps,
    activeCaloriesKcal: activeCals,
    nutrition: hasNutrition
      ? {
          caloriesConsumedKcal: caloriesConsumed || 0,
          proteinGrams: protein || 0,
          carbsGrams: carbs || 0,
          fatGrams: fat || 0,
        }
      : null,
    updatedAt: now,
  }

  return {
    userId,
    provider,
    summary,
    date,
  }
}

