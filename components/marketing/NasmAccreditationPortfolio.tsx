'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'

export type CredentialCategory = 'all' | 'clinical' | 'safety' | 'academic'

export interface NasmCredential {
  id: string
  code: string
  title: string
  category: CredentialCategory
  categoryLabel: string
  badgeTone: string
  icon: GaaIconName
  status: string
  statusType: 'certified' | 'historical'
  summary: string
  curriculum: string[]
  gaaEngineIntegration: string
  keyAlgorithmicModule: string
}

export const NASM_CREDENTIALS_DATA: NasmCredential[] = [
  {
    id: 'cpt',
    code: 'NASM-CPT®',
    title: 'Certified Personal Trainer (#1261890687)',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    badgeTone: '#C5A059',
    icon: 'award',
    status: 'Certified & Active (Oct 2026)',
    statusType: 'certified',
    summary: 'NCCA-accredited Certified Personal Trainer credential issued October 2026, grounded in the Optimum Performance Training (OPT™) model across 5 progressive periodization phases.',
    curriculum: [
      '5-Phase OPT™ Periodization Architecture',
      'Kinetic Chain Anatomy & Overhead Squat Assessment (OHSA)',
      'Neuromuscular Stabilization & Proprioception',
      'Acute Training Variable Modulation (Tempo, Reps, Rest)',
    ],
    gaaEngineIntegration: 'Powers the core program generation engine (`lib/nasm-opt-exercise-selection.ts`), tempo constraints (4-2-1-1 to explosive), and automated progression logic.',
    keyAlgorithmicModule: 'OPT™ 5-Phase Periodization Engine',
  },
  {
    id: 'cpr',
    code: 'ASTI CPR/AED',
    title: 'Adult, Child & Infant CPR/AED (#1261890193)',
    category: 'safety',
    categoryLabel: 'Emergency Care & Safety',
    badgeTone: '#EF4444',
    icon: 'heart-rate',
    status: 'Certified & Active (Oct 2026)',
    statusType: 'certified',
    summary: 'Emergency cardiovascular care certification covering Adult, Child, and Infant CPR, AED deployment, and emergency dispatch readiness.',
    curriculum: [
      'Adult, Child & Infant Cardiopulmonary Resuscitation (CPR)',
      'Automated External Defibrillator (AED) Operation',
      'Sudden Cardiac Arrest Recognition & Emergency Escalation',
      'Pre-Exercise PAR-Q+ Risk Triage & ERAP Readiness',
    ],
    gaaEngineIntegration: 'Anchors pre-exercise PAR-Q+ medical hold guardrails and 1:1 Live Studio Emergency Remote Action Plan (ERAP) verification.',
    keyAlgorithmicModule: 'PAR-Q+ & ERAP Safety Gatekeeper',
  },
  {
    id: 'ace-historical',
    code: 'ACE-CPT (2008–2021)',
    title: 'Certified Personal Trainer (Historical, 2008–2021)',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    badgeTone: '#60A5FA',
    icon: 'movement-screen',
    status: 'Held 2008–2021 (Historical)',
    statusType: 'historical',
    summary: 'Prior Certified Personal Trainer credential held from 2008 through 2021 via the American Council on Exercise (ACE), preceding October 2026 NASM-CPT® certification.',
    curriculum: [
      'Integrated Fitness Training (IFT®) Progression Foundations',
      'Functional Movement & Postural Screening',
      'Cardiorespiratory Conditioning & Heart-Rate Zone Pacing',
      'Practical Gym-Floor Coaching & Sustainable Adherence',
    ],
    gaaEngineIntegration: 'Informs joint-friendly exercise regressions, plain-English rep coaching cues, and adaptable home/travel workout swaps.',
    keyAlgorithmicModule: 'Adaptive Exercise Regression Matrix',
  },
  {
    id: 'bsit',
    code: 'BSIT · B.S.',
    title: 'Bachelor of Science in Information Technology (3.72 GPA)',
    category: 'academic',
    categoryLabel: 'Academic & Systems Architecture',
    badgeTone: '#38BDF8',
    icon: 'brain',
    status: 'Conferred Sep 2020',
    statusType: 'certified',
    summary: 'Regionally accredited Bachelor of Science in Information Technology (Advanced Software Development track, 3.72 GPA), paired with 34 verified Cloud & AI engineering badges.',
    curriculum: [
      'Algorithmic Logic, Data Structures & Object-Oriented Engineering',
      'Relational Database Architecture & Row-Level Security Isolation',
      'Information Assurance, Cryptography & Privacy Controls',
      'Cloud Infrastructure & Production AI Application Engineering',
    ],
    gaaEngineIntegration: 'Powers Forge Athletic’s browser-side MediaPipe pose math, PostgreSQL RLS security architecture, and deterministic workout engines.',
    keyAlgorithmicModule: '33-Point Pose & Periodization Software Engine',
  },
]

export default function NasmAccreditationPortfolio() {
  const [selectedCategory, setSelectedCategory] = useState<CredentialCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>('cpt')

  const categories: { key: CredentialCategory; label: string; count: number }[] = useMemo(() => [
    { key: 'all', label: 'All Credentials', count: NASM_CREDENTIALS_DATA.length },
    { key: 'clinical', label: 'Coaching & Biomechanics', count: NASM_CREDENTIALS_DATA.filter((c) => c.category === 'clinical').length },
    { key: 'safety', label: 'Emergency Safety', count: NASM_CREDENTIALS_DATA.filter((c) => c.category === 'safety').length },
    { key: 'academic', label: 'Academic & Engineering', count: NASM_CREDENTIALS_DATA.filter((c) => c.category === 'academic').length },
  ], [])

  const filteredCredentials = useMemo(() => {
    return NASM_CREDENTIALS_DATA.filter((cred) => {
      const matchesCategory = selectedCategory === 'all' || cred.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesCategory

      const matchesSearch =
        cred.code.toLowerCase().includes(query) ||
        cred.title.toLowerCase().includes(query) ||
        cred.summary.toLowerCase().includes(query) ||
        cred.keyAlgorithmicModule.toLowerCase().includes(query) ||
        cred.curriculum.some((item) => item.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  return (
    <section
      id="accreditation-portfolio"
      className="mobile-touch-scope"
      style={{
        marginBottom: 56,
        padding: 'clamp(20px, 4vw, 36px)',
        background: 'linear-gradient(180deg, rgba(14, 23, 36, 0.75) 0%, rgba(8, 14, 24, 0.95) 100%)',
        border: '1px solid rgba(197, 160, 89, 0.35)',
        borderRadius: 14,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
            borderRadius: 20,
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px solid rgba(197, 160, 89, 0.3)',
            marginBottom: 12,
          }}
        >
          <GaaIcon name="shield-check" size={14} tone="gold" />
          <span
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--gold-lt)',
            }}
          >
            Verified Credentials &amp; Academic Foundation
          </span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontSize: 'clamp(1.5rem, 3.2vw, 2.2rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: '4px 0 10px',
            letterSpacing: '0.02em',
          }}
        >
          Verified Coaching, Safety &amp; Technical Accreditations
        </h2>

        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 14,
            color: '#94A3B8',
            maxWidth: 720,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Every periodization model, movement screen, and safety gate inside Forge Athletic is anchored to Coach Gordon’s verified credentials and academic engineering background.
        </p>
      </div>

      {/* Summary Telemetry Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Primary Certification', value: 'NASM-CPT®', note: 'Cert #1261890687 (Oct 2026)' },
          { label: 'Prior Certification', value: 'ACE-CPT', note: 'Held 2008–2021 (Historical)' },
          { label: 'Emergency Safety', value: 'ASTI CPR/AED', note: 'Cert #1261890193 (Active)' },
          { label: 'Academic & Tech', value: 'B.S. IT (3.72)', note: '+ 34 Verified Credly Badges' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(8, 14, 24, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '12px 14px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#64748B',
                marginBottom: 4,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--gold-lt)',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-telemetry, monospace)',
                color: '#94A3B8',
                marginTop: 2,
              }}
            >
              {stat.note}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Category Filter Pills & Search */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: isActive ? 'rgba(197, 160, 89, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isActive ? 'var(--gold-lt)' : '#CBD5E1',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 12,
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
                    fontSize: 10,
                    fontFamily: 'var(--font-telemetry, monospace)',
                    opacity: 0.8,
                    background: isActive ? 'rgba(197, 160, 89, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '1px 5px',
                    borderRadius: 4,
                  }}
                >
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Quick Search */}
        <div style={{ minWidth: 200, flex: '1 1 200px', maxWidth: 280 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credential or topic..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Grid of Credentials */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {filteredCredentials.map((cred) => {
          const isExpanded = expandedId === cred.id
          const isCertified = cred.statusType === 'certified'

          return (
            <div
              key={cred.id}
              onClick={() => setExpandedId(isExpanded ? null : cred.id)}
              style={{
                background: isExpanded
                  ? 'rgba(19, 30, 48, 0.95)'
                  : 'rgba(14, 23, 36, 0.75)',
                border: isExpanded
                  ? `1.5px solid ${cred.badgeTone}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isExpanded
                  ? `0 10px 24px rgba(0, 0, 0, 0.4), 0 0 16px ${cred.badgeTone}22`
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top Row: Icon + Code + Status */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 6,
                      background: `${cred.badgeTone}20`,
                      border: `1px solid ${cred.badgeTone}60`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GaaIcon name={cred.icon} size={16} tone="gold" />
                  </div>
                  <div>
                    <span
                      style={{
                        fontFamily: 'var(--font-telemetry, monospace)',
                        fontSize: 14,
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
                        fontSize: 10,
                        fontFamily: 'Raleway, sans-serif',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {cred.categoryLabel}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-telemetry, monospace)',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: isCertified
                      ? 'rgba(52, 211, 153, 0.18)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: isCertified ? '#34D399' : '#94A3B8',
                    border: isCertified
                      ? '1px solid rgba(52, 211, 153, 0.45)'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cred.status}
                </span>
              </div>

              {/* Title & Summary */}
              <h3
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: '0 0 6px',
                }}
              >
                {cred.title}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  lineHeight: 1.5,
                  margin: '0 0 10px',
                }}
              >
                {cred.summary}
              </p>

              {/* Algorithmic Module Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontFamily: 'var(--font-telemetry, monospace)',
                  color: 'var(--gold-lt)',
                  background: 'rgba(197, 160, 89, 0.08)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(197, 160, 89, 0.2)',
                  marginBottom: isExpanded ? 14 : 0,
                }}
              >
                <GaaIcon name="brain" size={12} tone="gold" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cred.keyAlgorithmicModule}
                </span>
              </div>

              {/* Expanded Curriculum & GAA Software Integration Details */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--gold-lt)',
                        marginBottom: 6,
                      }}
                    >
                      Scientific Curriculum Focus
                    </span>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 16,
                        fontSize: 12,
                        color: '#CBD5E1',
                        lineHeight: 1.5,
                      }}
                    >
                      {cred.curriculum.map((point, pIdx) => (
                        <li key={pIdx} style={{ marginBottom: 3 }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#60A5FA',
                        marginBottom: 4,
                      }}
                    >
                      Forge Athletic Engine &amp; Advisory Integration
                    </span>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: '#94A3B8',
                        lineHeight: 1.55,
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      {cred.gaaEngineIntegration}
                    </p>
                  </div>
                </div>
              )}

              {/* Tap to inspect prompt */}
              <div
                style={{
                  marginTop: 10,
                  fontSize: 10,
                  color: isExpanded ? 'var(--gold-lt)' : '#64748B',
                  textAlign: 'right',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 600,
                }}
              >
                {isExpanded ? '▲ Collapse details' : '▼ Tap to inspect curriculum & software engine'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Direct Call to Action to Lock Founding Allocation */}
      <div
        style={{
          background: 'rgba(8, 14, 24, 0.9)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            Ready to start moving toward your goals?
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            Join the early-access list for membership updates and introductory pricing. The first group is limited to 15 spots.
          </div>
        </div>

        <a
          href="#intake-form"
          className="sgf-button sgf-button-gold"
          style={{
            padding: '10px 18px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Reserve Founding Allocation</span>
          <span>↓</span>
        </a>
      </div>

      {/* Nominative Fair Use Legal Notice */}
      <div
        style={{
          marginTop: 18,
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 6,
          fontSize: 11,
          color: '#64748B',
          lineHeight: 1.5,
          fontFamily: 'Raleway, sans-serif',
        }}
      >
        <strong style={{ color: '#94A3B8' }}>Legal Non-Affiliation &amp; Nominative Fair Use:</strong> NASM®, Optimum Performance Training™, OPT™, and Certified Personal Trainer (CPT®) are registered trademarks or service marks of the National Academy of Sports Medicine (NASM) and/or Ascend Learning, LLC. ACE® is a registered trademark of the American Council on Exercise. Forge Athletic Performance LLC is an independent private entity and is not affiliated with, sponsored by, or endorsed by NASM, Ascend Learning, LLC, or ACE. All references to credentials and the OPT™ model are made strictly for truthful credential verification and educational methodology reference under the Nominative Fair Use doctrine.
      </div>
    </section>
  )
}
