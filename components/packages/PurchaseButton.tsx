'use client'

import { useEffect, useState } from 'react'
import { trackMarketingEvent } from '@/lib/marketing-analytics'
import { isCompanionApp } from '@/lib/native-companion'

interface PurchaseButtonProps {
  packageId?: string
  productId?: string
  cadence?: 'monthly' | 'twelve_week'
  selectedAddonIds?: string[]
  buttonLabel?: string
  redirectNext?: string
}

export default function PurchaseButton({
  packageId,
  productId,
  cadence = 'monthly',
  selectedAddonIds = [],
  buttonLabel,
  redirectNext,
}: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [isCompanion, setIsCompanion] = useState(false)

  const targetIdentifier = productId || packageId || 'unknown'

  useEffect(() => {
    setIsCompanion(isCompanionApp())
  }, [])

  useEffect(() => {
    trackMarketingEvent('plan_tier_viewed', {
      packageId: targetIdentifier,
      cadence,
      location: productId ? 'audit_page' : 'packages_page',
      selectedAddons: selectedAddonIds.join(',') || 'none',
    })
  }, [targetIdentifier, selectedAddonIds, cadence, productId])

  async function handlePurchase() {
    if (isCompanionApp()) {
      setError('In-app purchases are disabled on mobile companion devices. Please visit gordonathleticadvisory.com.')
      return
    }

    trackMarketingEvent('plan_checkout_click', {
      packageId: targetIdentifier,
      cadence,
      location: productId ? 'audit_page' : 'packages_page',
      selectedAddons: selectedAddonIds.join(',') || 'none',
      hasDiscountCode: Boolean(discountCode.trim()),
    })

    setLoading(true)
    setError(null)

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: packageId || undefined,
        productId: productId || undefined,
        cadence,
        selectedAddonIds,
        discountCode: discountCode.trim() || undefined,
      }),
    })

    if (res.status === 401) {
      window.location.href = `/auth/login?next=${encodeURIComponent(redirectNext || (productId ? '/audit' : '/packages'))}`
      return
    }

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      trackMarketingEvent('plan_checkout_error', {
        packageId,
        location: 'packages_page',
        status: res.status,
      })
      setError(data?.error || 'Failed to start checkout. Please try again.')
      setLoading(false)
      return
    }

    const url = data?.url
    if (url) {
      trackMarketingEvent('plan_checkout_redirect', {
        packageId,
        location: 'packages_page',
      })
      window.location.href = url
      return
    }

    setError('Checkout session created but no redirect URL was returned.')
    setLoading(false)
  }

  if (isCompanion) {
    return (
      <div
        style={{
          background: 'rgba(197, 160, 89, 0.08)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          borderRadius: 8,
          padding: '12px 14px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 4 }}>
          Gym Companion Notice
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.45 }}>
          Memberships and add-ons are configured exclusively on our web portal. Please visit <strong style={{ color: 'var(--white)' }}>gordonathleticadvisory.com</strong> in your browser to manage your retainer.
        </div>
      </div>
    )
  }

  return (
    <div>
      <label
        htmlFor={`discount-${packageId}`}
        style={{
          display: 'block',
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 600,
          fontSize: 11,
          color: 'var(--gray)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}
      >
        Discount Code (Optional)
      </label>
      <input
        id={`discount-${packageId}`}
        type="text"
        value={discountCode}
        onChange={e => setDiscountCode(e.target.value.toUpperCase())}
        placeholder="COACH-XXXXXX"
        style={{
          width: '100%',
          marginBottom: 12,
          padding: '11px 14px',
          background: 'var(--navy)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          borderRadius: 6,
          color: 'var(--white)',
          fontFamily: 'Raleway, sans-serif',
          fontSize: 16,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="tactile-btn"
        style={{
          width: '100%',
          padding: '14px',
          background: loading ? 'var(--navy-lt)' : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
          color: loading ? 'var(--gray)' : '#080E14',
          border: 'none',
          borderRadius: 6,
          fontFamily: 'var(--font-sans, Raleway), sans-serif',
          fontSize: 13.5,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(197, 160, 89, 0.35)',
        }}
      >
        {loading ? '...' : (buttonLabel || 'Start Membership')}
      </button>
      {error && (
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 13,
            color: 'var(--error)',
            margin: '8px 0 0',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
