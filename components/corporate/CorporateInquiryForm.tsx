'use client'

import React, { useState } from 'react'

export default function CorporateInquiryForm() {
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [teamSize, setTeamSize] = useState('5-10 executives')
  const [customGoals, setCustomGoals] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/corporate/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactName,
          contactEmail,
          teamSize,
          customGoals,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit inquiry')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1.5px solid #34D399',
          borderRadius: 8,
          padding: '28px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
        <h4 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF', margin: '0 0 8px' }}>
          PROPOSAL REQUEST RECEIVED
        </h4>
        <p style={{ color: 'var(--gray)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
          Thank you, {contactName}. Coach Gordon will review {companyName}&apos;s request and prepare a team wellness proposal within 24 business hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: 6, color: '#FCA5A5', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            Company / Organization Name *
          </label>
          <input
            required
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Apex Partners LLC"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(14, 23, 36, 0.9)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            Your name *
          </label>
          <input
            required
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="e.g. Taylor Morgan"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(14, 23, 36, 0.9)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            Email address *
          </label>
          <input
            required
            type="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            placeholder="you@yourorganization.com"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(14, 23, 36, 0.9)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
            Team size
          </label>
          <select
            value={teamSize}
            onChange={e => setTeamSize(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(14, 23, 36, 0.9)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          >
            <option value="5-10 executives">5–10 people</option>
            <option value="11-20 executives">11–20 people</option>
            <option value="20+ enterprise">More than 20 people</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 6 }}>
          What would you like the program to support?
        </label>
        <textarea
          rows={3}
          value={customGoals}
          onChange={e => setCustomGoals(e.target.value)}
          placeholder="e.g. More opportunities to move during the workday, support for healthy routines, or team fitness activities..."
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(14, 23, 36, 0.9)',
            border: '1px solid rgba(197, 160, 89, 0.3)',
            borderRadius: 6,
            color: '#FFFFFF',
            fontSize: 14,
            boxSizing: 'border-box',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="tactile-btn"
        style={{
          background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
          color: '#080E14',
          fontFamily: 'var(--font-sans, Raleway), sans-serif',
          fontSize: 13,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '14px 24px',
          borderRadius: 6,
          border: 'none',
          fontWeight: 800,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
          boxShadow: '0 4px 15px rgba(197, 160, 89, 0.35)',
        }}
      >
        {submitting ? 'Sending request...' : 'Request a team wellness proposal →'}
      </button>
    </form>
  )
}
