import { describe, it, expect } from 'vitest'
import {
  getNasmOptPhaseFeatureRules,
  isSupersetOfferedForPhase,
  isSupersetDefaultOnForPhase,
  isIntensityProtocolOfferedForPhase,
  isVbtOfferedForPhase,
  getDefaultNasmOptTempo,
  NASM_OPT_FEATURE_RULES,
} from './nasm-opt-feature-matrix'

describe('NASM OPT™ Phase Feature Matrix & Deterministic Rules Engine', () => {
  it('enforces that supersets are NEVER on by default for any phase', () => {
    for (let phase = 1; phase <= 5; phase++) {
      expect(isSupersetDefaultOnForPhase(phase)).toBe(false)
      expect(getNasmOptPhaseFeatureRules(phase).isSupersetDefaultOn).toBe(false)
    }
  })

  it('prohibits supersets in Phase 1 (Stabilization) and Phase 4 (Maximal Strength)', () => {
    expect(isSupersetOfferedForPhase(1)).toBe(false)
    expect(isSupersetOfferedForPhase(4)).toBe(false)
    expect(getNasmOptPhaseFeatureRules(1).canToggleSupersets).toBe(false)
    expect(getNasmOptPhaseFeatureRules(4).canToggleSupersets).toBe(false)
    expect(getNasmOptPhaseFeatureRules(4).supersetTooltip).toContain('prohibits supersets')
  })

  it('offers supersets in Phase 2 (Contrast), Phase 3 (Hypertrophy Density), and Phase 5 (PAP Power)', () => {
    expect(isSupersetOfferedForPhase(2)).toBe(true)
    expect(isSupersetOfferedForPhase(3)).toBe(true)
    expect(isSupersetOfferedForPhase(5)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(2).canToggleSupersets).toBe(true)
    expect(getNasmOptPhaseFeatureRules(3).canToggleSupersets).toBe(true)
    expect(getNasmOptPhaseFeatureRules(5).canToggleSupersets).toBe(true)
  })

  it('restricts intensity protocols (drop sets, rest-pause) in Phase 1, 4, and 5 while offering in Phase 2 and 3', () => {
    expect(isIntensityProtocolOfferedForPhase(1)).toBe(false)
    expect(isIntensityProtocolOfferedForPhase(4)).toBe(false)
    expect(isIntensityProtocolOfferedForPhase(5)).toBe(false)

    expect(isIntensityProtocolOfferedForPhase(2)).toBe(true)
    expect(isIntensityProtocolOfferedForPhase(3)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(3).isIntensityProtocolRecommended).toBe(true)
  })

  it('correctly gates Velocity-Based Training (VBT) — hidden in Phase 1, primary in Phase 5', () => {
    expect(isVbtOfferedForPhase(1)).toBe(false)
    expect(isVbtOfferedForPhase(4)).toBe(true)
    expect(isVbtOfferedForPhase(5)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(5).isVbtPrimaryMetric).toBe(true)
  })

  it('resolves authentic NASM OPT™ movement cadence tempos per phase', () => {
    // Phase 1: strictly 4/2/1
    expect(getDefaultNasmOptTempo(1, 'Barbell Bench Press').tempo).toBe('4/2/1')

    // Phase 2: 2/0/2 for strength, 4/2/1 for stabilization partner
    expect(getDefaultNasmOptTempo(2, 'Barbell Bench Press').tempo).toBe('2/0/2')
    expect(getDefaultNasmOptTempo(2, 'Stability Ball Push-Up').tempo).toBe('4/2/1')
    expect(getDefaultNasmOptTempo(2, 'Single-Leg Dumbbell Curl').tempo).toBe('4/2/1')

    // Phase 3: 2/0/2 for hypertrophy
    expect(getDefaultNasmOptTempo(3, 'Barbell Bench Press').tempo).toBe('2/0/2')

    // Phase 4: 1/1/1 for maximal strength
    expect(getDefaultNasmOptTempo(4, 'Barbell Back Squat').tempo).toBe('1/1/1')

    // Phase 5: X/0/X for explosive, 2/0/1 for heavy primer
    expect(getDefaultNasmOptTempo(5, 'Jump Squat').tempo).toBe('X/0/X')
    expect(getDefaultNasmOptTempo(5, 'Medicine Ball Chest Slam').tempo).toBe('X/0/X')
    expect(getDefaultNasmOptTempo(5, 'Barbell Back Squat').tempo).toBe('2/0/1')
  })
})
