import { beforeEach, describe, expect, it } from 'vitest'
import { isSfxMuted, setSfxMuted } from '@/lib/sfx-audio'
import { truncateSpeechAtSentenceBoundary } from '@/lib/coach-voice-synthesizer'
import {
  VoicePlaybackQueueController,
  buildAutoRegressionBriefing,
  buildPostScanDiagnosticSummary,
  buildPreWorkoutPersonalBriefing,
  computeVoiceCacheHash,
  getCoachAudioMode,
  normalizeVoiceTextForHash,
  setCoachAudioMode,
  staticCueMap,
  type StaticCoachCueKey,
} from './coachVoiceEngine'

describe('coachVoiceEngine — Hybrid ElevenLabs Voice Architecture', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear()
    }
    setCoachAudioMode('muted')
  })

  it('defaults strictly to Muted until explicit user interaction and keeps backward-compatible isSfxMuted()', () => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear()
    }
    expect(getCoachAudioMode()).toBe('muted')
    expect(isSfxMuted()).toBe(true)

    setCoachAudioMode('chimes_only')
    expect(getCoachAudioMode()).toBe('chimes_only')
    expect(isSfxMuted()).toBe(false)

    setCoachAudioMode('voice_and_chimes')
    expect(getCoachAudioMode()).toBe('voice_and_chimes')
    expect(isSfxMuted()).toBe(false)

    setSfxMuted(true)
    expect(getCoachAudioMode()).toBe('muted')
    expect(isSfxMuted()).toBe(true)
  })

  it('exposes all 9 required zero-latency static cues mapped to /audio/coach-gordon/*.mp3', () => {
    const requiredKeys: StaticCoachCueKey[] = [
      'calibration_framing',
      'calibration_locked',
      'readiness_rep_1_3',
      'tempo_3_1_1_eccentric',
      'set_complete_great_work',
      'rest_timer_10s_warning',
      'rest_timer_go',
      'desk_reset_transition',
      'safety_pause_check',
    ]

    for (const key of requiredKeys) {
      expect(staticCueMap[key]).toBeDefined()
      expect(staticCueMap[key].assetPath).toBe(`/audio/coach-gordon/${key}.mp3`)
      expect(staticCueMap[key].spokenScript.length).toBeGreaterThan(10)
    }
    expect(staticCueMap.safety_pause_check.priority).toBe('safety')
  })

  it('computes deterministic SHA-256 hashes over normalized (voice_id + text) so repeated briefings never re-fetch', async () => {
    const h1 = await computeVoiceCacheHash('  Morning Marcus — own Set 1! ', 'coach_gordon_v1')
    const h2 = await computeVoiceCacheHash('morning marcus — own set 1!', 'coach_gordon_v1')
    const hDiffVoice = await computeVoiceCacheHash('morning marcus — own set 1!', 'other_voice_id')

    expect(h1).toHaveLength(64)
    expect(h1).toBe(h2)
    expect(h1).not.toBe(hDiffVoice)
  })

  it('never overlaps two voice clips and lets safety priority preempt active playback immediately', async () => {
    const events: string[] = []
    const queue = new VoicePlaybackQueueController()

    let finishFirst!: () => void
    const firstDone = new Promise<void>(resolve => {
      finishFirst = resolve
    })

    queue.enqueue({
      id: 'clip_1',
      priority: 'normal',
      cancelActive: () => events.push('cancel:clip_1'),
      execute: async signal => {
        events.push('start:clip_1')
        await firstDone
        if (!signal.aborted) {
          events.push('end:clip_1')
        } else {
          events.push('aborted:clip_1')
        }
      },
    })

    queue.enqueue({
      id: 'clip_2',
      priority: 'normal',
      execute: async () => {
        events.push('start:clip_2')
      },
    })

    // clip_2 must wait while clip_1 is speaking (zero overlap)
    expect(events).toEqual(['start:clip_1'])

    // Enqueue a safety alert — preempts clip_1 and drops stale normal clip_2
    queue.enqueue({
      id: 'safety_alert',
      priority: 'safety',
      execute: async () => {
        events.push('start:safety_alert')
      },
    })

    expect(events).toContain('cancel:clip_1')
    finishFirst()
    await new Promise(r => setTimeout(r, 15))

    expect(events).toContain('aborted:clip_1')
    expect(events).toContain('start:safety_alert')
    expect(events).not.toContain('start:clip_2')
  })

  it('builds tailored dynamic Coach Gordon briefings across pre-workout, post-scan, and regression moments', () => {
    const lowComfortBriefing = buildPreWorkoutPersonalBriefing({
      memberFirstName: 'Marcus',
      optPhase: 2,
      jointComfortScore100: 45,
      lowestComfortRegion: 'lower back',
    })
    expect(lowComfortBriefing).toContain('Marcus')
    expect(lowComfortBriefing).toContain('lower back')

    const scanBriefing = buildPostScanDiagnosticSummary({
      scanType: 'desk_ergonomics',
      score: 74,
      primaryFinding: 'forward head drift at 19 degrees',
    })
    expect(scanBriefing).toContain('74 out of 100')
    expect(scanBriefing).toContain('forward head drift')

    const regressionBriefing = buildAutoRegressionBriefing({
      fromExercise: 'Overhead Dumbbell Press',
      toExercise: 'Landmine / High-Incline Neutral Dumbbell Press',
      tempo: '3-1-1-0',
      reason: 'Clears subacromial pinch.',
    })
    expect(regressionBriefing).toContain('Overhead Dumbbell Press')
    expect(regressionBriefing).toContain('Landmine / High-Incline Neutral Dumbbell Press')
  })

  it('preserves full multi-paragraph exercise descriptions (> 1,800 chars) without premature 1,200-char cutoff', () => {
    const fullDescription = [
      'Hey Scott! The Incline Dumbbell Bench Press is a cornerstone movement in your Phase 2 program for targeting your clavicular pectoralis major with support from your anterior deltoid and triceps.',
      'In Phase 2, dial your repetition cadence into our prescribed 2-0-2 tempo so you never rush the bottom stretch and always protect shoulder capsule integrity.',
      'Setup and Alignment: Set the bench to a 30 to 45 degree incline, plant both feet flat into the floor, retract and depress your shoulder blades into the pad, and stack your wrists directly above your elbows.',
      'Execution and Path of Motion: Lower the dumbbells with a smooth 2-second eccentric descent until the handles reach outer-chest level with elbows tucked roughly 45 degrees from your ribcage, then drive smoothly back to the top without clanging weights.',
      'Master 5 Kinetic Chain Checkpoints: Feet rooted symmetrically, knees tracking in line with toes, core braced 360 degrees with neutral lumbar curve, scapulae anchored against the pad, and chin gently tucked with neutral cervical spine.',
      'Remember our golden rule: earn the right to add load by owning the movement first. What weight are you planning for your working sets today, and does your starting setup feel 100% locked in and comfortable?',
    ].join(' ')

    expect(fullDescription.length).toBeGreaterThan(1250)
    const serverTruncated = truncateSpeechAtSentenceBoundary(fullDescription)
    expect(serverTruncated).toContain(
      'does your starting setup feel 100% locked in and comfortable?'
    )
    const normalized = normalizeVoiceTextForHash(fullDescription)
    expect(normalized).toContain('does your starting setup feel 100% locked in and comfortable?')
  })
})
