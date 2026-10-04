'use client'

import { useState, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { CoachingPackage, CoachingAddon } from '@/lib/stripe'
import PurchaseButton from '@/components/packages/PurchaseButton'
import MasterAllocationModal from '@/components/packages/MasterAllocationModal'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import { isCompanionApp } from '@/lib/native-companion'

interface PackagesStudioClientProps {
  packages: CoachingPackage[]
  addons: CoachingAddon[]
  packageImages: Record<string, string>
}

export default function PackagesStudioClient({
  packages,
  addons,
  packageImages,
}: PackagesStudioClientProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('momentum')
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])
  const [cadence, setCadence] = useState<'monthly' | 'twelve_week'>('twelve_week')
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const requestedTier = params.get('tier')
      if (requestedTier && packages.some(p => p.id === requestedTier)) {
        setSelectedPackageId(requestedTier)
      }
    }
  }, [packages])

  const isPif = cadence === 'twelve_week'
  const isCompanion = isCompanionApp()
  const currentPackage = packages.find(p => p.id === selectedPackageId) ?? packages[1] ?? packages[0]

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    )
  }

  const selectedAddons = addons.filter(a => selectedAddonIds.includes(a.id))

  const basePriceCents = isPif
    ? (currentPackage?.pifPriceCents ?? (currentPackage?.price ?? 0) * 3)
    : (currentPackage?.price ?? 0)

  const recurringAddonsCents = selectedAddons
    .filter(a => a.billingType === 'recurring_monthly')
    .reduce((sum, a) => sum + (isPif ? a.priceCents * 3 : a.priceCents), 0)

  const oneTimeAddonsCents = selectedAddons
    .filter(a => a.billingType === 'one_time')
    .reduce((sum, a) => sum + a.priceCents, 0)

  const totalInvestmentCents = basePriceCents + recurringAddonsCents + (isPif ? oneTimeAddonsCents : 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
      {isCompanion && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(13,27,42,0.95) 100%)',
            border: '1px solid rgba(212,160,23,0.45)',
            borderRadius: 12,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <GaaIcon name="shield-check" size={28} tone="gold" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', marginBottom: 2 }}>
                GAA Mobile Gym Companion App
              </div>
              <div style={{ fontSize: 13.5, color: '#FFFFFF', fontWeight: 600 }}>
                Memberships and billing are managed exclusively on our web portal at <strong style={{ color: 'var(--gold)' }}>forge-athletic.app</strong>.
              </div>
            </div>
          </div>
          <a
            href="/dashboard"
            className="sgf-button sgf-button-primary"
            style={{
              padding: '10px 20px',
              textDecoration: 'none',
              fontSize: 12.5,
              fontWeight: 800,
            }}
          >
            ← Return to Gym Dashboard
          </a>
        </div>
      )}

      {/* ── 1. MASTER CONCIERGE TIERS ────────────────────────────────────────── */}
      <div>
        {/* Cadence Selector Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(212, 160, 23, 0.35)',
              borderRadius: 30,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setCadence('twelve_week')}
              style={{
                padding: '10px 22px',
                borderRadius: 24,
                border: 'none',
                background: isPif
                  ? 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)'
                  : 'transparent',
                color: isPif ? '#0A0E18' : 'var(--gray)',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>12-Week Transformation Block</span>
              <span
                style={{
                  background: isPif ? '#0A0E18' : 'rgba(212, 160, 23, 0.2)',
                  color: isPif ? 'var(--gold-lt)' : 'var(--gold)',
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: 12,
                  letterSpacing: '0.06em',
                }}
              >
                SAVE UP TO $590
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCadence('monthly')}
              style={{
                padding: '10px 22px',
                borderRadius: 24,
                border: 'none',
                background: !isPif
                  ? 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)'
                  : 'transparent',
                color: !isPif ? '#0A0E18' : 'var(--gray)',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Monthly Retainer
            </button>
          </div>
          <p
            style={{
              margin: '10px 0 0',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 12,
              color: 'var(--gray)',
              textAlign: 'center',
              maxWidth: 680,
            }}
          >
            {isPif
              ? '✦ 12-week upfront macrocycles lock in your periodization with complimentary diagnostics & zero monthly price increases.'
              : 'Flexible month-to-month concierge membership. Cancel or adjust anytime before your next cycle.'}
          </p>
        </div>

        <div
          className="packages-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 20,
          }}
        >
          {packages.map(pkg => {
            const isSelected = selectedPackageId === pkg.id
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={pkg.popular ? 'glass-card-gold packages-card' : 'glass-card packages-card'}
                style={{
                  padding: '30px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  position: 'relative',
                  cursor: 'pointer',
                  border: isSelected
                    ? '2px solid var(--gold)'
                    : pkg.popular
                    ? '1px solid rgba(212,160,23,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isSelected
                    ? '0 0 35px rgba(212,160,23,0.35)'
                    : '0 10px 30px rgba(0,0,0,0.5)',
                  transition: 'all 0.2s ease',
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
              >
                {/* Hero Graphic Header */}
                <div
                  style={{
                    height: 130,
                    margin: '-30px -20px 0',
                    borderRadius: '8px 8px 0 0',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    backgroundImage: `linear-gradient(180deg, rgba(8,14,20,0.2), rgba(8,14,20,0.85)), url('${packageImages[pkg.id] ?? '/images/package-starter.jpg'}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />

                {pkg.id === 'transformation' ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: -1,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 50%, #937332 100%)',
                      color: '#080E14',
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      padding: '4px 18px',
                      whiteSpace: 'nowrap',
                      fontWeight: 800,
                      borderRadius: '0 0 6px 6px',
                      boxShadow: '0 4px 15px rgba(197,160,89,0.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GaaIcon name="crown" size={12} tone="inherit" />
                    <span>PRIVATE MASTER TIER</span>
                  </div>
                ) : pkg.popular ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: -1,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                      color: '#0A0E18',
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      padding: '4px 18px',
                      whiteSpace: 'nowrap',
                      fontWeight: 800,
                      borderRadius: '0 0 6px 6px',
                      boxShadow: '0 4px 15px rgba(212,160,23,0.4)',
                    }}
                  >
                    FLAGSHIP CONCIERGE
                  </div>
                ) : null}

                {/* Background Watermark Seal for Tier 3 */}
                {pkg.id === 'transformation' && (
                  <div style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.04, pointerEvents: 'none' }}>
                    <GaaMasterWatermarkSeal size={180} opacity={1} />
                  </div>
                )}

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Raleway, sans-serif',
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--gold-lt)',
                      }}
                    >
                      {pkg.subtitle}
                    </span>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        border: isSelected ? '2px solid var(--gold)' : '2px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? 'var(--gold)' : 'transparent',
                      }}
                    >
                      {isSelected && <GaaIcon name="check" size={11} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />}
                    </span>
                  </div>

                  <h2
                    className="font-serif"
                    style={{
                      fontSize: 24,
                      color: '#FFFFFF',
                      letterSpacing: '0.02em',
                      margin: '0 0 6px',
                      fontWeight: 700,
                    }}
                  >
                    {pkg.name}
                  </h2>
                  <p
                    style={{
                      fontFamily: 'Raleway, sans-serif',
                      fontWeight: 400,
                      fontSize: 13,
                      color: 'var(--gray)',
                      margin: '0 0 16px',
                      lineHeight: 1.5,
                      minHeight: 40,
                    }}
                  >
                    {pkg.description}
                  </p>

                  <div className="tabular-nums" style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: 'auto 0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span
                        className="font-telemetry font-mono"
                        style={{
                          fontFamily: 'var(--font-telemetry, monospace)',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: 42,
                          color: 'var(--gold)',
                          lineHeight: 1,
                          fontWeight: 700,
                        }}
                      >
                        ${(isPif ? (pkg.pifPriceCents ?? pkg.price * 3) : pkg.price) / 100}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Raleway, sans-serif',
                          fontWeight: 400,
                          fontSize: 13,
                          color: 'var(--gray)',
                        }}
                      >
                        {isPif ? 'for 12 weeks' : pkg.billingLabel}
                      </span>
                    </div>

                    {isPif && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span
                          style={{
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: 12,
                            color: 'var(--gold-lt)',
                            fontWeight: 700,
                          }}
                        >
                          ~${Math.round((pkg.pifPriceCents ?? pkg.price * 3) / 300)}/mo
                        </span>
                        {pkg.pifSavings && (
                          <span
                            style={{
                              background: 'rgba(212, 160, 23, 0.15)',
                              border: '1px solid rgba(212, 160, 23, 0.4)',
                              color: 'var(--gold-lt)',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 4,
                              letterSpacing: '0.04em',
                            }}
                          >
                            Save {pkg.pifSavings}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {pkg.id === 'transformation' && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(197, 160, 89, 0.1)',
                      border: '1px solid rgba(197, 160, 89, 0.35)',
                      borderRadius: 6,
                      fontSize: 11.5,
                      color: 'var(--gold-lt)',
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 700,
                      margin: '0 0 4px',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--gold)' }}>✦</span>
                    <span>Strictly Capped at 8 Principals · 2 Allocations Remaining</span>
                  </div>
                )}

                {isPif && pkg.pifBonusDescription && (
                  <div
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(212, 160, 23, 0.08)',
                      border: '1px solid rgba(212, 160, 23, 0.35)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--gold-lt)',
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--gold)' }}>✦</span>
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', fontWeight: 800, marginBottom: 2 }}>
                        Complimentary 12-Week Bonus
                      </div>
                      {pkg.pifBonusDescription}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'var(--gray)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--white)' }}>Best for:</strong> {pkg.bestFor}
                </div>

                <section style={{ display: 'grid', gap: 10 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'Raleway, sans-serif',
                      fontWeight: 800,
                      fontSize: 11,
                      color: 'var(--white)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Clinical Deliverables Included
                  </p>
                  {pkg.deliverables.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        fontSize: 12.5,
                        color: 'var(--gray)',
                        lineHeight: 1.45,
                      }}
                    >
                      <span style={{ color: 'var(--gold)', fontWeight: 800, marginTop: 1 }}>◆</span>
                      <span>{item}</span>
                    </div>
                  ))}
                  {((isPif ? (pkg.pifSessions ?? pkg.sessions * 3) : pkg.sessions) > 0) && (
                    <div
                      style={{
                        marginTop: 4,
                        padding: '8px 12px',
                        background: 'rgba(212,160,23,0.08)',
                        border: '1px solid rgba(212,160,23,0.3)',
                        borderRadius: 4,
                        fontSize: 12,
                        color: 'var(--gold-lt)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <GaaIcon name="video-studio" size={13} tone="gold" />
                      <span>
                        Includes {isPif ? (pkg.pifSessions ?? pkg.sessions * 3) : pkg.sessions} live 60-min master consult
                        {(isPif ? (pkg.pifSessions ?? pkg.sessions * 3) : pkg.sessions) > 1 ? 's' : ''} {isPif ? 'across 12-week block' : 'per billing cycle'}
                      </span>
                    </div>
                  )}
                </section>

                <div style={{ marginTop: 'auto' }}>
                  {pkg.id === 'transformation' ? (
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsAllocationModalOpen(true)
                        }}
                        className="tactile-btn"
                        style={{
                          width: '100%',
                          padding: '13px 18px',
                          background: 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 50%, #937332 100%)',
                          color: '#080E14',
                          border: 'none',
                          borderRadius: 6,
                          fontFamily: 'Raleway, sans-serif',
                          fontWeight: 800,
                          fontSize: 12.5,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 4px 20px rgba(197, 160, 89, 0.45)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <GaaIcon name="crown" size={14} tone="inherit" />
                        <span>Request Master Allocation</span>
                      </button>
                      <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontFamily: 'Raleway, sans-serif', fontWeight: 700, letterSpacing: '0.04em' }}>
                          ✦ Capped at 8 Principals · 2 Remaining
                        </span>
                      </div>
                    </div>
                  ) : (
                    <PurchaseButton
                      packageId={pkg.id}
                      cadence={cadence}
                      selectedAddonIds={selectedPackageId === pkg.id ? selectedAddonIds : []}
                      buttonLabel={
                        isSelected && selectedAddonIds.length > 0
                          ? `Join with ${selectedAddonIds.length} Add-on${selectedAddonIds.length > 1 ? 's' : ''}`
                          : isPif
                          ? `Commit to ${pkg.name} (12-Wk Block)`
                          : `Select ${pkg.name}`
                      }
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 2. BESPOKE ADD-ONS & PERFORMANCE ACCELERATORS ───────────────────── */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(16,22,38,0.95) 0%, rgba(9,13,24,0.95) 100%)',
          border: '1px solid rgba(212,160,23,0.3)',
          borderRadius: 12,
          padding: '40px 32px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p
            style={{
              margin: '0 0 6px',
              color: 'var(--gold-lt)',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Bespoke Sports Science Accelerators
          </p>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              color: '#FFFFFF',
              letterSpacing: '0.02em',
              margin: 0,
              fontWeight: 700,
            }}
          >
            Customize Your Advisory Suite
          </h2>
          <p
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 300,
              fontSize: 15,
              color: 'var(--gray)',
              maxWidth: 640,
              margin: '8px auto 0',
              lineHeight: 1.6,
            }}
          >
            Attach specialized clinical modules to your retainer. Unlock advanced biomechanical diagnostics, metabolic nutrition cycling, and priority form telemetry.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 16,
          }}
        >
          {addons.map(addon => {
            const isChecked = selectedAddonIds.includes(addon.id)
            return (
              <div
                key={addon.id}
                onClick={() => toggleAddon(addon.id)}
                style={{
                  background: isChecked ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.02)',
                  border: isChecked ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: isChecked ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.04)',
                        border: isChecked ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <GaaIcon
                        name={(addon.icon as any) || 'sparkles'}
                        size={20}
                        tone={isChecked ? 'gold' : 'amber'}
                      />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          fontWeight: 800,
                          color: 'var(--gold-lt)',
                        }}
                      >
                        {addon.badge} · {addon.billingType === 'recurring_monthly' ? 'Monthly' : 'One-Time'}
                      </span>
                      <h3
                        className="font-serif"
                        style={{
                          fontSize: 18,
                          color: '#FFFFFF',
                          margin: '2px 0 0',
                          letterSpacing: '0.02em',
                          fontWeight: 700,
                        }}
                      >
                        {addon.name}
                      </h3>
                    </div>
                  </div>

                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: isChecked ? '1.5px solid var(--gold)' : '1.5px solid rgba(255,255,255,0.25)',
                      background: isChecked ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {isChecked && (
                      <GaaIcon name="check" size={12} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
                    )}
                  </div>
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
                  {addon.description}
                </p>

                {Boolean(addon.sessions && addon.sessions > 0) && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gold-lt)', fontWeight: 600, background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.25)', padding: '3px 8px', borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 }}>
                    <GaaIcon name="video-studio" size={11} tone="gold" />
                    <span>Includes {addon.sessions} live 1:1 diagnostic consultation</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 22, color: 'var(--gold)', fontWeight: 700 }}>
                    +${addon.priceCents / 100}{' '}
                    <span style={{ fontSize: 12, fontFamily: 'Raleway, sans-serif', color: 'var(--gray)', fontWeight: 400 }}>
                      {addon.billingType === 'recurring_monthly' ? '/month' : 'one-time investment'}
                    </span>
                  </span>
                  <span style={{ fontSize: 11, color: isChecked ? 'var(--gold-lt)' : 'var(--gray)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {isChecked ? (
                      <>
                        <GaaIcon name="check" size={11} tone="gold" />
                        <span>Added to Plan</span>
                      </>
                    ) : (
                      <>
                        <GaaIcon name="plus" size={11} tone="slate" />
                        <span>Click to Add</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Live Investment Summary */}
        <div
          style={{
            marginTop: 32,
            padding: 'clamp(16px, 3vw, 24px) clamp(14px, 3vw, 28px)',
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(212,160,23,0.4)',
            borderRadius: 8,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 280px' }}>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
              {isPif ? '12-Week Macrocycle Investment' : 'Configured Package Investment'}
            </div>
            <div className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)', color: '#FFFFFF', margin: '4px 0 2px', lineHeight: 1.1, fontWeight: 700 }}>
              {currentPackage.name}{' '}
              {isPif ? '(12-Week Block)' : ''}{' '}
              {selectedAddons.length > 0 && (
                <span style={{ fontSize: 14, color: 'var(--gold-lt)', fontFamily: 'Raleway, sans-serif', fontWeight: 600 }}>
                  + {selectedAddons.length} Custom Accelerator{selectedAddons.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray)' }}>
              {isPif ? (
                <>
                  Total Upfront Investment: <strong className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', color: 'var(--gold)' }}>${totalInvestmentCents / 100}</strong>
                  <span style={{ color: 'var(--gold-lt)', marginLeft: 6 }}>
                    (~<span className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums' }}>${Math.round(totalInvestmentCents / 300)}</span>/mo · Zero monthly bills)
                  </span>
                  {currentPackage.pifSavings && (
                    <span style={{ color: 'var(--gold)', fontWeight: 700, marginLeft: 6 }}>
                      · Save {currentPackage.pifSavings}
                    </span>
                  )}
                </>
              ) : (
                <>
                  Monthly Subscription: <strong className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', color: 'var(--gold)' }}>${(basePriceCents + recurringAddonsCents) / 100}/mo</strong>
                  {oneTimeAddonsCents > 0 && (
                    <span>
                      {' '}· One-Time Setup/Screenings: <strong className="font-telemetry font-mono" style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', color: 'var(--white)' }}>+${oneTimeAddonsCents / 100}</strong>
                    </span>
                  )}
                </>
              )}
            </div>
            {(() => {
              const packageSessions = isPif ? (currentPackage?.pifSessions ?? (currentPackage?.sessions ?? 0) * 3) : (currentPackage?.sessions ?? 0)
              const addonSessions = selectedAddons.reduce((sum, a) => sum + (a.sessions ?? 0), 0)
              const totalConsults = packageSessions + addonSessions
              return (
                <div style={{ fontSize: 12, color: 'var(--gold-lt)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <GaaIcon name="video-studio" size={12} tone="gold" />
                  <span>
                    {totalConsults === 0
                      ? 'Autonomous protocol · 0 live consults included'
                      : `${totalConsults} live 1:1 consult${totalConsults > 1 ? 's' : ''} included`}
                  </span>
                </div>
              )
            })()}
          </div>

          <div style={{ width: '100%', maxWidth: 360, flex: '1 1 240px' }}>
            {currentPackage.id === 'transformation' ? (
              <div>
                <button
                  type="button"
                  onClick={() => setIsAllocationModalOpen(true)}
                  className="tactile-btn"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #E5D0A1 0%, #C5A059 50%, #937332 100%)',
                    color: '#080E14',
                    border: 'none',
                    borderRadius: 6,
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 800,
                    fontSize: 13.5,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 24px rgba(197, 160, 89, 0.45)',
                  }}
                >
                  <GaaIcon name="crown" size={16} tone="inherit" />
                  <span>Request Master Allocation</span>
                </button>
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontFamily: 'Raleway, sans-serif', fontWeight: 700, letterSpacing: '0.04em' }}>
                    ✦ Strictly Capped at 8 Principals (2 Remaining)
                  </span>
                </div>
              </div>
            ) : (
              <PurchaseButton
                packageId={currentPackage.id}
                cadence={cadence}
                selectedAddonIds={selectedAddonIds}
                buttonLabel={
                  isPif
                    ? `Commit to 12-Week Block ($${totalInvestmentCents / 100})`
                    : `Proceed with ${currentPackage.name} ($${(basePriceCents + recurringAddonsCents) / 100}/mo)`
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* ── 3. SPORTS SCIENCE COMPARISON TABLE ────────────────────────────────── */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p
            style={{
              margin: '0 0 6px',
              color: 'var(--gold-lt)',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Clinical Standards
          </p>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              color: '#FFFFFF',
              letterSpacing: '0.02em',
              margin: 0,
              fontWeight: 700,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            Sports Science vs Standard Training
          </h2>
        </div>

        <div
          style={{
            maxWidth: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: 'clamp(12px, 2vw, 24px)',
            boxSizing: 'border-box',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(212,160,23,0.3)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--gray)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Capability / Protocol
                </th>
                <th style={{ padding: '12px 16px', color: 'var(--gold)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                  Forge Athletic
                </th>
                <th style={{ padding: '12px 16px', color: 'var(--gray)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Standard Gym / Personal Trainer
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  Periodization Architecture
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gold-lt)', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>5-Phase NASM OPT™ Model with real-time equipment matching</span>
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: 13 }}>
                  Arbitrary workout splits without physiological phase progression
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  Cardiovascular Integration
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gold-lt)', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>Tanaka Heart Rate Stage Cardio (Stages 1–3) with EPOC conditioning</span>
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: 13 }}>
                  Generic steady-state cardio or unmeasured interval estimates
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  Recovery & CNS Telemetry
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gold-lt)', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>3D Muscle Soreness Heatmaps & Daily CNS Readiness Scoring</span>
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: 13 }}>
                  Subjective guesswork without neuromuscular load balancing
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  Biomechanical & Video Supervision
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gold-lt)', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>5 Kinetic Checkpoints + Frame-by-frame coach video critique</span>
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: 13 }}>
                  In-person rep counting with zero persistent telemetry
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  Metabolic Nutrition & Supplements
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gold-lt)', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>Phase-matched macro cycling & clinical pharmacology screening</span>
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: 13 }}>
                  Generic calorie calculators without nutrient timing
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  Live Diagnostic Studio Supervision
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gold-lt)', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>Weekly 60-min WebRTC Studios with real-time telestrator &amp; slow-mo replay (Tier 3)</span>
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: 13 }}>
                  Unrecorded sessions with zero optical biomechanical instrumentation
                </td>
              </tr>
              <tr>
                <td style={{ padding: '14px 16px', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
                  Executive SLA &amp; S.O.A.P. Archival
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gold-lt)', fontSize: 13 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>Contractual VIP 4-hour SLA queue, weekly Sunday Dossiers &amp; Voice S.O.A.P. records</span>
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: 13 }}>
                  Uncontracted response times and informal messaging without clinical archives
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sovereign Master Allocation Modal */}
      <MasterAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
      />
    </div>
  )
}
