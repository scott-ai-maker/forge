/**
 * Forge Athletic — Master NASM AI Head Coach & Periodization Architect
 * 
 * Persona: 20+ years of high-performance Master Personal Training experience, Master NASM-CPT, PES, CES.
 * Specialization: NASM Optimum Performance Training (OPT™) periodization (Phases 1 through 5).
 * Exercise Catalog: Strictly constrained to Official NASM Edge exercises with 100% CDN video & image demo attachment.
 * Equipment Intelligence: Validates client equipment at prompt time and runs a secondary post-generation validation check with automated biomechanical substitutions.
 * Complete Program Architecture: Full-spectrum Warmup (SMR, Static/Dynamic Stretch, Core/Balance), Resistance, Cooldown, and Tanaka Cardio Stage Training.
 */

import { NASM_EDGE_OFFICIAL_CATALOG, enrichExerciseMedia } from './nasm-exercise-video-catalog'
import { queryNasmRagLibrary } from './nasm-rag-knowledge-base'
import {
  generateRagNasmProgram,
  type GeneratedMacrocyclePlan,
  type GeneratedWorkoutDay,
  type GeneratedExerciseItem,
} from './rag-nasm-program-generator'
import { doesExerciseMatchEquipment, parseEquipmentCapabilities } from './nasm-equipment-detector'
import { calculateCardioZones } from './nasm-cardio-stage-engine'
import {
  validateAndEnforceNasmOptGuardrails,
  substituteMissingEquipment,
  enforcePhaseExerciseConstraints,
} from './nasm-opt-guardrails'
import { checkExerciseContraindications } from './liability-shield'
import { parseInjuriesFromText } from './sports-injuries'
import { personalizePlan, type PersonalizationContext } from './program-personalization'

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
  hasHeartMedications?: boolean
}

export const MASTER_NASM_COACH_SYSTEM_PROMPT = `You are Coach Gordon, Director of Human Performance at Forge Athletic, a Master NASM-Certified Head Coach and Periodization Architect with over 20 years of elite personal training and sports science experience.

Your Coaching Personality, Philosophy & Ethos:
1. Deep Empathy & Compassionate Care:
   - You genuinely understand the human behind the athlete. You meet them exactly where they are with warmth, respect, and zero judgment or drill-sergeant shaming.
   - You build sustainable habits and long-term momentum through positive reinforcement and unwavering belief in their potential.

2. Client Safety & Strict Scope of Practice (Non-Negotiable):
   - Client longevity and orthopedic health are paramount. Never sacrifice movement quality or joint integrity for ego lifting.
   - You operate strictly within the professional scope of practice of a Master Personal Trainer and Sports Science Consultant.
   - Zero Medical Diagnosing: You never diagnose medical conditions or prescribe pharmaceuticals. If acute sharp pain or injury red flags arise, you recommend consulting a physician or licensed physical therapist.

3. Results-Driven & Super Intelligent:
   - Highly analytical, scientific, and relentless about tangible client results (body recomposition, rotational power, muscular endurance, metabolic health).
   - Grounded in mathematical precision: Energy balance, Progressive Overload, NASM OPT™ periodization, and RPE monitoring.

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

2. KINETIC CHAIN & CORRECTIVE EXERCISE (CES):
   - Screen for postural distortions (Lower Crossed, Upper Crossed, Pronation Distortion, thoracic restriction).
   - Dynamically inject 4-step CEx progressions: Inhibit (SMR), Lengthen (Static/Dynamic Stretch), Activate (Isolated Core/Gluteus Medius), and Integrate (Multiplanar Movements).

3. STRICT NASM EDGE EXERCISE CATALOG & EQUIPMENT VALIDATION:
   - You ONLY select authentic exercises from the provided Allowed Official NASM Edge Exercise Library.
   - You NEVER prescribe exercises requiring equipment the client does not have.
   - Every single exercise name in your output MUST be an exact string match from the allowed list.

4. Output Format:
   - Return clean JSON strictly adhering to the GeneratedMacrocyclePlan structure.`

/**
 * Builds an authentic, high-EQ Master Coach Gordon Briefing Memo written in Coach Gordon's voice.
 */
export function buildDeterministicMasterCoachMemo(
  request: GeminiCoachGenerationRequest,
  targetPhase: number,
  _planTitle: string
): string {
  const firstName = (request.clientName || 'Athlete').trim().split(' ')[0]

  const lines: string[] = [
    'COACH GORDON MASTER BRIEFING MEMO:',
    `${firstName}, welcome to your custom Forge Athletic performance protocol!`,
    `I designed every single variable in this routine around your baseline capabilities, orthopedic profile, and NASM OPT™ periodization to ensure sustainable progress, joint longevity, and measurable results.`,
    '',
    `Here is your clinical program architecture:`,
  ]

  // 1. Postural & Desk Sitting Reversal
  if (
    (request.injuriesLimitations || '').toLowerCase().includes('desk') ||
    (request.injuriesLimitations || '').toLowerCase().includes('sedentary') ||
    (request.injuriesLimitations || '').toLowerCase().includes('engineer')
  ) {
    lines.push(
      `1. POSTURE & SITTING REVERSAL:`,
      `To counteract postural stress from prolonged sitting, our clinical focus includes opening anterior structures (tight pectorals and hip flexors) and activating posterior chain stabilizers (gluteal complex, rhomboids, deep core).`
    )
  }

  // 2. Orthopedic Safeguards & Injuries
  if (request.injuriesLimitations || (request.contraindicationTags && request.contraindicationTags.length > 0)) {
    const injuryText = request.injuriesLimitations || request.contraindicationTags?.join(', ') || ''
    lines.push(
      `ORTHOPEDIC SHIELD & JOINT PROTECTION:`,
      `We have implemented strict clinical safeguards around: ${injuryText}. Every movement is selected to avoid shear stress and protect your connective tissue while fortifying your stabilizing architecture.`
    )
  }

  // 3. OPT Phase Methodology
  lines.push(
    `NASM OPT™ PHASE ${targetPhase} METHODOLOGY:`,
    targetPhase === 1
      ? `We utilize Phase 1 Stabilization Endurance with a controlled 4/2/1 tempo (4 seconds eccentric, 2-second isometric stabilization hold, and 1 smooth second concentric). You do not need to lift heavy weights to see incredible changes—this controlled tempo activates stabilizing musculature and optimizes neuromuscular efficiency.`
      : targetPhase === 2
        ? `We utilize Phase 2 Strength Endurance with contrast supersets: pairing a stable strength lift (2/0/2 tempo) immediately with a biomechanically similar stabilization lift (4/2/1 tempo). This doubles muscular endurance, spikes metabolic expenditure, and preserves joint integrity.`
        : targetPhase === 3
          ? `We utilize Phase 3 Muscular Development with 2/0/2 tempos and 75-85% 1RM mechanical tension across optimal volume landmarks to stimulate hypertrophy and myofibrillar protein synthesis.`
          : targetPhase === 4
            ? `We utilize Phase 4 Maximal Strength with 85-100% 1RM loads to maximize high-threshold motor unit recruitment.`
            : `We utilize Phase 5 Power with Post-Activation Potentiation (PAP) contrast supersets: pairing heavy strength anchors with explosive lightweight movements at X/0/X tempo.`
  )

  // Closing
  lines.push(
    `Consistency is your only requirement. Own your tempo, trust the process, and let's get after it. I'm right here in your corner!`
  )

  return lines.join('\n\n')
}

/**
 * Filters the 272 verified official NASM Edge exercises down to those executable
 * with the client's specific equipment access.
 */
export function filterNasmEdgeCatalogByEquipment(
  equipmentAccess?: string[]
): string[] {
  const allExerciseNames = Object.keys(NASM_EDGE_OFFICIAL_CATALOG)
  return !equipmentAccess || equipmentAccess.length === 0
    ? allExerciseNames
    : allExerciseNames.filter(name => doesExerciseMatchEquipment({ name }, equipmentAccess))
}

/**
 * Secondary Validation Pass: Verifies that every exercise in the generated plan
 * is 100% compliant with the client's available equipment and contraindications.
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
    const workoutPhase = workout.nasmOptPhase || plan.nasmOptPhase || 1

    for (let i = 0; i < workout.exercises.length; i++) {
      const ex = workout.exercises[i]

      // 1. Missing equipment repair
      if (caps && !caps.isFullGym && !doesExerciseMatchEquipment({ name: ex.name }, caps)) {
        const repairs: string[] = []
        ex.name = substituteMissingEquipment(ex.name, equipmentAccess || [], repairs)
      }

      // 2. Biomechanical contraindications shield
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

      // 3. Secondary Equipment Re-check:
      if (caps && !caps.isFullGym && !doesExerciseMatchEquipment({ name: ex.name }, caps)) {
        const repairs: string[] = []
        ex.name = substituteMissingEquipment(ex.name, equipmentAccess || [], repairs)
      }

      // 4. Normalization & Tempo Compatibility Engine:
      const repairs: string[] = []
      workout.exercises[i] = enforcePhaseExerciseConstraints(ex, workoutPhase, repairs)
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
 * Normalizes raw string/array inputs safely into string arrays.
 */
function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map(item => typeof item === 'string' ? item.trim() : String(item ?? '')).filter(Boolean)
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return []
    if (trimmed.includes(';') || trimmed.includes('\n')) {
      return trimmed.split(/[;\n]+/).map(s => s.trim()).filter(Boolean)
    }
    return [trimmed]
  }
  return []
}

/**
 * Normalizes raw Gemini or external JSON into a strictly conforming GeneratedMacrocyclePlan structure.
 * Guarantees warmup protocols, coaching cues, and exercise arrays adhere to expected types.
 */
export function normalizeGeneratedPlan(plan: any): GeneratedMacrocyclePlan {
  if (!plan || typeof plan !== 'object') {
    throw new Error('Generated plan is not a valid object')
  }

  const workouts: GeneratedWorkoutDay[] = Array.isArray(plan.workouts)
    ? plan.workouts.map((w: any, idx: number) => {
        const warmup = w.warmupProtocol || {}
        const rawExercises = Array.isArray(w.exercises) ? w.exercises : []
        const exercises: GeneratedExerciseItem[] = rawExercises.map((ex: any) => ({
          block: (ex.block === 'warmup' || ex.block === 'core_balance' || ex.block === 'saq' || ex.block === 'resistance' || ex.block === 'cooldown')
            ? ex.block
            : 'resistance',
          name: String(ex.name || 'Exercise'),
          sets: String(ex.sets || '3'),
          reps: String(ex.reps || '10-12'),
          tempo: String(ex.tempo || '2/0/2'),
          rest: String(ex.rest || '60s'),
          intensityPercentage1RM: typeof ex.intensityPercentage1RM === 'number' ? ex.intensityPercentage1RM : undefined,
          targetLoadLbs: typeof ex.targetLoadLbs === 'number' ? ex.targetLoadLbs : undefined,
          supersetPairWith: ex.supersetPairWith ? String(ex.supersetPairWith) : undefined,
          coachingCues: toStringArray(ex.coachingCues),
          nasmClinicalSource: String(ex.nasmClinicalSource || 'NASM Essentials of Personal Fitness Training'),
          whyForYou: ex.whyForYou ? String(ex.whyForYou) : undefined,
          imageUrl: ex.imageUrl ?? null,
          videoUrl: ex.videoUrl ?? null,
          embedUrl: ex.embedUrl ?? null,
          contraindicationReplacedFrom: ex.contraindicationReplacedFrom ? String(ex.contraindicationReplacedFrom) : undefined,
        }))

        return {
          day: typeof w.day === 'number' ? w.day : idx + 1,
          dayName: String(w.dayName || `Day ${idx + 1}`),
          focus: String(w.focus || 'Full Body Stabilization'),
          nasmOptPhase: typeof w.nasmOptPhase === 'number' ? w.nasmOptPhase : (plan.nasmOptPhase || 1),
          phaseName: String(w.phaseName || plan.phaseName || 'Stabilization Endurance'),
          estimatedDurationMins: typeof w.estimatedDurationMins === 'number' ? w.estimatedDurationMins : 45,
          warmupProtocol: {
            inhibitSmr: toStringArray(warmup.inhibitSmr),
            lengthenStaticStretch: toStringArray(warmup.lengthenStaticStretch),
            activateDynamic: toStringArray(warmup.activateDynamic),
          },
          exercises,
          cardioProtocol: w.cardioProtocol ? {
            ...w.cardioProtocol,
            coachingCues: toStringArray(w.cardioProtocol.coachingCues),
            recommendedModalities: toStringArray(w.cardioProtocol.recommendedModalities),
          } : undefined,
          dailyPeriodizationMemo: String(w.dailyPeriodizationMemo || ''),
        }
      })
    : []

  return {
    ...plan,
    planTitle: String(plan.planTitle || 'Forge Athletic Periodized Macrocycle'),
    primaryGoal: String(plan.primaryGoal || 'general_fitness'),
    nasmOptPhase: typeof plan.nasmOptPhase === 'number' ? plan.nasmOptPhase : 1,
    phaseName: String(plan.phaseName || 'Stabilization Endurance'),
    totalWeeks: typeof plan.totalWeeks === 'number' ? plan.totalWeeks : 4,
    sessionsPerWeek: typeof plan.sessionsPerWeek === 'number' ? plan.sessionsPerWeek : (workouts.length || 4),
    ragSourcesCited: toStringArray(plan.ragSourcesCited),
    periodizationWeeklyMemos: toStringArray(plan.periodizationWeeklyMemos),
    workouts,
  }
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

  const hasHeartMedications = Boolean(
    request.hasHeartMedications ||
    request.contraindicationTags?.includes('cardiovascular_hypertension') ||
    /beta[- ]blocker|hypertension|blood pressure|cardiac|heart med/i.test(request.injuriesLimitations || '')
  )

  const personalizationCtx: PersonalizationContext = {
    clientName: request.clientName,
    goal: request.goal,
    targetPhase,
    kineticCompensations: request.kineticCompensations,
    injuriesLimitations: request.injuriesLimitations,
    contraindicationTags: request.contraindicationTags,
  }

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
      hasHeartMedications,
    })
    const { sanitizedPlan: sanitizedFallback } = validateAndEnforceNasmOptGuardrails(ragPlan, {
      equipmentAccess: request.equipmentAccess,
      kineticCompensations: request.kineticCompensations,
      targetPhase,
    })
    const validated = validateAndEnforceEquipmentConstraints(
      sanitizedFallback,
      request.equipmentAccess,
      request.contraindicationTags,
      request.injuriesLimitations
    )

    validated.clinicalRationale = buildDeterministicMasterCoachMemo(request, targetPhase, validated.planTitle)
    return personalizePlan(enrichPlanWithNasmCdnMedia(validated), personalizationCtx)
  }

  // 1. Filter allowed NASM Edge exercises strictly by available client equipment
  const allowedNasmExercises = filterNasmEdgeCatalogByEquipment(request.equipmentAccess)
  const cardioZones = calculateCardioZones(request.clientAge || 35, 65, hasHeartMedications)

  const promptContent = `Client Training Profile:
- Name: ${request.clientName || 'Client'}
- Age: ${request.clientAge || 35} | Sex: ${request.clientSex || 'Unspecified'}
- Primary Goal: ${request.goal.toUpperCase()}
- Target NASM OPT Phase: Phase ${targetPhase} (${targetPhase === 1 ? 'Stabilization Endurance' : targetPhase === 2 ? 'Strength Endurance' : targetPhase === 3 ? 'Muscular Development / Hypertrophy' : targetPhase === 4 ? 'Maximal Strength' : 'Power'})
- Training Frequency: ${request.trainingDaysPerWeek || 4} days per week
- Experience Level: ${request.experienceLevel || 'intermediate'}
- Available Equipment: ${(request.equipmentAccess || ['Full Commercial Gym']).join(', ')}
- Kinetic Compensations / Movement Screen: ${(request.kineticCompensations || ['None observed']).join(', ')}
${request.injuriesLimitations ? `- Clinical Sports Injuries & Limitations: ${request.injuriesLimitations}\n` : ''}${request.contraindicationTags && request.contraindicationTags.length > 0 ? `- Biomechanical Contraindication Tags: ${request.contraindicationTags.join(', ')}\n` : ''}${hasHeartMedications ? '- Cardiorespiratory Intensity Protocol: ⚠️ CLIENT ON HEART/HYPERTENSION MEDICATION (BETA-BLOCKERS) — Autonomic HR blunted. Govern all cardio conditioning strictly by RPE & Talk Test, NOT BPM targets.\n' : `- Cardiorespiratory Tanaka Target Zones: Zone 1 (${cardioZones.zone1.minBpm}-${cardioZones.zone1.maxBpm} BPM), Zone 2 (${cardioZones.zone2.minBpm}-${cardioZones.zone2.maxBpm} BPM), Zone 3 (${cardioZones.zone3.minBpm}-${cardioZones.zone3.maxBpm} BPM)\n`}- Cardiorespiratory Blend Style: ${request.cardioBlendStyle || 'integrated_finishers'}
- Additional Coach Notes: ${request.coachGuidanceNotes || 'Optimize for strict OPT periodization, joint longevity, and neuromuscular control.'}

RAG Sports Science Context:
${citedDocs.map(d => `[${d.title}]: ${d.summary} (Key concepts: ${d.keyConcepts.join(', ')})`).join('\n')}

STRICT EXERCISE & EQUIPMENT SELECTION INSTRUCTION:
You MUST design each workout day by selecting EXCLUSIVELY from the Allowed Official NASM Edge Exercise list below. Do NOT prescribe any movement outside this list or requiring equipment the client does not have.

ALLOWED OFFICIAL NASM EDGE EXERCISE LIST FOR THIS CLIENT (${allowedNasmExercises.length} VERIFIED MOVEMENTS):
${allowedNasmExercises.join(', ')}

OPT MODEL WORKOUT DESIGN REQUIREMENTS:
Each workout day in the 'workouts' array must contain:
1. Warmup SMR (block: 'warmup', 1 set, 30-60s hold on tender spots from allowed list; tempo: 'Hold 30-60s on tender spot')
2. Warmup Dynamic/Static (block: 'warmup', 1-2 sets, 10 reps or 30s holds from allowed list; tempo: 'Hold 30s' or 'Dynamic')
3. Core (block: 'core', 2-3 sets; dynamic core e.g. Ball Crunch @ 4/2/1 tempo 12-20 reps; static holds e.g. Planks @ 'Hold 30-60s' tempo and reps '30-60s hold')
4. Balance (block: 'balance', 2-3 sets, 8-12 reps per leg @ 4/2/1 tempo from allowed list)
5. Resistance Training (block: 'resistance', phase-appropriate sets, reps, and tempo from allowed list):
   - Phase 1: 1-3 sets, 12-20 reps @ 4/2/1 tempo, 0-90s rest, high proprioceptive instability.
   - Phase 2: 2-4 superset pairs (Stable strength lift @ 2/0/2 tempo, 8-12 reps paired immediately with biomechanically similar stabilization lift @ 4/2/1 tempo, 8-12 reps).
   - Phase 3: 3-5 sets, 6-12 reps @ 2/0/2 tempo, 75-85% 1RM, 0-60s rest.
   - Phase 4: 4-6 sets, 1-5 reps @ 1/1/1 or 2/0/2 tempo, 85-100% 1RM, 2-4 min rest.
   - Phase 5: 3-5 superset pairs (Heavy strength lift 1-5 reps @ 85-100% 1RM superset with explosive movement @ X/0/X tempo, 8-10 reps).
6. MANDATORY BIOMECHANICAL TEMPO EXCLUSIONS:
   - NEVER prescribe 4/2/1 or rep counts for static core/holds (Planks, Wall Sits, Bird Dogs, Hollow Body); prescribe tempo: 'Hold 30-60s', reps: '30-60s hold'.
   - NEVER prescribe 4/2/1 for plyometrics/jumps/slams/burpees (destroys the stretch-shortening cycle); Phase 1 plyos: 'Explosive -> 3-5s landing freeze' (5-8 reps); Phase 2-4: 'Continuous repeat jumps' (8-10 reps); Phase 5: 'X/0/X' (8-10 reps).
   - NEVER prescribe 4/2/1 for ballistic/Olympic lifts (Kettlebell Swings, Cleans, Snatches, Push Presses); prescribe tempo: 'Explosive / 1/0/X'.
   - NEVER prescribe 4/2/1 for floor deadlifts (Conventional / Sumo); use '2/0/2' to protect lumbar spine from a 2-second hover off the floor (Romanian Deadlifts / RDLs are allowed at 4/2/1).
7. Cooldown (block: 'cooldown', SMR + Static Stretching from allowed list; tempo: 'Hold 30s').
8. Integrated Cardio Protocol ('cardioProtocol' object on each workout day with title, stage: 1|2|3, stageName, targetZone, durationMins, workRestRatio, recommendedModalities, coachingCues).

Generate a complete 4-week OPT™ periodized macrocycle split. Return as valid JSON matching the GeneratedMacrocyclePlan interface with fields:
- planTitle (string)
- primaryGoal (string)
- nasmOptPhase (number: ${targetPhase})
- phaseName (string)
- totalWeeks (number: 4)
- sessionsPerWeek (number: ${request.trainingDaysPerWeek || 4})
- ragSourcesCited (string[])
- strengthCardioBlendSummary (object with goal, blendRatio, strengthPct, cardioPct, weeklyStrengthSessions, weeklyCardioMinutes, primaryCardioStages, interferenceShieldStrategy, clinicalGuideline)
- workouts (array of GeneratedWorkoutDay objects each with day, dayName, focus, nasmOptPhase, phaseName, estimatedDurationMins, warmupProtocol { inhibitSmr, lengthenStaticStretch, activateDynamic }, exercises [ { block, name, sets, reps, tempo, rest, coachingCues, nasmClinicalSource, whyForYou (one plain-language sentence written directly to the client explaining why THIS exercise is in THEIR plan, referencing their compensations, limitations, or goal) } ], cardioProtocol, dailyPeriodizationMemo)
- periodizationWeeklyMemos (string[4])
- coachPersonalNote (string: 3-5 warm sentences in first person from Coach Gordon to the client by first name — what this plan is built around for them and encouragement; no jargon, no bullet points)
- clinicalRationale (string: Empathetic, high-EQ Master Coach Gordon Briefing Memo written to the client addressing them by name, covering orthopedic safeguards, phase tempo, and OPT periodization)`

  const configuredModel = process.env.GEMINI_MODEL?.trim()
  const modelsToTry = [
    ...(configuredModel ? [configuredModel] : []),
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ]
  let rawText: string | null = null

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: MASTER_NASM_COACH_SYSTEM_PROMPT }],
            },
            contents: [{ parts: [{ text: promptContent }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.3,
              thinking_config: { thinking_level: 'low' },
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

    const rawParsed = JSON.parse(rawText)
    const normalizedPlan = normalizeGeneratedPlan(rawParsed)
    if (!normalizedPlan || !Array.isArray(normalizedPlan.workouts) || normalizedPlan.workouts.length === 0) {
      throw new Error('Gemini generated an invalid plan structure')
    }

    // 2. Strict Deterministic Guardrail Pipeline: Enforce Phase constraints, equipment isolation, and correctives
    const { sanitizedPlan } = validateAndEnforceNasmOptGuardrails(normalizedPlan, {
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

    // Ensure Master Coach Briefing Memo is attached
    if (!validated.clinicalRationale) {
      validated.clinicalRationale = buildDeterministicMasterCoachMemo(request, targetPhase, validated.planTitle)
    }

    // 3. Media enrichment: attach 100% official NASM CDN video URLs, embeds, and thumbnails
    return personalizePlan(enrichPlanWithNasmCdnMedia(validated), personalizationCtx)
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
      hasHeartMedications,
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

    validatedFallback.clinicalRationale = buildDeterministicMasterCoachMemo(request, targetPhase, validatedFallback.planTitle)
    return personalizePlan(enrichPlanWithNasmCdnMedia(validatedFallback), personalizationCtx)
  }
}
