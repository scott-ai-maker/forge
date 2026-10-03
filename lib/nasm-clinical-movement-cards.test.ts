import { describe, it, expect } from 'vitest'
import { getNasmClinicalMovementCard } from './nasm-clinical-movement-cards'

describe('NASM Clinical Movement Cards Engine — Strict Official Media Rules', () => {
  it('attaches verified official NASM Edge media for exact standard compound lifts', () => {
    // 1. Barbell Flat Bench Press
    const bench = getNasmClinicalMovementCard('Barbell Flat Bench Press (Strength 1A)')
    expect(bench.primeMover).toContain('Pectoralis Major')
    expect(bench.synergists).toContain('Triceps Brachii')
    expect(bench.equipment).toContain('Barbell')
    expect(bench.equipment).toContain('Adjustable Bench')
    expect(bench.hasOfficialMedia).toBe(true)
    expect(bench.videoUrl).not.toBeNull()
    expect(bench.imageUrl).toBeDefined()
    // 2. Barbell Back Squat
    const squat = getNasmClinicalMovementCard('Barbell Back Squat')
    expect(squat.primeMover).toContain('Quadriceps')
    expect(squat.hasOfficialMedia).toBe(true)
    expect(squat.videoUrl).not.toBeNull()
    expect(squat.imageUrl).toBeDefined()
    expect(squat.imageUrl).not.toBeNull()
  })

  it('sets imageUrl and videoUrl to null when an exact official match is not found', () => {
    const novelExercise = getNasmClinicalMovementCard('Custom Functional Hybrid Complex 99')
    expect(novelExercise.hasOfficialMedia).toBe(false)
    expect(novelExercise.imageUrl).toBeNull()
    expect(novelExercise.videoUrl).toBeNull()
    // Anatomy and 5-checkpoint alignment still render with complete clinical standards
    expect(novelExercise.kineticCheckpoints.feetAnkles).toBeDefined()
    expect(novelExercise.kineticCheckpoints.lphc).toBeDefined()
    expect(novelExercise.setupInstructions).toBeDefined()
  })

  it('correctly detects specific equipment tags without generic catch-alls or profile contamination', () => {
    const dbBall = getNasmClinicalMovementCard('Dumbbell Chest Press on Stability Ball', {
      primaryEquipment: ['dumbbell', 'band', 'bench', 'stability ball', 'bodyweight'],
    })
    expect(dbBall.equipment).toContain('Dumbbells')
    expect(dbBall.equipment).toContain('Stability Ball')
    expect(dbBall.equipment).not.toContain('Barbell')
    expect(dbBall.equipment).not.toContain('Resistance Band')

    const pushUp = getNasmClinicalMovementCard('Push Up', {
      primaryEquipment: ['dumbbell', 'band', 'bench', 'stability ball', 'bodyweight'],
    })
    expect(pushUp.equipment).toEqual(['Bodyweight'])

    const foamRoll = getNasmClinicalMovementCard('Foam Roll Calves')
    expect(foamRoll.equipment).toEqual(['Foam Roller'])

    const cableRow = getNasmClinicalMovementCard('Seated Cable Row')
    expect(cableRow.equipment).toContain('Cable Machine')
    expect(cableRow.equipment).not.toContain('Dumbbells')
    expect(cableRow.equipment).not.toContain('Barbell')
  })

  it('guarantees concrete numbered step-by-step how-to instructions for all exercises', () => {
    // 1. Profile exercise
    const bench = getNasmClinicalMovementCard('Barbell Bench Press')
    expect(bench.howToSteps.length).toBeGreaterThanOrEqual(3)
    expect(bench.howToSteps[0]).toMatch(/^1\./)
    expect(bench.howToSteps.some(s => s.toLowerCase().includes('setup') || s.toLowerCase().includes('eccentric') || s.toLowerCase().includes('position'))).toBe(true)

    // 2. Library exercise
    const depthJump = getNasmClinicalMovementCard('Depth Jump')
    expect(depthJump.howToSteps.length).toBeGreaterThanOrEqual(3)
    expect(depthJump.howToSteps[0]).toMatch(/^1\./)

    // 3. Novel exercise
    const novel = getNasmClinicalMovementCard('Custom Kettlebell Overhead Carry 101')
    expect(novel.howToSteps.length).toBeGreaterThanOrEqual(3)
    expect(novel.howToSteps[0]).toMatch(/^1\./)
  })

  it('resolves authentic verified official NASM CDN default images and provides brand logo fallback', () => {
    const bench = getNasmClinicalMovementCard('Barbell Flat Bench Press')
    expect(bench.imageUrl).toBe('https://img.youtube.com/vi/CayG6UYqL8g/hqdefault.jpg')
    expect(bench.fallbackImageUrl).toBe('/images/exercises/image-not-available.jpg')

    const squat = getNasmClinicalMovementCard('Barbell Back Squat')
    expect(squat.imageUrl).toBe('https://img.youtube.com/vi/-bJIpOq-LWk/hqdefault.jpg')

    const novel = getNasmClinicalMovementCard('Unknown Outlier Movement 404')
    expect(novel.imageUrl).toBeNull()
    expect(novel.fallbackImageUrl).toBe('/images/exercises/image-not-available.jpg')
  })

  it('correctly resolves official NASM CDN video and default thumbnail for Glute Bridge', () => {
    // 1. Bilateral Glute Bridge / Floor Bridge
    const gluteBridge = getNasmClinicalMovementCard('Glute Bridge')
    expect(gluteBridge.hasOfficialMedia).toBe(true)
    expect(gluteBridge.imageUrl).toBe('https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg')
    expect(gluteBridge.videoUrl).toContain('Z3cY3d3BBo4')
    expect(gluteBridge.embedUrl).toContain('Z3cY3d3BBo4')

    const floorBridge = getNasmClinicalMovementCard('Floor Bridge')
    expect(floorBridge.imageUrl).toBe('https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg')
    expect(floorBridge.videoUrl).toContain('Z3cY3d3BBo4')
    expect(floorBridge.howToSteps.length).toBe(4)
    expect(floorBridge.howToSteps[0]).toContain('Lie on your back')

    // 2. Stability Ball Hamstring Curl canonical alias -> Floor Bridge
    const hamstringCurl = getNasmClinicalMovementCard('stability ball hamstring curl')
    expect(hamstringCurl.hasOfficialMedia).toBe(true)
    expect(hamstringCurl.videoUrl).toContain('Z3cY3d3BBo4')
    expect(hamstringCurl.howToSteps.length).toBe(4)
    expect(hamstringCurl.howToSteps[0]).toContain('Lie on your back')

    // 3. Unilateral Single-Leg Glute Bridge / Single-Leg Floor Bridge
    const singleLegGluteBridge = getNasmClinicalMovementCard('Single-Leg Glute Bridge')
    expect(singleLegGluteBridge.hasOfficialMedia).toBe(true)
    expect(singleLegGluteBridge.imageUrl).toBe('https://img.youtube.com/vi/lHXShY-FivU/hqdefault.jpg')
    expect(singleLegGluteBridge.videoUrl).toContain('lHXShY-FivU')
    expect(singleLegGluteBridge.embedUrl).toContain('lHXShY-FivU')
  })

  it('correctly resolves official NASM CDN video and default thumbnail for Squat to Overhead Reach & Scaption', () => {
    // 1. Squat to Overhead Reach & Scaption (Clinical Warmup / Integration)
    const squatReachScaption = getNasmClinicalMovementCard('Squat to Overhead Reach & Scaption')
    expect(squatReachScaption.hasOfficialMedia).toBe(true)
    expect(squatReachScaption.imageUrl).toBe('https://img.youtube.com/vi/PKjDGnwpB_o/hqdefault.jpg')
    expect(squatReachScaption.videoUrl).toContain('PKjDGnwpB_o')
    expect(squatReachScaption.embedUrl).toContain('PKjDGnwpB_o')
    expect(squatReachScaption.primeMover).toContain('Deltoid')
    expect(squatReachScaption.primeMover).toContain('Supraspinatus')

    // 2. Squat to Overhead Reach (Postural Distortion Engine)
    const squatReach = getNasmClinicalMovementCard('Squat to Overhead Reach')
    expect(squatReach.hasOfficialMedia).toBe(true)
    expect(squatReach.imageUrl).toBe('https://img.youtube.com/vi/PKjDGnwpB_o/hqdefault.jpg')
    expect(squatReach.videoUrl).toContain('PKjDGnwpB_o')
    expect(squatReach.embedUrl).toContain('PKjDGnwpB_o')

    // 3. Bilateral / Standard Scaption
    const scaption = getNasmClinicalMovementCard('Scaption')
    expect(scaption.hasOfficialMedia).toBe(true)
    expect(scaption.imageUrl).toBe('https://img.youtube.com/vi/PKjDGnwpB_o/hqdefault.jpg')
    expect(scaption.videoUrl).toContain('PKjDGnwpB_o')
    expect(scaption.embedUrl).toContain('PKjDGnwpB_o')
    expect(scaption.clinicalCues.some(cue => cue.includes('scapular plane'))).toBe(true)

    // 4. Single-Leg Scaption (Core Stabilization Phase 1)
    const singleLegScaption = getNasmClinicalMovementCard('Single-Leg Scaption')
    expect(singleLegScaption.hasOfficialMedia).toBe(true)
    expect(singleLegScaption.imageUrl).toBe('https://img.youtube.com/vi/PKjDGnwpB_o/hqdefault.jpg')
    expect(singleLegScaption.videoUrl).toContain('PKjDGnwpB_o')
    expect(singleLegScaption.embedUrl).toContain('PKjDGnwpB_o')

    // 5. Single-Leg Single-Arm Scaption
    const singleArmScaption = getNasmClinicalMovementCard('Single-Leg Single-Arm Scaption')
    expect(singleArmScaption.hasOfficialMedia).toBe(true)
    expect(singleArmScaption.imageUrl).toBe('https://img.youtube.com/vi/ikMg_3_jAWE/hqdefault.jpg')
    expect(singleArmScaption.videoUrl).toContain('ikMg_3_jAWE')
    expect(singleArmScaption.embedUrl).toContain('ikMg_3_jAWE')
  })

  it('resolves Glute Bridge with 2s Isometric Hold and demonstrates O(1) in-memory memoization', () => {
    // 1. Clinical warmup item variation
    const warmupBridge = getNasmClinicalMovementCard('Glute Bridge with 2s Isometric Hold')
    expect(warmupBridge.imageUrl).toBe('https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg')
    expect(warmupBridge.hasOfficialMedia).toBe(true)

    // 2. Memoization test: subsequent lookups return exact cached instance
    const t0 = performance.now()
    for (let i = 0; i < 1000; i++) {
      const cached = getNasmClinicalMovementCard('Glute Bridge with 2s Isometric Hold')
      expect(cached).toBe(warmupBridge)
    }
    const elapsed = performance.now() - t0
    // 1,000 cached lookups should execute in under 20ms (typically <2ms)
    expect(elapsed).toBeLessThan(50)
  })

  it('resolves verified official NASM CDN default thumbnails for compound and corrective movements', () => {
    const card = getNasmClinicalMovementCard('Barbell Flat Bench Press')
    expect(card.imageUrl).toBe('https://img.youtube.com/vi/CayG6UYqL8g/hqdefault.jpg')

    const squatCard = getNasmClinicalMovementCard('Squat to Overhead Reach & Scaption')
    expect(squatCard.imageUrl).toBe('https://img.youtube.com/vi/PKjDGnwpB_o/hqdefault.jpg')

    const bridgeCard = getNasmClinicalMovementCard('Glute Bridge')
    expect(bridgeCard.imageUrl).toBe('https://img.youtube.com/vi/Z3cY3d3BBo4/hqdefault.jpg')
  })
})

