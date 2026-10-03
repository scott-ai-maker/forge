/**
 * Medical Screening, Contraindications & Legal Liability Protection Shield
 * Implements 7-Point NASM PAR-Q+ screening, medical clearance risk stratification,
 * and automated biomechanical exercise contraindication blacklists.
 */

export interface ParqAnswers {
  hasHeartCondition: boolean
  experiencesChestPain: boolean
  experiencesDizzinessOrSyncope: boolean
  hasBoneOrJointProblem: boolean
  takesBloodPressureOrHeartMedication: boolean
  hasChronicSpinalOrDiscCondition: boolean
  hasRecentSurgeryOrInjury: boolean
  reportedConditionsNotes?: string
  signedWaiverName?: string
  signedAt?: string
}

export type MedicalClearanceStatus =
  | 'cleared_unrestricted'
  | 'cleared_with_modifications'
  | 'physician_clearance_required'

export interface ParqEvaluationResult {
  clearanceStatus: MedicalClearanceStatus
  riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk - Medical Clearance Required'
  flaggedQuestionsCount: number
  flaggedItems: string[]
  maxAllowedOptPhase: number // 1 (Stabilization) through 5 (Power)
  contraindicationTags: string[]
  legalDisclaimer: string
}

export interface ContraindicationRule {
  tag: string
  label: string
  blacklistedExercises: string[]
  prescribedSubstitutions: Record<string, {
    replacement: string
    rationale: string
    coachingCue: string
  }>
  generalGuideline: string
}

import { COMMON_SPORTS_INJURIES } from './sports-injuries'

const sportsInjuryRules: Record<string, ContraindicationRule> = {}
for (const [injuryId, def] of Object.entries(COMMON_SPORTS_INJURIES)) {
  const substitutionsMap: Record<string, { replacement: string; rationale: string; coachingCue: string }> = {}
  for (const sub of def.prescribedSubstitutions) {
    substitutionsMap[sub.targetExerciseOrPattern] = {
      replacement: sub.replacement,
      rationale: sub.rationale,
      coachingCue: sub.coachingCue,
    }
  }

  sportsInjuryRules[injuryId] = {
    tag: injuryId,
    label: def.name,
    blacklistedExercises: def.blacklistedExercises,
    prescribedSubstitutions: substitutionsMap,
    generalGuideline: def.trainerProtocol,
  }
}

export const CONTRAINDICATION_RULES: Record<string, ContraindicationRule> = {
  ...sportsInjuryRules,
  // Alias legacy PAR-Q tags to their sports injury equivalents
  knee_patellofemoral: sportsInjuryRules.runners_knee || {
    tag: 'knee_patellofemoral',
    label: 'Patellofemoral Knee Irritation / ACL Sensitivity',
    blacklistedExercises: [
      'Seated Leg Extension (Open Chain Shear)',
      'Deep Box Jumps (High Impact Landings)',
      'Walking Lunges with Forward Knee Shear',
    ],
    prescribedSubstitutions: {
      'Seated Leg Extension': {
        replacement: 'Spanish Squats with Heavy Loop Band (Closed Kinetic Chain VMO)',
        rationale: 'Eliminates anterior patellar shear while maximizing isometric VMO motor unit recruitment.',
        coachingCue: 'Keep shins vertical, sit back into the band tension.',
      },
      'Deep Box Jumps': {
        replacement: 'Low-Impact Banded Kettlebell Swings & Box Step-Ups',
        rationale: 'Preserves triple extension power output without joint landing shock.',
        coachingCue: 'Drive through heels with rapid hip extension.',
      },
    },
    generalGuideline: 'Maintain vertical shin angles; emphasize posterior chain (glutes/hamstrings) dominance.',
  },
  lumbar_disc_condition: sportsInjuryRules.lumbar_strain_disc || {
    tag: 'lumbar_disc_condition',
    label: 'Lumbar Spine / Disc Herniation / Low Back Pain',
    blacklistedExercises: [
      'Loaded Spinal Flexion (Jefferson Curls)',
      'Behind-the-Neck Good Mornings',
      'Roman Chair Hyper-Extensions (Hyperextension Shear)',
    ],
    prescribedSubstitutions: {
      'Jefferson Curls': {
        replacement: 'McGill Big 3 (Modified Curl-Up, Side Bridge, Quadruped Bird-Dog)',
        rationale: 'Builds 360° neuromuscular core cylinder stiffness without spinal flexion shear.',
        coachingCue: 'Maintain pristine neutral lumbar spine throughout all planes of motion.',
      },
      'Good Mornings': {
        replacement: 'Trap Bar High-Handle Deadlift & Banded Hip Hinge',
        rationale: 'Brings load closer to center of mass, reducing lumbar shear forces by >40%.',
        coachingCue: 'Pack lats into back pockets; push hips straight back.',
      },
    },
    generalGuideline: 'Strict neutral spine enforcement; eliminate end-range lumbar flexion under axial loads.',
  },
  shoulder_impingement: sportsInjuryRules.rotator_cuff_impingement || {
    tag: 'shoulder_impingement',
    label: 'Subacromial Shoulder Impingement / Rotator Cuff Strain',
    blacklistedExercises: [
      'Behind-the-Neck Barbell Press (Extreme External Rotation Shear)',
      'Upright Barbell Rows (Internal Rotation + High Elevation)',
      'Deep Chest Dips (Anterior Glenohumeral Glide)',
    ],
    prescribedSubstitutions: {
      'Behind-the-Neck Barbell Press': {
        replacement: 'Standing Neutral-Grip DB Overhead Press in Scapular Plane (30° Angle)',
        rationale: 'Opens the subacromial space, preventing supraspinatus tendon pinching.',
        coachingCue: 'Press in front of face with elbows tucked at 45° in scapular plane.',
      },
      'Upright Barbell Rows': {
        replacement: 'Half-Kneeling Landmine Press & Chest-Supported Incline Y-Raises',
        rationale: 'Fosters upward scapular rotation and lower trapezius activation without impingement.',
        coachingCue: 'Lead with thumbs up, squeeze lower shoulder blades.',
      },
    },
    generalGuideline: 'Train pressing exclusively within the scapular plane (30° anterior to frontal plane).',
  },
  cardiovascular_hypertension: {
    tag: 'cardiovascular_hypertension',
    label: 'Hypertension / Cardiovascular Sensitivity',
    blacklistedExercises: [
      '1RM Maximal Strain Lifts (Excessive Valsalva Maneuver)',
      'Inverted Leg Press / Heavy Incline Straining',
    ],
    prescribedSubstitutions: {
      '1RM Maximal Strain': {
        replacement: 'Controlled Phase 1 & 2 Loading (4/2/1 Tempo @ 60–75% 1RM)',
        rationale: 'Prevents acute blood pressure spikes associated with prolonged breath-holding.',
        coachingCue: 'Exhale continuously through the concentric exertion; never hold breath.',
      },
    },
    generalGuideline: 'Continuous rhythmic diaphragmatic breathing; limit sustained isometric contractions to <10s.',
  },
}

export function evaluateMedicalParq(answers: ParqAnswers): ParqEvaluationResult {
  const flaggedItems: string[] = []
  const contraindicationTags: string[] = []

  if (answers.hasHeartCondition) {
    flaggedItems.push('Diagnosed heart condition')
    contraindicationTags.push('cardiovascular_hypertension')
  }
  if (answers.experiencesChestPain) {
    flaggedItems.push('Chest pain during exertion or at rest')
    contraindicationTags.push('cardiovascular_hypertension')
  }
  if (answers.experiencesDizzinessOrSyncope) {
    flaggedItems.push('Dizziness, loss of balance, or loss of consciousness')
    contraindicationTags.push('cardiovascular_hypertension')
  }
  if (answers.takesBloodPressureOrHeartMedication) {
    flaggedItems.push('Prescription blood pressure or cardiovascular medication')
    contraindicationTags.push('cardiovascular_hypertension')
  }
  if (answers.hasBoneOrJointProblem) {
    flaggedItems.push('Bone or joint condition worsened by exercise')
    contraindicationTags.push('knee_patellofemoral', 'shoulder_impingement')
  }
  if (answers.hasChronicSpinalOrDiscCondition) {
    flaggedItems.push('Chronic spinal, lumbar disc, or sciatica condition')
    contraindicationTags.push('lumbar_disc_condition')
  }
  if (answers.hasRecentSurgeryOrInjury) {
    flaggedItems.push('Recent surgical procedure or acute musculoskeletal injury')
  }

  const flaggedQuestionsCount = flaggedItems.length

  let clearanceStatus: MedicalClearanceStatus = 'cleared_unrestricted'
  let riskTier: ParqEvaluationResult['riskTier'] = 'Low Risk'
  let maxAllowedOptPhase = 5

  if (
    answers.hasHeartCondition ||
    answers.experiencesChestPain ||
    answers.experiencesDizzinessOrSyncope
  ) {
    clearanceStatus = 'physician_clearance_required'
    riskTier = 'High Risk - Medical Clearance Required'
    maxAllowedOptPhase = 1 // Restrict to gentle Phase 1 stabilization until clearance
  } else if (flaggedQuestionsCount > 0) {
    clearanceStatus = 'cleared_with_modifications'
    riskTier = 'Moderate Risk'
    maxAllowedOptPhase = 3 // Limit to Phases 1-3 with biomechanical modifications
  }

  const uniqueTags = Array.from(new Set(contraindicationTags))

  const legalDisclaimer =
    'By engaging in training with Gordon Athletic Advisory, client acknowledges that all exercise carries inherent physical risk. This digital PAR-Q+ assessment establishes baseline safety and does not constitute medical diagnosis. Consultation with a licensed physician is mandatory prior to initiating high-intensity physical exertion if cardiovascular or orthopedic risk factors are present.'

  return {
    clearanceStatus,
    riskTier,
    flaggedQuestionsCount,
    flaggedItems,
    maxAllowedOptPhase,
    contraindicationTags: uniqueTags,
    legalDisclaimer,
  }
}

export function checkExerciseContraindications(
  exerciseName: string,
  clientTags: string[]
): {
  isContraindicated: boolean
  ruleLabel?: string
  replacement?: string
  rationale?: string
  coachingCue?: string
} {
  const normName = exerciseName.toLowerCase()

  for (const tag of clientTags) {
    const rule = CONTRAINDICATION_RULES[tag]
    if (!rule) continue

    const blacklisted = rule.blacklistedExercises.some(b =>
      normName.includes(b.toLowerCase()) || b.toLowerCase().includes(normName)
    )

    if (blacklisted) {
      // Find matching substitution
      const subEntry = Object.entries(rule.prescribedSubstitutions).find(([key]) =>
        normName.includes(key.toLowerCase()) || key.toLowerCase().includes(normName)
      )

      return {
        isContraindicated: true,
        ruleLabel: rule.label,
        replacement: subEntry ? subEntry[1].replacement : `Safe ${rule.label} modification`,
        rationale: subEntry ? subEntry[1].rationale : rule.generalGuideline,
        coachingCue: subEntry ? subEntry[1].coachingCue : 'Execute with strict joint alignment.',
      }
    }
  }

  return { isContraindicated: false }
}

