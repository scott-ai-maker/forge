'use client'

import { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  computeLiveSessionSummary,
  LiveSessionSet,
} from '@/lib/live-session-wrapup'

interface LiveSessionWrapUpModalProps {
  clientId: string
  athleteName: string
  optPhase: string
  today: string
  sets: LiveSessionSet[]
  onClose: () => void
  onSuccess?: () => void
}

export default function LiveSessionWrapUpModal({
  clientId,
  athleteName,
  optPhase,
  today,
  sets,
  onClose,
  onSuccess,
}: LiveSessionWrapUpModalProps) {
  const [coachNotes, setCoachNotes] = useState('Exceptional kinetic execution. Controlled eccentric tempos maintained throughout all compound lifts.')
  const [recoveryDirective, setRecoveryDirective] = useState('Hydrate with 20–30oz electrolyte solution + 40g post-workout protein within 60 minutes. Maintain 8+ hours sleep window.')
  const [deductCredit, setDeductCredit] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<{ briefingId?: string; creditDeducted?: boolean } | null>(null)

  const summary = computeLiveSessionSummary({
    athleteName,
    optPhase,
    sessionDate: today,
    sets,
    coachNotes,
    recoveryDirective,
  })

  const handleDispatch = async () => {
    try {
      setSubmitting(true)
      setErrorMsg(null)

      const res = await fetch(`/api/coach/clients/${clientId}/live-session-conclude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryMessage: summary.formattedBriefingMessage,
          optPhase,
          sessionDate: today,
          coachNotes,
          recoveryDirective,
          deductCredit,
          sets,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch session wrap-up briefing.')
      }

      setSuccessResult({
        briefingId: data.briefingId || data.messageId,
        creditDeducted: data.creditDeducted,
      })

      onSuccess?.()
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setErrorMsg(errObj?.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 100050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          backgroundColor: '#080E18',
          border: '1.5px solid rgba(212,160,23,0.4)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
          padding: 24,
          gap: 16,
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
              Live Telehealth Wrap-Up &amp; Performance Takeaway
            </h2>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              Athlete: <strong style={{ color: '#FFFFFF' }}>{athleteName}</strong> · {optPhase}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="close" size={12} tone="slate" />
            <span>Dismiss</span>
          </button>
        </div>

        {successResult ? (
          <div style={{ textAlign: 'center', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GaaIcon name="trophy" size={48} tone="gold" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, fontWeight: 700, color: 'var(--gold-lt)', margin: 0, letterSpacing: '0.04em' }}>
              SESSION CONCLUDED &amp; DISPATCHED
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.85)', maxWidth: 460 }}>
              The comprehensive performance briefing has been delivered to <strong>{athleteName}</strong> in their private Concierge Line.
              {successResult.creditDeducted && ' (1 package consult credit was automatically deducted).'}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose()
                if (typeof window !== 'undefined') {
                  window.location.href = `/coach/clients/${clientId}?tab=checkins#workspace-tab-content`
                }
              }}
              style={{
                marginTop: 10,
                padding: '10px 24px',
                background: 'var(--gold)',
                color: '#0A0E18',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Return to Coach Cockpit (Stage 8: Weekly Triage ➔)
            </button>
          </div>
        ) : (
          <>
            {/* Metrics Ribbon */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>Total Tonnage</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 22, color: '#FFFFFF', marginTop: 2 }}>
                  {summary.totalTonnageLbs.toLocaleString()} <span style={{ fontSize: 13, color: 'var(--gold-lt)' }}>LBS</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>Working Sets</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 22, color: '#FFFFFF', marginTop: 2 }}>
                  {summary.workingSets} <span style={{ fontSize: 13, color: 'var(--gray)' }}>of {summary.totalSets}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700 }}>Peak Load Anchor</div>
                <div style={{ fontSize: 13, color: 'var(--gold-lt)', fontWeight: 700, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {summary.heaviestLift ? `${summary.heaviestLift.exercise} (${summary.heaviestLift.weightLbs} lbs)` : 'Bodyweight'}
                </div>
              </div>
            </div>

            {/* Coach Cues Editor */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 4 }}>
                <GaaIcon name="target" size={12} tone="gold" />
                <span>Coach Scott Gordon Tactical Form Cues</span>
              </label>
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Recovery Directive Editor */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 4 }}>
                <GaaIcon name="shield" size={12} tone="gold" />
                <span>Next 48-Hour Recovery &amp; Nutrition Directive</span>
              </label>
              <textarea
                value={recoveryDirective}
                onChange={e => setRecoveryDirective(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Package Deduction Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={deductCredit}
                onChange={e => setDeductCredit(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--gold)' }}
              />
              <span>Deduct 1 consultation credit from athlete&apos;s active coaching package</span>
            </label>

            {errorMsg && (
              <div style={{ color: '#F87171', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 4 }}>
                {errorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDispatch}
                disabled={submitting}
                className="tactile-btn"
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <GaaIcon name="award" size={16} tone="white" />
                <span>{submitting ? 'Dispatching...' : 'Dispatch Takeaway & Conclude Session'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
