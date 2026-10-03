'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  CorporateCadence,
  CORPORATE_TIER_PRESETS,
  computeCorporateFinancials,
  generateCorporateDocRefId,
  generateCorporateProposalSignature,
  getProposalDeliverablesList,
} from '@/lib/corporate-proposal-engine'

interface CorporateProposalStudioProps {
  initialCompany?: string
  initialSponsor?: string
  initialTitle?: string
  initialSeats?: number
  initialCadence?: CorporateCadence
  isStandalonePage?: boolean
}

export default function CorporateProposalStudio({
  initialCompany = 'Apex Capital Partners',
  initialSponsor = 'Managing Partner',
  initialTitle = 'Executive Committee',
  initialSeats = 10,
  initialCadence = 'annual',
  isStandalonePage = false,
}: CorporateProposalStudioProps) {
  const [companyName, setCompanyName] = useState(initialCompany)
  const [sponsorName, setSponsorName] = useState(initialSponsor)
  const [sponsorTitle, setSponsorTitle] = useState(initialTitle)
  const [sponsorEmail, setSponsorEmail] = useState('')
  const [seats, setSeats] = useState(initialSeats)
  const [cadence, setCadence] = useState<CorporateCadence>(initialCadence)
  const [printTheme, setPrintTheme] = useState<'obsidian' | 'ivory'>('obsidian')
  const [copiedLink, setCopiedLink] = useState(false)
  const [submittingInquiry, setSubmittingInquiry] = useState(false)
  const [submittedInquiry, setSubmittedInquiry] = useState(false)
  const [inquiryError, setInquiryError] = useState<string | null>(null)

  // Calculations
  const financials = useMemo(() => computeCorporateFinancials(seats, cadence), [seats, cadence])
  const docRefId = useMemo(() => generateCorporateDocRefId(companyName, seats), [companyName, seats])
  const authSignature = useMemo(
    () => generateCorporateProposalSignature(companyName, financials.annualInvestment, seats),
    [companyName, financials.annualInvestment, seats]
  )
  const deliverables = useMemo(() => getProposalDeliverablesList(seats, cadence), [seats, cadence])

  const creationDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  const validUntilDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  // Clean up print classes on unmount
  useEffect(() => {
    const handleAfterPrint = () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('print-theme-ivory')
      }
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
      if (typeof document !== 'undefined') {
        document.body.classList.remove('print-theme-ivory')
      }
    }
  }, [])

  const handlePrint = (theme: 'obsidian' | 'ivory') => {
    if (typeof document !== 'undefined') {
      if (theme === 'ivory') {
        document.body.classList.add('print-theme-ivory')
      } else {
        document.body.classList.remove('print-theme-ivory')
      }
    }
    window.print()
  }

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.origin + '/corporate/proposal')
      url.searchParams.set('company', companyName)
      url.searchParams.set('sponsor', sponsorName)
      url.searchParams.set('title', sponsorTitle)
      url.searchParams.set('seats', String(seats))
      url.searchParams.set('cadence', cadence)
      navigator.clipboard.writeText(url.toString())
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 3000)
    }
  }

  const handleSubmitInquiry = async () => {
    setSubmittingInquiry(true)
    setInquiryError(null)

    try {
      const res = await fetch('/api/corporate/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactName: `${sponsorName} (${sponsorTitle})`,
          contactEmail: sponsorEmail || `${sponsorName.toLowerCase().replace(/\s+/g, '')}@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
          teamSize: `${seats} executive seats (${cadence})`,
          customGoals: `Pre-configured Proposal ${docRefId}: $${financials.activePrice.toLocaleString()} ${cadence}. Est. ${financials.estimatedAnnualHoursRecovered} hrs/yr recovered.`,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit proposal request')
      }
      setSubmittedInquiry(true)
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmittingInquiry(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* ── INTERACTIVE CONFIGURATION CONTROLS (Screen Only) ── */}
      <div
        className="no-print"
        style={{
          background: 'linear-gradient(180deg, rgba(13, 20, 36, 0.95) 0%, rgba(8, 12, 22, 0.95) 100%)',
          border: '1px solid rgba(212, 160, 23, 0.35)',
          borderRadius: 12,
          padding: 'clamp(18px, 3vw, 26px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span
              style={{
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--gold-lt)',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="building" size={13} tone="gold" />
              <span>Boardroom Proposal Engine</span>
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(20px, 3vw, 26px)',
                color: '#FFFFFF',
                margin: '4px 0 0',
                letterSpacing: '0.04em',
              }}
            >
              CUSTOMIZE ENTERPRISE AGREEMENT
            </h2>
          </div>

          {/* Quick Actions (Print & Share) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Print Theme Selector */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: 2,
              }}
            >
              <button
                type="button"
                onClick={() => setPrintTheme('obsidian')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: printTheme === 'obsidian' ? 'rgba(212,160,23,0.25)' : 'transparent',
                  color: printTheme === 'obsidian' ? 'var(--gold-lt)' : 'var(--gray)',
                }}
              >
                Obsidian PDF
              </button>
              <button
                type="button"
                onClick={() => setPrintTheme('ivory')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: printTheme === 'ivory' ? '#F8F9FA' : 'transparent',
                  color: printTheme === 'ivory' ? '#080E14' : 'var(--gray)',
                }}
              >
                Clean Ivory
              </button>
            </div>

            {/* Print Trigger Button */}
            <button
              type="button"
              onClick={() => handlePrint(printTheme)}
              className="tactile-btn"
              style={{
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080C16',
                border: 'none',
                padding: '9px 18px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="printer" size={13} tone="inherit" />
              <span>Export Boardroom PDF</span>
            </button>

            {/* Share Link Button */}
            <button
              type="button"
              onClick={handleCopyShareLink}
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: copiedLink ? '#34D399' : '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '9px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="copy" size={12} tone={copiedLink ? 'emerald' : 'white'} />
              <span>{copiedLink ? 'Link Copied!' : 'Share Proposal'}</span>
            </button>
          </div>
        </div>

        {/* Inputs Grid: Company, Sponsor Name, Title */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 5 }}>
              Target Organization / Firm
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Apex Capital Partners"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(5, 8, 15, 0.85)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 13.5,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 5 }}>
              Executive Sponsor / Recipient
            </label>
            <input
              type="text"
              value={sponsorName}
              onChange={e => setSponsorName(e.target.value)}
              placeholder="e.g. David Vance"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(5, 8, 15, 0.85)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 13.5,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 5 }}>
              Sponsor Title / Committee
            </label>
            <input
              type="text"
              value={sponsorTitle}
              onChange={e => setSponsorTitle(e.target.value)}
              placeholder="e.g. Managing Partner & CPO"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(5, 8, 15, 0.85)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 13.5,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Seat Tier Selection Pills */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Executive Seat Count Tier
            </label>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>
              Selected: <strong style={{ color: '#FFF' }}>{seats} Executive Seats</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {CORPORATE_TIER_PRESETS.map(tier => {
              const isSelected = seats === tier.seats
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSeats(tier.seats)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(212,160,23,0.18)' : 'rgba(0,0,0,0.4)',
                    border: isSelected ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--gold-lt)' : '#FFF' }}>
                    {tier.name}
                  </div>
                  <div className="font-telemetry font-mono" style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                    {tier.seats} seats · ${tier.annualPrice.toLocaleString()}/yr
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cadence Toggle & Top Metrics Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            background: 'rgba(0,0,0,0.4)',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Cadence Pills */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 700 }}>
              Term Agreement:
            </span>
            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.5)', padding: 3, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setCadence('annual')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  background: cadence === 'annual' ? 'var(--gold)' : 'transparent',
                  color: cadence === 'annual' ? '#080E14' : 'var(--gray)',
                  letterSpacing: '0.04em',
                }}
              >
                Annual Pass (Save ${financials.annualSavings.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => setCadence('monthly')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  background: cadence === 'monthly' ? 'var(--gold)' : 'transparent',
                  color: cadence === 'monthly' ? '#080E14' : 'var(--gray)',
                  letterSpacing: '0.04em',
                }}
              >
                Monthly Flexible
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
                Total Retainer
              </div>
              <div className="font-telemetry font-mono" style={{ fontSize: 18, color: 'var(--gold)', fontWeight: 700 }}>
                ${financials.activePrice.toLocaleString()}
                <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 400 }}> {cadence === 'annual' ? '/yr' : '/mo'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
                Effective Rate
              </div>
              <div className="font-telemetry font-mono" style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 700 }}>
                ${financials.perSeatMonthlyEffective}
                <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 400 }}> /exec/mo</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
                Est. Leadership ROI
              </div>
              <div className="font-telemetry font-mono" style={{ fontSize: 18, color: '#34D399', fontWeight: 700 }}>
                +{financials.estimatedAnnualHoursRecovered.toLocaleString()} hrs
                <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 400 }}> /yr</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── THE FORMAL BOARDROOM PROPOSAL DOCUMENT (Print & Screen View) ── */}
      <div
        className="corporate-proposal-document"
        style={{
          background: 'linear-gradient(180deg, #0D1424 0%, #080C16 100%)',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 14,
          padding: 'clamp(24px, 4.5vw, 44px)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          boxShadow: '0 20px 70px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans, Raleway), -apple-system, sans-serif',
        }}
      >
        {/* Background Watermark Seal */}
        <div className="dossier-watermark" style={{ position: 'absolute', top: -20, right: -20, zIndex: 0, pointerEvents: 'none' }}>
          <GaaMasterWatermarkSeal size={200} opacity={0.05} />
        </div>

        {/* ── Print-Only Formal Memorandum Running Header ── */}
        <div
          className="corporate-print-banner print-only"
          style={{
            display: 'none',
            borderBottom: '2px solid #D4A017',
            paddingBottom: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#D4A017', textTransform: 'uppercase' }}>
                GORDON ATHLETIC ADVISORY · INSTITUTIONAL SERVICES DIVISION
              </div>
              <div style={{ fontSize: 9.5, color: '#64748B', letterSpacing: '0.08em', marginTop: 2 }}>
                CONFIDENTIAL BOARDROOM MEMORANDUM · FOR EXECUTIVE COMMITTEE REVIEW ONLY
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 9.5, fontFamily: 'monospace' }}>
              <div>REF: {docRefId}</div>
              <div>DATE: {creationDate}</div>
            </div>
          </div>
        </div>

        {/* ── Masthead & Inscription ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 22, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: 'var(--gold-lt)',
                  fontWeight: 800,
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name="shield" size={12} tone="gold" />
                <span>RESTRICTED · INSTITUTIONAL PROPOSAL · LEVEL-1 EXECUTIVE DISTRIBUTION</span>
              </div>
              <h1
                className="font-serif"
                style={{
                  fontSize: 'clamp(24px, 3.8vw, 34px)',
                  color: '#FFFFFF',
                  margin: 0,
                  letterSpacing: '0.04em',
                  lineHeight: 1.18,
                }}
              >
                EXECUTIVE HUMAN PERFORMANCE INFRASTRUCTURE
              </h1>
              <div style={{ fontSize: 15, color: 'var(--gray)', marginTop: 6, fontWeight: 400 }}>
                Tailored Turnkey Advisory Agreement for <strong style={{ color: '#FFFFFF' }}>{companyName}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                className="font-telemetry font-mono"
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 12,
                  color: 'var(--gold-lt)',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                {docRefId}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>
                Auth Date: <span className="font-telemetry font-mono">{creationDate}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                Valid Thru: <span className="font-telemetry font-mono">{validUntilDate}</span>
              </div>
            </div>
          </div>

          {/* Context Metadata Pill Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginTop: 18,
              background: 'rgba(0,0,0,0.3)',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
                Client Organization
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                {companyName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
                Executive Sponsor
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                {sponsorName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
                Governance Scope
              </div>
              <div className="font-telemetry font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-lt)', marginTop: 2 }}>
                {seats} Principals · {cadence.toUpperCase()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
                Advisory Authority
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>
                SCOTT GORDON, NASM MASTER TRAINER
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: EXECUTIVE PROBLEM STATEMENT & STRATEGIC RATIONALE ── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            Section 01 // Executive Problem Statement &amp; Organizational Moat
          </div>
          <h3 className="font-serif" style={{ fontSize: 20, color: '#FFFFFF', margin: '0 0 12px', letterSpacing: '0.03em' }}>
            THE PHYSICAL CAPITAL OF THE EXECUTIVE SUITE
          </h3>
          <p style={{ fontSize: 13.5, color: '#E2E8F0', lineHeight: 1.65, margin: '0 0 14px' }}>
            In institutional asset management, legal partnerships, and high-growth technology, executive stamina directly dictates deal execution velocity and cognitive precision. High-performance principals sit 60+ hours weekly, endure brutal cross-country red-eye travel, and battle compounding spinal compression, erratic glucose volatility, and autonomic nervous system burnout.
          </p>
          <p style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
            <strong>Gordon Athletic Advisory (GAA)</strong> deploys turnkey, medical-grade sports science directly into your partners&apos; routines. By engineering structural spinal resilience, Tanaka Tanaka cardiovascular mitochondrial capacity, and rapid travel circadian recalibration, GAA transforms physical stamina into an unassailable firm-level competitive advantage.
          </p>
        </div>

        {/* ── SECTION 2: MULTI-SEAT FINANCIAL SCHEDULE & ROI ── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            Section 02 // Financial Agreement &amp; Multi-Seat Investment Schedule
          </div>
          <h3 className="font-serif" style={{ fontSize: 20, color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '0.03em' }}>
            INSTITUTIONAL RETAINER COMMITMENT
          </h3>

          <div
            style={{
              overflowX: 'auto',
              border: '1px solid rgba(212,160,23,0.35)',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(212,160,23,0.12)', borderBottom: '1px solid rgba(212,160,23,0.3)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--gold-lt)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Schedule Parameter
                  </th>
                  <th style={{ padding: '12px 16px', color: 'var(--gold-lt)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Prescribed Scope
                  </th>
                  <th style={{ padding: '12px 16px', color: 'var(--gold-lt)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Financial Telemetry
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#FFFFFF' }}>Prescribed Executive Seats</td>
                  <td style={{ padding: '12px 16px', color: '#CBD5E1' }}>Full sovereign app licenses &amp; biometrics</td>
                  <td className="font-telemetry font-mono" style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 700 }}>
                    {seats} Active Principals
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#FFFFFF' }}>Billing Cycle &amp; Terms</td>
                  <td style={{ padding: '12px 16px', color: '#CBD5E1' }}>
                    {cadence === 'annual' ? '12-Month Annual Pass (Consolidated ACH / Card)' : 'Monthly Flexible Agreement (30-Day Notice)'}
                  </td>
                  <td className="font-telemetry font-mono" style={{ padding: '12px 16px', color: 'var(--gold-lt)', fontWeight: 700 }}>
                    {cadence === 'annual' ? 'Annual Invoiced' : 'Monthly Recurring'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#FFFFFF' }}>Gross Annual Equivalent</td>
                  <td style={{ padding: '12px 16px', color: '#CBD5E1' }}>Full retail monthly value × 12 months</td>
                  <td className="font-telemetry font-mono" style={{ padding: '12px 16px', color: 'var(--gray)' }}>
                    ${(financials.monthlyInvestment * 12).toLocaleString()} / yr
                  </td>
                </tr>
                {cadence === 'annual' && (
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(52,211,153,0.06)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#34D399' }}>Institutional Annual Savings</td>
                    <td style={{ padding: '12px 16px', color: '#34D399' }}>2 Months Complimentary Sponsor Credit</td>
                    <td className="font-telemetry font-mono" style={{ padding: '12px 16px', color: '#34D399', fontWeight: 700 }}>
                      -${financials.annualSavings.toLocaleString()} ({financials.discountPct}% Discount)
                    </td>
                  </tr>
                )}
                <tr style={{ background: 'rgba(212,160,23,0.08)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#FFFFFF' }}>Net Retainer Investment</td>
                  <td style={{ padding: '14px 16px', color: '#FFFFFF' }}>
                    Effective ~<span className="font-telemetry font-mono">${financials.perSeatMonthlyEffective}</span>/executive/month
                  </td>
                  <td className="font-telemetry font-mono" style={{ padding: '14px 16px', color: 'var(--gold)', fontWeight: 800, fontSize: 17 }}>
                    ${financials.activePrice.toLocaleString()} {financials.billingIntervalText}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ROI Metric Highlight */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              marginTop: 14,
            }}
          >
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>
                Productivity &amp; Energy Hours Restored
              </div>
              <div className="font-telemetry font-mono" style={{ fontSize: 20, color: '#34D399', fontWeight: 700, marginTop: 4 }}>
                ~{financials.estimatedAnnualHoursRecovered.toLocaleString()} Hours / Year
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 2 }}>
                Reduced post-lunch energy crashes &amp; cervical strain
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>
                Projected Leadership Value Yield
              </div>
              <div className="font-telemetry font-mono" style={{ fontSize: 20, color: 'var(--gold-lt)', fontWeight: 700, marginTop: 4 }}>
                ~${(financials.estimatedEnterpriseValueCreated).toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 2 }}>
                Conservative ROI modeled at $350/executive hour
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: SCOPE OF SERVICES & DELIVERABLES MATRIX ── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            Section 03 // Turnkey Deliverables &amp; Service Commitments
          </div>
          <h3 className="font-serif" style={{ fontSize: 20, color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '0.03em' }}>
            SCOPE OF PERFORMANCE INFRASTRUCTURE
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
            {deliverables.map(item => (
              <div
                key={item.number}
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-telemetry font-mono" style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>
                    {item.number}
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(212,160,23,0.12)',
                      color: 'var(--gold-lt)',
                      border: '1px solid rgba(212,160,23,0.25)',
                    }}
                  >
                    {item.cadence}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--gold-lt)', fontWeight: 600 }}>
                  {item.headline}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--gray)', lineHeight: 1.55, margin: 0 }}>
                  {item.details}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 4: CLINICAL GOVERNANCE, LIABILITY & COMPLIANCE ── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            Section 04 // Clinical Governance, Data Privacy &amp; Liability Shield
          </div>
          <h3 className="font-serif" style={{ fontSize: 20, color: '#FFFFFF', margin: '0 0 12px', letterSpacing: '0.03em' }}>
            ACCREDITATION &amp; INSTITUTIONAL SAFEGUARDS
          </h3>

          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: 18,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-lt)', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <GaaIcon name="award" size={14} tone="gold" />
                <span>13-Point NASM® Sports Science Matrix</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.55, margin: 0 }}>
                Every program adheres strictly to the peer-reviewed NASM Optimum Performance Training (OPT™) model. Led personally by Master Trainer Scott Gordon across Corrective Exercise (CES), Performance Enhancement (PES), and Sports Nutrition (CSNC).
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60A5FA', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <GaaIcon name="shield" size={14} tone="cyan" />
                <span>Confidentiality &amp; Data Security</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.55, margin: 0 }}>
                Individual executive biometric and health telemetry data is strictly siloed under enterprise encryption. Corporate HR and sponsors receive only anonymized, aggregated readiness and cohort participation telemetry.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <GaaIcon name="check" size={14} tone="emerald" />
                <span>PAR-Q+ Clinical Triage</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.55, margin: 0 }}>
                Zero physical execution begins without digital PAR-Q+ risk screening, biometric intake clearance, and liability waivers, ensuring full corporate indemnification and medical diligence.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: SIGNATURE & BOARDROOM AUTHORIZATION BLOCK ── */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: 22,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          {/* Master Trainer Signature */}
          <div style={{ minWidth: 260 }}>
            <div
              className="font-serif"
              style={{
                fontSize: 16,
                color: 'var(--gold-lt)',
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}
            >
              SCOTT GORDON, NASM MASTER TRAINER
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
              Founder &amp; Performance Director · Gordon Athletic Advisory
            </div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
              NASM-CPT® · CES® · PES® · CNC™ · CSNC · Master Credentialed
            </div>
            <div
              style={{
                borderBottom: '1px dashed rgba(212,160,23,0.4)',
                width: 220,
                marginTop: 18,
                paddingBottom: 4,
                fontSize: 11,
                fontFamily: 'serif',
                fontStyle: 'italic',
                color: 'var(--gold)',
              }}
            >
              Scott Gordon (Authorized Master Desk)
            </div>
          </div>

          {/* Corporate Sponsor Acceptance Signature Line */}
          <div style={{ minWidth: 260 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
              ACCEPTED &amp; CONFIRMED FOR {companyName.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
              Sponsor: {sponsorName} ({sponsorTitle})
            </div>
            <div
              style={{
                borderBottom: '1px dashed rgba(255,255,255,0.3)',
                width: 220,
                marginTop: 26,
                paddingBottom: 4,
                fontSize: 10,
                color: 'var(--gray)',
              }}
            >
              Authorized Signature &amp; Date
            </div>
          </div>

          {/* Cryptographic Sovereign Hash & Boardroom Seal */}
          <div style={{ textAlign: 'right' }}>
            <div
              className="font-telemetry font-mono"
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 10,
                color: 'var(--gray)',
                letterSpacing: '0.06em',
              }}
            >
              <div>AUTH: {authSignature}</div>
              <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                SPEC: GAA-CORP-SOC2-V2 · CIP-005
              </div>
            </div>

            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#080C16',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 4,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 8,
              }}
            >
              <GaaIcon name="shield" size={11} tone="inherit" />
              <span>Boardroom Authorized</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ENGAGE / SUBMIT PROPOSAL INQUIRY MODAL / DOCK (Screen Only) ── */}
      <div
        className="no-print"
        style={{
          background: 'rgba(10, 16, 28, 0.9)',
          border: '1px solid rgba(212,160,23,0.3)',
          borderRadius: 12,
          padding: 'clamp(20px, 3.5vw, 30px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 580 }}>
          <h4
            className="font-serif"
            style={{
              fontSize: 18,
              color: '#FFFFFF',
              margin: '0 0 6px',
              letterSpacing: '0.03em',
            }}
          >
            READY TO FORMALIZE THIS AGREEMENT?
          </h4>
          <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.55 }}>
            Submit this pre-configured proposal directly to Coach Gordon&apos;s desk. We will generate formal signature documents via DocuSign or coordinate corporate ACH payment within 24 hours.
          </p>
          {inquiryError && (
            <div style={{ color: '#F87171', fontSize: 12, marginTop: 8 }}>
              {inquiryError}
            </div>
          )}
        </div>

        <div>
          {submittedInquiry ? (
            <div
              style={{
                padding: '10px 18px',
                borderRadius: 6,
                background: 'rgba(52,211,153,0.15)',
                border: '1px solid #34D399',
                color: '#34D399',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>✓</span>
              <span>Proposal Dispatched to Coach Gordon</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="email"
                value={sponsorEmail}
                onChange={e => setSponsorEmail(e.target.value)}
                placeholder="Official business email..."
                style={{
                  padding: '10px 14px',
                  background: 'rgba(5, 8, 15, 0.85)',
                  border: '1px solid rgba(212,160,23,0.35)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 13,
                  minWidth: 220,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleSubmitInquiry}
                disabled={submittingInquiry}
                className="tactile-btn"
                style={{
                  background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                  color: '#080E14',
                  border: 'none',
                  padding: '11px 22px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: submittingInquiry ? 'not-allowed' : 'pointer',
                  opacity: submittingInquiry ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(197, 160, 89, 0.35)',
                }}
              >
                {submittingInquiry ? 'Submitting...' : 'Submit Proposal for Execution →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
