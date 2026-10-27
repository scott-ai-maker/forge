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

    it('detects coach ping need when athlete asks to message real Coach Gordon', () => {
      const check = detectCoachPingNeed('Can you ping coach gordon to review my progress?')
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

  describe('Upgraded Local Master NASM Sports Science Engine (Non-Generic Fallback)', () => {
    it('synthesizes rich exercise technique breakdown with prime movers, tempo, and kinetic checkpoints', async () => {
      const response = await askCoachGordon({
        question: 'How do I do dumbbell incline press?',
        athleteName: 'Scott',
        nasmOptPhase: 2,
      })

      expect(response.answerMarkdown).toContain('Incline Dumbbell Bench Press')
      expect(response.answerMarkdown).toContain('Pectoralis Major (Clavicular Upper Head)')
      expect(response.answerMarkdown).toContain('2-0-2')
      expect(response.answerMarkdown).toContain('Master 5 Kinetic Chain Checkpoints')
      expect(response.answerMarkdown).toContain('30°–45° incline')
      expect(response.engineMode).toBe('nasm_rag_engine')
      expect(response.recommendedAction?.type).toBe('view_demo')
      expect(response.recommendedAction?.targetExerciseName).toBe('Incline Dumbbell Bench Press')
    })

    it('synthesizes dynamic exercise substitution with biomechanical rationale and 1-tap swap action', async () => {
      const response = await askCoachGordon({
        question: 'The lat pulldown is taken, what can I do instead?',
        athleteName: 'Scott',
        nasmOptPhase: 2,
        equipmentAccess: ['Dumbbells', 'Bands'],
      })

      expect(response.answerMarkdown).toContain('Chest-Supported Dumbbell Row')
      expect(response.answerMarkdown).toContain('Biomechanical Rationale')
      expect(response.recommendedAction?.type).toBe('swap_exercise')
      expect(response.recommendedAction?.targetExerciseName).toContain('Chest-Supported Dumbbell Row')
      expect(response.recommendedAction?.buttonText).toContain('Swap to Chest-Supported Dumbbell Row')
    })

    it('synthesizes personalized 30-40g protein pacing and glycogen replenishment', async () => {
      const response = await askCoachGordon({
        question: 'What should I eat after my workout?',
        athleteName: 'Scott',
        goal: 'hypertrophy',
        nasmOptPhase: 3,
      })

      expect(response.answerMarkdown).toContain('30 to 40 grams of high-quality protein')
      expect(response.answerMarkdown).toContain('leucine')
      expect(response.answerMarkdown).toContain('mTOR')
      expect(response.answerMarkdown).toContain('glycogen')
    })

    it('dynamically computes Tanaka cardiorespiratory target heart rate zones for athlete age', async () => {
      const response = await askCoachGordon({
        question: 'How should I pace my cardio on the treadmill today?',
        athleteName: 'Scott',
        clientAge: 40,
        nasmOptPhase: 2,
      })

      // Tanaka Max HR for 40: 208 - (0.7 * 40) = 180 BPM
      // Zone 1: 117 to 135 BPM; Zone 2: 137 to 153 BPM; Zone 3: 155 to 171 BPM
      expect(response.answerMarkdown).toContain('Tanaka Max HR: **180 BPM**')
      expect(response.answerMarkdown).toContain('Zone 1')
      expect(response.answerMarkdown).toContain('Zone 2')
      expect(response.answerMarkdown).toContain('Zone 3')
    })

    it('prescribes the 4-step NASM Corrective Exercise Continuum for joint tightness', async () => {
      const response = await askCoachGordon({
        question: 'My lower back and hips feel tight today',
        athleteName: 'Scott',
        nasmOptPhase: 1,
      })

      expect(response.answerMarkdown).toContain('NASM 4-Step Corrective Continuum')
      expect(response.answerMarkdown).toContain('Step 1: Inhibit')
      expect(response.answerMarkdown).toContain('Step 2: Lengthen')
      expect(response.answerMarkdown).toContain('Step 3: Activate')
      expect(response.answerMarkdown).toContain('Step 4: Integrate')
    })
  })
})
