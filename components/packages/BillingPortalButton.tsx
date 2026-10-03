'use client'

import { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpenPortal() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Unable to open billing portal.')
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
        return
      }

      setError('Billing portal URL was not returned.')
      setLoading(false)
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <button
        type="button"
        onClick={handleOpenPortal}
        disabled={loading}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(212,160,23,0.4)',
          color: 'var(--gold-lt)',
          padding: '10px 18px',
          borderRadius: 6,
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.15s ease',
        }}
      >
        <GaaIcon name="gear" size={14} tone="inherit" />
        <span>{loading ? 'Opening Portal...' : 'Manage Subscriptions & Add-Ons'}</span>
      </button>
      {error && (
        <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 6 }}>
          {error}
        </span>
      )}
    </div>
  )
}
