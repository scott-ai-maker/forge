'use client'

import React, { useEffect, useId, useMemo, useState } from 'react'
import {
  ClientSex,
  evaluateIntakePhysicianConsultFlag,
  FDA_DSHEA_DISCLAIMER,
  FitnessLevel,
  FTC_PROXIMATE_AFFILIATE_DISCLOSURE,
  getDispensaryPartnerInfo,
  getThorneGoalCollection,
  IntakePhysicianConsultAlert,
  isDispensaryAndSupplementsEnabled,
  MA_SAFE_HARBOR_SCOPE_NOTICE,
  normalizeSupplementGoal,
  SupplementGoal,
  WADA_NSF_SPORT_NOTICE,
} from '@/lib/supplement-prescriptions'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface SupplementAdvisorWidgetProps {
  initialGoal?: SupplementGoal
  initialAge?: number
  initialSex?: ClientSex
  initialLevel?: FitnessLevel
  intake?: {
    parq_answers?: unknown
    parq_any_yes?: boolean
    medications?: string | null
    medical_conditions?: string | null
    surgeries_or_injuries?: string | null
    allergies?: string | null
  } | null
}

const GOAL_OPTIONS: Array<{ value: SupplementGoal; label: string }> = [
  { value: 'hypertrophy', label: 'Strength & Lean Muscle' },
  { value: 'fat_loss', label: 'Lean Composition & Satiety' },
  { value: 'athletic_power', label: 'Power, Conditioning & Hydration' },
  { value: 'longevity_vitality', label: 'Joint Comfort & Active Longevity' },
  { value: 'general_health', label: 'Foundational Daily Wellness' },
]

export default function SupplementAdvisorWidget({
  initialGoal = 'hypertrophy',
  intake,
}: SupplementAdvisorWidgetProps) {
  const fieldPrefix = useId()
  const goalFieldId = `${fieldPrefix}-goal`

  const [goal, setGoal] = useState<SupplementGoal>(() => normalizeSupplementGoal(initialGoal))
  const [serverConsultAlert, setServerConsultAlert] = useState<IntakePhysicianConsultAlert | null>(null)

  useEffect(() => {
    setGoal(normalizeSupplementGoal(initialGoal))
  }, [initialGoal])

  useEffect(() => {
    let cancelled = false
    async function hydrateFromIntake() {
      try {
        const res = await fetch('/api/fitness/supplements', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data?.physicianConsultAlert) {
          setServerConsultAlert(data.physicianConsultAlert as IntakePhysicianConsultAlert)
        }
        if (data?.goal && !initialGoal) {
          setGoal(normalizeSupplementGoal(data.goal))
        }
      } catch {
        // Fallback cleanly to prop-derived intake banner
      }
    }
    void hydrateFromIntake()
    return () => {
      cancelled = true
    }
  }, [initialGoal])

  const localConsultAlert = useMemo(
    () => evaluateIntakePhysicianConsultFlag(intake ?? null),
    [intake]
  )

  const activeConsultAlert = useMemo<IntakePhysicianConsultAlert>(() => {
    if (serverConsultAlert?.requiresPhysicianConsultNotice) return serverConsultAlert
    if (localConsultAlert.requiresPhysicianConsultNotice) return localConsultAlert
    return serverConsultAlert ?? localConsultAlert
  }, [serverConsultAlert, localConsultAlert])

  const collection = useMemo(() => getThorneGoalCollection(goal), [goal])
  const partnerInfo = getDispensaryPartnerInfo()

  if (!isDispensaryAndSupplementsEnabled) {
    return null
  }

  return (
    <section
      aria-label="Thorne Partner Storefront Goal Collections"
      style={{
        background: 'linear-gradient(145deg, rgba(13, 21, 35, 0.96) 0%, rgba(8, 13, 23, 0.98) 100%)',
        border: '1px solid rgba(212, 160, 23, 0.3)',
        borderRadius: 12,
        padding: 'clamp(16px, 3vw, 24px)',
        display: 'grid',
        gap: 18,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#34D399',
              }}
            >
              {partnerInfo.partnerName}
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                background: 'rgba(52, 211, 153, 0.14)',
                color: '#34D399',
                border: '1px solid rgba(52, 211, 153, 0.35)',
              }}
            >
              15% MEMBER DISCOUNT · NSF CERTIFIED FOR SPORT®
            </span>
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 'clamp(1.1rem, 2.4vw, 1.35rem)',
              color: 'var(--white)',
              letterSpacing: '0.03em',
            }}
          >
            Suggested Thorne Collections by Training Goal
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--gray)', lineHeight: 1.55, maxWidth: 760 }}>
            Optional, stimulant-free third-party tested storefront bundles organized by broad training goal. Forge Athletic does not calculate individualized supplement dosages or screen medication interactions—always follow Thorne&apos;s official Supplement Facts label and your physician&apos;s guidance.
          </p>
        </div>
      </div>

      {/* Mandatory Physician / Pharmacist Consult Banner */}
      <div
        role="note"
        style={{
          padding: '14px 16px',
          borderRadius: 8,
          background: activeConsultAlert.requiresPhysicianConsultNotice
            ? 'rgba(245, 158, 11, 0.12)'
            : 'rgba(56, 189, 248, 0.08)',
          border: activeConsultAlert.requiresPhysicianConsultNotice
            ? '1.5px solid rgba(245, 158, 11, 0.5)'
            : '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <GaaIcon
          name="shield"
          size={18}
          tone={activeConsultAlert.requiresPhysicianConsultNotice ? 'amber' : 'cyan'}
        />
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: '#E2E8F0' }}>
          <strong
            style={{
              display: 'block',
              marginBottom: 3,
              color: activeConsultAlert.requiresPhysicianConsultNotice ? '#FCD34D' : '#7DD3FC',
            }}
          >
            {activeConsultAlert.headline}
          </strong>
          <span>{activeConsultAlert.message}</span>
        </div>
      </div>

      {/* Goal Collection Selector */}
      <fieldset
        style={{
          margin: 0,
          padding: '14px 16px',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <legend
          style={{
            padding: '0 8px',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--gold-lt)',
          }}
        >
          Browse Thorne Collection by Training Focus
        </legend>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label
            htmlFor={goalFieldId}
            style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--white)' }}
          >
            Training Goal:
          </label>
          <select
            id={goalFieldId}
            value={goal}
            onChange={e => setGoal(normalizeSupplementGoal(e.target.value))}
            style={{
              minHeight: 44,
              padding: '8px 12px',
              borderRadius: 6,
              background: '#0B1322',
              border: '1px solid rgba(212, 160, 23, 0.45)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {GOAL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* Active Goal Collection Cards */}
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--white)' }}>
            {collection.title}
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--gray)' }}>
            {collection.subtitle}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {collection.products.map(product => (
            <article
              key={product.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {product.category}
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(52, 211, 153, 0.14)',
                      color: '#34D399',
                    }}
                  >
                    {product.certificationBadge}
                  </span>
                </div>
                <h5 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 800, color: '#FFFFFF' }}>
                  {product.name}
                </h5>
                <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--gray)', lineHeight: 1.5 }}>
                  {product.overview}
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: '#CBD5E1', fontStyle: 'italic' }}>
                  {product.labelGuidance}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--gray)', textDecoration: 'line-through', marginRight: 6 }}>
                    {product.retailPriceEstimate}
                  </span>
                  <strong style={{ color: '#34D399', fontFamily: 'monospace', fontSize: 13 }}>
                    {product.memberDiscountPrice}
                  </strong>
                </div>
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  style={{
                    minHeight: 40,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(212, 160, 23, 0.18)',
                    border: '1px solid rgba(212, 160, 23, 0.5)',
                    color: 'var(--gold-lt)',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  View on Thorne →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Proximate FTC Affiliate + Storefront CTA + FDA DSHEA Disclosures */}
      <div
        style={{
          padding: 14,
          borderRadius: 8,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#E2E8F0', lineHeight: 1.5, flex: '1 1 360px' }}>
            {FTC_PROXIMATE_AFFILIATE_DISCLOSURE}
          </p>
          <a
            href={collection.storefrontUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{
              minHeight: 44,
              padding: '10px 18px',
              borderRadius: 6,
              background: 'var(--gold)',
              color: '#080E14',
              fontSize: 12.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            Open Thorne Partner Storefront (15% Off) →
          </a>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, fontSize: 11, color: 'var(--gray)', lineHeight: 1.55, display: 'grid', gap: 4 }}>
          <p style={{ margin: 0 }}>{FDA_DSHEA_DISCLAIMER}</p>
          <p style={{ margin: 0 }}>{MA_SAFE_HARBOR_SCOPE_NOTICE}</p>
          <p style={{ margin: 0 }}>{WADA_NSF_SPORT_NOTICE}</p>
        </div>
      </div>
    </section>
  )
}
