import { describe, it, expect } from 'vitest'
import {
  askCoachGordon,
  retrieveRelevantRagCurricula,
  generateDeterministicCoachResponse,
  deriveProactiveTelemetryGreeting,
  deriveRecommendedAction,
  type AskCoachGordonRequest,
} from './ask-coach-gordon'
import {
  analyzeLiftForm,
  generateQuickBiomechanicalSpokenSummary,
} from './video-form-analysis'

describe('Ask Coach Gordon Interactive Engine', () => {
  it('retrieves relevant RAG curricula matching query concepts', () => {
    const nutritionDocs = retrieveRelevantRagCurricula('What should I eat for my post workout protein meal?')
    expect(nutritionDocs.length).toBeGreaterThan(0)
    expect(nutritionDocs.some(d => d.title.toLowerCase().includes('nutrition') || d.category.includes('Nutrition'))).toBe(true)

    const golfDocs = retrieveRelevantRagCurricula('How can I improve my golf swing rotational power?')
    expect(golfDocs.length).toBeGreaterThan(0)
    expect(golfDocs.some(d => d.title.toLowerCase().includes('golf') || d.keyConcepts.some((c: string) => c.toLowerCase().includes('rotational')))).toBe(true)

    const correctiveDocs = retrieveRelevantRagCurricula('My lower back and knees feel tight on squats')
    expect(correctiveDocs.length).toBeGreaterThan(0)
  })

  it('generates an authoritative deterministic response for exercise substitutions', () => {
    const req: AskCoachGordonRequest = {
      question: 'Can you swap Barbell Squats for me? I am traveling.',
      athleteName: 'Alexander',
      nasmOptPhase: 1,
      goal: 'fat_loss',
      currentExerciseName: 'Barbell Back Squat',
      equipmentAccess: ['Dumbbells', 'Resistance Bands'],
    }

    const response = generateDeterministicCoachResponse(req, [])
    expect(response.answerMarkdown).toContain('DB Goblet Squats')
    expect(response.answerMarkdown).toContain('earn the right to add load')
    expect(response.spokenAudioText).not.toContain('💡')
    expect(response.spokenAudioText).not.toContain('🎯')
    expect(response.spokenAudioText.length).toBeGreaterThan(50)
    expect(response.suggestedFollowUps.length).toBeGreaterThan(0)
  })

  it('generates an authoritative deterministic response for nutrition and protein queries', () => {
    const req: AskCoachGordonRequest = {
      question: 'What is my target post-workout meal?',
      athleteName: 'Jordan',
      nasmOptPhase: 3,
      goal: 'hypertrophy',
    }

    const response = generateDeterministicCoachResponse(req, [])
    expect(response.answerMarkdown).toContain('biological information and fuel')
    expect(response.answerMarkdown).toContain('30 to 40 grams of high-quality protein')
    expect(response.spokenAudioText).not.toContain('🥩')
  })

  it('generates an authoritative deterministic response for joint tightness and corrective protocols', () => {
    const req: AskCoachGordonRequest = {
      question: 'My lower back feels tight today on deadlifts',
      athleteName: 'Sarah',
      nasmOptPhase: 2,
      goal: 'strength',
      kineticCompensations: ['low_back_arches'],
    }

    const response = generateDeterministicCoachResponse(req, [])
    expect(response.answerMarkdown).toContain('We are training for the next 20 years')
    expect(response.answerMarkdown).toContain('corrective reset')
    expect(response.answerMarkdown).toContain('glute bridges')
  })

  it('triggers Tier 1 Emergency 911 directive for acute cardiac/emergency symptoms', async () => {
    const req: AskCoachGordonRequest = {
      question: 'I feel sudden severe chest pain, shortness of breath, and dizziness while doing squats',
      athleteName: 'Marcus',
      nasmOptPhase: 1,
      goal: 'fat_loss',
    }

    const response = await askCoachGordon(req)
    expect(response.isEmergency911).toBe(true)
    expect(response.requiresCoachPing).toBe(true)
    expect(response.answerMarkdown).toContain('EMERGENCY MEDICAL DIRECTIVE')
    expect(response.answerMarkdown).toContain('call 911')
    expect(response.spokenAudioText).toContain('call 911')
  })

  it('triggers Tier 2 Out-of-Scope Medical Referral for structural injuries like torn ACL, herniations, or surgeries', async () => {
    const req: AskCoachGordonRequest = {
      question: 'I have a torn ACL and torn meniscus in my right knee, what exercises can I do today?',
      athleteName: 'David',
      nasmOptPhase: 1,
      goal: 'hypertrophy',
    }

    const response = await askCoachGordon(req)
    expect(response.isEmergency911).toBe(false)
    expect(response.requiresCoachPing).toBe(true)
    expect(response.answerMarkdown).toContain('strictly outside the professional scope of personal training')
    expect(response.answerMarkdown).toContain('orthopedic physician or licensed physical therapist')
    expect(response.answerMarkdown).toContain('Coach Scott Gordon')
    expect(response.suggestedFollowUps).toContain('Message Coach Scott directly')
  })

  it('triggers Tier 2 Out-of-Scope Medical Referral for post-surgical spinal conditions in deterministic engine', () => {
    const req: AskCoachGordonRequest = {
      question: 'I had lumbar spinal fusion surgery and have a herniated disc. Can I deadlift?',
      athleteName: 'Marcus',
      nasmOptPhase: 1,
      goal: 'fat_loss',
    }

    const response = generateDeterministicCoachResponse(req, [])
    expect(response.requiresCoachPing).toBe(true)
    expect(response.answerMarkdown).toContain('strictly outside the professional scope of personal training')
    expect(response.answerMarkdown).toContain('Coach Scott Gordon')
  })

  describe('Real-World Gym Clinical Safety Scenarios', () => {
    it('handles exertional rhabdomyolysis and tea-colored urine as Tier 1 Emergency 911', async () => {
      const response = await askCoachGordon({
        question: 'My urine is dark brown and tea colored after extreme lifting and my quads are severely swollen',
      })
      expect(response.isEmergency911).toBe(true)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('EMERGENCY MEDICAL DIRECTIVE')
      expect(response.answerMarkdown).toContain('call 911')
    })

    it('handles Achilles tendon rupture and inability to bear weight as Tier 1 Emergency 911', async () => {
      const response = await askCoachGordon({
        question: 'My achilles snapped during sprint intervals and I cannot bear weight or walk',
      })
      expect(response.isEmergency911).toBe(true)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('EMERGENCY MEDICAL DIRECTIVE')
    })

    it('handles distal bicep rupture / Popeye deformity as Tier 1 Emergency 911', async () => {
      const response = await askCoachGordon({
        question: 'I felt a violent tearing in my arm on deadlifts and my bicep rolled up into a popeye muscle',
      })
      expect(response.isEmergency911).toBe(true)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('EMERGENCY MEDICAL DIRECTIVE')
    })

    it('handles vasovagal syncope / fainting as Tier 1 Emergency 911', async () => {
      const response = await askCoachGordon({
        question: 'My vision went black and I passed out on the leg press machine',
      })
      expect(response.isEmergency911).toBe(true)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('EMERGENCY MEDICAL DIRECTIVE')
    })

    it('handles dropped weight on neck trauma as Tier 1 Emergency 911', async () => {
      const response = await askCoachGordon({
        question: 'I dropped the barbell on my neck while bench pressing alone',
      })
      expect(response.isEmergency911).toBe(true)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('EMERGENCY MEDICAL DIRECTIVE')
    })

    it('handles rotator cuff tears and labrum pathology as Tier 2 Medical Scope Referral', async () => {
      const response = await askCoachGordon({
        question: 'I have a rotator cuff tear and torn labrum in my shoulder, what pressing exercises can I do?',
      })
      expect(response.isEmergency911).toBe(false)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('strictly outside the professional scope of personal training')
      expect(response.answerMarkdown).toContain('Coach Scott Gordon')
    })

    it('handles inguinal hernia groin bulges as Tier 2 Medical Scope Referral', async () => {
      const response = await askCoachGordon({
        question: 'I noticed a painful groin bulge popped out after heavy back squats',
      })
      expect(response.isEmergency911).toBe(false)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('strictly outside the professional scope of personal training')
    })

    it('handles joint replacement surgery rehab as Tier 2 Medical Scope Referral', async () => {
      const response = await askCoachGordon({
        question: 'I had total knee replacement surgery 8 weeks ago, can you program my leg day?',
      })
      expect(response.isEmergency911).toBe(false)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('strictly outside the professional scope of personal training')
    })

    it('handles bone stress fractures as Tier 2 Medical Scope Referral', async () => {
      const response = await askCoachGordon({
        question: 'My doctor said I have a tibial stress fracture from running',
      })
      expect(response.isEmergency911).toBe(false)
      expect(response.requiresCoachPing).toBe(true)
      expect(response.answerMarkdown).toContain('strictly outside the professional scope of personal training')
    })

    it('handles nominal tight hip flexors and DOMS in Tier 3 as warm 1-on-1 coaching', async () => {
      const response = generateDeterministicCoachResponse({
        question: 'My hip flexors feel tight from sitting all day at my desk',
        nasmOptPhase: 1,
        goal: 'general_fitness',
      }, [])
      expect(response.isEmergency911).toBe(false)
      expect(response.requiresCoachPing).toBe(false)
      expect(response.answerMarkdown).toContain('corrective reset')
      expect(response.answerMarkdown).toContain('foam roller')
    })

    it('handles sleep-deprived / red-eye flight athlete with auto-regulation guidance', () => {
      const response = generateDeterministicCoachResponse({
        question: 'I only slept 3.5 hours last night after a red-eye flight, should I push through or modify?',
        nasmOptPhase: 2,
        goal: 'fat_loss',
      }, [])
      expect(response.isEmergency911).toBe(false)
      expect(response.requiresCoachPing).toBe(false)
      expect(response.answerMarkdown).toContain('train smarter, not harder')
      expect(response.answerMarkdown).toContain('15 to 20% lighter')
    })

    it('handles busy executive 20-minute time-crunch workout query', () => {
      const response = generateDeterministicCoachResponse({
        question: 'I am short on time and only have 20 min before my flight, how do I condense my lift?',
        nasmOptPhase: 1,
        goal: 'general_fitness',
      }, [])
      expect(response.isEmergency911).toBe(false)
      expect(response.answerMarkdown).toContain('high-density compound supersets')
      expect(response.answerMarkdown).toContain('45 to 60 seconds rest')
    })

    it('handles creatine and supplement timing queries with evidence-based guidance', () => {
      const response = generateDeterministicCoachResponse({
        question: 'How much creatine should I take daily and do I need to do a loading phase?',
        nasmOptPhase: 3,
        goal: 'hypertrophy',
      }, [])
      expect(response.isEmergency911).toBe(false)
      expect(response.answerMarkdown).toContain('3 to 5 grams daily')
      expect(response.answerMarkdown).toContain('do not need a high-dose loading phase')
    })

    it('handles tech neck and forward head posture corrective strategy', () => {
      const response = generateDeterministicCoachResponse({
        question: 'I have bad posture and tech neck from working at a desk all day. How do I fix it?',
        nasmOptPhase: 1,
        goal: 'general_fitness',
      }, [])
      expect(response.isEmergency911).toBe(false)
      expect(response.answerMarkdown).toContain('Upper Crossed Syndrome')
      expect(response.answerMarkdown).toContain('Prone Cobras')
      expect(response.answerMarkdown).toContain('Chin Tucks')
    })

    it('handles client dinner and alcohol navigation without guilt', () => {
      const response = generateDeterministicCoachResponse({
        question: 'I have a big business steakhouse dinner with wine tonight, how do I handle my diet?',
        nasmOptPhase: 2,
        goal: 'fat_loss',
      }, [])
      expect(response.isEmergency911).toBe(false)
      expect(response.answerMarkdown).toContain('Bank Your Protein')
      expect(response.answerMarkdown).toContain('1-to-1 rule')
      expect(response.answerMarkdown).toContain('One meal never derails')
    })

    it('handles painless joint clicking and crepitus reassurance', () => {
      const response = generateDeterministicCoachResponse({
        question: 'My knees click when I squat but there is zero pain. Is that okay?',
        nasmOptPhase: 1,
        goal: 'general_fitness',
      }, [])
      expect(response.isEmergency911).toBe(false)
      expect(response.requiresCoachPing).toBe(false)
      expect(response.answerMarkdown).toContain('crepitus')
      expect(response.answerMarkdown).toContain('zero pain')
    })
  })

  describe('Proactive Telemetry-Aware Greetings & In-Gym Action Cards', () => {
    it('generates an auto-regulation greeting when client sleep is under 5.5 hours', () => {
      const greeting = deriveProactiveTelemetryGreeting({
        athleteName: 'Alexander',
        recentSleepHours: 4.2,
        recentReadinessScore: 65,
        nasmOptPhase: 2,
        goal: 'fat_loss',
      })
      expect(greeting.text).toContain('sleep was only **4.2 hours**')
      expect(greeting.text).toContain('auto-regulate working loads down 15%')
      expect(greeting.recommendedAction?.type).toBe('auto_regulate_load')
    })

    it('derives actionable recommendations for rest timers and exercise swaps', () => {
      const swapAction = deriveRecommendedAction('can you swap this exercise')
      expect(swapAction?.type).toBe('swap_exercise')

      const restAction = deriveRecommendedAction('start rest timer')
      expect(restAction?.type).toBe('start_timer')
    })
  })

  describe('5-Second Video Form Check & Audio Critique', () => {
    it('analyzes lift mechanics and generates spoken audio prompt for earbuds', () => {
      const analysis = analyzeLiftForm({
        liftType: 'barbell_back_squat',
        loadLbs: 225,
        repsCount: 5,
        observedDeviations: ['knee_valgus'],
      })

      const spokenSummary = generateQuickBiomechanicalSpokenSummary(analysis)
      expect(spokenSummary).toContain('Coach Gordon here on your Barbell Back Squat')
      expect(spokenSummary).toContain('Lock into your tempo')
    })
  })

  it('throws an error if question is empty', async () => {
    await expect(askCoachGordon({ question: '' })).rejects.toThrow('Question cannot be empty')
  })
})
