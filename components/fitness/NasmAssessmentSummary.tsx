'use client'

import { useState } from 'react'
import type { NasmAssessmentRecord } from '@/lib/nasm-assessments'
import KineticMobilityRadar from '@/components/fitness/KineticMobilityRadar'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface NasmAssessmentSummaryProps {
  assessment: NasmAssessmentRecord | null
}

export default function NasmAssessmentSummary({ assessment }: NasmAssessmentSummaryProps) {
  const [activeTab, setActiveTab] = useState<'inhibit' | 'lengthen' | 'activate' | 'integrate'>('inhibit')
  const [streakCount, setStreakCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    try {
      const key = `sgf_cex_streak_${assessment?.client_id ?? 'default'}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        return Number(parsed.count) || 0
      }
    } catch {}
    return 0
  })

  const [completedToday, setCompletedToday] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const key = `sgf_cex_streak_${assessment?.client_id ?? 'default'}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        const todayStr = new Date().toISOString().slice(0, 10)
        return parsed.lastDate === todayStr
      }
    } catch {}
    return false
  })

  function handleLogToday() {
    const todayStr = new Date().toISOString().slice(0, 10)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const key = `sgf_cex_streak_${assessment?.client_id ?? 'default'}`
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    let newCount = 1

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed.lastDate === yesterdayStr) {
          newCount = (parsed.count ?? 0) + 1
        } else if (parsed.lastDate === todayStr) {
          return
        }
      } catch {}
    }

    setStreakCount(newCount)
    setCompletedToday(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify({ lastDate: todayStr, count: newCount }))
    }
  }

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  if (!assessment) {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <KineticMobilityRadar assessment={null} />
        <div
          style={{
            border: '1px solid var(--navy-lt)',
            background: 'var(--navy-mid)',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
            No Postural or Movement Assessment on Record
          </div>
          <p style={{ margin: '8px auto 0', maxWidth: 450, color: 'var(--gray)', fontSize: 14, lineHeight: 1.5 }}>
            Your coach has not recorded a NASM kinetic chain movement screen yet. Your personalized corrective homework will appear here once assessed.
          </p>
        </div>
      </div>
    )
  }

  const correctives = assessment.prescribed_correctives ?? {
    inhibit: [],
    lengthen: [],
    activate: [],
    integrate: [],
    summary: '',
  }

  const activeItems = correctives[activeTab] ?? []

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* 5-Axis Kinetic Mobility Radar */}
      <KineticMobilityRadar assessment={assessment} />

      {/* Overview Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px 30px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              NASM Movement Diagnostics
            </span>
            <span style={{ color: 'var(--gray)', fontSize: 13 }}>
              Screened on {new Date(assessment.assessment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="tactile-btn"
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--white)',
              fontSize: 12,
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="printer" size={14} tone="gold" />
            <span>Print / Export PDF</span>
          </button>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '0.04em',
            margin: '14px 0 4px',
            color: 'var(--white)',
          }}
        >
          {assessment.title ?? 'Postural & Kinetic Chain Profile'}
        </h2>
        <p style={{ margin: 0, color: 'var(--gray)', fontSize: 14, lineHeight: 1.6 }}>
          {correctives.summary || 'Custom 4-Phase NASM Corrective Exercise Continuum to improve movement quality, reduce joint stress, and optimize muscle balance.'}
        </p>

        {/* Corrective Prescription Compliance & Kinetic Integrity */}
        <div
          style={{
            marginTop: 20,
            padding: '16px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            background: completedToday ? 'linear-gradient(180deg, #071510 0%, #04070E 100%)' : '#04070E',
            border: completedToday ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: completedToday ? 'rgba(16, 185, 129, 0.12)' : 'rgba(212, 175, 55, 0.12)',
                border: completedToday ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(212, 175, 55, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GaaIcon name="shield" size={18} tone={completedToday ? 'emerald' : 'gold'} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {streakCount > 0 ? `${streakCount}-Day Longitudinal Adherence` : 'Corrective Prescription Compliance'}
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                {completedToday
                  ? 'Audit Validated: Completed prescribed NASM 4-phase kinetic chain sequence.'
                  : 'Prescribed 4-phase kinetic sequence: Inhibit, Lengthen, Activate & Integrate.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogToday}
            disabled={completedToday}
            className="tactile-btn"
            style={{
              padding: '8px 18px',
              background: completedToday ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: completedToday ? '1px solid rgba(16, 185, 129, 0.45)' : 'none',
              color: completedToday ? '#34D399' : '#04070E',
              fontFamily: 'var(--font-telemetry, monospace)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderRadius: 4,
              cursor: completedToday ? 'default' : 'pointer',
            }}
          >
            {completedToday ? '✓ Protocol Authenticated' : 'Authenticate Daily Protocol'}
          </button>
        </div>

        {/* Muscle Balance Cards */}
        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
          {/* Overactive */}
          <div style={{ border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.06)', padding: 14 }}>
            <div style={{ fontSize: 11, color: '#ff6b6b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Tension / Overactive Areas
            </div>
            <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--gray)' }}>
              These muscles require foam rolling (SMR) and static stretching.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(assessment.overactive_muscles ?? []).map(m => (
                <span key={m} style={{ background: 'rgba(255,107,107,0.15)', color: 'var(--white)', padding: '3px 8px', fontSize: 12 }}>
                  {m}
                </span>
              ))}
              {(assessment.overactive_muscles ?? []).length === 0 && <span style={{ color: 'var(--gray)', fontSize: 12 }}>None identified</span>}
            </div>
          </div>

          {/* Underactive */}
          <div style={{ border: '1px solid rgba(81,207,102,0.3)', background: 'rgba(81,207,102,0.06)', padding: 14 }}>
            <div style={{ fontSize: 11, color: '#51cf66', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Underactive / Stabilizer Targets
            </div>
            <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--gray)' }}>
              These muscles need targeted activation and integration exercises.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(assessment.underactive_muscles ?? []).map(m => (
                <span key={m} style={{ background: 'rgba(81,207,102,0.15)', color: 'var(--white)', padding: '3px 8px', fontSize: 12 }}>
                  {m}
                </span>
              ))}
              {(assessment.underactive_muscles ?? []).length === 0 && <span style={{ color: 'var(--gray)', fontSize: 12 }}>None identified</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Corrective Exercise Protocol Tabs */}
      <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.04em' }}>
          Your 4-Phase Corrective Homework
        </h3>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {[
            { key: 'inhibit', label: '1. Inhibit (SMR)', count: correctives.inhibit?.length ?? 0, color: 'var(--gold-lt)' },
            { key: 'lengthen', label: '2. Lengthen (Stretches)', count: correctives.lengthen?.length ?? 0, color: '#90beff' },
            { key: 'activate', label: '3. Activate (Strengthen)', count: correctives.activate?.length ?? 0, color: '#51cf66' },
            { key: 'integrate', label: '4. Integrate (Dynamic)', count: correctives.integrate?.length ?? 0, color: '#c084fc' },
          ].map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{
                  padding: '8px 14px',
                  border: active ? `1px solid ${tab.color}` : '1px solid var(--navy-lt)',
                  background: active ? 'rgba(255,255,255,0.08)' : 'var(--navy)',
                  color: active ? tab.color : 'var(--white)',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: 8 }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active phase exercise cards */}
        <div style={{ display: 'grid', gap: 12 }}>
          {activeItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                padding: 16,
                display: 'grid',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--white)', fontSize: 16, fontWeight: 700 }}>
                    {item.name}
                  </h4>
                  <div style={{ color: 'var(--gold-lt)', fontSize: 12, marginTop: 3 }}>
                    Target: <strong>{item.targetMuscle}</strong>
                  </div>
                </div>

                <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.1)', color: 'var(--white)', fontSize: 12, fontWeight: 600 }}>
                  {item.repsOrDuration}
                </span>
              </div>

              {item.coachingCues && item.coachingCues.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, color: 'var(--gray)', fontSize: 13, lineHeight: 1.4 }}>
                  <strong>How to perform:</strong> {item.coachingCues.join(' ')}
                </div>
              )}
            </div>
          ))}

          {activeItems.length === 0 && (
            <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13 }}>
              No exercises assigned for this phase.
            </p>
          )}
        </div>
      </div>

      {/* Client Printable Corrective Handout */}
      <div className="cex-print-sheet" style={{ display: 'none' }}>
        <div style={{ borderBottom: '2px solid #0D1B2A', paddingBottom: 10, marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Forge Athletic · Corrective Mobility Plan</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>
            NASM Corrective Exercise Continuum · Assessed: {new Date(assessment.assessment_date).toLocaleDateString()}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11, marginBottom: 14 }}>
          <div style={{ border: '1px solid #ddd', padding: 8 }}>
            <strong>1. INHIBIT (SMR / FOAM ROLL)</strong>
            {correctives.inhibit?.map(i => (
              <div key={i.name} style={{ marginTop: 4 }}>• {i.name} ({i.targetMuscle}) — {i.repsOrDuration}</div>
            ))}
          </div>
          <div style={{ border: '1px solid #ddd', padding: 8 }}>
            <strong>2. LENGTHEN (STATIC STRETCHES)</strong>
            {correctives.lengthen?.map(i => (
              <div key={i.name} style={{ marginTop: 4 }}>• {i.name} ({i.targetMuscle}) — {i.repsOrDuration}</div>
            ))}
          </div>
          <div style={{ border: '1px solid #ddd', padding: 8 }}>
            <strong>3. ACTIVATE (ISOLATED STRENGTH)</strong>
            {correctives.activate?.map(i => (
              <div key={i.name} style={{ marginTop: 4 }}>• {i.name} ({i.targetMuscle}) — {i.repsOrDuration}</div>
            ))}
          </div>
          <div style={{ border: '1px solid #ddd', padding: 8 }}>
            <strong>4. INTEGRATE (DYNAMIC MOVEMENTS)</strong>
            {correctives.integrate?.map(i => (
              <div key={i.name} style={{ marginTop: 4 }}>• {i.name} ({i.targetMuscle}) — {i.repsOrDuration}</div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .cex-print-sheet,
          .cex-print-sheet * {
            visibility: visible !important;
          }
          .cex-print-sheet {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            color: #000 !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

