'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  COACH_CREDENTIALS,
  getCredentialCategories,
  getCredentialStats,
  CREDLY_PROFILE_URL,
  CREDLY_BADGES_TOTAL,
  FEATURED_CREDLY_BADGES,
  type CoachCredential,
} from '@/data/coach-credentials'

export default function CoachCredentialsShowcase() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>('nasm-cpt')
  const [activeModalCredential, setActiveModalCredential] = useState<CoachCredential | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const categories = useMemo(() => getCredentialCategories(), [])
  const stats = useMemo(() => getCredentialStats(), [])

  const filteredCredentials = useMemo(() => {
    return COACH_CREDENTIALS.filter((cred) => {
      // Category / Status Filter
      let matchesFilter = true
      if (selectedFilter === 'verified') {
        matchesFilter = cred.status === 'active'
      } else if (selectedFilter !== 'all') {
        matchesFilter = cred.category === selectedFilter
      }

      // Search Query
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesFilter

      const matchesQuery =
        cred.code.toLowerCase().includes(query) ||
        cred.title.toLowerCase().includes(query) ||
        cred.summary.toLowerCase().includes(query) ||
        cred.issuer.toLowerCase().includes(query) ||
        (cred.certificateNumber && cred.certificateNumber.toLowerCase().includes(query)) ||
        cred.curriculum.some((item) => item.toLowerCase().includes(query)) ||
        (cred.gaaEngineIntegration && cred.gaaEngineIntegration.toLowerCase().includes(query))

      return matchesFilter && matchesQuery
    })
  }, [selectedFilter, searchQuery])

  // ESC key listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalCredential(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCopyCertificateNumber = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedId(num)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const primaryCpt = COACH_CREDENTIALS.find((c) => c.id === 'nasm-cpt')!
  const academicDegree = COACH_CREDENTIALS.find((c) => c.id === 'uop-bsit')
  const safetyCpr = COACH_CREDENTIALS.find((c) => c.id === 'asti-cpr-aed')!

  return (
    <div className="credentials-showcase-container" style={{ width: '100%', maxWidth: 1240, margin: '0 auto' }}>
      {/* ── TOP HERO HIGHLIGHT: TRIAD OF VERIFIED ACCREDITATIONS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 20,
          marginBottom: 36,
        }}
      >
        {/* NASM-CPT Primary Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.95) 0%, rgba(10, 18, 30, 0.98) 100%)',
            border: '1.5px solid rgba(197, 160, 89, 0.5)',
            borderRadius: 16,
            padding: 'clamp(20px, 3.5vw, 28px)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gold watermark glow */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {/* Authentic Badge Image */}
            {primaryCpt.badgeImage && (
              <div
                style={{
                  width: 104,
                  height: 104,
                  flexShrink: 0,
                  position: 'relative',
                  filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))',
                }}
              >
                <Image
                  src={primaryCpt.badgeImage}
                  alt="Official NASM Certified Personal Trainer Digital Badge"
                  width={104}
                  height={104}
                  priority
                  style={{ objectFit: 'contain' }}
                />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    color: '#34D399',
                    fontSize: 11,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <GaaIcon name="shield-check" size={13} tone="emerald" />
                  NCCA Accredited &amp; Active
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#94A3B8',
                    fontFamily: 'var(--font-telemetry)',
                  }}
                >
                  Expires: {primaryCpt.expirationDate}
                </span>
              </div>

              <h2
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.4rem, 2.8vw, 1.85rem)',
                  lineHeight: 1.15,
                  margin: '0 0 4px',
                  letterSpacing: '0.01em',
                }}
              >
                Certified Personal Trainer (NASM-CPT®)
              </h2>

              <p style={{ color: 'var(--gold-lt)', fontSize: 13, margin: '0 0 12px', fontWeight: 600 }}>
                National Academy of Sports Medicine
              </p>

              {/* Certificate Number & Copy */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Certificate #:
                </span>
                <span style={{ fontFamily: 'var(--font-telemetry)', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  {primaryCpt.certificateNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCertificateNumber(primaryCpt.certificateNumber!)}
                  title="Copy Certificate Number"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedId === primaryCpt.certificateNumber ? '#34D399' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '2px 4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon
                    name={copiedId === primaryCpt.certificateNumber ? 'shield-check' : 'clipboard'}
                    size={13}
                    tone={copiedId === primaryCpt.certificateNumber ? 'emerald' : 'slate'}
                  />
                  <span>{copiedId === primaryCpt.certificateNumber ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {primaryCpt.verificationUrl && (
                  <a
                    href={primaryCpt.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: 'var(--gold)',
                      color: '#080E14',
                      fontWeight: 700,
                      fontSize: 12,
                      fontFamily: 'var(--font-heading)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <GaaIcon name="award" size={14} tone="dark" />
                    Verify on Credential.net
                    <span aria-hidden="true" style={{ fontSize: 14 }}>↗</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setActiveModalCredential(primaryCpt)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#F8FAFC',
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GaaIcon name="sessions" size={14} tone="gold" />
                  View Certificate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BSIT Academic Foundations Card */}
        {academicDegree && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 26, 46, 0.95) 0%, rgba(10, 18, 30, 0.98) 100%)',
              border: '1.5px solid rgba(59, 130, 246, 0.5)',
              borderRadius: 16,
              padding: 'clamp(20px, 3.5vw, 28px)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Sapphire Blue Glow */}
            <div
              style={{
                position: 'absolute',
                top: -60,
                right: -60,
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              {/* Crest / Shield Icon */}
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1.5px solid rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#60A5FA',
                }}
              >
                <GaaIcon name="brain" size={36} tone="cyan" />
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    marginTop: 4,
                    color: '#93C5FD',
                  }}
                >
                  B.S. · BSIT
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      borderRadius: 9999,
                      background: 'rgba(59, 130, 246, 0.18)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#93C5FD',
                      fontSize: 11,
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <GaaIcon name="shield-check" size={13} tone="cyan" />
                    HLC Accredited · 3.72 GPA
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#94A3B8',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    Conferred: {academicDegree.conferredDate || 'September 2020'}
                  </span>
                </div>

                <h2
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.4rem, 2.8vw, 1.85rem)',
                    lineHeight: 1.15,
                    margin: '0 0 4px',
                    letterSpacing: '0.01em',
                  }}
                >
                  Bachelor of Science in Information Technology
                </h2>

                <p style={{ color: '#93C5FD', fontSize: 13, margin: '0 0 12px', fontWeight: 600 }}>
                  University of Phoenix · Advanced Software Development Track
                </p>

                {/* Track Details & GPA */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Program GPA:
                  </span>
                  <span style={{ fontFamily: 'var(--font-telemetry)', color: '#60A5FA', fontSize: 13, fontWeight: 700 }}>
                    3.72
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
                  <span style={{ fontSize: 11, color: '#CBD5E1' }}>
                    128 Total Credits (87 UOPX · 41 Transfer)
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a
                    href="https://www.phoenix.edu"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: 'rgba(59, 130, 246, 0.22)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      color: '#BFDBFE',
                      fontWeight: 700,
                      fontSize: 12,
                      fontFamily: 'var(--font-heading)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <GaaIcon name="award" size={14} tone="cyan" />
                    University Profile
                    <span aria-hidden="true" style={{ fontSize: 14 }}>↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setActiveModalCredential(academicDegree)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#F8FAFC',
                      fontWeight: 600,
                      fontSize: 12,
                      fontFamily: 'var(--font-heading)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <GaaIcon name="clipboard" size={14} tone="gold" />
                    View Coursework &amp; Transcript
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASTI CPR / AED Safety Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(28, 16, 20, 0.95) 0%, rgba(12, 16, 24, 0.98) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            borderRadius: 16,
            padding: 'clamp(20px, 3.5vw, 28px)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Red glow */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {/* ASTI Seal Icon Shield */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#EF4444',
              }}
            >
              <GaaIcon name="heart-rate" size={36} tone="ruby" />
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  marginTop: 4,
                  color: '#F87171',
                }}
              >
                CPR / AED
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#F87171',
                    fontSize: 11,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <GaaIcon name="shield-check" size={13} tone="ruby" />
                  Certified Active Safety
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#94A3B8',
                    fontFamily: 'var(--font-telemetry)',
                  }}
                >
                  Valid: {safetyCpr.issueDate} – {safetyCpr.expirationDate}
                </span>
              </div>

              <h2
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.4rem, 2.8vw, 1.85rem)',
                  lineHeight: 1.15,
                  margin: '0 0 4px',
                  letterSpacing: '0.01em',
                }}
              >
                Adult, Child &amp; Infant CPR / AED
              </h2>

              <p style={{ color: '#FCA5A5', fontSize: 13, margin: '0 0 12px', fontWeight: 600 }}>
                American Safety Training Institute (ASTI)
              </p>

              {/* Certificate Number & Copy */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Certification ID:
                </span>
                <span style={{ fontFamily: 'var(--font-telemetry)', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  {safetyCpr.certificateNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCertificateNumber(safetyCpr.certificateNumber!)}
                  title="Copy Certification ID"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedId === safetyCpr.certificateNumber ? '#34D399' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '2px 4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon
                    name={copiedId === safetyCpr.certificateNumber ? 'shield-check' : 'clipboard'}
                    size={13}
                    tone={copiedId === safetyCpr.certificateNumber ? 'emerald' : 'slate'}
                  />
                  <span>{copiedId === safetyCpr.certificateNumber ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href="https://www.AmericanSTI.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#FECACA',
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GaaIcon name="shield-check" size={14} tone="ruby" />
                  Verify at AmericanSTI.org
                  <span aria-hidden="true" style={{ fontSize: 14 }}>↗</span>
                </a>

                <button
                  type="button"
                  onClick={() => setActiveModalCredential(safetyCpr)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#F8FAFC',
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GaaIcon name="sessions" size={14} tone="gold" />
                  View Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DEDICATED CREDLY VERIFIED BADGES PORTFOLIO ── */}
      <section
        aria-label="Credly Verified Digital Credentials"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 22, 38, 0.95) 0%, rgba(8, 14, 24, 0.98) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 16,
          padding: 'clamp(20px, 3.5vw, 28px)',
          marginBottom: 36,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cyan / Electric blue ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header row with Credly Badge counter & Live CTA */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38BDF8',
                  fontSize: 11,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <GaaIcon name="shield-check" size={13} tone="cyan" />
                Credly by Pearson · Cryptographically Verified
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: 'var(--gold-lt)',
                  fontSize: 11,
                  fontFamily: 'var(--font-telemetry)',
                  fontWeight: 700,
                }}
              >
                {CREDLY_BADGES_TOTAL} Total Badges Conferred
              </span>
            </div>

            <h3
              style={{
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
                lineHeight: 1.2,
                margin: '0 0 6px',
              }}
            >
              Verified Engineering Portfolio: Cloud, AI &amp; DevOps
            </h3>

            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 760 }}>
              Official industry-standard accreditations conferred by <strong>Amazon Web Services</strong>, <strong>IBM</strong>, <strong>The Linux Foundation</strong>, <strong>Microsoft</strong>, and <strong>O&apos;Reilly Media</strong>. Every badge is cryptographically signed, issued with verifiable metadata, and publicly auditable.
            </p>
          </div>

          {/* Direct CTAs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setSelectedFilter('engineering')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: selectedFilter === 'engineering' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                border: selectedFilter === 'engineering' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.15)',
                color: selectedFilter === 'engineering' ? '#38BDF8' : '#E2E8F0',
                fontSize: 12,
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name="brain" size={13} tone="cyan" />
              Filter AI &amp; Cloud ({stats.engineeringCount})
            </button>

            <a
              href={CREDLY_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 12,
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name="award" size={14} tone="white" />
              Verify All 34 on Credly.com
              <span aria-hidden="true" style={{ fontSize: 14 }}>↗</span>
            </a>
          </div>
        </div>

        {/* Issuing Authorities Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
            alignItems: 'center',
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: 11,
            color: '#94A3B8',
          }}
        >
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: '#64748B' }}>
            Issuing Authorities:
          </span>
          <span style={{ color: '#F59E0B', fontWeight: 600 }}>• Amazon Web Services (AWS)</span>
          <span style={{ color: '#38BDF8', fontWeight: 600 }}>• IBM &amp; Coursera</span>
          <span style={{ color: '#34D399', fontWeight: 600 }}>• The Linux Foundation</span>
          <span style={{ color: '#60A5FA', fontWeight: 600 }}>• Microsoft Certification</span>
          <span style={{ color: '#F87171', fontWeight: 600 }}>• O&apos;Reilly Media</span>
        </div>

        {/* Flagship Featured Credly Badges Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
            gap: 14,
          }}
        >
          {FEATURED_CREDLY_BADGES.map((badge) => (
            <div
              key={badge.id}
              style={{
                background: 'rgba(10, 18, 30, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      flexShrink: 0,
                      position: 'relative',
                      filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5))',
                    }}
                  >
                    <Image
                      src={badge.imageUrl}
                      alt={badge.name}
                      width={56}
                      height={56}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#38BDF8',
                        fontFamily: 'var(--font-heading)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 700,
                        marginBottom: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {badge.issuer}
                    </div>
                    <h4
                      style={{
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 13,
                        lineHeight: 1.3,
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      {badge.name}
                    </h4>
                  </div>
                </div>

                {/* Skills pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {badge.skills.slice(0, 3).map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#CBD5E1',
                        fontFamily: 'var(--font-telemetry)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: 11,
                }}
              >
                <span style={{ color: '#64748B', fontFamily: 'var(--font-telemetry)' }}>
                  Issued {badge.issuedDate}
                </span>
                <a
                  href={badge.credlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#38BDF8',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span>Verify</span>
                  <span aria-hidden="true" style={{ fontSize: 11 }}>↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FILTER TABS & SEARCH BAR ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          padding: '16px 20px',
          background: 'rgba(14, 23, 36, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((cat) => {
            const isActive = selectedFilter === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedFilter(cat.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isActive ? 'var(--gold-lt)' : '#CBD5E1',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-telemetry)',
                    background: isActive ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Live Search */}
        <div style={{ minWidth: 220, flex: '1 1 240px', maxWidth: 320 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search credentials, topics, IDs..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 14px 8px 36px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748B',
                pointerEvents: 'none',
              }}
            >
              <GaaIcon name="target" size={14} tone="slate" />
            </div>
          </div>
        </div>
      </div>

      {/* ── ALL CREDENTIALS & BADGES GRID ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 18,
          marginBottom: 48,
        }}
      >
        {filteredCredentials.map((cred) => {
          const isExpanded = expandedId === cred.id
          const isActive = cred.status === 'active'
          const isPinnacle = cred.status === 'pinnacle'
          const isCompleted = cred.status === 'completed'

          return (
            <article
              key={cred.id}
              style={{
                background: isExpanded
                  ? 'rgba(19, 30, 48, 0.95)'
                  : isPinnacle
                  ? 'linear-gradient(135deg, rgba(30, 24, 10, 0.85) 0%, rgba(14, 23, 36, 0.85) 100%)'
                  : 'rgba(14, 23, 36, 0.75)',
                border: isExpanded
                  ? `1.5px solid ${cred.badgeTone}`
                  : isPinnacle
                  ? '1.5px solid rgba(234, 179, 8, 0.6)'
                  : isActive
                  ? '1px solid rgba(197, 160, 89, 0.35)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '18px 20px',
                transition: 'all 0.2s ease',
                boxShadow: isExpanded
                  ? `0 12px 28px rgba(0, 0, 0, 0.5), 0 0 16px ${cred.badgeTone}22`
                  : '0 4px 16px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {cred.badgeImage ? (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          position: 'relative',
                          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))',
                          cursor: 'pointer',
                        }}
                        onClick={() => setActiveModalCredential(cred)}
                      >
                        <Image
                          src={cred.badgeImage}
                          alt={cred.title}
                          width={44}
                          height={44}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: `${cred.badgeTone}18`,
                          border: `1px solid ${cred.badgeTone}50`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: cred.badgeTone,
                          flexShrink: 0,
                        }}
                      >
                        <GaaIcon name={cred.icon} size={18} tone="gold" />
                      </div>
                    )}
                    <div>
                      <span
                        style={{
                          fontFamily: 'var(--font-telemetry)',
                          fontSize: 13,
                          fontWeight: 800,
                          color: cred.badgeTone,
                          letterSpacing: '0.04em',
                          display: 'block',
                        }}
                      >
                        {cred.code}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#64748B',
                          fontFamily: 'var(--font-heading)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {cred.issuerShort} · {cred.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Status Chip */}
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: isActive
                        ? 'rgba(52, 211, 153, 0.15)'
                        : isCompleted
                        ? 'rgba(96, 165, 250, 0.15)'
                        : isPinnacle
                        ? 'rgba(234, 179, 8, 0.18)'
                        : 'rgba(255, 255, 255, 0.06)',
                      border: isActive
                        ? '1px solid rgba(52, 211, 153, 0.35)'
                        : isCompleted
                        ? '1px solid rgba(96, 165, 250, 0.35)'
                        : isPinnacle
                        ? '1px solid rgba(234, 179, 8, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isActive
                        ? '#34D399'
                        : isCompleted
                        ? '#60A5FA'
                        : isPinnacle
                        ? '#EAB308'
                        : '#94A3B8',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cred.statusLabel}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    lineHeight: 1.25,
                    margin: '0 0 8px',
                  }}
                >
                  {cred.title}
                </h3>

                {/* Certificate metadata if verified */}
                {cred.certificateNumber && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 12,
                      fontSize: 11,
                      color: '#94A3B8',
                      fontFamily: 'var(--font-telemetry)',
                      marginBottom: 10,
                    }}
                  >
                    <span>ID: <strong style={{ color: '#FFFFFF' }}>{cred.certificateNumber}</strong></span>
                    {cred.expirationDate && <span>Expires: {cred.expirationDate}</span>}
                    {cred.completionDate && <span>Completed: {cred.completionDate}</span>}
                  </div>
                )}

                {/* Summary */}
                <p
                  style={{
                    color: '#CBD5E1',
                    fontSize: 13,
                    lineHeight: 1.6,
                    margin: '0 0 14px',
                  }}
                >
                  {cred.summary}
                </p>

                {/* Curriculum topics toggle */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--gold-lt)',
                        margin: '0 0 8px',
                        fontWeight: 700,
                      }}
                    >
                      Curriculum &amp; Technical Competencies:
                    </p>
                    <ul
                      style={{
                        margin: '0 0 14px',
                        paddingLeft: 18,
                        color: '#94A3B8',
                        fontSize: 12,
                        lineHeight: 1.65,
                      }}
                    >
                      {cred.curriculum.map((topic, i) => (
                        <li key={i}>{topic}</li>
                      ))}
                    </ul>

                    {cred.gaaEngineIntegration && (
                      <div
                        style={{
                          background: 'rgba(8, 14, 24, 0.7)',
                          border: '1px solid rgba(197, 160, 89, 0.25)',
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 11.5,
                          color: '#E2E8F0',
                          lineHeight: 1.5,
                          marginBottom: 14,
                        }}
                      >
                        <strong style={{ color: 'var(--gold-lt)' }}>Forge Engine Application: </strong>
                        {cred.gaaEngineIntegration}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : cred.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--gold-lt)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{isExpanded ? 'Less details' : 'View curriculum'}</span>
                  <span aria-hidden="true">{isExpanded ? '▲' : '▼'}</span>
                </button>

                <div style={{ display: 'flex', gap: 6 }}>
                  {(cred.certificatePreviewImage || cred.badgeImage) && (
                    <button
                      type="button"
                      onClick={() => setActiveModalCredential(cred)}
                      title={cred.certificatePreviewImage ? 'View Certificate' : 'View Verified Badge'}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#F8FAFC',
                        fontSize: 11,
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {cred.certificatePreviewImage ? 'Certificate' : 'Badge'}
                    </button>
                  )}

                  {cred.verificationUrl && (
                    <a
                      href={cred.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Verify with Issuer"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--gold)',
                        color: 'var(--gold-lt)',
                        fontSize: 11,
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Verify</span>
                      <span aria-hidden="true" style={{ fontSize: 11 }}>↗</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* ── CERTIFICATE PREVIEW MODAL ── */}
      {activeModalCredential && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-modal-title"
          onClick={() => setActiveModalCredential(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 8, 14, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0B1320',
              border: '1.5px solid rgba(197, 160, 89, 0.4)',
              borderRadius: 16,
              maxWidth: 820,
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
              padding: 'clamp(20px, 3vw, 32px)',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setActiveModalCredential(null)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: 18 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--gold-lt)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Official Conferred Certificate
              </span>
              <h3
                id="cert-modal-title"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#FFFFFF',
                  fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)',
                  margin: '4px 0 6px',
                }}
              >
                {activeModalCredential.title}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
                Conferred to <strong>Scott Gordon</strong> by {activeModalCredential.issuer}
                {activeModalCredential.certificateNumber && (
                  <span> · Cert ID: <strong>{activeModalCredential.certificateNumber}</strong></span>
                )}
              </p>
            </div>

            {/* Certificate Image Preview */}
            {activeModalCredential.certificatePreviewImage && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  marginBottom: 20,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Image
                  src={activeModalCredential.certificatePreviewImage}
                  alt={`Official Certificate for ${activeModalCredential.title}`}
                  width={1200}
                  height={900}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            )}

            {/* Digital Badge Image Preview (Credly / Acclaim) */}
            {!activeModalCredential.certificatePreviewImage && activeModalCredential.badgeImage && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '36px 20px',
                  background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, rgba(10, 18, 30, 0.95) 100%)',
                  borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 140,
                    height: 140,
                    position: 'relative',
                    filter: 'drop-shadow(0 16px 28px rgba(0, 0, 0, 0.6))',
                    marginBottom: 16,
                  }}
                >
                  <Image
                    src={activeModalCredential.badgeImage}
                    alt={`Verified Digital Badge for ${activeModalCredential.title}`}
                    width={140}
                    height={140}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 9999,
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    color: '#34D399',
                    fontSize: 11,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <GaaIcon name="shield-check" size={13} tone="emerald" />
                  Verified Digital Credential · Credly by Pearson
                </div>
              </div>
            )}

            {/* Academic Coursework & Transcript Breakdown */}
            {activeModalCredential.coursework && activeModalCredential.coursework.length > 0 && (
              <div
                style={{
                  background: 'rgba(10, 18, 30, 0.95)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: 12,
                  padding: 'clamp(16px, 2.5vw, 24px)',
                  marginBottom: 20,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Academic Highlights Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Program Track</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 13, marginTop: 2 }}>Advanced Software Dev (ASD)</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cumulative GPA</div>
                    <div style={{ color: '#60A5FA', fontWeight: 800, fontSize: 16, marginTop: 2 }}>3.72 Program GPA</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Degree Conferred</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 13, marginTop: 2 }}>September 2020</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Credits</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 13, marginTop: 2 }}>128 (87 UOPX + 41 Transfer)</div>
                  </div>
                </div>

                {/* Coursework Table */}
                <h4
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-heading)',
                    color: '#93C5FD',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: '0 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GaaIcon name="brain" size={14} tone="cyan" />
                  Official Coursework &amp; Academic Performance Transcript
                </h4>

                <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#94A3B8', background: 'rgba(0, 0, 0, 0.4)' }}>
                        <th style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course ID</th>
                        <th style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Curriculum Title</th>
                        <th style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Credits</th>
                        <th style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeModalCredential.coursework.map((course, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--font-telemetry)', color: '#60A5FA', fontWeight: 700 }}>
                            {course.courseId}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#E2E8F0', fontWeight: 500 }}>
                            {course.title}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', color: '#94A3B8' }}>
                            {course.credits}.00
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                fontFamily: 'var(--font-telemetry)',
                                background: course.grade.startsWith('A')
                                  ? 'rgba(52, 211, 153, 0.15)'
                                  : 'rgba(96, 165, 250, 0.15)',
                                color: course.grade.startsWith('A') ? '#34D399' : '#93C5FD',
                                border: `1px solid ${course.grade.startsWith('A') ? 'rgba(52, 211, 153, 0.3)' : 'rgba(96, 165, 250, 0.3)'}`,
                              }}
                            >
                              {course.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: 11,
                    color: '#94A3B8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <span>Prior Transfer Credits: <strong>Fitchburg State University (12.00) · Mount Wachusett Community College (29.00)</strong></span>
                  <span>Institutional Accreditation: <strong>Higher Learning Commission (HLC)</strong></span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                paddingTop: 16,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                {activeModalCredential.isNccaAccredited && (
                  <span>National Commission for Certifying Agencies (NCCA) Accredited</span>
                )}
                {activeModalCredential.category === 'academic' && (
                  <span>Higher Learning Commission (HLC) Regionally Accredited University Degree</span>
                )}
                {activeModalCredential.category === 'engineering' && (
                  <span>Cryptographically Signed &amp; Publicly Audited via Credly by Pearson</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {activeModalCredential.certificatePdf && (
                  <a
                    href={activeModalCredential.certificatePdf}
                    download
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'var(--font-heading)',
                      textDecoration: 'none',
                    }}
                  >
                    <GaaIcon name="clipboard" size={13} tone="gold" />
                    Download PDF
                  </a>
                )}

                {activeModalCredential.verificationUrl && (
                  <a
                    href={activeModalCredential.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: 'var(--gold)',
                      color: '#080E14',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                      textDecoration: 'none',
                    }}
                  >
                    <GaaIcon name="award" size={13} tone="dark" />
                    Verify on Issuer Portal
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
