/**
 * Gordon Athletic Advisory — Master NASM AI Head Coach & Periodization Architect
 * 
 * Persona: 20+ years of high-performance Master Personal Training experience, Master NASM-CPT, PES, CES.
 * Specialization: NASM Optimum Performance Training (OPT™) periodization (Phases 1 through 5).
 * Exercise Catalog: Strictly constrained to Official NASM Edge exercises with 100% CDN video & image demo attachment.
 * Equipment Intelligence: Validates client equipment at prompt time and runs a secondary post-generation validation check with automated biomechanical substitutions.
 * Complete Program Architecture: Full-spectrum Warmup (SMR, Static/Dynamic Stretch, Core/Balance), Resistance, Cooldown, and Tanaka Cardio Stage Training.
 */

import { NASM_EDGE_OFFICIAL_CATALOG, enrichExerciseMedia } from './nasm-exercise-video-catalog'
import { queryNasmRagLibrary } from './nasm-rag-knowledge-base'
import { generateRagNasmProgram, type GeneratedMacrocyclePlan } from './rag-nasm-program-generator'
import { doesExerciseMatchEquipment, parseEquipmentCapabilities } from './nasm-equipment-detector'
import { calculateCardioZones } from './nasm-cardio-stage-engine'
import { validateAndEnforceNasmOptGuardrails, substituteMissingEquipment } from './nasm-opt-guardrails'
import { checkExerciseContraindications } from './liability-shield'
import { parseInjuriesFromText } from './sports-injuries'

export interface GeminiCoachGenerationRequest {
  clientName?: string
  clientAge?: number
  clientSex?: 'male' | 'female'
  goal: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness' | 'strength'
  targetNasmPhase?: number // 1, 2, 3, 4, or 5
  trainingDaysPerWeek?: number // 2, 3, 4, 5, or 6
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  equipmentAccess?: string[]
  knownBenchmarks?: Record<string, { weightLbs: number; reps: number }>
  kineticCompensations?: string[] // e.g. ['knees_cave_in', 'excessive_forward_lean', 'arms_fall_forward']
  cardioBlendStyle?: 'integrated_finishers' | 'dedicated_conditioning' | 'minimal_flush' | 'none'
  coachGuidanceNotes?: string
  contraindicationTags?: string[]
  injuriesLimitations?: string
}

export const MASTER_NASM_COACH_SYSTEM_PROMPT = `You are Coach Scott Gordon, Director of Human Performance at Gordon Athletic Advisory (GAA), a Master NASM-Certified Head Coach and Periodization Architect with over 20 years of elite personal training and sports science experience.

Your Coaching Personality, Philosophy & Ethos:
1. Deep Empathy & Compassionate Care:
   - You genuinely understand the human behind the athlete. You know high-performing executives, busy parents, and athletes balance heavy work, stress, sleep fluctuations, and life demands.
   - You listen actively, validate their feelings, and meet them exactly where they are with warmth, respect, and zero judgment or drill-sergeant shaming.
   - You build sustainable habits and long-term momentum through positive reinforcement and unwavering belief in their potential.

2. Client Safety & Strict Scope of Practice (Non-Negotiable):
   - Client longevity and orthopedic health are paramount. Never sacrifice movement quality or joint integrity for ego lifting.
   - You operate strictly within the professional scope of practice of a Master Personal Trainer and Sports Science Consultant.
   - Zero Medical Diagnosing: You never diagnose medical conditions or prescribe pharmaceuticals. If acute sharp pain, numbness, or injury red flags arise, you immediately recommend consulting a physician or licensed physical therapist.

3. Results-Driven & Super Intelligent:
   - Highly analytical, scientific, and relentless about tangible client results (body recomposition, rotational power, muscular endurance, metabolic health).
   - Grounded in mathematical precision: Energy balance, Progressive Overload, NASM OPT™ periodization, RPE monitoring, and chrono-nutrition.

4. Highly Motivational & Master People Skills:
   - High emotional intelligence (EQ). You know when an athlete needs a compassionate deload or an energizing rally cry.
   - You translate advanced sports science into intuitive, empowering, actionable coaching cues that make clients feel capable and unstoppable.

Your 16 Master Credentials & Clinical Specializations:
- Master Certified Personal Trainer (NASM-Master CPT)
- Performance Enhancement Specialist (NASM-PES) — Olympic lifting, SAQ, Rate of Force Development (RFD)
- Corrective Exercise Specialist (NASM-CES) — 4-Step Corrective Continuum (Inhibit, Lengthen, Activate, Integrate)
- Certified Nutrition Coach (NASM-CNC) — Energy balance, macronutrient periodization, chrono-nutrition
- Physique & Bodybuilding Coach (NASM-PBC) — Hypertrophy biomechanics, volume landmarks (MEV/MAV/MRV), mechanical tension
- Behavior Change Specialist (NASM-BCS) — Transtheoretical Stages of Change, cognitive reframing, habit architecture
- Weight Loss Specialist (NASM-WLS) — Metabolic adaptation, NEAT optimization, lean tissue preservation
- Cardiorespiratory Conditioning Specialist (NASM-CATM) — Tanaka HR zones, Stage 1–3 intervals, EPOC elevation
- Combat Sports & MMA Conditioning Specialist (NASM-MMACS) — Tri-planar energy systems, rotational power, neck/core armor
- Golf Fitness Specialist (NASM-GFS) — Rotational biomechanics, X-Factor stretch, ground reaction force transfer
- Clinical Pharmacology & Weight Loss Defense Specialist — GLP-1 lean-mass preservation, drug-nutrient chrono-separation
- Precision Meal Prep & Bodybuilding Nutrition Specialist — Protein pacing, contest prep refeeds, reverse dieting
- Facility & Space Architecture Specialist — Biomechanical studio layout, executive travel adaptation

Your Core Directives & Program Design Philosophy:
1. OPT™ Model Periodization:
   - Phase 1 (Stabilization Endurance): Focus on neuromuscular efficiency, proprioceptive challenge, 4/2/1 tempo, 12-20 reps, 1-3 sets, 0-90s rest.
   - Phase 2 (Strength Endurance): Superset contrast pairing a stable strength exercise (2/0/2 tempo, 8-12 reps) with a biomechanically similar stabilization exercise (4/2/1 tempo, 8-12 reps), 2-4 sets, 0-60s rest.
   - Phase 3 (Muscular Development / Hypertrophy): Mechanical tension and volume, 2/0/2 tempo, 6-12 reps, 3-5 sets, 75-85% 1RM, 0-60s rest.
   - Phase 4 (Maximal Strength): High motor unit recruitment, 1/1/1 or 2/0/2 tempo, 1-5 reps, 4-6 sets, 85-100% 1RM, 2-4 min rest.
   - Phase 5 (Power): Explosive post-activation potentiation (PAP) contrast: High-load strength lift (1-5 reps, 85-100% 1RM) immediately superset with explosive lightweight/bodyweight movement (X/0/X tempo, 8-10 reps), 3-5 sets, 1-2 min rest.

2. KINETIC CHAIN & CORRECTIVE EXERCISE (CES & GFS):
   - Screen for postural distortions (Lower Crossed, Upper Crossed, Pronation Distortion, thoracic restriction).
   - Dynamically inject 4-step CEx progressions: Inhibit (SMR), Lengthen (Static/Dynamic Stretch), Activate (Isolated Core/Gluteus Medius), and Integrate (Multiplanar Movements).

3. PHYSIQUE ARCHITECTURE & HYPERTROPHY BIOMECHANICS (PBC):
   - Target optimal volume landmarks (MEV to MRV) and maximize mechanical tension across full active range of motion.
   - Prescribe controlled eccentric tempos (2–4s) to stimulate myofibrillar protein synthesis.

4. EQUIPMENT-RESTRICTED CARDIO & ENERGY SYSTEM CONDITIONING (CATM & MMACS):
   - Prescribe Tanaka Heart Rate Stage intervals (Stage 1 Aerobic Base, Stage 2 Lactate Threshold 1:2, Stage 3 Anaerobic Power 1:3).
   - Strictly restrict modalities to equipment the client possesses (Treadmill, Bike, Rower, AirBike, Elliptical, Stairmaster, or Outdoor/Bodyweight).

5. STRICT NASM EDGE EXERCISE CATALOG & EQUIPMENT VALIDATION:
   - You ONLY select authentic exercises from the provided Allowed Official NASM Edge Exercise Library.
   - You NEVER prescribe exercises requiring equipment the client does not have.
   - Every single exercise name in your output MUST be an exact string match from the allowed list.

6. Output Format:
   - Return clean JSON strictly adhering to the GeneratedMacrocyclePlan structure.`

/**
 * Filters the 272 verified official NASM Edge exercises down to those executable
 * with the client's specific equipment access.
 */
export function filterNasmEdgeCatalogByEquipment(equipmentAccess?: string[]): string[] {
  const allExerciseNames = Object.keys(NASM_EDGE_OFFICIAL_CATALOG)
  if (!equipmentAccess || equipmentAccess.length === 0) return allExerciseNames
  return allExerciseNames.filter(name => doesExerciseMatchEquipment({ name }, equipmentAccess))
}

/**
 * Secondary Validation Pass: Verifies that every exercise in the generated plan
 * is 100% compliant with the client's available equipment. If any exercise requires
 * missing equipment, it automatically substitutes a biomechanically equivalent, verified NASM Edge movement.
 */
export function validateAndEnforceEquipmentConstraints(
  plan: GeneratedMacrocyclePlan,
  equipmentAccess?: string[],
  contraindicationTags?: string[],
  injuriesLimitations?: string | null
): GeneratedMacrocyclePlan {
  if (!plan || !Array.isArray(plan.workouts)) return plan

  const caps = equipmentAccess && equipmentAccess.length > 0
    ? parseEquipmentCapabilities(equipmentAccess)
    : null

  const detected = parseInjuriesFromText(injuriesLimitations)
  const allContraTags = Array.from(
    new Set([...(contraindicationTags || []), ...detected.selectedInjuryIds])
  )

  for (const workout of plan.workouts) {
    if (!Array.isArray(workout.exercises)) continue

    for (const ex of workout.exercises) {
      if (caps && !caps.isFullGym && !doesExerciseMatchEquipment({ name: ex.name }, caps)) {
        const repairs: string[] = []
        ex.name = substituteMissingEquipment(ex.name, equipmentAccess || [], repairs)
      }

      // Re-apply biomechanical contraindications shield to prevent any equipment substitution from introducing an unsafe movement
      if (allContraTags.length > 0) {
        const contraCheck = checkExerciseContraindications(ex.name, allContraTags)
        if (contraCheck.isContraindicated && contraCheck.replacement) {
          const original = ex.name
          ex.name = contraCheck.replacement
          ex.contraindicationReplacedFrom = original
          if (contraCheck.coachingCue) {
            ex.coachingCues = [
              `🛡️ Injury Protection Shield: Replaced "${original}" (${contraCheck.ruleLabel || 'Medical Safety'})`,
              contraCheck.coachingCue,
              ...(ex.coachingCues || []),
            ]
          }
        }
      }
    }
  }

  return plan
}

/**
 * Enriches every exercise in a workout plan with verified official NASM Edge CDN video URLs,
 * privacy-enhanced embed player URLs, and high-resolution CDN thumbnail images.
 */
export function enrichPlanWithNasmCdnMedia(plan: GeneratedMacrocyclePlan): GeneratedMacrocyclePlan {
  if (!plan || !Array.isArray(plan.workouts)) return plan

  for (const workout of plan.workouts) {
    if (!Array.isArray(workout.exercises)) continue
    workout.exercises = workout.exercises.map(exercise => enrichExerciseMedia(exercise))
  }
  return plan
}

/**
 * Calls the Gemini API using the Master NASM AI Head Coach Persona to generate
 * an authentic, periodized OPT™ training program with 100% official NASM Edge exercises,
 * equipment validation, and cardio/warmup/cooldown integration.
 */
export async function generateMasterNasmOptProgram(
  request: GeminiCoachGenerationRequest
): Promise<GeneratedMacrocyclePlan> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY

  const targetPhase = request.targetNasmPhase || (request.goal === 'hypertrophy' ? 3 : request.goal === 'performance' ? 5 : request.goal === 'strength' ? 4 : 1)
  const ragGoal = request.goal === 'hypertrophy' ? 'hypertrophy' : (request.goal === 'performance' || request.goal === 'strength') ? 'performance' : 'fat_loss'
  const citedDocs = queryNasmRagLibrary({
    goal: ragGoal,
    nasmOptPhase: targetPhase,
  })

  // If no Gemini API key is configured, execute deterministic RAG generation with equipment validation & CDN enrichment
  if (!apiKey) {
    const ragPlan = generateRagNasmProgram({
      clientName: request.clientName,
      clientAge: request.clientAge,
      clientSex: request.clientSex,
      goal: request.goal === 'strength' ? 'performance' : request.goal,
      targetNasmPhase: targetPhase,
      trainingDaysPerWeek: request.trainingDaysPerWeek ?? 4,
      experienceLevel: request.experienceLevel,
      equipmentAccess: request.equipmentAccess,
      knownBenchmarks: request.knownBenchmarks,
      kineticCompensations: request.kineticCompensations,
      cardioBlendStyle: request.cardioBlendStyle,
      contraindicationTags: request.contraindicationTags,
      injuriesLimitations: request.injuriesLimitations,
    })
    const validated = validateAndEnforceEquipmentConstraints(
      ragPlan,
      request.equipmentAccess,
      request.contraindicationTags,
      request.injuriesLimitations
    )
    return enrichPlanWithNasmCdnMedia(validated)
  }

  // 1. Filter allowed NASM Edge exercises strictly by available client equipment
  const allowedNasmExercises = filterNasmEdgeCatalogByEquipment(request.equipmentAccess)
  const cardioZones = calculateCardioZones(request.clientAge || 35)

  const promptContent = `Client Training Profile:
- Name: ${request.clientName || 'Client'}
- Age: ${request.clientAge || 35} | Sex: ${request.clientSex || 'Unspecified'}
- Primary Goal: ${request.goal.toUpperCase()}
- Target NASM OPT Phase: Phase ${targetPhase} (${targetPhase === 1 ? 'Stabilization Endurance' : targetPhase === 2 ? 'Strength Endurance' : targetPhase === 3 ? 'Muscular Development / Hypertrophy' : targetPhase === 4 ? 'Maximal Strength' : 'Power'})
- Training Frequency: ${request.trainingDaysPerWeek || 4} days per week
- Experience Level: ${request.experienceLevel || 'intermediate'}
- Available Equipment: ${(request.equipmentAccess || ['Full Commercial Gym']).join(', ')}
- Kinetic Compensations / Movement Screen: ${(request.kineticCompensations || ['None observed']).join(', ')}
${request.injuriesLimitations ? `- Clinical Sports Injuries & Limitations: ${request.injuriesLimitations}\n` : ''}${request.contraindicationTags && request.contraindicationTags.length > 0 ? `- Biomechanical Contraindication Tags: ${request.contraindicationTags.join(', ')}\n` : ''}- Cardiorespiratory Tanaka Target Zones: Zone 1 (${cardioZones.zone1.minBpm}-${cardioZones.zone1.maxBpm} BPM), Zone 2 (${cardioZones.zone2.minBpm}-${cardioZones.zone2.maxBpm} BPM), Zone 3 (${cardioZones.zone3.minBpm}-${cardioZones.zone3.maxBpm} BPM)
- Cardiorespiratory Blend Style: ${request.cardioBlendStyle || 'integrated_finishers'}
- Additional Coach Notes: ${request.coachGuidanceNotes || 'Optimize for strict OPT periodization, joint longevity, and neuromuscular control.'}

RAG Sports Science Context:
${citedDocs.map(d => `[${d.title}]: ${d.summary} (Key concepts: ${d.keyConcepts.join(', ')})`).join('\n')}

STRICT EXERCISE & EQUIPMENT SELECTION INSTRUCTION:
You MUST design each workout day by selecting EXCLUSIVELY from the Allowed Official NASM Edge Exercise list below. Do NOT prescribe any movement outside this list or requiring equipment the client does not have.

ALLOWED OFFICIAL NASM EDGE EXERCISE LIST FOR THIS CLIENT (${allowedNasmExercises.length} VERIFIED MOVEMENTS):
${allowedNasmExercises.join(', ')}

OPT MODEL WORKOUT DESIGN REQUIREMENTS:
Each workout day in the 'workouts' array must contain:
1. Warmup SMR (block: 'warmup', 1 set, 30-60s hold on tender spots from allowed list)
2. Warmup Dynamic/Static (block: 'warmup', 1-2 sets, 10 reps or 30s holds from allowed list)
3. Core (block: 'core', 2-3 sets, 12-20 reps @ 4/2/1 tempo from allowed list)
4. Balance (block: 'balance', 2-3 sets, 8-12 reps per leg @ 4/2/1 tempo from allowed list)
5. Resistance Training (block: 'resistance', phase-appropriate sets, reps, and tempo from allowed list):
   - Phase 1: 1-3 sets, 12-20 reps @ 4/2/1 tempo, 0-90s rest, high proprioceptive instability.
   - Phase 2: 2-4 superset pairs (Stable strength lift @ 2/0/2 tempo, 8-12 reps paired immediately with biomechanically similar stabilization lift @ 4/2/1 tempo, 8-12 reps).
   - Phase 3: 3-5 sets, 6-12 reps @ 2/0/2 tempo, 75-85% 1RM, 0-60s rest.
   - Phase 4: 4-6 sets, 1-5 reps @ 1/1/1 or 2/0/2 tempo, 85-100% 1RM, 2-4 min rest.
   - Phase 5: 3-5 superset pairs (Heavy strength lift 1-5 reps @ 85-100% 1RM superset with explosive movement @ X/0/X tempo, 8-10 reps).
6. Cooldown (block: 'cooldown', SMR + Static Stretching from allowed list).
7. Integrated Cardio Protocol ('cardioProtocol' object on each workout day with title, stage: 1|2|3, stageName, targetZone, durationMins, workRestRatio, recommendedModalities, coachingCues).

Generate a complete 4-week OPT™ periodized macrocycle split. Return as valid JSON matching the GeneratedMacrocyclePlan interface with fields:
- planTitle (string)
- primaryGoal (string)
- nasmOptPhase (number: ${targetPhase})
- phaseName (string)
- totalWeeks (number: 4)
- sessionsPerWeek (number: ${request.trainingDaysPerWeek || 4})
- ragSourcesCited (string[])
- strengthCardioBlendSummary (object with goal, blendRatio, strengthPct, cardioPct, weeklyStrengthSessions, weeklyCardioMinutes, primaryCardioStages, interferenceShieldStrategy, clinicalGuideline)
- workouts (array of GeneratedWorkoutDay objects each with day, dayName, focus, nasmOptPhase, phaseName, estimatedDurationMins, warmupProtocol { inhibitSmr, lengthenStaticStretch, activateDynamic }, exercises [ { block, name, sets, reps, tempo, rest, coachingCues, nasmClinicalSource } ], cardioProtocol, dailyPeriodizationMemo)
- periodizationWeeklyMemos (string[4])`

  const configuredModel = process.env.GEMINI_MODEL?.trim()
  const modelsToTry = [
    ...(configuredModel ? [configuredModel] : []),
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ]
  let rawText: string | null = null

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: MASTER_NASM_COACH_SYSTEM_PROMPT }],
            },
            contents: [{ parts: [{ text: promptContent }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.3,
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) break
      } else {
        console.warn(`Gemini model ${model} returned status ${response.status}. Trying fallback model...`)
      }
    } catch (modelErr) {
      console.warn(`Gemini model ${model} failed:`, modelErr)
    }
  }

  try {
    if (!rawText) {
      throw new Error('Gemini API call returned empty output or all models failed')
    }

    const parsedPlan = JSON.parse(rawText) as GeneratedMacrocyclePlan
    if (!parsedPlan || !Array.isArray(parsedPlan.workouts) || parsedPlan.workouts.length === 0) {
      throw new Error('Gemini generated an invalid plan structure')
    }

    // 2. Strict Deterministic Guardrail Pipeline: Enforce Phase constraints, equipment isolation, and correctives
    const { sanitizedPlan } = validateAndEnforceNasmOptGuardrails(parsedPlan, {
      equipmentAccess: request.equipmentAccess,
      kineticCompensations: request.kineticCompensations,
      targetPhase,
    })

    const validated = validateAndEnforceEquipmentConstraints(
      sanitizedPlan,
      request.equipmentAccess,
      request.contraindicationTags,
      request.injuriesLimitations
    )

    // 3. Media enrichment: attach 100% official NASM CDN video URLs, embeds, and thumbnails
    return enrichPlanWithNasmCdnMedia(validated)
  } catch (error) {
    console.error('Error in Master NASM Coach Gemini generation, falling back to deterministic RAG:', error)
    const fallbackPlan = generateRagNasmProgram({
      clientName: request.clientName,
      clientAge: request.clientAge,
      clientSex: request.clientSex,
      goal: request.goal === 'strength' ? 'performance' : request.goal,
      targetNasmPhase: targetPhase,
      trainingDaysPerWeek: request.trainingDaysPerWeek ?? 4,
      experienceLevel: request.experienceLevel,
      equipmentAccess: request.equipmentAccess,
      knownBenchmarks: request.knownBenchmarks,
      kineticCompensations: request.kineticCompensations,
      cardioBlendStyle: request.cardioBlendStyle,
      contraindicationTags: request.contraindicationTags,
      injuriesLimitations: request.injuriesLimitations,
    })
    const { sanitizedPlan: sanitizedFallback } = validateAndEnforceNasmOptGuardrails(fallbackPlan, {
      equipmentAccess: request.equipmentAccess,
      kineticCompensations: request.kineticCompensations,
      targetPhase,
    })
    const validatedFallback = validateAndEnforceEquipmentConstraints(
      sanitizedFallback,
      request.equipmentAccess,
      request.contraindicationTags,
      request.injuriesLimitations
    )
    return enrichPlanWithNasmCdnMedia(validatedFallback)
  }
}
