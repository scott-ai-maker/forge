/**
 * Forge Athletic — Coach Gordon Cardio Voiceover Audio Coordinator
 * 
 * Manages zero-latency audio playback, ElevenLabs streaming & pre-fetching,
 * lock-screen MediaSession updates, and Web Speech API fallbacks for live cardio sessions.
 */

import {
  COACH_GORDON_VOICE_ID,
  preloadedAudioBlobUrls,
  sanitizeCoachSpeechText,
  speakCoachVoiceCue,
  speakWebSpeechCoachVoiceCue,
  stopCoachVoiceCue,
} from './coach-voice-synthesizer'
import { getRandomSwiftKick } from './coach-cardio-engine'
import {
  playPrecisionTone,
  playCountdownPip,
  getSharedAudioContext,
  configureAudioSession,
} from './web-audio-cadence-engine'

export interface CardioVoiceCueOptions {
  voiceId?: string
  volume?: number
  onStart?: () => void
  onEnded?: () => void
  priority?: 'high' | 'normal'
}

let activeCardioAudio: HTMLAudioElement | null = null
let activeBufferSource: AudioBufferSourceNode | null = null
let activeGainNode: GainNode | null = null

export const preloadedAudioBuffers = new Map<string, AudioBuffer>()

/**
 * Configures the W3C Audio Session API (supported on iOS Safari 16.4+, iPadOS, macOS)
 * to ensure web audio cues duck background music rather than pausing it.
 */
export function configureCardioAudioSession(type: 'transient' | 'ambient' | 'playback' = 'transient'): void {
  configureAudioSession(type)
}

/**
 * Safely decodes an ArrayBuffer into an AudioBuffer using the shared AudioContext.
 */
async function decodeAudioBufferSafely(ctx: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const copy = arrayBuffer.slice(0)
      const res = ctx.decodeAudioData(
        copy,
        decoded => resolve(decoded),
        err => reject(err)
      )
      if (res && typeof (res as Promise<AudioBuffer>).then === 'function') {
        (res as Promise<AudioBuffer>).then(resolve).catch(reject)
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Pre-fetches an audio cue via ElevenLabs TTS to ensure zero-latency transition cues during workouts.
 * Decodes to AudioBuffer when AudioContext is available for instant non-exclusive playback.
 */
export async function prefetchCardioCue(text: string, voiceId: string = COACH_GORDON_VOICE_ID): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const cleanText = sanitizeCoachSpeechText(text)
  if (!cleanText) return null

  const targetVoiceId = voiceId || COACH_GORDON_VOICE_ID
  const cacheKey = `${targetVoiceId}_${cleanText}`
  if (preloadedAudioBlobUrls.has(cacheKey)) {
    return preloadedAudioBlobUrls.get(cacheKey)!
  }

  try {
    const res = await fetch('/api/coach/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        voiceId: targetVoiceId,
      }),
    })

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('audio/')) {
      const arrayBuffer = await res.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: contentType })
      const objectUrl = URL.createObjectURL(blob)
      preloadedAudioBlobUrls.set(cacheKey, objectUrl)

      // Decode into Web Audio buffer for instant zero-latency playback
      const ctx = getSharedAudioContext()
      if (ctx) {
        try {
          const buffer = await decodeAudioBufferSafely(ctx, arrayBuffer)
          preloadedAudioBuffers.set(cacheKey, buffer)
        } catch {
          // Ignore decoding errors during prefetch
        }
      }

      return objectUrl
    }
  } catch {
    // Ignore prefetch network errors; fallback will handle on playback
  }

  return null
}

/**
 * Pre-fetches an array of upcoming interval cues.
 */
export async function prefetchCardioSessionCues(cues: string[], voiceId: string = COACH_GORDON_VOICE_ID): Promise<void> {
  if (typeof window === 'undefined') return
  const targetVoiceId = voiceId || COACH_GORDON_VOICE_ID
  const promises = cues.filter(Boolean).slice(0, 8).map(cue => prefetchCardioCue(cue, targetVoiceId))
  await Promise.allSettled(promises)
}

/**
 * Stops any actively playing cardio voice cue.
 */
export function stopCardioVoiceCue(): void {
  if (typeof window === 'undefined') return

  if (activeBufferSource) {
    try {
      activeBufferSource.stop()
      activeBufferSource.disconnect()
    } catch {
      // Ignore audio stop error
    }
    activeBufferSource = null
  }

  if (activeGainNode) {
    try {
      activeGainNode.disconnect()
    } catch {
      // Ignore gain disconnect error
    }
    activeGainNode = null
  }

  if (activeCardioAudio) {
    try {
      activeCardioAudio.pause()
      activeCardioAudio.currentTime = 0
    } catch {
      // Ignore audio element stop error
    }
    activeCardioAudio = null
  }

  stopCoachVoiceCue()
}

/**
 * Plays a Coach Gordon cardio voice cue using ElevenLabs neural audio with client-side caching,
 * AudioContext non-exclusive playback with automatic background music ducking,
 * and graceful fallback to Web Speech API.
 */
export async function playCardioVoiceCue(
  text: string,
  options: CardioVoiceCueOptions = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const cleanText = sanitizeCoachSpeechText(text)
  if (!cleanText) return false

  // Stop any currently playing cue
  stopCardioVoiceCue()

  // Ensure AudioSession is configured to 'transient' (duck background music)
  configureCardioAudioSession('transient')

  const targetVoiceId = options.voiceId || COACH_GORDON_VOICE_ID
  const cacheKey = `${targetVoiceId}_${cleanText}`
  const ctx = getSharedAudioContext()

  // ── Primary Path: Web Audio API (Non-exclusive audio graph, ducks background music without halting Spotify) ──
  if (ctx) {
    try {
      let audioBuffer = preloadedAudioBuffers.get(cacheKey)

      if (!audioBuffer) {
        let arrayBuffer: ArrayBuffer | null = null
        const cachedBlobUrl = preloadedAudioBlobUrls.get(cacheKey)

        if (cachedBlobUrl) {
          const blobRes = await fetch(cachedBlobUrl)
          arrayBuffer = await blobRes.arrayBuffer()
        } else {
          const ttsUrl = `/api/coach/tts?text=${encodeURIComponent(cleanText)}&voiceId=${encodeURIComponent(targetVoiceId)}`
          const res = await fetch(ttsUrl)
          if (res.ok) {
            arrayBuffer = await res.arrayBuffer()
          }
        }

        if (arrayBuffer) {
          audioBuffer = await decodeAudioBufferSafely(ctx, arrayBuffer)
          preloadedAudioBuffers.set(cacheKey, audioBuffer)
        }
      }

      if (audioBuffer) {
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }

        const source = ctx.createBufferSource()
        source.buffer = audioBuffer

        const gainNode = ctx.createGain()
        gainNode.gain.setValueAtTime(options.volume ?? 1.0, ctx.currentTime)

        source.connect(gainNode)
        gainNode.connect(ctx.destination)

        activeBufferSource = source
        activeGainNode = gainNode

        options.onStart?.()

        source.onended = () => {
          if (activeBufferSource === source) {
            activeBufferSource = null
            activeGainNode = null
          }
          options.onEnded?.()
        }

        source.start(0)
        return true
      }
    } catch {
      // Fall through to HTMLAudioElement or Web Speech
    }
  }

  // ── Fallback Path: HTMLAudioElement with transient AudioSession ──
  const cachedBlobUrl = preloadedAudioBlobUrls.get(cacheKey)
  const audioSrc =
    cachedBlobUrl ||
    `/api/coach/tts?text=${encodeURIComponent(cleanText)}&voiceId=${encodeURIComponent(targetVoiceId)}`

  try {
    const audio = new Audio(audioSrc)
    audio.volume = options.volume ?? 1.0
    activeCardioAudio = audio

    audio.onplay = () => {
      options.onStart?.()
    }

    audio.onended = () => {
      if (activeCardioAudio === audio) {
        activeCardioAudio = null
      }
      options.onEnded?.()
    }

    audio.onerror = () => {
      if (activeCardioAudio === audio) {
        activeCardioAudio = null
      }
      // Graceful fallback to client Web Speech API
      speakWebSpeechCoachVoiceCue(cleanText, {
        volume: options.volume,
        rate: 1.05,
        pitch: 0.94,
        onStart: options.onStart,
        onEnded: options.onEnded,
      })
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      await playPromise
      return true
    }
  } catch {
    // If Audio element fails, use Web Speech API
    speakWebSpeechCoachVoiceCue(cleanText, {
      volume: options.volume,
      rate: 1.05,
      pitch: 0.94,
      onStart: options.onStart,
      onEnded: options.onEnded,
    })
    return false
  }

  return false
}

/**
 * Spontaneously fires a Coach Gordon "Swift Kick in the Butt" audio cue for instant motivation.
 */
export async function playSpontaneousSwiftKick(options: CardioVoiceCueOptions = {}): Promise<string> {
  const kickText = getRandomSwiftKick()
  await playCardioVoiceCue(kickText, options)
  return kickText
}

/**
 * Updates mobile lock-screen & Apple Watch MediaSession telemetry for cardio sessions.
 * When `allowLockScreenControl` is false (default during Music Ducking mode), it avoids
 * setting playback action handlers that evict Spotify or Apple Music from the lock screen.
 */
export function updateCardioMediaSession(params: {
  patternName: string
  segmentTitle: string
  targetRpe: number
  elapsedSeconds: number
  totalSeconds: number
  allowLockScreenControl?: boolean
  onPause?: () => void
  onResume?: () => void
  onNextInterval?: () => void
}): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return

  try {
    // If lock-screen control is disabled (e.g. user is listening to background music),
    // do NOT set metadata or action handlers so Spotify/Apple Music retains the lock screen!
    if (params.allowLockScreenControl === false) {
      return
    }

    const mm = Math.floor(params.elapsedSeconds / 60)
    const ss = (params.elapsedSeconds % 60).toString().padStart(2, '0')

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${params.patternName} (RPE ${params.targetRpe})`,
      artist: `Coach Gordon in Your Ear · ${params.segmentTitle}`,
      album: `Forge Athletic (${mm}:${ss})`,
      artwork: [
        { src: '/brand/gaa-crest-gold.png', sizes: '512x512', type: 'image/png' },
      ],
    })

    if (params.onPause) {
      navigator.mediaSession.setActionHandler('pause', params.onPause)
    }
    if (params.onResume) {
      navigator.mediaSession.setActionHandler('play', params.onResume)
    }
    if (params.onNextInterval) {
      navigator.mediaSession.setActionHandler('nexttrack', params.onNextInterval)
    }
  } catch {
    // Ignore media session errors on unsupported browsers
  }
}

/**
 * Cleanly releases lock-screen MediaSession metadata and action handlers.
 */
export function clearCardioMediaSession(): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return

  try {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.setActionHandler('pause', null)
    navigator.mediaSession.setActionHandler('play', null)
    navigator.mediaSession.setActionHandler('nexttrack', null)
  } catch {
    // Ignore media session cleanup errors
  }
}

/**
 * Synthesizes acoustic countdown pips for the final 3 seconds (3, 2, 1) of an interval.
 */
export function playIntervalTransitionPip(secondsRemaining: number): void {
  if (secondsRemaining <= 3 && secondsRemaining >= 1) {
    playCountdownPip(secondsRemaining)
  }
}

/**
 * Plays a resonant athletic chime marking the immediate launch of a work or recovery interval.
 */
export function playIntervalBell(isWork: boolean): void {
  const freq = isWork ? 880 : 587.33 // A5 (high energy) for work, D5 (calm) for recovery
  playPrecisionTone({
    freq,
    duration: 0.35,
    type: 'triangle',
    gainPeak: 0.25,
  })
}


