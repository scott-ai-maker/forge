import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  prefetchCardioCue,
  prefetchCardioSessionCues,
  stopCardioVoiceCue,
  playCardioVoiceCue,
  playSpontaneousSwiftKick,
  configureCardioAudioSession,
  clearCardioMediaSession,
  updateCardioMediaSession,
  preloadedAudioBuffers,
} from './coach-cardio-voiceover'

describe('coach-cardio-voiceover', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('safely handles prefetchCardioCue in node environment', async () => {
    const result = await prefetchCardioCue('Test cue')
    expect(result).toBeNull()
  })

  it('safely handles prefetchCardioSessionCues without error', async () => {
    await expect(prefetchCardioSessionCues(['Cue 1', 'Cue 2'])).resolves.toBeUndefined()
  })

  it('safely calls stopCardioVoiceCue without throwing', () => {
    expect(() => stopCardioVoiceCue()).not.toThrow()
  })

  it('returns false gracefully when playing in node environment', async () => {
    const played = await playCardioVoiceCue('Test voice cue')
    expect(played).toBe(false)
  })

  it('returns a non-empty swift kick text string', async () => {
    const kick = await playSpontaneousSwiftKick()
    expect(typeof kick).toBe('string')
    expect(kick.length).toBeGreaterThan(10)
  })

  it('safely configures audio session without throwing in node environment', () => {
    expect(() => configureCardioAudioSession('transient')).not.toThrow()
    expect(() => configureCardioAudioSession('ambient')).not.toThrow()
    expect(() => configureCardioAudioSession('playback')).not.toThrow()
  })

  it('safely calls clearCardioMediaSession without throwing', () => {
    expect(() => clearCardioMediaSession()).not.toThrow()
  })

  it('safely calls updateCardioMediaSession with allowLockScreenControl false', () => {
    expect(() =>
      updateCardioMediaSession({
        patternName: 'Zone 2 Base',
        segmentTitle: 'Aerobic Build',
        targetRpe: 4,
        elapsedSeconds: 120,
        totalSeconds: 1200,
        allowLockScreenControl: false,
      })
    ).not.toThrow()
  })

  it('maintains preloadedAudioBuffers map instance', () => {
    expect(preloadedAudioBuffers).toBeInstanceOf(Map)
  })
})

