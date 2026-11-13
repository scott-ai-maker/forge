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
      className="m-auto w-[min(94vw,500px)] rounded-2xl border border-amber-400/40 bg-[#090D14] p-0 text-slate-100 shadow-2xl"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-amber-300">
            {copy.eyebrow}
          </span>
          <button
            type="button"
            onClick={handleDismissWithCooldown}
            aria-label="Close upgrade modal"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10"
          >
            <X size={15} />
          </button>
        </div>

        <h2 id={headingId} className="mt-3 font-serif text-xl font-bold leading-snug text-white">
          {copy.headline}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">{copy.description}</p>

        {/* Prominent Founding Member Lifetime Rate Lock Guarantee Badge */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="shrink-0 text-emerald-300" />
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                Founding Member Lifetime Rate Lock
              </div>
              <div className="text-[11px] text-slate-300">
                Locked for life — never increases after November 20 launch
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400 line-through">
              {targetSpec.postLaunchPriceFormatted}/mo
            </div>
            <div className="font-mono text-base font-extrabold text-white">
              {targetSpec.foundingPriceFormatted}
              <span className="text-[11px] font-normal text-slate-300">/mo</span>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <ul className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs text-slate-200">
          {copy.highlights.map(item => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-amber-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleActivateTier}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-amber-300 sm:text-sm"
          >
            <Lock size={14} /> {copy.ctaLabel} <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={handleDismissWithCooldown}
            className="w-full rounded-lg py-2 text-xs font-medium text-slate-400 transition hover:text-slate-200"
          >
            Not right now (hide this suggestion for 7 days)
          </button>
        </div>
      </div>
    </dialog>
  )
}

