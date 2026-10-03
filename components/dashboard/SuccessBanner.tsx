'use client'

import { useEffect, useState } from 'react'
import { trackMarketingEvent } from '@/lib/marketing-analytics'
import GaaIcon from '@/components/ui/GaaIcon'

export default function SuccessBanner() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    trackMarketingEvent('plan_checkout_success', {
      location: 'dashboard',
    })

    const timer = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        borderLeft: '3px solid var(--gold)',
        background: 'var(--navy-mid)',
        padding: '14px 20px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--white)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <GaaIcon name="celebration" size={16} tone="gold" />
        <span>Package purchased! Your sessions are ready to book.</span>
      </span>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--gray)',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
          padding: '0 0 0 12px',
        }}
      >
        ×
      </button>
    </div>
  )
}
