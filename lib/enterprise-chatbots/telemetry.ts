/**
 * Forge Athletic — Zero-PII Aggregated Enterprise Telemetry Loader
 *
 * Computes strictly numeric business KPIs from Supabase for the Founding Principal's
 * Executive Advisory Board chatbots. NEVER retrieves or forwards client names,
 * emails, medical records, PAR-Q+ answers, or private message text.
 */

import {
  getLegacyRetainerClient,
  isEnterpriseLeaderEmail,
  isInternalTeamOrDemoAccountEmail,
} from '@/lib/authz'
import {
  calculateTimeRemaining,
  getGoLiveDate,
  isPublicRegistrationOpen,
  LAUNCH_CAMPAIGN_INFO,
} from '@/lib/launch-config'
import type { EnterpriseTelemetrySnapshot } from './types'

const CONSERVATIVE_STANDARD_CLIENT_MRR_USD = 149

export function buildBaselineTelemetrySnapshot(now: Date = new Date()): EnterpriseTelemetrySnapshot {
  const goLiveDate = getGoLiveDate()
  const countdown = calculateTimeRemaining(goLiveDate, now)
  const isLive = isPublicRegistrationOpen(now)

  return {
    generatedAt: now.toISOString(),
    dataSource: 'baseline_model',
    launchMode: isLive ? 'public_live' : 'prelaunch_waitlist',
    daysUntilGoLive: countdown.days,
    goLiveDateFormatted: LAUNCH_CAMPAIGN_INFO.dateFormatted,
    activeAssignedClients: 0,
    unassignedClients: 0,
    onboardingCompletedCount: 0,
    onboardingCompletionRatePct: 0,
    sessionsThisWeek: 0,
    attendanceRate30dPct: null,
    lowCreditClientsCount: 0,
    inactive14dClientsCount: 0,
    unreadClientMessagesCount: 0,
    waitlistLeadsCount: 0,
    coachingApplicationsCount: 0,
    coachSupportCap: LAUNCH_CAMPAIGN_INFO.activeCoachSupportRosterCap,
    coachSupportUtilizationPct: 0,
    verifiedMonthlyRecurringRevenueUsd: 0,
    verifiedAnnualRecurringRevenueUsd: 0,
    legacyRetainerClientsCount: 0,
    executiveTeamAccountsCount: 0,
  }
}

export async function fetchEnterpriseTelemetrySnapshot(
  coachId: string,
  includeCompanyWideAggregates: boolean,
  now: Date = new Date()
): Promise<EnterpriseTelemetrySnapshot> {
  const baseline = buildBaselineTelemetrySnapshot(now)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return baseline
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const admin = supabaseAdmin()

    const weekStart = new Date(now)
    weekStart.setHours(0, 0, 0, 0)
    const day = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const rolling30Start = new Date(now)
    rolling30Start.setDate(rolling30Start.getDate() - 30)

    const inactiveWindowStart = new Date(now)
    inactiveWindowStart.setDate(inactiveWindowStart.getDate() - 14)

    // Query client rows for server-side classification ONLY.
    // Emails are NEVER emitted in telemetry payloads or sent to external LLMs.
    const assignedQuery = includeCompanyWideAggregates
      ? admin
          .from('clients')
          .select('id, email, status')
          .not('designated_coach_id', 'is', null)
          .eq('role', 'client')
          .limit(500)
      : admin
          .from('clients')
          .select('id, email, status')
          .eq('designated_coach_id', coachId)
          .eq('role', 'client')
          .limit(500)

    const [assignedRes, unassignedRes, waitlistRes, applicationsRes] = await Promise.all([
      assignedQuery,
      includeCompanyWideAggregates
        ? admin
            .from('clients')
            .select('id, email')
            .is('designated_coach_id', null)
            .eq('role', 'client')
            .limit(500)
        : Promise.resolve({ data: [] as Array<{ id: string; email: string | null }> }),
      includeCompanyWideAggregates
        ? admin.from('waitlist').select('id', { count: 'exact', head: true })
        : Promise.resolve({ count: 0 }),
      includeCompanyWideAggregates
        ? admin.from('coaching_applications').select('id', { count: 'exact', head: true })
        : Promise.resolve({ count: 0 }),
    ])

    const allAssignedRows = (assignedRes.data ?? []) as Array<{
      id: string
      email: string | null
      status?: string | null
    }>
    const allUnassignedRows = (unassignedRes.data ?? []) as Array<{
      id: string
      email: string | null
    }>

    // Exclude internal executive leadership (Scott, Lisa) and QA/demo accounts
    // from paying client counts, Coach Support 15-seat cap, and churn alerts.
    const executiveTeamAccountsCount = [...allAssignedRows, ...allUnassignedRows].filter(row =>
      isEnterpriseLeaderEmail(row.email)
    ).length

    const payingAssignedRows = allAssignedRows.filter(
      row => !isInternalTeamOrDemoAccountEmail(row.email) && row.status !== 'inactive'
    )
    const unassignedPayingRows = allUnassignedRows.filter(
      row => !isInternalTeamOrDemoAccountEmail(row.email)
    )

    const assignedClientIds = payingAssignedRows.map(row => row.id)
    const activeAssignedClients = assignedClientIds.length
    const unassignedClients = unassignedPayingRows.length
    const waitlistLeadsCount = waitlistRes.count ?? 0
    const coachingApplicationsCount = applicationsRes.count ?? 0

    let legacyRetainerClientsCount = 0
    let verifiedMonthlyRecurringRevenueUsd = 0
    for (const row of payingAssignedRows) {
      const legacy = getLegacyRetainerClient(row.email)
      if (legacy) {
        legacyRetainerClientsCount += 1
        verifiedMonthlyRecurringRevenueUsd += legacy.monthlyRateUsd
      } else {
        verifiedMonthlyRecurringRevenueUsd += CONSERVATIVE_STANDARD_CLIENT_MRR_USD
      }
    }
    const verifiedAnnualRecurringRevenueUsd = verifiedMonthlyRecurringRevenueUsd * 12

    let onboardingCompletedCount = 0
    let sessionsThisWeek = 0
    let attendanceRate30dPct: number | null = null
    let lowCreditClientsCount = 0
    let inactive14dClientsCount = 0
    let unreadClientMessagesCount = 0

    if (assignedClientIds.length > 0) {
      const [
        packagesRes,
        weekSessionsRes,
        rollingSessionsRes,
        profilesRes,
        recentWorkoutLogsRes,
        unreadMessagesRes,
      ] = await Promise.all([
        admin
          .from('client_packages')
          .select('client_id, sessions_remaining, expires_at')
          .in('client_id', assignedClientIds)
          .limit(1000),
        admin
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .in('client_id', assignedClientIds)
          .gte('scheduled_at', weekStart.toISOString())
          .lt('scheduled_at', weekEnd.toISOString()),
        admin
          .from('sessions')
          .select('status')
          .in('client_id', assignedClientIds)
          .gte('scheduled_at', rolling30Start.toISOString())
          .lt('scheduled_at', now.toISOString())
          .limit(1000),
        admin
          .from('fitness_profiles')
          .select('user_id, onboarding_completed_at')
          .in('user_id', assignedClientIds)
          .limit(500),
        admin
          .from('workout_logs')
          .select('user_id')
          .in('user_id', assignedClientIds)
          .gte('created_at', inactiveWindowStart.toISOString())
          .limit(2000),
        admin
          .from('coach_client_messages')
          .select('client_id, sender_id')
          .eq('coach_id', coachId)
          .in('client_id', assignedClientIds)
          .is('read_at', null)
          .limit(500),
      ])

      const remainingByClient: Record<string, number> = {}
      for (const pkg of packagesRes.data ?? []) {
        if (pkg.expires_at && new Date(pkg.expires_at) <= now) continue
        remainingByClient[pkg.client_id] =
          (remainingByClient[pkg.client_id] ?? 0) + Number(pkg.sessions_remaining ?? 0)
      }
      lowCreditClientsCount = assignedClientIds.filter(
        id => (remainingByClient[id] ?? 0) <= 2
      ).length

      sessionsThisWeek = weekSessionsRes.count ?? 0

      const rollingRows = rollingSessionsRes.data ?? []
      const completed = rollingRows.filter(s => s.status === 'completed').length
      const noShow = rollingRows.filter(s => s.status === 'no_show').length
      const attendanceBase = completed + noShow
      attendanceRate30dPct =
        attendanceBase > 0 ? Math.round((completed / attendanceBase) * 100) : null

      onboardingCompletedCount = (profilesRes.data ?? []).filter(
        p => Boolean(p.onboarding_completed_at)
      ).length

      const activeLogUsers = new Set((recentWorkoutLogsRes.data ?? []).map(l => l.user_id))
      inactive14dClientsCount = assignedClientIds.filter(id => !activeLogUsers.has(id)).length

      unreadClientMessagesCount = (unreadMessagesRes.data ?? []).filter(
        m => m.sender_id === m.client_id
      ).length
    }

    const onboardingCompletionRatePct =
      activeAssignedClients > 0
        ? Math.round((onboardingCompletedCount / activeAssignedClients) * 100)
        : 0

    const coachSupportCap = LAUNCH_CAMPAIGN_INFO.activeCoachSupportRosterCap
    const coachSupportUtilizationPct = Math.min(
      100,
      Math.round((activeAssignedClients / Math.max(1, coachSupportCap)) * 100)
    )

    return {
      ...baseline,
      dataSource: 'live_supabase',
      activeAssignedClients,
      unassignedClients,
      onboardingCompletedCount,
      onboardingCompletionRatePct,
      sessionsThisWeek,
      attendanceRate30dPct,
      lowCreditClientsCount,
      inactive14dClientsCount,
      unreadClientMessagesCount,
      waitlistLeadsCount,
      coachingApplicationsCount,
      coachSupportCap,
      coachSupportUtilizationPct,
      verifiedMonthlyRecurringRevenueUsd,
      verifiedAnnualRecurringRevenueUsd,
      legacyRetainerClientsCount,
      executiveTeamAccountsCount,
    }
  } catch (err) {
    console.warn('[EnterpriseTelemetry] Falling back to baseline snapshot:', err)
    return baseline
  }
}

export function formatTelemetryForPrompt(snapshot: EnterpriseTelemetrySnapshot): string {
  const mrr = snapshot.verifiedMonthlyRecurringRevenueUsd ?? 0
  const arr = snapshot.verifiedAnnualRecurringRevenueUsd ?? mrr * 12
  const legacyCount = snapshot.legacyRetainerClientsCount ?? 0
  const execCount = snapshot.executiveTeamAccountsCount ?? 0

  return `LIVE AGGREGATED FORGE ATHLETIC TELEMETRY (ZERO PII / ZERO PHI — ${snapshot.dataSource === 'live_supabase' ? 'Live Database' : 'Baseline Model'}):
- Launch Status: ${snapshot.launchMode === 'prelaunch_waitlist' ? `Pre-Launch Waitlist Mode (${snapshot.daysUntilGoLive} days until ${snapshot.goLiveDateFormatted} go-live)` : 'Public Registration LIVE'}
- Active Paying Clients: ${snapshot.activeAssignedClients} (includes ${legacyCount} longtime legacy retainer client(s) paying $400/mo; Coach Support roster cap: ${snapshot.coachSupportCap} · ${snapshot.coachSupportUtilizationPct}% utilization; excludes ${execCount} internal executive team accounts with indefinite all-features access)
- Verified Recurring Revenue: $${mrr.toLocaleString()}/mo MRR ($${arr.toLocaleString()}/yr ARR)
- Unassigned / Intake Queue Clients: ${snapshot.unassignedClients}
- Onboarding Completion: ${snapshot.onboardingCompletedCount}/${snapshot.activeAssignedClients} (${snapshot.onboardingCompletionRatePct}%)
- Live Sessions Scheduled This Week: ${snapshot.sessionsThisWeek}
- 30-Day Session Attendance Rate: ${snapshot.attendanceRate30dPct === null ? 'No completed baseline yet' : `${snapshot.attendanceRate30dPct}%`}
- Retention Signals: ${snapshot.inactive14dClientsCount} inactive (14d), ${snapshot.lowCreditClientsCount} low session credits (<=2), ${snapshot.unreadClientMessagesCount} unread client messages
- Top-of-Funnel Demand: ${snapshot.waitlistLeadsCount} Waitlist / Founding Cohort leads, ${snapshot.coachingApplicationsCount} Coaching Applications`
}
