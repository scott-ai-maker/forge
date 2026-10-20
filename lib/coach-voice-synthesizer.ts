/**
 * Forge Athletic — Master Coach Voice Synthesis Engine
 * 
 * Configures authoritative, natural, and resonant voice prompts for tempo metronomes,
 * in-gym set logging, rest intervals, and daily executive briefings.
 * Prioritizes premium neural / enhanced athletic coach voices across iOS, macOS, Android, and Windows.
 */

export interface CoachVoiceOptions {
  pitch?: number
  rate?: number
  volume?: number
  interrupPrevious?: boolean
  voiceName?: string
  voiceId?: string
  forceWebSpeech?: boolean
  onStart?: () => void
  onEnded?: () => void
}

import { configureAudioSession, getSharedAudioContext } from './web-audio-cadence-engine'

let cachedCoachVoice: SpeechSynthesisVoice | null = null

const KNOWN_FEMALE_VOICE_IDENTIFIERS = [
  'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'veena', 'zira',
  'susan', 'ava', 'allison', 'catherine', 'jenny', 'aria', 'sara', 'emma',
  'serena', 'yuri', 'kyoko', 'stephanie', 'claire', 'female', 'alice', 'zoe',
  'nora', 'helena', 'monica', 'laura', 'anna', 'melina', 'paulina',
]

const MALE_COACH_NAMES = [
  'daniel', 'arthur', 'oliver', 'evan', 'alex', 'fred', 'aaron', 'nate',
  'thomas', 'gordon', 'guy', 'ryan', 'david', 'george', 'rishi', 'james',
]

let activeAudioElement: HTMLAudioElement | null = null
let activeBufferSource: AudioBufferSourceNode | null = null
let activeGainNode: GainNode | null = null
let activeUtterances: SpeechSynthesisUtterance[] = []

export const preloadedAudioBuffers = new Map<string, AudioBuffer>()

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
 * Stops all currently active neural and Web Speech coach audio playback immediately.
 */
export function stopCoachVoiceCue(): void {
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

  if (activeAudioElement) {
    try {
      activeAudioElement.pause()
      activeAudioElement.currentTime = 0
    } catch {
      // Ignore audio element pause errors
    }
    activeAudioElement = null
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      activeUtterances = []
    } catch {
      // Ignore speech synthesis cancel errors
    }
  }
}

/**
 * Sanitizes speech text to remove emojis, symbols, and formatting that synthesizers
 * mistakenly read aloud (e.g. reading "direct hit" for 🎯 or "high voltage" for ⚡).
 */
export function sanitizeCoachSpeechText(raw: string): string {
  if (!raw) return ''

  let text = raw

  // 1. Remove all Emoji characters & surrogate pairs
  // Uses Unicode Extended_Pictographic property plus common presentation sequences
  try {
    text = text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu, '')
  } catch {
    // Fallback regex for environments without unicode property escapes
    text = text.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '')
  }

  // 2. Remove explicit sports & UI symbols
  text = text.replace(/[🎯⚡💡🔊🏃🏋️🍎👑📝●·•→↔✓★▶▲▼|🛡️]/g, ' ')

  // 3. Remove Markdown bold, italics, code blocks, headers
  text = text.replace(/\*\*(.*?)\*\*/g, '$1')
  text = text.replace(/\*(.*?)\*/g, '$1')
  text = text.replace(/__(.*?)__/g, '$1')
  text = text.replace(/_(.*?)_/g, '$1')
  text = text.replace(/`{1,3}(.*?)`{1,3}/g, '$1')
  text = text.replace(/#+\s+/g, '')

  // 4. Convert abbreviations & phonetic terms for natural cadence
  text = text.replace(/\b1RM\b/gi, 'one rep max')
  text = text.replace(/\bSMR\b/gi, 'S M R')
  text = text.replace(/(\d+(?:\.\d+)?)\s*–\s*(\d+(?:\.\d+)?)/g, '$1 to $2')
  text = text.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/g, '$1 to $2')
  text = text.replace(/(\d+(?:\.\d+)?)\s*—\s*(\d+(?:\.\d+)?)/g, '$1 to $2')
  text = text.replace(/(\d+)\s*s\b/gi, '$1 seconds')
  text = text.replace(/(\d+)\s*secs?\b/gi, '$1 seconds')
  text = text.replace(/(\d+)\s*mins?\b/gi, '$1 minutes')
  text = text.replace(/\((\d+)\s*seconds\)/gi, '($1 seconds)')

  // 5. Replace colons and dashes with commas/periods for smooth speech pauses
  text = text.replace(/\b(Day \d+|Primary Focus|Target Effort|Target Intensity|Key Form Cue|Daily Briefing)\s*:\s*/gi, '$1. ')
  text = text.replace(/(\w+)\s*:\s+/g, '$1. ')
  text = text.replace(/\s*—\s*/g, ', ')
  text = text.replace(/\s*–\s*/g, ', ')

  // 6. Clean up double periods, commas, and excessive whitespace
  text = text.replace(/\s+/g, ' ')
  text = text.replace(/\s*,\s*,+/g, ',')
  text = text.replace(/\s*\.\s*\.+/g, '.')
  text = text.replace(/,\./g, '.')
  text = text.replace(/\.,/g, '.')
  text = text.trim()

  return text
}

/**
 * Scores how suitable a voice is for Coach Gordon's authoritative athletic presence.
 * Returns a score where higher is better, and negative indicates an unsuitable (e.g. female) voice.
 */
function scoreCoachVoice(v: SpeechSynthesisVoice): number {
  const name = (v.name || '').toLowerCase()
  const uri = (v.voiceURI || '').toLowerCase()
  const lang = (v.lang || '').toLowerCase()

  // Must be English
  if (!lang.startsWith('en')) return -100

  // Strictly filter known female voices
  if (KNOWN_FEMALE_VOICE_IDENTIFIERS.some(f => name.includes(f) || uri.includes(f))) {
    return -50
  }

  let score = 10

  // Enhanced / Premium / Natural neural quality
  if (name.includes('enhanced') || name.includes('premium') || name.includes('natural') || name.includes('online')) {
    score += 35
  }

  // Preferred authoritative male coach voices
  if (name.includes('daniel')) score += 60
  else if (name.includes('arthur')) score += 55
  else if (name.includes('oliver')) score += 50
  else if (name.includes('evan')) score += 48
  else if (name.includes('alex')) score += 45
  else if (name.includes('guy')) score += 42
  else if (name.includes('ryan')) score += 40
  else if (name.includes('aaron') || name.includes('fred') || name.includes('david')) score += 35
  else if (name.includes('male') || uri.includes('male')) score += 30
  else if (MALE_COACH_NAMES.some(m => name.includes(m))) score += 25

  // Preferred accents
  if (lang === 'en-us' || lang === 'en-gb') score += 10

  return score
}

/**
 * Searches and ranks the best available athletic coach voice on the client device.
 * Prioritizes deep, resonant, and natural neural speech engines (Apple Siri/Enhanced, Google Natural, Microsoft Natural).
 */
export function getAuthoritativeCoachVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null

  // If we already cached a high-scoring male coach voice, use it
  if (cachedCoachVoice) return cachedCoachVoice

  const voices = window.speechSynthesis.getVoices()
  if (!voices || voices.length === 0) return null

  // Score all available voices
  const scored = voices
    .map(v => ({ voice: v, score: scoreCoachVoice(v) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]

  // Only permanently cache if we found a verified positive-scoring male coach voice
  // AND the voice list has at least a few voices loaded.
  if (best && best.score > 0) {
    if (voices.length >= 3 || best.score >= 40) {
      cachedCoachVoice = best.voice
    }
    return best.voice
  }

  // Fallback: If no male voice passed positive score, find first English voice not explicitly female
  const nonFemaleFallback = voices.find(v => {
    const name = v.name.toLowerCase()
    const lang = (v.lang || '').toLowerCase()
    return lang.startsWith('en') && !KNOWN_FEMALE_VOICE_IDENTIFIERS.some(f => name.includes(f))
  })

  return nonFemaleFallback || voices[0] || null
}

// Early warmup on browser environments
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => {
      cachedCoachVoice = null
      getAuthoritativeCoachVoice()
    }
  } catch {
    // Ignore early initialization errors
  }
}

export const COACH_GORDON_VOICE_ID = 'UPezm4CtrvcD6aNXjeU1'
export const COACH_GORDON_ELEVENLABS_VOICE_ID = COACH_GORDON_VOICE_ID
export const preloadedAudioBlobUrls = new Map<string, string>()

/**
 * Standard recurring voice cues across workout timers, tempo metronomes, and set loggers.
 * Pre-warmed into client memory for zero-latency instant playback in Coach Gordon's authentic voice.
 */
export const COMMON_COACH_GORDON_CUES = [
  'Three',
  'Two',
  'One. Lock in!',
  'One',
  'Control down... four',
  'Hold solid!',
  'DRIVE!',
  "Rest complete! Let's get this set.",
  "Rest interval complete. Let's get this set.",
  "Rest complete. Let's get to work.",
  "Rest complete!",
  "Rest interval complete.",
  'Starting 15 second transition.',
  'Starting 30 second transition.',
  'Starting 30 second rest interval.',
  'Starting 45 second rest interval.',
  'Starting 60 second rest interval.',
  'Starting 75 second rest interval.',
  'Starting 90 second rest interval.',
  'Starting 105 second rest interval.',
  'Starting 120 second rest interval.',
  'Starting 135 second rest interval.',
  'Starting 150 second rest interval.',
  'Starting 180 second rest interval.',
  'Starting 240 second rest interval.',
  'Starting 300 second rest interval.',
  'Starting 30 second rest.',
  'Starting 45 second rest.',
  'Starting 60 second rest.',
  'Starting 75 second rest.',
  'Starting 90 second rest.',
  'Starting 120 second rest.',
  'Starting 180 second rest.',
  'Stretch hold complete!',
  'SMR rolling complete!',
  'Rack it! Outstanding set.',
  'Switch sides. Side 2.',
  'Switch sides! Now side 2.',
  'Side 1',
  'Stretch complete!',
  'Both sides complete!',
  'Switching to Side 2',
  'Warmup complete! Great work.',
  'Cool-down complete! Great work.',
]

/**
 * Pre-fetches an audio cue via ElevenLabs TTS to ensure zero-latency voice cues.
 * Decodes into Web Audio buffer when AudioContext is available for instant non-exclusive playback.
 */
export async function prefetchCoachVoiceCue(text: string, voiceId: string = COACH_GORDON_VOICE_ID): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const cleanText = sanitizeCoachSpeechText(text)
  if (!cleanText) return null

  const cacheKey = `${voiceId}_${cleanText}`
  if (preloadedAudioBlobUrls.has(cacheKey)) {
    // Ensure Web Audio buffer is also decoded into memory if not already present
    if (!preloadedAudioBuffers.has(cacheKey)) {
      const ctx = getSharedAudioContext()
      if (ctx) {
        const cachedBlobUrl = preloadedAudioBlobUrls.get(cacheKey)!
        fetch(cachedBlobUrl)
          .then(res => res.arrayBuffer())
          .then(ab => decodeAudioBufferSafely(ctx, ab))
          .then(buf => preloadedAudioBuffers.set(cacheKey, buf))
          .catch(() => {})
      }
    }
    return preloadedAudioBlobUrls.get(cacheKey)!
  }

  try {
    const res = await fetch('/api/coach/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        text: cleanText,
        voiceId,
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
 * Pre-warms common in-gym cues into browser memory using requestIdleCallback
 */
export function prefetchCommonCoachVoiceCues(): void {
  if (typeof window === 'undefined') return
  const runner = async () => {
    // Batch in groups of 4 to prevent network starvation or rate limit spikes
    const batchSize = 4
    for (let i = 0; i < COMMON_COACH_GORDON_CUES.length; i += batchSize) {
      const chunk = COMMON_COACH_GORDON_CUES.slice(i, i + batchSize)
      await Promise.allSettled(chunk.map(cue => prefetchCoachVoiceCue(cue)))
    }
  }

  if (typeof (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback === 'function') {
    (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(() => { void runner() }, { timeout: 3000 })
  } else {
    setTimeout(() => { void runner() }, 1500)
  }
}

if (typeof window !== 'undefined') {
  prefetchCommonCoachVoiceCues()
}

/**
 * Splits text into conversational sentence chunks (under maxChunkLength) to eliminate
 * the 15-second browser speech synthesis truncation bug in Chrome, Safari, and iOS WebKit.
 */
export function chunkTextIntoSpeechSentences(text: string, maxChunkLength = 160): string[] {
  if (!text) return []
  const rawParts = text.match(/[^.!?\n;]+[.!?\n;]+|[^.!?\n;]+$/g) || [text]
  const chunks: string[] = []
  let currentChunk = ''

  for (const part of rawParts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    if ((currentChunk ? `${currentChunk} ${trimmed}` : trimmed).length <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed
    } else {
      if (currentChunk) chunks.push(currentChunk)

      if (trimmed.length > maxChunkLength) {
        const words = trimmed.split(' ')
        let wordChunk = ''
        for (const w of words) {
          if ((wordChunk ? `${wordChunk} ${w}` : w).length <= maxChunkLength) {
            wordChunk = wordChunk ? `${wordChunk} ${w}` : w
          } else {
            if (wordChunk) chunks.push(wordChunk)
            wordChunk = w
          }
        }
        currentChunk = wordChunk
      } else {
        currentChunk = trimmed
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

/**
 * Plays hyper-realistic studio neural voice audio powered by Coach Gordon's authentic
 * cloned voice model (UPezm4CtrvcD6aNXjeU1) via the server-side /api/coach/tts route.
 * Prioritizes Web Audio API (AudioBufferSourceNode) which is completely immune to
 * browser timer/background autoplay restrictions, ensuring rest intervals, set loggers,
 * and tempo countdowns always play in Coach Gordon's voice without robotic fallbacks.
 */
export async function playNeuralCoachVoiceCue(text: string, options: CoachVoiceOptions = {}): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const cleanText = sanitizeCoachSpeechText(text)
  if (!cleanText) return false

  // Ensure AudioSession is set to transient to duck background music instead of pausing it
  configureAudioSession('transient')

  // Stop any currently playing cue
  stopCoachVoiceCue()

  const targetVoiceId = options.voiceId || COACH_GORDON_VOICE_ID
  const cacheKey = `${targetVoiceId}_${cleanText}`
  const ctx = getSharedAudioContext()

  // ── Synchronously unlock / resume Web Audio context inside user gesture ──
  if (ctx && ctx.state === 'suspended') {
    try {
      void ctx.resume()
    } catch {}
  }

  // ── Primary Path: Web Audio API (Hardware clock, immune to timer autoplay limits) ──
  if (ctx) {
    try {
      let buffer = preloadedAudioBuffers.get(cacheKey)

      if (!buffer) {
        let arrayBuffer: ArrayBuffer | null = null
        const cachedBlobUrl = preloadedAudioBlobUrls.get(cacheKey)

        if (cachedBlobUrl) {
          const blobRes = await fetch(cachedBlobUrl)
          arrayBuffer = await blobRes.arrayBuffer()
        } else {
          const res = await fetch('/api/coach/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              text: cleanText,
              voiceId: targetVoiceId,
            }),
          })

          if (res.ok) {
            const contentType = res.headers.get('content-type') || ''
            if (contentType.includes('audio/')) {
              arrayBuffer = await res.arrayBuffer()
              const blob = new Blob([arrayBuffer], { type: contentType })
              preloadedAudioBlobUrls.set(cacheKey, URL.createObjectURL(blob))
            }
          }
        }

        if (arrayBuffer) {
          buffer = await decodeAudioBufferSafely(ctx, arrayBuffer)
          preloadedAudioBuffers.set(cacheKey, buffer)
        }
      }

      if (buffer) {
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }

        const source = ctx.createBufferSource()
        source.buffer = buffer

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
    } catch (err) {
      console.warn('Web Audio neural speech error:', err)
    }
  }

  // ── Secondary Path: HTMLAudioElement ──
  try {
    let audioUrl = preloadedAudioBlobUrls.get(cacheKey)

    if (!audioUrl) {
      const res = await fetch('/api/coach/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          text: cleanText,
          voiceId: targetVoiceId,
        }),
      })

      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('audio/')) {
          const blob = await res.blob()
          audioUrl = URL.createObjectURL(blob)
          preloadedAudioBlobUrls.set(cacheKey, audioUrl)
        }
      }
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.volume = options.volume ?? 1.0
      activeAudioElement = audio

      audio.onplay = () => {
        options.onStart?.()
      }

      audio.onerror = () => {
        if (activeAudioElement === audio) activeAudioElement = null
        speakWebSpeechCoachVoiceCue(cleanText, options)
      }

      audio.onended = () => {
        if (activeAudioElement === audio) activeAudioElement = null
        options.onEnded?.()
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        await playPromise
        return true
      }
    }
  } catch {
    // Fallback if browser audio element execution threw
  }

  // ── Last-Resort Fallback: Web Speech API only if network completely unavailable ──
  speakWebSpeechCoachVoiceCue(cleanText, options)
  return false
}

/**
 * Executes a commanding, clear, coach-style vocal cue using client-side Web Speech API.
 * Sanitizes emojis/symbols, sets authoritative baritone pitch (0.92) and punchy tempo (1.08).
 * Uses chunked sentence queuing to completely prevent the browser 15-second cutoff bug.
 */
export function speakWebSpeechCoachVoiceCue(text: string, options: CoachVoiceOptions = {}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  const cleanText = sanitizeCoachSpeechText(text)
  if (!cleanText) return

  configureAudioSession('transient')

  try {
    if (activeAudioElement) {
      try {
        activeAudioElement.pause()
        activeAudioElement.currentTime = 0
      } catch {
        // Ignore audio element pause errors
      }
      activeAudioElement = null
    }

    if (options.interrupPrevious !== false) {
      window.speechSynthesis.cancel()
      activeUtterances = []
    }
    window.speechSynthesis.resume()

    const chunks = chunkTextIntoSpeechSentences(cleanText)
    if (chunks.length === 0) return

    const coachVoice = getAuthoritativeCoachVoice()
    activeUtterances = []

    chunks.forEach((chunk, index) => {
      const isFirst = index === 0
      const isLast = index === chunks.length - 1

      const utterance = new SpeechSynthesisUtterance(chunk)
      utterance.pitch = options.pitch ?? 0.92 // Authoritative, grounded athletic baritone
      utterance.rate = options.rate ?? 1.08 // Decisive, crisp cadence
      utterance.volume = options.volume ?? 1.0
      if (coachVoice) {
        utterance.voice = coachVoice
      }

      if (isFirst && options.onStart) {
        utterance.onstart = () => options.onStart!()
      }

      if (isLast) {
        utterance.onend = () => {
          activeUtterances = []
          if (options.onEnded) options.onEnded()
        }
        utterance.onerror = () => {
          activeUtterances = []
          if (options.onEnded) options.onEnded()
        }
      }

      activeUtterances.push(utterance)
      window.speechSynthesis.speak(utterance)
    })
  } catch {
    activeUtterances = []
    if (options.onEnded) options.onEnded()
  }
}

/**
 * Executes an AI Coach Gordon vocal cue across the entire application.
 * Consistently powers cues with Coach Gordon's cloned neural voice model (ElevenLabs UPezm4CtrvcD6aNXjeU1)
 * matching the cardio training engine. Seamlessly falls back to local Web Speech API if offline or rate limited.
 */
export function speakCoachVoiceCue(text: string, options: CoachVoiceOptions = {}): void {
  if (options.forceWebSpeech) {
    speakWebSpeechCoachVoiceCue(text, options)
    return
  }

  void playNeuralCoachVoiceCue(text, options)
}

/**
 * Specialized tempo coaching cues designed for clinical time-under-tension execution.
 */
export function speakTempoCoachCue(params: {
  phase: 'pre_exercise_countdown' | 'eccentric' | 'isometric' | 'concentric' | 'complete'
  secondsRemaining?: number
  repNumber?: number
  totalReps?: number
  exerciseName?: string
}) {
  const { phase, secondsRemaining = 0, repNumber = 1, totalReps = 10, exerciseName } = params

  switch (phase) {
    case 'pre_exercise_countdown':
      if (secondsRemaining === 5) {
        speakCoachVoiceCue(exerciseName ? `Set up for ${exerciseName}. Five seconds.` : 'Set up. Five seconds.')
      } else if (secondsRemaining === 3) {
        speakCoachVoiceCue('Three', { rate: 1.15 })
      } else if (secondsRemaining === 2) {
        speakCoachVoiceCue('Two', { rate: 1.15 })
      } else if (secondsRemaining === 1) {
        speakCoachVoiceCue('One. Lock in!', { rate: 1.15 })
      }
      break

    case 'eccentric':
      if (secondsRemaining === 4) {
        speakCoachVoiceCue('Control down... four', { rate: 1.12 })
      } else if (secondsRemaining === 3) {
        speakCoachVoiceCue('Three', { rate: 1.15 })
      } else if (secondsRemaining === 2) {
        speakCoachVoiceCue('Two', { rate: 1.15 })
      } else if (secondsRemaining === 1) {
        speakCoachVoiceCue('One', { rate: 1.15 })
      }
      break

    case 'isometric':
      speakCoachVoiceCue('Hold solid!', { rate: 1.15, pitch: 0.94 })
      break

    case 'concentric':
      speakCoachVoiceCue('DRIVE!', { rate: 1.25, pitch: 0.96 })
      break

    case 'complete':
      if (repNumber >= totalReps) {
        speakCoachVoiceCue('Rack it! Outstanding set.', { rate: 1.05, pitch: 0.92 })
      } else {
        speakCoachVoiceCue(`Rep ${repNumber} locked in.`, { rate: 1.12, pitch: 0.92 })
      }
      break
  }
}


