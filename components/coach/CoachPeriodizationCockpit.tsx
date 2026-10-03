'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  generate12WeekMacrocycle,
  insertDeloadWeek,
  acceleratePhaseTransition,
  extendCurrentPhase,
  applySetbackCorrection,
  updateMicrocycleWeek,
  MacrocyclePlan,
  RoadmapWeek,
  AdaptationVelocity,
} from '@/lib/periodization-roadmap'
import GaaIcon from '@/components/ui/GaaIcon'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'

const CoachConsultantMemoModal = dynamic(
  () => import('@/components/coach/CoachConsultantMemoModal'),
  { ssr: false }
)

interface CoachPeriodizationCockpitProps {
  clientId: string
  clientName?: string
  clientGoal?: string
  initialPlan?: MacrocyclePlan | null
}

const VELOCITY_CONFIG: Record<
  AdaptationVelocity,
  { label: string; icon: 'lightning' | 'target' | 'shield' | 'bandage'; tone: 'emerald' | 'gold' | 'cyan' | 'ruby'; badgeColor: string; bg: string; border: string; desc: string }
> = {
  accelerated: {
    label: 'Accelerated (High Responder)',
    icon: 'lightning',
    tone: 'emerald',
    badgeColor: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.4)',
    desc: 'Client is mastering movement standards ahead of schedule. Fast-tracking to advanced strength & power phases.',
  },
  standard: {
    label: 'Standard Progression',
    icon: 'target',
    tone: 'gold',
    badgeColor: 'var(--gold-lt)',
    bg: 'rgba(212, 160, 23, 0.12)',
    border: 'rgba(212, 160, 23, 0.4)',
    desc: 'Normal 12-week OPT periodization cycle advancing linearly through foundational, strength, and maximal phases.',
  },
  remedial: {
    label: 'Extended Stabilization (Slower Adaptation)',
    icon: 'shield',
    tone: 'cyan',
    badgeColor: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.4)',
    desc: 'Client requires additional motor learning and kinetic chain stabilization before handling heavy loads.',
  },
  setback: {
    label: 'Setback / Joint Decompression',
    icon: 'bandage',
    tone: 'ruby',
    badgeColor: '#f87171',
    bg: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.4)',
    desc: 'Active joint flare-up or acute fatigue detected. Acute variables modulated to 4/2/1 tempo, low load, and high SMR.',
  },
}

export default function CoachPeriodizationCockpit({
  clientId,
  clientName = 'Client',
  clientGoal = 'Body Recomposition & Maximal Power Output',
  initialPlan = null,
}: CoachPeriodizationCockpitProps) {
  const [macrocycle, setMacrocycle] = useState<MacrocyclePlan>(() => {
    return initialPlan || generate12WeekMacrocycle(1, clientGoal)
  })
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(() => macrocycle.currentWeek || 1)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [dispatchMessage, setDispatchMessage] = useState<boolean>(true)
  const [_isLoading, setIsLoading] = useState<boolean>(false)

  // Modal / intervention states
  const [activeIntervention, setActiveIntervention] = useState<'deload' | 'accelerate' | 'extend' | 'setback' | null>(null)
  const [interventionNote, setInterventionNote] = useState<string>('')
  const [targetPhaseSelect, setTargetPhaseSelect] = useState<number>(2)
  const [extendWeeksCount, setExtendWeeksCount] = useState<number>(1)
  const [showMemoModal, setShowMemoModal] = useState<boolean>(false)

  // Load latest plan from API if not provided in SSR
  useEffect(() => {
    if (!initialPlan) {
      setIsLoading(true)
      fetch(`/api/coach/clients/${clientId}/periodization`)
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.plan) {
            setMacrocycle(data.plan)
            setSelectedWeekNum(data.plan.currentWeek || 1)
          }
        })
        .catch(err => console.error('Failed to load periodization plan', err))
        .finally(() => setIsLoading(false))
    }
  }, [clientId, initialPlan])

  const activeWeek: RoadmapWeek =
    macrocycle.weeks.find(w => w.weekNumber === selectedWeekNum) || macrocycle.weeks[0]

  const velocityInfo = VELOCITY_CONFIG[macrocycle.adaptationVelocity] || VELOCITY_CONFIG.standard

  // Handlers for 1-click Coach Interventions
  const handleInsertDeload = () => {
    const updated = insertDeloadWeek(macrocycle, selectedWeekNum, interventionNote || undefined)
    setMacrocycle(updated)
    setActiveIntervention(null)
    setInterventionNote('')
    setSaveStatus({ success: true, message: `Active Restorative Deload inserted at Week ${selectedWeekNum}.` })
  }

  const handleAccelerate = () => {
    const updated = acceleratePhaseTransition(macrocycle, selectedWeekNum, targetPhaseSelect, interventionNote || undefined)
    setMacrocycle(updated)
    setActiveIntervention(null)
    setInterventionNote('')
    setSaveStatus({ success: true, message: `Accelerated to Phase ${targetPhaseSelect} starting from Week ${selectedWeekNum}.` })
  }

  const handleExtend = () => {
    const updated = extendCurrentPhase(macrocycle, activeWeek.phaseNumber, extendWeeksCount, interventionNote || undefined)
    setMacrocycle(updated)
    setActiveIntervention(null)
    setInterventionNote('')
    setSaveStatus({ success: true, message: `Extended ${activeWeek.phase} by ${extendWeeksCount} microcycle(s).` })
  }

  const handleSetback = () => {
    const updated = applySetbackCorrection(
      macrocycle,
      selectedWeekNum,
      interventionNote || 'Acute Joint / Fatigue Setback',
      interventionNote ? `Coach Gordon applied setback protocol: ${interventionNote}` : undefined
    )
    setMacrocycle(updated)
    setActiveIntervention(null)
    setInterventionNote('')
    setSaveStatus({ success: true, message: `Setback protocol applied to Week ${selectedWeekNum}.` })
  }

  const handleResetToBaseline = () => {
    if (window.confirm('Reset this macrocycle to default 12-Week NASM OPT baseline?')) {
      const reset = generate12WeekMacrocycle(1, clientGoal)
      setMacrocycle(reset)
      setSelectedWeekNum(1)
      setSaveStatus({ success: true, message: 'Macrocycle reset to baseline OPT 12-week periodization.' })
    }
  }

  // Save to database & sync with client
  const handleSaveAndSync = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      const res = await fetch(`/api/coach/clients/${clientId}/periodization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: macrocycle,
          dispatchMessage,
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setSaveStatus({ success: true, message: '✓ Macrocycle periodization calibrated! Advancing to Stage 6: Program Design...' })
        if (data.plan) setMacrocycle(data.plan)
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = `/coach/clients/${clientId}?tab=program#workspace-tab-content`
          }, 1500)
        }
      } else {
        setSaveStatus({ success: false, message: data.error || 'Failed to save periodization plan.' })
      }
    } catch {
      setSaveStatus({ success: false, message: 'Network error saving periodization plan.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* ── Macrocycle Master Header ── */}
      <div className="glass-card" style={{ padding: '24px 28px', border: '1px solid rgba(212,160,23,0.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, zIndex: 0 }}>
          <GaaMasterWatermarkSeal size={160} opacity={0.07} subtitle="PERIODIZATION ARCHITECT" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
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
                  borderRadius: 4,
                }}
              >
                NASM OPT™ Periodization Architect
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
                <GaaIcon name={velocityInfo.icon} size={11} tone={velocityInfo.tone} />
                <span>{velocityInfo.label}</span>
              </span>
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '8px 0 2px',
                color: 'var(--white)',
              }}
            >
              Macrocycle Calibration: {clientName}
            </h3>
            <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13 }}>
              Target Focus: <strong style={{ color: 'var(--gold-lt)' }}>{clientGoal}</strong> · Total Timeline:{' '}
              <strong style={{ color: '#FFFFFF' }}>{macrocycle.totalWeeks} Weeks</strong> · Current Status: <span style={{ color: '#34d399', fontWeight: 700 }}>Active Trajectory</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: velocityInfo.bg,
                border: `1px solid ${velocityInfo.border}`,
                color: velocityInfo.badgeColor,
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name={velocityInfo.icon} size={12} tone={velocityInfo.tone} />
              <span>{velocityInfo.label}</span>
            </div>

            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSaving}
              className="sgf-button sgf-button-gold"
              style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <GaaIcon name="check" size={13} tone="inherit" />
              <span>{isSaving ? 'Synchronizing...' : 'Save & Sync Macrocycle'}</span>
            </button>
          </div>
        </div>

        {/* Velocity explanation */}
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'rgba(0,0,0,0.3)',
            borderLeft: `3px solid ${velocityInfo.badgeColor}`,
            borderRadius: 4,
            fontSize: 12.5,
            color: '#CBD5E1',
            lineHeight: 1.5,
            maxWidth: 600,
          }}
        >
          <strong>Adaptation Velocity Note:</strong> {velocityInfo.desc}
        </div>
      </div>

      {/* Save Status Notification */}
      {saveStatus && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 6,
            background: saveStatus.success ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: saveStatus.success ? '1px solid #34d399' : '1px solid #ef4444',
            color: saveStatus.success ? '#34d399' : '#fca5a5',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>{saveStatus.message}</span>
            {saveStatus.success && (
              <a
                href={`/coach/clients/${clientId}?tab=program#workspace-tab-content`}
                style={{
                  padding: '5px 12px',
                  borderRadius: 4,
                  background: '#34d399',
                  color: '#080E14',
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Proceed to Stage 6: Program Design ➔</span>
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <GaaIcon name="close" size={14} tone="slate" />
          </button>
        </div>
      )}

      {/* ── 1-Click Coach Modulation Interventions ── */}
      <div className="glass-card" style={{ padding: '20px 24px', background: 'rgba(10,16,28,0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="lightning" size={16} tone="gold" />
            <span>1-Click Clinical Interventions &amp; Periodization Modulations</span>
          </h4>
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>
            Modify macrocycle trajectory based on client adaptation speed or injury setbacks
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <button
            type="button"
            onClick={() => setActiveIntervention('deload')}
            className="tactile-btn"
            style={{
              padding: '12px 14px',
              textAlign: 'left',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 6,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <GaaIcon name="rotate-ccw" size={12} tone="cyan" />
              <span>Insert Deload Week</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 4 }}>
              Active SMR &amp; recovery week at Week {selectedWeekNum}. Shifts remaining weeks.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveIntervention('accelerate')}
            className="tactile-btn"
            style={{
              padding: '12px 14px',
              textAlign: 'left',
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: 6,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <GaaIcon name="lightning" size={12} tone="emerald" />
              <span>Accelerate Phase</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 4 }}>
              Fast-track high responder ahead of schedule to advanced OPT phase.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveIntervention('extend')}
            className="tactile-btn"
            style={{
              padding: '12px 14px',
              textAlign: 'left',
              background: 'rgba(212, 160, 23, 0.08)',
              border: '1px solid rgba(212, 160, 23, 0.3)',
              borderRadius: 6,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <GaaIcon name="shield" size={12} tone="gold" />
              <span>Extend Current Phase</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 4 }}>
              Add +1 or +2 stabilization microcycles for slower motor adaptation.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveIntervention('setback')}
            className="tactile-btn"
            style={{
              padding: '12px 14px',
              textAlign: 'left',
              background: 'rgba(248, 113, 113, 0.08)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: 6,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F87171', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="bandage" size={12} tone="ruby" />
              <span>Setback Protocol</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 4 }}>
              Joint flare protection: switch to 4/2/1 tempo and low shear force.
            </div>
          </button>

          <button
            type="button"
            onClick={handleResetToBaseline}
            className="tactile-btn"
            style={{
              padding: '12px 14px',
              textAlign: 'left',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <GaaIcon name="rotate-ccw" size={12} tone="slate" />
              <span>Reset Baseline</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 4 }}>
              Restore standard 12-week OPT macrocycle layout.
            </div>
          </button>
        </div>

        {/* Modal / Dialog for Active Intervention */}
        {activeIntervention && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: '#070D18',
              border: '1px solid var(--gold)',
              borderRadius: 8,
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: 'var(--gold-lt)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                {activeIntervention === 'deload' && (
                  <>
                    <GaaIcon name="rotate-ccw" size={14} tone="cyan" />
                    <span>Insert Restorative Deload at Week {selectedWeekNum}</span>
                  </>
                )}
                {activeIntervention === 'accelerate' && (
                  <>
                    <GaaIcon name="lightning" size={14} tone="emerald" />
                    <span>Fast-Track to Advanced Phase from Week {selectedWeekNum}</span>
                  </>
                )}
                {activeIntervention === 'extend' && (
                  <>
                    <GaaIcon name="shield" size={14} tone="gold" />
                    <span>Extend {activeWeek.phase} (Currently Week {selectedWeekNum})</span>
                  </>
                )}
                {activeIntervention === 'setback' && (
                  <>
                    <GaaIcon name="alert-triangle" size={14} tone="ruby" />
                    <span>Apply Joint Setback Protocol at Week {selectedWeekNum}</span>
                  </>
                )}
              </strong>
              <button
                type="button"
                onClick={() => setActiveIntervention(null)}
                style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              >
                <GaaIcon name="close" size={13} tone="slate" />
                <span>Cancel</span>
              </button>
            </div>

            {activeIntervention === 'accelerate' && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
                  Target Advanced OPT™ Phase:
                </label>
                <select
                  value={targetPhaseSelect}
                  onChange={e => setTargetPhaseSelect(Number(e.target.value))}
                  style={{
                    background: '#0A0E18',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '8px 12px',
                    borderRadius: 4,
                    width: '100%',
                  }}
                >
                  <option value={2}>Phase 2: Strength Endurance (Agonist/Stabilizer Supersets)</option>
                  <option value={3}>Phase 3: Muscular Development (Hypertrophic Volume)</option>
                  <option value={4}>Phase 4: Maximal Strength (Heavy Neural Recruitment)</option>
                  <option value={5}>Phase 5: Power (Rate of Force Development)</option>
                </select>
              </div>
            )}

            {activeIntervention === 'extend' && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
                  Number of Reinforcement Microcycles to Add:
                </label>
                <select
                  value={extendWeeksCount}
                  onChange={e => setExtendWeeksCount(Number(e.target.value))}
                  style={{
                    background: '#0A0E18',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '8px 12px',
                    borderRadius: 4,
                    width: '100%',
                  }}
                >
                  <option value={1}>+1 Additional Week</option>
                  <option value={2}>+2 Additional Weeks</option>
                  <option value={3}>+3 Additional Weeks</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>
                Coach Clinical Memo for Athlete:
              </label>
              <input
                type="text"
                placeholder={
                  activeIntervention === 'deload'
                    ? 'e.g. Active recovery microcycle to dissipate acute fatigue and protect joints.'
                    : activeIntervention === 'setback'
                    ? 'e.g. Modulating to 4/2/1 tempo to decompress shoulder joint.'
                    : 'e.g. Advancing phase following early movement mastery.'
                }
                value={interventionNote}
                onChange={e => setInterventionNote(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0A0E18',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '8px 12px',
                  borderRadius: 4,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveIntervention(null)}
                className="sgf-button sgf-button-secondary"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeIntervention === 'deload') handleInsertDeload()
                  else if (activeIntervention === 'accelerate') handleAccelerate()
                  else if (activeIntervention === 'extend') handleExtend()
                  else if (activeIntervention === 'setback') handleSetback()
                }}
                className="sgf-button sgf-button-gold"
                style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700 }}
              >
                Confirm Modulation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 12-Week Interactive Timeline Navigation Bar ── */}
      <div className="glass-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', letterSpacing: '0.04em' }}>
            Timeline Navigation (Weeks 1 – {macrocycle.totalWeeks})
          </h4>
          <span style={{ fontSize: 12, color: 'var(--gray)' }}>
            Done · Active · Deload · Scheduled
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(76px, 1fr))',
            gap: 8,
          }}
        >
          {macrocycle.weeks.map((w: RoadmapWeek) => {
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
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry, monospace)',
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: isSelected ? 'var(--gold-lt)' : '#FFFFFF',
                  }}
                >
                  W{w.weekNumber}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: '#94A3B8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  P{w.phaseNumber}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Microcycle Deep-Dive Inspector & Editor ── */}
      {activeWeek && (
        <div
          className="glass-card"
          style={{
            padding: '24px 28px',
            background: 'rgba(10,16,28,0.85)',
            border: '1px solid rgba(212,160,23,0.4)',
            borderRadius: 10,
            display: 'grid',
            gap: 20,
          }}
        >
          {/* Week Header with Set Active Week Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                    color: 'var(--gold-lt)',
                  }}
                >
                  Microcycle Inspector · Week {activeWeek.weekNumber} of {macrocycle.totalWeeks}
                </span>
                {activeWeek.status === 'current' && (
                  <span
                    style={{
                      background: 'rgba(212,160,23,0.2)',
                      border: '1px solid var(--gold)',
                      color: 'var(--gold-lt)',
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 700,
                    }}
                  >
                    CURRENT ACTIVE CLIENT WEEK
                  </span>
                )}
                {activeWeek.isDeloadWeek && (
                  <span
                    style={{
                      background: 'rgba(56,189,248,0.2)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 700,
                    }}
                  >
                    RESTORATIVE DELOAD
                  </span>
                )}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 22,
                  fontWeight: 700,
                  margin: '4px 0 0',
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                }}
              >
                {activeWeek.theme}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {activeWeek.status !== 'current' && (
                <button
                  type="button"
                  onClick={() => {
                    const updatedWeeks = macrocycle.weeks.map(w => {
                      let status: RoadmapWeek['status'] = 'upcoming'
                      if (w.weekNumber < activeWeek.weekNumber) status = 'completed'
                      else if (w.weekNumber === activeWeek.weekNumber) status = 'current'
                      return { ...w, status }
                    })
                    setMacrocycle({ ...macrocycle, currentWeek: activeWeek.weekNumber, weeks: updatedWeeks })
                    setSaveStatus({ success: true, message: `Set Week ${activeWeek.weekNumber} as current active week.` })
                  }}
                  className="sgf-button sgf-button-secondary"
                  style={{ padding: '6px 12px', fontSize: 11 }}
                >
                  Set as Current Week
                </button>
              )}
            </div>
          </div>

          {/* Form Fields for Editing Acute Variables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* OPT Phase */}
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--gray)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                OPT™ Phase:
              </label>
              <select
                value={activeWeek.phaseNumber}
                onChange={e => {
                  const pNum = Number(e.target.value)
                  const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, { phaseNumber: pNum })
                  setMacrocycle(updated)
                }}
                style={{
                  width: '100%',
                  background: '#070D18',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.18)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <option value={1}>Phase 1: Stabilization Endurance</option>
                <option value={2}>Phase 2: Strength Endurance</option>
                <option value={3}>Phase 3: Muscular Development</option>
                <option value={4}>Phase 4: Maximal Strength</option>
                <option value={5}>Phase 5: Power & Peak Testing</option>
              </select>
            </div>

            {/* Microcycle Theme */}
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--gray)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Microcycle Focus / Theme:
              </label>
              <input
                type="text"
                value={activeWeek.theme}
                onChange={e => {
                  const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, { theme: e.target.value })
                  setMacrocycle(updated)
                }}
                style={{
                  width: '100%',
                  background: '#070D18',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.18)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Volume & Intensity */}
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--gray)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Volume / Intensity Prescription:
              </label>
              <input
                type="text"
                value={activeWeek.volumeIntensity}
                onChange={e => {
                  const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, { volumeIntensity: e.target.value })
                  setMacrocycle(updated)
                }}
                style={{
                  width: '100%',
                  background: '#070D18',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.18)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Target % 1RM */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                <span style={{ color: 'var(--gray)', fontWeight: 600 }}>Target % 1RM:</span>
                <strong style={{ color: 'var(--gold-lt)' }}>{activeWeek.targetIntensity1RmPercent ?? 70}%</strong>
              </div>
              <input
                type="range"
                min={40}
                max={95}
                step={2.5}
                value={activeWeek.targetIntensity1RmPercent ?? 70}
                onChange={e => {
                  const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, {
                    targetIntensity1RmPercent: Number(e.target.value),
                  })
                  setMacrocycle(updated)
                }}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
            </div>

            {/* Tempo */}
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--gray)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Biomechanical Tempo:
              </label>
              <input
                type="text"
                value={activeWeek.tempo ?? '4/2/1'}
                onChange={e => {
                  const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, { tempo: e.target.value })
                  setMacrocycle(updated)
                }}
                placeholder="e.g. 4/2/1, 2/0/2, 2/0/1"
                style={{
                  width: '100%',
                  background: '#070D18',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.18)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Rest Period */}
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--gray)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Prescribed Rest:
              </label>
              <input
                type="text"
                value={activeWeek.restPeriod ?? '60s'}
                onChange={e => {
                  const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, { restPeriod: e.target.value })
                  setMacrocycle(updated)
                }}
                placeholder="e.g. 60s, 90s, 2-3 min"
                style={{
                  width: '100%',
                  background: '#070D18',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.18)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Re-Assessment Milestone Checkbox */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 6, display: 'grid', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={activeWeek.isReassessmentWeek}
                onChange={e => {
                  const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, {
                    isReassessmentWeek: e.target.checked,
                  })
                  setMacrocycle(updated)
                }}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: activeWeek.isReassessmentWeek ? 'var(--gold-lt)' : '#CBD5E1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="target" size={13} tone="gold" />
                <span>Scheduled Re-Assessment Milestone Week</span>
              </span>
            </label>
            {activeWeek.isReassessmentWeek && (
              <input
                type="text"
                value={activeWeek.milestoneTitle}
                onChange={e => {
                  const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, {
                    milestoneTitle: e.target.value,
                  })
                  setMacrocycle(updated)
                }}
                placeholder="Milestone title (e.g. Mid-Cycle OHSA Screen, 1RM Testing)"
                style={{
                  width: '100%',
                  background: '#070D18',
                  color: '#FFFFFF',
                  border: '1px solid rgba(212,160,23,0.4)',
                  padding: '8px 12px',
                  borderRadius: 4,
                  fontSize: 12.5,
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Coach Weekly Periodization Memo */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="mic" size={13} tone="gold" />
                <span>Coach Gordon Direct Memo for Week {activeWeek.weekNumber} (Visible in Athlete Portal):</span>
              </label>
              <button
                type="button"
                onClick={() => setShowMemoModal(true)}
                className="tactile-btn"
                style={{
                  padding: '3px 10px',
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid rgba(212,160,23,0.45)',
                  borderRadius: 4,
                  color: 'var(--gold-lt)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="sparkles" size={12} tone="gold" />
                <span>AI Memo Studio &amp; Voice Preview →</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={activeWeek.coachWeeklyMemo ?? ''}
              onChange={e => {
                const updated = updateMicrocycleWeek(macrocycle, activeWeek.weekNumber, {
                  coachWeeklyMemo: e.target.value,
                })
                setMacrocycle(updated)
              }}
              placeholder="Provide clinical cues, mental focus, or specific guidance for this microcycle..."
              style={{
                width: '100%',
                background: '#070D18',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 13,
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* AI Consultant Memo Modal */}
          {showMemoModal && (
            <CoachConsultantMemoModal
              clientId={clientId}
              clientName={clientName}
              optPhase={activeWeek.phaseNumber || 1}
              onClose={() => setShowMemoModal(false)}
              onDispatched={() => {
                setShowMemoModal(false)
                fetch(`/api/coach/clients/${clientId}/periodization`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.ok && data.plan) {
                      setMacrocycle(data.plan)
                    }
                  })
                  .catch(() => {})
              }}
            />
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#CBD5E1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dispatchMessage}
                onChange={e => setDispatchMessage(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }}
              />
              <span>Send update summary to client concierge message thread</span>
            </label>

            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSaving}
              className="sgf-button sgf-button-gold"
              style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <GaaIcon name="check" size={13} tone="inherit" />
              <span>{isSaving ? 'Synchronizing...' : 'Save & Calibrate Macrocycle'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
