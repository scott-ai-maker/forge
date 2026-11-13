'use client'

import React, { useState } from 'react'
import { ArrowUpRight, CheckCircle2, Lock, Video } from 'lucide-react'
import { useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'
import { playForgeTactileTone } from '@/lib/sfx-audio'

export interface FormLabRecorderProps {
  selectedLiftLabel?: string
  onSubmitted?: () => void
}

export default function FormLabRecorder({
  selectedLiftLabel = 'Primary Compound Lift',
  onSubmitted,
}: FormLabRecorderProps) {
  const { tierId, entitlements, remainingFormLabCredits, spendFormLabCredit } = useTierAccess()
  const [clipNotes, setClipNotes] = useState('')
  const [submittedConfirmation, setSubmittedConfirmation] = useState<string | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const outOfCredits = remainingFormLabCredits <= 0
  const nextTierName = tierId === 'core_lab' ? 'Plus ($49/mo)' : 'Coach Support ($199/mo)'

  const handleSubmitForCoachReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (outOfCredits) {
      setUpgradeModalOpen(true)
      return
    }
    const result = spendFormLabCredit()
    if (!result.allowed) {
      setUpgradeModalOpen(true)
      return
    }
    playForgeTactileTone('success')
    setSubmittedConfirmation(
      entitlements.priority24hSla
        ? `Priority 24h Form Lab review queued for Coach Gordon (${result.remaining} monthly credits left).`
        : `Form Lab clip queued for Coach Gordon telestrator review (${result.remaining} credits left).`
    )
    setClipNotes('')
    onSubmitted?.()
  }

  return (
    <section className="rounded-xl border border-sky-400/30 bg-[#0A111D] p-4 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/15 text-sky-300">
            <Video size={16} />
          </span>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-white">
              Coach Gordon Form Lab Review Queue
            </div>
            <div className="text-[11px] text-slate-400">{entitlements.formLabCreditLabel}</div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${
            outOfCredits
              ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
              : 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
          }`}
        >
          {remainingFormLabCredits} of {entitlements.monthlyFormLabCredits} Credits Remaining
        </span>
      </div>

      <form onSubmit={handleSubmitForCoachReview} className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          value={clipNotes}
          onChange={e => setClipNotes(e.target.value)}
          placeholder={`Optional note for Coach Gordon on ${selectedLiftLabel} (e.g., bottom hip shift)...`}
          aria-label="Form Lab coaching note"
          style={{ fontSize: 16 }}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-slate-950/90 px-3 py-2 text-white placeholder:text-slate-500"
        />

        {outOfCredits && tierId !== 'coach_support' ? (
          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-amber-300"
          >
            <Lock size={13} /> Unlock More Reviews in {nextTierName} <ArrowUpRight size={14} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={outOfCredits}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-sky-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-sky-300 disabled:opacity-50"
          >
            Submit Clip to Form Lab ({remainingFormLabCredits} Left)
          </button>
        )}
      </form>

      {submittedConfirmation ? (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-300" />
          <span>{submittedConfirmation}</span>
        </div>
      ) : null}

      <TierUpgradeModal
        open={upgradeModalOpen}
        triggerContext="form_lab_credit_depletion"
        currentTier={tierId}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </section>
  )
}

