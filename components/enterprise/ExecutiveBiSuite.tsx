'use client'

import React, { useCallback, useState } from 'react'
import Image from 'next/image'
import {
  Activity,
  BarChart3,
  BookOpen,
  Calendar,
  Download,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Users,
} from 'lucide-react'
import ExecutiveGrowthCommandCenter from '@/components/enterprise/ExecutiveGrowthCommandCenter'
import {
  EXECUTIVE_BOT_ORDER,
  EXECUTIVE_BOT_PROFILES,
  FORGE_LEADERSHIP_TEAM,
  PUBLIC_CONCIERGE_PROFILE,
} from '@/lib/enterprise-chatbots/knowledge'
import type { EnterpriseBiDashboardSnapshot } from '@/lib/enterprise-chatbots/metrics'

type SuiteTabId = 'kpi' | 'advisors' | 'playbook'

export interface ExecutiveBiSuiteProps {
  initialSnapshot: EnterpriseBiDashboardSnapshot
  viewerPersona: 'scott' | 'lisa'
}

const WEEKLY_CADENCE = [
  {
    day: 'Monday · 8:00–8:20 AM',
    session: 'Revenue & Retention Pulse',
    owners: 'Scott + Lisa',
    advisor: 'David Chen, CFA',
    focus: 'Check live KPIs, 14d inactive & low-credit accounts, pick #1 weekly revenue/save action.',
  },
  {
    day: 'Tuesday · 8:00–8:30 AM',
    session: 'B2B Corporate Pipeline',
    owners: 'Scott + Lisa',
    advisor: 'Marcus Vance',
    focus: 'Pick 3–5 Boston/Route 128 targets, ship outreach, align 90-day pilot onboarding & QBRs.',
  },
  {
    day: 'Wednesday · 8:00–8:30 AM',
    session: 'Growth, SEO & Authority',
    owners: 'Scott',
    advisor: 'Elena Rostova',
    focus: 'Publish 1 authority post + Sunday Intelligence Note or HOLIDAY25 waitlist sequence.',
  },
  {
    day: 'Thursday · 8:00–8:20 AM',
    session: 'Ops, Hiring & Compliance',
    owners: 'Scott',
    advisor: 'Claire Gallagher',
    focus: 'Clear 1 governance gate (MA Stripe tax txcd_10103000, PAR-Q+/ERAP, W-2 SOPs).',
  },
  {
    day: 'Friday · 8:00–8:15 AM',
    session: 'Lead Funnel & Concierge Review',
    owners: 'Scott + Lisa',
    advisor: 'Hannah Brooks (AI)',
    focus: 'Review waitlist & /apply leads, welcome high-intent prospects, verify concierge copy.',
  },
]

function formatUsd(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000).toLocaleString()}k`
  }
  return `$${amount.toLocaleString()}`
}

export default function ExecutiveBiSuite({
  initialSnapshot,
  viewerPersona,
}: ExecutiveBiSuiteProps) {
  const [activeTab, setActiveTab] = useState<SuiteTabId>('kpi')
  const [snapshot, setSnapshot] = useState<EnterpriseBiDashboardSnapshot>(initialSnapshot)
  const [refreshing, setRefreshing] = useState(false)
  const [promPreview, setPromPreview] = useState<string | null>(null)
  const [loadingProm, setLoadingProm] = useState(false)

  const t = snapshot.telemetry

  const refreshMetrics = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/enterprise/metrics?format=json', { method: 'GET' })
      if (res.ok) {
        const data = (await res.json()) as { metrics?: EnterpriseBiDashboardSnapshot }
        if (data.metrics) {
          setSnapshot(data.metrics)
        }
      }
    } catch {
      // retain existing snapshot
    } finally {
      setRefreshing(false)
    }
  }, [])

  const loadPrometheusPreview = useCallback(async () => {
    setLoadingProm(true)
    try {
      const res = await fetch('/api/enterprise/metrics?format=prometheus', { method: 'GET' })
      if (res.ok) {
        setPromPreview(await res.text())
      }
    } catch {
      setPromPreview('# Unable to load Prometheus preview right now.')
    } finally {
      setLoadingProm(false)
    }
  }, [])

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Generated At', t.generatedAt],
      ['Launch Mode', t.launchMode],
      ['Days Until Go-Live', String(t.daysUntilGoLive)],
      ['Executive Health Score (0-100)', String(snapshot.healthScore100)],
      ['Active Assigned Clients', String(t.activeAssignedClients)],
      ['Unassigned Intake Clients', String(t.unassignedClients)],
      ['Coach Support Cap Utilization (%)', String(t.coachSupportUtilizationPct)],
      ['Onboarding Completion (%)', String(t.onboardingCompletionRatePct)],
      ['14-Day Active Retention (%)', String(snapshot.activeRetention14dPct)],
      ['14-Day Inactive Clients', String(t.inactive14dClientsCount)],
      ['Low Credit Clients (<=2)', String(t.lowCreditClientsCount)],
      ['Unread SLA Messages', String(t.unreadClientMessagesCount)],
      ['Sessions Scheduled This Week', String(t.sessionsThisWeek)],
      ['Waitlist Leads Total', String(t.waitlistLeadsCount)],
      ['Waitlist Leads (7d)', String(snapshot.waitlistLast7d)],
      ['Waitlist Leads (30d)', String(snapshot.waitlistLast30d)],
      ['Coaching Applications Total', String(t.coachingApplicationsCount)],
      ['Estimated ARR Run-Rate (USD)', String(snapshot.estimatedAnnualRunRateUsd)],
      ['Year 1 ARR Target (USD)', String(snapshot.year1ArrTargetUsd)],
    ]
    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forge-athletic-kpis-${t.generatedAt.slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const maxDailySignal = Math.max(
    1,
    ...snapshot.dailySeries14d.map(pt => Math.max(pt.waitlistSignups, pt.workoutLogs))
  )

  return (
    <div className="space-y-5">
      {/* Unified Executive Suite Navigation Bar */}
      <div
        role="tablist"
        aria-label="Forge Athletic Executive Suite sections"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B1220] p-2.5"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'kpi' as const, label: 'KPI & Business Intelligence', icon: BarChart3 },
            { id: 'advisors' as const, label: 'AI Executive Board', icon: Sparkles },
            { id: 'playbook' as const, label: 'Leadership & Weekly Cadence', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  selected
                    ? 'border-amber-400/55 bg-amber-400/18 text-amber-200'
                    : 'border-white/10 bg-[#111A2C] text-zinc-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshMetrics()}
            disabled={refreshing}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#111A2C] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-amber-400/45 hover:text-white disabled:opacity-60"
          >
            <RefreshCw
              size={13}
              className={refreshing ? 'animate-spin text-amber-300' : 'text-amber-300'}
              aria-hidden="true"
            />
            <span>{refreshing ? 'Refreshing…' : 'Refresh Live KPIs'}</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
          >
            <Download size={13} aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE KPI & BUSINESS INTELLIGENCE DASHBOARD */}
      {activeTab === 'kpi' && (
        <section aria-labelledby="executive-kpi-heading" className="space-y-5">
          <h2 id="executive-kpi-heading" className="sr-only">
            Forge Athletic Executive KPI and Business Intelligence Dashboard
          </h2>

          {/* Top-Line Executive North Star Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-[#121C2E] to-[#0B1220] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-amber-300">
                  Estimated ARR Run-Rate
                </span>
                <TrendingUp size={15} className="text-amber-300" aria-hidden="true" />
              </div>
              <div className="mt-2 font-mono text-3xl font-extrabold tabular-nums text-white">
                {formatUsd(snapshot.estimatedAnnualRunRateUsd)}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                Year 1 Target: <strong className="text-amber-200">{formatUsd(snapshot.year1ArrTargetUsd)}</strong> ({snapshot.year1ProgressPct}% · Target EBITDA {snapshot.targetEbitdaMarginPct}%)
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                  style={{ width: `${Math.max(4, snapshot.year1ProgressPct)}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-[#102026] to-[#0B1220] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-emerald-300">
                  Customer Success Health
                </span>
                <Activity size={15} className="text-emerald-300" aria-hidden="true" />
              </div>
              <div className="mt-2 font-mono text-3xl font-extrabold tabular-nums text-white">
                {snapshot.healthScore100}
                <span className="text-base font-normal text-zinc-400">/100</span>
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                14d Active Retention: <strong className="text-emerald-200">{snapshot.activeRetention14dPct}%</strong> · Onboarding: <strong className="text-white">{t.onboardingCompletionRatePct}%</strong>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                  style={{ width: `${snapshot.healthScore100}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-sky-400/30 bg-gradient-to-br from-[#101C2C] to-[#0B1220] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-sky-300">
                  Demand &amp; Waitlist Funnel
                </span>
                <Users size={15} className="text-sky-300" aria-hidden="true" />
              </div>
              <div className="mt-2 font-mono text-3xl font-extrabold tabular-nums text-white">
                {t.waitlistLeadsCount}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                +{snapshot.waitlistLast7d} (7d) · +{snapshot.waitlistLast30d} (30d) · <strong className="text-sky-200">{t.coachingApplicationsCount}</strong> quiz apps
              </div>
              <div className="mt-3 text-[11px] font-mono text-zinc-300">
                {t.launchMode === 'public_live'
                  ? '● Public Registration LIVE'
                  : `● ${t.daysUntilGoLive} days to Jan 4, 2027 Go-Live`}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-[#18162B] to-[#0B1220] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-violet-300">
                  Coach Support Capacity
                </span>
                <ShieldCheck size={15} className="text-violet-300" aria-hidden="true" />
              </div>
              <div className="mt-2 font-mono text-3xl font-extrabold tabular-nums text-white">
                {t.activeAssignedClients}
                <span className="text-base font-normal text-zinc-400">/{t.coachSupportCap}</span>
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                {t.coachSupportUtilizationPct}% cap used · <strong className="text-rose-300">{t.inactive14dClientsCount}</strong> inactive · <strong className="text-amber-300">{t.lowCreditClientsCount}</strong> low credits
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-300"
                  style={{ width: `${Math.max(4, t.coachSupportUtilizationPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Charts Row: 14-Day Velocity Pulse + 3-Year ARR Trajectory */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* 14-Day Activity & Waitlist Sparkline */}
            <figure className="rounded-2xl border border-white/10 bg-[#0B1220] p-4 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">
                    14-DAY DEMAND &amp; ENGAGEMENT PULSE
                  </h3>
                  <figcaption className="text-xs text-zinc-400">
                    Daily zero-PII waitlist signups vs. completed athlete workout logs across Forge Athletic.
                  </figcaption>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" aria-hidden="true" />
                    Waitlist
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" aria-hidden="true" />
                    Workouts
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-14 items-end gap-1.5 rounded-xl border border-white/[0.06] bg-[#070C16] px-3 pt-6 pb-3" style={{ minHeight: 168 }}>
                {snapshot.dailySeries14d.map(pt => {
                  const waitPct = Math.round((pt.waitlistSignups / maxDailySignal) * 100)
                  const workPct = Math.round((pt.workoutLogs / maxDailySignal) * 100)
                  return (
                    <div key={pt.date} className="flex flex-col items-center gap-1">
                      <div className="flex h-24 w-full items-end justify-center gap-0.5">
                        <div
                          title={`${pt.label}: ${pt.waitlistSignups} waitlist`}
                          className="w-2 rounded-t bg-amber-400/90"
                          style={{ height: `${Math.max(pt.waitlistSignups > 0 ? 12 : 4, waitPct)}%` }}
                        />
                        <div
                          title={`${pt.label}: ${pt.workoutLogs} workouts`}
                          className="w-2 rounded-t bg-emerald-400/90"
                          style={{ height: `${Math.max(pt.workoutLogs > 0 ? 12 : 4, workPct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-zinc-500">
                        {pt.date.slice(8)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </figure>

            {/* 3-Year Enterprise ARR & EBITDA Trajectory */}
            <figure className="rounded-2xl border border-white/10 bg-[#0B1220] p-4 lg:col-span-5">
              <h3 className="font-serif text-base font-bold text-white">
                3-YEAR ENTERPRISE ARR ROADMAP
              </h3>
              <figcaption className="text-xs text-zinc-400">
                Asset-light 0% commercial lease trajectory targeting 70–78% EBITDA margins.
              </figcaption>

              <div className="mt-4 space-y-3.5">
                {[
                  { label: 'Year 1 (2026–2027)', arr: 585_000, ebitda: 455_000, margin: '77.8%', width: 18 },
                  { label: 'Year 2 (2027–2028)', arr: 1_850_000, ebitda: 1_326_000, margin: '71.7%', width: 45 },
                  { label: 'Year 3 (2028–2029)', arr: 4_750_000, ebitda: 3_320_000, margin: '69.9%', width: 100 },
                ].map(yr => (
                  <div key={yr.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200">{yr.label}</span>
                      <span className="font-mono font-bold text-amber-300">
                        {formatUsd(yr.arr)} ARR{' '}
                        <span className="font-normal text-emerald-300">({yr.margin} EBITDA)</span>
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400"
                        style={{ width: `${yr.width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/8 p-3 text-[11.5px] leading-relaxed text-zinc-300">
                <strong className="text-amber-200">Associate Coach #1 Trigger:</strong> Hire W-2 Associate Coach #1
                (MA M.G.L. c. 149 § 148B) when Coach Support crosses <strong>80% cap (12/15)</strong> or recurring
                high-touch + B2B MRR exceeds <strong>$18.5k/mo</strong>.
              </div>
            </figure>
          </div>

          {/* Revenue Mix Table + Grafana/Prometheus Observability Bridge */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-4 lg:col-span-7">
              <h3 className="font-serif text-base font-bold text-white">
                REVENUE STREAM TARGET ARCHITECTURE
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">
                      <th scope="col" className="py-2 pr-3">Revenue Stream</th>
                      <th scope="col" className="px-2 py-2 text-right">Year 1</th>
                      <th scope="col" className="px-2 py-2 text-right">Year 2</th>
                      <th scope="col" className="px-2 py-2 text-right">Year 3</th>
                      <th scope="col" className="pl-2 py-2 text-right">Gross Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.revenueRoadmap.map(row => (
                      <tr key={row.stream} className="border-b border-white/[0.06] last:border-b-0">
                        <td className="py-2.5 pr-3 font-medium text-zinc-200">{row.stream}</td>
                        <td className="px-2 py-2.5 text-right font-mono tabular-nums text-white">
                          {formatUsd(row.year1TargetUsd)}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono tabular-nums text-zinc-300">
                          {formatUsd(row.year2TargetUsd)}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono tabular-nums text-amber-200">
                          {formatUsd(row.year3TargetUsd)}
                        </td>
                        <td className="pl-2 py-2.5 text-right font-mono tabular-nums text-emerald-300">
                          ~{row.grossMarginPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prometheus / Grafana Cloud Ready Bridge */}
            <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-4 lg:col-span-5">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-sky-300">
                  <Terminal size={13} aria-hidden="true" />
                  <span>Prometheus &amp; Grafana Cloud Bridge</span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadPrometheusPreview()}
                  disabled={loadingProm}
                  className="rounded-lg border border-white/15 bg-[#121C2E] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:border-sky-400/50 hover:text-white"
                >
                  {loadingProm ? 'Loading…' : 'Preview Feed'}
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                Built natively into Vercel + Supabase with zero extra servers to host. Whenever you want external
                Grafana Cloud dashboards, point a Prometheus scrape job at:
              </p>
              <code className="mt-2 block overflow-x-auto rounded-lg border border-white/10 bg-[#070C16] px-3 py-2 font-mono text-[11px] text-amber-200">
                GET /api/enterprise/metrics?format=prometheus
              </code>
              <p className="mt-2 text-[11px] text-zinc-400">
                Secured by executive login or optional <code className="text-zinc-200">ENTERPRISE_METRICS_SCRAPE_TOKEN</code> bearer header.
              </p>
              {promPreview ? (
                <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-white/10 bg-[#050810] p-2.5 font-mono text-[10px] leading-relaxed text-emerald-200">
                  {promPreview}
                </pre>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: AI EXECUTIVE ADVISORY BOARD */}
      {activeTab === 'advisors' && (
        <ExecutiveGrowthCommandCenter
          initialTelemetry={t}
          viewerPersona={viewerPersona}
        />
      )}

      {/* TAB 3: LEADERSHIP TEAM, DIRECTORY & WEEKLY CADENCE */}
      {activeTab === 'playbook' && (
        <section aria-labelledby="leadership-cadence-heading" className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-5">
            <h2 id="leadership-cadence-heading" className="font-serif text-lg font-bold text-white">
              FORGE ATHLETIC EXECUTIVE LEADERSHIP
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Real human leadership (publicly featured) supported by your private internal AI advisory board.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {FORGE_LEADERSHIP_TEAM.map(leader => (
                <div
                  key={leader.id}
                  className="flex items-start gap-4 rounded-2xl border border-amber-400/25 bg-[#0F1727] p-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-amber-400/45">
                    <Image
                      src={leader.avatarPath}
                      alt={leader.avatarAlt}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-base font-bold text-white">{leader.name}</div>
                    <div className="text-xs font-semibold text-amber-300">{leader.title}</div>
                    <div className="mt-0.5 font-mono text-[10.5px] text-emerald-300">{leader.credentials}</div>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">{leader.bio}</p>
                    <div className="mt-2 font-mono text-[10.5px] text-zinc-400">
                      {leader.email}
                      {leader.departmentAlias ? ` · ${leader.departmentAlias}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly 8:00 AM Calendar Operating Cadence */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-5">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-300" aria-hidden="true" />
              <h3 className="font-serif text-base font-bold text-white">
                WEEKLY 8:00 AM OPERATING CADENCE (GOOGLE CALENDAR SYNCED)
              </h3>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">
                    <th scope="col" className="py-2 pr-3">Window (EST)</th>
                    <th scope="col" className="px-2 py-2">Session</th>
                    <th scope="col" className="px-2 py-2">Leaders</th>
                    <th scope="col" className="px-2 py-2">AI Advisor</th>
                    <th scope="col" className="pl-2 py-2">Weekly Shippable Focus</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKLY_CADENCE.map(item => (
                    <tr key={item.day} className="border-b border-white/[0.06] last:border-b-0">
                      <td className="py-2.5 pr-3 font-mono font-semibold text-amber-200 whitespace-nowrap">
                        {item.day}
                      </td>
                      <td className="px-2 py-2.5 font-semibold text-white">{item.session}</td>
                      <td className="px-2 py-2.5 text-emerald-300 whitespace-nowrap">{item.owners}</td>
                      <td className="px-2 py-2.5 text-zinc-200 whitespace-nowrap">{item.advisor}</td>
                      <td className="pl-2 py-2.5 text-zinc-300">{item.focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Internal AI Board + Public AI Concierge Directory */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-5">
            <h3 className="font-serif text-base font-bold text-white">
              AI EXECUTIVE BOARD &amp; PUBLIC CONCIERGE DIRECTORY
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {EXECUTIVE_BOT_ORDER.map(id => {
                const bot = EXECUTIVE_BOT_PROFILES[id]
                return (
                  <div key={id} className="rounded-xl border border-white/10 bg-[#0F1727] p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15">
                        <Image src={bot.avatarPath} alt={bot.avatarAlt} fill sizes="40px" className="object-cover object-top" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-white">{bot.name}</div>
                        <div className="truncate font-mono text-[9.5px] text-amber-300">{bot.shortLabel} · Internal AI</div>
                      </div>
                    </div>
                    <div className="mt-2 truncate font-mono text-[10px] text-zinc-400">{bot.email}</div>
                  </div>
                )
              })}
              <div className="rounded-xl border border-emerald-400/25 bg-[#0F1727] p-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-emerald-400/40">
                    <Image
                      src={PUBLIC_CONCIERGE_PROFILE.avatarPath}
                      alt={PUBLIC_CONCIERGE_PROFILE.avatarAlt}
                      fill
                      sizes="40px"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-white">{PUBLIC_CONCIERGE_PROFILE.name}</div>
                    <div className="truncate font-mono text-[9.5px] text-emerald-300">Public AI Concierge</div>
                  </div>
                </div>
                <div className="mt-2 truncate font-mono text-[10px] text-zinc-400">
                  {PUBLIC_CONCIERGE_PROFILE.departmentAlias}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
