'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import GaaIcon from '@/components/ui/GaaIcon'
import { trackMarketingEvent } from '@/lib/marketing-analytics'
import { isCompanionApp } from '@/lib/native-companion'

const STORAGE_KEY_CAPTURED = 'gaa_lead_captured'
const STORAGE_KEY_DISMISSED = 'gaa_lead_dock_dismissed_until'
const SUPPRESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export type FirstVisitLeadCaptureProps = {
  isLive?: boolean
  scrollThresholdPct?: number
  dwellTimeSeconds?: number
}

export default function FirstVisitLeadCapture({
  isLive = false,
  scrollThresholdPct = 35,
  dwellTimeSeconds = 20,
}: FirstVisitLeadCaptureProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const mountTimeRef = useRef<number>(0)
  const hasTriggeredRef = useRef(false)

  // Do not show on private, dashboard, administrative routes, or in helper apps
  const isCompanion = isCompanionApp()
  const isExcludedRoute =
    isCompanion ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/coach') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/apply') ||
    pathname?.startsWith('/test-harness')

  useEffect(() => {
    mountTimeRef.current = Date.now()

    if (isExcludedRoute) return

    // 1. Check if user already submitted or dismissed
    try {
      if (localStorage.getItem(STORAGE_KEY_CAPTURED) === 'true') {
        return
      }
      const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED)
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        return
      }
    } catch {
      // Storage unavailable / private mode fallback
    }

    function triggerDisplay(triggerReason: 'scroll' | 'dwell' | 'exit_intent') {
      if (hasTriggeredRef.current) return
      hasTriggeredRef.current = true
      setIsVisible(true)
      trackMarketingEvent('first_visit_dock_impression', {
        trigger: triggerReason,
        isLive,
        pathname,
      })
    }

    // 2. Dwell Timer Trigger
    const timer = setTimeout(() => {
      triggerDisplay('dwell')
    }, dwellTimeSeconds * 1000)

    // 3. Scroll Depth Trigger
    function handleScroll() {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        const pct = (scrollY / docHeight) * 100
        if (pct >= scrollThresholdPct) {
          triggerDisplay('scroll')
        }
      }
    }

    // 4. Desktop Exit-Intent Trigger
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 12 && e.relatedTarget === null) {
        triggerDisplay('exit_intent')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isExcludedRoute, scrollThresholdPct, dwellTimeSeconds, isLive, pathname])

  function handleDismiss() {
    setIsVisible(false)
    trackMarketingEvent('first_visit_dock_dismiss', { isLive, pathname })
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, String(Date.now() + SUPPRESSION_DURATION_MS))
    } catch {
      // ignore
    }
  }

  async function handleSubmit(overrideEmail?: string) {
    const targetEmail = (overrideEmail || email).trim()
    setErrorMessage(null)
    setSuggestion(null)

    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          firstName: firstName.trim() || undefined,
          source: isLive ? 'live_consultation_dock' : 'first_visit_protocol_dock',
          honeypot,
          startTimeMs: mountTimeRef.current,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setStatus('success')
        trackMarketingEvent('first_visit_dock_submit_success', {
          isLive,
          source: isLive ? 'live_consultation_dock' : 'first_visit_protocol_dock',
        })
        try {
          localStorage.setItem(STORAGE_KEY_CAPTURED, 'true')
        } catch {
          // ignore
        }
      } else {
        setStatus('error')
        const message = typeof data?.error === 'string' ? data.error : 'Submission failed. Please try again.'
        setErrorMessage(message)
        if (typeof data?.suggestion === 'string') {
          setSuggestion(data.suggestion)
        }
        trackMarketingEvent('first_visit_dock_submit_error', { isLive, status: res.status })
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network connection error. Please try again.')
      trackMarketingEvent('first_visit_dock_submit_error', { isLive, status: 'network_error' })
    }
  }

  function applySuggestion(suggestedEmail: string) {
    setEmail(suggestedEmail)
    setSuggestion(null)
    setErrorMessage(null)
    handleSubmit(suggestedEmail)
  }

  if (!isVisible || isExcludedRoute) return null

  // Minimized Floating Badge
  if (isMinimized) {
    return (
      <div
        className="first-visit-dock-minimized"
        style={{
          position: 'fixed',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(14, 23, 36, 0.95)',
          border: '1px solid rgba(197, 160, 89, 0.5)',
          borderRadius: 30,
          padding: '8px 18px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'transform 0.2s ease',
          boxSizing: 'border-box',
        }}
        onClick={() => setIsMinimized(false)}
        role="button"
        tabIndex={0}
        aria-label="Open Forge Athletic updates"
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isLive ? '#22C55E' : '#C5A059',
            boxShadow: isLive ? '0 0 10px #22C55E' : '0 0 8px #C5A059',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isLive ? 'Live coaching' : 'Training and movement updates'}
        </span>
      </div>
    )
  }

  return (
    <aside
      aria-label="Advisory Intake Dock"
      className="first-visit-dock"
      style={{
        position: 'fixed',
        zIndex: 9999,
        background: 'rgba(14, 23, 36, 0.96)',
        border: '1px solid rgba(197, 160, 89, 0.4)',
        borderRadius: 14,
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.65), 0 0 24px rgba(197, 160, 89, 0.1)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Gold Horizon Accent */}
      <div
        style={{
          height: 3,
          background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)',
        }}
      />

      <div className="first-visit-dock-inner">
        {/* Header with Live/Status Badge and Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 10px',
              borderRadius: 20,
              background: isLive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(197, 160, 89, 0.14)',
              border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.35)' : 'rgba(197, 160, 89, 0.35)'}`,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: isLive ? '#22C55E' : 'var(--gold-lt)',
                boxShadow: isLive ? '0 0 8px #22C55E' : '0 0 6px var(--gold)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: isLive ? '#4ADE80' : 'var(--gold-lt)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isLive ? 'Coach Gordon in the live studio' : 'Training and movement insights'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize intake dock"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GaaIcon name="minus" size={14} />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss intake dock"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GaaIcon name="close" size={14} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {status === 'success' ? (
          <div style={{ padding: '8px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GaaIcon name="check" size={14} tone="emerald" />
              </div>
              <h3
                className="font-serif"
                style={{
                  fontSize: 18,
                  margin: 0,
                  color: '#FFFFFF',
                  letterSpacing: '0.03em',
                  fontWeight: 600,
                }}
              >
                Transmission Confirmed
              </h3>
            </div>
            <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 16px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              Your training and movement information and $97 voucher have been sent to{' '}
              <strong style={{ color: '#FFFFFF' }}>{email}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/packages"
                className="sgf-button sgf-button-primary tactile-btn"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 12,
                  padding: '9px 14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                View Memberships
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                className="sgf-button sgf-button-secondary tactile-btn"
                style={{
                  fontSize: 12,
                  padding: '9px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#CBD5E1',
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2
              className="font-serif"
              style={{
                fontSize: 20,
                lineHeight: 1.25,
                margin: '0 0 6px',
                color: '#FFFFFF',
                letterSpacing: '0.03em',
                fontWeight: 600,
              }}
            >
              {isLive ? 'Request Live Consultation Window' : 'Claim Your 3D AI Audit Voucher'}
            </h2>
            <p style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.45, margin: '0 0 16px' }}>
              {isLive
                ? 'Coach Gordon is reviewing active client biomechanics. Enter your details for priority queue allocation.'
                : 'Get the 5-phase NASM OPT™ sports science blueprint and $97 credit for your 3D AI movement audit.'}
            </p>

            {/* Invisible Bot Honeypot Shield */}
            <div aria-hidden="true" style={{ display: 'none', position: 'absolute', left: '-9999px' }}>
              <label htmlFor="first-visit-dock-hp">Leave this field blank</label>
              <input
                id="first-visit-dock-hp"
                type="text"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <form
              onSubmit={e => {
                e.preventDefault()
                handleSubmit()
              }}
              className="first-visit-dock-form"
              style={{ display: 'grid', gap: 10, width: '100%', boxSizing: 'border-box' }}
            >
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First Name (optional)"
                autoComplete="given-name"
                className="first-visit-dock-input"
                style={{
                  background: 'rgba(8, 14, 20, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 16,
                  outline: 'none',
                  fontFamily: 'Raleway, sans-serif',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />

              <input
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
                placeholder="Email address"
                autoComplete="email"
                required
                className="first-visit-dock-input"
                style={{
                  background: 'rgba(8, 14, 20, 0.85)',
                  border: `1px solid ${status === 'error' ? 'var(--error)' : 'rgba(197, 160, 89, 0.35)'}`,
                  color: '#FFFFFF',
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 16,
                  outline: 'none',
                  fontFamily: 'Raleway, sans-serif',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />

              {status === 'error' && errorMessage && (
                <div style={{ fontSize: 11.5, color: 'var(--error)', lineHeight: 1.4 }}>
                  {errorMessage}
                  {suggestion && (
                    <button
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      style={{
                        marginLeft: 6,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--gold-lt)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 11.5,
                        padding: 0,
                      }}
                    >
                      Use {suggestion}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="sgf-button sgf-button-primary tactile-btn"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  border: 'none',
                  borderRadius: 6,
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {status === 'loading'
                  ? 'Connecting...'
                  : isLive
                    ? 'Request Live Slot'
                    : 'Get the assessment & voucher'}
              </button>
            </form>

            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <span style={{ fontSize: 10.5, color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
                <GaaIcon name="shield" size={10} tone="gold" />
                <span>Zero spam · Verified RFC 8058 1-click unsubscribe</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
