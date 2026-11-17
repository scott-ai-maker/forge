'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
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
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

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
  const [emergencyName, setEmergencyName] = useState<string>(initialAnswers?.emergencyContactName ?? '')
  const [emergencyPhone, setEmergencyPhone] = useState<string>(initialAnswers?.emergencyContactPhone ?? '')
  const [signature, setSignature] = useState<string>(initialAnswers?.signedWaiverName ?? '')
  const [agreedToWaiver, setAgreedToWaiver] = useState<boolean>(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) {
      dialog.showModal()
    }
    const handleNativeClose = () => {
      dialog.returnValue = ''
      onCloseRef.current?.()
    }
    dialog.addEventListener('close', handleNativeClose)
    return () => {
      dialog.removeEventListener('close', handleNativeClose)
    }
  }, [])

  const evaluation: ParqEvaluationResult = evaluateMedicalParq(answers)

  const handleToggle = (key: keyof ParqAnswers) => {
    setAnswers(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleCloseClick = () => {
    const dialog = dialogRef.current
    if (dialog?.open) {
      dialog.close()
      return
    }
    onClose?.()
  }

  const handleSave = () => {
    if (!signature.trim() || !agreedToWaiver || !emergencyName.trim() || !emergencyPhone.trim()) return

    const payload: ParqAnswers = {
      ...answers,
      reportedConditionsNotes: notes.trim(),
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      signedWaiverName: signature.trim(),
      signedAt: new Date().toISOString(),
    }

    if (onSaveParq) {
      onSaveParq(payload, evaluation)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClick={e => {
        if (e.target === e.currentTarget && onClose) {
          handleCloseClick()
        }
      }}
      style={{
        zIndex: 100050,
        pointerEvents: 'auto',
        margin: 'auto',
        width: 'min(96vw, 720px)',
        maxWidth: 720,
        maxHeight: '92vh',
        padding: 0,
        border: '1px solid var(--navy-lt)',
        background: 'var(--navy-mid)',
        color: 'var(--white)',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          background: 'var(--navy-mid)',
          padding: 'clamp(18px, 4vw, 32px)',
          display: 'grid',
          gap: 20,
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
            <h2
              id={headingId}
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
            </h2>
          </div>

          {onClose && (
            <button
              type="button"
              aria-label="Close medical screening"
              onClick={handleCloseClick}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                color: 'var(--gray)',
                cursor: 'pointer',
                minWidth: 44,
                minHeight: 44,
                padding: 8,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GaaIcon name="close" size={16} tone="slate" />
            </button>
          )}
        </div>

        {/* Real-time Clearance Status Badge */}
        <div
          role="status"
          aria-live="polite"
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
                  <span>Active cardiac, chest pain, or syncope flag detected. All exercise is paused (Phase 0 Hold) until written physician medical clearance is verified.</span>
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
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 18, fontWeight: 700, color: evaluation.maxAllowedOptPhase === 0 ? 'var(--error)' : 'var(--gold-lt)' }}>
              {evaluation.maxAllowedOptPhase === 0 ? 'Phase 0 Hold' : `Phase ${evaluation.maxAllowedOptPhase} Max`}
            </div>
          </div>
        </div>

        {/* 7-Question Checklist */}
        <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          <legend
            style={{
              fontSize: 11,
              color: 'var(--gold-lt)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Select any medical or orthopedic questions that apply to you (leave unchecked if No)
          </legend>
          {QUESTIONS.map((q, idx) => {
            const isYes = Boolean(answers[q.key])
            const inputId = `parq-check-${q.key}`
            return (
              <label
                key={q.key}
                htmlFor={inputId}
                className="tactile-btn"
                style={{
                  minHeight: 52,
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
                  <input
                    id={inputId}
                    name={q.key}
                    type="checkbox"
                    checked={isYes}
                    onChange={() => handleToggle(q.key)}
                    style={{
                      width: 18,
                      height: 18,
                      flexShrink: 0,
                      accentColor: isYes ? 'var(--error, #EF4444)' : 'var(--gold)',
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: isYes ? 'var(--error)' : 'var(--gold-lt)',
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <span style={{ fontSize: 13, color: isYes ? 'var(--white)' : 'var(--gray)', lineHeight: 1.5 }}>
                    {q.text}
                  </span>
                </div>

                <div
                  aria-hidden="true"
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
              </label>
            )
          })}
        </fieldset>

        {/* Optional Medical Notes */}
        <div>
          <label
            htmlFor="parq-orthopedic-notes"
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--gray)',
              textTransform: 'uppercase',
              marginBottom: 6,
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Orthopedic History &amp; Injury Specifics (Optional)
          </label>
          <textarea
            id="parq-orthopedic-notes"
            name="reportedConditionsNotes"
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

        {/* Mandatory Emergency Contact Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
          <div>
            <label htmlFor="parq-emergency-name" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Emergency Contact Name *
            </label>
            <input
              id="parq-emergency-name"
              name="emergencyContactName"
              type="text"
              value={emergencyName}
              onChange={e => setEmergencyName(e.target.value)}
              placeholder="e.g. Taylor Vance"
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(8,14,20,0.7)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'var(--white)',
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label htmlFor="parq-emergency-phone" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Emergency Contact Phone *
            </label>
            <input
              id="parq-emergency-phone"
              name="emergencyContactPhone"
              type="tel"
              value={emergencyPhone}
              onChange={e => setEmergencyPhone(e.target.value)}
              placeholder="e.g. 617-555-0199"
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(8,14,20,0.7)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'var(--white)',
                fontSize: 13,
              }}
            />
          </div>
        </div>

        {/* Informed Consent & Liability Acknowledgment */}
        <div style={{ background: 'rgba(8,14,20,0.7)', padding: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: 12 }}>
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Legal Disclaimer &amp; Informed Consent
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
            {evaluation.legalDisclaimer}
          </p>

          <label htmlFor="parq-waiver-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
            <input
              id="parq-waiver-checkbox"
              type="checkbox"
              checked={agreedToWaiver}
              onChange={e => setAgreedToWaiver(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: 'var(--gold)' }}
            />
            <span style={{ fontSize: 12.5, color: 'var(--white)', fontWeight: 600, lineHeight: 1.5 }}>
              I confirm that I am at least 18 years old, have disclosed all relevant medical/orthopedic conditions, and voluntarily agree to the Athletic Assumption of Risk, Release of Liability, and ESIGN Electronic Signature terms.
            </span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12, marginTop: 6 }}>
            <div>
              <label htmlFor="parq-legal-signature" style={{ display: 'block', fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>
                Full Legal Electronic Signature (ESIGN / M.G.L. c. 110G)
              </label>
              <input
                id="parq-legal-signature"
                name="signedWaiverName"
                type="text"
                autoComplete="name"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Type your full legal name"
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
                disabled={!agreedToWaiver || !signature.trim() || !emergencyName.trim() || !emergencyPhone.trim()}
                className="tactile-btn"
                style={{
                  width: '100%',
                  padding: '11px 22px',
                  background: agreedToWaiver && signature.trim() && emergencyName.trim() && emergencyPhone.trim() ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: agreedToWaiver && signature.trim() && emergencyName.trim() && emergencyPhone.trim() ? 'var(--navy)' : 'var(--gray)',
                  fontFamily: 'var(--font-sans, Raleway), sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: agreedToWaiver && signature.trim() && emergencyName.trim() && emergencyPhone.trim() ? 'pointer' : 'not-allowed',
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
    </dialog>
  )
}

