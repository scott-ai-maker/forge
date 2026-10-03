import { describe, it, expect } from 'vitest'
import {
  NASM_PLYOMETRIC_LIBRARY,
  calculateRsi,
  evaluateLandingMechanics,
  generatePlyometricProtocol,
} from './nasm-plyometric-engine'

describe('NASM CPT-7 Chapter 18: Plyometric & Reactive Power Engine', () => {
  it('contains comprehensive exercises across all 3 OPT™ tiers with valid cues and tempo', () => {
    expect(NASM_PLYOMETRIC_LIBRARY.length).toBeGreaterThanOrEqual(10)

    const stabExercises = NASM_PLYOMETRIC_LIBRARY.filter(e => e.tier === 'stabilization')
    const strengthExercises = NASM_PLYOMETRIC_LIBRARY.filter(e => e.tier === 'strength')
    const powerExercises = NASM_PLYOMETRIC_LIBRARY.filter(e => e.tier === 'power')

    expect(stabExercises.length).toBeGreaterThanOrEqual(4)
    expect(strengthExercises.length).toBeGreaterThanOrEqual(4)
    expect(powerExercises.length).toBeGreaterThanOrEqual(4)

    // Verify Phase 1 stabilization has 3-5s hold cue
    stabExercises.forEach(ex => {
      expect(ex.tempo.toLowerCase()).toContain('3–5s')
    })
  })

  it('calculates Reactive Strength Index (RSI), amortization classification and GRF correctly', () => {
    // Fast SSC elite jump: 45cm jump height, 140ms ground contact time
    const eliteResult = calculateRsi({
      jumpHeightCm: 45,
      contactTimeMs: 140,
      bodyweightLbs: 200,
    })

    expect(eliteResult.rsiScore).toBe(3.21) // 0.45m / 0.14s = 3.21
    expect(eliteResult.rating).toBe('Elite / Explosive Reactive Power')
    expect(eliteResult.amortizationClassification).toBe('Optimal Fast SSC (<150ms)')
    expect(eliteResult.prescribedTier).toBe('power')
    expect(eliteResult.grfMultiplier).toBeGreaterThan(3.0)

    // Slow amortization jump: 25cm jump height, 320ms ground contact time
    const slowResult = calculateRsi({
      jumpHeightCm: 25,
      contactTimeMs: 320,
      bodyweightLbs: 200,
    })

    expect(slowResult.rsiScore).toBe(0.78)
    expect(slowResult.rating).toBe('Poor / High Amortization Delay')
    expect(slowResult.amortizationClassification).toBe('Slow / Dissipated Elastic Energy (>250ms)')
    expect(slowResult.prescribedTier).toBe('stabilization')
  })

  it('evaluates landing mechanics and gates OPT™ phases upon severe faults like knee valgus', () => {
    // Clean landing
    const cleanResult = evaluateLandingMechanics([])
    expect(cleanResult.overallDecelerationQuality).toBe('Pristine Landing Mechanics')
    expect(cleanResult.recommendedOptPhaseCap).toBe(5)

    // Knee valgus detected
    const valgusResult = evaluateLandingMechanics(['knee_valgus'])
    expect(valgusResult.overallDecelerationQuality).toBe('Compromised / High Injury Risk')
    expect(valgusResult.recommendedOptPhaseCap).toBe(1) // Locked to Phase 1 Stabilization
    expect(valgusResult.prescribedCorrectiveCues[0]).toContain('knees pushing out')

    // Multiple faults (stiff-leg + forward lean)
    const multiResult = evaluateLandingMechanics(['stiff_legged_landing', 'excessive_forward_lean'])
    expect(multiResult.observedFaultsCount).toBe(2)
    expect(multiResult.recommendedOptPhaseCap).toBe(3)
  })

  it('generates periodized plyometric session protocols aligned with client OPT™ phase', () => {
    const phase1Session = generatePlyometricProtocol(1)
    expect(phase1Session.tier).toBe('stabilization')
    expect(phase1Session.tierTitle).toContain('Phase 1')
    expect(phase1Session.restBetweenExercisesSec).toBe(90)
    expect(phase1Session.exercises[0].tempo).toContain('3–5s')

    const phase3Session = generatePlyometricProtocol(3)
    expect(phase3Session.tier).toBe('strength')
    expect(phase3Session.exercises[0].exercise.tier).toBe('strength')

    const phase5Session = generatePlyometricProtocol(5)
    expect(phase5Session.tier).toBe('power')
    expect(phase5Session.exercises.some(e => e.exercise.id === 'depth_jumps')).toBe(true)
  })
})
