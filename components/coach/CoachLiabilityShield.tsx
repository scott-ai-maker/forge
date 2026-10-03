'use client'

import React from 'react'
import {
  CONTRAINDICATION_RULES,
  ParqEvaluationResult,
} from '@/lib/liability-shield'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface CoachLiabilityShieldProps {
  evaluation?: ParqEvaluationResult | null
  clientName?: string
  signedWaiverName?: string | null
  signedAt?: string | null
}

export default function CoachLiabilityShield({
  evaluation = {
    clearanceStatus: 'cleared_unrestricted',
    riskTier: 'Low Risk',
    flaggedQuestionsCount: 0,
    flaggedItems: [],
    maxAllowedOptPhase: 5,
    contraindicationTags: [],
    legalDisclaimer: 'Standard liability waiver signed.',
  },
  clientName = 'Client',
  signedWaiverName = 'Verified on file',
  signedAt,
}: CoachLiabilityShieldProps) {
  const isHighRisk = evaluation?.clearanceStatus === 'physician_clearance_required'
  const isModerateRisk = evaluation?.clearanceStatus === 'cleared_with_modifications'

  const activeRules = (evaluation?.contraindicationTags ?? []).map(tag => CONTRAINDICATION_RULES[tag]).filter(Boolean)

  return (
    <div className="glass-card" style={{ padding: '24px 28px', display: 'grid', gap: 20 }}>
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
              Legal & Medical Shield
            </span>
            <span style={{ color: 'var(--gray)', fontSize: 13 }}>
              PAR-Q+ Risk Stratification & Contraindication Blacklist
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
            Medical Clearance & Liability Shield: {clientName}
          </h3>
        </div>

        <div className="tabular-nums" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Max Authorized OPT Phase</div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 22, color: isHighRisk ? 'var(--error)' : 'var(--gold-lt)', lineHeight: 1 }}>
            Phase {evaluation?.maxAllowedOptPhase ?? 5} Max
          </div>
        </div>
      </div>

      {/* Clearance Overview Banner */}
      <div
        className={isHighRisk ? 'glass-card' : 'glass-card-gold'}
        style={{
          padding: 18,
          border: `1px solid ${isHighRisk ? 'var(--error)' : isModerateRisk ? 'var(--gold)' : 'var(--success)'}`,
          background: isHighRisk ? 'rgba(248,113,113,0.1)' : 'rgba(8,14,20,0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: isHighRisk ? 'var(--error)' : 'var(--white)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            {isHighRisk ? (
              <>
                <GaaIcon name="alert-triangle" size={16} tone="ruby" />
                <span>PHYSICIAN CLEARANCE REQUIRED</span>
              </>
            ) : isModerateRisk ? (
              <>
                <GaaIcon name="lightning" size={16} tone="amber" />
                <span>CLEARED WITH BIOMECHANICAL MODIFICATIONS</span>
              </>
            ) : (
              <>
                <GaaIcon name="shield-check" size={16} tone="emerald" />
                <span>CLEARED FOR UNRESTRICTED PERFORMANCE</span>
              </>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
            Digital Waiver Signed by: <strong style={{ color: 'var(--white)' }}>{signedWaiverName ?? 'On File'}</strong>
            {signedAt && ` on ${new Date(signedAt).toLocaleDateString()}`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '4px 10px',
              background: isHighRisk ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)',
              border: `1px solid ${isHighRisk ? 'var(--error)' : 'var(--success)'}`,
              color: isHighRisk ? 'var(--error)' : 'var(--success)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {evaluation?.riskTier ?? 'Low Risk'}
          </span>
          {!isHighRisk && (
            <a
              href="?tab=onboarding#workspace-tab-content"
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                fontSize: 11.5,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Proceed to Stage 3 &amp; 4: AI Scanners ➔</span>
            </a>
          )}
        </div>
      </div>

      {/* Flagged Medical Symptoms */}
      {evaluation?.flaggedItems && evaluation.flaggedItems.length > 0 && (
        <div style={{ background: 'rgba(8,14,20,0.6)', padding: 16, border: '1px solid rgba(248,113,113,0.3)' }}>
          <div style={{ color: 'var(--error)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="alert-triangle" size={13} tone="ruby" />
            <span>Active Medical / Orthopedic Red Flags ({evaluation.flaggedItems.length})</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--white)', fontSize: 13, lineHeight: 1.6 }}>
            {evaluation.flaggedItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Biomechanical Contraindication & Substitution Rules */}
      {activeRules.length > 0 ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--gold-lt)', letterSpacing: '0.04em' }}>
              Enforced Exercise Blacklists & Safe Substitutions
            </h4>
            <a
              href="?tab=program"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#0A0E18',
                fontWeight: 800,
                fontSize: 11,
                textDecoration: 'none',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 10px rgba(212,160,23,0.3)',
              }}
            >
              <GaaIcon name="lightning" size={13} tone="inherit" />
              <span>Calibrate & Overwrite Program →</span>
            </a>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {activeRules.map((rule, idx) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  background: 'rgba(14,23,36,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="shield" size={14} tone="amber" />
                  <span>{rule.label}</span>
                </div>
                <div style={{ fontSize: 12, color: '#ff8787' }}>
                  <strong>Blacklisted Exercises:</strong> {rule.blacklistedExercises.join(' · ')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gold-lt)' }}>
                  <strong>Coach Guideline:</strong> {rule.generalGuideline}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: 14, background: 'rgba(8,14,20,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--gray)', fontSize: 13 }}>
          ✓ No active contraindications. Client is cleared for all standard barbell and compound movements.
        </div>
      )}
    </div>
  )
}

