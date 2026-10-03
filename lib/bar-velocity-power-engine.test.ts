import { describe, it, expect } from 'vitest'
import {
  resolveExerciseRomMeters,
  classifyVbtZone,
  calculateRepVelocityAndPower,
  analyzeSetVelocityAndPower,
  getHammerCurlGuardrailGuidance,
} from './bar-velocity-power-engine'

describe('Bar Velocity & Kinetic Power Output Engine', () => {
  it('correctly models vertical Range of Motion (ROM) per exercise kinematics', () => {
    expect(resolveExerciseRomMeters('Barbell Back Squat')).toBe(0.60)
    expect(resolveExerciseRomMeters('Romanian Deadlift (RDL)')).toBe(0.55)
    expect(resolveExerciseRomMeters('Barbell Bench Press')).toBe(0.38)
    expect(resolveExerciseRomMeters('Standing Overhead Press')).toBe(0.50)
    expect(resolveExerciseRomMeters('Dumbbell Hammer Curl')).toBe(0.34)
    expect(resolveExerciseRomMeters('Unknown Movement')).toBe(0.40)
  })

  it('classifies VBT velocity zones accurately across the force-velocity curve', () => {
    const speed = classifyVbtZone(1.15)
    expect(speed.zone).toBe('speed')
    expect(speed.label).toContain('Speed')

    const speedStrength = classifyVbtZone(0.85)
    expect(speedStrength.zone).toBe('speed_strength')
    expect(speedStrength.label).toBe('Speed-Strength')

    const strengthSpeed = classifyVbtZone(0.62)
    expect(strengthSpeed.zone).toBe('strength_speed')
    expect(strengthSpeed.label).toBe('Strength-Speed')

    const accelerative = classifyVbtZone(0.42)
    expect(accelerative.zone).toBe('accelerative_strength')
    expect(accelerative.label).toBe('Accelerative Strength')

    const grinding = classifyVbtZone(0.28)
    expect(grinding.zone).toBe('absolute_strength')
    expect(grinding.label).toContain('Absolute')
  })

  it('computes accurate mechanical force, work (Joules), and kinetic power (Watts)', () => {
    // 100 kg Bench Press with 0.76s concentric phase (ROM 0.38m) -> v = 0.50 m/s
    const rep = calculateRepVelocityAndPower({
      exerciseName: 'Barbell Bench Press',
      loadKg: 100,
      concentricSec: 0.76,
      eccentricSec: 2.0,
      repNumber: 1,
    })

    expect(rep.romMeters).toBe(0.38)
    expect(rep.meanConcentricVelocity).toBe(0.5)
    expect(rep.peakConcentricVelocity).toBeCloseTo(0.725, 2)
    expect(rep.forceNewtons).toBeGreaterThan(980) // 100 * (9.81 + a)
    expect(rep.workJoules).toBeGreaterThan(370)
    expect(rep.meanPowerWatts).toBeGreaterThan(490)
    expect(rep.peakPowerWatts).toBeGreaterThan(rep.meanPowerWatts)
    expect(rep.velocityZone).toBe('strength_speed')
    expect(rep.isDecelerating).toBe(false)
  })

  it('detects rep-by-rep velocity loss and auto-flags deceleration fatigue', () => {
    const analysis = analyzeSetVelocityAndPower({
      exerciseName: 'Barbell Back Squat',
      loadKg: 140,
      repCadences: [
        { concentricSec: 0.8 }, // Fast (0.75 m/s)
        { concentricSec: 0.85 }, // Fast
        { concentricSec: 1.0 }, // Moderate deceleration
        { concentricSec: 1.3 }, // >35% drop compared to rep 1
      ],
    })

    expect(analysis.totalReps).toBe(4)
    expect(analysis.bestConcentricVelocity).toBe(0.75) // 0.60 / 0.8
    expect(analysis.finalConcentricVelocity).toBeLessThan(0.50)
    expect(analysis.overallVelocityLossPercent).toBeGreaterThanOrEqual(35)
    expect(analysis.fatigueClassification).toBe('excessive_deceleration')
    expect(analysis.reps[3].isDecelerating).toBe(true)
    expect(analysis.reps[3].isGrindRep).toBe(true)
  })

  it('enforces strict neutral grip biomechanical guardrails for hammer curls', () => {
    const analysis = analyzeSetVelocityAndPower({
      exerciseName: 'Dumbbell Hammer Curl',
      loadKg: 20,
      repCadences: [
        { concentricSec: 1.0, eccentricSec: 2.0 },
        { concentricSec: 1.1, eccentricSec: 2.0 },
      ],
    })

    expect(analysis.isHammerCurl).toBe(true)
    expect(analysis.hammerCurlGuardrailVerified).toBe(true)
    expect(analysis.hammerCurlGuidance).toBeDefined()
    expect(analysis.hammerCurlGuidance).toContain('Strict neutral hammer grip protocol verified')
    expect(analysis.hammerCurlGuidance).toContain('thumbs pointed up toward the ceiling')
    expect(analysis.hammerCurlGuidance).toContain('zero wrist twisting')

    const guidance = getHammerCurlGuardrailGuidance()
    expect(guidance).toContain('vertical')
    expect(guidance).toContain('neutral hammer grip')
  })
})
