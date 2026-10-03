'use client'

import React, { useState, useEffect, useMemo } from 'react'
import GaaIcon, { GaaIconName, GaaTone } from '@/components/ui/GaaIcon'
import {
  SupplementStackResult,
  PrescribedSupplementItem,
  TimingWindow,
  SupplementGoal,
  generateSupplementStack,
  getDispensaryPartnerInfo,
} from '@/lib/supplement-prescriptions'

interface ExecutiveSupplementTimelineProps {
  initialStack?: SupplementStackResult
  athleteName?: string
  isCoachView?: boolean
  athleteAge?: number
  athleteSex?: 'male' | 'female' | 'other'
  fitnessGoal?: string
}

const TIMING_CONFIG: Record<
  TimingWindow,
  { label: string; time: string; iconName: GaaIconName; iconTone: GaaTone; color: string; bg: string; border: string }
> = {
  morning_with_breakfast: {
    label: 'Morning Ignition',
    time: '07:00 AM · With Breakfast & Healthy Fats',
    iconName: 'sun',
    iconTone: 'amber',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  pre_workout_45min: {
    label: 'Pre-Workout Drive',
    time: '45m Prior to Training · Vasodilation & Buffering',
    iconName: 'lightning',
    iconTone: 'cyan',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  post_workout_anabolic: {
    label: 'Post-Workout Recovery',
    time: 'Within 60m Post-Training · Anabolic Window',
    iconName: 'droplet',
    iconTone: 'emerald',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  night_pre_sleep: {
    label: 'Night Sleep Architecture',
    time: '21:30 PM · 30m Prior to Sleep · CNS Down-Regulation',
    iconName: 'sleep',
    iconTone: 'purple',
    color: '#818CF8',
    bg: 'rgba(129, 140, 248, 0.08)',
    border: 'rgba(129, 140, 248, 0.3)',
  },
  daily_flexible: {
    label: 'Daily Flexible Administration',
    time: 'Anytime with Meal',
    iconName: 'timer',
    iconTone: 'gold',
    color: '#E2E8F0',
    bg: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.12)',
  },
}

export default function ExecutiveSupplementTimeline({
  initialStack,
  athleteName = 'Athlete',
  isCoachView = false,
  athleteAge = 35,
  athleteSex = 'male',
  fitnessGoal = 'hypertrophy',
}: ExecutiveSupplementTimelineProps) {
  const [stack] = useState<SupplementStackResult>(() => {
    if (initialStack) return initialStack

    let normalizedGoal: SupplementGoal = 'hypertrophy'
    const g = fitnessGoal.toLowerCase()
    if (g.includes('fat') || g.includes('weight loss') || g.includes('cutting')) normalizedGoal = 'fat_loss'
    else if (g.includes('power') || g.includes('speed') || g.includes('athletic')) normalizedGoal = 'athletic_power'
    else if (g.includes('longevity') || g.includes('vitality')) normalizedGoal = 'longevity_vitality'
    else if (g.includes('health')) normalizedGoal = 'general_health'

    return generateSupplementStack({
      goal: normalizedGoal,
      age: athleteAge,
      sex: athleteSex === 'female' ? 'female' : 'male',
      fitnessLevel: 'intermediate',
    })
  })

  // Adherence tracking state (persisted in localStorage or session)
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const dispensaryInfo = useMemo(() => getDispensaryPartnerInfo(), [])
  const [adherenceMap, setAdherenceMap] = useState<Record<string, boolean>>({})
  const [selectedItemDetail, setSelectedItemDetail] = useState<PrescribedSupplementItem | null>(null)

  // Initialize adherence from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`gaa_supp_adherence_${todayKey}`)
        if (stored) setAdherenceMap(JSON.parse(stored))
      } catch {}
    }
  }, [todayKey])

  const toggleAdherence = (itemId: string, windowKey: string) => {
    if (isCoachView) return
    const key = `${windowKey}_${itemId}`
    setAdherenceMap(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(`gaa_supp_adherence_${todayKey}`, JSON.stringify(next))
      } catch {}
      return next
    })

    // Log to API in background
    void fetch('/api/fitness/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timingWindow: windowKey, itemId, date: todayKey }),
    })
  }

  // Calculate adherence percentage
  const totalItems = stack.prescribedItems.length || 1
  const completedCount = stack.prescribedItems.filter(item => {
    return adherenceMap[`${item.timingWindow}_${item.id}`]
  }).length
  const adherencePct = Math.round((completedCount / totalItems) * 100)

  const scheduleWindows: Array<{ key: TimingWindow; items: PrescribedSupplementItem[] }> = (
    [
      { key: 'morning_with_breakfast' as const, items: stack.chronoSchedule.morning },
      { key: 'pre_workout_45min' as const, items: stack.chronoSchedule.preWorkout },
      { key: 'post_workout_anabolic' as const, items: stack.chronoSchedule.postWorkout },
      { key: 'night_pre_sleep' as const, items: stack.chronoSchedule.night },
    ] as Array<{ key: TimingWindow; items: PrescribedSupplementItem[] }>
  ).filter(w => w.items.length > 0)

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Executive Stack Header & Adherence HUD */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(8, 14, 26, 0.96) 0%, rgba(13, 22, 38, 0.98) 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'grid',
          gap: 16,
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(197, 160, 89, 0.15)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-lt)',
              }}
            >
              <GaaIcon name="supplements" size={20} tone="gold" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  DAILY EXECUTIVE ERGOGENIC STACK & CHRONO-DOSING TIMELINE
                </h3>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                Target: <strong style={{ color: 'var(--gold-lt)' }}>{stack.clientProfile.goal.replace('_', ' ').toUpperCase()}</strong> · Athlete: <strong style={{ color: '#FFFFFF' }}>{athleteName}</strong> · Pharmacologically Shielded
              </p>
            </div>
          </div>

          {/* Adherence Telemetry Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>
                Today&apos;s Adherence:
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: adherencePct >= 80 ? '#10B981' : adherencePct >= 40 ? '#F59E0B' : 'var(--gold-lt)' }}>
                {completedCount} / {totalItems} ({adherencePct}%)
              </div>
            </div>
            <div
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(197, 160, 89, 0.12)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--gold-lt)',
              }}
            >
              <GaaIcon name="flame" size={13} tone="gold" />
              <span>6-Day Streak</span>
            </div>
          </div>
        </div>

        {/* Adherence Progress Bar */}
        <div
          style={{
            height: 6,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${adherencePct}%`,
              background: 'linear-gradient(90deg, var(--gold) 0%, #10B981 100%)',
              borderRadius: 3,
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Clinical Partner Dispensary Master Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.15) 0%, rgba(13, 27, 42, 0.9) 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: 10,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', maxWidth: 660 }}>
          <div
            style={{
              width: 84,
              height: 64,
              borderRadius: 6,
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid rgba(212,160,23,0.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/dispensary-stack.jpg"
              alt="Clinical Dispensary Formulations"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--gold-lt)',
                marginBottom: 4,
              }}
            >
              <span>✦</span>
              <span>Pharmaceutical-Grade Dispensary Access · 15% Athlete Privilege</span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                margin: '0 0 4px',
              }}
            >
              ORDER YOUR CLINICAL-GRADE PRESCRIBED STACK
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.45 }}>
              Gordon Athletic Advisory athletes receive wholesale-tier access to cold-chain shipped, 100% 3rd-party lab verified (NSF for Sport / USP) formulations with zero heavy metals or fillers.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href={dispensaryInfo.defaultFullscriptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tactile-btn"
            style={{
              background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
              color: '#080E14',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '10px 20px',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <span>Order Stack (15% Off)</span>
            <span>↗</span>
          </a>
          <a
            href={dispensaryInfo.defaultThorneUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tactile-btn"
            style={{
              border: '1px solid rgba(197, 160, 89, 0.5)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--gold-lt)',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              padding: '10px 16px',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span>Thorne Dispensary</span>
            <span style={{ fontSize: 10 }}>↗</span>
          </a>
        </div>
      </div>

      {/* Interaction Shield Alerts Banner if any */}
      {stack.drugInteractions && stack.drugInteractions.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid #EF4444',
            borderRadius: 8,
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FCA5A5', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}>
            <GaaIcon name="shield" size={14} tone="amber" />
            <span>Pharmacological Interaction Shield Active ({stack.drugInteractions.length} screened)</span>
          </div>
          {stack.drugInteractions.map((alert, idx) => (
            <div key={idx} style={{ fontSize: 11.5, color: '#FECACA', lineHeight: 1.4 }}>
              <strong>• {alert.medicationCategory}:</strong> {alert.pharmacologicalRationale} ({alert.actionDirective})
            </div>
          ))}
        </div>
      )}

      {/* Chronological Dosing Windows */}
      <div style={{ display: 'grid', gap: 16 }}>
        {scheduleWindows.map(({ key, items }) => {
          const cfg = TIMING_CONFIG[key]
          const windowCompleted = items.every(i => adherenceMap[`${key}_${i.id}`])

          return (
            <div
              key={key}
              style={{
                background: 'rgba(8, 14, 24, 0.85)',
                border: `1.5px solid ${windowCompleted ? '#10B981' : cfg.border}`,
                borderRadius: 10,
                padding: '16px 20px',
                display: 'grid',
                gap: 12,
                boxShadow: windowCompleted ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Window Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GaaIcon name={cfg.iconName} size={20} tone={cfg.iconTone} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                      {cfg.label.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray)' }}>{cfg.time}</div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: windowCompleted ? 'rgba(16, 185, 129, 0.2)' : cfg.bg,
                    color: windowCompleted ? '#6EE7B7' : cfg.color,
                    border: `1px solid ${windowCompleted ? '#10B981' : cfg.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {windowCompleted ? (
                    <>
                      <GaaIcon name="check" size={11} tone="emerald" />
                      <span>WINDOW COMPLETED</span>
                    </>
                  ) : (
                    <span>{`${items.length} ERGOGENIC AID${items.length === 1 ? '' : 'S'}`}</span>
                  )}
                </span>
              </div>

              {/* Supplement Items Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {items.map(item => {
                  const isChecked = Boolean(adherenceMap[`${key}_${item.id}`])

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isChecked ? '#10B981' : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: 8,
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Left: Info */}
                      <div style={{ display: 'grid', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isChecked ? '#6EE7B7' : '#FFFFFF' }}>
                            {item.name}
                          </span>
                          {item.nsfCertifiedForSportRecommended && (
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(197, 160, 89, 0.2)', color: 'var(--gold-lt)', fontWeight: 800, border: '1px solid var(--gold)' }}>
                              NSF SPORT
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 11.5, color: 'var(--gold-lt)', fontFamily: 'monospace', fontWeight: 700 }}>
                          {item.optimalDosage}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedItemDetail(item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: 10.5,
                              color: 'var(--gray)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>Science Mechanism</span>
                            <GaaIcon name="external-link" size={10} tone="slate" />
                          </button>

                          {item.recommendedBrand && (
                            <a
                              href={item.dispensaryUrl || dispensaryInfo.defaultFullscriptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tactile-btn"
                              style={{
                                fontSize: 10.5,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: 'rgba(212,160,23,0.15)',
                                color: 'var(--gold-lt)',
                                border: '1px solid rgba(212,160,23,0.4)',
                                textDecoration: 'none',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span>{item.recommendedBrand}®</span>
                              <span style={{ color: 'var(--white)' }}>·</span>
                              <span>{item.clientDiscountPrice || '15% Off'}</span>
                              <span style={{ fontSize: 9 }}>↗</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: 1-Tap Adherence Button */}
                      <button
                        type="button"
                        onClick={() => toggleAdherence(item.id, key)}
                        className="tactile-btn"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: isChecked ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.06)',
                          border: isChecked ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                          color: isChecked ? '#080E14' : 'var(--gray)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isCoachView ? 'default' : 'pointer',
                          boxShadow: isChecked ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
                          flexShrink: 0,
                        }}
                        title={isChecked ? 'Marked as completed' : 'Tap to log dose'}
                      >
                        {isChecked ? <GaaIcon name="check" size={16} tone="inherit" /> : <span style={{ fontSize: 12 }}>○</span>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Science Rationale & ISSN Citations Detail Modal */}
      {selectedItemDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100050,
            background: 'rgba(4, 7, 13, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#090F1B',
              border: '1.5px solid var(--gold)',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'grid',
              gap: 14,
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 10.5, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                  Sports Science Clinical Dossier
                </span>
                <h4 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: '#FFFFFF' }}>
                  {selectedItemDetail.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <GaaIcon name="close" size={16} tone="slate" />
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#E2E8F0', lineHeight: 1.5, display: 'grid', gap: 10 }}>
              <div>
                <strong style={{ color: 'var(--gold-lt)' }}>Biological Mechanism:</strong>
                <p style={{ margin: '3px 0 0', color: '#CBD5E1' }}>{selectedItemDetail.biologicalMechanism}</p>
              </div>

              <div>
                <strong style={{ color: 'var(--gold-lt)' }}>Clinical Evidence Summary:</strong>
                <p style={{ margin: '3px 0 0', color: '#CBD5E1' }}>{selectedItemDetail.clinicalEvidenceSummary}</p>
              </div>

              <div>
                <strong style={{ color: 'var(--gold-lt)' }}>ISSN / Clinical Citation:</strong>
                <p style={{ margin: '3px 0 0', color: '#94A3B8', fontFamily: 'monospace', fontSize: 11 }}>
                  {selectedItemDetail.issnCitation}
                </p>
              </div>

              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--gray)' }}>Target Dosage:</span>
                <strong style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{selectedItemDetail.optimalDosage}</strong>
              </div>

              {selectedItemDetail.recommendedBrand && (
                <div style={{ padding: '12px 14px', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.35)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
                      Clinical Partner Dispensary Formulation
                    </div>
                    <div style={{ fontSize: 13.5, color: '#FFFFFF', fontWeight: 700 }}>
                      {selectedItemDetail.recommendedBrand}® ({selectedItemDetail.dispensarySku})
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--gold-lt)', marginTop: 2 }}>
                      Client Privilege Price: <strong>{selectedItemDetail.clientDiscountPrice}</strong>{' '}
                      <span style={{ textDecoration: 'line-through', color: 'var(--gray)', fontSize: 10.5 }}>{selectedItemDetail.retailPriceEstimate}</span>
                    </div>
                  </div>
                  <a
                    href={selectedItemDetail.dispensaryUrl || dispensaryInfo.defaultFullscriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tactile-btn"
                    style={{
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                      color: '#080E14',
                      padding: '8px 16px',
                      borderRadius: 4,
                      fontSize: 12.5,
                      fontWeight: 800,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>Order via Dispensary</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedItemDetail(null)}
              className="tactile-btn"
              style={{
                padding: '10px',
                borderRadius: 6,
                background: 'var(--gold)',
                border: 'none',
                color: '#080E14',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
