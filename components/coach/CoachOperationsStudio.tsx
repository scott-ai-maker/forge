'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import GeneralSettingsForm from '@/components/settings/GeneralSettingsForm'
import CoachCustomPeriodizationStudio from '@/components/coach/studio/CoachCustomPeriodizationStudio'
import { GaaIcon, type GaaIconName } from '@/components/ui/GaaIcon'
import { selectOnFocus, sanitizeNumericInput } from '@/lib/form-input-helpers'

export type CoachSettingsTab = 'promotions' | 'templates' | 'profile' | 'security'

interface CoachProfile {
  email: string
  fullName: string
  phone: string
  role: 'client' | 'coach'
  avatarUrl: string | null
  pendingEmail: string | null
}

interface CoachOperationsStudioProps {
  initialProfile: CoachProfile
  initialTab?: CoachSettingsTab
}

export default function CoachOperationsStudio({
  initialProfile,
  initialTab = 'promotions',
}: CoachOperationsStudioProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTabQuery = (searchParams.get('tab') as CoachSettingsTab) || initialTab
  const [activeTab, setActiveTab] = useState<CoachSettingsTab>(currentTabQuery)

  const handleTabChange = (tab: CoachSettingsTab) => {
    setActiveTab(tab)
    router.replace(`/coach/settings?tab=${tab}`)
  }

  // Discount code state
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed_amount'>('percent')
  const [discountValue, setDiscountValue] = useState('15')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null)

  async function handleCreateDiscountCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setCodeLoading(true)
    setCodeError(null)
    setCodeSuccess(null)

    try {
      const res = await fetch('/api/coach/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          discountType,
          discountValue: Number(discountValue),
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCodeError(payload.error || 'Failed to create discount code.')
        return
      }

      setCodeSuccess(`Discount code "${code.trim().toUpperCase()}" created successfully!`)
      setCode('')
    } catch {
      setCodeError('An unexpected error occurred.')
    } finally {
      setCodeLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Coach Executive Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16,22,38,0.95) 0%, rgba(9,13,24,0.95) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 12,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image
            src="/images/coach-gordon-shield-logo.jpg"
            alt="Master Coach Gordon"
            width={58}
            height={58}
            style={{
              borderRadius: 10,
              objectFit: 'cover',
              border: '1px solid rgba(212,160,23,0.6)',
              boxShadow: '0 0 18px rgba(212,160,23,0.45)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 22, color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
                {initialProfile.fullName || 'Master Coach Gordon'}
              </h2>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 800,
                  background: 'rgba(212,160,23,0.15)',
                  color: 'var(--gold-lt)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(212,160,23,0.4)',
                }}
              >
                Lead Sports Scientist
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              Forge Athletic · Head Coach Operations
            </p>
          </div>
        </div>

        <div>
          <a
            href="/coach"
            className="sgf-button sgf-button-primary"
            style={{ padding: '8px 18px', fontSize: 12, textDecoration: 'none' }}
          >
            ← Coach Triage Cockpit
          </a>
        </div>
      </div>

      {/* ── Best-Practice Tabbed Workspace Navigation ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {[
          { key: 'promotions' as const, label: 'Promotions & Discounts', icon: 'credit-card' as GaaIconName, badge: 'Active' },
          { key: 'templates' as const, label: 'OPT Program Engine', icon: 'program' as GaaIconName, badge: 'OPT AI' },
          { key: 'profile' as const, label: 'Coach Profile', icon: 'user' as GaaIconName },
          { key: 'security' as const, label: 'Security & Access', icon: 'lock' as GaaIconName },
        ].map(tab => {
          const isSelected = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              style={{
                background: isSelected ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '12px 18px',
                color: isSelected ? 'var(--gold-lt)' : 'var(--white)',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: isSelected ? 800 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name={tab.icon} size={14} tone={isSelected ? 'gold' : 'slate'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                    color: isSelected ? '#0A0E18' : 'var(--gray)',
                    fontWeight: 800,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── 1. Tab: Promotions & Discount Codes ── */}
      {activeTab === 'promotions' && (
        <section
          style={{
            background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 12,
            padding: '28px 24px',
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Commerce Engine
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.03em' }}>
              CREATE PROMOTION / DISCOUNT CODE
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              Issue exclusive percentage or fixed dollar discounts for executive prospects and corporate retainers.
            </p>
          </div>

          <form onSubmit={handleCreateDiscountCode} style={{ display: 'grid', gap: 16, maxWidth: 540 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 6 }}>
                Promo Code (e.g. EXECUTIVE-20)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO-CODE"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: '0.08em',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 6 }}>
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed_amount')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--navy)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    color: '#FFFFFF',
                  }}
                >
                  <option value="percent">Percentage Off (%)</option>
                  <option value="fixed_amount">Fixed Amount Off ($)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 6 }}>
                  Discount Value ({discountType === 'percent' ? '%' : '$'})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={discountValue}
                  onChange={e => setDiscountValue(sanitizeNumericInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    color: '#FFFFFF',
                  }}
                />
              </div>
            </div>

            {codeError && <div style={{ color: '#F87171', fontSize: 12 }}>{codeError}</div>}
            {codeSuccess && <div style={{ color: '#34D399', fontSize: 12 }}>{codeSuccess}</div>}

            <button
              type="submit"
              disabled={codeLoading}
              className="sgf-button sgf-button-primary"
              style={{ marginTop: 8, padding: '12px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <GaaIcon name="lightning" size={14} tone="inherit" />
              <span>{codeLoading ? 'Creating Promo...' : 'Generate Promo Code'}</span>
            </button>
          </form>
        </section>
      )}

      {/* ── 2. Tab: OPT Program Templates ── */}
      {activeTab === 'templates' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <CoachCustomPeriodizationStudio
            clientId="template-library"
            clientName="Master Template Library"
            initialGoal="fat_loss"
            initialPhase={1}
            initialSessionsPerWeek={3}
          />
        </section>
      )}

      {/* ── 3. Tab: Coach Profile ── */}
      {activeTab === 'profile' && (
        <section
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            padding: '28px 24px',
            borderRadius: 12,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Coach Identity
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              MASTER COACH PROFILE & AVATAR
            </h3>
          </div>
          <GeneralSettingsForm initialProfile={initialProfile} settingsPath="/coach/settings" mode="profile" />
        </section>
      )}

      {/* ── 4. Tab: Security & Access ── */}
      {activeTab === 'security' && (
        <section
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            padding: '28px 24px',
            borderRadius: 12,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Session & Credentials
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 20, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              SECURITY, EMAIL & PASSWORD
            </h3>
          </div>
          <GeneralSettingsForm initialProfile={initialProfile} settingsPath="/coach/settings" mode="security" />
        </section>
      )}
    </div>
  )
}
