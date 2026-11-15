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
    <div style={{ maxWidth: 1160, margin: '0 auto' }}>
      {/* Tactile Founding Member Rate Lock Guarantee Banner */}
      <div
        style={{
          marginBottom: '1.75rem',
          padding: '1.2rem 1.5rem',
          borderRadius: 14,
          background:
            'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(15, 23, 42, 0.96) 55%, rgba(8, 14, 20, 0.99) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.42)',
          boxShadow: '0 18px 42px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(251, 191, 36, 0.22)',
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
              + 1 FREE 30-DAY FOUNDING PARTNER PASS
            </span>
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: '1.08rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.02em',
            }}
          >
            Permanent Founding Rate Protection + Complimentary Pre-Thanksgiving 1-on-1 Movement Screening
          </div>
          <p style={{ margin: '4px 0 0', color: '#CBD5E1', fontSize: '0.88rem', lineHeight: 1.55 }}>
            Lock in your Founding Member rate before post-launch pricing takes effect. Your monthly rate stays locked while active—even if you upgrade tiers later.
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

      {/* Streamlined 3-Tier Obsidian & Brushed Steel Pricing Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {FOUNDING_PRICING_CARDS.map(tier => {
          const isFeatured = Boolean(tier.featured)
          const isCapped = tier.id === 'coach_support'
          return (
            <article
              key={tier.id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 16,
                background: '#111318',
                border: isFeatured
                  ? '1px solid rgba(245, 158, 11, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isFeatured
                  ? 'inset 0 1px 0 rgba(251, 191, 36, 0.28), 0 24px 56px rgba(0, 0, 0, 0.68), 0 0 32px rgba(245, 158, 11, 0.1)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 16px 40px rgba(0, 0, 0, 0.5)',
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
                  sizes="(max-width: 1024px) 95vw, 32vw"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(8, 14, 20, 0.16) 0%, rgba(8, 14, 20, 0.55) 60%, rgba(8, 14, 20, 0.96) 100%)',
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
                    justifyContent: 'flex-end',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 9999,
                      background: isFeatured
                        ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                        : isCapped
                          ? 'rgba(15, 23, 42, 0.9)'
                          : 'rgba(16, 185, 129, 0.2)',
                      backdropFilter: 'blur(8px)',
                      border: isFeatured
                        ? '1px solid rgba(251, 191, 36, 0.85)'
                        : isCapped
                          ? '1px solid rgba(245, 158, 11, 0.55)'
                          : '1px solid rgba(52, 211, 153, 0.45)',
                      color: isFeatured ? '#080E14' : isCapped ? '#FDE68A' : '#6EE7B7',
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
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
                  padding: '1.35rem 1.4rem 1.5rem',
                }}
              >
                <div
                  style={{
                    color: '#FBBF24',
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '0.3rem',
                  }}
                >
                  {tier.eyebrow}
                </div>

                <h3
                  style={{
                    margin: 0,
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.7rem',
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
                    gap: 8,
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
                  <span style={{ color: '#94A3B8', fontSize: '0.88rem', fontWeight: 600 }}>
                    {tier.billingUnit}
                  </span>
                  <span
                    style={{
                      color: '#94A3B8',
                      fontFamily: 'var(--font-telemetry)',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    (Post-launch{' '}
                    <span style={{ textDecoration: 'line-through', color: '#64748B' }}>
                      {tier.postLaunchPrice}
                      {tier.billingUnit}
                    </span>
                    )
                  </span>
                </div>

                {tier.leadIn ? (
                  <p
                    style={{
                      margin: '0.9rem 0 0',
                      color: '#FDE68A',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {tier.leadIn}
                  </p>
                ) : null}

                {/* Feature Bullets */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0.85rem 0 1.35rem',
                    display: 'grid',
                    gap: '0.6rem',
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
                        fontSize: '0.82rem',
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          color: isFeatured ? '#FBBF24' : '#34D399',
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
                      className="forge-tactile-press"
                      style={{
                        width: '100%',
                        minHeight: 46,
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        border: isFeatured
                          ? '1px solid #FBBF24'
                          : '1px solid rgba(255, 255, 255, 0.14)',
                        background: isFeatured
                          ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                          : '#181B22',
                        color: isFeatured ? '#090A0D' : '#F8FAFC',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Claim Your Founding Member Pass →
                    </button>
                  ) : (
                    <Link
                      href={tier.ctaHref}
                      className="forge-tactile-press"
                      style={{
                        width: '100%',
                        minHeight: 46,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        border: isFeatured
                          ? '1px solid #FBBF24'
                          : '1px solid rgba(255, 255, 255, 0.14)',
                        background: isFeatured
                          ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                          : '#181B22',
                        color: isFeatured ? '#090A0D' : '#F8FAFC',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
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
