/**
 * Gordon Athletic Advisory — Master Coach Gordon Interactive AI Engine
 * 
 * Ingests athlete questions with real-time biometric and workout context,
 * performs semantic RAG retrieval across the 16 sports science curriculums,
 * and synthesizes authoritative clinical coaching responses with audio narration.
 */

import { queryNasmRagLibrary, type RagDocumentMetadata } from './nasm-rag-knowledge-base'
import { sanitizeCoachSpeechText } from './coach-voice-synthesizer'
import {
  type AskCoachGordonRequest,
  type AskCoachGordonResponse,
  type CoachActionRecommendation,
  evaluateClinicalUrgencyTriage,
} from './ask-coach-gordon-types'

export * from './ask-coach-gordon-types'

const MASTER_COACH_SYSTEM_INSTRUCTION = `You are Coach Scott Gordon, Director of Human Performance at Gordon Athletic Advisory (GAA), a Master NASM-Certified Head Coach with over 20 years of elite athlete and executive coaching experience.

Your 8 Nuanced Persona Dimensions & Situational Ethos:
1. Deep Empathy & Compassionate Care (High EQ):
   - You deeply care about the human behind the athlete. You know busy executives, parents, and athletes balance heavy work, stress, sleep fluctuations, and life demands.
   - You listen actively, validate their feelings, and meet them where they are with warmth, respect, and zero drill-sergeant shaming.
   - Signature Philosophy: "A modified workout beats a skipped workout 100% of the time."

2. The Executive Shield (Zero-Guilt Auto-Regulation):
   - When an athlete reports high fatigue, poor sleep, or frantic travel, you NEVER lecture them. You proactively auto-regulate volume: prescribe a 25–30 min CNS recovery flush, mobility reset, and light blood-flow sets so they leave the gym feeling energized rather than depleted.

3. Client Safety First & Strict Scope of Practice (Non-Negotiable):
   - Orthopedic longevity is non-negotiable: "Earn the right to add load. Own the movement first." & "We are training for the next 20 years, not just the next 20 minutes."
   - You operate strictly within the professional scope of a Master Personal Trainer & Sports Science Consultant.
   - Zero Medical Diagnosing: You never diagnose medical pathologies or prescribe pharmaceuticals. If acute sharp pain or red flags arise, you warmly advise consulting a medical doctor or physical therapist while providing safe movement regressions.

4. Results-Driven & Super Intelligent:
   - Highly analytical, scientific, and relentless about tangible client adaptation (body composition, rotational power, muscular endurance, metabolic health).
   - Grounded in mathematical precision: Energy balance, Progressive Overload, NASM OPT™ periodization, RPE monitoring, and chrono-nutrition.

5. Quiet Authority & Radical Candor:
   - You tell athletes the honest truth with warmth and respect. You never let someone sacrifice spine or joint integrity to chase an ego-driven PR.

6. Anti-Dogma Nutrition Philosophy (Food as Fuel, Not Morality):
   - You treat food as biological information and recovery fuel, never as a moral reward or punishment. Focus on 30–40g protein pacing, strategic hydration, and guilt-free social dinners.

7. The Cool-Headed Anchor (Plateaus & Micro-Wins):
   - When clients feel discouraged or plateaued, you act as the steady, grounding presence: "Progress in human physiology isn't linear—it happens in waves." Celebrate non-scale victories (kinetic alignment, HRV rebound, movement confidence).

8. Clinical Safety, Tough Questions & Scope of Practice Hand-Off Protocol:
   - Emergency Symptoms (chest pain, syncope, inability to bear weight, severe trauma): Direct the athlete immediately to stop all activity and call 911 or go to the ER.
   - Structural Injuries / Tears / Surgeries (ACL, meniscus, disc herniation, post-op, fractures, shooting nerve pain): State clearly that diagnosing and training through structural injuries is strictly outside the scope of personal training. Direct them to an orthopedic physician / physical therapist for medical clearance and explain that Coach Scott Gordon has been flagged to coordinate care.

Your 16 Master Credentials & Curricula:
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
- Clinical Pharmacology & Weight Loss Defense Specialist — GLP-1 muscle defense, drug-nutrient chrono-separation
- Precision Meal Prep & Bodybuilding Nutrition Specialist — Protein pacing, refeeds, reverse dieting
- Facility & Space Architecture Specialist — Studio layout, executive hotel gym adaptation

Your Communication Style:
- Warm, conversational, personal, motivational, and grounded in practical sports science.
- Speak in the first person as Coach Scott Gordon having a genuine 1-on-1 coaching dialogue with your client ("I've got you", "Here's what I want you to focus on today", "Let's make this adjustment right now").
- NEVER sound like a rigid medical prescription or robotic clinical checklist. Avoid stiff bureaucratic headers like "### Directive" or "### Protocol".
- Flow naturally like a master coach standing right next to the athlete on the gym floor or talking on a live line:
  1. Acknowledge and validate what they are asking or feeling with warmth and empathy.
  2. Give clear, intuitive advice in plain English with simple biomechanical rationale.
  3. Leave them with an empowering, immediate action step and words of encouragement.
- Keep paragraphs natural, flowing, and conversational (2-3 concise paragraphs).`

/**
 * Searches the RAG library for the most relevant documents matching the question.
 */
export function retrieveRelevantRagCurricula(question: string, goal?: string, optPhase?: number): RagDocumentMetadata[] {
  const qLower = question.toLowerCase()

  // Match specific keywords
  const keywords: string[] = []
  if (qLower.includes('swap') || qLower.includes('replace') || qLower.includes('substitute')) keywords.push('substitution', 'exercise')
  if (qLower.includes('eat') || qLower.includes('meal') || qLower.includes('food') || qLower.includes('protein') || qLower.includes('macro') || qLower.includes('diet') || qLower.includes('nutrition')) keywords.push('nutrition', 'protein', 'meal')
  if (qLower.includes('back') || qLower.includes('knee') || qLower.includes('shoulder') || qLower.includes('hip') || qLower.includes('pain') || qLower.includes('tight') || qLower.includes('sore') || qLower.includes('posture')) keywords.push('corrective', 'compensation', 'inhibit', 'stretch')
  if (qLower.includes('cardio') || qLower.includes('treadmill') || qLower.includes('bike') || qLower.includes('interval') || qLower.includes('zone') || qLower.includes('bpm') || qLower.includes('rpe')) keywords.push('cardiorespiratory', 'stage', 'interval')
  if (qLower.includes('golf') || qLower.includes('swing') || qLower.includes('rotation') || qLower.includes('clubhead') || qLower.includes('drive')) keywords.push('golf', 'rotational')
  if (qLower.includes('mma') || qLower.includes('combat') || qLower.includes('boxing') || qLower.includes('strike')) keywords.push('combat', 'mma')
  if (qLower.includes('hypertrophy') || qLower.includes('muscle') || qLower.includes('pump') || qLower.includes('bodybuilding') || qLower.includes('rpe')) keywords.push('hypertrophy', 'muscular development', 'volume')
  if (qLower.includes('glp-1') || qLower.includes('glp1') || qLower.includes('semaglutide') || qLower.includes('tirzepatide') || qLower.includes('ozempic') || qLower.includes('medication')) keywords.push('pharmacology', 'glp-1', 'lean mass')
  if (qLower.includes('supplement') || qLower.includes('creatine') || qLower.includes('caffeine') || qLower.includes('whey') || qLower.includes('magnesium')) keywords.push('supplementation', 'chrono-nutrition')

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
 * Executes a live interactive consultation query with Coach Scott Gordon.
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
    recentReadinessScore = 80,
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
        : ['What should I ask my doctor/PT?', 'Message Coach Scott directly', 'How will my program be modified?'],
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

  const athleteContext = `\nAthlete Live Telemetry & Profile:
- Name: ${athleteName}, Age: ${clientAge}, Sex: ${clientSex}
- Primary Goal: ${goal}
- Current OPT™ Phase: Phase ${nasmOptPhase}
- Active Session Focus: ${currentWorkoutFocus || 'Scheduled Daily Workout'}
- Current Movement: ${currentExerciseName || 'Active Training Block'}
- Available Resistance Equipment: ${equipmentAccess.length > 0 ? equipmentAccess.join(', ') : 'Full Equipment Suite'}
- Available Cardio Equipment: ${cardioEquipmentAccess.length > 0 ? cardioEquipmentAccess.join(', ') : 'Treadmill, Bike, Outdoor Walking/Running'}
- Known Kinetic Compensations: ${kineticCompensations.length > 0 ? kineticCompensations.join(', ') : 'None Detected (Optimal Alignment)'}
- CNS Readiness Score: ${recentReadinessScore}% (${recentReadinessScore >= 75 ? 'Green Light (High Output)' : 'Moderate / Manage Volume'})`

  const conversationHistoryContext = activeConversationHistory.length > 0
    ? `\nRecent Conversation History:\n${activeConversationHistory.slice(-4).map(h => `${h.role === 'user' ? 'Athlete' : 'Coach Gordon'}: ${h.text}`).join('\n')}`
    : ''

  const fullPrompt = `${athleteContext}${ragContext}${conversationHistoryContext}

Athlete's Question:
"${question.trim()}"

Provide Coach Scott Gordon's warm, conversational response formatted naturally with markdown emphasis where helpful.`

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY

  if (apiKey) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${MASTER_COACH_SYSTEM_INSTRUCTION}\n\n${fullPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 1000,
            },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawText) {
            const spokenAudioText = sanitizeCoachSpeechText(rawText)
            const pingCheck = detectCoachPingNeed(question, rawText)
            return {
              answerMarkdown: rawText,
              spokenAudioText,
              relevantCurriculums: curriculumTitles,
              suggestedFollowUps: deriveSuggestedFollowUps(question, goal, nasmOptPhase),
              requiresCoachPing: pingCheck.requiresCoachPing,
              coachPingReason: pingCheck.reason,
            }
          }
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
        reason: `Complex situation detected (${kw}) requiring direct review by Coach Scott Gordon.`,
      }
    }
  }

  if (aLower.includes('pinged scott') || aLower.includes('flagged this') || aLower.includes('real coach scott gordon')) {
    return {
      requiresCoachPing: true,
      reason: 'Flagged for direct review by Coach Scott Gordon.',
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
  const { question, goal = 'fat_loss', nasmOptPhase = 1, currentExerciseName } = request
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
        : ['What should I ask my doctor/PT?', 'Message Coach Scott directly', 'How will my program be modified?'],
      requiresCoachPing: true,
      coachPingReason: triage.pingReason,
      isEmergency911: triage.isEmergency911,
    }
  }

  let answerMarkdown = ''
  let spokenAudioText = ''

  if (qLower.includes('swap') || qLower.includes('replace') || qLower.includes('substitute')) {
    answerMarkdown = `Hey, no problem at all! When equipment is limited or you need to switch things up, we don't let it slow your momentum down. If you can't do **${currentExerciseName || 'your current exercise'}** today, grab a set of dumbbells or even a resistance band and let's substitute with **DB Goblet Squats with a 2-second pause at the bottom**.

By adding that 2-second pause in the hole, you'll maximize muscle recruitment and get a tremendous training stimulus without needing a heavy barbell. Focus on keeping your chest proud, setting your core brace, and controlling your descent with a steady **${nasmOptPhase === 1 ? '4-second eccentric tempo' : '2-second tempo'}**.

Remember our standard: **earn the right to add load by owning the movement first**. Swap it in your workout tracker right now, lock into your tempo, and let's get after it!`
  } else if (qLower.includes('sleep') || qLower.includes('tired') || qLower.includes('red eye') || qLower.includes('red-eye') || qLower.includes('jet lag') || qLower.includes('exhausted')) {
    answerMarkdown = `I completely understand—life is busy, and balancing travel, work, and sleep fluctuations is part of being an executive athlete. 

On days when sleep was compromised, we **train smarter, not harder**. Do not try to hit personal records today. Instead, auto-regulate:
1. Keep your working weights **15 to 20% lighter** than usual.
2. Focus strictly on Phase 1 stabilization, tempo control, and clean movement patterns.
3. Drink 20 ounces of water with electrolytes right now to rehydrate your central nervous system.

You still get the win by showing up, protecting your joints, and stimulating blood flow without crushing your adrenal system. Own your tempo and let's have a crisp, safe session!`
  } else if (qLower.includes('short on time') || qLower.includes('20 min') || qLower.includes('25 min') || qLower.includes('30 min') || qLower.includes('hurry') || qLower.includes('rush') || qLower.includes('condense')) {
    answerMarkdown = `Let's make every single minute count! When you're in a time crunch, we focus on **high-density compound supersets** and trim out the auxiliary isolation work.

Here is your 20-minute express execution plan:
1. Warm up dynamically for 3 minutes (arm circles, bodyweight squats, world's greatest stretch).
2. Pair your primary lower-body movement with an upper-body pull in an antagonistic superset (e.g. Goblet Squats immediately into Dumbbell Rows).
3. Take 45 to 60 seconds rest between rounds for 3 to 4 working sets.

Lock in, keep your rest intervals sharp, and get in and out with maximum efficiency. Let's execute!`
  } else if (qLower.includes('creatine') || qLower.includes('supplement') || qLower.includes('pre-workout') || qLower.includes('pre workout') || qLower.includes('caffeine')) {
    answerMarkdown = `When it comes to supplements, we only focus on evidence-based fundamentals that genuinely support your physiology:

1. **Creatine Monohydrate**: Take **3 to 5 grams daily**. Timing does not make or break results, though post-workout with protein and carbs offers slight absorption benefits. You do not need a high-dose loading phase—consistent daily intake saturates muscle phosphocreatine stores within 3 to 4 weeks.
2. **Hydration & Electrolytes**: Aim for 16 to 24 ounces of water with sodium, potassium, and magnesium around your training window to prevent cramping and maintain intracellular volume.
3. **Pre-Workout Caffeine**: If using caffeine, keep it to 100 to 200mg taken 30 to 45 minutes before lifting, and avoid it within 8 hours of bedtime to safeguard your deep REM sleep.

Fuel with purpose, stay consistent, and let's keep building!`
  } else if (qLower.includes('posture') || qLower.includes('tech neck') || qLower.includes('rounded shoulder') || qLower.includes('forward head') || (qLower.includes('desk') && (qLower.includes('neck') || qLower.includes('posture') || qLower.includes('slouch')))) {
    answerMarkdown = `Desk posture and prolonged screen time commonly create Upper Crossed Syndrome—tight chest and upper traps paired with inhibited, dormant upper back stabilizers.

Here is our NASM corrective reset to restore your kinetic alignment:
1. **Inhibit & Lengthen**: Spend 60 seconds using a foam roller, lacrosse ball, or doorway stretch on your pectoralis minor and suboccipitals (base of the skull).
2. **Activate**: Perform 2 sets of 12 **Prone Cobras** (lying face down, retracting scapulae and rotating thumbs toward the ceiling) and 10 **Chin Tucks** to engage deep cervical stabilizers.
3. **Integrate**: During your lifting sets today, focus on keeping your shoulder blades pulled down and back into your back pockets.

Do this corrective reset daily to eliminate neck tension, open your chest, and restore your natural postural authority!`
  } else if (qLower.includes('alcohol') || qLower.includes('wine') || qLower.includes('dinner') || qLower.includes('steakhouse') || qLower.includes('restaurant')) {
    answerMarkdown = `Enjoying client dinners, social events, and good food is part of a sustainable, high-performing lifestyle. You never need to feel guilty or stress over a single meal.

Here is how we navigate it like an executive athlete:
1. **Bank Your Protein**: Prioritize lean protein (chicken, egg whites, whey) and fibrous greens during your earlier meals today to hit your 30-40g protein threshold before dinner.
2. **Hydration Buffer**: Drink a tall glass of water with electrolytes before you go, and practice the 1-to-1 rule (1 glass of water for every glass of wine or cocktail).
3. **Enjoy the Experience**: Savor your steak, enjoy your company, and tomorrow morning we get right back on our regular schedule. One meal never derails consistent long-term execution!`
  } else if (qLower.includes('click') || qLower.includes('cracking') || qLower.includes('crepitus') || qLower.includes('pop without pain')) {
    answerMarkdown = `Joint clicking or popping without any sharp pain or swelling is known as physiological crepitus, and it is usually completely harmless—often just tiny nitrogen gas bubbles moving in the synovial fluid or tendons gliding smoothly over bony landmarks.

Here is how we optimize joint mechanics:
1. Spend an extra 2 to 3 minutes on dynamic mobility and tissue warm-up (e.g. bodyweight squats with slow tempo).
2. Focus on joint tracking: ensure your knees track in line with your second and third toes on squats and lunges.
3. As long as there is zero pain, throbbing, or instability, you are cleared to train with confidence.

Stay mindful of your form, own your tempo, and let's get after it!`
  } else if (qLower.includes('eat') || qLower.includes('meal') || qLower.includes('protein') || qLower.includes('food') || qLower.includes('nutrition')) {
    answerMarkdown = `Great question! Remember, food is biological information and fuel to help your body adapt and recover—never something to feel guilty or stressed about. 

Right now after your workout, your muscles are primed for recovery. I want you to aim for **30 to 40 grams of high-quality protein**—chicken breast, wild salmon, egg whites, or a clean whey isolate shake—paired with some complex carbohydrates like sweet potatoes, jasmine rice, or oatmeal to replenish your glycogen stores.

Drink a tall 16 to 24 ounce glass of water with some electrolytes as well to restore intra-cellular hydration. Fuel your body well, enjoy your meal, and let's keep stacking these wins!`
  } else if (qLower.includes('back') || qLower.includes('knee') || qLower.includes('shoulder') || qLower.includes('tight') || qLower.includes('pain') || qLower.includes('sore')) {
    answerMarkdown = `I'm glad you brought this up. We are training for the next 20 years, not just the next 20 minutes, so we never force a lift or sacrifice joint health for ego.

Let's take 3 minutes right now to run a quick corrective reset:
1. Grab a foam roller or lacrosse ball and spend 60 seconds releasing the tight area with slow, deep diaphragmatic breaths.
2. Hold a gentle 30-second stretch (like a kneeling hip flexor or chest stretch) to lengthen tight tissue.
3. Wake up your stabilizing muscles with 10 to 12 bodyweight glute bridges or prone cobras.

If the joint still feels reactive after this reset, drop your working load by 20% today and focus purely on smooth, pain-free range of motion. Protect your spine, own your positions, and let me know how that feels!`
  } else if (qLower.includes('cardio') || qLower.includes('interval') || qLower.includes('pace') || qLower.includes('rpe')) {
    answerMarkdown = `For today's cardio, the goal is smart energy system conditioning that builds your engine without fatiguing your nervous system for lifting.

In **Phase ${nasmOptPhase}**, keep your intensity right around **${nasmOptPhase === 2 ? 'an RPE 6 to 7 during work intervals' : 'a comfortable RPE 3 to 4 steady-state pace'}**. You should be able to maintain smooth, nasal or diaphragmatic breathing and bring your heart rate back down during rest intervals.

Stay tall, keep your posture upright, and log your duration when you finish. You're doing outstanding work—let's bring it home!`
  } else if (qLower.includes('golf') || qLower.includes('rotational') || qLower.includes('swing')) {
    answerMarkdown = `To add effortless clubhead speed without beating up your lower back, the secret is making sure that rotation comes from the right joints. We want rotation happening through your **thoracic spine and hips**, while your lumbar spine stays rock solid like an anchor.

Try hitting standing cable woodchops or rotational medicine ball scoop tosses. Focus on pushing hard into the ground through your back leg, pivoting your trail foot, and transferring that ground force right through your core.

Give me 3 crisp sets of 8 reps per side with explosive intent, and let's build that rotational power!`
  } else {
    answerMarkdown = `I'm right here in your corner. In **Phase ${nasmOptPhase} (${goal.replace('_', ' ')})**, our main focus is dialing in movement quality and progressive adaptation.

Remember our golden rule: **earn the right to add load by owning the movement first**. Keep your deep core braced, control your tempo on the way down, and keep your effort dialed right into your target RPE.

Make sure you hydrate post-workout and prioritize high-quality sleep tonight. You've got everything you need—let's lock in and execute!`
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
export function deriveRecommendedAction(qLower: string, currentExerciseName?: string): CoachActionRecommendation | undefined {
  if (qLower.includes('swap') || qLower.includes('replace') || qLower.includes('substitute')) {
    const target = currentExerciseName ? `an alternative to ${currentExerciseName}` : 'DB Goblet Squats'
    return {
      type: 'swap_exercise',
      targetExerciseName: target,
      buttonText: `Swap to ${target} in Workout`,
    }
  }
  if (qLower.includes('rest') || qLower.includes('timer') || qLower.includes('interval') || qLower.includes('heavy set')) {
    return {
      type: 'start_timer',
      restSeconds: 90,
      buttonText: 'Start 90s Rest Timer (Spoken in Earbuds)',
    }
  }
  if (qLower.includes('sleep') || qLower.includes('tired') || qLower.includes('red eye') || qLower.includes('jet lag')) {
    return {
      type: 'auto_regulate_load',
      loadReductionPercent: 15,
      buttonText: 'Auto-Regulate: Drop Working Weight 15%',
    }
  }
  if (qLower.includes('form') || qLower.includes('video') || qLower.includes('check my') || qLower.includes('depth')) {
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
