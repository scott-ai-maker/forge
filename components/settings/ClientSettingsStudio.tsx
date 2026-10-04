'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import GeneralSettingsForm from '@/components/settings/GeneralSettingsForm'
import WearablesDeviceStudio from '@/components/fitness/WearablesDeviceStudio'
import NotificationPreferencesStudio from '@/components/settings/NotificationPreferencesStudio'
import SpotifySettingsStudio from '@/components/settings/SpotifySettingsStudio'
import BillingPortalButton from '@/components/packages/BillingPortalButton'
import AddonSelectionStudio from '@/components/packages/AddonSelectionStudio'
import MedicalClearanceStudio from '@/components/settings/MedicalClearanceStudio'
import BaselineFitnessSettingsStudio, { BaselineFitnessProfileData } from '@/components/settings/BaselineFitnessSettingsStudio'
import { isNativeAndroid } from '@/lib/native-healthkit-bridge'
import { isCompanionApp } from '@/lib/native-companion'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'

export type SettingsTab = 'wearables' | 'spotify' | 'billing' | 'fitness' | 'medical' | 'profile' | 'security' | 'notifications'

interface GeneralSettingsProfile {
  email: string
  fullName: string
  phone: string
  role: 'client' | 'coach'
  avatarUrl: string | null
  pendingEmail: string | null
  preferredUnits?: 'imperial' | 'metric'
  sex?: 'male' | 'female'
}

interface ClientSettingsStudioProps {
  initialProfile: GeneralSettingsProfile
  initialFitnessProfile?: BaselineFitnessProfileData
  activePackageName?: string
  initialTab?: SettingsTab
}

export default function ClientSettingsStudio({
  initialProfile,
  initialFitnessProfile,
  activePackageName = 'Hybrid Concierge',
  initialTab = 'wearables',
}: ClientSettingsStudioProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCompanion = isCompanionApp()
  const currentTabQuery = (searchParams.get('tab') as SettingsTab) || initialTab
  const [activeTab, setActiveTab] = useState<SettingsTab>(currentTabQuery)

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    router.replace(`/dashboard/settings?tab=${tab}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Executive Header Banner ── */}
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
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              background: 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 20,
              color: '#0A0E18',
              fontWeight: 700,
              boxShadow: '0 0 15px rgba(212,160,23,0.4)',
            }}
          >
            {(initialProfile.fullName || initialProfile.email || 'SG')
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map(p => p[0]?.toUpperCase())
              .join('') || 'SG'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, color: '#FFFFFF', margin: 0, letterSpacing: '0.04em' }}>
                {initialProfile.fullName || initialProfile.email.split('@')[0]}
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
                VIP Athlete
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              {initialProfile.email} · {activePackageName}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BillingPortalButton />
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
          isNativeAndroid()
            ? {
                key: 'wearables' as const,
                label: 'Health Connect',
                icon: 'bot' as GaaIconName,
                badge: 'Android',
              }
            : {
                key: 'wearables' as const,
                label: 'Apple Health',
                icon: 'apple' as GaaIconName,
                badge: 'HealthKit',
              },
          { key: 'spotify' as const, label: 'Spotify & Music', icon: 'music' as GaaIconName, badge: 'Soundtracks' },
          { key: 'billing' as const, label: 'Retainer & Add-Ons', icon: 'credit-card' as GaaIconName, badge: 'Active' },
          {
            key: 'billing' as const,
            label: isCompanion ? 'Retainer & Membership' : 'Retainer & Add-Ons',
            icon: 'credit-card' as GaaIconName,
            badge: isCompanion ? 'Web Managed' : 'Active',
          },
          { key: 'fitness' as const, label: 'Baseline & Vitals', icon: 'dna' as GaaIconName, badge: 'OPT™ Profile' },
          { key: 'medical' as const, label: 'Medical Clearance & PAR-Q+', icon: 'shield-check' as GaaIconName, badge: 'Clinical' },
          { key: 'profile' as const, label: 'Personal Profile', icon: 'user' as GaaIconName },
          { key: 'security' as const, label: 'Security & Access', icon: 'lock' as GaaIconName },
          { key: 'notifications' as const, label: 'Alert Preferences', icon: 'bell' as GaaIconName },
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
              <GaaIcon name={tab.icon} size={15} tone={isSelected ? 'gold' : 'slate'} />
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

      {/* ── 1. Tab: Connected Wearables & Biometrics ── */}
      {activeTab === 'wearables' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <WearablesDeviceStudio />
        </section>
      )}

      {/* ── 2. Tab: Spotify Web Player & In-Gym Audio ── */}
      {activeTab === 'spotify' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SpotifySettingsStudio />
        </section>
      )}

      {/* ── 2. Tab: Membership Retainer & Clinical Add-Ons ── */}
      {activeTab === 'billing' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {isCompanion ? (
            <div
              style={{
                background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
                border: '1px solid rgba(212,160,23,0.35)',
                borderRadius: 12,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="status-dot-pulse" />
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                      GAA Mobile Gym Companion
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
                    MEMBERSHIP &amp; RETAINER STATUS
                  </h3>
                </div>
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#4ade80',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Active Client
                </div>
              </div>

              {/* Retainer Summary Box */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 700 }}>
                    Active Coaching Tier
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--white)', marginTop: 4 }}>
                    {activePackageName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 700 }}>
                    Companion Device Access
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-lt)', marginTop: 4 }}>
                    Unlimited Gym Execution &amp; Telemetry
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 700 }}>
                    Coach Gordon Direct Line
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginTop: 4 }}>
                    VIP Concierge Enabled
                  </div>
                </div>
              </div>

              {/* Web Management Compliance Disclosure Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(212,160,23,0.08) 0%, rgba(13,27,42,0.85) 100%)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  borderRadius: 10,
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GaaIcon name="shield-check" size={18} tone="gold" />
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)' }}>
                    Account &amp; Billing Managed Exclusively on Web
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)', lineHeight: 1.6 }}>
                  In compliance with mobile companion app guidelines, all membership retainers, add-on accelerators, invoice downloads, and credit card updates are securely managed on our website.
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--white)', lineHeight: 1.6 }}>
                  To make any changes to your subscription or billing methods, please sign in to <strong style={{ color: 'var(--gold)' }}>forge-athletic.app</strong> in your desktop or mobile web browser.
                </p>
              </div>

              {/* Message Coach Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
                <span style={{ fontSize: 12.5, color: 'var(--gray)' }}>
                  Need to pause your membership or have questions regarding your plan?
                </span>
                <a
                  href="/dashboard/messages"
                  className="tactile-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                    color: '#080E14',
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: 12.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(197, 160, 89, 0.3)',
                  }}
                >
                  <GaaIcon name="message" size={14} tone="dark" />
                  <span>Message Coach Gordon →</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  borderRadius: 12,
                  padding: '28px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                    Concierge Retainer &amp; Payment Methods
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
                    SELF-SERVICE BILLING PORTAL
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
                    Access the 256-bit encrypted Stripe portal to update credit cards, modify recurring add-ons, or download official receipts.
                  </p>
                </div>

                <BillingPortalButton />
              </div>

              {/* Alumni Continuity & Maintenance Transition Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(212,160,23,0.1) 0%, rgba(13,27,42,0.85) 100%)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 12,
                  padding: '24px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ maxWidth: 640 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      color: 'var(--gold-lt)',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>✦</span> Post-Transformation Continuity
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                      fontSize: 18,
                      margin: '4px 0 0',
                      color: '#FFFFFF',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ALUMNI CONTINUITY RETAINER ($149/MO)
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                    Graduating from live coaching? Preserve your progress, app history, monthly 3D AI scans, and receive 1 monthly Master Coach Sunday telemetry audit for $149/mo (or $1,295/yr upfront).
                  </p>
                </div>

                <a
                  href="/packages?tier=alumni"
                  className="tactile-btn"
                  style={{
                    background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                    color: '#080E14',
                    fontFamily: 'var(--font-sans, Raleway), sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '12px 22px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 15px rgba(197, 160, 89, 0.35)',
                  }}
                >
                  Switch to Alumni Retainer →
                </a>
              </div>

              {/* Add-On Accelerators Suite */}
              <AddonSelectionStudio currentPlanId="momentum" />
            </>
          )}
        </section>
      )}

      {/* ── 3. Tab: Baseline Fitness Setup & Vitals ── */}
      {activeTab === 'fitness' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <BaselineFitnessSettingsStudio
            initialData={initialFitnessProfile}
            onNavigateTab={handleTabChange}
          />
        </section>
      )}

      {/* ── 4. Tab: Medical Clearance & PAR-Q+ ── */}
      {activeTab === 'medical' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <MedicalClearanceStudio clientName={initialProfile.fullName} />
        </section>
      )}

      {/* ── 4. Tab: Personal Profile ── */}
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
              Client Identity
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              PERSONAL PROFILE & AVATAR
            </h3>
          </div>
          <GeneralSettingsForm initialProfile={initialProfile} settingsPath="/dashboard/settings" mode="profile" />
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
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              SECURITY, EMAIL & PASSWORD
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              Manage your verified login credentials, change your password, and verify authorization codes.
            </p>
          </div>
          <GeneralSettingsForm initialProfile={initialProfile} settingsPath="/dashboard/settings" mode="security" />
        </section>
      )}

      {/* ── 5. Tab: Notification Preferences ── */}
      {activeTab === 'notifications' && (
        <section
          style={{
            background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 12,
            padding: '28px 24px',
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Concierge Communications
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, margin: '2px 0 0', color: '#FFFFFF', letterSpacing: '0.04em' }}>
              NOTIFICATION & ALERT PREFERENCES
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray)' }}>
              Choose how we reach you by push, email, or text, and which updates you want.
            </p>
          </div>

          <NotificationPreferencesStudio defaultPhone={initialProfile.phone} />
        </section>
      )}
    </div>
  )
}
