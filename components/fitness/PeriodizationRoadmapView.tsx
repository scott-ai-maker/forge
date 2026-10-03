'use client'

import React, { useState, useEffect } from 'react'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import {
  generate12WeekMacrocycle,
  MacrocyclePlan,
  RoadmapWeek,
  AdaptationVelocity,
} from '@/lib/periodization-roadmap'

interface PeriodizationRoadmapViewProps {
  currentWeek?: number
  clientGoal?: string
  initialPlan?: MacrocyclePlan | null
}

const VELOCITY_CONFIG: Record<
  AdaptationVelocity,
  { label: string; iconName: GaaIconName; badgeColor: string; bg: string; border: string; desc: string }
> = {
  accelerated: {
    label: 'Accelerated Progression',
    iconName: 'lightning',
    badgeColor: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.4)',
    desc: 'You are mastering movement standards ahead of schedule! Coach Gordon has accelerated your progression into advanced strength & power phases.',
  },
  standard: {
    label: 'Standard OPT™ Progression',
    iconName: 'target',
    badgeColor: 'var(--gold-lt)',
    bg: 'rgba(212, 160, 23, 0.12)',
    border: 'rgba(212, 160, 23, 0.4)',
    desc: 'Standard 12-week OPT periodization cycle advancing systematically across kinetic chain stabilization, strength endurance, and maximal neural overload.',
  },
  remedial: {
    label: 'Extended Stabilization',
    iconName: 'lock',
    badgeColor: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.4)',
    desc: 'Coach Gordon added extended stabilization microcycles to reinforce joint integrity, core cylinder activation, and movement longevity.',
  },
  setback: {
    label: 'Restorative Decompression',
    iconName: 'alert-triangle',
    badgeColor: '#f87171',
    bg: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.4)',
    desc: 'Active recovery and joint decompression protocol in effect: 4/2/1 tempo, reduced shearing load, and restorative SMR focus.',
  },
}

export default function PeriodizationRoadmapView({
  currentWeek = 1,
  clientGoal = 'Body Recomposition & Maximal Power Output',
  initialPlan = null,
}: PeriodizationRoadmapViewProps) {
  const [roadmap, setRoadmap] = useState<MacrocyclePlan>(() => {
    return initialPlan || generate12WeekMacrocycle(currentWeek, clientGoal)
  })
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(() => roadmap.currentWeek || currentWeek)
  const [completedCount, setCompletedCount] = useState<number | null>(null)

  // Fetch live calibrated plan from API if not provided
  useEffect(() => {
    if (!initialPlan) {
      fetch('/api/fitness/periodization')
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.plan) {
            setRoadmap(data.plan)
            setSelectedWeekNum(data.plan.currentWeek || 1)
            if (typeof data.completedWorkoutsCount === 'number') {
              setCompletedCount(data.completedWorkoutsCount)
            }
          }
        })
        .catch(err => console.error('Failed to fetch periodization roadmap', err))
    }
  }, [initialPlan])

  const activeWeek = roadmap.weeks.find(w => w.weekNumber === selectedWeekNum) ?? roadmap.weeks[0]
  const velocityInfo = VELOCITY_CONFIG[roadmap.adaptationVelocity] || VELOCITY_CONFIG.standard

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  padding: '4px 10px',
                  background: 'rgba(197,160,89,0.15)',
                  color: 'var(--gold-lt)',
                  border: '1px solid rgba(197,160,89,0.4)',
                }}
              >
                12-Week OPT™ Macrocycle Architecture
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  background: velocityInfo.bg,
                  color: velocityInfo.badgeColor,
                  border: `1px solid ${velocityInfo.border}`,
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name={velocityInfo.iconName} size={12} tone="inherit" />
                <span>{velocityInfo.label}</span>
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '8px 0 0',
                color: 'var(--white)',
              }}
            >
              12-Week Periodization Roadmap
            </h3>
          </div>

          <div className="tabular-nums" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Current Block Progress
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 24, fontWeight: 700, color: 'var(--gold-lt)', lineHeight: 1 }}>
              Week {roadmap.currentWeek} <span style={{ fontSize: 16, color: 'var(--gray)', fontFamily: 'var(--font-sans, Raleway), sans-serif' }}>/ {roadmap.totalWeeks}</span>
            </div>
            {completedCount !== null && (
              <div style={{ fontSize: 10.5, color: '#38BDF8', marginTop: 3, fontFamily: 'var(--font-telemetry, monospace)' }}>
                {completedCount} {completedCount === 1 ? 'session' : 'sessions'} logged
              </div>
            )}
          </div>
        </div>

        {/* Coach Gordon Calibration Banner */}
        {roadmap.coachCalibratedAt && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(212,160,23,0.08)',
              borderLeft: '3px solid var(--gold)',
              borderRadius: 4,
              fontSize: 12.5,
              color: '#CBD5E1',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--gold-lt)' }}>Coach Gordon Periodization Note: </strong>
            <span>{roadmap.coachNotes || velocityInfo.desc}</span>
          </div>
        )}
      </div>

      {/* Phase Blocks Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
        {roadmap.phases.map(ph => (
          <div
            key={ph.phaseNumber}
            style={{
              padding: '14px 16px',
              background: 'rgba(14,23,36,0.7)',
              border: `1px solid ${ph.color}40`,
              borderLeft: `4px solid ${ph.color}`,
              display: 'grid',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 11, color: ph.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {ph.weekRange}
            </div>
            <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
              {ph.name}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--gray)', lineHeight: 1.4 }}>
              {ph.focus}
            </p>
          </div>
        ))}
      </div>

      {/* 12-Week Interactive Timeline Grid */}
      <div className="glass-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', letterSpacing: '0.04em' }}>
            Timeline Navigation (Weeks 1 – {roadmap.totalWeeks})
          </h4>
          <span style={{ fontSize: 12, color: 'var(--gray)' }}>
            Completed · Active · Deload · Scheduled
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(76px, 1fr))',
            gap: 8,
          }}
        >
          {roadmap.weeks.map((w: RoadmapWeek) => {
            const isSelected = selectedWeekNum === w.weekNumber
            const isCompleted = w.status === 'completed'
            const isCurrent = w.status === 'current'
            const isDeload = w.isDeloadWeek

            return (
              <button
                key={w.weekNumber}
                type="button"
                onClick={() => setSelectedWeekNum(w.weekNumber)}
                className="tactile-btn tabular-nums"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  background: isSelected
                    ? 'rgba(197,160,89,0.25)'
                    : isCurrent
                    ? 'rgba(197,160,89,0.12)'
                    : isDeload
                    ? 'rgba(56,189,248,0.1)'
                    : isCompleted
                    ? 'rgba(52,211,153,0.08)'
                    : 'rgba(8,14,20,0.5)',
                  border: isSelected
                    ? '2px solid var(--gold)'
                    : isCurrent
                    ? '1px solid var(--gold)'
                    : isDeload
                    ? '1px solid rgba(56,189,248,0.5)'
                    : isCompleted
                    ? '1px solid rgba(52,211,153,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 2,
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    color: isCompleted
                      ? 'var(--success)'
                      : isCurrent
                      ? 'var(--gold-lt)'
                      : isDeload
                      ? '#38BDF8'
                      : 'var(--gray)',
                    fontWeight: 700,
                  }}
                >
                  {isCompleted ? 'DONE' : isCurrent ? 'ACTIVE' : isDeload ? 'DELOAD' : `WK ${w.weekNumber}`}
                </div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: isSelected ? 'var(--gold-lt)' : 'var(--white)' }}>
                  W{w.weekNumber}
                </div>
                {w.isReassessmentWeek && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GaaIcon name="dna" size={12} tone="cyan" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Week Deep Dive Card */}
        {activeWeek && (
          <div className="glass-card-gold" style={{ padding: '20px 24px', display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-sans, Raleway), sans-serif',
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    padding: '3px 8px',
                    background: 'rgba(197,160,89,0.15)',
                    color: 'var(--gold-lt)',
                    border: '1px solid rgba(197,160,89,0.35)',
                    borderRadius: 4,
                  }}
                >
                  {activeWeek.phase} · Week {activeWeek.weekNumber}
                </span>
                <h4 style={{ margin: '8px 0 0', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
                  {activeWeek.theme}
                </h4>
              </div>

              {activeWeek.isReassessmentWeek && (
                <div
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(52,211,153,0.15)',
                    border: '1px solid var(--success)',
                    color: 'var(--success)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GaaIcon name="dna" size={14} tone="emerald" />
                  <span>Movement Re-Assessment Milestone</span>
                </div>
              )}
            </div>

            {/* Acute Training Variables Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(8,14,20,0.6)', padding: 14, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
                <div style={{ color: 'var(--gold-lt)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Volume & Intensity Target
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--white)', fontSize: 13, lineHeight: 1.5, fontWeight: 600 }}>
                  {activeWeek.volumeIntensity}
                </p>
              </div>

              <div style={{ background: 'rgba(8,14,20,0.6)', padding: 14, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
                <div style={{ color: 'var(--gold-lt)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Target Intensity (% 1RM)
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--white)', fontSize: 13, lineHeight: 1.5 }}>
                  {activeWeek.targetIntensity1RmPercent ? `${activeWeek.targetIntensity1RmPercent}% 1RM` : 'Controlled Load'}
                </p>
              </div>

              <div style={{ background: 'rgba(8,14,20,0.6)', padding: 14, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
                <div style={{ color: 'var(--gold-lt)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Biomechanical Tempo & Rest
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--white)', fontSize: 13, lineHeight: 1.5 }}>
                  {activeWeek.tempo ?? '4/2/1'} · Rest: {activeWeek.restPeriod ?? '60s'}
                </p>
              </div>

              <div style={{ background: 'rgba(8,14,20,0.6)', padding: 14, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
                <div style={{ color: 'var(--gold-lt)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Milestone Deliverable
                </div>
                <div style={{ margin: '6px 0 0', color: 'var(--gold)', fontSize: 13, lineHeight: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="trophy" size={15} tone="gold" />
                  <span>{activeWeek.milestoneTitle}</span>
                </div>
              </div>
            </div>

            {/* Coach Gordon Weekly Memo */}
            {activeWeek.coachWeeklyMemo && (
              <div
                style={{
                  background: 'rgba(212,160,23,0.1)',
                  borderLeft: '4px solid var(--gold)',
                  borderRadius: 6,
                  padding: '12px 16px',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="mic" size={13} tone="gold" />
                  <span>Coach Gordon Direct Microcycle Directive:</span>
                </div>
                <span style={{ color: '#F1F5F9' }}>{activeWeek.coachWeeklyMemo}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


