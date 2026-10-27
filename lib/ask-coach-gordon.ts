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
import { NASM_MOVEMENT_PROFILES } from './nasm-clinical-movement-cards'
import { NASM_COMPLETE_LIBRARY } from './nasm-fuzzy-matcher'
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
  let apiFailureReason: string | undefined = undefined

  if (apiKey) {
    const modelsToTry = [
      ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
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
            const recommendedAction = deriveRecommendedAction(question.toLowerCase(), currentExerciseName, rawText, nasmOptPhase, equipmentAccess)
            return {
              answerMarkdown: rawText,
              spokenAudioText,
              relevantCurriculums: curriculumTitles,
              recommendedAction,
              suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
              requiresCoachPing: pingCheck.requiresCoachPing,
              coachPingReason: pingCheck.reason,
              engineMode: 'gemini_ai',
            }
          }
        } else {
          const errBody = await res.text().catch(() => '')
          if (res.status === 402) {
            apiFailureReason = 'Google AI Studio prepayment credits depleted (HTTP 402). Manage balance at https://ai.studio/projects'
            console.error(`[AskCoachGordon] ⚠️ GEMINI BILLING (402): Prepayment credits depleted. Go to https://ai.studio/projects to top up balance.`)
          } else {
            console.warn(`[AskCoachGordon] Model ${model} returned HTTP ${res.status}:`, errBody.slice(0, 200))
          }
        }
      } catch (err) {
        console.warn(`[AskCoachGordon] Model ${model} failed, attempting next model...`, err)
      }
    }

    // Optional OpenAI secondary cloud provider fallback
    const openAiKey = process.env.OPENAI_API_KEY
    if (openAiKey && openAiKey.startsWith('sk-') && openAiKey.length > 20) {
      try {
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.35,
            messages: [
              { role: 'system', content: MASTER_COACH_SYSTEM_INSTRUCTION },
              ...activeConversationHistory.slice(-8).map(h => ({
                role: h.role === 'user' ? 'user' : 'assistant',
                content: h.text,
              })),
              {
                role: 'user',
                content: `${athleteContext}${ragContext}${contraindicationsClause}${scopeBoundaryDirective}\n\nAthlete's Question:\n"${question.trim()}"\n\nRespond conversationally in your warm 1-on-1 spoken voice as Coach Gordon. Deliver solid, practical advice grounded strictly in your athletic training scope. Always conclude with an open, collaborative coaching check-in question to keep our dialogue going.`,
              },
            ],
          }),
        })

        if (oaiRes.ok) {
          const oaiData = await oaiRes.json()
          const rawText = oaiData?.choices?.[0]?.message?.content
          if (rawText) {
            const spokenAudioText = sanitizeCoachSpeechText(rawText)
            const pingCheck = detectCoachPingNeed(question, rawText)
            const recommendedAction = deriveRecommendedAction(question.toLowerCase(), currentExerciseName, rawText, nasmOptPhase, equipmentAccess)
            return {
              answerMarkdown: rawText,
              spokenAudioText,
              relevantCurriculums: curriculumTitles,
              recommendedAction,
              suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
              requiresCoachPing: pingCheck.requiresCoachPing,
              coachPingReason: pingCheck.reason,
              engineMode: 'openai_fallback',
            }
          }
        }
      } catch (oaiErr) {
        console.warn('[AskCoachGordon] OpenAI secondary fallback failed:', oaiErr)
      }
    }
  }

  // Fallback to local high-EQ Master NASM sports-science RAG engine
  return generateDeterministicCoachResponse(request, relevantDocs, apiFailureReason)
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

interface MatchedExerciseInfo {
  name: string
  category?: string
  primeMover?: string
  synergists?: string[]
  stabilizers?: string[]
  tempo?: string
  setupInstructions?: string
  executionInstructions?: string
  clinicalCues?: string[]
  kineticCheckpoints?: {
    feetAnkles?: string
    knees?: string
    lphc?: string
    shoulders?: string
    headNeck?: string
  }
  description?: string
  videoId?: string | null
  embedUrl?: string | null
}

export function resolveExerciseContext(query: string, currentExerciseName?: string): MatchedExerciseInfo | null {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  const q = clean(query)
  const cur = currentExerciseName ? clean(currentExerciseName) : ''

  const aliasMap: Record<string, string> = {
    'incline bench': 'incline dumbbell bench press',
    'incline press': 'incline dumbbell bench press',
    'dumbbell incline': 'incline dumbbell bench press',
    'incline dumbbell': 'incline dumbbell bench press',
    'incline chest press': 'incline dumbbell bench press',
    'rdl': 'romanian deadlift',
    'rdls': 'romanian deadlift',
    'romanian': 'romanian deadlift',
    'split squat': 'bulgarian split squat',
    'split squats': 'bulgarian split squat',
    'bulgarian': 'bulgarian split squat',
    'bulgarian split': 'bulgarian split squat',
    'pushup': 'push up',
    'pushups': 'push up',
    'push ups': 'push up',
    'pullup': 'pull up',
    'pullups': 'pull up',
    'pull ups': 'pull up',
    'bicep curl': 'barbell bicep curl',
    'bicep curls': 'barbell bicep curl',
    'curls': 'barbell bicep curl',
    'hammer curl': 'hammer curl',
    'hammer curls': 'hammer curl',
    'squat': 'barbell back squat',
    'squats': 'barbell back squat',
    'back squat': 'barbell back squat',
    'front squat': 'front squat',
    'goblet squat': 'goblet squat',
    'deadlift': 'barbell deadlift',
    'deadlifts': 'barbell deadlift',
    'bench': 'bench press',
    'bench press': 'bench press',
    'flat bench': 'bench press',
    'dumbbell press': 'dumbbell bench press',
    'overhead press': 'overhead press',
    'ohp': 'overhead press',
    'military press': 'overhead press',
    'shoulder press': 'overhead press',
    'lateral raise': 'dumbbell lateral raise',
    'lateral raises': 'dumbbell lateral raise',
    'side raise': 'dumbbell lateral raise',
    'hip thrust': 'barbell hip thrust',
    'hip thrusts': 'barbell hip thrust',
    'glute bridge': 'dead bug',
    'lat pull': 'lat pulldown',
    'lat pulldown': 'lat pulldown',
    'pulldown': 'lat pulldown',
    'pulldowns': 'lat pulldown',
    'bent over row': 'barbell bent-over row',
    'barbell row': 'barbell bent-over row',
    'cable row': 'cable row',
    'seated row': 'seated row',
    'face pull': 'face pull',
    'face pulls': 'face pull',
    'tricep pushdown': 'triceps pushdown',
    'triceps pushdown': 'triceps pushdown',
    'tricep extension': 'supported bent over dumbbell extension',
    'triceps extension': 'supported bent over dumbbell extension',
    'lunge': 'walking lunge',
    'lunges': 'walking lunge',
    'reverse lunge': 'reverse lunge',
    'plank': 'plank',
    'planks': 'plank',
  }

  // 1. Check aliases
  for (const [alias, canonicalKey] of Object.entries(aliasMap)) {
    if (q.includes(alias) || cur.includes(alias)) {
      const profile = NASM_MOVEMENT_PROFILES[canonicalKey]
      if (profile) {
        const video = resolveExerciseVideoEmbed(profile.name || canonicalKey)
        return {
          name: profile.name || canonicalKey.replace(/\b\w/g, l => l.toUpperCase()),
          category: profile.category,
          primeMover: profile.primeMover,
          synergists: profile.synergists,
          stabilizers: profile.stabilizers,
          tempo: profile.tempo,
          setupInstructions: profile.setupInstructions,
          executionInstructions: profile.executionInstructions,
          clinicalCues: profile.clinicalCues,
          kineticCheckpoints: profile.kineticCheckpoints,
          videoId: video.videoId || null,
          embedUrl: video.embedUrl || null,
        }
      }
    }
  }

  // 2. Direct match against NASM_MOVEMENT_PROFILES keys
  for (const [key, profile] of Object.entries(NASM_MOVEMENT_PROFILES)) {
    const kClean = clean(key)
    if (q.includes(kClean) || cur.includes(kClean)) {
      const video = resolveExerciseVideoEmbed(profile.name || key)
      return {
        name: profile.name || key.replace(/\b\w/g, l => l.toUpperCase()),
        category: profile.category,
        primeMover: profile.primeMover,
        synergists: profile.synergists,
        stabilizers: profile.stabilizers,
        tempo: profile.tempo,
        setupInstructions: profile.setupInstructions,
        executionInstructions: profile.executionInstructions,
        clinicalCues: profile.clinicalCues,
        kineticCheckpoints: profile.kineticCheckpoints,
        videoId: video.videoId || null,
        embedUrl: video.embedUrl || null,
      }
    }
  }

  // 3. Multi-word partial match in NASM_MOVEMENT_PROFILES
  for (const [key, profile] of Object.entries(NASM_MOVEMENT_PROFILES)) {
    const words = clean(key).split(' ').filter(w => w.length > 3)
    if (words.length >= 2) {
      const allFound = words.every(w => q.includes(w) || cur.includes(w))
      if (allFound) {
        const video = resolveExerciseVideoEmbed(profile.name || key)
        return {
          name: profile.name || key.replace(/\b\w/g, l => l.toUpperCase()),
          category: profile.category,
          primeMover: profile.primeMover,
          synergists: profile.synergists,
          stabilizers: profile.stabilizers,
          tempo: profile.tempo,
          setupInstructions: profile.setupInstructions,
          executionInstructions: profile.executionInstructions,
          clinicalCues: profile.clinicalCues,
          kineticCheckpoints: profile.kineticCheckpoints,
          videoId: video.videoId || null,
          embedUrl: video.embedUrl || null,
        }
      }
    }
  }

  // 4. Complete Library match (323 verified exercises)
  for (const record of NASM_COMPLETE_LIBRARY) {
    const norm = clean(record.name)
    if (q.includes(norm) || (cur && cur.includes(norm))) {
      return {
        name: record.name,
        category: record.muscleGroups?.[0] ? record.muscleGroups[0].toUpperCase() : undefined,
        primeMover: record.muscleGroups?.slice(0, 2).join(', '),
        description: record.description || undefined,
        clinicalCues: record.coachingCues?.length ? record.coachingCues : undefined,
        videoId: record.videoId || null,
        embedUrl: record.videoUrl ? record.videoUrl.replace('watch?v=', 'embed/') : null,
      }
    }
  }

  return null
}

/**
 * Generates an authoritative sports-science response when external APIs are unavailable.
 */
export function generateDeterministicCoachResponse(
  request: AskCoachGordonRequest,
  docs: RagDocumentMetadata[],
  apiNotice?: string
): AskCoachGordonResponse {
  const { question, goal = 'fat_loss', nasmOptPhase = 1, currentExerciseName, contraindicationTags = [], equipmentAccess = [], clientAge = 35 } = request
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
      engineMode: 'nasm_rag_engine',
      apiNotice,
    }
  }

  let answerMarkdown = ''
  let spokenAudioText = ''
  let dynamicAction: CoachActionRecommendation | undefined = undefined
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
        engineMode: 'nasm_rag_engine',
        apiNotice,
      }
    }
  }

  // 3. Out-of-Scope Detection (Strict Training Scope & RAG Boundary)
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
      engineMode: 'nasm_rag_engine',
      apiNotice,
    }
  }

  // 4. Friendly Conversational Greetings & Rapport Check-ins
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
      engineMode: 'nasm_rag_engine',
      apiNotice,
    }
  }

  // 5. Questions regarding Coach Gordon capabilities, scope, and what can be asked
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
      engineMode: 'nasm_rag_engine',
      apiNotice,
    }
  }

  // 6. Exercise Substitution & Equipment Workarounds
  const isSwapIntent =
    qLower.includes('swap') ||
    qLower.includes('replace') ||
    qLower.includes('substitute') ||
    qLower.includes('alternative') ||
    qLower.includes('instead of') ||
    qLower.includes('busy') ||
    qLower.includes('taken') ||
    qLower.includes("don't have") ||
    qLower.includes('dont have') ||
    qLower.includes('broken') ||
    qLower.includes('no equipment') ||
    qLower.includes('crowded')

  const matchedExercise = resolveExerciseContext(question, currentExerciseName)

  if (isSwapIntent) {
    const targetExercise = matchedExercise?.name || currentExerciseName || 'your scheduled lift'
    const smartSubs = getSmartSubstitutions(targetExercise, `Phase ${nasmOptPhase}`, undefined, equipmentAccess)
    const topSub = smartSubs && smartSubs.length > 0 ? smartSubs[0] : null

    if (topSub) {
      const cleanTargetName = topSub.name.replace(/\(.*\)/, '').trim()
      answerMarkdown = `Hey ${athleteGreeting}, when gym equipment is taken or you need a smart workaround, we never let it stop your momentum!

For **${targetExercise}**, our prescribed evidence-based substitution is **${topSub.name}**.

**Biomechanical Rationale:** ${topSub.reasoning}

**Phase ${nasmOptPhase} Execution Standard:**
• **Prescribed Tempo**: Lock into a steady **${topSub.prescribedTempo || (nasmOptPhase === 1 ? '4-2-1' : '2-0-2')}** tempo to match the identical neuromuscular recruitment of your primary lift.
• **Equipment Match**: Calibrated for ${equipmentAccess.length > 0 ? equipmentAccess.join(', ') : 'available resistance gear'}.
• **Core Brace**: Set your 360-degree abdominal brace before initiating rep one.

Remember our golden rule: **earn the right to add load by owning the movement first**. Tap the button below to update your workout tracker right now! Do you have this station ready to go?`

      dynamicAction = {
        type: 'swap_exercise',
        targetExerciseName: cleanTargetName,
        currentExerciseName: targetExercise,
        buttonText: `Swap to ${cleanTargetName} in Workout`,
        prescribedTempo: topSub.prescribedTempo,
        reasoning: topSub.reasoning,
      }
    } else {
      answerMarkdown = `Hey ${athleteGreeting}, no problem at all! When equipment is limited or a machine is occupied, we pivot without missing a beat.

If you can't access **${targetExercise}** today, grab a set of dumbbells or even a resistance band and let's substitute with **DB Goblet Squats with a 2-second pause at the bottom** (for lower body) or **Dumbbell Floor Presses** (for upper push).

By introducing a controlled pause at the bottom of the movement, you maximize motor unit recruitment and create tremendous mechanical tension without needing heavy barbells or specialized machines. Focus on keeping your chest proud, setting your core brace, and controlling your descent with a steady **${nasmOptPhase === 1 ? '4-second eccentric tempo' : '2-second tempo'}**.

Remember our standard: **earn the right to add load by owning the movement first**. Lock in your tempo and let's get after it! What resistance gear do you have open right beside you?`

      dynamicAction = {
        type: 'swap_exercise',
        targetExerciseName: 'DB Goblet Squats',
        currentExerciseName: targetExercise,
        buttonText: 'Swap to DB Goblet Squats in Workout',
      }
    }
  }

  // 7. Specific Exercise Technique, Biomechanical Cues & Kinetic Checkpoints
  else if (matchedExercise) {
    const ex = matchedExercise
    const phaseTempo = nasmOptPhase === 1 ? '4-2-1 (4s eccentric descent, 2s isometric stabilization pause, 1s concentric drive)'
      : nasmOptPhase === 2 ? '2-0-2 (2s eccentric descent, 0s pause, 2s concentric drive)'
      : nasmOptPhase === 3 ? '2-0-2 (controlled muscular development hypertrophy tempo)'
      : nasmOptPhase === 4 ? '1-1-1 or 2-0-2 (maximal strength force production)'
      : 'X-0-X (maximal rate of force development explosive tempo)'

    const checkpointsBlock = ex.kineticCheckpoints
      ? `\n\n**Master 5 Kinetic Chain Checkpoints:**\n• **Feet & Ankles**: ${ex.kineticCheckpoints.feetAnkles}\n• **Knees**: ${ex.kineticCheckpoints.knees}\n• **LPHC (Core & Pelvis)**: ${ex.kineticCheckpoints.lphc}\n• **Shoulders**: ${ex.kineticCheckpoints.shoulders}\n• **Head & Cervical Spine**: ${ex.kineticCheckpoints.headNeck}`
      : ''

    const cuesBlock = ex.clinicalCues && ex.clinicalCues.length > 0
      ? `\n\n**Clinical Coaching Cues:**\n${ex.clinicalCues.map(c => `• ${c}`).join('\n')}`
      : ''

    const setupBlock = ex.setupInstructions
      ? `\n\n**Setup & Alignment:** ${ex.setupInstructions}`
      : ex.description
      ? `\n\n**Movement Breakdown:**\n${ex.description}`
      : ''

    const execBlock = ex.executionInstructions
      ? `\n\n**Execution & Path of Motion:** ${ex.executionInstructions}`
      : ''

    answerMarkdown = `Hey ${athleteGreeting}! The **${ex.name}** is a cornerstone movement in your **Phase ${nasmOptPhase}** program${ex.primeMover ? ` for targeting your **${ex.primeMover}**` : ''}${ex.synergists?.length ? ` with support from your **${ex.synergists.join(', ')}**` : ''}.

In **Phase ${nasmOptPhase}**, dial your repetition cadence into our prescribed **${phaseTempo}**. Never rush the stretch—quality and joint integrity always precede load.${setupBlock}${execBlock}${checkpointsBlock}${cuesBlock}

Remember our golden rule: **earn the right to add load by owning the movement first**. What weight are you planning for your working sets today, and how do your joints feel as you set your position?`

    if (ex.embedUrl || ex.videoId) {
      dynamicAction = {
        type: 'view_demo',
        buttonText: `Watch ${ex.name} Technique Demo`,
        targetExerciseName: ex.name,
        videoId: ex.videoId || undefined,
        embedUrl: ex.embedUrl || undefined,
      }
    } else {
      dynamicAction = {
        type: 'start_timer',
        buttonText: 'Start 90s Rest Interval',
        restSeconds: 90,
      }
    }
  }

  // 8. Targeted Nutrition, Protein Pacing & Post-Workout Fueling
  else if (qLower.includes('eat') || qLower.includes('meal') || qLower.includes('protein') || qLower.includes('food') || qLower.includes('nutrition') || qLower.includes('macro') || qLower.includes('diet') || qLower.includes('pre-workout') || qLower.includes('post-workout') || qLower.includes('fuel') || qLower.includes('snack') || qLower.includes('shake') || qLower.includes('carb')) {
    const goalTitle = goal === 'hypertrophy' ? 'hypertrophy & lean tissue building' : goal === 'performance' ? 'athletic power & work capacity' : 'metabolic defense & fat loss'

    answerMarkdown = `Great question on your nutrition, ${athleteGreeting}! Remember, food is biological information and cellular recovery fuel—never something to feel anxious or guilty about.

For your **${goalTitle}** focus in **Phase ${nasmOptPhase}**, here is our evidence-based fueling protocol:

1. **Protein Pacing (30 to 40 Grams)**: Aim for **30 to 40 grams of high-quality protein** containing approximately 2.5 to 3 grams of leucine (e.g. 6 oz grilled chicken breast, 7 oz wild salmon, 1.5 cups egg whites, 1.5 cups non-fat Greek yogurt, or a clean whey isolate shake). This activates the mTOR pathway to maximize muscle protein synthesis (MPS).
2. **Glycogen Replenishment**: Pair your protein with **30 to 45 grams of clean complex carbohydrates** (sweet potato, jasmine rice, quinoa, or rolled oats) within 60 to 90 minutes of finishing your lift to replenish intramuscular glycogen stores.
3. **Intra-Cellular Hydration**: Drink **16 to 24 ounces of water** paired with an electrolyte pinch (sodium, potassium, magnesium) to restore cellular fluid balance lost during sweating.

Fuel with purpose, enjoy your meal, and let's keep building! What are you planning on having for your post-workout meal today?`
  }

  // 9. Cardiorespiratory Conditioning & Tanaka Targets
  else if (qLower.includes('cardio') || qLower.includes('treadmill') || qLower.includes('bike') || qLower.includes('rower') || qLower.includes('elliptical') || qLower.includes('interval') || qLower.includes('zone') || qLower.includes('bpm') || qLower.includes('heart rate') || qLower.includes('pace')) {
    const athleteAge = clientAge || 35
    const maxHr = Math.round(208 - (0.7 * athleteAge))
    const z1Min = Math.round(maxHr * 0.65)
    const z1Max = Math.round(maxHr * 0.75)
    const z2Min = Math.round(maxHr * 0.76)
    const z2Max = Math.round(maxHr * 0.85)
    const z3Min = Math.round(maxHr * 0.86)
    const z3Max = Math.round(maxHr * 0.95)

    answerMarkdown = `For your cardiorespiratory conditioning, ${athleteGreeting}, we use the Tanaka sports science formula to prescribe your exact heart rate training zones (calculated for age **${athleteAge}**, Tanaka Max HR: **${maxHr} BPM**):

• **Zone 1 (Base Aerobic & Active Recovery: 65%–75%)**: **${z1Min} to ${z1Max} BPM** (RPE 3–4 / Smooth nasal breathing). Ideal for Phase 1 warmups, recovery flushes, and aerobic foundation.
• **Zone 2 (Aerobic Endurance & Lactate Threshold: 76%–85%)**: **${z2Min} to ${z2Max} BPM** (RPE 6–7 / Talk test challenging). Optimal for Phase 2 cardio intervals (e.g. 1 min work, 1 min active recovery).
• **Zone 3 (Peak Anaerobic Capacity & EPOC: 86%–95%)**: **${z3Min} to ${z3Max} BPM** (RPE 8–9 / High-intensity conditioning finishers).

In **Phase ${nasmOptPhase}**, stay tall through your kinetic chain, maintain smooth diaphragmatic breathing, and avoid slouching on the handrails. Are you hitting the treadmill, the stationary bike, or taking your conditioning outside today?`
  }

  // 10. Joint Tightness, Muscle Soreness (DOMS) & Corrective Continuum
  else if (qLower.includes('sore') || qLower.includes('doms') || qLower.includes('tight') || qLower.includes('mobility') || qLower.includes('foam roll') || qLower.includes('stretching') || qLower.includes('stretch') || qLower.includes('warmup') || qLower.includes('warm up') || qLower.includes('stiff') || qLower.includes('ache') || qLower.includes('knee') || qLower.includes('hip') || qLower.includes('shoulder') || qLower.includes('back') || qLower.includes('neck') || qLower.includes('ankle')) {
    const area = qLower.includes('knee') ? 'knees and quads'
      : qLower.includes('hip') ? 'hips and glutes'
      : qLower.includes('shoulder') ? 'shoulders and upper back'
      : qLower.includes('back') ? 'lower back and thoracic spine'
      : qLower.includes('neck') ? 'neck and upper traps'
      : qLower.includes('ankle') ? 'calves and ankles'
      : 'muscles and joints'

    answerMarkdown = `I'm glad you brought this to my attention, ${athleteGreeting}. We are training for the next 20 years, not just the next 20 minutes, so we never force a lift through joint friction or acute tightness.

Let's run our NASM 4-Step Corrective Continuum for your **${area}** right now:

1. **Step 1: Inhibit (SMR / Foam Rolling)**: Spend **30 to 60 seconds** on tender trigger points. Breathe deeply into your diaphragm and allow the autogenic inhibition response (Golgi tendon organs) to relax the overactive tissue.
2. **Step 2: Lengthen (Static / Neuromuscular Stretching)**: Hold a slow, pain-free stretch for **30 seconds** without bouncing to restore resting muscle sarcomere length.
3. **Step 3: Activate (Isolated Strengthening)**: Perform **10 to 12 controlled reps** of stabilizing activation (e.g. glute bridges for hips, prone cobras for upper back, band pull-aparts for shoulders) with a 2-second hold at peak contraction.
4. **Step 4: Integrate**: Execute a slow bodyweight movement (e.g. bodyweight squat or wall slide) to re-educate your neuromuscular system.

If anything feels sharp or pinch-like, stop immediately and message me. How does the area feel once you finish that 60-second foam rolling release?`
  }

  // 11. Progressive Overload, Progression & RPE
  else if (qLower.includes('plateau') || qLower.includes('stuck') || qLower.includes('heavier') || qLower.includes('add weight') || qLower.includes('increase weight') || qLower.includes('how much weight') || qLower.includes('rpe') || qLower.includes('rir') || qLower.includes('progression') || qLower.includes('how many sets') || qLower.includes('how many reps')) {
    answerMarkdown = `Progressive overload is the fundamental driver of physiological adaptation, ${athleteGreeting}, but it's about much more than just slapping more weight on the bar!

Here is our NASM master progression checklist for **Phase ${nasmOptPhase}**:

1. **The NASM 2-for-2 Rule**: If you can complete **2 extra repetitions** with immaculate textbook form on your final set for **2 consecutive workouts**, you've earned the right to advance load by **2.5% to 5%** for upper body or **5% to 10%** for lower body.
2. **Progress Tempo Before Load**: Before jumping up in weight, increase mechanical tension by slowing your eccentric descent (e.g. shifting from a 2-second to a 4-second descent) or adding a 1-second isometric pause in the hole.
3. **RPE & Reps in Reserve (RIR)**: In Phase ${nasmOptPhase}, aim for **RPE ${nasmOptPhase === 1 ? '6 to 7 (3 to 4 reps in reserve)' : nasmOptPhase === 2 ? '7 to 8 (2 to 3 reps in reserve)' : '8 to 9 (1 to 2 reps in reserve)'}**. You should always finish every working set feeling like you could execute 1 or 2 more clean reps with zero form breakdown.
4. **Volume Recovery**: Ensure you are getting at least 7.5 hours of sleep and hitting 30–40g of protein per meal—you can only adapt to the volume you can recover from.

Tell me about the specific exercise you're working on—how did your last set feel, and are you hitting all your target reps with zero compensation?`
  }

  // 12. Core Bracing & Breathing
  else if (qLower.includes('core') || qLower.includes('abs') || qLower.includes('brace') || qLower.includes('bracing') || qLower.includes('breathing') || qLower.includes('valsalva')) {
    answerMarkdown = `Your core is the power-transfer bridge between your lower body and upper body. If your core leaks energy, your lifts suffer and your lumbar spine takes unnecessary shear stress.

Here is how we lock down a true 360-degree canister brace:
1. **The Navel Draw-In**: Gently draw your belly button inward toward your spine to engage the deep transverse abdominis.
2. **The 360-Degree Expansion**: Inhale diaphragmatically into your lower abdomen, flanks, and lower back—think of expanding an inner tube around your waist.
3. **Brace Down**: Contract your external obliques and rectus abdominis as if preparing to take a light jab to the stomach. Keep your ribcage pinned down over your pelvis.

Lock this canister brace in before every single repetition, own your spinal alignment, and let me know: do you feel this brace holding strong throughout your sets?`
  }

  // 13. Fatigue, Sleep & Autoregulation
  else if (qLower.includes('sleep') || qLower.includes('tired') || qLower.includes('exhausted') || qLower.includes('jet lag') || qLower.includes('red eye') || qLower.includes('fatigue')) {
    answerMarkdown = `I understand completely, ${athleteGreeting}—work, family, travel, and changing sleep schedules can make training harder to plan.

On days when sleep was compromised, our signature standard is: **"A modified workout beats a skipped workout 100% of the time."** We train smarter, not harder. Do not chase personal records today. Instead, auto-regulate:
1. Keep your working weights **15% to 20% lighter** than usual.
2. Focus strictly on Phase 1 stabilization, tempo control, and clean movement patterns.
3. Drink 20 ounces of water with electrolytes right now to rehydrate your central nervous system.

You still get the win by showing up, protecting your joints, and stimulating blood flow without crushing your adrenal system. We are training for the next 20 years, not just the next 20 minutes. Own your tempo and let's have a crisp, safe session! How is your energy feeling right now on the gym floor?`

    dynamicAction = {
      type: 'auto_regulate_load',
      loadReductionPercent: 15,
      buttonText: 'Auto-Regulate: Drop Working Weight 15%',
    }
  }

  // 14. Supplements & Creatine
  else if (qLower.includes('creatine') || qLower.includes('supplement') || qLower.includes('caffeine')) {
    answerMarkdown = `When it comes to supplements, we only focus on evidence-based fundamentals that genuinely support your physiology:

1. **Creatine Monohydrate**: Take **3 to 5 grams daily**. Timing does not make or break results, though post-workout with protein and carbs offers slight absorption benefits. You do not need a high-dose loading phase—consistent daily intake saturates muscle phosphocreatine stores within 3 to 4 weeks.
2. **Hydration & Electrolytes**: Aim for 16 to 24 ounces of water with sodium, potassium, and magnesium around your training window to prevent cramping and maintain intracellular volume.
3. **Pre-Workout Caffeine**: If using caffeine, keep it to 100 to 200mg taken 30 to 45 minutes before lifting, and avoid it within 8 hours of bedtime to safeguard your deep REM sleep.

Fuel with purpose, stay consistent, and let's keep building! Do you prefer taking your creatine with a post-workout shake, or do you have it with water in the morning?`
  }

  // 15. Dynamic Sports Science RAG Synthesis (Catch-All from matched NASM documents)
  else {
    const topDoc = docs.length > 0 ? docs[0] : null
    const docConcepts = topDoc?.keyConcepts?.slice(0, 4).join(', ') || 'Kinetic alignment, periodization, and progressive neuromuscular adaptation'
    const docSummary = topDoc?.summary || 'Optimizes biomechanical movement quality and phase-specific training variables.'

    answerMarkdown = `Hey ${athleteGreeting}! Coach Gordon right here in your corner. Regarding your inquiry on **"${question.trim()}"**, here is how we approach this grounded directly in our sports science curriculum:

In **Phase ${nasmOptPhase} (${goal.replace('_', ' ')})**, our foundation is governed by **${docConcepts}**. ${docSummary}

Here is how to apply this directly to your training today:
1. **Kinetic Chain Integrity**: Own every single millimeter of your movement. Maintain a 360-degree abdominal brace and keep your joints aligned from foot plant through cervical spine.
2. **Phase-Specific Stimulus**: Respect your Phase ${nasmOptPhase} tempo and target intensity. Quality of motor unit recruitment always trumps sheer ego lifting.
3. **Recovery & Bioenergetics**: Post-workout, prioritize 30 to 40 grams of protein and hydrate thoroughly to facilitate cellular repair.

We are training for the next 20 years, not just the next 20 minutes. What movement or exercise are you executing next in today's workout?`
  }

  spokenAudioText = sanitizeCoachSpeechText(answerMarkdown)
  const pingCheck = detectCoachPingNeed(question, answerMarkdown)
  const recommendedAction = dynamicAction || deriveRecommendedAction(qLower, currentExerciseName, answerMarkdown, nasmOptPhase, equipmentAccess)

  return {
    answerMarkdown,
    spokenAudioText,
    relevantCurriculums: docs.map(d => d.title),
    recommendedAction,
    suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
    requiresCoachPing: pingCheck.requiresCoachPing,
    coachPingReason: pingCheck.reason,
    isEmergency911: false,
    engineMode: 'nasm_rag_engine',
    apiNotice,
  }
}

/**
 * Derives actionable interactive buttons for chat messages (e.g. 1-tap exercise swap, rest timer).
 */
export function deriveRecommendedAction(
  qLower: string,
  currentExerciseName?: string,
  answerText?: string,
  nasmOptPhase: number = 1,
  equipmentAccess?: string[]
): CoachActionRecommendation | undefined {
  const aLower = (answerText || '').toLowerCase()
  const combined = `${qLower} ${aLower}`

  if (combined.includes('swap') || combined.includes('replace') || combined.includes('substitute') || combined.includes('busy') || combined.includes('taken')) {
    if (currentExerciseName) {
      const smartSubs = getSmartSubstitutions(currentExerciseName, `Phase ${nasmOptPhase}`, undefined, equipmentAccess)
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
