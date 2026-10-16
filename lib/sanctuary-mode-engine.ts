/**
 * Forge Athletic — The Zero-Distraction Gym Sanctuary Engine
 * 
 * Enforces the core brand promise:
 * "NO SOCIAL MEDIA. ZERO DISTRACTIONS. 100% COACHING & TOOLS."
 * 
 * Provides:
 * 1. Autonomic Down-Regulation Breathing Cadences (Box 4x4, 4-2-6 Vagal Recovery)
 * 2. In-Ear Web Audio Breath Metronomes (Hands on the bar, eyes off the phone)
 * 3. Rest Interval Distraction Guard & Tab-Switch Interception
 * 4. Sanctuary Focus Discipline Scoring & Tonnage Telemetry
 */

import { getSharedAudioContext } from './web-audio-cadence-engine'

export type SanctuaryBreathingCadence = 'box_4x4' | 'down_reg_4_2_6' | 'cardiac_recovery'

export type SanctuaryBreathingPhase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out'

export interface BreathingPhaseState {
  phase: SanctuaryBreathingPhase
  label: string
  sublabel: string
  phaseSeconds: number
  elapsedInPhase: number
  remainingInPhase: number
  progressPercent: number
  cycleSeconds: number
}

export interface SanctuaryDisciplineBadge {
  tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE'
  title: string
  badge: string
  quote: string
  score: number
  distractionEvents: number
  downRegBreaths: number
}

export interface SanctuaryInterventionCue {
  headline: string
  coachMessage: string
  voiceCue: string
  suggestedAction: string
}

/**
 * Returns the active breathing phase and progress based on elapsed rest seconds.
 */
export function getBreathingPhaseAtSeconds(
  elapsedSeconds: number,
  cadence: SanctuaryBreathingCadence = 'box_4x4'
): BreathingPhaseState {
  const safeElapsed = Math.max(0, elapsedSeconds)

  if (cadence === 'down_reg_4_2_6') {
    // 12-second total cycle: 4s inhale, 2s hold, 6s exhale
    const cycleSeconds = 12
    const cycleOffset = safeElapsed % cycleSeconds

    if (cycleOffset < 4) {
      const remainingInPhase = 4 - cycleOffset
      return {
        phase: 'inhale',
        label: 'Inhale',
        sublabel: 'Slow nasal breath into diaphragm',
        phaseSeconds: 4,
        elapsedInPhase: cycleOffset,
        remainingInPhase,
        progressPercent: Math.round((cycleOffset / 4) * 100),
        cycleSeconds,
      }
    } else if (cycleOffset < 6) {
      const elapsedInHold = cycleOffset - 4
      const remainingInPhase = 2 - elapsedInHold
      return {
        phase: 'hold_in',
        label: 'Hold',
        sublabel: 'Maintain gentle lung expansion',
        phaseSeconds: 2,
        elapsedInPhase: elapsedInHold,
        remainingInPhase,
        progressPercent: Math.round((elapsedInHold / 2) * 100),
        cycleSeconds,
      }
    } else {
      const elapsedInExhale = cycleOffset - 6
      const remainingInPhase = 6 - elapsedInExhale
      return {
        phase: 'exhale',
        label: 'Exhale',
        sublabel: 'Slow purse-lipped parasympathetic release',
        phaseSeconds: 6,
        elapsedInPhase: elapsedInExhale,
        remainingInPhase,
        progressPercent: Math.round((elapsedInExhale / 6) * 100),
        cycleSeconds,
      }
    }
  }

  if (cadence === 'cardiac_recovery') {
    // 10-second cycle: 3s inhale, 1s hold, 6s exhale
    const cycleSeconds = 10
    const cycleOffset = safeElapsed % cycleSeconds

    if (cycleOffset < 3) {
      return {
        phase: 'inhale',
        label: 'Inhale',
        sublabel: 'Deep nasal intake',
        phaseSeconds: 3,
        elapsedInPhase: cycleOffset,
        remainingInPhase: 3 - cycleOffset,
        progressPercent: Math.round((cycleOffset / 3) * 100),
        cycleSeconds,
      }
    } else if (cycleOffset < 4) {
      return {
        phase: 'hold_in',
        label: 'Hold',
        sublabel: 'Chest soft',
        phaseSeconds: 1,
        elapsedInPhase: cycleOffset - 3,
        remainingInPhase: 1,
        progressPercent: 50,
        cycleSeconds,
      }
    } else {
      const elapsedInExhale = cycleOffset - 4
      return {
        phase: 'exhale',
        label: 'Exhale',
        sublabel: 'Drop heart rate back to Zone 2',
        phaseSeconds: 6,
        elapsedInPhase: elapsedInExhale,
        remainingInPhase: 6 - elapsedInExhale,
        progressPercent: Math.round((elapsedInExhale / 6) * 100),
        cycleSeconds,
      }
    }
  }

  // Default: Box 4x4 (16-second cycle: 4s inhale, 4s hold in, 4s exhale, 4s hold out)
  const cycleSeconds = 16
  const cycleOffset = safeElapsed % cycleSeconds

  if (cycleOffset < 4) {
    return {
      phase: 'inhale',
      label: 'Inhale (4s)',
      sublabel: 'Expand ribcage and diaphragm',
      phaseSeconds: 4,
      elapsedInPhase: cycleOffset,
      remainingInPhase: 4 - cycleOffset,
      progressPercent: Math.round((cycleOffset / 4) * 100),
      cycleSeconds,
    }
  } else if (cycleOffset < 8) {
    const elapsed = cycleOffset - 4
    return {
      phase: 'hold_in',
      label: 'Hold (4s)',
      sublabel: 'Stillness without tension',
      phaseSeconds: 4,
      elapsedInPhase: elapsed,
      remainingInPhase: 4 - elapsed,
      progressPercent: Math.round((elapsed / 4) * 100),
      cycleSeconds,
    }
  } else if (cycleOffset < 12) {
    const elapsed = cycleOffset - 8
    return {
      phase: 'exhale',
      label: 'Exhale (4s)',
      sublabel: 'Smooth release through teeth',
      phaseSeconds: 4,
      elapsedInPhase: elapsed,
      remainingInPhase: 4 - elapsed,
      progressPercent: Math.round((elapsed / 4) * 100),
      cycleSeconds,
    }
  } else {
    const elapsed = cycleOffset - 12
    return {
      phase: 'hold_out',
      label: 'Pause (4s)',
      sublabel: 'Empty lungs, neutral heart rate',
      phaseSeconds: 4,
      elapsedInPhase: elapsed,
      remainingInPhase: 4 - elapsed,
      progressPercent: Math.round((elapsed / 4) * 100),
      cycleSeconds,
    }
  }
}

/**
 * Calculates the Sanctuary Focus Discipline Score (0 to 100%).
 * 
 * Perfect score starts at 100.
 * Penalties apply when athlete leaves the app during active rest intervals.
 * Bonus points are awarded for completed down-regulation breathing cycles.
 */
export function calculateSanctuaryFocusScore(
  sessionDurationSeconds: number,
  distractionEvents: number,
  totalDistractionSeconds: number,
  downRegBreaths = 0
): number {
  if (sessionDurationSeconds <= 0 && distractionEvents === 0) {
    return 100
  }

  // Base score 100
  let score = 100

  // Penalty per distraction event (e.g. checking Instagram/Twitter during rest)
  const eventPenalty = distractionEvents * 14
  // Penalty for time spent away from the workout
  const durationPenalty = Math.min(30, Math.floor(totalDistractionSeconds / 8))

  // Reward for conscious down-regulation breathwork (up to +15 pts)
  const breathReward = Math.min(15, downRegBreaths * 2)

  score = score - eventPenalty - durationPenalty + breathReward

  return Math.max(10, Math.min(100, Math.round(score)))
}

/**
 * Generates an authoritative post-workout discipline badge and Coach Gordon sign-off.
 */
export function getSanctuaryDisciplineBadge(
  focusScore: number,
  distractionEvents = 0,
  downRegBreaths = 0
): SanctuaryDisciplineBadge {
  const safeScore = Math.max(0, Math.min(100, focusScore))

  if (safeScore >= 95) {
    return {
      tier: 'DIAMOND',
      title: 'Sanctuary Master',
      badge: '100% Focused · Zero Distractions',
      quote: 'The gym is sacred ground. You kept your hands on the bar and your mind on mechanical tension.',
      score: safeScore,
      distractionEvents,
      downRegBreaths,
    }
  } else if (safeScore >= 85) {
    return {
      tier: 'GOLD',
      title: 'High-Discipline Lifter',
      badge: 'Elite Focus · Down-Regulation Completed',
      quote: 'Exceptional focus across working sets. Heart rate recovered cleanly between intervals.',
      score: safeScore,
      distractionEvents,
      downRegBreaths,
    }
  } else if (safeScore >= 70) {
    return {
      tier: 'SILVER',
      title: 'Steady Execution',
      badge: 'Solid Workout · Minor Distraction',
      quote: 'Good mechanical work today. Next session, keep your attention inside the room between sets.',
      score: safeScore,
      distractionEvents,
      downRegBreaths,
    }
  } else {
    return {
      tier: 'BRONZE',
      title: 'Refocus Needed',
      badge: 'Rest Disrupted · Distraction Detected',
      quote: 'Remember our code: No feeds, no clout. Your recovery between heavy sets belongs to your nervous system.',
      score: safeScore,
      distractionEvents,
      downRegBreaths,
    }
  }
}

/**
 * Returns UI styling, colors, and formatted copy for the Sanctuary discipline badge.
 */
export function getSanctuaryBadge(score: number): {
  title: string
  subtitle: string
  badgeColor: string
  accentBorder: string
} {
  const badge = getSanctuaryDisciplineBadge(score)
  const colors: Record<SanctuaryDisciplineBadge['tier'], { badgeColor: string; accentBorder: string }> = {
    DIAMOND: { badgeColor: '#34D399', accentBorder: 'rgba(52, 211, 153, 0.5)' },
    GOLD: { badgeColor: '#FBBF24', accentBorder: 'rgba(251, 191, 36, 0.45)' },
    SILVER: { badgeColor: '#38BDF8', accentBorder: 'rgba(56, 189, 248, 0.45)' },
    BRONZE: { badgeColor: '#F87171', accentBorder: 'rgba(248, 113, 113, 0.45)' },
  }
  return {
    title: badge.title,
    subtitle: badge.quote,
    badgeColor: colors[badge.tier].badgeColor,
    accentBorder: colors[badge.tier].accentBorder,
  }
}

/**
 * Dynamic Coach Gordon intervention cue when returning to the workout after an external distraction.
 */
export function getDistractionInterceptionCue(
  distractionCount: number,
  exerciseName = 'Next Exercise'
): SanctuaryInterventionCue {
  if (distractionCount <= 1) {
    return {
      headline: 'SANCTUARY MODE // FOCUS RESTORED',
      coachMessage: `Leave the notifications outside. Your nervous system needs this rest period to resynthesize ATP-CP before ${exerciseName}.`,
      voiceCue: 'Focus restored. Hands on the bar, not on the feed.',
      suggestedAction: 'Take 3 down-regulation breaths',
    }
  } else if (distractionCount === 2) {
    return {
      headline: 'SANCTUARY ALERT // PROTECT YOUR FOCUS',
      coachMessage: 'The gym is sacred ground. Doom-scrolling between sets spikes cortisol and drops bar velocity. Dial back in.',
      voiceCue: 'Lock back in. Breathe through your nose.',
      suggestedAction: 'Resume box breathing',
    }
  } else {
    return {
      headline: 'COACH GORDON // EYES ON THE WEIGHTS',
      coachMessage: 'We do not sell your attention; we build your body. Finish this session with zero more screen switches.',
      voiceCue: 'Own this set. No more distractions.',
      suggestedAction: 'Commit to 100% focus',
    }
  }
}

/**
 * Synthesizes harmonic breath guidance tones using Web Audio API.
 * High-precision, zero external audio assets.
 */
export function playSanctuaryBreathTone(
  phase: SanctuaryBreathingPhase,
  customCtx?: AudioContext | null
): void {
  const ctx = customCtx || getSharedAudioContext()
  if (!ctx || ctx.state === 'suspended') return

  try {
    const now = ctx.currentTime

    if (phase === 'inhale') {
      // Gentle ascending sine wave: 220Hz (A3) -> 330Hz (E4)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(330, now + 1.2)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.3)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 1.2)
    } else if (phase === 'hold_in') {
      // Soft sustained harmonic bell (440Hz / A4)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, now)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.05, now + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.8)
    } else if (phase === 'exhale') {
      // Soothing descending sine wave: 330Hz (E4) -> 196Hz (G3)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(330, now)
      osc.frequency.exponentialRampToValueAtTime(196, now + 1.4)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.07, now + 0.2)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 1.4)
    } else if (phase === 'hold_out') {
      // Deep grounding pulse (130.8Hz / C3)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(130.81, now)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.06, now + 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.7)
    }
  } catch {
    // Silently fall back if Web Audio API is restricted
  }
}

/**
 * Plays a discrete, respectful dual-tone chime when returning from an app switch.
 */
export function playSanctuaryInterventionAlert(customCtx?: AudioContext | null): void {
  const ctx = customCtx || getSharedAudioContext()
  if (!ctx || ctx.state === 'suspended') return

  try {
    const now = ctx.currentTime

    // Two-tone bell (587.33Hz D5 -> 880Hz A5)
    ;[587.33, 880.0].forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.1)
      gain.gain.setValueAtTime(0.001, now + idx * 0.1)
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.1 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.1)
      osc.stop(now + idx * 0.1 + 0.5)
    })
  } catch {
    // Fail silently if audio context unavailable
  }
}
