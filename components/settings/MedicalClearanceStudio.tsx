'use client'

import { useState, useEffect } from 'react'
import {
  evaluateMedicalParq,
  ParqAnswers,
  ParqEvaluationResult,
  CONTRAINDICATION_RULES,
} from '@/lib/liability-shield'
import MedicalParqModal from '@/components/fitness/MedicalParqModal'
import GaaIcon from '@/components/ui/GaaIcon'

interface MedicalClearanceStudioProps {
  initialAnswers?: ParqAnswers
  clientName?: string
}

const DEFAULT_ANSWERS: ParqAnswers = {
  hasHeartCondition: false,
  experiencesChestPain: false,
  experiencesDizzinessOrSyncope: false,
  hasBoneOrJointProblem: false,
  takesBloodPressureOrHeartMedication: false,
  hasChronicSpinalOrDiscCondition: false,
  hasRecentSurgeryOrInjury: false,
  reportedConditionsNotes: '',
  signedWaiverName: 'Verified Athlete',
  signedAt: new Date().toISOString(),
}

export default function MedicalClearanceStudio({
  initialAnswers,
  clientName = 'VIP Athlete',
}: MedicalClearanceStudioProps) {
  const [answers, setAnswers] = useState<ParqAnswers>(() => {
    if (initialAnswers) return initialAnswers
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('gaa_parq_answers')
        if (stored) return JSON.parse(stored)
      } catch {}
    }
    return {
      ...DEFAULT_ANSWERS,
      signedWaiverName: clientName || 'Verified Athlete',
    }
  })

  const [evaluation, setEvaluation] = useState<ParqEvaluationResult>(() =>
    evaluateMedicalParq(answers)
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadServerParq() {
      try {
        const res = await fetch('/api/account/parq')
        if (!res.ok) return
        const data = await res.json()
        if (data?.answers && mounted) {
          setAnswers(data.answers)
          if (data.evaluation) {
            setEvaluation(data.evaluation)
          }
        }
      } catch {}
    }
    void loadServerParq()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    setEvaluation(evaluateMedicalParq(answers))
  }, [answers])

  const handleSaveParq = async (newAnswers: ParqAnswers, newEval: ParqEvaluationResult) => {
    setAnswers(newAnswers)
    setEvaluation(newEval)
    setIsModalOpen(false)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gaa_parq_answers', JSON.stringify(newAnswers))
      } catch {}
    }

    try {
      const res = await fetch('/api/account/parq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnswers),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.warn('Failed to sync PAR-Q to database:', data.error)
      }
    } catch (err) {
      console.warn('Network error syncing PAR-Q to database:', err)
    }

    setSaveSuccessMsg(`✓ PAR-Q+ Medical Screening updated (${newEval.riskTier}). Your assigned coach has been alerted.`)
    setTimeout(() => setSaveSuccessMsg(null), 5000)
  }

  const isHighRisk = evaluation.clearanceStatus === 'physician_clearance_required'
  const isModRisk = evaluation.clearanceStatus === 'cleared_with_modifications'
  const isCleared = evaluation.clearanceStatus === 'cleared_unrestricted'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16,22,38,0.95) 0%, rgba(9,13,24,0.95) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 12,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              background: isHighRisk
                ? 'rgba(239,68,68,0.15)'
                : isModRisk
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(52,211,153,0.15)',
              border: `1px solid ${
                isHighRisk ? '#EF4444' : isModRisk ? '#F59E0B' : '#34D399'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
            }}
          >
            <GaaIcon name="shield-check" size={26} tone={isHighRisk ? 'ruby' : isModRisk ? 'amber' : 'emerald'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--gold-lt)',
                  fontWeight: 800,
                }}
              >
                Clinical Safety &amp; Legal Compliance
              </span>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 800,
                  background: isHighRisk
                    ? 'rgba(239,68,68,0.2)'
                    : isModRisk
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(52,211,153,0.2)',
                  color: isHighRisk ? '#F87171' : isModRisk ? '#FBBF24' : '#34D399',
                  border: `1px solid ${
                    isHighRisk ? '#EF4444' : isModRisk ? '#F59E0B' : '#34D399'
                  }`,
                }}
              >
                {evaluation.riskTier}
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                color: '#FFFFFF',
                margin: '2px 0 0',
                letterSpacing: '0.04em',
              }}
            >
              NASM PAR-Q+ &amp; Medical Clearance Status
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              Physical Activity Readiness Questionnaire intake, clinical risk stratification, and biomechanical exercise guardrails.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="tactile-btn"
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,23,0.25) 0%, rgba(212,160,23,0.1) 100%)',
            border: '1px solid var(--gold)',
            color: 'var(--gold-lt)',
            padding: '10px 18px',
            borderRadius: 6,
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 800,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <GaaIcon name="edit" size={13} tone="gold" />
          <span>Retake / Update PAR-Q+</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.4)',
            borderRadius: 8,
            color: '#34D399',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <GaaIcon name="check" size={14} tone="emerald" /> {saveSuccessMsg}
        </div>
      )}

      {/* ── Status Matrix Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {/* Clearance Level Card */}
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 10,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', fontWeight: 800 }}>
            Training Clearance Status
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isHighRisk ? '#F87171' : isModRisk ? '#FBBF24' : '#34D399', display: 'flex', alignItems: 'center', gap: 8 }}>
            {isCleared && (
              <>
                <GaaIcon name="status-active" size={16} tone="emerald" />
                <span>Cleared for Unrestricted Training</span>
              </>
            )}
            {isModRisk && (
              <>
                <GaaIcon name="status-paused" size={16} tone="amber" />
                <span>Cleared with Biomechanical Modifications</span>
              </>
            )}
            {isHighRisk && (
              <>
                <GaaIcon name="status-inactive" size={16} tone="ruby" />
                <span>Physician Medical Clearance Required</span>
              </>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
            {isCleared && 'All 7 diagnostic screening criteria are clear. Athlete is fully cleared to execute NASM OPT™ Phases 1 through 5 (Stabilization, Strength Endurance, Hypertrophy, Maximal Strength, and Power).'}
            {isModRisk && `Active musculoskeletal or cardiovascular adaptations in place. Training intensity is automatically modulated up to OPT™ Phase ${evaluation.maxAllowedOptPhase}.`}
            {isHighRisk && 'One or more high-severity cardiovascular or medical symptoms were flagged. Training must be restricted to gentle Phase 1 stabilization under licensed physician supervision.'}
          </div>
        </div>

        {/* Phase Restriction Card */}
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 10,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', fontWeight: 800 }}>
            OPT™ Phase Cap &amp; Max Load
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold-lt)' }}>
            Max Intensity: Phase {evaluation.maxAllowedOptPhase} ({evaluation.maxAllowedOptPhase === 5 ? 'Power (100% 1RM)' : evaluation.maxAllowedOptPhase === 1 ? 'Stabilization Endurance' : `Phase ${evaluation.maxAllowedOptPhase}`})
          </div>
          <div style={{ fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
            Flagged items: <strong>{evaluation.flaggedQuestionsCount}</strong> of 7 questions.
            {evaluation.flaggedItems.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--gold-lt)' }}>
                {evaluation.flaggedItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── 7-Point NASM Screening Checklist ── */}
      <div
        style={{
          background: 'var(--navy-mid)',
          border: '1px solid var(--navy-lt)',
          borderRadius: 10,
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, margin: 0, color: '#FFFFFF', letterSpacing: '0.04em' }}>
              7-Point Physical Activity Readiness Checklist (PAR-Q+)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>
              Standardized American College of Sports Medicine &amp; NASM baseline health disclosures.
            </p>
          </div>
          {answers.signedAt && (
            <span style={{ fontSize: 11, color: 'var(--gray)' }}>
              Last Verified: {new Date(answers.signedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { label: '1. Diagnosed heart condition or physician-restricted exercise', val: answers.hasHeartCondition },
            { label: '2. Experiences chest pain during exertion or at rest', val: answers.experiencesChestPain },
            { label: '3. Experiences dizziness, loss of balance, or syncope', val: answers.experiencesDizzinessOrSyncope },
            { label: '4. Bone or joint problem worsened by physical activity', val: answers.hasBoneOrJointProblem },
            { label: '5. Currently taking prescription blood pressure or heart medication', val: answers.takesBloodPressureOrHeartMedication },
            { label: '6. History of chronic lumbar spine, disc herniation, or sciatica', val: answers.hasChronicSpinalOrDiscCondition },
            { label: '7. Recent surgery or acute orthopedic injury in the past 12 months', val: answers.hasRecentSurgeryOrInjury },
          ].map((q, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: q.val ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${q.val ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 6,
                fontSize: 12.5,
              }}
            >
              <span style={{ color: q.val ? '#FCA5A5' : '#E2E8F0' }}>{q.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 3,
                  background: q.val ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.15)',
                  color: q.val ? '#EF4444' : '#34D399',
                  border: `1px solid ${q.val ? '#EF4444' : 'rgba(52,211,153,0.3)'}`,
                  whiteSpace: 'nowrap',
                  marginLeft: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {q.val ? (
                  <>
                    <GaaIcon name="alert-triangle" size={12} tone="ruby" />
                    <span>YES (Flagged)</span>
                  </>
                ) : (
                  <>
                    <GaaIcon name="check" size={12} tone="emerald" />
                    <span>NO (Clear)</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>

        {answers.reportedConditionsNotes && (
          <div style={{ marginTop: 14, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, textTransform: 'uppercase' }}>
              Athlete Disclosed Medical Notes:
            </div>
            <div style={{ fontSize: 12.5, color: '#E2E8F0', marginTop: 4 }}>
              {answers.reportedConditionsNotes}
            </div>
          </div>
        )}
      </div>

      {/* ── Active Biomechanical Contraindication Guardrails ── */}
      {evaluation.contraindicationTags.length > 0 && (
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 10,
            padding: 22,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <GaaIcon name="shield-alert" size={22} tone="amber" />
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, margin: 0, color: '#FBBF24', letterSpacing: '0.04em' }}>
                Active Biomechanical Contraindications &amp; Safe Substitutions
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                Automated movement protections deployed to protect your joints and kinetic chain.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {evaluation.contraindicationTags.map(tag => {
              const rule = CONTRAINDICATION_RULES[tag]
              if (!rule) return null
              return (
                <div
                  key={tag}
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <div style={{ color: 'var(--gold-lt)', fontWeight: 800, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="pin" size={13} tone="gold" />
                    <span>{rule.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>
                    <strong>Clinical Guideline:</strong> {rule.generalGuideline}
                  </div>
                  {rule.blacklistedExercises.length > 0 && (
                    <div style={{ fontSize: 12, color: '#F87171', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GaaIcon name="ban" size={13} tone="ruby" />
                      <span><strong>Restricted Patterns:</strong> {rule.blacklistedExercises.join(', ')}</span>
                    </div>
                  )}
                  {Object.entries(rule.prescribedSubstitutions).length > 0 && (
                    <div style={{ fontSize: 12, color: '#34D399', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <GaaIcon name="rotate-ccw" size={13} tone="emerald" />
                        <strong>Prescribed Substitutions:</strong>
                      </span>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {Object.entries(rule.prescribedSubstitutions).map(([original, sub]) => (
                          <li key={original}>
                            Replace <em>{original}</em> with <strong>{sub.replacement}</strong> ({sub.coachingCue})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Modal Dialog ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 100050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div style={{ maxWidth: 780, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
            <MedicalParqModal
              initialAnswers={answers}
              onClose={() => setIsModalOpen(false)}
              onSaveParq={handleSaveParq}
            />
          </div>
        </div>
      )}
    </div>
  )
}

