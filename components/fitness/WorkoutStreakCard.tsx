'use client'

import { useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { generateExecutiveVerificationHash } from '@/lib/cryptographic-seal'

interface WorkoutLogEntry {
  session_date: string
  completed?: boolean
}

interface WorkoutStreakCardProps {
  logs: WorkoutLogEntry[]
  optPhase?: number | string
  athleteId?: string
  totalVolumeKg?: number
}

export function calcStreak(dates: Set<string>): number {
  const today = new Date()
  let streak = 0
  const cursor = new Date(today)
  for (let i = 0; i < 365; i++) {
    const d = cursor.toISOString().slice(0, 10)
    if (dates.has(d)) {
      streak++
    } else if (streak > 0) {
      break
    } else if (i > 1) {
      // Allow a 1-day gap for today not yet logged
      break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function buildHeatmap(dates: Set<string>, weeks: number) {
  const today = new Date()
  const cells: Array<{ date: string; count: 0 | 1; weekIdx: number; dayIdx: number }> = []

  const start = new Date(today)
  start.setDate(start.getDate() - (weeks * 7 - 1))
  // Align to Monday
  const dayOfWeek = start.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  start.setDate(start.getDate() + mondayOffset)

  const cursor = new Date(start)
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10)
      cells.push({
        date: dateStr,
        count: dates.has(dateStr) ? 1 : 0,
        weekIdx: w,
        dayIdx: d,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return cells
}

export const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function formatOptPhaseDisplay(optPhase?: number | string): { code: string; label: string } {
  if (!optPhase) {
    return { code: 'PHASE 1 CLEARANCE', label: 'Stabilization Endurance' }
  }
  const str = String(optPhase).toUpperCase()
  if (str.includes('5') || str.includes('POWER')) {
    return { code: 'PHASE 5 CLEARANCE', label: 'Power & Velocity' }
  }
  if (str.includes('4') || str.includes('MAX')) {
    return { code: 'PHASE 4 CLEARANCE', label: 'Maximal Strength' }
  }
  if (str.includes('3') || str.includes('HYPERTROPHY') || str.includes('DEVELOPMENT')) {
    return { code: 'PHASE 3 CLEARANCE', label: 'Muscular Development' }
  }
  if (str.includes('2') || str.includes('STRENGTH ENDURANCE')) {
    return { code: 'PHASE 2 CLEARANCE', label: 'Strength Endurance' }
  }
  return { code: 'PHASE 1 CLEARANCE', label: 'Stabilization Endurance' }
}

export default function WorkoutStreakCard({
  logs,
  optPhase = 1,
  athleteId = 'GAA-EXEC-CLIENT',
  totalVolumeKg = 0,
}: WorkoutStreakCardProps) {
  const completedDates = useMemo(() => {
    const s = new Set<string>()
    for (const log of logs) {
      if (log.completed !== false) s.add(log.session_date)
    }
    return s
  }, [logs])

  const streak = useMemo(() => calcStreak(completedDates), [completedDates])
  const totalLogged = completedDates.size

  const last28Start = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 27)
    return d.toISOString().slice(0, 10)
  }, [])

  const last28Count = useMemo(() => {
    return Array.from(completedDates).filter((d) => d >= last28Start).length
  }, [completedDates, last28Start])

  // Institutional standard: 16 sessions / 28-day mesocycle target (4 sessions/wk)
  const compliancePct = Math.min(Math.round((last28Count / 16) * 100), 100)

  // Deterministic Cryptographic Seal of Executive Workload Integrity
  const verificationHash = useMemo(() => {
    const latestDate = Array.from(completedDates).sort().pop() || new Date().toISOString().slice(0, 10)
    return generateExecutiveVerificationHash({
      athleteId,
      sessionDate: latestDate,
      totalVolumeKg,
      totalSets: totalLogged,
      nasmOptPhase: optPhase,
    })
  }, [athleteId, completedDates, totalVolumeKg, totalLogged, optPhase])

  const phaseMeta = useMemo(() => formatOptPhaseDisplay(optPhase), [optPhase])

  const WEEKS = 12
  const heatmapCells = useMemo(() => buildHeatmap(completedDates, WEEKS), [completedDates])

  const weekGroups = useMemo(() => {
    const groups: typeof heatmapCells[] = []
    for (let w = 0; w < WEEKS; w++) {
      groups.push(heatmapCells.filter((c) => c.weekIdx === w))
    }
    return groups
  }, [heatmapCells])

  return (
    <section
      aria-labelledby="execution-integrity-heading"
      style={{
        background: '#04070E',
        border: '1px solid rgba(212, 175, 55, 0.28)',
        borderRadius: 8,
        padding: '20px 18px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75)',
      }}
    >
      {/* Header: Institutional Governance Standard */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 18,
          borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
          paddingBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GaaIcon name="shield" size={17} tone="gold" />
          </div>
          <div>
            <h2
              id="execution-integrity-heading"
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 16,
                fontWeight: 700,
                color: '#F8FAFC',
                letterSpacing: '0.06em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              Longitudinal Workload &amp; Execution Integrity
            </h2>
            <div
              style={{
                fontSize: 11,
                color: '#94A3B8',
                letterSpacing: '0.04em',
                marginTop: 2,
              }}
            >
              NASM OPT™ Mesocycle Governance · Cryptographic Audit Verification
            </div>
          </div>
        </div>

        {/* Cryptographic Seal Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '4px 10px',
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: 4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 11,
              fontWeight: 700,
              color: '#D4AF37',
              letterSpacing: '0.06em',
            }}
          >
            {verificationHash}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderLeft: '1px solid rgba(148, 163, 184, 0.25)',
              paddingLeft: 6,
            }}
          >
            Audited
          </span>
        </div>
      </div>

      {/* High-Density Data Telemetry Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: 1,
          background: 'rgba(148, 163, 184, 0.12)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        {[
          {
            label: 'Longitudinal Integrity',
            value: last28Count > 0 ? `${compliancePct}%` : '—',
            sub: compliancePct >= 85 ? 'Target Met (≥85%)' : 'Acute Stimulus Active',
            accent: compliancePct >= 85 ? '#D4AF37' : '#F8FAFC',
          },
          {
            label: '28-Day Mesocycle',
            value: `${last28Count} SESS`,
            sub: '4×/Wk Benchmark Target',
            accent: '#F8FAFC',
          },
          {
            label: 'NASM OPT™ Clearance',
            value: phaseMeta.code,
            sub: phaseMeta.label,
            accent: '#D4AF37',
          },
          {
            label: 'Protocol Continuity',
            value: streak > 0 ? `${streak} DAYS` : 'ACTIVE',
            sub: streak > 0 ? 'Zero Delinquency' : 'Scheduled Cycle',
            accent: streak >= 3 ? '#D4AF37' : '#F8FAFC',
          },
        ].map((metric) => (
          <div
            key={metric.label}
            style={{
              background: '#090E1A',
              padding: '14px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {metric.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: metric.value.length > 12 ? 15 : 20,
                fontWeight: 700,
                lineHeight: 1.1,
                color: metric.accent,
                letterSpacing: '0.02em',
                margin: '2px 0 4px',
              }}
            >
              {metric.value}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: '#94A3B8',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {metric.sub}
            </div>
          </div>
        ))}
      </div>

      {/* 12-Week Mesocycle Longitudinal Training Density */}
      <div
        style={{
          background: '#070C16',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 6,
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            12-Week Longitudinal Training Density Matrix
          </span>
          <span
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 10,
              color: '#64748B',
            }}
          >
            84-DAY AUDIT
          </span>
        </div>

        <div style={{ display: 'flex', gap: 2.5, overflowX: 'auto', paddingBottom: 4 }}>
          {/* Day labels column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, marginRight: 6 }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{
                  width: 13,
                  height: 13,
                  fontSize: 9,
                  fontWeight: 600,
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-telemetry, monospace)',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {weekGroups.map((week, wIdx) => (
            <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {week.map((cell) => (
                <div
                  key={cell.date}
                  title={`${cell.date}${cell.count ? ' — Workload Cleared' : ' — Rest/Recovery'}`}
                  style={{
                    width: 13,
                    height: 13,
                    background: cell.count
                      ? '#D4AF37'
                      : 'rgba(148, 163, 184, 0.08)',
                    borderRadius: 2,
                    boxShadow: cell.count ? '0 0 5px rgba(212, 175, 55, 0.35)' : 'none',
                    cursor: 'default',
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid rgba(148, 163, 184, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rest</span>
            <div
              style={{
                width: 10,
                height: 10,
                background: 'rgba(148, 163, 184, 0.08)',
                borderRadius: 1.5,
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                background: '#D4AF37',
                borderRadius: 1.5,
                boxShadow: '0 0 4px rgba(212, 175, 55, 0.35)',
              }}
            />
            <span style={{ fontSize: 9.5, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Audited Workload</span>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 10.5,
              color: '#94A3B8',
            }}
          >
            {totalLogged} Audited Sessions Total
          </span>
        </div>
      </div>
    </section>
  )
}
