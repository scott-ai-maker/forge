'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import GaaIcon, { type GaaIconName } from '@/components/ui/GaaIcon'
import {
  type ClientProgressionProfile,
} from '@/lib/coach-onboarding-progression'

interface CoachOnboardingWorkflowStudioProps {
  initialProfiles: ClientProgressionProfile[]
}

const STAGE_META: Record<number, { title: string; shortTitle: string; icon: GaaIconName; actionTab: string }> = {
  1: { title: 'Lead Intake & Coach Claim', shortTitle: 'Intake', icon: 'commerce', actionTab: 'commerce' },
  2: { title: 'Clinical Liability Shield & PAR-Q+', shortTitle: 'Liability Shield', icon: 'shield', actionTab: 'shield' },
  3: { title: 'Baseline Biometrics & Vitals', shortTitle: 'Baseline Vitals', icon: 'tape-measure', actionTab: 'overview' },
  4: { title: 'NASM Movement Screen & OHSA', shortTitle: 'Movement Screen', icon: 'movement-screen', actionTab: 'assessment' },
  5: { title: 'Periodization (12-Week OPT™)', shortTitle: 'Periodization', icon: 'periodization', actionTab: 'periodization' },
  6: { title: 'Program Design & Cues', shortTitle: 'Program Design', icon: 'program', actionTab: 'program' },
  7: { title: 'Delivery Kickoff & Live HUD', shortTitle: 'Live Kickoff', icon: 'video-studio', actionTab: 'sessions' },
  8: { title: 'Weekly Follow-Ups & ACWR', shortTitle: 'Follow-Ups', icon: 'checkins', actionTab: 'checkins' },
  9: { title: 'Lifecycle Governance & Retention', shortTitle: 'Retention', icon: 'lifecycle', actionTab: 'lifecycle' },
}

export default function CoachOnboardingWorkflowStudio({
  initialProfiles,
}: CoachOnboardingWorkflowStudioProps) {
  const [selectedStageFilter, setSelectedStageFilter] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'needs_action' | 'testing' | 'programming' | 'active'>('all')
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)

  // Calculate cohort aggregates
  const stats = useMemo(() => {
    const total = initialProfiles.length
    if (total === 0) {
      return { total: 0, avgProgress: 0, needsAction: 0, blockedCount: 0, fullyOnboarded: 0, stageCounts: {} as Record<number, number> }
    }

    const totalProgress = initialProfiles.reduce((sum, p) => sum + (p.onboardingProgressPercent ?? p.overallProgressPercent), 0)
    const avgProgress = Math.round(totalProgress / total)
    const needsAction = initialProfiles.filter(p => p.nextAction.urgency === 'urgent' || p.currentStageNumber <= 7).length
    const blockedCount = initialProfiles.filter(p => p.isBlockedByMedicalClearance).length
    const fullyOnboarded = initialProfiles.filter(p => p.isFullyOnboarded).length

    const stageCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
    for (const p of initialProfiles) {
      stageCounts[p.currentStageNumber] = (stageCounts[p.currentStageNumber] || 0) + 1
    }

    return { total, avgProgress, needsAction, blockedCount, fullyOnboarded, stageCounts }
  }, [initialProfiles])

  // Filter athletes
  const filteredProfiles = useMemo(() => {
    return initialProfiles.filter(profile => {
      // Stage filter
      if (selectedStageFilter !== null && profile.currentStageNumber !== selectedStageFilter) {
        return false
      }

      // Category filter
      if (categoryFilter === 'needs_action' && profile.nextAction.urgency !== 'urgent' && profile.currentStageNumber > 7) {
        return false
      }
      if (categoryFilter === 'testing' && profile.currentStageNumber !== 4) {
        return false
      }
      if (categoryFilter === 'programming' && profile.currentStageNumber !== 5 && profile.currentStageNumber !== 6) {
        return false
      }
      if (categoryFilter === 'active' && profile.currentStageNumber < 8 && !profile.isFullyOnboarded) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = profile.clientName.toLowerCase().includes(q)
        const matchesStage = profile.currentStageTitle.toLowerCase().includes(q)
        if (!matchesName && !matchesStage) return false
      }

      return true
    })
  }, [initialProfiles, selectedStageFilter, categoryFilter, searchQuery])

  return (
    <div className="coach-onboarding-workflow-studio" style={{ marginBottom: 40 }}>
      {/* ── Studio Header & Headline ──────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14,24,39,0.98) 0%, rgba(8,13,22,0.98) 100%)',
          border: '1px solid rgba(212,160,23,0.3)',
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Athlete Lifecycle Continuum
              </span>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(212,160,23,0.2)', border: '1px solid var(--gold)', color: 'var(--gold-lt)', fontSize: 10, fontWeight: 800 }}>
                9-Stage Workflow
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 'clamp(20px, 2.6vw, 26px)', color: 'var(--white)', margin: 0, letterSpacing: '0.04em' }}>
              CLIENT ONBOARDING & TESTING WORKFLOW STUDIO
            </h1>
            <p style={{ color: 'var(--gray)', fontSize: 13, margin: '6px 0 0', maxWidth: 850, lineHeight: 1.5 }}>
              Track every athlete from intake, digital PAR-Q+ liability screening, and NASM movement testing (OHSA & CEx) through 12-week OPT™ periodization, AI program design, live delivery, and longitudinal triage follow-ups.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/coach?tab=architect"
              className="tactile-btn"
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                background: 'rgba(212,160,23,0.15)',
                border: '1px solid var(--gold)',
                color: 'var(--gold-lt)',
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="brain" size={14} tone="gold" />
              <span>Launch AI Program Studio</span>
            </Link>
          </div>
        </div>

        {/* ── Metric Snapshot Counters ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.06em' }}>Total Roster</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 24, color: 'var(--white)', marginTop: 4 }}>{stats.total}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.06em' }}>Avg Onboarded</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 24, color: 'var(--gold-lt)', marginTop: 4 }}>{stats.avgProgress}%</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.06em' }}>Action Required</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 24, color: stats.needsAction > 0 ? 'var(--gold)' : 'var(--white)', marginTop: 4 }}>
              {stats.needsAction}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.06em' }}>Testing Ready (Stg 4)</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 24, color: '#38BDF8', marginTop: 4 }}>
              {stats.stageCounts[4] || 0}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.06em' }}>Fully Onboarded</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 24, color: '#10B981', marginTop: 4 }}>{stats.fullyOnboarded}</div>
          </div>
        </div>
      </div>

      {/* ── Interactive 9-Stage Ribbon Navigator ──────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 700 }}>
            Filter by Progression Milestone
          </span>
          {selectedStageFilter !== null && (
            <button
              type="button"
              onClick={() => setSelectedStageFilter(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold-lt)',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              Reset Stage Filter (Show All)
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 8,
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
            const meta = STAGE_META[num]
            const count = stats.stageCounts[num] || 0
            const isSelected = selectedStageFilter === num

            return (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedStageFilter(isSelected ? null : num)}
                style={{
                  background: isSelected
                    ? 'rgba(212,160,23,0.22)'
                    : count > 0
                    ? 'var(--navy-mid)'
                    : 'rgba(255,255,255,0.02)',
                  border: isSelected
                    ? '1.5px solid var(--gold)'
                    : count > 0
                    ? '1px solid rgba(255,255,255,0.12)'
                    : '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  padding: '10px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                      color: isSelected ? '#080E14' : 'var(--white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10.5,
                      fontWeight: 900,
                    }}
                  >
                    {num}
                  </div>
                  <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 800, fontSize: 16, color: count > 0 ? (isSelected ? 'var(--gold-lt)' : 'var(--white)') : 'var(--gray)' }}>
                    {count}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isSelected ? 'var(--gold-lt)' : count > 0 ? 'var(--white)' : 'var(--gray)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {meta.shortTitle}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Search & Filter Pill Bar ──────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
          background: 'var(--navy-mid)',
          border: '1px solid var(--navy-lt)',
          padding: '12px 16px',
          borderRadius: 8,
        }}
      >
        {/* Quick Filter Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { key: 'all' as const, label: 'All Athletes' },
            { key: 'needs_action' as const, label: 'Needs Action', icon: 'alert-triangle' as const, tone: 'ruby' as const },
            { key: 'testing' as const, label: 'Stage 4: Testing', icon: 'microscope' as const, tone: 'cyan' as const },
            { key: 'programming' as const, label: 'Stage 5-6: Program Build', icon: 'edit' as const, tone: 'gold' as const },
            { key: 'active' as const, label: 'Stage 7-9: Active Delivery', icon: 'lightning' as const, tone: 'emerald' as const },
          ].map(btn => {
            const active = categoryFilter === btn.key
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => {
                  setCategoryFilter(btn.key)
                  setSelectedStageFilter(null)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: active ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(212,160,23,0.2)' : 'transparent',
                  color: active ? 'var(--gold-lt)' : 'var(--gray-lt)',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {btn.icon && <GaaIcon name={btn.icon} size={12} tone={active ? 'gold' : btn.tone} />}
                <span>{btn.label}</span>
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div style={{ minWidth: 220, flex: '0 1 280px' }}>
          <input
            type="text"
            placeholder="Search athlete by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '8px 12px',
              color: 'var(--white)',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Athlete Workflow Progression List ─────────────────────── */}
      {filteredProfiles.length === 0 ? (
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
          }}
        >
          <GaaIcon name="target" size={32} tone="gold" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: 'var(--white)', margin: '0 0 6px' }}>
            No Athletes Found in this Stage
          </h3>
          <p style={{ color: 'var(--gray)', fontSize: 13, margin: 0 }}>
            Adjust your search query or reset the stage filter to view all assigned athletes.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredProfiles.map(profile => {
            const isExpanded = expandedClientId === profile.clientId
            const nextAction = profile.nextAction

            return (
              <div
                key={profile.clientId}
                style={{
                  background: 'linear-gradient(135deg, rgba(14,24,39,0.96) 0%, rgba(9,15,26,0.98) 100%)',
                  border: profile.isBlockedByMedicalClearance
                    ? '1.5px solid #EF4444'
                    : profile.isFullyOnboarded
                    ? '1px solid rgba(16,185,129,0.3)'
                    : '1px solid rgba(212,160,23,0.3)',
                  borderRadius: 10,
                  padding: '18px 22px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                {/* Row Header: Athlete Details, Current Stage & Next Action CTA */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <Link
                        href={`/coach/clients/${profile.clientId}`}
                        style={{
                          fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                          fontWeight: 700,
                          fontSize: 18,
                          color: 'var(--white)',
                          textDecoration: 'none',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {profile.clientName}
                      </Link>

                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: profile.isBlockedByMedicalClearance
                            ? 'rgba(239,68,68,0.2)'
                            : profile.isFullyOnboarded
                            ? 'rgba(16,185,129,0.2)'
                            : 'rgba(212,160,23,0.18)',
                          color: profile.isBlockedByMedicalClearance
                            ? '#F87171'
                            : profile.isFullyOnboarded
                            ? '#34D399'
                            : 'var(--gold-lt)',
                          border: `1px solid ${profile.isBlockedByMedicalClearance ? '#EF4444' : profile.isFullyOnboarded ? '#10B981' : 'var(--gold)'}`,
                        }}
                      >
                        {profile.currentStageNumber <= 7
                          ? `Phase ${profile.currentStageNumber}: ${profile.currentStageShortTitle}`
                          : `Stage ${profile.currentStageNumber}: ${profile.currentStageShortTitle} · Maintenance`}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{profile.email}</span>
                      <span>•</span>
                      <span>
                        Onboarding:{' '}
                        <strong style={{ color: profile.isFullyOnboarded ? '#34D399' : 'var(--white)' }}>
                          {profile.onboardingProgressPercent}%
                        </strong>{' '}
                        ·{' '}
                        {profile.isFullyOnboarded
                          ? 'Complete (7/7) · Maintenance Active'
                          : `${profile.completedOnboardingCount}/7 phases`}
                      </span>
                    </div>
                  </div>

                  {/* Right side: Direct Action CTA Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Link
                      href={nextAction.href}
                      className="tactile-btn"
                      style={{
                        padding: '9px 16px',
                        borderRadius: 6,
                        background: nextAction.urgency === 'urgent'
                          ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                          : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                        color: nextAction.urgency === 'urgent' ? '#FFFFFF' : '#080E14',
                        fontSize: 12,
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      <span>{nextAction.label}</span>
                      <span>➔</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setExpandedClientId(isExpanded ? null : profile.clientId)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'var(--white)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{isExpanded ? 'Hide Steps' : 'Inspect Milestones'}</span>
                      <GaaIcon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={11} />
                    </button>
                  </div>
                </div>

                {/* Progress bar(s) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--gray)' }}>
                    <span>Onboarding Continuum (Phases 1–7)</span>
                    <span style={{ color: profile.isFullyOnboarded ? '#34D399' : 'var(--white)', fontWeight: 700 }}>
                      {profile.completedOnboardingCount}/7 ({profile.onboardingProgressPercent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 5,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${profile.onboardingProgressPercent}%`,
                        background: profile.isFullyOnboarded
                          ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
                          : 'linear-gradient(90deg, var(--gold) 0%, var(--gold-lt) 100%)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {profile.isFullyOnboarded && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>
                        <span style={{ color: '#38BDF8' }}>Client Maintenance & Compliance (Phases 8–9)</span>
                        <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                          {profile.completedComplianceCount}/2 ({profile.complianceProgressPercent}%)
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: 4,
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${profile.complianceProgressPercent}%`,
                            background: 'linear-gradient(90deg, #38BDF8 0%, #0284C7 100%)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Next Step Callout (Clickable) */}
                <Link
                  href={nextAction.href}
                  style={{
                    background: nextAction.urgency === 'urgent' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(212, 160, 23, 0.08)',
                    border: `1px solid ${nextAction.urgency === 'urgent' ? 'rgba(239,68,68,0.3)' : 'rgba(212,160,23,0.25)'}`,
                    borderRadius: 6,
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                    fontSize: 12,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, color: nextAction.urgency === 'urgent' ? '#F87171' : 'var(--gold-lt)' }}>
                      Recommended Next Step:
                    </span>
                    <span style={{ color: 'var(--white)' }}>{nextAction.description}</span>
                  </div>

                  <span
                    style={{ color: 'var(--gold-lt)', fontWeight: 800, fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>Execute Step</span>
                    <span>➔</span>
                  </span>
                </Link>

                {/* Expandable 9-Stage Milestone Checklist Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 800, marginBottom: 10 }}>
                      All 9 Stages Checklist & Verification
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                      {profile.stages.map(stage => (
                        <div
                          key={stage.id}
                          style={{
                            background: stage.state === 'completed'
                              ? 'rgba(16,185,129,0.05)'
                              : stage.state === 'in_progress'
                              ? 'rgba(212,160,23,0.08)'
                              : stage.state === 'blocked'
                              ? 'rgba(239,68,68,0.08)'
                              : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${stage.state === 'completed' ? 'rgba(16,185,129,0.25)' : stage.state === 'in_progress' ? 'rgba(212,160,23,0.3)' : stage.state === 'blocked' ? '#EF4444' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 6,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: stage.state === 'completed' ? '#34D399' : stage.state === 'in_progress' ? 'var(--gold-lt)' : 'var(--gray)' }}>
                                {stage.state === 'completed' ? '✓' : stage.state === 'blocked' ? '!' : stage.stageNumber}.
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}>
                                {stage.shortTitle}
                              </span>
                            </div>
                            <Link
                              href={stage.actionHref}
                              style={{ fontSize: 10.5, color: 'var(--gold-lt)', textDecoration: 'none', fontWeight: 700 }}
                            >
                              Launch ➔
                            </Link>
                          </div>

                          <div style={{ display: 'grid', gap: 4 }}>
                            {stage.milestones.map(m => (
                              <Link
                                key={m.key}
                                href={m.actionHref || stage.actionHref}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 11,
                                  textDecoration: 'none',
                                  padding: '3px 6px',
                                  borderRadius: 4,
                                  background: m.completed ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                                  color: m.completed ? 'var(--white)' : 'var(--gray-lt)',
                                }}
                              >
                                <span style={{ color: m.completed ? '#10B981' : 'var(--gray)', fontWeight: 800 }}>
                                  {m.completed ? '✓' : '○'}
                                </span>
                                <span style={{ flex: 1 }}>{m.label}</span>
                                <span style={{ fontSize: 10, color: 'var(--gold-lt)', fontWeight: 700 }}>➔</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

