import { describe, it, expect } from 'vitest'
import {
  calculateRepVelocityAndPower,
  analyzeSetVelocityAndPower,
  classifyVbtZone,
} from '@/lib/bar-velocity-power-engine'

describe('BarVelocityPowerTrackerTray Component Logic', () => {
  it('correctly calculates real-time concentric velocity and kinetic wattage for UI display', () => {
    const telemetry = calculateRepVelocityAndPower({
      exerciseName: 'Barbell Bench Press',
      loadKg: 100,
      concentricSec: 0.76,
      eccentricSec: 2.0,
      repNumber: 1,
    })

    expect(telemetry.meanConcentricVelocity).toBe(0.5)
    expect(telemetry.meanPowerWatts).toBeGreaterThan(490)
    expect(telemetry.velocityZoneLabel).toContain('Strength-Speed')
    expect(telemetry.workJoules).toBeGreaterThan(370)
  })

  it('correctly evaluates multi-rep velocity loss and triggers fatigue flag for UI badge', () => {
    const setReport = analyzeSetVelocityAndPower({
      exerciseName: 'Barbell Back Squat',
      loadKg: 140,
      repCadences: [
        { concentricSec: 0.8 },
        { concentricSec: 0.9 },
        { concentricSec: 1.1 },
        { concentricSec: 1.4 },
      ],
    })

    expect(setReport.totalReps).toBe(4)
    expect(setReport.overallVelocityLossPercent).toBeGreaterThan(30)
    expect(setReport.reps[3].isDecelerating).toBe(true)
    expect(setReport.recommendedAction).toContain('Velocity threshold exceeded')
  })

  it('strictly validates neutral grip guardrails for Dumbbell Hammer Curl', () => {
    const setReport = analyzeSetVelocityAndPower({
      exerciseName: 'Dumbbell Hammer Curl',
      loadKg: 16,
      repCadences: [{ concentricSec: 1.0 }],
    })

    expect(setReport.isHammerCurl).toBe(true)
    expect(setReport.hammerCurlGuardrailVerified).toBe(true)
    expect(setReport.hammerCurlGuidance).toContain('thumbs pointed up toward the ceiling')
    expect(setReport.hammerCurlGuidance).toContain('zero wrist twisting')
  })
})
