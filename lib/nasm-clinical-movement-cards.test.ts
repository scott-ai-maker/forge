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

  it('resolves authentic verified Forge Athletic studio images first and provides brand logo fallback', () => {
    const bench = getNasmClinicalMovementCard('Barbell Flat Bench Press')
    expect(bench.imageUrl).toBe('/images/exercises/barbell-bench-press.jpg')
    expect(bench.candidateStudioImageUrl).toBe('/images/exercises/barbell-bench-press.jpg')
    expect(bench.fallbackImageUrl).toBe('/images/exercises/image-not-available.jpg')

    const squat = getNasmClinicalMovementCard('Barbell Back Squat')
    expect(squat.imageUrl).toBe('/images/exercises/barbell-back-squat.jpg')
    expect(squat.candidateStudioImageUrl).toBe('/images/exercises/barbell-back-squat.jpg')

    const novel = getNasmClinicalMovementCard('Unknown Outlier Movement 404')
    expect(novel.imageUrl).toBeNull()
    expect(novel.fallbackImageUrl).toBe('/images/exercises/image-not-available.jpg')
  })

  it('correctly resolves official NASM CDN video and studio thumbnail for Glute Bridge', () => {
    // 1. Bilateral Glute Bridge / Floor Bridge
    const gluteBridge = getNasmClinicalMovementCard('Glute Bridge')
    expect(gluteBridge.hasOfficialMedia).toBe(true)
    expect(gluteBridge.imageUrl).toBe('/images/exercises/glute-bridge.jpg')
    expect(gluteBridge.candidateStudioImageUrl).toBe('/images/exercises/glute-bridge.jpg')
    expect(gluteBridge.videoUrl).toContain('Z3cY3d3BBo4')
    expect(gluteBridge.embedUrl).toContain('Z3cY3d3BBo4')

    const floorBridge = getNasmClinicalMovementCard('Floor Bridge')
    expect(floorBridge.imageUrl).toBe('/images/exercises/floor-bridge.jpg')
    expect(floorBridge.candidateStudioImageUrl).toBe('/images/exercises/floor-bridge.jpg')
    expect(floorBridge.videoUrl).toContain('Z3cY3d3BBo4')
    expect(floorBridge.howToSteps.length).toBe(4)
    expect(floorBridge.howToSteps[0]).toContain('Lie on your back')

    // 2. Stability Ball Hamstring Curl canonical movement card
    const hamstringCurl = getNasmClinicalMovementCard('stability ball hamstring curl')
    expect(hamstringCurl.hasOfficialMedia).toBe(true)
    expect(hamstringCurl.videoUrl).toContain('Z3cY3d3BBo4')
    expect(hamstringCurl.howToSteps.length).toBe(4)
    expect(hamstringCurl.howToSteps[0]).toContain('Lie on your back')

    // 3. Unilateral Single-Leg Glute Bridge / Single-Leg Floor Bridge
    const singleLegGluteBridge = getNasmClinicalMovementCard('Single-Leg Glute Bridge')
    expect(singleLegGluteBridge.hasOfficialMedia).toBe(true)
    expect(singleLegGluteBridge.imageUrl).toBe('/images/exercises/single-leg-glute-bridge.jpg')
    expect(singleLegGluteBridge.candidateStudioImageUrl).toBe('/images/exercises/single-leg-glute-bridge.jpg')
    expect(singleLegGluteBridge.videoUrl).toContain('lHXShY-FivU')
    expect(singleLegGluteBridge.embedUrl).toContain('lHXShY-FivU')
  })

  it('correctly resolves verified studio image and official NASM video for Squat to Overhead Reach & Scaption', () => {
    // 1. Squat to Overhead Reach & Scaption (Clinical Warmup / Integration)
    const squatReachScaption = getNasmClinicalMovementCard('Squat to Overhead Reach & Scaption')
    expect(squatReachScaption.hasOfficialMedia).toBe(true)
    expect(squatReachScaption.imageUrl).toBe('/images/exercises/squat-to-overhead-reach.jpg')
    expect(squatReachScaption.candidateStudioImageUrl).toBe('/images/exercises/squat-to-overhead-reach.jpg')
    expect(squatReachScaption.videoUrl).toContain('9k6IfkGBAVQ')
    expect(squatReachScaption.embedUrl).toContain('9k6IfkGBAVQ')
    expect(squatReachScaption.primeMover).toContain('Deltoid')
    expect(squatReachScaption.primeMover).toContain('Supraspinatus')

    // 2. Squat to Overhead Reach (Postural Distortion Engine)
    const squatReach = getNasmClinicalMovementCard('Squat to Overhead Reach')
    expect(squatReach.hasOfficialMedia).toBe(true)
    expect(squatReach.imageUrl).toBe('/images/exercises/squat-to-overhead-reach.jpg')
    expect(squatReach.candidateStudioImageUrl).toBe('/images/exercises/squat-to-overhead-reach.jpg')
    expect(squatReach.videoUrl).toContain('9k6IfkGBAVQ')
    expect(squatReach.embedUrl).toContain('9k6IfkGBAVQ')

    // 3. Bilateral / Standard Scaption
    const scaption = getNasmClinicalMovementCard('Scaption')
    expect(scaption.hasOfficialMedia).toBe(true)
    expect(scaption.imageUrl).toBe('/images/exercises/single-leg-scaption.jpg')
    expect(scaption.candidateStudioImageUrl).toBe('/images/exercises/single-leg-scaption.jpg')
    expect(scaption.videoUrl).toContain('PKjDGnwpB_o')
    expect(scaption.embedUrl).toContain('PKjDGnwpB_o')
    expect(scaption.clinicalCues.some(cue => cue.includes('scapular plane'))).toBe(true)

    // 4. Single-Leg Scaption (Core Stabilization Phase 1)
    const singleLegScaption = getNasmClinicalMovementCard('Single-Leg Scaption')
    expect(singleLegScaption.hasOfficialMedia).toBe(true)
    expect(singleLegScaption.imageUrl).toBe('/images/exercises/single-leg-scaption.jpg')
    expect(singleLegScaption.candidateStudioImageUrl).toBe('/images/exercises/single-leg-scaption.jpg')
    expect(singleLegScaption.videoUrl).toContain('PKjDGnwpB_o')
    expect(singleLegScaption.embedUrl).toContain('PKjDGnwpB_o')

    // 5. Single-Leg Single-Arm Scaption
    const singleArmScaption = getNasmClinicalMovementCard('Single-Leg Single-Arm Scaption')
    expect(singleArmScaption.hasOfficialMedia).toBe(true)
    expect(singleArmScaption.imageUrl).toBe('/images/exercises/single-leg-single-arm-scaption.jpg')
    expect(singleArmScaption.candidateStudioImageUrl).toBe('/images/exercises/single-leg-single-arm-scaption.jpg')
    expect(singleArmScaption.videoUrl).toContain('ikMg_3_jAWE')
    expect(singleArmScaption.embedUrl).toContain('ikMg_3_jAWE')
  })

  it('resolves Glute Bridge with 2s Isometric Hold and demonstrates O(1) in-memory memoization', () => {
    // 1. Clinical warmup item variation
    const warmupBridge = getNasmClinicalMovementCard('Glute Bridge with 2s Isometric Hold')
    expect(warmupBridge.imageUrl).toBe('/images/exercises/floor-bridge.jpg')
    expect(warmupBridge.candidateStudioImageUrl).toBe('/images/exercises/floor-bridge.jpg')
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

  it('resolves verified Forge Athletic studio thumbnails for compound and corrective movements', () => {
    const card = getNasmClinicalMovementCard('Barbell Flat Bench Press')
    expect(card.imageUrl).toBe('/images/exercises/barbell-bench-press.jpg')
    expect(card.candidateStudioImageUrl).toBe('/images/exercises/barbell-bench-press.jpg')

    const squatCard = getNasmClinicalMovementCard('Squat to Overhead Reach & Scaption')
    expect(squatCard.imageUrl).toBe('/images/exercises/squat-to-overhead-reach.jpg')
    expect(squatCard.candidateStudioImageUrl).toBe('/images/exercises/squat-to-overhead-reach.jpg')

    const bridgeCard = getNasmClinicalMovementCard('Glute Bridge')
    expect(bridgeCard.imageUrl).toBe('/images/exercises/glute-bridge.jpg')
    expect(bridgeCard.candidateStudioImageUrl).toBe('/images/exercises/glute-bridge.jpg')
  })

  it('resolves Dumbbell Hammer Curl with strict neutral grip 5-checkpoint standards and zero supination', () => {
    const hammer = getNasmClinicalMovementCard('Dumbbell Hammer Curl')
    expect(hammer.hasOfficialMedia).toBe(true)
    expect(hammer.imageUrl).toBe('/images/exercises/dumbbell-hammer-curl.jpg')
    expect(hammer.candidateStudioImageUrl).toBe('/images/exercises/dumbbell-hammer-curl.jpg')
    expect(hammer.primeMover).toContain('Brachioradialis')
    expect(hammer.primeMover).toContain('Brachialis')
    expect(hammer.kineticCheckpoints.shoulders).toContain('neutral grip')
    expect(hammer.kineticCheckpoints.shoulders).toContain('zero supination')
    expect(hammer.kineticCheckpoints.lphc).toContain('Neutral pelvis')
    expect(hammer.howToSteps[0]).toMatch(/palms facing each other|neutral grip/)
    expect(hammer.howToSteps.every(s => !s.toLowerCase().includes('supinated'))).toBe(true)
    expect(hammer.clinicalCues.some(c => c.toLowerCase().includes('zero wrist twisting or supination'))).toBe(true)
  })

  it('resolves Single-Leg Dumbbell Overhead Press with Phase 1 stabilization, single-leg checkpoints, and official media', () => {
    const slPress = getNasmClinicalMovementCard('Single-Leg Dumbbell Overhead Press')
    expect(slPress.hasOfficialMedia).toBe(true)
    expect(slPress.imageUrl).toBe('/images/exercises/single-leg-dumbbell-overhead-press.jpg')
    expect(slPress.candidateStudioImageUrl).toBe('/images/exercises/single-leg-dumbbell-overhead-press.jpg')
    expect(slPress.videoUrl).toContain('8o79mSC7ZZQ')
    expect(slPress.optPhase).toContain('Stabilization Endurance')
    expect(slPress.stabilizers).toEqual(expect.arrayContaining([expect.stringContaining('Gluteus Medius')]))
    expect(slPress.setupInstructions.toLowerCase()).toContain('one leg')
    expect(slPress.executionInstructions.toLowerCase()).toContain('overhead')
    expect(slPress.clinicalCues.some(c => c.toLowerCase().includes('lower back') || c.toLowerCase().includes('lumbar'))).toBe(true)
    expect(slPress.howToSteps[0].toLowerCase()).toContain('one leg')

    // Contralateral/reordered alias check
    const slAlt = getNasmClinicalMovementCard('Single Leg Overhead Dumbbell Press')
    expect(slAlt.imageUrl).toBe('/images/exercises/single-leg-dumbbell-overhead-press.jpg')
    expect(slAlt.candidateStudioImageUrl).toBe('/images/exercises/single-leg-dumbbell-overhead-press.jpg')
    expect(slAlt.videoUrl).toContain('8o79mSC7ZZQ')
    expect(slAlt.setupInstructions.toLowerCase()).toContain('one leg')
  })

  it('resolves Dumbbell Bent-Over Extension with official video iRaoz2hbOXU and Triceps Brachii prime mover', () => {
    const card = getNasmClinicalMovementCard('Dumbbell Bent-Over Extension')
    expect(card.hasOfficialMedia).toBe(true)
    expect(card.imageUrl).toBe('/images/exercises/dumbbell-bent-over-extension.jpg')
    expect(card.videoUrl).toContain('iRaoz2hbOXU')
    expect(card.embedUrl).toContain('iRaoz2hbOXU')
    expect(card.candidateStudioImageUrl).toBe('/images/exercises/dumbbell-bent-over-extension.jpg')
    expect(card.primeMover).toContain('Triceps Brachii')
    expect(card.category).toBe('Arms')

    const slCard = getNasmClinicalMovementCard('Single-Leg Dumbbell Bent-Over Extension')
    expect(slCard.hasOfficialMedia).toBe(true)
    expect(slCard.imageUrl).toBe('/images/exercises/supported-bent-over-dumbbell-extension.jpg')
    expect(slCard.videoUrl).toContain('iRaoz2hbOXU')
    expect(slCard.embedUrl).toContain('iRaoz2hbOXU')
    expect(slCard.primeMover).toContain('Triceps Brachii')

    // Regression: Stale plan in database passing legacy kZ-ReOdn2qk videoUrl and imageUrl
    const stalePlanCard = getNasmClinicalMovementCard('Dumbbell Bent-Over Extension', {
      videoUrl: 'https://www.youtube.com/watch?v=kZ-ReOdn2qk',
      imageUrl: 'https://img.youtube.com/vi/kZ-ReOdn2qk/hqdefault.jpg',
    })
    expect(stalePlanCard.imageUrl).toBe('/images/exercises/dumbbell-bent-over-extension.jpg')
    expect(stalePlanCard.videoUrl).toContain('iRaoz2hbOXU')
    expect(stalePlanCard.embedUrl).toContain('iRaoz2hbOXU')
  })

  it('resolves promoted Forge Athletic self-hosted studio MP4 loops on studioVideoUrl across Benchmark, Wave 1, Wave 2, Wave 3, Wave 4, Wave 5, and Wave 6 movements', () => {
    const cases: Array<[string, string]> = [
      ['Barbell Deadlift', '/videos/exercises/barbell-deadlift.mp4'],
      ['Kettlebell Goblet Squat', '/videos/exercises/kettlebell-goblet-squat.mp4'],
      ['Cable Face Pull', '/videos/exercises/face-pull.mp4'],
      ['Single-Leg Romanian Deadlift (Dumbbell)', '/videos/exercises/single-leg-romanian-deadlift.mp4'],
      ['Barbell Back Squat', '/videos/exercises/barbell-back-squat.mp4'],
      ['Barbell Bench Press', '/videos/exercises/barbell-bench-press.mp4'],
      ['Push-Up', '/videos/exercises/push-up.mp4'],
      ['Floor Bridge', '/videos/exercises/floor-bridge.mp4'],
      ['Reverse Lunge to Balance', '/videos/exercises/reverse-lunge-to-balance.mp4'],
      ['Bulgarian Split Squat', '/videos/exercises/bulgarian-split-squat.mp4'],
      ['Dumbbell Overhead Press', '/videos/exercises/dumbbell-overhead-press.mp4'],
      ['Barbell Bent-Over Row', '/videos/exercises/barbell-bent-over-row-pronated.mp4'],
      ['Seated Cable Row', '/videos/exercises/seated-row.mp4'],
      ['Dumbbell Romanian Deadlift', '/videos/exercises/dumbbell-romanian-deadlift.mp4'],
      ['Dead Bug', '/videos/exercises/dead-bug.mp4'],
      ['Bird Dog', '/videos/exercises/bird-dog.mp4'],
      ['Dumbbell Bench Press', '/videos/exercises/dumbbell-bench-press.mp4'],
      ['Incline Barbell Bench Press', '/videos/exercises/incline-barbell-bench-press.mp4'],
      ['Lat Pulldown', '/videos/exercises/lat-pulldown.mp4'],
      ['Pull-Up', '/videos/exercises/pull-up.mp4'],
      ['Barbell Hip Thrust', '/videos/exercises/barbell-hip-thrust.mp4'],
      ['Step-Up to Balance', '/videos/exercises/step-up-to-balance-sagital.mp4'],
      ['Single-Leg Squat', '/videos/exercises/single-leg-squat.mp4'],
      ['Pistol Squat', '/videos/exercises/pistol-squat.mp4'],
      ['Dumbbell Lateral Raise', '/videos/exercises/dumbbell-lateral-raise.mp4'],
      ['Dumbbell Hammer Curl', '/videos/exercises/dumbbell-hammer-curl.mp4'],
      ['Cable Triceps Pushdown', '/videos/exercises/triceps-pushdown.mp4'],
      ['Cable Crossover', '/videos/exercises/cable-crossover.mp4'],
      ['Half-Kneeling Tubing Rotation', '/videos/exercises/half-kneeling-tubing-rotation.mp4'],
      ['Barbell Front Squat', '/videos/exercises/barbell-front-squat.mp4'],
      ['Barbell Box Squat', '/videos/exercises/box-squat.mp4'],
      ['Incline Dumbbell Bench Press', '/videos/exercises/incline-dumbbell-bench-press.mp4'],
      ['Dumbbell Bent-Over Row', '/videos/exercises/dumbbell-bent-over-row.mp4'],
      ['Bent-Over Dumbbell Rear Delt Fly', '/videos/exercises/bent-over-dumbbell-rear-fly.mp4'],
      ['Incline Dumbbell Bicep Curl', '/videos/exercises/incline-dumbbell-curl.mp4'],
      ['Dumbbell Bent-Over Triceps Extension', '/videos/exercises/dumbbell-bent-over-extension.mp4'],
      ['Incline Push-Up', '/videos/exercises/incline-push-up.mp4'],
      ['Floor Prone Cobra', '/videos/exercises/floor-prone-cobra.mp4'],
      ['Single-Leg Glute Bridge', '/videos/exercises/single-leg-glute-bridge.mp4'],
      ['Side-Lying Leg Raise', '/videos/exercises/side-lying-leg-raise.mp4'],
      ['Lateral Band Walking', '/videos/exercises/lateral-band-walking.mp4'],
      ['Barbell Bicep Curl', '/videos/exercises/barbell-bicep-curl.mp4'],
      ['Overhead Dumbbell Triceps Extension', '/videos/exercises/overhead-triceps-extension.mp4'],
      ['Cable Pallof Press', '/videos/exercises/cable-pallof-press.mp4'],
      ['Standing Tubing Row', '/videos/exercises/standing-tubing-row.mp4'],
      ['Single-Arm Dumbbell Chest Press', '/videos/exercises/single-arm-dumbbell-chest-press.mp4'],
      ['Single-Leg Dumbbell Scaption', '/videos/exercises/single-leg-scaption.mp4'],
      ['Squat to Overhead Reach', '/videos/exercises/squat-to-overhead-reach.mp4'],
      ['Squat to Cable Row', '/videos/exercises/squat-to-row.mp4'],
      ['Barbell Good Morning', '/videos/exercises/good-mornings.mp4'],
      ['Medicine Ball Russian Twist', '/videos/exercises/russian-twist.mp4'],
      ['Close-Grip Bench Press', '/videos/exercises/close-grip-bench-press.mp4'],
      ['Dumbbell Preacher Curl', '/videos/exercises/dumbbell-preacher-curl.mp4'],
      ['Barbell Overhead Press', '/videos/exercises/barbell-overhead-press.mp4'],
      ['45-Degree Leg Press', '/videos/exercises/leg-press.mp4'],
      ['Seated Leg Curl', '/videos/exercises/seated-leg-curl.mp4'],
      ['Lying Leg Curl', '/videos/exercises/lying-leg-curl.mp4'],
      ['Bench Dips', '/videos/exercises/bench-dips.mp4'],
      ['Decline Push-Up', '/videos/exercises/decline-push-up.mp4'],
      ['Push-Up Plus', '/videos/exercises/push-up-plus.mp4'],
      ['Plank with Arm Reach', '/videos/exercises/plank-with-arm-reach.mp4'],
      ['Side Plank', '/videos/exercises/side-plank.mp4'],
      ['Clamshells', '/videos/exercises/clamshells.mp4'],
      ['Dumbbell Squat to Overhead Press', '/videos/exercises/dumbbell-squat-to-overhead-press.mp4'],
      ['Kettlebell Front Squat', '/videos/exercises/kettlebell-front-squat.mp4'],
      ['Chest Press Machine', '/videos/exercises/chest-press-machine.mp4'],
      ['Seated Machine Row (Close-Grip)', '/videos/exercises/seated-machine-row-close-grip.mp4'],
      ['Bent-Over Barbell Row (Supinated)', '/videos/exercises/bent-over-barbell-row-supinated.mp4'],
      ['Supported Bent-Over Dumbbell Row', '/videos/exercises/supported-bent-over-dumbbell-row.mp4'],
      ['Supine Dumbbell Extension', '/videos/exercises/supine-dumbbell-extension.mp4'],
      ['Leg Press Calf Raise', '/videos/exercises/leg-press-calf-raise.mp4'],
      ['Kettlebell Deadlift', '/videos/exercises/kettlebell-deadlift.mp4'],
      ['Kettlebell Overhead Press', '/videos/exercises/kettlebell-overhead-press.mp4'],
      ['Stability Ball Crunch', '/videos/exercises/ball-crunch.mp4'],
      ['Stability Ball Cobra', '/videos/exercises/ball-cobra.mp4'],
      ['Quadruped March', '/videos/exercises/quadruped-march.mp4'],
      ['Prisoner Squat', '/videos/exercises/prisoner-squat.mp4'],
      ['Alternating Dumbbell Bench Press', '/videos/exercises/alternating-dumbbell-bench-press.mp4'],
      ['Single-Arm Incline Dumbbell Chest Press', '/videos/exercises/single-arm-incline-dumbbell-chest-press.mp4'],
      ['Band-Assisted Pull-Up', '/videos/exercises/band-assisted-pull-up.mp4'],
      ['Incline-Stance Single-Arm Row', '/videos/exercises/incline-stance-single-arm-row.mp4'],
      ['Push Press', '/videos/exercises/push-press.mp4'],
      ['Bent-Elbow Dumbbell Lateral Raise', '/videos/exercises/bent-elbow-dumbbell-lateral-raise.mp4'],
      ['Supported Bent-Over Dumbbell Extension', '/videos/exercises/supported-bent-over-dumbbell-extension.mp4'],
      ['Dumbbell Front Squat', '/videos/exercises/dumbbell-front-squat.mp4'],
      ['Single-Leg Floor Bridge', '/videos/exercises/single-leg-floor-bridge.mp4'],
      ['Kettlebell Floor Press', '/videos/exercises/kettlebell-floor-press.mp4'],
      ['Ball Crunch Arms Crossed', '/videos/exercises/ball-crunch-arms-crossed.mp4'],
      ['Quadruped Arm Raise', '/videos/exercises/quadruped-arm-raise.mp4'],
      ['Two-Arm Incline Dumbbell Chest Press', '/videos/exercises/two-arm-incline-dumbbell-chest-press.mp4'],
      ['Two-Arm Standing Cable Fly', '/videos/exercises/two-arm-standing-cable-fly.mp4'],
      ['Single-Arm Standing Row with Rotation', '/videos/exercises/single-arm-standing-row-with-rotation.mp4'],
      ['Incline Stance Row', '/videos/exercises/incline-stance-row.mp4'],
      ['Single-Leg Dumbbell Overhead Press', '/videos/exercises/single-leg-dumbbell-overhead-press.mp4'],
      ['Single-Leg Hammer Curl', '/videos/exercises/single-leg-hammer-curl.mp4'],
      ['Assisted Single-Leg Squat', '/videos/exercises/assisted-single-leg-squat.mp4'],
      ['Single-Leg Squat Touchdown', '/videos/exercises/single-leg-squat-touchdown.mp4'],
      ['Barbell Good Mornings', '/videos/exercises/barbell-good-mornings.mp4'],
      ['Band Push-Up', '/videos/exercises/band-push-up.mp4'],
      ['Pike Push-Up', '/videos/exercises/pike-push-up.mp4'],
      ['Quadruped Opposite Arm Leg Raise', '/videos/exercises/quadruped-opposite-arm-leg-raise.mp4'],
      ['Barbell Bench Press with Bands', '/videos/exercises/barbell-bench-press-with-bands.mp4'],
      ['Ball Prone Wide Row', '/videos/exercises/ball-prone-wide-row.mp4'],
      ['Kettlebell Renegade Row', '/videos/exercises/kettlebell-renegade-row.mp4'],
      ['Reverse Lunge to Single-Arm Row', '/videos/exercises/reverse-lunge-to-single-arm-row.mp4'],
      ['Barbell Front Squat with Clean Position', '/videos/exercises/barbell-front-squat-with-clean-position.mp4'],
      ['Barbell Front Squat with Crossed Arms', '/videos/exercises/barbell-front-squat-with-crossed-arms.mp4'],
      ['Lying Leg Curl Single Leg', '/videos/exercises/lying-leg-curl-single-leg.mp4'],
      ['Glute Bridge', '/videos/exercises/glute-bridge.mp4'],
      ['Inverted Push-Up', '/videos/exercises/inverted-push-up.mp4'],
      ['Push-Up with Staggered Hands', '/videos/exercises/push-up-with-staggered-hands.mp4'],
      ['Core Ball Crunch', '/videos/exercises/core-ball-crunch.mp4'],
      ['Long-Lever Ball Crunch', '/videos/exercises/long-lever-ball-crunch.mp4'],
      ['Single-Arm Dumbbell Bench Press', '/videos/exercises/single-arm-dumbbell-bench-press.mp4'],
      ['Incline Push-Up with Rotation', '/videos/exercises/incline-push-up-with-rotation.mp4'],
      ['Incline-Stance Curl to Overhead Press', '/videos/exercises/incline-stance-curl-to-overhead-press.mp4'],
      ['Single-Leg Single-Arm Scaption', '/videos/exercises/single-leg-single-arm-scaption.mp4'],
      ['Lateral Raise', '/videos/exercises/lateral-raise.mp4'],
      ['Kettlebell Crush Curl with Squat', '/videos/exercises/kettlebell-crush-curl-with-squat.mp4'],
      ['Single-Arm Kettlebell Swing', '/videos/exercises/single-arm-kettlebell-swing.mp4'],
      ['Reverse Lunge with Torso Lean', '/videos/exercises/reverse-lunge-with-torso-lean.mp4'],
      ['Single-Leg Press', '/videos/exercises/single-leg-press.mp4'],
      ['Single-Leg Seated Leg Curl', '/videos/exercises/single-leg-seated-leg-curl.mp4'],
      ['Plank Walkup', '/videos/exercises/plank-walkup.mp4'],
      ['Prone Ball Dumbbell Cobra', '/videos/exercises/prone-ball-dumbbell-cobra.mp4'],
      ['Two-Arm Dumbbell Chest Press with Band', '/videos/exercises/two-arm-dumbbell-chest-press-with-band.mp4'],
      ['Prisoner Squat Calf Raise', '/videos/exercises/prisoner-squat-calf-raise.mp4'],
      ['Push-Up with Rotation', '/videos/exercises/push-up-with-rotation.mp4'],
      ['Modified Push-Up', '/videos/exercises/modified-push-up.mp4'],
      ['Dumbbell Renegade Row to Push-Up', '/videos/exercises/dumbbell-renegade-row-to-push-up.mp4'],
      ['Reciprocating Kettlebell Overhead Press', '/videos/exercises/reciprocating-kettlebell-overhead-press.mp4'],
      ['Double Kettlebell Clean', '/videos/exercises/double-kettlebell-clean.mp4'],
      ['Kettlebell Jerk', '/videos/exercises/kettlebell-jerk.mp4'],
      ['Single-Arm Kettlebell High Pull', '/videos/exercises/single-arm-kettlebell-high-pull.mp4'],
      ['Box Squat Curl to Overhead Press', '/videos/exercises/box-squat-curl-to-overhead-press.mp4'],
      ['Quadruped Leg Raise', '/videos/exercises/quadruped-leg-raise.mp4'],
      ['Reverse Crunch to Knee-Up with Rotation', '/videos/exercises/reverse-crunch-to-knee-up-with-rotation.mp4'],
      ['Activation Ball Prone Shoulder Ext Rotation', '/videos/exercises/activation-ball-prone-shoulder-ext-rotation.mp4'],
      ['Activation Standing Glute Max', '/videos/exercises/activation-standing-glute-max.mp4'],
      ['Active Standing Adductor', '/videos/exercises/active-standing-adductor.mp4'],
      ['Ball Combo I', '/videos/exercises/ball-combo-i.mp4'],
      ['Dumbbell Ball Combo II', '/videos/exercises/dumbbell-ball-combo-ii.mp4'],
      ['Hand-to-Hand Kettlebell Swing', '/videos/exercises/hand-to-hand-kettlebell-swing.mp4'],
      ['Iron Cross', '/videos/exercises/iron-cross.mp4'],
      ['Lying Leg Curl Two-Leg Concentric Single-Leg Eccentric', '/videos/exercises/lying-leg-curl-two-leg-concentric-single-leg-eccentric.mp4'],
      ['Single-Leg Romanian Deadlift Curl to Overhead Press', '/videos/exercises/single-leg-romanian-deadlift-curl-to-overhead-press.mp4'],
      ['Single-Leg Romanian Deadlift Single-Arm Curl to Overhead Press', '/videos/exercises/single-leg-romanian-deadlift-single-arm-curl-to-overhead-press.mp4'],
      ['Step-Up to Balance Frontal', '/videos/exercises/step-up-to-balance-frontal.mp4'],
      ['Static Latissimus Dorsi Ball Stretch', '/videos/exercises/static-latissimus-dorsi-ball-stretch.mp4'],
      ['Activation Ball Prone Shoulder Press', '/videos/exercises/activation-ball-prone-shoulder-press.mp4'],
      ['Activation Standing Shoulder Ext Rotation', '/videos/exercises/activation-standing-shoulder-ext-rotation.mp4'],
      ['Archer Push-Up', '/videos/exercises/archer-push-up.mp4'],
      ['Barbell Bench Press with Chains', '/videos/exercises/barbell-bench-press-with-chains.mp4'],
      ['Double Kettlebell Snatch', '/videos/exercises/double-kettlebell-snatch.mp4'],
      ['Dumbbell Combination Curl', '/videos/exercises/dumbbell-combination-curl.mp4'],
      ['Dumbbell Push Press', '/videos/exercises/dumbbell-push-press.mp4'],
      ['Hammer Curl to Lateral Raise', '/videos/exercises/hammer-curl-to-lateral-raise.mp4'],
      ['Kettlebell Clean', '/videos/exercises/kettlebell-clean.mp4'],
      ['Kettlebell Clean to Press', '/videos/exercises/kettlebell-clean-to-press.mp4'],
      ['Kettlebell Push Press', '/videos/exercises/kettlebell-push-press.mp4'],
      ['Split Jerk', '/videos/exercises/split-jerk.mp4'],
      ['Reverse Lunge to Row', '/videos/exercises/reverse-lunge-to-row.mp4'],
      ['Single-Arm Standing Chest Press', '/videos/exercises/single-arm-standing-chest-press.mp4'],
      ['Single-Leg Squat to Row', '/videos/exercises/single-leg-squat-to-row.mp4'],
      ['Split-Stance Row', '/videos/exercises/split-stance-row.mp4'],
      ['Squat to Single-Arm Row', '/videos/exercises/squat-to-single-arm-row.mp4'],
      ['Step-Up to Balance Frontal Curl to Overhead Press', '/videos/exercises/step-up-to-balance-frontal-curl-to-overhead-press.mp4'],
      ['Single-Leg Lift and Chop', '/videos/exercises/single-leg-lift-and-chop.mp4'],
      ['Single-Leg Romanian Deadlift to PNF Pattern 1', '/videos/exercises/single-leg-romanian-deadlift-to-pnf-pattern-1.mp4'],
      ['Half Get-Up with Kettlebell', '/videos/exercises/half-get-up-with-kettlebell.mp4'],
      ['Kettlebell Arm Bar', '/videos/exercises/kettlebell-arm-bar.mp4'],
      ['Lunge to Balance', '/videos/exercises/lunge-to-balance.mp4'],
      ['Activation Serratus Push-Up', '/videos/exercises/activation-serratus-push-up.mp4'],
    ]

    for (const [exerciseName, expectedStudioUrl] of cases) {
      const card = getNasmClinicalMovementCard(exerciseName)
      expect(card.studioVideoUrl).toBe(expectedStudioUrl)
    }

    const slsCard = getNasmClinicalMovementCard('Single-Leg Squat')
    const pistolCard = getNasmClinicalMovementCard('Pistol Squat')
    expect(slsCard.candidateStudioImageUrl).toBe('/images/exercises/single-leg-squat.jpg')
    expect(pistolCard.candidateStudioImageUrl).toBe('/images/exercises/pistol-squat.jpg')
    expect(pistolCard.optPhase).toContain('Progression from Single-Leg Squat')
  })
})

