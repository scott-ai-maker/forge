/**
 * Gordon Athletic Advisory — Single Source of Truth Wearable Webhook Engine
 *
 * Provides cryptographic webhook token verification and normalized telemetry
 * ingestion for Apple Health (iOS / Apple Watch) and Google Health Connect (Android / Wear OS).
 */

import crypto from 'crypto'
import type { WearableProvider } from '@/lib/wearables-telemetry'
import { identifyHeartRateZone } from '@/lib/nasm-cardio-stage-engine'
import {
  normalizeAppleHealthIngestPayload,
  type RawAppleHealthIngestPayload,
} from '@/lib/apple-health-bridge'
import {
  normalizeGoogleHealthIngestPayload,
  type RawGoogleHealthIngestPayload,
} from '@/lib/google-health-bridge'
import { computeWearableCnsScore } from '@/lib/wearables-telemetry'

// ── 1. CRYPTOGRAPHIC SIGNATURE & TOKEN VERIFICATION ──────────────────

/**
 * Validates Apple HealthKit / Health Auto Export Bearer Token or Shared Secret
 */
export function verifyAppleHealthWebhookToken(
  authHeader: string | null | undefined,
  expectedSecret: string
): boolean {
  if (!authHeader || !expectedSecret) return false

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim()

  if (!token || token.length !== expectedSecret.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedSecret))
  } catch {
    return false
  }
}

/**
 * Validates Google Health Connect / Android Push Webhook Bearer Token
 */
export function verifyGoogleHealthWebhookToken(
  authHeader: string | null | undefined,
  expectedSecret: string
): boolean {
  if (!authHeader || !expectedSecret) return false

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim()

  if (!token || token.length !== expectedSecret.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedSecret))
  } catch {
    return false
  }
}

// ── 2. NORMALIZED TELEMETRY MODELS ────────────────────────────────────

export interface NormalizedWearableDailyMetrics {
  provider: WearableProvider
  userId: string
  date: string // YYYY-MM-DD
  restingHeartRateBpm: number
  hrvRmssdMs: number
  cnsReadinessScore: number | null
  recoveryScorePercent?: number | null
  sleep: {
    totalHours: number
    deepHours: number
    remHours: number
    coreHours: number
    awakeHours: number
    sleepEfficiencyPercent: number
    score?: number
  }
  activity?: {
    stepsCount: number
    activeEnergyBurnedKcal: number
    strainScore?: number
  }
  nutrition?: {
    caloriesConsumedKcal: number
    proteinGrams: number
    carbsGrams: number
    fatGrams: number
    fiberGrams?: number
    waterOz?: number
  }
  rawPayload: Record<string, unknown>
}

export interface NormalizedWearableWorkoutEvent {
  provider: WearableProvider
  userId: string
  externalId?: string
  activityType: string
  startTime: string
  endTime: string
  durationMins: number
  distanceKm?: number
  avgHeartRate: number
  maxHeartRate?: number
  caloriesKcal: number
  strainScore?: number
  tanakaZone?: ReturnType<typeof identifyHeartRateZone>
  notes?: string
  rawPayload: Record<string, unknown>
}

// ── 3. APPLE HEALTH NORMALIZATION ────────────────────────────────────

export function normalizeAppleHealthDailyMetrics(
  payload: RawAppleHealthIngestPayload,
  userId: string
): NormalizedWearableDailyMetrics {
  const normalized = normalizeAppleHealthIngestPayload({
    ...payload,
    user_id: userId,
  })

  const cns = computeWearableCnsScore(
    normalized.hrvRmssdMs,
    normalized.restingHeartRateBpm
  )

  return {
    provider: 'apple_health',
    userId,
    date: normalized.date,
    restingHeartRateBpm: normalized.restingHeartRateBpm,
    hrvRmssdMs: normalized.hrvRmssdMs,
    cnsReadinessScore: cns,
    recoveryScorePercent: cns,
    sleep: normalized.sleep,
    activity: {
      stepsCount: normalized.stepCount,
      activeEnergyBurnedKcal: normalized.activeEnergyBurnedKcal,
    },
    nutrition: normalized.nutrition,
    rawPayload: payload as Record<string, unknown>,
  }
}

// ── 4. GOOGLE HEALTH CONNECT NORMALIZATION ────────────────────────────

export function normalizeGoogleHealthDailyMetrics(
  payload: RawGoogleHealthIngestPayload,
  userId: string
): NormalizedWearableDailyMetrics {
  const normalized = normalizeGoogleHealthIngestPayload({
    ...payload,
    user_id: userId,
  })

  const cns = computeWearableCnsScore(
    normalized.hrvRmssdMs,
    normalized.restingHeartRateBpm
  )

  return {
    provider: 'google_fit',
    userId,
    date: normalized.date,
    restingHeartRateBpm: normalized.restingHeartRateBpm,
    hrvRmssdMs: normalized.hrvRmssdMs,
    cnsReadinessScore: cns,
    recoveryScorePercent: cns,
    sleep: normalized.sleep,
    activity: {
      stepsCount: normalized.stepCount,
      activeEnergyBurnedKcal: normalized.activeEnergyBurnedKcal,
    },
    nutrition: normalized.nutrition,
    rawPayload: payload as Record<string, unknown>,
  }
}
