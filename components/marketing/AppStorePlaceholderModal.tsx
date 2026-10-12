'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import GaaIcon from '@/components/ui/GaaIcon'
import { AppleLogoIcon, AndroidLogoIcon } from './AppStoreBadges'
import { MOBILE_APPS_CONFIG } from '@/lib/mobile-apps-config'

export type PlaceholderPlatform = 'ios' | 'android' | 'pwa'

interface AppStorePlaceholderModalProps {
  isOpen: boolean
  onClose: () => void
  initialPlatform?: PlaceholderPlatform
  sourceContext?: string
}

export default function AppStorePlaceholderModal({
  isOpen,
  onClose,
  initialPlatform = 'ios',
  sourceContext = 'app_store_placeholder',
}: AppStorePlaceholderModalProps) {
  const [activePlatform, setActivePlatform] = useState<PlaceholderPlatform>(initialPlatform)
  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deviceGuideTab, setDeviceGuideTab] = useState<'ios' | 'android' | 'desktop'>('ios')
  const dialogRef = useRef<HTMLDivElement>(null)

  // Sync initialPlatform when modal opens
  useEffect(() => {
    if (isOpen) {
      setActivePlatform(initialPlatform)
      setDeviceGuideTab(initialPlatform === 'android' ? 'android' : 'ios')
      setSubmittedEmail(false)
    }
  }, [isOpen, initialPlatform])

  // ESC key and backdrop lock
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleTestFlightSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setIsSubmitting(true)

    try {
      // Record interest in waitlist / analytics
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: `testflight_${activePlatform}`,
          sourceContext,
        }),
      }).catch(() => {})
      setSubmittedEmail(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-placeholder-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        background: 'rgba(4, 7, 13, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'appModalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="glass-card-gold"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 16,
          background: 'linear-gradient(180deg, #0D1424 0%, #080D18 100%)',
          border: '1.5px solid rgba(197, 160, 89, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(197, 160, 89, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(13,20,36,0.9) 100%)',
                border: '1px solid rgba(212,160,23,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/images/brand/logo-concept-1-kinetic-f.jpg"
                alt="Forge Athletic"
                style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3
                  id="app-placeholder-title"
                  className="font-serif"
                  style={{ fontSize: 18, color: '#FFFFFF', margin: 0, letterSpacing: '0.03em', fontWeight: 700 }}
                >
                  FORGE ATHLETIC APPS
                </h3>
                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: activePlatform === 'pwa' ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                    color: activePlatform === 'pwa' ? '#34D399' : '#FBBF24',
                    border: `1px solid ${activePlatform === 'pwa' ? 'rgba(52,211,153,0.4)' : 'rgba(245,158,11,0.4)'}`,
                  }}
                >
                  {activePlatform === 'pwa' ? '● PWA Live' : '○ Review / TestFlight'}
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                Tactile Gym Telemetry &amp; Workout Companions
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="tactile-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <GaaIcon name="close" size={16} tone="slate" />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div
          role="tablist"
          aria-label="App platform tabs"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'rgba(197, 160, 89, 0.2)',
            borderBottom: '1px solid rgba(197, 160, 89, 0.2)',
          }}
        >
          {[
            { id: 'ios' as const, label: 'Apple iOS', icon: <AppleLogoIcon size={14} color={activePlatform === 'ios' ? '#FFFFFF' : '#94A3B8'} /> },
            { id: 'pwa' as const, label: 'Web App (PWA)', icon: <GaaIcon name="laptop" size={14} tone={activePlatform === 'pwa' ? 'gold' : 'slate'} /> },
            { id: 'android' as const, label: 'Android', icon: <AndroidLogoIcon size={14} color={activePlatform === 'android' ? '#3DDC84' : '#94A3B8'} /> },
          ].map(tab => {
            const isSelected = activePlatform === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActivePlatform(tab.id)}
                style={{
                  padding: '12px 10px',
                  background: isSelected ? 'rgba(212,160,23,0.14)' : 'rgba(10, 16, 26, 0.95)',
                  border: 'none',
                  borderBottom: isSelected ? '2px solid var(--gold)' : '2px solid transparent',
                  color: isSelected ? '#FFFFFF' : '#94A3B8',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── 1. Apple iOS Edition ── */}
          {activePlatform === 'ios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ color: 'var(--gold-lt)', marginTop: 2 }}>
                  <GaaIcon name="clock" size={20} tone="gold" />
                </div>
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: 13.5, display: 'block', marginBottom: 2 }}>
                    Apple App Store Review &amp; TestFlight Beta
                  </strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.5 }}>
                    The native Forge Athletic iOS shell is currently undergoing Apple App Store review and private TestFlight verification. Native HealthKit background delivery and Apple Watch synchronization are being tested with early access athletes.
                  </p>
                </div>
              </div>

              {/* Fast Instant Option: PWA */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(13, 20, 36, 0.95) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: 12,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>⚡</span>
                    <strong style={{ color: '#4ADE80', fontSize: 14 }}>
                      Zero Waiting: Install on iPhone Today via PWA
                    </strong>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#4ADE80', letterSpacing: '0.06em' }}>
                    Available Now
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
                  You don&apos;t have to wait for Apple review. You can install Forge Athletic directly to your iPhone Home Screen right now with full offline set tracking, plate calculator, and audio cadences:
                </p>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'grid',
                    gap: 8,
                    fontSize: 12,
                    color: '#F1F5F9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--gold)', color: '#0A0E18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10 }}>1</span>
                    <span>Open <strong>forge-athletic.app</strong> in Safari on your iPhone</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--gold)', color: '#0A0E18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10 }}>2</span>
                    <span>Tap the Safari <strong>Share button (⎋)</strong> at the bottom</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--gold)', color: '#0A0E18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10 }}>3</span>
                    <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot; (⊞)</strong></span>
                  </div>
                </div>

                <Link
                  href="/dashboard/fitness?source=pwa"
                  onClick={onClose}
                  className="tactile-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                    color: '#080E14',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 12.5,
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <span>Launch In-Gym Companion (PWA)</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* VIP TestFlight Beta Invite Form */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-lt)', marginBottom: 6 }}>
                  REQUEST VIP TESTFLIGHT BETA INVITATION
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--gray)' }}>
                  Enter your email to receive an early Apple TestFlight invite and notification when the official App Store binary launches.
                </p>

                {submittedEmail ? (
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: 6,
                      padding: '10px 14px',
                      color: '#4ADE80',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <GaaIcon name="check" size={16} tone="emerald" />
                    <span>You&apos;re on the priority TestFlight dispatch list! Check your inbox soon.</span>
                  </div>
                ) : (
                  <form onSubmit={handleTestFlightSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="athlete@example.com"
                      required
                      style={{
                        flex: '1 1 200px',
                        minHeight: 40,
                        background: 'rgba(10, 16, 26, 0.85)',
                        border: '1px solid rgba(197, 160, 89, 0.35)',
                        borderRadius: 6,
                        padding: '8px 12px',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="tactile-btn"
                      style={{
                        minHeight: 40,
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                        color: '#0A0E18',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        cursor: isSubmitting ? 'wait' : 'pointer',
                      }}
                    >
                      {isSubmitting ? 'Joining...' : 'Get TestFlight Invite'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ── 2. Progressive Web App (PWA) ── */}
          {activePlatform === 'pwa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
                  <strong style={{ color: '#FFFFFF', fontSize: 13.5 }}>
                    Progressive Web App: Live &amp; Full In-Gym Capability
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.5 }}>
                  The Progressive Web App provides full in-gym execution parity with zero app store downloads. It runs offline in basement gym facilities, handles plate calculations, rest timers, and synchronizes telemetry upon reconnection.
                </p>
              </div>

              {/* Device-Specific Install Guides */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)' }}>
                  How to Install on Your Device:
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'ios' as const, label: 'iPhone / iPad (Safari)' },
                    { id: 'android' as const, label: 'Android (Chrome)' },
                    { id: 'desktop' as const, label: 'Mac / PC (Chrome/Edge)' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDeviceGuideTab(tab.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: deviceGuideTab === tab.id ? 'rgba(197, 160, 89, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: deviceGuideTab === tab.id ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: deviceGuideTab === tab.id ? 'var(--gold-lt)' : '#94A3B8',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '14px 16px',
                    display: 'grid',
                    gap: 10,
                    fontSize: 12.5,
                    color: '#E2E8F0',
                  }}
                >
                  {deviceGuideTab === 'ios' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 1:</span>
                        <span>Open <strong>Safari</strong> on iOS and go to <strong>forge-athletic.app</strong>.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 2:</span>
                        <span>Tap the <strong>Share</strong> button (box with upward arrow ⎋).</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 3:</span>
                        <span>Tap <strong>&quot;Add to Home Screen&quot;</strong> and tap <strong>Add</strong> in the top right.</span>
                      </div>
                    </>
                  )}

                  {deviceGuideTab === 'android' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 1:</span>
                        <span>Open <strong>Chrome</strong> on Android and navigate to <strong>forge-athletic.app</strong>.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 2:</span>
                        <span>Tap the three dots menu (⋮) in the top right.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 3:</span>
                        <span>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</span>
                      </div>
                    </>
                  )}

                  {deviceGuideTab === 'desktop' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 1:</span>
                        <span>Open Chrome, Edge, or Brave on Mac, Windows, or Linux.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 2:</span>
                        <span>Click the <strong>Install</strong> icon (computer with down arrow) in the address bar.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold)' }}>Step 3:</span>
                        <span>Click <strong>Install</strong> to launch Forge Athletic in its own focused window.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Direct Launch CTA */}
              <Link
                href="/dashboard/fitness?source=pwa"
                onClick={onClose}
                className="tactile-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  color: '#0A0E18',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 16px rgba(212, 160, 23, 0.35)',
                }}
              >
                <span>Launch PWA Gym Companion Now</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}

          {/* ── 3. Android Edition ── */}
          {activePlatform === 'android' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'rgba(61, 220, 132, 0.08)',
                  border: '1px solid rgba(61, 220, 132, 0.3)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ color: '#3DDC84', marginTop: 2 }}>
                  <AndroidLogoIcon size={20} color="#3DDC84" />
                </div>
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: 13.5, display: 'block', marginBottom: 2 }}>
                    Google Play Store Listing in Verification
                  </strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.5 }}>
                    The native Android APK with Google Health Connect background sync and Wear OS telemetry is currently in staged roll-out verification on Google Play.
                  </p>
                </div>
              </div>

              {/* Instant Alternative: Android PWA */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(13, 20, 36, 0.95) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: 12,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <strong style={{ color: '#38BDF8', fontSize: 14 }}>
                  Install Instantly on Android via Chrome PWA
                </strong>
                <p style={{ margin: 0, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.5 }}>
                  Forge Athletic runs as a native standalone app on Android devices without waiting for Play Store verification. Tap Chrome menu ⋮ and select &quot;Install app&quot;.
                </p>

                <Link
                  href="/dashboard/fitness?source=pwa"
                  onClick={onClose}
                  className="tactile-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                    color: '#080E14',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 12.5,
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>Launch PWA on Android</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Android Beta Request */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', marginBottom: 6 }}>
                  REQUEST INTERNAL APP SHARING APK
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--gray)' }}>
                  Enter your Google Play account email to receive direct early-access APK access and play store release alerts.
                </p>

                {submittedEmail ? (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: 6,
                      padding: '10px 14px',
                      color: '#38BDF8',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <GaaIcon name="check" size={16} tone="cyan" />
                    <span>You&apos;re registered for Android early access! We will email you with the build.</span>
                  </div>
                ) : (
                  <form onSubmit={handleTestFlightSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="google.account@gmail.com"
                      required
                      style={{
                        flex: '1 1 200px',
                        minHeight: 40,
                        background: 'rgba(10, 16, 26, 0.85)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: 6,
                        padding: '8px 12px',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="tactile-btn"
                      style={{
                        minHeight: 40,
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                        color: '#080E14',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        cursor: isSubmitting ? 'wait' : 'pointer',
                      }}
                    >
                      {isSubmitting ? 'Registering...' : 'Request APK Access'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>
            Apple App Store Guideline 3.1.3 &amp; Google Play Multiplatform compliant · Zero in-app purchases
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--gold-lt)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes appModalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
