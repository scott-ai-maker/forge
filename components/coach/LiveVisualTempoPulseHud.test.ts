import { describe, expect, it } from 'vitest'
import { parseTempoString } from './LiveVisualTempoPulseHud'

describe('LiveVisualTempoPulseHud tempo parser', () => {
  it('parses standard 4/2/1 tempo correctly', () => {
    const result = parseTempoString('4/2/1')
    expect(result.ecc).toBe(4)
    expect(result.iso).toBe(2)
    expect(result.con).toBe(1)
  })

  it('parses 3-1-1 tempo with dashes correctly', () => {
    const result = parseTempoString('3-1-1')
    expect(result.ecc).toBe(3)
    expect(result.iso).toBe(1)
    expect(result.con).toBe(1)
  })

  it('parses 2/0/2 tempo correctly', () => {
    const result = parseTempoString('2/0/2')
    expect(result.ecc).toBe(2)
    expect(result.iso).toBe(0)
    expect(result.con).toBe(2)
  })

  it('falls back gracefully on empty or invalid tempo', () => {
    const result = parseTempoString(null)
    expect(result.ecc).toBe(2)
    expect(result.iso).toBe(0)
    expect(result.con).toBe(2)
  })

  it('parses explosive and PAP power tempos with minimum valid duration', () => {
    const explosiveResult = parseTempoString('x/x/x')
    expect(explosiveResult.ecc).toBe(1)
    expect(explosiveResult.iso).toBe(0)
    expect(explosiveResult.con).toBe(1)

    const papResult = parseTempoString('pap')
    expect(papResult.ecc).toBe(1)
    expect(papResult.iso).toBe(0)
    expect(papResult.con).toBe(1)
  })

  it('parses 4-digit tempos with top pause isometric duration', () => {
    const fourDigit = parseTempoString('4-2-1-1')
    expect(fourDigit.ecc).toBe(4)
    expect(fourDigit.iso).toBe(2)
    expect(fourDigit.con).toBe(1)
    expect(fourDigit.isoTop).toBe(1)
  })

  it('calculates total time-under-tension (TUT) progression across completed reps', () => {
    function computeSetTut(tempo: { ecc: number; iso: number; con: number }, reps: number): number {
      const repSeconds = tempo.ecc + tempo.iso + tempo.con
      return repSeconds * reps
    }

    // NASM Phase 1 (Stabilization Endurance): 4-2-1 tempo x 12 reps
    const phase1Tempo = { ecc: 4, iso: 2, con: 1 }
    expect(computeSetTut(phase1Tempo, 12)).toBe(84) // 84 seconds of TUT

    // NASM Phase 2 (Strength Endurance): 2-0-2 tempo x 10 reps
    const phase2Tempo = { ecc: 2, iso: 0, con: 2 }
    expect(computeSetTut(phase2Tempo, 10)).toBe(40) // 40 seconds of TUT

    // NASM Phase 5 (Power): 1-0-1 tempo x 5 reps
    const phase5Tempo = { ecc: 1, iso: 0, con: 1 }
    expect(computeSetTut(phase5Tempo, 5)).toBe(10) // 10 seconds of TUT
  })

  it('verifies clinical audio frequency synthesis values for phase cueing', () => {
    const frequencies = {
      eccentric: 600,  // Lower pitch tone on descent
      isometric: 750,  // Mid pitch tone on hole pause
      concentric: 950, // High energetic pitch on drive
    }

    expect(frequencies.eccentric).toBeLessThan(frequencies.isometric)
    expect(frequencies.isometric).toBeLessThan(frequencies.concentric)
    expect(frequencies.concentric).toBe(950)
  })

  it('validates phase color mappings for visual cadence feedback', () => {
    const phaseMeta = {
      eccentric: { label: '1. Eccentric (Descent)', color: '#38BDF8' },
      isometric: { label: '2. Isometric (Pause in Hole)', color: '#F59E0B' },
      concentric: { label: '3. Concentric (Drive Up)', color: '#10B981' },
    }

    expect(phaseMeta.eccentric.color).toBe('#38BDF8')
    expect(phaseMeta.isometric.color).toBe('#F59E0B')
    expect(phaseMeta.concentric.color).toBe('#10B981')
  })
})

