'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
import WorkoutCalendarView, { WorkoutCalendarEntry } from '@/components/fitness/WorkoutCalendarView'
import AppStoreBadges from '@/components/marketing/AppStoreBadges'
import AppStorePlaceholderModal, { PlaceholderPlatform } from '@/components/marketing/AppStorePlaceholderModal'
import Link from 'next/link'

export type SettingsTab = 'schedule' | 'wearables' | 'apps' | 'spotify' | 'billing' | 'fitness' | 'medical' | 'profile' | 'security' | 'notifications'

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
  workoutSchedule?: WorkoutCalendarEntry[]
}

export default function ClientSettingsStudio({
  initialProfile,
  initialFitnessProfile,
  activePackageName = 'Hybrid Concierge',
  initialTab = 'wearables',
  workoutSchedule = [],
}: ClientSettingsStudioProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isCompanion = isCompanionApp()
  const currentTabQuery = (searchParams.get('tab') as SettingsTab) || initialTab
  const [activeTab, setActiveTab] = useState<SettingsTab>(currentTabQuery)
  const [appsModalOpen, setAppsModalOpen] = useState(false)
  const [appsModalPlatform, setAppsModalPlatform] = useState<PlaceholderPlatform>('ios')

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('tab', tab)
    router.replace(`${pathname || '/dashboard/settings'}?${nextParams.toString()}`, { scroll: false })
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
        className="settings-tab-strip"
        role="group"
        aria-label="Settings sections"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {[
          { key: 'schedule' as const, label: 'Workout Schedule', icon: 'calendar' as GaaIconName },
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
          { key: 'apps' as const, label: 'Mobile Apps & PWA', icon: 'laptop' as GaaIconName, badge: 'Companions' },
          { key: 'spotify' as const, label: 'Spotify & Music', icon: 'music' as GaaIconName, badge: 'Soundtracks' },
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
              aria-pressed={isSelected}
              style={{
                minHeight: 44,
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

      {activeTab === 'schedule' && (
        <WorkoutCalendarView
          entries={workoutSchedule}
          title="Workout Schedule"
          subtitle={workoutSchedule.length
            ? 'Your current program. Select a scheduled session to open it in Training.'
            : 'No scheduled workouts yet. Your schedule will appear here when your coach assigns a dated program.'}
          onSelectEntry={entry => {
            if (entry.workoutDay !== undefined) {
              router.push(`/dashboard/fitness?workspace=train&day=${entry.workoutDay}`)
            }
          }}
        />
      )}

      {/* ── 1. Tab: Connected Wearables & Biometrics ── */}
      {activeTab === 'wearables' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <WearablesDeviceStudio />
        </section>
      )}

      {/* ── 2. Tab: Mobile Apps & PWA Companions ── */}
      {activeTab === 'apps' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: 'linear-gradient(180deg, #101626 0%, #080C16 100%)',
              border: '1px solid rgba(212,160,23,0.35)',
              borderRadius: 12,
              padding: 'clamp(20px, 4vw, 30px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="status-dot-pulse" />
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                    In-Gym Tactical Companions
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 22, margin: 0, color: '#FFFFFF', letterSpacing: '0.03em' }}>
                  MOBILE APPS &amp; PWA GYM COMPANIONS
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#CBD5E1', maxWidth: 680, lineHeight: 1.5 }}>
                  Access your active workout sessions, tactile plate calculator, rest timers, and wearable biometric telemetry on your phone in the gym.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/apps"
                  className="tactile-btn"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    background: 'rgba(212,160,23,0.15)',
                    border: '1px solid var(--gold)',
                    color: 'var(--gold-lt)',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Full Apps Hub</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/dashboard/fitness?source=pwa"
                  className="tactile-btn"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                    color: '#080E14',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Launch Gym Hub (PWA) ⚡</span>
                </Link>
              </div>
            </div>

            {/* Quick App Badges Row */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', marginBottom: 12 }}>
                Available Platforms &amp; Installers:
              </div>
              <AppStoreBadges align="left" size="md" sourceEventPrefix="client_settings" showPwaBadge={true} />
            </div>

            {/* 3-Column Platforms Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                gap: 16,
              }}
            >
              {/* Apple iOS Card */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(197,160,89,0.3)',
                  borderRadius: 10,
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: '#FFFFFF', fontSize: 15 }}>Apple iOS (HealthKit)</strong>
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.35)', fontWeight: 800, textTransform: 'uppercase' }}>
                      TestFlight Beta
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
                    Native iOS companion with 24/7 background HealthKit delivery, Apple Watch heart rate sync, and Taptic cadences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppsModalPlatform('ios')
                    setAppsModalOpen(true)
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(212,160,23,0.12)',
                    border: '1px solid var(--gold)',
                    color: 'var(--gold-lt)',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Request TestFlight Beta →
                </button>
              </div>

              {/* PWA Card */}
              <div
                style={{
                  background: 'rgba(34,197,94,0.04)',
                  border: '1px solid rgba(34,197,94,0.35)',
                  borderRadius: 10,
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: '#FFFFFF', fontSize: 15 }}>Progressive Web App</strong>
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.35)', fontWeight: 800, textTransform: 'uppercase' }}>
                      100% Live
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
                    Install directly to your iPhone or Android home screen with zero app store waiting. Full offline set logging and plate calculator.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppsModalPlatform('pwa')
                    setAppsModalOpen(true)
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                    color: '#080E14',
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Install Guide &amp; Launch ⚡
                </button>
              </div>

              {/* Android Card */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  borderRadius: 10,
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: '#FFFFFF', fontSize: 15 }}>Android (Health Connect)</strong>
                    <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: 'rgba(56,189,248,0.15)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.35)', fontWeight: 800, textTransform: 'uppercase' }}>
                      Google Play Review
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
                    Android Health Connect and Wear OS integration. Early access available via internal testing APK and Chrome PWA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppsModalPlatform('android')
                    setAppsModalOpen(true)
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(56,189,248,0.12)',
                    border: '1px solid rgba(56,189,248,0.4)',
                    color: '#38BDF8',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Request Android APK →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Tab: Spotify Web Player & In-Gym Audio ── */}
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
                      Forge Athletic Mobile Companion
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

              {/* Membership Plans Transition Card */}
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
                    <span>✦</span> Forge Athletic Memberships
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
                    UPGRADE OR MODIFY YOUR MEMBERSHIP
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                    Looking to upgrade to Coach Support for live video sessions and direct messaging, or explore other tiers? Review all available Forge Athletic memberships.
                  </p>
                </div>

                <a
                  href="/packages"
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
                    minHeight: 44,
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 15px rgba(197, 160, 89, 0.35)',
                  }}
                >
                  Explore Memberships →
                </a>
              </div>

              {/* Add-On Accelerators Suite */}
              <AddonSelectionStudio />
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

      {/* Interactive App Store / PWA / TestFlight Modal */}
      <AppStorePlaceholderModal
        isOpen={appsModalOpen}
        onClose={() => setAppsModalOpen(false)}
        initialPlatform={appsModalPlatform}
        sourceContext="client_settings_studio"
      />
    </div>
  )
}

