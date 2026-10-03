import { describe, it, expect } from 'vitest'
import {
  CARDIO_PATTERNS,
  RPE_BREATHING_REGISTRY,
  getBreathingProfileForRpe,
  getLocomotorCadenceGuidance,
  buildCardioSession,
  COACH_GORDON_SWIFT_KICKS,
  getRandomSwiftKick,
  evaluateAdaptiveHeartRateFeedback,
  getEquipmentBiomechanicalFormTips,
  parseCardioVoiceCommand,
  calculateExecutiveCardioDebrief,
  resolveSegmentFromTotalElapsed,
  type CardioPatternId,
} from './coach-cardio-engine'

describe('coach-cardio-engine', () => {
  it('contains valid RPE breathing profiles from 1 to 10', () => {
    for (let rpe = 1; rpe <= 10; rpe++) {
      const profile = RPE_BREATHING_REGISTRY[rpe]
      expect(profile).toBeDefined()
      expect(profile.rpe).toBe(rpe)
      expect(profile.breathingPacingSeconds).toBeGreaterThan(0)
      expect(profile.inBreathSeconds).toBeGreaterThan(0)
      expect(profile.outBreathSeconds).toBeGreaterThan(0)
      expect(profile.breathingSensation).toBeTruthy()
      expect(profile.talkTest).toBeTruthy()
      expect(profile.primaryRespiratoryCue).toBeTruthy()
    }
  })

  it('bounds and clamps RPE in getBreathingProfileForRpe', () => {
    expect(getBreathingProfileForRpe(0).rpe).toBe(1)
    expect(getBreathingProfileForRpe(12).rpe).toBe(10)
    expect(getBreathingProfileForRpe(4.4).rpe).toBe(4)
    expect(getBreathingProfileForRpe(7.8).rpe).toBe(8)
  })

  it('provides all 6 cardio patterns with distinct bioenergetics', () => {
    const patternIds: CardioPatternId[] = [
      'zone2_aerobic_engine',
      'hiit_1_to_2',
      'pyramid_ladder',
      'threshold_tempo_over_under',
      'tabata_micro_bursts',
      'parasympathetic_recovery_flush',
    ]

    for (const id of patternIds) {
      const p = CARDIO_PATTERNS[id]
      expect(p).toBeDefined()
      expect(p.name).toBeTruthy()
      expect(p.subtitle).toBeTruthy()
      expect(p.defaultDurationMins).toBeGreaterThan(0)
      expect(p.targetRpeRange[0]).toBeLessThanOrEqual(p.targetRpeRange[1])
      expect(p.recommendedModalitiesNeutralHint).toBeTruthy()
    }
  })

  it('buildCardioSession scales Zone 2 Aerobic Engine to custom durations', () => {
    const session15 = buildCardioSession({ patternId: 'zone2_aerobic_engine', durationMinutes: 15 })
    expect(session15.durationMinutes).toBe(15)
    expect(session15.totalSeconds).toBe(15 * 60)
    expect(session15.intervals.length).toBeGreaterThanOrEqual(3)

    const session30 = buildCardioSession({ patternId: 'zone2_aerobic_engine', durationMinutes: 30 })
    expect(session30.durationMinutes).toBe(30)
    expect(session30.totalSeconds).toBe(30 * 60)

    const session45 = buildCardioSession({ patternId: 'zone2_aerobic_engine', durationMinutes: 45 })
    expect(session45.durationMinutes).toBe(45)
    expect(session45.totalSeconds).toBe(45 * 60)
  })

  it('buildCardioSession generates HIIT 1:2 rounds with high and low RPE intervals', () => {
    const session = buildCardioSession({ patternId: 'hiit_1_to_2', durationMinutes: 20 })
    expect(session.intervals.length).toBeGreaterThan(4)
    const workIntervals = session.intervals.filter(i => i.segmentType === 'work')
    const recovIntervals = session.intervals.filter(i => i.segmentType === 'recovery')
    expect(workIntervals.length).toBeGreaterThanOrEqual(3)
    expect(recovIntervals.length).toBeGreaterThanOrEqual(3)
    expect(workIntervals[0].targetRpe).toBe(8)
    expect(recovIntervals[0].targetRpe).toBe(3)
  })

  it('buildCardioSession generates The Pyramid Ladder with 7 ascending and descending tiers', () => {
    const session = buildCardioSession({ patternId: 'pyramid_ladder', durationMinutes: 25 })
    const workIntervals = session.intervals.filter(i => i.segmentType === 'work')
    expect(workIntervals.length).toBe(7)
    // 4 -> 6 -> 8 -> 9 -> 8 -> 6 -> 4
    expect(workIntervals.map(i => i.targetRpe)).toEqual([4, 6, 8, 9, 8, 6, 4])
  })

  it('ensures all voice cues are modality-agnostic and avoid modality-locked verbs', () => {
    const patternIds: CardioPatternId[] = [
      'zone2_aerobic_engine',
      'hiit_1_to_2',
      'pyramid_ladder',
      'threshold_tempo_over_under',
      'tabata_micro_bursts',
      'parasympathetic_recovery_flush',
    ]

    for (const id of patternIds) {
      const session = buildCardioSession({ patternId: id, durationMinutes: 20 })
      for (const interval of session.intervals) {
        const text = [
          interval.voiceCues.startCue,
          interval.voiceCues.midIntervalCue || '',
          interval.voiceCues.countdown10sCue || '',
          interval.voiceCues.swiftKickCue || '',
        ].join(' ').toLowerCase()

        // Should never assume a single modality like "pedal" or "treadmill belt" as mandatory
        expect(text).not.toContain('pedal faster')
        expect(text).not.toContain('start pedaling')
        expect(text).not.toContain('hit the treadmill belt')
      }
    }
  })

  it('delivers Coach Gordon swift kicks with high empathy and tough love', () => {
    expect(COACH_GORDON_SWIFT_KICKS.length).toBeGreaterThanOrEqual(5)
    const randomKick = getRandomSwiftKick()
    expect(randomKick).toBeTruthy()
    expect(typeof randomKick).toBe('string')
  })

  describe('evaluateAdaptiveHeartRateFeedback', () => {
    it('handles invalid or disconnected heart rates safely', () => {
      expect(evaluateAdaptiveHeartRateFeedback(0, 4).alertType).toBe('none')
      expect(evaluateAdaptiveHeartRateFeedback(35, 4).alertType).toBe('none')
      expect(evaluateAdaptiveHeartRateFeedback(250, 4).alertType).toBe('none')
    })

    it('detects cardiac drift when target is Zone 2 (RPE 4-5) but HR exceeds 83% HRmax', () => {
      // For age 35, HRmax = 208 - (0.7 * 35) = 183.5 ~ 184 bpm.
      // 160 bpm is 160 / 184 = 87% HRmax.
      const feedback = evaluateAdaptiveHeartRateFeedback(160, 4, 35)
      expect(feedback.alertType).toBe('cardiac_drift')
      expect(feedback.hrPercentMax).toBeGreaterThanOrEqual(83)
      expect(feedback.voiceCue).toContain('check your ego')
      expect(feedback.voiceCue).toContain('Zone 2')
    })

    it('detects under-exertion during high-intensity intervals (RPE 8+) when HR is too low', () => {
      // 120 bpm is 120 / 184 = 65% HRmax (< 72%).
      const feedback = evaluateAdaptiveHeartRateFeedback(120, 8, 35)
      expect(feedback.alertType).toBe('under_exertion')
      expect(feedback.hrPercentMax).toBeLessThan(72)
      expect(feedback.voiceCue).toContain('heart rate idling')
      expect(feedback.voiceCue).toContain('RPE 8')
    })

    it('detects on_target lock during Zone 2 exertion', () => {
      // 135 bpm is 135 / 184 = 73% HRmax (within 68% - 78%).
      const feedback = evaluateAdaptiveHeartRateFeedback(135, 4, 35)
      expect(feedback.alertType).toBe('on_target')
      expect(feedback.voiceCue).toContain('Zone 2 aerobic efficiency')
    })
  })

  describe('getEquipmentBiomechanicalFormTips', () => {
    it('returns specific biomechanical directives for treadmill incline', () => {
      const tips = getEquipmentBiomechanicalFormTips('Treadmill Incline')
      expect(tips.equipmentName).toBe('Treadmill Incline')
      expect(tips.primaryFormTip).toContain('handrails')
      expect(tips.commonMistake).toContain('caloric expenditure')
      expect(tips.formDirectives.length).toBeGreaterThanOrEqual(3)
    })

    it('returns specific directives for rowing ergometer', () => {
      const tips = getEquipmentBiomechanicalFormTips('Concept2 Rower')
      expect(tips.equipmentName).toBe('Rowing Machine')
      expect(tips.primaryFormTip).toContain('60% legs')
      expect(tips.formDirectives.some(d => d.includes('Drive'))).toBe(true)
    })

    it('returns specific directives for stairmaster', () => {
      const tips = getEquipmentBiomechanicalFormTips('Stairmaster Gauntlet')
      expect(tips.equipmentName).toBe('Stairmaster')
      expect(tips.primaryFormTip).toContain('hunching')
    })

    it('returns specific directives for stationary/assault bike', () => {
      const tips = getEquipmentBiomechanicalFormTips('Assault AirBike')
      expect(tips.equipmentName).toBe('Stationary / Assault Bike')
      expect(tips.primaryFormTip).toContain('360-degree')
    })

    it('returns specific directives for outdoor running/walking', () => {
      const tips = getEquipmentBiomechanicalFormTips('Outdoor Trail Run')
      expect(tips.equipmentName).toBe('Outdoor Run / Walk')
      expect(tips.primaryFormTip).toContain('center of mass')
    })

    it('gracefully falls back to general cardio directives for unknown modalities', () => {
      const tips = getEquipmentBiomechanicalFormTips('Kayaking / Jump Rope')
      expect(tips.equipmentName).toBe('General Cardio Modality')
      expect(tips.primaryFormTip).toContain('stacked posture')
    })
  })

  describe('parseCardioVoiceCommand', () => {
    it('accurately parses time checks with interval and session context', () => {
      const cmd = parseCardioVoiceCommand('how much time left?', {
        segmentRemainingSecs: 45,
        totalRemainingSecs: 600,
      })
      expect(cmd.type).toBe('TIME_CHECK')
      expect(cmd.spokenFeedback).toContain('45 seconds left in this interval')
      expect(cmd.spokenFeedback).toContain('10 minutes left')
    })

    it('parses swift kick requests', () => {
      const cmd = parseCardioVoiceCommand('coach push me, I am getting tired')
      expect(cmd.type).toBe('SWIFT_KICK')
      expect(cmd.spokenFeedback).toBeTruthy()
    })

    it('parses direct RPE effort reports from the athlete', () => {
      const cmd1 = parseCardioVoiceCommand("I'm feeling like an 8 right now")
      expect(cmd1.type).toBe('RPE_REPORT')
      expect(cmd1.rpeValue).toBe(8)
      expect(cmd1.spokenFeedback).toContain('Logged RPE 8')

      const cmd2 = parseCardioVoiceCommand('effort is a 6 out of 10')
      expect(cmd2.type).toBe('RPE_REPORT')
      expect(cmd2.rpeValue).toBe(6)
    })

    it('parses locomotor cadence and breathing checks with in-pocket spoken guidance', () => {
      const cmd1 = parseCardioVoiceCommand('Coach, how should I breathe?', {
        segmentRemainingSecs: 60,
        totalRemainingSecs: 600,
        targetRpe: 4,
        modality: 'Treadmill Incline Walk',
      })
      expect(cmd1.type).toBe('CADENCE_CHECK')
      expect(cmd1.spokenFeedback).toContain('3 strides in')
      expect(cmd1.spokenFeedback).toContain('pocket')

      const cmd2 = parseCardioVoiceCommand("what's my cadence on the rower?", {
        segmentRemainingSecs: 30,
        totalRemainingSecs: 300,
        targetRpe: 5,
        modality: 'Rowing Machine',
      })
      expect(cmd2.type).toBe('CADENCE_CHECK')
      expect(cmd2.spokenFeedback).toContain('rower')
      expect(cmd2.spokenFeedback).toContain('recovery slide')

      const cmd3 = parseCardioVoiceCommand('stride count check', {
        segmentRemainingSecs: 40,
        totalRemainingSecs: 400,
        targetRpe: 8,
        modality: 'Outdoor Run / Walk',
      })
      expect(cmd3.type).toBe('CADENCE_CHECK')
      expect(cmd3.spokenFeedback).toContain('2:1')
    })

    it('parses pause, resume, and skip commands', () => {
      expect(parseCardioVoiceCommand('pause workout').type).toBe('PAUSE')
      expect(parseCardioVoiceCommand('let us resume and go').type).toBe('RESUME')
      expect(parseCardioVoiceCommand('skip to the next interval').type).toBe('NEXT_INTERVAL')
    })

    it('returns UNKNOWN for unrelated phrases', () => {
      expect(parseCardioVoiceCommand('what is the weather today').type).toBe('UNKNOWN')
    })
  })

  describe('getLocomotorCadenceGuidance (Locomotor-Respiratory Coupling)', () => {
    it('provides stride-based ratios for running, walking, and treadmill across RPE tiers', () => {
      // RPE 2 (Base/Warmup) -> 4:4
      const g2 = getLocomotorCadenceGuidance(2, 'Treadmill Incline Walk')
      expect(g2.modalityCategory).toBe('running_walking')
      expect(g2.ratioLabel).toBe('4:4 Stride Cadence')
      expect(g2.inhaleSteps).toBe(4)
      expect(g2.exhaleSteps).toBe(4)
      expect(g2.inEarSpokenGuidance).toContain('pocket')

      // RPE 4 (Zone 2) -> 3:3
      const g4 = getLocomotorCadenceGuidance(4, 'Outdoor Run / Walk')
      expect(g4.ratioLabel).toBe('3:3 Stride Cadence')
      expect(g4.inhaleSteps).toBe(3)
      expect(g4.exhaleSteps).toBe(3)
      expect(g4.inEarSpokenGuidance).toContain('3 strides in')

      // RPE 7 (Threshold/Tempo) -> 2:2
      const g7 = getLocomotorCadenceGuidance(7, 'Treadmill')
      expect(g7.ratioLabel).toBe('2:2 Stride Cadence')
      expect(g7.inhaleSteps).toBe(2)
      expect(g7.exhaleSteps).toBe(2)

      // RPE 8 (Lactate Surge) -> 2:1
      const g8 = getLocomotorCadenceGuidance(8, 'Treadmill')
      expect(g8.ratioLabel).toBe('2:1 Stride Cadence')
      expect(g8.inhaleSteps).toBe(2)
      expect(g8.exhaleSteps).toBe(1)

      // RPE 10 (Sprint Finisher) -> 1:1
      const g10 = getLocomotorCadenceGuidance(10, 'Treadmill')
      expect(g10.ratioLabel).toBe('1:1 Stride Cadence')
      expect(g10.inhaleSteps).toBe(1)
      expect(g10.exhaleSteps).toBe(1)
    })

    it('provides slide/drive phase-locked guidance for rowing ergometers', () => {
      const gRowerBase = getLocomotorCadenceGuidance(4, 'Concept2 Rower')
      expect(gRowerBase.modalityCategory).toBe('rowing')
      expect(gRowerBase.ratioLabel).toContain('Slide')
      expect(gRowerBase.ratioLabel).toContain('Drive')
      expect(gRowerBase.inEarSpokenGuidance).toContain('recovery slide forward')
      expect(gRowerBase.inEarSpokenGuidance).toContain('drive through your heels')

      const gRowerSprint = getLocomotorCadenceGuidance(9, 'Rowing Machine')
      expect(gRowerSprint.modalityCategory).toBe('rowing')
      expect(gRowerSprint.ratioLabel).toContain('Dual-Breath')
    })

    it('provides downstroke-locked cadence guidance for cycling and assault bikes', () => {
      const gBikeEasy = getLocomotorCadenceGuidance(2, 'Stationary Bike')
      expect(gBikeEasy.modalityCategory).toBe('cycling')
      expect(gBikeEasy.ratioLabel).toBe('4:4 Revolution Cadence')
      expect(gBikeEasy.inhaleSteps).toBe(4)
      expect(gBikeEasy.exhaleSteps).toBe(4)

      const gBikeZone2 = getLocomotorCadenceGuidance(5, 'Assault AirBike')
      expect(gBikeZone2.modalityCategory).toBe('cycling')
      expect(gBikeZone2.ratioLabel).toBe('3:3 Revolution Cadence')

      const gBikeSurge = getLocomotorCadenceGuidance(8, 'Spin Bike')
      expect(gBikeSurge.modalityCategory).toBe('cycling')
      expect(gBikeSurge.ratioLabel).toContain('High-Cadence')
    })

    it('provides step-locked cadence guidance for stairmasters', () => {
      const gStair = getLocomotorCadenceGuidance(4, 'Stairmaster')
      expect(gStair.modalityCategory).toBe('stairmaster')
      expect(gStair.ratioLabel).toBe('2:2 Step Cadence')
      expect(gStair.inEarSpokenGuidance).toContain('stairs')
    })
  })

  describe('calculateExecutiveCardioDebrief', () => {
    it('calculates comprehensive debrief metrics including zones, EPOC, and coach speech', () => {
      const debrief = calculateExecutiveCardioDebrief({
        durationSeconds: 1800, // 30 minutes
        averageRpe: 4.8,
        peakRpe: 8,
        samplesBpm: [130, 135, 140, 138, 142],
        patternId: 'zone2_aerobic_engine',
        athleteName: 'Jordan',
        athleteWeightKg: 80,
      })

      expect(debrief.totalDurationMins).toBe(30)
      expect(debrief.averageRpe).toBe(4.8)
      expect(debrief.peakRpe).toBe(8)
      expect(debrief.totalCaloriesBurned).toBeGreaterThan(150)
      expect(debrief.epocAfterburnCalories).toBeGreaterThan(0)
      expect(debrief.zone1Percent + debrief.zone2Percent + debrief.zone3Percent).toBe(100)
      expect(debrief.respiratoryComplianceScore).toBeGreaterThanOrEqual(80)
      expect(debrief.postSessionCoachDebriefVoiceScript).toContain('Jordan')
      expect(debrief.postSessionCoachDebriefVoiceScript).toContain('Coach Gordon debriefing')
      expect(debrief.postSessionCoachDebriefVoiceScript).toContain('EPOC afterburn')
      expect(debrief.postSessionCoachDebriefVoiceScript).toContain('electrolyte water')
    })

    it('applies higher EPOC afterburn multiplier for high-intensity HIIT/Tabata', () => {
      const lowIntensity = calculateExecutiveCardioDebrief({
        durationSeconds: 1200,
        averageRpe: 3,
        peakRpe: 4,
        patternId: 'parasympathetic_recovery_flush',
      })

      const highIntensity = calculateExecutiveCardioDebrief({
        durationSeconds: 1200,
        averageRpe: 7,
        peakRpe: 9,
        patternId: 'tabata_micro_bursts',
      })

      const lowRatio = lowIntensity.epocAfterburnCalories / lowIntensity.totalCaloriesBurned
      const highRatio = highIntensity.epocAfterburnCalories / highIntensity.totalCaloriesBurned
      expect(highRatio).toBeGreaterThan(lowRatio)
    })
  })

  describe('resolveSegmentFromTotalElapsed', () => {
    const mockIntervals = [
      { id: '1', segmentType: 'warmup' as const, title: 'Warmup', durationSeconds: 300, targetRpe: 3, breathingProfile: {} as any, voiceCues: {} as any },
      { id: '2', segmentType: 'work' as const, title: 'Interval 1', durationSeconds: 180, targetRpe: 7, breathingProfile: {} as any, voiceCues: {} as any },
      { id: '3', segmentType: 'recovery' as const, title: 'Recovery 1', durationSeconds: 120, targetRpe: 4, breathingProfile: {} as any, voiceCues: {} as any },
      { id: '4', segmentType: 'cooldown' as const, title: 'Cooldown', durationSeconds: 300, targetRpe: 2, breathingProfile: {} as any, voiceCues: {} as any },
    ] // Total: 900s (0-300, 300-480, 480-600, 600-900)

    it('resolves the very start of workout (0s)', () => {
      const res = resolveSegmentFromTotalElapsed(mockIntervals, 0)
      expect(res.segmentIndex).toBe(0)
      expect(res.segmentElapsedSeconds).toBe(0)
      expect(res.isCompleted).toBe(false)
    })

    it('resolves midway through the first interval (150s)', () => {
      const res = resolveSegmentFromTotalElapsed(mockIntervals, 150)
      expect(res.segmentIndex).toBe(0)
      expect(res.segmentElapsedSeconds).toBe(150)
      expect(res.isCompleted).toBe(false)
    })

    it('resolves boundary transition between interval 0 and interval 1 (300s)', () => {
      const res = resolveSegmentFromTotalElapsed(mockIntervals, 300)
      expect(res.segmentIndex).toBe(1)
      expect(res.segmentElapsedSeconds).toBe(0)
      expect(res.isCompleted).toBe(false)
    })

    it('resolves midway through a later interval after sleeping in pocket (540s)', () => {
      // 540s is 60s into Recovery 1 (480 + 60 = 540)
      const res = resolveSegmentFromTotalElapsed(mockIntervals, 540)
      expect(res.segmentIndex).toBe(2)
      expect(res.segmentElapsedSeconds).toBe(60)
      expect(res.isCompleted).toBe(false)
    })

    it('resolves exact completion at total duration (900s)', () => {
      const res = resolveSegmentFromTotalElapsed(mockIntervals, 900)
      expect(res.segmentIndex).toBe(3)
      expect(res.segmentElapsedSeconds).toBe(300)
      expect(res.isCompleted).toBe(true)
    })

    it('handles elapsed time exceeding total duration gracefully (1200s)', () => {
      const res = resolveSegmentFromTotalElapsed(mockIntervals, 1200)
      expect(res.segmentIndex).toBe(3)
      expect(res.segmentElapsedSeconds).toBe(300)
      expect(res.isCompleted).toBe(true)
    })

    it('handles empty intervals array without crashing', () => {
      const res = resolveSegmentFromTotalElapsed([], 100)
      expect(res.isCompleted).toBe(true)
    })
  })

  describe('Outdoor Distance & Step Telemetry Integration', () => {
    it('integrates distance, steps, and pace into executive debrief voice script and analytics', () => {
      const debrief = calculateExecutiveCardioDebrief({
        durationSeconds: 1800, // 30 mins
        averageRpe: 5.0,
        peakRpe: 7,
        patternId: 'zone2_aerobic_engine',
        athleteName: 'Marcus',
        distanceMeters: 4828, // ~3 miles
        distanceUnit: 'mi',
        totalSteps: 5400,
        avgCadenceSpm: 168,
      })

      expect(debrief.distanceMiles).toBe(3)
      expect(debrief.formattedDistance).toBe('3 miles')
      expect(debrief.totalSteps).toBe(5400)
      expect(debrief.avgCadenceSpm).toBe(168)
      expect(debrief.formattedAveragePace).toBe('10\'00" /mi')
      expect(debrief.postSessionCoachDebriefVoiceScript).toContain('3 miles')
      expect(debrief.postSessionCoachDebriefVoiceScript).toContain('5,400 steps')
      expect(debrief.postSessionCoachDebriefVoiceScript).toContain('10\'00" /mi')
    })

    it('parses distance, pace, and step voice commands in voice copilot', () => {
      // 1. Distance check when active
      const activeDist = parseCardioVoiceCommand('What is my distance?', {
        isDistanceTrackingActive: true,
        formattedDistance: '2.45 miles',
        formattedPace: '8\'30" /mi',
      })
      expect(activeDist.type).toBe('DISTANCE_CHECK')
      expect(activeDist.spokenFeedback).toContain('2.45 miles')
      expect(activeDist.spokenFeedback).toContain('8\'30" /mi')

      // 2. Distance check when stationary
      const stationaryDist = parseCardioVoiceCommand('How far have I gone?', {
        isDistanceTrackingActive: false,
      })
      expect(stationaryDist.type).toBe('DISTANCE_CHECK')
      expect(stationaryDist.spokenFeedback).toContain('stationary mode')

      // 3. Pace check
      const paceCheck = parseCardioVoiceCommand('Pace check please', {
        isDistanceTrackingActive: true,
        formattedPace: '7\'45" /mi',
      })
      expect(paceCheck.type).toBe('PACE_CHECK')
      expect(paceCheck.spokenFeedback).toContain('7\'45" /mi')

      // 4. Step count check
      const stepCheck = parseCardioVoiceCommand('How many steps have I logged?', {
        stepCount: 3850,
        stepCadenceSpm: 165,
      })
      expect(stepCheck.type).toBe('STEP_CHECK')
      expect(stepCheck.spokenFeedback).toContain('3,850 steps')
      expect(stepCheck.spokenFeedback).toContain('165 steps per minute')
    })
  })
})


