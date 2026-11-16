'use client'

import React, { useState, useEffect, useMemo, useRef, useId } from 'react'
import GaaIcon, { GaaIconName, GaaTone } from '@/components/ui/GaaIcon'
import {
  FTC_AFFILIATE_DISCLOSURE,
  FDA_DSHEA_SUPPLEMENT_DISCLAIMER,
} from '@/lib/legal-compliance'
import {
  SupplementStackResult,
  PrescribedSupplementItem,
  TimingWindow,
  normalizeSupplementGoal,
  normalizeClientSex,
  generateSupplementStack,
  getDispensaryPartnerInfo,
  isDispensaryAndSupplementsEnabled,
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
    label: 'Morning',
    time: 'With breakfast',
    iconName: 'sun',
    iconTone: 'amber',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  pre_workout_45min: {
    label: 'Before exercise',
    time: 'About 45 minutes before training',
    iconName: 'lightning',
    iconTone: 'cyan',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  post_workout_anabolic: {
    label: 'After exercise',
    time: 'Within about an hour after training',
    iconName: 'droplet',
    iconTone: 'emerald',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  night_pre_sleep: {
    label: 'Evening',
    time: 'About 30 minutes before bed',
    iconName: 'sleep',
    iconTone: 'purple',
    color: '#818CF8',
    bg: 'rgba(129, 140, 248, 0.08)',
    border: 'rgba(129, 140, 248, 0.3)',
  },
  daily_flexible: {
    label: 'Any time',
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
  const dialogTitleId = useId()
  const detailDialogRef = useRef<HTMLDialogElement | null>(null)

  const stack = useMemo<SupplementStackResult>(() => {
    if (initialStack) return initialStack

    return generateSupplementStack({
      goal: normalizeSupplementGoal(fitnessGoal),
      age: athleteAge,
      sex: normalizeClientSex(athleteSex),
      fitnessLevel: 'intermediate',
    })
  }, [initialStack, fitnessGoal, athleteAge, athleteSex])

  // Adherence tracking state (persisted in localStorage)
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const dispensaryInfo = useMemo(() => getDispensaryPartnerInfo(), [])
  const [adherenceMap, setAdherenceMap] = useState<Record<string, boolean>>({})
  const [selectedItemDetail, setSelectedItemDetail] = useState<PrescribedSupplementItem | null>(null)

  // Initialize adherence from storage (supporting forge_* with legacy fallback)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored =
          localStorage.getItem(`forge_supp_adherence_${todayKey}`) ??
          localStorage.getItem(`gaa_supp_adherence_${todayKey}`)
        if (stored) setAdherenceMap(JSON.parse(stored))
      } catch {}
    }
  }, [todayKey])

  // Promote Science Mechanism modal into native top layer via showModal()
  useEffect(() => {
    const dialog = detailDialogRef.current
    if (selectedItemDetail && dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [selectedItemDetail])

  const closeDetailDialog = () => {
    const dialog = detailDialogRef.current
    if (dialog?.open) {
      dialog.close()
    } else {
      setSelectedItemDetail(null)
    }
  }

  const handleDialogBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = detailDialogRef.current
    if (!dialog) return
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      if (isDialogContent) return
      dialog.close()
    }
  }

  const toggleAdherence = (itemId: string, windowKey: TimingWindow) => {
    if (isCoachView) return
    const key = `${windowKey}_${itemId}`
    const nextCompleted = !adherenceMap[key]
    setAdherenceMap(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        const serialized = JSON.stringify(next)
        localStorage.setItem(`forge_supp_adherence_${todayKey}`, serialized)
        localStorage.setItem(`gaa_supp_adherence_${todayKey}`, serialized)
      } catch {}
      return next
    })

    // Log to API in background
    void fetch('/api/fitness/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timingWindow: windowKey,
        itemId,
        date: todayKey,
        completed: nextCompleted,
      }),
    }).catch(() => {})
  }

  // Calculate adherence percentage across scheduled chrono windows
  const scheduleWindows: Array<{ key: TimingWindow; items: PrescribedSupplementItem[] }> = (
    [
      { key: 'morning_with_breakfast' as const, items: stack.chronoSchedule.morning },
      { key: 'pre_workout_45min' as const, items: stack.chronoSchedule.preWorkout },
      { key: 'post_workout_anabolic' as const, items: stack.chronoSchedule.postWorkout },
      { key: 'night_pre_sleep' as const, items: stack.chronoSchedule.night },
      { key: 'daily_flexible' as const, items: stack.chronoSchedule.dailyFlexible },
    ] as Array<{ key: TimingWindow; items: PrescribedSupplementItem[] }>
  ).filter(w => w.items.length > 0)

  const scheduledItems = scheduleWindows.flatMap(w => w.items)
  const totalItems = scheduledItems.length || 1
  const completedCount = scheduledItems.filter(item => {
    return adherenceMap[`${item.timingWindow}_${item.id}`]
  }).length
  const adherencePct = Math.round((completedCount / totalItems) * 100)

  return (
    <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
      {/* Supplement plan and daily tracking */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
                flexShrink: 0,
              }}
            >
              <GaaIcon name="supplements" size={20} tone="gold" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  Your daily supplement plan
                </h3>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                Goal: <strong style={{ color: 'var(--gold-lt)' }}>{stack.clientProfile.goal.replace(/_/g, ' ').toUpperCase()}</strong> · For: <strong style={{ color: '#FFFFFF' }}>{athleteName}</strong> · Includes safety checks
              </p>
            </div>
          </div>

          {/* Daily progress badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>
                Today&apos;s progress:
              </div>
              <div
                data-testid="supplement-adherence-summary"
                style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 800, color: adherencePct >= 80 ? '#10B981' : adherencePct >= 40 ? '#F59E0B' : 'var(--gold-lt)' }}
              >
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

        {/* Native Semantic Adherence Progress Bar */}
        <progress
          className="forge-progress-bar"
          value={completedCount}
          max={totalItems}
          aria-label="Daily supplement adherence"
          style={
            {
              '--progress-bar-fill': adherencePct >= 80 ? '#10B981' : '#D4A017',
            } as React.CSSProperties
          }
        />
      </div>

      {/* Supplement shopping options */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', maxWidth: 660, minWidth: 0 }}>
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
              alt="NSF Certified for Sport supplement formulations"
              width={84}
              height={64}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 'min(100%, 220px)' }}>
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
              <span aria-hidden="true">✦</span>
              <span>
                {isDispensaryAndSupplementsEnabled
                  ? 'Forge Athletic × Thorne Dispensary · 15% member discount'
                  : 'Thorne Dispensary & Supplements · Offline'}
              </span>
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
              {isDispensaryAndSupplementsEnabled
                ? 'OFFICIAL THORNE PRACTITIONER DISPENSARY'
                : 'THORNE DISPENSARY TEMPORARILY PAUSED'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.45 }}>
              {isDispensaryAndSupplementsEnabled
                ? 'Forge Athletic athletes receive direct practitioner access to cold-chain shipped, third-party lab verified (NSF Certified for Sport®) Thorne formulations with an exclusive 15% courtesy discount.'
                : 'Supplement ordering and dispensary fulfillment are temporarily paused for maintenance.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {isDispensaryAndSupplementsEnabled ? (
            <a
              href={dispensaryInfo.defaultThorneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tactile-btn"
              style={{
                minHeight: 44,
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                color: '#080E14',
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '10px 18px',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4)',
                whiteSpace: 'normal',
              }}
            >
              <span>Shop Thorne Dispensary (15% Off)</span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span
              style={{
                border: '1px solid rgba(245, 158, 11, 0.45)',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#FBBF24',
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 11.5,
                fontWeight: 700,
                padding: '10px 16px',
                borderRadius: 6,
              }}
            >
              Dispensary Offline
            </span>
          )}
        </div>
      </div>

      {/* FTC 16 CFR Part 255 Affiliate & FDA DSHEA / WADA Compliance Disclosure */}
      <aside
        aria-label="Supplement regulatory and affiliate disclosures"
        style={{
          padding: '12px 16px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          borderRadius: 8,
          display: 'grid',
          gap: 6,
        }}
      >
        <p style={{ margin: 0, fontSize: 11.5, color: '#E2E8F0', lineHeight: 1.5 }}>
          {FTC_AFFILIATE_DISCLOSURE}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#CBD5E1', lineHeight: 1.5 }}>
          {FDA_DSHEA_SUPPLEMENT_DISCLAIMER}
        </p>
      </aside>

      {/* Medication Safety Screening & Clinical Precautions Banner */}
      {stack.drugInteractions && stack.drugInteractions.length > 0 && (
        <div
          role="region"
          aria-label="Timeline medication safety flags"
          style={{
            padding: '14px 18px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid #EF4444',
            borderRadius: 8,
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FCA5A5', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}>
            <GaaIcon name="shield" size={14} tone="amber" />
            <span>Medication Safety Flags &amp; Clinical Precautions ({stack.drugInteractions.length} screened)</span>
          </div>
          <div style={{ fontSize: 11, color: '#FECACA', fontStyle: 'italic' }}>
            Important: Coaches do not modify medical treatment plans. Please share these research safety flags with your prescribing physician or pharmacist for clinical clearance before taking any supplements.
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 10 }}>
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
                      <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isChecked ? '#6EE7B7' : '#FFFFFF' }}>
                            {item.name}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              padding: '1px 5px',
                              borderRadius: 3,
                              background: item.routineTier === 'daily_core' ? 'rgba(212,160,23,0.2)' : 'rgba(52,211,153,0.2)',
                              color: item.routineTier === 'daily_core' ? 'var(--gold-lt)' : '#34D399',
                              fontWeight: 800,
                              border: item.routineTier === 'daily_core' ? '1px solid var(--gold)' : '1px solid var(--success)',
                            }}
                          >
                            {item.routineTier === 'daily_core' ? 'DAILY CORE' : 'WORKOUT DAYS'}
                          </span>
                          {item.nsfCertifiedForSportRecommended && (
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(197, 160, 89, 0.2)', color: 'var(--gold-lt)', fontWeight: 800, border: '1px solid var(--gold)' }}>
                              NSF SPORT
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 11.5, color: 'var(--gold-lt)', fontFamily: 'var(--font-telemetry, monospace)', fontWeight: 700 }}>
                          {item.optimalDosage}
                        </div>

                        {item.mealInstruction && (
                          <div style={{ fontSize: 10.5, color: 'var(--gray)' }}>
                            {item.mealInstruction}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedItemDetail(item)}
                            aria-label={`Science Mechanism for ${item.name}`}
                            style={{
                              minHeight: 44,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              borderRadius: 6,
                              padding: '8px 10px',
                              fontSize: 11,
                              color: 'var(--gray-lt)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <span>Science Mechanism</span>
                            <GaaIcon name="external-link" size={11} tone="slate" />
                          </button>

                          {item.recommendedBrand && isDispensaryAndSupplementsEnabled && (
                            <a
                              href={item.dispensaryUrl || dispensaryInfo.defaultThorneUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tactile-btn"
                              style={{
                                minHeight: 44,
                                fontSize: 11,
                                padding: '8px 12px',
                                borderRadius: 6,
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
                              <span style={{ color: 'var(--white)' }} aria-hidden="true">·</span>
                              <span>{item.clientDiscountPrice || '15% Off'}</span>
                              <span style={{ fontSize: 10 }} aria-hidden="true">↗</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: 1-Tap Adherence Button */}
                      <button
                        type="button"
                        disabled={isCoachView}
                        aria-pressed={isCoachView ? undefined : isChecked}
                        aria-label={
                          isCoachView
                            ? `${item.name} coach preview`
                            : `Log dose for ${item.name} (${cfg.label})`
                        }
                        onClick={() => toggleAdherence(item.id, key)}
                        className="tactile-btn"
                        style={{
                          minWidth: 44,
                          minHeight: 44,
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: isChecked ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.06)',
                          border: isChecked ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                          color: isChecked ? '#080E14' : 'var(--gray)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isCoachView ? 'default' : 'pointer',
                          opacity: isCoachView ? 0.55 : 1,
                          boxShadow: isChecked ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
                          flexShrink: 0,
                        }}
                      >
                        {isChecked ? <GaaIcon name="check" size={18} tone="inherit" /> : <span aria-hidden="true" style={{ fontSize: 14 }}>○</span>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scope of Practice & Mandatory FDA Disclaimer Footer */}
      <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
        <div style={{ background: 'rgba(8, 14, 24, 0.7)', border: '1px solid rgba(197, 160, 89, 0.25)', borderRadius: 8, padding: 14 }}>
          <div style={{ color: 'var(--gold-lt)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="shield-check" size={13} tone="gold" />
            <span>Professional Scope of Practice (NASM-CPT®)</span>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.5 }}>
            {stack.scopeOfPracticeNotice || 'This supplement guide is provided for educational and athletic performance optimization based on published sports science research (ISSN, ACSM, IOC). Coach Gordon is a Certified Personal Trainer (NASM-CPT) and does not provide medical diagnoses, treatment, or medical nutrition therapy. Always review dietary supplements with your prescribing healthcare provider.'}
          </p>
        </div>

        <div style={{ background: 'rgba(8, 14, 24, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: 14 }}>
          <div style={{ color: 'var(--gray)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="scale" size={12} tone="slate" />
            <span>Mandatory FDA &amp; Prescription Medication Disclaimer</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.5 }}>
            {stack.legalDisclaimer}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 10.5, color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.4 }}>
            {stack.ftcAffiliateDisclosure || 'Partner Notice: Forge Athletic is an authorized practitioner dispensary partner with Thorne (thorne.com/u/forgeathletic), providing athletes with third-party verified products at a 15% courtesy discount. Forge Athletic may receive an affiliate commission on qualifying purchases.'}
          </p>
        </div>
      </div>

      {/* Native Top-Layer Science Rationale & ISSN Citations Modal (<dialog closedby="any">) */}
      <dialog
        ref={detailDialogRef}
        aria-labelledby={dialogTitleId}
        {...({ closedby: 'any' } as Record<string, string>)}
        onClose={() => setSelectedItemDetail(null)}
        onClick={handleDialogBackdropClick}
        className="forge-glass-modal"
        style={{
          width: 'min(92vw, 520px)',
          maxWidth: 520,
          margin: 'auto',
          padding: 0,
          background: '#090F1B',
          color: '#FFFFFF',
          border: '1.5px solid var(--gold)',
          borderRadius: 12,
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        }}
      >
        {selectedItemDetail && (
          <div style={{ padding: '20px 24px', display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span style={{ fontSize: 10.5, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                  Supplement details
                </span>
                <h4
                  id={dialogTitleId}
                  style={{ margin: '2px 0 0', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, color: '#FFFFFF' }}
                >
                  {selectedItemDetail.name}
                </h4>
              </div>
              <button
                type="button"
                aria-label="Close supplement details"
                onClick={closeDetailDialog}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 8,
                  color: 'var(--gray-lt)',
                  cursor: 'pointer',
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
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
                <strong style={{ color: 'var(--gold-lt)' }}>Research summary:</strong>
                <p style={{ margin: '3px 0 0', color: '#CBD5E1' }}>{selectedItemDetail.clinicalEvidenceSummary}</p>
              </div>

              <div>
                <strong style={{ color: 'var(--gold-lt)' }}>Research references:</strong>
                <p style={{ margin: '3px 0 0', color: '#94A3B8', fontFamily: 'var(--font-telemetry, monospace)', fontSize: 11 }}>
                  {selectedItemDetail.issnCitation}
                </p>
              </div>

              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--gray)' }}>Target Dosage:</span>
                <strong style={{ color: '#FFFFFF', fontFamily: 'var(--font-telemetry, monospace)' }}>{selectedItemDetail.optimalDosage}</strong>
              </div>

              {selectedItemDetail.recommendedBrand && isDispensaryAndSupplementsEnabled && (
                <div style={{ padding: '12px 14px', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.35)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
                      Partner product
                    </div>
                    <div style={{ fontSize: 13.5, color: '#FFFFFF', fontWeight: 700 }}>
                      {selectedItemDetail.recommendedBrand}® ({selectedItemDetail.dispensarySku})
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--gold-lt)', marginTop: 2 }}>
                      Client Privilege Price: <strong>{selectedItemDetail.clientDiscountPrice}</strong>{' '}
                      <span style={{ textDecoration: 'line-through', color: 'var(--gray)', fontSize: 10.5 }}>{selectedItemDetail.retailPriceEstimate}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#CBD5E1', marginTop: 3 }}>
                      15% courtesy discount · Partner dispensary (affiliate commission link; optional sourcing)
                    </div>
                  </div>
                  <a
                    href={selectedItemDetail.dispensaryUrl || dispensaryInfo.defaultThorneUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tactile-btn"
                    style={{
                      minHeight: 44,
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                      color: '#080E14',
                      padding: '10px 16px',
                      borderRadius: 4,
                      fontSize: 12.5,
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>Order on Thorne</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              autoFocus
              onClick={closeDetailDialog}
              className="tactile-btn"
              style={{
                minHeight: 44,
                padding: '10px 16px',
                borderRadius: 6,
                background: 'var(--gold)',
                border: 'none',
                color: '#080E14',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Close details
            </button>
          </div>
        )}
      </dialog>
    </div>
  )
}
