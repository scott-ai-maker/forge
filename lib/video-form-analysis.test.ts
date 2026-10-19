import { describe, expect, it } from 'vitest'
import { analyzeLiftForm, LIFT_METADATA, parseYouTubeVideoUrl } from './video-form-analysis'

describe('video-form-analysis', () => {
  it('analyzes flawless squat execution with mastery rating', () => {
    const analysis = analyzeLiftForm({
      liftType: 'barbell_back_squat',
      loadLbs: 275,
      repsCount: 5,
      observedDeviations: [],
    })

    expect(analysis.overallFormScore).toBe(100)
    expect(analysis.rating).toBe('Mastery')
    expect(analysis.primaryFault).toBeNull()
    expect(analysis.checkpoints.length).toBeGreaterThan(0)
    expect(analysis.checkpoints.every(c => c.status === 'optimal')).toBe(true)
  })

  it('detects knee valgus on back squat and flags overactive TFL/adductors', () => {
    const analysis = analyzeLiftForm({
      liftType: 'barbell_back_squat',
      loadLbs: 315,
      observedDeviations: ['knee_valgus', 'excessive_forward_lean'],
    })

    expect(analysis.overallFormScore).toBeLessThan(80)
    expect(analysis.rating).toBe('Needs Recalibration')
    const valgusCheckpoint = analysis.checkpoints.find(c => c.name.includes('Knee Tracking'))
    expect(valgusCheckpoint).toBeDefined()
    expect(valgusCheckpoint?.status).toBe('severe_fault')
    expect(valgusCheckpoint?.impairedMuscles?.overactive).toContain('Tensor Fasciae Latae (TFL)')
    expect(valgusCheckpoint?.impairedMuscles?.underactive).toContain('Gluteus Medius')
  })

  it('detects lumbar rounding on deadlift and prescribes spinal lat cues', () => {
    const analysis = analyzeLiftForm({
      liftType: 'barbell_deadlift',
      loadLbs: 405,
      observedDeviations: ['lumbar_rounding'],
    })

    expect(analysis.overallFormScore).toBe(75)
    expect(analysis.checkpoints.some(c => c.name.includes('Spinal Neutrality'))).toBe(true)
    expect(analysis.prescribedCorrectiveContinuum.inhibit.length).toBeGreaterThan(0)
    expect(analysis.prescribedCorrectiveContinuum.activate.length).toBeGreaterThan(0)
  })

  it('has metadata defined for all supported compound lifts', () => {
    expect(LIFT_METADATA.barbell_back_squat.name).toBe('Barbell Back Squat')
    expect(LIFT_METADATA.barbell_deadlift.focusJoints.length).toBeGreaterThan(2)
    expect(LIFT_METADATA.barbell_bench_press.primaryPrimeMover).toContain('Pectoralis Major')
  })

  describe('parseYouTubeVideoUrl & Video Sharing', () => {
    it('parses standard desktop YouTube watch URLs', () => {
      const parsed = parseYouTubeVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(parsed).not.toBeNull()
      expect(parsed?.videoId).toBe('dQw4w9WgXcQ')
      expect(parsed?.isShort).toBe(false)
      expect(parsed?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
      expect(parsed?.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    })

    it('parses mobile youtu.be links with start timestamp', () => {
      const parsed = parseYouTubeVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=45s')
      expect(parsed).not.toBeNull()
      expect(parsed?.videoId).toBe('dQw4w9WgXcQ')
      expect(parsed?.startTime).toBe(45)
      expect(parsed?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=45')
      expect(parsed?.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45')
    })

    it('parses vertical YouTube Shorts URLs', () => {
      const parsed = parseYouTubeVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')
      expect(parsed).not.toBeNull()
      expect(parsed?.videoId).toBe('dQw4w9WgXcQ')
      expect(parsed?.isShort).toBe(true)
      expect(parsed?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    })

    it('parses raw 11-character video IDs and handles timestamps', () => {
      const parsed = parseYouTubeVideoUrl('dQw4w9WgXcQ')
      expect(parsed).not.toBeNull()
      expect(parsed?.videoId).toBe('dQw4w9WgXcQ')
    })

    it('returns null for non-YouTube or invalid URLs', () => {
      expect(parseYouTubeVideoUrl('https://vimeo.com/123456')).toBeNull()
      expect(parseYouTubeVideoUrl('not-a-url')).toBeNull()
      expect(parseYouTubeVideoUrl(null)).toBeNull()
      expect(parseYouTubeVideoUrl('')).toBeNull()
    })

    it('attaches parsed YouTube metadata to critique analysis output', () => {
      const analysis = analyzeLiftForm({
        liftType: 'barbell_back_squat',
        loadLbs: 315,
        videoUrl: 'https://youtu.be/dQw4w9WgXcQ?t=20',
      })

      expect(analysis.videoUrl).toBe('https://youtu.be/dQw4w9WgXcQ?t=20')
      expect(analysis.videoSourceType).toBe('youtube')
      expect(analysis.youtubeVideoId).toBe('dQw4w9WgXcQ')
    })
  })
})


