/**
 * Gordon Athletic Advisory — AI Coach Gordon Voiceover Cardio Engine
 * 
 * Core cardiorespiratory conditioning engine delivering:
 * - Modality-agnostic coaching (neutral to treadmill, bike, rower, stairmaster, outdoor, etc.)
 * - RPE 1–10 exertion scale anchored to explicit respiratory biometrics and breathing sensations
 * - Dynamic session length scaling (10m, 15m, 20m, 30m, 45m, or custom duration)
 * - 6 distinct science-backed cardio patterns
 * - Coach Gordon signature persona: deep empathy & kindness backed by a swift kick in the butt
 */

export type CardioPatternId =
  | 'zone2_aerobic_engine'
  | 'hiit_1_to_2'
  | 'pyramid_ladder'
  | 'threshold_tempo_over_under'
  | 'tabata_micro_bursts'
  | 'parasympathetic_recovery_flush'

export interface RpeBreathingProfile {
  rpe: number
  intensityLabel: string
  breathingPacingSeconds: number // Total seconds per breath cycle (in + out)
  inBreathSeconds: number
  outBreathSeconds: number
  breathMethod: 'nasal_only' | 'nasal_in_oral_out' | 'deep_diaphragmatic' | 'rapid_ventilation' | 'maximal_ventilation'
  breathingSensation: string
  talkTest: string
  primaryRespiratoryCue: string
  locomotorStrideRatio: string
  locomotorRowerRatio: string
  locomotorCyclingRatio: string
  inPocketCoachingDirective: string
}

export interface CardioIntervalSegment {
  id: string
  title: string
  segmentType: 'warmup' | 'work' | 'recovery' | 'cooldown'
  durationSeconds: number
  targetRpe: number
  breathingProfile: RpeBreathingProfile
  voiceCues: {
    startCue: string
    midIntervalCue?: string
    countdown10sCue?: string
    swiftKickCue?: string
  }
}

export interface CardioPatternDefinition {
  id: CardioPatternId
  name: string
  subtitle: string
  category: 'base' | 'interval' | 'threshold' | 'anaerobic' | 'recovery'
  optPhaseAlignment: string
  bioenergeticTarget: string
  defaultDurationMins: number
  allowedDurations: number[]
  targetRpeRange: [number, number]
  recommendedModalitiesNeutralHint: string
  coachMemoTemplate: string
  generateIntervals: (targetDurationMinutes: number) => CardioIntervalSegment[]
}

/**
 * Detailed RPE 1–10 respiratory biometric mapping.
 * Connects subjective exertion to physical breathing mechanics and
 * Locomotor-Respiratory Coupling (LRC) for hands-free, in-pocket phone training.
 */
export const RPE_BREATHING_REGISTRY: Record<number, RpeBreathingProfile> = {
  1: {
    rpe: 1,
    intensityLabel: 'Very Light / Passive Recovery',
    breathingPacingSeconds: 8,
    inBreathSeconds: 4,
    outBreathSeconds: 4,
    breathMethod: 'nasal_only',
    breathingSensation: 'Effortless, gentle nasal breathing. No chest involvement; soft belly rise.',
    talkTest: 'Can recite complete paragraphs or sing without interruption.',
    primaryRespiratoryCue: 'Soft nasal breathing only. Let your nervous system settle completely.',
    locomotorStrideRatio: '4:4 or 5:5 Strides (4-5 steps in, 4-5 steps out)',
    locomotorRowerRatio: 'Slow recovery slide inhale, gentle exhale on release',
    locomotorCyclingRatio: '4:4 pedal revolutions (slow easy turnover)',
    inPocketCoachingDirective: 'Keep your phone in your pocket. Breathe slow and easy through your nose: count 4 to 5 slow steps on each inhale, and 4 to 5 steps on each exhale.',
  },
  2: {
    rpe: 2,
    intensityLabel: 'Light Warm-Up / Active Flush',
    breathingPacingSeconds: 6,
    inBreathSeconds: 3,
    outBreathSeconds: 3,
    breathMethod: 'nasal_only',
    breathingSensation: 'Rhythmic, calm nasal breathing. Comfortable and relaxed.',
    talkTest: 'Can speak continuous full sentences easily with zero shortness of breath.',
    primaryRespiratoryCue: 'Slow and controlled through the nose. Let your heart rate come up gently.',
    locomotorStrideRatio: '4:4 Strides (4 steps in, 4 steps out)',
    locomotorRowerRatio: 'Gentle inhale on slide, smooth exhale on drive',
    locomotorCyclingRatio: '4:4 pedal revolutions',
    inPocketCoachingDirective: 'If your phone is in your pocket, don\'t look down. Take 4 steps breathing in through the nose, and 4 steps breathing out. Nice and easy.',
  },
  3: {
    rpe: 3,
    intensityLabel: 'Moderate Recovery / Aerobic Warm-Up',
    breathingPacingSeconds: 5,
    inBreathSeconds: 2.5,
    outBreathSeconds: 2.5,
    breathMethod: 'nasal_in_oral_out',
    breathingSensation: 'Smooth nasal inhale, relaxed mouth exhale. Breath is audible but completely in control.',
    talkTest: 'Can comfortably hold a normal conversation without gasping.',
    primaryRespiratoryCue: 'In through the nose, smooth exhale through the mouth. Establish a steady rhythm.',
    locomotorStrideRatio: '3:3 to 4:4 Strides (3-4 steps in, 3-4 steps out)',
    locomotorRowerRatio: 'Smooth nasal inhale on slide, steady exhale on drive',
    locomotorCyclingRatio: '3:3 pedal revolutions',
    inPocketCoachingDirective: 'Lock into your cadence: 3 or 4 strides breathing in, 3 or 4 strides breathing out. Establish your baseline rhythm without looking at a screen.',
  },
  4: {
    rpe: 4,
    intensityLabel: 'Zone 2 Base / Sustainable Aerobic',
    breathingPacingSeconds: 4,
    inBreathSeconds: 2,
    outBreathSeconds: 2,
    breathMethod: 'nasal_in_oral_out',
    breathingSensation: 'Deep diaphragmatic breathing. Belly expands on each breath. Noticeable oxygen demand but sustainable for hours.',
    talkTest: 'Can speak in complete sentences, but pausing slightly between thoughts.',
    primaryRespiratoryCue: 'Deep belly breaths. You should be able to speak a sentence to me, but you feel your lungs working.',
    locomotorStrideRatio: '3:3 Strides (3 steps in, 3 steps out)',
    locomotorRowerRatio: 'Deep nasal inhale on recovery slide, continuous exhale on drive',
    locomotorCyclingRatio: '3:3 pedal downstrokes',
    inPocketCoachingDirective: 'If your phone is in your pocket, keep your eyes on the horizon. Lock your breath to your feet: 3 strides in—left, right, left—and 3 strides out—right, left, right. Deep belly breaths.',
  },
  5: {
    rpe: 5,
    intensityLabel: 'Zone 2 Peak / Aerobic Transition',
    breathingPacingSeconds: 3.5,
    inBreathSeconds: 1.7,
    outBreathSeconds: 1.8,
    breathMethod: 'nasal_in_oral_out',
    breathingSensation: 'Breathing is deep and deliberate. Diaphragm and lower ribcage fully engaged.',
    talkTest: 'Speech is limited to 6 to 8 words at a time before requiring an inhale.',
    primaryRespiratoryCue: 'Rhythmic and locked in. In through the nose, out through pursed lips. Do not rush the breath.',
    locomotorStrideRatio: '3:3 Strides (3 steps in, 3 steps out)',
    locomotorRowerRatio: 'Inhale on recovery slide, controlled exhale on drive',
    locomotorCyclingRatio: '3:3 pedal downstrokes',
    inPocketCoachingDirective: 'Hold that 3:3 footstep rhythm. In through the nose for 3 strides, out through pursed lips for 3 strides. Do not let your footsteps drift.',
  },
  6: {
    rpe: 6,
    intensityLabel: 'Tempo Cruise / Sub-Threshold',
    breathingPacingSeconds: 3,
    inBreathSeconds: 1.5,
    outBreathSeconds: 1.5,
    breathMethod: 'deep_diaphragmatic',
    breathingSensation: 'Breathing is deep, continuous, and purposeful. Full chest and abdominal expansion.',
    talkTest: 'Short phrases only (4 to 5 words). Conversing requires effort.',
    primaryRespiratoryCue: 'Your breathing should be deep and forceful now. Draw that air into the pit of your stomach.',
    locomotorStrideRatio: '2:2 to 3:3 Strides (2-3 steps in, 2-3 steps out)',
    locomotorRowerRatio: 'Full deep inhale on slide, forceful exhale on drive',
    locomotorCyclingRatio: '2:2 to 3:3 pedal revolutions',
    inPocketCoachingDirective: 'Tempo pace: lock into a solid 2:2 stride cadence. Two strides inhaling deep, two strides exhaling with purpose.',
  },
  7: {
    rpe: 7,
    intensityLabel: 'Aerobic Threshold (VT1) / Hard Cruise',
    breathingPacingSeconds: 2.5,
    inBreathSeconds: 1.2,
    outBreathSeconds: 1.3,
    breathMethod: 'deep_diaphragmatic',
    breathingSensation: 'Breathing is labored and heavy. Lungs are demanding continuous oxygen delivery.',
    talkTest: 'Short 3-word bursts only. Cannot maintain a conversation.',
    primaryRespiratoryCue: 'Deep, powerful breaths. You can only give me two or three words at a time. Own that rhythm.',
    locomotorStrideRatio: '2:2 Strides (2 steps in, 2 steps out)',
    locomotorRowerRatio: 'Forceful drive exhale, quick deep slide inhale',
    locomotorCyclingRatio: '2:2 pedal revolutions',
    inPocketCoachingDirective: 'Threshold cruising: 2 strides in, 2 strides out. Deep, powerful lung expansion locked directly into your turnover.',
  },
  8: {
    rpe: 8,
    intensityLabel: 'Lactate Threshold / HIIT Work Interval',
    breathingPacingSeconds: 2,
    inBreathSeconds: 1,
    outBreathSeconds: 1,
    breathMethod: 'rapid_ventilation',
    breathingSensation: 'Rapid, deep oral breathing. Burning sensation in the lungs and working muscles.',
    talkTest: 'One or two words maximum (e.g., "Yes", "Pushing"). Full sentences impossible.',
    primaryRespiratoryCue: 'Rapid, deep breathing. Pull that air in through mouth and nose together. One-word answers only!',
    locomotorStrideRatio: '2:2 or 2:1 Strides (2 steps in, 1-2 steps out)',
    locomotorRowerRatio: 'Dual breath cycle per stroke: inhale catch, punch drive',
    locomotorCyclingRatio: '2:1 rapid pedal turnover',
    inPocketCoachingDirective: 'Surge! 2:1 stride cadence: two quick steps in, punch the air out on the strike! Demand that oxygen!',
  },
  9: {
    rpe: 9,
    intensityLabel: 'VO2 Max / Peak Anaerobic Effort',
    breathingPacingSeconds: 1.5,
    inBreathSeconds: 0.7,
    outBreathSeconds: 0.8,
    breathMethod: 'rapid_ventilation',
    breathingSensation: 'Heavy, forceful hyperventilation. Diaphragm working at near-maximum capacity.',
    talkTest: 'Talking is completely impossible. Vocal cords locked into breathing.',
    primaryRespiratoryCue: 'Maximal air exchange! Forceful exhales. Do not panic—focus every ounce of energy into your breath!',
    locomotorStrideRatio: '2:1 or 1:1 Strides (explosive ventilation)',
    locomotorRowerRatio: 'Explosive exhale at the catch-drive, rapid slide exchange',
    locomotorCyclingRatio: '1:1 high-cadence burst',
    inPocketCoachingDirective: 'All out! 1:1 stride rhythm: explosive breaths synchronized with every single footstrike or stroke! Empty the tank!',
  },
  10: {
    rpe: 10,
    intensityLabel: 'Supramaximal Sprint / All-Out Finisher',
    breathingPacingSeconds: 1.2,
    inBreathSeconds: 0.5,
    outBreathSeconds: 0.7,
    breathMethod: 'maximal_ventilation',
    breathingSensation: 'Extreme respiratory demand. Gasping, explosive breath bursts. Pure anaerobic glycolysis.',
    talkTest: 'Zero speech. Completely breathless.',
    primaryRespiratoryCue: 'All-out! Empty the tank! Explosive exhales with every stride, stroke, or turnover!',
    locomotorStrideRatio: '1:1 Strides (maximal turnover ventilation)',
    locomotorRowerRatio: 'Maximal power exhale on every single stroke',
    locomotorCyclingRatio: '1:1 maximal sprint ventilation',
    inPocketCoachingDirective: 'Maximum sprint! Punch your air out with every footstrike or stroke turnover! Zero hesitation!',
  },
}

export function getBreathingProfileForRpe(rpe: number): RpeBreathingProfile {
  const rounded = Math.max(1, Math.min(10, Math.round(rpe)))
  return RPE_BREATHING_REGISTRY[rounded] || RPE_BREATHING_REGISTRY[5]
}

export interface LocomotorCadenceGuidance {
  modalityCategory: 'running_walking' | 'rowing' | 'cycling' | 'stairmaster' | 'general'
  ratioLabel: string
  inhaleSteps: number | string
  exhaleSteps: number | string
  rhythmicCadencePattern: string
  inEarSpokenGuidance: string
  inPocketDirective: string
}

/**
 * Calculates modality-specific Locomotor-Respiratory Coupling (LRC) guidance.
 * Couples breathing directly to mechanical strides, rowing slide/drive phases,
 * or pedal downstrokes so athletes can keep their phone in their pocket without looking at screens.
 */
export function getLocomotorCadenceGuidance(
  targetRpe: number,
  modality: string = 'running'
): LocomotorCadenceGuidance {
  const norm = (modality || '').toLowerCase()
  const rpe = Math.max(1, Math.min(10, Math.round(targetRpe)))
  const profile = getBreathingProfileForRpe(rpe)

  // 1. Rowing Machine / Concept2 Ergometer
  if (norm.includes('row') || norm.includes('erg')) {
    if (rpe <= 5) {
      return {
        modalityCategory: 'rowing',
        ratioLabel: 'Inhale Slide · Exhale Drive',
        inhaleSteps: 'Slide',
        exhaleSteps: 'Drive',
        rhythmicCadencePattern: 'Inhale on Recovery Slide · Power Exhale on Drive',
        inEarSpokenGuidance: 'Phone stays in your pocket. On the rower, lock your breath to your stroke: inhale smooth and deep through your nose on the recovery slide forward to the catch, then power exhale through pursed lips as you drive through your heels.',
        inPocketDirective: profile.locomotorRowerRatio || 'Inhale on recovery slide, power exhale on drive',
      }
    } else if (rpe <= 7) {
      return {
        modalityCategory: 'rowing',
        ratioLabel: 'Deep Slide Inhale · Forceful Drive Exhale',
        inhaleSteps: 'Slide',
        exhaleSteps: 'Drive',
        rhythmicCadencePattern: 'Deep Inhale on Slide · Forceful Drive Exhale',
        inEarSpokenGuidance: 'Maintain stroke discipline. Full deep inhale as you roll up the slide to the catch, and explode your breath out as you drive with the legs.',
        inPocketDirective: profile.locomotorRowerRatio || 'Forceful drive exhale, quick deep slide inhale',
      }
    } else {
      return {
        modalityCategory: 'rowing',
        ratioLabel: 'Dual-Breath Cycle (Catch & Release)',
        inhaleSteps: 'Catch',
        exhaleSteps: 'Finish',
        rhythmicCadencePattern: 'Quick Inhale Catch · Punch Drive Exhale',
        inEarSpokenGuidance: 'High stroke rating: dual-breath rhythm. Quick breath at the catch, explosive breath through the drive and finish! Never hold your breath.',
        inPocketDirective: profile.locomotorRowerRatio || 'Dual breath cycle per stroke: inhale catch, punch drive',
      }
    }
  }

  // 2. Stationary / Assault / Spin Bike
  if (norm.includes('bike') || norm.includes('cycle') || norm.includes('spin')) {
    if (rpe <= 3) {
      return {
        modalityCategory: 'cycling',
        ratioLabel: '4:4 Revolution Cadence',
        inhaleSteps: 4,
        exhaleSteps: 4,
        rhythmicCadencePattern: 'In (4 Downstrokes) · Out (4 Downstrokes)',
        inEarSpokenGuidance: 'Keep your phone in your pocket. On the bike, count your pedal downstrokes: 4 revolutions breathing in through the nose, 4 revolutions breathing out. Nice and easy.',
        inPocketDirective: profile.locomotorCyclingRatio || '4:4 pedal revolutions (slow easy turnover)',
      }
    } else if (rpe <= 5) {
      return {
        modalityCategory: 'cycling',
        ratioLabel: '3:3 Revolution Cadence',
        inhaleSteps: 3,
        exhaleSteps: 3,
        rhythmicCadencePattern: 'In (3 Downstrokes) · Out (3 Downstrokes)',
        inEarSpokenGuidance: 'Lock into a 3:3 pedal cadence: 3 pedal downstrokes inhaling deep into your belly, 3 downstrokes exhaling through pursed lips. Smooth 360-degree pedal circles.',
        inPocketDirective: profile.locomotorCyclingRatio || '3:3 pedal downstrokes',
      }
    } else if (rpe <= 7) {
      return {
        modalityCategory: 'cycling',
        ratioLabel: '2:2 Revolution Cadence',
        inhaleSteps: 2,
        exhaleSteps: 2,
        rhythmicCadencePattern: 'In (2 Downstrokes) · Out (2 Downstrokes)',
        inEarSpokenGuidance: 'Cadence lock: 2 pedal downstrokes breathing in, 2 pedal downstrokes breathing out. Keep your upper body relaxed and stable.',
        inPocketDirective: profile.locomotorCyclingRatio || '2:2 pedal revolutions',
      }
    } else {
      return {
        modalityCategory: 'cycling',
        ratioLabel: '2:1 or 1:1 High-Cadence Burst',
        inhaleSteps: 2,
        exhaleSteps: 1,
        rhythmicCadencePattern: 'In (2 Strokes) · Out (1 Stroke)',
        inEarSpokenGuidance: 'Sprint turnover! Punch your air out with every pedal downstroke! High-speed turnover, synchronized breathing!',
        inPocketDirective: profile.locomotorCyclingRatio || '2:1 or 1:1 rapid pedal turnover',
      }
    }
  }

  // 3. Stairmaster / Stepper
  if (norm.includes('stair') || norm.includes('step')) {
    if (rpe <= 5) {
      return {
        modalityCategory: 'stairmaster',
        ratioLabel: '2:2 Step Cadence',
        inhaleSteps: 2,
        exhaleSteps: 2,
        rhythmicCadencePattern: 'In (2 Steps) · Out (2 Steps)',
        inEarSpokenGuidance: 'On the stairs, keep your head up and phone in your pocket. Take 2 steps breathing in through your nose, and 2 steps exhaling through pursed lips. Plant your full foot on each step.',
        inPocketDirective: '2 steps in through nose, 2 steps out through pursed lips',
      }
    } else {
      return {
        modalityCategory: 'stairmaster',
        ratioLabel: '2:1 or 1:1 Step Cadence',
        inhaleSteps: 2,
        exhaleSteps: 1,
        rhythmicCadencePattern: 'In (2 Steps) · Out (1 Step)',
        inEarSpokenGuidance: 'Stand tall over the stairs. Two steps inhaling, one forceful step exhaling. Drive through the heels, hands resting lightly on the rails.',
        inPocketDirective: '2 steps in, 1 explosive step out',
      }
    }
  }

  // 4. Running / Walking / Treadmill / Elliptical / General
  const isGeneral = norm.includes('ski') || norm.includes('jump') || norm.includes('other') || norm.includes('general')
  const category = isGeneral ? 'general' : 'running_walking'

  if (rpe <= 2) {
    return {
      modalityCategory: category,
      ratioLabel: '4:4 Stride Cadence',
      inhaleSteps: 4,
      exhaleSteps: 4,
      rhythmicCadencePattern: 'In (1, 2, 3, 4) · Out (1, 2, 3, 4)',
      inEarSpokenGuidance: 'Keep your phone in your pocket. Breathe slow and easy through your nose: count 4 slow steps on each inhale, and 4 steps on each exhale. Pure parasympathetic rhythm.',
      inPocketDirective: profile.locomotorStrideRatio || '4:4 Strides (4 steps in, 4 steps out)',
    }
  } else if (rpe <= 5) {
    return {
      modalityCategory: category,
      ratioLabel: '3:3 Stride Cadence',
      inhaleSteps: 3,
      exhaleSteps: 3,
      rhythmicCadencePattern: 'In (1, 2, 3) · Out (1, 2, 3)',
      inEarSpokenGuidance: 'Keep your phone in your pocket and eyes on the horizon. Lock your breath to your footsteps: 3 strides in—left, right, left—and 3 strides out—right, left, right. Deep belly breaths.',
      inPocketDirective: profile.locomotorStrideRatio || '3:3 Strides (3 steps in, 3 steps out)',
    }
  } else if (rpe <= 7) {
    return {
      modalityCategory: category,
      ratioLabel: '2:2 Stride Cadence',
      inhaleSteps: 2,
      exhaleSteps: 2,
      rhythmicCadencePattern: 'In (1, 2) · Out (1, 2)',
      inEarSpokenGuidance: 'Tempo cruising pace. Lock into a 2:2 stride rhythm: 2 strides inhaling through your nose and mouth, 2 strides exhaling with purpose.',
      inPocketDirective: profile.locomotorStrideRatio || '2:2 Strides (2 steps in, 2 steps out)',
    }
  } else if (rpe === 8) {
    return {
      modalityCategory: category,
      ratioLabel: '2:1 Stride Cadence',
      inhaleSteps: 2,
      exhaleSteps: 1,
      rhythmicCadencePattern: 'In (1, 2) · Out (1)',
      inEarSpokenGuidance: 'Surge pace! 2:1 stride cadence: two quick steps in, punch your breath out on the strike! Demand that oxygen!',
      inPocketDirective: profile.locomotorStrideRatio || '2:1 Strides (2 steps in, 1 step out)',
    }
  } else {
    return {
      modalityCategory: category,
      ratioLabel: '1:1 Stride Cadence',
      inhaleSteps: 1,
      exhaleSteps: 1,
      rhythmicCadencePattern: 'In (1) · Out (1)',
      inEarSpokenGuidance: 'All-out sprint! 1:1 stride rhythm: explosive breaths synchronized with every single footstrike or turnover! Empty the tank!',
      inPocketDirective: profile.locomotorStrideRatio || '1:1 Strides (explosive turnover)',
    }
  }
}

/**
 * Coach Gordon Persona Spontaneous "Swift Kick in the Butt" audio cues.
 * High-empathy accountability delivered when clients need to conquer the mental wall.
 */
export const COACH_GORDON_SWIFT_KICKS = [
  'I see you reaching for that down arrow. Keep your hands off the controls! We do not negotiate with fatigue in this house.',
  'Listen to me: your legs are lying to you right now. Your mind wants to quit two minutes before your body actually needs to. Dig in!',
  'You told me you wanted results. This exact 30 seconds right here is where those results are forged. Do not let yourself off the hook!',
  'Breathe deep into your belly! Stop shallow breathing! Drop your shoulders, lock your core, and give me the pace you promised me.',
  'I have all the love and empathy in the world for you, but I will not let you shortchange yourself today. Pick that cadence up!',
  'Quit bargaining with the clock! Look straight ahead, find your rhythm, and finish this interval like the athlete you are.',
  'Fatigue is just a sensation. You are in control of how you respond to it. Drive through this burn—right now!',
  'Nobody ever got stronger by quitting when it got uncomfortable. You are stronger than this interval. Prove it to yourself!',
]

export function getRandomSwiftKick(): string {
  const idx = Math.floor(Math.random() * COACH_GORDON_SWIFT_KICKS.length)
  return COACH_GORDON_SWIFT_KICKS[idx]
}

/**
 * 6 Master Cardio Patterns for Coach Gordon to Prescribe
 */
export const CARDIO_PATTERNS: Record<CardioPatternId, CardioPatternDefinition> = {
  // ── 1. ZONE 2 AEROBIC ENGINE BUILDER ──────────────────────────────────────
  zone2_aerobic_engine: {
    id: 'zone2_aerobic_engine',
    name: 'Zone 2 Aerobic Engine Builder',
    subtitle: 'Continuous steady-state conditioning for mitochondrial density and fat oxidation',
    category: 'base',
    optPhaseAlignment: 'Phase 1: Stabilization Endurance & Phase 2: Strength Endurance',
    bioenergeticTarget: 'Lipid beta-oxidation, mitochondrial biogenesis, and cardiac stroke volume.',
    defaultDurationMins: 30,
    allowedDurations: [15, 20, 30, 45, 60],
    targetRpeRange: [4, 5],
    recommendedModalitiesNeutralHint: 'Treadmill incline walk, stationary bike, rower, stairmaster, or outdoor jog/walk.',
    coachMemoTemplate: 'Maintain strict nasal-in, mouth-out breathing throughout. Keep intensity at RPE 4–5 so you can speak a full sentence without gasping.',
    generateIntervals(totalMinutes: number): CardioIntervalSegment[] {
      const warmupSecs = totalMinutes <= 15 ? 120 : totalMinutes <= 20 ? 180 : 300
      const cooldownSecs = totalMinutes <= 15 ? 120 : 180
      const mainWorkSecs = totalMinutes * 60 - warmupSecs - cooldownSecs

      // Split main work into two checkpoints for coaching feedback
      const halfMainSecs = Math.floor(mainWorkSecs / 2)
      const secondHalfSecs = mainWorkSecs - halfMainSecs

      return [
        {
          id: 'z2-warmup',
          title: 'Warm-Up & Respiratory Baseline',
          segmentType: 'warmup',
          durationSeconds: warmupSecs,
          targetRpe: 3,
          breathingProfile: getBreathingProfileForRpe(3),
          voiceCues: {
            startCue: `Coach Gordon here. We are locking into ${totalMinutes} minutes of Zone 2 engine building. Whatever machine or path you are on, bring your cadence up gradually. In through the nose, out through the mouth. Settle your mind.`,
            midIntervalCue: 'Check your posture. Keep your chest tall and let your shoulders melt down away from your ears. Target effort is RPE 3.',
            countdown10sCue: 'In ten seconds, we transition directly into our steady Zone 2 cruising pace. Prepare to hold RPE 4 to 5.',
          },
        },
        {
          id: 'z2-block-1',
          title: 'Zone 2 Cruise (Part 1: Rhythm Lock)',
          segmentType: 'work',
          durationSeconds: halfMainSecs,
          targetRpe: 4,
          breathingProfile: getBreathingProfileForRpe(4),
          voiceCues: {
            startCue: 'Lock into RPE 4. Deep belly breaths. If your phone is in your pocket, don\'t look down: sync your breathing to your movement turnover—3 strides or cycles in, 3 out. You should be able to speak a full sentence right now, but feel your lungs working continuously. Find your pace and protect it.',
            midIntervalCue: 'Halfway through this first block. Notice your breathing. Keep that steady 3:3 movement cadence locked in. Smooth and diaphragmatic. If you find yourself panting, ease off slightly. This is where your engine is built.',
            swiftKickCue: 'Do not let your focus drift. Check your posture, tighten your midsection, and keep your turnover constant.',
          },
        },
        {
          id: 'z2-block-2',
          title: 'Zone 2 Cruise (Part 2: Aerobic Stamina)',
          segmentType: 'work',
          durationSeconds: secondHalfSecs,
          targetRpe: 5,
          breathingProfile: getBreathingProfileForRpe(5),
          voiceCues: {
            startCue: 'Second half. Bump your effort slightly to RPE 5. Still sustainable, but breathing is deliberate. Keep that 3:3 turnover locked into your cadence. Oxygen in through the nose, smooth release through pursed lips.',
            midIntervalCue: 'Ten minutes remaining in our steady state. You are doing fantastic. Stay patient. Your mitochondria are working for you right here.',
            countdown10sCue: 'Ten seconds until we dial it back for our recovery cooldown.',
            swiftKickCue: 'I know boredom tries to creep in on steady state. Stay mentally sharp! Every single minute counts toward your cardiovascular longevity.',
          },
        },
        {
          id: 'z2-cooldown',
          title: 'Cool-Down & Parasympathetic Reset',
          segmentType: 'cooldown',
          durationSeconds: cooldownSecs,
          targetRpe: 2,
          breathingProfile: getBreathingProfileForRpe(2),
          voiceCues: {
            startCue: 'Ease your output back down to RPE 2. Bring your breathing entirely back into the nose. Long, slow inhales, effortless exhales.',
            midIntervalCue: 'Outstanding work today. You stayed disciplined, respected the intensity zone, and built real aerobic capacity. Proud of your consistency.',
          },
        },
      ]
    },
  },

  // ── 2. HIIT 1:2 THRESHOLD INTERVALS ──────────────────────────────────────
  hiit_1_to_2: {
    id: 'hiit_1_to_2',
    name: 'HIIT 1:2 Threshold Intervals',
    subtitle: 'High-intensity work intervals paired with structured recovery to elevate anaerobic threshold',
    category: 'interval',
    optPhaseAlignment: 'Phase 2 & Phase 3: Strength Endurance & Hypertrophy',
    bioenergeticTarget: 'Lactate clearance, fast glycolysis, and EPOC (Excess Post-Exercise Oxygen Consumption).',
    defaultDurationMins: 20,
    allowedDurations: [10, 15, 20, 25, 30],
    targetRpeRange: [3, 8],
    recommendedModalitiesNeutralHint: 'Rower, stationary bike, assault bike, treadmill intervals, or stairmaster.',
    coachMemoTemplate: 'Work intervals must hit RPE 8—breathing is heavy and rapid, speech reduced to 1–2 words. Use recovery intervals at RPE 3 to bring heart rate back down.',
    generateIntervals(totalMinutes: number): CardioIntervalSegment[] {
      const warmupSecs = totalMinutes <= 12 ? 120 : 180
      const cooldownSecs = totalMinutes <= 12 ? 120 : 180
      const availableSecs = totalMinutes * 60 - warmupSecs - cooldownSecs

      // 1:2 ratio = 45s work / 90s recovery (135s per round) or 60s/120s (180s per round)
      const roundCycleSecs = totalMinutes <= 15 ? 90 : 135 // 30s/60s or 45s/90s
      const workSecs = Math.round(roundCycleSecs / 3)
      const recovSecs = roundCycleSecs - workSecs
      const numRounds = Math.max(3, Math.floor(availableSecs / roundCycleSecs))

      const segments: CardioIntervalSegment[] = [
        {
          id: 'hiit-warmup',
          title: 'Progressive Warm-Up',
          segmentType: 'warmup',
          durationSeconds: warmupSecs,
          targetRpe: 3,
          breathingProfile: getBreathingProfileForRpe(3),
          voiceCues: {
            startCue: `Coach Gordon here. We have ${numRounds} rounds of high-intensity intervals ahead. Warm up at RPE 3. In through the nose, out through the mouth. Prime the joints.`,
            countdown10sCue: 'Ten seconds until Round 1. Adjust your resistance, incline, or pace. We are driving straight to RPE 8.',
          },
        },
      ]

      for (let i = 1; i <= numRounds; i++) {
        segments.push({
          id: `hiit-work-${i}`,
          title: `Round ${i} / ${numRounds} — Work Interval`,
          segmentType: 'work',
          durationSeconds: workSecs,
          targetRpe: 8,
          breathingProfile: getBreathingProfileForRpe(8),
          voiceCues: {
            startCue: i === 1
              ? `Hit it! Round 1 of ${numRounds}. Ramp your output right now! Target RPE 8. If your phone is in your pocket, lock into a 2:1 stride or turnover rhythm—two quick steps in, punch your breath out on the strike! Heavy, rapid breaths from the belly. One or two words only!`
              : i === numRounds
              ? 'Final round! Empty the tank right now! Everything you have left in you! Breathe deep and drive!'
              : `Round ${i}! Step on the gas! Don't hold back. Feel that oxygen burn in the lungs and push through it!`,
            midIntervalCue: `${Math.round(workSecs / 2)} seconds down! Check your breathing! Are you working? Keep that output high!`,
            countdown10sCue: 'Ten seconds! Dig in! Don\'t let up until the bell!',
            swiftKickCue: getRandomSwiftKick(),
          },
        })

        segments.push({
          id: `hiit-recov-${i}`,
          title: `Round ${i} / ${numRounds} — Active Recovery`,
          segmentType: 'recovery',
          durationSeconds: recovSecs,
          targetRpe: 3,
          breathingProfile: getBreathingProfileForRpe(3),
          voiceCues: {
            startCue: 'Ease off! Drop immediately to RPE 3. Long nasal inhales for 3 to 4 slow strides or cycles, slow mouth exhales. Force your heart rate to come down.',
            midIntervalCue: 'Breathe deep into your ribcage. Stand tall, open your airway. Halfway through this recovery.',
            countdown10sCue: i < numRounds ? 'Ten seconds until the next work round. Get mentally locked in.' : 'Ten seconds until we enter our cool-down.',
          },
        })
      }

      segments.push({
        id: 'hiit-cooldown',
        title: 'Parasympathetic Cool-Down',
        segmentType: 'cooldown',
        durationSeconds: cooldownSecs,
        targetRpe: 2,
        breathingProfile: getBreathingProfileForRpe(2),
        voiceCues: {
          startCue: 'Intervals complete! Phenomenal effort. Ease into a gentle RPE 2 flush. Nasal breathing only.',
          midIntervalCue: 'You conquered every single round. That takes grit and mental discipline. Outstanding job.',
        },
      })

      return segments
    },
  },

  // ── 3. THE PYRAMID / LADDER ──────────────────────────────────────────────
  pyramid_ladder: {
    id: 'pyramid_ladder',
    name: 'The Ascending & Descending Ladder',
    subtitle: 'Stepped exertion protocol progressing through RPE 4 → 6 → 8 → 9 → 8 → 6 → 4',
    category: 'threshold',
    optPhaseAlignment: 'Phase 2–4: Strength Endurance to Maximal Power',
    bioenergeticTarget: 'Aerobic threshold shifting, lactate tolerance, and psychological pacing mastery.',
    defaultDurationMins: 25,
    allowedDurations: [15, 20, 25, 30, 40],
    targetRpeRange: [4, 9],
    recommendedModalitiesNeutralHint: 'Stationary bike, incline treadmill, rower, or stairmaster.',
    coachMemoTemplate: 'Ascend the ladder step-by-step. Match your breathing to each tier: RPE 4 (belly rhythm), RPE 6 (deep force), RPE 8 (rapid ventilation), RPE 9 (peak anaerobic).',
    generateIntervals(totalMinutes: number): CardioIntervalSegment[] {
      const warmupSecs = totalMinutes <= 15 ? 120 : 180
      const cooldownSecs = totalMinutes <= 15 ? 120 : 180
      const activeSecs = totalMinutes * 60 - warmupSecs - cooldownSecs

      // 7 steps in the ladder: 4 -> 6 -> 8 -> 9 (peak) -> 8 -> 6 -> 4
      const stepDurationSecs = Math.floor(activeSecs / 7)

      const ladderSteps: { rpe: number; name: string }[] = [
        { rpe: 4, name: 'Tier 1: Base Ascent (RPE 4)' },
        { rpe: 6, name: 'Tier 2: Tempo Elevation (RPE 6)' },
        { rpe: 8, name: 'Tier 3: Lactate Surge (RPE 8)' },
        { rpe: 9, name: 'Apex: Peak Oxygen Demand (RPE 9)' },
        { rpe: 8, name: 'Tier 4: Descent Holding (RPE 8)' },
        { rpe: 6, name: 'Tier 5: Flush Tempo (RPE 6)' },
        { rpe: 4, name: 'Tier 6: Aerobic Base Land (RPE 4)' },
      ]

      const segments: CardioIntervalSegment[] = [
        {
          id: 'pyr-warmup',
          title: 'Ladder Warm-Up',
          segmentType: 'warmup',
          durationSeconds: warmupSecs,
          targetRpe: 3,
          breathingProfile: getBreathingProfileForRpe(3),
          voiceCues: {
            startCue: `Coach Gordon here. We are climbing the ladder today: starting at RPE 4, working up to an all-out RPE 9 apex, and backing down. Warm up smoothly at RPE 3.`,
            countdown10sCue: 'Ten seconds until Step 1. Get ready to lock in at RPE 4.',
          },
        },
      ]

      ladderSteps.forEach((step, idx) => {
        const isPeak = step.rpe === 9
        const isDescent = idx > 3

        segments.push({
          id: `pyr-step-${idx + 1}`,
          title: step.name,
          segmentType: 'work',
          durationSeconds: stepDurationSecs,
          targetRpe: step.rpe,
          breathingProfile: getBreathingProfileForRpe(step.rpe),
          voiceCues: {
            startCue: isPeak
              ? 'Apex of the ladder! RPE 9! Maximize your air exchange. 1:1 explosive ventilation synchronized to every stride, stroke, or turnover! Talking is impossible. Give me everything right now!'
              : isDescent
              ? `Down the ladder to RPE ${step.rpe}. Do not let your technique get sloppy because you are tired. Lock into your 2:2 or 3:3 movement rhythm, breathe deep and maintain form!`
              : step.rpe >= 8
              ? `Step ${idx + 1}: Lactate surge at RPE ${step.rpe}. Shift to a 2:1 cadence—two quick breaths in, punch the air out on the power phase! Meet it with authority.`
              : `Step ${idx + 1}: Move up to RPE ${step.rpe}. Deepen your breath. Lock your turnover into your breathing cadence.`,
            midIntervalCue: `Halfway through this tier. Check your breathing against the target RPE ${step.rpe}.`,
            countdown10sCue: idx < 6 ? 'Ten seconds until our next tier shift.' : 'Ten seconds until the final cool-down.',
            swiftKickCue: isPeak || step.rpe >= 8 ? getRandomSwiftKick() : undefined,
          },
        })
      })

      segments.push({
        id: 'pyr-cooldown',
        title: 'Full Recovery Cool-Down',
        segmentType: 'cooldown',
        durationSeconds: cooldownSecs,
        targetRpe: 2,
        breathingProfile: getBreathingProfileForRpe(2),
        voiceCues: {
          startCue: 'Ladder cleared! Exceptional pacing. Ease off entirely into RPE 2. Bring your breath back through the nose.',
          midIntervalCue: 'You controlled your pacing across every step of that climb. True athletic execution.',
        },
      })

      return segments
    },
  },

  // ── 4. THRESHOLD CRUISE & OVER-UNDERS ──────────────────────────────────────
  threshold_tempo_over_under: {
    id: 'threshold_tempo_over_under',
    name: 'Threshold Cruise & Over-Unders',
    subtitle: 'Sustained lactate threshold conditioning alternating between just-below and just-above VT1/VT2',
    category: 'threshold',
    optPhaseAlignment: 'Phase 2–4: Strength Endurance & Maximal Strength',
    bioenergeticTarget: 'Lactate shuttling, buffering capacity, and mental resilience under continuous tension.',
    defaultDurationMins: 20,
    allowedDurations: [15, 20, 25, 30],
    targetRpeRange: [5, 8],
    recommendedModalitiesNeutralHint: 'Indoor bike, treadmill, rower, or ski erg.',
    coachMemoTemplate: 'Over-unders: Cruise at RPE 5–6 ("under"), then surge for 60 seconds into RPE 7–8 ("over"). Learn to recover without fully stopping.',
    generateIntervals(totalMinutes: number): CardioIntervalSegment[] {
      const warmupSecs = 180
      const cooldownSecs = 180
      const activeSecs = totalMinutes * 60 - warmupSecs - cooldownSecs

      // 3 min Under (RPE 5) + 1 min Over (RPE 8) = 4 min cycle (240s)
      const cycleSecs = 240
      const numCycles = Math.max(2, Math.floor(activeSecs / cycleSecs))

      const segments: CardioIntervalSegment[] = [
        {
          id: 'ou-warmup',
          title: 'Threshold Primer Warm-Up',
          segmentType: 'warmup',
          durationSeconds: warmupSecs,
          targetRpe: 3,
          breathingProfile: getBreathingProfileForRpe(3),
          voiceCues: {
            startCue: `Coach Gordon here. Over-under threshold training today. We are alternating between sustained cruise and sharp lactate surges. Warm up at RPE 3.`,
            countdown10sCue: 'Ten seconds until our first sustained threshold cruise. Target RPE 5.',
          },
        },
      ]

      for (let i = 1; i <= numCycles; i++) {
        segments.push({
          id: `ou-under-${i}`,
          title: `Cycle ${i} — Threshold Cruise (Under: RPE 5)`,
          segmentType: 'work',
          durationSeconds: 180,
          targetRpe: 5,
          breathingProfile: getBreathingProfileForRpe(5),
          voiceCues: {
            startCue: `Cycle ${i}: Settle into RPE 5. Lock into a 3:3 stride or turnover cadence. Diaphragmatic nasal-in, mouth-out. Noticeable work, but you are holding a controlled rhythm.`,
            midIntervalCue: 'One minute left on this cruise block. Stay relaxed in the shoulders. Prepare yourself mentally for the surge.',
            countdown10sCue: 'Ten seconds until the OVER surge. Get ready to push to RPE 8.',
          },
        })

        segments.push({
          id: `ou-over-${i}`,
          title: `Cycle ${i} — Lactate Surge (Over: RPE 8)`,
          segmentType: 'work',
          durationSeconds: 60,
          targetRpe: 8,
          breathingProfile: getBreathingProfileForRpe(8),
          voiceCues: {
            startCue: 'SURGE! RPE 8 for sixty seconds! Ramp up your output! Shift to a 2:1 cadence—two quick breaths in, punch the air out on each power stroke or strike! One-word answers only!',
            midIntervalCue: 'Thirty seconds! Halfway through the surge! Don\'t back off now! Drive!',
            countdown10sCue: 'Ten seconds! Hold this power all the way through!',
            swiftKickCue: getRandomSwiftKick(),
          },
        })
      }

      segments.push({
        id: 'ou-cooldown',
        title: 'Lactate Flush Cool-Down',
        segmentType: 'cooldown',
        durationSeconds: cooldownSecs,
        targetRpe: 2,
        breathingProfile: getBreathingProfileForRpe(2),
        voiceCues: {
          startCue: 'Surges done! Bring your output down to an easy RPE 2. Let your muscles flush the lactate with smooth nasal breaths.',
          midIntervalCue: 'That was an advanced threshold workout. You taught your body how to clear lactate under pressure. Excellent job.',
        },
      })

      return segments
    },
  },

  // ── 5. TABATA & MICRO-BURST SPRINTS ──────────────────────────────────────
  tabata_micro_bursts: {
    id: 'tabata_micro_bursts',
    name: 'Tabata & Micro-Burst Sprints',
    subtitle: 'Dense anaerobic intervals: 20-second maximal sprints paired with 10-second micro-recoveries',
    category: 'anaerobic',
    optPhaseAlignment: 'Phase 5: Power & Post-Activation Potentiation',
    bioenergeticTarget: 'Phosphagen regeneration, maximal VO2 stimulation, and peak neuromuscular power.',
    defaultDurationMins: 12,
    allowedDurations: [8, 10, 12, 16],
    targetRpeRange: [2, 10],
    recommendedModalitiesNeutralHint: 'Assault bike, stationary bike, rower, ski erg, or turf sprints.',
    coachMemoTemplate: '20 seconds all-out at RPE 9–10 (talking impossible, explosive breathing), followed by 10 seconds of rapid recovery at RPE 2.',
    generateIntervals(totalMinutes: number): CardioIntervalSegment[] {
      const warmupSecs = 180
      const cooldownSecs = 180
      const activeSecs = totalMinutes * 60 - warmupSecs - cooldownSecs

      // Tabata = 20s sprint / 10s rest = 30s per round. 8 rounds = 4 mins.
      const numRounds = Math.max(6, Math.min(16, Math.floor(activeSecs / 30)))

      const segments: CardioIntervalSegment[] = [
        {
          id: 'tabata-warmup',
          title: 'High-Cadence Neural Warm-Up',
          segmentType: 'warmup',
          durationSeconds: warmupSecs,
          targetRpe: 3,
          breathingProfile: getBreathingProfileForRpe(3),
          voiceCues: {
            startCue: `Coach Gordon here. Tabata micro-bursts today. We have ${numRounds} rounds of 20 seconds all-out, 10 seconds off. Warm up progressively at RPE 3.`,
            countdown10sCue: 'Ten seconds until Tabata Round 1. Max effort right out of the gate. RPE 9 to 10.',
          },
        },
      ]

      for (let i = 1; i <= numRounds; i++) {
        segments.push({
          id: `tabata-sprint-${i}`,
          title: `Tabata Burst ${i} / ${numRounds}`,
          segmentType: 'work',
          durationSeconds: 20,
          targetRpe: 10,
          breathingProfile: getBreathingProfileForRpe(10),
          voiceCues: {
            startCue: i === 1
              ? 'GO! All out! RPE 10! 1:1 explosive ventilation with every stride, stroke, or turnover! Drive with everything you have!'
              : i === numRounds
              ? 'FINAL SPRINT! Empty the tank completely! 1:1 explosive breathing! Leave nothing behind! GO GO GO!'
              : `Round ${i}! Sprint! Maximum cadence and power! 1:1 explosive rhythm! Don\'t let up!`,
            countdown10sCue: 'Ten seconds! Keep the hammer down!',
            swiftKickCue: i % 3 === 0 ? getRandomSwiftKick() : undefined,
          },
        })

        segments.push({
          id: `tabata-rest-${i}`,
          title: `Micro-Recovery ${i}`,
          segmentType: 'recovery',
          durationSeconds: 10,
          targetRpe: 2,
          breathingProfile: getBreathingProfileForRpe(2),
          voiceCues: {
            startCue: 'Off! Ten seconds off! Deep breath in, forceful exhale. Stay on your feet.',
            countdown10sCue: i < numRounds ? '3... 2... 1...' : 'Finished!',
          },
        })
      }

      segments.push({
        id: 'tabata-cooldown',
        title: 'Deep Parasympathetic Down-Regulation',
        segmentType: 'cooldown',
        durationSeconds: cooldownSecs,
        targetRpe: 2,
        breathingProfile: getBreathingProfileForRpe(2),
        voiceCues: {
          startCue: 'Tabata complete! You survived a brutal anaerobic power block. Hands on your head, open the chest, and let your lungs catch up.',
          midIntervalCue: 'Breathe slow and steady through your nose. Outstanding heart and grit.',
        },
      })

      return segments
    },
  },

  // ── 6. PARASYMPATHETIC RECOVERY FLUSH ────────────────────────────────────
  parasympathetic_recovery_flush: {
    id: 'parasympathetic_recovery_flush',
    name: 'Post-Lift Parasympathetic Recovery Flush',
    subtitle: 'Low-impact active recovery designed for metabolite clearance and autonomic down-regulation',
    category: 'recovery',
    optPhaseAlignment: 'All Phases: Post-Resistance Training or Dedicated Off-Days',
    bioenergeticTarget: 'Venous return, intramuscular metabolite clearance, and parasympathetic nervous system activation.',
    defaultDurationMins: 15,
    allowedDurations: [10, 15, 20, 25],
    targetRpeRange: [2, 3],
    recommendedModalitiesNeutralHint: 'Gentle flat walk, light spinning on bike, easy rower, or elliptical.',
    coachMemoTemplate: 'Strict RPE 2–3. Nasal breathing only. The goal is recovery and calm, never fatigue or strain.',
    generateIntervals(totalMinutes: number): CardioIntervalSegment[] {
      const halfMinutes = Math.floor(totalMinutes / 2)
      const secondHalf = totalMinutes - halfMinutes

      return [
        {
          id: 'flush-block-1',
          title: 'Parasympathetic Transition (Nasal Cadence)',
          segmentType: 'work',
          durationSeconds: halfMinutes * 60,
          targetRpe: 2,
          breathingProfile: getBreathingProfileForRpe(2),
          voiceCues: {
            startCue: `Coach Gordon here. Time to take care of your body with an active recovery flush. Settle into an easy RPE 2. Phone in your pocket, count 4 slow steps or cycles in, and 4 slow steps out, strictly nasal. Let your nervous system down-regulate.`,
            midIntervalCue: 'Drop your shoulders. Let go of any tension in your jaw and neck from your lifting session. Smooth, gentle turnover.',
          },
        },
        {
          id: 'flush-block-2',
          title: 'Lymphatic & Metabolite Clearance',
          segmentType: 'work',
          durationSeconds: secondHalf * 60,
          targetRpe: 3,
          breathingProfile: getBreathingProfileForRpe(3),
          voiceCues: {
            startCue: 'Keep the pace very easy, right at RPE 2 to 3. You could recite poetry right now. We are flushing lactic acid and speeding up your recovery for tomorrow.',
            midIntervalCue: 'Deep, soothing nasal breaths. Acknowledge the hard work you put in today. Recovery is where you actually grow.',
            countdown10sCue: 'Ten seconds remaining. Finish with one big, deep breath.',
          },
        },
        {
          id: 'flush-complete',
          title: 'Restorative Completion',
          segmentType: 'cooldown',
          durationSeconds: 60,
          targetRpe: 1,
          breathingProfile: getBreathingProfileForRpe(1),
          voiceCues: {
            startCue: 'Session complete. Take a final full breath in through your nose, hold for two seconds, and exhale completely. Hydrate and recover well.',
          },
        },
      ]
    },
  },
}

/**
 * Generates an assembled workout with dynamic scaling to any target duration.
 */
export function buildCardioSession(params: {
  patternId: CardioPatternId
  durationMinutes?: number
  athleteName?: string
  clientNotes?: string
}): {
  pattern: CardioPatternDefinition
  durationMinutes: number
  totalSeconds: number
  intervals: CardioIntervalSegment[]
  maxRpe: number
  avgRpe: number
  personalizedIntro: string
} {
  const pattern = CARDIO_PATTERNS[params.patternId] || CARDIO_PATTERNS.zone2_aerobic_engine
  const duration = params.durationMinutes && params.durationMinutes >= 5 && params.durationMinutes <= 90
    ? Math.round(params.durationMinutes)
    : pattern.defaultDurationMins

  const intervals = pattern.generateIntervals(duration)
  const totalSeconds = intervals.reduce((acc, curr) => acc + curr.durationSeconds, 0)

  const rpes = intervals.map(i => i.targetRpe)
  const maxRpe = Math.max(...rpes)
  const avgRpe = Math.round((intervals.reduce((acc, curr) => acc + (curr.targetRpe * curr.durationSeconds), 0) / totalSeconds) * 10) / 10

  const athleteGreeting = params.athleteName ? `Alright ${params.athleteName}, ` : ''
  const personalizedIntro = `${athleteGreeting}Coach Gordon in your ear for today's ${pattern.name}. We're locked in for ${duration} minutes. Remember: no matter what machine or trail you're on, lock into the breath and stay with me.`

  return {
    pattern,
    durationMinutes: duration,
    totalSeconds,
    intervals,
    maxRpe,
    avgRpe,
    personalizedIntro,
  }
}

// ── HIGH-END LUXURY UPGRADE: BIOMETRICS, FORM DIRECTIVES & ANALYTICS ──────

/**
 * Compares live wearable/Bluetooth heart rate against target RPE to generate
 * real-time adaptive in-ear voice coaching and prevent cardiac drift or slacking.
 */
export function evaluateAdaptiveHeartRateFeedback(
  currentBpm: number,
  targetRpe: number,
  athleteAge: number = 35
): {
  alertType: 'cardiac_drift' | 'under_exertion' | 'on_target' | 'none'
  hrPercentMax: number
  voiceCue?: string
} {
  if (currentBpm <= 40 || currentBpm > 240) {
    return { alertType: 'none', hrPercentMax: 0 }
  }

  const safeAge = Math.max(18, Math.min(85, athleteAge))
  const hrMax = Math.round(208 - 0.7 * safeAge)
  const hrPct = Math.round((currentBpm / hrMax) * 100)

  // 1. Zone 2 Cardiac Drift Detection (Target RPE 4–5, but HR > 82% HRmax)
  if (targetRpe <= 5 && hrPct >= 83) {
    return {
      alertType: 'cardiac_drift',
      hrPercentMax: hrPct,
      voiceCue:
        'Hey, check your ego. Your heart rate is drifting above Zone 2 into threshold territory. Drop your resistance or speed right now—we are building mitochondrial density today, not burning out your nervous system.',
    }
  }

  // 2. High-Intensity Under-Exertion Detection (Target RPE 8–10, but HR < 72% HRmax)
  if (targetRpe >= 8 && hrPct < 72) {
    return {
      alertType: 'under_exertion',
      hrPercentMax: hrPct,
      voiceCue:
        'I see your heart rate idling. You told me this was an RPE 8! Put some real drive into this interval and get that pulse up!',
    }
  }

  // 3. Perfect Zone 2 Alignment
  if (targetRpe >= 4 && targetRpe <= 5 && hrPct >= 68 && hrPct <= 78) {
    return {
      alertType: 'on_target',
      hrPercentMax: hrPct,
      voiceCue: 'Heart rate is locked right in the sweet spot. Perfect Zone 2 aerobic efficiency.',
    }
  }

  return { alertType: 'none', hrPercentMax: hrPct }
}

export interface EquipmentBiomechanicalTips {
  equipmentName: string
  primaryFormTip: string
  formDirectives: string[]
  commonMistake: string
}

/**
 * Delivers elite equipment-specific biomechanical form directives while
 * preserving the universal, modality-agnostic RPE and breathing framework.
 */
export function getEquipmentBiomechanicalFormTips(modality: string): EquipmentBiomechanicalTips {
  const norm = modality.toLowerCase()

  if (norm.includes('treadmill') || norm.includes('walk') || norm.includes('incline')) {
    return {
      equipmentName: 'Treadmill Incline',
      primaryFormTip: 'Never hold the handrails. Lean forward from the ankles, not the hips.',
      formDirectives: [
        'Hands off the console and handrails—let your arms swing naturally to drive kinetic momentum.',
        'Hinge slightly from the ankles while maintaining a proud chest and neutral spine.',
        'Push off the balls of the feet with active glute contraction on every stride.',
      ],
      commonMistake: 'Holding onto the handrails, which reduces caloric expenditure by up to 25% and distorts spinal posture.',
    }
  }

  if (norm.includes('row') || norm.includes('rower') || norm.includes('erg')) {
    return {
      equipmentName: 'Rowing Machine',
      primaryFormTip: 'Power distribution is 60% legs, 20% core, 20% arms. Never rush the slide.',
      formDirectives: [
        'The Drive: Explode through your heels first, swing the torso from 11 o\'clock to 1 o\'clock, then draw handle to lower sternum.',
        'The Recovery: Extend arms first, hinge torso forward, then bend knees to slide back smoothly.',
        'Maintain a 1:2 drive-to-recovery ratio—drive hard, recover calm.',
      ],
      commonMistake: 'Bending the knees before the hands cross the knees on the recovery, causing the handle to hop over the knees.',
    }
  }

  if (norm.includes('stair') || norm.includes('step')) {
    return {
      equipmentName: 'Stairmaster',
      primaryFormTip: 'Stand tall over your pelvis. Stop hunching forward over the display console.',
      formDirectives: [
        'Keep your fingertips resting lightly on the rails for balance only—never support your bodyweight.',
        'Plant your full foot on each step to maximize glute and hamstring engagement.',
        'Maintain tall posture with hips stacked directly over your feet.',
      ],
      commonMistake: 'Hunching forward over the console with locked elbows, shutting down the glutes and straining the lower back.',
    }
  }

  if (norm.includes('bike') || norm.includes('cycle') || norm.includes('spin')) {
    return {
      equipmentName: 'Stationary / Assault Bike',
      primaryFormTip: 'Pedal in smooth 360-degree fluid circles. Keep the upper body relaxed and stable.',
      formDirectives: [
        'Adjust saddle height so your knee has a slight 5–10 degree bend at the bottom of the stroke.',
        'Drop your heels slightly on the downstroke and scrape through the bottom to recruit hamstrings.',
        'Relax your grip on the handlebars; keep shoulders away from ears and core engaged.',
      ],
      commonMistake: 'Mashing straight down on the pedals like pistons instead of scraping through the bottom of the stroke.',
    }
  }

  if (norm.includes('outdoor') || norm.includes('run')) {
    return {
      equipmentName: 'Outdoor Run / Walk',
      primaryFormTip: 'Land softly under your center of mass with a compact, efficient arm swing.',
      formDirectives: [
        'Keep your gaze focused 20 to 30 feet ahead on the horizon to maintain an open airway.',
        'Strike with a relaxed midfoot under your hips—avoid overstriding out in front.',
        'Keep elbows bent at 90 degrees with hands relaxed, as if holding an egg in each palm.',
      ],
      commonMistake: 'Overstriding with heavy heel strikes, sending excessive braking force into knees and shins.',
    }
  }

  // Default General Modality
  return {
    equipmentName: 'General Cardio Modality',
    primaryFormTip: 'Maintain stacked posture, tall spine, and smooth diaphragmatic rhythm.',
    formDirectives: [
      'Align ears over shoulders, shoulders over hips, and hips over feet.',
      'Relax facial muscles and jaw to eliminate unnecessary neuromuscular tension.',
      'Coordinate each breath cycle with your movement turnover.',
    ],
    commonMistake: 'Holding breath during exertion surges, triggering premature lactic acid accumulation.',
  }
}

export type ParsedCardioVoiceCommandType =
  | 'CADENCE_CHECK'
  | 'TIME_CHECK'
  | 'SWIFT_KICK'
  | 'RPE_REPORT'
  | 'PAUSE'
  | 'RESUME'
  | 'NEXT_INTERVAL'
  | 'DISTANCE_CHECK'
  | 'PACE_CHECK'
  | 'STEP_CHECK'
  | 'UNKNOWN'

export interface ParsedCardioVoiceCommand {
  type: ParsedCardioVoiceCommandType
  rpeValue?: number
  spokenFeedback: string
}

export interface CardioVoiceCopilotContext {
  segmentRemainingSecs?: number
  totalRemainingSecs?: number
  targetRpe?: number
  modality?: string
  distanceMeters?: number
  distanceUnit?: 'mi' | 'km'
  formattedDistance?: string
  formattedPace?: string
  stepCount?: number
  stepCadenceSpm?: number
  isDistanceTrackingActive?: boolean
}

/**
 * Hands-Free Voice Copilot: Parses natural speech commands from athletes while running/rowing.
 * Supports cadence/breathing checks so athletes with phones in their pockets can stay locked in.
 */
export function parseCardioVoiceCommand(
  rawTranscript: string,
  context?: CardioVoiceCopilotContext
): ParsedCardioVoiceCommand {
  const t = rawTranscript.toLowerCase().trim()

  // 1. Distance & Mileage Check ("What's my distance?", "How far?", "Distance check", "Mileage?")
  if (
    t.includes('distance') ||
    t.includes('how far') ||
    t.includes('mileage') ||
    t.includes('how many miles') ||
    t.includes('how many kilometers')
  ) {
    if (context?.isDistanceTrackingActive) {
      const dist = context.formattedDistance || 'under a quarter mile'
      const pace = context.formattedPace ? `, averaging ${context.formattedPace}` : ''
      return {
        type: 'DISTANCE_CHECK',
        spokenFeedback: `You've traveled ${dist}${pace}. Strong stride discipline, stay locked in.`,
      }
    }
    return {
      type: 'DISTANCE_CHECK',
      spokenFeedback: `You're currently in stationary mode, so GPS distance tracking is inactive. Focus on your breathing cadence and RPE.`,
    }
  }

  // 2. Pace & Speed Check ("What's my pace?", "Pace check", "Current speed?")
  if (t.includes('pace') || t.includes('speed') || t.includes('how fast')) {
    if (context?.isDistanceTrackingActive) {
      const pace = context.formattedPace || 'steady'
      return {
        type: 'PACE_CHECK',
        spokenFeedback: `Current pace is ${pace}. Settle into your stride, relax your shoulders, and own that rhythm.`,
      }
    }
    return {
      type: 'PACE_CHECK',
      spokenFeedback: `Pace tracking is inactive in stationary mode. Anchor to your prescribed cadence.`,
    }
  }

  // 3. Locomotor Cadence & Breathing Check ("How should I breathe?", "What's my cadence?", "Stride count?", "Rhythm?")
  if (
    t.includes('cadence') ||
    t.includes('breathe') ||
    t.includes('breathing') ||
    t.includes('stride') ||
    t.includes('stroke') ||
    t.includes('rhythm') ||
    t.includes('how to breathe') ||
    t.includes('pace my breath')
  ) {
    const targetRpe = context?.targetRpe || 4
    const modality = context?.modality || 'Treadmill Incline'
    const guidance = getLocomotorCadenceGuidance(targetRpe, modality)
    return {
      type: 'CADENCE_CHECK',
      spokenFeedback: guidance.inEarSpokenGuidance,
    }
  }

  // 4. Step Count & Cadence Check ("How many steps?", "Step count?", "Step check?")
  if (
    t.includes('step') ||
    t.includes('footstep') ||
    t.includes('footsteps')
  ) {
    if (context?.stepCount && context.stepCount > 0) {
      const spmText = context.stepCadenceSpm ? ` at ${context.stepCadenceSpm} steps per minute` : ''
      return {
        type: 'STEP_CHECK',
        spokenFeedback: `You've logged ${context.stepCount.toLocaleString()} steps${spmText}. Keep your turnover crisp and light.`,
      }
    }
    return {
      type: 'STEP_CHECK',
      spokenFeedback: `Step tracking is active. Maintain smooth, consistent foot turnover.`,
    }
  }

  // 5. Time Check ("How much time?", "What's the clock?", "Time remaining?")
  if (t.includes('time') || t.includes('clock') || t.includes('how long') || t.includes('left')) {
    const segMins = context?.segmentRemainingSecs ? Math.floor(context.segmentRemainingSecs / 60) : 0
    const segSecs = context?.segmentRemainingSecs ? context.segmentRemainingSecs % 60 : 30
    const totalMins = context?.totalRemainingSecs ? Math.ceil(context.totalRemainingSecs / 60) : 10
    const text = `You have ${segMins > 0 ? `${segMins} minutes and ` : ''}${segSecs} seconds left in this interval, and ${totalMins} minutes left in the workout. Stay locked in!`
    return { type: 'TIME_CHECK', spokenFeedback: text }
  }

  // 6. Tough Love / Swift Kick ("Need a push", "Kick my butt", "Coach push me")
  if (t.includes('push') || t.includes('kick') || t.includes('butt') || t.includes('tired') || t.includes('quit') || t.includes('hard')) {
    const kick = getRandomSwiftKick()
    return { type: 'SWIFT_KICK', spokenFeedback: kick }
  }

  // 7. RPE Report ("I'm at an 8", "RPE 7", "Feeling like a 6")
  const rpeMatch = t.match(/\b(?:rpe|level|effort|at|feeling like)\s*(?:a|an)?\s*(\d{1,2})\b/) || t.match(/\b(\d{1,2})\s*(?:out of 10|\/10)\b/)
  if (rpeMatch) {
    const val = parseInt(rpeMatch[1], 10)
    if (val >= 1 && val <= 10) {
      return {
        type: 'RPE_REPORT',
        rpeValue: val,
        spokenFeedback: `Logged RPE ${val}. Own that effort. Keep your breathing locked into your rhythm.`,
      }
    }
  }

  // 8. Pause / Resume / Skip
  if (t.includes('pause') || t.includes('hold on') || t.includes('stop')) {
    return { type: 'PAUSE', spokenFeedback: 'Workout paused. Catch your breath and resume when ready.' }
  }
  if (t.includes('resume') || t.includes('continue') || t.includes('start again') || t.includes('go')) {
    return { type: 'RESUME', spokenFeedback: 'Resuming session. Let\'s get right back to work.' }
  }
  if (t.includes('skip') || t.includes('next') || t.includes('advance')) {
    return { type: 'NEXT_INTERVAL', spokenFeedback: 'Advancing to the next interval segment.' }
  }

  return { type: 'UNKNOWN', spokenFeedback: '' }
}

export interface ExecutiveCardioDebrief {
  totalDurationMins: number
  totalCaloriesBurned: number
  epocAfterburnCalories: number
  averageRpe: number
  peakRpe: number
  timeInZone1Seconds: number
  timeInZone2Seconds: number
  timeInZone3Seconds: number
  zone1Percent: number
  zone2Percent: number
  zone3Percent: number
  respiratoryComplianceScore: number
  postSessionCoachDebriefVoiceScript: string
  distanceMeters?: number
  distanceMiles?: number
  distanceKm?: number
  formattedDistance?: string
  formattedAveragePace?: string
  totalSteps?: number
  avgCadenceSpm?: number
}

/**
 * Calculates executive-grade bioenergetic analytics and generates a personalized
 * closing audio debrief from Coach Gordon.
 */
export function calculateExecutiveCardioDebrief(params: {
  durationSeconds: number
  averageRpe: number
  peakRpe: number
  samplesBpm?: number[]
  patternId: CardioPatternId
  athleteName?: string
  athleteWeightKg?: number
  athleteAge?: number
  athleteGender?: 'male' | 'female'
  distanceMeters?: number
  distanceUnit?: 'mi' | 'km'
  totalSteps?: number
  avgCadenceSpm?: number
}): ExecutiveCardioDebrief {
  const {
    durationSeconds,
    averageRpe,
    peakRpe,
    samplesBpm = [],
    patternId,
    athleteName = 'Athlete',
    athleteWeightKg = 75,
    distanceMeters,
    distanceUnit = 'mi',
    totalSteps,
    avgCadenceSpm,
  } = params

  const totalDurationMins = Math.max(1, Math.round(durationSeconds / 60))

  // Estimate or calculate zone distribution
  let z1Secs = 0
  let z2Secs = 0
  let z3Secs = 0

  if (patternId === 'zone2_aerobic_engine') {
    z1Secs = Math.round(durationSeconds * 0.2)
    z2Secs = Math.round(durationSeconds * 0.75)
    z3Secs = Math.round(durationSeconds * 0.05)
  } else if (patternId === 'hiit_1_to_2') {
    z1Secs = Math.round(durationSeconds * 0.35)
    z2Secs = Math.round(durationSeconds * 0.25)
    z3Secs = Math.round(durationSeconds * 0.4)
  } else if (patternId === 'tabata_micro_bursts') {
    z1Secs = Math.round(durationSeconds * 0.4)
    z2Secs = Math.round(durationSeconds * 0.15)
    z3Secs = Math.round(durationSeconds * 0.45)
  } else if (patternId === 'parasympathetic_recovery_flush') {
    z1Secs = Math.round(durationSeconds * 0.85)
    z2Secs = Math.round(durationSeconds * 0.15)
    z3Secs = 0
  } else {
    z1Secs = Math.round(durationSeconds * 0.25)
    z2Secs = Math.round(durationSeconds * 0.45)
    z3Secs = Math.round(durationSeconds * 0.3)
  }

  const zone1Percent = Math.round((z1Secs / durationSeconds) * 100)
  const zone2Percent = Math.round((z2Secs / durationSeconds) * 100)
  const zone3Percent = Math.max(0, 100 - zone1Percent - zone2Percent)

  // Caloric estimation with EPOC afterburn
  const avgBpm = samplesBpm.length > 0 ? Math.round(samplesBpm.reduce((a, b) => a + b, 0) / samplesBpm.length) : Math.round(90 + averageRpe * 9.5)
  const calPerMin = Math.max(4, Math.min(22, (avgBpm * 0.1) + (athleteWeightKg * 0.05)))
  const totalCaloriesBurned = Math.round(calPerMin * totalDurationMins)

  // EPOC factor: 6% for low RPE, up to 18% for high-intensity HIIT
  const epocFactor = peakRpe >= 8 ? 0.16 : averageRpe >= 6 ? 0.11 : 0.06
  const epocAfterburnCalories = Math.round(totalCaloriesBurned * epocFactor)

  // Respiratory Compliance Index (0–100)
  const respiratoryComplianceScore = Math.min(99, Math.max(82, Math.round(88 + (averageRpe <= 5 ? 8 : 4))))

  // Optional distance & step calculations for non-stationary locomotion
  let distanceMiles: number | undefined
  let distanceKm: number | undefined
  let formattedDistance: string | undefined
  let formattedAveragePace: string | undefined

  if (distanceMeters && distanceMeters > 5) {
    distanceMiles = Math.round(distanceMeters * 0.000621371 * 100) / 100
    distanceKm = Math.round((distanceMeters / 1000) * 100) / 100
    formattedDistance = distanceUnit === 'mi' ? `${distanceMiles} miles` : `${distanceKm} km`

    const unitDistance = distanceUnit === 'mi' ? distanceMiles : distanceKm
    if (unitDistance > 0 && durationSeconds > 0) {
      const secPerUnit = Math.round(durationSeconds / unitDistance)
      const pMins = Math.floor(secPerUnit / 60)
      const pSecs = Math.floor(secPerUnit % 60)
      formattedAveragePace = `${pMins}'${pSecs.toString().padStart(2, '0')}" /${distanceUnit}`
    }
  }

  const distancePaceNarrative = formattedDistance
    ? ` over ${formattedDistance}${totalSteps ? ` across ${totalSteps.toLocaleString()} steps` : ''}${formattedAveragePace ? ` at an average pace of ${formattedAveragePace}` : ''}`
    : ''

  const postSessionCoachDebriefVoiceScript =
    `Coach Gordon debriefing your session. Outstanding work today, ${athleteName}. You executed ${totalDurationMins} minutes of training${distancePaceNarrative} with an average effort of RPE ${averageRpe}, and an estimated ${totalCaloriesBurned} calories burned plus an additional ${epocAfterburnCalories} calories of EPOC afterburn. Your respiratory discipline was dialed in at ${respiratoryComplianceScore} percent. Right now, your priority is recovery: rehydrate with sixteen ounces of electrolyte water within thirty minutes, and refuel with twenty-five to thirty grams of clean protein. You showed up, you did the work, and you earned your progress. Outstanding job.`

  return {
    totalDurationMins,
    totalCaloriesBurned,
    epocAfterburnCalories,
    averageRpe,
    peakRpe,
    timeInZone1Seconds: z1Secs,
    timeInZone2Seconds: z2Secs,
    timeInZone3Seconds: z3Secs,
    zone1Percent,
    zone2Percent,
    zone3Percent,
    respiratoryComplianceScore,
    postSessionCoachDebriefVoiceScript,
    distanceMeters,
    distanceMiles,
    distanceKm,
    formattedDistance,
    formattedAveragePace,
    totalSteps,
    avgCadenceSpm,
  }
}

/**
 * Deterministically resolves which interval segment is active, how many seconds
 * have elapsed within that segment, and whether the entire workout is completed,
 * based on true wall-clock total elapsed seconds.
 * 
 * Prevents mobile background sleep/throttle drift by allowing the client to instantly
 * reconcile interval state against Date.now() regardless of how long the phone slept.
 */
export function resolveSegmentFromTotalElapsed(
  intervals: CardioIntervalSegment[],
  totalElapsedSeconds: number
): {
  segmentIndex: number
  segmentElapsedSeconds: number
  isCompleted: boolean
} {
  if (!intervals || intervals.length === 0) {
    return { segmentIndex: 0, segmentElapsedSeconds: 0, isCompleted: true }
  }

  const safeTotal = Math.max(0, totalElapsedSeconds)
  let accumulated = 0

  for (let i = 0; i < intervals.length; i++) {
    const seg = intervals[i]
    const segDuration = Math.max(1, seg.durationSeconds)
    if (safeTotal < accumulated + segDuration) {
      return {
        segmentIndex: i,
        segmentElapsedSeconds: safeTotal - accumulated,
        isCompleted: false,
      }
    }
    accumulated += segDuration
  }

  // If elapsed time matches or exceeds total duration, the workout is complete
  const lastIdx = Math.max(0, intervals.length - 1)
  return {
    segmentIndex: lastIdx,
    segmentElapsedSeconds: intervals[lastIdx]?.durationSeconds || 0,
    isCompleted: true,
  }
}


