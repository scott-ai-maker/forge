import { describe, it, expect } from 'vitest'
import { resolveExerciseVideoEmbed, extractYouTubeVideoId, enrichExerciseMedia } from './nasm-exercise-video-catalog'

describe('Master 1-to-1 NASM Edge Exercise Video Resolver', () => {
  it('extracts YouTube video IDs correctly from various formats', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=yPqv3ejnZvc')).toBe('yPqv3ejnZvc')
    expect(extractYouTubeVideoId('https://youtu.be/hbw7hdyOpq0')).toBe('hbw7hdyOpq0')
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/7NUICnha_Hk')).toBe('7NUICnha_Hk')
    expect(extractYouTubeVideoId(null)).toBeNull()
  })

  it('resolves exact 1-to-1 official NASM Edge videos without mismatching variations', () => {
    // 1. Flat Barbell Bench Press -> CayG6UYqL8g (NOT Incline or Chains)
    const flatBench = resolveExerciseVideoEmbed('Barbell Flat Bench Press (Strength 1A)', null)
    expect(flatBench.embedUrl).toContain('CayG6UYqL8g')
    expect(flatBench.sourceTitle).toContain('NASM Edge · Barbell Bench Press')

    // 2. Barbell Back Squat -> -bJIpOq-LWk (NOT Squat Jump)
    const backSquat = resolveExerciseVideoEmbed('Barbell Back Squat (Strength 1A)', null)
    expect(backSquat.embedUrl).toContain('-bJIpOq-LWk')
    expect(backSquat.sourceTitle).toContain('NASM Edge · Barbell Back Squat')

    // 3. Dumbbell Overhead Press -> MMjBnEBnZKM (NOT Scaption)
    const dbShoulderPress = resolveExerciseVideoEmbed('Seated Dumbbell Overhead Shoulder Press (Strength 3A)', null)
    expect(dbShoulderPress.embedUrl).toContain('MMjBnEBnZKM')
    expect(dbShoulderPress.sourceTitle).toContain('NASM Edge · Dumbbell Overhead Press')

    // 4. Barbell Bent-Over Row -> bm0_q9bR_HA (NOT Cable Row)
    const bbRow = resolveExerciseVideoEmbed('Barbell Bent-Over Row (Overhand Grip)', null)
    expect(bbRow.embedUrl).toContain('bm0_q9bR_HA')
    expect(bbRow.sourceTitle).toContain('NASM Edge · Barbell Bent-Over Row')

    // 5. Incline Dumbbell Bench Press -> _NrQUYg7Nlc
    const incDbBench = resolveExerciseVideoEmbed('Incline Dumbbell Bench Press', null)
    expect(incDbBench.embedUrl).toContain('_NrQUYg7Nlc')
    expect(incDbBench.sourceTitle).toContain('NASM Edge · Incline Dumbbell Bench Press')

    // 6. Incline Dumbbell Biceps Curl -> 0dT4L6Lsi80 (NOT Preacher Curl)
    const incCurl = resolveExerciseVideoEmbed('Incline Dumbbell Biceps Curl', null)
    expect(incCurl.embedUrl).toContain('0dT4L6Lsi80')
    expect(incCurl.sourceTitle).toContain('Incline Dumbbell')

    // 7. Dumbbell Walking Lunges -> UInwcEa5BH4
    const lunges = resolveExerciseVideoEmbed('Dumbbell Walking Lunges', null)
    expect(lunges.embedUrl).toContain('UInwcEa5BH4')
    expect(lunges.sourceTitle).toContain('Lunges')

    // 8. Dumbbell Romanian Deadlift -> V8Hdl1FiNt4
    const dbRdl = resolveExerciseVideoEmbed('Single-Leg Romanian Deadlift (Dumbbell)', null)
    expect(dbRdl.embedUrl).toContain('6pEL3KxnlEo')
    expect(dbRdl.sourceTitle).toContain('NASM Edge · Single-Leg Romanian Deadlift')

    // 9. Scaption -> PKjDGnwpB_o
    const scaption = resolveExerciseVideoEmbed('Scaption', null)
    expect(scaption.embedUrl).toContain('PKjDGnwpB_o')
    expect(scaption.externalUrl).toContain('PKjDGnwpB_o')

    // 10. Squat to Overhead Reach & Scaption -> PKjDGnwpB_o
    const squatReach = resolveExerciseVideoEmbed('Squat to Overhead Reach & Scaption', null)
    expect(squatReach.embedUrl).toContain('PKjDGnwpB_o')
    expect(squatReach.externalUrl).toContain('PKjDGnwpB_o')

    // 11. Single-Leg Single-Arm Scaption -> ikMg_3_jAWE
    const singleArmScaption = resolveExerciseVideoEmbed('Single-Leg Single-Arm Scaption', null)
    expect(singleArmScaption.embedUrl).toContain('ikMg_3_jAWE')
    expect(singleArmScaption.videoId).toBe('ikMg_3_jAWE')
  })

  it('enrichExerciseMedia attaches official embedUrl, videoUrl, and high-fidelity image', () => {
    const raw = { name: 'Dumbbell Hammer Curl' }
    const enriched = enrichExerciseMedia(raw)

    expect(enriched.videoUrl).toContain('nL3SedGG7X0')
    expect(enriched.embedUrl).toContain('nL3SedGG7X0')
    expect(enriched.imageUrl).toBeTruthy()
  })

  it('resolves BOSU Balance Trainer movement videos with exact embeds and thumbnails', () => {
    const pushup = resolveExerciseVideoEmbed('BOSU Push-Up', null)
    expect(pushup.videoId).toBe('Wo3viNH3E1c')
    expect(pushup.embedUrl).toContain('Wo3viNH3E1c')
    expect(pushup.sourceTitle).toContain('BOSU® Official')

    const squat = resolveExerciseVideoEmbed('BOSU Dome Squat', null)
    expect(squat.videoId).toBe('evJOL2cdmt4')
    expect(squat.sourceTitle).toContain('BOSU® Official')

    const plank = resolveExerciseVideoEmbed('BOSU Plank (Forearms on Dome)', null)
    expect(plank.videoId).toBe('C_NM5IbRlqM')
    expect(plank.sourceTitle).toContain('BOSU® Official')

    const enriched = enrichExerciseMedia({ name: 'BOSU Mountain Climbers' })
    expect(enriched.videoUrl).toContain('iyZHqgsI4Zk')
    expect(enriched.imageUrl).toContain('iyZHqgsI4Zk')
  })

  it('resolves TheraBand Pro Series SCP Stability Ball movement videos with exact embeds and thumbnails', () => {
    const chestPress = resolveExerciseVideoEmbed('Stability Ball Dumbbell Chest Press', null)
    expect(chestPress.videoId).toBe('FfTyQAYrnqM')
    expect(chestPress.embedUrl).toContain('FfTyQAYrnqM')
    expect(chestPress.sourceTitle).toContain('TheraBand® Official')

    const proneWY = resolveExerciseVideoEmbed('Stability Ball Scapular Triad', null)
    expect(proneWY.videoId).toBe('j6D0V742sT8')
    expect(proneWY.sourceTitle).toContain('TheraBand® Official')

    const crunch = resolveExerciseVideoEmbed('Stability Ball Crunch', null)
    expect(crunch.videoId).toBe('QFLftqPWjoI')
    expect(crunch.sourceTitle).toContain('NASM Edge')

    const enriched = enrichExerciseMedia({ name: 'Stability Ball Hamstring Curl' })
    expect(enriched.videoUrl).toContain('Z3cY3d3BBo4')
    expect(enriched.imageUrl).toContain('Z3cY3d3BBo4')
  })
})
