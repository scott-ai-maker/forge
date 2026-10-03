'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import GaaIcon from '@/components/ui/GaaIcon'

export interface Checkin {
  id: string
  week_start: string
  sleep_quality: number | null
  stress_level: number | null
  soreness_level: number | null
  energy_level: number | null
  weight_kg: number | null
  waist_cm?: number | null
  neck_cm?: number | null
  hip_cm?: number | null
  notes: string | null
  coach_feedback: string | null
  coach_rating_adjustment: number | null
}

export interface ReadinessSummary {
  completionRate14d: number
  avgRpe14d: number | null
  completedSessions7d: number
  daysSinceLastCompleted: number | null
  readiness: 'high' | 'moderate' | 'low'
  recommendation: string
}

export interface WeeklyTelemetrySummary {
  completedWorkouts: number
  totalSets: number
  totalReps: number
  totalVolumeKg: number
  avgRpe: number | null
  cardioMinutes: number
  cardioSessions: number
  volumeDisplay?: number
  volumeUnit?: string
}

export interface WorkoutLogItem {
  session_date?: string | null
  completed?: boolean | null
  exertion_rpe?: number | null
}

export interface CoachCheckinReviewProps {
  clientId: string
  clientName?: string
  initialCheckins: Checkin[]
  acwrRatio?: number | null
  acwrZone?: 'Under-training' | 'Sweet Spot' | 'Overreaching' | 'Danger Zone' | 'No Data' | string
  acuteWorkloadUnits?: number
  chronicWorkloadUnits?: number
  readinessSummary?: ReadinessSummary
  weeklySummary?: WeeklyTelemetrySummary
  recentLogs?: WorkoutLogItem[]
  preferredUnits?: 'metric' | 'imperial'
}

const QUICK_FEEDBACK_PRESETS = [
  {
    label: 'Progressive Overload',
    badge: 'Optimal',
    tone: '#34D399',
    text: 'Outstanding adherence and biofeedback this week. Readiness is primed for progressive overload in your current OPT phase. Keep executing with prescribed tempo and mechanics!',
  },
  {
    label: 'Fatigue Mitigation',
    badge: 'Recovery',
    tone: 'var(--gold-lt)',
    text: 'Soreness and stress metrics are slightly elevated. We are programming an active recovery session and dialing back working set intensity by 10% to ensure joint longevity.',
  },
  {
    label: 'ACWR Workload Reset',
    badge: 'Deload',
    tone: '#38BDF8',
    text: 'Acute workload has ramped up quickly relative to your rolling chronic baseline. Prioritize 8+ hours of sleep and hydration while we stabilize volume this week.',
  },
  {
    label: 'Adherence & Nutrition',
    badge: 'Nutrition',
    tone: '#F472B6',
    text: 'Great consistency on working sets. Make sure you are hitting daily protein targets and electrolyte hydration to support recovery between training bouts.',
  },
]

function ratingBar(value: number | null, invert?: boolean) {
  if (value === null) return <span style={{ color: 'var(--gray)', fontSize: 12 }}>—</span>
  const pct = Math.min(100, Math.max(0, (value / 5) * 100))
  const good = invert ? value <= 2 : value >= 4
  const bad = invert ? value >= 4 : value <= 2
  const color = good ? 'var(--success)' : bad ? 'var(--error)' : 'var(--gold)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 64, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{value}/5</span>
    </div>
  )
}

export default function CoachCheckinReview({
  clientId,
  clientName = 'Athlete',
  initialCheckins,
  acwrRatio,
  acwrZone,
  acuteWorkloadUnits,
  chronicWorkloadUnits,
  readinessSummary,
  weeklySummary,
  recentLogs = [],
  preferredUnits = 'imperial',
}: CoachCheckinReviewProps) {
  const router = useRouter()
  const [checkins, setCheckins] = useState<Checkin[]>(initialCheckins)
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})
  const [ratingAdjustments, setRatingAdjustments] = useState<Record<string, number | null>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<{ id: string; message: string } | null>(null)

  // Controlled expansion state for accordion cards (no HTML <details> quirks)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    if (initialCheckins && initialCheckins.length > 0) {
      // Expand all unresponded checkins by default, or at least the latest checkin
      const unresponded = initialCheckins.filter(c => !c.coach_feedback?.trim())
      if (unresponded.length > 0) {
        unresponded.forEach(c => { init[c.id] = true })
      } else {
        init[initialCheckins[0].id] = true
      }
    }
    return init
  })

  // Stage 8 Milestone Calculation
  const hasLoggedWorkouts = recentLogs.length > 0 || (weeklySummary?.completedWorkouts ?? 0) > 0
  const hasReviewedCheckin = checkins.some(c => Boolean(c.coach_feedback?.trim()))
  const milestonesCompletedCount = (hasLoggedWorkouts ? 1 : 0) + (hasReviewedCheckin ? 1 : 0)
  const isStage8Complete = milestonesCompletedCount === 2

  // Find first unresponded check-in for quick actions
  const firstUnrespondedCheckin = checkins.find(c => !c.coach_feedback?.trim())

  const toggleExpand = (checkinId: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [checkinId]: !prev[checkinId],
    }))
  }

  const focusFeedbackEditor = (checkinId: string) => {
    setExpandedIds(prev => ({ ...prev, [checkinId]: true }))
    setTimeout(() => {
      const textarea = document.getElementById(`feedback-textarea-${checkinId}`)
      if (textarea) {
        textarea.focus()
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 60)
  }

  async function saveFeedback(checkin: Checkin) {
    setSaving(checkin.id)
    const feedbackText = feedbackDrafts[checkin.id] !== undefined
      ? feedbackDrafts[checkin.id]
      : (checkin.coach_feedback ?? '')

    const ratingAdj = ratingAdjustments[checkin.id] !== undefined
      ? ratingAdjustments[checkin.id]
      : (checkin.coach_rating_adjustment ?? null)

    try {
      const res = await fetch(`/api/coach/clients/${clientId}/checkins`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: checkin.id,
          coach_feedback: feedbackText,
          coach_rating_adjustment: ratingAdj,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setCheckins(prev => prev.map(c => c.id === checkin.id ? { ...c, coach_feedback: updated.coach_feedback, coach_rating_adjustment: updated.coach_rating_adjustment } : c))
        setSuccessBanner({
          id: checkin.id,
          message: `Feedback & Coach's Notes dispatched for Week of ${new Date(`${checkin.week_start}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Athlete notified. Review complete!`,
        })
        router.refresh()
        setTimeout(() => setSuccessBanner(null), 8000)
      } else {
        alert('Failed to save feedback. Please try again.')
      }
    } catch {
      alert('Network error while saving feedback.')
    } finally {
      setSaving(null)
    }
  }

  function applyPreset(checkinId: string, presetText: string) {
    setFeedbackDrafts(prev => ({
      ...prev,
      [checkinId]: presetText,
    }))
    // Focus textarea after applying preset
    setTimeout(() => {
      const textarea = document.getElementById(`feedback-textarea-${checkinId}`)
      if (textarea) {
        textarea.focus()
      }
    }, 50)
  }

  // ACWR Visual Classification
  const normalizedZone = String(acwrZone ?? 'No Data').toLowerCase()
  const isAcwrNoData = !acwrZone || normalizedZone.includes('no data') || acwrRatio === null || acwrRatio === undefined
  const isAcwrDanger = !isAcwrNoData && (normalizedZone.includes('danger') || normalizedZone.includes('risk'))
  const isAcwrOverreaching = !isAcwrNoData && (normalizedZone.includes('overreaching') || normalizedZone.includes('overloading'))
  const isAcwrOptimal = !isAcwrNoData && (normalizedZone.includes('sweet') || normalizedZone.includes('optimal'))

  const acwrTone = isAcwrNoData ? '#94A3B8' : isAcwrDanger ? '#EF4444' : isAcwrOverreaching ? 'var(--gold)' : isAcwrOptimal ? '#10B981' : '#38BDF8'
  const acwrZoneLabel = isAcwrNoData
    ? 'Insufficient Data (No Logged Volume)'
    : isAcwrDanger
      ? 'Danger Zone (> 1.50)'
      : isAcwrOverreaching
        ? 'Overreaching (1.30 - 1.50)'
        : isAcwrOptimal
          ? 'Optimal / Sweet Spot (0.80 - 1.30)'
          : 'Under-training (< 0.80)'

  return (
    <div className="coach-checkin-review" style={{ display: 'grid', gap: 20 }}>
      {/* ── 1. Stage 8 Status & Progression Navigation Header ────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 22, 36, 0.98) 0%, rgba(8, 13, 22, 0.98) 100%)',
          border: isStage8Complete ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(212, 160, 23, 0.35)',
          borderRadius: 10,
          padding: '18px 22px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Weekly Review &amp; Triage
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: isStage8Complete ? 'rgba(16, 185, 129, 0.18)' : 'rgba(212, 160, 23, 0.2)',
                  color: isStage8Complete ? '#34D399' : 'var(--gold-lt)',
                  border: `1px solid ${isStage8Complete ? '#10B981' : 'var(--gold)'}`,
                }}
              >
                {isStage8Complete ? '✓ Maintenance Current' : `Review Pending (${milestonesCompletedCount}/2)`}
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, color: 'var(--white)', margin: 0, letterSpacing: '0.04em' }}>
              TELEMETRY MONITORING, WEEKLY FOLLOW-UPS &amp; TRIAGE
            </h2>
            <p style={{ margin: '3px 0 0', color: 'var(--gray)', fontSize: 12.5 }}>
              Evaluate longitudinal ACWR workload ratios, 14-day adherence, and dispatch Sunday biofeedback guidance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href={`/coach/clients/${clientId}/dossier`}
              className="tactile-btn"
              style={{
                padding: '9px 16px',
                background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                color: '#080E14',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)',
              }}
            >
              <GaaIcon name="crown" size={13} tone="inherit" />
              <span>Launch Sunday Dossier (PDF)</span>
              <span>➔</span>
            </a>

            <button
              type="button"
              onClick={() => router.push(`/coach/clients/${clientId}?tab=lifecycle#workspace-tab-content`)}
              className="tactile-btn"
              style={{
                padding: '9px 16px',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)',
              }}
            >
              <span>View Lifecycle &amp; Retention</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Live Telemetry & ACWR Workload Cockpit ─────────────── */}
      <div
        style={{
          background: 'var(--navy-mid)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="heart-rate" tone="gold" size={16} />
            <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 16, color: 'var(--white)', letterSpacing: '0.04em' }}>
              ATHLETE TRAINING TELEMETRY &amp; WORKLOAD METRICS
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Real-Time Engine
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {/* ACWR Gauge */}
          <div style={telemetryMetricCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={telemetryLabelStyle}>ACWR Workload Ratio</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: acwrTone, textTransform: 'uppercase' }}>
                {acwrZone ?? 'No Data'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 22, color: acwrTone }}>
                {acwrRatio !== undefined && acwrRatio !== null ? acwrRatio.toFixed(2) : 'No Data'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                Acute {acuteWorkloadUnits ?? 0} / Chronic {chronicWorkloadUnits ?? 0}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{acwrZoneLabel}</span>
          </div>

          {/* 14d Adherence */}
          <div style={telemetryMetricCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={telemetryLabelStyle}>14-Day Completion Rate</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: (readinessSummary?.completionRate14d ?? 0) >= 75 ? '#34D399' : 'var(--gold-lt)' }}>
                {readinessSummary?.readiness?.toUpperCase() ?? 'ACTIVE'} READINESS
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 22, color: 'var(--white)' }}>
                {readinessSummary?.completionRate14d ?? 0}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                Avg RPE {readinessSummary?.avgRpe14d ?? '—'}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
              {readinessSummary?.recommendation || 'Maintain steady progression.'}
            </span>
          </div>

          {/* Weekly Volume & Cardio Output */}
          <div style={telemetryMetricCardStyle}>
            <span style={telemetryLabelStyle}>Weekly Output &amp; Sets</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 22, color: 'var(--gold-lt)' }}>
                {weeklySummary?.volumeDisplay ?? 0} {weeklySummary?.volumeUnit ?? 'lb'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--white)', fontWeight: 600 }}>
                {weeklySummary?.completedWorkouts ?? 0} workouts · {weeklySummary?.totalSets ?? 0} sets
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
              Cardio: {weeklySummary?.cardioSessions ?? 0} session(s) / {weeklySummary?.cardioMinutes ?? 0} mins
            </span>
          </div>
        </div>

        {/* Recent Workout Activity mini-chips */}
        {recentLogs.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Recent Workout Logs ({recentLogs.length} on record)
              </span>
              <a href={`/coach/clients/${clientId}?tab=overview#workspace-tab-content`} style={{ fontSize: 11, color: 'var(--gold-lt)', textDecoration: 'none' }}>
                View Full Logs ➔
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {recentLogs.slice(0, 8).map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: log.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${log.completed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    color: log.completed ? '#34D399' : 'var(--gray)',
                  }}
                >
                  <span>{log.completed ? '✓' : '○'}</span>
                  <span>{log.session_date ? new Date(`${log.session_date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : 'Session'}</span>
                  {log.exertion_rpe ? <span style={{ color: 'var(--gold-lt)', fontWeight: 700 }}>RPE {log.exertion_rpe}</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Action Required Callout Banner (if check-in is unresponded) ── */}
      {firstUnrespondedCheckin && (
        <div
          style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.16) 0%, rgba(212, 160, 23, 0.06) 100%)',
            border: '1.5px solid var(--gold)',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 16px rgba(212, 160, 23, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GaaIcon name="lightning" size={20} tone="gold" />
            <div>
              <span style={{ fontWeight: 800, color: 'var(--gold-lt)', fontSize: 13.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Action Required: Sunday Check-In Awaiting Response
              </span>
              <p style={{ margin: '2px 0 0', color: 'var(--white)', fontSize: 12.5 }}>
                {clientName} submitted biofeedback for the week of{' '}
                <strong>
                  {new Date(`${firstUnrespondedCheckin.week_start}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </strong>
                . Click below to jump straight to the feedback editor.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => focusFeedbackEditor(firstUnrespondedCheckin.id)}
            className="tactile-btn"
            style={{
              padding: '9px 18px',
              background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
              color: '#080E14',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(212, 160, 23, 0.3)',
            }}
          >
            <span>Write Feedback Now</span>
            <span style={{ fontSize: 14 }}>➔</span>
          </button>
        </div>
      )}

      {/* ── 4. Success Feedback Notification Toast ─────────────────── */}
      {successBanner && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1.5px solid #10B981',
            borderRadius: 8,
            padding: '14px 18px',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, color: '#34D399' }}>✓</span>
            <div>
              <div style={{ color: '#34D399', fontWeight: 800, fontSize: 13 }}>
                Biofeedback Dispatched · Review Complete
              </div>
              <div style={{ color: '#E2E8F0', fontSize: 12.5, marginTop: 2 }}>
                {successBanner.message}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/coach/clients/${clientId}?tab=lifecycle#workspace-tab-content`)}
            className="tactile-btn"
            style={{
              padding: '7px 14px',
              background: 'var(--gold)',
              color: '#080E14',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(212, 160, 23, 0.3)',
            }}
          >
            <span>View Lifecycle Workspace</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* ── 5. Weekly Check-In Submissions & Biofeedback Dossier ───── */}
      {checkins.length === 0 ? (
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 8,
            padding: '24px 28px',
            textAlign: 'center',
          }}
        >
          <GaaIcon name="checkins" size={32} tone="gold" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: 'var(--white)', margin: 0, letterSpacing: '0.04em' }}>
            AWAITING FIRST SUNDAY CHECK-IN SUBMISSION
          </h3>
          <p style={{ color: 'var(--gray)', fontSize: 13, maxWidth: 480, margin: '6px auto 16px' }}>
            {clientName} has not submitted their weekly biofeedback check-in yet. Sunday check-ins track sleep, stress, soreness, energy, and body weight.
          </p>
          <a
            href={`/coach/clients/${clientId}/messages`}
            className="tactile-btn"
            style={{
              padding: '8px 16px',
              background: 'rgba(212, 160, 23, 0.15)',
              border: '1px solid var(--gold)',
              borderRadius: 4,
              color: 'var(--gold-lt)',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Message Athlete / Send Check-In Prompt</span>
            <span>➔</span>
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {checkins.map((checkin, idx) => {
            const weekLabel = new Date(`${checkin.week_start}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const isExpanded = Boolean(expandedIds[checkin.id])
            const draft = feedbackDrafts[checkin.id] !== undefined
              ? feedbackDrafts[checkin.id]
              : (checkin.coach_feedback ?? '')
            const ratingAdj = ratingAdjustments[checkin.id] !== undefined
              ? ratingAdjustments[checkin.id]
              : (checkin.coach_rating_adjustment ?? 0)

            const weightDisplay = checkin.weight_kg
              ? preferredUnits === 'metric'
                ? `${checkin.weight_kg} kg (${Math.round(checkin.weight_kg * 2.20462 * 10) / 10} lbs)`
                : `${Math.round(checkin.weight_kg * 2.20462 * 10) / 10} lbs (${checkin.weight_kg} kg)`
              : null

            const isAwaitingFeedback = !checkin.coach_feedback?.trim()

            return (
              <div
                key={checkin.id}
                style={{
                  border: isAwaitingFeedback
                    ? '1.5px solid var(--gold)'
                    : '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'var(--navy-mid)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: isAwaitingFeedback ? '0 4px 16px rgba(212, 160, 23, 0.1)' : 'none',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Clickable Header Bar */}
                <div
                  onClick={() => toggleExpand(checkin.id)}
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    userSelect: 'none',
                    background: isExpanded ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.015)',
                    borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 16, color: 'var(--white)', letterSpacing: '0.04em' }}>
                      WEEK OF {weekLabel.toUpperCase()}
                    </span>
                    {idx === 0 && (
                      <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 3, background: 'rgba(212, 160, 23, 0.2)', color: 'var(--gold-lt)', border: '1px solid var(--gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                        Latest
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Interactive Action Button for Awaiting Feedback */}
                    {isAwaitingFeedback ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          focusFeedbackEditor(checkin.id)
                        }}
                        className="tactile-btn"
                        style={{
                          fontSize: 11,
                          padding: '5px 12px',
                          borderRadius: 4,
                          background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.28) 0%, rgba(212, 160, 23, 0.12) 100%)',
                          border: '1.5px solid var(--gold)',
                          color: 'var(--gold-lt)',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 8px rgba(212, 160, 23, 0.25)',
                        }}
                        title="Click to expand and write feedback"
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
                        <span>Awaiting Feedback</span>
                        <span style={{ fontSize: 12, color: 'var(--white)' }}>— Respond ➔</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          focusFeedbackEditor(checkin.id)
                        }}
                        style={{
                          fontSize: 10.5,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid #10B981',
                          color: '#34D399',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>✓ Responded</span>
                        <span style={{ fontSize: 10, textDecoration: 'underline', color: 'var(--white)' }}>(Edit)</span>
                      </button>
                    )}

                    <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                      Sleep {checkin.sleep_quality ?? '?'} · Stress {checkin.stress_level ?? '?'} · Soreness {checkin.soreness_level ?? '?'} · Energy {checkin.energy_level ?? '?'}
                    </span>

                    {/* Chevron Toggle */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700 }}>
                      <span>{isExpanded ? 'Hide' : 'Review'}</span>
                      <GaaIcon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} />
                    </div>
                  </div>
                </div>

                {/* Expanded Card Body */}
                {isExpanded && (
                  <div style={{ padding: '18px 20px', display: 'grid', gap: 16 }}>
                    {/* Biofeedback Ratings Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                      <div style={biofeedbackBoxStyle}>
                        <span style={biofeedbackLabelStyle}>Sleep Quality</span>
                        {ratingBar(checkin.sleep_quality)}
                      </div>
                      <div style={biofeedbackBoxStyle}>
                        <span style={biofeedbackLabelStyle}>Stress Level</span>
                        {ratingBar(checkin.stress_level, true)}
                      </div>
                      <div style={biofeedbackBoxStyle}>
                        <span style={biofeedbackLabelStyle}>Soreness Level</span>
                        {ratingBar(checkin.soreness_level, true)}
                      </div>
                      <div style={biofeedbackBoxStyle}>
                        <span style={biofeedbackLabelStyle}>Energy Level</span>
                        {ratingBar(checkin.energy_level)}
                      </div>
                      {weightDisplay && (
                        <div style={biofeedbackBoxStyle}>
                          <span style={biofeedbackLabelStyle}>Logged Weight</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>{weightDisplay}</span>
                        </div>
                      )}
                      {(checkin.waist_cm || checkin.neck_cm || checkin.hip_cm) && (
                        <div style={biofeedbackBoxStyle}>
                          <span style={biofeedbackLabelStyle}>Circumferences</span>
                          <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 600 }}>
                            {[
                              checkin.waist_cm ? `W: ${checkin.waist_cm}cm` : null,
                              checkin.neck_cm ? `N: ${checkin.neck_cm}cm` : null,
                              checkin.hip_cm ? `H: ${checkin.hip_cm}cm` : null,
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Client self-reported notes */}
                    {checkin.notes && (
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6, padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)' }}>
                          Athlete Check-In Notes
                        </span>
                        <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--white)', lineHeight: 1.5 }}>
                          {checkin.notes}
                        </p>
                      </div>
                    )}

                    {/* 1-Click Quick Feedback Presets */}
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', display: 'block', marginBottom: 6 }}>
                        1-Click Sports Science Presets
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {QUICK_FEEDBACK_PRESETS.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => applyPreset(checkin.id, preset.text)}
                            style={{
                              padding: '5px 11px',
                              borderRadius: 4,
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${preset.tone}`,
                              color: preset.tone,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <span>{preset.badge}:</span>
                            <span style={{ color: 'var(--white)' }}>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Textarea & Readiness Adjustment */}
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(212, 160, 23, 0.3)',
                        borderRadius: 8,
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)' }}>
                          Coach Directives &amp; Sunday Feedback
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--gray)' }}>Readiness Calibration:</span>
                          <select
                            value={ratingAdj ?? 0}
                            onChange={e => setRatingAdjustments(prev => ({ ...prev, [checkin.id]: Number(e.target.value) }))}
                            style={{
                              background: 'var(--navy)',
                              border: '1px solid var(--navy-lt)',
                              color: 'var(--white)',
                              fontSize: 11,
                              padding: '4px 8px',
                              borderRadius: 4,
                              outline: 'none',
                            }}
                          >
                            <option value="-2">-2 (Deload / Extreme Fatigue)</option>
                            <option value="-1">-1 (Reduced Volume -10%)</option>
                            <option value="0">0 (Normal / On Target)</option>
                            <option value="1">+1 (Overload Acceleration)</option>
                            <option value="2">+2 (Max Overload / Peak)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <textarea
                          id={`feedback-textarea-${checkin.id}`}
                          value={draft}
                          onChange={e => setFeedbackDrafts(prev => ({ ...prev, [checkin.id]: e.target.value }))}
                          placeholder="Write personalized weekly feedback for this athlete — they will see this directly in their Sunday Dossier..."
                          rows={3}
                          style={{
                            flex: '1 1 300px',
                            minWidth: 260,
                            padding: '10px 12px',
                            background: 'var(--navy)',
                            border: '1.5px solid var(--navy-lt)',
                            color: 'var(--white)',
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: 13.5,
                            borderRadius: 6,
                            resize: 'vertical',
                            outline: 'none',
                            lineHeight: 1.4,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => void saveFeedback(checkin)}
                          disabled={saving === checkin.id}
                          className="tactile-btn"
                          style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                            color: '#0D1B2A',
                            border: 'none',
                            borderRadius: 6,
                            fontFamily: 'var(--font-sans, Raleway), sans-serif',
                            fontSize: 11,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            minHeight: 46,
                            fontWeight: 800,
                            boxShadow: '0 4px 14px rgba(212, 160, 23, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span>{saving === checkin.id ? 'Dispatching...' : 'Dispatch Feedback'}</span>
                          <span>➔</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const telemetryMetricCardStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 6,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const telemetryLabelStyle: React.CSSProperties = {
  fontFamily: 'Raleway, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--gray)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const biofeedbackBoxStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 6,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const biofeedbackLabelStyle: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--gray)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 700,
}
