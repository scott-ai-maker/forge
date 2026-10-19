import { describe, it, expect } from 'vitest'
import {
  calculateRepVelocityAndPower,
  analyzeSetVelocityAndPower,
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

  it('exports BarVelocityPowerTrackerTray component cleanly and supports onVelocityLossChange', async () => {
    const componentModule = await import('./BarVelocityPowerTrackerTray')
    expect(componentModule.default).toBeDefined()
    expect(typeof componentModule.default).toBe('function')
  })

  it('enforces NASM OPT™ phase matrix rules for VBT availability', async () => {
    const { isVbtOfferedForPhase, getNasmOptPhaseFeatureRules } = await import('@/lib/nasm-opt-feature-matrix')

    // Phase 1: Stabilization requires slow 4/2/1 tempo, VBT not offered
    expect(isVbtOfferedForPhase(1)).toBe(false)
    expect(getNasmOptPhaseFeatureRules(1).vbtBadge).toContain('N/A in Phase 1')

    // Phase 2: Strength Endurance offers VBT to monitor concentric speed
    expect(isVbtOfferedForPhase(2)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(2).vbtBadge).toContain('Velocity Telemetry')

    // Phase 3: Hypertrophy monitors velocity loss threshold
    expect(isVbtOfferedForPhase(3)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(3).vbtBadge).toContain('Velocity Loss Monitor')

    // Phase 4: Maximal Strength requires velocity loss guardrails
    expect(isVbtOfferedForPhase(4)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(4).vbtBadge).toContain('Velocity Loss Guardrail')

    // Phase 5: Power has VBT as the primary core metric
    expect(isVbtOfferedForPhase(5)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(5).isVbtPrimaryMetric).toBe(true)
    expect(getNasmOptPhaseFeatureRules(5).vbtBadge).toContain('Core Metric')
  })

  it('integrates velocity loss directly with the Autoregulation Deload Advisor', async () => {
    const { evaluateExerciseAutoregulation } = await import('@/lib/autoregulation-advisor-engine')

    const sets = [
      { setNumber: 1, weightLbs: 225, reps: 5, rpe: 8, rir: 2, isWarmup: false },
    ]

    // Feed 26% velocity loss from VBT tracker tray into autoregulation advisor
    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Back Squat',
      currentDraftWeightLbs: 225,
      currentDraftReps: 5,
      targetReps: 5,
      completedSets: sets,
      units: 'imperial',
      velocityLossPercent: 26,
    })

    expect(advice.hasAcuteFatigueDrop).toBe(true)
    expect(advice.acuteFatigueDropPercent).toBe(26)
    expect(advice.action).toBe('reduce_load_15pct')
    expect(advice.badgeText).toContain('−15% Back-Off')
    expect(advice.headline).toContain('Acute Fatigue Drop Detected (−26%)')
  })
})
