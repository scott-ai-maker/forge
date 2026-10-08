/**
 * Forge Athletic — Cardio Distance, Pace & Inertial Pedometer Engine
 * 
 * Delivers precision telemetry for non-stationary cardio (outdoor run, walk, cycling, trail):
 * - Geodesic Haversine spherical distance calculation
 * - Noise, jitter, and drift suppression (accuracy bounding, deadband, teleport filtering)
 * - Rolling window and split pace mathematics (miles and kilometers)
 * - Inertial device accelerometer step counter (DeviceMotionEvent) with dynamic peak detection
 * - Biomechanical stride-model fallback for steps when physical sensors are restricted
 * - Live step cadence tracking (Steps Per Minute - SPM)
 */

export interface GpsPoint {
  latitude: number
  longitude: number
  altitude?: number | null
  accuracy: number
  speed?: number | null
  timestamp: number
}

export interface CardioDistanceSplit {
  splitNumber: number
  splitType: 'mile' | 'km'
  splitDistanceMeters: number
  splitTimeSeconds: number
  splitPaceSeconds: number
  formattedPace: string
  accumulatedTimeSeconds: number
}

export interface PaceCalculation {
  paceSeconds: number
  formattedPace: string
  speedMph: number
  speedKmh: number
}

export interface DistanceFilterOptions {
  maxAccuracyMeters?: number
  minMovementMeters?: number
  maxSpeedMps?: number
}

export interface DistanceTrackerState {
  isTracking: boolean
  status: 'idle' | 'requesting' | 'acquiring' | 'locked' | 'paused' | 'error'
  gpsAccuracy: number | null
  distanceMeters: number
  distanceMiles: number
  distanceKm: number
  currentPaceFormatted: string
  averagePaceFormatted: string
  currentSpeedMph: number
  currentSpeedKmh: number
  stepCount: number
  stepCadenceSpm: number
  stepSource: 'sensor' | 'gps_estimated' | 'idle'
  splits: CardioDistanceSplit[]
  unit: 'mi' | 'km'
  errorMessage: string | null
}

export const METERS_PER_MILE = 1609.344
export const EARTH_RADIUS_METERS = 6371000

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)))
  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100
}

/**
 * Identifies whether a given exercise modality is non-stationary (free locomotion through space)
 * or performed on a stationary piece of equipment.
 */
export function isNonStationaryModality(modality: string): boolean {
  if (!modality) return false
  const norm = modality.toLowerCase().trim()

  // Explicit stationary equipment rules
  if (
    norm.includes('treadmill') ||
    norm.includes('stationary') ||
    norm.includes('rower') ||
    norm.includes('rowing') ||
    norm.includes('stairmaster') ||
    norm.includes('assault') ||
    norm.includes('air bike') ||
    norm.includes('elliptical') ||
    norm.includes('ski erg') ||
    norm.includes('jump rope') ||
    norm.includes('spin bike') ||
    norm.includes('indoor')
  ) {
    return false
  }

  // Non-stationary locomotion keywords
  if (
    norm.includes('outdoor') ||
    norm.includes('run') ||
    norm.includes('walk') ||
    norm.includes('cycl') ||
    norm.includes('bike') ||
    norm.includes('jog') ||
    norm.includes('trail') ||
    norm.includes('hike') ||
    norm.includes('ruck')
  ) {
    return true
  }

  return false
}

/**
 * Formats a duration in seconds into MM'SS" pace notation.
 */
export function formatPace(secondsPerUnit: number, unit: 'mi' | 'km'): string {
  if (!Number.isFinite(secondsPerUnit) || secondsPerUnit <= 0 || secondsPerUnit > 3600) {
    return `— /${unit}`
  }

  const mins = Math.floor(secondsPerUnit / 60)
  const secs = Math.floor(secondsPerUnit % 60)
  return `${mins}'${secs.toString().padStart(2, '0')}" /${unit}`
}

/**
 * Calculates current or average pace and speed from distance in meters and elapsed time in seconds.
 */
export function calculatePace(
  distanceMeters: number,
  elapsedSeconds: number,
  unit: 'mi' | 'km' = 'mi'
): PaceCalculation {
  if (distanceMeters <= 5 || elapsedSeconds <= 2) {
    return {
      paceSeconds: 0,
      formattedPace: `— /${unit}`,
      speedMph: 0,
      speedKmh: 0,
    }
  }

  const distanceInUnits = unit === 'mi' ? distanceMeters / METERS_PER_MILE : distanceMeters / 1000
  const speedMps = distanceMeters / elapsedSeconds
  const speedMph = Math.round(speedMps * 2.23694 * 10) / 10
  const speedKmh = Math.round(speedMps * 3.6 * 10) / 10

  const paceSeconds = Math.round(elapsedSeconds / Math.max(0.0001, distanceInUnits))
  const formattedPace = formatPace(paceSeconds, unit)

  return {
    paceSeconds,
    formattedPace,
    speedMph,
    speedKmh,
  }
}

/**
 * Quality filter for raw GPS samples to suppress noise, jitter, and multipath drift.
 */
export function shouldAcceptGpsReading(
  newPoint: GpsPoint,
  prevPoint: GpsPoint | null,
  options?: DistanceFilterOptions
): { accept: boolean; reason?: string } {
  const maxAccuracy = options?.maxAccuracyMeters ?? 32
  const minMovement = options?.minMovementMeters ?? 2.5
  const maxSpeedMps = options?.maxSpeedMps ?? 22.0 // ~49 mph / 79 km/h

  // 1. Accuracy ceiling check
  if (newPoint.accuracy > maxAccuracy) {
    return { accept: false, reason: `accuracy_too_low (${Math.round(newPoint.accuracy)}m > ${maxAccuracy}m)` }
  }

  // First valid point is accepted as anchor
  if (!prevPoint) {
    return { accept: true }
  }

  const dtSeconds = (newPoint.timestamp - prevPoint.timestamp) / 1000
  if (dtSeconds <= 0) {
    return { accept: false, reason: 'zero_or_negative_time_delta' }
  }

  const distMeters = haversineDistance(
    prevPoint.latitude,
    prevPoint.longitude,
    newPoint.latitude,
    newPoint.longitude
  )

  // 2. Stationary micro-jitter deadband: If movement is tiny, reject
  if (distMeters < minMovement) {
    return { accept: false, reason: `stationary_drift (${distMeters.toFixed(1)}m < ${minMovement}m)` }
  }

  // 3. Reject movement smaller than a proportion of current GPS inaccuracy
  if (distMeters < newPoint.accuracy * 0.35 && distMeters < 5.0) {
    return { accept: false, reason: 'within_inaccuracy_envelope' }
  }

  // 4. Teleportation / speed sanity limit
  const speedMps = distMeters / dtSeconds
  if (speedMps > maxSpeedMps) {
    return { accept: false, reason: `speed_exceeds_threshold (${Math.round(speedMps * 2.24)} mph)` }
  }

  return { accept: true }
}

/**
 * Estimates footstep count from distance using human biomechanical stride length models.
 */
export function estimateStepsFromDistance(
  distanceMeters: number,
  isRunning: boolean = false,
  athleteHeightCm: number = 175
): number {
  if (distanceMeters <= 0) return 0
  const heightM = Math.max(1.4, Math.min(2.1, athleteHeightCm / 100))
  // Stride ratio: walking ~0.415 * height, running ~0.53 * height
  const strideLengthM = isRunning ? heightM * 0.53 : heightM * 0.415
  return Math.round(distanceMeters / Math.max(0.5, strideLengthM))
}

/**
 * Pure helper to compute milestone split index (e.g. 1st mile, 2nd mile).
 */
export function checkMilestoneCrossed(
  prevDistanceMeters: number,
  newDistanceMeters: number,
  unit: 'mi' | 'km'
): number | null {
  const stepMeters = unit === 'mi' ? METERS_PER_MILE : 1000
  const prevCount = Math.floor(prevDistanceMeters / stepMeters)
  const newCount = Math.floor(newDistanceMeters / stepMeters)

  if (newCount > prevCount && newCount > 0) {
    return newCount
  }
  return null
}

/**
 * Physical Inertial Pedometer Processor
 * Filters DeviceMotionEvent acceleration, strips gravity, and detects footsteps via peak detection.
 */
export class PhysicalPedometerProcessor {
  private stepCount: number = 0
  private recentStepTimestamps: number[] = []
  private gravity = { x: 0, y: 0, z: 9.8 }
  private lastStepTimestamp: number = 0
  private isAboveThreshold: boolean = false
  private minInterStepMs: number = 240 // Max 250 SPM
  private threshold: number = 1.35 // m/s² above baseline gravity

  public reset(): void {
    this.stepCount = 0
    this.recentStepTimestamps = []
    this.gravity = { x: 0, y: 0, z: 9.8 }
    this.lastStepTimestamp = 0
    this.isAboveThreshold = false
  }

  public getSteps(): number {
    return this.stepCount
  }

  public getCadenceSpm(now: number = Date.now()): number {
    // Purge timestamps older than 10 seconds
    const cutoff = now - 10000
    this.recentStepTimestamps = this.recentStepTimestamps.filter(t => t >= cutoff)

    if (this.recentStepTimestamps.length < 2) return 0

    const windowSeconds = Math.max(1, (now - this.recentStepTimestamps[0]) / 1000)
    const spm = Math.round((this.recentStepTimestamps.length / windowSeconds) * 60)
    return Math.min(240, Math.max(0, spm))
  }

  public processMotionEvent(
    ax: number,
    ay: number,
    az: number,
    timestamp: number = Date.now()
  ): { stepDetected: boolean; totalSteps: number; cadenceSpm: number } {
    // High-pass filter to strip static gravity vector (alpha ~0.95 preserves step transients while tracking orientation)
    const alpha = 0.95
    this.gravity.x = alpha * this.gravity.x + (1 - alpha) * ax
    this.gravity.y = alpha * this.gravity.y + (1 - alpha) * ay
    this.gravity.z = alpha * this.gravity.z + (1 - alpha) * az

    const linearX = ax - this.gravity.x
    const linearY = ay - this.gravity.y
    const linearZ = az - this.gravity.z

    const magnitude = Math.sqrt(linearX * linearX + linearY * linearY + linearZ * linearZ)

    let stepDetected = false

    // Peak threshold detection with refractory lockout window
    if (magnitude > this.threshold && !this.isAboveThreshold) {
      const timeSinceLast = timestamp - this.lastStepTimestamp
      if (timeSinceLast >= this.minInterStepMs) {
        this.stepCount++
        this.lastStepTimestamp = timestamp
        this.recentStepTimestamps.push(timestamp)
        stepDetected = true
      }
      this.isAboveThreshold = true
    } else if (magnitude < this.threshold * 0.6) {
      this.isAboveThreshold = false
    }

    return {
      stepDetected,
      totalSteps: this.stepCount,
      cadenceSpm: this.getCadenceSpm(timestamp),
    }
  }
}
