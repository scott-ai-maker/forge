import { describe, it, expect } from 'vitest'
import { BAND_COLOR_SPECTRUM, BandResistanceLevel, findBandByWeight } from '@/lib/exercise-logging-helpers'

describe('BandResistanceChartModal & Elastic Resistance Calibration Matrix (Tool #12)', () => {
  it('contains the complete 6-tier Forge Athletic elastic resistance spectrum', () => {
    expect(BAND_COLOR_SPECTRUM).toHaveLength(6)

    const expectedOrder = ['Yellow', 'Green', 'Red', 'Blue', 'Purple', 'Black']
    expect(BAND_COLOR_SPECTRUM.map(b => b.colorName)).toEqual(expectedOrder)

    // Verify ascending tension progression (Hooke's Law compliance)
    for (let i = 1; i < BAND_COLOR_SPECTRUM.length; i++) {
      expect(BAND_COLOR_SPECTRUM[i].weightLbsAvg).toBeGreaterThan(BAND_COLOR_SPECTRUM[i - 1].weightLbsAvg)
    }
  })

  it('correctly maps each tier to accurate poundage ranges and metric equivalents', () => {
    // 1. Yellow (Level 1: Very Light)
    const yellow = BAND_COLOR_SPECTRUM[0]
    expect(yellow.colorName).toBe('Yellow')
    expect(yellow.weightLbsMin).toBe(5)
    expect(yellow.weightLbsMax).toBe(10)
    expect(yellow.weightLbsAvg).toBe(10)
    expect(yellow.weightKgAvg).toBeCloseTo(4.5, 1)

    // 2. Green (Level 2: Light)
    const green = BAND_COLOR_SPECTRUM[1]
    expect(green.colorName).toBe('Green')
    expect(green.weightLbsMin).toBe(10)
    expect(green.weightLbsMax).toBe(25)
    expect(green.weightLbsAvg).toBe(20)

    // 3. Red (Level 3: Medium)
    const red = BAND_COLOR_SPECTRUM[2]
    expect(red.colorName).toBe('Red')
    expect(red.weightLbsMin).toBe(25)
    expect(red.weightLbsMax).toBe(40)
    expect(red.weightLbsAvg).toBe(35)

    // 4. Blue (Level 4: Heavy)
    const blue = BAND_COLOR_SPECTRUM[3]
    expect(blue.colorName).toBe('Blue')
    expect(blue.weightLbsMin).toBe(40)
    expect(blue.weightLbsMax).toBe(60)
    expect(blue.weightLbsAvg).toBe(50)

    // 5. Purple (Level 5: Ultra Heavy)
    const purple = BAND_COLOR_SPECTRUM[4]
    expect(purple.colorName).toBe('Purple')
    expect(purple.weightLbsMin).toBe(60)
    expect(purple.weightLbsMax).toBe(80)
    expect(purple.weightLbsAvg).toBe(70)

    // 6. Black (Level 6: Super Heavy)
    const black = BAND_COLOR_SPECTRUM[5]
    expect(black.colorName).toBe('Black')
    expect(black.weightLbsMin).toBe(80)
    expect(black.weightLbsMax).toBe(100)
    expect(black.weightLbsAvg).toBe(90)
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

    const black = BAND_COLOR_SPECTRUM[5]
    expect(formatRange(black, 'imperial')).toBe('80–100 lbs (~90 lb)')
    expect(formatRange(black, 'metric')).toBe('36–45 kg (~41 kg)')
  })

  it('resolves closest matching band from logged weight accurately', () => {
    expect(findBandByWeight(8, 'imperial').colorName).toBe('Yellow')
    expect(findBandByWeight(18, 'imperial').colorName).toBe('Green')
    expect(findBandByWeight(32, 'imperial').colorName).toBe('Red')
    expect(findBandByWeight(55, 'imperial').colorName).toBe('Blue')
    expect(findBandByWeight(72, 'imperial').colorName).toBe('Purple')
    expect(findBandByWeight(95, 'imperial').colorName).toBe('Black')
  })

  it('formats structured set note tag for progressive overload telemetry', () => {
    const buildNoteTag = (band: BandResistanceLevel, units: 'imperial' | 'metric'): string => {
      const range = units === 'imperial'
        ? `${band.weightLbsMin}–${band.weightLbsMax} lbs`
        : `${Math.round(band.weightLbsMin / 2.20462)}–${Math.round(band.weightLbsMax / 2.20462)} kg`
      return `[Band: ${band.colorName} (${range})]`
    }

    const green = BAND_COLOR_SPECTRUM[1]
    expect(buildNoteTag(green, 'imperial')).toBe('[Band: Green (10–25 lbs)]')
    expect(buildNoteTag(green, 'metric')).toBe('[Band: Green (5–11 kg)]')
  })
})
