'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('Root error:', error)
  }, [error])

  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(197, 160, 89, 0.08) 0%, transparent 70%), var(--navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(14, 23, 36, 0.85)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          borderRadius: '8px',
          padding: '40px 28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(197, 160, 89, 0.05)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px solid rgba(197, 160, 89, 0.4)',
            color: 'var(--gold)',
            marginBottom: '20px',
            fontSize: 22,
          }}
          aria-hidden="true"
        >
          !
        </div>
        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            color: 'var(--white)',
            letterSpacing: '0.04em',
            marginBottom: '12px',
            lineHeight: 1.2,
          }}
        >
          SOMETHING WENT WRONG
        </h1>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: '15px',
            color: 'var(--gray)',
            marginBottom: '24px',
            lineHeight: '1.6',
          }}
        >
          An unexpected application error occurred. We have logged the diagnostic details. Try reloading this state or return home.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'rgba(148, 163, 184, 0.6)',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'inline-block',
              marginBottom: '28px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            Ref: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            className="tactile-btn"
            style={{
              background: 'var(--gold)',
              color: '#080E14',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.04em',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 15px rgba(197, 160, 89, 0.3)',
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="tactile-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--white)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '0.04em',
              padding: '12px 24px',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
