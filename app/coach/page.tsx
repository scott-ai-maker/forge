import { redirect } from 'next/navigation'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  normalizeCoachFocusFilter,
  normalizeCoachDashboardTab,
  type CoachFocusFilter,
  type CoachDashboardTab,
} from '@/lib/validation'
import LogoutButton from '@/components/auth/LogoutButton'
import CoachClientAssignmentButton from '@/components/coach/CoachClientAssignmentButton'
import CoachInviteLinkCard from '@/components/coach/CoachInviteLinkCard'
import CoachClientPipeline from '@/components/coach/CoachClientPipeline'
import CoachAnalyticsDashboard from '@/components/coach/CoachAnalyticsDashboard'
import CoachTriageCockpit from '@/components/coach/CoachTriageCockpit'
import RagProgramGeneratorStudio from '@/components/coach/RagProgramGeneratorStudio'
import { evaluateClientTriage, calculateAcwrFromWorkoutLogs } from '@/lib/coach-triage'
import { evaluateClientOnboardingProgression, type ClientProgressionProfile } from '@/lib/coach-onboarding-progression'
import { type ClientStatus } from '@/lib/client-lifecycle'
import CoachOnboardingWorkflowStudio from '@/components/coach/CoachOnboardingWorkflowStudio'
import CoachLiveSessionLauncher, { AssignedClientLauncherItem } from '@/components/coach/CoachLiveSessionLauncher'
import SiteHeader from '@/components/ui/SiteHeader'
import { APP_VERSION } from '@/lib/app-version'

export const dynamic = 'force-dynamic'

type CoachPageSearchParams = Promise<{
  focus?: string | string[] | undefined
  tab?: string | string[] | undefined
  page?: string | string[] | undefined
}>

function formatPercent(value: number | null) {
  if (value === null) return 'N/A'
  return `${value}%`
}

function dedupeChips(chips: Array<{ label: string; tone: 'gold' | 'green' | 'gray' | 'red' }>) {
  const seen = new Set<string>()

  return chips.filter(chip => {
    if (seen.has(chip.label)) return false
    seen.add(chip.label)
    return true
  })
}

function buildCoachTabHref(tab: CoachDashboardTab, focus: CoachFocusFilter) {
  const params = new URLSearchParams()
  if (tab !== 'overview') params.set('tab', tab)
  if (focus !== 'all') params.set('focus', focus)
  const query = params.toString()
  return query ? `/coach?${query}` : '/coach'
}

function formatRelativeDaysLabel(value: string | null | undefined, now: Date) {
  if (!value) return 'No check-in'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'No check-in'

  const diffMs = now.getTime() - parsed.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function formatBodyfat(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A'
  return `${Math.round(value * 10) / 10}%`
}

export default async function CoachPage({ searchParams }: { searchParams: CoachPageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const selectedFocus = normalizeCoachFocusFilter(resolvedSearchParams.focus)
  const activeTab = normalizeCoachDashboardTab(resolvedSearchParams.tab)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const isMasterCoach = user.email?.toLowerCase() === 'scott.gordon72@outlook.com'
  const roleCheck = await supabaseAdmin()
    .from('clients')
    .select('role')
    .eq('id', user.id)
    .eq('role', 'coach')
    .maybeSingle()

  if (!roleCheck.data) {
    if (isMasterCoach) {
      await supabaseAdmin().from('clients').update({ role: 'coach' }).eq('id', user.id)
    } else {
      redirect('/dashboard')
    }
  }

  const coachInvitePath = `/auth/signup?coach=${encodeURIComponent(user.id)}`

  const admin = supabaseAdmin()

  // Pagination for assigned clients (improved: added limit to prevent N+1)
  const PAGE_SIZE = 20
  const pageParam =
    typeof resolvedSearchParams.page === 'string'
      ? Number.parseInt(resolvedSearchParams.page, 10)
      : 1
  const page = Math.max(1, pageParam)
  const offset = (page - 1) * PAGE_SIZE

  const { data: assignedClients } = await admin
    .from('clients')
    .select('id, email, full_name, role, designated_coach_id, status, status_reason, status_updated_at', { count: 'exact' })
    .eq('designated_coach_id', user.id)
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data: unassignedClients } = await admin
    .from('clients')
    .select('id, email, full_name, role, designated_coach_id, status, status_reason, status_updated_at')
    .is('designated_coach_id', null)
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .limit(10) // Limit unassigned clients shown

  const assignedClientIds = (assignedClients ?? []).map(client => client.id)

  const { data: packages } = assignedClientIds.length
    ? await admin
        .from('client_packages')
        .select('client_id, sessions_remaining, expires_at')
        .in('client_id', assignedClientIds)
    : { data: [] }

  // Time windows for operational metrics.
  const now = new Date()

  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)

  // Move back to Monday.
  const day = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const rolling30Start = new Date(now)
  rolling30Start.setDate(rolling30Start.getDate() - 30)

  const checkInWindowStart = new Date(now)
  checkInWindowStart.setDate(checkInWindowStart.getDate() - 14)

  const { data: weekSessions } = assignedClientIds.length
    ? await admin
        .from('sessions')
        .select('id, client_id, scheduled_at, status')
        .in('client_id', assignedClientIds)
        .gte('scheduled_at', weekStart.toISOString())
        .lt('scheduled_at', weekEnd.toISOString())
        .limit(1000) // Prevent unbounded query
    : { data: [] }

  const [
    { data: rollingSessions },
    { data: upcomingSessions },
    { data: fitnessProfiles },
    { data: recentWorkoutLogs },
    { data: unreadMessages },
    { data: recentSetLogs },
    { data: bodyAnalyses },
    { data: latestPlans },
    { data: clientIntakes },
    { data: clientAssessments },
    { data: recentWearables },
  ] = assignedClientIds.length
    ? await Promise.all([
        admin
          .from('sessions')
          .select('id, client_id, scheduled_at, status')
          .in('client_id', assignedClientIds)
          .gte('scheduled_at', rolling30Start.toISOString())
          .lt('scheduled_at', now.toISOString())
          .limit(1000),
        admin
          .from('sessions')
          .select('id, client_id, scheduled_at, status')
          .in('client_id', assignedClientIds)
          .eq('status', 'scheduled')
          .gte('scheduled_at', now.toISOString())
          .limit(1000),
        admin
          .from('fitness_profiles')
          .select('user_id, onboarding_completed_at, height_cm, weight_kg, fitness_goal, equipment_access, training_days_per_week')
          .in('user_id', assignedClientIds),
        admin
          .from('workout_logs')
          .select('id, user_id, created_at')
          .in('user_id', assignedClientIds)
          .gte('created_at', checkInWindowStart.toISOString())
          .limit(1000),
        admin
          .from('coach_client_messages')
          .select('id, client_id, sender_id, read_at')
          .eq('coach_id', user.id)
          .in('client_id', assignedClientIds)
          .is('read_at', null)
          .limit(500),
        admin
          .from('workout_set_logs')
          .select('id, user_id, session_date, reps, weight_kg, rpe, notes')
          .in('user_id', assignedClientIds)
          .gte('session_date', checkInWindowStart.toISOString().slice(0, 10))
          .limit(1000),
        admin
          .from('body_composition_analyses')
          .select('id, user_id, estimated_bodyfat_percent, created_at')
          .in('user_id', assignedClientIds)
          .order('created_at', { ascending: false })
          .limit(500),
        admin
          .from('workout_plans')
          .select('id, user_id, name, created_at, nasm_opt_phase, phase_name, plan_json')
          .in('user_id', assignedClientIds)
          .order('created_at', { ascending: false })
          .limit(500),
        admin
          .from('client_intake_forms')
          .select('user_id, parq_answers, parq_any_yes, consent_signature_name, consent_signed_at, medical_conditions')
          .in('user_id', assignedClientIds)
          .limit(500),
        admin
          .from('nasm_assessments')
          .select('id, client_id, assessment_date, ohsa_findings')
          .in('client_id', assignedClientIds)
          .limit(500),
        admin
          .from('athlete_wearable_metrics')
          .select('client_id, readiness_score, cns_stress_score, sample_date')
          .in('client_id', assignedClientIds)
          .order('sample_date', { ascending: false })
          .limit(500),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  // Build per-client remaining count (excluding expired packages)
  const remainingByClient: Record<string, number> = {}
  for (const pkg of packages ?? []) {
    if (pkg.expires_at && new Date(pkg.expires_at) <= now) {
      continue
    }
    remainingByClient[pkg.client_id] =
      (remainingByClient[pkg.client_id] ?? 0) + (pkg.sessions_remaining ?? 0)
  }

  // Build launcher clients list for 1:1 Live Video Studio
  const launcherClients: AssignedClientLauncherItem[] = (assignedClients ?? []).map(client => ({
    id: client.id,
    fullName: client.full_name || client.email?.split('@')[0] || 'Athlete',
    email: client.email || '',
    sessionsRemaining: remainingByClient[client.id] ?? 0,
  }))

  const recentCheckInsByClient = new Set((recentWorkoutLogs ?? []).map(log => log.user_id))
  const upcomingSessionsByClient = new Set((upcomingSessions ?? []).map(session => session.client_id))
  const weekSessionClientIds = new Set((weekSessions ?? []).map(session => session.client_id))
  const completedRolling30ClientIds = new Set(
    (rollingSessions ?? []).filter(session => session.status === 'completed').map(session => session.client_id)
  )
  const noShowRolling30ClientIds = new Set(
    (rollingSessions ?? []).filter(session => session.status === 'no_show').map(session => session.client_id)
  )
  const onboardingCompleteClientIds = new Set(
    (fitnessProfiles ?? []).filter(profile => profile.onboarding_completed_at).map(profile => profile.user_id)
  )
  const unreadMessageClientIds = new Set(
    (unreadMessages ?? []).filter(message => message.sender_id === message.client_id).map(message => message.client_id)
  )

  const totalClients = (assignedClients ?? []).length
  const weekCount = (weekSessions ?? []).length
  const weekCompletedCount = (weekSessions ?? []).filter(session => session.status === 'completed').length

  const attendanceBase = (rollingSessions ?? []).filter(
    session => session.status === 'completed' || session.status === 'no_show'
  ).length
  const completedRolling30 = (rollingSessions ?? []).filter(session => session.status === 'completed').length
  const noShowRolling30 = (rollingSessions ?? []).filter(session => session.status === 'no_show').length

  const attendanceRate = attendanceBase ? Math.round((completedRolling30 / attendanceBase) * 100) : null
  const noShowRate = attendanceBase ? Math.round((noShowRolling30 / attendanceBase) * 100) : null

  const onboardingCompleteCount = (fitnessProfiles ?? []).filter(profile => profile.onboarding_completed_at).length
  const onboardingCompletionRate = totalClients ? Math.round((onboardingCompleteCount / totalClients) * 100) : 0

  const lowCreditClientsCount = assignedClientIds.filter(clientId => (remainingByClient[clientId] ?? 0) <= 2).length
  const inactiveClientsCount = assignedClientIds.filter(clientId => !recentCheckInsByClient.has(clientId)).length
  const clientsWithoutUpcomingSessions = assignedClientIds.filter(clientId => !upcomingSessionsByClient.has(clientId)).length

  const lowCreditClientIds = new Set(assignedClientIds.filter(clientId => (remainingByClient[clientId] ?? 0) <= 2))
  const inactiveClientIds = new Set(assignedClientIds.filter(clientId => !recentCheckInsByClient.has(clientId)))
  const noUpcomingClientIds = new Set(assignedClientIds.filter(clientId => !upcomingSessionsByClient.has(clientId)))

  const unreadClientMessages = (unreadMessages ?? []).filter(message => message.sender_id === message.client_id).length

  const lastWorkoutLogAtByClient: Record<string, string | null> = {}
  for (const row of recentWorkoutLogs ?? []) {
    const current = lastWorkoutLogAtByClient[row.user_id]
    if (!current || row.created_at > current) {
      lastWorkoutLogAtByClient[row.user_id] = row.created_at
    }
  }

  const recentSetStatsByClient: Record<string, { sets: number; reps: number; volumeKg: number; rpeSum: number; rpeCount: number }> = {}
  for (const row of recentSetLogs ?? []) {
    const current = recentSetStatsByClient[row.user_id] ?? { sets: 0, reps: 0, volumeKg: 0, rpeSum: 0, rpeCount: 0 }
    current.sets += 1
    current.reps += Number(row.reps ?? 0)
    current.volumeKg += Number(row.reps ?? 0) * Number(row.weight_kg ?? 0)

    const rpe = Number(row.rpe ?? 0)
    if (Number.isFinite(rpe) && rpe > 0) {
      current.rpeSum += rpe
      current.rpeCount += 1
    }

    recentSetStatsByClient[row.user_id] = current
  }

  const latestBodyfatByClient: Record<string, number | null> = {}
  for (const row of bodyAnalyses ?? []) {
    if (latestBodyfatByClient[row.user_id] === undefined) {
      latestBodyfatByClient[row.user_id] = row.estimated_bodyfat_percent
    }
  }

  const latestPlanByClient: Record<string, { id?: string; name?: string; nasm_opt_phase?: number | null; phase_name?: string | null; created_at?: string | null; plan_json?: unknown }> = {}
  for (const row of latestPlans ?? []) {
    if (!latestPlanByClient[row.user_id]) {
      latestPlanByClient[row.user_id] = row
    }
  }

  const fitnessProfileByClient = Object.fromEntries(
    (fitnessProfiles ?? []).map(p => [p.user_id, p])
  )
  const intakeByClient = Object.fromEntries(
    (clientIntakes ?? []).map(i => [i.user_id, i])
  )
  const assessmentsByClient: Record<string, Array<{ id: string; assessment_date: string; ohsa_findings?: unknown[] }>> = {}
  for (const a of clientAssessments ?? []) {
    if (!assessmentsByClient[a.client_id]) assessmentsByClient[a.client_id] = []
    assessmentsByClient[a.client_id].push(a)
  }

  const progressionProfileByClient: Record<string, ClientProgressionProfile> = Object.fromEntries(
    (assignedClients ?? []).map(client => {
      const plan = latestPlanByClient[client.id]
      const profile = evaluateClientOnboardingProgression({
        clientId: client.id,
        clientName: client.full_name ?? 'Client',
        email: client.email,
        designatedCoachId: client.designated_coach_id,
        currentStatus: (client as { status?: ClientStatus }).status,
        packages: (packages ?? []).filter(p => p.client_id === client.id),
        intakeForm: intakeByClient[client.id] || null,
        fitnessProfile: fitnessProfileByClient[client.id] || null,
        assessments: assessmentsByClient[client.id] || [],
        latestPlan: plan ? {
          id: plan.id || 'plan',
          name: plan.name || 'Program',
          nasm_opt_phase: plan.nasm_opt_phase ?? 1,
          plan_json: plan.plan_json as { periodizationPlan?: unknown; sessions?: unknown[] } | null,
        } : null,
      })
      return [client.id, profile]
    })
  )

  const nextUpcomingSessionByClient: Record<string, string | null> = {}
  for (const row of upcomingSessions ?? []) {
    const current = nextUpcomingSessionByClient[row.client_id]
    if (!current || row.scheduled_at < current) {
      nextUpcomingSessionByClient[row.client_id] = row.scheduled_at
    }
  }

  const clientMetricsRows = (assignedClients ?? []).map(client => {
    const statsForClient = recentSetStatsByClient[client.id] ?? { sets: 0, reps: 0, volumeKg: 0, rpeSum: 0, rpeCount: 0 }
    const avgRpe = statsForClient.rpeCount > 0 ? Math.round((statsForClient.rpeSum / statsForClient.rpeCount) * 10) / 10 : null

    return {
      id: client.id,
      name: client.full_name ?? 'Unnamed client',
      lastWorkoutLogAt: lastWorkoutLogAtByClient[client.id] ?? null,
      sets14d: statsForClient.sets,
      reps14d: statsForClient.reps,
      volume14dLb: Math.round(statsForClient.volumeKg * 2.20462),
      avgRpe14d: avgRpe,
      bodyfat: latestBodyfatByClient[client.id] ?? null,
      active14d: recentCheckInsByClient.has(client.id),
    }
  })
    .sort((a, b) => {
      const aTs = a.lastWorkoutLogAt ? new Date(a.lastWorkoutLogAt).getTime() : 0
      const bTs = b.lastWorkoutLogAt ? new Date(b.lastWorkoutLogAt).getTime() : 0
      return bTs - aTs
    })

  const stats = [
    { key: 'all', label: 'Active Clients', value: totalClients, hint: 'Current assigned roster', cta: 'View roster' },
    {
      key: 'sessions-this-week',
      label: 'Sessions This Week',
      value: weekCount,
      hint: `${weekCompletedCount} completed`,
      cta: 'View scheduled clients',
    },
    {
      key: 'attendance-30d',
      label: 'Attendance (30d)',
      value: formatPercent(attendanceRate),
      hint: 'Completed vs no-show',
      cta: 'View attended clients',
    },
    {
      key: 'no-show-30d',
      label: 'No-Show Rate (30d)',
      value: formatPercent(noShowRate),
      hint: 'Lower is better',
      cta: 'View no-show clients',
    },
    {
      key: 'onboarding-complete',
      label: 'Onboarding Complete',
      value: `${onboardingCompletionRate}%`,
      hint: `${onboardingCompleteCount}/${totalClients}`,
      cta: 'View onboarded clients',
    },
    {
      key: 'unread-messages',
      label: 'Unread Client Messages',
      value: unreadClientMessages,
      hint: 'Needs coach reply',
      cta: 'View waiting clients',
    },
  ]

  const attentionItems = [
    { key: 'low-credits', label: 'Low Session Credits (<=2)', value: lowCreditClientsCount },
    { key: 'inactive', label: 'No Workout Check-In (14d)', value: inactiveClientsCount },
    { key: 'no-upcoming', label: 'No Upcoming Session', value: clientsWithoutUpcomingSessions },
  ]

  const focusLabelByKey: Record<CoachFocusFilter, string> = {
    all: 'All assigned clients',
    'sessions-this-week': 'Clients with sessions this week',
    'attendance-30d': 'Clients with completed sessions in the last 30 days',
    'no-show-30d': 'Clients with no-shows in the last 30 days',
    'onboarding-complete': 'Clients with completed onboarding',
    'unread-messages': 'Clients waiting on a coach reply',
    'low-credits': 'Clients with low session credits',
    inactive: 'Clients missing workout check-ins',
    'no-upcoming': 'Clients without upcoming sessions',
  }

  const filteredAssignedClients = (assignedClients ?? []).filter(client => {
    if (selectedFocus === 'sessions-this-week') return weekSessionClientIds.has(client.id)
    if (selectedFocus === 'attendance-30d') return completedRolling30ClientIds.has(client.id)
    if (selectedFocus === 'no-show-30d') return noShowRolling30ClientIds.has(client.id)
    if (selectedFocus === 'onboarding-complete') return onboardingCompleteClientIds.has(client.id)
    if (selectedFocus === 'unread-messages') return unreadMessageClientIds.has(client.id)
    if (selectedFocus === 'low-credits') return lowCreditClientIds.has(client.id)
    if (selectedFocus === 'inactive') return inactiveClientIds.has(client.id)
    if (selectedFocus === 'no-upcoming') return noUpcomingClientIds.has(client.id)
    return true
  })

  const chipStyles = {
    gold: { background: 'rgba(212,160,23,0.15)', color: 'var(--gold)' },
    green: { background: 'rgba(72,187,120,0.15)', color: 'var(--success)' },
    gray: { background: 'rgba(138,153,170,0.15)', color: 'var(--gray)' },
    red: { background: 'rgba(255,61,87,0.15)', color: 'var(--error)' },
  } as const

  const statusChipsByClient = Object.fromEntries(
    (assignedClients ?? []).map(client => {
      const baseChips: Array<{ label: string; tone: keyof typeof chipStyles }> = []

      const clientStatus = (client as { status?: string }).status
      if (clientStatus === 'paused') baseChips.push({ label: 'Paused', tone: 'gold' })
      else if (clientStatus === 'inactive') baseChips.push({ label: 'Inactive', tone: 'red' })
      else if (clientStatus === 'archived') baseChips.push({ label: 'Archived', tone: 'gray' })
      else baseChips.push({ label: 'Active', tone: 'green' })

      if (weekSessionClientIds.has(client.id)) baseChips.push({ label: 'This week', tone: 'gold' })
      if (completedRolling30ClientIds.has(client.id)) baseChips.push({ label: 'Attended 30d', tone: 'green' })
      if (noShowRolling30ClientIds.has(client.id)) baseChips.push({ label: 'No-show 30d', tone: 'red' })
      if (onboardingCompleteClientIds.has(client.id)) baseChips.push({ label: 'Onboarded', tone: 'green' })
      if (unreadMessageClientIds.has(client.id)) baseChips.push({ label: 'Unread message', tone: 'gold' })
      if (lowCreditClientIds.has(client.id)) baseChips.push({ label: 'Low credits', tone: 'gold' })
      if (inactiveClientIds.has(client.id)) baseChips.push({ label: 'No check-in 14d', tone: 'gray' })
      if (noUpcomingClientIds.has(client.id)) baseChips.push({ label: 'No upcoming', tone: 'gray' })

      const prog = progressionProfileByClient[client.id]
      if (prog) {
        baseChips.push({
          label: `Stage ${prog.currentStageNumber}: ${prog.currentStageShortTitle}`,
          tone: prog.isFullyOnboarded
            ? 'green'
            : prog.currentStageNumber === 2 && prog.isBlockedByMedicalClearance
            ? 'red'
            : 'gold',
        })
      }

      let priorityChip: { label: string; tone: keyof typeof chipStyles } | null = null

      if (selectedFocus === 'sessions-this-week' && weekSessionClientIds.has(client.id)) {
        priorityChip = { label: 'Matches: This week', tone: 'gold' }
      } else if (selectedFocus === 'attendance-30d' && completedRolling30ClientIds.has(client.id)) {
        priorityChip = { label: 'Matches: Attended 30d', tone: 'green' }
      } else if (selectedFocus === 'no-show-30d' && noShowRolling30ClientIds.has(client.id)) {
        priorityChip = { label: 'Matches: No-show 30d', tone: 'red' }
      } else if (selectedFocus === 'onboarding-complete' && onboardingCompleteClientIds.has(client.id)) {
        priorityChip = { label: 'Matches: Onboarded', tone: 'green' }
      } else if (selectedFocus === 'unread-messages' && unreadMessageClientIds.has(client.id)) {
        priorityChip = { label: 'Matches: Unread message', tone: 'gold' }
      } else if (selectedFocus === 'low-credits' && lowCreditClientIds.has(client.id)) {
        priorityChip = { label: 'Matches: Low credits', tone: 'gold' }
      } else if (selectedFocus === 'inactive' && inactiveClientIds.has(client.id)) {
        priorityChip = { label: 'Matches: No check-in', tone: 'gray' }
      } else if (selectedFocus === 'no-upcoming' && noUpcomingClientIds.has(client.id)) {
        priorityChip = { label: 'Matches: No upcoming', tone: 'gray' }
      }

      const chips = dedupeChips(priorityChip ? [priorityChip, ...baseChips] : baseChips).slice(0, 4)

      return [client.id, chips]
    })
  ) as Record<string, Array<{ label: string; tone: keyof typeof chipStyles }>>

  const birdsEyeRows = (assignedClients ?? []).map(client => ({
    id: client.id,
    name: client.full_name ?? 'Unnamed client',
    href: `/coach/clients/${client.id}`,
    nextSessionAt: nextUpcomingSessionByClient[client.id] ?? null,
    lastWorkoutLogAt: lastWorkoutLogAtByClient[client.id] ?? null,
    credits: remainingByClient[client.id] ?? 0,
    unread: unreadMessageClientIds.has(client.id),
    inactive: inactiveClientIds.has(client.id),
    planPhase: latestPlanByClient[client.id]?.nasm_opt_phase ?? null,
  }))
    .sort((a, b) => {
      const aScore = Number(a.unread) * 4 + Number(a.inactive) * 3 + Number(a.credits <= 2) * 2 + Number(!a.nextSessionAt)
      const bScore = Number(b.unread) * 4 + Number(b.inactive) * 3 + Number(b.credits <= 2) * 2 + Number(!b.nextSessionAt)
      return bScore - aScore
    })

  const pipelineColumns = [
    {
      key: 'intake',
      title: 'Intake',
      tone: 'gray' as const,
      clients: (unassignedClients ?? []).map(client => ({
        id: client.id,
        name: client.full_name ?? 'Unnamed client',
        email: client.email,
        href: '/coach?tab=intake',
        hint: 'Unassigned and waiting for coach claim.',
      })),
    },
    {
      key: 'onboarding',
      title: 'Onboarding & Vitals',
      tone: 'gold' as const,
      clients: (assignedClients ?? [])
        .filter(client => {
          const prog = progressionProfileByClient[client.id]
          return prog && prog.currentStageNumber <= 3 && !prog.isFullyOnboarded
        })
        .map(client => {
          const prog = progressionProfileByClient[client.id]
          return {
            id: client.id,
            name: client.full_name ?? 'Unnamed client',
            email: client.email,
            href: `/coach/clients/${client.id}`,
            hint: prog ? `${prog.currentStageShortTitle} (${prog.onboardingProgressPercent}%)` : 'In onboarding',
          }
        }),
    },
    {
      key: 'movement-testing',
      title: 'Movement Testing',
      tone: 'gold' as const,
      clients: (assignedClients ?? [])
        .filter(client => {
          const prog = progressionProfileByClient[client.id]
          return prog && prog.currentStageNumber === 4
        })
        .map(client => ({
          id: client.id,
          name: client.full_name ?? 'Unnamed client',
          email: client.email,
          href: `/coach/clients/${client.id}?tab=assessment`,
          hint: 'Ready for OHSA & static screen',
        })),
    },
    {
      key: 'program-build',
      title: 'Program Build & Kickoff',
      tone: 'gold' as const,
      clients: (assignedClients ?? [])
        .filter(client => {
          const prog = progressionProfileByClient[client.id]
          return prog && (prog.currentStageNumber === 5 || prog.currentStageNumber === 6 || prog.currentStageNumber === 7) && !prog.isFullyOnboarded
        })
        .map(client => {
          const prog = progressionProfileByClient[client.id]
          const targetTab = prog?.currentStageNumber === 7 ? 'sessions' : 'program'
          return {
            id: client.id,
            name: client.full_name ?? 'Unnamed client',
            email: client.email,
            href: `/coach/clients/${client.id}?tab=${targetTab}`,
            hint: prog ? prog.currentStageShortTitle : 'Program build & kickoff pending',
          }
        }),
    },
    {
      key: 'active',
      title: 'Active Maintenance & Compliance',
      tone: 'green' as const,
      clients: (assignedClients ?? [])
        .filter(client => {
          const prog = progressionProfileByClient[client.id]
          const isAtRisk = inactiveClientIds.has(client.id) || lowCreditClientIds.has(client.id) || !upcomingSessionsByClient.has(client.id)
          return prog && prog.isFullyOnboarded && !isAtRisk
        })
        .map(client => {
          const prog = progressionProfileByClient[client.id]
          return {
            id: client.id,
            name: client.full_name ?? 'Unnamed client',
            email: client.email,
            href: `/coach/clients/${client.id}`,
            hint: prog ? `Active · ${prog.currentStageShortTitle}` : 'Active standing',
          }
        }),
    },
    {
      key: 'at-risk',
      title: 'At Risk',
      tone: 'red' as const,
      clients: (assignedClients ?? [])
        .filter(client => inactiveClientIds.has(client.id) || lowCreditClientIds.has(client.id) || !upcomingSessionsByClient.has(client.id))
        .map(client => ({
          id: client.id,
          name: client.full_name ?? 'Unnamed client',
          email: client.email,
          href: !upcomingSessionsByClient.has(client.id)
            ? `/coach/clients/${client.id}?tab=sessions`
            : `/coach/clients/${client.id}`,
          hint: [
            inactiveClientIds.has(client.id) ? 'No workout check-in in 14d' : null,
            lowCreditClientIds.has(client.id) ? 'Low session credits' : null,
            !upcomingSessionsByClient.has(client.id) ? 'No upcoming session' : null,
          ]
            .filter(Boolean)
            .join(' · '),
        })),
    },
  ]

  const clientMetricsSnapshotSection = (
    <div className="coach-metrics-snapshot-section" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', letterSpacing: '0.04em', margin: 0 }}>
          CLIENT METRICS SNAPSHOT
        </h2>
        <span style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--gray)', fontSize: 12 }}>
          Last 14 days of workout activity
        </span>
      </div>

      {clientMetricsRows.length === 0 ? (
        <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--navy-lt)', padding: '20px 24px' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--gray)', margin: 0 }}>No assigned clients yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Desktop Table Header */}
          <div className="coach-metrics-snapshot-header" style={{ background: 'var(--navy)', padding: '10px 18px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
            {['Client', 'Last log', 'Sets 14d', 'Reps 14d', 'Volume 14d (lb)', 'Avg RPE', 'Body fat', ''].map(h => (
              <span key={h} style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 600, fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Client Rows / Mobile Cards */}
          {clientMetricsRows.map(row => (
            <div
              key={row.id}
              className="coach-metrics-snapshot-card"
              style={{
                background: 'var(--navy-mid)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                padding: '12px 16px',
              }}
            >
              {/* Desktop View Row */}
              <div className="coach-metrics-snapshot-desktop-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>{row.name}</span>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 11, color: row.active14d ? 'var(--success)' : 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {row.active14d ? 'Active in 14d' : 'Needs follow-up'}
                  </span>
                </div>
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13, color: 'var(--gray)' }}>
                  {formatRelativeDaysLabel(row.lastWorkoutLogAt, now)}
                </span>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>{row.sets14d}</span>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>{row.reps14d}</span>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>{row.volume14dLb}</span>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 18, color: 'var(--white)' }}>{row.avgRpe14d ? row.avgRpe14d : '-'}</span>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 18, color: 'var(--white)' }}>{formatBodyfat(row.bodyfat)}</span>
                <a href={`/coach/clients/${row.id}`} style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>
                  Open →
                </a>
              </div>

              {/* Mobile View Card (Compact High-Density 2-Row Layout) */}
              <div className="coach-metrics-snapshot-mobile-card" style={{ display: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>{row.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: row.active14d ? '#34D399' : '#FBBF24', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                        {row.active14d ? '● Active' : '○ Follow-up'}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</span>
                      <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                        {formatRelativeDaysLabel(row.lastWorkoutLogAt, now)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`/coach/clients/${row.id}`}
                    style={{
                      fontFamily: 'Raleway, sans-serif',
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'var(--gold-lt)',
                      textDecoration: 'none',
                      background: 'rgba(212,160,23,0.12)',
                      border: '1px solid rgba(212,160,23,0.3)',
                      padding: '4px 10px',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    Open →
                  </a>
                </div>

                {/* Metrics 5-Item Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 4,
                    background: 'rgba(0,0,0,0.3)',
                    padding: '6px 8px',
                    borderRadius: 4,
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Sets</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>{row.sets14d}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Reps</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>{row.reps14d}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Vol (lb)</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>{row.volume14dLb}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>RPE</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>{row.avgRpe14d ?? '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Bodyfat</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>{formatBodyfat(row.bodyfat)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const setsByClient: Record<string, Record<string, unknown>[]> = {}
  for (const set of recentSetLogs ?? []) {
    if (!setsByClient[set.user_id]) setsByClient[set.user_id] = []
    setsByClient[set.user_id].push(set)
  }

  const logsByClient: Record<string, Record<string, unknown>[]> = {}
  for (const log of recentWorkoutLogs ?? []) {
    if (!logsByClient[log.user_id]) logsByClient[log.user_id] = []
    logsByClient[log.user_id].push(log)
  }

  const latestWearableByClient: Record<string, { readiness_score?: number | null; cns_stress_score?: number | null }> = {}
  for (const w of recentWearables ?? []) {
    if (!latestWearableByClient[w.client_id]) {
      latestWearableByClient[w.client_id] = w
    }
  }

  const triageSummaries = (assignedClients ?? []).map(client => {
    const lastLogAt = lastWorkoutLogAtByClient[client.id]
    const daysInactive = lastLogAt ? Math.max(0, Math.floor((now.getTime() - new Date(lastLogAt).getTime()) / (1000 * 60 * 60 * 24))) : 14
    const stats = recentSetStatsByClient[client.id]
    const adherence = stats && stats.sets > 0 ? Math.min(100, Math.round((stats.sets / 36) * 100)) : 30
    const optPhase = latestPlanByClient[client.id]?.nasm_opt_phase ?? 1

    const clientSets = setsByClient[client.id] ?? []
    const clientLogs = logsByClient[client.id] ?? []
    const acwrData = calculateAcwrFromWorkoutLogs(clientLogs, clientSets)

    const prog = progressionProfileByClient[client.id]
    const hasMedicalRedFlag = Boolean(prog?.isBlockedByMedicalClearance)

    // Check if any recent set log notes reported pain, tweaks, or joint discomfort
    let reportedPainInLogs = false
    for (const s of clientSets) {
      const noteText = String((s as Record<string, unknown>).notes || '').toLowerCase()
      if (noteText.includes('pain') || noteText.includes('hurt') || noteText.includes('tweak') || noteText.includes('sharp') || noteText.includes('strain')) {
        reportedPainInLogs = true
        break
      }
    }

    const hasPendingVideoCritique = Boolean(unreadMessageClientIds.has(client.id))

    const clientWearable = latestWearableByClient[client.id]
    const athleteReadinessScore = typeof clientWearable?.readiness_score === 'number' && Number.isFinite(clientWearable.readiness_score)
      ? clientWearable.readiness_score
      : typeof clientWearable?.cns_stress_score === 'number' && Number.isFinite(clientWearable.cns_stress_score)
      ? clientWearable.cns_stress_score
      : null

    return evaluateClientTriage({
      clientId: client.id,
      clientName: client.full_name ?? 'Client',
      email: client.email,
      daysSinceLastCheckin: daysInactive,
      readinessScore: athleteReadinessScore,
      completionRate14d: adherence,
      hasMedicalRedFlag,
      reportedPainInLogs,
      hasPendingVideoCritique,
      currentOptPhase: optPhase,
      acwrRatio: acwrData.acwrRatio,
      acuteWorkloadUnits: acwrData.acuteWorkloadUnits,
      chronicWorkloadUnits: acwrData.chronicWorkloadUnits,
      hasAchievedOverload: adherence >= 90 && (stats?.sets ?? 0) >= 24,
    })
  })

  return (
    <main className="coach-page" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Coach Console"
        links={[
          { href: '/coach', label: 'Triage' },
          { href: '/coach#assigned-clients', label: 'Athletes' },
          { href: '/corporate/proposal', label: 'Corporate B2B' },
          { href: '/dashboard/dossier', label: 'Sunday Dossier' },
          { href: '/coach#live-studio', label: 'Live Studio' },
          { href: '/coach/settings', label: 'Operations' },
        ]}
        actions={<LogoutButton />}
      />

      <div className="coach-content" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(14px, 2.5vw, 24px) clamp(8px, 1.8vw, 16px)', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontWeight: 700,
            fontSize: 'clamp(1.8rem, 4.5vw, 2.4rem)',
            color: 'var(--white)',
            letterSpacing: '0.04em',
            marginBottom: 20,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          COACH DASHBOARD
        </h1>

        <CoachInviteLinkCard invitePath={coachInvitePath} />

        <div className="responsive-tabs-scroll" style={{ display: 'flex', gap: 8, paddingBottom: 6, marginBottom: 20 }}>
          {[
            { key: 'overview' as const, label: 'Overview', icon: null },
            { key: 'onboarding' as const, label: 'Onboarding Progression', icon: 'clipboard' as GaaIconName },
            { key: 'architect' as const, label: 'Master NASM AI Coach', icon: 'brain' as GaaIconName },
            { key: 'triage' as const, label: 'Coach Triage Cockpit', icon: 'lightning' as GaaIconName },
            { key: 'roster' as const, label: 'Assigned Roster', icon: null },
            { key: 'intake' as const, label: 'Unassigned Intake', icon: null },
            { key: 'pipeline' as const, label: 'Pipeline', icon: null },
            { key: 'analytics' as const, label: 'Analytics', icon: null },
          ].map(tab => {
            const active = activeTab === tab.key
            return (
              <a
                key={tab.key}
                href={buildCoachTabHref(tab.key, selectedFocus)}
                className="tactile-btn"
                style={{
                  padding: '9px 14px',
                  border: active ? '1px solid rgba(212,160,23,0.6)' : '1px solid rgba(255,255,255,0.12)',
                  background: active ? 'rgba(212,160,23,0.18)' : 'var(--navy-mid)',
                  color: active ? 'var(--gold-lt)' : 'var(--white)',
                  textDecoration: 'none',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {tab.icon && <GaaIcon name={tab.icon} size={13} tone={active ? 'gold' : 'slate'} />}
                <span>{tab.label}</span>
              </a>
            )
          })}
        </div>

        {activeTab === 'onboarding' && (
          <div style={{ marginBottom: 40 }}>
            <CoachOnboardingWorkflowStudio initialProfiles={Object.values(progressionProfileByClient)} />
          </div>
        )}

        {activeTab === 'architect' && (
          <div style={{ marginBottom: 40 }}>
            <RagProgramGeneratorStudio clientName="Coach Program Studio" />
          </div>
        )}

        {activeTab === 'triage' && (
          <div style={{ marginBottom: 40 }}>
            <CoachTriageCockpit initialClients={triageSummaries} />
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* ── 1:1 Live Video Studio & Movement Screen Launcher ── */}
            <CoachLiveSessionLauncher assignedClients={launcherClients} />

            {/* ── Coach Gordon Quick Access Banner ── */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                padding: '16px 20px',
                marginBottom: 20,
                background: 'linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(13,27,42,0.95) 100%)',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GaaIcon name="brain" size={22} tone="gold" />
                  <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: 'var(--white)', letterSpacing: '0.04em' }}>
                    Coach Gordon · Master NASM AI Head Coach Studio
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', color: 'var(--gold-lt)', fontSize: 13, fontFamily: 'Raleway, sans-serif' }}>
                  20+ Yrs Master CPT · Full OPT™ Periodization Engine · 100% Verified NASM Edge CDN Media
                </p>
              </div>
              <a
                href="/coach?tab=architect"
                className="tactile-btn"
                style={{
                  background: 'linear-gradient(135deg, #D4A017, #B8860B)',
                  color: '#080E18',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '10px 20px',
                  borderRadius: 4,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(212,160,23,0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="lightning" size={13} tone="inherit" />
                <span>Open Coach Gordon Studio</span>
                <GaaIcon name="external-link" size={12} tone="inherit" />
              </a>
            </div>

            {/* ── Client Onboarding & Testing Progression Workflow Quick Banner ── */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                padding: '16px 20px',
                marginBottom: 28,
                background: 'linear-gradient(135deg, rgba(14,24,39,0.98) 0%, rgba(9,15,26,0.98) 100%)',
                border: '1px solid rgba(212,160,23,0.35)',
                borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GaaIcon name="clipboard" size={20} tone="gold" />
                  <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: 'var(--white)', letterSpacing: '0.04em' }}>
                    Client Onboarding &amp; Testing Progression Workflow
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(212,160,23,0.18)', border: '1px solid var(--gold)', color: 'var(--gold-lt)', fontSize: 10, fontWeight: 800 }}>
                    9-Stage Continuum
                  </span>
                </div>
                <p style={{ color: 'var(--gray)', fontSize: 12.5, margin: '4px 0 0', maxWidth: 700 }}>
                  Active roster progression across PAR-Q+ liability screening, NASM movement testing (OHSA), 12-week OPT™ periodization, AI program drafting, and weekly triage.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href="/coach?tab=onboarding"
                  className="tactile-btn"
                  style={{
                    background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                    color: '#080E14',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '10px 18px',
                    borderRadius: 4,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(212,160,23,0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GaaIcon name="clipboard" size={13} tone="inherit" />
                  <span>Open Onboarding Workflow Studio</span>
                  <span>➔</span>
                </a>
              </div>
            </div>

            {/* ── Enterprise & Intelligence Boardroom Suite Quick Banner ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Card 1: Fortune 500 Corporate Proposal Generator */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(14,24,39,0.98) 0%, rgba(9,15,26,0.98) 100%)',
                  border: '1px solid rgba(212,160,23,0.35)',
                  borderRadius: 8,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <GaaIcon name="crown" size={20} tone="gold" />
                    <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 17, color: 'var(--white)', letterSpacing: '0.04em' }}>
                      Fortune 500 Corporate Proposal Studio
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(212,160,23,0.18)', border: '1px solid var(--gold)', color: 'var(--gold-lt)', fontSize: 10, fontWeight: 800 }}>
                      v{APP_VERSION}
                    </span>
                  </div>
                  <p style={{ color: 'var(--gray)', fontSize: 12.5, margin: '0 0 14px', lineHeight: 1.5 }}>
                    Interactive multi-seat B2B pricing modeler (5 to 50+ executive seats), conservative cognitive ROI projections ($273k/yr), dual-mode Clean Ivory boardroom PDF export, and shareable link generation.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="/corporate/proposal"
                    className="tactile-btn"
                    style={{
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                      color: '#080E14',
                      fontFamily: 'Raleway, sans-serif',
                      fontWeight: 800,
                      fontSize: 11.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '8px 16px',
                      borderRadius: 4,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Launch Proposal Studio</span>
                    <span>➔</span>
                  </a>
                  <a
                    href="/corporate"
                    className="tactile-btn"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--white)',
                      fontFamily: 'Raleway, sans-serif',
                      fontWeight: 700,
                      fontSize: 11.5,
                      letterSpacing: '0.06em',
                      padding: '8px 14px',
                      borderRadius: 4,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Pitch Page</span>
                  </a>
                </div>
              </div>

              {/* Card 2: Executive Sunday Intelligence Dossier */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(14,24,39,0.98) 0%, rgba(9,15,26,0.98) 100%)',
                  border: '1px solid rgba(56,189,248,0.35)',
                  borderRadius: 8,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <GaaIcon name="clipboard" size={20} tone="cyan" />
                    <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 17, color: 'var(--white)', letterSpacing: '0.04em' }}>
                      Executive Sunday Intelligence Dossier
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', color: '#38BDF8', fontSize: 10, fontWeight: 800 }}>
                      v1.33.0
                    </span>
                  </div>
                  <p style={{ color: 'var(--gray)', fontSize: 12.5, margin: '0 0 14px', lineHeight: 1.5 }}>
                    Clinical S.O.A.P. notes, acute-to-chronic workload (ACWR) telemetry, 5-plane kinetic distribution radar, and dual-mode boardroom print engine for high-touch Sunday deliverables.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="/dashboard/dossier"
                    className="tactile-btn"
                    style={{
                      background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                      color: '#080E14',
                      fontFamily: 'Raleway, sans-serif',
                      fontWeight: 800,
                      fontSize: 11.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '8px 16px',
                      borderRadius: 4,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Open Sunday Dossier</span>
                    <span>➔</span>
                  </a>
                  <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                    Tip: Available per-athlete in Check-Ins
                  </span>
                </div>
              </div>
            </div>

            {/* ── Glanceable Practice Telemetry & Operations Grid ── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>
                  Practice Telemetry &amp; Operations
                </span>
                <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 600 }}>
                  Active Cycle Status
                </span>
              </div>

              <div
                className="luxury-snap-rail luxury-snap-rail-responsive"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: 8,
                }}
              >
                {stats.map(stat => (
                  <a
                    key={stat.label}
                    href={stat.key === 'all' ? '/coach?tab=roster#assigned-clients' : `/coach?tab=roster&focus=${stat.key}#assigned-clients`}
                    className="tactile-btn luxury-snap-item"
                    style={{
                      background: selectedFocus === stat.key ? 'rgba(212,160,23,0.18)' : 'var(--navy-mid)',
                      border: selectedFocus === stat.key ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: '16px 18px',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 36, color: 'var(--gold)', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
                    <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: 11.5, color: 'var(--gray)' }}>{stat.hint}</div>
                  </a>
                ))}
              </div>
            </div>

            {/* ── Attention Items Snap Rail ── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="alert-triangle" size={13} tone="amber" />
                  <span>Priority Action Required</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                  Auto-Triage Radar
                </span>
              </div>

              <div
                className="luxury-snap-rail luxury-snap-rail-responsive"
                style={{
                  background: 'rgba(212,160,23,0.04)',
                  border: '1px solid rgba(212,160,23,0.2)',
                  borderRadius: 10,
                  padding: 8,
                }}
              >
                {attentionItems.map(item => (
                  <a
                    key={item.label}
                    href={`/coach?tab=roster&focus=${item.key}#assigned-clients`}
                    className="tactile-btn luxury-snap-item"
                    style={{
                      background: selectedFocus === item.key ? 'rgba(212,160,23,0.18)' : 'var(--navy-mid)',
                      border: selectedFocus === item.key ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: '14px 16px',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 28, lineHeight: 1, color: item.value > 0 ? 'var(--gold)' : 'var(--gray)' }}>{item.value}</div>
                    <div style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                    <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: 11, color: 'var(--gold-lt)' }}>Review clients →</div>
                  </a>
                ))}
              </div>
            </div>

            {/* ── Quick Birds-Eye Flight Deck ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', letterSpacing: '0.04em', margin: 0 }}>
                  BIRDS-EYE FLIGHT DECK (TOP PRIORITY ATHLETES)
                </h2>
                <a
                  href="/coach?tab=triage"
                  className="tactile-btn"
                  style={{
                    fontSize: 11.5,
                    color: 'var(--gold-lt)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>Open Coach Triage Cockpit →</span>
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
                {birdsEyeRows.length === 0 ? (
                  <div style={{ background: 'var(--navy-mid)', padding: '24px', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: 'var(--gray)' }}>No assigned clients yet.</p>
                  </div>
                ) : (
                  birdsEyeRows.slice(0, 8).map(row => (
                    <div
                      key={row.id}
                      style={{
                        background: 'var(--navy-mid)',
                        padding: '14px 20px',
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--white)', fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 14 }}>{row.name}</div>
                        <div style={{ color: row.inactive ? 'var(--error)' : 'var(--gray)', fontSize: 11.5 }}>{formatRelativeDaysLabel(row.lastWorkoutLogAt, now)} last check-in</div>
                      </div>
                      <div style={{ color: 'var(--gray)', fontSize: 12 }}>{row.nextSessionAt ? new Date(row.nextSessionAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No upcoming session'}</div>
                      <div style={{ color: row.credits <= 2 ? 'var(--gold)' : 'var(--white)', fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700, fontSize: 20 }}>{row.credits} <span style={{ fontSize: 12, fontFamily: 'Raleway, sans-serif', fontWeight: 400 }}>credits</span></div>
                      <div style={{ color: row.planPhase ? 'var(--gold-lt)' : 'var(--gray)', fontSize: 12, fontWeight: 700 }}>{row.planPhase ? `Phase ${String(row.planPhase)}` : 'No plan'}</div>
                      <a href={row.href} className="sgf-button sgf-button-secondary" style={{ padding: '4px 10px', fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {row.unread ? (
                          <>
                            <span>Reply</span>
                            <GaaIcon name="message" size={11} tone="inherit" />
                          </>
                        ) : (
                          'Open Profile →'
                        )}
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {clientMetricsSnapshotSection}
          </>
        )}

        {activeTab === 'roster' && (
          <>
            <h2
              id="assigned-clients"
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontWeight: 700,
                fontSize: 22,
                color: 'var(--white)',
                letterSpacing: '0.04em',
                marginBottom: 16,
              }}
            >
              ASSIGNED CLIENTS
            </h2>

            {clientMetricsSnapshotSection}

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13, color: 'var(--gray)' }}>
                Showing: {focusLabelByKey[selectedFocus]}
              </span>
              {selectedFocus !== 'all' ? (
                <a
                  href="/coach?tab=roster#assigned-clients"
                  style={{
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'var(--gold)',
                    textDecoration: 'none',
                  }}
                >
                  Clear filter
                </a>
              ) : null}
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13, color: 'var(--gray)' }}>
                {filteredAssignedClients.length} client{filteredAssignedClients.length === 1 ? '' : 's'}
              </span>
            </div>

            {!assignedClients || assignedClients.length === 0 ? (
          <div
            style={{
              background: 'var(--navy-mid)',
              border: '1px solid var(--navy-lt)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 15, color: 'var(--gray)', margin: 0 }}>
              No clients assigned to you yet.
            </p>
          </div>
            ) : filteredAssignedClients.length === 0 ? (
          <div
            style={{
              background: 'var(--navy-mid)',
              border: '1px solid var(--navy-lt)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 15, color: 'var(--gray)', margin: 0 }}>
              No assigned clients match this filter.
            </p>
          </div>
            ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            {/* Header row */}
            <div
              className="coach-table-header"
              style={{
                background: 'var(--navy)',
                padding: '12px 24px',
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr 1fr',
                gap: 16,
              }}
            >
              {['Name', 'Email', 'Sessions Left', ''].map(h => (
                <span
                  key={h}
                  style={{
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    fontSize: 11,
                    color: 'var(--gray)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {filteredAssignedClients.map(client => (
                <div
                  key={client.id}
                  className="coach-table-row"
                  style={{
                    background: 'var(--navy-mid)',
                    padding: '16px 24px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr auto auto',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 600,
                        fontSize: 14,
                        color: 'var(--white)',
                      }}
                    >
                      {client.full_name ?? '—'}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      {(statusChipsByClient[client.id] ?? []).map(chip => {
                        const chipStyle = chipStyles[chip.tone]

                        return (
                          <span
                            key={chip.label}
                            style={{
                              fontFamily: 'Raleway, sans-serif',
                              fontWeight: 700,
                              fontSize: 10,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              padding: '4px 8px',
                              borderRadius: 999,
                              background: chipStyle.background,
                              color: chipStyle.color,
                              lineHeight: 1,
                            }}
                          >
                            {chip.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: 14,
                      color: 'var(--gray)',
                    }}
                  >
                    {client.email}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontWeight: 700,
                      fontSize: 20,
                      color: 'var(--gold)',
                    }}
                  >
                    {remainingByClient[client.id] ?? 0}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <a
                      href={`/coach/clients/${client.id}?tab=sessions`}
                      className="tactile-btn"
                      title="Schedule or view sessions"
                      style={{
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 700,
                        fontSize: 12,
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--navy-lt)',
                        color: 'var(--white)',
                        borderRadius: 5,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <GaaIcon name="calendar" size={13} tone="gold" />
                      <span>Schedule</span>
                    </a>
                    <a
                      href={`/coach/clients/${client.id}/live`}
                      className="tactile-btn"
                      style={{
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 800,
                        fontSize: 12,
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.25) 0%, rgba(212, 160, 23, 0.1) 100%)',
                        border: '1.5px solid var(--gold)',
                        color: 'var(--gold-lt)',
                        borderRadius: 5,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 8px rgba(212, 160, 23, 0.2)',
                      }}
                    >
                      <GaaIcon name="camera" size={13} tone="gold" />
                      <span>Train Live →</span>
                    </a>
                    <a
                      href={`/coach/clients/${client.id}`}
                      style={{
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--gold)',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View →
                    </a>
                  </div>
                  <CoachClientAssignmentButton clientId={client.id} mode="release" />
                </div>
              ))}
          </div>
            )}
          </>
        )}

        {activeTab === 'intake' && (
          <>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontWeight: 700,
                fontSize: 22,
                color: 'var(--white)',
                letterSpacing: '0.04em',
                marginTop: 40,
                marginBottom: 16,
              }}
            >
              UNASSIGNED CLIENTS
            </h2>
            <p
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 13,
                color: 'var(--gray)',
                marginTop: 0,
                marginBottom: 14,
              }}
            >
              Assigning a client sends a welcome email automatically. To resend later, open the client and use Commerce Tools.
            </p>

            {!unassignedClients || unassignedClients.length === 0 ? (
          <div
            style={{
              background: 'var(--navy-mid)',
              border: '1px solid var(--navy-lt)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 15, color: 'var(--gray)', margin: 0 }}>
              No unassigned clients available.
            </p>
          </div>
            ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="coach-table-header"
              style={{
                background: 'var(--navy)',
                padding: '12px 24px',
                display: 'grid',
                gridTemplateColumns: '2fr 2fr auto',
                gap: 16,
              }}
            >
              {['Name', 'Email', ''].map(h => (
                <span
                  key={h}
                  style={{
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    fontSize: 11,
                    color: 'var(--gray)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {unassignedClients.map(client => (
              <div
                key={client.id}
                className="coach-table-row"
                style={{
                  background: 'var(--navy-mid)',
                  padding: '16px 24px',
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr auto',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--white)',
                  }}
                >
                  {client.full_name ?? '—'}
                </span>
                <span
                  style={{
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: 14,
                    color: 'var(--gray)',
                  }}
                >
                  {client.email}
                </span>
                <CoachClientAssignmentButton clientId={client.id} mode="assign" />
              </div>
            ))}
          </div>
            )}
          </>
        )}

        {activeTab === 'pipeline' && (
          <>
            <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 22, color: 'var(--white)', letterSpacing: '0.04em', marginBottom: 12 }}>
              CLIENT PIPELINE
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--gray)', fontSize: 13, marginTop: 0, marginBottom: 14 }}>
              Operational stages from intake through active delivery and at-risk follow-up.
            </p>
            <CoachClientPipeline columns={pipelineColumns} />
          </>
        )}

        {activeTab === 'analytics' && <CoachAnalyticsDashboard />}
      </div>
    </main>
  )
}
