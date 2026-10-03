'use client'
import { useState, useRef, useEffect } from 'react'
import { trackMarketingEvent } from '@/lib/marketing-analytics'

export default function WaitlistForm({ id = 'default' }: { id?: string }) {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const mountTimeRef = useRef<number>(0)

  useEffect(() => {
    mountTimeRef.current = Date.now()
  }, [])

  async function submit(overrideEmail?: string) {
    const targetEmail = (overrideEmail || email).trim()
    setErrorMessage(null)
    setSuggestion(null)

    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      trackMarketingEvent('waitlist_submit_invalid', { placement: id })
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          honeypot,
          startTimeMs: mountTimeRef.current,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setStatus('success')
        trackMarketingEvent('waitlist_submit_success', { placement: id })
      } else {
        setStatus('error')
        const message = typeof data?.error === 'string' ? data.error : 'Unable to join waitlist. Please try again.'
        setErrorMessage(message)
        if (typeof data?.suggestion === 'string') {
          setSuggestion(data.suggestion)
        }
        trackMarketingEvent('waitlist_submit_error', { placement: id, status: res.status })
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network connection error. Please try again.')
      trackMarketingEvent('waitlist_submit_error', { placement: id, status: 'network_error' })
    }
  }

  function applySuggestion(suggestedEmail: string) {
    setEmail(suggestedEmail)
    setSuggestion(null)
    setErrorMessage(null)
    submit(suggestedEmail)
  }

  if (status === 'success') {
    return (
      <div className="waitlist-success" style={{
        borderLeft: '3px solid var(--success)',
        background: 'rgba(72,187,120,0.07)',
        padding: '1.25rem 1.5rem',
        maxWidth: 480,
      }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--white)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>You&apos;re on the list.</span>
          {' '}I&apos;ll be in touch personally when spots open. - Scott
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, width: '100%' }}>
      {/* Bot Honeypot Field — hidden from screen readers and visual users */}
      <div aria-hidden="true" style={{ display: 'none', position: 'absolute', left: '-9999px' }}>
        <label htmlFor={`waitlist-hp-${id}`}>Leave this field empty</label>
        <input
          id={`waitlist-hp-${id}`}
          type="text"
          value={honeypot}
          onChange={e => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div id={`waitlist-${id}`} className="waitlist-form" style={{ display: 'flex', gap: 0, width: '100%', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' }}>
        <label htmlFor={`waitlist-email-${id}`} style={{ position: 'absolute', left: '-9999px' }}>
          Email address
        </label>
        <input
          id={`waitlist-email-${id}`}
          className="waitlist-form-input"
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value)
            if (status === 'error') {
              setStatus('idle')
              setErrorMessage(null)
              setSuggestion(null)
            }
          }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="your@email.com"
          autoComplete="email"
          style={{
            flex: 1,
            background: 'rgba(14, 23, 36, 0.92)',
            border: `1px solid ${status === 'error' ? 'var(--error)' : 'rgba(197, 160, 89, 0.35)'}`,
            borderRight: 'none',
            color: '#FFFFFF',
            fontFamily: 'Raleway, sans-serif',
            fontSize: '0.92rem',
            padding: '0.9rem 1.2rem',
            outline: 'none',
            borderRadius: '8px 0 0 8px',
          }}
        />
        <button
          type="button"
          className="waitlist-form-button tactile-btn"
          onClick={() => submit()}
          disabled={status === 'loading'}
          style={{
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
            color: '#080E14',
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.9rem 1.6rem',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            cursor: status === 'loading' ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            fontWeight: 800,
          }}
        >
          {status === 'loading' ? 'Joining...' : 'Join Priority Waitlist'}
        </button>
      </div>

      {status === 'error' && errorMessage && (
        <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--error)', lineHeight: 1.4 }}>
          {errorMessage}
          {suggestion && (
            <button
              type="button"
              onClick={() => applySuggestion(suggestion)}
              style={{
                marginLeft: 8,
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-lt)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                padding: 0,
              }}
            >
              Use {suggestion} instead
            </button>
          )}
        </div>
      )}
    </div>
  )
}
