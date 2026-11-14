import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  CLINICAL_BOUNDARY_DISCLAIMER,
  EMERGENCY_CLINICAL_DISCLAIMER,
  dispatchSafetyFlagTelemetry,
  evaluatePainAndRedFlagTriage,
  evaluateProgressionAndIntensityCaps,
  resolveSafeRegressionStep,
  stripPiiAndRawFramesFromCoachContext,
  validateCoachBrandSafetyOutput,
} from './clinicalGuardrails'
import * as telemetryClient from '@/src/lib/telemetry/telemetryClient'

describe('clinicalGuardrails — Client Safety & Brand Safety Layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Pain vs. Effort Triage Protocol', () => {
    it('triggers emergency_911 override on chest pain or acute dizziness keywords', () => {
      const chestDecision = evaluatePainAndRedFlagTriage({
        messageText: 'I feel chest pain and dizziness during this set',
        exerciseName: 'Barbell Back Squat',
      })
      expect(chestDecision.triggered).toBe(true)
      expect(chestDecision.shouldPauseMovement).toBe(true)
      expect(chestDecision.severity).toBe('emergency_911')
      expect(chestDecision.clinicalDisclaimer).toBe(EMERGENCY_CLINICAL_DISCLAIMER)
      expect(chestDecision.requiresCoachPortalAlert).toBe(true)
    })

    it('triggers clinical_stop override on every red-flag musculoskeletal/neurological keyword', () => {
      const redFlags = [
        'sharp pain',
        'shooting',
        'numbness',
        'tingling',
        'pop',
        'swelling',
      ]

      for (const kw of redFlags) {
        const res = evaluatePainAndRedFlagTriage({
          messageText: `My shoulder had ${kw} on rep 4`,
          exerciseName: 'Overhead Dumbbell Press',
        })
        expect(res.triggered).toBe(true)
        expect(res.shouldPauseMovement).toBe(true)
        expect(res.severity).toBe('clinical_stop')
        expect(res.matchedKeywords).toContain(kw)
        expect(res.clinicalDisclaimer).toBe(CLINICAL_BOUNDARY_DISCLAIMER)
      }
    })

    it('triggers clinical_stop when member logs high discomfort (>= 4/5 pain)', () => {
      const res = evaluatePainAndRedFlagTriage({
        painLevel5: 4,
        exerciseName: 'Romanian Deadlift',
      })
      expect(res.triggered).toBe(true)
      expect(res.severity).toBe('clinical_stop')
      expect(res.regression?.replacementExercise).toBe('Supported Dumbbell Glute Bridge')
    })

    it('triggers safe regression on 1-tap "Joint Feels Pinchy / Uncomfortable" and steps down chain', () => {
      const step1 = resolveSafeRegressionStep('Overhead Dumbbell Press')
      expect(step1.replacementExercise).toBe('Landmine / High-Incline Neutral Dumbbell Press')
      expect(step1.nextStepDownExercise).toBe('Scapular Wall Slide')

      const step2 = resolveSafeRegressionStep(step1.replacementExercise)
      expect(step2.replacementExercise).toBe('Scapular Wall Slide')

      const pinchyDecision = evaluatePainAndRedFlagTriage({
        pinchyButtonTriggered: true,
        exerciseName: 'Overhead Dumbbell Press',
      })
      expect(pinchyDecision.triggered).toBe(true)
      expect(pinchyDecision.severity).toBe('joint_regression')
      expect(pinchyDecision.regression?.replacementExercise).toBe(
        'Landmine / High-Incline Neutral Dumbbell Press'
      )
    })

    it('dispatches high-priority safety_flag telemetry event to Coach Portal immediately', async () => {
      const spy = vi
        .spyOn(telemetryClient, 'trackEvent')
        .mockResolvedValue({ event_id: 'evt_test_safety_1' } as never)
      const decision = evaluatePainAndRedFlagTriage({
        pinchyButtonTriggered: true,
        exerciseName: 'Overhead Dumbbell Press',
        optPhase: 2,
      })

      const eventId = await dispatchSafetyFlagTelemetry({
        decision,
        triggerSource: 'in_set_pinchy_button',
        exerciseName: 'Overhead Dumbbell Press',
        swappedToExercise: decision.regression?.replacementExercise,
        optPhase: 2,
      })

      expect(eventId).toBe('evt_test_safety_1')
      expect(spy).toHaveBeenCalledWith(
        'safety_flag',
        expect.objectContaining({
          severity: 'joint_regression',
          trigger_source: 'in_set_pinchy_button',
          exercise_name: 'Overhead Dumbbell Press',
          swapped_to_exercise: 'Landmine / High-Incline Neutral Dumbbell Press',
          joint_area: 'Shoulder',
          opt_phase: 2,
        }),
        { immediate: true }
      )
    })
  })

  describe('Deterministic Load & Progression Caps', () => {
    it('enforces Phase 01 stabilization prerequisites before unlocking heavy Phase 03/04 loads', () => {
      const blocked = evaluateProgressionAndIntensityCaps({
        currentOptPhase: 1,
        targetOptPhase: 4,
        phase1CompletedSessions: 2,
        stabilizationCertified: false,
        readinessIndex: 85,
        jointComfortScore100: 85,
        requestedLoadIncreasePct: 10,
      })

      expect(blocked.heavyPhaseBlocked).toBe(true)
      expect(blocked.effectiveMaxOptPhase).toBe(2)
      expect(blocked.recommendedLoadDeltaPct).toBeLessThanOrEqual(5)

      const unlocked = evaluateProgressionAndIntensityCaps({
        currentOptPhase: 2,
        targetOptPhase: 3,
        phase1CompletedSessions: 8,
        stabilizationCertified: true,
        readinessIndex: 88,
        jointComfortScore100: 90,
        requestedLoadIncreasePct: 5,
      })
      expect(unlocked.heavyPhaseBlocked).toBe(false)
      expect(unlocked.effectiveMaxOptPhase).toBe(3)
    })

    it('auto-caps session intensity when Forge Readiness Index < 65 or Joint Comfort <= 4/10', () => {
      const lowReadiness = evaluateProgressionAndIntensityCaps({
        currentOptPhase: 2,
        stabilizationCertified: true,
        readinessIndex: 58,
        jointComfortScore100: 80,
        requestedLoadIncreasePct: 7.5,
      })
      expect(lowReadiness.intensityAutoCapped).toBe(true)
      expect(lowReadiness.recommendedLoadDeltaPct).toBe(-15)
      expect(lowReadiness.maxAllowedRpe).toBeLessThanOrEqual(7.0)

      const lowComfort = evaluateProgressionAndIntensityCaps({
        currentOptPhase: 2,
        stabilizationCertified: true,
        readinessIndex: 82,
        jointComfort10: 3.5,
      })
      expect(lowComfort.intensityAutoCapped).toBe(true)
      expect(lowComfort.recommendedLoadDeltaPct).toBe(-15)
      expect(lowComfort.enforcedTempo).toBe('3-2-1-0')
    })
  })

  describe('Brand Safety Output Validator & Privacy Stripping', () => {
    it('scrubs medical diagnoses, starvation diets, unverified compounds, and "no pain, no gain" language', () => {
      const unsafeRaw =
        'You definitely have a torn rotator cuff. Eat only 800 calories and take SARMs. Remember: no pain, no gain—push through the sharp pain!'
      const validated = validateCoachBrandSafetyOutput(unsafeRaw)

      expect(validated.wasModified).toBe(true)
      expect(validated.violationsTriggered).toContain('medical_diagnosis_blocked')
      expect(validated.violationsTriggered).toContain('extreme_diet_or_compound_blocked')
      expect(validated.violationsTriggered).toContain('toxic_coaching_language_blocked')
      expect(validated.cleanText.toLowerCase()).not.toContain('no pain, no gain')
      expect(validated.cleanText.toLowerCase()).not.toContain('800 calories')
      expect(validated.cleanText.toLowerCase()).not.toContain('torn rotator cuff')
    })

    it('blocks clinical symptom-probing questions and rewrites them to NASM movement-comfort boundaries', () => {
      const probingOutput =
        'Let us check that shoulder. Where does it hurt right now? Rate your pain from 1 to 10. Does the pain radiate down your arm?'
      const validated = validateCoachBrandSafetyOutput(probingOutput)

      expect(validated.wasModified).toBe(true)
      expect(validated.violationsTriggered).toContain('clinical_symptom_probing_blocked')
      expect(validated.cleanText.toLowerCase()).not.toContain('where does it hurt')
      expect(validated.cleanText.toLowerCase()).not.toContain('rate your pain')
      expect(validated.cleanText.toLowerCase()).not.toContain('does the pain radiate')
      expect(validated.cleanText).toContain('licensed physician or physical therapist')
    })

    it('strips all PII and raw camera frames before sending context to AI endpoints', () => {
      const sanitized = stripPiiAndRawFramesFromCoachContext({
        athleteName: 'Marcus Vance',
        email: 'marcus@example.com',
        phoneNumber: '555-867-5309',
        attachedImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
        capturedImageSrc: 'blob:https://forge-athletic.app/frame-123',
        nasmOptPhase: 2,
        jointComfortScore: 60,
        notes: 'Reach me at marcus@example.com or (415) 555-0199',
      })

      expect(sanitized.athleteName).toBe('Marcus')
      expect(sanitized).not.toHaveProperty('email')
      expect(sanitized).not.toHaveProperty('phoneNumber')
      expect(sanitized).not.toHaveProperty('attachedImage')
      expect(sanitized).not.toHaveProperty('capturedImageSrc')
      expect(sanitized.nasmOptPhase).toBe(2)
      expect(sanitized.notes).toContain('[REDACTED_EMAIL]')
      expect(sanitized.notes).toContain('[REDACTED_PHONE]')
    })
  })
})
