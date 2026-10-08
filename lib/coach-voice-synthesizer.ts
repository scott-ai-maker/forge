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

import { configureAudioSession } from './web-audio-cadence-engine'

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

/**
 * Stops all currently active neural and Web Speech coach audio playback immediately.
 */
export function stopCoachVoiceCue(): void {
  if (typeof window === 'undefined') return
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
    } catch {
      // Ignore speech synthesis cancel errors
    }
  }
}

let activeAudioElement: HTMLAudioElement | null = null

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
 * Scores how suitable a voice is for Coach Scott Gordon's authoritative athletic presence.
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
 * Pre-fetches an audio cue via ElevenLabs TTS to ensure zero-latency voice cues.
 */
export async function prefetchCoachVoiceCue(text: string, voiceId: string = COACH_GORDON_VOICE_ID): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const cleanText = sanitizeCoachSpeechText(text)
  if (!cleanText) return null

  const cacheKey = `${voiceId}_${cleanText}`
  if (preloadedAudioBlobUrls.has(cacheKey)) {
    return preloadedAudioBlobUrls.get(cacheKey)!
  }

  try {
    const res = await fetch('/api/coach/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        voiceId,
      }),
    })

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('audio/')) {
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      preloadedAudioBlobUrls.set(cacheKey, objectUrl)
      return objectUrl
    }
  } catch {
    // Ignore prefetch network errors; fallback will handle on playback
  }

  return null
}

/**
 * Plays hyper-realistic studio neural voice audio powered by Coach Scott Gordon's authentic
 * cloned voice model (UPezm4CtrvcD6aNXjeU1) via the server-side /api/coach/tts route.
 * Uses client-side blob caching and synchronous audio initialization to maintain user activation
 * gestures on iOS Safari / WebKit, with graceful fallback to Web Speech API.
 */
export async function playNeuralCoachVoiceCue(text: string, options: CoachVoiceOptions = {}): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const cleanText = sanitizeCoachSpeechText(text)
  if (!cleanText) return false

  // Ensure AudioSession is set to transient to duck background music instead of pausing it
  configureAudioSession('transient')

  try {
    if (activeAudioElement) {
      try {
        activeAudioElement.pause()
        activeAudioElement.currentTime = 0
      } catch {
        // Ignore audio pause error
      }
      activeAudioElement = null
    }

    const targetVoiceId = options.voiceId || COACH_GORDON_VOICE_ID
    const cacheKey = `${targetVoiceId}_${cleanText}`
    const cachedBlobUrl = preloadedAudioBlobUrls.get(cacheKey)

    const audioUrl =
      cachedBlobUrl ||
      `/api/coach/tts?text=${encodeURIComponent(cleanText)}&voiceId=${encodeURIComponent(targetVoiceId)}`

    const audio = new Audio(audioUrl)
    audio.volume = options.volume ?? 1.0
    activeAudioElement = audio

    audio.onplay = () => {
      if (options.onStart) options.onStart()
    }

    audio.onerror = () => {
      if (activeAudioElement === audio) activeAudioElement = null
      speakWebSpeechCoachVoiceCue(cleanText, options)
    }

    audio.onended = () => {
      if (activeAudioElement === audio) activeAudioElement = null
      if (options.onEnded) options.onEnded()
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      await playPromise
      return true
    }
  } catch {
    // Fallback if browser audio element execution threw
  }

  // Seamless fallback to client Web Speech API
  speakWebSpeechCoachVoiceCue(cleanText, options)
  return false
}

/**
 * Executes a commanding, clear, coach-style vocal cue using client-side Web Speech API.
 * Sanitizes emojis/symbols, sets authoritative baritone pitch (0.92) and punchy tempo (1.08).
 * Used as high-fidelity zero-latency fallback when neural audio keys are unavailable or client is offline.
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
    }
    window.speechSynthesis.resume()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.pitch = options.pitch ?? 0.92 // Authoritative, grounded athletic baritone
    utterance.rate = options.rate ?? 1.08 // Decisive, crisp cadence
    utterance.volume = options.volume ?? 1.0

    utterance.onstart = () => {
      if (options.onStart) options.onStart()
    }

    utterance.onend = () => {
      if (options.onEnded) options.onEnded()
    }

    utterance.onerror = () => {
      if (options.onEnded) options.onEnded()
    }

    const coachVoice = getAuthoritativeCoachVoice()
    if (coachVoice) {
      utterance.voice = coachVoice
    }

    window.speechSynthesis.speak(utterance)
  } catch {
    if (options.onEnded) options.onEnded()
  }
}

/**
 * Executes an AI Coach Gordon vocal cue across the entire application.
 * Consistently powers cues with Coach Scott Gordon's cloned neural voice model (ElevenLabs UPezm4CtrvcD6aNXjeU1)
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


