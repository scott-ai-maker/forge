'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackMarketingEvent } from '@/lib/marketing-analytics'
import { isCompanionApp } from '@/lib/native-companion'
import { getForgeMembership, getForgeMembershipPrice } from '@/lib/forge-memberships'
import { calculateDiscountAmountCents, getBuiltInPromoCode } from '@/lib/discount-codes'

interface PurchaseButtonProps {
  packageId?: string
  productId?: string
  addonId?: string
  cadence?: 'monthly' | 'annual' | 'twelve_week'
  selectedAddonIds?: string[]
  buttonLabel?: string
  redirectNext?: string
  showDiscountCode?: boolean
  defaultDiscountCode?: string
}

export default function PurchaseButton({
  packageId,
  productId,
  addonId,
  cadence = 'monthly',
  selectedAddonIds = [],
  buttonLabel,
  redirectNext,
  showDiscountCode = true,
  defaultDiscountCode = '',
}: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState(() => defaultDiscountCode.trim().toUpperCase())
  const [autoRenewalAccepted, setAutoRenewalAccepted] = useState(false)
  const [isCompanion, setIsCompanion] = useState(false)

  const targetIdentifier = addonId || productId || packageId || 'unknown'
  const isSubscriptionCheckout = Boolean(packageId && !addonId && !productId && cadence !== 'twelve_week')
  const membership = packageId ? getForgeMembership(packageId) : undefined
  const membershipPrice =
    membership && (cadence === 'monthly' || cadence === 'annual')
      ? getForgeMembershipPrice(membership, cadence)
      : undefined
  const builtInPromo = discountCode.trim() ? getBuiltInPromoCode(discountCode.trim()) : null
  const effectiveRecurringCents = membershipPrice
    ? Math.max(
        membershipPrice.amountCents -
          (builtInPromo
            ? calculateDiscountAmountCents(
                membershipPrice.amountCents,
                builtInPromo.discount_type,
                builtInPromo.discount_value
              )
            : 0),
        50
      )
    : null
  const formattedRecurringRate =
    effectiveRecurringCents !== null && membershipPrice
      ? `$${(effectiveRecurringCents / 100).toFixed(2)}/${membershipPrice.interval}`
      : cadence === 'annual'
      ? 'the selected annual rate'
      : 'the selected monthly rate'
  const trialDays = membership?.trialDays ?? 0

  useEffect(() => {
    setIsCompanion(isCompanionApp())
    if (defaultDiscountCode !== undefined) {
      setDiscountCode(defaultDiscountCode.trim().toUpperCase())
    }
  }, [defaultDiscountCode])

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
      setError('In-app purchases are disabled on mobile companion devices. Please visit the Forge Athletic website.')
      return
    }

    if (isSubscriptionCheckout && !autoRenewalAccepted) {
      setError('Please check the box above to confirm recurring auto-renewal and cancellation terms before continuing.')
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
        addonId: addonId || undefined,
        cadence,
        selectedAddonIds,
        discountCode: discountCode.trim() || undefined,
        acceptedTerms: isSubscriptionCheckout ? true : undefined,
        autoRenewalConsent: isSubscriptionCheckout ? autoRenewalAccepted : undefined,
      }),
    })

    if (res.status === 401) {
      router.push(`/auth/login?next=${encodeURIComponent(redirectNext || (productId ? '/audit' : '/packages'))}`)
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
          Memberships and add-ons are managed on the Forge Athletic website.
        </div>
      </div>
    )
  }

  const checkboxId = `autorenew-${packageId || targetIdentifier}-${cadence}`

  return (
    <div>
      {showDiscountCode && (
        <>
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
        </>
      )}

      {isSubscriptionCheckout && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(8, 14, 24, 0.78)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.48, marginBottom: 8 }}>
            <strong style={{ color: '#F8FAFC' }}>Auto-Renewal Summary:</strong>{' '}
            {trialDays > 0 ? (
              <>
                $0.00 due today for your {trialDays}-day free trial, then automatically billed{' '}
                <strong style={{ color: '#FDE68A' }}>{formattedRecurringRate}</strong> after {trialDays} days unless cancelled before trial ends.
              </>
            ) : (
              <>
                Billed today at <strong style={{ color: '#FDE68A' }}>{formattedRecurringRate}</strong> (no free trial) and renews automatically each {cadence === 'annual' ? 'year' : 'month'} until cancelled.
              </>
            )}{' '}
            {builtInPromo ? (
              <>Promotional rate remains locked while continuous active enrollment on this tier is maintained. </>
            ) : null}
            Cancel anytime in 1 click ($0 fees) under <em>Account Settings &gt; Billing</em> or email{' '}
            <a href="mailto:scott@forge-athletic.app" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
              scott@forge-athletic.app
            </a>
            . Includes 3-business-day cancellation right (M.G.L. c. 93, &sect;&sect; 80&ndash;82).
          </div>

          <label
            htmlFor={checkboxId}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              cursor: 'pointer',
              fontSize: 12,
              color: '#E2E8F0',
              lineHeight: 1.45,
            }}
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={autoRenewalAccepted}
              onChange={e => {
                setAutoRenewalAccepted(e.target.checked)
                if (e.target.checked) setError(null)
              }}
              style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#D4AF37' }}
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
                Terms of Service
              </Link>{' '}
              &amp;{' '}
              <Link href="/privacy" style={{ color: 'var(--gold-lt)', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>{' '}
              and authorize recurring {cadence === 'annual' ? 'annual' : 'monthly'} charges ({formattedRecurringRate}) until I cancel.
            </span>
          </label>
        </div>
      )}

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
