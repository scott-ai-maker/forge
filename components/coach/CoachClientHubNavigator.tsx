'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { CoachClientTab } from '@/lib/validation'
import GaaIcon, { type GaaIconName, type GaaIconTone } from '@/components/ui/GaaIcon'

interface HubTabItem {
  key: CoachClientTab
  label: string
  icon: GaaIconName
  tone?: GaaIconTone
  desc: string
  badge?: string
}

interface HubPillar {
  title: string
  icon: GaaIconName
  image?: string
  color: string
  tone: GaaIconTone
  tabs: HubTabItem[]
}

const PILLARS: HubPillar[] = [
  {
    title: 'Training & Periodization',
    icon: 'periodization',
    image: '/images/pillar-training-crest.jpg',
    color: 'var(--gold-lt)',
    tone: 'gold',
    tabs: [
      { key: 'overview', label: 'Client Overview', icon: 'overview', tone: 'gold', desc: 'Biometric telemetry, adherence & triage' },
      { key: 'program', label: 'Program & Periodization Studio', icon: 'program', tone: 'gold', desc: 'Coach Gordon AI periodization, workouts & tempos', badge: 'AI Studio' },
      { key: 'periodization', label: 'OPT™ Macrocycle Engine', icon: 'periodization', tone: 'gold', desc: 'Mesocycle synthesis, weekly memos & deloads' },
    ],
  },
  {
    title: 'Movement & Biometrics',
    icon: 'movement-screen',
    image: '/images/pillar-movement-crest.jpg',
    color: '#38BDF8',
    tone: 'cyan',
    tabs: [
      { key: 'assessment', label: 'NASM Movement Screen', icon: 'movement-screen', tone: 'cyan', desc: 'Overhead Squat (OHSA), Davies test & radar' },
    ],
  },
  {
    title: 'Prescriptions & Safety',
    icon: 'shield',
    image: '/images/pillar-safety-crest.jpg',
    color: '#34D399',
    tone: 'emerald',
    tabs: [
      { key: 'shield', label: 'Liability Shield & PAR-Q', icon: 'shield', tone: 'emerald', desc: 'Medical clearance & liability status', badge: 'Clinical' },
      { key: 'prescriptions', label: 'Prescriptions & AI Cardio', icon: 'toolbox', tone: 'emerald', desc: 'AI Voice Cardio, specialized toolboxes & supplements', badge: 'Rx' },
    ],
  },
  {
    title: 'Operations & Concierge',
    icon: 'governance',
    image: '/images/pillar-concierge-crest.jpg',
    color: '#F472B6',
    tone: 'slate',
    tabs: [
      { key: 'sessions', label: 'Sessions & Schedule', icon: 'sessions', tone: 'slate', desc: 'Completed & upcoming coaching appointments' },
      { key: 'checkins', label: 'Weekly Check-Ins', icon: 'checkins', tone: 'slate', desc: 'Sunday review submissions & photo feedback' },
      { key: 'dossier', label: 'Sunday Dossier', icon: 'crown', tone: 'gold', desc: 'Boardroom Intelligence Dossier & S.O.A.P. record', badge: 'PDF' },
      { key: 'commerce', label: 'Commerce & Packages', icon: 'commerce', tone: 'slate', desc: 'Stripe packages, comps & invoices' },
      { key: 'lifecycle', label: 'Lifecycle & Audit', icon: 'lifecycle', tone: 'amber', desc: 'Active standing, holds, deactivations & audit trail', badge: 'Audit' },
    ],
  },
]

interface CoachClientHubNavigatorProps {
  clientId: string
  activeTab: CoachClientTab
  clientName?: string
  currentStageTab?: CoachClientTab
  currentStageNumber?: number
  currentStageTitle?: string
}

export default function CoachClientHubNavigator({
  clientId,
  activeTab,
  clientName: _clientName = 'Client',
  currentStageTab,
  currentStageNumber,
  currentStageTitle,
}: CoachClientHubNavigatorProps) {
  const [filterQuery, setFilterQuery] = useState('')
  const [isGridExpanded, setIsGridExpanded] = useState(false)

  // Find active pillar
  const activePillar = useMemo(() => {
    return PILLARS.find(p => p.tabs.some(t => t.key === activeTab)) || PILLARS[0]
  }, [activeTab])

  // Filter tabs when user types in search
  const matchingTabs = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    if (!q) return null
    const matches: Array<{ pillar: HubPillar; tab: HubTabItem }> = []
    for (const p of PILLARS) {
      for (const t of p.tabs) {
        if (
          t.label.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.key.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q)
        ) {
          matches.push({ pillar: p, tab: t })
        }
      }
    }
    return matches
  }, [filterQuery])

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 35,
        marginBottom: 20,
        display: 'grid',
        gap: 8,
      }}
    >
      {/* ── Pillar Switcher & Quick Navigation Bar ── */}
      <div
        className="glass-card"
        style={{
          padding: '10px 14px',
          background: 'rgba(8, 14, 24, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 160, 23, 0.35)',
          borderRadius: 10,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
          display: 'grid',
          gap: 10,
        }}
      >
        {/* Top Control Bar: Active Tab Title + Search Filter + Grid Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GaaIcon name={activePillar.icon} tone={activePillar.tone} size={16} />
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'var(--gold-lt)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {activePillar.title}
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 13 }}>· Workspace Navigator</span>
            </div>

            {/* Current Phase Breadcrumb Pill */}
            {currentStageTab && currentStageNumber && (
              <Link
                href={`/coach/clients/${clientId}?tab=${currentStageTab}#workspace-tab-content`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: activeTab === currentStageTab ? 'rgba(212, 160, 23, 0.28)' : 'rgba(212, 160, 23, 0.14)',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold-lt)',
                  fontSize: 11,
                  fontWeight: 800,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  boxShadow: '0 0 10px rgba(212, 160, 23, 0.25)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {currentStageNumber <= 7 ? (
                    <>
                      <GaaIcon name="star" size={12} tone="gold" />
                      {`Onboarding Phase ${currentStageNumber}: ${currentStageTitle || currentStageTab}`}
                    </>
                  ) : (
                    <>
                      <GaaIcon name="shield-check" size={12} tone="gold" />
                      {`Maintenance & Compliance: Stage ${currentStageNumber} (${currentStageTitle || currentStageTab})`}
                    </>
                  )}
                </span>
                {activeTab !== currentStageTab && <span style={{ textDecoration: 'underline', fontSize: 10 }}>Jump ➔</span>}
              </Link>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Instant Tab Filter Search Input */}
            <div style={{ position: 'relative', minWidth: 160 }}>
              <input
                type="text"
                placeholder="Filter tools... (e.g. 'period')"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                style={{
                  padding: '5px 24px 5px 28px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 11.5,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <GaaIcon name="search" size={12} tone="slate" />
              </span>
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  aria-label="Clear filter"
                >
                  <GaaIcon name="close" size={11} tone="slate" />
                </button>
              )}
            </div>

            {/* Hub Directory Grid Expander Button */}
            <button
              type="button"
              onClick={() => setIsGridExpanded(prev => !prev)}
              className="sgf-button sgf-button-secondary"
              style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700 }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {isGridExpanded ? <GaaIcon name="chevron-left" size={12} tone="gold" /> : <GaaIcon name="grid" size={12} tone="gold" />}
                <span>{isGridExpanded ? 'Collapse Hub' : 'All 4 Hubs Grid'}</span>
              </span>
            </button>

            {/* Launch Live Studio Quick Link */}
            <Link
              href={`/coach/clients/${clientId}/live`}
              className="tactile-btn"
              style={{
                padding: '5px 12px',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                fontSize: 11,
                fontWeight: 800,
                borderRadius: 4,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name="camera" size={12} style={{ color: '#080E14', stroke: '#080E14' }} />
              <span>Live Studio</span>
            </Link>
          </div>
        </div>

        {/* Filtered Search Results Dropdown */}
        {matchingTabs && (
          <div
            style={{
              padding: '10px 12px',
              background: '#070D18',
              border: '1px solid var(--gold)',
              borderRadius: 6,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            {matchingTabs.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--gray)', padding: 6 }}>No tools found matching &quot;{filterQuery}&quot;</span>
            ) : (
              matchingTabs.map(({ pillar, tab }) => (
                <Link
                  key={tab.key}
                  href={`/coach/clients/${clientId}?tab=${tab.key}`}
                  onClick={() => setFilterQuery('')}
                  className="tactile-btn"
                  style={{
                    padding: '8px 10px',
                    background: activeTab === tab.key ? 'rgba(212,160,23,0.2)' : 'rgba(255,255,255,0.04)',
                    border: activeTab === tab.key ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <GaaIcon name={tab.icon} tone={tab.tone || 'gold'} size={15} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: activeTab === tab.key ? 'var(--gold-lt)' : '#FFFFFF' }}>
                      {tab.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray)' }}>{pillar.title}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* ── Categorized Quick Tabs Row ── */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PILLARS.flatMap(p => p.tabs).map(tab => {
            const isActive = activeTab === tab.key
            const isCurrentPhase = currentStageTab === tab.key

            // Distinct visual styling based on Current Phase & Active state
            const getTabStyle = () => {
              if (isCurrentPhase && isActive) {
                return {
                  background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.35) 0%, rgba(212, 160, 23, 0.18) 100%)',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 0 16px rgba(212, 160, 23, 0.45), 0 2px 8px rgba(0, 0, 0, 0.6)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                }
              }
              if (isCurrentPhase && !isActive) {
                return {
                  background: 'rgba(212, 160, 23, 0.12)',
                  border: '1.5px dashed var(--gold)',
                  boxShadow: '0 0 10px rgba(212, 160, 23, 0.2)',
                  color: 'var(--gold-lt)',
                  fontWeight: 700,
                }
              }
              if (isActive && !isCurrentPhase) {
                return {
                  background: 'rgba(56, 189, 248, 0.18)',
                  border: '2px solid #38BDF8',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                }
              }
              return {
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'none',
                color: '#CBD5E1',
                fontWeight: 600,
              }
            }

            const tabStyle = getTabStyle()

            return (
              <Link
                key={tab.key}
                href={`/coach/clients/${clientId}?tab=${tab.key}`}
                className="tactile-btn"
                style={{
                  padding: '7px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  transition: 'all 0.15s ease',
                  ...tabStyle,
                }}
              >
                <GaaIcon
                  name={tab.icon}
                  tone={isCurrentPhase ? 'gold' : isActive ? 'cyan' : (tab.tone || 'slate')}
                  size={14}
                />
                <span>{tab.label}</span>

                {/* Priority Badging */}
                {isCurrentPhase ? (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      padding: '1.5px 6px',
                      background: 'var(--gold)',
                      color: '#080E14',
                      borderRadius: 3,
                      letterSpacing: '0.04em',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {isActive ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <GaaIcon name="star" size={9} tone="inherit" />
                        STAGE {currentStageNumber} · ACTIVE
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <GaaIcon name="pin" size={9} tone="inherit" />
                        STAGE {currentStageNumber}
                      </span>
                    )}
                  </span>
                ) : isActive ? (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '1.5px 5px',
                      background: 'rgba(56, 189, 248, 0.25)',
                      color: '#38BDF8',
                      borderRadius: 3,
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    ● Active
                  </span>
                ) : tab.badge ? (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '1px 5px',
                      background: 'rgba(212,160,23,0.25)',
                      color: 'var(--gold-lt)',
                      borderRadius: 3,
                    }}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>

        {/* ── Full 4-Pillar Visual Grid (When Expanded) ── */}
        {isGridExpanded && (
          <div
            style={{
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {PILLARS.map(pillar => (
              <div
                key={pillar.title}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${pillar.color}30`,
                  borderLeft: `3px solid ${pillar.color}`,
                  borderRadius: 6,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {pillar.image ? (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundImage: `url('${pillar.image}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: `1px solid ${pillar.color}`,
                          boxShadow: `0 0 10px ${pillar.color}40`,
                        }}
                      />
                    ) : (
                      <GaaIcon name={pillar.icon} tone={pillar.tone} size={16} />
                    )}
                    <strong style={{ fontSize: 12, color: pillar.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {pillar.title}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  {pillar.tabs.map(tab => {
                    const isActive = activeTab === tab.key
                    const isCurrentPhase = currentStageTab === tab.key

                    return (
                      <Link
                        key={tab.key}
                        href={`/coach/clients/${clientId}?tab=${tab.key}`}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 4,
                          background: isCurrentPhase && isActive
                            ? 'rgba(212,160,23,0.3)'
                            : isCurrentPhase
                            ? 'rgba(212,160,23,0.14)'
                            : isActive
                            ? 'rgba(56,189,248,0.18)'
                            : 'transparent',
                          border: isCurrentPhase
                            ? '1px solid var(--gold)'
                            : isActive
                            ? '1px solid #38BDF8'
                            : '1px solid transparent',
                          color: isCurrentPhase ? 'var(--gold-lt)' : isActive ? '#38BDF8' : '#E2E8F0',
                          textDecoration: 'none',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <GaaIcon
                            name={tab.icon}
                            tone={isCurrentPhase ? 'gold' : isActive ? 'cyan' : (tab.tone || 'slate')}
                            size={13}
                          />
                          <span style={{ fontWeight: isActive || isCurrentPhase ? 700 : 500 }}>{tab.label}</span>
                        </span>
                        {isCurrentPhase && isActive ? (
                          <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <GaaIcon name="star" size={10} tone="gold" />
                            Stage {currentStageNumber} · Active
                          </span>
                        ) : isCurrentPhase ? (
                          <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <GaaIcon name="pin" size={10} tone="gold" />
                            Stage {currentStageNumber}
                          </span>
                        ) : isActive ? (
                          <span style={{ fontSize: 10, color: '#38BDF8', fontWeight: 700 }}>● Active</span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
