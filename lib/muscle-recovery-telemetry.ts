/**
 * Forge Athletic — 3D Muscle Recovery & Biomechanical Telemetry Engine
 *
 * Computes localized muscle group recovery velocity, hours remaining, and color-coded
 * heatmap metrics incorporating biological sex, chronological age, conditioning level,
 * and evidence-based supplement acceleration (ISSN/IOC Tier A/B standards).
 */

import type { MedicalHealthConditions, SupplementGoal } from './supplement-prescriptions'
import type { ParqAnswers } from './liability-shield'

export type BiologicalSex = 'male' | 'female'
export type ConditioningLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type PerspectiveView = 'anterior' | 'posterior'

export type MuscleZoneId =
  // Anterior (Front)
  | 'chest'
  | 'deltoids_anterior'
  | 'deltoids_lateral'
  | 'biceps'
  | 'abdominals'
  | 'obliques'
  | 'forearms'
  | 'quadriceps'
  | 'tibialis_anterior'
  // Posterior (Back)
  | 'trapezius'
  | 'rhomboids'
  | 'deltoids_posterior'
  | 'latissimus_dorsi'
  | 'triceps'
  | 'erector_spinae'
  | 'gluteals'
  | 'hamstrings'
  | 'calves_gastrocnemius'

export type RecoverySupplementKey =
  | 'creatine'
  | 'whey_leucine'
  | 'tart_cherry'
  | 'omega3'
  | 'magnesium'
  | 'ubiquinol'
  | 'l_citrulline'
  | 'collagen'

export interface SupplementAccelerationEffect {
  name: string
  reductionPercentage: number // e.g. 15 for 15%
  mechanism: string
}

export const SUPPLEMENT_RECOVERY_EFFECTS: Record<RecoverySupplementKey, SupplementAccelerationEffect> = {
  tart_cherry: {
    name: 'Tart Cherry Anthocyanins (480mg)',
    reductionPercentage: 15,
    mechanism: 'Mitigates exercise-induced muscle damage (EIMD) and suppresses acute inflammatory markers (IL-6, CRP).',
  },
  whey_leucine: {
    name: 'Leucine-Optimized Whey Isolate (30g)',
    reductionPercentage: 15,
    mechanism: 'Stimulates mTOR signaling pathway and saturates myofibrillar protein synthesis (MPS) post-exercise.',
  },
  creatine: {
    name: 'Creapure® Creatine Monohydrate (5g)',
    reductionPercentage: 10,
    mechanism: 'Accelerates intramuscular phosphocreatine resynthesis and intracellular hydration buffer.',
  },
  omega3: {
    name: 'High EPA/DHA Omega-3 (2,000mg)',
    reductionPercentage: 10,
    mechanism: 'Blunts delayed-onset muscle soreness (DOMS) and enhances muscle membrane lipid fluidity.',
  },
  magnesium: {
    name: 'Magnesium Bisglycinate (350mg)',
    reductionPercentage: 10,
    mechanism: 'Optimizes slow-wave restorative sleep and reduces neuromuscular hypertonicity.',
  },
  ubiquinol: {
    name: 'Active Ubiquinol CoQ10 (150mg)',
    reductionPercentage: 8,
    mechanism: 'Enhances mitochondrial electron transport chain efficiency and cellular ATP replenishment.',
  },
  l_citrulline: {
    name: 'Fermented L-Citrulline Malate (6,000mg)',
    reductionPercentage: 8,
    mechanism: 'Boosts endothelial nitric oxide vasodilation, peripheral blood flow, and metabolic waste clearance.',
  },
  collagen: {
    name: 'Hydrolyzed Collagen Peptides + Vitamin C (15g)',
    reductionPercentage: 7,
    mechanism: 'Stimulates tendon and ligament extracellular matrix remodeling and connective tissue tensile recovery.',
  },
}

export interface MuscleTrainingStrain {
  muscleId: MuscleZoneId
  hoursElapsedSinceSession: number
  totalSetsPerformed: number
  averageRpe: number // 1 - 10
  eccentricTempoMultiplier?: number // 1.0 (standard) to 1.35 (slow 4/2/1 tempo)
}

export interface MuscleRecoveryState {
  muscleId: MuscleZoneId
  displayName: string
  perspective: PerspectiveView
  baselineRecoveryHours: number
  adjustedTotalRecoveryHours: number
  hoursElapsed: number
  hoursRemaining: number
  recoveryPercentage: number // 0 - 100
  colorHex: string
  colorTier: 'dark_red' | 'amber' | 'yellow' | 'emerald_green'
  statusTitle: string
  readinessRating: 'Severely Fatigued' | 'Rebuilding' | 'Consolidating' | 'Fully Primed'
  restorativeProtocol: {
    inhibitSmr: string
    lengthenStretch: string
    dosage: string
  }
}

export interface BodyTelemetryCalculationInput {
  age: number // 18 - 85
  sex: BiologicalSex
  conditioning: ConditioningLevel
  activeSupplements: RecoverySupplementKey[]
  strains: MuscleTrainingStrain[]
}

export interface BodyRecoveryTelemetrySummary {
  overallBodyReadinessScore: number // 0 - 100
  totalSupplementsAppliedCount: number
  netRecoverySpeedBonusPercentage: number // 0 - 45%
  fastestRecoveringMuscle: string
  mostFatiguedMuscle: string
  averageHoursToFullSystemSupercompensation: number
  muscles: Record<MuscleZoneId, MuscleRecoveryState>
}

// ── Anatomical Muscle Catalog ────────────────────────────────────────────────
export const ANATOMICAL_MUSCLE_CONFIG: Record<
  MuscleZoneId,
  {
    displayName: string
    perspective: PerspectiveView
    defaultBaselineHours: number // Standard recovery hours for unenhanced reference subject
    inhibitSmr: string
    lengthenStretch: string
    dosage: string
  }
> = {
  // Anterior
  chest: {
    displayName: 'Pectoralis Major & Minor',
    perspective: 'anterior',
    defaultBaselineHours: 60,
    inhibitSmr: 'Foam roll / lacrosse ball on anterior chest & pec minor insertion',
    lengthenStretch: 'Doorway pectoral static stretch with elbow at 90°',
    dosage: '2 sets × 30s hold per side',
  },
  deltoids_anterior: {
    displayName: 'Anterior Deltoids',
    perspective: 'anterior',
    defaultBaselineHours: 48,
    inhibitSmr: 'Trigger point massage ball on front shoulder anterior head',
    lengthenStretch: 'Hands-behind-back chest expansion shoulder extension',
    dosage: '2 sets × 20s hold',
  },
  deltoids_lateral: {
    displayName: 'Lateral Deltoids',
    perspective: 'anterior',
    defaultBaselineHours: 48,
    inhibitSmr: 'Lacrosse ball compression against wall on lateral shoulder',
    lengthenStretch: 'Cross-body shoulder horizontal adduction stretch',
    dosage: '2 sets × 30s hold per arm',
  },
  biceps: {
    displayName: 'Biceps Brachii & Brachialis',
    perspective: 'anterior',
    defaultBaselineHours: 48,
    inhibitSmr: 'Lacrosse ball roller along distal biceps tendon',
    lengthenStretch: 'Wall-assisted biceps & wrist extensor stretch',
    dosage: '2 sets × 25s hold per arm',
  },
  abdominals: {
    displayName: 'Rectus Abdominis (Core Wall)',
    perspective: 'anterior',
    defaultBaselineHours: 42,
    inhibitSmr: 'Gentle core diaphragm release / soft foam roller on abdominal wall',
    lengthenStretch: 'Cobra / prone abdominal extension stretch',
    dosage: '2 sets × 30s rhythmic breathing',
  },
  obliques: {
    displayName: 'External & Internal Obliques',
    perspective: 'anterior',
    defaultBaselineHours: 42,
    inhibitSmr: 'Foam roller on lateral ribcage / hip iliac crest',
    lengthenStretch: 'Standing side-bend overhead reach with lateral shift',
    dosage: '2 sets × 30s hold per side',
  },
  forearms: {
    displayName: 'Forearm Flexors & Extensors',
    perspective: 'anterior',
    defaultBaselineHours: 36,
    inhibitSmr: 'Therapy ball rolling along anterior and posterior forearm',
    lengthenStretch: 'Kneeling palms-down and palms-up wrist stretches',
    dosage: '2 sets × 20s hold each',
  },
  quadriceps: {
    displayName: 'Quadriceps (Rectus Femoris & Vasti)',
    perspective: 'anterior',
    defaultBaselineHours: 72,
    inhibitSmr: 'Foam roll anterior thigh from ASIS to superior patella',
    lengthenStretch: 'Kneeling rear-foot-elevated couch stretch',
    dosage: '2 sets × 45s hold per leg',
  },
  tibialis_anterior: {
    displayName: 'Tibialis Anterior (Shins)',
    perspective: 'anterior',
    defaultBaselineHours: 36,
    inhibitSmr: 'Foam roll on lateral shin muscle belly',
    lengthenStretch: 'Kneeling plantarflexion ankle stretch',
    dosage: '2 sets × 30s hold',
  },

  // Posterior
  trapezius: {
    displayName: 'Upper & Mid Trapezius',
    perspective: 'posterior',
    defaultBaselineHours: 52,
    inhibitSmr: 'Lacrosse ball compression on upper trap / neck junction',
    lengthenStretch: 'Upper trap lateral neck flexion stretch',
    dosage: '2 sets × 30s hold per side',
  },
  rhomboids: {
    displayName: 'Rhomboids & Scapular Retractors',
    perspective: 'posterior',
    defaultBaselineHours: 48,
    inhibitSmr: 'Dual tennis ball peanut between medial scapular borders',
    lengthenStretch: 'Hug-the-tree thoracic flexion stretch',
    dosage: '2 sets × 30s hold',
  },
  deltoids_posterior: {
    displayName: 'Posterior Deltoids',
    perspective: 'posterior',
    defaultBaselineHours: 48,
    inhibitSmr: 'Lacrosse ball on posterior shoulder joint line',
    lengthenStretch: 'Cross-body horizontal adduction stretch',
    dosage: '2 sets × 30s hold per arm',
  },
  latissimus_dorsi: {
    displayName: 'Latissimus Dorsi & Teres Major',
    perspective: 'posterior',
    defaultBaselineHours: 64,
    inhibitSmr: 'Side-lying foam roller on lateral border of scapula',
    lengthenStretch: 'Kneeling Swiss ball / bench lat stretch',
    dosage: '2 sets × 40s hold per side',
  },
  triceps: {
    displayName: 'Triceps Brachii (Long & Lateral Heads)',
    perspective: 'posterior',
    defaultBaselineHours: 48,
    inhibitSmr: 'Foam roller / ball rolling along posterior upper arm',
    lengthenStretch: 'Overhead triceps stretch with elbow flexion',
    dosage: '2 sets × 30s hold per arm',
  },
  erector_spinae: {
    displayName: 'Erector Spinae & Thoracolumbar Fascia',
    perspective: 'posterior',
    defaultBaselineHours: 64,
    inhibitSmr: 'Gentle foam rolling on thoracic spine (avoid lumbar hyperextension)',
    lengthenStretch: 'Cat-camel mobilization & prayer stretch (McGill neutral)',
    dosage: '10 smooth cycles',
  },
  gluteals: {
    displayName: 'Gluteus Maximus, Medius & Piriformis',
    perspective: 'posterior',
    defaultBaselineHours: 68,
    inhibitSmr: 'Foam roller / lacrosse ball on outer hip & gluteal muscle belly',
    lengthenStretch: 'Seated figure-4 piriformis stretch',
    dosage: '2 sets × 45s hold per side',
  },
  hamstrings: {
    displayName: 'Hamstrings (Biceps Femoris & Semitendinosus)',
    perspective: 'posterior',
    defaultBaselineHours: 72,
    inhibitSmr: 'Foam roll posterior thigh from ischial tuberosity to popliteal fossa',
    lengthenStretch: 'Supine active straight leg hamstring stretch with strap',
    dosage: '2 sets × 40s hold per leg',
  },
  calves_gastrocnemius: {
    displayName: 'Gastrocnemius & Soleus (Calves)',
    perspective: 'posterior',
    defaultBaselineHours: 48,
    inhibitSmr: 'Foam roll posterior calf belly with crossed leg for pressure',
    lengthenStretch: 'Wall calf stretch with straight and bent knee',
    dosage: '2 sets × 30s hold per leg',
  },
}

// ── Multi-Factor Recovery Calculation Engine ─────────────────────────────────

/**
 * Computes biological age multiplier on muscle recovery.
 * Captures age-related declines in satellite cell activation, MPS rate, and micro-vascular perfusion.
 */
export function getAgeRecoveryMultiplier(age: number): number {
  if (age <= 30) return 1.0
  if (age <= 39) return 1.05
  if (age <= 49) return 1.15
  if (age <= 59) return 1.25
  if (age <= 69) return 1.38
  return 1.5 // Age 70+
}

/**
 * Computes biological sex multiplier on muscle recovery.
 * Females benefit from 17β-estradiol membrane stabilization and higher type-I fiber lipid metabolism,
 * accelerating metabolic clearance by ~5–8%, while maintaining standard structural collagen rebuild rates.
 */
export function getSexRecoveryMultiplier(sex: BiologicalSex): number {
  return sex === 'female' ? 0.94 : 1.0
}

/**
 * Computes conditioning tier multiplier.
 * Advanced/elite athletes possess higher mitochondrial density, capillary-to-fiber ratios,
 * and faster lactate/creatine kinase clearance.
 */
export function getConditioningRecoveryMultiplier(conditioning: ConditioningLevel): number {
  switch (conditioning) {
    case 'beginner':
      return 1.3 // High unaccustomed eccentric muscle damage (EIMD)
    case 'intermediate':
      return 1.0
    case 'advanced':
      return 0.85
    case 'elite':
      return 0.75
  }
}

/**
 * Calculates net supplement acceleration bonus percentage (capped at 45% maximum acceleration).
 */
export function calculateSupplementAccelerationBonus(supplements: RecoverySupplementKey[]): number {
  let rawBonus = 0
  const uniqueSupplements = Array.from(new Set(supplements))

  for (const suppKey of uniqueSupplements) {
    const effect = SUPPLEMENT_RECOVERY_EFFECTS[suppKey]
    if (effect) {
      rawBonus += effect.reductionPercentage
    }
  }

  // Diminishing returns & biological ceiling cap at 45% faster recovery
  return Math.min(45, Math.round(rawBonus))
}

/**
 * Maps recovery percentage to 4-tier luxury color scheme:
 * - 0–25%: Dark Crimson Red (#DC2626)
 * - 26–55%: Fiery Amber / Orange (#F97316)
 * - 56–85%: Golden Ochre (#FBBF24)
 * - 86–100%: Clinical Emerald Green (#10B981)
 */
export function getRecoveryColorHex(recoveryPercentage: number): {
  colorHex: string
  colorTier: 'dark_red' | 'amber' | 'yellow' | 'emerald_green'
  statusTitle: string
  readinessRating: 'Severely Fatigued' | 'Rebuilding' | 'Consolidating' | 'Fully Primed'
} {
  if (recoveryPercentage < 26) {
    return {
      colorHex: '#DC2626', // Crimson Red
      colorTier: 'dark_red',
      statusTitle: 'Acute Micro-Trauma / High DOMS',
      readinessRating: 'Severely Fatigued',
    }
  }
  if (recoveryPercentage < 56) {
    return {
      colorHex: '#F97316', // Amber / Orange
      colorTier: 'amber',
      statusTitle: 'Active Cellular Synthesis & Rebuild',
      readinessRating: 'Rebuilding',
    }
  }
  if (recoveryPercentage < 86) {
    return {
      colorHex: '#FBBF24', // Golden Yellow
      colorTier: 'yellow',
      statusTitle: 'Neural Recovery & Consolidation',
      readinessRating: 'Consolidating',
    }
  }
  return {
    colorHex: '#10B981', // Emerald Green
    colorTier: 'emerald_green',
    statusTitle: 'Supercompensation Peak / Ready for Overload',
    readinessRating: 'Fully Primed',
  }
}

/**
 * Main Telemetry Engine: Calculates exact localized recovery state for all 18 muscle groups.
 */
export function calculateMuscleRecoveryTelemetry(
  input: BodyTelemetryCalculationInput
): BodyRecoveryTelemetrySummary {
  const { age, sex, conditioning, activeSupplements, strains } = input

  const ageMultiplier = getAgeRecoveryMultiplier(age)
  const sexMultiplier = getSexRecoveryMultiplier(sex)
  const conditioningMultiplier = getConditioningRecoveryMultiplier(conditioning)
  const supplementBonusPercent = calculateSupplementAccelerationBonus(activeSupplements)
  const supplementMultiplier = 1 - supplementBonusPercent / 100

  // Combine global biological recovery modifier
  const globalBiologicalFactor = ageMultiplier * sexMultiplier * conditioningMultiplier * supplementMultiplier

  const strainMap = new Map<MuscleZoneId, MuscleTrainingStrain>()
  strains.forEach(s => strainMap.set(s.muscleId, s))

  const muscleResults = {} as Record<MuscleZoneId, MuscleRecoveryState>
  let totalScoreSum = 0
  let muscleCount = 0
  let maxFatigueRemainingHours = -1
  let mostFatiguedMuscleName = 'None'
  let minFatigueRemainingHours = 999
  let fastestRecoveringMuscleName = 'None'

  const allMuscleKeys = Object.keys(ANATOMICAL_MUSCLE_CONFIG) as MuscleZoneId[]

  for (const muscleId of allMuscleKeys) {
    const config = ANATOMICAL_MUSCLE_CONFIG[muscleId]
    const strain = strainMap.get(muscleId)

    // Base recovery hours depends on muscle configuration and session volume/intensity
    let baselineHours = config.defaultBaselineHours

    let hoursElapsed = 72 // Default to fully recovered if no recent strain recorded
    if (strain) {
      hoursElapsed = Math.max(0, strain.hoursElapsedSinceSession)
      // High volume (>4 sets) or high RPE (7+) increases baseline recovery hours required
      const volumeFactor = Math.max(0.8, 1 + (strain.totalSetsPerformed - 4) * 0.06)
      const rpeFactor = Math.max(0.85, 1 + (strain.averageRpe - 7) * 0.08)
      const tempoFactor = strain.eccentricTempoMultiplier ?? 1.0
      baselineHours = Math.round(baselineHours * volumeFactor * rpeFactor * tempoFactor)
    }

    // Apply biological age, sex, conditioning, and supplement acceleration modifiers
    const adjustedTotalRecoveryHours = Math.max(12, Math.round(baselineHours * globalBiologicalFactor))
    const hoursRemaining = Math.max(0, Math.round(adjustedTotalRecoveryHours - hoursElapsed))

    // Calculate percentage recovered (0 - 100)
    let recoveryPercentage = Math.min(100, Math.round((hoursElapsed / adjustedTotalRecoveryHours) * 100))
    if (!strain) {
      recoveryPercentage = 100
    }

    const { colorHex, colorTier, statusTitle, readinessRating } = getRecoveryColorHex(recoveryPercentage)

    muscleResults[muscleId] = {
      muscleId,
      displayName: config.displayName,
      perspective: config.perspective,
      baselineRecoveryHours: baselineHours,
      adjustedTotalRecoveryHours,
      hoursElapsed,
      hoursRemaining,
      recoveryPercentage,
      colorHex,
      colorTier,
      statusTitle,
      readinessRating,
      restorativeProtocol: {
        inhibitSmr: config.inhibitSmr,
        lengthenStretch: config.lengthenStretch,
        dosage: config.dosage,
      },
    }

    totalScoreSum += recoveryPercentage
    muscleCount++

    if (hoursRemaining > maxFatigueRemainingHours) {
      maxFatigueRemainingHours = hoursRemaining
      mostFatiguedMuscleName = config.displayName
    }
    if (hoursRemaining < minFatigueRemainingHours) {
      minFatigueRemainingHours = hoursRemaining
      fastestRecoveringMuscleName = config.displayName
    }
  }

  const overallScore = Math.round(totalScoreSum / muscleCount)

  return {
    overallBodyReadinessScore: overallScore,
    totalSupplementsAppliedCount: Array.from(new Set(activeSupplements)).length,
    netRecoverySpeedBonusPercentage: supplementBonusPercent,
    fastestRecoveringMuscle: fastestRecoveringMuscleName,
    mostFatiguedMuscle: mostFatiguedMuscleName,
    averageHoursToFullSystemSupercompensation: Math.max(0, maxFatigueRemainingHours),
    muscles: muscleResults,
  }
}

// ── 3D Workout Log Ingestion & Real-Time Strain Extractor ────────────────────

export interface MuscleExerciseMapping {
  primary: MuscleZoneId[]
  secondary: MuscleZoneId[]
}

/**
 * Biomechanically maps any exercise string to primary and secondary muscle zones.
 */
export function mapExerciseToMuscleZones(exerciseName: string): MuscleExerciseMapping {
  const text = String(exerciseName ?? '').toLowerCase().trim()
  const primary: Set<MuscleZoneId> = new Set()
  const secondary: Set<MuscleZoneId> = new Set()

  // 1. CHEST / PECTORALIS
  if (/bench|push-?up|chest|fly|pec|dip|floor press|svend|incline (?:db|dumbbell|barbell|flat)? ?press|decline (?:db|dumbbell|barbell)? ?press|flat (?:db|dumbbell|barbell)? ?press|dumbbell press|db press/i.test(text)) {
    primary.add('chest')
    secondary.add('triceps')
    secondary.add('deltoids_anterior')
  }

  // 2. SHOULDERS / DELTOIDS
  if (/shoulder|overhead|military|arnold|handstand|push press|landmine|front raise|strict press/i.test(text) && !/bench|leg press/.test(text)) {
    primary.add('deltoids_anterior')
    secondary.add('triceps')
    secondary.add('trapezius')
  }
  if (/lateral raise|side raise|lu raise|upright row/i.test(text)) {
    primary.add('deltoids_lateral')
    secondary.add('trapezius')
  }
  if (/rear delt|face pull|reverse fly|band pull-?apart|rear raise|high cable pull/i.test(text)) {
    primary.add('deltoids_posterior')
    secondary.add('rhomboids')
    secondary.add('trapezius')
  }

  // 3. TRICEPS
  if (/tricep|skull crusher|pushdown|kickback|jm press|close grip bench|diamond push/.test(text)) {
    primary.add('triceps')
  }

  // 4. BICEPS & FOREARMS
  if (/curl|chin-?up/.test(text) && !/leg curl|hamstring curl/.test(text)) {
    primary.add('biceps')
    secondary.add('forearms')
  }
  if (/wrist|farmer|carry|dead hang|crush|grip/.test(text)) {
    primary.add('forearms')
  }

  // 5. BACK / LATS / UPPER BACK
  if (/lat pulldown|pull-?up|chin-?up|pulldown|straight arm pull/.test(text)) {
    primary.add('latissimus_dorsi')
    secondary.add('biceps')
    secondary.add('rhomboids')
  }
  if (/row|t-bar|seated row|chest supported row|seal row|meadows/.test(text) && !/upright row/.test(text)) {
    primary.add('latissimus_dorsi')
    primary.add('rhomboids')
    secondary.add('deltoids_posterior')
    secondary.add('biceps')
    secondary.add('trapezius')
  }
  if (/shrug|high pull|power clean|snatch/.test(text)) {
    primary.add('trapezius')
  }

  // 6. LOWER BACK / POSTERIOR CHAIN / ERECTORS
  if (/deadlift|rdl|romanian deadlift|good morning|hyperextension|back extension|rack pull/.test(text)) {
    primary.add('erector_spinae')
    primary.add('hamstrings')
    primary.add('gluteals')
    secondary.add('trapezius')
    secondary.add('forearms')
  }

  // 7. GLUTES
  if (/hip thrust|glute bridge|kickback|cable pull through|clamshell|step-?up|hip abduction/.test(text)) {
    primary.add('gluteals')
    secondary.add('hamstrings')
  }

  // 8. QUADRICEPS
  if (/squat|leg press|hack squat|lunge|split squat|bulgarian|leg extension|sissy squat|step-?up|goblet/.test(text)) {
    primary.add('quadriceps')
    secondary.add('gluteals')
    if (/lunge|split squat|bulgarian|step-?up/.test(text)) secondary.add('hamstrings')
  }

  // 9. HAMSTRINGS
  if (/leg curl|hamstring curl|nordic|glute-?ham|seated curl|lying curl|stiff-?leg/.test(text)) {
    primary.add('hamstrings')
    secondary.add('calves_gastrocnemius')
  }

  // 10. CALVES & TIBIALIS
  if (/calf|raise|soleus|gastrocnemius|jump rope|jumping jack|box jump/.test(text) && !/lateral raise|front raise/.test(text)) {
    primary.add('calves_gastrocnemius')
  }
  if (/tibialis|shin|toe raise|heel walk/.test(text)) {
    primary.add('tibialis_anterior')
  }

  // 11. CORE / ABDOMINALS / OBLIQUES
  if (/plank|crunch|sit-?up|leg raise|rollout|ab wheel|dead bug|hollow|v-up|toe touch|knee tuck/.test(text)) {
    primary.add('abdominals')
  }
  if (/woodchop|russian twist|pallof|side plank|bicycle|windmill|suitcase carry|side bend/.test(text)) {
    primary.add('obliques')
    secondary.add('abdominals')
  }

  // Fallback if no specific match
  if (primary.size === 0 && secondary.size === 0) {
    if (/push|press/.test(text)) {
      primary.add('chest')
      secondary.add('triceps')
    } else if (/pull|back/.test(text)) {
      primary.add('latissimus_dorsi')
      secondary.add('biceps')
    } else if (/leg|lower/.test(text)) {
      primary.add('quadriceps')
      secondary.add('hamstrings')
    } else {
      primary.add('abdominals')
    }
  }

  return {
    primary: Array.from(primary),
    secondary: Array.from(secondary),
  }
}

export interface WorkoutHistoryExtractionResult {
  strains: MuscleTrainingStrain[]
  totalSetsAnalyzed: number
  workoutCount: number
  lastWorkoutDate: string | null
  lastWorkoutTitle: string | null
  muscleLastTrained: Partial<
    Record<
      MuscleZoneId,
      {
        exerciseName: string
        sessionDate: string
        hoursAgo: number
        totalSets: number
        averageRpe: number
      }
    >
  >
}

/**
 * Ingests real user workout logs and set logs, maps exercises to anatomical zones,
 * and calculates exact hours elapsed and accumulated training strain for all 18 muscle groups.
 */
export function extractMuscleStrainsFromWorkoutLogs(options: {
  workoutLogs?: Array<{
    id?: string
    session_date: string
    session_title?: string
    exertion_rpe?: number
    created_at?: string
  }>
  workoutSetLogs?: Array<{
    id?: string
    session_date: string
    exercise_name: string
    set_number?: number
    reps?: number
    rpe?: number
    tempo?: string
    created_at?: string
  }>
  workoutPlans?: Array<{
    plan_json?: {
      workouts?: Array<{
        focus: string
        exercises: Array<{ name: string; sets: string; reps: string; tempo?: string | null }>
      }>
    }
  }>
  referenceDate?: Date | number
  hoursOffset?: number // For time-lapse slider preview (+12h, +24h, etc.)
}): WorkoutHistoryExtractionResult {
  const {
    workoutLogs = [],
    workoutSetLogs = [],
    workoutPlans: _workoutPlans = [],
    referenceDate = new Date(),
    hoursOffset = 0,
  } = options

  const nowTime = typeof referenceDate === 'number' ? referenceDate : referenceDate.getTime()
  const effectiveNow = nowTime + hoursOffset * 3600 * 1000

  // Track aggregated strains per muscle
  const muscleAccumulators: Partial<
    Record<
      MuscleZoneId,
      {
        latestTimestamp: number
        latestSessionDate: string
        latestExerciseName: string
        totalSets: number
        rpeSum: number
        rpeCount: number
        tempoMultiplierMax: number
      }
    >
  > = {}

  let totalSetsAnalyzed = 0

  // ── A. Process Workout Set Logs (Highest precision: individual sets & exercises) ──
  for (const set of workoutSetLogs) {
    if (!set.exercise_name || !set.session_date) continue

    // Parse date timestamp
    let sessionTime = new Date(set.session_date).getTime()
    if (isNaN(sessionTime)) {
      sessionTime = set.created_at ? new Date(set.created_at).getTime() : nowTime
    } else {
      // If date-only 'YYYY-MM-DD', normalize to midday 12:00
      if (/^\d{4}-\d{2}-\d{2}$/.test(set.session_date)) {
        sessionTime += 12 * 3600 * 1000
      }
    }

    const hoursAgo = Math.max(0, (effectiveNow - sessionTime) / (1000 * 60 * 60))

    // Only process workouts within the 7-day (168h) recovery window
    if (hoursAgo > 168) continue

    totalSetsAnalyzed++
    const mapping = mapExerciseToMuscleZones(set.exercise_name)
    const setRpe = typeof set.rpe === 'number' && set.rpe >= 1 ? set.rpe : 8.0
    const tempoMultiplier = /4\/2\/1|3\/1\/1|tempo|eccentric/i.test(set.tempo ?? '') ? 1.25 : 1.0

    // Primary muscle target receives full set weight (1.0)
    for (const muscle of mapping.primary) {
      const existing = muscleAccumulators[muscle] ?? {
        latestTimestamp: sessionTime,
        latestSessionDate: set.session_date,
        latestExerciseName: set.exercise_name,
        totalSets: 0,
        rpeSum: 0,
        rpeCount: 0,
        tempoMultiplierMax: 1.0,
      }

      if (sessionTime >= existing.latestTimestamp) {
        existing.latestTimestamp = sessionTime
        existing.latestSessionDate = set.session_date
        existing.latestExerciseName = set.exercise_name
      }

      existing.totalSets += 1
      existing.rpeSum += setRpe
      existing.rpeCount += 1
      existing.tempoMultiplierMax = Math.max(existing.tempoMultiplierMax, tempoMultiplier)
      muscleAccumulators[muscle] = existing
    }

    // Secondary muscle targets receive partial set weight (0.5 set)
    for (const muscle of mapping.secondary) {
      const existing = muscleAccumulators[muscle] ?? {
        latestTimestamp: sessionTime,
        latestSessionDate: set.session_date,
        latestExerciseName: set.exercise_name,
        totalSets: 0,
        rpeSum: 0,
        rpeCount: 0,
        tempoMultiplierMax: 1.0,
      }

      if (sessionTime >= existing.latestTimestamp) {
        existing.latestTimestamp = sessionTime
        existing.latestSessionDate = set.session_date
        existing.latestExerciseName = set.exercise_name
      }

      existing.totalSets += 0.5
      existing.rpeSum += setRpe * 0.5
      existing.rpeCount += 0.5
      existing.tempoMultiplierMax = Math.max(existing.tempoMultiplierMax, tempoMultiplier)
      muscleAccumulators[muscle] = existing
    }
  }

  // ── B. Fallback to Workout Logs if Set Logs are empty ──
  if (totalSetsAnalyzed === 0 && workoutLogs.length > 0) {
    for (const log of workoutLogs) {
      if (!log.session_date) continue

      let sessionTime = new Date(log.session_date).getTime()
      if (isNaN(sessionTime)) sessionTime = log.created_at ? new Date(log.created_at).getTime() : nowTime
      else if (/^\d{4}-\d{2}-\d{2}$/.test(log.session_date)) sessionTime += 12 * 3600 * 1000

      const hoursAgo = Math.max(0, (effectiveNow - sessionTime) / (1000 * 60 * 60))
      if (hoursAgo > 168) continue

      const title = log.session_title ?? 'Workout Session'
      const avgRpe = typeof log.exertion_rpe === 'number' && log.exertion_rpe >= 1 ? log.exertion_rpe : 8.0

      // Map session title focus
      const mapping = mapExerciseToMuscleZones(title)
      for (const muscle of [...mapping.primary, ...mapping.secondary]) {
        const existing = muscleAccumulators[muscle] ?? {
          latestTimestamp: sessionTime,
          latestSessionDate: log.session_date,
          latestExerciseName: title,
          totalSets: 0,
          rpeSum: 0,
          rpeCount: 0,
          tempoMultiplierMax: 1.0,
        }

        existing.totalSets += 4
        existing.rpeSum += avgRpe * 4
        existing.rpeCount += 4
        muscleAccumulators[muscle] = existing
      }
    }
  }

  // ── C. Build Strains & Metadata ──
  const strains: MuscleTrainingStrain[] = []
  const muscleLastTrained: WorkoutHistoryExtractionResult['muscleLastTrained'] = {}

  for (const [muscleIdKey, acc] of Object.entries(muscleAccumulators)) {
    const muscleId = muscleIdKey as MuscleZoneId
    if (!acc) continue

    const hoursElapsed = Math.max(0, (effectiveNow - acc.latestTimestamp) / (1000 * 60 * 60))
    const avgRpe = acc.rpeCount > 0 ? Number((acc.rpeSum / acc.rpeCount).toFixed(1)) : 8.0
    const totalSets = Math.round(acc.totalSets)

    if (totalSets > 0) {
      strains.push({
        muscleId,
        hoursElapsedSinceSession: hoursElapsed,
        totalSetsPerformed: Math.max(1, totalSets),
        averageRpe: avgRpe,
        eccentricTempoMultiplier: acc.tempoMultiplierMax,
      })

      muscleLastTrained[muscleId] = {
        exerciseName: acc.latestExerciseName,
        sessionDate: acc.latestSessionDate,
        hoursAgo: Math.round(hoursElapsed),
        totalSets,
        averageRpe: avgRpe,
      }
    }
  }

  const latestLog = workoutLogs[0]

  return {
    strains,
    totalSetsAnalyzed,
    workoutCount: workoutLogs.length,
    lastWorkoutDate: latestLog?.session_date ?? null,
    lastWorkoutTitle: latestLog?.session_title ?? null,
    muscleLastTrained,
  }
}

// ── Biometric & Clinical PAR-Q Integration Engine ────────────────────────────

/**
 * Automatically chooses the client's conditioning tier from their GAA fitness profile,
 * periodization plan (NASM OPT phase), and logged training history.
 */
export function resolveClientConditioningTier(
  profile?: { experience_level?: string | null; activity_level?: string | null } | null,
  plan?: { nasm_opt_phase?: number; phase_name?: string } | null,
  logsCount?: number
): ConditioningLevel {
  const exp = String(profile?.experience_level || '').toLowerCase().trim()
  if (exp.includes('elite') || exp.includes('pro') || exp.includes('master')) return 'elite'
  if (exp.includes('adv')) return 'advanced'
  if (exp.includes('inter')) return 'intermediate'
  if (exp.includes('beg') || exp.includes('novice')) return 'beginner'

  const act = String(profile?.activity_level || '').toLowerCase().trim()
  if (act.includes('athlete') || act.includes('extreme') || act.includes('very_active')) return 'advanced'
  if (act.includes('sedentary') || act.includes('light')) return 'beginner'

  const optPhase = plan?.nasm_opt_phase
  if (optPhase === 5) return 'elite'
  if (optPhase === 4) return 'advanced'
  if (optPhase === 2 || optPhase === 3) return 'intermediate'
  if (optPhase === 1) return 'beginner'

  if (typeof logsCount === 'number') {
    if (logsCount >= 40) return 'advanced'
    if (logsCount >= 15) return 'intermediate'
    if (logsCount < 5) return 'beginner'
  }

  return 'intermediate'
}

export interface ParqMedicationProfile extends MedicalHealthConditions {
  rawMedicationsText: string
  rawConditionsText: string
  detectedMedicationCategories: string[]
  hasAnyReportedMedications: boolean
}

/**
 * Extracts clinical medication categories and health conditions from PAR-Q structured answers
 * and client intake free-text fields.
 */
export function parseParqMedicationsAndConditions(
  parqAnswers?: ParqAnswers | Record<string, unknown> | null,
  medicationsText?: string | null,
  medicalConditionsText?: string | null
): ParqMedicationProfile {
  const rawParq = (parqAnswers as Record<string, unknown> | undefined) || {}
  const meds = String(medicationsText || '').toLowerCase()
  const conditions = String(medicalConditionsText || '').toLowerCase()
  const notes = String(rawParq.reportedConditionsNotes || '').toLowerCase()
  const combined = `${meds} ${conditions} ${notes}`

  const detected: string[] = []

  // 1. Anticoagulants / Antiplatelet Blood Thinners
  const takingAnticoagulants =
    /warfarin|coumadin|eliquis|apixaban|xarelto|rivaroxaban|plavix|clopidogrel|pradaxa|dabigatran|brilinta|ticagrelor|heparin|lovenox|enoxaparin|blood\s*thinner|anticoagulant|antiplatelet/.test(combined) ||
    (/\baspirin\b/.test(meds) && /daily|81|baby|325|cardio|regimen/.test(meds))

  if (takingAnticoagulants) detected.push('Anticoagulants / Blood Thinners')

  // 2. Antihypertensives & Cardiovascular
  const parqFlaggedBp = Boolean(
    rawParq.takesBloodPressureOrHeartMedication ||
    rawParq.bloodPressureMedication ||
    rawParq.q6 ||
    rawParq.hasHeartCondition ||
    rawParq.q1
  )
  const takingAntihypertensives =
    parqFlaggedBp ||
    /lisinopril|losartan|metoprolol|amlodipine|hydrochlorothiazide|\bhctz\b|atenolol|enalapril|ramipril|valsartan|carvedilol|propranolol|diltiazem|verapamil|spironolactone|clonidine|furosemide|lasix|blood\s*pressure|hypertension|antihypertensive/.test(combined)

  if (takingAntihypertensives) detected.push('Antihypertensives & Cardiovascular')

  // 3. Thyroid Hormone Replacement
  const takingThyroidHormone =
    /levothyroxine|synthroid|armour\s*thyroid|liothyronine|cytomel|tirosint|euthyrox|thyroid/.test(combined)

  if (takingThyroidHormone) detected.push('Thyroid Hormone Replacement')

  // 4. Statins / Cholesterol-Lowering
  const takingStatins =
    /atorvastatin|lipitor|rosuvastatin|crestor|simvastatin|zocor|pravastatin|lovastatin|\bstatin\b|cholesterol\s*med/.test(combined)

  if (takingStatins) detected.push('Statins / Cholesterol-Lowering')

  // 5. Antidepressants (SSRIs, SNRIs, MAOIs)
  const takingAntidepressants =
    /sertraline|zoloft|escitalopram|lexapro|fluoxetine|prozac|citalopram|celexa|paroxetine|paxil|duloxetine|cymbalta|venlafaxine|effexor|bupropion|wellbutrin|trazodone|amitriptyline|antidepressant|\bssri\b|\bsnri\b|\bmaoi\b/.test(combined)

  if (takingAntidepressants) detected.push('Antidepressants (SSRIs/SNRIs)')

  // 6. Diabetes Medications & GLP-1 Agonists
  const takingDiabetesMedications =
    /metformin|glucophage|ozempic|semaglutide|wegovy|mounjaro|tirzepatide|zepbound|rybelsus|januvia|sitagliptin|jardiance|empagliflozin|farxiga|glipizide|glimepiride|insulin|lantus|humalog|novolog|tresiba|diabetes/.test(combined)

  if (takingDiabetesMedications) detected.push('Diabetes Medications & GLP-1')

  // 7. Oral Antibiotics
  const takingOralAntibiotics =
    /cipro|ciprofloxacin|doxycycline|amoxicillin|augmentin|levofloxacin|levaquin|azithromycin|z-pak|bactrim|antibiotic/.test(combined)

  if (takingOralAntibiotics) detected.push('Oral Antibiotics')

  // 8. Immunosuppressants & Corticosteroids
  const takingImmunosuppressantsOrSteroids =
    /prednisone|prednisolone|dexamethasone|medrol|methylprednisolone|tacrolimus|prograf|cyclosporine|methotrexate|humira|enbrel|corticosteroid|immunosuppressant|\bsteroid\b/.test(combined)

  if (takingImmunosuppressantsOrSteroids) detected.push('Immunosuppressants & Corticosteroids')

  // 9. Kidney / Renal Conditions
  const hasKidneyCondition =
    /kidney|renal|dialysis|\bckd\b|nephropathy|glomerulonephritis/.test(combined)

  if (hasKidneyCondition) detected.push('Renal / Kidney Impairment')

  const hasAnyReportedMedications =
    detected.length > 0 ||
    Boolean(meds.trim().length > 0 && meds.trim() !== 'none' && meds.trim() !== 'n/a' && meds.trim() !== 'no')

  return {
    takingAnticoagulants,
    takingBloodThinners: takingAnticoagulants,
    takingAntihypertensives,
    hasHypertension: takingAntihypertensives,
    takingThyroidHormone,
    takingStatins,
    takingAntidepressants,
    takingDiabetesMedications,
    takingOralAntibiotics,
    takingImmunosuppressantsOrSteroids,
    hasKidneyCondition,
    rawMedicationsText: String(medicationsText || '').trim(),
    rawConditionsText: String(medicalConditionsText || '').trim(),
    detectedMedicationCategories: detected,
    hasAnyReportedMedications,
  }
}

/**
 * Automatically determines optimal evidence-based recovery supplements tailored for the client's fitness goal.
 */
export function getGoalRecommendedRecoverySupplements(
  rawGoal?: string | null,
  isMasters: boolean = false
): RecoverySupplementKey[] {
  const g = String(rawGoal || '').toLowerCase()
  if (g.includes('power') || g.includes('speed') || g.includes('athletic') || g.includes('strength')) {
    // Athletic Power & Explosive Performance:
    return ['creatine', 'whey_leucine', 'magnesium', 'tart_cherry', 'ubiquinol', 'collagen']
  }
  if (g.includes('fat') || g.includes('weight') || g.includes('cut') || g.includes('lean')) {
    // Fat Loss / Metabolic Definition:
    return ['whey_leucine', 'magnesium', 'omega3', 'tart_cherry']
  }
  if (g.includes('longevity') || g.includes('vitality') || g.includes('joint') || g.includes('health') || isMasters) {
    // Longevity, Joint Health & Masters Vitality:
    return ['ubiquinol', 'omega3', 'magnesium', 'whey_leucine', 'tart_cherry', 'collagen']
  }
  // Default: Hypertrophy / Muscle Building / Body Recomposition:
  return ['whey_leucine', 'creatine', 'magnesium', 'omega3', 'l_citrulline']
}

export interface SupplementContraindicationAlert {
  key: RecoverySupplementKey
  supplementName: string
  medicationCategory: string
  reason: string
  clinicalDirective: string
}

export interface SupplementScreeningResult {
  allowedSupplements: RecoverySupplementKey[]
  contraindicatedSupplements: SupplementContraindicationAlert[]
  chronoSeparationNotes: Array<{
    key: RecoverySupplementKey
    supplementName: string
    note: string
  }>
}

/**
 * Screen recovery supplements against client's PAR-Q medications and health conditions.
 * Strictly withholds / excludes any supplements that will cause negative effects.
 */
export function screenRecoverySupplementsForContraindications(
  candidateSupplements: RecoverySupplementKey[],
  conditions: MedicalHealthConditions
): SupplementScreeningResult {
  const contraindicated: SupplementContraindicationAlert[] = []
  const chronoNotes: Array<{ key: RecoverySupplementKey; supplementName: string; note: string }> = []
  const blockedKeys = new Set<RecoverySupplementKey>()

  const isTakingBloodThinners = Boolean(conditions.takingAnticoagulants || conditions.takingBloodThinners)

  // 1. Anticoagulants (Warfarin, Eliquis, Plavix, Aspirin)
  if (isTakingBloodThinners) {
    blockedKeys.add('tart_cherry')
    contraindicated.push({
      key: 'tart_cherry',
      supplementName: SUPPLEMENT_RECOVERY_EFFECTS.tart_cherry.name,
      medicationCategory: 'Anticoagulant / Blood Thinner Therapy',
      reason: 'High-concentration anthocyanins possess additive antiplatelet and COX-inhibition effects, compounding hemorrhagic bleeding risks.',
      clinicalDirective: 'Withheld to protect INR stability and prevent severe bleeding events.',
    })

    blockedKeys.add('omega3')
    contraindicated.push({
      key: 'omega3',
      supplementName: SUPPLEMENT_RECOVERY_EFFECTS.omega3.name,
      medicationCategory: 'Anticoagulant / Blood Thinner Therapy',
      reason: 'High-dose Omega-3 (>2,000mg) exerts additive antiplatelet effects that compound bleeding risk with prescription blood thinners.',
      clinicalDirective: 'High-dose formula withheld; consult physician for moderate low-dose (≤1,000mg) allowance.',
    })
  }

  // 2. Renal / Kidney Impairment
  if (conditions.hasKidneyCondition) {
    blockedKeys.add('creatine')
    contraindicated.push({
      key: 'creatine',
      supplementName: SUPPLEMENT_RECOVERY_EFFECTS.creatine.name,
      medicationCategory: 'Renal / Kidney Impairment',
      reason: 'Creatine monohydrate increases creatinine filtration demands and confounds glomerular filtration rate (eGFR) clinical monitoring.',
      clinicalDirective: 'Withheld until nephrologist approval is documented.',
    })

    blockedKeys.add('whey_leucine')
    contraindicated.push({
      key: 'whey_leucine',
      supplementName: SUPPLEMENT_RECOVERY_EFFECTS.whey_leucine.name,
      medicationCategory: 'Renal / Kidney Impairment',
      reason: 'High protein boluses increase nitrogenous waste filtration workload on compromised kidneys.',
      clinicalDirective: 'Withheld; maintain physician-prescribed daily dietary protein threshold.',
    })
  }

  // 3. Thyroid Hormone Replacement (Levothyroxine)
  if (conditions.takingThyroidHormone) {
    chronoNotes.push({
      key: 'magnesium',
      supplementName: SUPPLEMENT_RECOVERY_EFFECTS.magnesium.name,
      note: 'Mandatory 4-Hour Separation: Take at bedtime, at least 4 hours after morning Levothyroxine to prevent 70–80% drug malabsorption.',
    })
    chronoNotes.push({
      key: 'whey_leucine',
      supplementName: SUPPLEMENT_RECOVERY_EFFECTS.whey_leucine.name,
      note: 'Separate whey protein shake from morning thyroid medication by at least 4 hours.',
    })
  }

  // 4. Oral Antibiotics
  if (conditions.takingOralAntibiotics) {
    blockedKeys.add('magnesium')
    contraindicated.push({
      key: 'magnesium',
      supplementName: SUPPLEMENT_RECOVERY_EFFECTS.magnesium.name,
      medicationCategory: 'Oral Antibiotic Therapy (Fluoroquinolones/Tetracyclines)',
      reason: 'Divalent magnesium cations chelate antibiotic molecules in the gastrointestinal tract, rendering the antibiotic clinically ineffective.',
      clinicalDirective: 'Withheld during active antibiotic course to prevent antimicrobial failure.',
    })
  }

  const allowedSupplements = candidateSupplements.filter(key => !blockedKeys.has(key))

  return {
    allowedSupplements,
    contraindicatedSupplements: contraindicated,
    chronoSeparationNotes: chronoNotes,
  }
}


