/**
 * Forge Athletic — Google Health Connect & Android Inbound Telemetry Bridge
 *
 * Standardizes inbound synchronization for Android & Wear OS devices:
 * 1. Autonomic Biometrics: Resting Heart Rate (RHR), HRV rMSSD, Respiratory Rate, VO2 Max.
 * 2. Sleep Architecture: Total Sleep, Deep Sleep, REM Sleep, Light/Core Sleep, Awake Time, Sleep Efficiency.
 * 3. Dietary Nutrition: Total Calories Consumed, Protein (g), Carbohydrates (g), Total Fat (g), Fiber (g), Hydration (oz/ml).
 * 4. Android / Wear OS Workouts: Traditional Strength Training, Running, Cycling, Rowing, Incline Walking, HIIT.
 */

export type GoogleHealthActivityType =
  | 'workout.strength_training'
  | 'workout.running'
  | 'workout.walking'
  | 'workout.cycling'
  | 'workout.rowing'
  | 'workout.stair_climbing'
  | 'workout.high_intensity_interval_training'
  | 'workout.elliptical'
  | 'workout.other'

export interface GoogleHealthDietaryRecord {
  caloriesConsumedKcal: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  fiberGrams?: number
  waterOz?: number
  loggedAt?: string
}

export interface GoogleHealthSleepAnalysis {
  totalHours: number
  deepHours: number
  remHours: number
  coreHours: number
  awakeHours: number
  sleepEfficiencyPercent: number
  bedtime?: string
  wakeTime?: string
}

export interface GoogleHealthWorkoutRecord {
  id: string
  activityType: GoogleHealthActivityType | string
  exerciseName: string
  durationMinutes: number
  activeCaloriesKcal: number
  avgHeartRateBpm?: number | null
  maxHeartRateBpm?: number | null
  distanceMiles?: number | null
  completedAt: string
}

export interface GoogleHealthBiometricsRecord {
  date: string
  restingHeartRateBpm: number
  hrvRmssdMs: number
  activeEnergyBurnedKcal: number
  stepCount: number
  distanceMiles?: number
  respiratoryRateBpm?: number
  vo2MaxMlKgMin?: number
  sleep: GoogleHealthSleepAnalysis
  nutrition: GoogleHealthDietaryRecord
  recentWorkouts: GoogleHealthWorkoutRecord[]
  syncedAt: string
}

export interface RawGoogleHealthIngestPayload {
  client_id?: string
  user_id?: string
  date?: string
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
  sleep?: Partial<GoogleHealthSleepAnalysis> & {
    total_hours?: number
    deep_hours?: number
    rem_hours?: number
    light_hours?: number
    awake_hours?: number
  }
  nutrition?: Partial<GoogleHealthDietaryRecord> & {
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
 * Resolves cardio modality string to standard Google Health activity types and caloric rates.
 */
export function resolveGoogleHealthActivityType(modality: string): {
  activityType: GoogleHealthActivityType
  exerciseName: string
  icon: string
  caloricMultiplierPerMin: number
} {
  const norm = (modality || '').toLowerCase()

  if (norm.includes('hiit') || norm.includes('tabata') || norm.includes('circuit')) {
    return {
      activityType: 'workout.high_intensity_interval_training',
      exerciseName: 'High Intensity Interval Training',
      icon: 'lightning',
      caloricMultiplierPerMin: 12.0,
    }
  }

  if (norm.includes('incline') || norm.includes('hiking') || norm.includes('12-3-30') || norm.includes('12/3/30')) {
    return {
      activityType: 'workout.walking',
      exerciseName: 'Incline Walking',
      icon: 'mountain',
      caloricMultiplierPerMin: 8.5,
    }
  }

  if (norm.includes('run') || norm.includes('treadmill') || norm.includes('sprint')) {
    return {
      activityType: 'workout.running',
      exerciseName: 'Running',
      icon: 'runner',
      caloricMultiplierPerMin: 11.5,
    }
  }

  if (norm.includes('bike') || norm.includes('cycle') || norm.includes('spin') || norm.includes('assault')) {
    return {
      activityType: 'workout.cycling',
      exerciseName: 'Cycling',
      icon: 'bike',
      caloricMultiplierPerMin: 9.8,
    }
  }

  if (norm.includes('row') || norm.includes('concept2') || norm.includes('ergometer')) {
    return {
      activityType: 'workout.rowing',
      exerciseName: 'Rowing',
      icon: 'rower',
      caloricMultiplierPerMin: 10.2,
    }
  }

  if (norm.includes('stair') || norm.includes('stepmill') || norm.includes('climber')) {
    return {
      activityType: 'workout.stair_climbing',
      exerciseName: 'Stair Climber',
      icon: 'stairs',
      caloricMultiplierPerMin: 10.0,
    }
  }

  if (norm.includes('strength') || norm.includes('lift') || norm.includes('hypertrophy') || norm.includes('weight')) {
    return {
      activityType: 'workout.strength_training',
      exerciseName: 'Traditional Strength Training',
      icon: 'dumbbell',
      caloricMultiplierPerMin: 7.0,
    }
  }

  return {
    activityType: 'workout.walking',
    exerciseName: 'Walking',
    icon: 'walker',
    caloricMultiplierPerMin: 4.8,
  }
}

/**
 * Normalizes raw Google Health ingested payloads into a typed GoogleHealthBiometricsRecord.
 */
export function normalizeGoogleHealthIngestPayload(raw: RawGoogleHealthIngestPayload): GoogleHealthBiometricsRecord {
  const now = new Date().toISOString()
  const today = raw.date || now.split('T')[0]

  const totalSleep = raw.sleep?.totalHours ?? raw.sleep?.total_hours ?? 7.8
  const deepSleep = raw.sleep?.deepHours ?? raw.sleep?.deep_hours ?? 2.0
  const remSleep = raw.sleep?.remHours ?? raw.sleep?.rem_hours ?? 1.8
  const coreSleep = raw.sleep?.coreHours ?? raw.sleep?.light_hours ?? Math.max(0, totalSleep - deepSleep - remSleep)
  const awakeHours = raw.sleep?.awakeHours ?? raw.sleep?.awake_hours ?? 0.4
  const sleepEfficiency = Math.min(100, Math.round((totalSleep / Math.max(totalSleep + awakeHours, 1)) * 100))

  const caloriesConsumed = raw.nutrition?.caloriesConsumedKcal ?? raw.nutrition?.calories ?? 2250
  const protein = raw.nutrition?.proteinGrams ?? raw.nutrition?.protein ?? 185
  const carbs = raw.nutrition?.carbsGrams ?? raw.nutrition?.carbs ?? 220
  const fat = raw.nutrition?.fatGrams ?? raw.nutrition?.fat ?? 65
  const fiber = raw.nutrition?.fiberGrams ?? raw.nutrition?.fiber ?? 32
  const waterOz = raw.nutrition?.waterOz ?? raw.nutrition?.water_oz ?? 108

  const workouts: GoogleHealthWorkoutRecord[] = (raw.workouts || []).map((w, idx) => {
    const modalityInfo = resolveGoogleHealthActivityType(w.name || w.activity_type || 'Strength Training')
    return {
      id: w.id || `gh-workout-${Date.now()}-${idx}`,
      activityType: w.activityType || w.activity_type || modalityInfo.activityType,
      exerciseName: w.name || modalityInfo.exerciseName,
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
    restingHeartRateBpm: raw.restingHeartRate ?? raw.resting_heart_rate ?? 54,
    hrvRmssdMs: raw.hrvRmssdMs ?? raw.hrv_rmssd ?? 74,
    activeEnergyBurnedKcal: raw.activeCaloriesKcal ?? raw.active_calories ?? 620,
    stepCount: raw.stepCount ?? raw.steps ?? 9400,
    distanceMiles: raw.distance_miles ?? 4.1,
    respiratoryRateBpm: raw.respiratory_rate ?? 14.0,
    vo2MaxMlKgMin: raw.vo2_max ?? 48.0,
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
 * Generates a biologically realistic and date-deterministic Google Health baseline payload.
 */
export function generateDailyGoogleHealthBaseline(
  targetDate?: string,
  baselineRhr: number = 54
): RawGoogleHealthIngestPayload {
  const dateStr = targetDate || new Date().toISOString().split('T')[0]
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i)
    hash |= 0
  }
  const variance = Math.abs(hash % 100) / 100

  const restingHeartRate = Math.round(baselineRhr + (variance * 4 - 2))
  const hrvRmssd = Math.round(74 + (variance * 14 - 6))
  const sleepTotal = Math.round((7.6 + variance * 0.8) * 10) / 10
  const sleepDeep = Math.round((1.9 + variance * 0.5) * 10) / 10
  const sleepRem = Math.round((1.7 + variance * 0.4) * 10) / 10
  const sleepLight = Math.max(0, Math.round((sleepTotal - sleepDeep - sleepRem) * 10) / 10)
  const steps = Math.round(9100 + variance * 2600)
  const activeCalories = Math.round(580 + variance * 160)

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
 * Transforms a GoogleHealthBiometricsRecord into a standardized DailyBiometricSummary.
 */
export function formatGoogleHealthTelemetryToBiometricSummary(
  record: GoogleHealthBiometricsRecord,
  cnsScore?: number | null
): {
  date: string
  provider: 'google_fit'
  restingHeartRate: number
  hrvRmssdMs: number
  cnsStressScore: number
  sleepHours: number
  deepSleepHours: number
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
    provider: 'google_fit',
    restingHeartRate: record.restingHeartRateBpm,
    hrvRmssdMs: record.hrvRmssdMs,
    cnsStressScore: calculatedCns,
    sleepHours: record.sleep.totalHours,
    deepSleepHours: record.sleep.deepHours,
    stepsCount: record.stepCount,
    activeCaloriesKcal: record.activeEnergyBurnedKcal,
    nutrition: {
      caloriesConsumedKcal: record.nutrition.caloriesConsumedKcal,
      proteinGrams: record.nutrition.proteinGrams,
      carbsGrams: record.nutrition.carbsGrams,
      fatGrams: record.nutrition.fatGrams,
      fiberGrams: record.nutrition.fiberGrams || 32,
      waterOz: record.nutrition.waterOz || 108,
    },
    updatedAt: record.syncedAt,
  }
}

