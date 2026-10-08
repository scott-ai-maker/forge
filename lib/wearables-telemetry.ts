/**
 * Forge Athletic — Master Wearables & Biometric Telemetry Engine
 * Standardizes biometric ingest from Apple Health, Google Health Connect, Whoop, Garmin, Oura, Polar,
 * and live in-gym Web Bluetooth Heart Rate monitors.
 */

import { calculateCardioZones, identifyHeartRateZone } from './nasm-cardio-stage-engine'

export type WearableProvider =
  | 'apple_health'
  | 'google_fit'

export interface WearableProviderMeta {
  id: WearableProvider
  name: string
  icon: string
  badge: string
  color: string
  platform: 'ios' | 'android'
  supportedMetrics: ('live_hr' | 'workout_hr' | 'hrv' | 'resting_hr' | 'sleep' | 'steps' | 'vo2max' | 'nutrition')[]
  syncCadence: 'Continuous 24/7 Auto-Sync'
  description: string
}

export const WEARABLE_PROVIDERS: Record<WearableProvider, WearableProviderMeta> = {
  apple_health: {
    id: 'apple_health',
    name: 'Apple Health & Apple Watch',
    icon: 'apple',
    badge: 'Apple HealthKit',
    color: '#FF2D55',
    platform: 'ios',
    supportedMetrics: ['live_hr', 'workout_hr', 'hrv', 'resting_hr', 'sleep', 'steps', 'vo2max', 'nutrition'],
    syncCadence: 'Continuous 24/7 Auto-Sync',
    description: 'Single source of truth for iOS & Apple Watch. Syncs Tanaka cardio zones, morning HRV, resting heart rate, sleep architecture, and dietary nutrition.',
  },
  google_fit: {
    id: 'google_fit',
    name: 'Google Health Connect & Wear OS',
    icon: 'radio',
    badge: 'Health Connect',
    color: '#4285F4',
    platform: 'android',
    supportedMetrics: ['workout_hr', 'resting_hr', 'hrv', 'sleep', 'steps', 'vo2max', 'nutrition'],
    syncCadence: 'Continuous 24/7 Auto-Sync',
    description: 'Single source of truth for Android, Pixel Watch & Samsung Health. Aggregates Health Connect biometrics, dietary macros, and workout telemetry.',
  },
}

export interface WearableWorkoutEvent {
  externalId: string
  provider: WearableProvider
  activityType: string
  startTime: string
  endTime: string
  durationMins: number
  distanceKm?: number | null
  caloriesKcal?: number | null
  avgHeartRate?: number | null
  maxHeartRate?: number | null
  tanakaZone?: ReturnType<typeof identifyHeartRateZone> | null
  timeInZones?: {
    zone1Mins: number
    zone2Mins: number
    zone3Mins: number
    recoveryMins: number
  } | null
  rawPayload?: Record<string, unknown>
}

export interface DailyBiometricSummary {
  date: string
  provider: WearableProvider
  currentHeartRate?: number | null
  restingHeartRate?: number | null
  hrvRmssdMs?: number | null
  cnsStressScore?: number | null // 0-100 (100 = optimal recovery)
  sleepHours?: number | null
  deepSleepHours?: number | null
  bedtime?: string | null
  wakeTime?: string | null
  stepsCount?: number | null
  activeCaloriesKcal?: number | null
  nutrition?: {
    caloriesConsumedKcal: number
    proteinGrams: number
    carbsGrams: number
    fatGrams: number
    fiberGrams?: number
    waterOz?: number
  } | null
  updatedAt: string
}

export interface WearableConnectionRecord {
  id: string
  clientId: string
  provider: WearableProvider
  status: 'connected' | 'syncing' | 'error' | 'disconnected'
  lastSyncAt: string | null
  deviceModel?: string | null
  batteryLevel?: number | null
  latestBiometrics?: DailyBiometricSummary | null
}

/**
 * Calculates time spent in Tanaka Cardio Zones given heart rate samples and athlete age.
 */
export function calculateTimeInHeartRateZones(
  samples: Array<{ timestamp: string; bpm: number }>,
  athleteAge: number = 35
): {
  zone1Mins: number
  zone2Mins: number
  zone3Mins: number
  recoveryMins: number
} {
  if (!samples || samples.length === 0) {
    return { zone1Mins: 0, zone2Mins: 0, zone3Mins: 0, recoveryMins: 0 }
  }

  const zones = calculateCardioZones(athleteAge)
  let z1Seconds = 0
  let z2Seconds = 0
  let z3Seconds = 0
  let recSeconds = 0

  for (let i = 0; i < samples.length - 1; i++) {
    const current = samples[i]
    const next = samples[i + 1]
    const diffSec = Math.min(
      Math.max((new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()) / 1000, 1),
      60
    )

    const bpm = current.bpm
    if (bpm >= zones.zone3.minBpm) {
      z3Seconds += diffSec
    } else if (bpm >= zones.zone2.minBpm) {
      z2Seconds += diffSec
    } else if (bpm >= zones.zone1.minBpm) {
      z1Seconds += diffSec
    } else {
      recSeconds += diffSec
    }
  }

  return {
    zone1Mins: Math.round((z1Seconds / 60) * 10) / 10,
    zone2Mins: Math.round((z2Seconds / 60) * 10) / 10,
    zone3Mins: Math.round((z3Seconds / 60) * 10) / 10,
    recoveryMins: Math.round((recSeconds / 60) * 10) / 10,
  }
}

/**
 * Computes a standardized CNS Readiness score (0-100) from incoming HRV and Resting HR.
 */
export function computeWearableCnsScore(
  hrvRmssdMs: number | null | undefined,
  restingHr: number | null | undefined,
  baselineHrv = 65,
  baselineRhr = 58
): number | null {
  const hasHrv = typeof hrvRmssdMs === 'number' && Number.isFinite(hrvRmssdMs) && hrvRmssdMs > 0
  const hasRhr = typeof restingHr === 'number' && Number.isFinite(restingHr) && restingHr > 0
  if (!hasHrv && !hasRhr) return null

  let score = 80

  if (hasHrv) {
    const hrvRatio = hrvRmssdMs / baselineHrv
    if (hrvRatio >= 1.15) score += 12
    else if (hrvRatio >= 0.95) score += 6
    else if (hrvRatio >= 0.8) score -= 8
    else if (hrvRatio >= 0.65) score -= 18
    else score -= 30
  }

  if (hasRhr) {
    const rhrDiff = restingHr - baselineRhr
    if (rhrDiff <= -3) score += 8
    else if (rhrDiff <= 2) score += 4
    else if (rhrDiff <= 6) score -= 8
    else score -= 20
  }

  return Math.min(Math.max(Math.round(score), 10), 100)
}

/**
 * Normalizes raw webhook workout payloads into a standard WearableWorkoutEvent.
 */
export function normalizeWearableWorkout(
  raw: Record<string, unknown>,
  provider: WearableProvider,
  athleteAge: number = 35
): WearableWorkoutEvent {
  const externalId = String(raw.id || raw.workout_id || raw.external_id || `${provider}-${Date.now()}`)
  const activityType = String(raw.activity_type || raw.type || raw.name || 'cardio').toLowerCase()
  const startTime = String(raw.start_time || raw.started_at || new Date().toISOString())
  const endTime = String(raw.end_time || raw.ended_at || new Date().toISOString())

  const durationMins = Number(raw.duration_mins) ||
    (raw.duration_seconds ? Math.round(Number(raw.duration_seconds) / 60) : 0) ||
    Math.max(Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000), 1)

  const distanceKm = raw.distance_km ? Number(raw.distance_km) :
    raw.distance_meters ? Math.round((Number(raw.distance_meters) / 1000) * 100) / 100 : null

  const caloriesKcal = raw.calories ? Number(raw.calories) :
    raw.active_calories ? Number(raw.active_calories) : null

  const avgHeartRate = raw.avg_heart_rate ? Number(raw.avg_heart_rate) :
    raw.average_hr ? Number(raw.average_hr) : null

  const maxHeartRate = raw.max_heart_rate ? Number(raw.max_heart_rate) :
    raw.peak_hr ? Number(raw.peak_hr) : null

  const tanakaZone = avgHeartRate ? identifyHeartRateZone(avgHeartRate, athleteAge) : null

  let timeInZones = null
  if (Array.isArray(raw.heart_rate_samples) && raw.heart_rate_samples.length > 0) {
    timeInZones = calculateTimeInHeartRateZones(raw.heart_rate_samples, athleteAge)
  }

  return {
    externalId,
    provider,
    activityType,
    startTime,
    endTime,
    durationMins,
    distanceKm,
    caloriesKcal,
    avgHeartRate,
    maxHeartRate,
    tanakaZone,
    timeInZones,
    rawPayload: raw,
  }
}
