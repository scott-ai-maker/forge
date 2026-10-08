/**
 * Forge Athletic — NASM CPT-7 Chapter 18: Plyometric (Reactive) Power Engine
 * Ingested from official NASM 7th Edition sports science reference manual:
 * 1. Stretch-Shortening Cycle (SSC) Mechanics: Eccentric (Loading) -> Amortization (<150ms) -> Concentric (Unloading).
 * 2. 3-Tier OPT™ Plyometric Continuum:
 *    - Tier 1: Plyometric Stabilization (Phase 1) — 3-5s isometric hold upon landing to absorb ground reaction forces.
 *    - Tier 2: Plyometric Strength (Phases 2-4) — Dynamic, repetitive jumps with full ROM and minimal transition delay.
 *    - Tier 3: Plyometric Power (Phase 5) — Explosive maximum Rate of Force Development (RFD) and rapid recoil.
 * 3. Reactive Strength Index (RSI) & Ground Reaction Force (GRF) absorption calculator.
 * 4. Landing Mechanics Biomechanical Fault Screener (Valgus, Stiff-leg, Trunk Lean, Asymmetry).
 */

export type PlyometricTier = 'stabilization' | 'strength' | 'power'
export type MovementPlane = 'sagittal' | 'frontal' | 'transverse' | 'multiplanar'

export interface PlyometricExercise {
  id: string
  name: string
  tier: PlyometricTier
  tierLabel: string
  optPhases: number[]
  plane: MovementPlane
  targetMuscles: string[]
  prescribedSets: string
  prescribedReps: string
  tempo: string
  restIntervalSec: number
  primaryFocus: string
  coachingCues: string[]
  landingMechanicsCues: string[]
  equipment: string
}

export const NASM_PLYOMETRIC_LIBRARY: PlyometricExercise[] = [
  // ── TIER 1: PLYOMETRIC STABILIZATION (Phase 1) ─────────────────────────
  {
    id: 'squat_jump_stab',
    name: 'Squat Jump with 3–5s Landing Stabilization Hold',
    tier: 'stabilization',
    tierLabel: 'Tier 1: Plyometric Stabilization',
    optPhases: [1],
    plane: 'sagittal',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Gastrocnemius', 'Soleus', 'Core Stabilizers'],
    prescribedSets: '1–3 sets',
    prescribedReps: '5–8 reps',
    tempo: 'Explosive jump -> 3–5s isometric freeze upon landing',
    restIntervalSec: 90,
    primaryFocus: 'Develop eccentric deceleration, joint alignment, and ground reaction force absorption.',
    coachingCues: [
      'Begin in athletic stance, sink into shallow quarter squat.',
      'Explode upward vertically through triple extension (ankles, knees, hips).',
      'Land softly midfoot-to-heel in a quarter squat, knees tracking over toes.',
      'Hold the landing frozen like a statue for 3 to 5 seconds before resetting.',
    ],
    landingMechanicsCues: [
      'Maintain knee alignment over 2nd and 3rd toes (zero knee valgus).',
      'Torso parallel to shins, neutral lumbar spine.',
      'Silent, shock-absorbing landing like a cat.',
    ],
    equipment: 'Bodyweight',
  },
  {
    id: 'box_jump_up_stab',
    name: 'Box Jump-Up with Stabilization Hold',
    tier: 'stabilization',
    tierLabel: 'Tier 1: Plyometric Stabilization',
    optPhases: [1],
    plane: 'sagittal',
    targetMuscles: ['Gluteus Maximus', 'Hamstrings', 'Quadriceps', 'Calves'],
    prescribedSets: '1–3 sets',
    prescribedReps: '5–8 reps',
    tempo: 'Explosive jump -> 3–5s landing freeze on top of box',
    restIntervalSec: 90,
    primaryFocus: 'Reduces impact forces upon landing while mastering hip hinge and soft deceleration.',
    coachingCues: [
      'Stand 6-12 inches in front of a 12-24" plyometric box.',
      'Swing arms back, hinge at hips, and jump upward onto box surface.',
      'Land quietly in the exact center with both feet simultaneously.',
      'Hold stable squat posture for 3–5 seconds before stepping down (do not jump down).',
    ],
    landingMechanicsCues: [
      'Land softly with hips back and chest upright.',
      'Ensure equal weight distribution between left and right feet.',
    ],
    equipment: 'Plyo Box (12–24")',
  },
  {
    id: 'box_jump_down_stab',
    name: 'Box Jump-Down (Depth Landing) with Stabilization',
    tier: 'stabilization',
    tierLabel: 'Tier 1: Plyometric Stabilization',
    optPhases: [1],
    plane: 'sagittal',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Anterior Tibialis', 'Core Cylinder'],
    prescribedSets: '1–2 sets',
    prescribedReps: '4–6 reps',
    tempo: 'Step off box -> absorb landing with 3–5s static hold',
    restIntervalSec: 90,
    primaryFocus: 'Directly trains eccentric rate of force absorption against 3-5x bodyweight impact.',
    coachingCues: [
      'Step (do not jump) off a low 12-18" box with one foot.',
      'Drop vertically and absorb ground contact immediately with both feet.',
      'Sink into athletic quarter squat with knees over toes.',
      'Hold rock-solid for 3–5 seconds.',
    ],
    landingMechanicsCues: [
      'Do not allow knees to cave inward (valgus collapse).',
      'Absorb shock through ankles, knees, and hips simultaneously.',
    ],
    equipment: 'Low Plyo Box (12–18")',
  },
  {
    id: 'multiplanar_jump_stab',
    name: 'Multiplanar Jump with Stabilization (Sagittal / Frontal / Transverse)',
    tier: 'stabilization',
    tierLabel: 'Tier 1: Plyometric Stabilization',
    optPhases: [1],
    plane: 'multiplanar',
    targetMuscles: ['Gluteus Medius', 'Peroneals', 'Adductors', 'Core Stabilizers'],
    prescribedSets: '1–3 sets',
    prescribedReps: '5–8 reps per plane',
    tempo: 'Explosive jump -> 3–5s freeze',
    restIntervalSec: 90,
    primaryFocus: 'Neuromuscular deceleration across all 3 anatomical planes (forward, lateral, rotational).',
    coachingCues: [
      'Perform forward jump (sagittal), land and hold 3–5s.',
      'Perform lateral hop (frontal), land and hold 3–5s.',
      'Perform 90° turning jump (transverse), land square and hold 3–5s.',
    ],
    landingMechanicsCues: [
      'Resist rotational spinal torque upon landing in transverse plane.',
      'Maintain strong lateral hip stabilization (no lateral pelvic drop).',
    ],
    equipment: 'Bodyweight / Floor Markers',
  },

  // ── TIER 2: PLYOMETRIC STRENGTH (Phases 2, 3, 4) ───────────────────────
  {
    id: 'squat_jump_continuous',
    name: 'Continuous Squat Jumps (Repetitive SSC)',
    tier: 'strength',
    tierLabel: 'Tier 2: Plyometric Strength',
    optPhases: [2, 3, 4],
    plane: 'sagittal',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Hamstrings', 'Gastrocnemius'],
    prescribedSets: '2–4 sets',
    prescribedReps: '8–12 reps',
    tempo: 'Medium tempo, continuous rhythmic transitions (<0.5s ground contact)',
    restIntervalSec: 60,
    primaryFocus: 'Enhance Stretch-Shortening Cycle efficiency and dynamic muscular endurance.',
    coachingCues: [
      'Perform continuous vertical jumps with fluid transition upon ground contact.',
      'Spend minimal time on the floor: load eccentrically and explode immediately.',
      'Use arm swing to amplify upward momentum.',
    ],
    landingMechanicsCues: [
      'Maintain pristine joint alignment through fast repetitive cycles.',
      'Soft spring-like recoil through the balls of the feet.',
    ],
    equipment: 'Bodyweight',
  },
  {
    id: 'tuck_jumps',
    name: 'Dynamic Tuck Jumps',
    tier: 'strength',
    tierLabel: 'Tier 2: Plyometric Strength',
    optPhases: [2, 3, 4],
    plane: 'sagittal',
    targetMuscles: ['Iliopsoas', 'Rectus Abdominis', 'Quadriceps', 'Glutes'],
    prescribedSets: '2–3 sets',
    prescribedReps: '8–10 reps',
    tempo: 'Explosive repeat jumps with rapid knee tuck at apex',
    restIntervalSec: 60,
    primaryFocus: 'Develop rapid hip flexion power and dynamic core integration at peak jump height.',
    coachingCues: [
      'Explode vertically and pull knees up toward chest at peak elevation.',
      'Quickly extend legs down before contact and rebound instantly.',
      'Land softly and fire into the next repetition.',
    ],
    landingMechanicsCues: [
      'Avoid excessive lumbar flexion during tuck; pull knees to chest, not chest to knees.',
      'Ensure feet land parallel.',
    ],
    equipment: 'Bodyweight',
  },
  {
    id: 'butt_kicks',
    name: 'Dynamic Butt Kicks (Heel to Glute Jumps)',
    tier: 'strength',
    tierLabel: 'Tier 2: Plyometric Strength',
    optPhases: [2, 3, 4],
    plane: 'sagittal',
    targetMuscles: ['Biceps Femoris', 'Semimembranosus', 'Semitendinosus', 'Quadriceps'],
    prescribedSets: '2–3 sets',
    prescribedReps: '8–12 reps',
    tempo: 'Medium-fast continuous rhythm',
    restIntervalSec: 60,
    primaryFocus: 'Rapid hamstring recruitment and rapid recovery mechanics for sprint velocity.',
    coachingCues: [
      'Jump vertically and bring heels up to tap glutes while maintaining neutral torso.',
      'Re-extend legs prior to landing and rebound immediately.',
    ],
    landingMechanicsCues: [
      'Avoid arching lower back (lumbar hyperlordosis) when kicking heels back.',
    ],
    equipment: 'Bodyweight',
  },
  {
    id: 'power_step_ups',
    name: 'Power Step-Ups (Alternating Explosive Bounding)',
    tier: 'strength',
    tierLabel: 'Tier 2: Plyometric Strength',
    optPhases: [2, 3, 4],
    plane: 'sagittal',
    targetMuscles: ['Gluteus Maximus', 'Quadriceps', 'Calves'],
    prescribedSets: '2–3 sets',
    prescribedReps: '8–10 reps per leg',
    tempo: 'Explosive drive off box, switch feet in air',
    restIntervalSec: 60,
    primaryFocus: 'Unilateral triple extension power and flight coordination.',
    coachingCues: [
      'Place lead foot firmly on a 12-18" box.',
      'Drive aggressively through lead heel into full vertical triple extension.',
      'Switch lead leg at top of flight and land with opposite foot on the box.',
    ],
    landingMechanicsCues: [
      'Ensure whole foot stays planted on the box, heel does not hang off.',
    ],
    equipment: 'Plyo Box / Bench (12–18")',
  },

  // ── TIER 3: PLYOMETRIC POWER (Phase 5) ──────────────────────────────────
  {
    id: 'ice_skaters',
    name: 'Ice Skaters (Lateral Skater Jumps)',
    tier: 'power',
    tierLabel: 'Tier 3: Plyometric Power',
    optPhases: [5],
    plane: 'frontal',
    targetMuscles: ['Gluteus Medius', 'Adductors', 'Peroneals', 'VMO', 'Core Stabilizers'],
    prescribedSets: '2–4 sets',
    prescribedReps: '10–16 reps (alternating)',
    tempo: 'Explosive multiplanar lateral bounds (<150ms ground contact)',
    restIntervalSec: 60,
    primaryFocus: 'Maximum lateral rate of force development (RFD) and frontal plane deceleration.',
    coachingCues: [
      'Push forcefully off inside edge of trailing foot to bound laterally across room.',
      'Land on opposite single leg, absorb into athletic quarter squat.',
      'Instantly rebound back in the opposite direction without hesitation.',
    ],
    landingMechanicsCues: [
      'Prevent lateral knee valgus upon landing (keep knee aligned over 2nd toe).',
      'Keep shoulders and hips square forward.',
    ],
    equipment: 'Bodyweight / Cones',
  },
  {
    id: 'single_leg_bounding',
    name: 'Single-Leg Linear Bounding',
    tier: 'power',
    tierLabel: 'Tier 3: Plyometric Power',
    optPhases: [5],
    plane: 'sagittal',
    targetMuscles: ['Gluteus Maximus', 'Hamstrings', 'Gastrocnemius', 'Achilles Tendon Unit'],
    prescribedSets: '2–3 sets',
    prescribedReps: '6–8 bounds per leg',
    tempo: 'Maximal explosive distance with minimal ground contact time',
    restIntervalSec: 90,
    primaryFocus: 'Maximum unilateral horizontal force production and reactive elastic recoil.',
    coachingCues: [
      'Explode forward off single leg with aggressive high knee drive of opposite limb.',
      'Strike ground actively under center of mass with stiff ankle.',
      'Rebound forward immediately with maximal stride length.',
    ],
    landingMechanicsCues: [
      'Stiff ankle complex at contact to maximize tendon elastic return.',
      'Maintain upright posture with neutral pelvis.',
    ],
    equipment: 'Open Track / Turf (20–30 yards)',
  },
  {
    id: 'proprioceptive_plyo',
    name: 'Proprioceptive Plyometrics (Cone / Hurdle Hops)',
    tier: 'power',
    tierLabel: 'Tier 3: Plyometric Power',
    optPhases: [5],
    plane: 'multiplanar',
    targetMuscles: ['Full Lower Kinetic Chain', 'Core Rotators', 'Ankle Stabilizers'],
    prescribedSets: '2–3 sets',
    prescribedReps: '8–12 hops',
    tempo: 'Fast, reactive, multi-directional hops (<150ms contact)',
    restIntervalSec: 60,
    primaryFocus: 'Rapid multi-directional agility, obstacle clearance, and kinesthetic awareness.',
    coachingCues: [
      'Set up 4 mini hurdles or cones in a cross or zigzag grid.',
      'Hop rapidly over hurdles in predetermined sequence (forward, back, side-to-side).',
      'Keep contact times ultra-short like hopping on hot coals.',
    ],
    landingMechanicsCues: [
      'Avoid clipping hurdles; maintain crisp foot elevation and hip stiffness.',
    ],
    equipment: 'Mini Hurdles / Cones',
  },
  {
    id: 'depth_jumps',
    name: 'Depth Jumps (True Shock Method Reactive Jumps)',
    tier: 'power',
    tierLabel: 'Tier 3: Plyometric Power',
    optPhases: [5],
    plane: 'sagittal',
    targetMuscles: ['Extensor Chain', 'Achilles Tendon', 'Patellar Tendon', 'Motor Unit Recruitment'],
    prescribedSets: '2–4 sets',
    prescribedReps: '4–6 reps',
    tempo: 'Step off box -> immediate reactive vertical jump (<150ms contact)',
    restIntervalSec: 120,
    primaryFocus: 'Ultimate rate of force development utilizing the full stretch-shortening cycle reflex.',
    coachingCues: [
      'Step off 12–18" box with both feet dropping to turf.',
      'The instant feet touch, explode vertically toward the ceiling with maximum power.',
      'Ground contact must be instantaneous (<150 milliseconds).',
    ],
    landingMechanicsCues: [
      'Athlete must already possess clean Phase 1 stabilization mechanics before performing depth jumps.',
      'Land final jump softly in athletic quarter squat.',
    ],
    equipment: 'Plyo Box (12–18")',
  },
]

// ── 2. REACTIVE STRENGTH INDEX (RSI) & BIOMECHANICAL CALCULATOR ──────────────

export interface RsiCalculationInput {
  jumpHeightCm?: number
  flightTimeMs?: number
  contactTimeMs: number // Ground contact time in milliseconds
  bodyweightLbs?: number
}

export interface RsiEvaluationResult {
  rsiScore: number // Score = Jump Height (m) / Contact Time (s) or Flight Time (ms) / Contact Time (ms)
  rating: 'Poor / High Amortization Delay' | 'Fair / Developing Reactive Elasticity' | 'Good / Athletic Standard' | 'Elite / Explosive Reactive Power'
  amortizationClassification: 'Optimal Fast SSC (<150ms)' | 'Moderate SSC (150-250ms)' | 'Slow / Dissipated Elastic Energy (>250ms)'
  estimatedGroundReactionForceLbs: number
  grfMultiplier: number // e.g., 3.2x Bodyweight
  coachingRecommendation: string
  prescribedTier: PlyometricTier
}

/**
 * Calculates Reactive Strength Index (RSI) and Stretch-Shortening Cycle efficiency.
 * Standard RSI = Jump Height (meters) / Ground Contact Time (seconds).
 * Alternatively: Flight Time (ms) / Ground Contact Time (ms).
 */
export function calculateRsi(input: RsiCalculationInput): RsiEvaluationResult {
  const { jumpHeightCm, flightTimeMs, contactTimeMs, bodyweightLbs = 180 } = input
  const safeContactTimeMs = Math.max(contactTimeMs, 50) // Minimum 50ms contact

  let jumpHeightMeters = 0
  if (jumpHeightCm && jumpHeightCm > 0) {
    jumpHeightMeters = jumpHeightCm / 100
  } else if (flightTimeMs && flightTimeMs > 0) {
    // Jump Height from flight time: h = 0.5 * g * (t_flight / 2)^2 = (9.81 * t^2) / 8
    const flightTimeSec = flightTimeMs / 1000
    jumpHeightMeters = (9.81 * Math.pow(flightTimeSec, 2)) / 8
  } else {
    jumpHeightMeters = 0.35 // Default ~35 cm
  }

  const contactTimeSec = safeContactTimeMs / 1000
  const rsiScore = Number((jumpHeightMeters / contactTimeSec).toFixed(2))

  // Amortization Classification (<150ms is true fast SSC, 150-250ms is moderate, >250ms is slow)
  let amortizationClassification: RsiEvaluationResult['amortizationClassification'] = 'Moderate SSC (150-250ms)'
  if (safeContactTimeMs <= 150) {
    amortizationClassification = 'Optimal Fast SSC (<150ms)'
  } else if (safeContactTimeMs > 250) {
    amortizationClassification = 'Slow / Dissipated Elastic Energy (>250ms)'
  }

  // Normative RSI ratings:
  // <1.5: Poor
  // 1.5 - 2.0: Fair
  // 2.0 - 2.5: Good
  // >2.5: Elite
  let rating: RsiEvaluationResult['rating'] = 'Fair / Developing Reactive Elasticity'
  let prescribedTier: PlyometricTier = 'stabilization'
  let coachingRecommendation = ''

  if (rsiScore < 1.5 || safeContactTimeMs > 250) {
    rating = 'Poor / High Amortization Delay'
    prescribedTier = 'stabilization'
    coachingRecommendation =
      'Significant amortization delay. Stored elastic energy is dissipating as heat. Focus on Phase 1 Plyometric Stabilization (3-5s landing freezes) to build eccentric deceleration capacity and knee alignment before advancing to fast SSC jumps.'
  } else if (rsiScore < 2.0) {
    rating = 'Fair / Developing Reactive Elasticity'
    prescribedTier = 'strength'
    coachingRecommendation =
      'Moderate reactive control. Ready for Phase 2-4 Plyometric Strength drills (Continuous squat jumps, tuck jumps) with emphasis on shortening ground contact time.'
  } else if (rsiScore < 2.5) {
    rating = 'Good / Athletic Standard'
    prescribedTier = 'power'
    coachingRecommendation =
      'Strong reactive elasticity and efficient Stretch-Shortening Cycle. Program Phase 5 Plyometric Power exercises (Ice skaters, single-leg bounding, depth jumps) with sub-150ms contact targets.'
  } else {
    rating = 'Elite / Explosive Reactive Power'
    prescribedTier = 'power'
    coachingRecommendation =
      'Elite neuromuscular Rate of Force Development. Athlete utilizes the full stretch reflex mechanism with minimal energy leak. Prescribe advanced depth jumps and high-velocity multi-directional reactive bounding.'
  }

  // Ground Reaction Force (GRF) estimation:
  // Faster deceleration (<150ms) creates higher peak GRF (~3.5x to 4.5x BW), while soft landing absorbs it smoothly.
  const grfMultiplier = Number((2.0 + (300 / safeContactTimeMs) * 0.8).toFixed(1))
  const estimatedGroundReactionForceLbs = Math.round(bodyweightLbs * grfMultiplier)

  return {
    rsiScore,
    rating,
    amortizationClassification,
    estimatedGroundReactionForceLbs,
    grfMultiplier,
    coachingRecommendation,
    prescribedTier,
  }
}

// ── 3. LANDING MECHANICS BIOMECHANICAL FAULT SCREENER ────────────────────────

export interface LandingFaultObservation {
  id: string
  name: string
  checkpoint: 'feet_ankles' | 'knees' | 'lphc' | 'shoulders_cervical'
  severity: 'mild' | 'moderate' | 'severe'
  mechanism: string
  injuryRisk: string
  correctiveAdjustment: string
}

export const NASM_LANDING_FAULTS: Record<string, LandingFaultObservation> = {
  knee_valgus: {
    id: 'knee_valgus',
    name: 'Dynamic Knee Valgus (Inward Collapse Upon Landing)',
    checkpoint: 'knees',
    severity: 'severe',
    mechanism: 'Weak gluteus medius/maximus and hyperactive adductors allow femur to adduct and internally rotate under deceleration.',
    injuryRisk: 'High risk of ACL rupture, patellar tendinopathy, and meniscus tear from anterior shear.',
    correctiveAdjustment: 'Cue "land with knees pushing out over 2nd toes". Regress to Box Jump-Up with 5s hold and mini-band around knees to cue glute abduction.',
  },
  stiff_legged_landing: {
    id: 'stiff_legged_landing',
    name: 'Stiff-Legged / Insufficient Knee & Hip Flexion',
    checkpoint: 'knees',
    severity: 'moderate',
    mechanism: 'Failure of quadriceps and glutes to yield eccentrically; limited ankle dorsiflexion.',
    injuryRisk: 'Transfers 4-5x ground reaction force directly into knee joint capsule and lumbar spine without muscular absorption.',
    correctiveAdjustment: 'Cue "land silently like a ninja into a deep quarter squat". Foam roll calves and stretch gastrocnemius/soleus.',
  },
  excessive_forward_lean: {
    id: 'excessive_forward_lean',
    name: 'Excessive Forward Trunk Lean (Chest Collapse)',
    checkpoint: 'lphc',
    severity: 'moderate',
    mechanism: 'Overactive hip flexors/erector spinae combined with weak core cylinder and anterior tibialis.',
    injuryRisk: 'High lumbar spinal shear and loss of center of gravity control during deceleration.',
    correctiveAdjustment: 'Cue "keep chest proud, eyes on the horizon". Strengthen transverse abdominis and glutes.',
  },
  asymmetric_loading: {
    id: 'asymmetric_loading',
    name: 'Asymmetric Landing (Favoring Stronger Limb)',
    checkpoint: 'lphc',
    severity: 'moderate',
    mechanism: 'Bilateral strength deficit or protective guarding from past injury history.',
    injuryRisk: 'Chronic overload on dominant limb (Achilles tendonitis, plantar fasciitis, hip impingement).',
    correctiveAdjustment: 'Incorporate unilateral Single-Leg Balance and Single-Leg Box Jump-Up with stabilization holds to eliminate asymmetry.',
  },
  feet_flatten_evert: {
    id: 'feet_flatten_evert',
    name: 'Feet Flatten / Excessive Eversion Upon Impact',
    checkpoint: 'feet_ankles',
    severity: 'moderate',
    mechanism: 'Overactive peroneals and lateral gastrocnemius; underactive anterior/posterior tibialis.',
    injuryRisk: 'Plantar fasciitis, medial tibial stress syndrome (shin splints), and secondary knee valgus.',
    correctiveAdjustment: 'Inhibit/foam roll peroneals and soleus. Activate posterior tibialis with barefoot single-leg calf raises.',
  },
}

export interface LandingScreenResult {
  observedFaultsCount: number
  overallDecelerationQuality: 'Pristine Landing Mechanics' | 'Mild Compensations Present' | 'Compromised / High Injury Risk'
  identifiedFaults: LandingFaultObservation[]
  recommendedOptPhaseCap: number // 1 (Stab only) or 2-4 (Strength) or 5 (Power)
  prescribedCorrectiveCues: string[]
}

export function evaluateLandingMechanics(selectedFaultIds: string[]): LandingScreenResult {
  const identifiedFaults = selectedFaultIds
    .map(id => NASM_LANDING_FAULTS[id])
    .filter((f): f is LandingFaultObservation => Boolean(f))

  const count = identifiedFaults.length
  let overallDecelerationQuality: LandingScreenResult['overallDecelerationQuality'] = 'Pristine Landing Mechanics'
  let recommendedOptPhaseCap = 5

  if (count === 0) {
    overallDecelerationQuality = 'Pristine Landing Mechanics'
    recommendedOptPhaseCap = 5
  } else if (count <= 2 && !selectedFaultIds.includes('knee_valgus')) {
    overallDecelerationQuality = 'Mild Compensations Present'
    recommendedOptPhaseCap = 3
  } else {
    overallDecelerationQuality = 'Compromised / High Injury Risk'
    recommendedOptPhaseCap = 1 // Lock to Phase 1 Stabilization until landing is mastered
  }

  const prescribedCorrectiveCues = identifiedFaults.map(f => f.correctiveAdjustment)

  return {
    observedFaultsCount: count,
    overallDecelerationQuality,
    identifiedFaults,
    recommendedOptPhaseCap,
    prescribedCorrectiveCues,
  }
}

// ── 4. 1-CLICK PLYOMETRIC PROGRAM GENERATOR ──────────────────────────────────

export interface PrescribedPlyometricSession {
  clientOptPhase: number
  tier: PlyometricTier
  tierTitle: string
  sessionOverview: string
  restBetweenExercisesSec: number
  exercises: {
    exercise: PlyometricExercise
    sets: string
    reps: string
    tempo: string
    landingFocus: string
  }[]
}

export function generatePlyometricProtocol(optPhase: number): PrescribedPlyometricSession {
  if (optPhase <= 1) {
    // Phase 1: Stabilization
    const exercises = NASM_PLYOMETRIC_LIBRARY.filter(e => e.tier === 'stabilization')
    return {
      clientOptPhase: 1,
      tier: 'stabilization',
      tierTitle: 'Phase 1: Reactive Stabilization Protocol',
      sessionOverview:
        'Focus on mastering landing mechanics, core stabilization, and eccentric deceleration. Every repetition MUST be held frozen upon landing for 3 to 5 seconds before the next jump is initiated.',
      restBetweenExercisesSec: 90,
      exercises: exercises.map(ex => ({
        exercise: ex,
        sets: '2–3 sets',
        reps: '5–8 reps',
        tempo: 'Explosive jump -> 3–5s isometric hold upon landing',
        landingFocus: ex.landingMechanicsCues[0] ?? 'Land softly with knees over toes.',
      })),
    }
  } else if (optPhase <= 4) {
    // Phases 2–4: Strength
    const exercises = NASM_PLYOMETRIC_LIBRARY.filter(e => e.tier === 'strength')
    return {
      clientOptPhase: optPhase,
      tier: 'strength',
      tierTitle: `Phase ${optPhase}: Reactive Strength & SSC Acceleration Protocol`,
      sessionOverview:
        'Dynamic Stretch-Shortening Cycle training. Perform continuous, rhythmic repetitions with dynamic eccentric-to-concentric transitions. Minimize amortization ground contact delay.',
      restBetweenExercisesSec: 60,
      exercises: exercises.map(ex => ({
        exercise: ex,
        sets: '3–4 sets',
        reps: '8–10 reps',
        tempo: 'Medium tempo, continuous rhythmic jumps',
        landingFocus: ex.landingMechanicsCues[0] ?? 'Spring-like recoil off midfoot.',
      })),
    }
  } else {
    // Phase 5: Power
    const exercises = NASM_PLYOMETRIC_LIBRARY.filter(e => e.tier === 'power')
    return {
      clientOptPhase: 5,
      tier: 'power',
      tierTitle: 'Phase 5: Explosive Reactive Power & Rate of Force Development (RFD)',
      sessionOverview:
        'True maximal velocity reactive training. Execute explosive multiplanar bounds and depth jumps with sub-150ms ground contact times to maximize kinetic recoil and athletic power output.',
      restBetweenExercisesSec: 90,
      exercises: exercises.map(ex => ({
        exercise: ex,
        sets: '3–4 sets',
        reps: '6–10 reps',
        tempo: 'Explosive recoil (<150ms ground contact)',
        landingFocus: ex.landingMechanicsCues[0] ?? 'Stiff ankle tendon recoil.',
      })),
    }
  }
}
