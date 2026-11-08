'use client'

import { useState } from 'react'
import Image from 'next/image'
import PurchaseButton from '@/components/packages/PurchaseButton'
import { FORGE_MEMBERSHIPS } from '@/lib/forge-memberships'
import { HOLIDAY_DEAL_PROMO } from '@/lib/launch-config'

const formatPrice = (priceCents: number) => `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}`

const PLAN_VISUALS: Record<string, { src: string; alt: string }> = {
  'forge-core': {
    src: '/images/pillar-progress-telemetry.jpg',
    alt: 'Member tracking workout sets and personal records',
  },
  'forge-pro-athlete': {
    src: '/images/remote-virtual-coaching.jpg',
    alt: 'Remote video form check and hybrid training guidance',
  },
  'forge-transformation-direct': {
    src: '/images/coach-client-plan.jpg',
    alt: 'Coach Gordon providing 1:1 program design and consultation',
  },
}

const PLAN_SUBTITLES: Record<string, string> = {
  'forge-core': 'Foundation · Autonomous NASM OPT™ Lab',
  'forge-pro-athlete': 'Guided Asynchronous · Form Lab & Nutrition',
  'forge-transformation-direct': 'Master Coaching · Direct Access (Cap 15)',
}

export default function ForgeMembershipPlans() {
  const [holidayDealActive, setHolidayDealActive] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  const getDiscountedCents = (baseCents: number) =>
    Math.floor(baseCents * (100 - HOLIDAY_DEAL_PROMO.discountPercent) / 100)

  const copyPromoCode = async () => {
    try {
      await navigator.clipboard.writeText(HOLIDAY_DEAL_PROMO.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div>
      {/* Holiday Founding Deal Banner */}
      <div
        style={{
          marginBottom: '1.75rem',
          padding: '1.15rem 1.5rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.96) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ maxWidth: '760px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '10.5px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#080E14',
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                padding: '3px 9px',
                borderRadius: '4px',
              }}
            >
              {HOLIDAY_DEAL_PROMO.badge}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#34D399',
                background: 'rgba(52, 211, 153, 0.14)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                padding: '3px 9px',
                borderRadius: '4px',
              }}
            >
              + FREE 60-MIN PRE-HOLIDAY MOVEMENT SCREEN
            </span>
          </div>
          <div style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
            {HOLIDAY_DEAL_PROMO.headline}
          </div>
          <p style={{ margin: '4px 0 0', color: '#CBD5E1', fontSize: '0.86rem', lineHeight: 1.5 }}>
            {HOLIDAY_DEAL_PROMO.summary}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={copyPromoCode}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(8, 14, 24, 0.9)',
              border: '1px dashed rgba(245, 158, 11, 0.6)',
              color: '#FBBF24',
              fontFamily: 'var(--font-telemetry)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            {copiedCode ? '✓ COPIED HOLIDAY25' : `CODE: ${HOLIDAY_DEAL_PROMO.code}`}
          </button>

          <button
            type="button"
            onClick={() => setHolidayDealActive(prev => !prev)}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 14px',
              borderRadius: '8px',
              background: holidayDealActive ? 'rgba(52, 211, 153, 0.18)' : 'rgba(255, 255, 255, 0.06)',
              border: holidayDealActive ? '1px solid rgba(52, 211, 153, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: holidayDealActive ? '#34D399' : '#94A3B8',
              fontFamily: 'var(--font-telemetry)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {holidayDealActive ? '✓ 25% Holiday Deal Applied' : 'Apply 25% Holiday Deal'}
          </button>
        </div>
      </div>

      <div className="forge-plans-grid">
        {FORGE_MEMBERSHIPS.map((membership, index) => {
          const discountedMonthly = getDiscountedCents(membership.monthlyPriceCents)
          const discountedAnnual =
            membership.annualPriceCents !== undefined
              ? getDiscountedCents(membership.annualPriceCents)
              : undefined

          return (
            <article className={`forge-plan-card${index === 0 ? ' forge-plan-card-featured' : ''}`} key={membership.id}>
              {PLAN_VISUALS[membership.id] && (
                <div
                  style={{
                    position: 'relative',
                    width: 'calc(100% + 2 * clamp(1.25rem, 3vw, 2rem))',
                    margin: 'calc(-1 * clamp(1.25rem, 3vw, 2rem)) calc(-1 * clamp(1.25rem, 3vw, 2rem)) 1.25rem',
                    aspectRatio: '16 / 9',
                    overflow: 'hidden',
                    borderTopLeftRadius: 11,
                    borderTopRightRadius: 11,
                    background: '#080E14',
                  }}
                >
                  <Image
                    src={PLAN_VISUALS[membership.id].src}
                    alt={PLAN_VISUALS[membership.id].alt}
                    width={500}
                    height={280}
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(8, 14, 20, 0.1) 0%, rgba(8, 14, 20, 0.85) 100%)',
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                {index === 0 && <span className="forge-plan-label">7-day free trial</span>}
                {holidayDealActive && (
                  <span
                    className="forge-plan-label"
                    style={{
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: '#34D399',
                      border: '1px solid rgba(52, 211, 153, 0.35)',
                    }}
                  >
                    25% Lifetime Rate Lock ({HOLIDAY_DEAL_PROMO.code})
                  </span>
                )}
                {membership.seatCapLabel && (
                  <span
                    className="forge-plan-label"
                    style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: '#D4AF37',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                    }}
                  >
                    {membership.seatCapLabel}
                  </span>
                )}
              </div>
              <h3>{membership.name}</h3>
              {PLAN_SUBTITLES[membership.id] && (
                <p style={{ color: 'var(--gold-lt)', fontSize: '0.8rem', fontFamily: 'var(--font-telemetry)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0.25rem 0 0' }}>
                  {PLAN_SUBTITLES[membership.id]}
                </p>
              )}
              {membership.annualPriceCents !== undefined ? (
                <>
                  <p className="forge-plan-price">
                    {holidayDealActive ? (
                      <>
                        <span style={{ textDecoration: 'line-through', color: '#64748B', fontSize: '0.6em', marginRight: '8px' }}>
                          {formatPrice(membership.monthlyPriceCents)}
                        </span>
                        {formatPrice(discountedMonthly)}
                      </>
                    ) : (
                      formatPrice(membership.monthlyPriceCents)
                    )}
                    <span>/month</span>
                  </p>
                  <p className="forge-plan-alternative">
                    {holidayDealActive && discountedAnnual !== undefined ? (
                      <>
                        or <span style={{ textDecoration: 'line-through', opacity: 0.65 }}>{formatPrice(membership.annualPriceCents)}</span>{' '}
                        <strong style={{ color: '#34D399' }}>{formatPrice(discountedAnnual)}/year</strong> with {HOLIDAY_DEAL_PROMO.code}
                      </>
                    ) : (
                      <>or {formatPrice(membership.annualPriceCents)}/year</>
                    )}
                  </p>
                </>
              ) : (
                <p className="forge-plan-price">
                  {holidayDealActive ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#64748B', fontSize: '0.6em', marginRight: '8px' }}>
                        {formatPrice(membership.monthlyPriceCents)}
                      </span>
                      {formatPrice(discountedMonthly)}
                    </>
                  ) : (
                    formatPrice(membership.monthlyPriceCents)
                  )}
                  <span>/month</span>
                </p>
              )}
              <ul>
                {holidayDealActive && (
                  <li style={{ color: '#34D399', fontWeight: 600 }}>
                    ★ Bonus: Free 60-Min Pre-Holiday Movement Screen with Coach Gordon
                  </li>
                )}
                {membership.features.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
              <div className="forge-plan-actions">
                {membership.annualPriceCents !== undefined ? (
                  <>
                    <PurchaseButton
                      packageId={membership.id}
                      cadence="monthly"
                      buttonLabel={membership.trialDays ? 'Start free trial' : 'Choose monthly'}
                      redirectNext="/packages"
                      showDiscountCode={false}
                      defaultDiscountCode={holidayDealActive ? HOLIDAY_DEAL_PROMO.code : ''}
                    />
                    <PurchaseButton
                      packageId={membership.id}
                      cadence="annual"
                      buttonLabel="Choose annual"
                      redirectNext="/packages"
                      showDiscountCode={false}
                      defaultDiscountCode={holidayDealActive ? HOLIDAY_DEAL_PROMO.code : ''}
                    />
                  </>
                ) : (
                  <PurchaseButton
                    packageId={membership.id}
                    cadence="monthly"
                    buttonLabel="Choose plan"
                    redirectNext="/packages"
                    showDiscountCode={false}
                    defaultDiscountCode={holidayDealActive ? HOLIDAY_DEAL_PROMO.code : ''}
                  />
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
