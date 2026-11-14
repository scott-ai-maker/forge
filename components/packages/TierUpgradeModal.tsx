'use client'

import React, { useEffect, useId, useRef } from 'react'
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, X } from 'lucide-react'
import {
  dismissUpgradeTrigger,
  FORGE_TIER_ENTITLEMENTS,
  ForgeTierId,
  getUpgradeTriggerCopy,
  setStoredTierId,
  UpgradeTriggerId,
} from '@/lib/tierEntitlements'
import { playForgeTactileTone } from '@/lib/sfx-audio'

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
  onUpgraded,
}: TierUpgradeModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && triggerContext && !dialog.open) {
      dialog.showModal()
    } else if ((!open || !triggerContext) && dialog.open) {
      dialog.close()
    }
  }, [open, triggerContext])

  if (!triggerContext) return null

  const copy = getUpgradeTriggerCopy(triggerContext, currentTier)
  const targetSpec = FORGE_TIER_ENTITLEMENTS[copy.recommendedTier]

  const handleDismissWithCooldown = () => {
    dismissUpgradeTrigger(triggerContext)
    onClose()
  }

  const handleActivateTier = () => {
    playForgeTactileTone('success')
    setStoredTierId(copy.recommendedTier)
    onUpgraded?.(copy.recommendedTier)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={e => {
        if (e.target === e.currentTarget) {
          handleDismissWithCooldown()
        }
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

        {/* Prominent Founding Member Lifetime Rate Lock Guarantee Badge */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} strokeWidth={1.75} className="shrink-0 text-emerald-300" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-200">
                Founding Member Lifetime Rate Lock
              </div>
              <div className="text-[11px] text-zinc-300">
                Locked for life — never increases after November 20 launch
              </div>
            </div>
          </div>
          <div className="text-right tabular-nums">
            <div className="font-mono text-[11px] text-zinc-400 line-through">
              {targetSpec.postLaunchPriceFormatted}/mo
            </div>
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

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleActivateTier}
            className="forge-tactile-press inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] sm:text-sm"
          >
            <Lock size={14} strokeWidth={1.75} /> {copy.ctaLabel} <ArrowRight size={15} strokeWidth={1.75} />
          </button>
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
