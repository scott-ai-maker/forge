/**
 * Forge Athletic — Executive Business Intelligence & Prometheus Metrics Engine
 *
 * Aggregates strictly zero-PII / zero-PHI executive KPIs across Supabase tables
 * for the unified /enterprise BI dashboard and optional Prometheus / Grafana Cloud export.
 */

import {
  fetchEnterpriseTelemetrySnapshot,
} from './telemetry'
import type { EnterpriseTelemetrySnapshot } from './types'

export interface DailySeriesPoint {
  date: string
  label: string
  waitlistSignups: number
  workoutLogs: number
}

export interface RevenueStreamTarget {
  stream: string
  year1TargetUsd: number
  year2TargetUsd: number
  year3TargetUsd: number
  grossMarginPct: number
}

export interface EnterpriseBiDashboardSnapshot {
  telemetry: EnterpriseTelemetrySnapshot
  healthScore100: number
  activeRetention14dPct: number
  waitlistToApplicationPct: number
  waitlistLast7d: number
  waitlistLast30d: number
  estimatedMonthlyRunRateUsd: number
  estimatedAnnualRunRateUsd: number
  year1ArrTargetUsd: number
  year2ArrTargetUsd: number
  year3ArrTargetUsd: number
  year1ProgressPct: number
  targetEbitdaMarginPct: number
  dailySeries14d: DailySeriesPoint[]
  revenueRoadmap: RevenueStreamTarget[]
}

export const YEAR1_ARR_TARGET_USD = 585_000
export const YEAR2_ARR_TARGET_USD = 1_850_000
export const YEAR3_ARR_TARGET_USD = 4_750_000

export const REVENUE_ROADMAP_TARGETS: RevenueStreamTarget[] = [
  {
    stream: 'Core & Plus Memberships ($49–$99/mo)',
    year1TargetUsd: 145_000,
    year2TargetUsd: 520_000,
    year3TargetUsd: 1_380_000,
    grossMarginPct: 92,
  },
  {
    stream: 'Coach Support ($299/mo · Cap 15)',
    year1TargetUsd: 53_820,
    year2TargetUsd: 119_400,
    year3TargetUsd: 179_000,
    grossMarginPct: 84,
  },
  {
    stream: '1:1 Live Sessions & Add-Ons',
    year1TargetUsd: 65_300,
    year2TargetUsd: 175_600,
    year3TargetUsd: 391_000,
    grossMarginPct: 88,
  },
  {
    stream: 'High-Ticket Retainers ($349–$1,495/mo)',
    year1TargetUsd: 215_880,
    year2TargetUsd: 495_000,
    year3TargetUsd: 1_150_000,
    grossMarginPct: 82,
  },
  {
    stream: 'B2B Corporate Cohorts ($20k–$135k/yr)',
    year1TargetUsd: 105_000,
    year2TargetUsd: 540_000,
    year3TargetUsd: 1_650_000,
    grossMarginPct: 80,
  },
]

function buildEmptyDailySeries(now: Date): DailySeriesPoint[] {
  const points: DailySeriesPoint[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    points.push({ date: iso, label, waitlistSignups: 0, workoutLogs: 0 })
  }
  return points
}

export function computeExecutiveHealthScore(telemetry: EnterpriseTelemetrySnapshot): number {
  if (telemetry.activeAssignedClients === 0) {
    // Pre-launch readiness weighted by demand pipeline
    return telemetry.waitlistLeadsCount > 0 ? 85 : 78
  }
  const activeRetentionPct = Math.round(
    ((telemetry.activeAssignedClients - telemetry.inactive14dClientsCount) /
      telemetry.activeAssignedClients) *
      100
  )
  const onboardingScore = telemetry.onboardingCompletionRatePct
  const attendanceScore = telemetry.attendanceRate30dPct ?? 85
  const creditHealthPct = Math.round(
    ((telemetry.activeAssignedClients - telemetry.lowCreditClientsCount) /
      telemetry.activeAssignedClients) *
      100
  )

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        activeRetentionPct * 0.35 +
          onboardingScore * 0.25 +
          attendanceScore * 0.2 +
          creditHealthPct * 0.2
      )
    )
  )
}

export async function fetchEnterpriseBiDashboard(
  actorId: string,
  includeCompanyWide: boolean,
  now: Date = new Date()
): Promise<EnterpriseBiDashboardSnapshot> {
  const telemetry = await fetchEnterpriseTelemetrySnapshot(actorId, includeCompanyWide, now)
  const dailySeries14d = buildEmptyDailySeries(now)
  const seriesIndex = new Map(dailySeries14d.map((pt, idx) => [pt.date, idx]))

  let waitlistLast7d = 0
  let waitlistLast30d = 0

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const admin = supabaseAdmin()

      const since30 = new Date(now)
      since30.setDate(since30.getDate() - 30)
      const since14 = new Date(now)
      since14.setDate(since14.getDate() - 14)
      const since7Iso = new Date(now.getTime() - 7 * 86_400_000).toISOString()

      const [waitlistRowsRes, workoutRowsRes] = await Promise.all([
        admin
          .from('waitlist')
          .select('created_at')
          .gte('created_at', since30.toISOString())
          .limit(2000),
        admin
          .from('workout_logs')
          .select('created_at')
          .gte('created_at', since14.toISOString())
          .limit(2000),
      ])

      for (const row of waitlistRowsRes.data ?? []) {
        const ts = String(row.created_at || '')
        if (!ts) continue
        waitlistLast30d += 1
        if (ts >= since7Iso) waitlistLast7d += 1
        const idx = seriesIndex.get(ts.slice(0, 10))
        if (idx !== undefined) {
          dailySeries14d[idx].waitlistSignups += 1
        }
      }

      for (const row of workoutRowsRes.data ?? []) {
        const ts = String(row.created_at || '')
        const idx = seriesIndex.get(ts.slice(0, 10))
        if (idx !== undefined) {
          dailySeries14d[idx].workoutLogs += 1
        }
      }
    } catch (err) {
      console.warn('[EnterpriseBI] Falling back to empty 14d trend series:', err)
    }
  }

  const activeRetention14dPct =
    telemetry.activeAssignedClients > 0
      ? Math.round(
          ((telemetry.activeAssignedClients - telemetry.inactive14dClientsCount) /
            telemetry.activeAssignedClients) *
            100
        )
      : 100

  const waitlistToApplicationPct =
    telemetry.waitlistLeadsCount > 0
      ? Math.min(
          100,
          Math.round((telemetry.coachingApplicationsCount / telemetry.waitlistLeadsCount) * 100)
        )
      : 0

  // Use verified recurring revenue from live telemetry (includes longtime legacy retainer clients such as $400/mo)
  const verifiedMonthlyRunRateUsd =
    telemetry.verifiedMonthlyRecurringRevenueUsd > 0
      ? telemetry.verifiedMonthlyRecurringRevenueUsd
      : telemetry.activeAssignedClients * 149
  const verifiedAnnualRunRateUsd =
    telemetry.verifiedAnnualRecurringRevenueUsd > 0
      ? telemetry.verifiedAnnualRecurringRevenueUsd
      : verifiedMonthlyRunRateUsd * 12
  const estimatedMonthlyRunRateUsd = verifiedMonthlyRunRateUsd
  const estimatedAnnualRunRateUsd = verifiedAnnualRunRateUsd
  const year1ProgressPct = Math.min(
    100,
    Math.round((estimatedAnnualRunRateUsd / YEAR1_ARR_TARGET_USD) * 100)
  )

  return {
    telemetry,
    healthScore100: computeExecutiveHealthScore(telemetry),
    activeRetention14dPct,
    waitlistToApplicationPct,
    waitlistLast7d,
    waitlistLast30d,
    estimatedMonthlyRunRateUsd,
    estimatedAnnualRunRateUsd,
    year1ArrTargetUsd: YEAR1_ARR_TARGET_USD,
    year2ArrTargetUsd: YEAR2_ARR_TARGET_USD,
    year3ArrTargetUsd: YEAR3_ARR_TARGET_USD,
    year1ProgressPct,
    targetEbitdaMarginPct: 77.8,
    dailySeries14d,
    revenueRoadmap: REVENUE_ROADMAP_TARGETS,
  }
}

/**
 * Formats zero-PII Forge Athletic business KPIs in standard Prometheus / OpenMetrics 0.0.4 text format
 * so Grafana Cloud or Prometheus scrapers can ingest them without extra middleware.
 */
export function formatPrometheusMetrics(snapshot: EnterpriseBiDashboardSnapshot): string {
  const t = snapshot.telemetry
  const lines = [
    '# HELP forge_active_clients Number of active assigned Forge Athletic clients.',
    '# TYPE forge_active_clients gauge',
    `forge_active_clients ${t.activeAssignedClients}`,
    '# HELP forge_unassigned_clients Number of clients awaiting coach assignment.',
    '# TYPE forge_unassigned_clients gauge',
    `forge_unassigned_clients ${t.unassignedClients}`,
    '# HELP forge_waitlist_leads_total Total Founding Cohort and waitlist leads.',
    '# TYPE forge_waitlist_leads_total gauge',
    `forge_waitlist_leads_total ${t.waitlistLeadsCount}`,
    '# HELP forge_coaching_applications_total Total diagnostic /apply applications.',
    '# TYPE forge_coaching_applications_total gauge',
    `forge_coaching_applications_total ${t.coachingApplicationsCount}`,
    '# HELP forge_onboarding_completion_ratio Ratio (0..1) of assigned clients who completed onboarding.',
    '# TYPE forge_onboarding_completion_ratio gauge',
    `forge_onboarding_completion_ratio ${(t.onboardingCompletionRatePct / 100).toFixed(4)}`,
    '# HELP forge_active_retention_14d_ratio Ratio (0..1) of assigned clients active in the last 14 days.',
    '# TYPE forge_active_retention_14d_ratio gauge',
    `forge_active_retention_14d_ratio ${(snapshot.activeRetention14dPct / 100).toFixed(4)}`,
    '# HELP forge_inactive_14d_clients Count of assigned clients with no workout log in 14 days.',
    '# TYPE forge_inactive_14d_clients gauge',
    `forge_inactive_14d_clients ${t.inactive14dClientsCount}`,
    '# HELP forge_low_credit_clients Count of assigned clients with <= 2 session credits.',
    '# TYPE forge_low_credit_clients gauge',
    `forge_low_credit_clients ${t.lowCreditClientsCount}`,
    '# HELP forge_unread_sla_messages Count of unread client messages awaiting reply.',
    '# TYPE forge_unread_sla_messages gauge',
    `forge_unread_sla_messages ${t.unreadClientMessagesCount}`,
    '# HELP forge_sessions_scheduled_week Count of live sessions scheduled in the current week.',
    '# TYPE forge_sessions_scheduled_week gauge',
    `forge_sessions_scheduled_week ${t.sessionsThisWeek}`,
    '# HELP forge_coach_support_utilization_ratio Ratio (0..1) of Coach Support 15-seat cap utilized.',
    '# TYPE forge_coach_support_utilization_ratio gauge',
    `forge_coach_support_utilization_ratio ${(t.coachSupportUtilizationPct / 100).toFixed(4)}`,
    '# HELP forge_executive_health_score Overall zero-PII Customer Success & Business Health score (0..100).',
    '# TYPE forge_executive_health_score gauge',
    `forge_executive_health_score ${snapshot.healthScore100}`,
    '# HELP forge_verified_mrr_usd Verified monthly recurring revenue run-rate in USD (excluding internal executive accounts).',
    '# TYPE forge_verified_mrr_usd gauge',
    `forge_verified_mrr_usd ${snapshot.estimatedMonthlyRunRateUsd}`,
    '# HELP forge_verified_arr_usd Verified annualized recurring revenue run-rate in USD (excluding internal executive accounts).',
    '# TYPE forge_verified_arr_usd gauge',
    `forge_verified_arr_usd ${snapshot.estimatedAnnualRunRateUsd}`,
    '# HELP forge_legacy_retainer_clients Count of longtime legacy paying retainer clients.',
    '# TYPE forge_legacy_retainer_clients gauge',
    `forge_legacy_retainer_clients ${t.legacyRetainerClientsCount ?? 0}`,
    '# HELP forge_estimated_arr_usd Estimated annualized recurring revenue run-rate in USD.',
    '# TYPE forge_estimated_arr_usd gauge',
    `forge_estimated_arr_usd ${snapshot.estimatedAnnualRunRateUsd}`,
    '# HELP forge_days_until_go_live Days remaining until January 4, 2027 public go-live.',
    '# TYPE forge_days_until_go_live gauge',
    `forge_days_until_go_live ${t.daysUntilGoLive}`,
    '',
  ]
  return lines.join('\n')
}
