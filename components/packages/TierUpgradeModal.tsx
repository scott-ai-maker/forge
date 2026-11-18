'use client'

import Link from 'next/link'
import React, { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, X } from 'lucide-react'
import {
  dismissUpgradeTrigger,
  FORGE_TIER_ENTITLEMENTS,
  ForgeTierId,
  getUpgradeTriggerCopy,
  tierIdToForgePackageId,
  UpgradeTriggerId,
} from '@/lib/tierEntitlements'
import { isCompanionApp } from '@/lib/native-companion'

export interface TierUpgradeModalProps {
  open: boolean
  triggerContext: UpgradeTriggerId | null
  currentTier: ForgeTierId
  onClose: () => void
  onUpgraded?: (newTier: ForgeTierId) => void
}

export default function TierUpgradeModal({
  open,
  triggerContext,
  currentTier,
  onClose,
}: TierUpgradeModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const consentCheckboxId = useId()
  const [autoRenewalAccepted, setAutoRenewalAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setAutoRenewalAccepted(false)
      setLoading(false)
      setError(null)
    }
  }, [open, triggerContext])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && triggerContext && !dialog.open) {
      dialog.showModal()
    } else if ((!open || !triggerContext) && dialog.open) {
      dialog.close()
    }
  }, [open, triggerContext])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open || !triggerContext) return
    if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) {
      return
    }
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }
    let pressedOutside = false
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e)
    }
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dismissUpgradeTrigger(triggerContext)
        dialog.close()
      }
      pressedOutside = false
    }
    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('pointerup', onPointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('pointerup', onPointerUp)
    }
  }, [open, triggerContext])

  if (!triggerContext) return null

  const copy = getUpgradeTriggerCopy(triggerContext, currentTier)
  const targetSpec = FORGE_TIER_ENTITLEMENTS[copy.recommendedTier]
  const targetPackageId = tierIdToForgePackageId(copy.recommendedTier)
  const isCompanion = isCompanionApp()

  const handleDismissWithCooldown = () => {
    dismissUpgradeTrigger(triggerContext)
    onClose()
  }

  const handleActivateTier = async () => {
    if (isCompanion) {
      setError('Membership upgrades are managed on the Forge Athletic website.')
      return
    }

    if (!autoRenewalAccepted) {
      setError('Please check the box above to confirm recurring monthly auto-renewal and cancellation terms.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: targetPackageId,
          cadence: 'monthly',
          acceptedTerms: true,
          autoRenewalConsent: true,
        }),
      })

      if (res.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent('/packages')}`
        return
      }

      const data = await res.json().catch(() => null)
      if (res.status === 409 && (data?.code === 'EXISTING_ACTIVE_SUBSCRIPTION' || data?.useBillingPortal)) {
        const portalRes = await fetch('/api/stripe/portal', { method: 'POST' })
        const portalData = await portalRes.json().catch(() => null)
        if (portalRes.ok && portalData?.url) {
          window.location.href = portalData.url
          return
        }
      }
      if (!res.ok || !data?.url) {
        setError(data?.error || 'Unable to start Stripe Checkout. You can also upgrade directly on /packages.')
        setLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Network error starting checkout. Please try again or visit /packages.')
      setLoading(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      data-testid="tier-upgrade-modal"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={headingId}
      onClose={e => {
        e.currentTarget.returnValue = ''
        onClose()
      }}
      className="forge-glass-modal m-auto w-[min(94vw,510px)] rounded-2xl p-0 text-zinc-100 backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
            {copy.eyebrow}
          </span>
          <button
            type="button"
            onClick={handleDismissWithCooldown}
            aria-label="Close upgrade modal"
            className="forge-tactile-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-300 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <h2 id={headingId} className="mt-3 font-serif text-xl font-bold leading-snug tracking-tight text-white">
          {copy.headline}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">{copy.description}</p>

        {/* Transparent Month-to-Month Pricing Summary */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} strokeWidth={1.75} className="shrink-0 text-emerald-300" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-200">
                Month-to-Month · Zero Lock-In
              </div>
              <div className="text-[11px] text-zinc-300">
                Cancel anytime in 1 click inside Account Settings ($0 fees)
              </div>
            </div>
          </div>
          <div className="text-right tabular-nums">
            <div className="font-mono text-base font-extrabold text-white">
              {targetSpec.foundingPriceFormatted}
              <span className="text-[11px] font-normal text-zinc-300">/mo</span>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <ul className="mt-4 space-y-2 rounded-xl border border-white/10 bg-[#181B22]/90 p-3.5 text-xs leading-relaxed text-zinc-200">
          {copy.highlights.map(item => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2 size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-emerald-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {!isCompanion && (
          <div className="mt-4 rounded-xl border border-white/10 bg-[#11151E] p-3 text-[11.5px] leading-relaxed text-zinc-300">
            <p className="mb-2">
              <strong className="text-white">Auto-Renewal Summary:</strong> Billed today at{' '}
              <strong className="text-amber-200">{targetSpec.foundingPriceFormatted}/month</strong> (no free trial) and renews automatically each month until cancelled in{' '}
              <em>Account Settings &gt; Billing</em> or via{' '}
              <a href="mailto:scott@forge-athletic.app" className="text-amber-300 underline">
                scott@forge-athletic.app
              </a>
              . Includes 3-business-day cancellation right (M.G.L. c. 93, &sect;&sect; 80&ndash;82).
            </p>
            <label htmlFor={consentCheckboxId} className="flex cursor-pointer items-start gap-2 text-zinc-200">
              <input
                id={consentCheckboxId}
                type="checkbox"
                checked={autoRenewalAccepted}
                onChange={e => {
                  setAutoRenewalAccepted(e.target.checked)
                  if (e.target.checked) setError(null)
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-400"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="text-amber-300 underline">
                  Terms of Service
                </Link>{' '}
                &amp;{' '}
                <Link href="/privacy" className="text-amber-300 underline">
                  Privacy Policy
                </Link>{' '}
                and authorize recurring monthly charges ({targetSpec.foundingPriceFormatted}/month) until I cancel.
              </span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2">
          {isCompanion ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-center text-xs text-amber-100">
              Memberships and upgrades are managed on the Forge Athletic website at{' '}
              <strong>forge-athletic.app</strong>.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleActivateTier}
              disabled={loading}
              className="forge-tactile-press inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] sm:text-sm"
            >
              <Lock size={14} strokeWidth={1.75} />{' '}
              {loading ? 'Redirecting to Secure Checkout...' : copy.ctaLabel}{' '}
              <ArrowRight size={15} strokeWidth={1.75} />
            </button>
          )}
          {error && <p className="text-center text-xs text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleDismissWithCooldown}
            className="forge-tactile-press min-h-[44px] w-full rounded-xl py-2 text-xs font-medium text-zinc-400 transition-colors duration-150 hover:bg-white/[0.04] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            Not right now (hide this suggestion for 7 days)
          </button>
        </div>
      </div>
    </dialog>
  )
}
