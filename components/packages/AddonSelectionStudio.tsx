'use client'

import { useState } from 'react'
import { COACHING_ADDONS, CoachingAddon } from '@/lib/stripe'
import PurchaseButton from '@/components/packages/PurchaseButton'
import GaaIcon from '@/components/ui/GaaIcon'

interface AddonSelectionStudioProps {
  currentPlanId?: string
}

export default function AddonSelectionStudio({ currentPlanId = 'starter' }: AddonSelectionStudioProps) {
  const [activeAddon, setActiveAddon] = useState<CoachingAddon | null>(null)

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #101626 0%, #090D18 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 12,
        padding: '28px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
            Sports Science Accelerator Suites
          </span>
          <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
            CLINICAL PERFORMANCE ADD-ONS
          </h3>
        </div>
        <GaaIcon name="lightning" size={24} tone="gold" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {COACHING_ADDONS.map(addon => (
          <div
            key={addon.id}
            onClick={() => setActiveAddon(addon)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: activeAddon?.id === addon.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '16px 18px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: activeAddon?.id === addon.id ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.04)',
                  border: activeAddon?.id === addon.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GaaIcon
                  name={(addon.icon as any) || 'sparkles'}
                  size={20}
                  tone={activeAddon?.id === addon.id ? 'gold' : 'amber'}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                  {addon.badge}
                </div>
                <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
                  {addon.name}
                </h4>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--gray)', margin: '4px 0 0', lineHeight: 1.45 }}>
              {addon.description}
            </p>

            <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                ${addon.priceCents / 100}{' '}
                <span style={{ fontSize: 11, fontFamily: 'Raleway, sans-serif', color: 'var(--gray)' }}>
                  {addon.billingType === 'recurring_monthly' ? '/mo' : 'one-time'}
                </span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700 }}>
                Explore Suite →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Detail Drawer for selected add-on */}
      {activeAddon && (
        <div
          onClick={() => setActiveAddon(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #131B2E 0%, #080C16 100%)',
              border: '1px solid var(--gold)',
              borderRadius: 12,
              padding: '32px 28px',
              maxWidth: 540,
              width: '100%',
              boxShadow: '0 0 50px rgba(212,160,23,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: 'rgba(212,160,23,0.12)',
                    border: '1px solid rgba(212,160,23,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <GaaIcon name={(activeAddon.icon as any) || 'sparkles'} size={24} tone="gold" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                    {activeAddon.subtitle} · {activeAddon.billingType === 'recurring_monthly' ? 'Monthly' : 'One-Time'}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, color: '#FFFFFF', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                    {activeAddon.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveAddon(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GaaIcon name="close" size={14} tone="white" />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--gray)', margin: '16px 0', lineHeight: 1.55 }}>
              {activeAddon.description}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '16px', margin: '16px 0' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--white)', fontWeight: 800, marginBottom: 8 }}>
                Clinical Deliverables
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {activeAddon.deliverables.map((deliv, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--gray)', lineHeight: 1.4 }}>
                    <span style={{ marginTop: 2 }}><GaaIcon name="check" size={12} tone="gold" /></span>
                    <span>{deliv}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase' }}>Investment</div>
                <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 26, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
                  ${activeAddon.priceCents / 100}{' '}
                  <span style={{ fontSize: 12, fontFamily: 'Raleway, sans-serif', color: 'var(--gray)' }}>
                    {activeAddon.billingType === 'recurring_monthly' ? '/month' : 'one-time'}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1, maxWidth: 260 }}>
                <PurchaseButton
                  packageId={currentPlanId}
                  selectedAddonIds={[activeAddon.id]}
                  buttonLabel={`Unlock ${activeAddon.badge} (+$${activeAddon.priceCents / 100})`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
