'use client'

import React, { useState } from 'react'
import Link from 'next/link'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: '#0B1120',
  color: '#FFFFFF',
  fontSize: 14,
  boxSizing: 'border-box',
}

export default function SmsConsentFormClient() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!smsConsent) {
      setStatus('error')
      setErrorMessage('Please check the SMS consent box to enable optional text notifications.')
      return
    }

    setStatus('submitting')
    try {
      let detectedTz: string | undefined
      try {
        detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        // ignore
      }

      const res = await fetch('/api/account/sms-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          smsConsent: true,
          timezone: detectedTz,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data?.error || 'Could not record SMS preferences. Please verify your details.')
        return
      }

      setStatus('saved')
    } catch {
      setStatus('error')
      setErrorMessage('Network error while saving SMS preferences. Please try again.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      style={{
        background: 'rgba(14, 23, 38, 0.94)',
        border: '1px solid rgba(197, 160, 89, 0.4)',
        borderRadius: 12,
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
      }}
    >
      {status === 'saved' ? (
        <div
          role="status"
          style={{
            padding: '16px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#D1FAE5',
            fontSize: 14,
          }}
        >
          <strong style={{ display: 'block', marginBottom: 6, color: '#34D399' }}>
            ✓ SMS Opt-In Recorded
          </strong>
          Your SMS notification consent has been securely saved over encrypted POST (never in URL parameters). You can reply{' '}
          <strong>STOP</strong> to any message or manage preferences in{' '}
          <Link href="/dashboard/settings" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
            Account Settings
          </Link>{' '}
          at any time.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="sms-full-name" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Full Name *
            </label>
            <input
              id="sms-full-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jordan Taylor"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="sms-email" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Account Email Address *
            </label>
            <input
              id="sms-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jordan@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label htmlFor="sms-phone" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Mobile Phone Number *
            </label>
            <input
              id="sms-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(413) 555-0199"
              style={inputStyle}
            />
          </div>

          <label
            htmlFor="sms-consent-checkbox"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px',
              borderRadius: 8,
              background: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid rgba(197, 160, 89, 0.28)',
              fontSize: 13,
              color: '#E2E8F0',
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            <input
              id="sms-consent-checkbox"
              name="sms_consent"
              type="checkbox"
              required
              checked={smsConsent}
              onChange={e => setSmsConsent(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
            />
            <span>
              By checking this box, I provide my prior express written consent to receive automated transactional account and
              coaching text messages from <strong>Forge Athletic</strong> (Forge Athletic Performance LLC) at the mobile phone
              number provided, including live coaching session alerts, priority coach replies, weekly check-in reminders, and
              billing notifications. Message frequency varies (up to 6 messages per month).{' '}
              <strong>Message and data rates may apply.</strong> Reply <strong>STOP</strong> to opt out or{' '}
              <strong>HELP</strong> for help at any time. Consent is optional and is <strong>not a condition of purchase</strong>.
              View our{' '}
              <Link href="/privacy#sms-privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline', fontWeight: 600 }}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/terms" style={{ color: 'var(--gold-lt)', textDecoration: 'underline', fontWeight: 600 }}>
                Terms and Conditions
              </Link>
              .
            </span>
          </label>

          {errorMessage && (
            <div
              role="alert"
              style={{
                marginBottom: 16,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FECACA',
                fontSize: 13,
              }}
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="btn-gold"
            style={{
              width: '100%',
              cursor: status === 'submitting' ? 'wait' : 'pointer',
              padding: '12px 20px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {status === 'submitting' ? 'Saving SMS Consent…' : 'Save SMS Notification Consent'}
          </button>
        </>
      )}
    </form>
  )
}
