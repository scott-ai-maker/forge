'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import GaaIcon from '@/components/ui/GaaIcon'
import { generateQrCodeSvg } from '@/lib/qr-code'

interface ReferralLandingClientProps {
  code: string
  referrerName: string
  refereeDiscountCents: number
  refereeTrialDays: number
}

export default function ReferralLandingClient({
  code,
  referrerName,
  refereeDiscountCents: _discountCents,
  refereeTrialDays,
}: ReferralLandingClientProps) {
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)

  useEffect(() => {
    // Record click telemetry
    fetch('/api/referrals/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => {})

    // Generate local QR code for on-screen sharing
    generateQrCodeSvg(window.location.href, { width: 220 })
      .then(setQrSvg)
      .catch(() => {})
  }, [code])

  return (
    <main
      className="sgf-auth-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(197, 160, 89, 0.12) 0%, #04070E 75%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 540 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Image
            src="/images/brand/logo-concept-1-kinetic-f.jpg"
            alt="Forge Athletic"
            width={88}
            height={88}
            priority
            style={{
              margin: '0 auto 12px',
              borderRadius: 14,
              border: '1px solid rgba(197, 160, 89, 0.4)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            }}
          />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(197, 160, 89, 0.15)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#F3E5AB',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            <GaaIcon name="crown" size={13} />
            VIP Athlete Invitation · Extended Pass
          </div>
          <h1
            className="font-serif gold-gradient-text"
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '0.04em',
              lineHeight: 1.25,
              margin: '0 0 10px',
            }}
          >
            {referrerName.toUpperCase()} INVITED YOU TO TRAIN
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: '#94A3B8',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            You have been granted an exclusive <strong style={{ color: '#F8FAFC' }}>{refereeTrialDays}-Day Extended VIP Pass</strong> (normally 7 days) and a <strong style={{ color: '#10B981' }}>$20 Welcome Credit</strong> to Forge Athletic.
          </p>
        </div>

        {/* Feature Cards Glass Container */}
        <div
          style={{
            background: 'rgba(11, 19, 30, 0.88)',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            borderRadius: 12,
            padding: '24px 22px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                gap: 14,
                padding: '12px 14px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(197, 160, 89, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C5A059',
                  flexShrink: 0,
                }}
              >
                <GaaIcon name="trophy" size={18} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                  {refereeTrialDays}-Day Unrestricted VIP Pass
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.45 }}>
                  Full access to NASM OPT™ periodized strength tracks, real-time audio coaching, and personalized 1RM overload telemetry.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 14,
                padding: '12px 14px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  flexShrink: 0,
                }}
              >
                <GaaIcon name="sparkles" size={18} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                  $20 Welcome Credit
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.45 }}>
                  Applied automatically at membership checkout. Gifted by {referrerName}.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 14,
                padding: '12px 14px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38BDF8',
                  flexShrink: 0,
                }}
              >
                <GaaIcon name="shield" size={18} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                  Biomechanical Form Lab
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.45 }}>
                  3D AI postural mesh analysis and movement screens to bulletproof your joints and prevent kinetic power leaks.
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <Link
            href={`/auth/signup?ref=${encodeURIComponent(code)}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #C5A059 0%, #DFBA73 100%)',
              color: '#080E14',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(197, 160, 89, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxSizing: 'border-box',
            }}
          >
            Claim 30-Day VIP Pass &amp; Create Account →
          </Link>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 12,
              color: '#64748B',
            }}
          >
            <span>Code: <strong style={{ color: '#C5A059' }}>{code}</strong></span>
            {qrSvg && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  padding: 0,
                }}
              >
                <GaaIcon name="ticket" size={13} />
                Show Gym QR
              </button>
            )}
          </div>
        </div>

        {/* Existing Member Footer */}
        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748B' }}>
          Already have a Forge Athletic account?{' '}
          <Link
            href="/auth/login"
            style={{ color: '#C5A059', textDecoration: 'none', fontWeight: 600 }}
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* QR Code Modal for In-Gym Buddy Scan */}
      {showQrModal && qrSvg && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            overscrollBehavior: 'contain',
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              background: '#0B131E',
              border: '1px solid rgba(197, 160, 89, 0.4)',
              borderRadius: 14,
              padding: 28,
              textAlign: 'center',
              maxWidth: 320,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 6px', color: '#F8FAFC', fontSize: 17, fontWeight: 700 }}>
              Scan to Claim VIP Pass
            </h3>
            <p style={{ margin: '0 0 18px', color: '#94A3B8', fontSize: 12 }}>
              Point your phone camera to accept {referrerName}&apos;s invitation.
            </p>
            <div
              style={{
                background: '#04070E',
                padding: 14,
                borderRadius: 10,
                display: 'inline-block',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                marginBottom: 16,
              }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F8FAFC',
                  padding: '8px 20px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
