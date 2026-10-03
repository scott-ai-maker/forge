/**
 * Live Cardiorespiratory & Caloric Telemetry Engine
 * 
 * Computes continuous heart rate zone intensity, %HRmax, and real-time caloric burn
 * based on NASM CPT-7 bioenergetic equations and Keytel metabolic expenditure formulas.
 */

import { identifyHeartRateZone } from './nasm-cardio-stage-engine'

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
}

/**
 * Calculates estimated caloric expenditure using Keytel HR metabolic formula
 */
export function calculateLiveCaloricBurn(params: LiveCalorieParams): {
  caloriesBurned: number
  caloriesPerMinute: number
} {
  const { bpm, durationSeconds, weightKg = 75, age = 30, gender = 'male' } = params

  if (bpm <= 0 || durationSeconds <= 0) {
    return { caloriesBurned: 0, caloriesPerMinute: 0 }
  }

  const durationMinutes = durationSeconds / 60

  // Keytel equation (Joules / min converted to kcal / min)
  let calPerMin = 0
  if (gender === 'female') {
    calPerMin = ((-20.4022 + (0.4472 * bpm) - (0.1263 * weightKg) + (0.074 * age)) / 4.184)
  } else {
    calPerMin = ((-55.0969 + (0.6309 * bpm) + (0.1988 * weightKg) + (0.2017 * age)) / 4.184)
  }

  // Bound within realistic human limits (2 - 22 kcal/min)
  const safeCalPerMin = Math.max(1.5, Math.min(24, calPerMin))
  const totalBurned = Math.round(safeCalPerMin * durationMinutes * 10) / 10

  return {
    caloriesBurned: Math.max(0, Math.round(totalBurned)),
    caloriesPerMinute: Math.round(safeCalPerMin * 10) / 10,
  }
}

/**
 * Evaluates live cardiorespiratory telemetry including NASM zone and %HRmax
 */
export function evaluateLiveCardioTelemetry(
  bpm: number,
  durationSeconds: number,
  options?: {
    age?: number
    weightKg?: number
    restingHr?: number
    gender?: 'male' | 'female' | 'other'
  }
): LiveBioenergeticTelemetry {
  const age = options?.age && options.age > 0 ? options.age : 30
  const restingHr = options?.restingHr && options.restingHr > 0 ? options.restingHr : 65
  const weightKg = options?.weightKg && options.weightKg > 0 ? options.weightKg : 75
  const gender = options?.gender || 'male'

  const effectiveBpm = Math.max(40, bpm || 120)
  const hrMax = Math.max(140, 220 - age)
  const hrPct = Math.round((effectiveBpm / hrMax) * 100)

  const zone = identifyHeartRateZone(effectiveBpm, age, restingHr)
  const cal = calculateLiveCaloricBurn({
    bpm: effectiveBpm,
    durationSeconds,
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
  }
}
