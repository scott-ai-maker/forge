'use client'

import React from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import {
  clearUpgradeCooldowns,
  FORGE_TIER_ENTITLEMENTS,
  ForgeTierId,
  resetFormLabCreditsForQa,
  useTierAccess,
} from '@/lib/tierEntitlements'

export interface TierPreviewSwitcherProps {
  compact?: boolean
}

const TIER_ORDER: ForgeTierId[] = ['core_lab', 'plus', 'coach_support']

export default function TierPreviewSwitcher({ compact = false }: TierPreviewSwitcherProps) {
  const { tierId, entitlements, remainingFormLabCredits, setTier } = useTierAccess()

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
          <SlidersHorizontal size={13} className="text-amber-300" />
          <span>Tier Preview</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {TIER_ORDER.map(id => {
            const spec = FORGE_TIER_ENTITLEMENTS[id]
            const active = tierId === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTier(id)}
                aria-pressed={active}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  active
                    ? 'bg-amber-400 text-slate-950'
                    : 'border border-white/10 bg-slate-950/60 text-slate-300 hover:bg-white/10'
                }`}
              >
                {spec.name} ({spec.foundingPriceFormatted})
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-amber-400/30 bg-[#0B111C] p-4 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
            Membership Tier QA Preview Switcher
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Instantly test entitlements, Form Lab credits, and upgrade triggers across all 3 tiers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetFormLabCreditsForQa()
              clearUpgradeCooldowns()
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10"
          >
            <RotateCcw size={12} /> Reset Credits &amp; Cooldowns
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TIER_ORDER.map(id => {
          const spec = FORGE_TIER_ENTITLEMENTS[id]
          const active = tierId === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTier(id)}
              aria-pressed={active}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                active
                  ? 'border-amber-400 bg-amber-400/15 text-white'
                  : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider">{spec.name}</span>
                <span className="font-mono text-xs font-bold text-amber-300">
                  {spec.foundingPriceFormatted}/mo
                </span>
              </div>
              <span className="mt-1 text-[11px] text-slate-400">{spec.formLabCreditLabel}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/10 pt-2.5 text-[11px] text-slate-300">
        <span>
          Active: <strong className="text-white">{entitlements.name}</strong>
        </span>
        <span>·</span>
        <span>
          Form Lab Credits Remaining: <strong className="text-emerald-300">{remainingFormLabCredits}</strong> /{' '}
          {entitlements.monthlyFormLabCredits}
        </span>
        <span>·</span>
        <span>
          Workstations:{' '}
          <strong className="text-white">
            {entitlements.maxWorkstationProfiles === null ? 'Unlimited' : entitlements.maxWorkstationProfiles}
          </strong>
        </span>
        <span>·</span>
        <span>
          Dual-Screen Readiness:{' '}
          <strong className="text-white">{entitlements.dualScreenReadiness ? 'Included' : 'Single Screen'}</strong>
        </span>
      </div>
    </section>
  )
}

