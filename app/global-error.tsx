'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Forge Global Error Boundary]', { digest: error.digest })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          background: '#080E14',
          color: '#FFFFFF',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <main
          style={{
            maxWidth: 520,
            width: '100%',
            background: '#0E1726',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            borderRadius: 12,
            padding: '32px 28px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#F59E0B',
            }}
          >
            Forge Athletic
          </p>
          <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700 }}>
            Temporary Application Interruption
          </h1>
          <p style={{ margin: '0 0 22px', fontSize: 14, color: '#CBD5E1', lineHeight: 1.6 }}>
            We encountered an unexpected issue loading this view. Your workout and account records remain intact.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 44,
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#C5A059',
                color: '#080E14',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <Link
              href="/"
              style={{
                minHeight: 44,
                padding: '10px 20px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#E2E8F0',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Return Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
