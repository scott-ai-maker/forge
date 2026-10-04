'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import WorkoutCalendarView from '@/components/fitness/WorkoutCalendarView'
import RestTimer from '@/components/fitness/RestTimer'
import dynamic from 'next/dynamic'

import { openCoachGordon } from '@/components/fitness/GlobalCoachGordonHost'
import type { NutritionTargetsSnapshot } from '@/lib/weight-loss-program'

const FitnessLabDiagnosticsView = dynamic(
  () => import('@/components/fitness/hub-views/FitnessLabDiagnosticsView'),
  { ssr: false }
)
const ProgressAnalyticsView = dynamic(
  () => import('@/components/fitness/hub-views/ProgressAnalyticsView'),
  { ssr: false }
)
const CoachAdvisoryView = dynamic(
  () => import('@/components/fitness/hub-views/CoachAdvisoryView'),
  { ssr: false }
)
const ClinicalKineticWarmupModule = dynamic(
  () => import('@/components/fitness/ClinicalKineticWarmupModule'),
  { ssr: false }
)
const ClinicalCoolDownModule = dynamic(
  () => import('@/components/fitness/ClinicalCoolDownModule'),
  { ssr: false }
)
const CoachCardioVoiceoverPlayer = dynamic(
  () => import('@/components/fitness/CoachCardioVoiceoverPlayer'),
  { ssr: false }
)
const MindfulMomentModal = dynamic(
  () => import('@/components/fitness/MindfulMomentModal'),
  { ssr: false }
)
const BarbellPlateCalculator = dynamic(
  () => import('@/components/fitness/BarbellPlateCalculator'),
  { ssr: false }
)
const ExerciseVideoModal = dynamic(
  () => import('@/components/fitness/ExerciseVideoModal'),
  { ssr: false }
)
const SmartExerciseSwapModal = dynamic(
  () => import('@/components/coach/SmartExerciseSwapModal'),
  { ssr: false }
)
import type { MindfulProtocolId } from '@/components/fitness/MindfulMomentModal'
import type { CardioPatternId } from '@/lib/coach-cardio-engine'
import { requestScreenWakeLock, releaseScreenWakeLock } from '@/lib/screen-wake-lock'
import {
  parseInjuriesFromText,
  COMMON_SPORTS_INJURIES,
  type SportsInjuryKey,
} from '@/lib/sports-injuries'
import type { DiscomfortArea, ExerciseSubstitution } from '@/lib/nasm-exercise-substitution'
import { isExerciseAppropriateForInjuries } from '@/lib/nasm-opt-exercise-selection'

import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'
import SetProgressionMatrix from '@/components/fitness/tracker/SetProgressionMatrix'
import WarmUpRampDrawer from '@/components/fitness/tracker/WarmUpRampDrawer'
import IntensityProtocolDrawer from '@/components/fitness/tracker/IntensityProtocolDrawer'
import PlateAdjustmentPresets from '@/components/fitness/tracker/PlateAdjustmentPresets'
import RpeRirExertionSelector from '@/components/fitness/tracker/RpeRirExertionSelector'
import VolumeOverloadMiniHud from '@/components/fitness/tracker/VolumeOverloadMiniHud'
import AutoregulationDeloadAdvisor from '@/components/fitness/tracker/AutoregulationDeloadAdvisor'
import RepCadenceMetronome from '@/components/fitness/tracker/RepCadenceMetronome'
import OneRepMaxPercentageMatrix from '@/components/fitness/tracker/OneRepMaxPercentageMatrix'
import SupersetPairCard, { type SupersetDraftState } from '@/components/fitness/tracker/SupersetPairCard'
import { detectAndGroupSupersets, type GroupedExerciseEntry } from '@/lib/superset-pairing-engine'
import {
  getNasmOptPhaseFeatureRules,
  isSupersetOfferedForPhase,
  isIntensityProtocolOfferedForPhase,
  getDefaultNasmOptTempo,
} from '@/lib/nasm-opt-feature-matrix'
import { calculateBioAdaptiveRestInterval } from '@/lib/bio-adaptive-rest-pacer'
import { detectAcuteFatigueDrop } from '@/lib/autoregulation-advisor-engine'
import { calculateWorkingSetPrePopulateLoad, parsePrescribedWorkingReps } from '@/lib/warmup-auto-populator'
import SessionFatigueCnsSummaryModal from '@/components/fitness/tracker/SessionFatigueCnsSummaryModal'
import { calculateSessionFatigueCnsIndex } from '@/lib/session-fatigue-cns-index'
import FloatingRestTimerDock from '@/components/fitness/tracker/FloatingRestTimerDock'
import LiveSessionStickyDock from '@/components/fitness/tracker/LiveSessionStickyDock'
import ExercisePrBadge from '@/components/fitness/tracker/ExercisePrBadge'
import { HorizontalSetsCarousel } from '@/components/fitness/tracker/HorizontalSetsCarousel'
import { LiftType, VideoCritiqueAnalysis } from '@/lib/video-form-analysis'
import {
  detectPersonalRecord,
  computeExercisePrVault,
  type PrDetectionResult,
  normalizeExerciseNameKey,
} from '@/lib/personal-record-engine'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import {
  triggerHaptic,
  enqueueOfflineSet,
  flushOfflineQueue,
  getPendingQueueCount,
} from '@/lib/offline-sync-queue'
import { playPrecisionTone, playCountdownPip } from '@/lib/web-audio-cadence-engine'
import { updateLockScreenSessionTelemetry, clearLockScreenSessionTelemetry } from '@/lib/media-session-telemetry'
import { speakCoachVoiceCue, playNeuralCoachVoiceCue } from '@/lib/coach-voice-synthesizer'
import { useTrackerTimer } from '@/components/fitness/hooks/useTrackerTimer'
import { useSetVolume, parseSetTarget } from '@/components/fitness/hooks/useSetVolume'
import { useSupersetController } from '@/components/fitness/hooks/useSupersetController'
import { useOfflineSyncManager } from '@/components/fitness/hooks/useOfflineSyncManager'
import { useWearableTelemetrySync } from '@/components/fitness/hooks/useWearableTelemetrySync'
import {
  extractWorkoutDayTag,
  extractWorkoutWeekTag,
  resolveNextUnfinishedWorkoutDay,
  resolveWorkoutDayCompletion,
  resolveMicrocycleWeekCompletedCount,
  filterLogsForPlan,
} from '@/lib/fitness'
import { calculateActiveMicrocycleProgress } from '@/lib/periodization-roadmap'
import { getNasmClinicalMovementCard } from '@/lib/nasm-clinical-movement-cards'
import { resolveGaaExerciseImage } from '@/lib/nasm-generated-images'
import { detectExerciseEquipment } from '@/lib/nasm-equipment-detector'
import { calculate1Rm } from '@/lib/progressive-overload-engine'
import { identifyHeartRateZone } from '@/lib/nasm-cardio-stage-engine'
import {
  calculateEstimatedWorkoutDuration,
  formatDurationDisplay,
  parseRestSecondsFromExercise,
} from '@/lib/workout-duration-engine'
import {
  buildIntegratedCardioPrescription,
  parseCardioEquipmentCapabilities,
  buildRecommendedCardioModalities,
  type IntegratedCardioPrescription,
} from '@/lib/rag-nasm-program-generator'
import DynamicLoadPrescriptionPill from '@/components/fitness/DynamicLoadPrescriptionPill'
import { computeWearableCnsScore, type DailyBiometricSummary } from '@/lib/wearables-telemetry'
import type { ExercisePlanItem } from '@/lib/travel-workout-adapter'
import type { NasmAssessmentRecord } from '@/lib/nasm-assessments'
import {
  isTimedStaticStretch,
  isFoamRollerExercise,
  isBandExercise,
  isStrengthExercise,
  parseHoldDurationSeconds,
  formatExerciseTargetDisplay,
  BAND_COLOR_SPECTRUM,
} from '@/lib/exercise-logging-helpers'
import {
  isNativeIOS,
  isNativeMobile,
  autoInitializeNativeHealthKit,
  saveWorkoutToNativeHealthKit,
  subscribeToNativeHealthKitUpdates,
  syncActivityToAppleHealth,
} from '@/lib/native-healthkit-bridge'
import {
  normalizeAppleHealthIngestPayload,
  formatAppleHealthTelemetryToBiometricSummary,
  type RawAppleHealthIngestPayload,
} from '@/lib/apple-health-bridge'

interface FitnessProfile {
  full_name?: string
  preferred_units?: 'metric' | 'imperial'
  sex?: 'male' | 'female' | 'other'
  age?: number
  resting_heart_rate?: number
  height_cm?: number
  weight_kg?: number
  waist_cm?: number
  neck_cm?: number
  hip_cm?: number
  training_days_per_week?: number
  fitness_goal?: string
  target_bodyfat_percent?: number
  before_photo_url?: string
  equipment_access?: string[]
  cardio_equipment_access?: string[]
  injuries_limitations?: string | null
  onboarding_completed_at?: string | null
}

interface WorkoutExercise {
  name: string
  sets: string
  reps: string
  tempo?: string | null
  rest?: string | null
  notes?: string | null
  description?: string | null
  primaryEquipment?: string[] | null
  imageUrl?: string | null
  videoUrl?: string | null
  block?: string | null
}

interface WorkoutDay {
  day: number
  focus: string
  scheduledDate?: string | null
  notes?: string | null
  exercises: WorkoutExercise[]
  cardioProtocol?: IntegratedCardioPrescription | null
}

interface WorkoutPlanRecord {
  id: string
  name?: string
  goal?: string | null
  nasm_opt_phase: number
  phase_name: string
  sessions_per_week?: number
  estimated_duration_mins?: number
  created_at?: string
  plan_json?: {
    name?: string
    goal?: string
    phaseName?: string
    nasmOptPhase?: number
    sessionsPerWeek?: number
    estimatedDurationMins?: number
    generatedBy?: string
    generatedByCoachId?: string
    nutritionTargets?: NutritionTargetsSnapshot
    workouts?: WorkoutDay[]
    calendar?: Array<{
      day: number
      focus: string
      scheduledDate: string | null
      durationMins: number
      exerciseCount: number
    }>
  }
}

interface WorkoutLogRecord {
  id: string
  session_title: string
  session_date: string
  exertion_rpe?: number
  completed?: boolean
  notes?: string | null
  workout_plan_id?: string | null
}

interface BodyAnalysisRecord {
  estimated_bodyfat_percent?: number
}

interface WorkoutSetLogRecord {
  id: string
  session_date: string
  exercise_name: string
  set_number?: number
  reps: number
  weight_kg?: number
  rest_seconds?: number
  rpe?: number
  rir?: number
  is_warmup?: boolean
  notes?: string | null
}

interface InlineSetDraft {
  sessionDate: string
  setNumber: string
  reps: string
  weight: string
  tempo?: string
  restSeconds: string
  rpe: string
  rir: string
  isWarmup: boolean
  notes: string
}

interface FitnessTrackerClientProps {
  profile: FitnessProfile | null
  intake?: {
    parq_answers?: unknown
    parq_any_yes?: boolean
    medications?: string | null
    medical_conditions?: string | null
    surgeries_or_injuries?: string | null
    allergies?: string | null
  } | null
  latestPlan: WorkoutPlanRecord | null
  allPlans?: WorkoutPlanRecord[]
  latestAssessment?: NasmAssessmentRecord | null
  logs: WorkoutLogRecord[]
  setLogs: WorkoutSetLogRecord[]
  latestAnalysis: BodyAnalysisRecord | null
  cardioLogs?: CardioLogEntry[]
  progressPhotos?: ProgressPhotoEntry[]
  initialWorkspace?: FitnessWorkspace
  initialTab?: 'heatmap' | 'gate' | 'acwr' | 'deload' | '3d'
}

interface CardioLogEntry {
  id: string
  session_date: string
  activity_type: string
  duration_mins: number
  distance_km?: number | null
  avg_heart_rate?: number | null
  perceived_effort?: number | null
  calories?: number | null
  notes?: string | null
}

interface ProgressPhotoEntry {
  id: string
  photo_url: string
  taken_at: string
  notes?: string | null
  created_at?: string | null
}

function _formatExerciseDescriptionLines(description: string | null | undefined) {
  const text = String(description ?? '')
    .replace(/\r/g, '')
    .replace(/(?:\r?\n|^)\s*Equipment\s*:[\s\S]*$/im, '')
    .replace(/\s+Equipment\s*:[\s\S]*$/i, '')
    .trim()
  if (!text) return []

  const numberedSteps = text.match(/Step\s*\d+\s*:[\s\S]*?(?=(?:\s*Step\s*\d+\s*:)|$)/gi)
  if (numberedSteps && numberedSteps.length > 1) {
    return numberedSteps
      .map(step => step.replace(/\s+/g, ' ').trim())
      .filter(step => Boolean(step) && !/^Equipment\s*:/i.test(step))
  }

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => Boolean(line) && !/^Equipment\s*:/i.test(line))

  return lines.length > 0 ? lines : [text]
}

function equipmentBadges(
  primaryEquipment: string[] | null | undefined,
  exerciseName?: string,
  description?: string | null
) {
  if (exerciseName) {
    return detectExerciseEquipment(exerciseName, description, primaryEquipment)
  }
  const items = Array.isArray(primaryEquipment)
    ? primaryEquipment.map(item => String(item ?? '').trim()).filter(Boolean)
    : []

  return items.length > 0 ? items : ['Bodyweight']
}

function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function formatGoalTitle(raw?: string | null): string {
  if (!raw) return 'Not set'
  const trimmed = raw.trim()
  const GOAL_MAP: Record<string, string> = {
    fat_loss: 'Fat Loss',
    hypertrophy: 'Hypertrophy & Muscle Growth',
    muscle_growth: 'Hypertrophy & Muscle Growth',
    athletic_power: 'Athletic Power & Performance',
    power: 'Athletic Power & Performance',
    strength_endurance: 'Strength Endurance',
    stabilization_endurance: 'Stabilization Endurance',
    maximal_strength: 'Maximal Strength',
    general_fitness: 'General Fitness & Longevity',
    recomposition: 'Body Recomposition',
    posture_correction: 'Postural Correction & Mobility',
  }
  const lower = trimmed.toLowerCase()
  if (GOAL_MAP[lower]) return GOAL_MAP[lower]
  if (trimmed.includes('_') || trimmed.includes('-')) {
    return trimmed
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
  }
  return trimmed
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10)
}

function resolveWorkoutCardioProtocol(
  workout: { notes?: string | null; day: number; focus?: string; cardioProtocol?: IntegratedCardioPrescription | null },
  profile?: FitnessProfile | null,
  plan?: WorkoutPlanRecord | null
): IntegratedCardioPrescription | null {
  const planAny = plan as Record<string, unknown> | null
  const profileAny = profile as Record<string, unknown> | null
  const rawEquipmentAccess: string[] = Array.isArray(profileAny?.equipment_access) ? (profileAny.equipment_access as string[]) : []
  const rawCardioEquipmentAccess: string[] = Array.isArray(profileAny?.cardio_equipment_access) ? (profileAny.cardio_equipment_access as string[]) : []
  const planJson = planAny?.plan_json as Record<string, unknown> | undefined
  const planEquipment: string[] = Array.isArray(planAny?.equipment)
    ? (planAny.equipment as string[])
    : Array.isArray(planJson?.equipment)
      ? (planJson.equipment as string[])
      : []
  const planCardioEquipment: string[] = Array.isArray(planAny?.cardio_equipment_access)
    ? (planAny.cardio_equipment_access as string[])
    : Array.isArray(planJson?.cardio_equipment_access)
      ? (planJson.cardio_equipment_access as string[])
      : []

  const rawGoal = String(plan?.plan_json?.goal || plan?.goal || plan?.name || profile?.fitness_goal || 'general_fitness').toLowerCase()
  const goal: 'fat_loss' | 'hypertrophy' | 'performance' | 'general_fitness' =
    rawGoal.includes('fat') || rawGoal.includes('loss') || rawGoal.includes('weight')
      ? 'fat_loss'
      : rawGoal.includes('hyper') || rawGoal.includes('gain') || rawGoal.includes('muscle')
        ? 'hypertrophy'
        : rawGoal.includes('perf') || rawGoal.includes('power') || rawGoal.includes('athletic')
          ? 'performance'
          : 'general_fitness'

  const cardioCaps = parseCardioEquipmentCapabilities(
    [...rawCardioEquipmentAccess, ...planCardioEquipment],
    [...rawEquipmentAccess, ...planEquipment]
  )

  if (workout.cardioProtocol) {
    const filteredModalities = buildRecommendedCardioModalities(workout.cardioProtocol.stage, goal, cardioCaps)
    return {
      ...workout.cardioProtocol,
      recommendedModalities: filteredModalities,
    }
  }

  if (workout.notes) {
    const stageMatch = workout.notes.match(/Stage\s*([123])/i)
    const durMatch = workout.notes.match(/(\d+)\s*mins?\s*(?:in\s*)?([^\n,]+)/i)
    const ratMatch = workout.notes.match(/Metabolic rationale\s*:\s*([^\n]+)/i)

    if (stageMatch && durMatch) {
      const stage = Number(stageMatch[1]) as 1 | 2 | 3
      const modalities = buildRecommendedCardioModalities(stage, goal, cardioCaps)
      return {
        title: `Stage ${stage} Cardio Protocol`,
        protocolType: stage === 3 ? 'pap_hiit_contrast' : stage === 2 ? 'stage_interval_conditioning' : 'steady_state_base',
        stage,
        stageName: `Stage ${stage} Cardiorespiratory Training`,
        targetZone: durMatch[2].trim(),
        targetBpmRange: durMatch[2].trim(),
        targetRpe: stage === 3 ? 'RPE 8–9 / 10' : stage === 2 ? 'RPE 6–7 / 10' : 'RPE 3–4 / 10',
        durationMins: Number(durMatch[1]),
        workRestRatio: stage === 3 ? '1:3 (30s Sprint / 90s Recovery)' : stage === 2 ? '1:2 (60s Work / 120s Recovery)' : 'Continuous Steady State',
        timingGuideline: 'Perform post-workout or as a dedicated conditioning session on active recovery days.',
        recommendedModalities: modalities,
        metabolicRationale: ratMatch ? ratMatch[1].trim() : 'Optimizes lipid oxidation, aerobic capacity, and cardiovascular recovery.',
        coachingCues: ['Maintain rhythmic diaphragmatic breathing and stay strictly within the prescribed heart rate zone.'],
        nasmChapterSource: 'NASM CPT-7 Chapter 15 (Cardiorespiratory Training)',
      }
    }
  }

  return buildIntegratedCardioPrescription({
    goal,
    phase: plan?.nasm_opt_phase ?? 1,
    dayIndex: workout.day,
    totalDays: plan?.plan_json?.workouts?.length ?? 4,
    clientAge: Number(profile?.age) || 35,
    equipmentAccess: [...rawEquipmentAccess, ...planEquipment],
    cardioEquipmentAccess: [...rawCardioEquipmentAccess, ...planCardioEquipment],
  }) || null
}

export interface InWorkoutCardioDraft {
  modality: string
  durationMins: string
  distance: string
  avgHeartRate: string
  perceivedEffort: string
  calories: string
  notes: string
}

function defaultCardioDraft(
  cardio: IntegratedCardioPrescription
): InWorkoutCardioDraft {
  return {
    modality: cardio.recommendedModalities[0] || 'Outdoor Brisk Walk / Run',
    durationMins: String(cardio.durationMins || 20),
    distance: '',
    avgHeartRate: '',
    perceivedEffort: cardio.stage === 3 ? '8' : cardio.stage === 2 ? '6' : '4',
    calories: '',
    notes: '',
  }
}
export { parseRestSecondsFromExercise } from '@/lib/workout-duration-engine'

export function playCoachChime(freq = 660, duration = 0.22, type: OscillatorType = 'triangle') {
  playPrecisionTone({ freq, duration, type, gainPeak: 0.22 })
}

export { speakCoachVoiceCue }

function defaultInlineSetDraft(
  sessionDate: string,
  prescribedReps?: string | null,
  phase?: number,
  section?: string | null,
  prescribedRest?: string | null,
  prescribedTempo?: string | null,
  exerciseName?: string | null
): InlineSetDraft {
  const isStretch = isTimedStaticStretch(exerciseName, section, prescribedReps)
  const isFoam = isFoamRollerExercise(exerciseName)
  const isTimed = isStretch || isFoam
  const isStrength = isStrengthExercise(exerciseName, section, prescribedReps)

  const repsDefault = (() => {
    if (isTimed) {
      return String(parseHoldDurationSeconds(prescribedReps, 30))
    }
    const text = String(prescribedReps ?? '').trim()
    if (!text) return '8'
    const rangeMatch = text.match(/(\d+)\s*[-\u2013to]+\s*(\d+)/i)
    if (rangeMatch) return rangeMatch[1]
    const numMatch = text.match(/\d+/)
    return numMatch ? numMatch[0] : '8'
  })()
  const restDefault = parseRestSecondsFromExercise(prescribedRest, phase ?? 1, section)
  const tempoDefault = isStrength
    ? (prescribedTempo ? String(prescribedTempo).trim() : (phase === 1 ? '4/2/1' : phase === 4 ? '1/1/1' : phase === 5 ? 'X/0/X' : '2/0/2'))
    : ''
  const rirDefault = isStrength ? '2' : ''

  return {
    sessionDate,
    setNumber: '1',
    reps: repsDefault,
    weight: isTimed ? '0' : '',
    tempo: tempoDefault,
    restSeconds: String(restDefault),
    rpe: '7',
    rir: rirDefault,
    isWarmup: false,
    notes: '',
  }
}

function exerciseDraftKey(workoutDay: number, exerciseName: string) {
  return `${String(workoutDay)}::${normalizeExerciseName(exerciseName)}`
}

function workoutDayTag(workoutDay: number) {
  return `[workout-day:${String(workoutDay)}]`
}

function workoutWeekTag(workoutWeek: number) {
  return `[workout-week:${String(workoutWeek)}]`
}

export {
  extractWorkoutDayTag,
  extractWorkoutWeekTag,
  resolveNextUnfinishedWorkoutDay,
  resolveWorkoutDayCompletion,
  resolveMicrocycleWeekCompletedCount,
  filterLogsForPlan,
  calculateActiveMicrocycleProgress,
}

function deriveClientBriefingBullets(workoutFocus?: string | null, notes?: string | null): string[] {
  const bullets: string[] = []
  const focusLower = (workoutFocus || '').toLowerCase()
  const notesLower = (notes || '').toLowerCase()

  // 1. Primary Focus
  if (focusLower.includes('upper') || focusLower.includes('chest') || focusLower.includes('push') || focusLower.includes('pull')) {
    bullets.push('Primary Focus: Upper body strength, postural alignment, and balanced muscular development.')
  } else if (focusLower.includes('lower') || focusLower.includes('leg') || focusLower.includes('squat') || focusLower.includes('hinge')) {
    bullets.push('Primary Focus: Lower body power, hip/knee stability, and posterior chain endurance.')
  } else if (focusLower.includes('full') || focusLower.includes('total') || focusLower.includes('core')) {
    bullets.push('Primary Focus: Total body integration, core stability, and functional multi-joint strength.')
  } else {
    bullets.push(`Primary Focus: ${workoutFocus || 'Targeted strength adaptation & mobility excellence'}.`)
  }

  // 2. Target Effort / RPE
  if (notesLower.includes('rpe 9') || notesLower.includes('power') || notesLower.includes('max')) {
    bullets.push('Target Effort: High intensity (RPE 8.5–9.5) — explosive intent with maximal focus.')
  } else if (notesLower.includes('hypertrophy') || notesLower.includes('rpe 8') || focusLower.includes('strength')) {
    bullets.push('Target Intensity: Moderate-to-hard (RPE 7–8) — keep 1–2 solid reps in reserve on working sets.')
  } else {
    bullets.push('Target Intensity: Controlled stabilization (RPE 6–7) — prioritize pristine technique and steady pacing.')
  }

  // 3. Key Form Cue
  if (focusLower.includes('upper') || focusLower.includes('chest') || focusLower.includes('shoulder')) {
    bullets.push('Key Form Cue: Control the lowering phase (2–3s) and keep your shoulder blades packed.')
  } else if (focusLower.includes('lower') || focusLower.includes('leg')) {
    bullets.push('Key Form Cue: Maintain tripod foot pressure, drive knees tracking in line with toes.')
  } else {
    bullets.push('Key Form Cue: Engage your deep core brace throughout every repetition and control the eccentric tempo.')
  }

  return bullets
}

export type PrimaryFitnessHub = 'train' | 'progress' | 'lab' | 'coach'
export type FitnessLabTool = 'readiness' | 'sleep' | 'roadmap' | 'video' | 'nutrition' | 'assessment' | 'performance' | 'calculator' | 'travel' | 'bodycomp'
export type FitnessWorkspace =
  | 'train'
  | 'workouts'
  | 'progress'
  | 'lab'
  | 'coach'
  | 'readiness'
  | 'sleep'
  | 'roadmap'
  | 'periodization'
  | 'video'
  | 'nutrition'
  | 'performance'
  | 'assessment'
  | 'calculator'
  | 'analyze'
  | 'checkin'
  | 'toolboxes'
  | 'supplements'
  | 'travel'
  | 'bodycomp'

function resolveInitialHubState(ws: FitnessWorkspace): {
  hub: PrimaryFitnessHub
  labTool: FitnessLabTool
} {
  if (ws === 'periodization' || ws === 'roadmap') {
    return { hub: 'lab', labTool: 'roadmap' }
  }
  if (ws === 'travel') {
    return { hub: 'lab', labTool: 'travel' }
  }
  if (ws === 'bodycomp') {
    return { hub: 'lab', labTool: 'bodycomp' }
  }
  if (ws === 'readiness' || ws === 'sleep' || ws === 'video' || ws === 'nutrition' || ws === 'performance' || ws === 'assessment' || ws === 'calculator') {
    return { hub: 'lab', labTool: ws as FitnessLabTool }
  }
  if (ws === 'toolboxes' || ws === 'supplements') {
    return { hub: 'lab', labTool: 'nutrition' }
  }
  if (ws === 'lab') {
    return { hub: 'lab', labTool: 'readiness' }
  }
  if (ws === 'analyze' || ws === 'progress') {
    return { hub: 'progress', labTool: 'readiness' }
  }
  if (ws === 'checkin' || ws === 'coach') {
    return { hub: 'coach', labTool: 'readiness' }
  }
  return { hub: 'train', labTool: 'readiness' }
}

export default function FitnessTrackerClient({
  profile,
  intake,
  latestPlan,
  allPlans = [],
  latestAssessment = null,
  logs,
  setLogs,
  latestAnalysis,
  cardioLogs = [],
  progressPhotos = [],
  initialWorkspace = 'train',
  initialTab,
}: FitnessTrackerClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    latestPlan?.id ?? (allPlans[0]?.id ?? null)
  )

  const plan = useMemo(() => {
    if (selectedPlanId && allPlans.length > 0) {
      const found = allPlans.find(p => p.id === selectedPlanId)
      if (found) return found
    }
    return latestPlan || allPlans[0] || null
  }, [selectedPlanId, allPlans, latestPlan])

  const planWorkouts = useMemo(() => {
    return plan?.plan_json?.workouts ?? []
  }, [plan])

  const averageSessionDurationMins = useMemo(() => {
    if (planWorkouts && planWorkouts.length > 0) {
      const sum = planWorkouts.reduce((acc, w) => {
        const c = resolveWorkoutCardioProtocol(w, profile, plan)
        const bd = calculateEstimatedWorkoutDuration({
          workout: w,
          cardio: c,
          optPhase: plan?.nasm_opt_phase,
        })
        return acc + bd.totalDurationMins
      }, 0)
      return Math.round(sum / planWorkouts.length)
    }
    return plan?.estimated_duration_mins || 75
  }, [planWorkouts, profile, plan])
  const [localWorkoutLogs, setLocalWorkoutLogs] = useState<WorkoutLogRecord[]>(logs)
  const [inlineSetDrafts, setInlineSetDrafts] = useState<Record<string, InlineSetDraft>>({})
  const [localSetLogs, setLocalSetLogs] = useState<WorkoutSetLogRecord[]>(setLogs)
  const [bodyfatState, setBodyfatState] = useState({
    estimated: latestAnalysis?.estimated_bodyfat_percent ? String(latestAnalysis.estimated_bodyfat_percent) : '',
  })
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [completeModal, setCompleteModal] = useState<WorkoutDay | null>(null)
  const [skipModal, setSkipModal] = useState<{ workoutDay: number; exercise: WorkoutExercise } | null>(null)
  const [adaptedExercisesByDay, setAdaptedExercisesByDay] = useState<Record<number, ExercisePlanItem[]>>({})
  const [localCardioLogs, setLocalCardioLogs] = useState<CardioLogEntry[]>(cardioLogs)
  const [cardioDraftsByDay, setCardioDraftsByDay] = useState<Record<number, InWorkoutCardioDraft>>({})
  const [activeCardioPlayerSession, setActiveCardioPlayerSession] = useState<{
    patternId: CardioPatternId
    durationMins: number
    modality: string
  } | null>(null)
  const [activeMindfulSession, setActiveMindfulSession] = useState<{
    isOpen: boolean
    sourceContext: 'cooldown-flow' | 'strength-flow' | 'cardio-flow' | 'standalone'
    initialProtocol?: MindfulProtocolId
    initialDurationMinutes?: number
  } | null>(null)
  const [_workspace, setWorkspace] = useState<FitnessWorkspace>(initialWorkspace)
  const initialHubState = useMemo(() => resolveInitialHubState(initialWorkspace), [initialWorkspace])
  const [primaryHub, setPrimaryHub] = useState<PrimaryFitnessHub>(initialHubState.hub)
  const [activeLabTool, setActiveLabTool] = useState<FitnessLabTool>(initialHubState.labTool)
  const initialUnits: 'metric' | 'imperial' = profile?.preferred_units === 'metric' ? 'metric' : 'imperial'
  const [units] = useState<'metric' | 'imperial'>(initialUnits)
  const [activeWorkoutDay, setActiveWorkoutDay] = useState<number | null>(null)
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false)
  const [activeVideoExercise, setActiveVideoExercise] = useState<{
    name: string
    videoUrl?: string | null
    coachingCues?: string[] | null
    description?: string | null
    primaryEquipment?: string[] | null
  } | null>(null)
  const [activeStepFilter, setActiveStepFilter] = useState<'all' | 'warmup' | 'resistance' | 'cardio' | 'cooldown'>('all')
  const [swapModalExercise, setSwapModalExercise] = useState<{
    workoutDay: number
    exercise: WorkoutExercise
    initialDiscomfort?: DiscomfortArea
  } | null>(null)

  const clientInjuries = useMemo<SportsInjuryKey[]>(() => {
    const rawText = `${profile?.injuries_limitations || ''} ${intake?.surgeries_or_injuries || ''}`.trim()
    const { selectedInjuryIds } = parseInjuriesFromText(rawText)
    return selectedInjuryIds as SportsInjuryKey[]
  }, [profile?.injuries_limitations, intake?.surgeries_or_injuries])

  const primaryDiscomfortArea = useMemo<DiscomfortArea | undefined>(() => {
    if (clientInjuries.length === 0) return undefined
    const first = clientInjuries[0]
    const map: Record<SportsInjuryKey, DiscomfortArea> = {
      runners_knee: 'runners_knee',
      tennis_elbow: 'tennis_elbow',
      golfers_elbow: 'golfers_elbow',
      jumpers_knee: 'jumpers_knee',
      it_band_syndrome: 'it_band',
      shin_splints: 'shin_splints',
      plantar_fasciitis: 'plantar_fasciitis',
      rotator_cuff_impingement: 'rotator_cuff',
      lumbar_strain_disc: 'lower_back',
      hamstring_strain: 'hamstring',
      achilles_tendinopathy: 'achilles',
      ankle_sprain_instability: 'ankle_sprain',
      hip_impingement_fai: 'hip_impingement',
      cervical_strain_neck: 'cervical_spine',
      wrist_strain_carpal: 'wrist',
      groin_adductor_strain: 'groin_strain',
    }
    return map[first]
  }, [clientInjuries])

  const handleExerciseSwap = useCallback((
    workoutDay: number,
    oldExercise: WorkoutExercise,
    substitution: ExerciseSubstitution
  ) => {
    const currentDayExercises: ExercisePlanItem[] = adaptedExercisesByDay[workoutDay]
      ? [...adaptedExercisesByDay[workoutDay]]
      : (planWorkouts.find(w => w.day === workoutDay)?.exercises || []).map(we => ({
          name: we.name,
          sets: we.sets,
          reps: we.reps,
          tempo: we.tempo ?? undefined,
          restSeconds: parseRestSecondsFromExercise(we.rest || '60'),
          coachingCue: we.notes ?? undefined,
          notes: we.description ?? undefined,
        }))

    const targetIdx = currentDayExercises.findIndex(e => e.name === oldExercise.name)
    const newExerciseItem: ExercisePlanItem = {
      name: substitution.name,
      sets: oldExercise.sets || 3,
      reps: oldExercise.reps || '10-12',
      tempo: substitution.prescribedTempo || oldExercise.tempo || '2-0-2-0',
      restSeconds: parseRestSecondsFromExercise(oldExercise.rest || '60'),
      coachingCue: `${substitution.benefitTag} · ${substitution.reasoning}`,
      originalBarbellName: oldExercise.name,
      notes: substitution.reasoning,
    }

    if (targetIdx >= 0) {
      currentDayExercises[targetIdx] = newExerciseItem
    } else {
      currentDayExercises.push(newExerciseItem)
    }

    setAdaptedExercisesByDay(prev => ({
      ...prev,
      [workoutDay]: currentDayExercises,
    }))

    triggerHaptic('success')
    setStatus(`✓ Substituted "${oldExercise.name}" with "${substitution.name}" (${substitution.reasoning})`)
  }, [adaptedExercisesByDay, planWorkouts])

  // Collapsible Stages for Workout Flow (Step 1 Warmup, Step 2 Resistance, Step 3 Cardio, Step 4 Cool-Down)
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({})

  const isStageCollapsed = (day: number, stage: 'warmup' | 'resistance' | 'cardio' | 'cooldown') => {
    return Boolean(collapsedStages[`${day}-${stage}`])
  }

  const toggleStage = (day: number, stage: 'warmup' | 'resistance' | 'cardio' | 'cooldown') => {
    setCollapsedStages(prev => ({
      ...prev,
      [`${day}-${stage}`]: !prev[`${day}-${stage}`],
    }))
  }

  const [expandedExerciseKey, setExpandedExerciseKey] = useState<string | null>(null)
  const [openWarmupRamps, setOpenWarmupRamps] = useState<Record<string, boolean>>({})
  const [_showUnifiedSessionModal, _setShowUnifiedSessionModal] = useState<boolean>(false)

  // 1. Modular Superset Controller & NASM OPT Phase Governance
  const {
    enableSupersets,
    setEnableSupersets,
    isSupersetOffered: _isSupersetOffered,
    phaseFeatureRules: _phaseFeatureRules,
    toggleSupersets,
    groupWorkoutExercises,
  } = useSupersetController({
    nasmOptPhase: plan?.nasm_opt_phase,
    initialEnabled: false,
    onStatusChange: setStatus,
  })

  // 2. Microcycle Progress & Periodization State
  const planCompletedLogs = useMemo(() => {
    return filterLogsForPlan(localWorkoutLogs || [], plan, planWorkouts)
  }, [localWorkoutLogs, plan, planWorkouts])

  const completedWorkoutCount = useMemo(() => {
    if (planWorkouts && planWorkouts.length > 0 && planCompletedLogs.length > 0) {
      return planCompletedLogs.length
    }
    return (localWorkoutLogs || []).filter(log => log.completed !== false).length
  }, [planCompletedLogs, localWorkoutLogs, planWorkouts])

  const sessionsPerWeek = useMemo(() => {
    return Number(plan?.sessions_per_week) || (planWorkouts.length > 0 ? planWorkouts.length : 4)
  }, [plan, planWorkouts])

  const activePlanLogs = useMemo(() => {
    return planCompletedLogs.length > 0 ? planCompletedLogs : (localWorkoutLogs || [])
  }, [planCompletedLogs, localWorkoutLogs])

  const rawActiveWeek = useMemo(() => {
    return Math.min(12, Math.floor(completedWorkoutCount / sessionsPerWeek) + 1)
  }, [completedWorkoutCount, sessionsPerWeek])

  const completedInActiveWeek = useMemo(() => {
    if (!planWorkouts || planWorkouts.length === 0) return 0
    return resolveMicrocycleWeekCompletedCount({
      planWorkouts,
      workoutLogs: activePlanLogs,
      currentWeek: rawActiveWeek,
      sessionsPerWeek,
      planId: plan?.id,
    })
  }, [planWorkouts, activePlanLogs, rawActiveWeek, sessionsPerWeek, plan?.id])

  const microcycleProgress = useMemo(() => {
    return calculateActiveMicrocycleProgress(
      completedWorkoutCount,
      sessionsPerWeek,
      12,
      completedInActiveWeek
    )
  }, [completedWorkoutCount, sessionsPerWeek, completedInActiveWeek])

  // 3. Modular Set Volume, Day Progress & ACWR Telemetry Engine (Filtered for Active Microcycle Week)
  const {
    activeSetLogs,
    allSetLogsByExercise,
    setLogsByExercise,
    workoutProgressByDay,
    progression,
    acwrTelemetry,
  } = useSetVolume({
    localSetLogs,
    localWorkoutLogs,
    planWorkouts,
    units,
    currentWeek: microcycleProgress.currentWeek,
    sessionsPerWeek,
  })

  // 3. Modular Workout Session, Rest Interval & Hold Timer Engine
  const {
    elapsedWorkoutSeconds,
    isWorkoutTimerActive,
    activeWorkoutSessionDay,
    activeWorkoutStage,
    handleStartWorkoutSession,
    handleStartStrengthSession: _handleStartStrengthSession,
    handleStartCardioSession,
    handlePauseResumeWorkoutSession,
    handleStopWorkoutSession,
    setElapsedWorkoutSeconds,
    setActiveWorkoutStage,
    setIsWorkoutTimerActive,
    setActiveWorkoutSessionDay,
    activeRestState,
    setActiveRestState,
    soundMetronomeEnabled,
    setSoundMetronomeEnabled,
    soundMetronomeMode,
    setSoundMetronomeMode,
    activeHoldTimer,
    setActiveHoldTimer,
    activeRestTimerKey,
    setActiveRestTimerKey,
    handleTimerDone: _handleTimerDone,
    handleAddRestSeconds,
    handleTogglePauseRest,
    handleCompleteRest,
    handleToggleSoundMetronome,
    isWakeLockActive,
    setIsWakeLockActive: _setIsWakeLockActive,
  } = useTrackerTimer({
    planWorkouts,
    isGymSession: primaryHub === 'train' || activeWorkoutDay !== null,
    onStatusChange: setStatus,
    onCompleteHold: (exerciseKey, targetSeconds) => {
      setInlineSetDrafts(d => ({
        ...d,
        [exerciseKey]: {
          ...(d[exerciseKey] ?? defaultInlineSetDraft(todayDateOnly())),
          reps: String(targetSeconds),
        },
      }))
    },
  })

  // Continuous Inbound Wearable Telemetry & Readiness Sync
  const {
    wearableTelemetry,
    liveReadinessScore,
    setWearableTelemetry,
  } = useWearableTelemetrySync()

  const {
    isOnline,
    pendingSyncCount,
    setPendingSyncCount,
  } = useOfflineSyncManager<WorkoutSetLogRecord>(
    (tempId, serverRecord) => {
      setLocalSetLogs(prev => prev.map(l => l.id === tempId ? serverRecord : l))
    },
    (msg) => setStatus(msg)
  )

  const [labInitialLift, setLabInitialLift] = useState<LiftType | undefined>(undefined)
  const [labInitialCritique, setLabInitialCritique] = useState<VideoCritiqueAnalysis | null>(null)

  // All-Time Personal Record (PR) Vault
  const exercisePrVault = useMemo(() => {
    return computeExercisePrVault(setLogs || [])
  }, [setLogs])

  // Instant In-Gym Offline Plan & Telemetry Persistence
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (plan && plan.id) {
        localStorage.setItem('gaa_cached_active_plan_v1', JSON.stringify(plan))
      }
      if (localSetLogs && localSetLogs.length > 0) {
        localStorage.setItem('gaa_cached_set_logs_v1', JSON.stringify(localSetLogs.slice(0, 120)))
      }
    } catch {}
  }, [plan, localSetLogs])

  const [plateCalculatorTargetLbs, setPlateCalculatorTargetLbs] = useState<number | null>(null)
  const [openFormGuides, setOpenFormGuides] = useState<Record<string, boolean>>({})
  const [openAdvancedMetrics, setOpenAdvancedMetrics] = useState<Record<string, boolean>>({})
  const [activeExerciseToolTabs, setActiveExerciseToolTabs] = useState<Record<string, 'form' | 'warmup' | 'science' | 'telemetry' | null>>({})

  const getWorkoutDayCompletion = useCallback((day: number) => {
    const res = resolveWorkoutDayCompletion({
      day,
      planWorkouts,
      workoutLogs: planCompletedLogs.length > 0 ? planCompletedLogs : localWorkoutLogs,
      currentWeek: microcycleProgress.currentWeek,
      sessionsPerWeek,
      planId: plan?.id,
    })
    return res.completedLog
  }, [planWorkouts, planCompletedLogs, localWorkoutLogs, microcycleProgress.currentWeek, sessionsPerWeek, plan?.id])

  const nextUnfinishedDay = useMemo(() => {
    return resolveNextUnfinishedWorkoutDay(
      planWorkouts,
      planCompletedLogs.length > 0 ? planCompletedLogs : localWorkoutLogs,
      plan?.id,
      sessionsPerWeek
    )
  }, [planWorkouts, planCompletedLogs, localWorkoutLogs, plan?.id, sessionsPerWeek])

  const effectiveActiveWorkoutDay = activeWorkoutDay ?? nextUnfinishedDay

  const effectiveOpenExerciseKey = useMemo(() => {
    if (expandedExerciseKey !== null) {
      return expandedExerciseKey === 'none' ? null : expandedExerciseKey
    }
    const currentDay = effectiveActiveWorkoutDay
    const workout = planWorkouts.find(w => w.day === currentDay) ?? planWorkouts[0]
    if (workout && workout.exercises && workout.exercises.length > 0) {
      const firstUnfinished = workout.exercises.find(ex => {
        const setsLogged = (activeSetLogs || []).filter(l =>
          normalizeExerciseName(l.exercise_name) === normalizeExerciseName(ex.name) &&
          extractWorkoutDayTag(l.notes) === workout.day &&
          (workout.scheduledDate ? l.session_date === workout.scheduledDate : true) &&
          !l.is_warmup
        ).length
        const targetSets = parseInt(String(ex.sets).trim(), 10) || 3
        return setsLogged < targetSets
      }) ?? workout.exercises[0]
      return `${workout.day}-${firstUnfinished.name}`
    }
    return null
  }, [expandedExerciseKey, effectiveActiveWorkoutDay, planWorkouts, activeSetLogs])

  const planCalendarEntries = useMemo(() => {
    const explicitCalendar = plan?.plan_json?.calendar ?? []

    if (explicitCalendar.length > 0) {
      return explicitCalendar
        .filter(item => item.scheduledDate)
        .map(item => ({
          date: String(item.scheduledDate),
          title: `Day ${item.day}: ${item.focus}`,
          subtitle: `${item.exerciseCount} exercise${item.exerciseCount === 1 ? '' : 's'} • ${item.durationMins} mins`,
          workoutDay: item.day,
        }))
    }

    return planWorkouts
      .filter(workout => workout.scheduledDate)
      .map(workout => ({
        date: String(workout.scheduledDate),
        title: `Day ${workout.day}: ${workout.focus}`,
        subtitle: `${workout.exercises.length} exercise${workout.exercises.length === 1 ? '' : 's'}`,
        workoutDay: workout.day,
      }))
  }, [plan, planWorkouts])

  // Synchronize active hub and lab tool whenever searchParams or initialWorkspace changes
  useEffect(() => {
    const wsParam = searchParams.get('workspace') as FitnessWorkspace | null
    const currentWs = wsParam || initialWorkspace
    if (currentWs) {
      const resolved = resolveInitialHubState(currentWs)
      setPrimaryHub(resolved.hub)
      setActiveLabTool(resolved.labTool)
      setWorkspace(currentWs)
    }
  }, [searchParams, initialWorkspace])

  // Launch Cardio Studio if navigated via #cardio-studio hash anchor
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#cardio-studio') {
      setActiveCardioPlayerSession({
        patternId: 'zone2_aerobic_engine',
        durationMins: 20,
        modality: 'Treadmill Incline Walk',
      })
    }
  }, [searchParams])

  useEffect(() => {
    if (units === initialUnits) return

    let cancelled = false

    async function persistUnits() {
      const res = await fetch('/api/fitness/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredUnits: units }),
      })

      if (!res.ok && !cancelled) {
        setStatus('Could not save your units preference.')
      }
    }

    void persistUnits()
    return () => {
      cancelled = true
    }
  }, [units, initialUnits])

  const handleHubChange = useCallback((nextHub: PrimaryFitnessHub) => {
    setPrimaryHub(nextHub)
    setWorkspace(nextHub as FitnessWorkspace)

    const params = new URLSearchParams(searchParams.toString())
    if (nextHub === 'train') {
      params.delete('workspace')
    } else {
      params.set('workspace', nextHub)
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const handleLabToolChange = useCallback((tool: FitnessLabTool) => {
    setActiveLabTool(tool)
    setPrimaryHub('lab')
    setWorkspace('lab')

    const params = new URLSearchParams(searchParams.toString())
    params.set('workspace', tool)

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const handleWorkspaceChange = useCallback((nextWorkspace: FitnessWorkspace) => {
    const resolved = resolveInitialHubState(nextWorkspace)
    setPrimaryHub(resolved.hub)
    setActiveLabTool(resolved.labTool)
    setWorkspace(nextWorkspace)

    const params = new URLSearchParams(searchParams.toString())
    if (nextWorkspace === 'train') {
      params.delete('workspace')
    } else {
      params.set('workspace', nextWorkspace)
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const jumpToWorkoutDay = useCallback((day: number) => {
    setActiveWorkoutDay(day)
    setExpandedExerciseKey(null)
    setTimeout(() => {
      const anchor = document.getElementById('workout-days-top-anchor')
      if (anchor) {
        const topOffset = anchor.getBoundingClientRect().top + (typeof window !== 'undefined' ? window.scrollY : 0) - 12
        window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' })
      }
    }, 40)
  }, [])

  const handleCalendarEntrySelect = useCallback((entry: { workoutDay?: number }) => {
    if (!entry.workoutDay) return
    handleWorkspaceChange('train')
    jumpToWorkoutDay(entry.workoutDay)
  }, [handleWorkspaceChange, jumpToWorkoutDay])



  async function executeSetLog(workout: WorkoutDay, exercise: WorkoutExercise, draft: InlineSetDraft) {
    const key = exerciseDraftKey(workout.day, exercise.name)
    const movementCard = getNasmClinicalMovementCard(exercise.name, exercise)
    const isStrength = isStrengthExercise(exercise.name, exercise.block, exercise.reps)
    const effectiveTempo = isStrength ? (exercise.tempo || movementCard.tempo || getDefaultNasmOptTempo(plan?.nasm_opt_phase, exercise.name).tempo) : ''

    const weightValue = Number(draft.weight)
    const weightKg = Number.isFinite(weightValue) && weightValue > 0
      ? (units === 'imperial' ? weightValue * 0.45359237 : weightValue)
      : undefined

    const tempoToSave = isStrength ? ((draft.tempo || effectiveTempo || '').trim() || null) : null
    const rirToSave = isStrength && draft.rir ? Number(draft.rir) : undefined
    const rpeToSave = draft.rpe ? Number(draft.rpe) : undefined
    const parsedRestSecs = draft.restSeconds ? Number(draft.restSeconds) : parseRestSecondsFromExercise(exercise.rest, plan?.nasm_opt_phase, exercise.block)
    const baseRestSecs = parsedRestSecs > 0 ? parsedRestSecs : 60

    // Detect acute fatigue drop from previous working set
    const exLogs = localSetLogs.filter(s => s.exercise_name === exercise.name && !s.is_warmup)
    const prevReps = exLogs.length > 0 ? Number(exLogs[0].reps || 0) : 0
    const targetRepsNum = parseInt(String(exercise.reps || 8).replace(/[^0-9]/g, ''), 10) || 8
    const acuteDrop = detectAcuteFatigueDrop({
      actualReps: Number(draft.reps) || 0,
      previousSetReps: prevReps,
      plannedReps: targetRepsNum,
    })

    // Bio-Adaptive Rest Pacer calculation
    const bioPacedResult = calculateBioAdaptiveRestInterval({
      exerciseName: exercise.name,
      baseRestSeconds: baseRestSecs,
      rpe: rpeToSave,
      rir: rirToSave,
      isWarmup: draft.isWarmup,
      optPhase: plan?.nasm_opt_phase,
      hasAcuteFatigueDrop: acuteDrop.hasDrop,
      acuteFatigueDropPercent: acuteDrop.dropPercent,
    })

    const restSecsToSave = bioPacedResult.finalRestSeconds

    // Haptic pulse on set completion
    triggerHaptic('success')

    // 1. IMMEDIATELY trigger coach audio chime & speech synthesis in user gesture context!
    playCoachChime(659.25, 0.22, 'triangle')
    speakCoachVoiceCue(bioPacedResult.coachVoiceCue)

    // 2. Immediately start active rest countdown
    setActiveRestState({
      exerciseName: exercise.name,
      key,
      restSeconds: restSecsToSave,
      remainingSeconds: restSecsToSave,
      isRunning: true,
      isBioPaced: bioPacedResult.isBioPaced,
      bioPacedDelta: bioPacedResult.deltaSeconds,
      bioPacedReason: bioPacedResult.adaptationReason,
      badgeText: bioPacedResult.badgeText,
      hasAcuteFatigueDrop: acuteDrop.hasDrop,
      acuteFatigueDropPercent: acuteDrop.dropPercent,
    })
    setActiveRestTimerKey(key)

    // 3. OPTIMISTIC UI: Append set immediately (<1ms) so gym-floor flow is instantaneous
    const optimisticTempId = `temp_set_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const optimisticRecord: WorkoutSetLogRecord = {
      id: optimisticTempId,
      session_date: draft.sessionDate,
      exercise_name: exercise.name,
      set_number: Number(draft.setNumber),
      reps: Number(draft.reps),
      weight_kg: weightKg,
      rest_seconds: restSecsToSave,
      rpe: draft.rpe ? Number(draft.rpe) : undefined,
      rir: rirToSave,
      is_warmup: draft.isWarmup,
      notes: `${workoutDayTag(workout.day)} ${workoutWeekTag(microcycleProgress.currentWeek)} ${draft.notes}`.trim() || undefined,
    }

    setLocalSetLogs(prev => [optimisticRecord, ...prev])

    // Calculate PR celebration immediately
    const loggedReps = Number(draft.reps) || 0
    const loggedWeight = Number(draft.weight) || 0
    const weightLbs = units === 'imperial' ? loggedWeight : loggedWeight * 2.20462

    if (loggedReps > 0 && weightLbs > 0 && !draft.isWarmup) {
      const oneRm = calculate1Rm(weightLbs, loggedReps)
      const prevLogs = (allSetLogsByExercise.get(normalizeExerciseName(exercise.name)) ?? [])
      const prevMax1Rm = prevLogs.reduce((max, log) => {
        const w = (log.weight_kg ?? 0) * 2.20462
        const r = log.reps ?? 0
        const calc = calculate1Rm(w, r)
        return Math.max(max, calc.average1RmLbs)
      }, 0)

      const diff = prevMax1Rm > 0 ? Math.round(oneRm.average1RmLbs - prevMax1Rm) : 0
      
      // Trigger visual PR celebration modal
      // Telemetry & PR records are archived to client history & dossier without disruptive popups
      if (oneRm.average1RmLbs > prevMax1Rm && prevMax1Rm > 0) {
        setStatus(`NEW 1RM PERSONAL RECORD for ${exercise.name}: ${units === 'imperial' ? `${oneRm.average1RmLbs} lbs` : `${oneRm.average1RmKg} kg`} (+${diff} lbs)!`)
      } else {
        setStatus(`✓ Logged ${exercise.name} (${loggedReps} reps @ ${loggedWeight} ${units === 'imperial' ? 'lb' : 'kg'} · Est. 1RM: ${units === 'imperial' ? `${oneRm.average1RmLbs} lb` : `${oneRm.average1RmKg} kg`}).`)
      }
    }

    // Advance to next exercise if all target working sets complete
    const targetSets = parseInt(String(exercise.sets).trim(), 10) || 3
    const existingWorkingSets = (activeSetLogs || []).filter(l =>
      normalizeExerciseName(l.exercise_name) === normalizeExerciseName(exercise.name) &&
      !l.is_warmup &&
      extractWorkoutDayTag(l.notes) === workout.day &&
      (draft.sessionDate ? l.session_date === draft.sessionDate : true)
    ).length
    const totalWorkingSetsNow = draft.isWarmup ? existingWorkingSets : existingWorkingSets + 1

    if (!draft.isWarmup && totalWorkingSetsNow >= targetSets) {
      const currentExIdx = (workout.exercises || []).findIndex(e => normalizeExerciseName(e.name) === normalizeExerciseName(exercise.name))
      if (currentExIdx >= 0 && currentExIdx + 1 < workout.exercises.length) {
        const nextExercise = workout.exercises[currentExIdx + 1]
        const nextKey = `${workout.day}-${nextExercise.name}`
        setExpandedExerciseKey(nextKey)

        const nextDraftKey = exerciseDraftKey(workout.day, nextExercise.name)
        if (!inlineSetDrafts[nextDraftKey]) {
          const nextMovementCard = getNasmClinicalMovementCard(nextExercise.name, nextExercise)
          const isNextStrength = isStrengthExercise(nextExercise.name, nextExercise.block, nextExercise.reps)
          const nextTempo = isNextStrength ? (nextExercise.tempo || nextMovementCard.tempo || getDefaultNasmOptTempo(plan?.nasm_opt_phase, nextExercise.name).tempo) : ''
          setInlineSetDrafts(prev => ({
            ...prev,
            [nextDraftKey]: defaultInlineSetDraft(draft.sessionDate, nextExercise.reps, plan?.nasm_opt_phase, nextExercise.block, nextExercise.rest, nextTempo, nextExercise.name),
          }))
        }

        setTimeout(() => {
          const nextEl = document.getElementById(`exercise-item-${workout.day}-${currentExIdx + 1}`)
          if (nextEl) {
            const rect = nextEl.getBoundingClientRect()
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            const topOffset = 75
            window.scrollTo({
              top: Math.max(0, rect.top + scrollTop - topOffset),
              behavior: 'smooth',
            })
          }
        }, 100)

        setStatus(`✓ All ${targetSets} working sets completed for ${exercise.name}! Switched to ${nextExercise.name}. Rest timer running (${restSecsToSave}s)...`)
      } else {
        // Last exercise in workout completed
        setExpandedExerciseKey(null)
        setStatus(`All resistance exercises finished for Day ${workout.day}! Rest timer running (${restSecsToSave}s). Ready for Cool-Down or completion!`)
      }
    } else if (!draft.isWarmup) {
      // Advance to next working set for this exercise
      setInlineSetDrafts(prev => ({
        ...prev,
        [key]: {
          ...draft,
          setNumber: String(totalWorkingSetsNow + 1),
          notes: '',
        },
      }))
      setStatus(`✓ Set ${draft.setNumber} saved for ${exercise.name}. Rest timer running (${restSecsToSave}s). Ready for Set ${totalWorkingSetsNow + 1}.`)
    } else {
      // Warm-up set logged: preserve working set progression
      setStatus(`✓ Warm-up stage saved for ${exercise.name}. Rest timer running (${restSecsToSave}s).`)
    }

    // 3B. Real-Time All-Time PR Breakthrough Detection
    if (!draft.isWarmup && (Number(draft.reps) || 0) > 0) {
      const rawWeightInLbs = weightKg
        ? weightKg * 2.20462
        : units === 'imperial'
          ? Number(draft.weight) || 0
          : (Number(draft.weight) || 0) * 2.20462
      const weightInLbs = Math.round(rawWeightInLbs * 100) / 100

      const prCheck = detectPersonalRecord(
        {
          exerciseName: exercise.name,
          weightLbs: weightInLbs,
          reps: Number(draft.reps) || 1,
          isWarmup: draft.isWarmup,
        },
        setLogs || []
      )

      if (prCheck.isNewPr) {
        // Silently record PR to history & dossier; zero pop-up messages or gamified confetti
        triggerHaptic('success')
      }
    }

    // 4. Attempt Server Sync or Queue to Persistent Offline Storage
    setBusy(`set-log:${key}`)
    try {
      const res = await fetch('/api/workouts/log-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutPlanId: plan?.id,
          sessionDate: draft.sessionDate,
          exerciseName: exercise.name,
          setNumber: Number(draft.setNumber),
          reps: Number(draft.reps),
          weightKg,
          tempo: tempoToSave,
          restSeconds: restSecsToSave,
          rpe: Number(draft.rpe),
          rir: rirToSave,
          isWarmup: draft.isWarmup,
          notes: `${workoutDayTag(workout.day)} ${workoutWeekTag(microcycleProgress.currentWeek)} ${draft.notes}`.trim(),
        }),
      })

      const payload = await res.json()
      setBusy(null)

      if (res.ok && payload.setLog) {
        // Swap temporary optimistic record with server record
        setLocalSetLogs(prev => prev.map(l => l.id === optimisticTempId ? payload.setLog : l))
      } else {
        // Queue locally for auto-retry
        enqueueOfflineSet({
          workoutPlanId: plan?.id,
          sessionDate: draft.sessionDate,
          exerciseName: exercise.name,
          setNumber: Number(draft.setNumber),
          reps: Number(draft.reps),
          weightKg,
          tempo: tempoToSave,
          restSeconds: restSecsToSave,
          rpe: Number(draft.rpe),
          rir: rirToSave,
          isWarmup: draft.isWarmup,
          notes: `${workoutDayTag(workout.day)} ${workoutWeekTag(microcycleProgress.currentWeek)} ${draft.notes}`.trim(),
        })
        setPendingSyncCount(getPendingQueueCount())
      }
    } catch {
      setBusy(null)
      // Enqueue to offline storage
      enqueueOfflineSet({
        workoutPlanId: plan?.id,
        sessionDate: draft.sessionDate,
        exerciseName: exercise.name,
        setNumber: Number(draft.setNumber),
        reps: Number(draft.reps),
        weightKg,
        tempo: tempoToSave,
        restSeconds: restSecsToSave,
        rpe: Number(draft.rpe),
        rir: rirToSave,
        isWarmup: draft.isWarmup,
        notes: `${workoutDayTag(workout.day)} ${workoutWeekTag(microcycleProgress.currentWeek)} ${draft.notes}`.trim(),
      })
      setPendingSyncCount(getPendingQueueCount())
    }
  }

  async function handleInlineSetLog(e: React.FormEvent, workout: WorkoutDay, exercise: WorkoutExercise) {
    e.preventDefault()
    const key = exerciseDraftKey(workout.day, exercise.name)
    const initialDate = workout.scheduledDate || todayDateOnly()
    const movementCard = getNasmClinicalMovementCard(exercise.name, exercise)
    const isStrength = isStrengthExercise(exercise.name, exercise.block, exercise.reps)
    const effectiveTempo = isStrength ? (exercise.tempo || movementCard.tempo || getDefaultNasmOptTempo(plan?.nasm_opt_phase, exercise.name).tempo) : ''
    const draft = inlineSetDrafts[key] ?? defaultInlineSetDraft(initialDate, exercise.reps, plan?.nasm_opt_phase, exercise.block, exercise.rest, effectiveTempo, exercise.name)

    await executeSetLog(workout, exercise, draft)
  }

  async function handleSupersetSetLog(
    workout: WorkoutDay,
    exercise: WorkoutExercise,
    supersetDraft: SupersetDraftState & { restSeconds: number }
  ) {
    const key = exerciseDraftKey(workout.day, exercise.name)
    const isStrength = isStrengthExercise(exercise.name, exercise.block, supersetDraft.reps)
    const movementCard = getNasmClinicalMovementCard(exercise.name, exercise)
    const effectiveTempo = isStrength ? (exercise.tempo || movementCard.tempo || getDefaultNasmOptTempo(plan?.nasm_opt_phase, exercise.name).tempo) : ''

    const draft: InlineSetDraft = {
      sessionDate: workout.scheduledDate || todayDateOnly(),
      setNumber: supersetDraft.setNumber,
      reps: supersetDraft.reps,
      weight: supersetDraft.weight,
      tempo: supersetDraft.tempo || effectiveTempo,
      restSeconds: String(supersetDraft.restSeconds),
      rpe: supersetDraft.rpe,
      rir: supersetDraft.rir,
      isWarmup: supersetDraft.isWarmup,
      notes: supersetDraft.notes,
    }

    setInlineSetDrafts(prev => ({
      ...prev,
      [key]: draft,
    }))

    await executeSetLog(workout, exercise, draft)
  }

  async function handleSkipExercise(workout: WorkoutDay, exercise: WorkoutExercise, reason: string, _notes: string) {
    await fetch('/api/fitness/skip-exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_date: todayDateOnly(),
        exercise_name: exercise.name,
        workout_day: workout.day,
        reason,
      }),
    })
    setSkipModal(null)
    setStatus(`Skipped ${exercise.name}.`)
  }

  const handleTimerDone = useCallback(() => {
    setActiveRestTimerKey(null)
  }, [])

  async function handleCompleteWorkoutDay(workout: WorkoutDay, exertionRpe?: number) {
    const busyKey = `log-day:${String(workout.day)}`
    const sessionDate = workout.scheduledDate || todayDateOnly()
    const sessionTitle = `Day ${String(workout.day)}: ${workout.focus}`

    // 1. Dynamic duration and calories calculation for Apple Health (before stopping timer)
    const daySetLogs = (activeSetLogs || []).filter(set => extractWorkoutDayTag(set.notes) === workout.day)
    const totalVolumeKg = daySetLogs.reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0)
    const calculatedDuration = elapsedWorkoutSeconds > 0
      ? Math.max(1, Math.round(elapsedWorkoutSeconds / 60))
      : Math.max(15, (workout.exercises?.length || 4) * 8)
    const athleteWeight = Number(profile?.weight_kg) || 75
    const estimatedCalories = Math.max(
      120,
      Math.round(calculatedDuration * 6.5 + (totalVolumeKg * 0.04) * (athleteWeight / 75))
    )

    // 2. ALWAYS close out live telemetry session (stops timer, resets active day, clears localStorage & MediaSession)
    handleStopWorkoutSession()
    setCompleteModal(null)

    // 3. Sync to Apple Health (Native HealthKit & Backend Wearables API)
    const isCardioDay = Boolean(
      workout.focus?.toLowerCase().includes('cardio') ||
      workout.focus?.toLowerCase().includes('aerobic') ||
      (workout.exercises || []).length === 0
    )
    void syncActivityToAppleHealth({
      type: isCardioDay ? 'cardio' : 'strength',
      modality: isCardioDay ? (workout.focus || 'Cardio') : undefined,
      durationMinutes: calculatedDuration,
      calories: estimatedCalories,
      avgHeartRate: wearableTelemetry?.currentHeartRate || undefined,
      notes: `Day ${workout.day}: ${workout.focus || (isCardioDay ? 'Cardio Training' : 'Strength Training')}`,
    }).catch(err => console.warn('[AppleHealth] Sync error:', err))

    // 4. Check if already logged today
    const existing = localWorkoutLogs.find(
      row => row.session_date === sessionDate && row.session_title === sessionTitle
    )
    if (existing) {
      playCoachChime(1046.5, 0.4, 'sine')
      speakCoachVoiceCue(`Session complete! Day ${workout.day} telemetry closed and synced to Apple Health.`)
      setStatus(`✓ Telemetry session closed & Apple Health synced for Day ${workout.day} (${calculatedDuration} mins · ${estimatedCalories} kcal).`)
      return
    }

    setBusy(busyKey)
    setStatus(null)

    const res = await fetch('/api/workouts/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutPlanId: plan?.id,
        sessionDate,
        sessionTitle,
        exertionRpe: Number.isFinite(exertionRpe) ? exertionRpe : undefined,
        notes: `${workoutDayTag(workout.day)} ${workoutWeekTag(microcycleProgress.currentWeek)} Completed from current workout plan.`,
        completed: true,
      }),
    })

    const payload = await res.json()
    setBusy(null)

    if (!res.ok) {
      setStatus(payload.error ?? 'Could not save workout log')
      return
    }

    if (payload?.log) {
      const updatedLogs = [payload.log as WorkoutLogRecord, ...localWorkoutLogs]
      setLocalWorkoutLogs(updatedLogs)
      const nextDay = resolveNextUnfinishedWorkoutDay(planWorkouts, updatedLogs, plan?.id, sessionsPerWeek)
      setActiveWorkoutDay(nextDay)
    }

    playCoachChime(1046.5, 0.4, 'sine')
    speakCoachVoiceCue(`Session complete! Day ${workout.day} recorded and synced to Apple Health.`)
    setStatus(`Day ${workout.day} complete & tracked in Apple Health (${calculatedDuration} mins · ${estimatedCalories} kcal).`)
  }

  async function handleCompleteUnifiedSession(
    workout: WorkoutDay,
    cardio?: IntegratedCardioPrescription | null,
    exertionRpe?: number
  ) {
    const busyKey = `unified-log:${workout.day}`
    const sessionDate = workout.scheduledDate || todayDateOnly()
    const sessionTitle = `Day ${workout.day}: ${workout.focus || 'Unified Strength + Cardio'}`

    setBusy(busyKey)
    setStatus(null)

    const daySetLogs = (activeSetLogs || []).filter(l =>
      (workout.exercises || []).some(e => normalizeExerciseName(e.name) === normalizeExerciseName(l.exercise_name)) &&
      extractWorkoutDayTag(l.notes) === workout.day &&
      (l.session_date ? l.session_date === sessionDate : true)
    )

    const completedSets = daySetLogs.length
    const totalVolumeKg = daySetLogs.reduce((sum, log) => sum + ((log.weight_kg || 0) * (log.reps || 0)), 0)
    const totalVolumeLbs = totalVolumeKg * 2.20462

    const cardioDraft = cardioDraftsByDay[workout.day]
    const cardioPayload = cardio ? {
      stage: cardio.stage,
      modality: cardioDraft?.modality || cardio.recommendedModalities[0] || 'Cardio',
      durationMins: Number(cardioDraft?.durationMins) || cardio.durationMins || 20,
      distanceKm: cardioDraft?.distance ? (units === 'imperial' ? Number(cardioDraft.distance) * 1.60934 : Number(cardioDraft.distance)) : null,
      avgHeartRate: cardioDraft?.avgHeartRate ? Number(cardioDraft.avgHeartRate) : null,
      calories: cardioDraft?.calories ? Number(cardioDraft.calories) : null,
      perceivedEffort: cardioDraft?.perceivedEffort ? Number(cardioDraft.perceivedEffort) : 6,
    } : null

    try {
      const res = await fetch('/api/fitness/unified-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutPlanId: plan?.id,
          sessionDate,
          workoutDay: workout.day,
          sessionTitle,
          durationMinutes: Math.max(Math.round(elapsedWorkoutSeconds / 60), 30),
          strength: {
            completedSets,
            totalVolumeKg,
            totalVolumeLbs,
            exerciseCount: (workout.exercises || []).length,
            avgRpe: Number.isFinite(exertionRpe) ? exertionRpe : 7.5,
          },
          cardio: cardioPayload,
          nasmOptPhase: plan?.nasm_opt_phase || 1,
          athleteAge: Number(profile?.age) || 35,
        }),
      })

      const payload = await res.json()
      setBusy(null)

      if (!res.ok) {
        setStatus(payload.error ?? 'Could not log unified session')
        return
      }

      if (payload.workoutLog) {
        const updatedLogs = [payload.workoutLog as WorkoutLogRecord, ...localWorkoutLogs.filter(l => l.id !== payload.workoutLog.id)]
        setLocalWorkoutLogs(updatedLogs)
        const nextDay = resolveNextUnfinishedWorkoutDay(planWorkouts, updatedLogs, plan?.id, sessionsPerWeek)
        setActiveWorkoutDay(nextDay)
      }
      if (payload.cardioLog) {
        setLocalCardioLogs(prev => [payload.cardioLog as CardioLogEntry, ...prev])
      }

      playCoachChime(1046.5, 0.4, 'sine')
      speakCoachVoiceCue(`Session completed and saved to your GAA profile!`)

      const estimatedCals = cardioPayload?.calories
        ? cardioPayload.calories + Math.round(totalVolumeKg * 0.04 + 150)
        : Math.max(Math.round(totalVolumeKg * 0.05 + 180), 250)
      void syncActivityToAppleHealth({
        type: cardioPayload ? 'cardio' : 'strength',
        modality: cardioPayload ? (cardioPayload.modality || 'highIntensityIntervalTraining') : undefined,
        durationMinutes: Math.max(Math.round(elapsedWorkoutSeconds / 60), 35),
        calories: estimatedCals,
        distanceMiles: cardioPayload?.distanceKm ? cardioPayload.distanceKm * 0.621371 : undefined,
        avgHeartRate: wearableTelemetry?.currentHeartRate || undefined,
        notes: `Day ${workout.day}: Performance Session`,
      }).catch(err => console.warn('[HealthKit] Save unified workout error:', err))

      handleStopWorkoutSession()
      setStatus(`Day ${workout.day} Performance Session completed and saved!`)
    } catch {
      setBusy(null)
      setStatus('Failed to connect to unified session engine.')
    }
  }

  async function handleSaveWorkoutCardio(
    workout: WorkoutDay,
    cardio: IntegratedCardioPrescription,
    draft: InWorkoutCardioDraft
  ) {
    const busyKey = `cardio-log:${workout.day}`
    setBusy(busyKey)
    setStatus(null)

    try {
      const rawModality = (draft.modality || cardio.recommendedModalities[0] || '').toLowerCase()
      let activityType = 'treadmill'
      if (rawModality.includes('row')) activityType = 'rowing-machine'
      else if (rawModality.includes('airbike') || rawModality.includes('assault') || rawModality.includes('echo')) activityType = 'assault-bike'
      else if (rawModality.includes('bike') || rawModality.includes('cycle') || rawModality.includes('spin')) activityType = 'stationary-bike'
      else if (rawModality.includes('stair') || rawModality.includes('step')) activityType = 'stairmaster'
      else if (rawModality.includes('run') || rawModality.includes('shuttle') || rawModality.includes('sprint')) activityType = 'outdoor-running'
      else if (rawModality.includes('walk') || rawModality.includes('treadmill')) activityType = 'treadmill'
      else if (rawModality.includes('elliptical')) activityType = 'elliptical'
      else if (rawModality.includes('swim')) activityType = 'swimming'
      else if (rawModality.includes('hike')) activityType = 'hiking'
      else activityType = 'other'

      const durationMins = Number(draft.durationMins) || cardio.durationMins || 20
      const perceivedEffort = Number(draft.perceivedEffort) || (cardio.stage === 3 ? 8 : cardio.stage === 2 ? 6 : 4)
      const avgHeartRate = Number(draft.avgHeartRate) || null
      const calories = Number(draft.calories) || null

      let distanceKm: number | null = null
      if (draft.distance && Number(draft.distance) > 0) {
        const rawDist = Number(draft.distance)
        distanceKm = units === 'imperial' ? rawDist * 1.60934 : rawDist
      }

      const sessionDate = workout.scheduledDate || todayDateOnly()

      const noteParts = [
        `[Day ${workout.day} Prescribed Cardio]`,
        `${cardio.title} (Stage ${cardio.stage})`,
        `Modality: ${draft.modality}`,
        cardio.workRestRatio ? `Protocol: ${cardio.workRestRatio}` : '',
        draft.notes ? `Athlete Notes: ${draft.notes}` : '',
      ].filter(Boolean)

      const res = await fetch('/api/fitness/cardio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_date: sessionDate,
          activity_type: activityType,
          duration_mins: durationMins,
          distance_km: distanceKm,
          avg_heart_rate: avgHeartRate,
          calories: calories,
          perceived_effort: perceivedEffort,
          notes: noteParts.join(' · '),
        }),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus(payload.error ?? 'Could not save cardio log.')
        return
      }

      if (payload?.log) {
        setLocalCardioLogs(prev => [payload.log as CardioLogEntry, ...prev])
      }

      // Sync cardio activity to Apple HealthKit and Wearables API
      const distMiles = draft.distance
        ? (units === 'imperial' ? Number(draft.distance) : Number(draft.distance) * 0.621371)
        : undefined
      const effectiveHr = avgHeartRate || wearableTelemetry?.currentHeartRate || undefined

      void syncActivityToAppleHealth({
        type: 'cardio',
        modality: draft.modality || cardio.recommendedModalities[0] || 'Cardio',
        durationMinutes: durationMins,
        calories: calories || undefined,
        distanceMiles: distMiles,
        avgHeartRate: effectiveHr,
        notes: noteParts.join(' · '),
      }).catch(err => console.warn('[AppleHealth] Cardio sync notice:', err))

      const distLabel = draft.distance ? ` · ${draft.distance} ${units === 'imperial' ? 'mi' : 'km'}` : ''
      const hrLabel = draft.avgHeartRate ? ` @ ${draft.avgHeartRate} BPM` : ''
      setStatus(`✓ Logged ${durationMins}m ${draft.modality}${distLabel}${hrLabel} (Stage ${cardio.stage}) for Day ${workout.day}!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving cardio log.'
      setStatus(msg)
    } finally {
      setBusy(null)
    }
  }

  const effectiveGoal = formatGoalTitle(
    plan?.goal ||
    plan?.plan_json?.goal ||
    plan?.name ||
    profile?.fitness_goal ||
    (plan ? `Phase ${plan.nasm_opt_phase}: ${plan.phase_name}` : null)
  )

  return (
    <>
      {/* ── Athlete Metric Strip (Compact 1-Row / 3-Cell Strip for Mobile & Desktop) ── */}
      <div
        className="athlete-telemetry-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 'clamp(6px, 1.5vw, 12px)',
          marginBottom: 14,
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            border: '1px solid rgba(212,160,23,0.3)',
            background: 'linear-gradient(180deg, rgba(20,28,45,0.85) 0%, rgba(12,18,30,0.95) 100%)',
            padding: 'clamp(6px, 1.5vw, 10px) clamp(8px, 1.8vw, 14px)',
            borderRadius: 6,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ color: 'var(--gray)', fontSize: 'clamp(9px, 1.8vw, 11px)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 5 }}>
            <GaaIcon name="target" size={13} tone="gold" />
            <span>Current Goal</span>
          </div>
          <div
            title={effectiveGoal}
            style={{
              fontSize: 'clamp(12px, 2.4vw, 15px)',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: 'var(--gold-lt)',
              margin: '2px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
          >
            {effectiveGoal}
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(180deg, rgba(20,28,45,0.85) 0%, rgba(12,18,30,0.95) 100%)',
            padding: 'clamp(6px, 1.5vw, 10px) clamp(8px, 1.8vw, 14px)',
            borderRadius: 6,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ color: 'var(--gray)', fontSize: 'clamp(9px, 1.8vw, 11px)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 5 }}>
            <GaaIcon name="lightning" size={13} tone="gold" />
            <span>NASM OPT™</span>
          </div>
          <div
            title={plan ? `Phase ${plan.nasm_opt_phase}: ${plan.phase_name}` : 'Not generated'}
            style={{
              fontSize: 'clamp(12px, 2.4vw, 15px)',
              fontFamily: 'var(--font-telemetry, monospace)',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: '#FFFFFF',
              margin: '2px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
          >
            {plan ? `Phase ${plan.nasm_opt_phase} · ${plan.phase_name}` : 'Not Generated'}
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(180deg, rgba(20,28,45,0.85) 0%, rgba(12,18,30,0.95) 100%)',
            padding: 'clamp(6px, 1.5vw, 10px) clamp(8px, 1.8vw, 14px)',
            borderRadius: 6,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ color: 'var(--gray)', fontSize: 'clamp(9px, 1.8vw, 11px)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 5 }}>
            <GaaIcon name="chart" size={13} tone="emerald" />
            <span>Est. Body Fat</span>
          </div>
          <div
            style={{
              fontSize: 'clamp(13px, 2.8vw, 17px)',
              fontFamily: 'var(--font-telemetry, monospace)',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: '#34D399',
              margin: '2px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
          >
            {bodyfatState.estimated ? `~${bodyfatState.estimated}%` : 'Unknown'}
          </div>
        </div>
      </div>
      {plan?.plan_json?.nutritionTargets && (
        <section
          aria-label="Daily nutrition targets"
          style={{
            border: '1px solid rgba(212,160,23,0.35)',
            background: 'rgba(13,27,42,0.95)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
            Your Daily Nutrition Targets · from Coach Gordon
          </div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 22, fontWeight: 700, color: 'var(--white)', margin: '4px 0' }}>
            {plan.plan_json.nutritionTargets.targetCalories.toLocaleString()} kcal / day
          </div>
          <div style={{ color: 'var(--gray)', fontSize: 13 }}>
            Protein {plan.plan_json.nutritionTargets.proteinGrams}g · Carbs {plan.plan_json.nutritionTargets.carbGrams}g · Fat {plan.plan_json.nutritionTargets.fatGrams}g
          </div>
          <div style={{ color: 'var(--gray)', fontSize: 13, marginTop: 4 }}>
            Goal: {plan.plan_json.nutritionTargets.currentWeightLbs} → {plan.plan_json.nutritionTargets.targetWeightLbs} lbs (~{plan.plan_json.nutritionTargets.weeklyLossLbs} lb/week, about {plan.plan_json.nutritionTargets.estimatedWeeks} weeks)
          </div>
        </section>
      )}
      {/* ── 4 PRIMARY CLIENT HUBS NAVIGATION ── */}
      <section
        style={{
          border: '1px solid rgba(212,160,23,0.35)',
          background: 'linear-gradient(180deg, rgba(13,27,42,0.95) 0%, rgba(8,16,28,0.98) 100%)',
          borderRadius: 10,
          padding: '8px 10px',
          marginBottom: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          {[
            {
              key: 'train' as const,
              icon: 'barbell' as GaaIconName,
              label: 'Workout',
              subtitle: 'Today\'s Lifts',
              badge: plan ? `Phase ${plan.nasm_opt_phase}` : 'Active',
            },
            {
              key: 'progress' as const,
              icon: 'chart' as GaaIconName,
              label: 'Progress',
              subtitle: 'PRs & History',
              badge: `${localWorkoutLogs.length} logged`,
            },
            {
              key: 'lab' as const,
              icon: 'compass' as GaaIconName,
              label: 'Fitness Lab',
              subtitle: '3D Matrix & Tools',
              badge: '7 Tools',
            },
            {
              key: 'coach' as const,
              icon: 'clipboard' as GaaIconName,
              label: 'Coach',
              subtitle: 'Check-In & Memos',
              badge: 'Advisory',
            },
          ].map(tab => {
            const active = primaryHub === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleHubChange(tab.key)}
                className="tactile-btn touch-target"
                style={{
                  border: active ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(212,160,23,0.22) 0%, rgba(212,160,23,0.08) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  color: active ? 'var(--gold-lt)' : 'var(--white)',
                  padding: '10px 4px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderRadius: 8,
                  transition: 'all 0.15s ease',
                  boxShadow: active ? '0 0 15px rgba(212,160,23,0.2)' : 'none',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20 }}>
                  <GaaIcon name={tab.icon} tone={active ? 'gold' : 'slate'} size={18} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    letterSpacing: '0.04em',
                    fontWeight: 700,
                    fontSize: 'clamp(12px, 2.2vw, 15px)',
                    whiteSpace: 'nowrap',
                    color: active ? 'var(--gold-lt)' : '#FFFFFF',
                    lineHeight: 1.1,
                  }}
                >
                  {tab.label}
                </div>
                <div
                  style={{
                    color: active ? 'var(--gold-lt)' : 'var(--gray)',
                    fontSize: 9.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    opacity: 0.9,
                  }}
                >
                  {tab.subtitle}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {primaryHub === 'train' && (
      <>
      {(!isOnline || pendingSyncCount > 0) && (
        <div
          style={{
            background: isOnline ? 'rgba(56,189,248,0.12)' : 'rgba(245,158,11,0.15)',
            border: `1px solid ${isOnline ? 'rgba(56,189,248,0.4)' : 'rgba(245,158,11,0.4)'}`,
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isOnline ? '#BAE6FD' : '#FDE68A', fontWeight: 600 }}>
            <GaaIcon name={isOnline ? 'radio' : 'alert-triangle'} size={14} tone={isOnline ? 'cyan' : 'amber'} />
            <span>
              {!isOnline
                ? `Gym Deadzone / Offline Mode · ${pendingSyncCount} set${pendingSyncCount !== 1 ? 's' : ''} stored locally`
                : `${pendingSyncCount} offline set${pendingSyncCount !== 1 ? 's' : ''} queued for background sync...`}
            </span>
          </div>
          {isOnline && (
            <button
              type="button"
              onClick={async () => {
                const res = await flushOfflineQueue((tempId, serverRecord) => {
                  setLocalSetLogs(prev => prev.map(l => l.id === tempId ? (serverRecord as WorkoutSetLogRecord) : l))
                })
                setPendingSyncCount(getPendingQueueCount())
                if (res.synced > 0) {
                  setStatus(`✓ Synced ${res.synced} offline sets to cloud.`)
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <GaaIcon name="rotate-ccw" size={11} tone="white" />
              <span>Sync Now</span>
            </button>
          )}
        </div>
      )}
      <div className="fitness-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16, alignItems: 'start' }}>
        <section style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 'clamp(6px, 1.5vw, 18px)' }}>
          {/* Executive Plan Header & Consolidated Utilities */}
          <div
            className="fitness-section-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0, flex: '1 1 240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 19, lineHeight: 1.2, fontWeight: 700, color: '#F8FAFC' }}>
                  {plan ? (plan.name || `Phase ${plan.nasm_opt_phase}: ${plan.phase_name}`) : 'Current Workout Plan'}
                </h2>
                {plan && plan.id === (latestPlan?.id ?? allPlans[0]?.id) && (
                  <span style={{ fontSize: 9.5, background: 'rgba(52,211,153,0.15)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)', padding: '1px 6px', borderRadius: 3, fontWeight: 700, letterSpacing: '0.04em' }}>
                    Active
                  </span>
                )}
                {isWakeLockActive && (
                  <span style={{ fontSize: 9.5, color: '#34D399', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-telemetry, monospace)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 4px #34D399' }} />
                    Screen Awake
                  </span>
                )}
              </div>
              {plan && (
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--gold-lt)', fontWeight: 700 }}>{microcycleProgress.displayLabel}</span>
                  <span>·</span>
                  <span>{plan.phase_name ? `NASM OPT™ Phase ${plan.nasm_opt_phase}` : ''}</span>
                  <span>·</span>
                  <span>~{averageSessionDurationMins}m</span>
                </div>
              )}
            </div>

            {/* Lean Executive Utility Bar */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {allPlans && allPlans.length > 1 && (
                <select
                  value={plan?.id}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value)
                    setActiveWorkoutDay(null)
                  }}
                  style={{
                    background: '#04070E',
                    border: '1px solid rgba(212,175,55,0.4)',
                    color: '#D4AF37',
                    padding: '5px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'var(--font-telemetry, monospace)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    maxWidth: 150,
                  }}
                  aria-label="Switch Macrocycle Program"
                >
                  {allPlans.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      {idx === 0 ? 'Active: ' : ''}
                      {p.name ? (p.name.length > 20 ? `${p.name.slice(0, 20)}...` : p.name) : `Phase ${p.nasm_opt_phase}`}
                    </option>
                  ))}
                </select>
              )}

              {planCalendarEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(prev => !prev)}
                  className="tactile-btn"
                  style={{
                    padding: '5px 9px',
                    borderRadius: 4,
                    background: showCalendarModal ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                    border: showCalendarModal ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.15)',
                    color: showCalendarModal ? '#D4AF37' : '#F8FAFC',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="View schedule calendar"
                >
                  <GaaIcon name="calendar" size={12} tone={showCalendarModal ? 'gold' : 'white'} />
                  <span>Schedule</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPlateCalculatorTargetLbs(225)}
                className="tactile-btn"
                style={{
                  padding: '5px 9px',
                  borderRadius: 4,
                  background: 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.4)',
                  color: '#D4AF37',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Open 3D Barbell Plate Calculator"
              >
                <GaaIcon name="barbell" size={12} tone="gold" />
                <span>Plates</span>
              </button>

              <button
                type="button"
                onClick={() => openCoachGordon()}
                className="tactile-btn"
                style={{
                  padding: '5px 9px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F8FAFC',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Message Coach Gordon"
              >
                <GaaIcon name="message" size={12} tone="gold" />
                <span>Coach</span>
              </button>
            </div>
          </div>

          {planWorkouts.length > 0 && (
            <div
              id="workout-days-top-anchor"
              className="responsive-tabs-scroll"
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                paddingBottom: 4,
                maxWidth: '100%',
                width: '100%',
                minWidth: 0,
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                boxSizing: 'border-box',
                scrollMarginTop: 16,
              }}
            >
              {planWorkouts.map(workout => {
                const isActive = effectiveActiveWorkoutDay === workout.day
                const completedLog = getWorkoutDayCompletion(workout.day)
                return (
                  <button
                    key={`jump-${workout.day}`}
                    type="button"
                    onClick={() => jumpToWorkoutDay(workout.day)}
                    className="tactile-btn touch-target"
                    style={{
                      border: isActive
                        ? '1.5px solid var(--gold)'
                        : completedLog
                          ? '1px solid rgba(52,211,153,0.5)'
                          : '1px solid rgba(255,255,255,0.18)',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(212,160,23,0.28) 0%, rgba(13,27,42,0.95) 100%)'
                        : completedLog
                          ? 'rgba(52,211,153,0.14)'
                          : 'var(--navy)',
                      color: isActive
                        ? 'var(--gold-lt)'
                        : completedLog
                          ? 'var(--success)'
                          : 'var(--white)',
                      boxShadow: isActive ? '0 0 14px rgba(212,160,23,0.3)' : 'none',
                      padding: '8px 16px',
                      fontSize: 12,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'all 0.15s',
                      flexShrink: 0,
                      fontWeight: 800,
                    }}
                  >
                    {completedLog ? `✓ Day ${workout.day}` : `Day ${workout.day}`}
                  </button>
                )
              })}
            </div>
          )}

          {planWorkouts.length === 0 ? (
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(14,23,38,0.85) 0%, rgba(8,14,24,0.95) 100%)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 12,
                padding: 'clamp(20px, 4vw, 36px)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(212,160,23,0.12)',
                  border: '1.5px solid rgba(212,160,23,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GaaIcon name="shield-check" size={26} tone="gold" />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontSize: 20,
                    letterSpacing: '0.04em',
                    color: '#FFFFFF',
                    margin: '0 0 6px',
                    fontWeight: 700,
                  }}
                >
                  {!profile?.onboarding_completed_at
                    ? 'Step 1: Complete PAR-Q & Medical Intake'
                    : 'Awaiting Protocol Assignment'}
                </h3>
                <p
                  style={{
                    fontSize: 13.5,
                    color: '#CBD5E1',
                    lineHeight: 1.6,
                    maxWidth: 540,
                    margin: '0 auto',
                  }}
                >
                  {!profile?.onboarding_completed_at
                    ? 'Before Coach Scott Gordon designs your individualized training protocol, please complete your PAR-Q health questionnaire, physical measurements, and equipment clearance.'
                    : 'Your PAR-Q and intake assessment are on file. Coach Scott Gordon is preparing your periodized NASM OPT™ training macrocycle. You will be notified as soon as your protocol is deployed.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
                {!profile?.onboarding_completed_at ? (
                  <a
                    href="/dashboard/onboarding"
                    className="sgf-button sgf-button-primary"
                    style={{ textDecoration: 'none', padding: '10px 22px', fontSize: 13 }}
                  >
                    Complete PAR-Q &amp; Intake →
                  </a>
                ) : (
                  <a
                    href="/dashboard/messages"
                    className="sgf-button sgf-button-primary"
                    style={{ textDecoration: 'none', padding: '10px 22px', fontSize: 13 }}
                  >
                    Message Coach Gordon →
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleWorkspaceChange('lab')}
                  className="sgf-button"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Explore Diagnostics &amp; Tools
                </button>
              </div>
            </div>
          ) : (() => {
            const workout = planWorkouts.find(w => w.day === effectiveActiveWorkoutDay) ?? planWorkouts[0]
            if (!workout) return null

            const workoutProgress = workoutProgressByDay.get(workout.day) ?? { targetSets: 0, loggedSets: 0, totalReps: 0, totalVolumeKg: 0 }
            const completionRatio = workoutProgress.targetSets > 0
              ? Math.min(1, workoutProgress.loggedSets / workoutProgress.targetSets)
              : 0
            const completedLog = getWorkoutDayCompletion(workout.day)

            return (
              <div
                id={`workout-day-${workout.day}`}
                key={workout.day}
                className="perf-contain-card heavy-section-deferred"
                style={{
                  ...accordionWorkoutStyle,
                  maxWidth: '100%',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  scrollMarginTop: 20,
                }}
              >
                {/* ── Unified Executive Workout Day Header & Session Control ── */}
                {(() => {
                  const isSessionActive = activeWorkoutSessionDay === workout.day && (isWorkoutTimerActive || elapsedWorkoutSeconds > 0)
                  const timerDisplay = `${Math.floor(elapsedWorkoutSeconds / 60).toString().padStart(2, '0')}:${(elapsedWorkoutSeconds % 60).toString().padStart(2, '0')}`

                  return (
                    <div
                      style={{
                        padding: '11px 16px',
                        background: isSessionActive
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, #04070E 100%)'
                          : 'linear-gradient(180deg, #0A0F1E 0%, #04070E 100%)',
                        borderBottom: isSessionActive ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(212,175,55,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      {/* Left: Day Title, Periodization Microcycle Badge, Completion & Exercise Telemetry */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-telemetry, monospace)',
                            background: 'rgba(197,160,89,0.15)',
                            color: 'var(--gold-lt)',
                            border: '1px solid rgba(197,160,89,0.4)',
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}
                        >
                          Week {microcycleProgress.currentWeek} · Workout {workout.day}
                        </span>
                        <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 17, wordBreak: 'break-word', color: '#F8FAFC', fontWeight: 700 }}>
                          Day {workout.day}: {workout.focus}
                        </span>
                        {completedLog && (
                          <span style={{ fontSize: 10, background: 'rgba(52,211,153,0.16)', color: '#34D399', border: '1px solid rgba(52,211,153,0.35)', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>
                            ✓ Done
                          </span>
                        )}
                        <span style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums' }}>
                          {workout.exercises.length} ex · {Math.round(completionRatio * 100)}%
                        </span>
                      </div>

                      {/* Right: Integrated Apple Health Session Tracking Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!isSessionActive ? (
                          <button
                            type="button"
                            onClick={() => handleStartWorkoutSession(workout.day)}
                            className="tactile-btn"
                            style={{
                              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                              border: 'none',
                              color: '#04070E',
                              fontFamily: 'var(--font-telemetry, monospace)',
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: 11.5,
                              letterSpacing: '0.06em',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '6px 14px',
                              borderRadius: 5,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              boxShadow: '0 2px 10px rgba(212,175,55,0.35)',
                            }}
                          >
                            <GaaIcon name="play" size={12} tone="dark" />
                            <span>Start Session</span>
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={handlePauseResumeWorkoutSession}
                              className="tactile-btn"
                              style={{
                                background: isWorkoutTimerActive ? 'rgba(239,68,68,0.16)' : 'rgba(16,185,129,0.16)',
                                border: isWorkoutTimerActive ? '1px solid #EF4444' : '1px solid #10B981',
                                color: isWorkoutTimerActive ? '#FCA5A5' : '#6EE7B7',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '5px 9px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <GaaIcon name={isWorkoutTimerActive ? 'pause' : 'play'} size={11} tone={isWorkoutTimerActive ? 'ruby' : 'emerald'} />
                              <span>{isWorkoutTimerActive ? 'Pause' : 'Resume'}</span>
                            </button>
                            <span
                              style={{
                                fontFamily: 'var(--font-telemetry, monospace)',
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#10B981',
                                background: 'rgba(0,0,0,0.4)',
                                padding: '4px 8px',
                                borderRadius: 4,
                                border: '1px solid rgba(16,185,129,0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                              <span>{timerDisplay}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                <div style={{ padding: 'clamp(4px, 1.5vw, 16px)', maxWidth: '100%', width: '100%', minWidth: 0, boxSizing: 'border-box', overflowX: 'hidden' }}>
                  {/* ── Sticky Luxury Workout Stage Switcher Bar ── */}
                  <div
                    className="luxury-segmented-bar"
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 25,
                      marginBottom: 14,
                      backdropFilter: 'blur(16px)',
                      background: 'rgba(9, 14, 26, 0.95)',
                      border: '1px solid rgba(212,160,23,0.35)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                    }}
                  >
                    {[
                      { id: 'resistance', label: `2. Lifts (${workout.exercises.length} ex)`, icon: 'dumbbell' as GaaIconName },
                      { id: 'warmup', label: '1. Warm-Up', icon: 'flame' as GaaIconName },
                      { id: 'cardio', label: '3. Cardio', icon: 'runner' as GaaIconName },
                      { id: 'cooldown', label: '4. Cool-Down', icon: 'snowflake' as GaaIconName },
                      { id: 'all', label: 'All Steps', icon: 'eye' as GaaIconName },
                    ].map(step => {
                      const isSelected = activeStepFilter === step.id
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('tap')
                            setActiveStepFilter(step.id as 'all' | 'warmup' | 'resistance' | 'cardio' | 'cooldown')
                            if (step.id !== 'all') {
                              setCollapsedStages(prev => ({
                                ...prev,
                                [`${workout.day}-${step.id}`]: false,
                              }))
                            }
                          }}
                          className={`luxury-segment-btn ${isSelected ? 'active' : ''}`}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <GaaIcon name={step.icon} size={12} tone={isSelected ? 'dark' : 'gold'} />
                            {step.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, maxWidth: '100%', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={workoutStatBadgeStyle}>Sets: {workoutProgress.loggedSets}/{workoutProgress.targetSets || '-'}</span>
                      <span style={workoutStatBadgeStyle}>Reps: {workoutProgress.totalReps}</span>
                      <span style={workoutStatBadgeStyle}>Volume: {formatWeight(workoutProgress.totalVolumeKg, units)}</span>
                      <span style={workoutStatBadgeStyle}>Completion: {Math.round(completionRatio * 100)}%</span>
                    </div>
                    {workout.scheduledDate && (
                      <span style={{ color: 'var(--gold-lt)', fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <GaaIcon name="calendar" size={12} tone="gold" /> Scheduled: {new Date(`${workout.scheduledDate}T12:00:00Z`).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div style={{ height: 6, width: '100%', maxWidth: '100%', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', marginBottom: 14 }}>
                    <div style={{ height: '100%', width: `${Math.round(completionRatio * 100)}%`, background: 'var(--gold)' }} />
                  </div>

                  {/* ── Coach Briefing & Daily Gameplan (Compact Collapsible Strip) ── */}
                  {(() => {
                    const cardio = resolveWorkoutCardioProtocol(workout, profile, plan)
                    const durationBreakdown = calculateEstimatedWorkoutDuration({
                      workout,
                      cardio,
                      optPhase: plan?.nasm_opt_phase,
                    })
                    const warmupEstMins = durationBreakdown.warmupMins
                    const resistanceEstMins = durationBreakdown.resistanceMins
                    const cardioEstMins = durationBreakdown.cardioMins
                    const coolDownEstMins = durationBreakdown.cooldownMins
                    const totalEstSessionMins = durationBreakdown.totalDurationMins
                    const totalWorkingSets = durationBreakdown.totalWorkingSets

                    const bullets = deriveClientBriefingBullets(workout.focus, workout.notes)

                    return (
                      <details
                        style={{
                          marginBottom: 16,
                          background: 'linear-gradient(135deg, rgba(212,160,23,0.08) 0%, rgba(13,27,42,0.95) 100%)',
                          border: '1px solid rgba(212,160,23,0.3)',
                          borderRadius: 8,
                          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                          maxWidth: '100%',
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          overflow: 'hidden',
                        }}
                      >
                        <summary
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            flexWrap: 'wrap',
                            userSelect: 'none',
                            listStyle: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                            <GaaIcon name="crown" size={15} tone="gold" />
                            <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Coach Scott Gordon · Daily Briefing
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--gold-lt)', background: 'rgba(212,160,23,0.18)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 12, padding: '1px 8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <GaaIcon name="timer" size={11} tone="gold" />
                              <span>~{durationBreakdown.summaryLabel}</span>
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 600 }}>
                              · {workout.focus || `Day ${workout.day} Focus`}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--gold-lt)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                              Daily Gameplan ▾
                            </span>
                          </div>
                        </summary>

                        <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', minWidth: 0 }}>
                          {/* Audio Voice Briefing & Focus */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <GaaIcon name="target" size={14} tone="gold" />
                              <span>{workout.focus || `Day ${workout.day} Training Focus`}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('tap')
                                  openCoachGordon({
                                    athleteName: 'Athlete',
                                    goal: plan?.goal || profile?.fitness_goal || undefined,
                                    nasmOptPhase: plan?.nasm_opt_phase || 1,
                                    currentWorkoutFocus: planWorkouts.find(w => w.day === effectiveActiveWorkoutDay)?.focus || 'Daily Workout',
                                    currentExerciseName: expandedExerciseKey ? expandedExerciseKey.split('-')[1] : undefined,
                                    equipmentAccess: profile?.equipment_access || undefined,
                                    cardioEquipmentAccess: profile?.cardio_equipment_access || profile?.equipment_access || undefined,
                                    recentReadinessScore: wearableTelemetry?.cnsStressScore || 82,
                                  })
                                }}
                                className="tactile-btn"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(212,160,23,0.08) 100%)',
                                  border: '1px solid rgba(212,160,23,0.5)',
                                  color: '#FFFFFF',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  boxShadow: '0 0 10px rgba(212,160,23,0.2)',
                                }}
                              >
                                <GaaIcon name="message" size={12} tone="gold" />
                                <span>Ask Coach Gordon</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('tap')
                                  void playNeuralCoachVoiceCue(`Day ${workout.day} Daily Briefing. Focus is ${workout.focus || 'Targeted strength'}. Total estimated session time is ${totalEstSessionMins} minutes (${durationBreakdown.summaryLabel}). ${bullets.join(' ')}`)
                                }}
                                style={{
                                  background: 'rgba(212,160,23,0.15)',
                                  border: '1px solid rgba(212,160,23,0.4)',
                                  color: 'var(--gold-lt)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                              >
                                <GaaIcon name="volume" size={12} tone="gold" />
                                <span>Listen to Briefing (15s)</span>
                              </button>
                            </div>
                          </div>

                          {/* Bullet Points - Key Coaching Intent */}
                          <div style={{ marginBottom: 12, minWidth: 0 }}>
                            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.55 }}>
                              {bullets.map((bullet, bIdx) => (
                                <li key={bIdx} style={{ marginBottom: bIdx === bullets.length - 1 ? 0 : 4, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* 4-Step Duration Breakdown Grid */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))',
                              gap: 8,
                              background: 'rgba(0,0,0,0.35)',
                              padding: '8px 12px',
                              borderRadius: 6,
                              border: '1px solid rgba(255,255,255,0.06)',
                              maxWidth: '100%',
                              width: '100%',
                              minWidth: 0,
                              boxSizing: 'border-box',
                            }}
                          >
                            <div style={{ fontSize: 11, minWidth: 0 }}>
                              <div style={{ color: 'var(--gold-lt)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <GaaIcon name="flame" size={12} tone="gold" />
                                <span>1. Warmup</span>
                              </div>
                              <div style={{ color: 'var(--white)', fontWeight: 700 }}>~{warmupEstMins} mins</div>
                              <div style={{ fontSize: 10, color: 'var(--gray)' }}>SMR & mobility prep</div>
                            </div>

                            <div style={{ fontSize: 11, minWidth: 0 }}>
                              <div style={{ color: 'var(--gold-lt)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <GaaIcon name="barbell" size={12} tone="gold" />
                                <span>2. Lifts</span>
                              </div>
                              <div style={{ color: 'var(--white)', fontWeight: 700 }}>~{resistanceEstMins} mins</div>
                              <div style={{ fontSize: 10, color: 'var(--gray)' }}>
                                {durationBreakdown.totalExercises} exercises · {totalWorkingSets} sets · ~{Math.round(durationBreakdown.totalRestSeconds / 60)}m rest
                              </div>
                            </div>

                            <div style={{ fontSize: 11, minWidth: 0 }}>
                              <div style={{ color: cardio ? '#38BDF8' : 'var(--gray)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <GaaIcon name="heart-rate" size={12} tone="cyan" />
                                <span>3. Cardio</span>
                              </div>
                              <div style={{ color: 'var(--white)', fontWeight: 700 }}>{cardio ? `~${cardioEstMins} mins` : 'Optional / Off'}</div>
                              <div style={{ fontSize: 10, color: 'var(--gray)' }}>{cardio ? `Stage ${cardio.stage}` : 'Rest day'}</div>
                            </div>

                            <div style={{ fontSize: 11, minWidth: 0 }}>
                              <div style={{ color: '#93C5FD', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <GaaIcon name="sleep" size={12} tone="purple" />
                                <span>4. Cool-Down</span>
                              </div>
                              <div style={{ color: 'var(--white)', fontWeight: 700 }}>~{coolDownEstMins} mins</div>
                              <div style={{ fontSize: 10, color: 'var(--gray)' }}>Stretch & breathing</div>
                            </div>
                          </div>
                        </div>
                      </details>
                    )
                  })()}



                  {/* ── Executive Workout Layout (Full Width, No Right Bars) ── */}
                  <div style={{ minWidth: 0, maxWidth: '100%', width: '100%', overflowX: 'hidden' }}>
                      {/* Active Orthopedic Protection Shield (Sports Injuries & Biomechanical Limitations) */}
                      {clientInjuries.length > 0 && (
                        <div
                          style={{
                            marginBottom: 16,
                            background: 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(13,22,41,0.95) 100%)',
                            border: '1px solid rgba(212,160,23,0.4)',
                            borderRadius: 8,
                            padding: '12px 16px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <GaaIcon name="shield-check" size={16} tone="gold" />
                              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)' }}>
                                Orthopedic Protection Shield Active
                              </span>
                              <span style={{ fontSize: 10, background: 'rgba(212,160,23,0.2)', color: 'var(--gold)', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                                {clientInjuries.length} {clientInjuries.length === 1 ? 'Condition Guarded' : 'Conditions Guarded'}
                              </span>
                            </div>
                            <span style={{ fontSize: 10.5, color: 'var(--gray)' }}>
                              Contraindicated patterns filtered · Safe regressions loaded
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {clientInjuries.map(key => {
                              const inj = COMMON_SPORTS_INJURIES[key]
                              if (!inj) return null
                              return (
                                <span
                                  key={key}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: 11,
                                    padding: '3px 8px',
                                    background: 'rgba(0,0,0,0.45)',
                                    border: '1px solid rgba(212,160,23,0.25)',
                                    borderRadius: 4,
                                    color: '#FFFFFF',
                                  }}
                                >
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                                  <strong>{inj.name}</strong>
                                  <span style={{ color: 'var(--gray)', fontSize: 9.5 }}>({inj.region.replace('_', ' ')})</span>
                                </span>
                              )
                            })}
                          </div>

                          <div style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.4 }}>
                            Warmup SMR and activation drills have been adapted for your joint profile. If any movement causes joint strain, tap <strong style={{ color: 'var(--gold-lt)' }}>Swap for Joint Relief</strong> to substitute with an NASM biomechanically safe regression.
                          </div>
                        </div>
                      )}

                      {/* Step 1: Pre-Lift Kinetic Warmup */}
                      {(activeStepFilter === 'all' || activeStepFilter === 'warmup') && (
                        <ClinicalKineticWarmupModule
                          key={`warmup-${plan?.id || 'p'}-w${microcycleProgress.currentWeek}-d${workout.day}-${workout.scheduledDate || todayDateOnly()}`}
                          planId={plan?.id}
                          workoutWeek={microcycleProgress.currentWeek}
                          sessionDate={workout.scheduledDate || todayDateOnly()}
                          workoutDay={workout.day}
                          workoutFocus={workout.focus}
                          notes={workout.notes}
                          latestAssessment={latestAssessment ?? null}
                          isCollapsed={isStageCollapsed(workout.day, 'warmup')}
                          onToggleCollapse={() => toggleStage(workout.day, 'warmup')}
                          onOpenExerciseModal={(exercise) => setActiveVideoExercise(exercise)}
                          onWarmupCompleted={(day) => {
                            setStatus(`✓ Day ${day} Pre-Lift Mobility Warmup Completed! Ready for resistance sets.`)
                            setCollapsedStages(prev => ({
                              ...prev,
                              [`${day}-warmup`]: true,
                              [`${day}-resistance`]: false,
                            }))
                          }}
                        />
                      )}

                      {/* Step 2: Resistance Training */}
                      {(activeStepFilter === 'all' || activeStepFilter === 'resistance') && (
                        <div
                          style={{
                            marginBottom: 20,
                            border: '1px solid rgba(212,160,23,0.35)',
                            background: 'linear-gradient(135deg, rgba(212,160,23,0.06) 0%, rgba(10,16,28,0.95) 100%)',
                            borderRadius: 8,
                            padding: 'clamp(6px, 1.8vw, 16px)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 10,
                              borderBottom: isStageCollapsed(workout.day, 'resistance') ? 'none' : '1px solid rgba(255,255,255,0.1)',
                              paddingBottom: isStageCollapsed(workout.day, 'resistance') ? 0 : 10,
                              marginBottom: isStageCollapsed(workout.day, 'resistance') ? 0 : 14,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, background: 'rgba(212,160,23,0.15)', color: 'var(--gold)', fontWeight: 800, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <GaaIcon name="dumbbell" size={13} tone="gold" />
                                <span>STEP 2: RESISTANCE TRAINING</span>
                              </span>
                              <span style={{ color: 'var(--white)', fontSize: 14, fontWeight: 700 }}>
                                Working Sets ({workout.exercises.length} Exercises)
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => toggleStage(workout.day, 'resistance')}
                                className="tactile-btn"
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.18)',
                                  color: 'var(--gold-lt)',
                                  borderRadius: 5,
                                  padding: '6px 12px',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                              >
                                {isStageCollapsed(workout.day, 'resistance') ? '▼ Expand Working Sets' : '▲ Collapse'}
                              </button>
                            </div>
                          </div>

                          {!isStageCollapsed(workout.day, 'resistance') && (
                            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                    {(() => {
                      const OPT_SECTION_ORDER = ['warm-up','activation','skill-development','resistance','clients-choice','cool-down']
                      const OPT_SECTION_LABELS: Record<string, string> = {
                        'warm-up': 'WARM-UP',
                        'activation': 'ACTIVATION (core & balance)',
                        'skill-development': 'SKILL DEVELOPMENT (plyometric & SAQ)',
                        'resistance': 'RESISTANCE TRAINING',
                        'clients-choice': "CLIENT'S CHOICE",
                        'cool-down': 'COOL-DOWN',
                      }

                      const currentExercises: WorkoutExercise[] = adaptedExercisesByDay[workout.day]
                        ? adaptedExercisesByDay[workout.day].map(ae => ({
                            name: ae.name,
                            sets: String(ae.sets),
                            reps: ae.reps,
                            tempo: ae.tempo ?? null,
                            rest: null,
                            notes: ae.coachingCue ?? null,
                            description: null,
                            primaryEquipment: null,
                            imageUrl: null,
                            videoUrl: null,
                            block: 'resistance',
                          }))
                        : workout.exercises

                      const hasSections = currentExercises.some(ex => ex.block && OPT_SECTION_ORDER.includes(ex.block))
                      const seenSections = new Set<string>()
                      return (
                        <>
                          {/* ── In-Workout Exercise Quick Jump Rail (Horizontal Scrollable Rail) ── */}
                          {currentExercises.length > 1 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                                <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gray)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <GaaIcon name="lightning" size={11} tone="gold" />
                                  <span>Exercise Quick-Jump Rail</span>
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {(() => {
                                    const phaseRules = getNasmOptPhaseFeatureRules(plan?.nasm_opt_phase)
                                    if (!phaseRules.isSupersetOffered) {
                                      return (
                                        <div
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: 4,
                                            padding: '3px 8px',
                                            color: 'var(--gray)',
                                            fontSize: 9.5,
                                            fontWeight: 700,
                                          }}
                                          title={phaseRules.supersetTooltip}
                                        >
                                          <GaaIcon name="lightning" size={10} tone="slate" />
                                          <span>{phaseRules.supersetBadgeLabel}</span>
                                        </div>
                                      )
                                    }

                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          triggerHaptic('tap')
                                          toggleSupersets()
                                        }}
                                        className="tactile-btn"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 5,
                                          background: enableSupersets ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                                          border: `1px solid ${enableSupersets ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                                          borderRadius: 4,
                                          padding: '3px 8px',
                                          color: enableSupersets ? '#38BDF8' : 'var(--gray)',
                                          fontSize: 10,
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                        }}
                                        title={phaseRules.supersetTooltip}
                                      >
                                        <GaaIcon name="lightning" size={10} tone={enableSupersets ? 'cyan' : 'slate'} />
                                        <span>Supersets: {enableSupersets ? 'ON' : 'OFF'}</span>
                                        <span style={{ fontSize: 8.5, opacity: 0.8, background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: 3 }}>
                                          {phaseRules.supersetBadgeLabel}
                                        </span>
                                      </button>
                                    )
                                  })()}
                                  <span style={{ fontSize: 9.5, color: 'var(--gold-lt)', fontWeight: 600 }}>
                                    Tap to focus
                                  </span>
                                </div>
                              </div>
                              <div className="in-workout-jump-rail">
                                {currentExercises.map((jumpEx, jumpIdx) => {
                                  const isFutureWorkout = workout.scheduledDate ? workout.scheduledDate > todayDateOnly() : false
                                  const jumpLogged = isFutureWorkout ? 0 : (setLogsByExercise.get(normalizeExerciseName(jumpEx.name)) ?? [])
                                    .filter(row => extractWorkoutDayTag(row.notes) === workout.day && !row.is_warmup).length
                                  const jumpTarget = parseSetTarget(jumpEx.sets) || 3
                                  const jumpIsDone = jumpLogged >= jumpTarget
                                  const jumpItemKey = `${workout.day}-${jumpEx.name}`
                                  const jumpIsActive = effectiveOpenExerciseKey === jumpItemKey

                                  return (
                                    <button
                                      key={`jump-${jumpIdx}-${jumpEx.name}`}
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic('tap')
                                        setExpandedExerciseKey(jumpItemKey)
                                        const el = document.getElementById(`exercise-item-${workout.day}-${jumpIdx}`)
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                                        }
                                      }}
                                      className={`jump-pill-btn ${jumpIsDone ? 'completed' : jumpIsActive ? 'active' : ''}`}
                                      title={`${jumpEx.name} (${jumpLogged}/${jumpTarget} sets)`}
                                    >
                                      <span>{jumpIsDone ? '✓' : `${jumpIdx + 1}.`}</span>
                                      <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {jumpEx.name}
                                      </span>
                                      <span style={{ opacity: 0.7, fontSize: 9.5 }}>
                                        ({jumpLogged}/{jumpTarget})
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {(() => {
                            const groupedEntries: GroupedExerciseEntry[] = groupWorkoutExercises(currentExercises)

                            return groupedEntries.map((entry, entryIdx) => {
                              if (entry.isSuperset) {
                                const pair = entry.pair
                                const logsA = (setLogsByExercise.get(normalizeExerciseName(pair.exerciseA.name)) ?? [])
                                  .filter(row => extractWorkoutDayTag(row.notes) === workout.day)
                                const logsB = (setLogsByExercise.get(normalizeExerciseName(pair.exerciseB.name)) ?? [])
                                  .filter(row => extractWorkoutDayTag(row.notes) === workout.day)

                                const sectionHeaderA = hasSections && pair.exerciseA.block && OPT_SECTION_ORDER.includes(pair.exerciseA.block) && !seenSections.has(pair.exerciseA.block)
                                  ? (() => { seenSections.add(pair.exerciseA.block!); return (
                                    <div key={`sh-${pair.exerciseA.block}`} style={{
                                      margin: entryIdx === 0 ? '0 0 6px' : '16px 0 6px',
                                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                                      fontSize: 13,
                                      letterSpacing: '0.1em',
                                      fontWeight: 700,
                                      color: 'var(--gold)',
                                    }}>{OPT_SECTION_LABELS[pair.exerciseA.block!] ?? pair.exerciseA.block!.toUpperCase()}</div>
                                  ) })()
                                  : null

                                return (
                                  <li
                                    key={pair.id}
                                    id={`exercise-item-${workout.day}-${pair.indexA ?? entryIdx}`}
                                    style={{ marginBottom: 16, listStyle: 'none', maxWidth: '100%', minWidth: 0 }}
                                  >
                                    {sectionHeaderA}
                                    {typeof pair.indexB === 'number' && (
                                      <div id={`exercise-item-${workout.day}-${pair.indexB}`} style={{ display: 'none' }} />
                                    )}
                                    <SupersetPairCard
                                      pair={pair}
                                      sessionDate={workout.scheduledDate || todayDateOnly()}
                                      units={units}
                                      setLogsA={logsA}
                                      setLogsB={logsB}
                                      nasmOptPhase={plan?.nasm_opt_phase}
                                      onLogSet={(exToLog, draft) => {
                                        handleSupersetSetLog(workout, exToLog as WorkoutExercise, draft)
                                      }}
                                      onOpenPlateCalculator={weightLbs => setPlateCalculatorTargetLbs(weightLbs)}
                                      onOpenVideoModal={exName => {
                                        const exObj = currentExercises.find(e => normalizeExerciseName(e.name) === normalizeExerciseName(exName))
                                        setActiveVideoExercise({
                                          name: exName,
                                          videoUrl: exObj?.videoUrl || null,
                                          description: exObj?.description || null,
                                          primaryEquipment: exObj?.primaryEquipment || null,
                                        })
                                      }}
                                      triggerHaptic={triggerHaptic}
                                    />
                                  </li>
                                )
                              }

                              const ex = entry.exercise as WorkoutExercise
                              const exIdx = entry.originalIndex
                              const exerciseKey = exerciseDraftKey(workout.day, ex.name)
                        const movementCard = getNasmClinicalMovementCard(ex.name, ex)
                        const isStretch = isTimedStaticStretch(ex.name, ex.block, ex.reps)
                        const isFoam = isFoamRollerExercise(ex.name)
                        const isTimed = isStretch || isFoam
                        const isStrength = isStrengthExercise(ex.name, ex.block, ex.reps)
                        const isBand = isBandExercise(ex.name, equipmentBadges(ex.primaryEquipment, ex.name, ex.description))

                        const effectiveTempo = isStrength ? (ex.tempo || movementCard.tempo || getDefaultNasmOptTempo(plan?.nasm_opt_phase, ex.name).tempo) : ''
                        const draft = inlineSetDrafts[exerciseKey] ?? defaultInlineSetDraft(workout.scheduledDate || todayDateOnly(), ex.reps, plan?.nasm_opt_phase, ex.block, ex.rest, effectiveTempo, ex.name)
                        const isFutureWorkout = workout.scheduledDate ? workout.scheduledDate > todayDateOnly() : false
                        const exerciseRecentLogs = isFutureWorkout ? [] : (setLogsByExercise.get(normalizeExerciseName(ex.name)) ?? [])
                          .filter(row => extractWorkoutDayTag(row.notes) === workout.day)
                          .slice(0, 3)
                        const exLoggedSets = isFutureWorkout ? 0 : (setLogsByExercise.get(normalizeExerciseName(ex.name)) ?? [])
                          .filter(row => extractWorkoutDayTag(row.notes) === workout.day && !row.is_warmup).length
                        const exTargetSets = parseSetTarget(ex.sets)

                        const sectionHeader = hasSections && ex.block && OPT_SECTION_ORDER.includes(ex.block) && !seenSections.has(ex.block)
                          ? (() => { seenSections.add(ex.block!); return (
                            <div key={`sh-${ex.block}`} style={{
                              margin: exIdx === 0 ? '0 0 6px' : '16px 0 6px',
                              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                              fontSize: 13,
                              letterSpacing: '0.1em',
                              fontWeight: 700,
                              color: 'var(--gold)',
                            }}>{OPT_SECTION_LABELS[ex.block!] ?? ex.block!.toUpperCase()}</div>
                          ) })()
                          : null

                        const exItemKey = `${workout.day}-${ex.name}`
                        const isExpanded = effectiveOpenExerciseKey === exItemKey

                        return (
                          <li
                            key={exItemKey}
                            id={`exercise-item-${workout.day}-${exIdx}`}
                            style={{ marginBottom: 12, listStyle: 'none', maxWidth: '100%', minWidth: 0 }}
                          >
                            {sectionHeader}
                        <details
                          name={`workout-exercise-group-day-${workout.day}`}
                          className="perf-contain-card"
                          style={accordionExerciseStyle}
                          open={isExpanded}
                        >
                          <summary
                            style={accordionExerciseSummaryStyle}
                            onClick={(e) => {
                              e.preventDefault()
                              setExpandedExerciseKey(prev => {
                                const currentEffective = prev !== null ? (prev === 'none' ? null : prev) : effectiveOpenExerciseKey
                                const willOpen = currentEffective !== exItemKey
                                if (willOpen) {
                                  setTimeout(() => {
                                    const el = document.getElementById(`exercise-item-${workout.day}-${exIdx}`)
                                    if (el) {
                                      const rect = el.getBoundingClientRect()
                                      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
                                      const topOffset = 75
                                      window.scrollTo({
                                        top: Math.max(0, rect.top + scrollTop - topOffset),
                                        behavior: 'smooth',
                                      })
                                    }
                                  }, 60)
                                  return exItemKey
                                }
                                return 'none'
                              })
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                              {/* Visual Media Thumbnail (GAA Movement Photography) */}
                              {(() => {
                                const gaaImage = resolveGaaExerciseImage(ex.name, false)
                                const thumbUrl = gaaImage || movementCard.imageUrl || movementCard.fallbackImageUrl || '/images/exercises/image-not-available.jpg'
                                const isDone = exLoggedSets >= exTargetSets && exTargetSets > 0
                                return (
                                  <div
                                    aria-hidden="true"
                                    style={{
                                      position: 'relative',
                                      width: 44,
                                      height: 44,
                                      borderRadius: 6,
                                      overflow: 'hidden',
                                      flexShrink: 0,
                                      backgroundColor: '#070B14',
                                      border: isDone ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(212,160,23,0.3)',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                    }}
                                  >
                                    <img
                                      src={thumbUrl}
                                      alt={ex.name}
                                      width={44}
                                      height={44}
                                      loading="lazy"
                                      decoding="async"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = '/images/exercises/image-not-available.jpg'
                                      }}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                        display: 'block',
                                      }}
                                    />
                                  </div>
                                )
                              })()}

                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ color: 'var(--white)', fontWeight: 700, fontSize: 14 }}>
                                    {ex.name}
                                  </span>
                                  {isStrength && (
                                    <ExercisePrBadge
                                      personalRecord={exercisePrVault.get(normalizeExerciseNameKey(ex.name))}
                                      units={units}
                                      triggerHaptic={triggerHaptic}
                                    />
                                  )}
                                  {!isExerciseAppropriateForInjuries(ex, `${profile?.injuries_limitations || ''} ${intake?.surgeries_or_injuries || ''}`) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setSwapModalExercise({ workoutDay: workout.day, exercise: ex, initialDiscomfort: primaryDiscomfortArea })
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.45)',
                                        borderRadius: 4,
                                        padding: '2px 7px',
                                        color: '#FCA5A5',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                      title="Contraindicated for your joint profile. Click to substitute."
                                    >
                                      <GaaIcon name="shield-alert" size={11} tone="ruby" />
                                      <span>Joint Strain Risk · Tap to Swap</span>
                                    </button>
                                  )}
                                </div>
                                <div style={{ color: exLoggedSets >= exTargetSets && exTargetSets > 0 ? 'var(--gold)' : 'var(--gray)', fontSize: 12, marginTop: 2 }}>
                                  {formatExerciseTargetDisplay(ex)}
                                  {exTargetSets > 0 && (
                                    <span style={{ marginLeft: 8, padding: '1px 7px', border: `1px solid ${exLoggedSets >= exTargetSets ? 'rgba(212,160,23,0.5)' : 'rgba(255,255,255,0.15)'}`, background: exLoggedSets >= exTargetSets ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.05)', color: exLoggedSets >= exTargetSets ? 'var(--gold)' : 'var(--gray)', borderRadius: 2 }}>
                                      {exLoggedSets}/{exTargetSets} sets
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </summary>
                          {(isExpanded || activeRestTimerKey === exerciseKey) && (
                          <div style={{ padding: '6px 4px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <form onSubmit={event => handleInlineSetLog(event, workout, ex)} style={{ border: '1px solid rgba(255,255,255,0.08)', padding: '8px 8px', background: 'rgba(13,27,42,0.55)', borderRadius: 6, marginTop: 0 }}>
                          {/* ── 16:9 Movement Demonstration Banner (Tap for 1:1 Video & NASM Form Guide) ── */}
                          {(() => {
                            const gaaImage = resolveGaaExerciseImage(ex.name, false)
                            const heroImg = gaaImage || movementCard.imageUrl || movementCard.fallbackImageUrl || '/images/exercises/image-not-available.jpg'
                            const hasVideo = Boolean(movementCard.embedUrl || movementCard.videoUrl)
                            return (
                              <div
                                onClick={() => setActiveVideoExercise(ex)}
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  aspectRatio: '16 / 9',
                                  maxHeight: 'clamp(160px, 28vh, 240px)',
                                  borderRadius: 6,
                                  overflow: 'hidden',
                                  backgroundColor: '#070B14',
                                  border: '1px solid rgba(212,160,23,0.35)',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                                  marginBottom: 10,
                                }}
                                title={`View NASM Clinical Form & Demonstration for ${ex.name}`}
                              >
                                <img
                                  src={heroImg}
                                  alt={ex.name}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/images/exercises/image-not-available.jpg'
                                  }}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    display: 'block',
                                  }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 8,
                                    left: 8,
                                    right: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'rgba(8,14,20,0.85)',
                                    backdropFilter: 'blur(6px)',
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    border: '1px solid rgba(212,160,23,0.3)',
                                  }}
                                >
                                  <span style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                    <GaaIcon name="video-studio" size={12} tone="gold" />
                                    <span>NASM Clinical Form {hasVideo ? '· 1:1 Video' : ''}</span>
                                  </span>
                                  <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Tap to inspect ↗
                                  </span>
                                </div>
                              </div>
                            )
                          })()}

                          {/* ── Visual Set Progression Matrix (Set 1, Set 2, Set 3, + Add Set) ── */}
                            <SetProgressionMatrix
                              targetSets={ex.sets}
                              sessionDate={draft.sessionDate}
                              currentSetNumber={Number(draft.setNumber) || 1}
                              loggedSets={setLogsByExercise.get(normalizeExerciseName(ex.name)) ?? []}
                              units={units}
                              onSelectSet={(setNumber, prefillWeight, prefillReps) => {
                                setInlineSetDrafts(prev => ({
                                  ...prev,
                                  [exerciseKey]: {
                                    ...draft,
                                    setNumber: String(setNumber),
                                    weight: prefillWeight !== undefined ? prefillWeight : (draft.weight || '95'),
                                    reps: prefillReps !== undefined ? prefillReps : draft.reps,
                                  },
                                }))
                              }}
                              onAddSet={(nextSetNumber) => {
                                setInlineSetDrafts(prev => ({
                                  ...prev,
                                  [exerciseKey]: {
                                    ...draft,
                                    setNumber: String(nextSetNumber),
                                  },
                                }))
                              }}
                              triggerHaptic={triggerHaptic}
                            />

                            {/* 1-Tap Match Set Prefill (Matches Set 1/N logged today if available, or falls back to last session) */}
                            {(() => {
                              const allExLogs = allSetLogsByExercise.get(normalizeExerciseName(ex.name)) ?? []
                              const targetSessionDate = draft.sessionDate || todayDateOnly()
                              const todayLoggedSets = allExLogs.filter(row =>
                                row.session_date === targetSessionDate ||
                                (!row.session_date && extractWorkoutDayTag(row.notes) === workout.day)
                              )
                              const pastSessionLogs = allExLogs.filter(row =>
                                row.session_date && row.session_date !== targetSessionDate &&
                                extractWorkoutDayTag(row.notes) === workout.day
                              )

                              const hasLoggedToday = todayLoggedSets.length > 0
                              const candidateSet = hasLoggedToday
                                ? todayLoggedSets[0]
                                : (pastSessionLogs[0] || exerciseRecentLogs[0] || null)

                              if (!candidateSet) return null

                              const candidateWeight = candidateSet.weight_kg != null
                                ? (units === 'imperial' ? Math.round(candidateSet.weight_kg * 2.20462) : candidateSet.weight_kg)
                                : null

                              const candidateSetNum = candidateSet.set_number || todayLoggedSets.length

                              const buttonLabel = hasLoggedToday
                                ? (isTimed
                                    ? `Match Set ${candidateSetNum}: ${candidateSet.reps ?? draft.reps}s duration`
                                    : `Match Set ${candidateSetNum}: ${candidateWeight ?? draft.weight} ${units === 'imperial' ? 'lb' : 'kg'} × ${candidateSet.reps ?? draft.reps} reps`)
                                : (isTimed
                                    ? `Match Last Session: ${candidateSet.reps ?? draft.reps}s duration`
                                    : `Match Last Session: ${candidateWeight ?? draft.weight} ${units === 'imperial' ? 'lb' : 'kg'} × ${candidateSet.reps ?? draft.reps} reps`)

                              const recentLabel = hasLoggedToday
                                ? 'Logged this session'
                                : (candidateSet.session_date ? `Recent: ${candidateSet.session_date}` : 'Previous session')

                              return (
                                <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic('heavy')
                                      setInlineSetDrafts(prev => ({
                                        ...prev,
                                        [exerciseKey]: {
                                          ...draft,
                                          weight: isTimed ? '0' : String(candidateWeight ?? draft.weight),
                                          reps: String(candidateSet.reps ?? draft.reps),
                                          tempo: draft.tempo || '2/0/2',
                                          rpe: candidateSet.rpe ? String(candidateSet.rpe) : draft.rpe,
                                          rir: candidateSet.rir ? String(candidateSet.rir) : draft.rir,
                                        },
                                      }))
                                    }}
                                    className="tactile-btn"
                                    style={{
                                      background: hasLoggedToday ? 'rgba(52,211,153,0.14)' : 'rgba(212,160,23,0.16)',
                                      border: hasLoggedToday ? '1px solid rgba(52,211,153,0.45)' : '1px solid rgba(212,160,23,0.4)',
                                      color: hasLoggedToday ? 'var(--success, #34d399)' : 'var(--gold-lt)',
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '4px 10px',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}
                                  >
                                    <GaaIcon name="rotate-ccw" size={11} tone={hasLoggedToday ? 'emerald' : 'gold'} />
                                    <span>{buttonLabel}</span>
                                  </button>
                                  <span style={{ fontSize: 10.5, color: hasLoggedToday ? 'var(--success)' : 'var(--gray)' }}>
                                    {recentLabel}
                                  </span>
                                </div>
                              )
                            })()}

                            {/* Resistance Band Spectrum & Weight Representation Selector */}
                            {isBand && (
                              <div style={{ marginBottom: 10, background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 6, padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <GaaIcon name="sparkles" size={12} tone="gold" />
                                    <span>Band Color & Resistance Rating:</span>
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {BAND_COLOR_SPECTRUM.map(band => {
                                    const bandTargetWeight = units === 'imperial' ? band.weightLbsAvg : band.weightKgAvg
                                    const isSelected = Number(draft.weight) === bandTargetWeight || (draft.notes && draft.notes.includes(band.colorName))
                                    return (
                                      <button
                                        key={band.id}
                                        type="button"
                                        onClick={() => {
                                          triggerHaptic('tap')
                                          const noteTag = `[Band: ${band.colorName} (${units === 'imperial' ? `${band.weightLbsMin}–${band.weightLbsMax} lbs` : `${Math.round(band.weightLbsMin / 2.20462)}–${Math.round(band.weightLbsMax / 2.20462)} kg`})]`
                                          const cleanedNotes = draft.notes.replace(/\[Band:[^\]]+\]/g, '').trim()
                                          setInlineSetDrafts(prev => ({
                                            ...prev,
                                            [exerciseKey]: {
                                              ...draft,
                                              weight: String(bandTargetWeight),
                                              notes: cleanedNotes ? `${cleanedNotes} ${noteTag}` : noteTag,
                                            },
                                          }))
                                        }}
                                        className="tactile-btn"
                                        style={{
                                          background: isSelected ? 'rgba(212,160,23,0.3)' : 'rgba(255,255,255,0.06)',
                                          border: isSelected ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
                                          color: isSelected ? 'var(--gold-lt)' : '#E2E8F0',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          padding: '5px 10px',
                                          borderRadius: 4,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 5,
                                        }}
                                        title={`${band.colorName}: ${band.weightLbsMin}-${band.weightLbsMax} lbs (${band.recommendedFor})`}
                                      >
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: band.colorHex, display: 'inline-block' }} />
                                        <span>{band.colorName} (~{bandTargetWeight}{units === 'imperial' ? 'lb' : 'kg'})</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Primary Set Logging: Reps / Duration & Weight / Load */}
                            <div className="fitness-set-input-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                              {/* Left Input: Duration (for Timed Stretch/Foam Roll) or Reps Completed */}
                              {isTimed ? (
                                <div>
                                  <label style={setFieldLabelStyle}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <GaaIcon name="watch" size={11} tone="gold" />
                                      <span>{isStretch ? 'Hold Duration (sec)' : 'SMR / Roll Duration (sec)'}</span>
                                    </span>
                                  </label>
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic('tap')
                                        const cur = Number(draft.reps) || 30
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, reps: String(Math.max(5, cur - 5)) } }))
                                      }}
                                      style={stepperButtonStyle}
                                      aria-label="Decrease duration"
                                    >
                                      −5s
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      autoComplete="off"
                                      onFocus={selectOnFocus}
                                      value={draft.reps}
                                      onChange={event => {
                                        const value = sanitizeNumericInput(event.target.value)
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, reps: value } }))
                                      }}
                                      style={{ ...inputStyle, textAlign: 'center' }}
                                      placeholder="30"
                                      required
                                      aria-label="Duration in seconds"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic('tap')
                                        const cur = Number(draft.reps) || 30
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, reps: String(cur + 5) } }))
                                      }}
                                      style={stepperButtonStyle}
                                      aria-label="Increase duration"
                                    >
                                      +5s
                                    </button>
                                  </div>

                                  {/* Quick Duration Preset Pills */}
                                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                    {[15, 30, 45, 60].map(sec => (
                                      <button
                                        key={sec}
                                        type="button"
                                        onClick={() => {
                                          triggerHaptic('tap')
                                          setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, reps: String(sec) } }))
                                        }}
                                        style={{
                                          background: Number(draft.reps) === sec ? 'rgba(212,160,23,0.3)' : 'rgba(255,255,255,0.06)',
                                          border: Number(draft.reps) === sec ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
                                          color: Number(draft.reps) === sec ? 'var(--gold-lt)' : 'var(--gray)',
                                          fontSize: 10,
                                          fontWeight: 700,
                                          padding: '2px 7px',
                                          borderRadius: 3,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {sec}s
                                      </button>
                                    ))}
                                  </div>

                                  {/* 1-Tap Real-Time Countdown Timer Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const duration = Number(draft.reps) || 30
                                      if (activeHoldTimer?.exerciseKey === exerciseKey && activeHoldTimer.isRunning) {
                                        setActiveHoldTimer(prev => prev ? { ...prev, isRunning: false } : null)
                                      } else {
                                        triggerHaptic('heavy')
                                        playCountdownPip(duration)
                                        speakCoachVoiceCue(`Starting ${duration} second ${isStretch ? 'stretch hold' : 'foam roll'}.`)
                                        setActiveHoldTimer({
                                          exerciseKey,
                                          exerciseName: ex.name,
                                          targetSeconds: duration,
                                          remainingSeconds: duration,
                                          isRunning: true,
                                          type: isStretch ? 'stretch' : 'foam',
                                        })
                                      }
                                    }}
                                    className="tactile-btn"
                                    style={{
                                      marginTop: 6,
                                      background: activeHoldTimer?.exerciseKey === exerciseKey && activeHoldTimer.isRunning
                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                        : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.3) 100%)',
                                      border: activeHoldTimer?.exerciseKey === exerciseKey && activeHoldTimer.isRunning
                                        ? '1px solid #EF4444'
                                        : '1px solid rgba(16,185,129,0.5)',
                                      color: activeHoldTimer?.exerciseKey === exerciseKey && activeHoldTimer.isRunning ? '#FFFFFF' : '#34D399',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      padding: '5px 10px',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6,
                                      width: '100%',
                                    }}
                                  >
                                    <GaaIcon name="watch" size={12} tone="emerald" />
                                    <span>
                                      {activeHoldTimer?.exerciseKey === exerciseKey && activeHoldTimer.isRunning
                                        ? `Stop Hold (${activeHoldTimer.remainingSeconds}s left)`
                                        : `Start ${draft.reps || 30}s Countdown Timer`}
                                    </span>
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <label style={setFieldLabelStyle}>Reps Completed</label>
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic('tap')
                                        const cur = Number(draft.reps) || 8
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, reps: String(Math.max(1, cur - 1)) } }))
                                      }}
                                      style={stepperButtonStyle}
                                      aria-label="Decrease reps"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      autoComplete="off"
                                      onFocus={selectOnFocus}
                                      value={draft.reps}
                                      onChange={event => {
                                        const value = sanitizeNumericInput(event.target.value)
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, reps: value } }))
                                      }}
                                      style={{ ...inputStyle, textAlign: 'center' }}
                                      placeholder="8"
                                      required
                                      aria-label="Number of reps"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic('tap')
                                        const cur = Number(draft.reps) || 8
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, reps: String(cur + 1) } }))
                                      }}
                                      style={stepperButtonStyle}
                                      aria-label="Increase reps"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Right Input: Intensity/Bodyweight for Timed, or Weight Used for Lifts */}
                              {isTimed ? (
                                <div>
                                  <label style={setFieldLabelStyle}>Intensity / Load</label>
                                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '10px 12px', minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                      <GaaIcon name={isStretch ? 'stretch' : 'rotate-ccw'} size={12} tone="gold" />
                                      <span>{isStretch ? 'Static Hold (Bodyweight)' : 'SMR Pressure (Bodyweight)'}</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>
                                      {isStretch ? 'Maintain static stretch without bouncing' : 'Hold continuous pressure on tender trigger points'}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={setFieldLabelStyle}>
                                      Weight Used ({units === 'imperial' ? 'lb' : 'kg'}){isBand ? ' · Band Equiv.' : ''}
                                    </label>
                                  </div>
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic('tap')
                                        const step = units === 'imperial' ? 5 : 2.5
                                        const cur = Number(draft.weight) || 0
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, weight: String(Math.max(0, cur - step)) } }))
                                      }}
                                      style={stepperButtonStyle}
                                      aria-label="Decrease weight"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      autoComplete="off"
                                      onFocus={selectOnFocus}
                                      value={draft.weight}
                                      onChange={event => {
                                        const value = sanitizeNumericInput(event.target.value)
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, weight: value } }))
                                      }}
                                      style={{ ...inputStyle, textAlign: 'center' }}
                                      placeholder={isBand ? (units === 'imperial' ? '20' : '9') : (units === 'imperial' ? '95' : '42.5')}
                                      aria-label={`Weight in ${units === 'imperial' ? 'pounds' : 'kilograms'}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic('tap')
                                        const step = units === 'imperial' ? 5 : 2.5
                                        const cur = Number(draft.weight) || 0
                                        setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, weight: String(cur + step) } }))
                                      }}
                                      style={stepperButtonStyle}
                                      aria-label="Increase weight"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* ── Plate Loading & Weight Adjustment Presets Strip ── */}
                                  <PlateAdjustmentPresets
                                    exerciseName={ex.name}
                                    currentWeight={draft.weight}
                                    units={units}
                                    isTimed={isTimed}
                                    isBand={isBand}
                                    onChangeWeight={(newWeight) => {
                                      setInlineSetDrafts(prev => ({
                                        ...prev,
                                        [exerciseKey]: { ...draft, weight: newWeight },
                                      }))
                                    }}
                                    onOpenPlateCalculator={(weightLbs) => setPlateCalculatorTargetLbs(weightLbs)}
                                    triggerHaptic={triggerHaptic}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Primary Gold Quick Log Set Button */}
                            <button
                              type="submit"
                              disabled={busy === `set-log:${exerciseKey}`}
                              className="tactile-btn"
                              style={{
                                ...buttonStyle,
                                marginTop: 10,
                                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                                border: '1px solid #D4AF37',
                                color: '#0A0E18',
                                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                                textTransform: 'uppercase',
                                fontSize: 13,
                                letterSpacing: '0.08em',
                                fontWeight: 700,
                                padding: '10px 16px',
                                borderRadius: 6,
                                boxShadow: '0 4px 14px rgba(212,160,23,0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                width: '100%',
                              }}
                            >
                              <GaaIcon name="check" size={14} tone="dark" />
                              <span>
                                {busy === `set-log:${exerciseKey}`
                                  ? 'Saving Set...'
                                  : isTimed
                                    ? `Log Set ${draft.setNumber || '1'} (${draft.reps || '30'}s hold) & Rest (${draft.restSeconds || '30'}s)`
                                    : isBand
                                      ? `Log Set ${draft.setNumber || '1'} (${draft.weight || '0'} ${units === 'imperial' ? 'lb' : 'kg'} Band × ${draft.reps || '8'} reps) & Rest (${draft.restSeconds || '60'}s)`
                                      : `Log Set ${draft.setNumber || '1'} (${draft.weight || '0'} ${units === 'imperial' ? 'lb' : 'kg'} × ${draft.reps || '8'} reps) & Rest (${draft.restSeconds || '60'}s)`
                                }
                              </span>
                            </button>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                              {activeRestTimerKey === exerciseKey && (
                                <RestTimer
                                  defaultSeconds={draft.restSeconds ? Number(draft.restSeconds) : (parseInt(String(ex.rest || '60').replace(/\D/g, ''), 10) || 60)}
                                  autoStart={true}
                                  onDone={handleTimerDone}
                                />
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setSwapModalExercise({ workoutDay: workout.day, exercise: ex, initialDiscomfort: primaryDiscomfortArea })}
                                  style={{
                                    fontSize: 11.5,
                                    background: 'rgba(212,160,23,0.12)',
                                    border: '1px solid rgba(212,160,23,0.35)',
                                    color: 'var(--gold-lt)',
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontFamily: 'Raleway, sans-serif',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontWeight: 700,
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Substitute this movement with an NASM safe regression for joint relief or equipment constraints"
                                >
                                  <GaaIcon name="shield-check" size={12} tone="gold" />
                                  <span>Swap for Joint Relief</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSkipModal({ workoutDay: workout.day, exercise: ex })}
                                  style={{ fontSize: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--gray)', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Raleway, sans-serif' }}
                                >
                                  Skip Exercise
                                </button>
                              </div>
                            </div>

                            {/* ── Unified 4-Tool Strip: [ Form ] [ Warmup ] [ Science ] [ Telemetry ] ── */}
                            {(() => {
                              const activeTool = activeExerciseToolTabs[exerciseKey] ?? (openFormGuides[exerciseKey] ? 'form' : openAdvancedMetrics[exerciseKey] ? 'telemetry' : null)

                              const toggleTool = (tab: 'form' | 'warmup' | 'science' | 'telemetry') => {
                                triggerHaptic('tap')
                                const next = activeTool === tab ? null : tab
                                setActiveExerciseToolTabs(prev => ({ ...prev, [exerciseKey]: next }))
                                setOpenFormGuides(prev => ({ ...prev, [exerciseKey]: next === 'form' }))
                                setOpenAdvancedMetrics(prev => ({ ...prev, [exerciseKey]: next === 'telemetry' }))
                              }

                              const badgeItems = equipmentBadges(ex.primaryEquipment, ex.name, ex.description)
                              const histLogs = (allSetLogsByExercise.get(normalizeExerciseName(ex.name)) ?? [])
                              const histMax1RmLbs = histLogs.reduce((max, log) => {
                                const w = (log.weight_kg ?? 0) * 2.20462
                                const r = log.reps ?? 0
                                if (w <= 0 || r <= 0 || log.is_warmup) return max
                                const calc = calculate1Rm(w, r)
                                return Math.max(max, calc.average1RmLbs)
                              }, 0)

                              const activeExLogs = (setLogsByExercise.get(normalizeExerciseName(ex.name)) ?? [])
                              const exerciseLogs = activeExLogs
                                .filter(s => !s.session_date || s.session_date === draft.sessionDate)
                                .map((s, idx) => ({
                                  setNumber: typeof s.set_number === 'number' ? s.set_number : idx + 1,
                                  weightLbs: (s.weight_kg ?? 0) * 2.20462,
                                  weightKg: s.weight_kg ?? undefined,
                                  reps: Number(s.reps) || 0,
                                  rpe: s.rpe,
                                  rir: s.rir,
                                  isWarmup: s.is_warmup,
                                }))

                              const allSessionLogsFormatted = activeSetLogs
                                .filter(s => !s.session_date || s.session_date === draft.sessionDate)
                                .map((s, idx) => ({
                                  setNumber: typeof s.set_number === 'number' ? s.set_number : idx + 1,
                                  weightLbs: (s.weight_kg ?? 0) * 2.20462,
                                  weightKg: s.weight_kg ?? undefined,
                                  reps: Number(s.reps) || 0,
                                  rpe: s.rpe,
                                  rir: s.rir,
                                  isWarmup: s.is_warmup,
                                }))

                              return (
                                <div style={{ marginTop: 8 }}>
                                  {/* Segmented 4-Tool Bar */}
                                  <div
                                    data-testid="unified-exercise-tool-strip"
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(4, 1fr)',
                                      gap: 4,
                                      background: 'rgba(7, 11, 20, 0.75)',
                                      padding: 3,
                                      borderRadius: 6,
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      data-testid="toggle-form-guide-btn"
                                      aria-expanded={activeTool === 'form'}
                                      onClick={() => toggleTool('form')}
                                      style={{
                                        padding: '5px 2px',
                                        background: activeTool === 'form' ? 'rgba(212,160,23,0.22)' : 'transparent',
                                        border: activeTool === 'form' ? '1px solid var(--gold)' : '1px solid transparent',
                                        color: activeTool === 'form' ? 'var(--gold-lt)' : 'var(--gray)',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 3,
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <GaaIcon name="book" size={11} tone={activeTool === 'form' ? 'gold' : 'slate'} />
                                      <span>Form</span>
                                    </button>

                                    <button
                                      type="button"
                                      data-testid="toggle-warmup-tools-btn"
                                      aria-expanded={activeTool === 'warmup'}
                                      onClick={() => toggleTool('warmup')}
                                      style={{
                                        padding: '5px 2px',
                                        background: activeTool === 'warmup' ? 'rgba(212,160,23,0.22)' : 'transparent',
                                        border: activeTool === 'warmup' ? '1px solid var(--gold)' : '1px solid transparent',
                                        color: activeTool === 'warmup' ? 'var(--gold-lt)' : 'var(--gray)',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 3,
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <GaaIcon name="sparkles" size={11} tone={activeTool === 'warmup' ? 'gold' : 'slate'} />
                                      <span>Warmup</span>
                                    </button>

                                    <button
                                      type="button"
                                      data-testid="toggle-science-tools-btn"
                                      aria-expanded={activeTool === 'science'}
                                      onClick={() => toggleTool('science')}
                                      style={{
                                        padding: '5px 2px',
                                        background: activeTool === 'science' ? 'rgba(212,160,23,0.22)' : 'transparent',
                                        border: activeTool === 'science' ? '1px solid var(--gold)' : '1px solid transparent',
                                        color: activeTool === 'science' ? 'var(--gold-lt)' : 'var(--gray)',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 3,
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <GaaIcon name="award" size={11} tone={activeTool === 'science' ? 'gold' : 'slate'} />
                                      <span>Science</span>
                                    </button>

                                    <button
                                      type="button"
                                      data-testid="toggle-advanced-telemetry-btn"
                                      aria-expanded={activeTool === 'telemetry'}
                                      onClick={() => toggleTool('telemetry')}
                                      style={{
                                        padding: '5px 2px',
                                        background: activeTool === 'telemetry' ? 'rgba(212,160,23,0.22)' : 'transparent',
                                        border: activeTool === 'telemetry' ? '1px solid var(--gold)' : '1px solid transparent',
                                        color: activeTool === 'telemetry' ? 'var(--gold-lt)' : 'var(--gray)',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 3,
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <GaaIcon name="settings" size={11} tone={activeTool === 'telemetry' ? 'gold' : 'slate'} />
                                      <span>Telemetry</span>
                                    </button>
                                  </div>

                                  {/* Tool 1: Form & Video Guide Panel */}
                                  {activeTool === 'form' && (
                                    <div
                                      data-testid="form-guide-container"
                                      style={{
                                        marginTop: 8,
                                        borderRadius: 6,
                                        background: 'rgba(212,160,23,0.06)',
                                        border: '1px solid rgba(212,160,23,0.25)',
                                        padding: 10,
                                        display: 'grid',
                                        gap: 8,
                                      }}
                                    >
                                      {/* Visual Movement Demonstration Banner */}
                                      {(() => {
                                        const gaaImage = resolveGaaExerciseImage(ex.name, false)
                                        const heroImg = gaaImage || movementCard.imageUrl || movementCard.fallbackImageUrl || '/images/exercises/image-not-available.jpg'
                                        const hasVideo = Boolean(movementCard.embedUrl || movementCard.videoUrl)
                                        return (
                                          <div
                                            onClick={() => setActiveVideoExercise(ex)}
                                            style={{
                                              position: 'relative',
                                              width: '100%',
                                              aspectRatio: '16 / 9',
                                              maxHeight: 'clamp(180px, 32vh, 260px)',
                                              borderRadius: 6,
                                              overflow: 'hidden',
                                              backgroundColor: '#070B14',
                                              border: '1px solid rgba(212,160,23,0.35)',
                                              cursor: 'pointer',
                                              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                                            }}
                                            title={`View NASM Clinical Form & Demonstration for ${ex.name}`}
                                          >
                                            <img
                                              src={heroImg}
                                              alt={ex.name}
                                              loading="lazy"
                                              decoding="async"
                                              onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = '/images/exercises/image-not-available.jpg'
                                              }}
                                              style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center',
                                                display: 'block',
                                              }}
                                            />
                                            <div
                                              style={{
                                                position: 'absolute',
                                                bottom: 8,
                                                right: 8,
                                                background: 'rgba(0,0,0,0.85)',
                                                border: '1px solid rgba(212,160,23,0.55)',
                                                color: 'var(--gold-lt)',
                                                borderRadius: 5,
                                                padding: '4px 8px',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 5,
                                                backdropFilter: 'blur(4px)',
                                              }}
                                            >
                                              <GaaIcon name={hasVideo ? "play" : "book"} size={11} tone="gold" />
                                              <span>{hasVideo ? "Watch Video" : "Form Standards"}</span>
                                            </div>
                                            <div
                                              style={{
                                                position: 'absolute',
                                                top: 8,
                                                left: 8,
                                                background: 'rgba(7,11,20,0.85)',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                color: '#E2E8F0',
                                                borderRadius: 4,
                                                padding: '3px 8px',
                                                fontSize: 10,
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                              }}
                                            >
                                              {movementCard.category} · {movementCard.optPhase.split('·')[0].trim()}
                                            </div>
                                          </div>
                                        )
                                      })()}

                                      {/* Numbered Step-by-Step Technique Instructions */}
                                      <div
                                        style={{
                                          background: 'rgba(0,0,0,0.35)',
                                          borderLeft: '2px solid var(--gold)',
                                          borderRadius: '0 4px 4px 0',
                                          padding: '8px 10px',
                                          fontSize: 11.5,
                                          lineHeight: 1.45,
                                          color: '#E2E8F0',
                                        }}
                                      >
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>
                                          How to perform this exercise:
                                        </div>
                                        <div style={{ display: 'grid', gap: 3 }}>
                                          {movementCard.howToSteps.map((stepText, stIdx) => (
                                            <div key={stIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                                              <span style={{ color: 'var(--gold-lt)', fontWeight: 800, flexShrink: 0 }}>{stIdx + 1}.</span>
                                              <span>{stepText.replace(/^\d+\.\s*/, '')}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Badges and Video Button */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                          {badgeItems.map(item => (
                                            <span
                                              key={item}
                                              style={{
                                                border: '1px solid rgba(212,160,23,0.22)',
                                                background: 'rgba(212,160,23,0.12)',
                                                color: 'var(--gold)',
                                                padding: '2px 6px',
                                                fontSize: 9.5,
                                                fontWeight: 600,
                                                letterSpacing: '0.04em',
                                                textTransform: 'uppercase',
                                                borderRadius: 3,
                                              }}
                                            >
                                              {item}
                                            </span>
                                          ))}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => setActiveVideoExercise(ex)}
                                          className="tactile-btn"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            background: 'rgba(212,160,23,0.15)',
                                            border: '1px solid rgba(212,160,23,0.4)',
                                            color: 'var(--gold-lt)',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          <GaaIcon name="book" size={11} tone="gold" />
                                          <span>NASM Video & Form ↗</span>
                                        </button>
                                      </div>

                                      {ex.notes && (
                                        <div style={{ fontSize: 11.5, color: 'var(--gold-lt)', background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.2)', padding: '5px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                          <GaaIcon name="sparkles" size={11} tone="gold" />
                                          <div>
                                            <strong>Coach Form Cue:</strong> {ex.notes}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Tool 2: Warmup & Intensity Protocols Panel */}
                                  {activeTool === 'warmup' && (
                                    <div
                                      data-testid="warmup-tools-container"
                                      style={{
                                        marginTop: 8,
                                        borderRadius: 6,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        padding: 8,
                                        display: 'grid',
                                        gap: 8,
                                      }}
                                    >
                                      <WarmUpRampDrawer
                                        exerciseKey={exerciseKey}
                                        exerciseName={ex.name}
                                        draftWeight={draft.weight}
                                        oneRmLbs={histMax1RmLbs > 0 ? histMax1RmLbs : undefined}
                                        units={units}
                                        isTimed={isTimed}
                                        isBand={isBand}
                                        isOpen={Boolean(openWarmupRamps[`ramp-${exerciseKey}`])}
                                        onToggle={() =>
                                          setOpenWarmupRamps(prev => ({
                                            ...prev,
                                            [`ramp-${exerciseKey}`]: !prev[`ramp-${exerciseKey}`],
                                          }))
                                        }
                                        prescribedReps={ex.reps}
                                        onPopulateWorkingWeight={(workingWeight, targetReps) => {
                                          triggerHaptic('success')
                                          const finalReps = targetReps || parsePrescribedWorkingReps(ex.reps)
                                          const popResult = calculateWorkingSetPrePopulateLoad({
                                            exerciseName: ex.name,
                                            targetWorkingWeightLbs: units === 'imperial' ? Number(workingWeight) : Number(workingWeight) * 2.20462,
                                            units,
                                            completedStageNumber: 4,
                                            totalStages: 4,
                                            prescribedReps: ex.reps,
                                          })

                                          setInlineSetDrafts(prev => ({
                                            ...prev,
                                            [exerciseKey]: {
                                              ...draft,
                                              weight: workingWeight,
                                              reps: finalReps,
                                              setNumber: '1',
                                              isWarmup: false,
                                              notes: '',
                                            },
                                          }))

                                          playCoachChime(783.99, 0.25, 'triangle')
                                          speakCoachVoiceCue(popResult.coachVoiceCue)
                                          setStatus(popResult.bannerNotice)
                                        }}
                                        onLogWarmupStage={(stageWeight, reps, restSeconds, stageNumber, totalStages, stageTitle) => {
                                          const stageTag = totalStages && stageTitle
                                            ? `[WarmUp ${stageNumber}/${totalStages}: ${stageTitle}]`
                                            : `[Warm-up Ramp Stage ${stageNumber}]`
                                          const isFinalStage = Boolean(totalStages && stageNumber >= totalStages)

                                          setInlineSetDrafts(prev => ({
                                            ...prev,
                                            [exerciseKey]: {
                                              ...draft,
                                              weight: stageWeight,
                                              reps: String(reps),
                                              restSeconds: String(restSeconds),
                                              isWarmup: true,
                                              notes: stageTag,
                                            },
                                          }))

                                          setTimeout(() => {
                                            const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
                                            handleInlineSetLog(syntheticEvent, workout, ex)

                                            if (isFinalStage && totalStages) {
                                              setTimeout(() => {
                                                const popResult = calculateWorkingSetPrePopulateLoad({
                                                  exerciseName: ex.name,
                                                  targetWorkingWeightLbs: (Number(draft.weight) || 135) * (units === 'imperial' ? 1 : 2.20462),
                                                  units,
                                                  completedStageNumber: totalStages,
                                                  totalStages,
                                                  prescribedReps: ex.reps,
                                                })
                                                setInlineSetDrafts(prev => ({
                                                  ...prev,
                                                  [exerciseKey]: {
                                                    ...draft,
                                                    weight: popResult.workingWeight,
                                                    reps: popResult.workingReps,
                                                    setNumber: '1',
                                                    isWarmup: false,
                                                    notes: '',
                                                  },
                                                }))
                                                speakCoachVoiceCue(popResult.coachVoiceCue)
                                              }, 350)
                                            }
                                          }, 50)
                                        }}
                                        triggerHaptic={triggerHaptic}
                                      />

                                      {!isTimed && isStrength && isIntensityProtocolOfferedForPhase(plan?.nasm_opt_phase) && (
                                        <IntensityProtocolDrawer
                                          exerciseName={ex.name}
                                          currentWeight={draft.weight}
                                          currentReps={draft.reps}
                                          units={units}
                                          isTimed={isTimed}
                                          nasmOptPhase={plan?.nasm_opt_phase}
                                          onLogIntensitySet={protocolData => {
                                            const primaryWeight = units === 'imperial'
                                              ? String(protocolData.initialWeightLbs)
                                              : String(Math.round((protocolData.initialWeightLbs / 2.20462) * 10) / 10)
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: {
                                                ...draft,
                                                weight: primaryWeight,
                                                reps: String(protocolData.totalReps),
                                                notes: protocolData.notes || '',
                                              },
                                            }))
                                            setTimeout(() => {
                                              const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
                                              handleInlineSetLog(syntheticEvent, workout, ex)
                                            }, 50)
                                          }}
                                          triggerHaptic={triggerHaptic}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Tool 3: Sports Science & Autoregulation Panel */}
                                  {activeTool === 'science' && (
                                    <div
                                      data-testid="science-tools-container"
                                      style={{
                                        marginTop: 8,
                                        borderRadius: 6,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        padding: 8,
                                        display: 'grid',
                                        gap: 8,
                                      }}
                                    >
                                      {!isTimed && (
                                        <DynamicLoadPrescriptionPill
                                          exerciseName={ex.name}
                                          nasmOptPhase={plan?.nasm_opt_phase}
                                          targetRepsText={ex.reps}
                                          historicalSets={histLogs.map(l => ({
                                            weightKg: l.weight_kg,
                                            weightLbs: l.weight_kg ? l.weight_kg * 2.20462 : undefined,
                                            reps: Number(l.reps) || 0,
                                            rpe: l.rpe ? Number(l.rpe) : undefined,
                                            sessionDate: l.session_date,
                                            isWarmup: l.is_warmup,
                                          }))}
                                          dailyReadinessScore={liveReadinessScore}
                                          acwrRatio={acwrTelemetry.acwrRatio}
                                          preferredUnits={units}
                                          onApplyRecommendation={load => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: {
                                                ...draft,
                                                weight: load.weight,
                                                reps: load.reps,
                                                rpe: load.rpe,
                                                rir: load.rir,
                                                tempo: load.tempo,
                                              },
                                            }))
                                          }}
                                        />
                                      )}

                                      {!isTimed && (
                                        <VolumeOverloadMiniHud
                                          exerciseName={ex.name}
                                          targetRepsText={ex.reps}
                                          currentSessionDate={draft.sessionDate}
                                          allExerciseLogs={histLogs}
                                          preferredUnits={units}
                                          isTimed={isTimed}
                                          triggerHaptic={triggerHaptic}
                                        />
                                      )}

                                      {!isTimed && (
                                        <AutoregulationDeloadAdvisor
                                          exerciseName={ex.name}
                                          currentDraftWeight={draft.weight}
                                          currentDraftReps={draft.reps}
                                          targetReps={ex.reps}
                                          completedSets={exerciseLogs}
                                          allSessionSets={allSessionLogsFormatted}
                                          units={units}
                                          isTimed={isTimed}
                                          sessionDurationMinutes={Math.max(5, Math.floor(elapsedWorkoutSeconds / 60))}
                                          onApplyDeloadWeight={newWeight => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: {
                                                ...draft,
                                                weight: newWeight,
                                              },
                                            }))
                                          }}
                                          onApplyRepCap={newReps => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: {
                                                ...draft,
                                                reps: newReps,
                                              },
                                            }))
                                          }}
                                          onOpenDropSet={stages => {
                                            if (!stages?.length) return
                                            const stageDesc = stages
                                              .map(s => {
                                                const weightDisplay = units === 'imperial' ? `${s.weightLbs}lbs` : `${Math.round(s.weightLbs / 2.20462)}kg`
                                                return `${weightDisplay} (${s.reps} reps)`
                                              })
                                              .join(' ➔ ')
                                            const firstWeight = units === 'imperial' ? String(stages[0].weightLbs) : String(Math.round(stages[0].weightLbs / 2.20462))
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: {
                                                ...draft,
                                                weight: firstWeight,
                                                notes: draft.notes ? `${draft.notes} | Drop-Set: ${stageDesc}` : `Drop-Set: ${stageDesc}`,
                                              },
                                            }))
                                          }}
                                          onApplyClusterSet={clusterPlan => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: {
                                                ...draft,
                                                reps: String(clusterPlan.repsPerCluster),
                                                notes: draft.notes ? `${draft.notes} | ${clusterPlan.notesTag}` : clusterPlan.notesTag,
                                              },
                                            }))
                                          }}
                                          onApplyMyoReps={myoPlan => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: {
                                                ...draft,
                                                reps: String(myoPlan.activationReps),
                                                notes: draft.notes ? `${draft.notes} | ${myoPlan.notesTag}` : myoPlan.notesTag,
                                              },
                                            }))
                                          }}
                                          onExtendRestTimer={additionalSecs => {
                                            setActiveRestState(prev =>
                                              prev
                                                ? {
                                                    ...prev,
                                                    remainingSeconds: prev.remainingSeconds + additionalSecs,
                                                    restSeconds: prev.restSeconds + additionalSecs,
                                                  }
                                                : null
                                            )
                                          }}
                                          triggerHaptic={triggerHaptic}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Tool 4: Advanced Telemetry Panel */}
                                  {activeTool === 'telemetry' && (
                                    <div
                                      data-testid="advanced-telemetry-container"
                                      style={{
                                        marginTop: 8,
                                        borderRadius: 6,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        padding: 10,
                                        display: 'grid',
                                        gap: 8,
                                      }}
                                    >
                                      {/* Workout Date & Set Number Override */}
                                      <div className="fitness-set-input-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div>
                                          <label style={setFieldLabelStyle}>Workout Date</label>
                                          <input
                                            type="date"
                                            value={draft.sessionDate}
                                            onChange={event => {
                                              const value = event.target.value
                                              setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, sessionDate: value } }))
                                            }}
                                            style={inputStyle}
                                            required
                                            aria-label="Session date"
                                          />
                                        </div>
                                        <div>
                                          <label style={setFieldLabelStyle}>Set Number</label>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            onFocus={selectOnFocus}
                                            value={draft.setNumber}
                                            onChange={event => {
                                              const value = sanitizeNumericInput(event.target.value)
                                              setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, setNumber: value } }))
                                            }}
                                            style={inputStyle}
                                            placeholder="1"
                                            aria-label="Set number"
                                          />
                                        </div>
                                      </div>

                                      {/* Secondary fields: Tempo, Rest, RPE, RIR, Warm-up */}
                                      <div className="fitness-set-input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: 8 }}>
                                        {isStrength && (
                                          <div>
                                            <label style={setFieldLabelStyle}>Tempo</label>
                                            <input
                                              type="text"
                                              value={draft.tempo || ''}
                                              onChange={event => {
                                                const value = event.target.value
                                                setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, tempo: value } }))
                                              }}
                                              style={inputStyle}
                                              placeholder="2/0/2"
                                              aria-label="Movement tempo (e.g. 4/2/1 or 2/0/2)"
                                            />
                                          </div>
                                        )}
                                        <div>
                                          <label style={setFieldLabelStyle}>Rest (sec)</label>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            onFocus={selectOnFocus}
                                            value={draft.restSeconds}
                                            onChange={event => {
                                              const value = sanitizeNumericInput(event.target.value)
                                              setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, restSeconds: value } }))
                                            }}
                                            style={inputStyle}
                                            placeholder={isTimed ? '0' : '60'}
                                            aria-label="Rest time in seconds"
                                          />
                                        </div>
                                        <div>
                                          <label style={setFieldLabelStyle}>RPE (1-10)</label>
                                          <input
                                            type="text"
                                            inputMode="decimal"
                                            autoComplete="off"
                                            onFocus={selectOnFocus}
                                            value={draft.rpe}
                                            onChange={event => {
                                              const value = sanitizeNumericInput(event.target.value)
                                              setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, rpe: value } }))
                                            }}
                                            style={inputStyle}
                                            placeholder="7"
                                            aria-label="Rate of perceived exertion (1-10)"
                                            title="Rate of Perceived Exertion (1-10)"
                                          />
                                        </div>
                                        {isStrength && (
                                          <div>
                                            <label style={setFieldLabelStyle}>RIR (0-6)</label>
                                            <input
                                              type="text"
                                              inputMode="decimal"
                                              autoComplete="off"
                                              onFocus={selectOnFocus}
                                              value={draft.rir}
                                              onChange={event => {
                                                const value = sanitizeNumericInput(event.target.value)
                                                setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, rir: value } }))
                                              }}
                                              style={inputStyle}
                                              placeholder="2"
                                              aria-label="Reps in reserve (0-6)"
                                              title="Reps in Reserve (0-6)"
                                            />
                                          </div>
                                        )}
                                        <div>
                                          <label style={setFieldLabelStyle}>Set Type</label>
                                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--gray)', fontSize: 12, border: '1px solid var(--navy-lt)', minHeight: 44, borderRadius: 2 }}>
                                            <input
                                              type="checkbox"
                                              checked={draft.isWarmup}
                                              onChange={event => {
                                                const checked = event.target.checked
                                                setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, isWarmup: checked } }))
                                              }}
                                              aria-label="Mark as warm-up set"
                                            />
                                            Warm-up
                                          </label>
                                        </div>
                                      </div>

                                      {/* Interactive RPE & RIR Exertion Selector */}
                                      {!isTimed && (
                                        <RpeRirExertionSelector
                                          exerciseName={ex.name}
                                          currentRpe={draft.rpe}
                                          currentRir={draft.rir}
                                          isStrength={isStrength}
                                          onChangeRpe={rpeVal => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: { ...draft, rpe: rpeVal },
                                            }))
                                          }}
                                          onChangeRir={rirVal => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: { ...draft, rir: rirVal },
                                            }))
                                          }}
                                          triggerHaptic={triggerHaptic}
                                        />
                                      )}

                                      {/* Interactive Rep Cadence & Tempo Metronome */}
                                      {!isTimed && isStrength && (
                                        <RepCadenceMetronome
                                          tempo={draft.tempo || effectiveTempo || '2/0/2'}
                                          targetReps={draft.reps || ex.reps || 8}
                                          exerciseName={ex.name}
                                          weightKg={
                                            units === 'imperial'
                                              ? (parseFloat(draft.weight) || 0) * 0.453592
                                              : (parseFloat(draft.weight) || 0)
                                          }
                                          units={units}
                                          nasmOptPhase={plan?.nasm_opt_phase}
                                          onCompleteReps={completedReps => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: { ...draft, reps: String(completedReps) },
                                            }))
                                          }}
                                          triggerHaptic={triggerHaptic}
                                        />
                                      )}

                                      {/* Set Notes */}
                                      <div>
                                        <label style={setFieldLabelStyle}>Set Notes (optional)</label>
                                        <textarea
                                          value={draft.notes}
                                          onChange={event => {
                                            const value = event.target.value
                                            setInlineSetDrafts(prev => ({ ...prev, [exerciseKey]: { ...draft, notes: value } }))
                                          }}
                                          style={{ ...inputStyle, minHeight: 48 }}
                                          placeholder="Form cues, band tension, or notes"
                                        />
                                      </div>

                                      {/* 1RM Percentage & Target Load Matrix */}
                                      {!isTimed && (
                                        <OneRepMaxPercentageMatrix
                                          exerciseName={ex.name}
                                          currentWeight={draft.weight}
                                          currentReps={draft.reps}
                                          historicalMax1RmLbs={histMax1RmLbs > 0 ? histMax1RmLbs : undefined}
                                          units={units}
                                          isWarmup={draft.isWarmup}
                                          isTimed={isTimed}
                                          onApplyLoad={(appliedWeight, appliedReps) => {
                                            setInlineSetDrafts(prev => ({
                                              ...prev,
                                              [exerciseKey]: {
                                                ...draft,
                                                weight: appliedWeight,
                                                reps: appliedReps,
                                              },
                                            }))
                                          }}
                                          triggerHaptic={triggerHaptic}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}

                            {/* ── Horizontal Sets Carousel (Today's Completed Sets) ── */}
                            <HorizontalSetsCarousel
                              logs={exerciseRecentLogs}
                              units={units}
                              isTimed={isTimed}
                              triggerHaptic={triggerHaptic}
                              onSelectSet={(selectedLog) => {
                                const selWeight = selectedLog.weight_kg !== null && selectedLog.weight_kg !== undefined
                                  ? (units === 'imperial' ? String(Math.round(selectedLog.weight_kg * 2.20462)) : String(Math.round(selectedLog.weight_kg * 10) / 10))
                                  : draft.weight
                                setInlineSetDrafts(prev => ({
                                  ...prev,
                                  [exerciseKey]: {
                                    ...draft,
                                    weight: isTimed ? '0' : selWeight,
                                    reps: String(selectedLog.reps ?? draft.reps),
                                    rpe: selectedLog.rpe ? String(selectedLog.rpe) : draft.rpe,
                                    rir: selectedLog.rir ? String(selectedLog.rir) : draft.rir,
                                    isWarmup: Boolean(selectedLog.is_warmup),
                                  },
                                }))
                              }}
                            />
                          </form>
                          </div>
                          )}
                        </details>
                        </li>
                      )
                    })
                  })()}
                        </>
                      )
                  })()}
                </ul>
              )}

              {/* ── Auto-Prompt: Advance from Resistance to Cardio ── */}
              {(() => {
                const exercises = workout.exercises || []
                const hasExercises = exercises.length > 0
                const loggedCount = exercises.filter(ex =>
                  activeSetLogs.some(set => extractWorkoutDayTag(set.notes) === workout.day && set.exercise_name?.toLowerCase() === ex.name?.toLowerCase())
                ).length
                const allResistanceLogged = hasExercises && loggedCount === exercises.length
                const cardio = resolveWorkoutCardioProtocol(workout, profile, plan)
                const isCardioLogged = localCardioLogs.some(log => log.notes?.includes(`[Day ${workout.day}`) || (workout.scheduledDate && log.session_date === workout.scheduledDate))

                if (!allResistanceLogged || isCardioLogged) return null

                return (
                  <div
                    style={{
                      marginTop: 14,
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(13, 27, 42, 0.95) 100%)',
                      border: '1px solid rgba(6, 182, 212, 0.45)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      boxShadow: '0 4px 20px rgba(6, 182, 212, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <GaaIcon name="target" size={22} tone="cyan" />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                          ALL RESISTANCE EXERCISES COMPLETE ({loggedCount}/{exercises.length})!
                        </div>
                        <div style={{ fontSize: 11.5, color: '#A5F3FC', marginTop: 1 }}>
                          Ready for Stage 3: {cardio?.title || 'Cardiorespiratory Conditioning (Incline Walking / Intervals)'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('success')
                        setActiveStepFilter('cardio')
                        setCollapsedStages(prev => ({ ...prev, [`${workout.day}-cardio`]: false }))
                      }}
                      className="tactile-btn"
                      style={{
                        background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '8px 14px',
                        borderRadius: 5,
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 10px rgba(6, 182, 212, 0.4)',
                      }}
                    >
                      <span>Advance to Stage 3 Cardio</span>
                      <span>→</span>
                    </button>
                  </div>
                )
              })()}
              </div>
            )}

                      {/* ── Step 3: Integrated NASM Cardiorespiratory Protocol & Energy System Finisher ── */}
                      {(activeStepFilter === 'all' || activeStepFilter === 'cardio') && (() => {
                        const cardio = resolveWorkoutCardioProtocol(workout, profile, plan)
                        if (!cardio) return null

                        const _isDedicatedOffDay = workout.focus?.toLowerCase().includes('cardio') ||
                          workout.focus?.toLowerCase().includes('recovery') ||
                          (workout.exercises && workout.exercises.length <= 3 && workout.exercises.every(e => e.block === 'warmup' || e.block === 'cooldown' || e.name.toLowerCase().includes('cardio') || e.name.toLowerCase().includes('stretch')))

                        const draft = cardioDraftsByDay[workout.day] ?? defaultCardioDraft(cardio)

                        const dayCardioLogs = localCardioLogs.filter(log => {
                          const isMatchDay = log.notes?.includes(`[Day ${workout.day}`)
                          const isMatchDate = workout.scheduledDate && log.session_date === workout.scheduledDate
                          return isMatchDay || isMatchDate
                        })

                        const isCollapsed = isStageCollapsed(workout.day, 'cardio')

                        return (
                          <>
                            <div
                            style={{
                              marginTop: 18,
                              marginBottom: 20,
                              border: '1px solid rgba(56,189,248,0.35)',
                              background: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, rgba(10,20,35,0.95) 100%)',
                              borderRadius: 8,
                              padding: '16px 18px',
                              color: '#FFFFFF',
                            }}
                          >
                            {/* Header */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 10,
                                borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                paddingBottom: isCollapsed ? 0 : 12,
                                marginBottom: isCollapsed ? 0 : 12,
                              }}
                            >
                              <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        background: 'rgba(56,189,248,0.15)',
                                        color: '#38BDF8',
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        border: '1px solid rgba(56,189,248,0.35)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                      }}
                                    >
                                      <GaaIcon name="runner" size={13} tone="cyan" />
                                      <span>STEP 3: CARDIO & CONDITIONING PROTOCOL</span>
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: cardio.stage === 3 ? 'rgba(239,68,68,0.2)' : cardio.stage === 2 ? 'rgba(245,158,11,0.2)' : 'rgba(52,211,153,0.2)',
                                        color: cardio.stage === 3 ? '#FCA5A5' : cardio.stage === 2 ? '#FCD34D' : '#6EE7B7',
                                        padding: '2px 7px',
                                        borderRadius: 4,
                                      }}
                                    >
                                      Stage {cardio.stage} · {cardio.targetZone}
                                    </span>
                                  </div>
                                  <h4 style={{ margin: '4px 0 2px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 17, letterSpacing: '0.04em', color: '#FFFFFF', fontWeight: 700 }}>
                                    {cardio.title}
                                  </h4>
                                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                                    {cardio.metabolicRationale}
                                  </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 16, fontFamily: 'var(--font-telemetry, monospace)', color: 'var(--gold-lt)', fontWeight: 700 }}>
                                      {cardio.durationMins} MINS
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                                      {cardio.targetRpe}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const modality = cardio?.recommendedModalities[0] || 'Treadmill Incline Walk'
                                      handleStartCardioSession(workout.day, modality, false)
                                      const patId: CardioPatternId =
                                        cardio?.stage === 3
                                          ? 'tabata_micro_bursts'
                                          : cardio?.stage === 2
                                          ? 'hiit_1_to_2'
                                          : 'zone2_aerobic_engine'
                                      setActiveCardioPlayerSession({
                                        patternId: patId,
                                        durationMins: cardio?.durationMins || 20,
                                        modality,
                                      })
                                    }}
                                    className="tactile-btn"
                                    style={{
                                      background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                                      border: '1px solid #F59E0B',
                                      color: '#0A0E18',
                                      fontFamily: 'var(--font-sans, Raleway), sans-serif',
                                      textTransform: 'uppercase',
                                      fontSize: 12.5,
                                      letterSpacing: '0.08em',
                                      fontWeight: 700,
                                      padding: '7px 14px',
                                      borderRadius: 6,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      boxShadow: '0 2px 12px rgba(212,160,23,0.35)',
                                    }}
                                  >
                                    <GaaIcon name="headphones" size={14} tone="dark" />
                                    <span>START COACH GORDON CARDIO</span>
                                  </button>

                                <button
                                  type="button"
                                  onClick={() => toggleStage(workout.day, 'cardio')}
                                  className="tactile-btn"
                                  style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                    color: '#38BDF8',
                                    borderRadius: 5,
                                    padding: '6px 12px',
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  {isCollapsed ? '▼ Expand Cardio' : '▲ Collapse'}
                                </button>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <>
                                {/* Quick Metrics Grid */}
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
                                    gap: 8,
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '10px 12px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    marginBottom: 14,
                                    fontSize: 11,
                                  }}
                                >
                                  <div>
                                    <span style={{ color: 'var(--gray)', display: 'block', textTransform: 'uppercase', fontSize: 9.5, letterSpacing: '0.06em' }}>Type & Format</span>
                                    <strong style={{ color: '#38BDF8', fontSize: 12 }}>{cardio.workRestRatio || 'Steady State'}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--gray)', display: 'block', textTransform: 'uppercase', fontSize: 9.5, letterSpacing: '0.06em' }}>Duration</span>
                                    <strong style={{ color: '#FFFFFF', fontSize: 13 }}>{cardio.durationMins} mins</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--gray)', display: 'block', textTransform: 'uppercase', fontSize: 9.5, letterSpacing: '0.06em' }}>Target RPE</span>
                                    <strong style={{ color: 'var(--gold-lt)', fontSize: 12 }}>{cardio.targetRpe}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--gray)', display: 'block', textTransform: 'uppercase', fontSize: 9.5, letterSpacing: '0.06em' }}>Target BPM</span>
                                    <strong style={{ color: '#FFFFFF', fontSize: 12 }}>{cardio.targetBpmRange}</strong>
                                  </div>
                                </div>

                                {/* In-Workout Cardio Logging Form */}
                                <form
                                  onSubmit={e => {
                                    e.preventDefault()
                                    handleSaveWorkoutCardio(workout, cardio, draft)
                                  }}
                                  style={{ display: 'grid', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                      <GaaIcon name="clipboard" size={12} tone="gold" />
                                      <span>Quick Cardio Log</span>
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                                      Logged for {workout.scheduledDate || 'Today'}
                                    </span>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: 8 }}>
                                    {/* Modality Selector */}
                                    <div>
                                      <label style={setFieldLabelStyle}>Modality</label>
                                      <select
                                        value={draft.modality}
                                        onChange={e => {
                                          const val = e.target.value
                                          setCardioDraftsByDay(prev => ({
                                            ...prev,
                                            [workout.day]: { ...draft, modality: val },
                                          }))
                                        }}
                                        style={inputStyle}
                                        aria-label="Cardio modality"
                                      >
                                        {(cardio.recommendedModalities || ['Incline Walking', 'Rower', 'Airdyne Bike', 'Stair Climber']).map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Duration (mins) */}
                                    <div>
                                      <label style={setFieldLabelStyle}>Duration (mins)</label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        onFocus={selectOnFocus}
                                        value={draft.durationMins}
                                        onChange={e => {
                                          const val = sanitizeNumericInput(e.target.value)
                                          setCardioDraftsByDay(prev => ({
                                            ...prev,
                                            [workout.day]: { ...draft, durationMins: val },
                                          }))
                                        }}
                                        style={inputStyle}
                                        placeholder={String(cardio.durationMins || 20)}
                                        aria-label="Cardio duration in minutes"
                                      />
                                    </div>

                                    {/* Distance (Optional) */}
                                    <div>
                                      <label style={setFieldLabelStyle}>Distance ({units === 'imperial' ? 'mi' : 'km'})</label>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        autoComplete="off"
                                        onFocus={selectOnFocus}
                                        value={draft.distance}
                                        onChange={e => {
                                          const val = sanitizeNumericInput(e.target.value)
                                          setCardioDraftsByDay(prev => ({
                                            ...prev,
                                            [workout.day]: { ...draft, distance: val },
                                          }))
                                        }}
                                        style={inputStyle}
                                        placeholder={units === 'imperial' ? '1.5' : '2.4'}
                                        aria-label={`Distance in ${units === 'imperial' ? 'miles' : 'kilometers'}`}
                                      />
                                    </div>

                                    {/* Avg HR (BPM) with Live Zone Pill */}
                                    <div>
                                      <label style={setFieldLabelStyle}>Avg Heart Rate (BPM)</label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        onFocus={selectOnFocus}
                                        value={draft.avgHeartRate}
                                        onChange={e => {
                                          const val = sanitizeNumericInput(e.target.value)
                                          setCardioDraftsByDay(prev => ({
                                            ...prev,
                                            [workout.day]: { ...draft, avgHeartRate: val },
                                          }))
                                        }}
                                        style={inputStyle}
                                        placeholder="135"
                                        aria-label="Average heart rate in BPM"
                                      />
                                      {(() => {
                                        const bpm = Number(draft.avgHeartRate)
                                        if (bpm > 40) {
                                          const liveZone = identifyHeartRateZone(bpm, Number(profile?.age) || 35, Number(profile?.resting_heart_rate) || 65)
                                          return (
                                            <div
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                marginTop: 3,
                                                padding: '2px 6px',
                                                borderRadius: 3,
                                                background: `${liveZone.color}22`,
                                                border: `1px solid ${liveZone.color}55`,
                                                color: liveZone.color,
                                                fontSize: 10,
                                                fontWeight: 700,
                                              }}
                                            >
                                              <span>●</span> {liveZone.zoneName.split(':')[0]} ({bpm} BPM)
                                            </div>
                                          )
                                        }
                                        return <p style={setFieldHintStyle}>Target: {cardio.targetBpmRange}</p>
                                      })()}
                                    </div>

                                    {/* Perceived Exertion (RPE) */}
                                    <div>
                                      <label style={setFieldLabelStyle}>RPE (1–10)</label>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        autoComplete="off"
                                        onFocus={selectOnFocus}
                                        value={draft.perceivedEffort}
                                        onChange={e => {
                                          const val = sanitizeNumericInput(e.target.value)
                                          setCardioDraftsByDay(prev => ({
                                            ...prev,
                                            [workout.day]: { ...draft, perceivedEffort: val },
                                          }))
                                        }}
                                        style={inputStyle}
                                        placeholder="6"
                                        aria-label="Perceived exertion RPE"
                                      />
                                      <p style={setFieldHintStyle}>Target: {cardio.targetRpe}</p>
                                    </div>

                                    {/* Calories */}
                                    <div>
                                      <label style={setFieldLabelStyle}>Calories (kcal)</label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        onFocus={selectOnFocus}
                                        value={draft.calories}
                                        onChange={e => {
                                          const val = sanitizeNumericInput(e.target.value)
                                          setCardioDraftsByDay(prev => ({
                                            ...prev,
                                            [workout.day]: { ...draft, calories: val },
                                          }))
                                        }}
                                        style={inputStyle}
                                        placeholder="180"
                                        aria-label="Calories burned"
                                      />
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                    <button
                                      type="submit"
                                      disabled={busy === `cardio-log:${workout.day}`}
                                      className="tactile-btn"
                                      style={{
                                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                                        border: '1px solid #38BDF8',
                                        color: '#FFFFFF',
                                        fontSize: 12,
                                        fontWeight: 800,
                                        padding: '8px 18px',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                      }}
                                    >
                                      <GaaIcon name="check" size={13} tone="white" />
                                      <span>{busy === `cardio-log:${workout.day}` ? 'Saving Cardio...' : `Log ${draft.modality} (${draft.durationMins || cardio.durationMins}m)`}</span>
                                    </button>
                                  </div>

                                  {/* Existing Logged Cardio for this session */}
                                  {dayCardioLogs.length > 0 && (
                                    <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                                      <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, marginBottom: 4 }}>
                                        ✓ Logged Cardio for this Day
                                      </div>
                                      <div style={{ display: 'grid', gap: 4 }}>
                                        {dayCardioLogs.map(log => (
                                          <div key={log.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.04)', padding: '5px 8px', borderRadius: 4 }}>
                                            <strong>{log.duration_mins} mins</strong> · {log.activity_type}
                                            {log.distance_km ? ` · ${units === 'imperial' ? `${(log.distance_km * 0.621371).toFixed(2)} mi` : `${log.distance_km} km`}` : ''}
                                            {log.avg_heart_rate ? ` · ${log.avg_heart_rate} BPM` : ''}
                                            {log.perceived_effort ? ` · RPE ${log.perceived_effort}` : ''}
                                            {log.calories ? ` · ${log.calories} kcal` : ''}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </form>

                                {/* Coaching Cues */}
                                {cardio.coachingCues && cardio.coachingCues.length > 0 && (
                                  <div style={{ marginTop: 12, background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 6, padding: '8px 12px' }}>
                                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                      <GaaIcon name="sparkles" size={12} tone="gold" />
                                      <span>Cardiorespiratory Coaching Cues</span>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                                      {cardio.coachingCues.map((cue: string, idx: number) => (
                                        <li key={idx} style={{ marginBottom: 2 }}>{cue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                            {/* ── Auto-Prompt: Advance from Cardio to Cool-Down ── */}
                            {dayCardioLogs.length > 0 && (
                              <div
                                style={{
                                  marginTop: 14,
                                  marginBottom: 16,
                                  padding: '12px 16px',
                                  background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.16) 0%, rgba(13, 27, 42, 0.95) 100%)',
                                  border: '1px solid rgba(52, 211, 153, 0.45)',
                                  borderRadius: 8,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 12,
                                  boxShadow: '0 4px 20px rgba(52, 211, 153, 0.25)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <GaaIcon name="runner" size={22} tone="emerald" />
                                  <div>
                                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                                      CARDIO PROTOCOL RECORDED!
                                    </div>
                                    <div style={{ fontSize: 11.5, color: '#A7F3D0', marginTop: 1 }}>
                                      Proceed to Stage 4: Regeneration, Flexibility & Clinical Cool-Down
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('success')
                                    setActiveStepFilter('cooldown')
                                    setCollapsedStages(prev => ({ ...prev, [`${workout.day}-cooldown`]: false }))
                                  }}
                                  className="tactile-btn"
                                  style={{
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    border: 'none',
                                    color: '#FFFFFF',
                                    padding: '8px 14px',
                                    borderRadius: 5,
                                    fontSize: 11.5,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
                                  }}
                                >
                                  <span>Advance to Stage 4 Cool-Down</span>
                                  <span>→</span>
                                </button>
                              </div>
                            )}
                          </>
                        )
                      })()}

                      {/* ── Step 4: NASM Clinical Cool-Down Protocol ── */}
                      {(activeStepFilter === 'all' || activeStepFilter === 'cooldown') && (
                        <ClinicalCoolDownModule
                          key={`cooldown-${plan?.id || 'p'}-w${microcycleProgress.currentWeek}-d${workout.day}-${workout.scheduledDate || todayDateOnly()}`}
                          planId={plan?.id}
                          workoutWeek={microcycleProgress.currentWeek}
                          sessionDate={workout.scheduledDate || todayDateOnly()}
                          workoutDay={workout.day}
                          workoutFocus={workout.focus}
                          notes={workout.notes}
                          exercises={workout.exercises}
                          isCollapsed={isStageCollapsed(workout.day, 'cooldown')}
                          onToggleCollapse={() => toggleStage(workout.day, 'cooldown')}
                          onOpenExerciseModal={(exercise) => setActiveVideoExercise(exercise)}
                          onCoolDownCompleted={(day: number) => {
                            setStatus(`✓ Day ${day} Clinical Cool-Down & Recovery Complete!`)
                          }}
                          onFlowToBreathwork={() => {
                            setActiveMindfulSession({
                              isOpen: true,
                              sourceContext: 'cooldown-flow',
                              initialProtocol: '4-7-8',
                              initialDurationMinutes: 3,
                            })
                          }}
                        />
                      )}

                      {/* ── End Workout Action Bar (Closes Telemetry & Logs Completed) ── */}
                      {(() => {
                        const isSessionActive = activeWorkoutSessionDay === workout.day && (isWorkoutTimerActive || elapsedWorkoutSeconds > 0)
                        return (
                          <div
                            style={{
                              marginTop: 24,
                              padding: '18px 22px',
                              background: isSessionActive
                                ? 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(13,27,42,0.96) 100%)'
                                : 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(13,27,42,0.95) 100%)',
                              border: isSessionActive
                                ? '1px solid rgba(16,185,129,0.45)'
                                : '1px solid rgba(212,160,23,0.4)',
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 14,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {completedLog ? (
                                  <>
                                    <span style={{ color: 'var(--success)' }}>✓</span>
                                    <span>Day {workout.day} Workout Completed</span>
                                  </>
                                ) : isSessionActive ? (
                                  <>
                                    <span style={{ color: '#34D399', animation: 'pulse 1.5s infinite' }}>●</span>
                                    <span>Live Session Active · Ready to End</span>
                                  </>
                                ) : (
                                  <>
                                    <GaaIcon name="award" size={14} tone="gold" />
                                    <span>Finished All Exercises?</span>
                                  </>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>
                                {completedLog
                                  ? 'Workout logged in training history and synced with Apple Health. Click End Workout below to review or update.'
                                  : 'Closes live telemetry session, stops active timer, and logs your workout as completed in Apple Health.'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCompleteModal(workout)}
                              className="tactile-btn"
                              style={{
                                background: isSessionActive
                                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                  : 'linear-gradient(135deg, var(--gold) 0%, #B8860B 100%)',
                                border: isSessionActive ? '1px solid #34D399' : '1px solid var(--gold-lt)',
                                color: isSessionActive ? '#FFFFFF' : '#0A0E18',
                                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                                textTransform: 'uppercase',
                                fontSize: 13.5,
                                letterSpacing: '0.08em',
                                fontWeight: 700,
                                padding: '11px 26px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: isSessionActive
                                  ? '0 4px 20px rgba(16,185,129,0.45)'
                                  : '0 4px 16px rgba(212,160,23,0.3)',
                              }}
                            >
                              <GaaIcon name="stop" size={16} tone={isSessionActive ? 'white' : 'dark'} />
                              <span>{completedLog ? 'END WORKOUT (UPDATE)' : 'END WORKOUT'}</span>
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                </div>
              </div>
            )
          })()}
        </section>

      </div>
      </>
      )}

      {/* ── PROGRESS & PRS HUB ── */}
      {primaryHub === 'progress' && (
        <ProgressAnalyticsView
          localWorkoutLogs={localWorkoutLogs}
          localSetLogs={localSetLogs}
          units={units}
          progression={progression}
          progressPhotos={progressPhotos}
          profile={profile}
          bodyfatState={bodyfatState}
          setBodyfatState={setBodyfatState}
          setStatus={setStatus}
          formatWeight={formatWeight}
        />
      )}

      {/* ── FITNESS LAB & DIAGNOSTICS HUB ── */}
      {primaryHub === 'lab' && (
        <FitnessLabDiagnosticsView
          activeLabTool={activeLabTool}
          onSelectTool={handleLabToolChange}
          profile={profile}
          intake={intake}
          plan={plan}
          latestAssessment={latestAssessment}
          bodyfatState={bodyfatState}
          logs={logs}
          setLogs={setLogs}
          plans={allPlans}
          telemetry={wearableTelemetry}
          initialLift={labInitialLift}
          initialCritique={labInitialCritique}
          initialTab={initialTab || (searchParams?.get('tab') as 'heatmap' | 'gate' | 'acwr' | 'deload' | '3d' | null) || undefined}
          onApplyTravelPlan={(scenario, adapted) => {
            if (planWorkouts.length > 0) {
              setAdaptedExercisesByDay(prev => ({
                ...prev,
                [planWorkouts[0].day]: adapted,
              }))
              setStatus(`Activated ${scenario.replace(/_/g, ' ')} travel protocol across your training split.`)
            }
          }}
        />
      )}

      {/* ── COACH & ACCOUNTABILITY HUB ── */}
      {primaryHub === 'coach' && (
        <CoachAdvisoryView
          units={units}
          progressPhotos={progressPhotos}
          profile={profile}
          intake={intake}
          plan={plan}
          bodyfatState={bodyfatState}
          setBodyfatState={setBodyfatState}
          setStatus={setStatus}
        />
      )}

      {completeModal && (
        <PostWorkoutFinishModal
          workout={completeModal}
          cardio={resolveWorkoutCardioProtocol(completeModal, profile, plan)}
          elapsedWorkoutSeconds={elapsedWorkoutSeconds}
          localSetLogs={activeSetLogs}
          profile={profile}
          plan={plan}
          onClose={() => setCompleteModal(null)}
          onConfirm={(rpe?: number) => {
            void handleCompleteWorkoutDay(completeModal, rpe)
          }}
          onFlowToCardio={(rpe?: number) => {
            const targetWorkout = completeModal
            void handleCompleteWorkoutDay(targetWorkout, rpe)
            const cardio = resolveWorkoutCardioProtocol(targetWorkout, profile, plan)
            const modality = cardio?.recommendedModalities[0] || 'Treadmill Incline Walk'
            const patId: CardioPatternId =
              cardio?.stage === 3
                ? 'tabata_micro_bursts'
                : cardio?.stage === 2
                ? 'hiit_1_to_2'
                : 'zone2_aerobic_engine'
            setActiveCardioPlayerSession({
              patternId: patId,
              durationMins: cardio?.durationMins || 20,
              modality,
            })
          }}
          onFlowToCoolDown={(rpe?: number) => {
            const targetWorkout = completeModal
            void handleCompleteWorkoutDay(targetWorkout, rpe)
            setActiveStepFilter('cooldown')
            setCollapsedStages(prev => ({
              ...prev,
              [`${targetWorkout.day}-cooldown`]: false,
            }))
            setStatus(`✓ Day ${targetWorkout.day} strength logged! Advancing to Stage 4: Cool-Down.`)
            setTimeout(() => {
              const el = document.getElementById(`cooldown-stage-day-${targetWorkout.day}`) || document.getElementById(`stage-cooldown-${targetWorkout.day}`)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 150)
          }}
          busy={busy === `log-day:${String(completeModal.day)}`}
        />
      )}

      {/* Skip Exercise Modal */}
      {skipModal && (
        <SkipExerciseModal
          exercise={skipModal.exercise}
          workoutDay={skipModal.workoutDay}
          clientInjuries={clientInjuries}
          onOpenSwap={() => {
            const day = skipModal.workoutDay
            const ex = skipModal.exercise
            setSkipModal(null)
            setSwapModalExercise({ workoutDay: day, exercise: ex, initialDiscomfort: primaryDiscomfortArea })
          }}
          onConfirm={(reason, notes) => {
            const fakeWorkout: WorkoutDay = { day: skipModal.workoutDay, focus: '', exercises: [] }
            void handleSkipExercise(fakeWorkout, skipModal.exercise, reason, notes)
          }}
          onClose={() => setSkipModal(null)}
        />
      )}

      {/* Smart Biomechanical Exercise Substitution Modal */}
      {swapModalExercise && (
        <SmartExerciseSwapModal
          currentExerciseName={swapModalExercise.exercise.name}
          optPhase={plan?.nasm_opt_phase ? String(plan.nasm_opt_phase) : 'Phase 2: Strength Endurance'}
          initialDiscomfort={swapModalExercise.initialDiscomfort || primaryDiscomfortArea}
          onSelectSubstitution={(substitution) => {
            handleExerciseSwap(swapModalExercise.workoutDay, swapModalExercise.exercise, substitution)
            setSwapModalExercise(null)
          }}
          onClose={() => setSwapModalExercise(null)}
        />
      )}

      {/* In-App Exercise Video & Biomechanical Form Modal */}
      {activeVideoExercise && (
        <ExerciseVideoModal
          exercise={activeVideoExercise}
          onClose={() => setActiveVideoExercise(null)}
        />
      )}


      {/* AI Coach Gordon Voiceover Cardio Training Engine Modal */}
      {activeCardioPlayerSession && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Coach Gordon Cardio Studio"
          className="coach-cardio-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 100050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(4px, 2vw, 16px) clamp(4px, 2vw, 16px) calc(clamp(8px, 2vw, 16px) + env(safe-area-inset-bottom, 16px))',
            backdropFilter: 'blur(12px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <CoachCardioVoiceoverPlayer
            initialPatternId={activeCardioPlayerSession.patternId}
            initialDurationMinutes={activeCardioPlayerSession.durationMins}
            athleteName={profile?.full_name?.split(' ')[0] || 'Athlete'}
            athleteAge={profile?.age || 35}
            athleteWeightKg={profile?.weight_kg || 75}
            athleteGender={(profile?.sex as 'male' | 'female') || 'male'}
            initialModality={activeCardioPlayerSession.modality || 'Treadmill Incline Walk'}
            externalHeartRateBpm={wearableTelemetry?.currentHeartRate ?? null}
            onClose={() => setActiveCardioPlayerSession(null)}
            onFlowToCoolDown={() => {
              setActiveCardioPlayerSession(null)
              setActiveStepFilter('cooldown')
              const targetDay = activeWorkoutSessionDay || completeModal?.day || planWorkouts[0]?.day || 1
              setCollapsedStages(prev => ({
                ...prev,
                [`${targetDay}-cooldown`]: false,
              }))
              setStatus('✓ Cardio logged! Advancing to Stage 4: Cool-Down & Regeneration.')
              setTimeout(() => {
                const el = document.getElementById(`cooldown-stage-day-${targetDay}`) || document.getElementById(`stage-cooldown-${targetDay}`)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }, 150)
            }}
            onSessionLogged={(log) => {
              setLocalCardioLogs(prev => [
                {
                  id: 'local-' + Date.now(),
                  session_date: new Date().toISOString().slice(0, 10),
                  activity_type: log.activity_type,
                  duration_mins: log.duration_mins,
                  perceived_effort: log.perceived_effort,
                },
                ...prev,
              ])
              setStatus(`AI Coach Gordon Cardio session logged: ${log.duration_mins} mins!`)
            }}
          />
        </div>
      )}

      {/* Mindful Moment & Parasympathetic Reset Modal */}
      {activeMindfulSession?.isOpen && (
        <MindfulMomentModal
          isOpen={activeMindfulSession.isOpen}
          onClose={() => setActiveMindfulSession(null)}
          initialProtocol={activeMindfulSession.initialProtocol || '4-7-8'}
          initialDurationMinutes={activeMindfulSession.initialDurationMinutes || 3}
          athleteName={profile?.full_name?.split(' ')[0] || 'Athlete'}
          sourceContext={activeMindfulSession.sourceContext}
          onCompleted={(res) => {
            setStatus(`Mindful Moment complete: ${res.minutes} mins logged to Apple Health!`)
          }}
          onFlowToCardio={() => {
            setActiveMindfulSession(null)
            const fallbackWorkout = completeModal || planWorkouts[0]
            const cardio = fallbackWorkout ? resolveWorkoutCardioProtocol(fallbackWorkout, profile, plan) : null
            const modality = cardio?.recommendedModalities[0] || 'Treadmill Incline Walk'
            const patId: CardioPatternId =
              cardio?.stage === 3
                ? 'tabata_micro_bursts'
                : cardio?.stage === 2
                ? 'hiit_1_to_2'
                : 'zone2_aerobic_engine'
            setActiveCardioPlayerSession({
              patternId: patId,
              durationMins: cardio?.durationMins || 20,
              modality,
            })
          }}
        />
      )}

      {/* Floating Active Rest Timer Dock with Live Radial Progress */}
      <FloatingRestTimerDock
        activeRestState={activeRestState}
        currentHeartRateBpm={wearableTelemetry?.currentHeartRate ?? null}
        restingHeartRateBpm={wearableTelemetry?.restingHeartRate || 60}
        userAge={profile?.age || 30}
        soundMetronomeEnabled={soundMetronomeEnabled}
        onToggleSoundMetronome={handleToggleSoundMetronome}
        soundMetronomeMode={soundMetronomeMode}
        onChangeMetronomeMode={setSoundMetronomeMode}
        onAddSeconds={handleAddRestSeconds}
        onTogglePause={handleTogglePauseRest}
        onCompleteRest={handleCompleteRest}
        triggerHaptic={triggerHaptic}
      />

      {/* ── FLOATING STICKY LIVE WORKOUT SESSION DOCK (MOBILE & DESKTOP) ── */}
      {!activeRestState && (
        <LiveSessionStickyDock
          isWorkoutTimerActive={isWorkoutTimerActive}
          activeWorkoutSessionDay={activeWorkoutSessionDay}
          activeWorkout={planWorkouts.find((w: WorkoutDay) => w.day === activeWorkoutSessionDay)}
          elapsedWorkoutSeconds={elapsedWorkoutSeconds}
          activeWorkoutStage={activeWorkoutStage}
          heartRateBpm={wearableTelemetry?.currentHeartRate ?? null}
          userAge={profile?.age || 30}
          userWeightKg={profile?.weight_kg || 75}
          onPauseResume={handlePauseResumeWorkoutSession}
          onStartCardio={() => {
            const activeWorkout = planWorkouts.find((w: WorkoutDay) => w.day === activeWorkoutSessionDay)
            if (activeWorkout) {
              const cardio = resolveWorkoutCardioProtocol(activeWorkout, profile, plan)
              const modality = cardio?.recommendedModalities[0] || 'Treadmill Incline Walk'
              handleStartCardioSession(activeWorkout.day, modality, false)
              const patId: CardioPatternId =
                cardio?.stage === 3
                  ? 'tabata_micro_bursts'
                  : cardio?.stage === 2
                  ? 'hiit_1_to_2'
                  : 'zone2_aerobic_engine'
              setActiveCardioPlayerSession({
                patternId: patId,
                durationMins: cardio?.durationMins || 20,
                modality,
              })
            }
          }}
          onFinishLifts={() => {
            const activeWorkout = planWorkouts.find((w: WorkoutDay) => w.day === activeWorkoutSessionDay)
            if (activeWorkout) {
              setCompleteModal(activeWorkout)
            } else {
              const fallback = planWorkouts[0]
              if (fallback) setCompleteModal(fallback)
            }
          }}
        />
      )}

      {/* ── Tactical In-Gym Barbell Plate Calculator Modal ── */}
      {plateCalculatorTargetLbs !== null && (
        <BarbellPlateCalculator
          isModal={true}
          initialWeightLbs={plateCalculatorTargetLbs || 225}
          onClose={() => setPlateCalculatorTargetLbs(null)}
        />
      )}

      {/* ── Interactive Program Schedule & Calendar Modal ── */}
      {showCalendarModal && planCalendarEntries.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => setShowCalendarModal(false)}
        >
          <div
            style={{
              background: '#0A0F1E',
              border: '1.5px solid #D4AF37',
              borderRadius: 12,
              padding: '20px 24px',
              maxWidth: 520,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(212,175,55,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GaaIcon name="calendar" size={16} tone="gold" />
                <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: '#F8FAFC', fontWeight: 700 }}>
                  Program Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="tactile-btn"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#94A3B8',
                  borderRadius: 4,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Close schedule modal"
              >
                <GaaIcon name="close" size={13} tone="white" />
              </button>
            </div>
            <WorkoutCalendarView
              entries={planCalendarEntries}
              title="Mesocycle Calendar"
              subtitle="Select a scheduled session to jump directly to that workout day."
              onSelectEntry={(entry) => {
                handleCalendarEntrySelect(entry)
                setShowCalendarModal(false)
              }}
            />
          </div>
        </div>
      )}

    </>
  )
}

function formatWeight(weightKg: number | undefined, units: 'metric' | 'imperial') {
  if (!weightKg) return '-'
  if (units === 'imperial') return `${Math.round(weightKg * 2.20462 * 10) / 10} lb`
  return `${Math.round(weightKg * 10) / 10} kg`
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--navy-lt)',
  background: 'var(--navy)',
  color: 'var(--white)',
  minHeight: 44,
  fontSize: 16,
}

const setFieldLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  color: 'var(--gray)',
  fontSize: 11,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
}

const setFieldHintStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--gray)',
  fontSize: 11,
  lineHeight: 1.35,
}

const buttonStyle: React.CSSProperties = {
  border: 0,
  background: 'var(--gold)',
  color: '#0D1B2A',
  padding: '10px 14px',
  fontFamily: 'var(--font-sans, Raleway), sans-serif',
  textTransform: 'uppercase',
  fontSize: 13,
  letterSpacing: '0.08em',
  fontWeight: 700,
  cursor: 'pointer',
  minHeight: 44,
}

const stepperButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  color: 'var(--white)',
  fontSize: 15,
  fontWeight: 700,
  width: 36,
  minWidth: 36,
  height: 38,
  minHeight: 38,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.1s ease',
}

const workoutStatBadgeStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--white)',
  padding: '2px 8px',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const accordionWorkoutStyle: React.CSSProperties = {
  border: '1px solid var(--navy-lt)',
  background: 'var(--navy)',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
}

const accordionExerciseStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(13,27,42,0.62)',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
}

const accordionExerciseSummaryStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  padding: '6px 10px',
  cursor: 'pointer',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
}

function PostWorkoutFinishModal({
  workout,
  cardio,
  elapsedWorkoutSeconds,
  localSetLogs,
  profile: _profile,
  plan: _plan,
  onConfirm,
  onClose,
  onFlowToCardio,
  onFlowToCoolDown,
  onFlowToMindfulness,
  busy,
}: {
  workout: WorkoutDay
  cardio?: IntegratedCardioPrescription | null
  elapsedWorkoutSeconds: number
  localSetLogs: WorkoutSetLogRecord[]
  profile?: Record<string, unknown> | FitnessProfile | null
  plan?: Record<string, unknown> | WorkoutPlanRecord | null
  onConfirm: (rpe?: number) => void
  onClose: () => void
  onFlowToCardio?: (rpe?: number) => void
  onFlowToCoolDown?: (rpe?: number) => void
  onFlowToMindfulness?: (rpe?: number) => void
  busy: boolean
}) {
  const [rpe, setRpe] = useState('8')
  const [showCnsModal, setShowCnsModal] = useState(false)
  const parsedRpe = Number(rpe)
  const canSubmit = rpe.trim() === '' || (Number.isFinite(parsedRpe) && parsedRpe >= 1 && parsedRpe <= 10)

  // Calculate Stage Durations & Metrics
  const totalElapsedMins = elapsedWorkoutSeconds > 0
    ? Math.max(Math.round(elapsedWorkoutSeconds / 60), 1)
    : Math.max((workout.exercises?.length || 4) * 8, 30)
  const cardioMins = cardio?.durationMins || 15

  // Calculate working sets & volume
  const daySetLogs = localSetLogs.filter(set => extractWorkoutDayTag(set.notes) === workout.day)
  const completedSets = daySetLogs.length || (workout.exercises?.length ? workout.exercises.length * 3 : 12)
  const totalVolumeKg = daySetLogs.reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.reps || 0)), 0)
  const totalVolumeLbs = Math.round(totalVolumeKg * 2.20462) || 4500
  const estimatedCalories = Math.max(120, Math.round(totalElapsedMins * 6.5 + (totalVolumeKg * 0.04)))

  const cnsReport = useMemo(() => {
    return calculateSessionFatigueCnsIndex({
      sessionDurationMinutes: totalElapsedMins,
      sessionRpe: Number.isFinite(parsedRpe) && parsedRpe >= 1 ? parsedRpe : 8,
      setLogs: daySetLogs,
      units: 'imperial',
    })
  }, [totalElapsedMins, parsedRpe, daySetLogs])

  if (showCnsModal) {
    return (
      <SessionFatigueCnsSummaryModal
        workoutDayNumber={workout.day}
        workoutFocus={workout.focus}
        sessionDurationMinutes={totalElapsedMins}
        initialRpe={rpe}
        setLogs={daySetLogs}
        units="imperial"
        onConfirmWorkout={(finalRpe) => {
          setShowCnsModal(false)
          setRpe(String(finalRpe))
          onConfirm(finalRpe)
        }}
        onClose={() => setShowCnsModal(false)}
        triggerHaptic={triggerHaptic}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(10px)', overflowY: 'auto' }}>
      <div style={{ background: '#0D1726', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 12, padding: '22px 24px', maxWidth: 500, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.85)', display: 'grid', gap: 16, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--gold-lt)', letterSpacing: '0.08em' }}>
              End Workout & Apple Health Sync
            </div>
            <h3 style={{ margin: '2px 0 0', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, letterSpacing: '0.04em', color: '#FFFFFF', fontWeight: 700 }}>
              Day {String(workout.day)}: {workout.focus || 'Performance Session'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--gray)', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* ── Session Summary Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Elapsed Duration
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 22, color: 'var(--gold-lt)', marginTop: 2, fontWeight: 700 }}>
              {totalElapsedMins} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif' }}>mins</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Sets Completed
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 22, color: '#34D399', marginTop: 2, fontWeight: 700 }}>
              {completedSets} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif' }}>sets</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Total Volume
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 22, color: '#FFFFFF', marginTop: 2, fontWeight: 700 }}>
              {totalVolumeLbs.toLocaleString()} <span style={{ fontSize: 13, fontFamily: 'Raleway, sans-serif' }}>lbs</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
              Cardio Stage
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 22, color: '#38BDF8', marginTop: 2, fontWeight: 700 }}>
              {cardio ? `Stage ${cardio.stage}` : 'Mobility'}
            </div>
          </div>
        </div>

        {/* ── Apple Health Sync Confirmation Pill ── */}
        <div
          style={{
            background: 'rgba(255,45,85,0.08)',
            border: '1px solid rgba(255,45,85,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <GaaIcon name="activity" size={20} tone="ruby" />
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#FFFFFF' }}>
              Syncing to Apple Health
            </div>
            <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 1 }}>
              Traditional Strength Training · {totalElapsedMins} min session · ~{estimatedCalories} active kcal
            </div>
          </div>
        </div>

        {/* ── CNS Readiness & Session Fatigue Summary Pill ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(59,130,246,0.08) 100%)',
            border: '1px solid rgba(168,85,247,0.35)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🧠</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#FFFFFF' }}>
                  CNS Readiness: <span style={{ color: cnsReport.cnsScore > 75 ? '#34D399' : cnsReport.cnsScore > 50 ? '#FBBF24' : '#F87171' }}>{cnsReport.cnsScore}%</span>
                </span>
                <span style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ({cnsReport.tierLabel})
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: '#C084FC', marginTop: 2 }}>
                Recovery Horizon: ~{cnsReport.recoveryHoursNeeded}h · Load: {cnsReport.fosterTrainingLoadAu} A.U.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap')
              setShowCnsModal(true)
            }}
            className="tactile-btn"
            style={{
              padding: '6px 12px',
              background: 'rgba(168,85,247,0.25)',
              border: '1px solid rgba(168,85,247,0.5)',
              borderRadius: 6,
              color: '#E9D5FF',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Breakdown ↗
          </button>
        </div>

        {/* RPE & Exertion Input */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 4 }}>
            Rate of Perceived Exertion (RPE 1-10)
          </label>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            onFocus={selectOnFocus}
            value={rpe}
            onChange={e => setRpe(sanitizeNumericInput(e.target.value))}
            placeholder="e.g. 8"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--navy)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: 'var(--white)',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ── Seamless Flow to Next Component ("What's Next?") ── */}
        {(onFlowToCardio || onFlowToCoolDown || onFlowToMindfulness) && (
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--gold-lt)', letterSpacing: '0.08em' }}>
              What&apos;s Next? · Seamless Flow
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {onFlowToCardio && (
                <button
                  type="button"
                  disabled={!canSubmit || busy}
                  onClick={() => {
                    triggerHaptic('tap')
                    onFlowToCardio(Number.isFinite(parsedRpe) ? parsedRpe : 8)
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(212,160,23,0.06) 100%)',
                    border: '1px solid rgba(212,160,23,0.45)',
                    borderRadius: 6,
                    color: 'var(--gold-lt)',
                    textAlign: 'left',
                    cursor: busy ? 'wait' : 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 900 }}>
                    <span>🔥</span>
                    <span>Flow to Cardio</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2, lineHeight: 1.25 }}>
                    Log Strength &amp; launch AI Cardio ({cardio?.stage ? `Stage ${cardio.stage}` : 'Cardio'})
                  </div>
                </button>
              )}

              {(onFlowToCoolDown || onFlowToMindfulness) && (
                <button
                  type="button"
                  disabled={!canSubmit || busy}
                  onClick={() => {
                    triggerHaptic('tap')
                    const rpeVal = Number.isFinite(parsedRpe) ? parsedRpe : 8
                    if (onFlowToCoolDown) {
                      onFlowToCoolDown(rpeVal)
                    } else if (onFlowToMindfulness) {
                      onFlowToMindfulness(rpeVal)
                    }
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 100%)',
                    border: '1px solid rgba(16,185,129,0.45)',
                    borderRadius: 6,
                    color: '#34D399',
                    textAlign: 'left',
                    cursor: busy ? 'wait' : 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 900 }}>
                    <span>❄️</span>
                    <span>Flow to Cool-Down</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--gray)', marginTop: 2, lineHeight: 1.25 }}>
                    Log Strength &amp; advance to Stage 4 Cool-Down
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            disabled={!canSubmit || busy}
            onClick={() => {
              triggerHaptic('success')
              onConfirm(Number.isFinite(parsedRpe) ? parsedRpe : 8)
            }}
            className="tactile-btn"
            style={{
              padding: '12px 18px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: '1px solid #34D399',
              borderRadius: 6,
              color: '#FFFFFF',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              textTransform: 'uppercase',
              fontSize: 13,
              letterSpacing: '0.08em',
              fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
            }}
          >
            <GaaIcon name="stop" size={14} tone="white" />
            <span>{busy ? 'Ending Session & Saving...' : 'End Workout & Log Completed'}</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap')
                setShowCnsModal(true)
              }}
              className="tactile-btn"
              style={{
                padding: '10px 12px',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.08) 100%)',
                border: '1px solid rgba(168,85,247,0.5)',
                borderRadius: 6,
                color: '#E9D5FF',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>🧠</span>
              <span>CNS Readiness</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--gray)',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

  function SkipExerciseModal({ exercise, workoutDay, onConfirm, onOpenSwap, clientInjuries = [], onClose }: {
    exercise: WorkoutExercise
    workoutDay: number
    onConfirm: (reason: string, notes: string) => void
    onOpenSwap?: () => void
    clientInjuries?: SportsInjuryKey[]
    onClose: () => void
  }) {
    const [reason, setReason] = useState('other')
    const [notes, setNotes] = useState('')
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,7,14,0.85)', backdropFilter: 'blur(8px)', zIndex: 100050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: 'linear-gradient(180deg, #0D1629 0%, #080D1A 100%)', border: '1px solid rgba(212,160,23,0.4)', borderRadius: 10, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 19, letterSpacing: '0.04em', fontWeight: 700, color: '#FFFFFF' }}>
            Skip: {exercise.name}
          </h3>
          <p style={{ color: 'var(--gray)', fontSize: 12.5, margin: '0 0 14px' }}>
            Day {workoutDay} · Why are you skipping this exercise?
          </p>

          {/* Coach Joint Relief / Equipment Swap Alternative */}
          {onOpenSwap && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(13,22,41,0.95) 100%)',
                border: '1px solid rgba(212,160,23,0.35)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="shield-check" size={13} tone="gold" />
                  <strong style={{ color: 'var(--gold-lt)', fontSize: 12 }}>Substitute with Safe Regression?</strong>
                </div>
                <div style={{ color: 'var(--gray)', fontSize: 11, marginTop: 3, lineHeight: 1.35 }}>
                  Avoid skipping the training stimulus. Pick an NASM regression for joint comfort or busy gym gear.
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenSwap}
                style={{
                  padding: '7px 12px',
                  background: 'var(--gold)',
                  color: '#0A0E18',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(212,160,23,0.3)',
                }}
              >
                Swap Instead
              </button>
            </div>
          )}

          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 5 }}>
            Primary Skip Reason
          </div>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', background: '#090E1A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'var(--white)', fontFamily: 'Raleway, sans-serif', fontSize: 13.5, marginBottom: 12 }}
          >
            <option value="injury">Joint Discomfort / Sports Injury</option>
            <option value="no_equipment">Equipment Busy or Missing</option>
            <option value="time">Running Out of Time</option>
            <option value="fatigue">Excessive Fatigue / Overload</option>
            <option value="other">Other Reason</option>
          </select>

          {reason === 'injury' && clientInjuries.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 6 }}>
                Active Injury Quick-Tag:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {clientInjuries.map(key => {
                  const inj = COMMON_SPORTS_INJURIES[key]
                  if (!inj) return null
                  const tag = `[Injury: ${inj.name}]`
                  const isTagged = notes.includes(tag)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (isTagged) {
                          setNotes(prev => prev.replace(tag, '').trim())
                        } else {
                          setNotes(prev => prev ? `${prev} ${tag}` : tag)
                        }
                      }}
                      style={{
                        padding: '4px 9px',
                        background: isTagged ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.12)',
                        border: isTagged ? '1px solid rgba(239, 68, 68, 0.7)' : '1px solid rgba(239, 68, 68, 0.3)',
                        color: isTagged ? '#FFFFFF' : '#FCA5A5',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{isTagged ? '✓' : '+'}</span>
                      <span>{inj.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, marginBottom: 5 }}>
            Coach Notes & Context
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe any joint discomfort or context for Coach Gordon..."
            rows={2}
            style={{ width: '100%', padding: '9px 12px', background: '#090E1A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'var(--white)', fontFamily: 'Raleway, sans-serif', fontSize: 13, marginBottom: 16, resize: 'vertical', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: 'var(--gray)', fontFamily: 'Raleway, sans-serif', borderRadius: 6, cursor: 'pointer', fontSize: 12.5 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(reason, notes)}
              style={{ padding: '8px 18px', background: 'var(--gold)', color: '#0D1B2A', border: 'none', borderRadius: 6, fontFamily: 'var(--font-sans, Raleway), sans-serif', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.08em', fontWeight: 700, cursor: 'pointer' }}
            >
              Log Skip
            </button>
          </div>
        </div>
      </div>
    )
  }


