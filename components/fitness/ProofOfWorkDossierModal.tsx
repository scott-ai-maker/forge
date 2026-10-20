'use client'

import React, { useState, useEffect } from 'react'
import ForgeIcon from '@/components/ui/ForgeIcon'
import {
  type ProofOfWorkDossier,
  buildProofOfWorkDossier,
  type BuildProofOfWorkParams,
} from '@/lib/proof-of-work-dossier-engine'
import { generateQrCodeSvg } from '@/lib/qr-code'
import { triggerHaptic } from '@/lib/offline-sync-queue'

export interface ProofOfWorkDossierModalProps {
  isOpen?: boolean
  onClose?: () => void
  dossier?: ProofOfWorkDossier
  initialParams?: BuildProofOfWorkParams
  isEmbedded?: boolean
}

export default function ProofOfWorkDossierModal({
  isOpen = true,
  onClose,
  dossier: providedDossier,
  initialParams,
  isEmbedded = false,
}: ProofOfWorkDossierModalProps) {
  const [dossier, setDossier] = useState<ProofOfWorkDossier>(() => {
    if (providedDossier) return providedDossier
    return buildProofOfWorkDossier(initialParams || { athleteName: 'Forge Athlete' })
  })

  const [copiedLink, setCopiedLink] = useState(false)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    if (providedDossier) {
      setDossier(providedDossier)
    } else if (initialParams) {
      setDossier(buildProofOfWorkDossier(initialParams))
    }
  }, [providedDossier, initialParams])

  useEffect(() => {
    if (dossier.peerInvitation.shareUrl) {
      generateQrCodeSvg(dossier.peerInvitation.shareUrl, {
        width: 140,
        darkColor: '#C5A059',
        lightColor: '#080E14',
      })
        .then(setQrSvg)
        .catch(() => {})
    }
  }, [dossier.peerInvitation.shareUrl])

  if (!isOpen && !isEmbedded) return null

  const handlePrint = () => {
    triggerHaptic('tap')
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleCopyShareLink = async () => {
    triggerHaptic('success')
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://forgeathletic.com'
    const shareUrl = dossier.shareToken
      ? `${origin}/pow/${dossier.shareToken}`
      : dossier.peerInvitation.shareUrl

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2500)
      }
    } catch {
      // Fallback
    }
  }

  const content = (
    <article
      data-testid="proof-of-work-dossier"
      className="proof-of-work-container"
      style={{
        width: '100%',
        maxWidth: 880,
        margin: '0 auto',
        background: '#070C16',
        border: '1.5px solid rgba(212, 175, 55, 0.45)',
        borderRadius: isEmbedded ? 0 : 16,
        padding: 'clamp(20px, 4vw, 36px)',
        color: '#F8FAFC',
        boxShadow: isEmbedded ? 'none' : '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.12)',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── TOP UTILITY TOOLBAR (HIDDEN IN PRINT) ── */}
      <div
        className="pow-no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 20,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 10px #10B981',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gold-lt, #F3E5AB)',
            }}
          >
            REF: {dossier.docRefId}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleCopyShareLink}
            data-testid="copy-pow-share-link"
            style={{
              background: copiedLink ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: copiedLink ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.2)',
              color: copiedLink ? '#34D399' : '#FFFFFF',
              borderRadius: 6,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-heading, sans-serif)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span>{copiedLink ? '✓ Copied Private Link' : '🔗 Copy Share Link'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            data-testid="print-pow-pdf"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: '1px solid #F3E5AB',
              color: '#0A0E18',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 800,
              fontFamily: 'var(--font-heading, sans-serif)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
            }}
          >
            <ForgeIcon name="award" size={13} tone="dark" />
            <span>Export Clinical PDF / Print</span>
          </button>

          {!isEmbedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dossier modal"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: 20,
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── VERIFIED EVIDENCE MANIFESTO BANNER ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(245, 158, 11, 0.25)',
              color: '#FDE68A',
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            VERIFIED CLINICAL EVIDENCE
          </span>
          <span style={{ fontSize: 12.5, color: '#E2E8F0', fontWeight: 600 }}>
            Official Evidence of Physical Adaptation · Hands on the Bar, 100% Focus
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-telemetry, monospace)',
            fontSize: 11,
            color: 'var(--gold-lt, #F3E5AB)',
            fontWeight: 700,
          }}
        >
          SEAL: {dossier.verificationSeal}
        </div>
      </div>

      {/* ── CLINICAL DOCUMENT HEADER ── */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--gold-lt, #F3E5AB)',
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            FORGE ATHLETIC · CLINICAL SPORTS SCIENCE
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading, Cinzel), Georgia, serif',
              fontSize: 'clamp(22px, 3.5vw, 30px)',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              margin: '0 0 6px',
            }}
          >
            Proof of Work Performance Dossier
          </h1>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>
            Biomechanical periodization audit &amp; verified progressive overload attestation.
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            minWidth: 180,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-telemetry, monospace)',
              textTransform: 'uppercase',
              color: '#64748B',
              letterSpacing: '0.08em',
            }}
          >
            Issued Date
          </div>
          <div
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-telemetry, monospace)',
              color: '#FFFFFF',
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            {dossier.generatedAt.slice(0, 10)}
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#34D399',
              fontWeight: 700,
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>✓ Verified Authenticity</span>
          </div>
        </div>
      </header>

      {/* ── ATHLETE & MACROCYCLE PROFILE ── */}
      <section
        aria-label="Athlete Profile"
        style={{
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.06em' }}>
            Athlete
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 3 }}>
            {dossier.athleteName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gold-lt, #F3E5AB)', marginTop: 2 }}>
            Initials: {dossier.athleteInitials} · Active Lifter
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.06em' }}>
            Periodization Stage
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginTop: 3 }}>
            {dossier.periodizationStage}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Focus: {dossier.macrocycleFocus}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.06em' }}>
            Master Coach Stewardship
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginTop: 3 }}>
            Scott Gordon
          </div>
          <div style={{ fontSize: 10.5, color: '#38BDF8', marginTop: 2 }}>
            NASM Master Trainer Candidate · CPT® · CES®
          </div>
        </div>
      </section>

      {/* ── 4 TOP-LINE CLINICAL KPIS ── */}
      <section
        aria-label="Key Performance Indicators"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(7, 12, 22, 0.9) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 800 }}>
            Mechanical Tonnage
          </div>
          <div
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--gold-lt, #F3E5AB)',
              marginTop: 4,
            }}
          >
            {dossier.totalTonnageLbs.toLocaleString()} <span style={{ fontSize: 13 }}>lbs</span>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
            Across {dossier.totalWorkingSets} heavy working sets
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 800 }}>
            ACWR Safety Index
          </div>
          <div
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 26,
              fontWeight: 800,
              color: '#34D399',
              marginTop: 4,
            }}
          >
            {dossier.acwrAudit.ratio ? dossier.acwrAudit.ratio.toFixed(2) : '1.08'}
          </div>
          <div style={{ fontSize: 11, color: '#34D399', fontWeight: 700, marginTop: 4 }}>
            ● {dossier.acwrAudit.zone} (Low Injury Risk)
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 800 }}>
            Sanctuary Focus Fidelity
          </div>
          <div
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 26,
              fontWeight: 800,
              color: dossier.sanctuaryAudit.badgeColor,
              marginTop: 4,
            }}
          >
            {dossier.sanctuaryAudit.averageFocusScore}%
          </div>
          <div style={{ fontSize: 11, color: dossier.sanctuaryAudit.badgeColor, fontWeight: 700, marginTop: 4 }}>
            {dossier.sanctuaryAudit.tierTitle}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 800 }}>
            Aerobic &amp; Vagal Recovery
          </div>
          <div
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 26,
              fontWeight: 800,
              color: '#38BDF8',
              marginTop: 4,
            }}
          >
            {dossier.sanctuaryAudit.totalBreathsRegulated} <span style={{ fontSize: 13 }}>cycles</span>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
            + {dossier.zone2CardioMins}m steady Zone 2 cardio
          </div>
        </div>
      </section>

      {/* ── SECTION 1: COMPOUND MOVEMENT 1RM OVERLOAD VAULT ── */}
      <section
        aria-label="Compound Lift Progression"
        style={{
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>🏋️</span>
            <span>Compound Overload Vault &amp; 1RM Progression</span>
          </h2>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-telemetry, monospace)' }}>
            Calculated via Brzycki In-Gym Formula
          </span>
        </div>

        <div
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.015)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#94A3B8',
                  fontFamily: 'var(--font-telemetry, monospace)',
                }}
              >
                <th style={{ padding: '10px 14px' }}>Compound Pattern</th>
                <th style={{ padding: '10px 14px' }}>Top Working Set</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Est. 1RM</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Overload Δ</th>
              </tr>
            </thead>
            <tbody>
              {dossier.compoundLifts.map((lift, idx) => (
                <tr
                  key={lift.exerciseName}
                  style={{
                    borderBottom: idx < dossier.compoundLifts.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#FFFFFF' }}>
                    <div>{lift.exerciseName}</div>
                    <div style={{ fontSize: 10, color: 'var(--gold-lt, #F3E5AB)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {lift.category}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-telemetry, monospace)', color: '#CBD5E1' }}>
                    {lift.topSetDisplay}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontWeight: 800,
                      color: 'var(--gold-lt, #F3E5AB)',
                      textAlign: 'right',
                    }}
                  >
                    {lift.current1RmLbs} <span style={{ fontSize: 10, color: '#94A3B8' }}>lbs</span>
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontWeight: 800,
                      color: '#34D399',
                      textAlign: 'right',
                    }}
                  >
                    +{lift.improvementPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SECTION 2: SANCTUARY MODE & AUTONOMIC RECORD ── */}
      <section
        aria-label="Sanctuary Mode Autonomics"
        style={{
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, rgba(7, 12, 22, 0.6) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 12,
          padding: '18px 20px',
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <h2
              style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                margin: 0,
              }}
            >
              Sanctuary Mode Autonomic &amp; Neuro-Discipline Record
            </h2>
          </div>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 9999,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {dossier.sanctuaryAudit.tierTitle} ({dossier.sanctuaryAudit.averageFocusScore}%)
          </span>
        </div>

        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#CBD5E1', margin: '0 0 14px' }}>
          {dossier.sanctuaryAudit.tierSubtitle}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700 }}>
              Zero-Distraction Time
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
              {dossier.sanctuaryAudit.totalZeroDistractionHours} Hours Logged
            </div>
            <div style={{ fontSize: 11, color: '#34D399', marginTop: 1 }}>
              Hands on bar, uninterrupted flow
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700 }}>
              Vagal Down-Regulation
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
              {dossier.sanctuaryAudit.totalBreathsRegulated} Breath Cycles
            </div>
            <div style={{ fontSize: 11, color: '#38BDF8', marginTop: 1 }}>
              Box 4x4 &amp; 4-2-6 Vagal Recovery
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700 }}>
              Interceptions
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
              {dossier.sanctuaryAudit.distractionInterceptions} Shield Interventions
            </div>
            <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 1 }}>
              Full neural recovery preserved
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: KINETIC SYMMETRY & S.O.A.P. AUDIT ── */}
      <section
        aria-label="Clinical SOAP Assessment"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '18px 20px',
          marginBottom: 28,
          background: 'rgba(255, 255, 255, 0.015)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <h2
            style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            Clinical S.O.A.P. Documentation &amp; Movement Balance
          </h2>
        </div>

        {/* Movement Symmetry Bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>
            <span>Kinetic Balance: Push {dossier.kineticDistribution.pushPct}% · Pull {dossier.kineticDistribution.pullPct}% · Squat {dossier.kineticDistribution.squatPct}% · Hinge {dossier.kineticDistribution.hingePct}%</span>
            <span style={{ color: '#34D399', fontWeight: 700 }}>Scapular &amp; Postural Symmetry Verified</span>
          </div>
          <div style={{ height: 6, width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 9999, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: `${dossier.kineticDistribution.pushPct}%`, background: '#38BDF8' }} title="Push" />
            <div style={{ width: `${dossier.kineticDistribution.pullPct}%`, background: '#34D399' }} title="Pull" />
            <div style={{ width: `${dossier.kineticDistribution.squatPct}%`, background: '#FBBF24' }} title="Squat" />
            <div style={{ width: `${dossier.kineticDistribution.hingePct}%`, background: '#F87171' }} title="Hinge" />
            <div style={{ width: `${dossier.kineticDistribution.carryCorePct}%`, background: '#A78BFA' }} title="Carry / Core" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt, #F3E5AB)', fontWeight: 800 }}>
              S · Subjective Assessment
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#CBD5E1', margin: '4px 0 0' }}>
              {dossier.soapAssessment.subjective}
            </p>
          </div>

          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt, #F3E5AB)', fontWeight: 800 }}>
              O · Objective Telemetry
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#CBD5E1', margin: '4px 0 0' }}>
              {dossier.soapAssessment.objective}
            </p>
          </div>

          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt, #F3E5AB)', fontWeight: 800 }}>
              A · Biomechanical Assessment
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#CBD5E1', margin: '4px 0 0' }}>
              {dossier.soapAssessment.assessment}
            </p>
          </div>

          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt, #F3E5AB)', fontWeight: 800 }}>
              P · Periodization Plan
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#CBD5E1', margin: '4px 0 0' }}>
              {dossier.soapAssessment.plan}
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: MASTER COACH GORDON ATTESTATION ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(212, 175, 55, 0.3)',
          paddingTop: 20,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748B', fontWeight: 800, letterSpacing: '0.08em' }}>
            Clinical Coach Gordon Attestation
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading, Cinzel), Georgia, serif',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--gold-lt, #F3E5AB)',
              marginTop: 2,
            }}
          >
            {dossier.coachGordonAttestation.signOff}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
            {dossier.coachGordonAttestation.credentials}
          </div>
          <div style={{ fontSize: 11, color: '#CBD5E1', fontStyle: 'italic', marginTop: 6, maxWidth: 500 }}>
            &ldquo;{dossier.coachGordonAttestation.clinicalNote}&rdquo;
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              border: '1.5px solid rgba(212, 175, 55, 0.6)',
              borderRadius: 6,
              background: 'rgba(212, 175, 55, 0.08)',
              fontFamily: 'var(--font-telemetry, monospace)',
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--gold-lt, #F3E5AB)',
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}
          >
            <div>CERTIFIED AUDIT</div>
            <div style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 2 }}>
              {dossier.verificationSeal}
            </div>
          </div>
        </div>
      </footer>

      {/* ── SECTION 5: CONFIDENTIAL PEER INVITATION / VIP PASS ── */}
      <section
        className="pow-peer-card"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(8, 14, 24, 0.9) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: 12,
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 540 }}>
          <div
            style={{
              display: 'inline-block',
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: 'var(--gold-lt, #F3E5AB)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {dossier.peerInvitation.invitationHeadline}
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              margin: '0 0 6px',
            }}
          >
            Gift 1 of 3 Founding Member Passes to a Training Partner
          </h3>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#CBD5E1', margin: '0 0 12px' }}>
            {dossier.peerInvitation.invitationBody}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--gold-lt, #F3E5AB)',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              CODE: {dossier.peerInvitation.referralCode}
            </span>

            <button
              type="button"
              onClick={handleCopyShareLink}
              style={{
                background: copiedLink ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                border: copiedLink ? '1px solid #10B981' : '1px solid #D4AF37',
                color: copiedLink ? '#34D399' : '#FFFFFF',
                borderRadius: 4,
                padding: '6px 14px',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-heading, sans-serif)',
                textTransform: 'uppercase',
              }}
            >
              {copiedLink ? '✓ Copied Pass Link' : 'Copy VIP Pass Link'}
            </button>

            {qrSvg && (
              <button
                type="button"
                onClick={() => setShowQr(prev => !prev)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94A3B8',
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {showQr ? 'Hide QR' : 'Show QR'}
              </button>
            )}
          </div>

          {showQr && qrSvg && (
            <div
              style={{
                marginTop: 12,
                background: '#080E14',
                padding: 10,
                borderRadius: 8,
                display: 'inline-block',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
        </div>

        {qrSvg && !showQr && (
          <div
            className="pow-no-print"
            style={{
              background: '#080E14',
              padding: 8,
              borderRadius: 8,
              border: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <span style={{ fontSize: 9, color: 'var(--gold-lt, #F3E5AB)', fontFamily: 'var(--font-telemetry, monospace)' }}>
              Scan to Claim VIP Pass
            </span>
          </div>
        )}
      </section>

      {/* ── PRINT STYLESHEET ENHANCEMENTS ── */}
      <style jsx global>{`
        @media print {
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          .pow-no-print {
            display: none !important;
          }
          .proof-of-work-container {
            background: #FFFFFF !important;
            color: #000000 !important;
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            padding: 16px !important;
            max-width: 100% !important;
          }
          .proof-of-work-container h1,
          .proof-of-work-container h2,
          .proof-of-work-container h3,
          .proof-of-work-container div,
          .proof-of-work-container span,
          .proof-of-work-container p,
          .proof-of-work-container td {
            color: #000000 !important;
          }
          .proof-of-work-container table {
            border: 1px solid #CCCCCC !important;
          }
          .pow-peer-card {
            border: 1px solid #000000 !important;
            background: #F8FAFC !important;
          }
        }
      `}</style>
    </article>
  )

  if (isEmbedded) {
    return content
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Proof of Work Performance Dossier"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(3, 6, 12, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        overflowY: 'auto',
      }}
    >
      {content}
    </div>
  )
}
