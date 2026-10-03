import { describe, it, expect, beforeEach } from 'vitest'
import {
  haversineDistance,
  isNonStationaryModality,
  formatPace,
  calculatePace,
  shouldAcceptGpsReading,
  estimateStepsFromDistance,
  checkMilestoneCrossed,
  PhysicalPedometerProcessor,
  METERS_PER_MILE,
} from './cardio-distance-tracker'

describe('Cardio Distance & Pedometer Telemetry Engine', () => {
  describe('haversineDistance', () => {
    it('returns 0 for identical coordinates', () => {
      expect(haversineDistance(40.7128, -74.006, 40.7128, -74.006)).toBe(0)
    })

    it('accurately calculates distance between known points', () => {
      // Distance between Statue of Liberty (40.6892, -74.0445) and Empire State Building (40.7484, -73.9857)
      // Approximately 8.35 km / 8350 meters
      const dist = haversineDistance(40.6892, -74.0445, 40.7484, -73.9857)
      expect(dist).toBeGreaterThan(8200)
      expect(dist).toBeLessThan(8500)
    })

    it('calculates 1 longitudinal degree along the equator to ~111.19 km', () => {
      const dist = haversineDistance(0, 0, 0, 1)
      expect(dist).toBeGreaterThan(111000)
      expect(dist).toBeLessThan(111400)
    })
  })

  describe('isNonStationaryModality', () => {
    it('identifies outdoor and free-locomotion modalities as non-stationary', () => {
      expect(isNonStationaryModality('Outdoor Run / Walk')).toBe(true)
      expect(isNonStationaryModality('Outdoor Cycling')).toBe(true)
      expect(isNonStationaryModality('Trail Running')).toBe(true)
      expect(isNonStationaryModality('Road Cycling')).toBe(true)
      expect(isNonStationaryModality('Outdoor Walk')).toBe(true)
      expect(isNonStationaryModality('Hike / Ruck')).toBe(true)
    })

    it('identifies gym and stationary equipment modalities as stationary', () => {
      expect(isNonStationaryModality('Treadmill Incline Walk')).toBe(false)
      expect(isNonStationaryModality('Stationary Bike')).toBe(false)
      expect(isNonStationaryModality('Rowing Machine')).toBe(false)
      expect(isNonStationaryModality('Concept2 Rower')).toBe(false)
      expect(isNonStationaryModality('Stairmaster')).toBe(false)
      expect(isNonStationaryModality('Assault / Air Bike')).toBe(false)
      expect(isNonStationaryModality('Elliptical')).toBe(false)
      expect(isNonStationaryModality('Ski Erg')).toBe(false)
      expect(isNonStationaryModality('Jump Rope')).toBe(false)
      expect(isNonStationaryModality('')).toBe(false)
    })
  })

  describe('calculatePace & formatPace', () => {
    it('returns placeholder pace for negligible distance or start of workout', () => {
      const pace = calculatePace(2, 1, 'mi')
      expect(pace.formattedPace).toBe('— /mi')
      expect(pace.speedMph).toBe(0)
    })

    it('calculates accurate running pace in minutes and seconds per mile', () => {
      // Exactly 1 mile in 8 minutes (480 seconds) -> 8'00" /mi, 7.5 mph
      const pace = calculatePace(METERS_PER_MILE, 480, 'mi')
      expect(pace.formattedPace).toBe('8\'00" /mi')
      expect(pace.speedMph).toBe(7.5)
    })

    it('calculates accurate kilometer pace and speed in metric mode', () => {
      // Exactly 1000m in 5 minutes (300 seconds) -> 5'00" /km, 12.0 km/h
      const pace = calculatePace(1000, 300, 'km')
      expect(pace.formattedPace).toBe('5\'00" /km')
      expect(pace.speedKmh).toBe(12.0)
    })

    it('formats pace correctly with zero padding', () => {
      expect(formatPace(522, 'mi')).toBe('8\'42" /mi')
      expect(formatPace(305, 'km')).toBe('5\'05" /km')
      expect(formatPace(0, 'mi')).toBe('— /mi')
      expect(formatPace(9999, 'mi')).toBe('— /mi')
    })
  })

  describe('shouldAcceptGpsReading Filter', () => {
    it('accepts initial point with good accuracy', () => {
      const p1 = { latitude: 40.71, longitude: -74.0, accuracy: 8, timestamp: 1000 }
      const res = shouldAcceptGpsReading(p1, null)
      expect(res.accept).toBe(true)
    })

    it('rejects points with poor GPS accuracy above threshold (> 32m)', () => {
      const p = { latitude: 40.71, longitude: -74.0, accuracy: 45, timestamp: 1000 }
      const res = shouldAcceptGpsReading(p, null)
      expect(res.accept).toBe(false)
      expect(res.reason).toContain('accuracy_too_low')
    })

    it('rejects stationary micro-jitter below deadband threshold (< 2.5m)', () => {
      const p1 = { latitude: 40.71, longitude: -74.0, accuracy: 5, timestamp: 1000 }
      // Jitter movement of ~0.5 meters
      const p2 = { latitude: 40.710004, longitude: -74.0, accuracy: 5, timestamp: 3000 }
      const res = shouldAcceptGpsReading(p2, p1)
      expect(res.accept).toBe(false)
      expect(res.reason).toContain('stationary_drift')
    })

    it('rejects teleportation glitches exceeding human sprint/locomotion threshold', () => {
      const p1 = { latitude: 40.71, longitude: -74.0, accuracy: 5, timestamp: 1000 }
      // Teleportation of ~1 km in 2 seconds
      const p2 = { latitude: 40.72, longitude: -74.0, accuracy: 5, timestamp: 3000 }
      const res = shouldAcceptGpsReading(p2, p1)
      expect(res.accept).toBe(false)
      expect(res.reason).toContain('speed_exceeds_threshold')
    })

    it('accepts valid human locomotion movement', () => {
      const p1 = { latitude: 40.71, longitude: -74.0, accuracy: 5, timestamp: 1000 }
      // Movement of ~15 meters in 3 seconds (5 m/s = 11 mph)
      const p2 = { latitude: 40.710135, longitude: -74.0, accuracy: 5, timestamp: 4000 }
      const res = shouldAcceptGpsReading(p2, p1)
      expect(res.accept).toBe(true)
    })
  })

  describe('estimateStepsFromDistance', () => {
    it('calculates realistic walking steps for standard adult height (175cm)', () => {
      // 1 mile (1609m) walking: ~2,216 steps
      const steps = estimateStepsFromDistance(METERS_PER_MILE, false, 175)
      expect(steps).toBeGreaterThan(2000)
      expect(steps).toBeLessThan(2400)
    })

    it('calculates realistic running steps with extended stride length', () => {
      // 1 mile (1609m) running: ~1,735 steps
      const steps = estimateStepsFromDistance(METERS_PER_MILE, true, 175)
      expect(steps).toBeGreaterThan(1500)
      expect(steps).toBeLessThan(1900)
    })

    it('returns 0 steps for 0 distance', () => {
      expect(estimateStepsFromDistance(0)).toBe(0)
    })
  })

  describe('checkMilestoneCrossed', () => {
    it('detects when distance crosses the 1st mile threshold', () => {
      const crossed = checkMilestoneCrossed(1500, 1620, 'mi')
      expect(crossed).toBe(1)
    })

    it('returns null when still within the same mile split', () => {
      const crossed = checkMilestoneCrossed(1650, 1800, 'mi')
      expect(crossed).toBeNull()
    })

    it('detects when distance crosses the 2nd mile threshold', () => {
      const crossed = checkMilestoneCrossed(3200, 3230, 'mi')
      expect(crossed).toBe(2)
    })

    it('detects kilometer milestones in metric mode', () => {
      expect(checkMilestoneCrossed(950, 1050, 'km')).toBe(1)
      expect(checkMilestoneCrossed(1050, 1150, 'km')).toBeNull()
      expect(checkMilestoneCrossed(1980, 2020, 'km')).toBe(2)
    })
  })

  describe('PhysicalPedometerProcessor', () => {
    let pedometer: PhysicalPedometerProcessor

    beforeEach(() => {
      pedometer = new PhysicalPedometerProcessor()
    })

    it('initializes with 0 steps and 0 cadence', () => {
      expect(pedometer.getSteps()).toBe(0)
      expect(pedometer.getCadenceSpm()).toBe(0)
    })

    it('does not increment step count on sub-threshold ambient movements', () => {
      // Gentle noise (gravity only)
      const res = pedometer.processMotionEvent(0, 0, 9.8, 1000)
      expect(res.stepDetected).toBe(false)
      expect(res.totalSteps).toBe(0)
    })

    it('detects rhythmic footstep acceleration impulses spaced by 350ms', () => {
      let t = 1000
      let stepsDetected = 0

      for (let i = 0; i < 5; i++) {
        // Step strike impact (spike above gravity)
        const hit = pedometer.processMotionEvent(1.5, 2.5, 12.5, t)
        if (hit.stepDetected) stepsDetected++

        // Recovery valley
        pedometer.processMotionEvent(0.1, 0.1, 9.8, t + 150)
        t += 350
      }

      expect(stepsDetected).toBeGreaterThanOrEqual(4)
      expect(pedometer.getSteps()).toBe(stepsDetected)
      expect(pedometer.getCadenceSpm(t)).toBeGreaterThan(140)
      expect(pedometer.getCadenceSpm(t)).toBeLessThan(200)
    })

    it('refractory debounce rejects rapid vibrations inside 240ms lockout window', () => {
      const t = 1000
      // First step impulse
      const first = pedometer.processMotionEvent(2.0, 2.0, 14.0, t)
      expect(first.stepDetected).toBe(true)

      // Sub-100ms rebound vibration
      const rebound = pedometer.processMotionEvent(2.0, 2.0, 14.0, t + 80)
      expect(rebound.stepDetected).toBe(false)
      expect(pedometer.getSteps()).toBe(1)
    })
  })
})

