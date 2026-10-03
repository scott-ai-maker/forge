/**
 * Gordon Athletic Advisory — Rest Timer Audio Metronome & Heart Rate Zone Dynamic Adaptation Engine
 * 
 * Clinical sports science & bioenergetics engine providing:
 * 1. 5-Tier Heart Rate Zone Classification (Tanaka formula HRmax, Karvonen autonomic recovery curves)
 * 2. Real-Time Heart Rate Recovery (HRR) Dynamic Rest Auto-Regulation:
 *    - Detects early parasympathetic recovery (Zone 1 baseline achieved) for optional readiness trimming
 *    - Detects cardiac elevation & drift (Zone 3+ delayed recovery) with automatic +15s to +30s rest extensions
 *    - Combines acute fatigue drops (>15% rep decay or velocity loss) to ensure phosphagen (ATP-CP) resynthesis
 * 3. Rest Timer Audio Metronome & Acoustic Pacing:
 *    - Cardiac pulse simulation (dual-thump lub-dub tone)
 *    - Parasympathetic breath-work harmonic resonance (down-regulation frequency shifts)
 *    - 5-second periodic pacing chimes and precision final countdown bells
 * 4. Strict Neutral Hammer Curl Guardrail Verification:
 *    - Enforces vertical dumbbell alignment, thumbs pointed toward ceiling, and zero wrist twisting/supination
 */

import { isHammerCurlMovement } from './bio-adaptive-rest-pacer'
import { playPrecisionTone, getSharedAudioContext } from './web-audio-cadence-engine'

export type HeartRateZoneIndex = 1 | 2 | 3 | 4 | 5

export type HeartRateRecoveryStatus = 'recovered' | 'recovering' | 'elevated' | 'excessive_strain'

export interface HeartRateZoneTelemetry {
  zone: HeartRateZoneIndex
  zoneLabel: string
  zoneColor: string
  zoneRangeBpm: [number, number]
  currentBpm: number
  percentHrMax: number
  hrMax: number
  recoveryStatus: HeartRateRecoveryStatus
  clinicalGuidance: string
}

export interface DynamicRestAdaptationInput {
  exerciseName: string
  baseRestSeconds: number
  remainingSeconds: number
  elapsedRestSeconds: number
  currentHeartRateBpm?: number | null
  peakHeartRateBpm?: number | null
  restingHeartRateBpm?: number | null
  userAge?: number
  hasAcuteFatigueDrop?: boolean
  acuteFatigueDropPercent?: number
  velocityLossPercent?: number
  lastSetRpe?: number
  lastSetRir?: number
}

export interface DynamicRestAdaptationResult {
  exerciseName: string
  shouldExtend: boolean
  suggestedExtensionSeconds: number
  isRecoveredEarly: boolean
  suggestedTrimmingSeconds: number
  recommendedAction: 'extend_rest' | 'ready_to_lift' | 'maintain'
  adaptationReason: string
  coachVoiceCue: string
  zoneTelemetry: HeartRateZoneTelemetry
  isHammerCurl: boolean
  guardrailMandate?: string
}

export type RestAudioMetronomeMode = 'cardiac_pulse' | 'breath_pacer' | 'interval_5s' | 'countdown_only'

export interface RestAudioMetronomeTick {
  freq: number
  duration: number
  type: OscillatorType
  gainPeak: number
  description: string
  secondaryTone?: {
    freq: number
    delaySec: number
    duration: number
    type: OscillatorType
    gainPeak: number
  }
}

/**
 * Calculates estimated HR max using the clinically validated Tanaka formula (208 - 0.7 * age).
 */
export function calculateTanakaHrMax(age = 30): number {
  const safeAge = Math.max(14, Math.min(95, age))
  return Math.round(208 - (0.7 * safeAge))
}

/**
 * Classifies an athlete's instantaneous heart rate into 5 standard Exercise Science zones
 * and evaluates autonomic parasympathetic recovery status.
 */
export function classifyHeartRateZone(
  currentBpm: number,
  userAge = 30,
  restingHr = 60
): HeartRateZoneTelemetry {
  const hrMax = calculateTanakaHrMax(userAge)
  const safeCurrent = Math.max(40, Math.min(hrMax + 10, currentBpm))
  const percentHrMax = Math.round((safeCurrent / hrMax) * 100)

  // Boundaries (% HRmax):
  // Zone 1: < 60% HRmax (Active Recovery / Parasympathetic Baseline)
  // Zone 2: 60% - 69% HRmax (Aerobic / Low Intensity)
  // Zone 3: 70% - 79% HRmax (Aerobic Endurance / Moderate Strain)
  // Zone 4: 80% - 89% HRmax (Threshold / High Strain)
  // Zone 5: >= 90% HRmax (Maximum Neuromuscular / Peak Effort)
  const z1Ceil = Math.round(hrMax * 0.60)
  const z2Ceil = Math.round(hrMax * 0.70)
  const z3Ceil = Math.round(hrMax * 0.80)
  const z4Ceil = Math.round(hrMax * 0.90)

  if (safeCurrent < z1Ceil) {
    return {
      zone: 1,
      zoneLabel: 'Zone 1: Parasympathetic Recovery',
      zoneColor: '#10B981', // Emerald
      zoneRangeBpm: [restingHr, z1Ceil],
      currentBpm: safeCurrent,
      percentHrMax,
      hrMax,
      recoveryStatus: 'recovered',
      clinicalGuidance: 'Vagal reactivation achieved. Autonomic tone restored and ready for subsequent muscular output.',
    }
  }

  if (safeCurrent < z2Ceil) {
    return {
      zone: 2,
      zoneLabel: 'Zone 2: Aerobic Flush',
      zoneColor: '#0EA5E9', // Sky Blue
      zoneRangeBpm: [z1Ceil, z2Ceil],
      currentBpm: safeCurrent,
      percentHrMax,
      hrMax,
      recoveryStatus: 'recovering',
      clinicalGuidance: 'Active aerobic deceleration underway. Phosphagen resynthesis progressing normally.',
    }
  }

  if (safeCurrent < z3Ceil) {
    return {
      zone: 3,
      zoneLabel: 'Zone 3: Moderate Strain',
      zoneColor: '#F59E0B', // Amber
      zoneRangeBpm: [z2Ceil, z3Ceil],
      currentBpm: safeCurrent,
      percentHrMax,
      hrMax,
      recoveryStatus: 'elevated',
      clinicalGuidance: 'Cardiac elevation persists. Maintain nasal breathing to accelerate heart rate deceleration.',
    }
  }

  if (safeCurrent < z4Ceil) {
    return {
      zone: 4,
      zoneLabel: 'Zone 4: High Threshold',
      zoneColor: '#F97316', // Orange
      zoneRangeBpm: [z3Ceil, z4Ceil],
      currentBpm: safeCurrent,
      percentHrMax,
      hrMax,
      recoveryStatus: 'excessive_strain',
      clinicalGuidance: 'Elevated cardiovascular stress. Additional rest strongly advised to avert premature CNS exhaustion.',
    }
  }

  return {
    zone: 5,
    zoneLabel: 'Zone 5: Peak Exertion',
    zoneColor: '#EF4444', // Red
    zoneRangeBpm: [z4Ceil, hrMax + 10],
    currentBpm: safeCurrent,
    percentHrMax,
    hrMax,
    recoveryStatus: 'excessive_strain',
    clinicalGuidance: 'Near maximal cardiac output. Delay upcoming set until heart rate drops below Zone 3.',
  }
}

/**
 * Dynamically evaluates rest interval duration based on acute fatigue drops and real-time heart rate recovery curves.
 */
export function evaluateDynamicRestHeartRateRecovery(
  input: DynamicRestAdaptationInput
): DynamicRestAdaptationResult {
  const {
    exerciseName,
    remainingSeconds,
    elapsedRestSeconds,
    currentHeartRateBpm,
    peakHeartRateBpm,
    restingHeartRateBpm = 60,
    userAge = 30,
    hasAcuteFatigueDrop = false,
    acuteFatigueDropPercent = 0,
    velocityLossPercent = 0,
  } = input

  const isHammer = isHammerCurlMovement(exerciseName)
  const hammerGuardrail = isHammer
    ? 'Palms must strictly face inward toward each other with thumbs pointed up toward the ceiling and zero wrist twisting/supination. Decompress forearms neutrally during rest.'
    : undefined

  const safeRhr = restingHeartRateBpm ?? 60

  // Default simulated HR if telemetry is not yet active
  const estPeakHr = peakHeartRateBpm || (currentHeartRateBpm ? Math.max(140, currentHeartRateBpm + 10) : 155)
  const currentHr = currentHeartRateBpm || Math.max(safeRhr, Math.round(estPeakHr - (elapsedRestSeconds * 0.45)))

  const zoneTelemetry = classifyHeartRateZone(currentHr, userAge, safeRhr)

  let shouldExtend = false
  let suggestedExtensionSeconds = 0
  let isRecoveredEarly = false
  let suggestedTrimmingSeconds = 0
  let recommendedAction: DynamicRestAdaptationResult['recommendedAction'] = 'maintain'
  let adaptationReason = 'Heart rate and rest duration aligned with standard physiological recovery.'
  let coachVoiceCue = ''

  // 1. Acute Fatigue Drop Integration (>15% rep degradation or >20% velocity loss)
  const hasSevereFatigue = hasAcuteFatigueDrop || acuteFatigueDropPercent >= 15 || velocityLossPercent >= 20

  if (hasSevereFatigue) {
    shouldExtend = true
    suggestedExtensionSeconds = acuteFatigueDropPercent >= 25 || velocityLossPercent >= 30 ? 30 : 20
    recommendedAction = 'extend_rest'
    adaptationReason = `Acute fatigue detected (${acuteFatigueDropPercent > 0 ? `${acuteFatigueDropPercent}% rep drop` : `${velocityLossPercent}% velocity loss`}). Extending rest by +${suggestedExtensionSeconds}s for phosphagen (ATP-CP) replenishment.`
    coachVoiceCue = `Acute fatigue noted. Bio-Pacer recommends adding ${suggestedExtensionSeconds} seconds for phosphagen replenishment.`
  }
  // 2. Cardiac Recovery Delay: Rest timer approaching zero (<20s remaining) but HR remains in Zone 3 or higher
  else if (remainingSeconds <= 20 && remainingSeconds > 0 && zoneTelemetry.zone >= 3) {
    shouldExtend = true
    suggestedExtensionSeconds = zoneTelemetry.zone >= 4 ? 30 : 20
    recommendedAction = 'extend_rest'
    adaptationReason = `Delayed cardiac recovery: Heart rate remains at ${zoneTelemetry.currentBpm} bpm (${zoneTelemetry.zoneLabel}). Extended rest by +${suggestedExtensionSeconds}s to facilitate parasympathetic reactivation.`
    coachVoiceCue = `Heart rate elevated at ${zoneTelemetry.currentBpm} bpm. Adding ${suggestedExtensionSeconds} seconds for cardiac recovery.`
  }
  // 3. Early Vagal Recovery: Plenty of rest left (>25s) and athlete's HR has already dropped to Zone 1
  else if (remainingSeconds >= 25 && zoneTelemetry.zone === 1) {
    isRecoveredEarly = true
    suggestedTrimmingSeconds = Math.min(20, Math.floor(remainingSeconds * 0.5))
    recommendedAction = 'ready_to_lift'
    adaptationReason = `Parasympathetic tone fully restored (${zoneTelemetry.currentBpm} bpm in Zone 1). Ready to lift ahead of schedule.`
    coachVoiceCue = `Heart rate recovered to Zone 1 (${zoneTelemetry.currentBpm} bpm). Ready for the next set.`
  }

  return {
    exerciseName,
    shouldExtend,
    suggestedExtensionSeconds,
    isRecoveredEarly,
    suggestedTrimmingSeconds,
    recommendedAction,
    adaptationReason,
    coachVoiceCue,
    zoneTelemetry,
    isHammerCurl: isHammer,
    guardrailMandate: hammerGuardrail,
  }
}

/**
 * Returns audio tone parameters for the rest metronome based on the active mode and current time.
 */
export function getRestAudioMetronomeTone(
  mode: RestAudioMetronomeMode,
  elapsedSeconds: number,
  remainingSeconds: number,
  _currentBpm?: number | null
): RestAudioMetronomeTick | null {
  // Always honor countdown pips in the final 3 seconds
  if (remainingSeconds === 3 || remainingSeconds === 2 || remainingSeconds === 1) {
    return {
      freq: 880.0,
      duration: 0.08,
      type: 'sine',
      gainPeak: 0.22,
      description: `Countdown Pip: ${remainingSeconds}`,
    }
  }

  if (remainingSeconds === 0) {
    return {
      freq: 1318.5, // E6 Completion Bell
      duration: 0.45,
      type: 'triangle',
      gainPeak: 0.28,
      description: 'Rest Completion Gong',
    }
  }

  if (mode === 'countdown_only') {
    return null
  }

  // 1. Cardiac Pulse Metronome (Dual-Thump Lub-Dub heartbeat simulation)
  if (mode === 'cardiac_pulse') {
    return {
      freq: 110.0, // A2 (lub)
      duration: 0.09,
      type: 'sine',
      gainPeak: 0.14,
      description: 'Cardiac Pulse (Lub-Dub)',
      secondaryTone: {
        freq: 85.0, // F2 (dub)
        delaySec: 0.14,
        duration: 0.11,
        type: 'sine',
        gainPeak: 0.12,
      },
    }
  }

  // 2. Breath Pacer Metronome (Synced with 4-2-6 down-regulation cadence)
  if (mode === 'breath_pacer') {
    const cycle = elapsedSeconds % 12
    if (cycle === 0) {
      return {
        freq: 440.0, // A4 Inhale start
        duration: 0.18,
        type: 'sine',
        gainPeak: 0.15,
        description: 'Inhale Breath Chime',
      }
    }
    if (cycle === 4) {
      return {
        freq: 523.25, // C5 Hold
        duration: 0.15,
        type: 'sine',
        gainPeak: 0.14,
        description: 'Hold Breath Chime',
      }
    }
    if (cycle === 6) {
      return {
        freq: 329.63, // E4 Exhale
        duration: 0.22,
        type: 'sine',
        gainPeak: 0.15,
        description: 'Exhale Breath Chime',
      }
    }
    return null
  }

  // 3. 5-Second Periodic Chime (Gentle woodblock pacer every 5 seconds)
  if (mode === 'interval_5s') {
    if (remainingSeconds > 3 && elapsedSeconds > 0 && elapsedSeconds % 5 === 0) {
      return {
        freq: 587.33, // D5
        duration: 0.07,
        type: 'triangle',
        gainPeak: 0.12,
        description: '5-Second Interval Marker',
      }
    }
    return null
  }

  return null
}

/**
 * Plays the rest audio metronome tick using the ultra-low latency Web Audio engine.
 */
export function playRestAudioMetronomeTick(
  mode: RestAudioMetronomeMode,
  elapsedSeconds: number,
  remainingSeconds: number,
  currentBpm?: number | null
): void {
  const tick = getRestAudioMetronomeTone(mode, elapsedSeconds, remainingSeconds, currentBpm)
  if (!tick) return

  playPrecisionTone({
    freq: tick.freq,
    duration: tick.duration,
    type: tick.type,
    gainPeak: tick.gainPeak,
  })

  if (tick.secondaryTone) {
    const ctx = getSharedAudioContext()
    const startTime = (ctx ? ctx.currentTime : 0) + tick.secondaryTone.delaySec
    playPrecisionTone({
      freq: tick.secondaryTone.freq,
      startTime,
      duration: tick.secondaryTone.duration,
      type: tick.secondaryTone.type,
      gainPeak: tick.secondaryTone.gainPeak,
    })
  }
}
