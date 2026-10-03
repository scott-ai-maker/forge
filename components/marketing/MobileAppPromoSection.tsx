import React from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import AppStoreBadges, { AppleLogoIcon, AndroidLogoIcon, AppleAppStoreBadgeSvg, GooglePlayBadgeSvg } from './AppStoreBadges'
import TrackedCtaLink from './TrackedCtaLink'
import { MOBILE_APPS_CONFIG } from '@/lib/mobile-apps-config'

interface MobileAppPromoSectionProps {
  className?: string
  style?: React.CSSProperties
}

export default function MobileAppPromoSection({
  className = '',
  style = {},
}: MobileAppPromoSectionProps) {
  return (
    <section
      id="mobile-apps"
      className={`home-mobile-apps-section ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(4.5rem, 7vw, 6rem) 1.5rem',
        borderTop: '1px solid rgba(197, 160, 89, 0.22)',
        borderBottom: '1px solid rgba(197, 160, 89, 0.22)',
        background: 'linear-gradient(180deg, #090E18 0%, #05080E 100%)',
        ...style,
      }}
    >
      {/* Background Spotlight Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '75vw',
          maxWidth: 900,
          height: 400,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(197, 160, 89, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        className="home-shell"
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          boxSizing: 'border-box',
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto clamp(2.5rem, 4vw, 3.5rem)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 14px',
              borderRadius: 20,
              background: 'rgba(197, 160, 89, 0.12)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'var(--gold-lt)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="crown" size={12} tone="gold" />
              <span>{MOBILE_APPS_CONFIG.subheadline}</span>
            </span>
          </div>

          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(1.8rem, 4.2vw, 3rem)',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              margin: '0 0 14px',
              lineHeight: 1.15,
            }}
          >
            NATIVE MOBILE EXECUTION &amp; <span style={{ color: 'var(--gold-lt)' }}>BIOMETRIC TELEMETRY</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)',
              color: '#CBD5E1',
              lineHeight: 1.65,
              margin: '0 auto 1.75rem',
              maxWidth: 680,
            }}
          >
            {MOBILE_APPS_CONFIG.description}
          </p>

          {/* Top Badges Row */}
          <AppStoreBadges align="center" size="lg" sourceEventPrefix="promo_section" />
        </div>

        {/* Device Telemetry Showcase Visual */}
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto clamp(2rem, 3.5vw, 3rem)',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 25px rgba(197, 160, 89, 0.15)',
            position: 'relative',
          }}
        >
          <img
            src="/images/mobile-apps-telemetry.jpg"
            alt="Gordon Athletic Advisory Mobile Telemetry HUD and Smartwatch Integration"
            style={{ width: '100%', height: 'auto', maxHeight: 440, objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 24px',
              background: 'linear-gradient(180deg, transparent 0%, rgba(8,14,20,0.92) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600, letterSpacing: '0.04em' }}>
                Native Biometric Velocity &amp; Cadence Engine
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--gold-lt)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
              Apple HealthKit · WatchOS · Android Biometrics
            </span>
          </div>
        </div>

        {/* 2-Column Mobile App Showcase Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {/* iOS Card */}
          <div
            className="glass-card-gold"
            style={{
              padding: 'clamp(24px, 4vw, 32px)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: -15, right: -15, zIndex: 0 }}>
              <GaaMasterWatermarkSeal size={140} opacity={0.06} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(197, 160, 89, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppleLogoIcon size={26} color="#FFFFFF" />
                  </div>
                  <div>
                    <h3 className="font-serif" style={{ fontSize: 22, margin: 0, color: '#FFFFFF', letterSpacing: '0.03em', fontWeight: 600 }}>
                      iOS Edition
                    </h3>
                    <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700 }}>
                      {MOBILE_APPS_CONFIG.ios.minVersion} · {MOBILE_APPS_CONFIG.ios.tagline}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: 'rgba(56,189,248,0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56,189,248,0.3)',
                  }}
                >
                  HealthKit Background Delivery
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.55 }}>
                Directly connects to Apple Health and Apple Watch. Wakes in the background to deliver resting heart rate, morning HRV rMSSD, deep/REM sleep architecture, active calories, and completed workout sessions without manual effort.
              </p>

              <div style={{ display: 'grid', gap: 8, borderTop: '1px solid rgba(197, 160, 89, 0.2)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)' }}>
                  iOS Native Capabilities:
                </div>
                {MOBILE_APPS_CONFIG.ios.keyFeatures.map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#E2E8F0' }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, paddingTop: 10 }}>
              <TrackedCtaLink
                href={MOBILE_APPS_CONFIG.ios.url}
                target="_blank"
                rel="noopener noreferrer"
                eventName="ios_card_app_store_click"
                eventPayload={{ platform: 'ios', bundleId: MOBILE_APPS_CONFIG.ios.bundleId }}
                className="tactile-btn"
                aria-label="Download on the App Store"
                style={{ display: 'inline-block', lineHeight: 0, borderRadius: 7, overflow: 'hidden' }}
              >
                <AppleAppStoreBadgeSvg width={150} height={46} />
              </TrackedCtaLink>
            </div>
          </div>

          {/* Android Card */}
          <div
            className="glass-card"
            style={{
              padding: 'clamp(24px, 4vw, 32px)',
              borderRadius: 12,
              border: '1.5px solid rgba(56,189,248,0.35)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: -15, right: -15, zIndex: 0 }}>
              <GaaMasterWatermarkSeal size={140} opacity={0.06} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: 'rgba(61, 220, 132, 0.1)',
                      border: '1px solid rgba(61, 220, 132, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AndroidLogoIcon size={26} color="#3DDC84" />
                  </div>
                  <div>
                    <h3 className="font-serif" style={{ fontSize: 22, margin: 0, color: '#FFFFFF', letterSpacing: '0.03em', fontWeight: 600 }}>
                      Android Edition
                    </h3>
                    <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700 }}>
                      {MOBILE_APPS_CONFIG.android.minVersion} · {MOBILE_APPS_CONFIG.android.tagline}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: 'rgba(52,211,153,0.15)',
                    color: '#34D399',
                    border: '1px solid rgba(52,211,153,0.3)',
                  }}
                >
                  Health Connect Engine
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.55 }}>
                Integrates with Android Health Connect to ingest Samsung Health, Google Fit, Oura, Garmin, and Wear OS biometrics. Background WorkManager coordinates periodic telemetry pushes with battery-optimized scheduling.
              </p>

              <div style={{ display: 'grid', gap: 8, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#38BDF8' }}>
                  Android Native Capabilities:
                </div>
                {MOBILE_APPS_CONFIG.android.keyFeatures.map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#E2E8F0' }}>
                    <GaaIcon name="check" size={13} tone="gold" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, paddingTop: 10 }}>
              <TrackedCtaLink
                href={MOBILE_APPS_CONFIG.android.url}
                target="_blank"
                rel="noopener noreferrer"
                eventName="android_card_play_store_click"
                eventPayload={{ platform: 'android', bundleId: MOBILE_APPS_CONFIG.android.bundleId }}
                className="tactile-btn"
                aria-label="Get it on Google Play"
                style={{ display: 'inline-block', lineHeight: 0, borderRadius: 7, overflow: 'hidden' }}
              >
                <GooglePlayBadgeSvg width={150} height={46} />
              </TrackedCtaLink>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginTop: 28,
          }}
        >
          {MOBILE_APPS_CONFIG.highlights.map(item => (
            <div
              key={item.title}
              style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GaaIcon name={(item.icon as any) || 'sparkles'} size={18} tone="gold" />
                <strong style={{ color: '#FFFFFF', fontSize: 13.5, fontFamily: 'Raleway, sans-serif' }}>
                  {item.title}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* PWA Cross-Platform Compatibility Footnote */}
        <div
          style={{
            marginTop: 28,
            padding: '14px 20px',
            background: 'rgba(197, 160, 89, 0.06)',
            border: '1px solid rgba(197, 160, 89, 0.25)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GaaIcon name="laptop" size={18} tone="gold" />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>
                Universal Web &amp; Progressive Web App (PWA) Access
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                All workout plans, video consults, nutrition logs, and synchronized telemetry stats are readable and interactive in any web browser or installed PWA. Real-time background telemetry sync is powered via our native iOS and Android apps.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 700, letterSpacing: '0.04em' }}>
              Web Readable · Native Sync
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

