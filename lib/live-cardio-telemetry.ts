/**
 * Live Cardiorespiratory & Caloric Telemetry Engine
 * 
 * Computes continuous heart rate zone intensity, %HRmax, and real-time caloric burn
 * based on NASM CPT-7 bioenergetic equations and Keytel metabolic expenditure formulas.
 */

import { calculateCardioZones, identifyHeartRateZone } from './nasm-cardio-stage-engine'

export interface LiveCalorieParams {
  bpm: number
  durationSeconds: number
  weightKg?: number
  age?: number
  gender?: 'male' | 'female' | 'other'
}

export interface LiveBioenergeticTelemetry {
  currentBpm: number
  hrPercentMax: number
  hrMaxBpm: number
  zoneCode: 'below_zone1' | 'zone1' | 'zone2' | 'zone3' | 'above_zone3'
  zoneName: string
  zoneColor: string
  zoneDescription: string
  caloriesBurned: number
  caloriesPerMinute: number
  isMedicationSuppressed?: boolean
}

/**
 * Calculates estimated caloric expenditure using Keytel HR metabolic formula
 */
export function calculateLiveCaloricBurn(params: LiveCalorieParams): {
  caloriesBurned: number
  caloriesPerMinute: number
} {
  const { bpm, durationSeconds, weightKg = 75, age = 30, gender = 'male' } = params

  if (!Number.isFinite(bpm) || !Number.isFinite(durationSeconds) || bpm <= 0 || durationSeconds <= 0) {
    return { caloriesBurned: 0, caloriesPerMinute: 0 }
  }

  const safeWeightKg = Number.isFinite(weightKg) && weightKg > 0 ? Math.min(250, weightKg) : 75
  const safeAge = Number.isFinite(age) && age > 0 ? Math.max(16, Math.min(95, age)) : 30
  const durationMinutes = durationSeconds / 60

  // Keytel equation (Joules / min converted to kcal / min)
  let calPerMin = 0
  if (gender === 'female') {
    calPerMin = ((-20.4022 + (0.4472 * bpm) - (0.1263 * safeWeightKg) + (0.074 * safeAge)) / 4.184)
  } else {
    calPerMin = ((-55.0969 + (0.6309 * bpm) + (0.1988 * safeWeightKg) + (0.2017 * safeAge)) / 4.184)
  }

  // Bound within realistic human limits (1.5 - 24 kcal/min)
  const safeCalPerMin = Math.max(1.5, Math.min(24, calPerMin))
  const totalBurned = Math.round(safeCalPerMin * durationMinutes * 10) / 10

  return {
    caloriesBurned: Math.max(0, Math.round(totalBurned)),
    caloriesPerMinute: Math.round(safeCalPerMin * 10) / 10,
  }
}

/**
 * Evaluates live cardiorespiratory telemetry including NASM zone and Tanaka %HRmax
 */
export function evaluateLiveCardioTelemetry(
  bpm: number,
  durationSeconds: number,
  options?: {
    age?: number
    weightKg?: number
    restingHr?: number
    gender?: 'male' | 'female' | 'other'
    hasHeartMedications?: boolean
  }
): LiveBioenergeticTelemetry {
  const age = options?.age !== undefined && Number.isFinite(options.age) && options.age > 0 ? options.age : 30
  const restingHr = options?.restingHr !== undefined && Number.isFinite(options.restingHr) && options.restingHr > 0 ? options.restingHr : 65
  const weightKg = options?.weightKg !== undefined && Number.isFinite(options.weightKg) && options.weightKg > 0 ? options.weightKg : 75
  const gender = options?.gender || 'male'
  const hasHeartMedications = Boolean(options?.hasHeartMedications)

  const finiteBpm = Number.isFinite(bpm) && bpm > 0 ? Math.round(bpm) : 120
  const effectiveBpm = Math.max(40, Math.min(250, finiteBpm))
  const zones = calculateCardioZones(age, restingHr, hasHeartMedications)
  const hrMax = zones.hrMaxBpm
  const hrPct = Math.round((effectiveBpm / hrMax) * 100)

  const zone = identifyHeartRateZone(effectiveBpm, age, restingHr, hasHeartMedications)
  const safeDurationSeconds = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0
  const cal = calculateLiveCaloricBurn({
    bpm: effectiveBpm,
    durationSeconds: safeDurationSeconds,
    weightKg,
    age,
    gender,
  })

  return {
    currentBpm: effectiveBpm,
    hrPercentMax: hrPct,
    hrMaxBpm: hrMax,
    zoneCode: zone.zoneCode,
    zoneName: zone.zoneName,
    zoneColor: zone.color,
    zoneDescription: zone.description,
    caloriesBurned: cal.caloriesBurned,
    caloriesPerMinute: cal.caloriesPerMinute,
    isMedicationSuppressed: zone.isMedicationSuppressed,
  }
}
