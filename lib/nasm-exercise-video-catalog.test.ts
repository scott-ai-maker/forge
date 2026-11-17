import { describe, it, expect } from 'vitest'
import { resolveExerciseVideoEmbed, extractYouTubeVideoId, enrichExerciseMedia } from './nasm-exercise-video-catalog'

describe('Master 1-to-1 Forge Athletic Studio Exercise Video Resolver', () => {
  it('extracts YouTube video IDs correctly from legacy formats when needed for migration stripping', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=yPqv3ejnZvc')).toBe('yPqv3ejnZvc')
    expect(extractYouTubeVideoId('https://youtu.be/hbw7hdyOpq0')).toBe('hbw7hdyOpq0')
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/7NUICnha_Hk')).toBe('7NUICnha_Hk')
    expect(extractYouTubeVideoId(null)).toBeNull()
  })

  it('resolves exact 1-to-1 sovereign Forge Athletic Studio MP4 videos without mismatching variations or leaking YouTube URLs', () => {
    const flatBench = resolveExerciseVideoEmbed('Barbell Flat Bench Press (Strength 1A)', null)
    expect(flatBench.embedUrl).toBe('/videos/exercises/barbell-bench-press.mp4')
    expect(flatBench.sourceTitle).toContain('Forge Athletic Studio · Barbell Bench Press')
    expect(flatBench.videoId).toBeNull()

    const backSquat = resolveExerciseVideoEmbed('Barbell Back Squat (Strength 1A)', null)
    expect(backSquat.embedUrl).toBe('/videos/exercises/barbell-back-squat.mp4')
    expect(backSquat.sourceTitle).toContain('Forge Athletic Studio · Barbell Back Squat')

    const dbShoulderPress = resolveExerciseVideoEmbed('Seated Dumbbell Overhead Shoulder Press (Strength 3A)', null)
    expect(dbShoulderPress.embedUrl).toBe('/videos/exercises/dumbbell-overhead-press.mp4')
    expect(dbShoulderPress.sourceTitle).toContain('Forge Athletic Studio · Dumbbell Overhead Press')

    const bbRow = resolveExerciseVideoEmbed('Barbell Bent-Over Row (Overhand Grip)', null)
    expect(bbRow.embedUrl).toBe('/videos/exercises/barbell-bent-over-row-pronated.mp4')
    expect(bbRow.sourceTitle).toContain('Forge Athletic Studio · Barbell Bent-Over Row')

    const incDbBench = resolveExerciseVideoEmbed('Incline Dumbbell Bench Press', null)
    expect(incDbBench.embedUrl).toBe('/videos/exercises/incline-dumbbell-bench-press.mp4')
    expect(incDbBench.sourceTitle).toContain('Forge Athletic Studio · Incline Dumbbell Bench Press')

    const incCurl = resolveExerciseVideoEmbed('Incline Dumbbell Biceps Curl', null)
    expect(incCurl.embedUrl).toBe('/videos/exercises/incline-dumbbell-curl.mp4')
    expect(incCurl.sourceTitle).toContain('Incline Dumbbell')

    const lunges = resolveExerciseVideoEmbed('Dumbbell Walking Lunges', null)
    expect(lunges.embedUrl).toBe('/videos/exercises/lunge-to-balance.mp4')
    expect(lunges.sourceTitle).toContain('Lunges')

    const dbRdl = resolveExerciseVideoEmbed('Single-Leg Romanian Deadlift (Dumbbell)', null)
    expect(dbRdl.embedUrl).toBe('/videos/exercises/single-leg-romanian-deadlift.mp4')
    expect(dbRdl.sourceTitle).toContain('Forge Athletic Studio · Single-Leg Romanian Deadlift')

    const scaption = resolveExerciseVideoEmbed('Scaption', null)
    expect(scaption.embedUrl).toBe('/videos/exercises/single-leg-scaption.mp4')
    expect(scaption.externalUrl).toBe('/videos/exercises/single-leg-scaption.mp4')

    const squatReach = resolveExerciseVideoEmbed('Squat to Overhead Reach & Scaption', null)
    expect(squatReach.embedUrl).toBe('/videos/exercises/squat-to-overhead-reach.mp4')
    expect(squatReach.externalUrl).toBe('/videos/exercises/squat-to-overhead-reach.mp4')

    const singleArmScaption = resolveExerciseVideoEmbed('Single-Leg Single-Arm Scaption', null)
    expect(singleArmScaption.embedUrl).toBe('/videos/exercises/single-leg-single-arm-scaption.mp4')
    expect(singleArmScaption.videoId).toBeNull()
  })

  it('enrichExerciseMedia attaches sovereign first-party MP4 embedUrl, videoUrl, and studio image while stripping YouTube overrides', () => {
    const raw = {
      name: 'Dumbbell Hammer Curl',
      imageUrl: 'https://img.youtube.com/vi/nL3SedGG7X0/hqdefault.jpg',
    }
    const enriched = enrichExerciseMedia(raw)

    expect(enriched.videoUrl).toBe('/videos/exercises/dumbbell-hammer-curl.mp4')
    expect(enriched.embedUrl).toBe('/videos/exercises/dumbbell-hammer-curl.mp4')
    expect(enriched.imageUrl).toBe('/images/exercises/dumbbell-hammer-curl.jpg')
    expect(enriched.imageUrl).not.toContain('youtube')
  })

  it('resolves Forge Athletic Studio movement videos with exact first-party paths and attribution', () => {
    const crunch = resolveExerciseVideoEmbed('Stability Ball Crunch', null)
    expect(crunch.embedUrl).toBe('/videos/exercises/ball-crunch.mp4')
    expect(crunch.sourceTitle).toContain('Forge Athletic Studio')
    expect(crunch.sourceTitle).not.toContain('NASM Edge')

    const hamstringCurl = resolveExerciseVideoEmbed('Stability Ball Hamstring Curl', null)
    expect(hamstringCurl.embedUrl).toBe('/videos/exercises/floor-bridge.mp4')
    expect(hamstringCurl.sourceTitle).toContain('Forge Athletic Studio')

    const enriched = enrichExerciseMedia({ name: 'Stability Ball Hamstring Curl' })
    expect(enriched.videoUrl).toBe('/videos/exercises/floor-bridge.mp4')
    expect(enriched.imageUrl).toBe('/images/exercises/floor-bridge.jpg')
  })

  it('resolves Single-Leg Phase 1 upper body movements and automatically upgrades stale YouTube URLs to studio MP4s', () => {
    const press = resolveExerciseVideoEmbed('Single-Leg Dumbbell Overhead Press', null)
    expect(press.embedUrl).toBe('/videos/exercises/single-leg-dumbbell-overhead-press.mp4')

    const tubingPress = resolveExerciseVideoEmbed('Single-Leg Standing Tubing Overhead Press', null)
    expect(tubingPress.embedUrl).toBe('/videos/exercises/dumbbell-overhead-press.mp4')

    const row = resolveExerciseVideoEmbed('Single-Leg Dumbbell Bent Over Row', null)
    expect(row.embedUrl).toBe('/videos/exercises/dumbbell-bent-over-row.mp4')

    const tubingRow = resolveExerciseVideoEmbed('Single-Leg Standing Tubing Row', null)
    expect(tubingRow.embedUrl).toBe('/videos/exercises/standing-tubing-row.mp4')

    const ext = resolveExerciseVideoEmbed('Single-Leg Dumbbell Bent-Over Extension', null)
    expect(ext.embedUrl).toBe('/videos/exercises/supported-bent-over-dumbbell-extension.mp4')

    const dbExt = resolveExerciseVideoEmbed('Dumbbell Bent-Over Extension', null)
    expect(dbExt.embedUrl).toBe('/videos/exercises/dumbbell-bent-over-extension.mp4')

    // Stale YouTube videoUrl override is superseded by sovereign first-party studio MP4
    const dbExtStale = resolveExerciseVideoEmbed('Dumbbell Bent-Over Extension', 'https://www.youtube.com/watch?v=kZ-ReOdn2qk')
    expect(dbExtStale.embedUrl).toBe('/videos/exercises/dumbbell-bent-over-extension.mp4')
    expect(dbExtStale.embedUrl).not.toContain('youtube')
    expect(dbExtStale.videoId).toBeNull()
  })
})
