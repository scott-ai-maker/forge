import dynamicImport from 'next/dynamic'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeCoachClientTab } from '@/lib/validation'
import LogoutButton from '@/components/auth/LogoutButton'
import GaaIcon from '@/components/ui/GaaIcon'
import ClientDetailClient from '@/components/coach/ClientDetailClient'
import CoachClientAssignmentButton from '@/components/coach/CoachClientAssignmentButton'
import CoachCommerceTools from '@/components/coach/CoachCommerceTools'
import SiteHeader from '@/components/ui/SiteHeader'
import ProgressPhotoTimeline from '@/components/fitness/ProgressPhotoTimeline'
import CoachTabSkeleton from '@/components/coach/CoachTabSkeleton'
import CoachClientTriageBanner from '@/components/coach/CoachClientTriageBanner'
import CoachClientHubNavigator from '@/components/coach/CoachClientHubNavigator'
import { evaluateClientTriage, calculateAcwrFromWorkoutLogs } from '@/lib/coach-triage'
import type { NasmAssessmentRecord } from '@/lib/nasm-assessments'
import type { ClientStatus, LifecycleAuditLogEntry } from '@/lib/client-lifecycle'
import { evaluateMedicalParq, type ParqAnswers } from '@/lib/liability-shield'
import { parseInjuriesFromText } from '@/lib/sports-injuries'
import {
  createSignedFitnessPhotoUrl,
  extractPhotoPathFromLegacyUrl,
  normalizePhotoPath,
} from '@/lib/fitness-photos'

import CoachClientOverviewStatusCard from '@/components/coach/CoachClientOverviewStatusCard'
import CoachAthleteVitalsEnvironmentalCard from '@/components/coach/CoachAthleteVitalsEnvironmentalCard'
import CoachOnboardingProgressionCard from '@/components/coach/CoachOnboardingProgressionCard'
import {
  evaluateClientOnboardingProgression,
  parseParqAnswers,
  type ClientGateRecord,
  type CoachGateStatus,
} from '@/lib/coach-onboarding-progression'
import { loadClientOnboardingGates } from '@/lib/coach-onboarding-gates-storage'

// Dynamic Chunks for Heavy Sub-Views
const CoachProgramWorkspace = dynamicImport(() => import('@/components/coach/CoachProgramWorkspace'), {
  loading: () => <CoachTabSkeleton label="Loading Program Workspace & NASM Exercise Matrix..." />,
})
const NasmAssessmentSuite = dynamicImport(() => import('@/components/coach/NasmAssessmentSuite'), {
  loading: () => <CoachTabSkeleton label="Loading Movement Screen & Kinetic Chain Matrix..." />,
})
const CoachLiabilityShield = dynamicImport(() => import('@/components/coach/CoachLiabilityShield'), {
  loading: () => <CoachTabSkeleton label="Loading Clinical Liability Shield..." />,
})
const CoachToolboxAssigner = dynamicImport(() => import('@/components/coach/CoachToolboxAssigner'), {
  loading: () => <CoachTabSkeleton label="Loading Specialized Client Toolbox..." />,
})
const CoachSupplementPrescriber = dynamicImport(() => import('@/components/coach/CoachSupplementPrescriber'), {
  loading: () => <CoachTabSkeleton label="Loading Clinical Supplement Prescriptions..." />,
})
const CoachPrescriptionsWorkspace = dynamicImport(() => import('@/components/coach/CoachPrescriptionsWorkspace'), {
  loading: () => <CoachTabSkeleton label="Loading Prescriptions & Toolboxes Workspace..." />,
})
const CoachPeriodizationCockpit = dynamicImport(() => import('@/components/coach/CoachPeriodizationCockpit'), {
  loading: () => <CoachTabSkeleton label="Loading NASM OPT Periodization Architect..." />,
})
const CoachCheckinReview = dynamicImport(() => import('@/components/coach/CoachCheckinReview'), {
  loading: () => <CoachTabSkeleton label="Loading Weekly Check-In Submissions..." />,
})
const CoachClientAuditTrail = dynamicImport(() => import('@/components/coach/CoachClientAuditTrail'), {
  loading: () => <CoachTabSkeleton label="Loading Client Lifecycle & Audit Trail..." />,
})
const CoachAiFastTrackOnboardingStudio = dynamicImport(() => import('@/components/coach/CoachAiFastTrackOnboardingStudio'), {
  loading: () => <CoachTabSkeleton label="Loading AI Fast-Track Onboarding Suite..." />,
})
const ExecutiveSundayDossier = dynamicImport(() => import('@/components/dashboard/ExecutiveSundayDossier'), {
  loading: () => <CoachTabSkeleton label="Loading weekly progress report..." />,
})

import { generateSundayDossier } from '@/lib/sunday-dossier-engine'

export const dynamic = 'force-dynamic'

const OFFICIAL_EXERCISE_SOURCES = ['nasm_exercise_library', 'licensed_import']
const EXCLUDED_EQUIPMENT_TERMS = ['chains', 'chain', 'safety collar', 'safety collars', 'none', 'no equipment']

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    tab?: string | string[] | undefined
    subtab?: string | string[] | undefined
  }>
}

interface ClientReadinessSummary {
  completionRate14d: number
  avgRpe14d: number | null
  completedSessions7d: number
  daysSinceLastCompleted: number | null
  readiness: 'high' | 'moderate' | 'low'
  recommendation: string
}

function isExcludedEquipmentName(name: string) {
  const normalized = String(name ?? '').trim().toLowerCase()
  if (normalized === 'none' || normalized === 'no equipment') return true
  return EXCLUDED_EQUIPMENT_TERMS.some(term => normalized.includes(term))
}

export default async function CoachClientPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { id } = await params
  const resolvedSearchParams = await searchParams
  const activeTab = normalizeCoachClientTab(resolvedSearchParams.tab)
  const rawSubTab = Array.isArray(resolvedSearchParams.subtab) ? resolvedSearchParams.subtab[0] : resolvedSearchParams.subtab
  const activeAssessmentSubTab = (['ohsa', 'posture', 'dynamic', 'cardio', 'radar', 'cex', 'history'].includes(rawSubTab as string)
    ? rawSubTab
    : undefined) as
    | 'ohsa'
    | 'posture'
    | 'dynamic'
    | 'cardio'
    | 'radar'
    | 'cex'
    | 'history'
    | undefined
  const admin = supabaseAdmin()

  // Fetch client info
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, email, full_name, phone, created_at, designated_coach_id, status, status_reason, status_updated_at')
    .eq('id', id)
    .maybeSingle()

  if (clientError || !client) notFound()

  // Auto-assign unassigned clients or allow master coach access
  if (!client.designated_coach_id) {
    await admin
      .from('clients')
      .update({ designated_coach_id: user.id })
      .eq('id', id)
    client.designated_coach_id = user.id
  } else if (client.designated_coach_id !== user.id) {
    const isMasterCoach =
      user.email?.toLowerCase() === 'scott.gordon72@outlook.com' ||
      user.user_metadata?.surface_role === 'coach'
    if (!isMasterCoach) {
      notFound()
    }
  }

  const clientStatus = (((client as { status?: ClientStatus } | null)?.status || 'active') as ClientStatus)
  const clientStatusReason = (client as { status_reason?: string } | null)?.status_reason || null
  const clientStatusUpdatedAt = (client as { status_updated_at?: string } | null)?.status_updated_at || null

  // Fetch packages
  const { data: packages } = await admin
    .from('client_packages')
    .select('*')
    .eq('client_id', id)
    .order('purchased_at', { ascending: false })

  // Fetch all sessions (past + upcoming)
  const { data: sessions } = await admin
    .from('sessions')
    .select('id, scheduled_at, status, notes, duration_mins, package_id, checked_in_at, checked_out_at')
    .eq('client_id', id)
    .order('scheduled_at', { ascending: false })

  // Tab-Aware Conditional Database Queries:
  // Only query 1,000-row exercise libraries & templates when activeTab === 'program'
  const isProgramTab = activeTab === 'program'
  const isAssessmentTab = activeTab === 'assessment'
  const isCheckinsTab = activeTab === 'checkins' || activeTab === 'overview'
  const isLifecycleTab = activeTab === 'lifecycle' || activeTab === 'overview'
  const isDossierTab = activeTab === 'dossier'

  const [
    latestPlansResult,
    templatesResult,
    coachTemplatesResult,
    exercisesResult,
    equipmentResult,
    fitnessProfileResult,
    intakeFormResult,
    workoutLogsResult,
    workoutSetLogsResult,
    cardioLogsResult,
    progressPhotosResult,
    nasmAssessmentsResult,
    weeklyCheckinsResult,
    lifecycleAuditLogsResult,
    bodyCompositionResult,
    coachGatesResult,
    dossierSetLogsResult,
    dossierCardioLogsResult,
    dossierPrsResult,
    dossierWearableResult,
  ] = await Promise.all([
    admin
      .from('workout_plans')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    isProgramTab
      ? admin
          .from('workout_program_templates')
          .select('id, title, slug, goal, nasm_opt_phase, phase_name, sessions_per_week, estimated_duration_mins, template_json')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    isProgramTab
      ? admin
          .from('coach_program_templates')
          .select('id, coach_id, title, goal, nasm_opt_phase, phase_name, sessions_per_week, estimated_duration_mins, template_json')
          .eq('coach_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    isProgramTab
      ? admin
          .from('exercise_library_entries')
          .select('id, name, slug, description, coaching_cues, primary_equipment, media_image_url, media_video_url')
          .eq('is_active', true)
          .in('source', OFFICIAL_EXERCISE_SOURCES)
          .order('name', { ascending: true })
          .limit(1000)
      : Promise.resolve({ data: [] }),
    isProgramTab
      ? admin
          .from('equipment_library_entries')
          .select('id, name, slug, description, media_image_url')
          .eq('is_active', true)
          .in('source', OFFICIAL_EXERCISE_SOURCES)
          .order('name', { ascending: true })
          .limit(250)
      : Promise.resolve({ data: [] }),
    admin
      .from('fitness_profiles')
      .select('fitness_goal, equipment_access, cardio_equipment_access, injuries_limitations, preferred_units, training_days_per_week, preferred_training_days, age, sex, height_cm, weight_kg, waist_cm, neck_cm, hip_cm, onboarding_completed_at')
      .eq('user_id', id)
      .maybeSingle(),
    admin
      .from('client_intake_forms')
      .select('parq_answers, parq_any_yes, medical_conditions, surgeries_or_injuries, medications, allergies, emergency_contact_phone, primary_physician_phone, consent_signature_name, consent_signed_at')
      .eq('user_id', id)
      .maybeSingle(),
    admin
      .from('workout_logs')
      .select('session_date, completed, exertion_rpe')
      .eq('user_id', id)
      .order('session_date', { ascending: false })
      .limit(60),
    admin
      .from('workout_set_logs')
      .select('session_date, reps, weight_kg, rpe')
      .eq('user_id', id)
      .order('session_date', { ascending: false })
      .limit(120),
    admin
      .from('cardio_logs')
      .select('session_date, duration_mins, activity_type, distance_km, perceived_effort')
      .eq('user_id', id)
      .order('session_date', { ascending: false })
      .limit(30),
    admin
      .from('progress_photos')
      .select('id, photo_url, taken_at, notes, created_at')
      .eq('user_id', id)
      .order('taken_at', { ascending: false })
      .limit(16),
    admin
      .from('nasm_assessments')
      .select('*')
      .eq('client_id', id)
      .order('assessment_date', { ascending: false })
      .limit(isAssessmentTab ? 20 : 1),
    isCheckinsTab
      ? admin
          .from('weekly_checkins')
          .select('*')
          .eq('user_id', id)
          .order('week_start', { ascending: false })
          .limit(24)
      : Promise.resolve({ data: [] }),
    isLifecycleTab
      ? admin
          .from('client_lifecycle_audit_logs')
          .select('*')
          .eq('client_id', id)
          .order('created_at', { ascending: false })
          .limit(250)
      : Promise.resolve({ data: [] }),
    admin
      .from('body_composition_analyses')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    loadClientOnboardingGates(admin, id),
    isDossierTab
      ? admin
          .from('workout_set_logs')
          .select('session_date, weight_lbs, reps, is_warmup, rpe, exercise_name, notes')
          .eq('user_id', id)
          .gte('session_date', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('session_date', { ascending: false })
      : Promise.resolve({ data: [] }),
    isDossierTab
      ? admin
          .from('cardio_logs')
          .select('session_date, activity_type, duration_mins, avg_heart_rate')
          .eq('user_id', id)
          .gte('session_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('session_date', { ascending: false })
      : Promise.resolve({ data: [] }),
    isDossierTab
      ? admin
          .from('personal_records')
          .select('exercise_name, weight_lbs, reps, achieved_at')
          .eq('user_id', id)
          .gte('achieved_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('achieved_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    isDossierTab
      ? admin
          .from('athlete_wearable_metrics')
          .select('resting_heart_rate, hrv_rmssd_ms')
          .eq('client_id', id)
          .order('sample_date', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const parqAnswers: ParqAnswers = parseParqAnswers(
    intakeFormResult.data?.parq_answers,
    intakeFormResult.data
  )
  const medicalEvaluation = evaluateMedicalParq(parqAnswers)

  const profileInjuries = parseInjuriesFromText(fitnessProfileResult.data?.injuries_limitations)
  const intakeInjuries = parseInjuriesFromText(intakeFormResult.data?.surgeries_or_injuries)
  const combinedContraindicationTags = Array.from(
    new Set([
      ...medicalEvaluation.contraindicationTags,
      ...profileInjuries.selectedInjuryIds,
      ...intakeInjuries.selectedInjuryIds,
    ])
  )
  medicalEvaluation.contraindicationTags = combinedContraindicationTags

  const contraindicationNotes = [
    String(fitnessProfileResult.data?.injuries_limitations ?? '').trim(),
    String(intakeFormResult.data?.medical_conditions ?? '').trim(),
    String(intakeFormResult.data?.surgeries_or_injuries ?? '').trim(),
    ...medicalEvaluation.flaggedItems,
  ].filter(Boolean)

  const now = new Date()
  const logs = workoutLogsResult.data ?? []
  const logsLast14d = logs.filter(log => {
    if (!log.session_date) return false
    const sessionDate = new Date(`${log.session_date}T00:00:00Z`)
    const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 14
  })
  const logsLast7d = logs.filter(log => {
    if (!log.session_date) return false
    const sessionDate = new Date(`${log.session_date}T00:00:00Z`)
    const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  })

  const completed14d = logsLast14d.filter(log => Boolean(log.completed))
  const completed7d = logsLast7d.filter(log => Boolean(log.completed))
  const completionRate14d = logsLast14d.length > 0
    ? Math.round((completed14d.length / logsLast14d.length) * 100)
    : 0

  const rpeValues = completed14d
    .map(log => Number(log.exertion_rpe))
    .filter(value => Number.isFinite(value) && value > 0)
  const avgRpe14d = rpeValues.length > 0
    ? Number((rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length).toFixed(1))
    : null

  const lastCompletedLog = logs.find(log => Boolean(log.completed) && Boolean(log.session_date))
  const daysSinceLastCompleted = lastCompletedLog?.session_date
    ? Math.max(0, Math.floor((now.getTime() - new Date(`${lastCompletedLog.session_date}T00:00:00Z`).getTime()) / (1000 * 60 * 60 * 24)))
    : null

  let readiness: ClientReadinessSummary['readiness'] = 'moderate'
  let recommendation = 'Use normal progression with standard check-ins this week.'

  if (completionRate14d >= 75 && (avgRpe14d === null || avgRpe14d <= 7.5)) {
    readiness = 'high'
    recommendation = 'Client appears ready for progressive overload and advanced sessions this week.'
  } else if (completionRate14d < 50 || (avgRpe14d !== null && avgRpe14d >= 8.5) || (daysSinceLastCompleted !== null && daysSinceLastCompleted >= 7)) {
    readiness = 'low'
    recommendation = 'Reduce complexity/intensity, prioritize adherence and recovery, and check barriers early.'
  }

  const readinessSummary: ClientReadinessSummary = {
    completionRate14d,
    avgRpe14d,
    completedSessions7d: completed7d.length,
    daysSinceLastCompleted,
    readiness,
    recommendation,
  }

  const setLogs = workoutSetLogsResult.data ?? []
  const cardioLogs = cardioLogsResult.data ?? []
  const clientUnits = fitnessProfileResult.data?.preferred_units === 'metric' ? 'metric' : 'imperial'

  const setLogsLast7d = setLogs.filter(log => {
    if (!log.session_date) return false
    const sessionDate = new Date(`${log.session_date}T00:00:00Z`)
    const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  })
  const cardioLogsLast7d = cardioLogs.filter(log => {
    if (!log.session_date) return false
    const sessionDate = new Date(`${log.session_date}T00:00:00Z`)
    const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  })

  const weeklySummary = {
    completedWorkouts: completed7d.length,
    totalSets: setLogsLast7d.length,
    totalReps: setLogsLast7d.reduce((sum, row) => sum + Number(row.reps ?? 0), 0),
    totalVolumeKg: Math.round(setLogsLast7d.reduce((sum, row) => sum + Number(row.reps ?? 0) * Number(row.weight_kg ?? 0), 0)),
    avgRpe: (() => {
      const rpeRows = setLogsLast7d.filter(row => Number(row.rpe ?? 0) > 0)
      if (rpeRows.length === 0) return null
      return Math.round((rpeRows.reduce((sum, row) => sum + Number(row.rpe ?? 0), 0) / rpeRows.length) * 10) / 10
    })(),
    cardioMinutes: cardioLogsLast7d.reduce((sum, row) => sum + Number(row.duration_mins ?? 0), 0),
    cardioSessions: cardioLogsLast7d.length,
  }
  const weeklyVolumeDisplay = clientUnits === 'imperial'
    ? Math.round(weeklySummary.totalVolumeKg * 2.20462)
    : weeklySummary.totalVolumeKg
  const weeklyVolumeUnitLabel = clientUnits === 'imperial' ? 'lb' : 'kg'

  const currentPhase = Number(latestPlansResult.data?.[0]?.nasm_opt_phase ?? 0)
  const phaseSuggestion = (() => {
    if (!currentPhase) {
      return {
        label: 'No active phase',
        tone: 'gray' as const,
        body: 'Generate or accept a plan before progression rules can apply.',
      }
    }

    if (completionRate14d >= 80 && (avgRpe14d === null || avgRpe14d <= 7.5) && currentPhase < 5) {
      return {
        label: `Advance to Phase ${String(currentPhase + 1)}`,
        tone: 'green' as const,
        body: 'Adherence and effort look stable enough to consider progressing this client to the next NASM phase.',
      }
    }

    if (completionRate14d < 50 || (avgRpe14d !== null && avgRpe14d >= 8.5)) {
      return {
        label: `Hold Phase ${String(currentPhase)}`,
        tone: 'red' as const,
        body: 'Keep the client in the current phase or reduce complexity until adherence and fatigue normalize.',
      }
    }

    return {
      label: `Maintain Phase ${String(currentPhase)}`,
      tone: 'gold' as const,
      body: 'Progress is steady, but the signal is not strong enough yet to auto-suggest a phase jump.',
    }
  })()

  const signedProgressPhotos = await Promise.all((progressPhotosResult.data ?? []).map(async photo => {
    const rawValue = String(photo.photo_url ?? '').trim()
    const storedPath = /^https?:\/\//i.test(rawValue)
      ? extractPhotoPathFromLegacyUrl(rawValue)
      : normalizePhotoPath(rawValue)
    const signedUrl = storedPath ? await createSignedFitnessPhotoUrl(admin, storedPath) : null

    return {
      ...photo,
      photo_url: signedUrl ?? rawValue,
    }
  }))

  const totalRemaining = (packages ?? []).reduce(
    (sum, p) => {
      if (p.expires_at && new Date(p.expires_at) <= now) return sum
      return sum + (p.sessions_remaining ?? 0)
    },
    0
  )

  const filteredEquipment = (equipmentResult.data ?? []).filter(item => !isExcludedEquipmentName(String(item.name ?? '')))

  const acwrData = calculateAcwrFromWorkoutLogs(
    workoutLogsResult.data ?? [],
    workoutSetLogsResult.data ?? []
  )
  const triageSummary = evaluateClientTriage({
    clientId: id,
    clientName: client.full_name ?? 'Client',
    email: client.email,
    daysSinceLastCheckin: readinessSummary.daysSinceLastCompleted ?? 14,
    readinessScore: readinessSummary.readiness === 'low' ? 45 : readinessSummary.readiness === 'moderate' ? 68 : 88,
    completionRate14d: readinessSummary.completionRate14d,
    currentOptPhase: latestPlansResult.data?.[0]?.nasm_opt_phase ?? 1,
    acwrRatio: acwrData.acwrRatio,
    acuteWorkloadUnits: acwrData.acuteWorkloadUnits,
    chronicWorkloadUnits: acwrData.chronicWorkloadUnits,
  })

  const gateMap: Record<number, ClientGateRecord> = coachGatesResult

  const progressionProfile = evaluateClientOnboardingProgression({
    clientId: id,
    clientName: client.full_name ?? 'Member',
    email: client.email,
    designatedCoachId: client.designated_coach_id,
    currentStatus: clientStatus,
    packages: packages ?? [],
    intakeForm: intakeFormResult.data,
    fitnessProfile: fitnessProfileResult.data,
    assessments: (nasmAssessmentsResult.data ?? []) as NasmAssessmentRecord[],
    latestPlan: latestPlansResult.data?.[0] ?? null,
    sessions: sessions ?? [],
    weeklyCheckins: weeklyCheckinsResult.data ?? [],
    workoutLogs: workoutLogsResult.data ?? [],
    latestBodyComposition: bodyCompositionResult.data ?? null,
    auditLogsCount: (lifecycleAuditLogsResult.data ?? []).length,
    gates: gateMap,
    enforceGates: true,
  })

  const sevenDaysAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const athleteClientName = client.full_name || client.email?.split('@')[0] || 'Member'
  const athletePlanPhase = latestPlansResult.data?.[0]?.phase_name
    ? `Phase ${latestPlansResult.data[0].nasm_opt_phase}: ${latestPlansResult.data[0].phase_name}`
    : (fitnessProfileResult.data?.fitness_goal || 'Phase 1: Stabilization Endurance')

  const athleteDossier = isDossierTab
    ? generateSundayDossier(
        athleteClientName,
        athletePlanPhase,
        (dossierSetLogsResult.data ?? []).filter((s: { session_date?: string | null }) => (s.session_date ?? '') >= sevenDaysAgoStr),
        dossierCardioLogsResult.data ?? [],
        dossierPrsResult.data ?? [],
        4,
        dossierWearableResult.data?.resting_heart_rate ?? 54,
        dossierWearableResult.data?.hrv_rmssd_ms ?? 68,
        Math.round(
          ((dossierSetLogsResult.data ?? []) as Array<{ is_warmup?: boolean | null; weight_lbs?: number | null; reps?: number | null }>).reduce(
            (acc, s) => acc + (s.is_warmup ? 0 : (s.weight_lbs ?? 0) * (s.reps ?? 0)),
            0
          ) / 4
        )
      )
    : null

  return (
    <main className="coach-client-page" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Member Profile"
        links={[
          { href: '/coach', label: 'Overview' },
          { href: '/coach#assigned-clients', label: 'Members' },
          { href: `/coach/clients/${id}/messages`, label: 'Messages' },
          { href: `/coach/clients/${id}/live`, label: 'Live Coaching' },
          { href: '/coach/settings', label: 'Settings' },
        ]}
        actions={<LogoutButton />}
      />

      <div className="coach-client-content" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(14px, 2.5vw, 24px) clamp(8px, 1.8vw, 16px)', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <a
          href="/coach"
          className="sgf-shell-back"
        >
          ← Back to Members
        </a>

        <div style={{ marginBottom: 20 }}>
          <div className="coach-client-top-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href={`/coach/clients/${id}/live`}
              className="tactile-btn"
              style={{
                padding: '10px 18px',
                borderRadius: 4,
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                fontSize: 12.5,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
              }}
            >
              <GaaIcon name="camera" size={15} style={{ color: '#080E14', stroke: '#080E14' }} />
              <span>Start Live Coaching</span>
            </Link>

            <a
              href={`/coach/clients/${id}/messages`}
              className="sgf-button sgf-button-secondary"
            >
              Message Member
            </a>
            <a
              href={`/coach/clients/${id}/dossier`}
              className="tactile-btn"
              style={{
                padding: '10px 14px',
                borderRadius: 4,
                background: 'rgba(56,189,248,0.12)',
                border: '1px solid rgba(56,189,248,0.4)',
                color: '#38BDF8',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="crown" size={13} tone="inherit" />
              <span>Weekly Progress Report</span>
            </a>
            <CoachClientAssignmentButton clientId={id} mode="release" />
            <a
              href={`/coach/clients/${id}?tab=lifecycle`}
              className="tactile-btn"
              style={{
                padding: '10px 14px',
                borderRadius: 4,
                background: clientStatus === 'paused' ? 'rgba(245,158,11,0.15)' : clientStatus === 'inactive' ? 'rgba(239,68,68,0.15)' : clientStatus === 'archived' ? 'rgba(148,163,184,0.15)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${clientStatus === 'paused' ? '#F59E0B' : clientStatus === 'inactive' ? '#EF4444' : clientStatus === 'archived' ? '#94A3B8' : '#10B981'}`,
                color: clientStatus === 'paused' ? '#F59E0B' : clientStatus === 'inactive' ? '#EF4444' : clientStatus === 'archived' ? '#94A3B8' : '#10B981',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {clientStatus === 'paused' ? (
                  <><GaaIcon name="status-paused" size={12} tone="amber" /> PAUSED</>
                ) : clientStatus === 'inactive' ? (
                  <><GaaIcon name="status-inactive" size={12} tone="ruby" /> INACTIVE</>
                ) : clientStatus === 'archived' ? (
                  <><GaaIcon name="folder" size={12} tone="slate" /> ARCHIVED</>
                ) : (
                  <><GaaIcon name="status-active" size={12} tone="emerald" /> ACTIVE</>
                )}
              </span>
              <span style={{ fontSize: 11, color: 'var(--gray)', textDecoration: 'underline' }}>Manage Status & Audit ➔</span>
            </a>
          </div>
        </div>

        {/* Smart ACWR & Periodization Auto-Triage Alert Banner */}
        <CoachClientTriageBanner
          clientId={id}
          clientName={client.full_name ?? 'Client'}
          acwrRatio={triageSummary.acwrRatio ?? acwrData.acwrRatio}
          acwrZone={triageSummary.acwrZone ?? acwrData.acwrZone}
          readinessScore={triageSummary.readinessScore}
          suggestedAction={triageSummary.suggestedPeriodizationAction ?? null}
          suggestedLabel={triageSummary.suggestedActionLabel}
          primaryReason={triageSummary.primaryReason}
        />

        {/* Client Onboarding & Progression Stepper Control Center */}
        <CoachOnboardingProgressionCard
          profile={progressionProfile}
          activeTab={activeTab}
          rawClient={client}
          rawIntake={intakeFormResult.data}
          rawProfile={fitnessProfileResult.data}
          rawAssessment={nasmAssessmentsResult.data?.[0] ?? null}
          rawPlan={latestPlansResult.data?.[0] ?? null}
          rawSessions={sessions ?? []}
          rawPackages={packages ?? []}
          rawBodyComposition={bodyCompositionResult.data ?? null}
        />

        {/* 4-Pillar Categorized Workspace Hub Navigator */}
        <CoachClientHubNavigator
          clientId={id}
          activeTab={activeTab}
          clientName={client.full_name ?? 'Client'}
          currentStageTab={progressionProfile.nextAction.tab}
          currentStageNumber={progressionProfile.currentStageNumber}
          currentStageTitle={progressionProfile.currentStageTitle}
        />

        <div id="workspace-tab-content" style={{ scrollMarginTop: 90 }}>
          {activeTab === 'onboarding' && (
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(14,24,39,0.98) 0%, rgba(9,15,26,0.98) 100%)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 10,
                padding: '20px 24px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', margin: 0, letterSpacing: '0.04em' }}>
                    MEMBER ONBOARDING AND PROGRESS
                  </h2>
                  <p style={{ color: 'var(--gray)', fontSize: 13, margin: '4px 0 0' }}>
                    A 9-step path from your first check-in and movement screening to steady progress.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={progressionProfile.nextAction.href}
                    className="tactile-btn"
                    style={{
                      padding: '9px 16px',
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                      color: '#080E14',
                      fontWeight: 800,
                      fontSize: 12,
                      borderRadius: 6,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{progressionProfile.nextAction.label}</span>
                    <span>➔</span>
                  </a>
                </div>
              </div>
            </div>

            {/* AI Fast-Track Dual-Scanner & Program Studio */}
            <CoachAiFastTrackOnboardingStudio
              clientId={id}
              clientName={client.full_name ?? 'Member'}
              age={Number(fitnessProfileResult.data?.age) || 32}
              sex={(fitnessProfileResult.data?.sex as 'male' | 'female' | 'other') || 'male'}
              heightCm={Number(fitnessProfileResult.data?.height_cm) || 178}
              weightKg={Number(fitnessProfileResult.data?.weight_kg) || 80}
              fitnessGoal={fitnessProfileResult.data?.fitness_goal ?? 'Body Recomposition & Joint Longevity'}
              trainingDaysPerWeek={Number(fitnessProfileResult.data?.training_days_per_week) || 4}
              equipmentAccess={Array.isArray(fitnessProfileResult.data?.equipment_access) ? fitnessProfileResult.data.equipment_access : ['Commercial Gym']}
              cardioEquipmentAccess={Array.isArray(fitnessProfileResult.data?.cardio_equipment_access) ? fitnessProfileResult.data.cardio_equipment_access : []}
              injuriesLimitations={fitnessProfileResult.data?.injuries_limitations ?? null}
              contraindicationTags={medicalEvaluation.contraindicationTags}
              initialDexaScan={bodyCompositionResult.data ? {
                estimatedBodyFatPercent: Number(bodyCompositionResult.data.estimated_bodyfat_percent) || 20,
                confidenceIntervalPercent: 1.2,
                confidenceScore: Number(bodyCompositionResult.data.confidence_score) || 0.95,
                bodyDensity: 1.05,
                classification: (Number(bodyCompositionResult.data.estimated_bodyfat_percent) > 25 ? 'Elevated Fat Mass' : 'Fitness / Defined'),
                weightKg: Number(fitnessProfileResult.data?.weight_kg) || 80,
                weightLbs: Math.round((Number(fitnessProfileResult.data?.weight_kg) || 80) * 2.20462),
                fatMassKg: Math.round((Number(fitnessProfileResult.data?.weight_kg) || 80) * (Number(bodyCompositionResult.data.estimated_bodyfat_percent) / 100)),
                fatMassLbs: Math.round((Number(fitnessProfileResult.data?.weight_kg) || 80) * 2.20462 * (Number(bodyCompositionResult.data.estimated_bodyfat_percent) / 100)),
                leanBodyMassKg: Math.round((Number(fitnessProfileResult.data?.weight_kg) || 80) * (1 - Number(bodyCompositionResult.data.estimated_bodyfat_percent) / 100)),
                leanBodyMassLbs: Math.round((Number(fitnessProfileResult.data?.weight_kg) || 80) * 2.20462 * (1 - Number(bodyCompositionResult.data.estimated_bodyfat_percent) / 100)),
                skeletalMuscleMassKg: 34,
                skeletalMuscleMassLbs: 75,
                ffmi: 20.2,
                normalizedFfmi: 20.0,
                ffmiCategory: 'Average',
                visceralFatRisk: 'Low',
                androidGynoidRatio: 0.95,
                waistToHeightRatio: 0.48,
                cunninghamBmr: 1750,
                katchMcArdleBmr: 1720,
                maintenanceCaloriesTdee: 2500,
                estimatedCircumferencesCm: { waistNavelCm: 84, neckCm: 39, hipGluteCm: 98, chestCm: 100, thighCm: 56, bicepCm: 34 },
                waistToHipRatio: 0.86,
                landmarks: [],
                regionalBreakdown: [],
                photoQualityAssessment: { overallRating: 'optimal', framingScore: 90, lightingScore: 90, clothingOcclusionWarning: false, postureCompensationDetected: false, multiViewEnhanced: true },
                recompositionProjection: {
                  targetWeightKg: 78,
                  targetWeightLbs: 172,
                  targetBodyFatPercent: 15,
                  targetFatMassKg: 11.7,
                  targetFatMassLbs: 25.8,
                  fatToLoseKg: 5.4,
                  fatToLoseLbs: 12,
                  leanMassChangeKg: 0,
                  leanMassChangeLbs: 0,
                  estimatedWeeksToGoal: 12,
                  dailyCaloricTarget: 2100,
                  dailyProteinGrams: 160,
                  recommendedNasmPhase: 1,
                  phaseName: 'Phase 1: Stabilization Endurance',
                  weeklyDeficitOrSurplusCalories: -3500,
                  coachingDirectives: ['Preserve Lean Body Mass'],
                },
                methodDescription: bodyCompositionResult.data.method || 'DEXA 4C Vision Scan',
                coachSummaryNotes: 'DEXA calibrated scan on record.',
              } : null}
              initialPostureScan={nasmAssessmentsResult.data?.[0] ? {
                view: 'overhead_squat',
                landmarks: [],
                angles: [],
                detectedCompensations: Array.isArray(nasmAssessmentsResult.data[0].ohsa_findings)
                  ? nasmAssessmentsResult.data[0].ohsa_findings.map((f: unknown) => (typeof f === 'string' ? f : (f as { compensation?: string })?.compensation || ''))
                  : [],
                ohsaObservations: [],
                staticFindings: nasmAssessmentsResult.data[0].static_posture || [],
                syndromeDetected: 'Lower Crossed',
                cexPrescription: {
                  inhibit: (nasmAssessmentsResult.data[0].overactive_muscles || ['Gastrocnemius', 'TFL']).map((m: string) => ({ muscle: m, protocol: 'SMR 30-60s' })),
                  lengthen: (nasmAssessmentsResult.data[0].overactive_muscles || ['Hip Flexors']).map((m: string) => ({ muscle: m, protocol: 'Static Stretch 30s' })),
                  activate: (nasmAssessmentsResult.data[0].underactive_muscles || ['Gluteus Medius']).map((m: string) => ({ muscle: m, protocol: 'Isolated Activation 3x15' })),
                  integrate: [{ exercise: 'Ball Squat to Press', protocol: '3x12 (4/2/1 tempo)' }],
                },
                clinicalSummary: nasmAssessmentsResult.data[0].coach_summary_notes || 'Kinetic chain compensations identified.',
              } : null}
              currentOptPhase={latestPlansResult.data?.[0]?.nasm_opt_phase ?? 1}
            />

            {/* Detailed Stage-by-Stage Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
              {progressionProfile.stages.map(stage => (
                <div
                  key={stage.id}
                  style={{
                    background: 'var(--navy-mid)',
                    border: stage.state === 'completed'
                      ? '1px solid rgba(16,185,129,0.3)'
                      : stage.state === 'in_progress'
                      ? '1px solid rgba(212,160,23,0.4)'
                      : stage.state === 'blocked'
                      ? '1.5px solid #EF4444'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: stage.state === 'completed' ? '#10B981' : stage.state === 'in_progress' ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                          color: stage.state === 'completed' || stage.state === 'in_progress' ? '#080E14' : 'var(--white)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {stage.state === 'completed' ? '✓' : stage.stageNumber}
                      </span>
                      <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--white)', letterSpacing: '0.02em' }}>
                        {stage.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {stage.category === 'onboarding_phase' && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: 3,
                            background: stage.gate.status === 'authorized'
                              ? 'rgba(16,185,129,0.2)'
                              : stage.gate.status === 'blocked'
                              ? 'rgba(239,68,68,0.2)'
                              : stage.gate.status === 'awaiting_authorization'
                              ? 'rgba(212,160,23,0.2)'
                              : 'rgba(148,163,184,0.1)',
                            border: `1px solid ${stage.gate.status === 'authorized'
                              ? '#10B981'
                              : stage.gate.status === 'blocked'
                              ? '#EF4444'
                              : stage.gate.status === 'awaiting_authorization'
                              ? 'var(--gold)'
                              : 'rgba(148,163,184,0.3)'}`,
                            color: stage.gate.status === 'authorized'
                              ? '#34D399'
                              : stage.gate.status === 'blocked'
                              ? '#F87171'
                              : stage.gate.status === 'awaiting_authorization'
                              ? 'var(--gold-lt)'
                              : '#94A3B8',
                          }}
                        >
                          Gate: {stage.gate.status.replace('_', ' ')}
                        </span>
                      )}
                      <a
                        href={stage.actionHref}
                        style={{ fontSize: 11, color: 'var(--gold-lt)', textDecoration: 'none', fontWeight: 700 }}
                      >
                        Open ➔
                      </a>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 10px', lineHeight: 1.4 }}>
                    {stage.summary}
                  </p>

                  <div style={{ display: 'grid', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {stage.milestones.map(m => (
                      <div key={m.key} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11.5 }}>
                        <span style={{ color: m.completed ? '#10B981' : 'var(--gray)', fontWeight: 800 }}>
                          {m.completed ? '✓' : '○'}
                        </span>
                        <span style={{ color: m.completed ? 'var(--white)' : 'var(--gray-lt)' }}>
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            <div
              className="coach-client-info-grid"
              style={{
                background: 'var(--navy-mid)',
                border: '1px solid var(--navy-lt)',
                padding: 'clamp(16px, 3.5vw, 28px)',
                marginBottom: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: 16,
              }}
            >
              <div>
                <div style={infoLabelStyle}>Name</div>
                <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: 'var(--white)' }}>{client.full_name ?? '—'}</div>
              </div>
              <div>
                <div style={infoLabelStyle}>Email</div>
                <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14, color: 'var(--white)', overflowWrap: 'anywhere' }}>{client.email}</div>
              </div>
              <div>
                <div style={infoLabelStyle}>Phone</div>
                <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14, color: 'var(--white)', overflowWrap: 'anywhere' }}>{client.phone ?? '—'}</div>
              </div>
            </div>

            {/* Prominent Client Governance & Lifecycle Standing Card */}
            <CoachClientOverviewStatusCard
              clientId={id}
              clientName={client.full_name ?? 'Client'}
              currentStatus={clientStatus}
              statusReason={clientStatusReason}
              statusUpdatedAt={clientStatusUpdatedAt}
              auditEventCount={(lifecycleAuditLogsResult.data ?? []).length}
            />

            {/* Stage 3: Athlete Biometrics & Environmental Readiness Card */}
            <CoachAthleteVitalsEnvironmentalCard
              clientId={id}
              clientName={client.full_name ?? 'Member'}
              fitnessProfile={fitnessProfileResult.data}
              latestBodyComposition={bodyCompositionResult.data}
              preferredUnits={clientUnits}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 14, marginBottom: 24 }}>
              <SummaryCard label="Sessions Remaining" value={String(totalRemaining)} hint="Across all purchased packages" />
              <SummaryCard label="Saved Program" value={latestPlansResult.data?.[0] ? 'Yes' : 'No'} hint={latestPlansResult.data?.[0]?.name ?? 'No program accepted yet'} />
              <SummaryCard label="Session History" value={String((sessions ?? []).length)} hint="Booked sessions on record" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14, marginBottom: 24 }}>
              <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 16 }}>
                <p style={{ margin: 0, color: 'var(--gray)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Auto Week Summary</p>
                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--gray)', fontSize: 13 }}>Completed workouts</span><span style={{ color: 'var(--white)' }}>{weeklySummary.completedWorkouts}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--gray)', fontSize: 13 }}>Logged sets</span><span style={{ color: 'var(--white)' }}>{weeklySummary.totalSets}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--gray)', fontSize: 13 }}>Volume</span><span style={{ color: 'var(--white)' }}>{weeklyVolumeDisplay} {weeklyVolumeUnitLabel}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--gray)', fontSize: 13 }}>Avg RPE</span><span style={{ color: 'var(--white)' }}>{weeklySummary.avgRpe ?? '-'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--gray)', fontSize: 13 }}>Cardio</span><span style={{ color: 'var(--white)' }}>{weeklySummary.cardioSessions} session{weeklySummary.cardioSessions === 1 ? '' : 's'} / {weeklySummary.cardioMinutes} min</span></div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: 'var(--gray)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Phase Progression Suggestion</p>
                  <a href={`/coach/clients/${id}?tab=periodization`} style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Open Periodization →</a>
                </div>
                <div style={{ marginTop: 10, color: phaseSuggestion.tone === 'green' ? 'var(--success)' : phaseSuggestion.tone === 'red' ? 'var(--error)' : phaseSuggestion.tone === 'gold' ? 'var(--gold)' : 'var(--gray)', fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 24, letterSpacing: '0.04em' }}>
                  {phaseSuggestion.label}
                </div>
                <p style={{ margin: '8px 0 0', color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>{phaseSuggestion.body}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ color: 'var(--gray)', fontSize: 12 }}>
                    14d completion: {completionRate14d}%{avgRpe14d !== null ? ` • Avg RPE ${avgRpe14d}` : ''}
                  </span>
                  <a
                    href={`/coach/clients/${id}?tab=periodization`}
                    className="tactile-btn"
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(212,160,23,0.15)',
                      border: '1px solid var(--gold)',
                      borderRadius: 4,
                      color: 'var(--gold-lt)',
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Manage Phase ➔
                  </a>
                </div>
              </div>

              <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: 'var(--gray)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>NASM Movement Status</p>
                  <a href={`/coach/clients/${id}?tab=assessment`} style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Open Screen →</a>
                </div>
                {nasmAssessmentsResult.data?.[0] ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: 'var(--gold-lt)', fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 22 }}>
                      {nasmAssessmentsResult.data[0].ohsa_findings?.length ?? 0} Compensations
                    </div>
                    <p style={{ margin: '6px 0 0', color: 'var(--white)', fontSize: 13, lineHeight: 1.4 }}>
                      Last Screen: {new Date(nasmAssessmentsResult.data[0].assessment_date).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '4px 0 0', color: 'var(--gray)', fontSize: 12 }}>
                      Overactive: {(nasmAssessmentsResult.data[0].overactive_muscles ?? []).slice(0, 3).join(', ') || 'None'}
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: 'var(--gray)', fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 18 }}>
                      No Assessment On Record
                    </div>
                    <p style={{ margin: '6px 0 0', color: 'var(--gray)', fontSize: 13 }}>
                      Conduct OHSA and static postural screens to generate CEx routines.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <ProgressPhotoTimeline
                initialPhotos={signedProgressPhotos}
                title="Progress Photo Timeline"
                subtitle="Recent physique check-ins for coach review and AI DEXA scans."
                clientId={id}
                clientName={client.full_name ?? 'Member'}
                bodyFatInputs={{
                  sex: fitnessProfileResult.data?.sex,
                  heightCm: fitnessProfileResult.data?.height_cm,
                  weightKg: fitnessProfileResult.data?.weight_kg,
                  waistCm: fitnessProfileResult.data?.waist_cm,
                  neckCm: fitnessProfileResult.data?.neck_cm,
                  hipCm: fitnessProfileResult.data?.hip_cm,
                  age: fitnessProfileResult.data?.age,
                }}
                isCoachView
              />
            </div>

            <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
              <h2 style={sectionHeadingStyle}>Next Actions &amp; Workspace Launchers</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12, marginTop: 12 }}>
                <a
                  href={`/coach/clients/${id}?tab=assessment`}
                  className="tactile-btn"
                  style={{
                    padding: '14px 16px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gold-lt)', fontWeight: 800, fontSize: 13 }}>NASM Movement Screen</span>
                    <span style={{ color: 'var(--gold-lt)', fontSize: 12 }}>➔</span>
                  </div>
                  <span style={{ color: 'var(--gray)', fontSize: 12 }}>Record kinetic chain compensations and auto-generate 4-phase CEx warmups.</span>
                </a>

                <a
                  href={`/coach/clients/${id}?tab=program`}
                  className="tactile-btn"
                  style={{
                    padding: '14px 16px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gold-lt)', fontWeight: 800, fontSize: 13 }}>Program Workspace</span>
                    <span style={{ color: 'var(--gold-lt)', fontSize: 12 }}>➔</span>
                  </div>
                  <span style={{ color: 'var(--gray)', fontSize: 12 }}>Generate AI draft, calibrate exercise sets, and publish workout plan.</span>
                </a>

                <a
                  href={`/coach/clients/${id}/live`}
                  className="tactile-btn"
                  style={{
                    padding: '14px 16px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gold-lt)', fontWeight: 800, fontSize: 13 }}>Live Coaching HUD</span>
                    <span style={{ color: 'var(--gold-lt)', fontSize: 12 }}>➔</span>
                  </div>
                  <span style={{ color: 'var(--gray)', fontSize: 12 }}>Coach in real-time with visual tempo metronome and clinical SOAP notes.</span>
                </a>
              </div>
            </div>
          </>
        )}

        {(activeTab === 'program' || activeTab === 'periodization') && (
          <CoachProgramWorkspace
            clientId={id}
            clientName={client.full_name ?? 'Member'}
            latestPlan={latestPlansResult.data?.[0] ?? null}
            allPlans={latestPlansResult.data ?? []}
            latestAssessment={nasmAssessmentsResult.data?.[0] ?? null}
            templates={templatesResult.data ?? []}
            coachTemplates={coachTemplatesResult.data ?? []}
            exercises={exercisesResult.data ?? []}
            equipment={filteredEquipment}
            contraindicationNotes={contraindicationNotes}
            contraindicationTags={medicalEvaluation.contraindicationTags}
            injuriesLimitations={fitnessProfileResult.data?.injuries_limitations ?? null}
            medicalEvaluation={medicalEvaluation}
            readinessSummary={readinessSummary}
            initialEquipmentAccess={Array.isArray(fitnessProfileResult.data?.equipment_access)
              ? fitnessProfileResult.data.equipment_access
              : []}
            libraryEquipmentNames={filteredEquipment.map(item => String(item.name ?? '').trim()).filter(Boolean)}
            cardioEquipmentAccess={Array.isArray(fitnessProfileResult.data?.cardio_equipment_access)
              ? fitnessProfileResult.data.cardio_equipment_access
              : []}
            initialSessionsPerWeek={Number(fitnessProfileResult.data?.training_days_per_week ?? 0) || null}
            clientAge={Number(fitnessProfileResult.data?.age) || null}
            preferredTrainingDays={Array.isArray(fitnessProfileResult.data?.preferred_training_days)
              ? fitnessProfileResult.data.preferred_training_days
              : []}
          />
        )}

        {activeTab === 'assessment' && (
          <NasmAssessmentSuite
            clientId={id}
            clientName={client.full_name ?? client.email}
            clientAge={Number(fitnessProfileResult.data?.age) || 30}
            clientSex={(fitnessProfileResult.data?.sex as 'male' | 'female' | 'other') || 'other'}
            initialAssessments={(nasmAssessmentsResult.data ?? []) as NasmAssessmentRecord[]}
            initialSubTab={activeAssessmentSubTab}
          />
        )}

        {activeTab === 'commerce' && (
          <>
            <h2 style={sectionHeadingStyle}>Packages ({totalRemaining} sessions remaining)</h2>

            {!packages || packages.length === 0 ? (
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 14, color: 'var(--gray)', marginBottom: 40 }}>
                No packages purchased.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 40 }}>
                {packages.map(pkg => {
                  const isExpired = Boolean(pkg.expires_at && new Date(pkg.expires_at) <= now)
                  return (
                    <div
                      key={pkg.id}
                      className="coach-client-package-row"
                      style={{
                        background: isExpired ? 'rgba(239, 68, 68, 0.05)' : 'var(--navy-mid)',
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: isExpired ? 0.75 : 1,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--white)' }}>
                            {pkg.package_name}
                          </span>
                          {isExpired && (
                            <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 4, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.05em' }}>
                              EXPIRED
                            </span>
                          )}
                        </div>
                        <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                          Purchased {new Date(pkg.purchased_at).toLocaleDateString()}
                          {pkg.expires_at && (
                            <span> · {isExpired ? 'Expired' : 'Expires'} {new Date(pkg.expires_at).toLocaleDateString()}</span>
                          )}
                        </div>
                        {(pkg.source === 'comp' || pkg.discount_code) && (
                          <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                            {pkg.source === 'comp' ? 'Comp grant' : 'Paid package'}
                            {pkg.discount_code ? ` · Discount ${pkg.discount_code}` : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 24, color: isExpired ? 'var(--gray)' : 'var(--gold)' }}>
                          {isExpired ? 0 : pkg.sessions_remaining}
                        </span>
                        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: 'var(--gray)', marginLeft: 4 }}>
                          / {pkg.sessions_total}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <h2 style={sectionHeadingStyle}>Commerce Tools</h2>
            <CoachCommerceTools clientId={id} />
          </>
        )}

        {activeTab === 'periodization' && (
          <div style={{ marginBottom: 32 }}>
            <CoachPeriodizationCockpit
              clientId={id}
              clientName={client.full_name ?? 'Client'}
              clientGoal={fitnessProfileResult.data?.fitness_goal ?? latestPlansResult.data?.[0]?.goal ?? 'Body Recomposition & Maximal Power Output'}
              initialPlan={latestPlansResult.data?.[0]?.plan_json?.periodizationPlan ?? null}
            />
          </div>
        )}

        {activeTab === 'shield' && (
          <div style={{ marginBottom: 32 }}>
            <CoachLiabilityShield
              clientName={client.full_name ?? 'Client'}
              evaluation={medicalEvaluation}
              signedWaiverName={intakeFormResult.data?.consent_signature_name}
              signedAt={intakeFormResult.data?.consent_signed_at}
            />
          </div>
        )}

        {(activeTab === 'prescriptions' || activeTab === 'toolbox' || activeTab === 'supplements' || activeTab === 'cardio') && (
          <CoachPrescriptionsWorkspace
            clientId={id}
            clientName={client.full_name ?? 'Client'}
            clientAge={Number(fitnessProfileResult.data?.age) || 35}
            clientSex={(fitnessProfileResult.data?.sex as 'male' | 'female' | 'other') || 'male'}
            initialSubtab={
              rawSubTab === 'cardio' || resolvedSearchParams.tab === 'cardio'
                ? 'cardio'
                : rawSubTab === 'supplements' || resolvedSearchParams.tab === 'supplements'
                ? 'supplements'
                : 'toolboxes'
            }
          />
        )}

        {activeTab === 'sessions' && (
          <>
            <h2 style={sectionHeadingStyle}>Sessions ({(sessions ?? []).length})</h2>
            <ClientDetailClient
              clientId={id}
              sessions={sessions ?? []}
              clientName={client.full_name ?? 'Member'}
              packages={packages ?? []}
            />
          </>
        )}

        {activeTab === 'checkins' && (
          <>
            <h2 style={sectionHeadingStyle}>Weekly Check-Ins</h2>
            <CoachCheckinReview
              clientId={id}
              clientName={client.full_name ?? 'Member'}
              initialCheckins={weeklyCheckinsResult.data ?? []}
              acwrRatio={acwrData.acwrRatio}
              acwrZone={acwrData.acwrZone}
              acuteWorkloadUnits={acwrData.acuteWorkloadUnits}
              chronicWorkloadUnits={acwrData.chronicWorkloadUnits}
              readinessSummary={readinessSummary}
              weeklySummary={{
                ...weeklySummary,
                volumeDisplay: weeklyVolumeDisplay,
                volumeUnit: weeklyVolumeUnitLabel,
              }}
              recentLogs={workoutLogsResult.data?.slice(0, 10) ?? []}
              preferredUnits={clientUnits}
            />
          </>
        )}

        {activeTab === 'dossier' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={sectionHeadingStyle}>Weekly Progress Report</h2>
              <Link
                href={`/coach/clients/${id}/dossier`}
                className="tactile-btn"
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                  color: '#080E14',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)',
                }}
              >
                <GaaIcon name="crown" size={13} tone="inherit" />
                <span>Open printable progress report</span>
                <span>➔</span>
              </Link>
            </div>
            {athleteDossier ? (
              <ExecutiveSundayDossier
                athleteName={athleteClientName}
                optPhase={athletePlanPhase}
                dossier={athleteDossier}
                weekEndingDate={now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              />
            ) : (
              <div style={{ padding: 24, background: 'var(--navy-mid)', border: '1px solid var(--navy-lt)', borderRadius: 8, color: 'var(--gray)' }}>
                Loading weekly progress report...
              </div>
            )}
          </div>
        )}

        {activeTab === 'lifecycle' && (
          <div style={{ marginBottom: 32 }}>
            <CoachClientAuditTrail
              clientId={id}
              clientName={client.full_name ?? 'Client'}
              currentStatus={clientStatus}
              statusReason={clientStatusReason}
              statusUpdatedAt={clientStatusUpdatedAt}
              auditLogs={(lifecycleAuditLogsResult.data ?? []) as LifecycleAuditLogEntry[]}
            />
          </div>
        )}
        </div>
      </div>
    </main>
  )
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 16 }}>
      <p style={{ margin: 0, color: 'var(--gray)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
      <div style={{ marginTop: 8, color: 'var(--white)', fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 26 }}>{value}</div>
      <p style={{ margin: '8px 0 0', color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>{hint}</p>
    </div>
  )
}

const infoLabelStyle: React.CSSProperties = {
  fontFamily: 'Raleway, sans-serif',
  fontWeight: 600,
  fontSize: 11,
  color: 'var(--gray)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 4,
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
  fontWeight: 700,
  fontSize: 20,
  color: 'var(--white)',
  letterSpacing: '0.04em',
  marginBottom: 14,
}
