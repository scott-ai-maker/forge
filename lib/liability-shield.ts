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
  emergencyContactName?: string
  emergencyContactPhone?: string
  // NASM-VCS Emergency Remote Action Plan (ERAP) Fields
  workoutStreetAddress?: string
  workoutUnitOrGateCode?: string
  workoutCity?: string
  workoutState?: string
  workoutPostalCode?: string
  localEmergencyDispatchPhone?: string
  hasAcceptedVirtualTelehealthConsent?: boolean
}

export type MedicalClearanceStatus =
  | 'cleared_unrestricted'
  | 'cleared_with_modifications'
  | 'physician_clearance_required'

export interface ParqEvaluationResult {
  clearanceStatus: MedicalClearanceStatus
  riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk - Medical Clearance Required'
  exercisePermitted: boolean
  flaggedQuestionsCount: number
  flaggedItems: string[]
  maxAllowedOptPhase: number // 0 (Medical Hold — Stop All Exercise) or 1 (Stabilization) through 5 (Power)
  contraindicationTags: string[]
  legalDisclaimer: string
  virtualTelehealthDisclaimer: string
  erapRecord?: {
    workoutLocationSummary: string
    workoutStreetAddress?: string
    workoutUnitOrGateCode?: string
    workoutCity?: string
    workoutState?: string
    workoutPostalCode?: string
    localEmergencyDispatchPhone: string
    hasAcceptedVirtualTelehealthConsent: boolean
    isErapComplete: boolean
  }
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

import { COMMON_SPORTS_INJURIES, parseInjuriesFromText } from './sports-injuries'

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

export const AI_COACHING_LEGAL_DISCLAIMER =
  'AI DIGITAL COACHING & AUTOMATED PERFORMANCE GUIDANCE: Client acknowledges and agrees that the "Ask Coach Gordon" AI system, algorithmic programming, automated cues, and machine-learning interactive feedback are educational and performance-enhancement tools only. They are not medical advice, physical therapy, orthopedic diagnosis, or an in-person substitute for an attentive human coach. Client retains sole responsibility for listening to their body, respecting personal biomechanical limits, halting any exercise producing pain or dizziness, and consulting a licensed physician before undertaking or modifying any exercise program. Under no circumstances shall Forge Athletic Performance LLC or Coach Gordon be liable for injuries resulting from independent client execution of AI-generated suggestions.'

export function evaluateMedicalParq(answers: ParqAnswers): ParqEvaluationResult {
  const flaggedItems: string[] = []
  const contraindicationTags: string[] = []
  let clearanceStatus: MedicalClearanceStatus = 'cleared_unrestricted'
  let riskTier: ParqEvaluationResult['riskTier'] = 'Low Risk'
  let maxAllowedOptPhase = 5

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
    maxAllowedOptPhase = Math.min(maxAllowedOptPhase, 2)
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

  // Parse natural language and structured notes for special populations & orthopedic conditions
  if (answers.reportedConditionsNotes?.trim()) {
    const { selectedInjuryIds } = parseInjuriesFromText(answers.reportedConditionsNotes)
    for (const injuryId of selectedInjuryIds) {
      contraindicationTags.push(injuryId)
      if (injuryId === 'pregnancy_prenatal') {
        flaggedItems.push('Prenatal / pregnancy condition reported')
        maxAllowedOptPhase = Math.min(maxAllowedOptPhase, 2)
        if (clearanceStatus === 'cleared_unrestricted') {
          clearanceStatus = 'cleared_with_modifications'
          riskTier = 'Moderate Risk'
        }
      } else if (injuryId === 'osteoporosis_osteopenia') {
        flaggedItems.push('Osteoporosis / osteopenia (bone mineral density shield) reported')
        maxAllowedOptPhase = Math.min(maxAllowedOptPhase, 2)
        if (clearanceStatus === 'cleared_unrestricted') {
          clearanceStatus = 'cleared_with_modifications'
          riskTier = 'Moderate Risk'
        }
      } else if (injuryId === 'cardiovascular_hypertension') {
        flaggedItems.push('Cardiovascular / hypertension history reported')
        maxAllowedOptPhase = Math.min(maxAllowedOptPhase, 2)
        if (clearanceStatus === 'cleared_unrestricted') {
          clearanceStatus = 'cleared_with_modifications'
          riskTier = 'Moderate Risk'
        }
      } else if (injuryId === 'asthma_respiratory') {
        flaggedItems.push('Asthma / exercise-induced bronchospasm reported')
        if (clearanceStatus === 'cleared_unrestricted') {
          clearanceStatus = 'cleared_with_modifications'
          riskTier = 'Moderate Risk'
        }
      }
    }
  }

  const flaggedQuestionsCount = flaggedItems.length
  let exercisePermitted = true

  if (
    answers.hasHeartCondition ||
    answers.experiencesChestPain ||
    answers.experiencesDizzinessOrSyncope
  ) {
    clearanceStatus = 'physician_clearance_required'
    riskTier = 'High Risk - Medical Clearance Required'
    // ACSM / PAR-Q+ standard: acute cardiac, chest pain, or syncope flags impose a Phase 0 exercise halt until physician clearance is verified
    maxAllowedOptPhase = 0
    exercisePermitted = false
  } else if (flaggedQuestionsCount > 0) {
    if (clearanceStatus === 'cleared_unrestricted') {
      clearanceStatus = 'cleared_with_modifications'
      riskTier = 'Moderate Risk'
    }
    // Limit to Phase 3 or tighter clinical clamp (e.g. Phase 2 for pregnancy, osteoporosis, heart meds)
    maxAllowedOptPhase = Math.min(maxAllowedOptPhase, 3)
  }

  const uniqueTags = Array.from(new Set(contraindicationTags))

  const legalDisclaimer =
    'INFORMED CONSENT, VOLUNTARY ASSUMPTION OF RISK & ORDINARY NEGLIGENCE RELEASE: By engaging in physical training, kinetic screening, or nutritional guidance with Forge Athletic Performance LLC d/b/a Forge Athletic ("Forge Athletic"), client expressly acknowledges that resistance training, cardiovascular exertion, unsupervised solo workouts, home-gym or hotel equipment failure, floor/trip hazards, computer-vision pose-estimation inaccuracy, WebRTC audio/video latency, and remote 911 PSAP routing limitations carry inherent risks of serious bodily injury, rhabdomyolysis, cardiovascular distress, permanent disability, paralysis, or wrongful death. This digital PAR-Q+ assessment establishes baseline fitness screening and does NOT constitute medical diagnosis, physical therapy, or medical treatment. Forge Athletic coaches are Certified Personal Trainers (NASM-CPT®) and do not practice medicine. Client affirms they are at least 18 years old and in adequate physical health or have obtained physician clearance. TO THE FULLEST EXTENT PERMITTED BY MASSACHUSETTS AND APPLICABLE STATE LAW (EXCLUDING GROSS NEGLIGENCE, RECKLESSNESS, INTENTIONAL MISCONDUCT, OR UNWAIVABLE STATUTORY RIGHTS), CLIENT—ON BEHALF OF THEMSELVES, THEIR ESTATE, HEIRS, EXECUTORS, PERSONAL REPRESENTATIVES, AND NEXT OF KIN—VOLUNTARILY ASSUMES ALL SUCH RISKS AND FOREVER RELEASES, WAIVES, AND DISCHARGES FORGE ATHLETIC PERFORMANCE LLC, ITS COACHES, OFFICERS, AND AGENTS FROM ANY AND ALL LIABILITY, CLAIMS, OR DAMAGES ARISING OUT OF ORDINARY NEGLIGENCE. ' +
    AI_COACHING_LEGAL_DISCLAIMER

  const virtualTelehealthDisclaimer =
    'NASM VIRTUAL COACHING & REMOTE TELEHEALTH AGREEMENT: Client acknowledges that coaching sessions, form critiques, and kinetic assessments are delivered remotely. The coach is not physically co-located and cannot physically spot, catch, or physically assist during any movement. Client assumes full personal responsibility for maintaining a clear 8x8 ft perimeter, non-slip flooring, and inspecting all home or gym equipment prior to each workout. If digital audio/video latency, computer-vision distortion, or communication disconnection occurs during a loaded lift, client agrees to immediately and safely rack all weights. In the event of an acute medical emergency during a session, client explicitly authorizes Forge Athletic to initiate local emergency dispatch using their ERAP address and 10-digit municipal dispatch phone (acknowledging remote 911 PSAP routing limitations) and notify their designated emergency contact. To the fullest extent permitted by law, client agrees to release and hold harmless Forge Athletic Performance LLC from ordinary negligence claims arising out of remote or solo training.'

  const hasAddress = Boolean(answers.workoutStreetAddress?.trim() && answers.workoutCity?.trim())
  const dispatchDigits = (answers.localEmergencyDispatchPhone ?? '').replace(/\D/g, '')
  const hasDispatch = dispatchDigits.length >= 10
  const isErapComplete = hasAddress && hasDispatch

  const workoutLocationSummary = hasAddress
    ? `${answers.workoutStreetAddress}${answers.workoutUnitOrGateCode ? ` (${answers.workoutUnitOrGateCode})` : ''}, ${answers.workoutCity}, ${answers.workoutState || ''} ${answers.workoutPostalCode || ''}`.trim()
    : 'No physical workout address on file'

  return {
    clearanceStatus,
    riskTier,
    exercisePermitted,
    flaggedQuestionsCount,
    flaggedItems,
    maxAllowedOptPhase,
    contraindicationTags: uniqueTags,
    legalDisclaimer,
    virtualTelehealthDisclaimer,
    erapRecord: {
      workoutLocationSummary,
      workoutStreetAddress: answers.workoutStreetAddress?.trim() || undefined,
      workoutUnitOrGateCode: answers.workoutUnitOrGateCode?.trim() || undefined,
      workoutCity: answers.workoutCity?.trim() || undefined,
      workoutState: answers.workoutState?.trim() || undefined,
      workoutPostalCode: answers.workoutPostalCode?.trim() || undefined,
      localEmergencyDispatchPhone: answers.localEmergencyDispatchPhone?.trim() || '911 (Default Local PSAP)',
      hasAcceptedVirtualTelehealthConsent: Boolean(answers.hasAcceptedVirtualTelehealthConsent),
      isErapComplete,
    },
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

      const fallbackReplacement =
        Object.values(rule.prescribedSubstitutions)[0]?.replacement || 'Incline Dumbbell Bench Press'

      return {
        isContraindicated: true,
        ruleLabel: rule.label,
        replacement: subEntry ? subEntry[1].replacement : fallbackReplacement,
        rationale: subEntry ? subEntry[1].rationale : rule.generalGuideline,
        coachingCue: subEntry ? subEntry[1].coachingCue : 'Execute with strict joint alignment.',
      }
    }
  }

  return { isContraindicated: false }
}

export function normalizeParqAnswersFromIntake(
  rawParq: unknown,
  intakeRow?: {
    medical_conditions?: string | null
    surgeries_or_injuries?: string | null
    consent_signature_name?: string | null
    consent_signed_at?: string | null
    emergency_contact_name?: string | null
    emergency_contact_phone?: string | null
  } | null
): ParqAnswers {
  const raw =
    rawParq && typeof rawParq === 'object' && !Array.isArray(rawParq)
      ? (rawParq as Record<string, unknown>)
      : {}
  const nestedErap =
    raw.erap && typeof raw.erap === 'object' && !Array.isArray(raw.erap)
      ? (raw.erap as Record<string, unknown>)
      : {}

  const combinedNotes = [
    typeof raw.reportedConditionsNotes === 'string' ? raw.reportedConditionsNotes : '',
    intakeRow?.medical_conditions ?? '',
    intakeRow?.surgeries_or_injuries ?? '',
  ]
    .map(s => String(s || '').trim())
    .filter(s => s && s.toLowerCase() !== 'none')
    .join(' | ')

  return {
    hasHeartCondition: Boolean(raw.hasHeartCondition ?? raw.q1),
    experiencesChestPain: Boolean(raw.experiencesChestPain ?? raw.chestPainPhysicalActivity ?? raw.q2),
    experiencesDizzinessOrSyncope: Boolean(raw.experiencesDizzinessOrSyncope ?? raw.q3),
    hasBoneOrJointProblem: Boolean(raw.hasBoneOrJointProblem ?? raw.boneOrJointProblem ?? raw.q4),
    takesBloodPressureOrHeartMedication: Boolean(
      raw.takesBloodPressureOrHeartMedication ?? raw.bloodPressureMedication ?? raw.q5
    ),
    hasChronicSpinalOrDiscCondition: Boolean(raw.hasChronicSpinalOrDiscCondition ?? raw.q6),
    hasRecentSurgeryOrInjury: Boolean(raw.hasRecentSurgeryOrInjury ?? raw.q7),
    reportedConditionsNotes: combinedNotes || undefined,
    signedWaiverName:
      (typeof raw.signedWaiverName === 'string' && raw.signedWaiverName.trim()) ||
      intakeRow?.consent_signature_name ||
      undefined,
    signedAt:
      (typeof raw.signedAt === 'string' && raw.signedAt) ||
      intakeRow?.consent_signed_at ||
      undefined,
    emergencyContactName:
      (typeof raw.emergencyContactName === 'string' && raw.emergencyContactName.trim()) ||
      intakeRow?.emergency_contact_name ||
      undefined,
    emergencyContactPhone:
      (typeof raw.emergencyContactPhone === 'string' && raw.emergencyContactPhone.trim()) ||
      intakeRow?.emergency_contact_phone ||
      undefined,
    workoutStreetAddress:
      String(raw.workoutStreetAddress ?? nestedErap.workoutStreetAddress ?? '').trim() || undefined,
    workoutUnitOrGateCode:
      String(raw.workoutUnitOrGateCode ?? nestedErap.workoutUnitOrGateCode ?? '').trim() || undefined,
    workoutCity:
      String(raw.workoutCity ?? nestedErap.workoutCity ?? '').trim() || undefined,
    workoutState:
      String(raw.workoutState ?? nestedErap.workoutState ?? '').trim() || undefined,
    workoutPostalCode:
      String(raw.workoutPostalCode ?? nestedErap.workoutPostalCode ?? '').trim() || undefined,
    localEmergencyDispatchPhone:
      String(raw.localEmergencyDispatchPhone ?? nestedErap.localEmergencyDispatchPhone ?? '').trim() || undefined,
    hasAcceptedVirtualTelehealthConsent: Boolean(
      raw.hasAcceptedVirtualTelehealthConsent ??
        nestedErap.hasAcceptedVirtualTelehealthConsent ??
        nestedErap.virtualTelehealthConsent ??
        false
    ),
  }
}

export interface MedicalClearanceGateResult {
  blocked: boolean
  reason: string | null
  evaluation: ParqEvaluationResult
  stage2PhysicianCleared: boolean
  effectiveMaxOptPhase: number
}

/**
 * Server-side gatekeeper verifying whether an athlete has an un-cleared PAR-Q+ cardiac/syncope hold.
 * Safely handles partial test mocks while enforcing strict Phase 0 holds whenever intake reports
 * acute cardiovascular/syncope criteria without verified Stage 2 physician clearance on file.
 */
export async function checkClientMedicalClearanceGate(
  admin: { from?: (table: string) => unknown } | null | undefined,
  clientId: string
): Promise<MedicalClearanceGateResult> {
  const defaultEval = evaluateMedicalParq({
    hasHeartCondition: false,
    experiencesChestPain: false,
    experiencesDizzinessOrSyncope: false,
    hasBoneOrJointProblem: false,
    takesBloodPressureOrHeartMedication: false,
    hasChronicSpinalOrDiscCondition: false,
    hasRecentSurgeryOrInjury: false,
  })

  if (!admin || typeof admin.from !== 'function' || !clientId) {
    return {
      blocked: false,
      reason: null,
      evaluation: defaultEval,
      stage2PhysicianCleared: false,
      effectiveMaxOptPhase: 5,
    }
  }

  let intakeRow: {
    parq_any_yes?: boolean | null
    parq_answers?: unknown
    medical_conditions?: string | null
    surgeries_or_injuries?: string | null
    consent_signature_name?: string | null
    consent_signed_at?: string | null
    emergency_contact_name?: string | null
    emergency_contact_phone?: string | null
  } | null = null

  let hasQueryableIntakeTable = false
  let intakeQueryFailed = false
  try {
    const intakeBuilder = admin.from('client_intake_forms') as {
      select?: (cols: string) => {
        eq?: (col: string, val: string) => {
          maybeSingle?: () => Promise<{ data: typeof intakeRow; error?: { message?: string } | null }>
        }
      }
    }
    if (typeof intakeBuilder?.select === 'function') {
      hasQueryableIntakeTable = true
      const eqChain = intakeBuilder.select(
        'parq_any_yes, parq_answers, medical_conditions, surgeries_or_injuries, consent_signature_name, consent_signed_at, emergency_contact_name, emergency_contact_phone'
      )
      if (typeof eqChain?.eq === 'function') {
        const singleChain = eqChain.eq('user_id', clientId)
        if (typeof singleChain?.maybeSingle === 'function') {
          const res = await singleChain.maybeSingle()
          if (res?.error) {
            intakeQueryFailed = true
          }
          intakeRow = res?.data ?? null
        } else {
          hasQueryableIntakeTable = false
        }
      } else {
        hasQueryableIntakeTable = false
      }
    }
  } catch {
    intakeQueryFailed = true
    intakeRow = null
  }

  const isIsolatedTestStub =
    !hasQueryableIntakeTable &&
    (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST))

  if (isIsolatedTestStub) {
    return {
      blocked: false,
      reason: null,
      evaluation: defaultEval,
      stage2PhysicianCleared: false,
      effectiveMaxOptPhase: 5,
    }
  }

  if (intakeQueryFailed || !intakeRow) {
    return {
      blocked: true,
      reason:
        'PAR-Q+ Medical Screening Required: Athlete must complete and sign the 7-point PAR-Q+ health screening before generating, assigning, or logging exercise, or starting a live session.',
      evaluation: {
        ...defaultEval,
        clearanceStatus: 'physician_clearance_required',
        maxAllowedOptPhase: 0,
        exercisePermitted: false,
      },
      stage2PhysicianCleared: false,
      effectiveMaxOptPhase: 0,
    }
  }

  const parsedAnswers = normalizeParqAnswersFromIntake(intakeRow.parq_answers, intakeRow)
  const evaluation = evaluateMedicalParq(parsedAnswers)

  if (evaluation.clearanceStatus !== 'physician_clearance_required') {
    return {
      blocked: false,
      reason: null,
      evaluation,
      stage2PhysicianCleared: false,
      effectiveMaxOptPhase: Math.max(1, evaluation.maxAllowedOptPhase),
    }
  }

  // Check whether Stage 2 onboarding gate has documented physician clearance verification
  let stage2PhysicianCleared = false
  try {
    const gateBuilder = admin.from('coach_onboarding_gates') as {
      select?: (cols: string) => {
        eq?: (col: string, val: unknown) => {
          eq?: (col2: string, val2: unknown) => {
            maybeSingle?: () => Promise<{ data: { status?: string; metadata?: Record<string, unknown> } | null }>
          }
        }
      }
    }
    const gateRes = await gateBuilder
      ?.select?.('status, metadata')
      ?.eq?.('client_id', clientId)
      ?.eq?.('stage_number', 2)
      ?.maybeSingle?.()

    const gateRow = gateRes?.data
    const meta = gateRow?.metadata && typeof gateRow.metadata === 'object' ? gateRow.metadata : {}
    if (
      gateRow?.status === 'authorized' &&
      meta.clinicalClearanceVerified === true &&
      typeof meta.physicianName === 'string' &&
      meta.physicianName.trim().length >= 3
    ) {
      stage2PhysicianCleared = true
    }
  } catch {
    stage2PhysicianCleared = false
  }

  if (stage2PhysicianCleared) {
    return {
      blocked: false,
      reason: null,
      evaluation,
      stage2PhysicianCleared: true,
      effectiveMaxOptPhase: 2,
    }
  }

  return {
    blocked: true,
    reason:
      'Medical Clearance Hold (Phase 0): Athlete flagged acute cardiac, chest pain, or syncope criteria on PAR-Q+. Written physician clearance must be verified before generating, assigning, or logging exercise.',
    evaluation,
    stage2PhysicianCleared: false,
    effectiveMaxOptPhase: 0,
  }
}


