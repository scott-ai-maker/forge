import { describe, it, expect } from 'vitest'
import {
  detectExerciseEquipment,
  normalizeEquipmentAlias,
  normalizeEquipmentAccess,
  parseEquipmentCapabilities,
  doesExerciseMatchEquipment,
  parseCardioEquipmentCapabilities,
} from './nasm-equipment-detector'

describe('Biomechanical Equipment & Modality Detector', () => {
  it('detects Dumbbells and Stability Ball for Dumbbell Chest Press on Stability Ball', () => {
    const equip = detectExerciseEquipment('Dumbbell Chest Press on Stability Ball (Phase 1)')
    expect(equip).toContain('Dumbbells')
    expect(equip).toContain('Stability Ball')
    expect(equip).not.toContain('Barbell')
  })

  it('detects Barbell and Bench for Barbell Flat Bench Press', () => {
    const equip = detectExerciseEquipment('Barbell Flat Bench Press (Strength 1A)')
    expect(equip).toContain('Barbell')
    expect(equip).toContain('Adjustable Bench')
    expect(equip).not.toContain('Dumbbells')
  })

  it('detects Foam Roller for Foam Roll Calves', () => {
    const equip = detectExerciseEquipment('Foam Roll Calves')
    expect(equip).toEqual(['Foam Roller'])
  })

  it('detects Stability Ball for Stability Ball Crunch', () => {
    const equip = detectExerciseEquipment('Stability Ball Crunch')
    expect(equip).toEqual(['Stability Ball'])
  })

  it('detects Bodyweight for Push-Up and Plank even when provided broad equipment array', () => {
    expect(detectExerciseEquipment('Push Up', 'Chest movement', ['dumbbell', 'band', 'bench', 'stability ball', 'bodyweight'])).toEqual(['Bodyweight'])
    expect(detectExerciseEquipment('Plank', 'Core isometric hold', ['barbell', 'squat rack', 'dumbbell'])).toEqual(['Bodyweight'])
  })

  it('detects Kettlebell for Kettlebell Goblet Squat', () => {
    const equip = detectExerciseEquipment('Kettlebell Goblet Squat')
    expect(equip).toContain('Kettlebell')
  })

  it('detects Resistance Band and Pull-Up Bar for Band Assisted Pull-Up', () => {
    const equip = detectExerciseEquipment('Band Assisted Pull Up')
    expect(equip).toContain('Resistance Band')
    expect(equip).toContain('Pull-Up Bar')
  })

  it('detects Barbell and Squat Rack for Barbell Back Squat', () => {
    const equip = detectExerciseEquipment('Barbell Back Squat (Phase 2)')
    expect(equip).toContain('Barbell')
    expect(equip).toContain('Squat Rack')
    expect(equip).not.toContain('Dumbbells')
  })

  it('detects Cable Machine for Standing Cable Face Pull', () => {
    const equip = detectExerciseEquipment('Standing Cable Face Pull')
    expect(equip).toContain('Cable Machine')
    expect(equip).not.toContain('Barbell')
    expect(equip).not.toContain('Dumbbells')
  })

  it('normalizes equipment aliases and arrays correctly', () => {
    expect(normalizeEquipmentAlias('cable-machine')).toBe('cable machine')
    expect(normalizeEquipmentAlias('dumbbells')).toBe('dumbbell')
    expect(normalizeEquipmentAlias('kettlebells')).toBe('kettlebell')
    expect(normalizeEquipmentAlias('bands')).toBe('band')
    expect(normalizeEquipmentAlias('machines')).toBe('machine')
    expect(normalizeEquipmentAlias('trx')).toBe('suspension')

    const normalized = normalizeEquipmentAccess(['Dumbbells', 'bands', 'trx', 'dumbbells'])
    expect(normalized).toEqual(['dumbbell', 'band', 'suspension'])
  })

  it('parses equipment capabilities correctly for commercial vs home gym profiles', () => {
    const fullGym = parseEquipmentCapabilities(['commercial_gym'])
    expect(fullGym.isFullGym).toBe(true)
    expect(fullGym.hasBarbell).toBe(true)
    expect(fullGym.hasMachines).toBe(true)

    const homeGym = parseEquipmentCapabilities(['dumbbell', 'resistance band', 'stability ball'])
    expect(homeGym.isFullGym).toBe(false)
    expect(homeGym.hasDumbbells).toBe(true)
    expect(homeGym.hasBands).toBe(true)
    expect(homeGym.hasStabilityBall).toBe(true)
    expect(homeGym.hasBarbell).toBe(false)
    expect(homeGym.hasMachines).toBe(false)
    expect(homeGym.isHomeDumbbellOnly).toBe(true)
  })

  it('evaluates doesExerciseMatchEquipment accurately', () => {
    const homeEquipment = ['dumbbell', 'band', 'bench']

    // Push-Up (Bodyweight) matches
    expect(doesExerciseMatchEquipment({ name: 'Push-Up' }, homeEquipment)).toBe(true)

    // Dumbbell Bench Press matches
    expect(doesExerciseMatchEquipment({ name: 'Dumbbell Bench Press' }, homeEquipment)).toBe(true)

    // Barbell Back Squat does NOT match home gym lacking barbell
    expect(doesExerciseMatchEquipment({ name: 'Barbell Back Squat' }, homeEquipment)).toBe(false)

    // Lying Leg Curl (machine) does NOT match home gym lacking machines
    expect(doesExerciseMatchEquipment({ name: 'Lying Leg Curl' }, homeEquipment)).toBe(false)

    // Stability Ball Hamstring Curl does NOT match if user has no ball
    expect(doesExerciseMatchEquipment({ name: 'Stability Ball Hamstring Curl' }, homeEquipment)).toBe(false)
  })

  it('parses cardio capabilities properly', () => {
    const caps = parseCardioEquipmentCapabilities(['treadmill', 'assault bike'], ['dumbbell'])
    expect(caps.hasTreadmill).toBe(true)
    expect(caps.hasAirBike).toBe(true)
    expect(caps.hasRower).toBe(false)
    expect(caps.isBodyweightCardioOnly).toBe(false)
  })

  it('detects and evaluates BOSU Balance Trainer equipment correctly', () => {
    const pushupEquip = detectExerciseEquipment('BOSU Push-Up')
    expect(pushupEquip).toContain('BOSU Balance Trainer')

    const reachEquip = detectExerciseEquipment('BOSU Single-Leg Balance Reach')
    expect(reachEquip).toContain('BOSU Balance Trainer')

    expect(normalizeEquipmentAlias('bosu')).toBe('bosu')
    expect(normalizeEquipmentAlias('bosu-ball')).toBe('bosu')
    expect(normalizeEquipmentAlias('BOSU Balance Trainer')).toBe('bosu')

    const homeWithBosu = parseEquipmentCapabilities(['dumbbell', 'bosu'])
    expect(homeWithBosu.hasBosu).toBe(true)
    expect(homeWithBosu.hasDumbbells).toBe(true)
    expect(homeWithBosu.hasBarbell).toBe(false)

    const homeWithoutBosu = parseEquipmentCapabilities(['dumbbell', 'band'])
    expect(homeWithoutBosu.hasBosu).toBe(false)

    expect(doesExerciseMatchEquipment({ name: 'BOSU Push-Up' }, ['dumbbell', 'bosu'])).toBe(true)
    expect(doesExerciseMatchEquipment({ name: 'BOSU Push-Up' }, ['dumbbell', 'band'])).toBe(false)
  })

  it('detects and evaluates TheraBand Stability Ball equipment correctly', () => {
    const ballEquip = detectExerciseEquipment('TheraBand Stability Ball Push-Up')
    expect(ballEquip).toContain('Stability Ball')

    const crunchEquip = detectExerciseEquipment('Stability Ball Crunch')
    expect(crunchEquip).toContain('Stability Ball')

    expect(normalizeEquipmentAlias('stability ball')).toBe('stability ball')
    expect(normalizeEquipmentAlias('theraband stability ball')).toBe('stability ball')
    expect(normalizeEquipmentAlias('swiss ball')).toBe('stability ball')

    const homeWithBall = parseEquipmentCapabilities(['dumbbell', 'stability ball'])
    expect(homeWithBall.hasStabilityBall).toBe(true)
    expect(homeWithBall.hasBosu).toBe(false)

    expect(doesExerciseMatchEquipment({ name: 'Stability Ball Hamstring Curl' }, ['dumbbell', 'stability ball'])).toBe(true)
    expect(doesExerciseMatchEquipment({ name: 'Stability Ball Hamstring Curl' }, ['dumbbell', 'band'])).toBe(false)
  })
})
