/**
 * Gordon Athletic Advisory — Client Onboarding & Progression Engine
 * 
 * Implements master-trainer and clinical best practices for tracking an athlete
 * through the complete 9-stage onboarding and development continuum:
 * 
 * 1. Intake & Coach Assignment
 * 2. Clinical Liability Shield & PAR-Q+
 * 3. Baseline Biometrics & Environmental Readiness
 * 4. NASM Movement Screen & Testing Suite (OHSA & CEx)
 * 5. Periodization Architecture (12-Week OPT™ Macrocycle)
 * 6. Program Design & Prescription Workspace
 * 7. Live Coaching Delivery & Voice SOAP Notes
 * 8. Telemetry Monitoring, Weekly Follow-Ups & Triage
 * 9. Client Lifecycle Governance & Long-Term Retention
 */

import { CoachClientTab } from './validation'
import { ClientStatus } from './client-lifecycle'
import { evaluateMedicalParq, ParqAnswers, ParqEvaluationResult } from './liability-shield'

export type ProgressionStageId =
  | 'intake_claim'
  | 'liability_shield'
  | 'baseline_biometrics'
  | 'movement_testing'
  | 'periodization'
  | 'program_design'
  | 'delivery_kickoff'
  | 'followups_triage'
  | 'retention_governance'

export type StageState = 'completed' | 'in_progress' | 'pending' | 'blocked'
export type StageCategory = 'onboarding_phase' | 'maintenance_compliance'

export type CoachGateStatus = 'locked' | 'awaiting_authorization' | 'authorized' | 'blocked'

export interface CoachAuthorizationGate {
  stageNumber: number
  stageId: ProgressionStageId
  status: CoachGateStatus
  canAuthorize: boolean
  blockerReason?: string | null
  authorizedBy?: string | null
  authorizedByName?: string | null
  authorizedAt?: string | null
  notes?: string | null
}

export interface ClientGateRecord {
  status: 'pending' | 'authorized' | 'rejected'
  authorizedAt?: string | null
  authorizedBy?: string | null
  authorizedByName?: string | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
}

export interface ProgressionMilestone {
  key: string
  label: string
  completed: boolean
  required: boolean
  detail?: string
  actionHref?: string
  actionLabel?: string
}

export interface ProgressionStageDetail {
  stageNumber: number
  id: ProgressionStageId
  category: StageCategory
  title: string
  shortTitle: string
  state: StageState
  milestones: ProgressionMilestone[]
  blockerReason?: string | null
  actionTab: CoachClientTab
  actionHref: string
  actionLabel: string
  summary: string
  gate: CoachAuthorizationGate
}

export interface NextRecommendedAction {
  stageNumber: number
  stageId: ProgressionStageId
  title: string
  description: string
  tab: CoachClientTab
  href: string
  label: string
  urgency: 'urgent' | 'normal' | 'info'
}

export interface ClientProgressionTelemetry {
  clientId: string
  clientName: string
  email: string
  designatedCoachId?: string | null
  currentStatus?: ClientStatus
  consultWaived?: boolean
  packages?: Array<{
    id?: string
    client_id?: string
    sessions_remaining?: number
    sessions_total?: number
    package_name?: string
    source?: string
    expires_at?: string | null
  }> | null
  intakeForm?: {
    parq_answers?: unknown
    parq_any_yes?: boolean
    medical_conditions?: string | null
    surgeries_or_injuries?: string | null
    consent_signature_name?: string | null
    consent_signed_at?: string | null
  } | null
  fitnessProfile?: {
    height_cm?: number | null
    weight_kg?: number | null
    fitness_goal?: string | null
    equipment_access?: string[] | null
    training_days_per_week?: number | null
    preferred_training_days?: string[] | null
    onboarding_completed_at?: string | null
  } | null
  assessments?: Array<{
    id: string
    assessment_date: string
    ohsa_findings?: unknown[] | null
    static_posture?: unknown[] | null
  }> | null
  latestPlan?: {
    id: string
    name: string
    nasm_opt_phase?: number | null
    phase_name?: string | null
    sessions_per_week?: number | null
    created_at?: string
    plan_json?: {
      periodizationPlan?: unknown
      sessions?: unknown[]
      workouts?: unknown[]
      macrocyclePlan?: { workouts?: unknown[] }
    } | null
  } | null
  sessions?: Array<{
    id: string
    status: string
    scheduled_at: string
    notes?: string | null
  }> | null
  weeklyCheckins?: Array<{
    id: string
    week_start: string
    coach_feedback?: string | null
  }> | null
  workoutLogs?: Array<{
    session_date?: string | null
    completed?: boolean | null
  }> | null
  latestBodyComposition?: {
    id?: string
    estimated_bodyfat_percent?: number | null
    method?: string | null
    confidence_score?: number | null
    created_at?: string
  } | null
  auditLogsCount?: number
  gates?: Record<number, ClientGateRecord> | null
  enforceGates?: boolean
}

export interface ClientProgressionProfile {
  clientId: string
  clientName: string
  email?: string | null
  currentStageNumber: number
  currentStageId: ProgressionStageId
  currentStageTitle: string
  currentStageShortTitle: string
  overallProgressPercent: number
  onboardingProgressPercent: number
  complianceProgressPercent: number
  completedStagesCount: number
  totalStagesCount: number
  stages: ProgressionStageDetail[]
  nextAction: NextRecommendedAction
  isFullyOnboarded: boolean
  isOnboardingComplete: boolean
  completedOnboardingCount: number
  onboardingPhasesCount: number
  isMaintenanceAndCompliance: boolean
  complianceStagesCount: number
  completedComplianceCount: number
  isBlockedByMedicalClearance: boolean
  medicalClearanceTier?: string
  gates: Record<number, CoachAuthorizationGate>
  activeGateStageNumber: number
  allGatesAuthorized: boolean
}

/**
 * Normalizes PAR-Q answers across different questionnaire schemas,
 * supporting named properties, legacy script aliases, and q1..q7 keys.
 */
export function parseParqAnswers(
  raw: unknown,
  intake?: {
    medical_conditions?: string | null
    consent_signature_name?: string | null
    consent_signed_at?: string | null
  } | null
): ParqAnswers {
  const rawParq = (raw as Record<string, unknown> | undefined) || {}
  return {
    hasHeartCondition: Boolean(rawParq.hasHeartCondition ?? rawParq.q1),
    experiencesChestPain: Boolean(
      rawParq.experiencesChestPain ??
      rawParq.chestPainPhysicalActivity ??
      rawParq.chestPainNoActivity ??
      rawParq.q2 ??
      rawParq.q3
    ),
    experiencesDizzinessOrSyncope: Boolean(
      rawParq.experiencesDizzinessOrSyncope ??
      rawParq.loseBalanceDizziness ??
      rawParq.q4
    ),
    hasBoneOrJointProblem: Boolean(
      rawParq.hasBoneOrJointProblem ??
      rawParq.boneOrJointProblem ??
      rawParq.q5
    ),
    takesBloodPressureOrHeartMedication: Boolean(
      rawParq.takesBloodPressureOrHeartMedication ??
      rawParq.bloodPressureMedication ??
      rawParq.q6
    ),
    hasChronicSpinalOrDiscCondition: Boolean(
      rawParq.hasChronicSpinalOrDiscCondition ?? false
    ),
    hasRecentSurgeryOrInjury: Boolean(
      rawParq.hasRecentSurgeryOrInjury ??
      rawParq.otherReasonNotToExercise ??
      rawParq.q7
    ),
    reportedConditionsNotes: String(intake?.medical_conditions ?? rawParq.reportedConditionsNotes ?? '').trim(),
    signedWaiverName: String(intake?.consent_signature_name ?? rawParq.signedWaiverName ?? '').trim(),
    signedAt: intake?.consent_signed_at || (rawParq.signedAt as string | undefined) || undefined,
  }
}

/**
 * Evaluates the full 9-stage onboarding and development continuum for a client.
 */
export function evaluateClientOnboardingProgression(
  telemetry: ClientProgressionTelemetry
): ClientProgressionProfile {
  const {
    clientId,
    clientName,
    designatedCoachId,
    currentStatus = 'active',
    packages = [],
    intakeForm,
    fitnessProfile,
    assessments = [],
    latestPlan,
    sessions = [],
    weeklyCheckins = [],
    workoutLogs = [],
    auditLogsCount = 0,
  } = telemetry

  // ── 1. Evaluate PAR-Q & Clinical Shield ───────────────────
  const parqAnswers: ParqAnswers = parseParqAnswers(intakeForm?.parq_answers, intakeForm)
  const medicalEvaluation: ParqEvaluationResult = evaluateMedicalParq(parqAnswers)
  const isPhysicianClearanceRequired =
    medicalEvaluation.clearanceStatus === 'physician_clearance_required'

  const isEnforcingGates = Boolean(
    telemetry.enforceGates || (telemetry.gates && Object.keys(telemetry.gates).length > 0)
  )
  const clientGates = telemetry.gates || {}

  const isGateAuthorized = (stageNum: number): boolean => {
    return clientGates[stageNum]?.status === 'authorized'
  }

  const buildGate = (
    stageNumber: number,
    stageId: ProgressionStageId,
    status: CoachGateStatus,
    canAuthorize: boolean,
    blockerReason?: string | null
  ): CoachAuthorizationGate => {
    const record = clientGates[stageNumber]
    return {
      stageNumber,
      stageId,
      status,
      canAuthorize,
      blockerReason: blockerReason ?? null,
      authorizedBy: record?.authorizedBy ?? (status === 'authorized' ? 'coach' : null),
      authorizedByName: record?.authorizedByName ?? null,
      authorizedAt: record?.authorizedAt ?? (status === 'authorized' ? (record?.authorizedAt || new Date().toISOString()) : null),
      notes: record?.notes ?? null,
    }
  }

  // ── Stage 1: Lead Capture, Claim & Package Allocation ─────
  const isAssigned = Boolean(designatedCoachId)
  const hasPackages = (packages ?? []).length > 0
  const stage1Milestones: ProgressionMilestone[] = [
    {
      key: 'coach_assigned',
      label: 'Designated coach assigned',
      completed: isAssigned,
      required: true,
      detail: isAssigned ? 'Assigned to active coach roster' : 'Unclaimed lead in intake queue',
    },
    {
      key: 'packages_allocated',
      label: 'Session package or subscription active',
      completed: hasPackages,
      required: true,
      detail: hasPackages
        ? (() => {
            const now = new Date()
            const activeCredits = (packages ?? []).reduce((sum, p) => {
              if (p.expires_at && new Date(p.expires_at) <= now) return sum
              return sum + (p.sessions_remaining ?? 0)
            }, 0)
            return `${activeCredits} session credit${activeCredits === 1 ? '' : 's'} on record`
          })()
        : 'No session credits or packages purchased',
    },
  ]
  const stage1PrereqsMet = isAssigned && hasPackages
  const stage1Authorized = isGateAuthorized(1)
  let stage1State: StageState = 'in_progress'
  let stage1GateStatus: CoachGateStatus = 'awaiting_authorization'

  if (stage1Authorized) {
    stage1State = 'completed'
    stage1GateStatus = 'authorized'
  } else if (!isEnforcingGates && stage1PrereqsMet) {
    stage1State = 'completed'
    stage1GateStatus = 'authorized'
  } else {
    stage1State = 'in_progress'
    stage1GateStatus = 'awaiting_authorization'
  }
  const stage1Completed = stage1State === 'completed'
  const stage1Gate = buildGate(1, 'intake_claim', stage1GateStatus, true)

  // ── Stage 2: Health History & Clinical Liability Shield ───
  const hasIntakeForm = Boolean(intakeForm)
  const hasSignedWaiver = Boolean(intakeForm?.consent_signature_name?.trim())
  const hasParqCompleted = Boolean(intakeForm?.parq_answers)
  const medicalClearanceSatisfied = !isPhysicianClearanceRequired

  const stage2Milestones: ProgressionMilestone[] = [
    {
      key: 'intake_submitted',
      label: 'Medical intake form submitted',
      completed: hasIntakeForm,
      required: true,
      detail: hasIntakeForm ? 'Baseline medical questionnaire received' : 'Waiting for client intake form',
    },
    {
      key: 'parq_screened',
      label: '7-point PAR-Q+ clinical screening',
      completed: hasParqCompleted,
      required: true,
      detail: hasParqCompleted
        ? `${medicalEvaluation.flaggedQuestionsCount} flagged items (${medicalEvaluation.riskTier})`
        : 'Screening questionnaire pending',
    },
    {
      key: 'liability_waiver_signed',
      label: 'Informed consent & liability waiver signed',
      completed: hasSignedWaiver,
      required: true,
      detail: hasSignedWaiver
        ? `Signed by ${intakeForm?.consent_signature_name} on ${new Date(intakeForm?.consent_signed_at || '').toLocaleDateString()}`
        : 'Digital waiver signature missing',
    },
    {
      key: 'medical_clearance_cleared',
      label: 'Physician clearance verified',
      completed: medicalClearanceSatisfied,
      required: isPhysicianClearanceRequired,
      detail: medicalClearanceSatisfied
        ? 'No cardiovascular or unmanaged physician red flags'
        : 'PHYSICIAN CLEARANCE REQUIRED before progressive loading',
    },
  ]

  const stage2PrereqsMet = hasIntakeForm && hasSignedWaiver && medicalClearanceSatisfied
  const stage2Authorized = isGateAuthorized(2)
  const prior1Met = isEnforcingGates ? stage1Authorized : stage1Completed

  let stage2State: StageState = 'pending'
  let stage2GateStatus: CoachGateStatus = 'locked'
  let stage2Blocker: string | null = null
  let stage2CanAuthorize = false

  if (!prior1Met) {
    stage2State = 'pending'
    stage2GateStatus = 'locked'
    stage2Blocker = 'Stage 1 (Intake & Claim) must be authorized by a coach first.'
    stage2CanAuthorize = false
  } else if (!medicalClearanceSatisfied && hasIntakeForm) {
    stage2State = 'blocked'
    stage2GateStatus = 'blocked'
    stage2Blocker = 'Physician Medical Clearance Required: Athlete flagged cardiovascular or chronic risk criteria in PAR-Q+.'
    stage2CanAuthorize = false
  } else if (stage2Authorized || (!isEnforcingGates && stage2PrereqsMet)) {
    stage2State = 'completed'
    stage2GateStatus = 'authorized'
    stage2CanAuthorize = true
  } else {
    stage2State = 'in_progress'
    stage2GateStatus = 'awaiting_authorization'
    stage2CanAuthorize = medicalClearanceSatisfied
  }
  const stage2Completed = stage2State === 'completed'
  const stage2Gate = buildGate(2, 'liability_shield', stage2GateStatus, stage2CanAuthorize, stage2Blocker)

  // ── Stage 3: Baseline Biometrics & Readiness ──────────────
  const hasAnthropometry = Boolean(
    fitnessProfile?.height_cm && Number(fitnessProfile.height_cm) > 0 &&
    fitnessProfile?.weight_kg && Number(fitnessProfile.weight_kg) > 0
  )
  const hasFitnessGoal = Boolean(fitnessProfile?.fitness_goal?.trim())
  const hasEquipmentAccess = Boolean(
    Array.isArray(fitnessProfile?.equipment_access) && fitnessProfile.equipment_access.length > 0
  )
  const hasTrainingSchedule = Boolean(
    Number(fitnessProfile?.training_days_per_week ?? 0) > 0
  )

  const hasDexaScan = Boolean(
    telemetry.latestBodyComposition?.estimated_bodyfat_percent !== undefined &&
    telemetry.latestBodyComposition?.estimated_bodyfat_percent !== null
  )

  const stage3Milestones: ProgressionMilestone[] = [
    {
      key: 'anthropometry_logged',
      label: 'Height & weight vitals recorded',
      completed: hasAnthropometry,
      required: true,
      detail: hasAnthropometry
        ? `${fitnessProfile?.height_cm}cm / ${fitnessProfile?.weight_kg}kg`
        : 'Baseline measurements missing',
    },
    {
      key: 'dexa_body_comp_scanned',
      label: 'AI DEXA body composition scan',
      completed: hasDexaScan,
      required: false,
      actionHref: `/coach/clients/${clientId}?tab=assessment&subtab=bodycomp#workspace-tab-content`,
      actionLabel: 'Launch AI DEXA Scanner',
      detail: hasDexaScan
        ? `DEXA Estimate: ${telemetry.latestBodyComposition?.estimated_bodyfat_percent}% body fat (${telemetry.latestBodyComposition?.method || 'DEXA 4C Vision'})`
        : 'AI DEXA body composition scan available',
    },
    {
      key: 'fitness_goal_defined',
      label: 'Primary goal established',
      completed: hasFitnessGoal,
      required: true,
      detail: hasFitnessGoal ? String(fitnessProfile?.fitness_goal) : 'No primary goal defined',
    },
    {
      key: 'equipment_mapped',
      label: 'Equipment & facility profile configured',
      completed: hasEquipmentAccess,
      required: true,
      detail: hasEquipmentAccess
        ? `${fitnessProfile?.equipment_access?.length} modalities selected`
        : 'Equipment availability unconfirmed',
    },
    {
      key: 'schedule_configured',
      label: 'Weekly training frequency locked',
      completed: hasTrainingSchedule,
      required: true,
      detail: hasTrainingSchedule
        ? `${fitnessProfile?.training_days_per_week} sessions/week`
        : 'Training frequency not set',
    },
  ]

  const stage3PrereqsMet = hasAnthropometry && hasFitnessGoal && hasEquipmentAccess && hasTrainingSchedule
  const stage3Authorized = isGateAuthorized(3)
  const prior2Met = isEnforcingGates ? stage2Authorized : stage2Completed

  let stage3State: StageState = 'pending'
  let stage3GateStatus: CoachGateStatus = 'locked'
  let stage3Blocker: string | null = null
  let stage3CanAuthorize = false

  if (stage2State === 'blocked') {
    stage3State = 'blocked'
    stage3GateStatus = 'blocked'
    stage3Blocker = 'Blocked by Stage 2 Medical Clearance requirement.'
    stage3CanAuthorize = false
  } else if (!prior2Met) {
    stage3State = 'pending'
    stage3GateStatus = 'locked'
    stage3Blocker = 'Stage 2 (Clinical Liability Shield) must be authorized by a coach first.'
    stage3CanAuthorize = false
  } else if (stage3Authorized || (!isEnforcingGates && stage3PrereqsMet)) {
    stage3State = 'completed'
    stage3GateStatus = 'authorized'
    stage3CanAuthorize = true
  } else {
    stage3State = 'in_progress'
    stage3GateStatus = 'awaiting_authorization'
    stage3CanAuthorize = true
  }
  const stage3Completed = stage3State === 'completed'
  const stage3Gate = buildGate(3, 'baseline_biometrics', stage3GateStatus, stage3CanAuthorize, stage3Blocker)

  // ── Stage 4: NASM Movement Screen & Testing Suite ─────────
  const latestAssessment = assessments?.[0]
  const hasAssessmentRecord = Boolean(latestAssessment)
  const hasOhsaFindings = Boolean(
    latestAssessment && (Array.isArray(latestAssessment.ohsa_findings) || Boolean(latestAssessment.assessment_date))
  )
  const hasStaticPosture = Boolean(
    latestAssessment && Array.isArray(latestAssessment.static_posture) && latestAssessment.static_posture.length > 0
  )

  const stage4Milestones: ProgressionMilestone[] = [
    {
      key: 'kinetic_chain_postural_screen',
      label: '5 Kinetic Chain static postural screen (AI Scanner)',
      completed: hasStaticPosture || hasAssessmentRecord,
      required: true,
      actionHref: `/coach/clients/${clientId}?tab=assessment&subtab=posture#workspace-tab-content`,
      actionLabel: 'AI Postural Screen',
      detail: hasStaticPosture
        ? 'Static alignment & distortion syndromes documented'
        : 'Awaiting static postural evaluation (AI Posture Scanner)',
    },
    {
      key: 'overhead_squat_screen',
      label: 'Overhead Squat Assessment (OHSA)',
      completed: hasOhsaFindings,
      required: true,
      actionHref: `/coach/clients/${clientId}?tab=assessment&subtab=ohsa#workspace-tab-content`,
      actionLabel: 'Conduct Overhead Squat Assessment',
      detail: hasOhsaFindings
        ? `${latestAssessment?.ohsa_findings?.length ?? 0} compensations identified via AI OHSA`
        : 'Dynamic OHSA screen required (AI OHSA Scanner)',
    },
    {
      key: 'cex_warmup_generated',
      label: '4-Phase Corrective Exercise Continuum (CEx)',
      completed: hasAssessmentRecord,
      required: true,
      actionHref: `/coach/clients/${clientId}?tab=assessment&subtab=cex#workspace-tab-content`,
      actionLabel: 'Generate CEx Warmup',
      detail: hasAssessmentRecord
        ? 'Inhibit, Lengthen, Activate, Integrate warmup matrix active'
        : 'CEx routine auto-generates upon AI assessment entry',
    },
  ]

  const stage4PrereqsMet = hasAssessmentRecord && hasOhsaFindings
  const stage4Authorized = isGateAuthorized(4)
  const prior3Met = isEnforcingGates ? stage3Authorized : stage3Completed

  let stage4State: StageState = 'pending'
  let stage4GateStatus: CoachGateStatus = 'locked'
  let stage4Blocker: string | null = null
  let stage4CanAuthorize = false

  if (stage3State === 'blocked') {
    stage4State = 'blocked'
    stage4GateStatus = 'blocked'
    stage4Blocker = 'Blocked by Stage 2 Medical Clearance requirement.'
    stage4CanAuthorize = false
  } else if (!prior3Met) {
    stage4State = 'pending'
    stage4GateStatus = 'locked'
    stage4Blocker = 'Stage 3 (Baseline Biometrics) must be authorized by a coach first.'
    stage4CanAuthorize = false
  } else if (stage4Authorized || (!isEnforcingGates && stage4PrereqsMet)) {
    stage4State = 'completed'
    stage4GateStatus = 'authorized'
    stage4CanAuthorize = true
  } else {
    stage4State = 'in_progress'
    stage4GateStatus = 'awaiting_authorization'
    stage4CanAuthorize = true
  }
  const stage4Completed = stage4State === 'completed'
  const stage4Gate = buildGate(4, 'movement_testing', stage4GateStatus, stage4CanAuthorize, stage4Blocker)

  // ── Stage 5: Periodization Architecture (12-Week OPT™) ───
  const planJson = latestPlan?.plan_json as {
    periodizationPlan?: unknown
    sessions?: unknown[]
    workouts?: unknown[]
    macrocyclePlan?: { workouts?: unknown[] }
  } | undefined
  const hasOptPhase = Boolean(latestPlan?.nasm_opt_phase && latestPlan.nasm_opt_phase >= 1 && latestPlan.nasm_opt_phase <= 5)
  const hasPeriodizationPlan = Boolean(
    planJson?.periodizationPlan ||
    planJson?.macrocyclePlan ||
    (latestPlan?.nasm_opt_phase && latestPlan?.phase_name)
  )

  const stage5Milestones: ProgressionMilestone[] = [
    {
      key: 'opt_phase_assigned',
      label: 'NASM OPT™ target phase designated',
      completed: hasOptPhase,
      required: true,
      actionHref: `/coach/clients/${clientId}?tab=periodization#workspace-tab-content`,
      actionLabel: 'Assign OPT Phase',
      detail: hasOptPhase
        ? `Assigned to Phase ${latestPlan?.nasm_opt_phase}${latestPlan?.phase_name ? ` (${latestPlan.phase_name})` : ''}`
        : 'Target OPT phase not yet designated',
    },
    {
      key: 'macrocycle_periodization',
      label: '12-week periodization macrocycle mapped',
      completed: hasPeriodizationPlan,
      required: true,
      actionHref: `/coach/clients/${clientId}?tab=periodization#workspace-tab-content`,
      actionLabel: 'Architect Macrocycle',
      detail: hasPeriodizationPlan
        ? 'Mesocycle blocks & deloads established'
        : 'Awaiting periodization architecture',
    },
  ]

  const stage5PrereqsMet = hasOptPhase && hasPeriodizationPlan
  const stage5Authorized = isGateAuthorized(5)
  const prior4Met = isEnforcingGates ? stage4Authorized : stage4Completed

  let stage5State: StageState = 'pending'
  let stage5GateStatus: CoachGateStatus = 'locked'
  let stage5Blocker: string | null = null
  let stage5CanAuthorize = false

  if (stage4State === 'blocked') {
    stage5State = 'blocked'
    stage5GateStatus = 'blocked'
    stage5Blocker = 'Blocked by upstream Clinical Safety Gate.'
    stage5CanAuthorize = false
  } else if (!prior4Met) {
    stage5State = 'pending'
    stage5GateStatus = 'locked'
    stage5Blocker = 'Stage 4 (NASM Movement Screen) must be authorized by a coach first.'
    stage5CanAuthorize = false
  } else if (stage5Authorized || (!isEnforcingGates && stage5PrereqsMet)) {
    stage5State = 'completed'
    stage5GateStatus = 'authorized'
    stage5CanAuthorize = true
  } else {
    stage5State = 'in_progress'
    stage5GateStatus = 'awaiting_authorization'
    stage5CanAuthorize = true
  }
  const stage5Completed = stage5State === 'completed'
  const stage5Gate = buildGate(5, 'periodization', stage5GateStatus, stage5CanAuthorize, stage5Blocker)

  // ── Stage 6: Program Design & Prescription Workspace ─────
  const hasActivePlan = Boolean(latestPlan?.id)
  const workoutList = Array.isArray(planJson?.workouts)
    ? planJson.workouts
    : Array.isArray(planJson?.sessions)
    ? planJson.sessions
    : Array.isArray(planJson?.macrocyclePlan?.workouts)
    ? planJson.macrocyclePlan.workouts
    : []

  const hasWorkoutsArray = workoutList.length > 0
  const isPeriodizationOnlyPlan = Boolean(planJson?.periodizationPlan && !hasWorkoutsArray)
  const totalWorkoutCount = hasWorkoutsArray
    ? workoutList.length
    : (Number(latestPlan?.sessions_per_week) || 0)

  const hasSessionsInPlan = hasWorkoutsArray || (!isPeriodizationOnlyPlan && totalWorkoutCount > 0)

  const stage6Milestones: ProgressionMilestone[] = [
    {
      key: 'intelligent_exercise_selection',
      label: 'Phase-appropriate exercises selected & filtered',
      completed: hasSessionsInPlan,
      required: true,
      actionHref: `/coach/clients/${clientId}?tab=program#workspace-tab-content`,
      actionLabel: 'Program Exercises',
      detail: hasSessionsInPlan
        ? `${totalWorkoutCount} workout session${totalWorkoutCount === 1 ? '' : 's'} programmed`
        : 'Exercise matrix empty',
    },
    {
      key: 'program_accepted_published',
      label: 'Coach review complete & program published',
      completed: hasActivePlan,
      required: true,
      actionHref: `/coach/clients/${clientId}?tab=program#workspace-tab-content`,
      actionLabel: 'Publish Program',
      detail: hasActivePlan
        ? `Active program: "${latestPlan?.name}"`
        : 'Draft pending coach review and publication',
    },
  ]

  const stage6PrereqsMet = hasActivePlan && hasSessionsInPlan
  const stage6Authorized = isGateAuthorized(6)
  const prior5Met = isEnforcingGates ? stage5Authorized : stage5Completed

  let stage6State: StageState = 'pending'
  let stage6GateStatus: CoachGateStatus = 'locked'
  let stage6Blocker: string | null = null
  let stage6CanAuthorize = false

  if (stage5State === 'blocked') {
    stage6State = 'blocked'
    stage6GateStatus = 'blocked'
    stage6Blocker = 'Blocked by upstream Clinical Safety Gate.'
    stage6CanAuthorize = false
  } else if (!prior5Met) {
    stage6State = 'pending'
    stage6GateStatus = 'locked'
    stage6Blocker = 'Stage 5 (Periodization Architecture) must be authorized by a coach first.'
    stage6CanAuthorize = false
  } else if (stage6Authorized || (!isEnforcingGates && stage6PrereqsMet)) {
    stage6State = 'completed'
    stage6GateStatus = 'authorized'
    stage6CanAuthorize = true
  } else {
    stage6State = 'in_progress'
    stage6GateStatus = 'awaiting_authorization'
    stage6CanAuthorize = true
  }
  const stage6Completed = stage6State === 'completed'
  const stage6Gate = buildGate(6, 'program_design', stage6GateStatus, stage6CanAuthorize, stage6Blocker)

  // ── Stage 7: Delivery & Live Coaching Kickoff ─────────────
  const nonCancelledSessions = (sessions ?? []).filter(s => s.status !== 'cancelled')
  const completedSessions = nonCancelledSessions.filter(s => s.status === 'completed')
  const hasBookedSession = nonCancelledSessions.length > 0
  const hasCompletedSession = completedSessions.length > 0
  const hasSoapNotes = completedSessions.some(s => Boolean(s.notes?.trim()))

  const isConsultWaived = Boolean(
    telemetry.consultWaived ||
    (sessions ?? []).some(s =>
      s.notes?.toLowerCase().includes('waived') ||
      s.notes?.toLowerCase().includes('opted out') ||
      s.notes?.toLowerCase().includes('skip consult') ||
      s.notes?.toLowerCase().includes('client does not want') ||
      s.notes?.toLowerCase().includes('async delivery')
    )
  )

  const stage7Milestones: ProgressionMilestone[] = [
    {
      key: 'session_scheduled',
      label: 'First coaching session booked or waived',
      completed: hasBookedSession || isConsultWaived,
      required: true,
      detail: isConsultWaived
        ? 'Live consultation waived per client preference'
        : hasBookedSession
        ? `${nonCancelledSessions.length} session(s) recorded`
        : 'No live or async sessions booked',
      actionHref: `/coach/clients/${clientId}?tab=sessions#workspace-tab-content`,
      actionLabel: 'Schedule Consultation',
    },
    {
      key: 'session_delivered',
      label: 'First coaching session delivered or waived',
      completed: hasCompletedSession || isConsultWaived,
      required: true,
      detail: isConsultWaived
        ? 'Consultation waived (fast-tracked to weekly triage)'
        : hasCompletedSession
        ? `${completedSessions.length} session(s) completed`
        : 'Awaiting initial workout delivery',
      actionHref: `/coach/clients/${clientId}/live`,
      actionLabel: 'Deliver Live Session',
    },
    {
      key: 'soap_notes_dictated',
      label: 'Clinical Voice SOAP notes recorded',
      completed: hasSoapNotes,
      required: false,
      detail: hasSoapNotes
        ? 'Biomechanical & subjective session notes saved'
        : 'SOAP documentation optional / pending',
      actionHref: `/coach/clients/${clientId}?tab=sessions#workspace-tab-content`,
      actionLabel: 'Record SOAP Notes',
    },
  ]

  const stage7PrereqsMet = hasCompletedSession || isConsultWaived
  const stage7Authorized = isGateAuthorized(7)
  const prior6Met = isEnforcingGates ? stage6Authorized : stage6Completed

  let stage7State: StageState = 'pending'
  let stage7GateStatus: CoachGateStatus = 'locked'
  let stage7Blocker: string | null = null
  let stage7CanAuthorize = false

  if (stage6State === 'blocked') {
    stage7State = 'blocked'
    stage7GateStatus = 'blocked'
    stage7Blocker = 'Blocked by upstream Clinical Safety Gate.'
    stage7CanAuthorize = false
  } else if (!prior6Met) {
    stage7State = 'pending'
    stage7GateStatus = 'locked'
    stage7Blocker = 'Stage 6 (Program Design Workspace) must be authorized by a coach first.'
    stage7CanAuthorize = false
  } else if (stage7Authorized || (!isEnforcingGates && stage7PrereqsMet)) {
    stage7State = 'completed'
    stage7GateStatus = 'authorized'
    stage7CanAuthorize = true
  } else {
    stage7State = 'in_progress'
    stage7GateStatus = 'awaiting_authorization'
    stage7CanAuthorize = true
  }
  const stage7Completed = stage7State === 'completed'
  const stage7Gate = buildGate(7, 'delivery_kickoff', stage7GateStatus, stage7CanAuthorize, stage7Blocker)

  // ── Stage 8: Telemetry Monitoring, Weekly Follow-Ups & Triage
  const hasLoggedWorkouts = (workoutLogs ?? []).length > 0
  const hasWeeklyCheckin = (weeklyCheckins ?? []).length > 0
  const hasCheckinFeedback = (weeklyCheckins ?? []).some(c => Boolean(c.coach_feedback?.trim()))

  const stage8Milestones: ProgressionMilestone[] = [
    {
      key: 'athlete_logging_training',
      label: 'Client logging workout sets & exertion',
      completed: hasLoggedWorkouts,
      required: true,
      detail: hasLoggedWorkouts
        ? `${(workoutLogs ?? []).length} workout logs received`
        : 'No athlete self-reported workout logs yet',
    },
    {
      key: 'weekly_checkin_reviewed',
      label: 'Sunday check-in reviewed & feedback dispatched',
      completed: hasCheckinFeedback,
      required: true,
      detail: hasCheckinFeedback
        ? 'Weekly check-in reviewed with coach biofeedback dispatched'
        : hasWeeklyCheckin
        ? `${(weeklyCheckins ?? []).length} check-in(s) on record, awaiting coach feedback`
        : 'First Sunday check-in pending',
    },
  ]

  const stage8Completed = hasLoggedWorkouts && hasCheckinFeedback
  const prior7Met = isEnforcingGates ? stage7Authorized : stage7Completed
  let stage8State: StageState = 'pending'
  if (!prior7Met || stage7State === 'blocked') {
    stage8State = stage7State === 'blocked' ? 'blocked' : 'pending'
  } else if (stage8Completed) {
    stage8State = 'completed'
  } else {
    stage8State = 'in_progress'
  }
  const stage8Gate = buildGate(8, 'followups_triage', stage8State === 'completed' ? 'authorized' : stage8State === 'in_progress' ? 'awaiting_authorization' : 'locked', prior7Met)

  // ── Stage 9: Lifecycle Governance & Retention ─────────────
  const isActiveStatus = currentStatus === 'active'
  const hasAuditHistory = auditLogsCount > 0 || stage8Completed

  const stage9Milestones: ProgressionMilestone[] = [
    {
      key: 'active_studio_standing',
      label: 'Active standing maintained without lapse',
      completed: isActiveStatus,
      required: true,
      detail: isActiveStatus ? 'Standing is active' : `Standing is currently ${currentStatus}`,
    },
    {
      key: 'retention_governance',
      label: 'Periodization progression or renewal active',
      completed: hasAuditHistory && stage8Completed,
      required: true,
      detail: stage8Completed
        ? 'Adherence telemetry & ACWR workload tracking active'
        : 'Long-term progression tracking initiates post-intake',
    },
  ]

  const stage9Completed = isActiveStatus && stage8Completed
  let stage9State: StageState = 'pending'
  if (stage8State === 'blocked') {
    stage9State = 'blocked'
  } else if (stage8State !== 'completed') {
    stage9State = 'pending'
  } else if (stage9Completed) {
    stage9State = 'completed'
  } else {
    stage9State = 'in_progress'
  }
  const stage9Gate = buildGate(9, 'retention_governance', stage9State === 'completed' ? 'authorized' : stage9State === 'in_progress' ? 'awaiting_authorization' : 'locked', stage8State === 'completed')

  // ── Assemble All Stages ───────────────────────────────────
  const stages: ProgressionStageDetail[] = [
    {
      stageNumber: 1,
      id: 'intake_claim',
      category: 'onboarding_phase',
      title: 'Lead Intake & Coach Assignment',
      shortTitle: 'Intake & Claim',
      state: stage1State,
      milestones: stage1Milestones,
      gate: stage1Gate,
      actionTab: 'commerce',
      actionHref: `/coach/clients/${clientId}?tab=commerce#workspace-tab-content`,
      actionLabel: 'Assign Package & Credits',
      summary: stage1Completed
        ? 'Assigned to coach with active credit packages.'
        : 'Requires coach claim or package credit allocation.',
    },
    {
      stageNumber: 2,
      id: 'liability_shield',
      category: 'onboarding_phase',
      title: 'Clinical Liability Shield & PAR-Q+',
      shortTitle: 'Liability Shield',
      state: stage2State,
      milestones: stage2Milestones,
      gate: stage2Gate,
      blockerReason: stage2Blocker,
      actionTab: 'shield',
      actionHref: `/coach/clients/${clientId}?tab=shield#workspace-tab-content`,
      actionLabel: stage2State === 'blocked' ? 'Review Medical Red Flag' : 'Verify PAR-Q+ & Waiver',
      summary: stage2State === 'blocked'
        ? 'BLOCKED: Physician clearance required.'
        : stage2Completed
        ? 'PAR-Q+ cleared and liability waiver digitally signed.'
        : 'Awaiting medical intake and legal waiver signature.',
    },
    {
      stageNumber: 3,
      id: 'baseline_biometrics',
      category: 'onboarding_phase',
      title: 'Baseline Biometrics & Environment',
      shortTitle: 'Baseline Vitals',
      state: stage3State,
      milestones: stage3Milestones,
      gate: stage3Gate,
      actionTab: 'overview',
      actionHref: `/coach/clients/${clientId}?tab=overview#workspace-tab-content`,
      actionLabel: 'Configure Vitals & Equipment',
      summary: stage3Completed
        ? 'Height, weight, goal, and equipment profile verified.'
        : 'Complete athlete vitals, goal, and equipment inventory.',
    },
    {
      stageNumber: 4,
      id: 'movement_testing',
      category: 'onboarding_phase',
      title: 'NASM Movement & Postural Screen',
      shortTitle: 'Movement Screen',
      state: stage4State,
      milestones: stage4Milestones,
      gate: stage4Gate,
      actionTab: 'assessment',
      actionHref: `/coach/clients/${clientId}?tab=assessment&subtab=ohsa#workspace-tab-content`,
      actionLabel: 'Conduct Overhead Squat Assessment',
      summary: stage4Completed
        ? 'OHSA recorded; 4-phase CEx warmup routine generated.'
        : 'Conduct OHSA and static screen to identify kinetic chain compensations.',
    },
    {
      stageNumber: 5,
      id: 'periodization',
      category: 'onboarding_phase',
      title: 'Periodization Architecture (12-Week OPT™)',
      shortTitle: 'Periodization',
      state: stage5State,
      milestones: stage5Milestones,
      gate: stage5Gate,
      actionTab: 'periodization',
      actionHref: `/coach/clients/${clientId}?tab=periodization#workspace-tab-content`,
      actionLabel: 'Architect 12-Week Macrocycle',
      summary: stage5Completed
        ? 'OPT phase and 12-week periodization roadmap established.'
        : 'Design 12-week macrocycle and schedule mesocycle deloads.',
    },
    {
      stageNumber: 6,
      id: 'program_design',
      category: 'onboarding_phase',
      title: 'Program Design & Prescription Workspace',
      shortTitle: 'Program Design',
      state: stage6State,
      milestones: stage6Milestones,
      gate: stage6Gate,
      actionTab: 'program',
      actionHref: `/coach/clients/${clientId}?tab=program#workspace-tab-content`,
      actionLabel: 'Review & Publish Workout Program',
      summary: stage6Completed
        ? 'Workouts, tempos, and AI coaching cues published.'
        : 'Select exercises, generate master trainer cues, and publish plan.',
    },
    {
      stageNumber: 7,
      id: 'delivery_kickoff',
      category: 'onboarding_phase',
      title: 'Delivery Kickoff & Live Coaching',
      shortTitle: 'Live Kickoff',
      state: stage7State,
      milestones: stage7Milestones,
      gate: stage7Gate,
      actionTab: 'sessions',
      actionHref: `/coach/clients/${clientId}?tab=sessions#workspace-tab-content`,
      actionLabel: 'Deliver Session & Record SOAP Notes',
      summary: stage7Completed
        ? 'Initial session delivered and clinical SOAP notes recorded.'
        : 'Schedule or deliver first coaching session and record SOAP notes.',
    },
    {
      stageNumber: 8,
      id: 'followups_triage',
      category: 'maintenance_compliance',
      title: 'Telemetry Monitoring & Weekly Triage',
      shortTitle: 'Weekly Follow-Ups',
      state: stage8State,
      milestones: stage8Milestones,
      gate: stage8Gate,
      actionTab: 'checkins',
      actionHref: `/coach/clients/${clientId}?tab=checkins#workspace-tab-content`,
      actionLabel: 'Review Sunday Check-In',
      summary: stage8Completed
        ? 'Workout telemetry and weekly biofeedback check-ins active.'
        : 'Monitor workout logs, evaluate ACWR workload, and review Sunday check-in.',
    },
    {
      stageNumber: 9,
      id: 'retention_governance',
      category: 'maintenance_compliance',
      title: 'Lifecycle Governance & Long-Term Retention',
      shortTitle: 'Retention & Audit',
      state: stage9State,
      milestones: stage9Milestones,
      gate: stage9Gate,
      actionTab: 'lifecycle',
      actionHref: `/coach/clients/${clientId}?tab=lifecycle#workspace-tab-content`,
      actionLabel: 'Manage Standing & Retention',
      summary: stage9Completed
        ? 'Active standing maintained with longitudinal overload and audit trail.'
        : 'Ensure active standing, progressive overload, and package retention.',
    },
  ]

  // Calculate current stage & overall progress %
  const completedStagesCount = stages.filter(s => s.state === 'completed').length
  const totalStagesCount = stages.length
  const overallProgressPercent = Math.round((completedStagesCount / totalStagesCount) * 100)

  const completedOnboardingCount = stages.filter(
    s => s.category === 'onboarding_phase' && s.state === 'completed'
  ).length
  const onboardingPhasesCount = 7
  const isOnboardingComplete = completedOnboardingCount === 7 || (isEnforcingGates ? stage7Authorized : stage7Completed)
  const isFullyOnboarded = isOnboardingComplete
  const onboardingProgressPercent = Math.min(
    100,
    Math.round((completedOnboardingCount / onboardingPhasesCount) * 100)
  )

  const complianceStagesCount = 2
  const completedComplianceCount = stages.filter(
    s => s.category === 'maintenance_compliance' && s.state === 'completed'
  ).length
  const complianceProgressPercent = Math.min(
    100,
    Math.round((completedComplianceCount / complianceStagesCount) * 100)
  )

  // Determine active stage (first stage that is blocked or not completed)
  let activeStage = stages.find(s => s.state === 'blocked' || s.state === 'in_progress')
  if (!activeStage) {
    activeStage = stages.find(s => s.state === 'pending') || stages[stages.length - 1]
  }

  const isMaintenanceAndCompliance = activeStage.stageNumber >= 8 || isOnboardingComplete

  // Determine Next Recommended Action
  let nextAction: NextRecommendedAction
  if (completedStagesCount === totalStagesCount) {
    nextAction = {
      stageNumber: 9,
      stageId: 'retention_governance',
      title: 'Continuum Complete: Retention Governance Active',
      description: 'All 7 onboarding phases and 2 maintenance & compliance pillars completed. Athlete is in active long-term development.',
      tab: 'lifecycle',
      href: `/coach/clients/${clientId}?tab=lifecycle#workspace-tab-content`,
      label: 'View Retention & Audit Hub',
      urgency: 'info',
    }
  } else if (activeStage.state === 'blocked') {
    nextAction = {
      stageNumber: activeStage.stageNumber,
      stageId: activeStage.id,
      title: 'Resolve Clinical Clearance Blocker',
      description: activeStage.blockerReason || 'Athlete flagged high-risk symptoms requiring physician sign-off.',
      tab: activeStage.actionTab,
      href: activeStage.actionHref,
      label: activeStage.actionLabel,
      urgency: 'urgent',
    }
  } else if (isEnforcingGates && activeStage.category === 'onboarding_phase' && activeStage.gate.status === 'awaiting_authorization') {
    nextAction = {
      stageNumber: activeStage.stageNumber,
      stageId: activeStage.id,
      title: `Authorize Stage ${activeStage.stageNumber}: ${activeStage.shortTitle}`,
      description: `Step ${activeStage.stageNumber} is ready for coach authorization. Accept gate to progress athlete to next level.`,
      tab: activeStage.actionTab,
      href: activeStage.actionHref,
      label: `Authorize Step ${activeStage.stageNumber}`,
      urgency: 'urgent',
    }
  } else {
    nextAction = {
      stageNumber: activeStage.stageNumber,
      stageId: activeStage.id,
      title: `Advance Stage ${activeStage.stageNumber}: ${activeStage.title}`,
      description: activeStage.summary,
      tab: activeStage.actionTab,
      href: activeStage.actionHref,
      label: activeStage.actionLabel,
      urgency: activeStage.stageNumber <= 4 ? 'urgent' : 'normal',
    }
  }

  const gatesRecord: Record<number, CoachAuthorizationGate> = {
    1: stage1Gate,
    2: stage2Gate,
    3: stage3Gate,
    4: stage4Gate,
    5: stage5Gate,
    6: stage6Gate,
    7: stage7Gate,
    8: stage8Gate,
    9: stage9Gate,
  }

  const activeGateStage = stages.find(s => s.category === 'onboarding_phase' && s.gate.status !== 'authorized')

  return {
    clientId,
    clientName,
    email: telemetry.email ?? null,
    currentStageNumber: activeStage.stageNumber,
    currentStageId: activeStage.id,
    currentStageTitle: activeStage.title,
    currentStageShortTitle: activeStage.shortTitle,
    overallProgressPercent,
    onboardingProgressPercent,
    complianceProgressPercent,
    completedStagesCount,
    totalStagesCount,
    stages,
    nextAction,
    isFullyOnboarded,
    isOnboardingComplete,
    completedOnboardingCount,
    onboardingPhasesCount,
    isMaintenanceAndCompliance,
    complianceStagesCount,
    completedComplianceCount,
    isBlockedByMedicalClearance: isPhysicianClearanceRequired,
    medicalClearanceTier: medicalEvaluation.riskTier,
    gates: gatesRecord,
    activeGateStageNumber: activeGateStage ? activeGateStage.stageNumber : 7,
    allGatesAuthorized: [1, 2, 3, 4, 5, 6, 7].every(n => gatesRecord[n].status === 'authorized'),
  }
}
