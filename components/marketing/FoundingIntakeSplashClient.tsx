'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import CinematicVideoPlayer from './CinematicVideoPlayer'
import GaaIcon from '@/components/ui/GaaIcon'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import NasmAccreditationPortfolio from './NasmAccreditationPortfolio'

export default function FoundingIntakeSplashClient() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profileType, setProfileType] = useState('executive')
  const [primaryGoal, setPrimaryGoal] = useState('structural_longevity')
  const [notes, setNotes] = useState('')
  const [honeypot, setHoneypot] = useState('')

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [assignedNumber, setAssignedNumber] = useState<number>(12)
  const mountTimeRef = useRef<number>(0)

  useEffect(() => {
    mountTimeRef.current = Date.now()
    // Deterministic pleasant cohort reservation number between 7 and 14
    setAssignedNumber(Math.floor(Math.random() * 8) + 7)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (!fullName.trim()) {
      setStatus('error')
      setErrorMessage('Please provide your full name.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: fullName.trim(),
          trainingLevel: profileType === 'athlete' ? 'advanced' : 'intermediate',
          primaryGoal: `[Founding Intake] Goal: ${primaryGoal} | Phone: ${phone || 'N/A'} | Notes: ${notes || 'None'}`,
          source: 'founding_cohort_intake',
          assignedCohortNumber: assignedNumber,
          phone: phone.trim() || undefined,
          profileType,
          honeypot,
          startTimeMs: mountTimeRef.current,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(data?.error || 'Unable to register. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network connection error. Please try again.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(197, 160, 89, 0.12) 0%, rgba(8, 14, 24, 0.98) 60%), #080E18',
        color: '#FFFFFF',
        position: 'relative',
        overflowX: 'hidden',
        padding: '24px 16px 80px',
      }}
    >
      {/* Background Watermark Seal */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          opacity: 0.15,
          zIndex: 0,
        }}
      >
        <GaaMasterWatermarkSeal size={650} />
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Navigation Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 24,
            marginBottom: 28,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                border: '1.5px solid var(--gold)',
                boxShadow: '0 0 14px rgba(197, 160, 89, 0.4)',
                backgroundImage: "url('/images/gaa-brand-crest.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                flexShrink: 0,
              }}
            />
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--white)',
                  display: 'block',
                }}
              >
                GORDON ATHLETIC ADVISORY
              </span>
              <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 600 }}>
                Evidence-based training and coaching
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/"
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--gold-lt)',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 4,
                border: '1px solid rgba(197, 160, 89, 0.3)',
                background: 'rgba(197, 160, 89, 0.08)',
              }}
            >
              Explore the app →
            </Link>
          </div>
        </header>

        {/* Founding Cohort Ribbon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.18) 0%, rgba(197, 160, 89, 0.06) 100%)',
              border: '1px solid rgba(197, 160, 89, 0.45)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
          >
            <GaaIcon name="crown" size={13} tone="gold" />
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--gold-lt)',
              }}
            >
              Forge Athletic · Early Access Membership Updates
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 4,
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontWeight: 700,
              }}
            >
              Early access · 15 places
            </span>
          </div>
        </div>

        {/* Hero Masthead */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
              lineHeight: 1.15,
              fontWeight: 700,
              margin: '0 0 16px',
              letterSpacing: '0.03em',
            }}
          >
            Built From The Ground Up.
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #FFF0C2 0%, #C5A059 50%, #947230 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Training that fits real life.
            </span>
          </h1>

          <p
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 'clamp(15px, 2.2vw, 18px)',
              lineHeight: 1.7,
              color: '#CBD5E1',
              maxWidth: 780,
              margin: '0 auto 20px',
            }}
          >
            Forge Athletic brings evidence-led training, movement screening, and coaching together for real lives. Join the early-access list for product and membership updates.
          </p>

          <div
            style={{
              maxWidth: 700,
              margin: '0 auto',
              padding: '12px 18px',
              background: 'rgba(14, 23, 36, 0.7)',
              borderLeft: '3px solid var(--gold)',
              borderRadius: 6,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <GaaIcon name="shield-check" size={20} tone="gold" />
            <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--gold-lt)' }}>A note about our launch:</strong> Coach Scott Gordon is completing NASM credentials and preparing the training space. Join the early-access list for updates about memberships and introductory pricing.
              <div style={{ marginTop: 6 }}>
                <a
                  href="#accreditation-portfolio"
                  style={{
                    fontSize: 12,
                    color: 'var(--gold-lt)',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    fontWeight: 600,
                  }}
                >
                  Learn about NASM® credentials and our training approach ↓
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Cinematic Video Showcase */}
        <div style={{ marginBottom: 54 }}>
          <CinematicVideoPlayer
            src="/videos/gaa-founding-manifesto.mp4"
            poster="/images/backgrounds/coach-olympic-facility-gaa.jpg"
            title="GAA Laboratory & Kinetic Architecture Manifesto"
            autoPlay={true}
            loop={true}
            allowCustomUrl={true}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              padding: '0 8px',
              fontSize: 11,
              color: 'var(--gray)',
              fontFamily: 'Raleway, sans-serif',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <span>Directed with Gemini Pro &amp; Rendered with Gemini Omni Flash</span>
            <span style={{ color: 'var(--gold-lt)', fontWeight: 600 }}>4K Kinetic Motion Architecture · 100% Optical Orientation</span>
          </div>
        </div>

        {/* Early-access information */}
        <div style={{ marginBottom: 50 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--gold-lt)',
              }}
            >
              Early-access benefits
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 26,
                fontWeight: 700,
                margin: '6px 0 0',
                color: '#FFFFFF',
              }}
            >
              What to expect from Forge Athletic
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 16,
            }}
          >
            {[
              {
                icon: 'video-studio' as const,
                title: 'Practical sports science',
                body: 'NASM OPT™ periodization, training telemetry, and coaching tools designed to support steady progress.',
                value: 'Training built around you',
              },
              {
                icon: 'lock' as const,
                title: 'Clear membership choices',
                body: 'Choose Core, Plus, or Coach Support with straightforward monthly pricing.',
                value: 'From $19.99/month',
              },
              {
                icon: 'microscope' as const,
                title: 'Movement assessment',
                body: 'Movement screening can help you better understand how you move and where you might focus.',
                value: 'Included with early access',
              },
            ].map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(14, 23, 36, 0.75)',
                  border: '1px solid rgba(197, 160, 89, 0.25)',
                  borderRadius: 10,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: 'rgba(197, 160, 89, 0.15)',
                      border: '1px solid rgba(197, 160, 89, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GaaIcon name={p.icon} size={18} tone="gold" />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontWeight: 700,
                      color: 'var(--gold-lt)',
                      background: 'rgba(197, 160, 89, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid rgba(197, 160, 89, 0.3)',
                    }}
                  >
                    {p.value}
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  {p.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* NASM Clinical Accreditation & Sports Science Architecture Portfolio */}
        <NasmAccreditationPortfolio />

        {/* Founding Intake Form Card */}
        <div
          id="intake-form"
          style={{
            maxWidth: 680,
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(14, 23, 36, 0.95) 0%, rgba(8, 14, 24, 0.95) 100%)',
            border: '1.5px solid var(--gold)',
            borderRadius: 14,
            padding: 'clamp(20px, 4vw, 36px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(197, 160, 89, 0.08)',
          }}
        >
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(52, 211, 153, 0.15)',
                  border: '2px solid #34d399',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GaaIcon name="check" size={32} tone="emerald" />
              </div>

              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-lt)',
                }}
              >
                You&apos;re on the early-access list
              </span>

              <h3
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 28,
                  fontWeight: 700,
                  margin: '8px 0 12px',
                  color: '#FFFFFF',
                }}
              >
                Thanks for signing up, {fullName}
              </h3>

              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(197, 160, 89, 0.12)',
                  border: '1px solid var(--gold)',
                  borderRadius: 6,
                  padding: '10px 20px',
                  margin: '12px 0 20px',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  Your request number
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-telemetry, monospace)',
                    fontSize: 24,
                    fontWeight: 800,
                    color: 'var(--gold-lt)',
                  }}
                >
                  Early-access request #{assignedNumber}
                </span>
              </div>

              <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 24px' }}>
                We have received your request. We will email you when early access opens and share the next steps.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/audit"
                  className="sgf-button sgf-button-gold"
                  style={{ padding: '10px 22px', fontSize: 12, fontWeight: 800 }}
                >
                  Explore the movement assessment →
                </Link>
                <Link
                  href="/"
                  className="tactile-btn"
                  style={{
                    padding: '10px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'Raleway, sans-serif',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                  }}
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  Join the early-access list
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94A3B8' }}>
                  Tell us a little about your goals and preferred coaching support. We will share updates about memberships and introductory pricing.
                </p>
              </div>

              {errorMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    borderLeft: '3px solid #ef4444',
                    borderRadius: 4,
                    fontSize: 13,
                    color: '#fca5a5',
                    marginBottom: 16,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
                {/* Honeypot */}
                <div aria-hidden="true" style={{ display: 'none', position: 'absolute', left: '-9999px' }}>
                  <input
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Email address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone number (optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>What best describes your training?</label>
                    <select
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="executive">Everyday fitness and performance</option>
                      <option value="professional">Training around a busy schedule</option>
                      <option value="athlete">Competitive sports</option>
                      <option value="longevity">Mobility and healthy aging</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>What would you like help with?</label>
                    <select
                      value={primaryGoal}
                      onChange={(e) => setPrimaryGoal(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="structural_longevity">Move more comfortably and support joint health</option>
                      <option value="hypertrophy">Build strength or muscle</option>
                      <option value="power_speed">Improve speed, power, or endurance</option>
                      <option value="full_concierge">One-to-one coaching</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Anything else you would like us to know? (optional)</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share anything about your goals, schedule, or training preferences."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="sgf-button sgf-button-gold"
                  style={{
                    padding: '14px 24px',
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: 8,
                    cursor: status === 'loading' ? 'wait' : 'pointer',
                    boxShadow: '0 4px 18px rgba(197, 160, 89, 0.4)',
                  }}
                >
                  {status === 'loading' ? 'Submitting...' : 'Request early access →'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--gray)', margin: '4px 0 0' }}>
                  No payment is required to join. We will use your details to follow up about early access.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Raleway, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--gold-lt)',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: 6,
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#FFFFFF',
  fontFamily: 'Raleway, sans-serif',
  fontSize: 13,
  outline: 'none',
}
