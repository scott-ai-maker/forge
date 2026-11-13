'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FOUNDING_PRICING_CARDS } from '@/lib/landingSocialProof'
import { HOLIDAY_DEAL_PROMO } from '@/lib/launch-config'

interface FoundingRateLockPricingGridProps {
  mode?: 'live' | 'prelaunch'
  onPrelaunchClaimClick?: () => void
}

export default function FoundingRateLockPricingGrid({
  mode = 'live',
  onPrelaunchClaimClick,
}: FoundingRateLockPricingGridProps) {
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(HOLIDAY_DEAL_PROMO.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      // Clipboard fallback
    }
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      {/* Tactile Founding Member Rate Lock Guarantee Banner */}
      <div
        style={{
          marginBottom: '1.75rem',
          padding: '1.2rem 1.5rem',
          borderRadius: 14,
          background:
            'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.96) 55%, rgba(8, 14, 20, 0.99) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          boxShadow: '0 18px 42px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(251, 191, 36, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ maxWidth: 740, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#080E14',
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                padding: '3px 10px',
                borderRadius: 4,
              }}
            >
              FOUNDING MEMBER LIFETIME RATE LOCK
            </span>
            <span
              style={{
                fontFamily: 'var(--font-telemetry)',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#34D399',
                background: 'rgba(52, 211, 153, 0.14)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                padding: '3px 10px',
                borderRadius: 4,
              }}
            >
              + 30-DAY FOUNDING PARTNER PASS INCLUDED
            </span>
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '1.1rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.02em',
            }}
          >
            Permanent Founding Member Rate Lock + Free 60-Min Pre-Holiday Movement Screen
          </div>
          <p style={{ margin: '4px 0 0', color: '#CBD5E1', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Lock in your Founding Member rate before public pricing takes effect. Your monthly rate never increases while your membership stays active.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          style={{
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 8,
            background: 'rgba(8, 14, 24, 0.92)',
            border: '1px dashed rgba(245, 158, 11, 0.65)',
            color: '#FBBF24',
            fontFamily: 'var(--font-telemetry)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          <span>{copiedCode ? '✓ COPIED HOLIDAY25' : `CODE: ${HOLIDAY_DEAL_PROMO.code}`}</span>
        </button>
      </div>

      {/* 4-Card Luxury Carbon & Gold Pricing Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {FOUNDING_PRICING_CARDS.map(tier => {
          const isFeatured = Boolean(tier.featured)
          return (
            <article
              key={tier.id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 16,
                background: isFeatured
                  ? 'linear-gradient(160deg, rgba(22, 32, 52, 0.97) 0%, rgba(8, 14, 22, 0.99) 100%)'
                  : 'linear-gradient(160deg, rgba(15, 23, 42, 0.94) 0%, rgba(8, 14, 20, 0.98) 100%)',
                border: isFeatured
                  ? '1px solid rgba(245, 158, 11, 0.72)'
                  : '1px solid rgba(148, 163, 184, 0.22)',
                boxShadow: isFeatured
                  ? '0 24px 56px rgba(0, 0, 0, 0.65), 0 0 36px rgba(245, 158, 11, 0.14), inset 0 1px 0 rgba(251, 191, 36, 0.3)'
                  : '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                textAlign: 'left',
              }}
            >
              {/* 16:10 Photography Header + Atmospheric Gradient Vignette */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 10',
                  overflow: 'hidden',
                  background: '#05080F',
                }}
              >
                <Image
                  src={tier.imageSrc}
                  alt={tier.imageAlt}
                  width={520}
                  height={325}
                  loading="lazy"
                  sizes="(max-width: 640px) 95vw, (max-width: 1280px) 46vw, 24vw"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(8, 14, 20, 0.15) 0%, rgba(8, 14, 20, 0.55) 60%, rgba(8, 14, 20, 0.96) 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    right: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: 'rgba(8, 14, 20, 0.86)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      color: '#CBD5E1',
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tier.eyebrow}
                  </span>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: 9999,
                      background: isFeatured
                        ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                        : 'rgba(16, 185, 129, 0.18)',
                      backdropFilter: 'blur(8px)',
                      border: isFeatured
                        ? '1px solid rgba(251, 191, 36, 0.8)'
                        : '1px solid rgba(52, 211, 153, 0.45)',
                      color: isFeatured ? '#080E14' : '#6EE7B7',
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tier.badge}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  padding: '1.25rem 1.35rem 1.4rem',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    lineHeight: 1.15,
                  }}
                >
                  {tier.name}
                </h3>

                {/* Founding Price + Strikethrough Post-Launch Rate */}
                <div
                  style={{
                    marginTop: '0.85rem',
                    paddingBottom: '0.9rem',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: '2.15rem',
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                    }}
                  >
                    {tier.foundingPrice}
                  </span>
                  <span
                    style={{
                      color: '#64748B',
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      textDecoration: 'line-through',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {tier.postLaunchPrice}
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{tier.billingUnit}</span>
                </div>

                <p
                  style={{
                    margin: '0.85rem 0 0',
                    color: '#CBD5E1',
                    fontSize: '0.84rem',
                    lineHeight: 1.55,
                  }}
                >
                  {tier.summary}
                </p>

                {/* Feature Bullets */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '1rem 0 1.25rem',
                    display: 'grid',
                    gap: '0.55rem',
                  }}
                >
                  {tier.highlights.map(point => (
                    <li
                      key={point}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        color: '#E2E8F0',
                        fontSize: '0.8rem',
                        lineHeight: 1.45,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          color: isFeatured ? '#FBBF24' : '#38BDF8',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        ✓
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {/* Tactile Action Button */}
                <div style={{ marginTop: 'auto' }}>
                  {mode === 'prelaunch' && onPrelaunchClaimClick ? (
                    <button
                      type="button"
                      onClick={onPrelaunchClaimClick}
                      style={{
                        width: '100%',
                        minHeight: 46,
                        padding: '0.7rem 1rem',
                        borderRadius: 10,
                        border: isFeatured
                          ? '1px solid #FBBF24'
                          : '1px solid rgba(245, 158, 11, 0.55)',
                        background: isFeatured
                          ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                          : 'rgba(245, 158, 11, 0.12)',
                        color: isFeatured ? '#080E14' : '#FDE68A',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      {tier.ctaLabel} →
                    </button>
                  ) : (
                    <Link
                      href={tier.ctaHref}
                      style={{
                        width: '100%',
                        minHeight: 46,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.7rem 1rem',
                        borderRadius: 10,
                        border: isFeatured
                          ? '1px solid #FBBF24'
                          : '1px solid rgba(245, 158, 11, 0.55)',
                        background: isFeatured
                          ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                          : 'rgba(245, 158, 11, 0.12)',
                        color: isFeatured ? '#080E14' : '#FDE68A',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                      }}
                    >
                      {tier.ctaLabel} →
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

