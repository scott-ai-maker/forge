/**
 * Forge Athletic — Active Rest Cardio Pacer & Heart Rate Recovery Engine
 * 
 * Clinical sports science & bioenergetics engine providing:
 * 1. Real-Time Heart Rate Recovery (HRR) Tracking (1-minute vagal reactivation drop & recovery rate)
 * 2. Parasympathetic Breath-Work Cadence Pacer (4-2-6 Down-Regulation, 4-4-4-4 Box Breathing, 2-1-6 Physiological Sigh)
 * 3. Movement-Specific Intra-Rest Mobility Guidance with Strict Neutral Hammer Curl Guardrail Enforcement
 */

import { isHammerCurlMovement } from './bio-adaptive-rest-pacer'

export type BreathingPattern = 'down_regulation_4_2_6' | 'box_4_4_4_4' | 'physiological_sigh'

export type BreathingPhase = 'inhale' | 'inhale_top_up' | 'hold' | 'exhale' | 'pause'

export type HeartRateRecoveryTier = 'exceptional' | 'athletic' | 'moderate' | 'delayed'

export interface HeartRateRecoveryInput {
  peakHeartRateBpm: number
  currentHeartRateBpm: number
  elapsedRestSeconds: number
  restingHeartRateBpm?: number
  userAge?: number
}

export interface HeartRateRecoveryTelemetry {
  peakHeartRateBpm: number
  currentHeartRateBpm: number
  dropBpm: number
  projected60sDropBpm: number
  tier: HeartRateRecoveryTier
  tierLabel: string
  tierColor: string
  targetRecoveryBpm: number
  isAtTarget: boolean
  clinicalInsight: string
}

export interface BreathWorkState {
  pattern: BreathingPattern
  patternLabel: string
  phase: BreathingPhase
  phaseLabel: string
  guidanceText: string
  phaseElapsedSeconds: number
  phaseDurationSeconds: number
  phaseProgress: number // 0.0 to 1.0 for smooth CSS animation
  cycleElapsedSeconds: number
  cycleTotalSeconds: number
  cycleCount: number
  toneFreq: number
  coachVoiceNotice: string
}

export interface IntraRestMobilityCue {
  exerciseName: string
  title: string
  action: string
  targetMuscles: string[]
  durationSuggestionSec: number
  isHammerCurl: boolean
  guardrailMandate?: string
}

/**
 * Evaluates Heart Rate Recovery (HRR) against clinical autonomic recovery benchmarks.
 */
export function evaluateHeartRateRecovery(input: HeartRateRecoveryInput): HeartRateRecoveryTelemetry {
  const {
    peakHeartRateBpm,
    currentHeartRateBpm,
    elapsedRestSeconds,
    restingHeartRateBpm = 60,
    userAge = 30,
  } = input

  const safePeak = Math.max(80, peakHeartRateBpm)
  const safeCurrent = Math.max(45, Math.min(safePeak, currentHeartRateBpm))
  const safeElapsed = Math.max(1, elapsedRestSeconds)

  const dropBpm = Math.max(0, safePeak - safeCurrent)

  // Calculate 1-minute standardized recovery velocity
  const projected60sDropBpm = safeElapsed >= 5
    ? Math.min(75, Math.round((dropBpm / safeElapsed) * 60))
    : dropBpm

  // Target recovery HR: ~40% return toward resting baseline or 65% HRmax
  const estHrMax = 208 - (0.7 * userAge)
  const zone1Ceiling = Math.round(estHrMax * 0.65)
  const targetRecoveryBpm = Math.min(
    zone1Ceiling,
    Math.round(restingHeartRateBpm + (safePeak - restingHeartRateBpm) * 0.45)
  )

  let tier: HeartRateRecoveryTier = 'delayed'
  let tierLabel = 'Delayed HRR'
  let tierColor = '#EF4444'
  let clinicalInsight = 'Slow parasympathetic reactivation. Initiate extended nasal exhalations to stimulate vagal nerve tone.'

  const evalMetric = safeElapsed >= 45 ? dropBpm : projected60sDropBpm

  if (evalMetric >= 30) {
    tier = 'exceptional'
    tierLabel = 'Exceptional Vagal Reactivation'
    tierColor = '#10B981'
    clinicalInsight = 'Superior cardiovascular efficiency and rapid autonomic parasympathetic recovery.'
  } else if (evalMetric >= 20) {
    tier = 'athletic'
    tierLabel = 'Athletic Recovery Pace'
    tierColor = '#34D399'
    clinicalInsight = 'Robust heart rate deceleration. On track for full metabolic readiness for upcoming set.'
  } else if (evalMetric >= 12) {
    tier = 'moderate'
    tierLabel = 'Moderate Recovery'
    tierColor = '#FBBF24'
    clinicalInsight = 'Moderate autonomic deceleration. Use the 4-2-6 down-regulation breathing pacer below.'
  }

  return {
    peakHeartRateBpm: safePeak,
    currentHeartRateBpm: safeCurrent,
    dropBpm,
    projected60sDropBpm,
    tier,
    tierLabel,
    tierColor,
    targetRecoveryBpm,
    isAtTarget: safeCurrent <= targetRecoveryBpm,
    clinicalInsight,
  }
}

/**
 * Calculates real-time breath-work cadence phase and sub-second progress for parasympathetic down-regulation.
 */
export function getBreathWorkCadenceState(
  elapsedRestSeconds: number,
  pattern: BreathingPattern = 'down_regulation_4_2_6'
): BreathWorkState {
  const safeElapsed = Math.max(0, elapsedRestSeconds)

  if (pattern === 'box_4_4_4_4') {
    // 4s Inhale, 4s Hold, 4s Exhale, 4s Pause (16s total)
    const cycleTotal = 16
    const cycleElapsed = safeElapsed % cycleTotal
    const cycleCount = Math.floor(safeElapsed / cycleTotal) + 1

    if (cycleElapsed < 4) {
      const pElapsed = cycleElapsed
      return {
        pattern,
        patternLabel: 'Box Breathing (4-4-4-4)',
        phase: 'inhale',
        phaseLabel: 'Inhale',
        guidanceText: 'Deep nasal inhalation expanding diaphragm',
        phaseElapsedSeconds: pElapsed,
        phaseDurationSeconds: 4,
        phaseProgress: pElapsed / 4,
        cycleElapsedSeconds: cycleElapsed,
        cycleTotalSeconds: cycleTotal,
        cycleCount,
        toneFreq: 440.0,
        coachVoiceNotice: 'Slow nasal inhale.',
      }
    } else if (cycleElapsed < 8) {
      const pElapsed = cycleElapsed - 4
      return {
        pattern,
        patternLabel: 'Box Breathing (4-4-4-4)',
        phase: 'hold',
        phaseLabel: 'Hold',
        guidanceText: 'Softly hold breath with relaxed shoulders',
        phaseElapsedSeconds: pElapsed,
        phaseDurationSeconds: 4,
        phaseProgress: 1.0,
        cycleElapsedSeconds: cycleElapsed,
        cycleTotalSeconds: cycleTotal,
        cycleCount,
        toneFreq: 523.25,
        coachVoiceNotice: 'Hold smoothly.',
      }
    } else if (cycleElapsed < 12) {
      const pElapsed = cycleElapsed - 8
      return {
        pattern,
        patternLabel: 'Box Breathing (4-4-4-4)',
        phase: 'exhale',
        phaseLabel: 'Exhale',
        guidanceText: 'Smooth continuous exhalation through mouth or nose',
        phaseElapsedSeconds: pElapsed,
        phaseDurationSeconds: 4,
        phaseProgress: 1.0 - (pElapsed / 4),
        cycleElapsedSeconds: cycleElapsed,
        cycleTotalSeconds: cycleTotal,
        cycleCount,
        toneFreq: 349.23,
        coachVoiceNotice: 'Slow complete exhale.',
      }
    } else {
      const pElapsed = cycleElapsed - 12
      return {
        pattern,
        patternLabel: 'Box Breathing (4-4-4-4)',
        phase: 'pause',
        phaseLabel: 'Empty Pause',
        guidanceText: 'Pause in stillness before next breath cycle',
        phaseElapsedSeconds: pElapsed,
        phaseDurationSeconds: 4,
        phaseProgress: 0.0,
        cycleElapsedSeconds: cycleElapsed,
        cycleTotalSeconds: cycleTotal,
        cycleCount,
        toneFreq: 329.63,
        coachVoiceNotice: 'Pause in stillness.',
      }
    }
  }

  if (pattern === 'physiological_sigh') {
    // 2s Inhale, 1s Top-Up Inhale, 0.5s Pause, 5.5s Exhale (9s total)
    const cycleTotal = 9
    const cycleElapsed = safeElapsed % cycleTotal
    const cycleCount = Math.floor(safeElapsed / cycleTotal) + 1

    if (cycleElapsed < 2) {
      const pElapsed = cycleElapsed
      return {
        pattern,
        patternLabel: 'Physiological Sigh (2-1-6)',
        phase: 'inhale',
        phaseLabel: 'First Inhale',
        guidanceText: 'Deep nasal inhalation to 80% lung capacity',
        phaseElapsedSeconds: pElapsed,
        phaseDurationSeconds: 2,
        phaseProgress: (pElapsed / 2) * 0.8,
        cycleElapsedSeconds: cycleElapsed,
        cycleTotalSeconds: cycleTotal,
        cycleCount,
        toneFreq: 440.0,
        coachVoiceNotice: 'Deep nasal inhale.',
      }
    } else if (cycleElapsed < 3) {
      const pElapsed = cycleElapsed - 2
      return {
        pattern,
        patternLabel: 'Physiological Sigh (2-1-6)',
        phase: 'inhale_top_up',
        phaseLabel: 'Sharp Top-Up',
        guidanceText: 'Sharp second nasal sip to fully re-inflate alveoli',
        phaseElapsedSeconds: pElapsed,
        phaseDurationSeconds: 1,
        phaseProgress: 0.8 + (pElapsed * 0.2),
        cycleElapsedSeconds: cycleElapsed,
        cycleTotalSeconds: cycleTotal,
        cycleCount,
        toneFreq: 587.33,
        coachVoiceNotice: 'Sharp top-up sip.',
      }
    } else if (cycleElapsed < 3.5) {
      const pElapsed = cycleElapsed - 3
      return {
        pattern,
        patternLabel: 'Physiological Sigh (2-1-6)',
        phase: 'hold',
        phaseLabel: 'Brief Pause',
        guidanceText: 'Micro-pause at peak capacity',
        phaseElapsedSeconds: pElapsed,
        phaseDurationSeconds: 0.5,
        phaseProgress: 1.0,
        cycleElapsedSeconds: cycleElapsed,
        cycleTotalSeconds: cycleTotal,
        cycleCount,
        toneFreq: 523.25,
        coachVoiceNotice: 'Pause.',
      }
    } else {
      const pElapsed = cycleElapsed - 3.5
      const pDur = 5.5
      return {
        pattern,
        patternLabel: 'Physiological Sigh (2-1-6)',
        phase: 'exhale',
        phaseLabel: 'Prolonged Exhale',
        guidanceText: 'Slow, sighing oral exhale to dump CO2 and decelerate heart rate',
        phaseElapsedSeconds: pElapsed,
        phaseDurationSeconds: pDur,
        phaseProgress: Math.max(0, 1.0 - (pElapsed / pDur)),
        cycleElapsedSeconds: cycleElapsed,
        cycleTotalSeconds: cycleTotal,
        cycleCount,
        toneFreq: 329.63,
        coachVoiceNotice: 'Slow prolonged sighing exhale.',
      }
    }
  }

  // Default: down_regulation_4_2_6 (4s Inhale, 2s Hold, 6s Exhale = 12s total)
  const cycleTotal = 12
  const cycleElapsed = safeElapsed % cycleTotal
  const cycleCount = Math.floor(safeElapsed / cycleTotal) + 1

  if (cycleElapsed < 4) {
    const pElapsed = cycleElapsed
    return {
      pattern,
      patternLabel: 'Down-Regulation (4-2-6)',
      phase: 'inhale',
      phaseLabel: 'Inhale (4s)',
      guidanceText: 'Inhale smoothly through nose into belly',
      phaseElapsedSeconds: pElapsed,
      phaseDurationSeconds: 4,
      phaseProgress: pElapsed / 4,
      cycleElapsedSeconds: cycleElapsed,
      cycleTotalSeconds: cycleTotal,
      cycleCount,
      toneFreq: 440.0,
      coachVoiceNotice: 'Inhale through nose.',
    }
  } else if (cycleElapsed < 6) {
    const pElapsed = cycleElapsed - 4
    return {
      pattern,
      patternLabel: 'Down-Regulation (4-2-6)',
      phase: 'hold',
      phaseLabel: 'Hold (2s)',
      guidanceText: 'Hold gently without tension in neck or jaw',
      phaseElapsedSeconds: pElapsed,
      phaseDurationSeconds: 2,
      phaseProgress: 1.0,
      cycleElapsedSeconds: cycleElapsed,
      cycleTotalSeconds: cycleTotal,
      cycleCount,
      toneFreq: 523.25,
      coachVoiceNotice: 'Hold gently.',
    }
  } else {
    const pElapsed = cycleElapsed - 6
    return {
      pattern,
      patternLabel: 'Down-Regulation (4-2-6)',
      phase: 'exhale',
      phaseLabel: 'Exhale (6s)',
      guidanceText: 'Slow prolonged nasal or pursed-lip exhale for vagal tone',
      phaseElapsedSeconds: pElapsed,
      phaseDurationSeconds: 6,
      phaseProgress: Math.max(0, 1.0 - (pElapsed / 6)),
      cycleElapsedSeconds: cycleElapsed,
      cycleTotalSeconds: cycleTotal,
      cycleCount,
      toneFreq: 329.63,
      coachVoiceNotice: 'Long prolonged exhale.',
    }
  }
}

/**
 * Provides contextual intra-rest active mobility and decompression cues
 * based on the movement pattern just performed.
 */
export function getIntraRestMobilityCue(exerciseName: string): IntraRestMobilityCue {
  const isHammer = isHammerCurlMovement(exerciseName)
  const lower = exerciseName.toLowerCase()

  // 1. STRICT GUARDRAIL: Hammer Curl neutral grip decompression
  if (isHammer) {
    return {
      exerciseName,
      title: 'Neutral Hammer Grip Forearm Decompression',
      action: 'Relax forearm flexors & brachioradialis with palms facing inward. Maintain strictly vertical dumbbell orientation with thumbs pointed up; zero wrist supination or twisting.',
      targetMuscles: ['Brachioradialis', 'Wrist Extensors', 'Biceps Brachii'],
      durationSuggestionSec: 25,
      isHammerCurl: true,
      guardrailMandate: 'PALMS MUST ALWAYS FACE INWARD TOWARD EACH OTHER (NEUTRAL GRIP) WITH STRICTLY ZERO TWISTING OR SUPINATION. THUMBS POINTED UP TOWARD CEILING.',
    }
  }

  // 2. Squat & Lower Body Compound (Knee/Hip Dominant)
  if (lower.includes('squat') || lower.includes('leg press') || lower.includes('lunge') || lower.includes('step-up')) {
    return {
      exerciseName,
      title: 'Half-Kneeling Hip Flexor & Glute Reset',
      action: 'Tuck pelvis and squeeze trailing glute to open anterior hip capsule, counteracting hip flexor shortening between heavy sets.',
      targetMuscles: ['Psoas', 'Rectus Femoris', 'Gluteus Medius'],
      durationSuggestionSec: 30,
      isHammerCurl: false,
    }
  }

  // 3. Posterior Chain & Hinges (Deadlift, RDL, Good Morning, Hip Thrust)
  if (lower.includes('deadlift') || lower.includes('rdl') || lower.includes('thrust') || lower.includes('swing')) {
    return {
      exerciseName,
      title: 'Standing Cat-Cow & Hamstring Unloading',
      action: 'Place hands on knees, arch and round thoracic/lumbar spine gently with breaths to decompress spinal erectors and restore hamstring compliance.',
      targetMuscles: ['Erector Spinae', 'Thoracolumbar Fascia', 'Hamstrings'],
      durationSuggestionSec: 25,
      isHammerCurl: false,
    }
  }

  // 4. Horizontal/Vertical Pressing (Bench, Overhead Press, Incline, Push-Up)
  if (lower.includes('bench') || lower.includes('press') || lower.includes('push-up') || lower.includes('dip')) {
    return {
      exerciseName,
      title: 'Doorway Pec Stretch & Thoracic Extension',
      action: 'Rest forearms against uprights at 90 degrees; lean forward slightly on exhale to stretch pectorals and decompress anterior deltoids.',
      targetMuscles: ['Pectoralis Major', 'Anterior Deltoid', 'Thoracic Spine'],
      durationSuggestionSec: 25,
      isHammerCurl: false,
    }
  }

  // 5. Pulling & Back (Row, Pull-Up, Lat Pulldown)
  if (lower.includes('row') || lower.includes('pull-up') || lower.includes('chin-up') || lower.includes('pulldown')) {
    return {
      exerciseName,
      title: 'Dead Hang or Bar Lat Reach',
      action: 'Hold bar with relaxed grip or reach forward onto rack, allowing lats and intercostals to lengthen with each deep diaphragmatic exhale.',
      targetMuscles: ['Latissimus Dorsi', 'Teres Major', 'Posterior Capsule'],
      durationSuggestionSec: 25,
      isHammerCurl: false,
    }
  }

  // 6. General Diaphragmatic Walking Recovery (Default)
  return {
    exerciseName,
    title: 'Diaphragmatic Walking Venous Flush',
    action: 'Pace slowly with tall posture and slow nasal breathing to engage the calf muscle pump and accelerate venous blood return to the heart.',
    targetMuscles: ['Soleus / Gastrocnemius', 'Diaphragm', 'Autonomic Nervous System'],
    durationSuggestionSec: 30,
    isHammerCurl: false,
  }
}
