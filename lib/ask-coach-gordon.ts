/**
 * Forge Athletic — Master Coach Gordon Interactive AI Engine
 * 
 * Ingests athlete questions with real-time biometric and workout context,
 * performs semantic RAG retrieval across the 16 sports science curriculums,
 * and synthesizes authoritative clinical coaching responses with audio narration.
 */

import { queryNasmRagLibrary, type RagDocumentMetadata } from './nasm-rag-knowledge-base'
import { sanitizeCoachSpeechText } from './coach-voice-synthesizer'
import { getSmartSubstitutions } from './nasm-exercise-substitution'
import { resolveExerciseVideoEmbed } from './nasm-exercise-video-catalog'
import { CONTRAINDICATION_RULES, checkExerciseContraindications } from './liability-shield'
import {
  type AskCoachGordonRequest,
  type AskCoachGordonResponse,
  type CoachActionRecommendation,
  evaluateClinicalUrgencyTriage,
  isOutOfTrainingScope,
} from './ask-coach-gordon-types'

export * from './ask-coach-gordon-types'

const MASTER_COACH_SYSTEM_INSTRUCTION = `You are Coach Gordon, Head Coach at Forge Athletic, a Master NASM-certified personal trainer with over 20 years of real-world coaching experience.

Core Coaching Identity & Conversational Dialogue:
- You are having a genuine 1-on-1 spoken conversation with your client—talking to them directly on the gym floor, between sets, or right through their AirPods.
- Talk like an authentic, attentive, charismatic personal trainer: warm, encouraging, grounded, and collaborative. Never sound like a sterile textbook or bureaucratic checklist.
- Speak in the first person ("I've got you", "Here's what we're going to do", "Let's make this adjustment right now", "I'm right here in your corner").
- Validate how they are feeling first (acknowledge their fatigue, tight muscles, busy gym, travel schedule, or excitement).
- Give solid, practical, evidence-based sports science advice in crisp plain English with simple biomechanical rationale ("We do this because...").
- Avoid rigid bullet-point checklists or sterile manuals. Use natural, flowing conversational prose (2 to 3 concise spoken paragraphs).
- Bold key actionable cues (**2-0-2-0 tempo**, **Phase 2**, **35g protein**, **DB Goblet Squats**) so they are instantly scannable between sets.
- ALWAYS conclude your response with an open, collaborative coaching check-in question to keep the dialogue flowing (e.g. asking how a joint feels right now, checking what equipment they see open nearby, or checking their readiness for the next set).

Strict Scope of Training & Entire RAG Boundary (Non-Negotiable):
- Your professional scope of practice is strictly bounded by your athletic sports science training curriculum (your entire RAG library):
  1. Resistance training, movement mechanics, exercise technique, tempo, kinetic chain checkpoints, progressions, and equipment substitutions.
  2. The NASM Optimum Performance Training (OPT™) Model across all 5 phases (Stabilization, Strength Endurance, Muscular Development, Maximal Strength, Power).
  3. Cardiorespiratory and energy system conditioning (Tanaka HR zones, Stage 1–3 intervals, work capacity).
  4. Athletic nutrition, protein pacing (30–40g), pre/post workout fueling, hydration, and evidence-based supplements (creatine monohydrate 3–5g).
  5. Corrective exercise continuum (inhibit, lengthen, activate, integrate) for non-acute postural tightness and kinetic compensations.
  6. Recovery, sleep hygiene for CNS restoration, and autonomic load regulation.
- NEVER LEAVE YOUR SCOPE OF TRAINING.
- If a client asks about anything OUTSIDE your athletic training and sports science scope (e.g. non-fitness medical diagnosis, drug prescriptions, cryptocurrency, financial advice, political debates, legal matters, computer programming, pop culture, or unrelated life trivia):
  - Do NOT provide off-topic answers or speculate.
  - Politely, warmly, and with good humor, clarify that as their dedicated fitness coach, your entire focus is 100% locked on their physical training, movement, and athletic performance.
  - Gracefully redirect the conversation back to their workout, daily activity, or athletic goals.
  - Example: "Hey, I'll be straight with you—as your coach, my whole focus and expertise is 100% dialed in on your athletic training, movement mechanics, and physical recovery. That is my entire scope. I leave [topic] to the folks in that field so I can give you my absolute best on the gym floor. Let's redirect that energy to your workout—how are you feeling for today's session?"
- Zero Medical Diagnosing: You are a personal trainer, not a physician or physical therapist. You never diagnose medical pathologies or prescribe pharmaceuticals. If acute sharp pain or red flags arise, warmly advise consulting a medical doctor or physical therapist while providing safe movement regressions.

How you coach:
1. Deep Empathy & Compassionate Care (High EQ):
   - You care about the person behind the training goal. People balance work, caregiving, school, stress, sleep changes, health needs, and everyday life.
   - You listen actively, validate their feelings, and meet them where they are with warmth, respect, and zero drill-sergeant shaming.
   - Signature Philosophy: "A modified workout beats a skipped workout 100% of the time."
2. Flexible Training Support:
   - When someone reports high fatigue, poor sleep, pain, or travel, you NEVER lecture them. Adjust the suggested workout to fit their energy and available time, and offer rest or gentle movement when appropriate.
3. Client Safety First & Strict Scope of Practice (Non-Negotiable):
   - Orthopedic longevity is non-negotiable: "Earn the right to add load. Own the movement first." & "We are training for the next 20 years, not just the next 20 minutes."
4. Anti-Dogma Nutrition Philosophy (Food as Fuel, Not Morality):
   - You treat food as biological information and recovery fuel, never as a moral reward or punishment. Focus on 30–40g protein pacing, strategic hydration, and guilt-free social dinners.
5. Clinical Safety & Scope Hand-Off Protocol:
   - Emergency symptoms: Tell the person to stop exercising immediately and contact emergency services.
   - For serious or persistent pain, injuries, or surgery recovery, encourage them to speak with a healthcare professional before continuing.

Training knowledge and credentials:
- Master Certified Personal Trainer (NASM-Master CPT)
- Performance Enhancement Specialist (NASM-PES) — Olympic lifting, SAQ, Rate of Force Development (RFD)
- Corrective Exercise Specialist (NASM-CES) — 4-Step CEx Continuum (Inhibit, Lengthen, Activate, Integrate)
- Certified Nutrition Coach (NASM-CNC) — Energy balance, macronutrient periodization, chrono-nutrition
- Physique & Bodybuilding Coach (NASM-PBC) — Hypertrophy biomechanics, volume landmarks (MEV/MAV/MRV)
- Behavior Change Specialist (NASM-BCS) — Stages of Change, cognitive reframing, habit architecture
- Weight Loss Specialist (NASM-WLS) — Metabolic preservation, NEAT optimization, lean mass defense
- Cardiorespiratory Conditioning Specialist (NASM-CATM) — Tanaka HR zones, Stage 1–3 intervals, EPOC
- Combat Sports & MMA Conditioning Specialist (NASM-MMACS) — Energy systems, rotational power, neck armor
- Golf Fitness Specialist (NASM-GFS) — Rotational biomechanics, X-Factor stretch, ground reaction forces
- Virtual Coaching Specialist (NASM-VCS) — Remote camera framing, studio lighting, biometric wearable telemetry, synchronous & asynchronous coaching protocols
- Clinical Pharmacology & Weight Loss Defense Specialist — GLP-1 muscle defense, drug-nutrient chrono-separation
- Precision Meal Prep & Bodybuilding Nutrition Specialist — Protein pacing, refeeds, reverse dieting
- Workout planning for home, work, travel, and different equipment options`

/**
 * Searches the RAG library for the most relevant documents matching the question.
 */
export function retrieveRelevantRagCurricula(question: string, goal?: string, optPhase?: number): RagDocumentMetadata[] {
  const qLower = question.toLowerCase()

  if (isOutOfTrainingScope(question)) {
    return queryNasmRagLibrary({ keyword: 'scope of practice' })
  }

  // Match specific keywords across all sports science domains
  const keywords: string[] = []
  if (qLower.includes('swap') || qLower.includes('replace') || qLower.includes('substitute') || qLower.includes('alternative')) keywords.push('substitution', 'exercise')
  if (qLower.includes('eat') || qLower.includes('meal') || qLower.includes('food') || qLower.includes('protein') || qLower.includes('macro') || qLower.includes('diet') || qLower.includes('nutrition')) keywords.push('nutrition', 'protein', 'meal')
  if (qLower.includes('back') || qLower.includes('knee') || qLower.includes('shoulder') || qLower.includes('hip') || qLower.includes('pain') || qLower.includes('tight') || qLower.includes('sore') || qLower.includes('posture')) keywords.push('corrective', 'compensation', 'inhibit', 'stretch')
  if (qLower.includes('cardio') || qLower.includes('treadmill') || qLower.includes('bike') || qLower.includes('interval') || qLower.includes('zone') || qLower.includes('bpm') || qLower.includes('rpe')) keywords.push('cardiorespiratory', 'stage', 'interval')
  if (qLower.includes('golf') || qLower.includes('swing') || qLower.includes('rotation') || qLower.includes('clubhead') || qLower.includes('drive')) keywords.push('golf', 'rotational')
  if (qLower.includes('mma') || qLower.includes('combat') || qLower.includes('boxing') || qLower.includes('strike')) keywords.push('combat', 'mma')
  if (qLower.includes('hypertrophy') || qLower.includes('muscle') || qLower.includes('pump') || qLower.includes('bodybuilding') || qLower.includes('volume') || qLower.includes('mass')) keywords.push('hypertrophy', 'muscular development', 'volume')
  if (qLower.includes('glp-1') || qLower.includes('glp1') || qLower.includes('semaglutide') || qLower.includes('tirzepatide') || qLower.includes('ozempic') || qLower.includes('medication')) keywords.push('pharmacology', 'glp-1', 'lean mass')
  if (qLower.includes('supplement') || qLower.includes('creatine') || qLower.includes('caffeine') || qLower.includes('whey') || qLower.includes('magnesium')) keywords.push('supplementation', 'chrono-nutrition')
  if (qLower.includes('virtual') || qLower.includes('remote') || qLower.includes('telehealth') || qLower.includes('camera') || qLower.includes('lighting') || qLower.includes('angle') || qLower.includes('consultation') || qLower.includes('wearable') || qLower.includes('onboarding')) keywords.push('virtual', 'telehealth', 'remote', 'wearable', 'onboarding')
  if (qLower.includes('squat') || qLower.includes('lunge') || qLower.includes('leg') || qLower.includes('quad')) keywords.push('squat', 'stabilization', 'force')
  if (qLower.includes('deadlift') || qLower.includes('hinge') || qLower.includes('rdl') || qLower.includes('hamstring') || qLower.includes('glute')) keywords.push('hinge', 'posterior chain', 'force')
  if (qLower.includes('bench') || qLower.includes('press') || qLower.includes('chest') || qLower.includes('push')) keywords.push('push', 'horizontal push', 'force')
  if (qLower.includes('row') || qLower.includes('pull') || qLower.includes('lat')) keywords.push('pull', 'horizontal row', 'force')
  if (qLower.includes('core') || qLower.includes('abs') || qLower.includes('brace') || qLower.includes('stability')) keywords.push('core', 'balance', 'stabilization')
  if (qLower.includes('warmup') || qLower.includes('smr') || qLower.includes('foam roll') || qLower.includes('activation')) keywords.push('warmup', 'inhibit', 'activate')
  if (qLower.includes('busy') || qLower.includes('taken') || qLower.includes('crowded') || qLower.includes('machine')) keywords.push('substitution', 'facility', 'equipment')
  if (qLower.includes('fatigue') || qLower.includes('tired') || qLower.includes('recovery') || qLower.includes('sleep') || qLower.includes('cns') || qLower.includes('deload')) keywords.push('recovery', 'periodization', 'bioenergetics')

  let results: RagDocumentMetadata[] = []

  for (const kw of keywords) {
    const matched = queryNasmRagLibrary({ keyword: kw })
    results.push(...matched)
  }

  if (results.length === 0) {
    results = queryNasmRagLibrary({
      keyword: question.split(' ').filter(w => w.length > 3)[0] || 'periodization',
      nasmOptPhase: optPhase,
    })
  }

  // Deduplicate and cap at top 5
  const seen = new Set<string>()
  return results.filter(doc => {
    if (seen.has(doc.id)) return false
    seen.add(doc.id)
    return true
  }).slice(0, 5)
}

/**
 * Executes a live interactive consultation query with Coach Gordon.
 */
export async function askCoachGordon(request: AskCoachGordonRequest): Promise<AskCoachGordonResponse> {
  const {
    question,
    athleteName = 'Athlete',
    clientAge = 35,
    clientSex = 'male',
    goal = 'general_fitness',
    nasmOptPhase = 1,
    currentWorkoutFocus,
    currentExerciseName,
    equipmentAccess = [],
    cardioEquipmentAccess = [],
    kineticCompensations = [],
    contraindicationTags = [],
    recentReadinessScore = 80,
    recentSleepHours,
    recentRpe,
    lastLoggedSet,
    todayWorkoutExercises = [],
    attachedImage,
    activeConversationHistory = [],
  } = request

  if (!question || !question.trim()) {
    throw new Error('Question cannot be empty.')
  }

  // 1. Run Clinical Urgency & Scope of Practice Triage FIRST
  const triage = evaluateClinicalUrgencyTriage(question)
  if (triage.tier === 'EMERGENCY_911' || triage.tier === 'SERIOUS_MEDICAL_REFERRAL') {
    return {
      answerMarkdown: triage.overrideMarkdown!,
      spokenAudioText: triage.overrideAudioText!,
      relevantCurriculums: ['Scope of Practice & Clinical Liability Protection', 'Orthopedic Referral Protocols'],
      suggestedFollowUps: triage.isEmergency911
        ? ['Call 911 immediately', 'Locate Nearest Hospital', 'Notify Emergency Contacts']
        : ['What should I ask my doctor/PT?', 'Message Coach Gordon directly', 'How will my program be modified?'],
      requiresCoachPing: true,
      coachPingReason: triage.pingReason,
      isEmergency911: triage.isEmergency911,
    }
  }

  const relevantDocs = retrieveRelevantRagCurricula(question, goal, nasmOptPhase)
  const curriculumTitles = relevantDocs.map(d => d.title)

  const ragContext = relevantDocs.length > 0
    ? `\nRelevant Evidence-Based RAG Sources:\n${relevantDocs.map(d => `- [${d.category}] ${d.title}: ${d.summary} (Key concepts: ${d.keyConcepts.join(', ')})`).join('\n')}`
    : ''

  let contraindicationsClause = ''
  if (contraindicationTags && contraindicationTags.length > 0) {
    const matchedRules = contraindicationTags
      .map(tag => CONTRAINDICATION_RULES[tag])
      .filter(Boolean)

    if (matchedRules.length > 0) {
      const summaries = matchedRules.map(r => {
        const subs = Object.entries(r.prescribedSubstitutions)
          .map(([orig, s]) => `${orig} -> substitute with ${s.replacement} (${s.rationale})`)
          .join('; ')
        return `- [${r.label}] Blacklisted Movements: ${r.blacklistedExercises.join(', ')}. Prescribed Substitutions: ${subs}. Guideline: ${r.generalGuideline}`
      }).join('\n')

      contraindicationsClause = `\n\nCRITICAL ORTHOPEDIC CONTRAINDICATIONS & BLACKLISTED MOVEMENTS (NON-NEGOTIABLE):
The athlete has documented medical/orthopedic contraindications:
${summaries}
STRICT SAFETY MANDATE:
- You must NEVER prescribe, cue, or endorse any blacklisted exercise under any circumstance.
- If the athlete asks about performing a blacklisted exercise or an exercise that risks aggravating these conditions, immediately explain the joint risk, warn against performing it, and provide the exact prescribed substitution with biomechanical cues.`
    }
  }

  const lastSetClause = lastLoggedSet
    ? `\n- Last Logged Set: ${lastLoggedSet.exerciseName || currentExerciseName || 'Exercise'}: ${lastLoggedSet.weightLbs ? `${lastLoggedSet.weightLbs} lbs x ` : ''}${lastLoggedSet.reps ? `${lastLoggedSet.reps} reps` : ''}${lastLoggedSet.rpe !== undefined ? ` @ RPE ${lastLoggedSet.rpe}` : ''}`
    : ''
  const todayExercisesClause = todayWorkoutExercises.length > 0
    ? `\n- Scheduled Exercises Today: ${todayWorkoutExercises.join(', ')}`
    : ''
  const sleepClause = recentSleepHours !== undefined ? `\n- Recent Sleep: ${recentSleepHours} hours` : ''
  const rpeClause = recentRpe !== undefined ? `\n- Recent Intensity: RPE ${recentRpe}` : ''

  const athleteContext = `\nAthlete Live Telemetry & Profile:
- Name: ${athleteName}, Age: ${clientAge}, Sex: ${clientSex}
- Primary Goal: ${goal}
- Current OPT™ Phase: Phase ${nasmOptPhase}
- Active Session Focus: ${currentWorkoutFocus || 'Scheduled Daily Workout'}
- Current Movement: ${currentExerciseName || 'Active Training Block'}${todayExercisesClause}${lastSetClause}${sleepClause}${rpeClause}
- Available Resistance Equipment: ${equipmentAccess.length > 0 ? equipmentAccess.join(', ') : 'Full Equipment Suite'}
- Available Cardio Equipment: ${cardioEquipmentAccess.length > 0 ? cardioEquipmentAccess.join(', ') : 'Treadmill, Bike, Outdoor Walking/Running'}
- Known Kinetic Compensations: ${kineticCompensations.length > 0 ? kineticCompensations.join(', ') : 'None Detected (Optimal Alignment)'}
- Documented Contraindications: ${contraindicationTags.length > 0 ? contraindicationTags.join(', ') : 'None On File'}
- CNS Readiness Score: ${recentReadinessScore}% (${recentReadinessScore >= 75 ? 'Green Light (High Output)' : 'Moderate / Manage Volume'})`

  const isOutOfScope = isOutOfTrainingScope(question)
  const scopeBoundaryDirective = isOutOfScope
    ? `\n\nCRITICAL PROFESSIONAL SCOPE BOUNDARY:
This inquiry is OUTSIDE your scope of athletic training and sports science. In accordance with your scope of practice, warmly, politely, and conversationally state that your entire focus, expertise, and passion are 100% dedicated to their athletic training, physical performance, and recovery. Explain that this is your entire professional scope (your RAG knowledge base). Do not speculate or answer off-topic questions. Gracefully redirect the conversation back to their physical workout, energy, or athletic goals with a supportive check-in question.`
    : ''

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY

  if (apiKey) {
    const modelsToTry = [
      ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-pro-preview',
      'gemini-pro-latest',
    ]

    // Construct multi-turn message payload with optional multimodal image attachment
    const contents: Array<{
      role: 'user' | 'model'
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
    }> = []

    if (activeConversationHistory.length > 0) {
      for (const h of activeConversationHistory.slice(-8)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        })
      }
    }

    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: `${athleteContext}${ragContext}${contraindicationsClause}${scopeBoundaryDirective}\n\nAthlete's Question:\n"${question.trim()}"\n\nRespond conversationally in your warm 1-on-1 spoken voice as Coach Gordon. Deliver solid, practical advice grounded strictly in your athletic training scope (your RAG library). Never wander outside your sports science scope. Always conclude with an open, collaborative coaching check-in question to keep our dialogue going, and ensure every sentence and thought is fully completed without trailing off.` },
    ]

    if (attachedImage?.data) {
      currentParts.push({
        inlineData: {
          mimeType: attachedImage.mimeType || 'image/jpeg',
          data: attachedImage.data,
        },
      })
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    })

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: MASTER_COACH_SYSTEM_INSTRUCTION }],
            },
            contents,
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 3000,
            },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawText) {
            const spokenAudioText = sanitizeCoachSpeechText(rawText)
            const pingCheck = detectCoachPingNeed(question, rawText)
            const recommendedAction = deriveRecommendedAction(question.toLowerCase(), currentExerciseName, rawText, nasmOptPhase)
            return {
              answerMarkdown: rawText,
              spokenAudioText,
              relevantCurriculums: curriculumTitles,
              recommendedAction,
              suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
              requiresCoachPing: pingCheck.requiresCoachPing,
              coachPingReason: pingCheck.reason,
            }
          }
        } else {
          const errBody = await res.text().catch(() => '')
          console.warn(`[AskCoachGordon] Model ${model} returned HTTP ${res.status}:`, errBody.slice(0, 200))
        }
      } catch (err) {
        console.warn(`[AskCoachGordon] Model ${model} failed, attempting next model...`, err)
      }
    }
  }

  // Fallback to deterministic sports-science engine
  return generateDeterministicCoachResponse(request, relevantDocs)
}

/**
 * Detects if an inquiry involves complex medical, surgical, extreme pain, or direct human coach review.
 */
export function detectCoachPingNeed(question: string, answerText?: string): { requiresCoachPing: boolean; reason?: string } {
  const qLower = question.toLowerCase()
  const aLower = (answerText || '').toLowerCase()

  const hardKeywords = [
    'surgery', 'surgical', 'post-op', 'operation',
    'herniated', 'bulging disc', 'sciatica', 'spinal fusion',
    'torn acl', 'torn meniscus', 'torn rotator', 'tear', 'labrum',
    'fracture', 'broken',
    'shooting pain', 'severe pain', 'numbness', 'tingling', 'pinched nerve',
    'mri', 'x-ray', 'physician told', 'doctor told',
    'talk to scott', 'ping coach', 'reach out to scott', 'message scott', 'real scott', 'real coach',
    'billing', 'refund', 'contract', 'cancel membership',
  ]

  for (const kw of hardKeywords) {
    if (qLower.includes(kw)) {
      return {
        requiresCoachPing: true,
        reason: `Complex situation detected (${kw}) requiring direct review by Coach Gordon.`,
      }
    }
  }

  if (aLower.includes('pinged coach') || aLower.includes('pinged gordon') || aLower.includes('pinged scott') || aLower.includes('flagged this') || aLower.includes('real coach')) {
    return {
      requiresCoachPing: true,
      reason: 'Flagged for direct review by Coach Gordon.',
    }
  }

  return { requiresCoachPing: false }
}

/**
 * Generates an authoritative sports-science response when external APIs are unavailable.
 */
export function generateDeterministicCoachResponse(
  request: AskCoachGordonRequest,
  docs: RagDocumentMetadata[]
): AskCoachGordonResponse {
  const { question, goal = 'fat_loss', nasmOptPhase = 1, currentExerciseName, contraindicationTags = [] } = request
  const qLower = question.toLowerCase()

  // 1. Clinical Urgency & Scope of Practice Triage FIRST
  const triage = evaluateClinicalUrgencyTriage(question)
  if (triage.tier === 'EMERGENCY_911' || triage.tier === 'SERIOUS_MEDICAL_REFERRAL') {
    return {
      answerMarkdown: triage.overrideMarkdown!,
      spokenAudioText: triage.overrideAudioText!,
      relevantCurriculums: ['Scope of Practice & Clinical Liability Protection', 'Orthopedic Referral Protocols'],
      suggestedFollowUps: triage.isEmergency911
        ? ['Call 911 immediately', 'Locate Nearest Hospital', 'Notify Emergency Contacts']
        : ['What should I ask my doctor/PT?', 'Message Coach Gordon directly', 'How will my program be modified?'],
      requiresCoachPing: true,
      coachPingReason: triage.pingReason,
      isEmergency911: triage.isEmergency911,
    }
  }

  let answerMarkdown = ''
  let spokenAudioText = ''
  const athleteGreeting = request.athleteName && request.athleteName !== 'Athlete' ? request.athleteName : 'team'

  // 2. Biomechanical & Orthopedic Contraindication Interception
  if (contraindicationTags.length > 0) {
    let contraCheck = checkExerciseContraindications(question, contraindicationTags)
    if (!contraCheck.isContraindicated && currentExerciseName) {
      contraCheck = checkExerciseContraindications(currentExerciseName, contraindicationTags)
    }

    if (contraCheck.isContraindicated) {
      const cleanReplacement = contraCheck.replacement?.split('(')[0].trim() || 'Safe Alternative'
      answerMarkdown = `Hey ${athleteGreeting}, because you have a documented history or joint sensitivity with **${contraCheck.ruleLabel || 'this movement'}**, we need to protect your joint longevity and steer completely clear of that exercise right now.

Our golden rule is always: **earn the right to add load by owning pain-free movement first**. We are substituting immediately with **${contraCheck.replacement}**.

**Biomechanical Rationale:** ${contraCheck.rationale || 'This eliminates destructive joint shear forces while stimulating target muscle motor units safely.'}

**Coaching Cue:** ${contraCheck.coachingCue || 'Control your tempo, brace your core, and maintain strict alignment.'}

How does that feel on your body, and are you ready to lock into this safe movement alternative?`
      spokenAudioText = sanitizeCoachSpeechText(answerMarkdown)

      return {
        answerMarkdown,
        spokenAudioText,
        relevantCurriculums: ['Corrective Exercise & Joint Longevity', 'Biomechanical Exercise Substitutions'],
        recommendedAction: {
          type: 'swap_exercise',
          buttonText: `Swap to ${cleanReplacement}`,
          targetExerciseName: cleanReplacement,
          currentExerciseName: currentExerciseName || question,
          reasoning: contraCheck.rationale,
        },
        suggestedFollowUps: [
          `How to perform ${cleanReplacement}`,
          'What equipment do I need for this swap?',
          'Message Coach Gordon directly',
        ],
        requiresCoachPing: false,
        isEmergency911: false,
      }
    }
  }

  // Out-of-Scope Detection (Strict Training Scope & RAG Boundary)
  if (isOutOfTrainingScope(question)) {
    answerMarkdown = `Hey ${athleteGreeting}, I'll be completely straight with you—as your coach, my whole focus, expertise, and passion are dialed in 100% on your athletic training, movement mechanics, and physical recovery. That is my entire scope of practice, grounded directly in our sports science curriculum.

I leave outside subjects to the specialists in those fields so I can be the absolute best coach in your corner for your body, your performance, and your long-term health.

Let's redirect that energy right back to your training and your goals. How is your energy feeling right now, and what are we tackling in your workout today?`
    spokenAudioText = sanitizeCoachSpeechText(answerMarkdown)

    return {
      answerMarkdown,
      spokenAudioText,
      relevantCurriculums: ['Scope of Practice & Professional Standards', 'NASM Code of Conduct'],
      suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
      requiresCoachPing: false,
      isEmergency911: false,
    }
  }

  // Friendly Conversational Greetings & Rapport Check-ins
  if (qLower.includes('hello') || qLower.includes('good morning') || qLower.includes('good afternoon') || qLower.includes('how are you') || qLower.includes('hey coach') || qLower.includes('ready to crush')) {
    answerMarkdown = `Hey ${athleteGreeting}! Coach Gordon right here with you, and I love that energy. I'm locked in and ready to help you execute today.

Whether you need to swap an exercise, adjust loads based on how your joints feel, check tempo cues, or dial in your post-workout fueling, I've got your back.

How is your body feeling today, and what are we focusing on for today's session?`
    spokenAudioText = sanitizeCoachSpeechText(answerMarkdown)

    return {
      answerMarkdown,
      spokenAudioText,
      relevantCurriculums: ['Behavior Change & Client Rapport', 'Program Design & Periodization'],
      suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
      requiresCoachPing: false,
      isEmergency911: false,
    }
  }

  // Questions regarding Coach Gordon capabilities, scope, and what can be asked
  const isCapabilityInquiry =
    qLower.includes('what type of question') ||
    qLower.includes('what kind of question') ||
    qLower.includes('what can i ask') ||
    qLower.includes('what can you do') ||
    qLower.includes('what do you do') ||
    qLower.includes('how can you help') ||
    qLower.includes('what are your capabilities') ||
    qLower.includes('what do you help with') ||
    qLower.includes('what should i ask') ||
    qLower.includes('what can you help') ||
    qLower.includes('help me with') ||
    qLower.includes('what questions') ||
    qLower.trim() === 'help' ||
    qLower.trim() === 'capabilities' ||
    qLower.trim() === 'scope'

  if (isCapabilityInquiry) {
    answerMarkdown = `I love that question, ${athleteGreeting}! Think of me as your dedicated personal trainer standing right beside you on the gym floor or talking right through your AirPods between sets. My entire focus and expertise are dialed 100% into evidence-based athletic training, biomechanics, exercise nutrition, and workout recovery.

Here is what you can ask me anytime during your training:
1. **Real-Time Exercise Swaps**: Gym busy or a movement feels awkward on your joints? Ask me for an instant dumbbell, cable, or bodyweight alternative tailored to your current phase.
2. **Form Checks & Biomechanical Cues**: Wondering about bar path, knee tracking, squat depth, elbow flare, or tempo control? I'll give you crisp, actionable cues in plain English.
3. **Joint Health & Corrective Resets**: Feeling tightness in your hips, lower back, or shoulders? We'll run a quick 3-minute mobility and activation reset so you can train pain-free.
4. **Targeted Fueling & Recovery**: Ask about 30–40g protein pacing, pre-workout energy, post-workout recovery meals, hydration, and sleep hygiene.
5. **Periodization & Load Progression**: Know when you've earned the right to add load and how to structure your sets, reps, and RPE.

What are we working on in the gym today—do you need a quick form check, an exercise substitution, or a look at your post-workout fueling?`
    spokenAudioText = sanitizeCoachSpeechText(answerMarkdown)

    return {
      answerMarkdown,
      spokenAudioText,
      relevantCurriculums: ['Scope of Practice & Athletic Training Curriculum', 'NASM OPT™ Integrated Training Model'],
      suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
      requiresCoachPing: false,
      isEmergency911: false,
    }
  }

  if (qLower.includes('swap') || qLower.includes('replace') || qLower.includes('substitute')) {
    answerMarkdown = `Hey, no problem at all! When equipment is limited or you need to switch things up, we don't let it slow your momentum down. If you can't do **${currentExerciseName || 'your current exercise'}** today, grab a set of dumbbells or even a resistance band and let's substitute with **DB Goblet Squats with a 2-second pause at the bottom**.

By adding that 2-second pause in the hole, you'll maximize muscle recruitment and get a tremendous training stimulus without needing a heavy barbell. Focus on keeping your chest proud, setting your core brace, and controlling your descent with a steady **${nasmOptPhase === 1 ? '4-second eccentric tempo' : '2-second tempo'}**.

Remember our standard: **earn the right to add load by owning the movement first**. Swap it in your workout tracker right now, lock into your tempo, and let's get after it! Do you have a set of dumbbells nearby, or would you rather use a cable station today?`
  } else if (qLower.includes('sleep') || qLower.includes('tired') || qLower.includes('red eye') || qLower.includes('red-eye') || qLower.includes('jet lag') || qLower.includes('exhausted')) {
    answerMarkdown = `I understand—work, family, travel, and changing sleep schedules can make training harder to plan.

On days when sleep was compromised, we **train smarter, not harder**. Do not try to hit personal records today. Instead, auto-regulate:
1. Keep your working weights **15 to 20% lighter** than usual.
2. Focus strictly on Phase 1 stabilization, tempo control, and clean movement patterns.
3. Drink 20 ounces of water with electrolytes right now to rehydrate your central nervous system.

You still get the win by showing up, protecting your joints, and stimulating blood flow without crushing your adrenal system. We are training for the next 20 years, not just the next 20 minutes. Own your tempo and let's have a crisp, safe session! How is your energy feeling right now on the gym floor—are you ready to start with a light warm-up?`
  } else if (qLower.includes('short on time') || qLower.includes('20 min') || qLower.includes('25 min') || qLower.includes('30 min') || qLower.includes('hurry') || qLower.includes('rush') || qLower.includes('condense')) {
    answerMarkdown = `Let's make every single minute count! When you're in a time crunch, we focus on **high-density compound supersets** and trim out the auxiliary isolation work.

Here is your 20-minute express execution plan:
1. Warm up dynamically for 3 minutes (arm circles, bodyweight squats, world's greatest stretch).
2. Pair your primary lower-body movement with an upper-body pull in an antagonistic superset (e.g. Goblet Squats immediately into Dumbbell Rows).
3. Take 45 to 60 seconds rest between rounds for 3 to 4 working sets.

Lock in, keep your rest intervals sharp, and get in and out with maximum efficiency. Let's execute! What equipment do you have right in front of you so we can pair your first two movements?`
  } else if (qLower.includes('creatine') || qLower.includes('supplement') || qLower.includes('pre-workout') || qLower.includes('pre workout') || qLower.includes('caffeine')) {
    answerMarkdown = `When it comes to supplements, we only focus on evidence-based fundamentals that genuinely support your physiology:

1. **Creatine Monohydrate**: Take **3 to 5 grams daily**. Timing does not make or break results, though post-workout with protein and carbs offers slight absorption benefits. You do not need a high-dose loading phase—consistent daily intake saturates muscle phosphocreatine stores within 3 to 4 weeks.
2. **Hydration & Electrolytes**: Aim for 16 to 24 ounces of water with sodium, potassium, and magnesium around your training window to prevent cramping and maintain intracellular volume.
3. **Pre-Workout Caffeine**: If using caffeine, keep it to 100 to 200mg taken 30 to 45 minutes before lifting, and avoid it within 8 hours of bedtime to safeguard your deep REM sleep.

Fuel with purpose, stay consistent, and let's keep building! Do you prefer taking your creatine with a post-workout shake, or do you have it with water in the morning?`
  } else if (qLower.includes('posture') || qLower.includes('tech neck') || qLower.includes('rounded shoulder') || qLower.includes('forward head') || (qLower.includes('desk') && (qLower.includes('neck') || qLower.includes('posture') || qLower.includes('slouch')))) {
    answerMarkdown = `Long periods at a desk can leave your neck and shoulders feeling tight.

Here is our NASM corrective reset to restore your kinetic alignment:
1. **Inhibit & Lengthen**: Spend 60 seconds using a foam roller, lacrosse ball, or doorway stretch on your pectoralis minor and suboccipitals (base of the skull).
2. **Activate**: Perform 2 sets of 12 **Prone Cobras** (lying face down, retracting scapulae and rotating thumbs toward the ceiling) and 10 **Chin Tucks** to engage deep cervical stabilizers.
3. **Integrate**: During your lifting sets today, focus on keeping your shoulder blades pulled down and back into your back pockets.

Try these movements if they feel comfortable, and take regular breaks to move during the day. Stop if you feel pain. How does that neck and shoulder tension feel once you try those first few chin tucks?`
  } else if (qLower.includes('alcohol') || qLower.includes('wine') || qLower.includes('dinner') || qLower.includes('steakhouse') || qLower.includes('restaurant')) {
    answerMarkdown = `Meals with friends, family, or coworkers can be part of a healthy, enjoyable routine. You do not need to feel guilty about a single meal.

Here are a few simple ideas:
1. **Choose what you enjoy**: Include foods you like and options that help you feel satisfied.
2. **Drink water too**: Having water with your meal can help you stay hydrated.
3. **Keep things flexible**: One meal does not undo your progress. Return to your usual routine when it works for you.

Enjoy your meal, relax, and let's stay consistent over the long haul. What does your schedule look like tomorrow—are we hitting a training session?`
  } else if (qLower.includes('click') || qLower.includes('cracking') || qLower.includes('crepitus') || qLower.includes('pop without pain')) {
    answerMarkdown = `Joint clicking or popping without any sharp pain or swelling is known as physiological crepitus, and it is usually completely harmless—often just tiny nitrogen gas bubbles moving in the synovial fluid or tendons gliding smoothly over bony landmarks.

Here is how we optimize joint mechanics:
1. Spend an extra 2 to 3 minutes on dynamic mobility and tissue warm-up (e.g. bodyweight squats with slow tempo).
2. Focus on joint tracking: ensure your knees track in line with your second and third toes on squats and lunges.
3. As long as there is zero pain, throbbing, or instability, you are cleared to train with confidence.

Stay mindful of your form, own your tempo, and let's get after it! How does the joint feel right now when you do a slow, controlled bodyweight squat?`
  } else if (qLower.includes('eat') || qLower.includes('meal') || qLower.includes('protein') || qLower.includes('food') || qLower.includes('nutrition')) {
    answerMarkdown = `Great question! Remember, food is biological information and fuel to help your body adapt and recover—never something to feel guilty or stressed about. 

Right now after your workout, your muscles are primed for recovery. I want you to aim for **30 to 40 grams of high-quality protein**—chicken breast, wild salmon, egg whites, or a clean whey isolate shake—paired with some complex carbohydrates like sweet potatoes, jasmine rice, or oatmeal to replenish your glycogen stores.

Drink a tall 16 to 24 ounce glass of water with some electrolytes as well to restore intra-cellular hydration. Fuel your body well, enjoy your meal, and let's keep stacking these wins! What are you planning on having for your post-workout meal today?`
  } else if (qLower.includes('doms') || qLower.includes('soreness') || qLower.includes('delayed onset') || (qLower.includes('sore') && !qLower.includes('throat') && !qLower.includes('back') && !qLower.includes('knee') && !qLower.includes('shoulder'))) {
    answerMarkdown = `Delayed onset muscle soreness (DOMS) is completely normal when introducing new training stimuli or eccentric overload—it simply reflects microscopic muscular remodeling, not tissue damage.

Here is your optimal recovery protocol:
1. **Active Recovery Blood Flow**: Take a 20-minute brisk walk or light spin on the bike. Getting fresh, oxygenated blood into the tissue clears metabolic byproducts twice as fast as sitting still.
2. **Protein & Intra-Cellular Hydration**: Hit **30 to 40 grams of high-quality protein** every 3 to 4 hours and drink 20 ounces of water with electrolytes to restore fluid balance.
3. **Contrast Shower or Gentle Foam Rolling**: Spend 60 seconds gently rolling the sore muscle bellies without aggressively mashing tight trigger points.

As long as it's muscular soreness rather than sharp joint pain, you are safe to move. How are your energy levels today—are we doing active recovery or a scheduled training session?`
  } else if (qLower.includes('back') || qLower.includes('knee') || qLower.includes('shoulder') || qLower.includes('tight') || qLower.includes('pain') || qLower.includes('sore')) {
    answerMarkdown = `I'm glad you brought this up. We are training for the next 20 years, not just the next 20 minutes, so we never force a lift or sacrifice joint health for ego.

Let's take 3 minutes right now to run a quick corrective reset:
1. Grab a foam roller or lacrosse ball and spend 60 seconds releasing the tight area with slow, deep diaphragmatic breaths.
2. Hold a gentle 30-second stretch (like a kneeling hip flexor or chest stretch) to lengthen tight tissue.
3. Wake up your stabilizing muscles with 10 to 12 bodyweight glute bridges or prone cobras.

If the joint still feels reactive after this reset, drop your working load by 20% today and focus purely on smooth, pain-free range of motion. Protect your spine, own your positions, and let me know how that feels! Does that 60-second release bring any immediate relief to the joint?`
  } else if (qLower.includes('cardio') || qLower.includes('interval') || qLower.includes('pace') || qLower.includes('rpe')) {
    answerMarkdown = `For today's cardio, the goal is smart energy system conditioning that builds your engine without fatiguing your nervous system for lifting.

In **Phase ${nasmOptPhase}**, keep your intensity right around **${nasmOptPhase === 2 ? 'an RPE 6 to 7 during work intervals' : 'a comfortable RPE 3 to 4 steady-state pace'}**. You should be able to maintain smooth, nasal or diaphragmatic breathing and bring your heart rate back down during rest intervals.

Stay tall, keep your posture upright, and log your duration when you finish. You're doing outstanding work—let's bring it home! Are you hitting the treadmill, the bike, or getting outside for this cardio block?`
  } else if (qLower.includes('golf') || qLower.includes('rotational') || qLower.includes('swing')) {
    answerMarkdown = `To add effortless clubhead speed without beating up your lower back, the secret is making sure that rotation comes from the right joints. We want rotation happening through your **thoracic spine and hips**, while your lumbar spine stays rock solid like an anchor.

Try hitting standing cable woodchops or rotational medicine ball scoop tosses. Focus on pushing hard into the ground through your back leg, pivoting your trail foot, and transferring that ground force right through your core.

Give me 3 crisp sets of 8 reps per side with explosive intent, and let's build that rotational power! Do you have a cable stack or medicine balls available in your gym right now?`
  } else if (qLower.includes('form') || qLower.includes('cue') || qLower.includes('technique') || qLower.includes('bar path') || qLower.includes('depth') || (qLower.includes('squat') && !qLower.includes('swap')) || (qLower.includes('deadlift') && !qLower.includes('swap')) || qLower.includes('bench press') || qLower.includes('overhead press')) {
    answerMarkdown = `When dialing in your lifting technique, quality always precedes load.

Here are the master biomechanical cues to lock in right now:
1. **Establish Your Root**: Drive three points of contact through your feet (heel, base of big toe, base of pinky toe) to create an unshakeable ground foundation.
2. **Lock Your 360-Degree Core Brace**: Inhale diaphragmatically into your ribs and lock your core as if bracing for a light punch—protect your lumbar spine from start to finish.
3. **Control Your Descent**: Own the eccentric phase with a deliberate **${nasmOptPhase === 1 ? '4-second descent' : '2-second descent'}**. Never dive-bomb into the bottom of a lift.
4. **Complete The Rep Without Hyperextension**: Finish tall at the top by squeezing your glutes and quads, without arching or leaning backward.

Earn the right to add weight by making every single repetition look identical. How did that last set feel through your joints?`
  } else if (qLower.includes('warmup') || qLower.includes('warm up') || qLower.includes('mobility') || qLower.includes('foam roll') || qLower.includes('stretch')) {
    answerMarkdown = `A smart warmup isn't just about breaking a sweat—it prepares your nervous system and primes joint mechanics for maximum output.

Here is our NASM 3-Step Dynamic Prep:
1. **Inhibit (1-2 mins)**: Use a foam roller on overactive areas like your calves, lats, and hip flexors for 30 to 60 seconds per spot.
2. **Lengthen (2 mins)**: Perform dynamic mobility like the World's Greatest Stretch, kneeling hip flexor stretches, and cat-camels.
3. **Activate (2 mins)**: Wake up your stabilizing muscles with 10 bodyweight glute bridges, band pull-aparts, and prone cobras to lock your alignment before touching a barbell.

Once your core temperature is up and your joints glide smoothly, you are primed to lift. What is the first exercise on your schedule today?`
  } else if (qLower.includes('hotel') || qLower.includes('travel') || qLower.includes('home workout') || qLower.includes('no gym') || qLower.includes('bands') || qLower.includes('bodyweight') || qLower.includes('no equipment')) {
    answerMarkdown = `Traveling or away from your home gym? We don't skip a beat. The secret to keeping your gains on the road is **tempo manipulation and mechanical tension**.

Here is how we match your Phase ${nasmOptPhase} stimulus with zero equipment or hotel dumbbells:
1. **Slow Eccentrics (4 seconds down)**: Take 4 seconds to lower on bodyweight pushups, squats, and lunges. This triples the time-under-tension and matches the muscle recruitment of heavy weights.
2. **1.5-Rep Bulgarian Split Squats**: Drop down, come halfway up, drop back to the bottom, and drive to the top. Your quads and glutes will be fully fatigued with bodyweight alone.
3. **Antagonistic Pairing**: Alternate an upper-body push (tempo pushups) with a lower-body movement (glute bridges or split squats) to keep your heart rate elevated and burn maximum calories.

Stay consistent, stay hydrated, and let's get this travel session logged! What equipment do you have access to in your hotel or room?`
  } else if (qLower.includes('plateau') || qLower.includes('stuck') || qLower.includes('progression') || qLower.includes('heavier') || qLower.includes('overload') || qLower.includes('add weight') || qLower.includes('increase weight')) {
    answerMarkdown = `Hitting a plateau is a natural signal from your body that it has adapted to your current training variables—it just means it's time to apply smart sports science!

Here is our progressive overload checklist:
1. **The 2-For-2 Rule**: If you can complete 2 extra repetitions on your final set for 2 consecutive workouts with immaculate technique, you've earned the right to increase load by 2.5% to 5%.
2. **Progress Tempo Before Load**: Before jumping up in weight, try slowing down your eccentric phase (e.g. going from a 2-second to a 4-second descent) or adding a 1-second pause at the bottom.
3. **Check Your Recovery & Fueling**: Are you hitting at least 7.5 hours of sleep and 30–40g of protein per meal? You cannot out-train under-recovery.

Tell me which lift feels stuck—is it your squat, bench press, deadlift, or something else?`
  } else if (qLower.includes('core') || qLower.includes('abs') || qLower.includes('brace') || qLower.includes('bracing') || qLower.includes('breathing') || qLower.includes('valsalva')) {
    answerMarkdown = `Your core is the power-transfer bridge between your lower body and upper body. If your core leaks energy, your lifts suffer and your lumbar spine takes unnecessary shear stress.

Here is how we lock down a true 360-degree canister brace:
1. **The Navel Draw-In**: Gently draw your belly button inward toward your spine to engage the deep transverse abdominis.
2. **The 360-Degree Expansion**: Inhale diaphragmatically into your lower abdomen, flanks, and lower back—think of expanding an inner tube around your waist.
3. **Brace Down**: Contract your external obliques and rectus abdominis as if preparing to take a light jab to the stomach. Keep your ribcage pinned down over your pelvis.

Lock this canister brace in before every single repetition, own your spinal alignment, and let me know: do you feel this brace holding strong throughout your sets?`
  } else {
    answerMarkdown = `I'm right here in your corner. In **Phase ${nasmOptPhase} (${goal.replace('_', ' ')})**, our main focus is dialing in movement quality and progressive adaptation.

Remember our golden rule: **earn the right to add load by owning the movement first**. Keep your deep core braced, control your tempo on the way down, and keep your effort dialed right into your target RPE.

Make sure you hydrate post-workout and prioritize high-quality sleep tonight. You've got everything you need—what exercise or movement are we tackling next?`
  }

  spokenAudioText = sanitizeCoachSpeechText(answerMarkdown)
  const pingCheck = detectCoachPingNeed(question, answerMarkdown)
  const recommendedAction = deriveRecommendedAction(qLower, currentExerciseName)

  return {
    answerMarkdown,
    spokenAudioText,
    relevantCurriculums: docs.map(d => d.title),
    recommendedAction,
    suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
    requiresCoachPing: pingCheck.requiresCoachPing,
    coachPingReason: pingCheck.reason,
    isEmergency911: false,
  }
}

/**
 * Derives actionable interactive buttons for chat messages (e.g. 1-tap exercise swap, rest timer).
 */
export function deriveRecommendedAction(
  qLower: string,
  currentExerciseName?: string,
  answerText?: string,
  nasmOptPhase: number = 1
): CoachActionRecommendation | undefined {
  const aLower = (answerText || '').toLowerCase()
  const combined = `${qLower} ${aLower}`

  if (combined.includes('swap') || combined.includes('replace') || combined.includes('substitute') || combined.includes('busy') || combined.includes('taken')) {
    if (currentExerciseName) {
      const smartSubs = getSmartSubstitutions(currentExerciseName, `Phase ${nasmOptPhase}`)
      if (smartSubs && smartSubs.length > 0) {
        const topSub = smartSubs[0]
        const video = resolveExerciseVideoEmbed(topSub.name)
        return {
          type: 'swap_exercise',
          targetExerciseName: topSub.name,
          currentExerciseName,
          buttonText: `Swap to ${topSub.name} in Workout`,
          prescribedTempo: topSub.prescribedTempo,
          reasoning: topSub.reasoning,
          videoId: video.videoId || undefined,
          embedUrl: video.embedUrl || undefined,
        }
      }
      return {
        type: 'swap_exercise',
        targetExerciseName: `an alternative to ${currentExerciseName}`,
        currentExerciseName,
        buttonText: `Swap to an alternative to ${currentExerciseName} in Workout`,
      }
    }
    return {
      type: 'swap_exercise',
      targetExerciseName: 'DB Goblet Squats',
      buttonText: 'Swap to DB Goblet Squats in Workout',
    }
  }

  if (combined.includes('rest') || combined.includes('timer') || combined.includes('interval') || combined.includes('heavy set')) {
    let restSecs = 90
    if (combined.includes('60s') || combined.includes('60 second') || combined.includes('1 minute') || combined.includes('60 sec')) restSecs = 60
    else if (combined.includes('120s') || combined.includes('120 second') || combined.includes('2 minute')) restSecs = 120
    else if (combined.includes('180s') || combined.includes('3 minute')) restSecs = 180

    return {
      type: 'start_timer',
      restSeconds: restSecs,
      buttonText: `Start ${restSecs}s Rest Timer (Spoken in Earbuds)`,
    }
  }

  if (combined.includes('sleep') || combined.includes('tired') || combined.includes('red eye') || combined.includes('jet lag') || combined.includes('auto-regulate') || combined.includes('exhausted')) {
    return {
      type: 'auto_regulate_load',
      loadReductionPercent: 15,
      buttonText: 'Auto-Regulate: Drop Working Weight 15%',
    }
  }

  if (currentExerciseName && (combined.includes('demo') || combined.includes('how to') || combined.includes('how do i') || combined.includes('technique') || combined.includes('video cue') || combined.includes('watch'))) {
    const video = resolveExerciseVideoEmbed(currentExerciseName)
    if (video && video.videoId) {
      return {
        type: 'view_demo',
        targetExerciseName: currentExerciseName,
        buttonText: `Watch ${currentExerciseName} Video Demo`,
        videoId: video.videoId,
        embedUrl: video.embedUrl,
      }
    }
  }

  if (combined.includes('form') || combined.includes('critique') || combined.includes('check my') || combined.includes('depth') || combined.includes('film my')) {
    return {
      type: 'form_critique',
      cueTitle: '5-Second Video Form Check',
      buttonText: 'Launch Quick Form Check',
    }
  }

  return undefined
}

/**
 * Returns dynamic quick-tap suggested follow-up questions based on the context.
 */
function deriveSuggestedFollowUps(question: string, goal: string, optPhase: number): string[] {
  const qLower = question.toLowerCase()

  if (isOutOfTrainingScope(question)) {
    return [
      'What exercises are scheduled today?',
      'How should we adjust today’s workout?',
      'Can you check my recovery score?',
    ]
  }

  if (
    qLower.includes('what type of question') ||
    qLower.includes('what kind of question') ||
    qLower.includes('what can i ask') ||
    qLower.includes('what can you do') ||
    qLower.includes('what do you do') ||
    qLower.includes('how can you help') ||
    qLower.includes('capabilities') ||
    qLower.includes('what do you help with')
  ) {
    return [
      'Can we swap an exercise today?',
      'How do I dial in my lifting tempo?',
      'What should I eat after my workout?',
    ]
  }

  if (qLower.includes('form') || qLower.includes('cue') || qLower.includes('technique') || qLower.includes('squat')) {
    return [
      'What should my tempo be on this lift?',
      'How do I keep my knees tracking over my toes?',
      'Can we review my core bracing cues?',
    ]
  }

  if (qLower.includes('sore') || qLower.includes('doms') || qLower.includes('recovery')) {
    return [
      'Should I do active recovery or rest today?',
      'What dynamic stretches help sore muscles?',
      'What should I eat to speed up recovery?',
    ]
  }

  if (qLower.includes('hotel') || qLower.includes('travel') || qLower.includes('home')) {
    return [
      'Show me a 20-minute bodyweight express workout',
      'How do I swap dumbbell exercises with resistance bands?',
      'What dynamic warmup can I do in a hotel room?',
    ]
  }

  if (qLower.includes('hello') || qLower.includes('good morning') || qLower.includes('how are you') || qLower.includes('hey coach')) {
    return [
      `How should I pace today’s Phase ${optPhase} session?`,
      'Can we review my scheduled exercises today?',
      'What dynamic warmup should I do?',
    ]
  }

  if (qLower.includes('swap') || qLower.includes('exercise')) {
    return [
      `What tempo should I use on this Phase ${optPhase} alternative?`,
      'How many sets and reps should I perform?',
      'What if I only have resistance bands available?',
    ]
  }

  if (qLower.includes('eat') || qLower.includes('protein') || qLower.includes('nutrition')) {
    return [
      `What is my optimal protein target for ${goal.replace('_', ' ')}?`,
      'What should I take pre-workout for energy?',
      'What should I eat for my post-workout recovery meal?',
    ]
  }

  if (qLower.includes('back') || qLower.includes('knee') || qLower.includes('tight') || qLower.includes('pain')) {
    return [
      'Show me foam rolling cues for this area',
      'Should I skip heavy squats today?',
      'What dynamic warmup will activate my glutes?',
    ]
  }

  return [
    `How should I pace today’s Phase ${optPhase} session?`,
    `What is my target cardio zone for ${goal.replace('_', ' ')}?`,
    'How do I know when to increase my working weight?',
  ]
}
