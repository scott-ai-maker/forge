import { describe, it, expect } from 'vitest'
import { inferLiftTypeFromFileName } from '@/components/fitness/VideoCritiqueStudio'
import { parseYouTubeVideoUrl, analyzeLiftForm } from '@/lib/video-form-analysis'

describe('VideoCritiqueStudio YouTube Integration & Biomechanical Analysis', () => {
  it('correctly maps uploaded filenames to appropriate compound lift types', () => {
    expect(inferLiftTypeFromFileName('squat_pr_315.mp4')).toBe('barbell_back_squat')
    expect(inferLiftTypeFromFileName('deadlift_heavy_triples.mov')).toBe('barbell_deadlift')
    expect(inferLiftTypeFromFileName('bench_press_set1.webm')).toBe('barbell_bench_press')
    expect(inferLiftTypeFromFileName('ohp_strict_press.mp4')).toBe('overhead_press')
    expect(inferLiftTypeFromFileName('barbell_row_back_angle.m4v')).toBe('barbell_row')
    expect(inferLiftTypeFromFileName('romanian_deadlift_tempo.mov')).toBe('romanian_deadlift')
    expect(inferLiftTypeFromFileName('misc_gym_footage.mp4')).toBeNull()
  })

  it('validates and parses diverse client YouTube video link formats', () => {
    const watchLink = 'https://www.youtube.com/watch?v=bEv6CCg2BC8'
    const parsedWatch = parseYouTubeVideoUrl(watchLink)
    expect(parsedWatch).not.toBeNull()
    expect(parsedWatch?.videoId).toBe('bEv6CCg2BC8')
    expect(parsedWatch?.isShort).toBe(false)
    expect(parsedWatch?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/bEv6CCg2BC8')

    const shortLink = 'https://youtu.be/op9kVnSso6Q?t=30'
    const parsedShort = parseYouTubeVideoUrl(shortLink)
    expect(parsedShort).not.toBeNull()
    expect(parsedShort?.videoId).toBe('op9kVnSso6Q')
    expect(parsedShort?.startTime).toBe(30)
    expect(parsedShort?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/op9kVnSso6Q?start=30')

    const shortsVertical = 'https://youtube.com/shorts/dQw4w9WgXcQ'
    const parsedShorts = parseYouTubeVideoUrl(shortsVertical)
    expect(parsedShorts).not.toBeNull()
    expect(parsedShorts?.videoId).toBe('dQw4w9WgXcQ')
    expect(parsedShorts?.isShort).toBe(true)
  })

  it('attaches YouTube metadata and videoUrl to generated form critique', () => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=bEv6CCg2BC8'
    const critique = analyzeLiftForm({
      liftType: 'barbell_back_squat',
      loadLbs: 315,
      repsCount: 5,
      observedDeviations: [],
      videoUrl: youtubeUrl,
      videoSourceType: 'youtube',
    })

    expect(critique.videoSourceType).toBe('youtube')
    expect(critique.youtubeVideoId).toBe('bEv6CCg2BC8')
    expect(critique.videoUrl).toBe(youtubeUrl)
    expect(critique.overallFormScore).toBe(100)
    expect(critique.rating).toBe('Mastery')
  })

  it('generates shareable critique summary containing Forge Athletic branding and YouTube link', () => {
    const critique = analyzeLiftForm({
      liftType: 'barbell_deadlift',
      loadLbs: 405,
      repsCount: 3,
      observedDeviations: ['lumbar_rounding'],
      videoUrl: 'https://youtu.be/op9kVnSso6Q',
      videoSourceType: 'youtube',
    })

    const videoLine = critique.videoUrl ? `\nVideo Footage: ${critique.videoUrl}` : ''
    const shareText = `🏋️ Forge Athletic Biomechanical Form Critique\nLift: ${critique.liftName} (${critique.loadLbs ? `${critique.loadLbs} lbs x ` : ''}${critique.repsObserved} reps)\nForm Score: ${critique.overallFormScore}/100 · ${critique.rating}${videoLine}\n\nMaster Coach Summary: ${critique.masterCoachSummary}`

    expect(shareText).toContain('Forge Athletic Biomechanical Form Critique')
    expect(shareText).toContain('Lift: Barbell Conventional Deadlift (405 lbs x 3 reps)')
    expect(shareText).toContain('Video Footage: https://youtu.be/op9kVnSso6Q')
    expect(shareText).not.toContain('GAA')
    expect(shareText).not.toContain('Gordon Athletic Advisory')
  })
})
