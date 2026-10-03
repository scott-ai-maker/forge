'use client'

import React, { useState } from 'react'
import {
  generateConsultantMemo,
  GeneratedConsultantMemo,
} from '@/lib/coach-consultant-memo'
import { speakNasmCue } from '@/lib/nasm-assessments'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface CoachConsultantMemoModalProps {
  clientId: string
  clientName: string
  optPhase?: number
  totalSetsLogged?: number
  targetSetsPlanned?: number
  avgReadiness?: number
  cexStreakDays?: number
  topPr?: string | null
  activeCompensation?: string | null
  onClose: () => void
  onDispatched?: () => void
}

export default function CoachConsultantMemoModal({
  clientId,
  clientName,
  optPhase = 1,
  totalSetsLogged = 42,
  targetSetsPlanned = 45,
  avgReadiness = 82,
  cexStreakDays = 5,
  topPr = null,
  activeCompensation = null,
  onClose,
  onDispatched,
}: CoachConsultantMemoModalProps) {
  const [customNotes, setCustomNotes] = useState<string>('')
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [dispatching, setDispatching] = useState<boolean>(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const memo: GeneratedConsultantMemo = generateConsultantMemo({
    clientName,
    optPhase,
    totalSetsLogged,
    targetSetsPlanned,
    avgReadiness,
    cexStreakDays,
    topPrBreakthrough: topPr,
    activeKineticCompensation: activeCompensation,
    coachCustomNotes: customNotes || undefined,
  })

  const handleVoicePreview = () => {
    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    const narration = `Executive Weekly Briefing for ${clientName}. Performance review: ${memo.performanceReview} Recovery health: ${memo.biomechanicalPrescription} Master direction: ${memo.recommendedProgression}`
    setIsSpeaking(true)
    speakNasmCue(narration, { rate: 1.0 })
    setTimeout(() => setIsSpeaking(false), 8000)
  }

  const handleDispatch = async () => {
    setDispatching(true)
    try {
      const res = await fetch(`/api/coach/clients/${clientId}/consultant-memo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opt_phase: optPhase,
          total_sets_logged: totalSetsLogged,
          target_sets_planned: targetSetsPlanned,
          avg_readiness: avgReadiness,
          cex_streak_days: cexStreakDays,
          top_pr: topPr,
          active_compensation: activeCompensation,
          custom_notes: customNotes || undefined,
          dispatch_to_client_messages: true,
        }),
      })

      if (res.ok) {
        setSuccessMsg('✓ Executive Memorandum successfully dispatched to client portal and messaging thread.')
        setTimeout(() => {
          if (onDispatched) onDispatched()
          onClose()
        }, 1500)
      }
    } catch {
      // Handle network error
    } finally {
      setDispatching(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div
        className="glass-card-gold"
        style={{
          maxWidth: 780,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 26,
          display: 'grid',
          gap: 18,
          border: '1px solid var(--gold)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                1-Click AI Consultant Dispatcher
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 13 }}>
                Client: {clientName}
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '6px 0 0',
                color: 'var(--white)',
              }}
            >
              {memo.headline}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--gray)', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Telemetry Bar */}
        <div className="tabular-nums" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, background: 'rgba(8,14,20,0.6)', padding: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Volume Adherence</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 20, color: 'var(--gold-lt)' }}>
              {memo.adherenceRate}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Avg CNS Readiness</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 20, color: 'var(--white)' }}>
              {avgReadiness}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>CEx Homework</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 20, color: 'var(--success)' }}>
              {cexStreakDays} Days
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Recovery Status</div>
            <div style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700, marginTop: 4 }}>
              {memo.recoveryTone.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* Auto-Drafted Memo Content */}
        <div style={{ background: 'rgba(14,23,36,0.7)', padding: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: 14 }}>
          <div>
            <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              1. Performance & Volume Synthesis
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--white)', fontSize: 13, lineHeight: 1.5 }}>
              {memo.performanceReview}
            </p>
          </div>

          <div>
            <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              2. Biomechanical & Recovery Health
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--white)', fontSize: 13, lineHeight: 1.5 }}>
              {memo.biomechanicalPrescription}
            </p>
          </div>

          <div>
            <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              3. Master Direction for Next Microcycle (NASM 2-for-2)
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--white)', fontSize: 13, lineHeight: 1.5 }}>
              {memo.recommendedProgression}
            </p>
          </div>
        </div>

        {/* Coach Custom Directive Note */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em', fontWeight: 600 }}>
            Add Custom Coach Directive (Optional)
          </label>
          <input
            type="text"
            value={customNotes}
            onChange={e => setCustomNotes(e.target.value)}
            placeholder="e.g. Focus on driving knees out on set 3 of squats. Call me Thursday if travel schedule shifts."
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(8,14,20,0.8)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'var(--white)',
              fontSize: 13,
            }}
          />
        </div>

        {successMsg && (
          <div style={{ padding: '12px 14px', background: 'rgba(52,211,153,0.15)', border: '1px solid var(--success)', color: 'var(--white)', fontSize: 13 }}>
            {successMsg}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <button
            type="button"
            onClick={handleVoicePreview}
            className="tactile-btn"
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--white)',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isSpeaking ? (
              <>
                <GaaIcon name="stop" size={13} tone="inherit" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <GaaIcon name="mic" size={13} tone="inherit" />
                <span>Preview Audio Memo</span>
              </>
            )}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="tactile-btn"
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--gray)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDispatch}
              disabled={dispatching}
              className="tactile-btn"
              style={{
                padding: '10px 24px',
                background: 'var(--gold)',
                border: 'none',
                color: 'var(--navy)',
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 12,
                letterSpacing: '0.08em',
                fontWeight: 800,
                textTransform: 'uppercase',
                cursor: dispatching ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="lightning" size={16} tone="inherit" />
              <span>{dispatching ? 'Dispatching...' : 'Approve & Dispatch Memo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

