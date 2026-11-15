'use client'

/**
 * Forge Athletic — Hybrid ElevenLabs Coach Gordon Voice Engine
 *
 * Two-tier architecture:
 * 1. Instant Cached Cues (`staticCueMap` — Zero Latency) backed by `/public/audio/coach-gordon/*.mp3`
 *    with automatic Web Speech + subtle tactile Web Audio chime fallback in local dev.
 * 2. Personalized Dynamic ElevenLabs TTS (`/api/voice/synthesize`) with SHA-256 `(voice_id + normalized_text)`
 *    caching in server storage/CDN + client IndexedDB (`forge_coach_voice_cache_v1`).
 *
 * Strictly defaults to `'muted'` until explicit user interaction and never overlaps two voice clips.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  chunkTextIntoSpeechSentences,
  getAuthoritativeCoachVoice,
  sanitizeCoachSpeechText,
  stopCoachVoiceCue,
} from '@/lib/coach-voice-synthesizer'
import {
  COACH_AUDIO_MODE_EVENT_NAME,
  getCoachAudioMode,
  getSharedCoachAudioContext,
  playForgeTactileTone,
  setCoachAudioMode,
  unlockSharedAudioContextOnGesture,
  type CoachAudioMode,
  type TactileToneType,
} from '@/lib/sfx-audio'

export type { CoachAudioMode }
export { getCoachAudioMode, setCoachAudioMode, unlockSharedAudioContextOnGesture }

export const DEFAULT_COACH_GORDON_VOICE_KEY = 'coach_gordon_v2'
const VOICE_IDB_NAME = 'forge_coach_voice_cache_v2'
const VOICE_IDB_STORE = 'tts_audio_blobs'
const VOICE_PLAYBACK_EVENT = 'forge:coach-voice-playback-state'

export type StaticCoachCueKey =
  | 'calibration_framing'
  | 'calibration_locked'
  | 'readiness_rep_1_3'
  | 'tempo_3_1_1_eccentric'
  | 'set_complete_great_work'
  | 'rest_timer_10s_warning'
  | 'rest_timer_go'
  | 'desk_reset_transition'
  | 'safety_pause_check'

export type VoicePriority = 'normal' | 'safety'

export type DynamicBriefingMoment =
  | 'pre_workout_briefing'
  | 'post_scan_summary'
  | 'auto_regression_safety'
  | 'on_demand_chat'

export interface StaticCoachCueDefinition {
  key: StaticCoachCueKey
  assetPath: string
  spokenScript: string
  fallbackTone: TactileToneType
  priority: VoicePriority
}

export const staticCueMap: Record<StaticCoachCueKey, StaticCoachCueDefinition> = {
  calibration_framing: {
    key: 'calibration_framing',
    assetPath: '/audio/coach-gordon/calibration_framing.mp3',
    spokenScript:
      'Step back until your full frame is inside the brackets—ears, shoulders, hips, and ankles.',
    fallbackTone: 'cue',
    priority: 'normal',
  },
  calibration_locked: {
    key: 'calibration_locked',
    assetPath: '/audio/coach-gordon/calibration_locked.mp3',
    spokenScript: 'Locked in. Hold steady right there.',
    fallbackTone: 'success',
    priority: 'normal',
  },
  readiness_rep_1_3: {
    key: 'readiness_rep_1_3',
    assetPath: '/audio/coach-gordon/readiness_rep_1_3.mp3',
    spokenScript:
      'Give me three smooth reps at your natural depth—rep one of three, nice and controlled.',
    fallbackTone: 'cue',
    priority: 'normal',
  },
  tempo_3_1_1_eccentric: {
    key: 'tempo_3_1_1_eccentric',
    assetPath: '/audio/coach-gordon/tempo_3_1_1_eccentric.mp3',
    spokenScript: 'Three seconds down—three, two, one—pause at the bottom, drive up.',
    fallbackTone: 'tick',
    priority: 'normal',
  },
  set_complete_great_work: {
    key: 'set_complete_great_work',
    assetPath: '/audio/coach-gordon/set_complete_great_work.mp3',
    spokenScript:
      'Set locked. Clean work—breathe through your nose and let your heart rate settle.',
    fallbackTone: 'rep_complete',
    priority: 'normal',
  },
  rest_timer_10s_warning: {
    key: 'rest_timer_10s_warning',
    assetPath: '/audio/coach-gordon/rest_timer_10s_warning.mp3',
    spokenScript: 'Ten seconds—hands on the implements, tall ribcage.',
    fallbackTone: 'countdown',
    priority: 'normal',
  },
  rest_timer_go: {
    key: 'rest_timer_go',
    assetPath: '/audio/coach-gordon/rest_timer_go.mp3',
    spokenScript: "Time's up—own the first rep.",
    fallbackTone: 'chime',
    priority: 'normal',
  },
  desk_reset_transition: {
    key: 'desk_reset_transition',
    assetPath: '/audio/coach-gordon/desk_reset_transition.mp3',
    spokenScript: 'Nice release. Reset your posture and flow into the next mobility drill.',
    fallbackTone: 'cue',
    priority: 'normal',
  },
  safety_pause_check: {
    key: 'safety_pause_check',
    assetPath: '/audio/coach-gordon/safety_pause_check.mp3',
    spokenScript:
      "Pause right there—we never push through sharp or pinchy joint pain. Let's check in and protect that joint.",
    fallbackTone: 'chime',
    priority: 'safety',
  },
}

export function normalizeVoiceTextForHash(rawText: string): string {
  return sanitizeCoachSpeechText(rawText)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Computes SHA-256 hex digest of `${voiceId}:${normalizedText}` using Web Crypto
 * (with deterministic fallback when SubtleCrypto is unavailable in non-secure test contexts).
 */
export async function computeVoiceCacheHash(
  rawText: string,
  voiceId: string = DEFAULT_COACH_GORDON_VOICE_KEY
): Promise<string> {
  const normalized = normalizeVoiceTextForHash(rawText)
  const payload = `${voiceId.trim()}:${normalized}`

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const encoded = new TextEncoder().encode(payload)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Deterministic FNV-1a 256-bit hex fallback solely for headless unit-test environments lacking SubtleCrypto
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i)
    h1 ^= ch
    h1 = Math.imul(h1, 0x01000193) >>> 0
    h2 ^= ch + (i & 0xff)
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`.repeat(4)
}

// ── Client IndexedDB + In-Memory Audio Blob Cache ──
const memoryDynamicAudioCache = new Map<string, ArrayBuffer>()
const decodedStaticBufferCache = new Map<StaticCoachCueKey, AudioBuffer>()
const missingStaticAssets = new Set<StaticCoachCueKey>()

function openVoiceIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    return Promise.resolve(null)
  }
  return new Promise(resolve => {
    try {
      const req = window.indexedDB.open(VOICE_IDB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(VOICE_IDB_STORE)) {
          db.createObjectStore(VOICE_IDB_STORE, { keyPath: 'hash' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function getCachedVoiceBlobFromIdb(hash: string): Promise<ArrayBuffer | null> {
  const mem = memoryDynamicAudioCache.get(hash)
  if (mem) return mem.slice(0)

  const db = await openVoiceIndexedDb()
  if (!db) return null

  return new Promise(resolve => {
    try {
      const tx = db.transaction(VOICE_IDB_STORE, 'readonly')
      const store = tx.objectStore(VOICE_IDB_STORE)
      const req = store.get(hash)
      req.onsuccess = () => {
        const rec = req.result as { hash: string; audioBytes: ArrayBuffer } | undefined
        if (rec?.audioBytes) {
          memoryDynamicAudioCache.set(hash, rec.audioBytes.slice(0))
          resolve(rec.audioBytes.slice(0))
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function saveCachedVoiceBlobToIdb(hash: string, audioBytes: ArrayBuffer): Promise<void> {
  memoryDynamicAudioCache.set(hash, audioBytes.slice(0))
  const db = await openVoiceIndexedDb()
  if (!db) return

  return new Promise(resolve => {
    try {
      const tx = db.transaction(VOICE_IDB_STORE, 'readwrite')
      const store = tx.objectStore(VOICE_IDB_STORE)
      store.put({
        hash,
        audioBytes: audioBytes.slice(0),
        savedAt: Date.now(),
      })
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

// ── Single-Channel Non-Overlapping Priority Playback Queue ──
export interface QueuedVoiceJob {
  id: string
  priority: VoicePriority
  execute: (signal: { aborted: boolean }) => Promise<void>
  cancelActive?: () => void
}

export class VoicePlaybackQueueController {
  private queue: QueuedVoiceJob[] = []
  private activeJob: {
    job: QueuedVoiceJob
    signal: { aborted: boolean }
  } | null = null
  private onStateChange?: (isSpeaking: boolean, activeId: string | null) => void

  constructor(onStateChange?: (isSpeaking: boolean, activeId: string | null) => void) {
    this.onStateChange = onStateChange
  }

  get isSpeaking(): boolean {
    return this.activeJob !== null
  }

  get activeId(): string | null {
    return this.activeJob?.job.id ?? null
  }

  get pendingCount(): number {
    return this.queue.length
  }

  enqueue(job: QueuedVoiceJob): void {
    if (job.priority === 'safety') {
      // Safety alerts preempt active playback immediately and clear stale normal cues
      this.queue = this.queue.filter(q => q.priority === 'safety')
      if (this.activeJob) {
        this.activeJob.signal.aborted = true
        this.activeJob.job.cancelActive?.()
      }
      this.queue.unshift(job)
      if (!this.activeJob) {
        void this.pump()
      }
      return
    }

    // Deduplicate identical queued jobs and cap queue length so cues never lag behind reps
    if (this.activeJob?.job.id === job.id || this.queue.some(q => q.id === job.id)) {
      return
    }
    if (this.queue.length >= 2) {
      this.queue.shift()
    }
    this.queue.push(job)
    if (!this.activeJob) {
      void this.pump()
    }
  }

  stopAll(): void {
    this.queue = []
    if (this.activeJob) {
      this.activeJob.signal.aborted = true
      this.activeJob.job.cancelActive?.()
      this.activeJob = null
    }
    this.onStateChange?.(false, null)
  }

  private async pump(): Promise<void> {
    if (this.activeJob) return
    const next = this.queue.shift()
    if (!next) {
      this.onStateChange?.(false, null)
      return
    }

    const signal = { aborted: false }
    this.activeJob = { job: next, signal }
    this.onStateChange?.(true, next.id)

    try {
      await next.execute(signal)
    } catch {
      // Degrade silently on playback interruption
    } finally {
      if (this.activeJob?.job === next) {
        this.activeJob = null
      }
      if (this.queue.length > 0) {
        void this.pump()
      } else {
        this.onStateChange?.(false, null)
      }
    }
  }
}

let activeBufferSource: AudioBufferSourceNode | null = null
let activeBufferGain: GainNode | null = null
const pinnedFallbackUtterances = new Set<SpeechSynthesisUtterance>()
let activeSpeechKeepaliveTimer: number | null = null

function clearSpeechKeepalive(): void {
  if (activeSpeechKeepaliveTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(activeSpeechKeepaliveTimer)
    activeSpeechKeepaliveTimer = null
  }
  pinnedFallbackUtterances.clear()
}

function notifyPlaybackState(isSpeaking: boolean, activeId: string | null) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(VOICE_PLAYBACK_EVENT, {
      detail: { isSpeaking, activeId },
    })
  )
}

function stopLowLevelAudioImmediately(): void {
  clearSpeechKeepalive()
  stopCoachVoiceCue()
  try {
    const ctx = getSharedCoachAudioContext()
    if (activeBufferGain && ctx) {
      const now = ctx.currentTime
      activeBufferGain.gain.cancelScheduledValues(now)
      activeBufferGain.gain.setValueAtTime(Math.max(0.0001, activeBufferGain.gain.value), now)
      activeBufferGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035)
    }
    if (activeBufferSource) {
      const src = activeBufferSource
      activeBufferSource = null
      window.setTimeout(() => {
        try {
          src.stop()
          src.disconnect()
        } catch {
          // ignore
        }
      }, 38)
    }
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // ignore
    }
  }
}

const globalVoiceQueue = new VoicePlaybackQueueController(notifyPlaybackState)

export function stopCoachVoicePlayback(): void {
  stopLowLevelAudioImmediately()
  globalVoiceQueue.stopAll()
}

if (typeof window !== 'undefined') {
  window.addEventListener(COACH_AUDIO_MODE_EVENT_NAME, (e: Event) => {
    const mode = (e as CustomEvent<{ mode?: CoachAudioMode }>).detail?.mode ?? getCoachAudioMode()
    if (mode !== 'voice_and_chimes') {
      stopCoachVoicePlayback()
    }
  })
}

function padAudioBufferTail(ctx: AudioContext, buffer: AudioBuffer, tailSeconds = 0.2): AudioBuffer {
  try {
    const extraFrames = Math.max(1, Math.ceil(buffer.sampleRate * tailSeconds))
    const padded = ctx.createBuffer(
      buffer.numberOfChannels,
      buffer.length + extraFrames,
      buffer.sampleRate
    )
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      padded.getChannelData(ch).set(buffer.getChannelData(ch), 0)
    }
    return padded
  } catch {
    return buffer
  }
}

async function playAudioBufferWithCrossfade(
  buffer: AudioBuffer,
  signal: { aborted: boolean }
): Promise<boolean> {
  if (signal.aborted) return false
  const ctx = getSharedCoachAudioContext()
  if (!ctx) return false
  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => { })
  }

  return new Promise<boolean>(resolve => {
    try {
      const source = ctx.createBufferSource()
      const gain = ctx.createGain()
      // Pad 200ms of silence on the tail so Bluetooth / CoreAudio / WebKit DAC buffers
      // flush the final consonant completely before onended disconnects the node.
      source.buffer = padAudioBufferTail(ctx, buffer, 0.2)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.02)

      source.connect(gain)
      gain.connect(ctx.destination)

      activeBufferSource = source
      activeBufferGain = gain

      source.onended = () => {
        if (activeBufferSource === source) {
          activeBufferSource = null
          activeBufferGain = null
        }
        resolve(true)
      }
      source.start(0)
    } catch {
      resolve(false)
    }
  })
}

function speakViaWebSpeechFallback(text: string, signal: { aborted: boolean }): Promise<void> {
  if (signal.aborted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve()
  }
  const clean = sanitizeCoachSpeechText(text)
  if (!clean) return Promise.resolve()

  const chunks = chunkTextIntoSpeechSentences(clean, 165)
  if (chunks.length === 0) return Promise.resolve()

  return new Promise(resolve => {
    try {
      clearSpeechKeepalive()
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()

      const preferred = getAuthoritativeCoachVoice()

      // Keepalive prevents Chrome/Safari from auto-pausing speechSynthesis after ~14s on multi-sentence descriptions
      activeSpeechKeepaliveTimer = window.setInterval(() => {
        if (signal.aborted) {
          clearSpeechKeepalive()
          return
        }
        try {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.resume()
          }
        } catch {
          // ignore
        }
      }, 9000)

      const speakChunkAt = (idx: number) => {
        if (signal.aborted || idx >= chunks.length) {
          clearSpeechKeepalive()
          resolve()
          return
        }

        const utterance = new SpeechSynthesisUtterance(chunks[idx])
        // Pin reference at module scope so V8 GC never collects the active utterance mid-sentence
        pinnedFallbackUtterances.clear()
        pinnedFallbackUtterances.add(utterance)
        utterance.rate = 0.98
        utterance.pitch = 0.94
        utterance.volume = 1.0
        if (preferred) utterance.voice = preferred

        utterance.onend = () => {
          speakChunkAt(idx + 1)
        }
        utterance.onerror = () => {
          clearSpeechKeepalive()
          resolve()
        }

        window.speechSynthesis.speak(utterance)
      }

      speakChunkAt(0)
    } catch {
      clearSpeechKeepalive()
      resolve()
    }
  })
}

/**
 * Plays a zero-latency static Coach Gordon cue (`staticCueMap`).
 * - `'muted'`: silent.
 * - `'chimes_only'`: subtle tactile Web Audio chime only.
 * - `'voice_and_chimes'`: static ElevenLabs `.mp3` buffer, or automatic Web Speech + chime fallback in local dev.
 */
export function playCoachStaticCue(cueKey: StaticCoachCueKey): void {
  const mode = getCoachAudioMode()
  if (mode === 'muted') return

  const cue = staticCueMap[cueKey]
  if (!cue) return

  if (mode === 'chimes_only') {
    playForgeTactileTone(cue.fallbackTone)
    return
  }

  globalVoiceQueue.enqueue({
    id: `static:${cue.key}`,
    priority: cue.priority,
    cancelActive: stopLowLevelAudioImmediately,
    execute: async signal => {
      if (signal.aborted || getCoachAudioMode() !== 'voice_and_chimes') return

      let decoded = decodedStaticBufferCache.get(cue.key) ?? null
      if (!decoded && !missingStaticAssets.has(cue.key)) {
        try {
          const res = await fetch(cue.assetPath, { cache: 'force-cache' })
          if (res.ok && res.headers.get('content-type')?.includes('audio')) {
            const bytes = await res.arrayBuffer()
            const ctx = getSharedCoachAudioContext()
            if (ctx && bytes.byteLength > 128) {
              decoded = await ctx.decodeAudioData(bytes.slice(0))
              decodedStaticBufferCache.set(cue.key, decoded)
            }
          } else {
            missingStaticAssets.add(cue.key)
          }
        } catch {
          missingStaticAssets.add(cue.key)
        }
      }

      // Tier 1.5 Fallback: If static .mp3 asset is not on disk yet, synthesize via Coach Gordon's
      // ElevenLabs voice (/api/voice/synthesize) and cache in IndexedDB + memory so it always uses
      // Coach Gordon's authentic cloned voice before ever falling back to browser Web Speech.
      if (!decoded) {
        try {
          const hash = await computeVoiceCacheHash(cue.spokenScript, DEFAULT_COACH_GORDON_VOICE_KEY)
          let dynBytes = await getCachedVoiceBlobFromIdb(hash)
          if (!dynBytes) {
            const synthRes = await fetch('/api/voice/synthesize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: cue.spokenScript,
                moment: cue.priority === 'safety' ? 'auto_regression_safety' : 'on_demand_chat',
                clientCacheHash: hash,
              }),
            })
            const synthType = synthRes.headers.get('content-type') || ''
            if (synthRes.ok && synthType.includes('audio/')) {
              const buf = await synthRes.arrayBuffer()
              if (buf.byteLength > 128) {
                dynBytes = buf
                await saveCachedVoiceBlobToIdb(hash, buf)
              }
            }
          }
          if (dynBytes) {
            const ctx = getSharedCoachAudioContext()
            if (ctx) {
              decoded = await ctx.decodeAudioData(dynBytes.slice(0))
              decodedStaticBufferCache.set(cue.key, decoded)
            }
          }
        } catch {
          // Offline / unavailable -> proceed to last-resort Web Speech fallback
        }
      }

      if (signal.aborted || getCoachAudioMode() !== 'voice_and_chimes') return

      if (decoded) {
        const ok = await playAudioBufferWithCrossfade(decoded, signal)
        if (ok) return
      }

      // Last-resort offline fallback: subtle tactile chime + Web Speech
      playForgeTactileTone(cue.fallbackTone)
      await speakViaWebSpeechFallback(cue.spokenScript, signal)
    },
  })
}

export interface SpeakDynamicOptions {
  id?: string
  moment: DynamicBriefingMoment
  priority?: VoicePriority
  forceUnlockVoiceOnTap?: boolean
}

/**
 * Synthesizes and speaks personalized Coach Gordon audio via `/api/voice/synthesize`
 * with SHA-256 IndexedDB + server caching, falling back automatically to Web Speech in local dev.
 */
export async function speakCoachDynamicText(
  rawText: string,
  options: SpeakDynamicOptions
): Promise<void> {
  if (options.forceUnlockVoiceOnTap) {
    unlockSharedAudioContextOnGesture()
    if (getCoachAudioMode() === 'muted') {
      setCoachAudioMode('voice_and_chimes')
    }
  }

  const mode = getCoachAudioMode()
  if (mode === 'muted') return
  if (mode === 'chimes_only' && !options.forceUnlockVoiceOnTap) {
    playForgeTactileTone('cue')
    return
  }

  const cleanText = sanitizeCoachSpeechText(rawText).trim()
  if (!cleanText) return

  const hash = await computeVoiceCacheHash(cleanText, DEFAULT_COACH_GORDON_VOICE_KEY)
  const jobId = options.id || `dyn:${options.moment}:${hash.slice(0, 12)}`
  const priority = options.priority ?? (options.moment === 'auto_regression_safety' ? 'safety' : 'normal')

  // Toggle stop if user tapped "Listen to Coach Gordon" on the exact clip currently speaking
  if (options.moment === 'on_demand_chat' && globalVoiceQueue.activeId === jobId) {
    stopCoachVoicePlayback()
    return
  }

  globalVoiceQueue.enqueue({
    id: jobId,
    priority,
    cancelActive: stopLowLevelAudioImmediately,
    execute: async signal => {
      if (signal.aborted) return
      const activeMode = getCoachAudioMode()
      if (activeMode === 'muted') return

      let audioBytes = await getCachedVoiceBlobFromIdb(hash)

      if (!audioBytes) {
        try {
          const res = await fetch('/api/voice/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: cleanText,
              moment: options.moment,
              clientCacheHash: hash,
            }),
          })

          const contentType = res.headers.get('content-type') || ''
          if (res.ok && contentType.includes('audio/')) {
            const buf = await res.arrayBuffer()
            if (buf.byteLength > 128) {
              audioBytes = buf
              await saveCachedVoiceBlobToIdb(hash, buf)
            }
          }
        } catch {
          // Network or local-dev offline fallback
        }
      }

      if (signal.aborted || getCoachAudioMode() === 'muted') return

      if (audioBytes) {
        const ctx = getSharedCoachAudioContext()
        if (ctx) {
          try {
            const decoded = await ctx.decodeAudioData(audioBytes.slice(0))
            const played = await playAudioBufferWithCrossfade(decoded, signal)
            if (played) return
          } catch {
            // Fall through to Web Speech
          }
        }
      }

      playForgeTactileTone('cue')
      await speakViaWebSpeechFallback(cleanText, signal)
    },
  })
}

// ── 4 High-Impact Personalized Dynamic Briefing Builders ──

export function buildPreWorkoutPersonalBriefing(params: {
  memberFirstName?: string | null
  optPhase?: number | null
  jointComfortScore100?: number | null
  lowestComfortRegion?: string | null
  readinessScore?: number | null
  environmentLabel?: string | null
  expressModeActive?: boolean
}): string {
  const firstName = (params.memberFirstName || 'Athlete').trim().split(/\s+/)[0]
  const hour = typeof window !== 'undefined' ? new Date().getHours() : 9
  const timeGreeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
  const phaseLabel = `Phase 0${params.optPhase || 2}`

  if (typeof params.jointComfortScore100 === 'number' && params.jointComfortScore100 <= 55) {
    const score5 = Math.max(1, Math.min(5, Math.round(params.jointComfortScore100 / 20)))
    const region = params.lowestComfortRegion || 'lower back and hips'
    return `${timeGreeting} ${firstName}—saw your ${region} comfort was a ${score5} out of 5 today, so I swapped heavy axial loading for supported joint-friendly work and queued a 2-minute mobility opener first. Take ${phaseLabel} smooth and controlled today.`
  }

  if (typeof params.readinessScore === 'number' && params.readinessScore < 68) {
    return `${timeGreeting} ${firstName}—your Forge Readiness came in at ${params.readinessScore}, so I auto-regulated today's ${phaseLabel} working loads by 15 percent to keep your joints and nervous system fresh. Focus on crisp eccentric tempo and smooth breathing.`
  }

  const envPart = params.environmentLabel ? ` in your ${params.environmentLabel} setup` : ''
  const expressPart = params.expressModeActive
    ? ' We are locked into 20-minute Express density—own every rep from set one.'
    : ` Your Readiness and joint comfort look strong—let's own your ${phaseLabel} tempo today.`

  return `${timeGreeting} ${firstName}—your ${phaseLabel} session${envPart} is dialed and ready.${expressPart}`
}

export function buildPostScanDiagnosticSummary(params: {
  scanType: 'posture_2min' | 'desk_ergonomics' | 'camera_readiness_30s'
  score: number
  primaryFinding?: string
  secondaryFinding?: string
  actionableFix?: string
}): string {
  if (params.scanType === 'desk_ergonomics') {
    return `Workstation scan locked at ${params.score} out of 100${params.primaryFinding ? `—your main strain point is ${params.primaryFinding}` : ''}. ${params.actionableFix || 'Raise your top screen bezel to eye level and run the 5-minute desk reset to open your chest and hips.'}`
  }
  if (params.scanType === 'posture_2min') {
    return `Two-minute posture check complete with an alignment score of ${params.score} out of 100${params.primaryFinding ? `, highlighted by ${params.primaryFinding}` : ''}. ${params.actionableFix || 'Stack your ribcage over your pelvis and keep hitting your daily chin tucks and scapular slides.'}`
  }
  return `Thirty-second readiness check scored ${params.score} out of 100${params.primaryFinding ? ` with ${params.primaryFinding}` : ''}. ${params.actionableFix || "I've calibrated your warm-up prep so Set 1 feels smooth and rock-solid."}`
}

export function buildAutoRegressionBriefing(params: {
  fromExercise: string
  toExercise: string
  tempo?: string
  reason: string
}): string {
  return `Good call flagging that—I swapped ${params.fromExercise} to ${params.toExercise}${params.tempo ? ` at a ${params.tempo} tempo` : ''}. ${params.reason}`
}

export function useCoachVoiceEngine() {
  const [audioMode, setAudioModeState] = useState<CoachAudioMode>('muted')
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null)

  useEffect(() => {
    setAudioModeState(getCoachAudioMode())

    const onModeChange = () => {
      setAudioModeState(getCoachAudioMode())
    }
    const onPlaybackChange = (e: Event) => {
      const detail = (e as CustomEvent<{ isSpeaking: boolean; activeId: string | null }>).detail
      if (detail) {
        setIsSpeaking(detail.isSpeaking)
        setActiveSpeakingId(detail.activeId)
      }
    }

    window.addEventListener(COACH_AUDIO_MODE_EVENT_NAME, onModeChange)
    window.addEventListener(VOICE_PLAYBACK_EVENT, onPlaybackChange)
    return () => {
      window.removeEventListener(COACH_AUDIO_MODE_EVENT_NAME, onModeChange)
      window.removeEventListener(VOICE_PLAYBACK_EVENT, onPlaybackChange)
    }
  }, [])

  const changeAudioMode = useCallback((mode: CoachAudioMode) => {
    setCoachAudioMode(mode)
    setAudioModeState(mode)
    if (mode !== 'muted') {
      playForgeTactileTone('chime')
    }
  }, [])

  return {
    audioMode,
    setAudioMode: changeAudioMode,
    isSpeaking,
    activeSpeakingId,
    stopVoicePlayback: stopCoachVoicePlayback,
    playStaticCue: playCoachStaticCue,
    speakDynamicText: speakCoachDynamicText,
  }
}
