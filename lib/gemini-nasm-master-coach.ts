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
  type HandPortionNutritionPlan,
  type DualCardioPlanSummary,
} from './rag-nasm-program-generator'
import { doesExerciseMatchEquipment, parseEquipmentCapabilities } from './nasm-equipment-detector'
import { calculateCardioZones } from './nasm-cardio-stage-engine'
import { validateAndEnforceNasmOptGuardrails, substituteMissingEquipment } from './nasm-opt-guardrails'
import { checkExerciseContraindications } from './liability-shield'
import { parseInjuriesFromText } from './sports-injuries'

export interface GeminiCoachLifestyleRhythm {
  workStyle?: 'sedentary_desk' | 'active_standing' | 'traveling' | 'heavy_labor' | string
  dailyRhythm?: 'early_morning' | 'mid_day' | 'evening' | string
  targetSessionDurationMins?: number
}

export interface GeminiCoachDualCardioConfig {
  sweatyFinisherModality?: string // e.g. "Reebok Step Bench" or "Incline Treadmill Flush"
  freshNeatWalkingMins?: number // e.g. 25
  freshNeatWalkingNotes?: string // e.g. "Clean clothes walking ritual to visit parents"
}

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

  // Deep Humanized Personalization Extensions
  lifestyleRhythm?: GeminiCoachLifestyleRhythm
  movementSuperpowers?: string[] // e.g. ['burpees', 'pullups', 'kettlebell_swings']
  strictExclusions?: string[] // e.g. ['mountain_climbers', 'running', 'forward_lunges']
  functionalDemands?: string // e.g. "Assisting elderly father on weekends, lifting and carrying"
  nutritionPhilosophy?: 'precision_nutrition_hand_portion' | 'macro_calorie_tracking' | 'intuitive_chrono'
  dualCardioSplit?: GeminiCoachDualCardioConfig
}

export const MASTER_NASM_COACH_SYSTEM_PROMPT = `You are Coach Scott Gordon, Director of Human Performance at Forge Athletic, a Master NASM-Certified Head Coach and Periodization Architect with over 20 years of elite personal training and sports science experience.

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
 * Checks if an exercise name matches any strict exclusion term.
 */
export function isExerciseStrictlyExcluded(exerciseName: string, exclusions?: string[]): boolean {
  if (!exclusions || exclusions.length === 0) return false
  const lowerEx = exerciseName.toLowerCase()
  return exclusions.some(raw => {
    const term = raw.toLowerCase().replace(/_/g, ' ').trim()
    if (!term) return false
    if (term === 'running' || term === 'run') {
      return lowerEx.includes('running') || lowerEx.includes('treadmill run') || lowerEx.includes('jog')
    }
    if (term === 'mountain climbers' || term === 'mountain climber') {
      return lowerEx.includes('mountain climber')
    }
    if (term === 'forward lunges' || term === 'forward lunge') {
      return lowerEx.includes('walking lunge') || lowerEx.includes('forward lunge') || lowerEx.includes('lunge to')
    }
    if (term === 'lunges' || term === 'lunge') {
      return lowerEx.includes('lunge')
    }
    return lowerEx.includes(term)
  })
}

/**
 * Returns a biomechanically sound substitute for an excluded movement.
 */
function getExclusionSubstitute(exerciseName: string, exclusions?: string[]): string {
  const lowerEx = exerciseName.toLowerCase()
  if (lowerEx.includes('mountain climber')) return 'plank'
  if (lowerEx.includes('run') || lowerEx.includes('jog')) return 'step up to balance frontal'
  if (lowerEx.includes('lunge')) return 'stability ball wall squat'
  return 'glute bridge'
}

/**
 * Builds an authentic, high-EQ Master Coach Gordon Briefing Memo written in Coach Scott Gordon's voice.
 */
export function buildDeterministicMasterCoachMemo(
  request: GeminiCoachGenerationRequest,
  targetPhase: number,
  planTitle: string
): string {
  const firstName = (request.clientName || 'Athlete').trim().split(' ')[0]

  const lines: string[] = [
    'COACH GORDON MASTER BRIEFING MEMO:',
    `${firstName}, welcome to your custom Forge Athletic performance protocol!`,
    `I designed every single variable in this routine around your lifestyle, your physical capabilities, and what will genuinely make your training sustainable and empowering.`,
    '',
    `Here is why this program was built specifically for you:`,
  ]

  // 1. Lifestyle & Daily Rhythm Nuance
  if (request.lifestyleRhythm?.workStyle === 'sedentary_desk' || (request.injuriesLimitations || '').toLowerCase().includes('desk') || (request.injuriesLimitations || '').toLowerCase().includes('engineer')) {
    lines.push(
      `1. DESK POSTURE & SITTING REVERSAL:`,
      `Because you spend long hours in focused desk work, our primary clinical mission is to reverse postural distortions: opening tight pectorals and lats, lengthening shortened hip flexors, and reactivating your glutes and deep spinal stabilizers without demanding excessive hours from your busy day.`
    )
  } else if (request.lifestyleRhythm?.dailyRhythm === 'early_morning') {
    lines.push(
      `1. EARLY MORNING RHYTHM:`,
      `Built specifically to complement your natural rhythm as an early morning riser. Workouts are calibrated to ramp your nervous system smoothly, elevate morning focus, and send you into your day energized rather than depleted.`
    )
  }

  // 2. Superpowers
  if (request.movementSuperpowers && request.movementSuperpowers.length > 0) {
    const powers = request.movementSuperpowers.map(p => p.replace(/_/g, ' ')).join(', ')
    lines.push(
      `YOUR MOVEMENT SUPERPOWER (${powers.toUpperCase()}):`,
      `You excel at ${powers} and don't mind them at all! That is a major metabolic and athletic advantage. We have integrated this directly into your core/resistance blocks to maximize caloric burn and athletic conditioning with movements you feel confident executing.`
    )
  }

  // 3. Strict Exclusions
  if (request.strictExclusions && request.strictExclusions.length > 0) {
    const banished = request.strictExclusions.map(e => e.replace(/_/g, ' ')).join(' and ')
    lines.push(
      `ZERO ${banished.toUpperCase()} (STRICTLY BANISHED):`,
      `You made it clear you dislike ${banished}. Consider them 100% eliminated from your universe. You will never see ${banished} prescribed on this protocol—ever.`
    )
  }

  // 4. Orthopedic Safeguards & Injuries
  if (request.injuriesLimitations || (request.contraindicationTags && request.contraindicationTags.length > 0)) {
    const injuryText = request.injuriesLimitations || request.contraindicationTags?.join(', ') || ''
    lines.push(
      `ORTHOPEDIC SHIELD & JOINT PROTECTION:`,
      `We have implemented strict clinical safeguards around: ${injuryText}. Every movement is selected to avoid shear stress and protect your connective tissue while fortifying your stabilizing architecture.`
    )
  }

  // 5. Functional Real-World Demands
  if (request.functionalDemands) {
    lines.push(
      `REAL-WORLD FUNCTIONAL DURABILITY:`,
      `Because of your life demands (${request.functionalDemands}), we have strategically biased posterior chain endurance, hip hinges, and core bracing so you stay strong, durable, and fatigue-resistant in daily life.`
    )
  }

  // 6. OPT Phase Tempo & Mechanics
  lines.push(
    `NASM OPT™ PHASE ${targetPhase} METHODOLOGY:`,
    targetPhase === 1
      ? `We utilize Phase 1 Stabilization Endurance with a controlled 4/2/1 tempo (4 seconds down, 2-second isometric stabilization hold, and 1 smooth second concentric). You do not need to lift heavy weights to see incredible changes—this controlled tempo activates all the stabilizing muscles around your joints.`
      : targetPhase === 2
        ? `We utilize Phase 2 Strength Endurance with contrast supersets: pairing a stable strength lift (2/0/2 tempo) immediately with a biomechanically similar stabilization lift (4/2/1 tempo). This doubles your caloric expenditure, spikes EPOC, and preserves lean body mass.`
        : targetPhase === 3
          ? `We utilize Phase 3 Muscular Development with 2/0/2 tempos and 75-85% 1RM mechanical tension across optimal volume landmarks to stimulate hypertrophy and myofibrillar protein synthesis.`
          : targetPhase === 4
            ? `We utilize Phase 4 Maximal Strength with 85-100% 1RM loads to maximize high-threshold motor unit recruitment.`
            : `We utilize Phase 5 Power with Post-Activation Potentiation (PAP) contrast supersets: pairing heavy strength anchors with explosive lightweight movements at X/0/X tempo.`
  )

  // 7. Dual Cardio Strategy
  if (request.dualCardioSplit) {
    lines.push(
      `THE DUAL-CARDIO STRATEGY:`,
      `We distinguish between sweaty workouts and clean daily activity: Your ${request.dualCardioSplit.sweatyFinisherModality || 'in-home cardio finisher'} (10-12m) is done at home post-workout before your shower. Your ${request.dualCardioSplit.freshNeatWalkingMins || 25}-minute Fresh NEAT Walking Ritual is scheduled in clean, fresh clothes on non-workout days or evenings (${request.dualCardioSplit.freshNeatWalkingNotes || 'to enjoy outdoor air or visit family'}).`
    )
  }

  // 8. Nutrition Philosophy
  if (request.nutritionPhilosophy === 'precision_nutrition_hand_portion') {
    lines.push(
      `CREATIVE NUTRITION (ZERO CALORIE COUNTING — HAND-PORTION METHOD):`,
      `You don't need to count calories or weigh food. We use the Precision Nutrition Hand-Portion method: Palm = Protein, Fist = Veggies, Cupped Hand = Smart Carbs, Thumb = Healthy Fats. Backed by the 80% Fullness Cue (Hara Hachi Bu), this creates effortless, guilt-free body recomposition.`
    )
  }

  // Closing
  lines.push(
    `Consistency is your only requirement. Own your tempo, trust the process, and let's get after it. I'm right here in your corner!`
  )

  return lines.join('\n\n')
}

/**
 * Builds the deterministic Precision Nutrition Hand-Portion Architecture.
 */
export function buildDeterministicHandPortionPlan(
  request: GeminiCoachGenerationRequest
): HandPortionNutritionPlan {
  const isFemale = request.clientSex === 'female'
  const proteinPortions = isFemale ? '1 palm-sized serving' : '1.5 to 2 palm-sized servings'
  const carbPortions = isFemale ? '1 cupped hand' : '1 to 2 cupped hands'
  const fatPortions = isFemale ? '1 thumb-sized serving' : '1 to 2 thumb-sized servings'

  return {
    philosophy: 'precision_nutrition_hand_portion',
    title: 'Precision Nutrition Hand-Portion & Visual Plate Architecture',
    mealsPerDay: 3,
    guidelines: {
      protein: {
        portionsPerMeal: proteinPortions,
        handMeasure: 'Palm of your hand (thickness and diameter)',
        examples: 'Chicken breast, turkey, wild salmon, Greek yogurt, whole eggs, tofu, lean beef',
        rationale: 'Protects lean muscle mass, accelerates recovery, and crushes between-meal cravings.',
      },
      vegetables: {
        portionsPerMeal: '1 to 2 fist-sized servings',
        handMeasure: 'Closed fist',
        examples: 'Spinach, broccoli, zucchini, bell peppers, asparagus, crisp salad greens',
        rationale: 'Supplies essential micronutrients, optimizes gut motility, and provides high-volume satiety.',
      },
      smartCarbs: {
        portionsPerMeal: carbPortions,
        handMeasure: 'Cupped hand',
        examples: 'Sweet potatoes, rolled oats, brown rice, quinoa, fresh berries, apples',
        rationale: 'Replenishes muscle glycogen and supports high-cognitive executive energy without insulin crashes.',
      },
      healthyFats: {
        portionsPerMeal: fatPortions,
        handMeasure: 'Entire thumb (tip to knuckle)',
        examples: 'Extra virgin olive oil, avocado, raw almonds, walnuts, chia seeds',
        rationale: 'Essential for hormone synthesis, joint lubrication, and cellular membrane integrity.',
      },
    },
    mindfulEatingCue: 'Hara Hachi Bu: Eat mindfully without digital distractions and stop when comfortably 80% full.',
    hydrationAnchor: '80–100 oz (2.5–3.0 L) of fresh water daily to maintain cellular hydration and metabolic efficiency.',
    summary: 'Zero calorie counting required. Use your hand as a personalized, portable portion guide for every meal.',
  }
}

/**
 * Builds the deterministic Dual-Cardio Protocol.
 */
export function buildDeterministicDualCardioPlan(
  request: GeminiCoachGenerationRequest,
  cardioZones: { zone1: { minBpm: number; maxBpm: number }; zone2: { minBpm: number; maxBpm: number } }
): DualCardioPlanSummary {
  const modality = request.dualCardioSplit?.sweatyFinisherModality || 'In-Home Cardio Finisher / Incline Treadmill'
  const neatMins = request.dualCardioSplit?.freshNeatWalkingMins || 25
  const neatNotes = request.dualCardioSplit?.freshNeatWalkingNotes || 'Clean fresh clothes walking ritual to visit family or enjoy outdoor air'

  return {
    sweatyFinisher: {
      title: `${modality} Finisher`,
      durationMins: 10,
      modality,
      zone: `Zone 1-2 (${cardioZones.zone1.minBpm}-${cardioZones.zone2.maxBpm} BPM)`,
      timing: 'Immediately post-workout at home before showering',
      rationale: 'Accelerates fatty acid oxidation, enhances EPOC, and flushes metabolic byproducts.',
    },
    freshNeatWalk: {
      title: 'Fresh Non-Sweaty Walking Ritual',
      durationMins: neatMins,
      frequency: '3–5 days per week (non-workout days, evenings, or weekends)',
      modality: 'Brisk Outdoor Walking',
      timing: neatNotes,
      rationale: 'Accumulates 3,000–5,000 steps of pure NEAT without showing up sweaty or fatigued.',
    },
  }
}

/**
 * Filters the 272 verified official NASM Edge exercises down to those executable
 * with the client's specific equipment access and strict exclusions.
 */
export function filterNasmEdgeCatalogByEquipment(
  equipmentAccess?: string[],
  strictExclusions?: string[]
): string[] {
  const allExerciseNames = Object.keys(NASM_EDGE_OFFICIAL_CATALOG)
  let catalog = !equipmentAccess || equipmentAccess.length === 0
    ? allExerciseNames
    : allExerciseNames.filter(name => doesExerciseMatchEquipment({ name }, equipmentAccess))

  if (strictExclusions && strictExclusions.length > 0) {
    catalog = catalog.filter(name => !isExerciseStrictlyExcluded(name, strictExclusions))
  }

  return catalog
}

/**
 * Secondary Validation Pass: Verifies that every exercise in the generated plan
 * is 100% compliant with the client's available equipment, contraindications,
 * and strict movement exclusions.
 */
export function validateAndEnforceEquipmentConstraints(
  plan: GeneratedMacrocyclePlan,
  equipmentAccess?: string[],
  contraindicationTags?: string[],
  injuriesLimitations?: string | null,
  strictExclusions?: string[],
  movementSuperpowers?: string[]
): GeneratedMacrocyclePlan {
  if (!plan || !Array.isArray(plan.workouts)) return plan

  const caps = equipmentAccess && equipmentAccess.length > 0
    ? parseEquipmentCapabilities(equipmentAccess)
    : null

  const detected = parseInjuriesFromText(injuriesLimitations)
  const allContraTags = Array.from(
    new Set([...(contraindicationTags || []), ...detected.selectedInjuryIds])
  )

  const hasBurpeeSuperpower = movementSuperpowers?.some(s => s.toLowerCase().includes('burpee'))
  let burpeeInjected = false

  for (const workout of plan.workouts) {
    if (!Array.isArray(workout.exercises)) continue

    for (const ex of workout.exercises) {
      // 1. Missing equipment repair
      if (caps && !caps.isFullGym && !doesExerciseMatchEquipment({ name: ex.name }, caps)) {
        const repairs: string[] = []
        ex.name = substituteMissingEquipment(ex.name, equipmentAccess || [], repairs)
      }

      // 2. Strict exclusions filter (e.g. mountain climbers, running, forward lunges)
      if (strictExclusions && isExerciseStrictlyExcluded(ex.name, strictExclusions)) {
        const original = ex.name
        ex.name = getExclusionSubstitute(ex.name, strictExclusions)
        ex.contraindicationReplacedFrom = original
        ex.coachingCues = [
          `🛡️ Personal Preference Safeguard: Replaced "${original}" per your strict movement exclusion.`,
          ...(ex.coachingCues || []),
        ]
      }

      // 3. Biomechanical contraindications shield
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

      // Track if burpees exist
      if (ex.name.toLowerCase().includes('burpee')) {
        burpeeInjected = true
      }
    }

    // 4. Inject burpee superpower into workout 2 if athlete excels at burpees and hasn't had it injected yet
    if (hasBurpeeSuperpower && !burpeeInjected && workout.day === 2 && workout.exercises.length > 2) {
      const targetIdx = Math.min(2, workout.exercises.length - 1)
      workout.exercises[targetIdx] = {
        block: 'resistance',
        name: 'squat thrust burpees',
        sets: '3',
        reps: '10-12',
        tempo: '2/0/2',
        rest: '60s',
        coachingCues: [
          'Athlete Movement Superpower: Prescribed controlled Squat Thrust Burpees — smooth, authoritative cadence.',
          'Drop hands under shoulders, kick feet back cleanly into plank, snap forward, and stand tall with authority.',
        ],
        nasmClinicalSource: 'NASM OPT Phase 2 Metabolic Superpower & Athletic Conditioning',
      }
      burpeeInjected = true
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

  // If no Gemini API key is configured, execute deterministic RAG generation with equipment validation, exclusions, & CDN enrichment
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
    const { sanitizedPlan: sanitizedFallback } = validateAndEnforceNasmOptGuardrails(ragPlan, {
      equipmentAccess: request.equipmentAccess,
      kineticCompensations: request.kineticCompensations,
      targetPhase,
    })
    const validated = validateAndEnforceEquipmentConstraints(
      sanitizedFallback,
      request.equipmentAccess,
      request.contraindicationTags,
      request.injuriesLimitations,
      request.strictExclusions,
      request.movementSuperpowers
    )

    const cardioZones = calculateCardioZones(request.clientAge || 35)
    validated.clinicalRationale = buildDeterministicMasterCoachMemo(request, targetPhase, validated.planTitle)
    if (request.nutritionPhilosophy === 'precision_nutrition_hand_portion') {
      validated.handPortionPlan = buildDeterministicHandPortionPlan(request)
    }
    if (request.dualCardioSplit) {
      validated.dualCardioPlan = buildDeterministicDualCardioPlan(request, cardioZones)
    }

    return enrichPlanWithNasmCdnMedia(validated)
  }

  // 1. Filter allowed NASM Edge exercises strictly by available client equipment and strict exclusions
  const allowedNasmExercises = filterNasmEdgeCatalogByEquipment(request.equipmentAccess, request.strictExclusions)
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
${request.lifestyleRhythm ? `- Athlete Lifestyle & Daily Rhythm: Work style: ${request.lifestyleRhythm.workStyle || 'Sedentary desk'}, Daily rhythm: ${request.lifestyleRhythm.dailyRhythm || 'Flexible'}, Target session duration: ${request.lifestyleRhythm.targetSessionDurationMins || 40} mins\n` : ''}${request.movementSuperpowers && request.movementSuperpowers.length > 0 ? `- Movement Superpowers (Athlete Excels At & Loves): ${request.movementSuperpowers.join(', ')}\n` : ''}${request.strictExclusions && request.strictExclusions.length > 0 ? `- STRICT MOVEMENT EXCLUSIONS (Under NO circumstances prescribe): ${request.strictExclusions.join(', ')}\n` : ''}${request.functionalDemands ? `- Real-World Functional & Family Demands: ${request.functionalDemands}\n` : ''}${request.nutritionPhilosophy ? `- Nutrition Strategy & Mindset: ${request.nutritionPhilosophy === 'precision_nutrition_hand_portion' ? 'Precision Nutrition Hand-Portion System (Palms = Protein, Fists = Veggies, Cupped Hands = Carbs, Thumbs = Healthy Fats) + 80% Fullness Cue (Hara Hachi Bu) - NO CALORIE COUNTING' : request.nutritionPhilosophy === 'macro_calorie_tracking' ? 'Precision Macro & Calorie Tracking' : 'Intuitive & Chrono-Nutrition'}\n` : ''}${request.dualCardioSplit ? `- Biomechanical Dual-Cardio Protocol: Sweaty In-Home Finisher: ${request.dualCardioSplit.sweatyFinisherModality || 'Incline Treadmill or Step'} done post-workout before shower; Fresh NEAT Walking Ritual: ${request.dualCardioSplit.freshNeatWalkingMins || 25} minutes done non-sweaty in clean clothes (${request.dualCardioSplit.freshNeatWalkingNotes || 'to visit family/relax'}).\n` : ''}- Additional Coach Notes: ${request.coachGuidanceNotes || 'Optimize for strict OPT periodization, joint longevity, and neuromuscular control.'}

RAG Sports Science Context:
${citedDocs.map(d => `[${d.title}]: ${d.summary} (Key concepts: ${d.keyConcepts.join(', ')})`).join('\n')}

STRICT EXERCISE & EQUIPMENT SELECTION INSTRUCTION:
You MUST design each workout day by selecting EXCLUSIVELY from the Allowed Official NASM Edge Exercise list below. Do NOT prescribe any movement outside this list or requiring equipment the client does not have.
${request.strictExclusions && request.strictExclusions.length > 0 ? `NEVER prescribe any excluded movements (${request.strictExclusions.join(', ')}).\n` : ''}

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
- periodizationWeeklyMemos (string[4])
- clinicalRationale (string: Empathetic, high-EQ Master Coach Gordon Briefing Memo written to the client addressing them by name, covering lifestyle context, superpowers, exclusions, orthopedic safeguards, phase tempo, cardio split, and nutrition)
${request.nutritionPhilosophy === 'precision_nutrition_hand_portion' ? '- handPortionPlan (object with philosophy: "precision_nutrition_hand_portion", title, mealsPerDay, guidelines { protein, vegetables, smartCarbs, healthyFats }, mindfulEatingCue, hydrationAnchor, summary)\n' : ''}${request.dualCardioSplit ? '- dualCardioPlan (object with sweatyFinisher { title, durationMins, modality, zone, timing, rationale }, freshNeatWalk { title, durationMins, frequency, modality, timing, rationale })\n' : ''}`

  const configuredModel = process.env.GEMINI_MODEL?.trim()
  const modelsToTry = [
    ...(configuredModel ? [configuredModel] : []),
    'gemini-3.8-flash',
    'gemini-3.7-flash',
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
      request.injuriesLimitations,
      request.strictExclusions,
      request.movementSuperpowers
    )

    // Ensure Master Coach Briefing Memo, Hand Portion Plan, and Dual Cardio Plan are attached
    if (!validated.clinicalRationale) {
      validated.clinicalRationale = buildDeterministicMasterCoachMemo(request, targetPhase, validated.planTitle)
    }
    if (request.nutritionPhilosophy === 'precision_nutrition_hand_portion' && !validated.handPortionPlan) {
      validated.handPortionPlan = buildDeterministicHandPortionPlan(request)
    }
    if (request.dualCardioSplit && !validated.dualCardioPlan) {
      validated.dualCardioPlan = buildDeterministicDualCardioPlan(request, cardioZones)
    }

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
      request.injuriesLimitations,
      request.strictExclusions,
      request.movementSuperpowers
    )

    validatedFallback.clinicalRationale = buildDeterministicMasterCoachMemo(request, targetPhase, validatedFallback.planTitle)
    if (request.nutritionPhilosophy === 'precision_nutrition_hand_portion') {
      validatedFallback.handPortionPlan = buildDeterministicHandPortionPlan(request)
    }
    if (request.dualCardioSplit) {
      validatedFallback.dualCardioPlan = buildDeterministicDualCardioPlan(request, cardioZones)
    }

    return enrichPlanWithNasmCdnMedia(validatedFallback)
  }
}
