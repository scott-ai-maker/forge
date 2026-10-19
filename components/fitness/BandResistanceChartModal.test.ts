import { describe, it, expect } from 'vitest'
import { BAND_COLOR_SPECTRUM, BandResistanceLevel, findBandByWeight } from '@/lib/exercise-logging-helpers'

describe('BandResistanceChartModal & Elastic Resistance Calibration Matrix (Tool #12)', () => {
  it('contains the complete 6-tier Forge Athletic elastic resistance spectrum', () => {
    expect(BAND_COLOR_SPECTRUM).toHaveLength(6)

    const expectedOrder = ['Yellow', 'Red', 'Green', 'Blue', 'Black', 'Purple']
    expect(BAND_COLOR_SPECTRUM.map(b => b.colorName)).toEqual(expectedOrder)

    // Verify ascending tension progression (Hooke's Law compliance)
    for (let i = 1; i < BAND_COLOR_SPECTRUM.length; i++) {
      expect(BAND_COLOR_SPECTRUM[i].weightLbsAvg).toBeGreaterThan(BAND_COLOR_SPECTRUM[i - 1].weightLbsAvg)
    }
  })

  it('correctly maps each tier to accurate poundage ranges and metric equivalents', () => {
    // 1. Yellow (Ultra Light)
    const yellow = BAND_COLOR_SPECTRUM[0]
    expect(yellow.colorName).toBe('Yellow')
    expect(yellow.weightLbsMin).toBe(5)
    expect(yellow.weightLbsMax).toBe(10)
    expect(yellow.weightLbsAvg).toBe(10)
    expect(yellow.weightKgAvg).toBeCloseTo(4.5, 1)

    // 2. Red (Light)
    const red = BAND_COLOR_SPECTRUM[1]
    expect(red.colorName).toBe('Red')
    expect(red.weightLbsMin).toBe(10)
    expect(red.weightLbsMax).toBe(25)
    expect(red.weightLbsAvg).toBe(20)

    // 3. Green (Medium)
    const green = BAND_COLOR_SPECTRUM[2]
    expect(green.colorName).toBe('Green')
    expect(green.weightLbsMin).toBe(25)
    expect(green.weightLbsMax).toBe(40)
    expect(green.weightLbsAvg).toBe(35)

    // 4. Blue (Heavy)
    const blue = BAND_COLOR_SPECTRUM[3]
    expect(blue.colorName).toBe('Blue')
    expect(blue.weightLbsMin).toBe(40)
    expect(blue.weightLbsMax).toBe(60)
    expect(blue.weightLbsAvg).toBe(50)

    // 5. Black (X-Heavy)
    const black = BAND_COLOR_SPECTRUM[4]
    expect(black.colorName).toBe('Black')
    expect(black.weightLbsMin).toBe(60)
    expect(black.weightLbsMax).toBe(80)
    expect(black.weightLbsAvg).toBe(70)

    // 6. Purple (XX-Heavy)
    const purple = BAND_COLOR_SPECTRUM[5]
    expect(purple.colorName).toBe('Purple')
    expect(purple.weightLbsMin).toBe(80)
    expect(purple.weightLbsMax).toBe(100)
    expect(purple.weightLbsAvg).toBe(90)
  })

  it('formats imperial vs metric resistance strings accurately', () => {
    const formatRange = (band: BandResistanceLevel, units: 'imperial' | 'metric'): string => {
      return units === 'imperial'
        ? `${band.weightLbsMin}–${band.weightLbsMax} lbs (~${band.weightLbsAvg} lb)`
        : `${Math.round(band.weightLbsMin / 2.20462)}–${Math.round(band.weightLbsMax / 2.20462)} kg (~${band.weightKgAvg} kg)`
    }

    const yellow = BAND_COLOR_SPECTRUM[0]
    expect(formatRange(yellow, 'imperial')).toBe('5–10 lbs (~10 lb)')
    expect(formatRange(yellow, 'metric')).toBe('2–5 kg (~4.5 kg)')

    const purple = BAND_COLOR_SPECTRUM[5]
    expect(formatRange(purple, 'imperial')).toBe('80–100 lbs (~90 lb)')
    expect(formatRange(purple, 'metric')).toBe('36–45 kg (~41 kg)')
  })

  it('resolves closest matching band from logged weight accurately', () => {
    expect(findBandByWeight(8, 'imperial').colorName).toBe('Yellow')
    expect(findBandByWeight(18, 'imperial').colorName).toBe('Red')
    expect(findBandByWeight(32, 'imperial').colorName).toBe('Green')
    expect(findBandByWeight(55, 'imperial').colorName).toBe('Blue')
    expect(findBandByWeight(72, 'imperial').colorName).toBe('Black')
    expect(findBandByWeight(95, 'imperial').colorName).toBe('Purple')
  })

  it('formats structured set note tag for progressive overload telemetry', () => {
    const buildNoteTag = (band: BandResistanceLevel, units: 'imperial' | 'metric'): string => {
      const range = units === 'imperial'
        ? `${band.weightLbsMin}–${band.weightLbsMax} lbs`
        : `${Math.round(band.weightLbsMin / 2.20462)}–${Math.round(band.weightLbsMax / 2.20462)} kg`
      return `[Band: ${band.colorName} (${range})]`
    }

    const red = BAND_COLOR_SPECTRUM[1]
    expect(buildNoteTag(red, 'imperial')).toBe('[Band: Red (10–25 lbs)]')
    expect(buildNoteTag(red, 'metric')).toBe('[Band: Red (5–11 kg)]')
  })
})
