'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CoachError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Coach dashboard error:', error)
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
        <h1
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontWeight: 700,
            fontSize: 'clamp(24px, 5vw, 32px)',
            color: 'var(--white)',
            letterSpacing: '0.04em',
            marginBottom: '12px',
            lineHeight: 1.2,
          }}
        >
          COACH CONSOLE ERROR
        </h1>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: '15px',
            color: 'var(--gray)',
            marginBottom: '28px',
            lineHeight: '1.6',
          }}
        >
          Failed to load the coach command center. Please verify your connection or retry loading the console.
        </p>
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
            href="/coach"
            className="tactile-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(212, 160, 23, 0.15)',
              color: 'var(--gold-lt)',
              border: '1px solid rgba(197, 160, 89, 0.5)',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.04em',
              padding: '12px 24px',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Coach Hub
          </Link>
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
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
