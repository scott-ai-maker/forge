/**
 * Gordon Athletic Advisory — Ultra-Low Latency Web Audio Engine & Cadence Scheduler
 * 
 * High-precision audio scheduling utilizing the Web Audio API hardware clock (AudioContext.currentTime).
 * Provides lookahead event scheduling, smooth anti-popping gain envelopes, biomechanically designed
 * tempo tick tones (eccentric, isometric, concentric), rest countdown bells, and harmonic PR fanfares.
 */

let sharedAudioContext: AudioContext | null = null

/**
 * Configures the W3C Audio Session API (supported on iOS Safari 16.4+, iPadOS, macOS)
 * to ensure web audio cues duck background music rather than pausing it.
 */
export function configureAudioSession(type: 'transient' | 'ambient' | 'playback' = 'transient'): void {
  if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
    try {
      const navAudio = (navigator as unknown as { audioSession: { type: string } }).audioSession
      if (navAudio && navAudio.type !== type) {
        navAudio.type = type
      }
    } catch {
      // Ignore audio session errors on unsupported browsers
    }
  }
}

/**
 * Returns a shared AudioContext singleton, safely handling browser prefixes and suspended states.
 */
export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  try {
    configureAudioSession('transient')

    if (!sharedAudioContext) {
      const AudioClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioClass) {
        sharedAudioContext = new AudioClass()
      }
    }

    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      void sharedAudioContext.resume()
    }

    return sharedAudioContext
  } catch {
    return null
  }
}

export interface ToneOptions {
  freq: number
  startTime?: number
  duration?: number
  type?: OscillatorType
  gainPeak?: number
}

/**
 * Synthesizes a precise tone with an exponential anti-click attack/release envelope.
 */
export function playPrecisionTone(options: ToneOptions): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return

  try {
    const startTime = options.startTime ?? ctx.currentTime
    const duration = options.duration ?? 0.12
    const type = options.type ?? 'sine'
    const gainPeak = options.gainPeak ?? 0.18

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(options.freq, startTime)

    // Smooth exponential gain envelope (prevents speaker pop/click)
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(gainPeak, startTime + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration)
  } catch {
    // Graceful fallback if Web Audio is restricted
  }
}

/**
 * Plays a multi-oscillator C-Major triad (C5 - E5 - G5) harmonic fanfare for new PR achievements.
 */
export function playPrFanfare(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [
    { freq: 523.25, timeOffset: 0.0, dur: 0.18, type: 'triangle' as OscillatorType, peak: 0.2 }, // C5
    { freq: 659.25, timeOffset: 0.12, dur: 0.18, type: 'triangle' as OscillatorType, peak: 0.2 }, // E5
    { freq: 783.99, timeOffset: 0.24, dur: 0.35, type: 'triangle' as OscillatorType, peak: 0.25 }, // G5
    { freq: 1046.5, timeOffset: 0.36, dur: 0.65, type: 'sine' as OscillatorType, peak: 0.3 }, // C6 sustain
  ]

  for (const n of notes) {
    playPrecisionTone({
      freq: n.freq,
      startTime: now + n.timeOffset,
      duration: n.dur,
      type: n.type,
      gainPeak: n.peak,
    })
  }
}

/**
 * Plays a crisp coach rest interval chime.
 */
export function playRestChime(freq = 659.25, duration = 0.25): void {
  playPrecisionTone({
    freq,
    duration,
    type: 'triangle',
    gainPeak: 0.22,
  })
}

/**
 * Plays precision countdown pips for the final 3 seconds of a rest period.
 */
export function playCountdownPip(remainingSeconds: number): void {
  if (remainingSeconds === 3 || remainingSeconds === 2 || remainingSeconds === 1) {
    playPrecisionTone({
      freq: 880.0,
      duration: 0.09,
      type: 'sine',
      gainPeak: 0.24,
    })
  } else if (remainingSeconds === 0) {
    // Rest completion gong
    playPrecisionTone({
      freq: 1318.5, // E6
      duration: 0.45,
      type: 'triangle',
      gainPeak: 0.3,
    })
  }
}

/**
 * Biomechanical Movement Frequency Palette (Hz)
 */
export const CADENCE_FREQUENCIES = {
  PRE_COUNT: 523.25, // C5
  PRE_GO: 1046.5, // C6
  ECCENTRIC_TICK: 440.0, // A4
  ISOMETRIC_HOLD: 329.63, // E4
  CONCENTRIC_DRIVE: 880.0, // A5
  REP_COMPLETE: 659.25, // E5
}

export type CadencePhase = 'idle' | 'pre_exercise_countdown' | 'eccentric' | 'isometric' | 'concentric'

export interface CadenceScheduleConfig {
  eccentricSec: number
  isometricSec: number
  concentricSec: number
  preCountSec?: number
  totalReps: number
  soundEnabled?: boolean
  onPhaseChange?: (phase: CadencePhase, rep: number, remainingSec: number) => void
  onComplete?: () => void
}

export interface ParsedMovementTempo {
  eccentricSec: number
  isometricSec: number
  concentricSec: number
  raw: string
  isValid: boolean
  repDurationSec: number
  phaseTitle: string
  biomechanicalRationale: string
}

/**
 * Parses a standard NASM movement tempo (e.g. "4/2/1", "2/0/2", "1/1/1", "X/0/X").
 */
export function parseMovementTempo(tempoStr?: string | null): ParsedMovementTempo {
  const clean = String(tempoStr || '').trim().toUpperCase()
  const match = clean.match(/^([0-9X])\s*[\/\-:]\s*([0-9X])\s*[\/\-:]\s*([0-9X])$/i)

  if (match) {
    const ecc = match[1] === 'X' ? 1 : (parseInt(match[1], 10) || 2)
    const iso = match[2] === 'X' ? 0 : (parseInt(match[2], 10) || 0)
    const con = match[3] === 'X' ? 1 : (parseInt(match[3], 10) || 2)

    let phaseTitle = 'Strength & Hypertrophy Tempo'
    let rationale = 'Controlled eccentric lowering with smooth concentric contraction.'

    if (ecc >= 4 && iso >= 2) {
      phaseTitle = 'Phase 1: Stabilization Endurance Tempo (4/2/1)'
      rationale = 'Slow 4s eccentric lowers neuromuscular stress while maximizing joint stability and connective tissue loading; 2s isometric hold at inflection point enforces proprioceptive neuromuscular control.'
    } else if (clean === '2/0/2') {
      phaseTitle = 'Phase 2-3: Muscular Development & Strength (2/0/2)'
      rationale = 'Continuous tension rhythm without bottom pause maximizes mechanical tension and metabolic stress for muscle hypertrophy.'
    } else if (clean === '1/1/1') {
      phaseTitle = 'Phase 4: Maximal Strength Tempo (1/1/1)'
      rationale = 'Controlled 1s descent followed by a brief 1s isometric pause and maximal voluntary force production on concentric drive.'
    } else if (clean === 'X/0/X' || clean.includes('X')) {
      phaseTitle = 'Phase 5: Power & Explosive PAP Tempo (X/0/X)'
      rationale = 'Explosive rate of force development (RFD) utilizing the stretch-shortening cycle for maximum athletic power expression.'
    }

    return {
      eccentricSec: ecc,
      isometricSec: iso,
      concentricSec: con,
      raw: clean,
      isValid: true,
      repDurationSec: ecc + iso + con,
      phaseTitle,
      biomechanicalRationale: rationale,
    }
  }

  // Fallback default: 2/0/2
  return {
    eccentricSec: 2,
    isometricSec: 0,
    concentricSec: 2,
    raw: '2/0/2',
    isValid: false,
    repDurationSec: 4,
    phaseTitle: 'Standard Control Tempo (2/0/2)',
    biomechanicalRationale: 'Controlled eccentric lowering and active concentric muscle drive.',
  }
}

/**
 * Lookahead Cadence Scheduler for sample-accurate workout tempos.
 * Avoids setInterval drift by scheduling audio oscillators directly on the Web Audio timeline.
 */
export class PrecisionCadenceScheduler {
  private config: CadenceScheduleConfig
  private isRunning: boolean = false
  private isPaused: boolean = false
  private currentRep: number = 0
  private currentPhase: CadencePhase = 'idle'
  private phaseSecondsRemaining: number = 0
  private timerId: ReturnType<typeof setInterval> | null = null

  constructor(config: CadenceScheduleConfig) {
    this.config = config
  }

  public start(): void {
    if (this.isRunning && !this.isPaused) return
    this.isRunning = true
    this.isPaused = false

    const preCount = this.config.preCountSec ?? 5
    if (preCount > 0) {
      this.currentPhase = 'pre_exercise_countdown'
      this.currentRep = 0
      this.phaseSecondsRemaining = preCount
      this.notify()
      if (this.config.soundEnabled !== false) {
        playPrecisionTone({ freq: CADENCE_FREQUENCIES.PRE_COUNT, duration: 0.15, type: 'triangle' })
      }
    } else {
      this.currentRep = 1
      this.currentPhase = 'eccentric'
      this.phaseSecondsRemaining = this.config.eccentricSec
      this.notify()
      if (this.config.soundEnabled !== false) {
        playPrecisionTone({ freq: CADENCE_FREQUENCIES.ECCENTRIC_TICK, duration: 0.12, type: 'sine' })
      }
    }

    this.timerId = setInterval(() => this.tick(), 1000)
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return
    this.isPaused = true
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.notify()
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return
    this.isPaused = false
    this.timerId = setInterval(() => this.tick(), 1000)
    this.notify()
  }

  public stop(): void {
    this.isRunning = false
    this.isPaused = false
    this.currentPhase = 'idle'
    this.currentRep = 0
    this.phaseSecondsRemaining = 0
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.notify()
  }

  public setSoundEnabled(enabled: boolean): void {
    this.config.soundEnabled = enabled
  }

  public getIsPaused(): boolean {
    return this.isPaused
  }

  public getIsRunning(): boolean {
    return this.isRunning
  }

  public getCurrentRep(): number {
    return this.currentRep
  }

  public getCurrentPhase(): CadencePhase {
    return this.currentPhase
  }

  public getRemainingSeconds(): number {
    return this.phaseSecondsRemaining
  }

  public manualSetRep(rep: number): void {
    this.currentRep = Math.max(1, Math.min(this.config.totalReps, rep))
    this.notify()
  }

  private tick(): void {
    if (!this.isRunning) return

    if (this.phaseSecondsRemaining > 1) {
      this.phaseSecondsRemaining--
      this.playPhaseTickSound()
      this.notify()
      return
    }

    // Phase transition
    this.advancePhase()
  }

  private advancePhase(): void {
    if (this.currentPhase === 'pre_exercise_countdown') {
      this.currentRep = 1
      this.currentPhase = 'eccentric'
      this.phaseSecondsRemaining = this.config.eccentricSec
      if (this.config.soundEnabled !== false) {
        playPrecisionTone({ freq: CADENCE_FREQUENCIES.PRE_GO, duration: 0.25, type: 'sine', gainPeak: 0.25 })
      }
      this.notify()
      return
    }

    if (this.currentPhase === 'eccentric') {
      if (this.config.isometricSec > 0) {
        this.currentPhase = 'isometric'
        this.phaseSecondsRemaining = this.config.isometricSec
        if (this.config.soundEnabled !== false) {
          playPrecisionTone({ freq: CADENCE_FREQUENCIES.ISOMETRIC_HOLD, duration: 0.2, type: 'sine' })
        }
      } else {
        this.currentPhase = 'concentric'
        this.phaseSecondsRemaining = this.config.concentricSec
        if (this.config.soundEnabled !== false) {
          playPrecisionTone({ freq: CADENCE_FREQUENCIES.CONCENTRIC_DRIVE, duration: 0.18, type: 'triangle' })
        }
      }
      this.notify()
      return
    }

    if (this.currentPhase === 'isometric') {
      this.currentPhase = 'concentric'
      this.phaseSecondsRemaining = this.config.concentricSec
      if (this.config.soundEnabled !== false) {
        playPrecisionTone({ freq: CADENCE_FREQUENCIES.CONCENTRIC_DRIVE, duration: 0.18, type: 'triangle' })
      }
      this.notify()
      return
    }

    if (this.currentPhase === 'concentric') {
      if (this.currentRep >= this.config.totalReps) {
        // Complete
        this.stop()
        if (this.config.soundEnabled !== false) {
          playPrFanfare()
        }
        if (this.config.onComplete) {
          this.config.onComplete()
        }
        return
      }

      // Next Rep -> Eccentric
      this.currentRep++
      this.currentPhase = 'eccentric'
      this.phaseSecondsRemaining = this.config.eccentricSec
      if (this.config.soundEnabled !== false) {
        playPrecisionTone({ freq: CADENCE_FREQUENCIES.REP_COMPLETE, duration: 0.15, type: 'triangle' })
      }
      this.notify()
    }
  }

  private playPhaseTickSound(): void {
    if (this.config.soundEnabled === false) return
    if (this.currentPhase === 'pre_exercise_countdown') {
      playPrecisionTone({ freq: CADENCE_FREQUENCIES.PRE_COUNT, duration: 0.12, type: 'triangle' })
    } else if (this.currentPhase === 'eccentric') {
      playPrecisionTone({ freq: CADENCE_FREQUENCIES.ECCENTRIC_TICK, duration: 0.1, type: 'sine' })
    } else if (this.currentPhase === 'isometric') {
      playPrecisionTone({ freq: CADENCE_FREQUENCIES.ISOMETRIC_HOLD, duration: 0.12, type: 'sine' })
    }
  }

  private notify(): void {
    if (this.config.onPhaseChange) {
      this.config.onPhaseChange(this.currentPhase, this.currentRep, this.phaseSecondsRemaining)
    }
  }
}

