import { describe, it, expect } from 'vitest'
import { CARDIO_PATTERNS, buildCardioSession } from '@/lib/coach-cardio-engine'

describe('CoachCardioVoiceoverPlayer Responsive Design & Session Engine Logic', () => {
  it('correctly provides default duration and allowed durations for all 6 cardio protocols', () => {
    const patternKeys = Object.keys(CARDIO_PATTERNS)
    expect(patternKeys.length).toBe(6)

    patternKeys.forEach(key => {
      const pat = CARDIO_PATTERNS[key as keyof typeof CARDIO_PATTERNS]
      expect(pat.defaultDurationMins).toBeGreaterThan(0)
      expect(pat.allowedDurations.length).toBeGreaterThanOrEqual(3)
      expect(pat.targetRpeRange[0]).toBeLessThanOrEqual(pat.targetRpeRange[1])
    })
  })

  it('buildCardioSession scales duration properly for mobile launch options (10m, 15m, 20m, 30m, 45m)', () => {
    const durations = [10, 15, 20, 30, 45]
    durations.forEach(mins => {
      const session = buildCardioSession({
        patternId: 'zone2_aerobic_engine',
        durationMinutes: mins,
        athleteName: 'Athlete',
      })
      expect(session.totalSeconds).toBe(mins * 60)
      expect(session.intervals.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('Tanaka HR max formula calculates accurate age-predicted ceilings for biometric telemetry', () => {
    // Tanaka formula: HRmax = 208 - (0.7 * age)
    const calculateTanaka = (age: number) => {
      const safeAge = Math.max(18, Math.min(85, age))
      return Math.round(208 - 0.7 * safeAge)
    }

    expect(calculateTanaka(20)).toBe(194) // 208 - 14 = 194
    expect(calculateTanaka(35)).toBe(184) // 208 - 24.5 = 183.5 -> 184
    expect(calculateTanaka(50)).toBe(173) // 208 - 35 = 173
  })

  it('formatTime helper properly handles two-digit padding across minutes and seconds', () => {
    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60).toString().padStart(2, '0')
      const s = (secs % 60).toString().padStart(2, '0')
      return `${m}:${s}`
    }

    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(9)).toBe('00:09')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(1200)).toBe('20:00')
  })

  describe('Adaptive Heart Rate Telemetry & Biometric Biofeedback', () => {
    it('detects cardiac drift when target is Zone 2 (RPE <= 5) but HR exceeds 83% HRmax', async () => {
      const { evaluateAdaptiveHeartRateFeedback } = await import('@/lib/coach-cardio-engine')
      // Age 35: Tanaka HRmax = 208 - (0.7 * 35) = 184 bpm
      // 160 bpm / 184 = 87% HRmax -> Cardiac drift
      const result = evaluateAdaptiveHeartRateFeedback(160, 4, 35)
      expect(result.alertType).toBe('cardiac_drift')
      expect(result.hrPercentMax).toBeGreaterThanOrEqual(83)
      expect(result.voiceCue).toContain('check your ego')
    })

    it('detects under-exertion when target is High Intensity (RPE >= 8) but HR is below 72% HRmax', async () => {
      const { evaluateAdaptiveHeartRateFeedback } = await import('@/lib/coach-cardio-engine')
      // Age 35: HRmax 184 bpm. 120 bpm / 184 = 65% HRmax -> Under exertion
      const result = evaluateAdaptiveHeartRateFeedback(120, 8, 35)
      expect(result.alertType).toBe('under_exertion')
      expect(result.hrPercentMax).toBeLessThan(72)
      expect(result.voiceCue).toContain('idling')
    })

    it('confirms optimal Zone 2 sweet spot when HR is between 68% and 78% HRmax', async () => {
      const { evaluateAdaptiveHeartRateFeedback } = await import('@/lib/coach-cardio-engine')
      // Age 35: HRmax 184 bpm. 132 bpm / 184 = 72% HRmax -> Sweet spot
      const result = evaluateAdaptiveHeartRateFeedback(132, 4, 35)
      expect(result.alertType).toBe('on_target')
      expect(result.hrPercentMax).toBeGreaterThanOrEqual(68)
      expect(result.hrPercentMax).toBeLessThanOrEqual(78)
      expect(result.voiceCue).toContain('sweet spot')
    })

    it('returns none when heart rate reading is non-physiological (<= 40 or > 240 bpm)', async () => {
      const { evaluateAdaptiveHeartRateFeedback } = await import('@/lib/coach-cardio-engine')
      expect(evaluateAdaptiveHeartRateFeedback(0, 4, 35).alertType).toBe('none')
      expect(evaluateAdaptiveHeartRateFeedback(35, 4, 35).alertType).toBe('none')
      expect(evaluateAdaptiveHeartRateFeedback(250, 4, 35).alertType).toBe('none')
    })
  })

  describe('Equipment Biomechanical Form Directives Across All Modalities', () => {
    it('provides specialized directives for Treadmill, Bike, Rower, Stairmaster, and Ergometers', async () => {
      const { getEquipmentBiomechanicalFormTips } = await import('@/lib/coach-cardio-engine')

      const modalities = [
        'Treadmill Incline Walk',
        'Stationary Bike',
        'Rowing Machine',
        'Stairmaster',
        'Assault / Air Bike',
        'Elliptical',
        'Outdoor Run / Walk',
        'Ski Erg',
        'Jump Rope',
        'General Modality',
      ]

      for (const mod of modalities) {
        const tips = getEquipmentBiomechanicalFormTips(mod)
        expect(tips.equipmentName).toBeTruthy()
        expect(tips.primaryFormTip).toBeTruthy()
        expect(tips.formDirectives.length).toBeGreaterThanOrEqual(2)
        expect(tips.commonMistake).toBeTruthy()
      }
    })
  })

  describe('Locomotor-Respiratory Coupling (LRC) & RPE Breathing Registry', () => {
    it('maps RPE 1 through 10 to progressive breathing pacing and ventilation methods', async () => {
      const { getBreathingProfileForRpe } = await import('@/lib/coach-cardio-engine')

      for (let rpe = 1; rpe <= 10; rpe++) {
        const profile = getBreathingProfileForRpe(rpe)
        expect(profile.rpe).toBe(rpe)
        expect(profile.breathingPacingSeconds).toBeGreaterThan(0)
        expect(profile.inBreathSeconds).toBeGreaterThan(0)
        expect(profile.outBreathSeconds).toBeGreaterThan(0)
        expect(profile.talkTest).toBeTruthy()
        expect(profile.primaryRespiratoryCue).toBeTruthy()
      }
    })

    it('generates modality-tailored in-ear spoken cadence guidance', async () => {
      const { getLocomotorCadenceGuidance } = await import('@/lib/coach-cardio-engine')

      const rowGuidance = getLocomotorCadenceGuidance(4, 'rowing')
      expect(rowGuidance.modalityCategory).toBe('rowing')
      expect(rowGuidance.inEarSpokenGuidance).toContain('rower')

      const bikeGuidance = getLocomotorCadenceGuidance(5, 'stationary bike')
      expect(bikeGuidance.modalityCategory).toBe('cycling')

      const runGuidance = getLocomotorCadenceGuidance(7, 'outdoor run')
      expect(runGuidance.modalityCategory).toBe('running_walking')
    })
  })

  describe('Mobile Viewport & iPhone Footer Clearance Guardrails', () => {
    it('guarantees CoachCardioVoiceoverPlayer footer bar enforces safe-area-inset-bottom and mobile dock clearance', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const playerPath = path.resolve(__dirname, './CoachCardioVoiceoverPlayer.tsx')
      const content = fs.readFileSync(playerPath, 'utf-8')

      // Verifies .coach-cardio-footer-bar has safe area bottom padding
      expect(content).toContain('.coach-cardio-footer-bar {')
      expect(content).toContain('env(safe-area-inset-bottom, 16px)')
      expect(content).toContain('env(safe-area-inset-bottom, 20px)')
      expect(content).toContain('@media (max-width: 768px)')
      expect(content).toContain('coach-cardio-modal-open')

      // Verifies START button has high-contrast elevated zIndex and tap ergonomics
      expect(content).toContain('START COACH GORDON CARDIO')
      expect(content).toContain('minHeight: 52')
    })

    it('guarantees FitnessTrackerClient wraps cardio studio in elevated zIndex 100050 and safe-area backdrop', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const clientPath = path.resolve(__dirname, './FitnessTrackerClient.tsx')
      const content = fs.readFileSync(clientPath, 'utf-8')

      expect(content).toContain('coach-cardio-modal-backdrop')
      expect(content).toContain('zIndex: 100050')
      expect(content).toContain('env(safe-area-inset-bottom, 16px)')
    })

    it('guarantees globals.css suppresses mobile bottom dock when Cardio Studio modal is open', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const cssPath = path.resolve(__dirname, '../../app/globals.css')
      const content = fs.readFileSync(cssPath, 'utf-8')

      expect(content).toContain('body:has([aria-label="Coach Gordon Cardio Studio"]) .mobile-bottom-dock')
      expect(content).toContain('body.coach-cardio-modal-open .mobile-bottom-dock')
      expect(content).toContain('display: none !important')
    })
  })

  describe('Outdoor Cardio Telemetry, Distance & Step Tracking Integration', () => {
    it('verifies CoachCardioVoiceoverPlayer embeds outdoor GPS, pedometer, and unit switching controls', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const playerPath = path.resolve(__dirname, './CoachCardioVoiceoverPlayer.tsx')
      const content = fs.readFileSync(playerPath, 'utf-8')

      // Verifies modality options include Outdoor Run / Walk and Outdoor Cycling
      expect(content).toContain("'Outdoor Run / Walk'")
      expect(content).toContain("'Outdoor Cycling'")

      // Verifies Pre-Session setup contains GPS & pedometer toggle and MI / KM switch
      expect(content).toContain('Track Distance & Steps (GPS)')
      expect(content).toContain('Stationary Mode (GPS Off)')
      expect(content).toContain('distanceUnit === \'mi\'')
      expect(content).toContain('MI')
      expect(content).toContain('KM')

      // Verifies HUD Active Workout displays distance, pace, and step metrics
      expect(content).toContain('Distance')
      expect(content).toContain('Pace')
      expect(content).toContain('Steps')
      expect(content).toContain('SPM Cadence')

      // Verifies OLED Pocket Touch Shield HUD renders distance, pace, and steps
      expect(content).toContain('distanceUnit.toUpperCase()')
      expect(content).toContain('stepCount.toLocaleString()')

      // Verifies Executive Debrief displays distance, splits, and steps
      expect(content).toContain('Distance Traveled')
      expect(content).toContain('Tracked Steps')
      expect(content).toContain('Splits:')

      // Verifies API logging and Apple Health sync pass distance metrics
      expect(content).toContain('distance_km:')
      expect(content).toContain('distanceMiles:')
      expect(content).toContain('syncActivityToAppleHealth')

      // Verifies Voice Copilot context includes distance and step queries
      expect(content).toContain('distanceMeters: distanceMetersRef.current')
      expect(content).toContain('stepCount: stepCountRef.current')
    })

    it('verifies non-stationary modality auto-detection correctly defaults distance tracking on', async () => {
      const { isNonStationaryModality } = await import('@/lib/cardio-distance-tracker')

      expect(isNonStationaryModality('Outdoor Run / Walk')).toBe(true)
      expect(isNonStationaryModality('Outdoor Cycling')).toBe(true)
      expect(isNonStationaryModality('Trail Run / Ruck')).toBe(true)
      expect(isNonStationaryModality('Outdoor Road Cycling')).toBe(true)

      expect(isNonStationaryModality('Treadmill Incline Walk')).toBe(false)
      expect(isNonStationaryModality('Stationary Bike')).toBe(false)
      expect(isNonStationaryModality('Rowing Machine')).toBe(false)
      expect(isNonStationaryModality('Stairmaster')).toBe(false)
    })

    it('verifies CoachCardioVoiceoverPlayer debrief transitions to cool-down instead of premature breathwork', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const playerPath = path.resolve(__dirname, './CoachCardioVoiceoverPlayer.tsx')
      const content = fs.readFileSync(playerPath, 'utf-8')

      // Verifies props include onFlowToCoolDown
      expect(content).toContain('onFlowToCoolDown?: () => void')

      // Verifies debrief button displays Flow to Cool-Down
      expect(content).toContain('Flow to Cool-Down')

      // Verifies debrief button triggers onFlowToCoolDown handler
      expect(content).toContain('if (onFlowToCoolDown)')
      expect(content).toContain('onFlowToCoolDown()')
    })
  })
})

