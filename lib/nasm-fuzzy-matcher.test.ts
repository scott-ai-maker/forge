import { describe, it, expect } from 'vitest'
import { searchNasmLibraryMedia, normalizeExerciseQuery } from './nasm-fuzzy-matcher'

describe('NASM Fuzzy Heuristic Media & Movement Search Engine', () => {
  it('normalizes exercise queries properly', () => {
    expect(normalizeExerciseQuery('Barbell Flat Bench Press (Strength 1A)')).toBe('barbell flat bench press')
    expect(normalizeExerciseQuery('Single-Leg Romanian Deadlift (Phase 2)')).toBe('single leg romanian deadlift')
    expect(normalizeExerciseQuery('NASM Edge: Bulgarian Split Squat')).toBe('bulgarian split squat')
  })

  it('matches only exact official canonical NASM movement names', () => {
    expect(searchNasmLibraryMedia('Barbell Bench Press')).not.toBeNull()
    expect(searchNasmLibraryMedia('Dumbbell Hammer Curl')).not.toBeNull()
    expect(searchNasmLibraryMedia('BOSU Plank')).not.toBeNull()
    expect(searchNasmLibraryMedia('Single-Leg Single-Arm Scaption')).not.toBeNull()

    expect(searchNasmLibraryMedia('Barbell Flat Bench Press (Strength 1A)')).toBeNull()
    expect(searchNasmLibraryMedia('Barbell Standing Overhead Press')).toBeNull()
    expect(searchNasmLibraryMedia('Squat to Overhead Reach & Scaption')).toBeNull()
  })

  it('resolves canonical aliases to official movements to fix client routines', () => {
    const bridgeMatch = searchNasmLibraryMedia('stability ball hamstring curl')
    expect(bridgeMatch).not.toBeNull()
    expect(bridgeMatch?.record.name).toBe('Floor Bridge')
    expect(bridgeMatch?.record.videoId).toBe('Z3cY3d3BBo4')

    const cobraMatch = searchNasmLibraryMedia('prone cobra on floor')
    expect(cobraMatch).not.toBeNull()
    expect(cobraMatch?.record.name).toBe('Floor Prone Cobra')
  })

  it('returns null for completely unrelated or synthetic strings to prevent wrong links', () => {
    const bogus = searchNasmLibraryMedia('Quantum Anti-Gravity Astral Leap 9000')
    expect(bogus).toBeNull()
  })
})
