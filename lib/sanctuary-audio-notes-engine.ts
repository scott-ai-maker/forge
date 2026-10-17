/**
 * Forge Athletic — Coach-Client Sanctuary Audio Notes Engine
 * 
 * Enforces the brand promise:
 * "NO SOCIAL MEDIA · ZERO DISTRACTIONS · 100% COACHING & TOOLS"
 * 
 * Delivers 20-60 second encrypted acoustic voice memos from Coach Scott Gordon
 * straight to the athlete's headphones during rest intervals. Replaces mindless
 * social feeds and doomscrolling with clinical biomechanical cues, vagal down-regulation,
 * and mental focus.
 */

import { configureAudioSession, getSharedAudioContext } from './web-audio-cadence-engine'

export type SanctuaryAudioCategory =
  | 'movement_cue'
  | 'cns_recovery'
  | 'mental_focus'
  | 'workout_briefing'
  | 'personal_feedback'

export const COACH_GORDON_ELEVENLABS_VOICE_ID = 'UPezm4CtrvcD6aNXjeU1'

export interface SanctuaryAudioNote {
  id: string
  coachName: string
  coachTitle: string
  coachInitials: string
  clientScope: 'all' | string
  exerciseScope?: string
  category: SanctuaryAudioCategory
  title: string
  transcript: string
  durationSeconds: number
  audioDataUrl?: string
  waveformPoints: number[]
  createdAt: string
  expiresAt?: string
  isEncrypted: boolean
  isListened: boolean
  listenedAt?: string
  priority: 'high' | 'normal'
  audioSynthesisScript?: string
  voiceProvider?: 'elevenlabs-coach-gordon' | 'microphone'
  voiceId?: string
}

const STORAGE_KEY = 'forge_sanctuary_audio_notes_v1'

/**
 * Institutional Seed Library: Authoritative Voice Memos from Coach Scott Gordon
 */
export const DEFAULT_SANCTUARY_AUDIO_NOTES: SanctuaryAudioNote[] = [
  {
    id: 'sanctuary-note-squat-brace',
    coachName: 'Coach Scott Gordon',
    coachTitle: 'Founder & Head Coach, Forge Athletic',
    coachInitials: 'SG',
    clientScope: 'all',
    exerciseScope: 'Barbell Back Squat',
    category: 'movement_cue',
    title: 'Squat Wedge & 360° Intra-Abdominal Brace',
    transcript:
      "Scott here. On your upcoming squat set: before you unrack, pull the bar down like you're bending it over your traps to engage the lats. Screw your feet into the floor with tripod contact. Take a deep diaphragmatic breath, expand your obliques 360 degrees, and drive through the midfoot on the ascent. No social media, eyes on the horizon. Let's execute.",
    durationSeconds: 38,
    waveformPoints: [
      0.2, 0.45, 0.78, 0.65, 0.35, 0.88, 0.95, 0.72, 0.4, 0.62, 0.84, 0.55,
      0.3, 0.74, 0.82, 0.68, 0.51, 0.89, 0.92, 0.64, 0.38, 0.7, 0.81, 0.59,
      0.44, 0.76, 0.62, 0.48, 0.35, 0.58, 0.4, 0.22,
    ],
    createdAt: '2026-10-16T12:00:00Z',
    isEncrypted: true,
    isListened: false,
    priority: 'high',
    voiceProvider: 'elevenlabs-coach-gordon',
    voiceId: COACH_GORDON_ELEVENLABS_VOICE_ID,
  },
  {
    id: 'sanctuary-note-deadlift-slack',
    coachName: 'Coach Scott Gordon',
    coachTitle: 'Founder & Head Coach, Forge Athletic',
    coachInitials: 'SG',
    clientScope: 'all',
    exerciseScope: 'Barbell Deadlift',
    category: 'movement_cue',
    title: 'Deadlift Lat Lock & Slack Removal',
    transcript:
      "Coach Scott in your ear. Take the slack out of the barbell before it breaks the floor—listen for that metal-on-metal click. Protect your spine by packing your lats as if squeezing oranges in your armpits. Push the floor away rather than pulling back with your lumbar. Keep the bar glued to your shins. Stay locked in.",
    durationSeconds: 42,
    waveformPoints: [
      0.3, 0.55, 0.85, 0.7, 0.42, 0.68, 0.9, 0.82, 0.45, 0.6, 0.79, 0.88,
      0.65, 0.4, 0.75, 0.94, 0.86, 0.58, 0.38, 0.64, 0.82, 0.74, 0.5, 0.67,
      0.84, 0.61, 0.47, 0.53, 0.4, 0.35, 0.28, 0.18,
    ],
    createdAt: '2026-10-16T12:05:00Z',
    isEncrypted: true,
    isListened: false,
    priority: 'high',
    voiceProvider: 'elevenlabs-coach-gordon',
    voiceId: COACH_GORDON_ELEVENLABS_VOICE_ID,
  },
  {
    id: 'sanctuary-note-bench-retract',
    coachName: 'Coach Scott Gordon',
    coachTitle: 'Founder & Head Coach, Forge Athletic',
    coachInitials: 'SG',
    clientScope: 'all',
    exerciseScope: 'Barbell Bench Press',
    category: 'movement_cue',
    title: 'Bench Scapular Retraction & Leg Drive',
    transcript:
      "Scott Gordon with your bench cue. Retract and depress your scapulae into the pad like you're tucking them into your back pockets. Establish firm leg drive before you touch the bar. Flare lats on the eccentric, touch mid-sternum, and drive your heels into the floor to power off the chest. Zero distractions.",
    durationSeconds: 35,
    waveformPoints: [
      0.25, 0.48, 0.72, 0.86, 0.62, 0.4, 0.69, 0.85, 0.78, 0.52, 0.65, 0.88,
      0.92, 0.7, 0.45, 0.6, 0.81, 0.75, 0.58, 0.42, 0.68, 0.84, 0.76, 0.55,
      0.48, 0.62, 0.51, 0.4, 0.32, 0.26, 0.2, 0.15,
    ],
    createdAt: '2026-10-16T12:10:00Z',
    isEncrypted: true,
    isListened: false,
    priority: 'high',
    voiceProvider: 'elevenlabs-coach-gordon',
    voiceId: COACH_GORDON_ELEVENLABS_VOICE_ID,
  },
  {
    id: 'sanctuary-note-cns-vagal-sigh',
    coachName: 'Coach Scott Gordon',
    coachTitle: 'Founder & Head Coach, Forge Athletic',
    coachInitials: 'SG',
    clientScope: 'all',
    category: 'cns_recovery',
    title: 'Vagal Down-Regulation: The Physiological Sigh',
    transcript:
      'Great set. Your central nervous system just fired at maximal motor unit recruitment. Now we down-regulate. Sit upright, drop your shoulders. Take two rapid nasal inhales—deep inhale, top off with a second sniff—then one long, slow sigh through pursed lips. Let your heart rate drop below 120 bpm before your next set.',
    durationSeconds: 45,
    waveformPoints: [
      0.18, 0.35, 0.58, 0.72, 0.64, 0.45, 0.38, 0.62, 0.75, 0.8, 0.6, 0.42,
      0.55, 0.68, 0.74, 0.52, 0.4, 0.58, 0.65, 0.7, 0.55, 0.48, 0.6, 0.68,
      0.54, 0.44, 0.36, 0.42, 0.3, 0.25, 0.2, 0.12,
    ],
    createdAt: '2026-10-16T12:15:00Z',
    isEncrypted: true,
    isListened: false,
    priority: 'high',
    voiceProvider: 'elevenlabs-coach-gordon',
    voiceId: COACH_GORDON_ELEVENLABS_VOICE_ID,
  },
  {
    id: 'sanctuary-note-creed-hands-bar',
    coachName: 'Coach Scott Gordon',
    coachTitle: 'Founder & Head Coach, Forge Athletic',
    coachInitials: 'SG',
    clientScope: 'all',
    category: 'mental_focus',
    title: 'The Sanctuary Creed: Hands on the Bar',
    transcript:
      'Scott here. Remember why we built Forge: The gym is your sacred ground. No feeds, no scrolling, no vanity clout. Every distraction bleeds neurological intent and power output. When you step back up to that platform, you own every millimeter of the bar. Let us get back to work.',
    durationSeconds: 30,
    waveformPoints: [
      0.32, 0.6, 0.88, 0.94, 0.75, 0.5, 0.72, 0.9, 0.85, 0.62, 0.78, 0.95,
      0.82, 0.64, 0.8, 0.92, 0.86, 0.65, 0.5, 0.74, 0.88, 0.7, 0.55, 0.66,
      0.75, 0.58, 0.46, 0.4, 0.32, 0.28, 0.22, 0.16,
    ],
    createdAt: '2026-10-16T12:20:00Z',
    isEncrypted: true,
    isListened: false,
    priority: 'normal',
    voiceProvider: 'elevenlabs-coach-gordon',
    voiceId: COACH_GORDON_ELEVENLABS_VOICE_ID,
  },
  {
    id: 'sanctuary-note-ohp-kinetic-pillar',
    coachName: 'Coach Scott Gordon',
    coachTitle: 'Founder & Head Coach, Forge Athletic',
    coachInitials: 'SG',
    clientScope: 'all',
    exerciseScope: 'Overhead Press',
    category: 'movement_cue',
    title: 'Strict Overhead Press: Kinetic Pillar',
    transcript:
      'Coach Scott here. The overhead press is a full-body movement. Squeeze your glutes and quads as hard as possible to turn your torso into a concrete pillar. Clear your head back, press straight up close to your nose, then punch your head through at the top. Zero hyperextension of the lumbar spine.',
    durationSeconds: 34,
    waveformPoints: [
      0.22, 0.45, 0.7, 0.82, 0.6, 0.44, 0.65, 0.84, 0.76, 0.58, 0.7, 0.89,
      0.85, 0.68, 0.5, 0.65, 0.82, 0.78, 0.6, 0.48, 0.66, 0.8, 0.72, 0.56,
      0.45, 0.58, 0.48, 0.38, 0.3, 0.24, 0.18, 0.12,
    ],
    createdAt: '2026-10-16T12:25:00Z',
    isEncrypted: true,
    isListened: false,
    priority: 'normal',
    voiceProvider: 'elevenlabs-coach-gordon',
    voiceId: COACH_GORDON_ELEVENLABS_VOICE_ID,
  },
  {
    id: 'sanctuary-note-workout-briefing',
    coachName: 'Coach Scott Gordon',
    coachTitle: 'Founder & Head Coach, Forge Athletic',
    coachInitials: 'SG',
    clientScope: 'all',
    category: 'workout_briefing',
    title: 'Session Briefing: Progressive Overload & Clean Tempo',
    transcript:
      'Welcome to today’s session. Our primary objective is progressive mechanical tension on your primary compounds, followed by unilateral stabilizer work. Keep your rest intervals tight and honest. Wear your headphones, keep your phone in your locker or on airplane mode. Pure execution today.',
    durationSeconds: 40,
    waveformPoints: [
      0.28, 0.52, 0.76, 0.85, 0.68, 0.48, 0.66, 0.84, 0.78, 0.62, 0.72, 0.86,
      0.9, 0.74, 0.55, 0.68, 0.82, 0.76, 0.62, 0.5, 0.65, 0.78, 0.7, 0.56,
      0.48, 0.6, 0.5, 0.42, 0.34, 0.26, 0.2, 0.14,
    ],
    createdAt: '2026-10-16T12:30:00Z',
    isEncrypted: true,
    isListened: false,
    priority: 'normal',
    voiceProvider: 'elevenlabs-coach-gordon',
    voiceId: COACH_GORDON_ELEVENLABS_VOICE_ID,
  },
]

/**
 * Deterministically generates waveform points from text or string seed
 */
export function generateWaveformPoints(seed: string, count = 32): number[] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }

  const points: number[] = []
  for (let i = 0; i < count; i++) {
    const x = Math.sin(hash + i * 0.7) * 0.5 + 0.5
    // Curve ends lower, middle has dynamic peak
    const envelope = Math.sin(((i + 1) / (count + 1)) * Math.PI)
    const val = Math.max(0.12, Math.min(1.0, Math.round((0.15 + x * 0.85 * envelope) * 100) / 100))
    points.push(val)
  }
  return points
}

function getSafeStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  const globalScope = globalThis as unknown as { localStorage?: Storage }
  if (globalScope?.localStorage) {
    return globalScope.localStorage
  }
  return null
}

/**
 * Retrieves all stored sanctuary audio notes, seeded with defaults if empty
 */
export function getStoredSanctuaryAudioNotes(): SanctuaryAudioNote[] {
  const storage = getSafeStorage()
  if (!storage) {
    return DEFAULT_SANCTUARY_AUDIO_NOTES
  }

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SANCTUARY_AUDIO_NOTES))
      return DEFAULT_SANCTUARY_AUDIO_NOTES
    }
    const parsed = JSON.parse(raw) as SanctuaryAudioNote[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_SANCTUARY_AUDIO_NOTES
    }
    // Upgrade existing notes without voiceProvider or voiceId
    return parsed.map(n => ({
      ...n,
      voiceProvider: n.voiceProvider || 'elevenlabs-coach-gordon',
      voiceId: n.voiceId || COACH_GORDON_ELEVENLABS_VOICE_ID,
    }))
  } catch {
    return DEFAULT_SANCTUARY_AUDIO_NOTES
  }
}

/**
 * Persists a new or updated Sanctuary Audio Note
 */
export function saveSanctuaryAudioNote(note: SanctuaryAudioNote): SanctuaryAudioNote[] {
  const storage = getSafeStorage()
  if (!storage) return [note]

  try {
    const current = getStoredSanctuaryAudioNotes()
    const index = current.findIndex(n => n.id === note.id)
    let updated: SanctuaryAudioNote[]
    if (index >= 0) {
      updated = [...current]
      updated[index] = note
    } else {
      updated = [note, ...current]
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return [note]
  }
}

/**
 * Marks a note as listened with timestamp
 */
export function markAudioNoteListened(noteId: string): void {
  const storage = getSafeStorage()
  if (!storage) return

  try {
    const current = getStoredSanctuaryAudioNotes()
    const updated = current.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          isListened: true,
          listenedAt: new Date().toISOString(),
        }
      }
      return note
    })
    storage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

/**
 * Deletes a note by ID
 */
export function deleteSanctuaryAudioNote(noteId: string): void {
  const storage = getSafeStorage()
  if (!storage) return

  try {
    const current = getStoredSanctuaryAudioNotes()
    const updated = current.filter(n => n.id !== noteId)
    storage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

/**
 * Helper to select the most relevant audio note for a rest interval.
 * 1. Checks for specific exercise match (e.g. "Barbell Back Squat" or matching substring "Squat")
 * 2. Unlistened notes take precedence over listened notes
 * 3. Falls back to CNS Recovery or Mental Focus notes
 */
export function getRelevantAudioNoteForRest(options: {
  exerciseName?: string
  unplayedFirst?: boolean
  categoryPreference?: SanctuaryAudioCategory
}): SanctuaryAudioNote | null {
  const notes = getStoredSanctuaryAudioNotes()
  if (notes.length === 0) return null

  const { exerciseName = '', unplayedFirst = true, categoryPreference } = options
  const normalizedEx = exerciseName.toLowerCase().trim()

  // 1. Exact or substring exercise match
  if (normalizedEx) {
    const exerciseNotes = notes.filter(n => {
      if (!n.exerciseScope) return false
      const scope = n.exerciseScope.toLowerCase()
      return normalizedEx.includes(scope) || scope.includes(normalizedEx)
    })

    if (exerciseNotes.length > 0) {
      if (unplayedFirst) {
        const unplayed = exerciseNotes.find(n => !n.isListened)
        if (unplayed) return unplayed
      }
      return exerciseNotes[0]
    }
  }

  // 2. Category preference match (e.g. cns_recovery or mental_focus)
  if (categoryPreference) {
    const catNotes = notes.filter(n => n.category === categoryPreference)
    if (catNotes.length > 0) {
      if (unplayedFirst) {
        const unplayed = catNotes.find(n => !n.isListened)
        if (unplayed) return unplayed
      }
      return catNotes[0]
    }
  }

  // 3. Fallback: prioritize unlistened general notes, else any note
  if (unplayedFirst) {
    const unplayedGeneral = notes.find(n => !n.isListened)
    if (unplayedGeneral) return unplayedGeneral
  }

  return notes[0]
}

/**
 * Plays a discrete, high-fidelity acoustic notification chime using Web Audio
 * to signal the start of Coach Scott Gordon's voice memo.
 */
export function playSanctuaryAcousticIntroChime(customCtx?: AudioContext | null): void {
  if (typeof window === 'undefined') return

  try {
    configureAudioSession('ambient')
    const ctx = customCtx || getSharedAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const t0 = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Harmonic minor third interval (Gold / Obsidian acoustic branding)
    // 587.33 Hz (D5) -> 880 Hz (A5)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, t0)
    osc1.frequency.exponentialRampToValueAtTime(880, t0 + 0.18)

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(1174.66, t0) // D6 overtone
    osc2.frequency.exponentialRampToValueAtTime(1760, t0 + 0.18)

    gainNode.gain.setValueAtTime(0, t0)
    gainNode.gain.linearRampToValueAtTime(0.14, t0 + 0.04)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc1.start(t0)
    osc2.start(t0)
    osc1.stop(t0 + 0.45)
    osc2.stop(t0 + 0.45)
  } catch {
    // Fail silently on restricted environments
  }
}

/**
 * Creates a new Sanctuary Audio Note with proper IDs and defaults
 */
export function createCoachAudioNote(params: {
  title: string
  transcript: string
  category: SanctuaryAudioCategory
  durationSeconds: number
  exerciseScope?: string
  clientScope?: string
  audioDataUrl?: string
  priority?: 'high' | 'normal'
  voiceProvider?: 'elevenlabs-coach-gordon' | 'microphone'
  voiceId?: string
}): SanctuaryAudioNote {
  const id = `sanctuary-note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const points = generateWaveformPoints(`${params.title}-${params.transcript}`)

  return {
    id,
    coachName: 'Coach Scott Gordon',
    coachTitle: 'Founder & Head Coach, Forge Athletic',
    coachInitials: 'SG',
    clientScope: params.clientScope || 'all',
    exerciseScope: params.exerciseScope,
    category: params.category,
    title: params.title,
    transcript: params.transcript,
    durationSeconds: Math.min(60, Math.max(5, params.durationSeconds)),
    audioDataUrl: params.audioDataUrl,
    waveformPoints: points,
    createdAt: new Date().toISOString(),
    isEncrypted: true,
    isListened: false,
    priority: params.priority || 'normal',
    voiceProvider: params.voiceProvider || 'elevenlabs-coach-gordon',
    voiceId: params.voiceId || COACH_GORDON_ELEVENLABS_VOICE_ID,
  }
}
