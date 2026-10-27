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
    expect(searchNasmLibraryMedia('Single-Leg Single-Arm Scaption')).not.toBeNull()

    // Non-NASM custom exercises must return null
    expect(searchNasmLibraryMedia('BOSU Plank')).toBeNull()
    expect(searchNasmLibraryMedia('BOSU Dome Squat')).toBeNull()
    expect(searchNasmLibraryMedia('Inverted Cable Pec Fly (Strength 1A)')).toBeNull()
    expect(searchNasmLibraryMedia('Barbell Standing Overhead Press')).toBeNull()
    expect(searchNasmLibraryMedia('Squat to Overhead Reach & Scaption')).toBeNull()
  })

  it('resolves canonical aliases to official movements to fix client routines', () => {
    const flatBenchMatch = searchNasmLibraryMedia('Barbell Flat Bench Press (Strength 1A)')
    expect(flatBenchMatch).not.toBeNull()
    expect(flatBenchMatch?.record.name).toBe('Barbell Bench Press')

    const bridgeMatch = searchNasmLibraryMedia('stability ball hamstring curl')
    expect(bridgeMatch).not.toBeNull()
    expect(bridgeMatch?.record.name).toBe('Floor Bridge')
    expect(bridgeMatch?.record.videoId).toBe('Z3cY3d3BBo4')

    const cobraMatch = searchNasmLibraryMedia('prone cobra on floor')
    expect(cobraMatch).not.toBeNull()
    expect(cobraMatch?.record.name).toBe('Floor Prone Cobra')

    // Single-leg upper body balance movements mapped to official parent demonstration videos
    const overheadPressMatch = searchNasmLibraryMedia('Single-Leg Dumbbell Overhead Press')
    expect(overheadPressMatch).not.toBeNull()
    expect(overheadPressMatch?.record.name).toBe('Dumbbell Overhead Press')

    const bentOverRowMatch = searchNasmLibraryMedia('Single-Leg Dumbbell Bent Over Row')
    expect(bentOverRowMatch).not.toBeNull()
    expect(bentOverRowMatch?.record.name).toBe('Supported Bent Over Dumbbell Row')

    const extensionMatch = searchNasmLibraryMedia('Single-Leg Dumbbell Bent-Over Extension')
    expect(extensionMatch).not.toBeNull()
    expect(extensionMatch?.record.name).toBe('Supported Bent Over Dumbbell Extension')

    const tubingRowMatch = searchNasmLibraryMedia('Single-Leg Standing Tubing Row')
    expect(tubingRowMatch).not.toBeNull()
    expect(tubingRowMatch?.record.name).toBe('Standing Tubing Row')
  })

  it('returns null for completely unrelated or synthetic strings to prevent wrong links', () => {
    const bogus = searchNasmLibraryMedia('Quantum Anti-Gravity Astral Leap 9000')
    expect(bogus).toBeNull()
  })
})
