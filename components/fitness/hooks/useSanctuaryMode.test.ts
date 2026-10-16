import { describe, expect, it } from 'vitest'
import {
  shouldTriggerDistractionIntervention,
  formatBreathingPhaseDisplay,
} from './useSanctuaryMode'

describe('useSanctuaryMode Logic & Utilities', () => {
  it('determines distraction intervention threshold correctly', () => {
    // Under 4 seconds (e.g. quick accidental gesture) -> false
    expect(shouldTriggerDistractionIntervention(0)).toBe(false)
    expect(shouldTriggerDistractionIntervention(1)).toBe(false)
    expect(shouldTriggerDistractionIntervention(3)).toBe(false)

    // 4 seconds or more (e.g. checking feed/notifications) -> true
    expect(shouldTriggerDistractionIntervention(4)).toBe(true)
    expect(shouldTriggerDistractionIntervention(15)).toBe(true)
    expect(shouldTriggerDistractionIntervention(60)).toBe(true)
  })

  it('formats breathing phase display cleanly', () => {
    expect(formatBreathingPhaseDisplay('inhale', 4)).toBe('Inhale (4s)')
    expect(formatBreathingPhaseDisplay('hold_in', 2)).toBe('Hold in (2s)')
    expect(formatBreathingPhaseDisplay('exhale', 6)).toBe('Exhale (6s)')
    expect(formatBreathingPhaseDisplay('hold_out', 4)).toBe('Hold out (4s)')
  })
})
