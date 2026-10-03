'use client'

import { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'

interface MasterAllocationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MasterAllocationModal({
  isOpen,
  onClose,
}: MasterAllocationModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [occupationalVelocity, setOccupationalVelocity] = useState('')
  const [orthopedicHistory, setOrthopedicHistory] = useState('')
  const [autonomousExecution, setAutonomousExecution] = useState<'yes' | 'no' | ''>('')
  const [capitalAllocated, setCapitalAllocated] = useState<'yes' | 'no' | ''>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isDisqualified, setIsDisqualified] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim() || !email.trim() || !occupationalVelocity.trim() || !orthopedicHistory.trim()) {
      setError('Please complete all required clinical profiling fields.')
      return
    }

    if (!autonomousExecution || !capitalAllocated) {
      setError('Please confirm both executive prerequisite questions.')
      return
    }

    // Filter check: If someone flinches at autonomy or capital
    if (autonomousExecution === 'no' || capitalAllocated === 'no') {
      setIsDisqualified(true)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/apply/master-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          occupationalVelocity,
          orthopedicHistory,
          autonomousExecution,
          capitalAllocated,
          startTimeMs: Date.now() - 5000,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit allocation request.')
      }

      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'A server error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 7, 12, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="sovereign-card"
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'linear-gradient(180deg, #0F1826 0%, #080E16 100%)',
          border: '1px solid rgba(197, 160, 89, 0.4)',
          borderRadius: 12,
          padding: 'clamp(24px, 4vw, 40px)',
          position: 'relative',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(197, 160, 89, 0.15)',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Background Watermark Crest */}
        <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.05, pointerEvents: 'none' }}>
          <GaaMasterWatermarkSeal size={240} opacity={1} />
        </div>

        {/* Close Action */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gray)',
            cursor: 'pointer',
            fontSize: 16,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray)')}
        >
          ✕
        </button>

        {/* State: Respectful Disqualification Redirect */}
        {isDisqualified ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(197, 160, 89, 0.12)',
                border: '1px solid rgba(197, 160, 89, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <GaaIcon name="shield" size={26} tone="gold" />
            </div>
            <h3 className="font-serif" style={{ fontSize: 24, color: '#FFFFFF', margin: '0 0 12px', fontWeight: 700 }}>
              Advisory Alignment Notice
            </h3>
            <p style={{ color: 'var(--gray)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
              <strong>Transformation Direct ($199/mo)</strong> includes quarterly asynchronous video critiques with Coach Scott Gordon.
            </p>
            <p style={{ color: 'var(--gold-lt)', fontSize: 14, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 28px' }}>
              Start with Core Membership for automated periodization and telemetry, or choose Pro Athlete for voice cadences and biomechanical mesh diagnostics.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onClose}
                className="sgf-button sgf-button-primary tactile-btn"
                style={{ padding: '12px 24px', fontSize: 13, fontWeight: 800 }}
              >
                View Autonomous Lab Tiers
              </button>
            </div>
          </div>
        ) : submitted ? (
          /* State: Confirmed Submission */
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.2) 0%, rgba(197, 160, 89, 0.05) 100%)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                boxShadow: '0 0 24px rgba(197, 160, 89, 0.3)',
              }}
            >
              <GaaIcon name="crown" size={30} tone="gold" />
            </div>
            <div className="crest-badge" style={{ marginBottom: 14 }}>
              <span>Diagnostic Allocation Pending</span>
            </div>
            <h3 className="font-serif" style={{ fontSize: 28, color: '#FFFFFF', margin: '0 0 12px', fontWeight: 700 }}>
              Master Dossier Initiated
            </h3>
            <p style={{ color: '#E2E8F0', fontSize: 15, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 18px' }}>
              Your sovereign intake file for <strong>{fullName}</strong> has been routed directly to Coach Gordon&apos;s private queue.
            </p>
            <p style={{ color: 'var(--gray)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>
              Our concierge desk will review your orthopedic profile and confirm your 45-minute live WebRTC Sovereign Movement Audit &amp; OHSA screen via email or direct WhatsApp within 12 business hours.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="sgf-button sgf-button-primary tactile-btn"
              style={{ padding: '12px 28px', fontSize: 13, fontWeight: 800 }}
            >
              Return to Platform
            </button>
          </div>
        ) : (
          /* State: Active Screening Form */
          <div>
            <div style={{ marginBottom: 20 }}>
              <div className="crest-badge" style={{ marginBottom: 12 }}>
                <GaaIcon name="crown" size={12} tone="gold" />
                <span>Transformation Direct · Quarterly Video Critiques</span>
              </div>
              <h2 className="font-serif" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', color: '#FFFFFF', margin: '0 0 8px', fontWeight: 700, lineHeight: 1.15 }}>
                Request Master Diagnostic Allocation
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  ✦ Strictly Capped at 8 Principals
                </span>
                <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700, background: 'rgba(52, 211, 153, 0.1)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                  ● 2 Allocations Remaining
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5, margin: '10px 0 0' }}>
                Admittance requires clinical verification of training discipline, orthopedic history, and capital allocation. Complete the four sovereign prerequisites below:
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: 6, padding: '10px 14px', color: '#FCA5A5', fontSize: 12.5, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Row 1: Full Name & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Principal Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g., Alexander Vance"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(6, 10, 18, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 6,
                      color: '#FFFFFF',
                      fontSize: 16,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Executive Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g., alex@vancecapital.com"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(6, 10, 18, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 6,
                      color: '#FFFFFF',
                      fontSize: 16,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Phone / Direct WhatsApp */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Direct Mobile / WhatsApp (For Concierge Scheduling)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(6, 10, 18, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 6,
                    color: '#FFFFFF',
                    fontSize: 16,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Question 1: Occupational Velocity */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  1. Occupational Velocity &amp; Flight Schedule *
                </label>
                <textarea
                  required
                  rows={2}
                  value={occupationalVelocity}
                  onChange={e => setOccupationalVelocity(e.target.value)}
                  placeholder="e.g., Managing Director in Private Equity, 60+ hrs/wk, bi-weekly transcontinental flights (NYC / London), frequent hotel gyms."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(6, 10, 18, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 6,
                    color: '#FFFFFF',
                    fontSize: 16,
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Question 2: Orthopedic History */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  2. Orthopedic Compensations &amp; Surgical History *
                </label>
                <textarea
                  required
                  rows={2}
                  value={orthopedicHistory}
                  onChange={e => setOrthopedicHistory(e.target.value)}
                  placeholder="e.g., Chronic lower back tightness (L4/L5) after long flights, right rotator cuff impingement on heavy presses, no prior surgeries."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(6, 10, 18, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 6,
                    color: '#FFFFFF',
                    fontSize: 16,
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Question 3: Autonomy Filter */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  3. Execution Autonomy *
                </label>
                <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 8px' }}>
                  Our master advisory requires strict adherence to periodized load targets and Sunday dossier telemetry. Do you execute autonomously without cheerleading?
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#FFFFFF', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="autonomy"
                      value="yes"
                      checked={autonomousExecution === 'yes'}
                      onChange={() => setAutonomousExecution('yes')}
                    />
                    <span>Yes, I execute autonomously</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#FFFFFF', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="autonomy"
                      value="no"
                      checked={autonomousExecution === 'no'}
                      onChange={() => setAutonomousExecution('no')}
                    />
                    <span>No, I require daily cheerleading</span>
                  </label>
                </div>
              </div>

              {/* Question 4: Capital Readiness */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  4. Capital Allocation Readiness *
                </label>
                <p style={{ fontSize: 12, color: 'var(--gray)', margin: '0 0 8px' }}>
                  Transformation Direct is a recurring $199/month membership with quarterly asynchronous video critiques by Coach Scott Gordon.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#FFFFFF', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="capital"
                      value="yes"
                      checked={capitalAllocated === 'yes'}
                      onChange={() => setCapitalAllocated('yes')}
                    />
                    <span>Yes, capital is allocated &amp; ready</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#FFFFFF', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="capital"
                      value="no"
                      checked={capitalAllocated === 'no'}
                      onChange={() => setCapitalAllocated('no')}
                    />
                    <span>No, exploring other options</span>
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={loading}
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
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 24px rgba(197, 160, 89, 0.45)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  <GaaIcon name="crown" size={16} tone="inherit" />
                  <span>{loading ? 'Submitting File...' : 'Submit Diagnostic Intake for Master Audit'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
