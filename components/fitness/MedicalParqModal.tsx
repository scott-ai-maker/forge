'use client'

import React, { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  evaluateMedicalParq,
  ParqAnswers,
  ParqEvaluationResult,
} from '@/lib/liability-shield'

interface MedicalParqModalProps {
  initialAnswers?: ParqAnswers
  onSaveParq?: (answers: ParqAnswers, evaluation: ParqEvaluationResult) => void
  onClose?: () => void
}

const QUESTIONS: { key: keyof Omit<ParqAnswers, 'reportedConditionsNotes' | 'signedWaiverName' | 'signedAt'>; text: string; severity: 'high' | 'moderate' }[] = [
  {
    key: 'hasHeartCondition',
    text: 'Has your doctor ever told you that you have a heart condition or that you should only do physical activity recommended by a doctor?',
    severity: 'high',
  },
  {
    key: 'experiencesChestPain',
    text: 'Do you feel pain in your chest when you engage in physical activity or at rest?',
    severity: 'high',
  },
  {
    key: 'experiencesDizzinessOrSyncope',
    text: 'In the past month, have you had chest pain when you were not doing physical activity, or do you lose balance because of dizziness or loss of consciousness?',
    severity: 'high',
  },
  {
    key: 'hasBoneOrJointProblem',
    text: 'Do you have a bone or joint problem (e.g. back, knee, hip, shoulder) that could be made worse by a change in your physical activity?',
    severity: 'moderate',
  },
  {
    key: 'takesBloodPressureOrHeartMedication',
    text: 'Is your doctor currently prescribing medications for your blood pressure, water retention, or heart condition?',
    severity: 'high',
  },
  {
    key: 'hasChronicSpinalOrDiscCondition',
    text: 'Do you have a history of chronic lumbar spine issues, disc herniation, sciatica, or severe back spasms?',
    severity: 'moderate',
  },
  {
    key: 'hasRecentSurgeryOrInjury',
    text: 'Have you had a surgical operation or acute orthopedic injury within the past 12 months?',
    severity: 'moderate',
  },
]

export default function MedicalParqModal({
  initialAnswers,
  onSaveParq,
  onClose,
}: MedicalParqModalProps) {
  const [answers, setAnswers] = useState<ParqAnswers>(
    initialAnswers ?? {
      hasHeartCondition: false,
      experiencesChestPain: false,
      experiencesDizzinessOrSyncope: false,
      hasBoneOrJointProblem: false,
      takesBloodPressureOrHeartMedication: false,
      hasChronicSpinalOrDiscCondition: false,
      hasRecentSurgeryOrInjury: false,
      reportedConditionsNotes: '',
      signedWaiverName: '',
      signedAt: new Date().toISOString(),
    }
  )

  const [notes, setNotes] = useState<string>(initialAnswers?.reportedConditionsNotes ?? '')
  const [signature, setSignature] = useState<string>(initialAnswers?.signedWaiverName ?? '')
  const [agreedToWaiver, setAgreedToWaiver] = useState<boolean>(Boolean(initialAnswers?.signedWaiverName))

  const evaluation: ParqEvaluationResult = evaluateMedicalParq(answers)

  const handleToggle = (key: keyof ParqAnswers) => {
    setAnswers(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = () => {
    if (!signature.trim() || !agreedToWaiver) return

    const payload: ParqAnswers = {
      ...answers,
      reportedConditionsNotes: notes.trim(),
      signedWaiverName: signature.trim(),
      signedAt: new Date().toISOString(),
    }

    if (onSaveParq) {
      onSaveParq(payload, evaluation)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,13,0.92)',
        backdropFilter: 'blur(8px)',
        zIndex: 100050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'var(--navy-mid)',
          border: '1px solid var(--navy-lt)',
          padding: 'clamp(18px, 4vw, 32px)',
          display: 'grid',
          gap: 20,
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--gold-lt)',
              }}
            >
              Clinical Intake &amp; Liability Shield (NASM CPT-7 Appendix D)
            </span>
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
              Physical Activity Readiness &amp; Liability Acknowledgment
            </h3>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <GaaIcon name="close" size={16} tone="slate" />
            </button>
          )}
        </div>

        {/* Real-time Clearance Status Badge */}
        <div
          style={{
            padding: '14px 18px',
            background:
              evaluation.clearanceStatus === 'physician_clearance_required'
                ? 'rgba(248,113,113,0.15)'
                : evaluation.clearanceStatus === 'cleared_with_modifications'
                ? 'rgba(197,160,89,0.15)'
                : 'rgba(52,211,153,0.15)',
            border: `1px solid ${
              evaluation.clearanceStatus === 'physician_clearance_required'
                ? 'var(--error)'
                : evaluation.clearanceStatus === 'cleared_with_modifications'
                ? 'var(--gold)'
                : 'var(--success)'
            }`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>
              Status: {evaluation.riskTier}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              {evaluation.clearanceStatus === 'physician_clearance_required' ? (
                <>
                  <GaaIcon name="alert-triangle" size={14} tone="ruby" />
                  <span>High cardiovascular/medical risk flag detected. Physician consultation required before Phase 4/5 heavy loading.</span>
                </>
              ) : evaluation.clearanceStatus === 'cleared_with_modifications' ? (
                <>
                  <GaaIcon name="lightning" size={14} tone="gold" />
                  <span>Cleared with customized orthopedic modifications for flagged joints.</span>
                </>
              ) : (
                <>
                  <GaaIcon name="check" size={14} tone="emerald" />
                  <span>Cleared for unrestricted 5-phase OPT™ programming.</span>
                </>
              )}
            </div>
          </div>

          <div className="tabular-nums" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Max Allowed Phase</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)' }}>
              Phase {evaluation.maxAllowedOptPhase} Max
            </div>
          </div>
        </div>

        {/* 7-Question Checklist */}
        <div style={{ display: 'grid', gap: 12 }}>
          {QUESTIONS.map((q, idx) => {
            const isYes = Boolean(answers[q.key])
            return (
              <div
                key={q.key}
                onClick={() => handleToggle(q.key)}
                className="tactile-btn"
                style={{
                  padding: '14px 16px',
                  background: isYes ? 'rgba(248,113,113,0.1)' : 'rgba(8,14,20,0.6)',
                  border: isYes ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 16, fontWeight: 700, color: isYes ? 'var(--error)' : 'var(--gold-lt)' }}>
                    0{idx + 1}
                  </span>
                  <span style={{ fontSize: 13, color: isYes ? 'var(--white)' : 'var(--gray)', lineHeight: 1.5 }}>
                    {q.text}
                  </span>
                </div>

                <div
                  style={{
                    padding: '6px 14px',
                    background: isYes ? 'var(--error)' : 'rgba(255,255,255,0.08)',
                    color: isYes ? '#fff' : 'var(--gray)',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isYes ? 'YES (FLAGGED)' : 'NO'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Optional Medical Notes */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em', fontWeight: 600 }}>
            Orthopedic History &amp; Injury Specifics (Optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. L4/L5 disc herniation in 2023, cleared by PT; mild right patellar tendonitis."
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(8,14,20,0.7)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--white)',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
        </div>

        {/* Informed Consent & Liability Acknowledgment */}
        <div style={{ background: 'rgba(8,14,20,0.7)', padding: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: 12 }}>
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Legal Disclaimer &amp; Informed Consent
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
            {evaluation.legalDisclaimer}
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
            <input
              type="checkbox"
              checked={agreedToWaiver}
              onChange={e => setAgreedToWaiver(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--gold)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 600 }}>
              I have read and voluntarily agree to the informed consent terms and liability waiver.
            </span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12, marginTop: 6 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>
                Full Digital Signature
              </label>
              <input
                type="text"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Type your legal full name"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(14,23,36,0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--white)',
                  fontSize: 14,
                  fontFamily: 'Raleway, sans-serif',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={!agreedToWaiver || !signature.trim()}
                className="tactile-btn"
                style={{
                  width: '100%',
                  padding: '11px 22px',
                  background: agreedToWaiver && signature.trim() ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: agreedToWaiver && signature.trim() ? 'var(--navy)' : 'var(--gray)',
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: agreedToWaiver && signature.trim() ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <GaaIcon name="check" size={16} tone={agreedToWaiver && signature.trim() ? 'inherit' : 'slate'} />
                <span>Complete Medical Screening</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

