import { describe, expect, it } from 'vitest'
import {
  askCoachGordon,
  generateDeterministicCoachResponse,
  detectCoachPingNeed,
} from './ask-coach-gordon'
import { evaluateClinicalUrgencyTriage, isOutOfTrainingScope } from './ask-coach-gordon-types'

describe('Ask Coach Gordon AI Engine & Multi-Tier Liability Safeguards', () => {
  describe('Tier 1: Biomechanical Contraindication Interception', () => {
    it('intercepts contraindicated open-chain knee exercise (Seated Leg Extension) for knee_patellofemoral athlete', async () => {
      const response = await askCoachGordon({
        question: 'Can I do seated leg extensions today?',
        athleteName: 'Marcus',
        contraindicationTags: ['knee_patellofemoral'],
        currentExerciseName: 'Seated Leg Extension',
      })

      expect(response.answerMarkdown).toContain('joint longevity and steer completely clear')
      expect(response.answerMarkdown).toContain('Spanish Squats')
      expect(response.recommendedAction?.type).toBe('swap_exercise')
      expect(response.recommendedAction?.targetExerciseName).toContain('Spanish Squats')
    })

    it('intercepts lumbar spine flexion exercise (Jefferson Curls) for lumbar_disc_condition athlete', async () => {
      const response = await askCoachGordon({
        question: 'Should I do jefferson curls to stretch my hamstrings?',
        athleteName: 'Sarah',
        contraindicationTags: ['lumbar_disc_condition'],
      })

      expect(response.answerMarkdown).toContain('steer completely clear')
      expect(response.answerMarkdown).toContain('McGill Big 3')
      expect(response.recommendedAction?.type).toBe('swap_exercise')
      expect(response.recommendedAction?.targetExerciseName).toContain('McGill Big 3')
    })

    it('intercepts extreme shoulder external rotation (Behind-the-Neck Press) for shoulder_impingement athlete', async () => {
      const response = await askCoachGordon({
        question: 'Is behind-the-neck barbell press good for my shoulders?',
        athleteName: 'David',
        contraindicationTags: ['shoulder_impingement'],
      })

      expect(response.answerMarkdown).toContain('steer completely clear')
      expect(response.answerMarkdown).toContain('Standing Neutral-Grip DB Overhead Press')
      expect(response.recommendedAction?.type).toBe('swap_exercise')
    })
  })

  describe('Tier 1 & 2: Clinical Urgency & Emergency Triage', () => {
    it('triggers emergency 911 protocol for acute chest pain and left arm numbness', () => {
      const triage = evaluateClinicalUrgencyTriage('I have severe chest pain and pressure spreading to my left arm')
      expect(triage.isEmergency911).toBe(true)
      expect(triage.tier).toBe('EMERGENCY_911')
      expect(triage.overrideMarkdown).toContain('EMERGENCY MEDICAL DIRECTIVE')
      expect(triage.overrideMarkdown).toContain('call 911')
    })

    it('triggers emergency 911 for loss of consciousness / syncope', () => {
      const triage = evaluateClinicalUrgencyTriage('I passed out during my deadlift and blacked out')
      expect(triage.isEmergency911).toBe(true)
      expect(triage.overrideMarkdown).toContain('EMERGENCY MEDICAL DIRECTIVE')
    })

    it('triggers physician referral and coach escalation for structural injuries and shooting nerve pain', () => {
      const triage = evaluateClinicalUrgencyTriage('I have shooting electrical pain down my leg from my lower back')
      expect(triage.isEmergency911).toBe(false)
      expect(triage.tier).toBe('SERIOUS_MEDICAL_REFERRAL')
      expect(triage.pingReason).toContain('Out of Scope / Structural Injury')
    })
  })

  describe('Tier 1 & 3: Human-in-the-Loop Coach Escalation Detection', () => {
    it('detects coach ping need for surgical recovery inquiries', () => {
      const check = detectCoachPingNeed('I had a rotator cuff repair surgery 8 weeks ago.')
      expect(check.requiresCoachPing).toBe(true)
      expect(check.reason).toContain('surgery')
    })

    it('detects coach ping need for herniated disc flare-ups', () => {
      const check = detectCoachPingNeed('My herniated disc is flaring up with shooting numbness.')
      expect(check.requiresCoachPing).toBe(true)
      expect(check.reason).toContain('herniated')
    })

    it('detects coach ping need when athlete asks to message real Coach Scott', () => {
      const check = detectCoachPingNeed('Can you ping coach scott to review my progress?')
      expect(check.requiresCoachPing).toBe(true)
      expect(check.reason).toContain('ping coach')
    })

    it('does not trigger coach ping for standard exercise questions', () => {
      const check = detectCoachPingNeed('What is the optimal rest time between sets for strength endurance?')
      expect(check.requiresCoachPing).toBe(false)
    })
  })

  describe('Strict Professional Scope of Practice Boundaries', () => {
    it('identifies out-of-scope cryptocurrency or financial questions', () => {
      expect(isOutOfTrainingScope('Should I buy bitcoin or ethereum?')).toBe(true)
    })

    it('identifies out-of-scope non-fitness medical diagnosis', () => {
      expect(isOutOfTrainingScope('Can you diagnose this skin rash on my back?')).toBe(true)
    })

    it('identifies out-of-scope political discussions', () => {
      expect(isOutOfTrainingScope('What do you think about the presidential election debate?')).toBe(true)
    })

    it('keeps fitness and nutrition questions in-scope', () => {
      expect(isOutOfTrainingScope('How many grams of protein should I eat post-workout?')).toBe(false)
      expect(isOutOfTrainingScope('What tempo should I use on my dumbbell bench press in Phase 2?')).toBe(false)
      expect(isOutOfTrainingScope('Can we swap barbell back squats for goblet squats?')).toBe(false)
    })

    it('gracefully redirects out-of-scope questions back to sports science', () => {
      const response = generateDeterministicCoachResponse(
        {
          question: 'What stocks should I invest in right now?',
          athleteName: 'Chris',
        },
        []
      )

      expect(response.answerMarkdown).toContain('my whole focus, expertise, and passion are dialed in 100% on your athletic training')
      expect(response.answerMarkdown).toContain('That is my entire scope of practice')
      expect(response.requiresCoachPing).toBe(false)
    })
  })
})
