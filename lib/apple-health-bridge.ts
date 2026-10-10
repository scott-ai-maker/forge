/**
 * Forge Athletic — Apple Health & Wearables Inbound Telemetry Bridge
 * 
 * Standardizes inbound synchronization for:
 * 1. Autonomic Biometrics: Resting Heart Rate (RHR), HRV rMSSD, Respiratory Rate, SpO2, VO2 Max.
 * 2. Sleep Architecture: Total Sleep, Deep Sleep, REM Sleep, Core/Light Sleep, Sleep Efficiency.
 * 3. Dietary Nutrition: Total Calories Consumed, Protein (g), Carbohydrates (g), Total Fat (g), Fiber (g), Hydration (oz/ml).
 * 4. Apple Watch Workouts: Strength Sessions, Outdoor/Treadmill Running, Incline Walking, HIIT, Cycling, Rowing.
 */

export type HKWorkoutActivityType =
  | 'HKWorkoutActivityTypePreparationAndRecovery'
  | 'HKWorkoutActivityTypeTraditionalStrengthTraining'
  | 'HKWorkoutActivityTypeFunctionalStrengthTraining'
  | 'HKWorkoutActivityTypeWalking'
  | 'HKWorkoutActivityTypeHiking'
  | 'HKWorkoutActivityTypeRunning'
  | 'HKWorkoutActivityTypeCycling'
  | 'HKWorkoutActivityTypeRowing'
  | 'HKWorkoutActivityTypeStairs'
  | 'HKWorkoutActivityTypeHighIntensityIntervalTraining'
  | 'HKWorkoutActivityTypeElliptical'
  | 'HKWorkoutActivityTypeCrossTraining'
  | 'HKWorkoutActivityTypeCooldown'
  | 'HKWorkoutActivityTypeFlexibility'

export interface AppleHealthDietaryRecord {
  caloriesConsumedKcal: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  fiberGrams?: number
  waterOz?: number
  loggedAt?: string
}

export interface AppleHealthSleepAnalysis {
  totalHours: number
  deepHours: number
  remHours: number
  coreHours: number
  awakeHours: number
  sleepEfficiencyPercent: number
  bedtime?: string
  wakeTime?: string
}

export interface AppleHealthWorkoutRecord {
  id: string
  activityType: HKWorkoutActivityType | string
  appleExerciseName: string
  durationMinutes: number
  activeCaloriesKcal: number
  avgHeartRateBpm?: number | null
  maxHeartRateBpm?: number | null
  distanceMiles?: number | null
  completedAt: string
}

export interface AppleHealthBiometricsRecord {
  date: string
  currentHeartRateBpm?: number | null
  restingHeartRateBpm: number
  hrvRmssdMs: number
  activeEnergyBurnedKcal: number
  basalEnergyBurnedKcal?: number
  stepCount: number
  walkingRunningDistanceMiles?: number
  respiratoryRateBpm?: number
  vo2MaxMlKgMin?: number
  oxygenSaturationPercent?: number
  sleep: AppleHealthSleepAnalysis
  nutrition: AppleHealthDietaryRecord
  recentWorkouts: AppleHealthWorkoutRecord[]
  syncedAt: string
}

export interface RawAppleHealthIngestPayload {
  client_id?: string
  user_id?: string
  date?: string
  heart_rate?: number
  heartRate?: number
  current_heart_rate?: number
  currentHeartRate?: number
  resting_heart_rate?: number
  restingHeartRate?: number
  hrv_rmssd?: number
  hrvRmssdMs?: number
  active_calories?: number
  activeCaloriesKcal?: number
  steps?: number
  stepCount?: number
  distance_miles?: number
  respiratory_rate?: number
  vo2_max?: number
  water_oz?: number
  waterOz?: number
  sleep?: Partial<AppleHealthSleepAnalysis> & {
    total_hours?: number
    deep_hours?: number
    rem_hours?: number
    light_hours?: number
    awake_hours?: number
    bedtime?: string
    wakeTime?: string
  }
  nutrition?: Partial<AppleHealthDietaryRecord> & {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    water_oz?: number
  }
  workouts?: Array<{
    id?: string
    activity_type?: string
    activityType?: string
    name?: string
    duration_mins?: number
    durationMinutes?: number
    calories?: number
    activeCaloriesKcal?: number
    avg_hr?: number
    max_hr?: number
    distance_miles?: number
    completed_at?: string
  }>
}

/**
 * Resolves cardio modality string to standard Apple Health activity types and caloric rates.
 */
export function resolveAppleCardioActivityType(modality: string): {
  activityType: HKWorkoutActivityType
  appleExerciseName: string
  icon: string
  caloricMultiplierPerMin: number
} {
  const norm = (modality || '').toLowerCase()

  if (norm.includes('hiit') || norm.includes('tabata') || norm.includes('circuit')) {
    return {
      activityType: 'HKWorkoutActivityTypeHighIntensityIntervalTraining',
      appleExerciseName: 'High Intensity Interval Training',
      icon: 'lightning',
      caloricMultiplierPerMin: 12.0,
    }
  }

  if (norm.includes('incline') || norm.includes('hiking') || norm.includes('12-3-30') || norm.includes('12/3/30')) {
    return {
      activityType: 'HKWorkoutActivityTypeWalking',
      appleExerciseName: 'Incline Walking',
      icon: 'mountain',
      caloricMultiplierPerMin: 8.5,
    }
  }

  if (norm.includes('run') || norm.includes('treadmill') || norm.includes('sprint')) {
    return {
      activityType: 'HKWorkoutActivityTypeRunning',
      appleExerciseName: 'Running',
      icon: 'runner',
      caloricMultiplierPerMin: 11.5,
    }
  }

  if (norm.includes('bike') || norm.includes('cycle') || norm.includes('spin') || norm.includes('assault')) {
    return {
      activityType: 'HKWorkoutActivityTypeCycling',
      appleExerciseName: 'Cycling',
      icon: 'bike',
      caloricMultiplierPerMin: 9.8,
    }
  }

  if (norm.includes('row') || norm.includes('concept2') || norm.includes('ergometer')) {
    return {
      activityType: 'HKWorkoutActivityTypeRowing',
      appleExerciseName: 'Rowing',
      icon: 'rower',
      caloricMultiplierPerMin: 10.2,
    }
  }

  if (norm.includes('stair') || norm.includes('stepmill') || norm.includes('climber')) {
    return {
      activityType: 'HKWorkoutActivityTypeStairs',
      appleExerciseName: 'Stair Climber',
      icon: 'stairs',
      caloricMultiplierPerMin: 10.0,
    }
  }

  return {
    activityType: 'HKWorkoutActivityTypeWalking',
    appleExerciseName: 'Walking',
    icon: 'walker',
    caloricMultiplierPerMin: 4.8,
  }
}

/**
 * Normalizes raw Apple Health ingested payloads into a typed AppleHealthBiometricsRecord.
 */
export function normalizeAppleHealthIngestPayload(raw: RawAppleHealthIngestPayload): AppleHealthBiometricsRecord {
  const now = new Date().toISOString()
  const today = raw.date || now.split('T')[0]

  const totalSleep = raw.sleep?.totalHours ?? raw.sleep?.total_hours ?? 7.8
  const deepSleep = raw.sleep?.deepHours ?? raw.sleep?.deep_hours ?? 2.1
  const remSleep = raw.sleep?.remHours ?? raw.sleep?.rem_hours ?? 1.9
  const coreSleep = raw.sleep?.coreHours ?? raw.sleep?.light_hours ?? Math.max(0, totalSleep - deepSleep - remSleep)
  const awakeHours = raw.sleep?.awakeHours ?? raw.sleep?.awake_hours ?? 0.4
  const sleepEfficiency = Math.min(100, Math.round((totalSleep / Math.max(totalSleep + awakeHours, 1)) * 100))

  const caloriesConsumed = raw.nutrition?.caloriesConsumedKcal ?? raw.nutrition?.calories ?? 2250
  const protein = raw.nutrition?.proteinGrams ?? raw.nutrition?.protein ?? 185
  const carbs = raw.nutrition?.carbsGrams ?? raw.nutrition?.carbs ?? 220
  const fat = raw.nutrition?.fatGrams ?? raw.nutrition?.fat ?? 65
  const fiber = raw.nutrition?.fiberGrams ?? raw.nutrition?.fiber ?? 32
  const waterOz = raw.waterOz ?? raw.water_oz ?? raw.nutrition?.waterOz ?? raw.nutrition?.water_oz ?? (raw.nutrition ? 0 : 108)

  const workouts: AppleHealthWorkoutRecord[] = (raw.workouts || []).map((w, idx) => {
    const modalityInfo = resolveAppleCardioActivityType(w.name || w.activity_type || 'Strength Training')
    return {
      id: w.id || `ah-workout-${Date.now()}-${idx}`,
      activityType: w.activityType || w.activity_type || modalityInfo.activityType,
      appleExerciseName: w.name || modalityInfo.appleExerciseName,
      durationMinutes: w.durationMinutes ?? w.duration_mins ?? 45,
      activeCaloriesKcal: w.activeCaloriesKcal ?? w.calories ?? 380,
      avgHeartRateBpm: w.avg_hr ?? null,
      maxHeartRateBpm: w.max_hr ?? null,
      distanceMiles: w.distance_miles ?? null,
      completedAt: w.completed_at || now,
    }
  })

  return {
    date: today,
    currentHeartRateBpm: raw.currentHeartRate ?? raw.current_heart_rate ?? raw.heartRate ?? raw.heart_rate ?? null,
    restingHeartRateBpm: raw.restingHeartRate ?? raw.resting_heart_rate ?? 54,
    hrvRmssdMs: raw.hrvRmssdMs ?? raw.hrv_rmssd ?? 76,
    activeEnergyBurnedKcal: raw.activeCaloriesKcal ?? raw.active_calories ?? (raw as Record<string, unknown>)?.active_energy_burned_kcal as number | undefined ?? 620,
    stepCount: raw.stepCount ?? raw.steps ?? (raw as Record<string, unknown>)?.step_count as number | undefined ?? 9420,
    walkingRunningDistanceMiles: raw.distance_miles ?? 4.2,
    respiratoryRateBpm: raw.respiratory_rate ?? 14.2,
    vo2MaxMlKgMin: raw.vo2_max ?? 48.5,
    sleep: {
      totalHours: totalSleep,
      deepHours: deepSleep,
      remHours: remSleep,
      coreHours: coreSleep,
      awakeHours: awakeHours,
      sleepEfficiencyPercent: sleepEfficiency,
      bedtime: raw.sleep?.bedtime || '23:00',
      wakeTime: raw.sleep?.wakeTime || '06:45',
    },
    nutrition: {
      caloriesConsumedKcal: caloriesConsumed,
      proteinGrams: protein,
      carbsGrams: carbs,
      fatGrams: fat,
      fiberGrams: fiber,
      waterOz: waterOz,
      loggedAt: raw.nutrition?.loggedAt || now,
    },
    recentWorkouts: workouts,
    syncedAt: now,
  }
}

/**
 * Generates a biologically realistic and date-deterministic Apple Health baseline payload.
 */
export function generateDailyAppleHealthBaseline(
  targetDate?: string,
  baselineRhr: number = 54
): RawAppleHealthIngestPayload {
  const dateStr = targetDate || new Date().toISOString().split('T')[0]
  // Create deterministic variance from date string chars
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i)
    hash |= 0
  }
  const variance = Math.abs(hash % 100) / 100 // 0.00 to 0.99

  const restingHeartRate = Math.round(baselineRhr + (variance * 4 - 2))
  const hrvRmssd = Math.round(76 + (variance * 14 - 6))
  const sleepTotal = Math.round((7.5 + variance * 0.9) * 10) / 10
  const sleepDeep = Math.round((2.0 + variance * 0.5) * 10) / 10
  const sleepRem = Math.round((1.8 + variance * 0.4) * 10) / 10
  const sleepLight = Math.max(0, Math.round((sleepTotal - sleepDeep - sleepRem) * 10) / 10)
  const steps = Math.round(9200 + variance * 2800)
  const activeCalories = Math.round(590 + variance * 160)

  const calories = Math.round(2180 + variance * 240)
  const protein = Math.round(180 + variance * 20)
  const carbs = Math.round(215 + variance * 30)
  const fat = Math.round(60 + variance * 10)
  const fiber = Math.round(32 + variance * 8)
  const waterOz = Math.round(105 + variance * 25)

  return {
    date: dateStr,
    resting_heart_rate: restingHeartRate,
    hrv_rmssd: hrvRmssd,
    active_calories: activeCalories,
    steps,
    sleep: {
      total_hours: sleepTotal,
      deep_hours: sleepDeep,
      rem_hours: sleepRem,
      light_hours: sleepLight,
      awake_hours: 0.3,
      bedtime: '22:45',
      wakeTime: '06:30',
    },
    nutrition: {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      water_oz: waterOz,
    },
  }
}

/**
 * Transforms an AppleHealthBiometricsRecord into a standardized DailyBiometricSummary
 * consumable across all application feature modules.
 */
export function formatAppleHealthTelemetryToBiometricSummary(
  record: AppleHealthBiometricsRecord,
  cnsScore?: number | null
): {
  date: string
  provider: 'apple_health'
  currentHeartRate?: number | null
  restingHeartRate: number
  hrvRmssdMs: number
  cnsStressScore: number
  sleepHours: number
  deepSleepHours: number
  bedtime?: string | null
  wakeTime?: string | null
  stepsCount: number
  activeCaloriesKcal: number
  nutrition: {
    caloriesConsumedKcal: number
    proteinGrams: number
    carbsGrams: number
    fatGrams: number
    fiberGrams: number
    waterOz: number
  }
  updatedAt: string
} {
  const calculatedCns =
    typeof cnsScore === 'number' && Number.isFinite(cnsScore)
      ? cnsScore
      : Math.min(100, Math.max(20, Math.round((record.hrvRmssdMs / 100) * 50 + (60 - record.restingHeartRateBpm) * 0.5 + (record.sleep.totalHours / 8) * 30)))

  return {
    date: record.date,
    provider: 'apple_health',
    currentHeartRate: record.currentHeartRateBpm ?? null,
    restingHeartRate: record.restingHeartRateBpm,
    hrvRmssdMs: record.hrvRmssdMs,
    cnsStressScore: calculatedCns,
    sleepHours: record.sleep.totalHours,
    deepSleepHours: record.sleep.deepHours,
    bedtime: record.sleep.bedtime || null,
    wakeTime: record.sleep.wakeTime || null,
    stepsCount: record.stepCount,
    activeCaloriesKcal: record.activeEnergyBurnedKcal,
    nutrition: {
      caloriesConsumedKcal: record.nutrition.caloriesConsumedKcal,
      proteinGrams: record.nutrition.proteinGrams,
      carbsGrams: record.nutrition.carbsGrams,
      fatGrams: record.nutrition.fatGrams,
      fiberGrams: record.nutrition.fiberGrams ?? 32,
      waterOz: record.nutrition.waterOz ?? 0,
    },
    updatedAt: record.syncedAt,
  }
}
