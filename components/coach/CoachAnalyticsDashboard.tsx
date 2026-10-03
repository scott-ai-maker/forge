'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface ClientEngagement {
  clientId: string
  fullName: string | null
  email: string
  sessionsRemaining: number
  workoutLogsLast28: number
  workoutCompliancePct: number | null
  checkinsLast8: number
  lastCheckinDate: string | null
  lastWorkoutDate: string | null
  streakDays: number
  hasActiveGoals: number
  trend: 'improving' | 'stable' | 'declining' | 'new'
}

interface AnalyticsSummary {
  totalClients: number
  avgCompliancePct: number | null
  improving: number
  declining: number
  needsAttention: number
}

const TREND_LABEL: Record<ClientEngagement['trend'], string> = {
  improving: '↑ Improving',
  stable: '→ Stable',
  declining: '↓ Declining',
  new: '● New',
}

const TREND_COLOR: Record<ClientEngagement['trend'], string> = {
  improving: 'var(--success)',
  stable: 'var(--gray)',
  declining: 'var(--error)',
  new: 'var(--gold)',
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''))
  const diffMs = Date.now() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  return `${Math.floor(diffDays / 7)} weeks ago`
}

function ComplianceBar({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span style={{ fontSize: 11, color: 'var(--gray)' }}>No data</span>
  }
  const color =
    pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--gold)' : 'var(--error)'

  return (
    <div>
      <div
        style={{
          height: 3,
          background: 'var(--navy-lt)',
          borderRadius: 2,
          width: 80,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
      <span style={{ fontSize: 11, color }}>{pct}%</span>
    </div>
  )
}

type SortKey = 'name' | 'compliance' | 'lastWorkout' | 'trend' | 'sessions'

export default function CoachAnalyticsDashboard() {
  const [clients, setClients] = useState<ClientEngagement[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('compliance')
  const [filter, setFilter] = useState<'all' | 'attention' | 'improving'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/analytics')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json() as { clients: ClientEngagement[]; summary: AnalyticsSummary }
      setClients(json.clients ?? [])
      setSummary(json.summary)
    } catch {
      setError('Could not load analytics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sorted = [...clients]
    .filter((c) => {
      if (filter === 'attention')
        return (
          c.trend === 'declining' ||
          (c.workoutCompliancePct !== null && c.workoutCompliancePct < 50) ||
          (c.lastCheckinDate === null && c.workoutLogsLast28 === 0)
        )
      if (filter === 'improving') return c.trend === 'improving'
      return true
    })
    .sort((a, b) => {
      if (sortKey === 'name') return (a.fullName ?? a.email).localeCompare(b.fullName ?? b.email)
      if (sortKey === 'compliance')
        return (b.workoutCompliancePct ?? -1) - (a.workoutCompliancePct ?? -1)
      if (sortKey === 'lastWorkout')
        return (b.lastWorkoutDate ?? '').localeCompare(a.lastWorkoutDate ?? '')
      if (sortKey === 'sessions') return b.sessionsRemaining - a.sessionsRemaining
      if (sortKey === 'trend') {
        const order: Record<string, number> = {
          declining: 0,
          new: 1,
          stable: 2,
          improving: 3,
        }
        return (order[a.trend] ?? 2) - (order[b.trend] ?? 2)
      }
      return 0
    })

  function SortButton({
    k,
    label,
  }: {
    k: SortKey
    label: string
  }) {
    const active = sortKey === k
    return (
      <button
        type="button"
        onClick={() => setSortKey(k)}
        style={{
          background: 'none',
          border: 'none',
          color: active ? 'var(--gold)' : 'var(--gray)',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'Raleway, sans-serif',
          fontWeight: active ? 700 : 400,
          padding: '2px 0',
          textDecoration: active ? 'underline' : 'none',
          textDecorationColor: 'var(--gold)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {active && <GaaIcon name="chevron-down" size={10} tone="gold" />}
      </button>
    )
  }

  return (
    <section aria-labelledby="analytics-heading">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <h2
          id="analytics-heading"
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--white)',
            letterSpacing: '0.04em',
            margin: 0,
          }}
        >
          CLIENT ANALYTICS
        </h2>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: '1px solid var(--navy-lt)',
            color: 'var(--gray)',
            fontSize: 12,
            cursor: 'pointer',
            padding: '4px 10px',
            fontFamily: 'Raleway, sans-serif',
          }}
        >
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}

      {/* Summary stats */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 1,
            background: 'rgba(255,255,255,0.06)',
            marginBottom: 20,
          }}
        >
          {[
            {
              label: 'Total Clients',
              value: summary.totalClients,
              color: 'var(--white)',
            },
            {
              label: 'Avg Compliance',
              value: summary.avgCompliancePct !== null ? `${summary.avgCompliancePct}%` : '—',
              color: summary.avgCompliancePct !== null && summary.avgCompliancePct >= 70 ? 'var(--success)' : 'var(--gold)',
            },
            {
              label: 'Improving',
              value: summary.improving,
              color: 'var(--success)',
            },
            {
              label: 'Needs Attention',
              value: summary.needsAttention,
              color: summary.needsAttention > 0 ? 'var(--error)' : 'var(--success)',
            },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--navy-mid)', padding: '16px 14px' }}>
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--gray)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontWeight: 800,
                  fontSize: 24,
                  lineHeight: 1,
                  color: s.color,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter + Sort controls */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {(
            [
              { key: 'all' as const, label: 'All', icon: null },
              { key: 'attention' as const, label: 'Needs Attention', icon: 'alert-triangle' as const },
              { key: 'improving' as const, label: 'Improving', icon: 'trending-up' as const },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                border: `1px solid ${filter === f.key ? 'rgba(212,160,23,0.55)' : 'var(--navy-lt)'}`,
                background: filter === f.key ? 'rgba(212,160,23,0.14)' : 'transparent',
                color: filter === f.key ? 'var(--gold)' : 'var(--gray)',
                fontSize: 12,
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: 'Raleway, sans-serif',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {f.icon && <GaaIcon name={f.icon} size={11} tone={filter === f.key ? 'gold' : 'inherit'} />}
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>Sort:</span>
          <SortButton k="compliance" label="Compliance" />
          <SortButton k="lastWorkout" label="Activity" />
          <SortButton k="name" label="Name" />
          <SortButton k="trend" label="Trend" />
        </div>
      </div>

      {/* Client table */}
      {!loading && sorted.length === 0 && (
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--gray)', fontSize: 14, margin: 0 }}>
            {filter !== 'all'
              ? 'No clients match this filter.'
              : 'No assigned clients yet.'}
          </p>
        </div>
      )}

      {sorted.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sorted.map((client) => (
            <div
              key={client.clientId}
              style={{
                background: 'var(--navy-mid)',
                border: `1px solid ${
                  client.trend === 'declining'
                    ? 'rgba(255,61,87,0.25)'
                    : client.trend === 'improving'
                    ? 'rgba(72,187,120,0.2)'
                    : 'var(--navy-lt)'
                }`,
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto auto auto',
                gap: 16,
                alignItems: 'center',
              }}
            >
              {/* Name + email */}
              <div>
                <Link
                  href={`/coach/clients/${client.clientId}`}
                  style={{
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--white)',
                    textDecoration: 'none',
                  }}
                >
                  {client.fullName ?? client.email}
                </Link>
                {client.fullName && (
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>{client.email}</div>
                )}
                {client.hasActiveGoals > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 2 }}>
                    {client.hasActiveGoals} active goal{client.hasActiveGoals !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Compliance */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Compliance
                </div>
                <ComplianceBar pct={client.workoutCompliancePct} />
              </div>

              {/* Last workout */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Last Workout
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color:
                      !client.lastWorkoutDate
                        ? 'var(--error)'
                        : client.workoutLogsLast28 < 4
                        ? 'var(--gold)'
                        : 'var(--gray)',
                  }}
                >
                  {formatRelativeDate(client.lastWorkoutDate)}
                </span>
              </div>

              {/* Check-in */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Last Check-In
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: !client.lastCheckinDate ? 'var(--error)' : 'var(--gray)',
                  }}
                >
                  {formatRelativeDate(client.lastCheckinDate)}
                </span>
              </div>

              {/* Sessions remaining */}
              <div style={{ textAlign: 'center', minWidth: 50 }}>
                <div style={{ fontSize: 9, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  Sessions
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry, monospace)',
                    fontWeight: 800,
                    fontSize: 16,
                    color: client.sessionsRemaining <= 2 ? 'var(--error)' : 'var(--white)',
                  }}
                >
                  {client.sessionsRemaining}
                </span>
              </div>

              {/* Trend */}
              <div style={{ textAlign: 'right', minWidth: 90 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: TREND_COLOR[client.trend],
                    fontWeight: 600,
                  }}
                >
                  {TREND_LABEL[client.trend]}
                </span>
                {client.streakDays >= 3 && (
                  <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <GaaIcon name="flame" size={10} tone="gold" />
                    <span>{client.streakDays}-day streak</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: 12, fontSize: 11, color: 'var(--gray)' }}>
        Compliance = completed workouts vs 4×/week target over 28 days. Trend compares last 28 vs previous 28 days.
      </p>
    </section>
  )
}
